from app.api.routes import health


def test_health_route():
    assert health()["status"] == "ok"
    assert health()["service"] == "ai-governance-observatory-api"
