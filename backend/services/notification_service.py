import requests
from typing import Tuple
from sqlalchemy.orm import Session
from database.models import Lead, NotificationLog, Setting
from utils.logging_config import logger
from utils.vault import Vault
from services.lead_parser import normalize_post_url

def escape_tg(text: str) -> str:
    """Escapes special Telegram Markdown V1 entities in dynamic field content."""
    return str(text or "").replace("_", "\\_").replace("*", "\\*").replace("`", "\\`").replace("[", "\\[")

def get_telegram_credentials() -> Tuple[str, str]:
    """Retrieves Telegram bot token and chat ID securely from the encrypted vault."""
    token = Vault.get_secret("telegram_bot_token").strip()
    chat_id = Vault.get_secret("telegram_chat_id").strip()
    return token, chat_id

def test_telegram_connection(bot_token: str = None, chat_id: str = None) -> Tuple[bool, str]:
    """
    Tests Telegram bot credentials via Telegram Bot API getMe and sendMessage.
    Returns (success, message).
    """
    vault_token, vault_chat = get_telegram_credentials()
    token = (bot_token or vault_token).strip()
    target_chat = (chat_id or vault_chat).strip()

    if not token:
        return False, "Telegram Bot Token is missing."

    # Step 1: Verify token with getMe
    get_me_url = f"https://api.telegram.org/bot{token}/getMe"
    try:
        res = requests.get(get_me_url, timeout=10)
        res_json = res.json()
        if not res.ok or not res_json.get("ok"):
            desc = res_json.get("description", "Invalid bot token.")
            return False, f"Telegram Bot Token verification failed: {desc}"
        bot_username = res_json.get("result", {}).get("username", "UnknownBot")
    except requests.exceptions.Timeout:
        return False, "Telegram API timed out during token verification."
    except Exception as e:
        return False, f"Telegram API connection error: {str(e)}"

    # Step 2: If chat_id provided, send a verification test message
    if target_chat:
        send_url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": target_chat,
            "text": f"🔔 *Social Lead Finder Test Message*\n\nTelegram notifications successfully connected for bot @{bot_username}!",
            "parse_mode": "Markdown"
        }
        try:
            send_res = requests.post(send_url, json=payload, timeout=10)
            send_json = send_res.json()
            if not send_res.ok or not send_json.get("ok"):
                desc = send_json.get("description", "Could not send test message to Chat ID.")
                return False, f"Bot @{bot_username} verified, but sending to Chat ID failed: {desc}"
        except Exception as e:
            return False, f"Bot @{bot_username} verified, but message delivery failed: {str(e)}"

        return True, f"Telegram connection verified successfully! Test message sent to chat via @{bot_username}."

    return True, f"Telegram Bot Token verified! Connected as @{bot_username}. (Please also configure Chat ID for lead alerts)."

def send_telegram_notification(db: Session, lead: Lead) -> bool:
    """
    Sends a formatted Telegram message for a newly discovered lead.
    Credentials are read securely from the vault, never from SQLite settings table.
    """
    # Check if enabled
    telegram_enabled_setting = db.query(Setting).filter_by(key="telegram_enabled").first()
    is_enabled = (telegram_enabled_setting.value.lower() == "true") if telegram_enabled_setting else False

    if not is_enabled:
        logger.debug("Telegram notifications are disabled in settings.")
        return False

    bot_token, chat_id = get_telegram_credentials()
    if not bot_token or not chat_id:
        logger.warning("Telegram enabled but bot_token or chat_id is missing from vault.")
        return False

    # Check if notification was already sent for this lead
    existing_log = db.query(NotificationLog).filter_by(lead_id=lead.id, channel="telegram", status="success").first()
    if existing_log:
        logger.info(f"Telegram notification already sent for lead ID {lead.id}.")
        return False

    raw_content = lead.content or ""
    requirement_snippet = raw_content[:250] + ("..." if len(raw_content) > 250 else "")
    lead_url = normalize_post_url(lead.url)

    msg_text = (
        f"🔥 *NEW POTENTIAL LEAD*\n\n"
        f"*Company:*\n{escape_tg(lead.company_name)}\n\n"
        f"*Contact:*\n{escape_tg(lead.author_name)} ({escape_tg(lead.author_role)})\n\n"
        f"*Location:*\n{escape_tg(lead.location)}\n\n"
        f"*Service:*\n{escape_tg(lead.service)}\n\n"
        f"*Requirement:*\n{escape_tg(requirement_snippet)}\n\n"
        f"*Matched:*\n{escape_tg(lead.matched_keywords)}\n\n"
        f"*Source:*\n{escape_tg(lead.source)}\n\n"
        f"🔗 [Open Original Post]({lead_url})"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": msg_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False,
        "reply_markup": {
            "inline_keyboard": [
                [{"text": "🚀 Open Lead Post", "url": lead_url}]
            ]
        } if lead_url else {}
    }

    try:
        response = requests.post(url, json=payload, timeout=12)
        res_json = response.json()
        if response.status_code == 200 and res_json.get("ok"):
            log_entry = NotificationLog(
                lead_id=lead.id,
                channel="telegram",
                status="success",
                message_text=msg_text,
                error_message=None
            )
            db.add(log_entry)
            db.commit()
            logger.info(f"Telegram notification sent successfully for lead ID {lead.id}")
            return True
        else:
            err_msg = res_json.get("description", response.text)
            logger.error(f"Telegram API delivery error: {err_msg}")
            log_entry = NotificationLog(
                lead_id=lead.id,
                channel="telegram",
                status="failed",
                message_text=msg_text,
                error_message=err_msg
            )
            db.add(log_entry)
            db.commit()
            return False
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
        log_entry = NotificationLog(
            lead_id=lead.id,
            channel="telegram",
            status="failed",
            message_text=msg_text,
            error_message=str(e)
        )
        db.add(log_entry)
        db.commit()
        return False
