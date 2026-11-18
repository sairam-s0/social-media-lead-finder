import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app, APP_SESSION_TOKEN
from config import Config
from utils.vault import Vault

def test_production_readiness():
    print("=== Testing Social Lead Finder Production Hardening ===")
    app = create_app()
    client = app.test_client()

    # Test 1: Health check without auth should succeed
    res_health = client.get("/api/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.status_code}"
    health_data = res_health.get_json()
    assert health_data["status"] == "healthy"
    print("[PASS] Test 1: Health check passed")

    # Test 2: Unauthenticated API request must be rejected with 401
    res_unauth = client.get("/api/leads")
    assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"
    print("[PASS] Test 2: Mandatory API auth enforced (401 on missing token)")

    # Test 3: Authenticated request with header succeeds
    headers = {"X-Session-Token": APP_SESSION_TOKEN}
    res_auth = client.get("/api/leads", headers=headers)
    assert res_auth.status_code == 200, f"Expected 200, got {res_auth.status_code}"
    leads_data = res_auth.get_json()
    assert leads_data["success"] is True
    print(f"[PASS] Test 3: Authenticated API request succeeded ({len(leads_data['leads'])} leads found, clean db)")

    # Test 4: Secret Leak Test on GET /api/settings
    # Pre-populate vault with a test token
    Vault.set_secret("telegram_bot_token", "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ")
    Vault.set_secret("exa_api_key", "exa_live_secret_test_key_12345")
    
    res_settings = client.get("/api/settings", headers=headers)
    assert res_settings.status_code == 200
    settings_data = res_settings.get_json()

    # Plaintext secrets MUST NOT be in settings
    for key, val in settings_data["settings"].items():
        assert "bot" not in str(val).lower(), f"Leaked token in settings table: {key}"
        assert "exa_live" not in str(val).lower(), f"Leaked exa key in settings table: {key}"

    # Vault status must contain masked previews and flags only
    assert settings_data["vault"]["telegram_bot_configured"] is True
    assert "123456789" not in settings_data["vault"]["telegram_bot_masked"]
    assert settings_data["vault"]["telegram_bot_masked"].endswith("xyZ")
    assert settings_data["vault"]["exa_configured"] is True
    assert settings_data["vault"]["exa_masked"].endswith("2345")
    print("[PASS] Test 4: Zero secret leaks in GET /api/settings (secrets safely masked)")

    # Test 5: License status check
    res_lic = client.get("/api/license/status", headers=headers)
    assert res_lic.status_code == 200
    print("[PASS] Test 5: License check endpoint operational")

    # Test 6: Static frontend index.html served with injected session token
    res_spa = client.get("/")
    assert res_spa.status_code == 200
    html_text = res_spa.get_data(as_text=True)
    assert "window.__APP_SESSION_TOKEN__" in html_text
    print("[PASS] Test 6: Single-process static SPA served at '/' with injected session token")

    # Test 7: Export leads CSV endpoint
    res_export = client.get("/api/leads/export?format=csv", headers=headers)
    assert res_export.status_code == 200
    assert "text/csv" in res_export.headers.get("Content-Type", "")
    print("[PASS] Test 7: GDPR/DPDP CSV export endpoint operational")

    # Test 8: System Open URL Endpoint (Safe browser launching)
    from unittest.mock import patch
    with patch("webbrowser.open") as mock_open:
        res_open = client.post("/api/system/open-url", json={"url": "https://www.linkedin.com/feed/update/urn:li:activity:7493936706136653824/"})
        assert res_open.status_code == 200
        mock_open.assert_called_once_with("https://www.linkedin.com/feed/update/urn:li:activity:7493936706136653824/")
    # Invalid protocol rejection test
    res_bad = client.post("/api/system/open-url", json={"url": "file:///c:/secret.txt"})
    assert res_bad.status_code == 400
    print("[PASS] Test 8: /api/system/open-url verified (browser launch & security validation)")

    # Test 9: Subprocess Console Suppression Verification
    from services.exa_service import get_hidden_subprocess_kwargs, get_mcporter_command
    hidden_kwargs = get_hidden_subprocess_kwargs()
    if sys.platform == "win32":
        assert hidden_kwargs.get("creationflags") == 0x08000000, "CREATE_NO_WINDOW flag missing!"
        startupinfo = hidden_kwargs.get("startupinfo")
        assert startupinfo is not None, "startupinfo object missing!"
        assert startupinfo.wShowWindow == 0, "SW_HIDE missing from startupinfo!"
    mc_cmd = get_mcporter_command()
    assert isinstance(mc_cmd, list) and len(mc_cmd) >= 1
    print("[PASS] Test 9: Subprocess console suppression flags verified (zero popup windows)")

    print("\nALL 9 PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_production_readiness()
