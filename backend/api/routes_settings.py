from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db
from database.models import Setting, SearchQuery, Lead
from services.scheduler import scheduler, update_scheduler_interval
from services.exa_service import test_exa_connection
from services.notification_service import test_telegram_connection
from services.email_service import test_email_connection, send_leads_report_email, get_email_settings
from utils.network_helper import is_internet_connected
from utils.vault import Vault
from config import Config

bp_settings = Blueprint("settings", __name__, url_prefix="/api/settings")

SENSITIVE_KEYS = {
    "telegram_bot_token",
    "telegram_chat_id",
    "exa_api_key",
    "groq_api_key",
    "api_key",
    "license_key",
    "smtp_password",
}

@bp_settings.route("", methods=["GET"])
def get_settings():
    with get_db() as db:
        settings_rows = db.query(Setting).all()
        # Filter out any sensitive keys from the returned dictionary
        settings_dict = {
            s.key: s.value for s in settings_rows 
            if s.key not in SENSITIVE_KEYS
        }

        # Retrieve safe secrets status (flags and masked previews only)
        vault_status = Vault.get_secrets_status()

        # Build active queries summary
        active_queries_count = db.query(SearchQuery).filter_by(enabled=True).count()

        # Build scheduler metrics
        next_run = None
        job = scheduler.get_job("automated_lead_search_job") if scheduler.running else None
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

        health_status = check_system_health(db, vault_status)

        return jsonify({
            "success": True,
            "settings": settings_dict,
            "vault": vault_status,
            "automation_status": {
                "running": scheduler.running if scheduler else False,
                "interval_minutes": int(settings_dict.get("search_interval_minutes", Config.SEARCH_INTERVAL_MINUTES)),
                "active_queries_count": active_queries_count,
                "next_run_at": next_run
            },
            "system_health": health_status
        }), 200

@bp_settings.route("", methods=["PATCH"])
def update_settings():
    data = request.get_json() or {}

    with get_db() as db:
        for k, v in data.items():
            str_val = str(v).strip() if v is not None else ""

            # Check if this is a sensitive secret intended for the vault
            if k in SENSITIVE_KEYS:
                # Ignore masked values sent back from the UI
                if str_val and not str_val.startswith("••••") and not str_val.startswith("****"):
                    Vault.set_secret(k, str_val)
                elif str_val == "":
                    # Allow user to clear secret if empty string explicitly provided
                    Vault.delete_secret(k)
                continue

            # Non-sensitive keys stored in SQLite settings table
            setting = db.query(Setting).filter_by(key=k).first()
            if setting:
                setting.value = str_val
                setting.updated_at = datetime.utcnow()
            else:
                setting = Setting(key=k, value=str_val)
            db.add(setting)

            # Update scheduler dynamically if interval changed
            if k == "search_interval_minutes" and str_val.isdigit():
                update_scheduler_interval(int(str_val))

        db.commit()
        return jsonify({
            "success": True,
            "message": "Settings updated successfully",
            "vault": Vault.get_secrets_status()
        }), 200

@bp_settings.route("/test-exa", methods=["POST"])
def test_exa_endpoint():
    data = request.get_json() or {}
    api_key = data.get("api_key")
    # If key is masked, pass None to test existing vault key
    if api_key and (api_key.startswith("••••") or api_key.startswith("****")):
        api_key = None

    success, message = test_exa_connection(api_key=api_key)
    return jsonify({
        "success": success,
        "message": message
    }), 200 if success else 400

@bp_settings.route("/test-telegram", methods=["POST"])
def test_telegram_endpoint():
    data = request.get_json() or {}
    bot_token = data.get("bot_token")
    chat_id = data.get("chat_id")

    if bot_token and (bot_token.startswith("••••") or bot_token.startswith("****")):
        bot_token = None
    if chat_id and (chat_id.startswith("••••") or chat_id.startswith("****")):
        chat_id = None

    success, message = test_telegram_connection(bot_token=bot_token, chat_id=chat_id)
    return jsonify({
        "success": success,
        "message": message
    }), 200 if success else 400

@bp_settings.route("/test-email", methods=["POST"])
def test_email_endpoint():
    data = request.get_json() or {}
    smtp_server = data.get("smtp_server")
    smtp_port = data.get("smtp_port")
    from_email = data.get("from_email")
    smtp_password = data.get("smtp_password")
    to_email = data.get("to_email")

    if smtp_password and (smtp_password.startswith("••••") or smtp_password.startswith("****")):
        smtp_password = None

    success, message, diag = test_email_connection(
        smtp_server=smtp_server,
        smtp_port=smtp_port,
        from_email=from_email,
        password=smtp_password,
        to_email=to_email
    )
    return jsonify({
        "success": success,
        "message": message,
        "diagnostics": diag
    }), 200 if success else 400

@bp_settings.route("/send-report", methods=["POST"])
def send_report_endpoint():
    data = request.get_json() or {}
    to_email = data.get("to_email")
    subject = data.get("subject")

    success, message = send_leads_report_email(
        recipient_email=to_email,
        subject=subject
    )
    return jsonify({
        "success": success,
        "message": message
    }), 200 if success else 400

@bp_settings.route("/network-status", methods=["GET"])
def network_status_endpoint():
    from utils.network_helper import get_lan_ip
    connected = is_internet_connected(timeout=2.0)
    lan_ip = get_lan_ip()
    port = Config.PORT
    return jsonify({
        "success": True,
        "connected": connected,
        "status": "online" if connected else "offline",
        "message": "Internet connection active." if connected else "No internet connection detected.",
        "lan_ip": lan_ip,
        "port": port,
        "local_url": f"http://127.0.0.1:{port}",
        "mobile_url": f"http://{lan_ip}:{port}"
    }), 200

def check_system_health(db, vault_status):
    internet_online = is_internet_connected(timeout=1.5)
    health = {
        "internet": "connected" if internet_online else "offline",
        "backend": "healthy",
        "database": "healthy",
        "exa": "configured" if vault_status.get("exa_configured") else "not_configured",
        "scheduler": "running" if (scheduler and scheduler.running) else "stopped",
        "telegram": "disabled",
        "email": "disabled"
    }

    # Database check
    try:
        db.query(Lead).count()
    except Exception as e:
        health["database"] = f"unhealthy: {e}"

    # Telegram check
    telegram_enabled_setting = db.query(Setting).filter_by(key="telegram_enabled").first()
    if telegram_enabled_setting and telegram_enabled_setting.value.lower() == "true":
        if vault_status.get("telegram_bot_configured") and vault_status.get("telegram_chat_configured"):
            health["telegram"] = "configured"
        else:
            health["telegram"] = "missing_credentials"

    # Email check
    email_enabled_setting = db.query(Setting).filter_by(key="email_enabled").first()
    from_email_setting = db.query(Setting).filter_by(key="smtp_from_email").first()
    to_email_setting = db.query(Setting).filter_by(key="smtp_to_email").first()

    if email_enabled_setting and email_enabled_setting.value.lower() == "true":
        has_creds = (
            vault_status.get("smtp_configured") and 
            from_email_setting and from_email_setting.value and
            to_email_setting and to_email_setting.value
        )
        if has_creds:
            health["email"] = "configured"
        else:
            health["email"] = "missing_credentials"

    return health
