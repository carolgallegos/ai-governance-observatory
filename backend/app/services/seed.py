import json
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import AgriScore, Country, PolicyFramework, PolicyProfile, PolicyTimelineEvent
from app.services.scoring import compute_agri_total


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value[:10])


def load_seed(db: Session, seed_path: Path | None = None) -> int:
    if seed_path is None:
        seed_path = Path(__file__).resolve().parents[3] / "data" / "seed" / "countries.json"
    if not seed_path.exists():
        seed_path = Path("/app/data/seed/countries.json")

    existing = db.scalar(select(Country).limit(1))
    if existing:
        return 0

    with open(seed_path, encoding="utf-8") as f:
        rows = json.load(f)

    count = 0
    for row in rows:
        country = Country(
            iso_code=row["iso_code"],
            name=row["name"],
            region=row["region"],
            latitude=row["latitude"],
            longitude=row["longitude"],
        )
        db.add(country)
        db.flush()

        p = row["profile"]
        profile = PolicyProfile(
            country_id=country.id,
            strategy_title=p["strategy_title"],
            strategy_date=_parse_date(p.get("strategy_date")),
            regulation_summary=p["regulation_summary"],
            responsible_bodies=p["responsible_bodies"],
            priorities=json.dumps(p["priorities"]),
            regulatory_approach=p["regulatory_approach"],
            privacy=p["privacy"],
            generative_ai=p["generative_ai"],
            education=p["education"],
            risks=p["risks"],
        )
        db.add(profile)

        for fw in row.get("frameworks", []):
            db.add(
                PolicyFramework(
                    country_id=country.id,
                    framework_type=fw["framework_type"],
                    title=fw["title"],
                    effective_date=_parse_date(fw.get("effective_date")),
                    source_url=fw.get("source_url", ""),
                )
            )

        agri = row["agri"]
        total = compute_agri_total(
            {
                "regulation": agri["regulation"],
                "investment": agri["investment"],
                "education": agri["education"],
                "open_data": agri["open_data"],
                "research": agri["research"],
            }
        )
        db.add(
            AgriScore(
                country_id=country.id,
                year=2025,
                total_score=total,
                regulation=agri["regulation"],
                investment=agri["investment"],
                education=agri["education"],
                open_data=agri["open_data"],
                research=agri["research"],
                methodology_note=agri.get("methodology_note", ""),
            )
        )
        count += 1

    db.commit()
    return count


def load_timelines(db: Session, timelines_path: Path | None = None) -> int:
    if timelines_path is None:
        timelines_path = Path(__file__).resolve().parents[3] / "data" / "seed" / "timelines.json"
    if not timelines_path.exists():
        timelines_path = Path("/app/data/seed/timelines.json")

    if db.scalar(select(PolicyTimelineEvent).limit(1)):
        return 0

    with open(timelines_path, encoding="utf-8") as f:
        data = json.load(f)

    added = 0
    for iso, events in data.items():
        country = db.scalar(select(Country).where(Country.iso_code == iso.upper()))
        if not country:
            continue
        for ev in events:
            db.add(
                PolicyTimelineEvent(
                    country_id=country.id,
                    year=ev["year"],
                    title=ev["title"],
                    description=ev.get("description", ""),
                    event_type=ev.get("event_type", "strategy"),
                )
            )
            added += 1
    db.commit()
    return added
