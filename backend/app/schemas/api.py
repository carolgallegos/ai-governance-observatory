from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class CountryListItem(BaseModel):
    iso_code: str
    name: str
    region: str
    latitude: float
    longitude: float
    agri_score: Optional[float] = None
    maturity_tier: Optional[str] = None
    maturity_label: Optional[str] = None

    model_config = {"from_attributes": True}


class PolicyFrameworkOut(BaseModel):
    framework_type: str
    title: str
    effective_date: Optional[date]
    source_url: str

    model_config = {"from_attributes": True}


class AgriScoreOut(BaseModel):
    year: int
    total_score: float
    regulation: float
    investment: float
    education: float
    open_data: float
    research: float
    methodology_note: str

    model_config = {"from_attributes": True}


class PolicyProfileOut(BaseModel):
    strategy_title: str
    strategy_date: Optional[date]
    regulation_summary: str
    responsible_bodies: str
    priorities: list[str]
    regulatory_approach: str
    privacy: str
    generative_ai: str
    education: str
    risks: str

    model_config = {"from_attributes": True}


class TimelineEventOut(BaseModel):
    year: int
    title: str
    description: str
    event_type: str

    model_config = {"from_attributes": True}


class CountryDetail(BaseModel):
    iso_code: str
    name: str
    region: str
    latitude: float
    longitude: float
    profile: Optional[PolicyProfileOut]
    frameworks: list[PolicyFrameworkOut]
    agri: Optional[AgriScoreOut]
    timeline: list[TimelineEventOut] = []


class CompareDimension(BaseModel):
    key: str
    label: str
    country_a: str
    country_b: str


class RadarPoint(BaseModel):
    dimension: str
    country_a: float
    country_b: float


class SimilarityOut(BaseModel):
    similarity_percent: float
    explanations: list[str]
    dimension_alignment: dict[str, float]


class CompareResponse(BaseModel):
    country_a: CountryDetail
    country_b: CountryDetail
    dimensions: list[CompareDimension]
    radar: list[RadarPoint]
    policy_similarity: SimilarityOut


class RankingItem(BaseModel):
    iso_code: str
    name: str
    total_score: float
    region: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    countries: Optional[list[str]] = None


class CitationOut(BaseModel):
    document: str
    page: Optional[int] = None
    section: str
    confidence: Optional[float] = None
    excerpt: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    sources: list[dict[str, Any]]
    mode: str


class SimilarityResponse(BaseModel):
    country_a: str
    country_b: str
    policy_similarity: SimilarityOut


class CountryRecommendation(BaseModel):
    iso_code: str
    name: str
    similarity_percent: float
    explanations: list[str] = Field(default_factory=list)


class RecommendResponse(BaseModel):
    source_country: str
    recommendations: list[CountryRecommendation]


class ObservatoryMetaOut(BaseModel):
    last_updated: str
    jurisdictions: int
    governance_frameworks: int
    policy_sources: int
    agri_version: str = "2025.1"


class DocumentOut(BaseModel):
    id: int
    filename: str
    country_id: Optional[int]
    uploaded_at: datetime
    summary_json: Optional[dict[str, Any]]

    model_config = {"from_attributes": True}


class SummaryOut(BaseModel):
    document_id: int
    summary: dict[str, Any]


class TrendCount(BaseModel):
    label: str
    count: int


class GovernanceTrendsOut(BaseModel):
    top_priorities: list[TrendCount]
    top_risks: list[TrendCount]
    governance_models: list[TrendCount]
    maturity_distribution: list[dict[str, Any]]
    countries_analyzed: int


class ScenarioRequest(BaseModel):
    country_iso: str = Field(..., min_length=2, max_length=3)
    dimension: str = Field(default="education", description="regulation|investment|education|open_data|research")
    increase_points: float = Field(default=0.5, ge=0.1, le=2.0)


class ScenarioOut(BaseModel):
    country_iso: str
    dimension: str
    increase_raw_points: float
    agri_before: float
    agri_after: float
    delta: float
    maturity_before: str
    maturity_after: str
    narrative: str
