"""Outbreak engine — recomputes regional risk when scans are reviewed."""

from app.database_stub import scans_db, outbreaks_db


def recompute_outbreak(region: str, disease: str) -> dict:
    """Recompute outbreak stats for a region+ disease combination."""
    relevant = [
        s for s in scans_db.values()
        if s["region"] == region and s.get("disease") == disease
    ]

    case_count = len(relevant)
    confirmed = [s for s in relevant if s.get("review_status") == "confirmed"]

    if case_count >= 10:
        risk_level = "critical"
    elif case_count >= 5:
        risk_level = "high"
    elif case_count >= 2:
        risk_level = "moderate"
    else:
        risk_level = "low"

    outbreak = {
        "disease": disease,
        "case_count": case_count,
        "risk_level": risk_level,
        "trend": "up" if case_count > 5 else "flat",
        "trend_pct": min(100, case_count * 10),
        "cases_by_week": {},
        "week_of": "",
        "generated_at": "",
    }

    outbreaks_db[region] = outbreak
    return outbreak
