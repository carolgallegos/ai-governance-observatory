"""AGRI — AI Governance Readiness Index (0-100)."""

WEIGHTS = {
    "regulation": 0.25,
    "investment": 0.15,
    "education": 0.20,
    "open_data": 0.15,
    "research": 0.25,
}


def dimension_to_percent(score_0_5: float) -> float:
    return min(100.0, max(0.0, (score_0_5 / 5.0) * 100.0))


def compute_agri_total(dimensions: dict[str, float]) -> float:
    total = 0.0
    for key, weight in WEIGHTS.items():
        total += dimension_to_percent(dimensions[key]) * weight
    return round(total, 1)
