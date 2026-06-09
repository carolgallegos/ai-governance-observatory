import json
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.entities import AgriScore, Country, Document, PolicyFramework, PolicyProfile, PolicyTimelineEvent
from app.schemas.api import (
    ChatRequest,
    ChatResponse,
    CompareDimension,
    CompareResponse,
    CountryDetail,
    CountryListItem,
    DocumentOut,
    PolicyProfileOut,
    RadarPoint,
    RankingItem,
    RecommendResponse,
    SimilarityOut,
    SimilarityResponse,
    SummaryOut,
    ScenarioOut,
    ScenarioRequest,
    GovernanceTrendsOut,
    ObservatoryMetaOut,
    TimelineEventOut,
)
from app.services.analytics import compute_governance_trends, simulate_agri_scenario
from app.services.maturity import maturity_from_score
from app.services.rag import chat_with_rag, ingest_document, summarize_document
from app.services.scoring import dimension_to_percent
from app.services.similarity import compute_similarity, recommend_similar_countries

router = APIRouter(prefix="/api/v1")


def _profile_out(profile: PolicyProfile | None) -> PolicyProfileOut | None:
    if not profile:
        return None
    priorities = profile.priorities
    try:
        pri_list = json.loads(priorities) if priorities.startswith("[") else [priorities]
    except json.JSONDecodeError:
        pri_list = [priorities]
    return PolicyProfileOut(
        strategy_title=profile.strategy_title,
        strategy_date=profile.strategy_date,
        regulation_summary=profile.regulation_summary,
        responsible_bodies=profile.responsible_bodies,
        priorities=pri_list,
        regulatory_approach=profile.regulatory_approach,
        privacy=profile.privacy,
        generative_ai=profile.generative_ai,
        education=profile.education,
        risks=profile.risks,
    )


def _country_detail(country: Country) -> CountryDetail:
    agri = country.agri_scores[0] if country.agri_scores else None
    timeline = getattr(country, "timeline_events", None) or []
    return CountryDetail(
        iso_code=country.iso_code,
        name=country.name,
        region=country.region,
        latitude=country.latitude,
        longitude=country.longitude,
        profile=_profile_out(country.policy_profile),
        frameworks=country.policies,
        agri=agri,
        timeline=[TimelineEventOut.model_validate(e) for e in timeline],
    )


def _agri_radar(agri_a: AgriScore | None, agri_b: AgriScore | None) -> list[RadarPoint]:
    labels = [
        ("regulation", "Regulation"),
        ("investment", "Investment"),
        ("education", "Education"),
        ("open_data", "Open Data"),
        ("research", "Research"),
    ]
    points: list[RadarPoint] = []
    for key, label in labels:
        va = dimension_to_percent(getattr(agri_a, key, 0)) if agri_a else 0
        vb = dimension_to_percent(getattr(agri_b, key, 0)) if agri_b else 0
        points.append(RadarPoint(dimension=label, country_a=round(va, 1), country_b=round(vb, 1)))
    return points


OBSERVATORY_LAST_UPDATED = "2025-06-01"
REFERENCE_POLICY_SOURCES = 10  # curated rows in data/sources.md


@router.get("/health")
def health():
    return {"status": "ok", "service": "ai-governance-observatory-api"}


@router.get("/observatory/meta", response_model=ObservatoryMetaOut)
def observatory_meta(db: Session = Depends(get_db)):
    jurisdictions = db.scalar(select(func.count(Country.id))) or 0
    frameworks = db.scalar(select(func.count(PolicyFramework.id))) or 0
    uploaded = db.scalar(select(func.count(Document.id))) or 0
    return ObservatoryMetaOut(
        last_updated=OBSERVATORY_LAST_UPDATED,
        jurisdictions=jurisdictions,
        governance_frameworks=frameworks,
        policy_sources=REFERENCE_POLICY_SOURCES + frameworks + uploaded,
    )


@router.get("/countries", response_model=list[CountryListItem])
def list_countries(db: Session = Depends(get_db)):
    stmt = (
        select(Country)
        .options(joinedload(Country.agri_scores))
        .order_by(Country.name)
    )
    countries = db.scalars(stmt).unique().all()
    result = []
    for c in countries:
        score = c.agri_scores[0].total_score if c.agri_scores else None
        tier_id, tier_label = maturity_from_score(score)
        result.append(
            CountryListItem(
                iso_code=c.iso_code,
                name=c.name,
                region=c.region,
                latitude=c.latitude,
                longitude=c.longitude,
                agri_score=score,
                maturity_tier=tier_id,
                maturity_label=tier_label,
            )
        )
    return result


@router.get("/countries/{iso_code}", response_model=CountryDetail)
def get_country(iso_code: str, db: Session = Depends(get_db)):
    country = db.scalar(
        select(Country)
        .where(Country.iso_code == iso_code.upper())
        .options(
            joinedload(Country.policy_profile),
            joinedload(Country.policies),
            joinedload(Country.agri_scores),
            joinedload(Country.timeline_events),
        )
    )
    if not country:
        raise HTTPException(404, "Country not found")
    return _country_detail(country)


@router.get("/countries/{iso_code}/timeline", response_model=list[TimelineEventOut])
def country_timeline(iso_code: str, db: Session = Depends(get_db)):
    country = db.scalar(select(Country).where(Country.iso_code == iso_code.upper()))
    if not country:
        raise HTTPException(404, "Country not found")
    events = db.scalars(
        select(PolicyTimelineEvent)
        .where(PolicyTimelineEvent.country_id == country.id)
        .order_by(PolicyTimelineEvent.year)
    ).all()
    return events


@router.get("/compare", response_model=CompareResponse)
def compare_countries(
    a: str = Query(..., description="ISO code country A"),
    b: str = Query(..., description="ISO code country B"),
    db: Session = Depends(get_db),
):
    def load(iso: str) -> Country:
        c = db.scalar(
            select(Country)
            .where(Country.iso_code == iso.upper())
            .options(
                joinedload(Country.policy_profile),
                joinedload(Country.policies),
                joinedload(Country.agri_scores),
                joinedload(Country.timeline_events),
            )
        )
        if not c:
            raise HTTPException(404, f"Country {iso} not found")
        return c

    ca, cb = load(a), load(b)
    da, db_ = _country_detail(ca), _country_detail(cb)
    pa, pb = da.profile, db_.profile
    agri_a = ca.agri_scores[0] if ca.agri_scores else None
    agri_b = cb.agri_scores[0] if cb.agri_scores else None

    dims: list[CompareDimension] = []
    if pa and pb:
        for key, label, attr in [
            ("regulatory_approach", "Regulatory approach", "regulatory_approach"),
            ("privacy", "Privacy", "privacy"),
            ("generative_ai", "Generative AI", "generative_ai"),
            ("education", "Education", "education"),
            ("risks", "Risks", "risks"),
        ]:
            dims.append(
                CompareDimension(
                    key=key,
                    label=label,
                    country_a=getattr(pa, attr),
                    country_b=getattr(pb, attr),
                )
            )

    sim = compute_similarity(ca.policy_profile, cb.policy_profile, agri_a, agri_b)
    return CompareResponse(
        country_a=da,
        country_b=db_,
        dimensions=dims,
        radar=_agri_radar(agri_a, agri_b),
        policy_similarity=SimilarityOut(**sim),
    )


@router.get("/similarity", response_model=SimilarityResponse)
def policy_similarity(
    a: str = Query(...),
    b: str = Query(...),
    db: Session = Depends(get_db),
):
    def load(iso: str) -> Country:
        c = db.scalar(
            select(Country)
            .where(Country.iso_code == iso.upper())
            .options(joinedload(Country.policy_profile), joinedload(Country.agri_scores))
        )
        if not c:
            raise HTTPException(404, f"Country {iso} not found")
        return c

    ca, cb = load(a), load(b)
    agri_a = ca.agri_scores[0] if ca.agri_scores else None
    agri_b = cb.agri_scores[0] if cb.agri_scores else None
    sim = compute_similarity(ca.policy_profile, cb.policy_profile, agri_a, agri_b)
    return SimilarityResponse(
        country_a=ca.iso_code,
        country_b=cb.iso_code,
        policy_similarity=SimilarityOut(**sim),
    )


@router.get("/countries/{iso_code}/similar", response_model=RecommendResponse)
def similar_countries(iso_code: str, db: Session = Depends(get_db)):
    target = db.scalar(
        select(Country)
        .where(Country.iso_code == iso_code.upper())
        .options(joinedload(Country.policy_profile), joinedload(Country.agri_scores))
    )
    if not target:
        raise HTTPException(404, "Country not found")
    target_agri = target.agri_scores[0] if target.agri_scores else None
    if not target_agri:
        raise HTTPException(400, "No AGRI data for country")

    others_raw = db.scalars(
        select(Country)
        .where(Country.iso_code != iso_code.upper())
        .options(joinedload(Country.policy_profile), joinedload(Country.agri_scores))
    ).all()
    others = []
    for c in others_raw:
        if c.agri_scores:
            others.append((c.iso_code, c.name, c.agri_scores[0], c.policy_profile))

    recs = recommend_similar_countries(target_agri, target.policy_profile, others)
    return RecommendResponse(source_country=target.iso_code, recommendations=recs)


@router.get("/analytics/trends", response_model=GovernanceTrendsOut)
def governance_trends(db: Session = Depends(get_db)):
    data = compute_governance_trends(db)
    return GovernanceTrendsOut(**data)


@router.post("/analytics/scenario", response_model=ScenarioOut)
def agri_scenario(body: ScenarioRequest, db: Session = Depends(get_db)):
    country = db.scalar(
        select(Country)
        .where(Country.iso_code == body.country_iso.upper())
        .options(joinedload(Country.agri_scores))
    )
    if not country or not country.agri_scores:
        raise HTTPException(404, "Country or AGRI data not found")
    result = simulate_agri_scenario(country.agri_scores[0], body.dimension, body.increase_points)
    return ScenarioOut(country_iso=country.iso_code, **result)


@router.get("/scores/ranking", response_model=list[RankingItem])
def ranking(db: Session = Depends(get_db)):
    stmt = (
        select(Country, AgriScore)
        .join(AgriScore)
        .where(AgriScore.year == 2025)
        .order_by(AgriScore.total_score.desc())
    )
    rows = db.execute(stmt).all()
    return [
        RankingItem(iso_code=c.iso_code, name=c.name, total_score=s.total_score, region=c.region)
        for c, s in rows
    ]


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, db: Session = Depends(get_db)):
    result = await chat_with_rag(db, body.message, body.countries)
    return ChatResponse(**result)


@router.post("/documents/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    country_iso: str | None = Query(None),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid4().hex}_{file.filename}"
    dest = upload_dir / safe_name

    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    country_id = None
    if country_iso:
        country = db.scalar(select(Country).where(Country.iso_code == country_iso.upper()))
        if country:
            country_id = country.id

    doc = Document(filename=file.filename, file_path=str(dest), country_id=country_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    await ingest_document(db, doc, dest)
    return doc


@router.post("/documents/{document_id}/summarize", response_model=SummaryOut)
async def summarize(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    summary = await summarize_document(db, doc)
    return SummaryOut(document_id=doc.id, summary=summary)


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return list(db.scalars(select(Document).order_by(Document.uploaded_at.desc())).all())
