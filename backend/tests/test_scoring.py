from app.services.scoring import compute_agri_total, dimension_to_percent


def test_dimension_to_percent():
    assert dimension_to_percent(5.0) == 100.0
    assert dimension_to_percent(0.0) == 0.0
    assert dimension_to_percent(2.5) == 50.0


def test_agri_total_weighted():
    total = compute_agri_total(
        {
            "regulation": 5.0,
            "investment": 5.0,
            "education": 5.0,
            "open_data": 5.0,
            "research": 5.0,
        }
    )
    assert total == 100.0
