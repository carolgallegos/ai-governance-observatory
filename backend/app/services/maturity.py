"""AGRI-based governance maturity tiers for heatmap visualization."""


def maturity_from_score(score: float | None) -> tuple[str, str]:
    if score is None:
        return "unknown", "Unknown"
    if score >= 85:
        return "leading", "Leading"
    if score >= 75:
        return "advanced", "Advanced"
    if score >= 65:
        return "developing", "Developing"
    return "emerging", "Emerging"


MATURITY_COLORS = {
    "leading": "#22c55e",
    "advanced": "#3b82f6",
    "developing": "#f59e0b",
    "emerging": "#ef4444",
    "unknown": "#334155",
}
