import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app import create_app, APP_SESSION_TOKEN

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers():
    return {"X-Session-Token": APP_SESSION_TOKEN}

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_unauth_rejected(client):
    res = client.get("/api/leads")
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False

def test_get_leads_authenticated(client, auth_headers):
    res = client.get("/api/leads", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "leads" in data
    assert "pagination" in data

def test_get_stats(client, auth_headers):
    res = client.get("/api/stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "total_leads" in data
    assert "by_service" in data

def test_get_settings_secret_leak_free(client, auth_headers):
    res = client.get("/api/settings", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "settings" in data
    assert "vault" in data
    # Ensure raw secret keys are not leaked
    assert "telegram_bot_token" not in data["settings"]
    assert "exa_api_key" not in data["settings"]
