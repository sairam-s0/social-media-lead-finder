import sys
import io
import socket
import ssl
from pathlib import Path
import openpyxl

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app, APP_SESSION_TOKEN
from services.excel_exporter import generate_leads_excel_workbook
from services.email_service import test_email_connection as run_test_email_connection, get_email_settings
from utils.network_helper import is_internet_connected, diagnose_network_error
from utils.vault import Vault
from database.models import Lead

def test_excel_generation():
    """Verify in-memory Excel workbook creation with styles and summary sheet."""
    mock_leads = [
        {
            "id": 1,
            "company_name": "Acme Digital Agency",
            "author_name": "Jane Doe",
            "author_role": "Head of Growth",
            "service": "SEO & Content Marketing",
            "location": "New York, USA",
            "status": "new",
            "source": "LinkedIn",
            "matched_keywords": "looking for SEO agency",
            "url": "https://www.linkedin.com/posts/example-1",
            "content": "We need an experienced agency to revamp our organic rankings.",
            "discovered_at": "2026-10-10T10:00:00"
        },
        {
            "id": 2,
            "company_name": "Apex Innovations",
            "author_name": "John Smith",
            "author_role": "Founder & CEO",
            "service": "Web Development",
            "location": "London, UK",
            "status": "contacted",
            "source": "Public Web",
            "matched_keywords": "hiring web developers",
            "url": "https://www.linkedin.com/posts/example-2",
            "content": "Looking for a specialized agency to build our SaaS web application.",
            "discovered_at": "2026-10-10T10:30:00"
        }
    ]

    buffer = generate_leads_excel_workbook(mock_leads, title="Test Report")
    assert buffer is not None
    assert buffer.getbuffer().nbytes > 1000

    # Load with openpyxl to verify valid Excel file structure
    wb = openpyxl.load_workbook(buffer)
    sheet_names = wb.sheetnames
    assert "Discovered Leads" in sheet_names
    assert "Overview & Stats" in sheet_names

    ws_leads = wb["Discovered Leads"]
    assert ws_leads.cell(row=5, column=2).value == "Acme Digital Agency"
    assert ws_leads.cell(row=6, column=2).value == "Apex Innovations"

    ws_summary = wb["Overview & Stats"]
    assert ws_summary.cell(row=5, column=2).value == 2  # Total leads metric
    print("[PASS] Excel workbook generation & styling verified.")

def test_api_excel_export_endpoint():
    """Verify /api/leads/export?format=xlsx endpoint returns correct headers and content."""
    app = create_app()
    client = app.test_client()
    headers = {"X-Session-Token": APP_SESSION_TOKEN}

    res = client.get("/api/leads/export?format=xlsx", headers=headers)
    assert res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res.headers.get("Content-Type", "")
    assert "attachment; filename=social_leads_" in res.headers.get("Content-Disposition", "")
    assert len(res.data) > 0
    print("[PASS] API Excel export (.xlsx) endpoint verified.")

def test_email_validation_and_diagnostics():
    """Verify test_email_connection validates inputs and returns structured diagnostics."""
    # Test missing credentials validation
    ok, msg, diag = run_test_email_connection(from_email="", to_email="client@test.com", password="pwd")
    assert not ok
    assert "From Email" in msg
    assert diag.get("error_type") == "VALIDATION_ERROR"

    ok, msg, diag = run_test_email_connection(from_email="user@test.com", to_email="", password="pwd")
    assert not ok
    assert "To Email" in msg
    assert diag.get("error_type") == "VALIDATION_ERROR"

    ok, msg, diag = run_test_email_connection(from_email="user@test.com", to_email="client@test.com", password="")
    assert not ok
    assert "Password" in msg
    assert diag.get("error_type") == "VALIDATION_ERROR"
    print("[PASS] Email input validation and diagnostics verified.")

def test_network_helper_error_translations():
    """Verify diagnose_network_error handles various network failure exceptions."""
    # Timeout
    t_err = socket.timeout("timed out")
    d1 = diagnose_network_error(t_err, context="Mail Server")
    assert "time" in d1["message"].lower() or d1["error_type"] in ["CONNECTION_TIMEOUT", "NO_INTERNET"]

    # DNS failure
    dns_err = socket.gaierror(11001, "getaddrinfo failed")
    d2 = diagnose_network_error(dns_err, context="Exa API")
    assert "server" in d2["message"].lower() or d2["error_type"] in ["DNS_RESOLUTION_FAILURE", "NO_INTERNET"]

    # SSL error
    ssl_err = ssl.SSLError("certificate verify failed")
    d3 = diagnose_network_error(ssl_err, context="SMTP Server")
    assert d3["error_type"] in ["SSL_PROTOCOL_ERROR", "NO_INTERNET"]
    print("[PASS] Network exception diagnostic translations verified.")

def test_network_status_api_endpoint():
    """Verify /api/settings/network-status endpoint returns status and connectivity."""
    app = create_app()
    client = app.test_client()
    headers = {"X-Session-Token": APP_SESSION_TOKEN}

    res = client.get("/api/settings/network-status", headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert "connected" in data
    assert "status" in data
    assert isinstance(data["connected"], bool)
    print(f"[PASS] Network status endpoint verified (connected: {data['connected']}).")

def test_vault_smtp_password_security():
    """Verify SMTP password is stored in encrypted vault and masked in status responses."""
    test_pwd = "my_super_secret_smtp_app_password"
    Vault.set_secret("smtp_password", test_pwd)

    # Secret retrieval
    assert Vault.get_secret("smtp_password") == test_pwd

    # Secret status masking
    status = Vault.get_secrets_status()
    assert status["smtp_configured"] is True
    assert status["smtp_password_masked"].endswith("word")
    assert test_pwd not in status["smtp_password_masked"]

    # API response masking
    app = create_app()
    client = app.test_client()
    headers = {"X-Session-Token": APP_SESSION_TOKEN}

    res = client.get("/api/settings", headers=headers)
    assert res.status_code == 200
    settings_data = res.get_json()

    # Plaintext password must never appear in returned settings dict
    assert "smtp_password" not in settings_data["settings"]
    assert settings_data["vault"]["smtp_configured"] is True
    assert settings_data["vault"]["smtp_password_masked"].startswith("••••")

    # Cleanup test secret
    Vault.delete_secret("smtp_password")
    print("[PASS] Vault encrypted storage and zero-leak masking of SMTP password verified.")

if __name__ == "__main__":
    test_excel_generation()
    test_api_excel_export_endpoint()
    test_email_validation_and_diagnostics()
    test_network_helper_error_translations()
    test_network_status_api_endpoint()
    test_vault_smtp_password_security()
    print("\nALL EMAIL, EXCEL & NETWORK TESTS PASSED!")
