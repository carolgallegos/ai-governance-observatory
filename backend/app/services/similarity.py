"""Policy Similarity Engine — compares governance profiles and AGRI dimensions."""

from __future__ import annotations

import json
import re

from app.models.entities import AgriScore, PolicyProfile

DIM_KEYS = ("regulation", "investment", "education", "open_data", "research")


def _token_set(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    return set(words)


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def _cosine_vec(a: list[float], b: list[float]) -> float:
    import numpy as np

    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb)) + 1e-9
    return float(np.dot(va, vb) / denom)


def _regulatory_similarity(approach_a: str, approach_b: str) -> float:
    ta, tb = _token_set(approach_a), _token_set(approach_b)
    base = _jaccard(ta, tb)
    if approach_a.strip().lower() == approach_b.strip().lower():
        return 1.0
    if "risk-based" in approach_a.lower() and "risk-based" in approach_b.lower():
        return max(base, 0.85)
    if "sectoral" in approach_a.lower() and "sectoral" in approach_b.lower():
        return max(base, 0.75)
    return base


def compute_similarity(
    profile_a: PolicyProfile | None,
    profile_b: PolicyProfile | None,
    agri_a: AgriScore | None,
    agri_b: AgriScore | None,
) -> dict:
    explanations: list[str] = []

    if not profile_a or not profile_b:
        return {
            "similarity_percent": 0.0,
            "explanations": ["Insufficient profile data for one or both jurisdictions."],
            "dimension_alignment": {},
        }

    pri_a = json.loads(profile_a.priorities) if profile_a.priorities.startswith("[") else [profile_a.priorities]
    pri_b = json.loads(profile_b.priorities) if profile_b.priorities.startswith("[") else [profile_b.priorities]
    pri_text_a = " ".join(pri_a)
    pri_text_b = " ".join(pri_b)

    pri_sim = _jaccard(_token_set(pri_text_a), _token_set(pri_text_b))
    reg_sim = _regulatory_similarity(profile_a.regulatory_approach, profile_b.regulatory_approach)
    edu_sim = _jaccard(_token_set(profile_a.education), _token_set(profile_b.education))
    privacy_sim = _jaccard(_token_set(profile_a.privacy), _token_set(profile_b.privacy))

    agri_sim = 0.5
    dimension_alignment: dict[str, float] = {}
    if agri_a and agri_b:
        vec_a = [getattr(agri_a, k) for k in DIM_KEYS]
        vec_b = [getattr(agri_b, k) for k in DIM_KEYS]
        agri_sim = _cosine_vec(vec_a, vec_b)
        for k in DIM_KEYS:
            va, vb = getattr(agri_a, k), getattr(agri_b, k)
            diff = abs(va - vb)
            dimension_alignment[k] = round(max(0.0, 1.0 - diff / 5.0) * 100, 1)

    overall = 0.35 * agri_sim + 0.25 * reg_sim + 0.20 * pri_sim + 0.10 * edu_sim + 0.10 * privacy_sim
    percent = round(overall * 100, 1)

    if reg_sim >= 0.7:
        explanations.append("Similar regulatory philosophy (risk-based or principles-led alignment).")
    else:
        explanations.append("Different regulatory philosophy or enforcement model.")

    if pri_sim >= 0.35:
        explanations.append("Overlapping policy priorities (education, innovation, or public sector).")
    else:
        explanations.append("Distinct national priority mixes.")

    if agri_a and agri_b:
        if abs(agri_a.regulation - agri_b.regulation) <= 0.8:
            explanations.append("Comparable regulation maturity on the AGRI scale.")
        else:
            explanations.append("Different enforcement and rule-making capacity.")

        if abs(agri_a.education - agri_b.education) <= 0.6:
            explanations.append("Similar education and skills investment emphasis.")
        else:
            explanations.append("Different education / workforce investment emphasis.")

    return {
        "similarity_percent": percent,
        "explanations": explanations[:5],
        "dimension_alignment": dimension_alignment,
    }


def recommend_similar_countries(
    target_agri: AgriScore,
    target_profile: PolicyProfile | None,
    others: list[tuple[str, str, AgriScore, PolicyProfile | None]],
    top_n: int = 3,
) -> list[dict]:
    scored: list[tuple[float, str, str]] = []
    for iso, name, agri, profile in others:
        result = compute_similarity(target_profile, profile, target_agri, agri)
        scored.append((result["similarity_percent"], iso, name))
    scored.sort(key=lambda x: x[0], reverse=True)
    out: list[dict] = []
    for pct, iso, name in scored[:top_n]:
        profile = next((p for i, n, _, p in others if i == iso), None)
        agri = next((a for i, n, a, _ in others if i == iso), None)
        detail = compute_similarity(target_profile, profile, target_agri, agri)
        out.append(
            {
                "iso_code": iso,
                "name": name,
                "similarity_percent": pct,
                "explanations": detail["explanations"],
            }
        )
    return out
