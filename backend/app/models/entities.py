from datetime import date, datetime
from typing import Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.db.session import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    iso_code: Mapped[str] = mapped_column(String(3), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    region: Mapped[str] = mapped_column(String(80))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    policies: Mapped[list["PolicyFramework"]] = relationship(back_populates="country")
    agri_scores: Mapped[list["AgriScore"]] = relationship(back_populates="country")
    policy_profile: Mapped[Optional["PolicyProfile"]] = relationship(back_populates="country", uselist=False)
    timeline_events: Mapped[list["PolicyTimelineEvent"]] = relationship(
        back_populates="country", order_by="PolicyTimelineEvent.year"
    )


class PolicyProfile(Base):
    """Structured country profile for dashboard & compare."""
    __tablename__ = "policy_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), unique=True)
    strategy_title: Mapped[str] = mapped_column(String(300))
    strategy_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    regulation_summary: Mapped[str] = mapped_column(Text)
    responsible_bodies: Mapped[str] = mapped_column(Text)  # JSON string or comma-separated
    priorities: Mapped[str] = mapped_column(Text)  # JSON array as text
    regulatory_approach: Mapped[str] = mapped_column(String(80))
    privacy: Mapped[str] = mapped_column(Text)
    generative_ai: Mapped[str] = mapped_column(Text)
    education: Mapped[str] = mapped_column(Text)
    risks: Mapped[str] = mapped_column(Text)

    country: Mapped["Country"] = relationship(back_populates="policy_profile")


class PolicyTimelineEvent(Base):
    __tablename__ = "policy_timeline_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"))
    year: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(50), default="strategy")

    country: Mapped["Country"] = relationship(back_populates="timeline_events")


class PolicyFramework(Base):
    __tablename__ = "policy_frameworks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"))
    framework_type: Mapped[str] = mapped_column(String(50))  # strategy, law, guideline
    title: Mapped[str] = mapped_column(String(300))
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    source_url: Mapped[str] = mapped_column(String(500), default="")

    country: Mapped["Country"] = relationship(back_populates="policies")


class AgriScore(Base):
    __tablename__ = "agri_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"))
    year: Mapped[int] = mapped_column(Integer, default=2025)
    total_score: Mapped[float] = mapped_column(Float)
    regulation: Mapped[float] = mapped_column(Float)
    investment: Mapped[float] = mapped_column(Float)
    education: Mapped[float] = mapped_column(Float)
    open_data: Mapped[float] = mapped_column(Float)
    research: Mapped[float] = mapped_column(Float)
    methodology_note: Mapped[str] = mapped_column(Text, default="")

    country: Mapped["Country"] = relationship(back_populates="agri_scores")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    country_id: Mapped[Optional[int]] = mapped_column(ForeignKey("countries.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    language: Mapped[str] = mapped_column(String(10), default="en")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    summary_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    embedding = mapped_column(Vector(settings.embedding_dimensions), nullable=True)

    document: Mapped["Document"] = relationship(back_populates="chunks")
