"""Governance Trend Explorer, document intelligence, scenario simulation."""

from __future__ import annotations

import json
from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.entities import AgriScore, Country, PolicyProfile
from app.services.scoring import compute_agri_total, dimension_to_percent
from app.services.maturity import maturity_from_score

PRIORITY_KEYWORDS = {
    "education": ["education", "skills", "talent", "workforce", "literacy", "training"],
    "innovation": ["innovation", "research", "r&d", "startup", "smes", "industry"],
    "public_sector": ["public sector", "government", "digital government", "civic"],
    "ethics_trust": ["ethics", "trust", "trustworthy", "human-centric", "rights"],
    "security": ["security", "safety", "defence", "defense", "national security"],
    "inclusion": ["inclusion", "inclusive", "digital divide", "access"],
}

RISK_KEYWORDS = {
    "bias_discrimination": ["bias", "discrimination", "fairness"],
    "privacy": ["privacy", "surveillance", "data protection"],
    "enforcement": ["enforcement", "compliance", "capacity"],
    "labor": ["labor", "labour", "employment", "displacement", "jobs"],
    "security": ["cyber", "security", "critical infrastructure", "dual-use"],
    "concentration": ["concentration", "big tech", "monopoly"],
}

DOC_FOCUS_KEYWORDS = {
    "innovation_focus": ["innovation", "competitiveness", "investment", "growth", "startup"],
    "risk_focus": ["risk", "harm", "safety", "bias", "discrimination", "liability"],
    "governance_focus": ["governance", "oversight", "accountability", "transparency", "compliance"],
    "research_focus": ["research", "science", "university", "talent", "r&d", "frontier"],
}


def _count_keywords(text: str, keyword_map: dict[str, list[str]]) -> list[dict]:
    lower = text.lower()
    counts: list[tuple[str, int]] = []
    for label, words in keyword_map.items():
        c = sum(lower.count(w) for w in words)
        if c > 0:
            counts.append((label.replace("_", " ").title(), c))
    counts.sort(key=lambda x: x[1], reverse=True)
    return [{"label": label, "count": count} for label, count in counts[:8]]


def _governance_models(profiles: list[PolicyProfile]) -> list[dict]:
    counter: Counter[str] = Counter()
    for p in profiles:
        approach = p.regulatory_approach.lower()
        if "risk-based" in approach:
            counter["Risk-based regulation"] += 1
        elif "sectoral" in approach:
            counter["Sectoral / principles-led"] += 1
        elif "rights-based" in approach:
            counter["Rights-based"] += 1
        else:
            counter["Other / hybrid"] += 1
    return [{"label": k, "count": v} for k, v in counter.most_common()]


def compute_governance_trends(db: Session) -> dict:
    countries = db.scalars(
        select(Country).options(joinedload(Country.policy_profile), joinedload(Country.agri_scores))
    ).unique().all()

    all_priorities: list[str] = []
    all_risks_text = ""
    profiles: list[PolicyProfile] = []

    for c in countries:
        if not c.policy_profile:
            continue
        profiles.append(c.policy_profile)
        try:
            pri = json.loads(c.policy_profile.priorities)
            if isinstance(pri, list):
                all_priorities.extend(" ".join(pri).split())
        except json.JSONDecodeError:
            all_priorities.extend(c.policy_profile.priorities.split())
        all_risks_text += " " + c.policy_profile.risks

    pri_blob = " ".join(all_priorities)
    maturity_distribution = []
    for c in countries:
        score = c.agri_scores[0].total_score if c.agri_scores else None
        tier_id, tier_label = maturity_from_score(score)
        maturity_distribution.append(
            {"iso_code": c.iso_code, "name": c.name, "score": score, "tier": tier_id, "tier_label": tier_label}
        )

    return {
        "top_priorities": _count_keywords(pri_blob, PRIORITY_KEYWORDS),
        "top_risks": _count_keywords(all_risks_text, RISK_KEYWORDS),
        "governance_models": _governance_models(profiles),
        "maturity_distribution": maturity_distribution,
        "countries_analyzed": len(countries),
    }


DOC_LABELS = {
    "innovation_focus": "Innovation Focus",
    "risk_focus": "Risk Focus",
    "governance_focus": "Governance Focus",
    "research_focus": "Research Focus",
}


def compute_document_intelligence(text: str) -> dict[str, int]:
    lower = text.lower()
    scores: dict[str, int] = {}
    for key, words in DOC_FOCUS_KEYWORDS.items():
        hits = sum(lower.count(w) for w in words)
        label = DOC_LABELS[key]
        scores[label] = min(100, 42 + min(55, hits * 9))
    return scores


def simulate_agri_scenario(
    agri: AgriScore, dimension: str, increase_points: float = 0.5
) -> dict:
    dim_map = {
        "education": "education",
        "regulation": "regulation",
        "investment": "investment",
        "open_data": "open_data",
        "research": "research",
    }
    key = dim_map.get(dimension.lower().replace(" ", "_"), "education")
    current = {
        "regulation": agri.regulation,
        "investment": agri.investment,
        "education": agri.education,
        "open_data": agri.open_data,
        "research": agri.research,
    }
    before = compute_agri_total(current)
    new_val = min(5.0, current[key] + increase_points)
    current[key] = new_val
    after = compute_agri_total(current)
    _, tier_before = maturity_from_score(before)
    _, tier_after = maturity_from_score(after)
    return {
        "dimension": key,
        "increase_raw_points": increase_points,
        "agri_before": before,
        "agri_after": round(after, 1),
        "delta": round(after - before, 1),
        "maturity_before": tier_before,
        "maturity_after": tier_after,
        "narrative": (
            f"Increasing {key.replace('_', ' ')} investment by {increase_points} points on the 0–5 scale "
            f"would move AGRI from {before} to {round(after, 1)} ({tier_before} → {tier_after})."
        ),
    }
