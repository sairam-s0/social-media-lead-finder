import os
import smtplib
import socket
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

from database.db import get_db
from database.models import Lead, Setting, NotificationLog
from utils.vault import Vault
from utils.logging_config import logger
from utils.network_helper import is_internet_connected, diagnose_network_error

DEFAULT_SMTP_SERVER = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 587

def get_email_settings() -> Dict[str, Any]:
    """Retrieves email configuration from DB and passwords from encrypted vault."""
    with get_db() as db:
        settings_rows = db.query(Setting).all()
        settings_dict = {s.key: s.value for s in settings_rows}

    return {
        "enabled": settings_dict.get("email_enabled", "false").lower() == "true",
        "smtp_server": settings_dict.get("smtp_server", DEFAULT_SMTP_SERVER).strip() or DEFAULT_SMTP_SERVER,
        "smtp_port": int(settings_dict.get("smtp_port", DEFAULT_SMTP_PORT) or DEFAULT_SMTP_PORT),
        "from_email": settings_dict.get("smtp_from_email", "").strip(),
        "to_email": settings_dict.get("smtp_to_email", "").strip(),
        "password": Vault.get_secret("smtp_password").strip(),
        "company_name": settings_dict.get("company_name", "LeadPulse AI"),
    }

def test_email_connection(
    smtp_server: Optional[str] = None,
    smtp_port: Optional[int] = None,
    from_email: Optional[str] = None,
    password: Optional[str] = None,
    to_email: Optional[str] = None
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates SMTP credentials and sends a test email to the destination address.
    Catches all network and authentication errors with user-friendly messages.
    """
    cfg = get_email_settings()
    server = (smtp_server if smtp_server is not None else cfg["smtp_server"]).strip()
    try:
        port = int(smtp_port if smtp_port is not None else cfg["smtp_port"])
    except (ValueError, TypeError):
        port = 587
    sender = (from_email if from_email is not None else cfg["from_email"]).strip()
    pwd = (password if password is not None else cfg["password"]).strip()
    recipient = (to_email if to_email is not None else cfg["to_email"]).strip()

    # Pre-validation
    if not sender:
        return False, "Sender email ('From Email') is required.", {"error_type": "VALIDATION_ERROR"}
    if not recipient:
        return False, "Destination email ('To Email') is required.", {"error_type": "VALIDATION_ERROR"}
    if not pwd:
        return False, "SMTP Password / App Password is required.", {"error_type": "VALIDATION_ERROR"}

    # Step 1: Internet connectivity probe
    if not is_internet_connected(timeout=2.5):
        return False, "No internet connection detected. Please check your network and try again.", {"error_type": "NO_INTERNET"}

    logger.info(f"Testing SMTP connection to {server}:{port} from {sender} to {recipient}...")

    # Step 2: Establish SMTP connection
    try:
        if port == 465:
            # SSL Direct Connection
            context = ssl.create_default_context()
            smtp = smtplib.SMTP_SSL(server, port, context=context, timeout=12)
        else:
            # STARTTLS Connection (Ports 587, 25, 2525)
            smtp = smtplib.SMTP(server, port, timeout=12)
            smtp.ehlo()
            context = ssl.create_default_context()
            smtp.starttls(context=context)
            smtp.ehlo()

        # Step 3: Authenticate
        smtp.login(sender, pwd)

        # Step 4: Dispatch test message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔔 Social Lead Finder - Email Connection Test Successful"
        msg["From"] = f"Social Lead Finder <{sender}>"
        msg["To"] = recipient

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4F46E5, #6366F1); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">Connection Test Successful!</h2>
                <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">Social Lead Finder Automated Email Engine</p>
            </div>
            <div style="padding: 20px 0;">
                <p>Hello,</p>
                <p>Your SMTP mail configuration has been <strong>successfully verified</strong>. The app is ready to automatically email your discovered leads as attached Excel (.xlsx) spreadsheets.</p>
                <ul style="background: #f8fafc; padding: 15px 30px; border-radius: 8px; font-size: 13px; color: #475569;">
                    <li><strong>SMTP Server:</strong> {server}:{port}</li>
                    <li><strong>From:</strong> {sender}</li>
                    <li><strong>To:</strong> {recipient}</li>
                    <li><strong>Verified At:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
                </ul>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">You can now enable automated search reporting in Settings.</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))
        smtp.send_message(msg)
        smtp.quit()

        logger.info(f"Test email successfully sent to {recipient}.")
        return True, f"Connection verified! A test email was delivered to {recipient}.", {"error_type": None}

    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(f"SMTP authentication failure for {sender}: {auth_err}")
        help_msg = "Incorrect username or password."
        if "gmail" in server.lower():
            help_msg += " For Gmail, use an App Password (16 characters) instead of your regular password. Enable 2-Step Verification in Google Account -> Security -> App passwords."
        return False, f"SMTP Authentication Failed: {help_msg}", {"error_type": "AUTH_FAILED"}

    except smtplib.SMTPRecipientsRefused as rec_err:
        logger.error(f"Recipient refused: {rec_err}")
        return False, f"Destination address '{recipient}' was rejected by the mail server.", {"error_type": "RECIPIENT_REFUSED"}

    except (socket.timeout, TimeoutError) as t_err:
        logger.error(f"SMTP connection timed out: {t_err}")
        return False, f"Connection to mail server '{server}:{port}' timed out after 12 seconds. Check server address and port.", {"error_type": "TIMEOUT"}

    except Exception as e:
        logger.error(f"SMTP error during test: {e}")
        diag = diagnose_network_error(e, context=f"SMTP server '{server}'")
        return False, diag["message"], diag

def send_leads_report_email(
    leads: Optional[List[Any]] = None,
    recipient_email: Optional[str] = None,
    subject: Optional[str] = None
) -> Tuple[bool, str]:
    """
    Generates an Excel (.xlsx) workbook of leads and dispatches it as an attachment to the recipient.
    """
    cfg = get_email_settings()
    server = cfg["smtp_server"]
    port = cfg["smtp_port"]
    sender = cfg["from_email"]
    recipient = (recipient_email or cfg["to_email"]).strip()
    pwd = cfg["password"]

    if not sender or not recipient or not pwd:
        return False, "Email sender, recipient, and SMTP password must be configured in Settings."

    # Check internet
    if not is_internet_connected(timeout=2.5):
        logger.warning("Skipping email report: No internet connection detected.")
        return False, "No internet connection detected."

    # Fetch leads if not provided
    with get_db() as db:
        if leads is None:
            leads = db.query(Lead).order_by(Lead.discovered_at.desc()).limit(100).all()
        
        if not leads:
            logger.info("No leads available to send in email report.")
            return False, "No leads available to include in the report."

        # Generate styled Excel workbook in memory (lazy imported)
        from services.excel_exporter import generate_leads_excel_workbook
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        excel_buffer = generate_leads_excel_workbook(leads, title=f"Social Leads Report - {today_str}")

        # Build Message
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject or f"📊 Social Leads Report ({len(leads)} Leads) - {today_str}"
        msg["From"] = f"{cfg['company_name']} <{sender}>"
        msg["To"] = recipient

        # HTML Body
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1E1B4B, #4338CA); color: white; padding: 24px; border-radius: 12px;">
                <h2 style="margin: 0; font-size: 22px;">New Social Leads Discovered</h2>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.85;">{cfg['company_name']} • Automated Lead Discovery Report</p>
            </div>

            <div style="padding: 20px 0;">
                <p>Hello,</p>
                <p>Attached is your latest <strong>Excel spreadsheet report</strong> containing <strong>{len(leads)}</strong> qualified social leads discovered from public searches.</p>

                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px; font-size: 13px; color: #334155; text-transform: uppercase;">Report Summary</h4>
                    <table style="width: 100%; font-size: 13px; color: #475569;">
                        <tr>
                            <td style="padding: 4px 0;"><strong>Total Leads in Attachment:</strong></td>
                            <td style="text-align: right; font-weight: bold; color: #4338CA;">{len(leads)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Generated At:</strong></td>
                            <td style="text-align: right;">{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;"><strong>Attachment:</strong></td>
                            <td style="text-align: right; font-family: monospace;">leads_report_{today_str}.xlsx</td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 13px; color: #64748B;">
                    Open the attached Excel file to view full company names, decision makers, roles, locations, intent keywords, and clickable links to original social posts.
                </p>
            </div>
            
            <div style="border-top: 1px solid #E2E8F0; padding-top: 15px; font-size: 11px; color: #94A3B8; text-align: center;">
                Generated automatically by Social Lead Finder. All client data stored locally.
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))

        # Attach Excel File
        attachment = MIMEBase("application", "vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        attachment.set_payload(excel_buffer.getvalue())
        encoders.encode_base64(attachment)
        filename = f"leads_report_{today_str}.xlsx"
        attachment.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        msg.attach(attachment)

        # Dispatch via SMTP
        try:
            if port == 465:
                context = ssl.create_default_context()
                smtp = smtplib.SMTP_SSL(server, port, context=context, timeout=20)
            else:
                smtp = smtplib.SMTP(server, port, timeout=20)
                smtp.ehlo()
                context = ssl.create_default_context()
                smtp.starttls(context=context)
                smtp.ehlo()

            smtp.login(sender, pwd)
            smtp.send_message(msg)
            smtp.quit()

            logger.info(f"Excel report email successfully sent to {recipient} with {len(leads)} leads.")
            
            # Log notification to first lead as representative record
            if leads and hasattr(leads[0], "id"):
                log_entry = NotificationLog(
                    lead_id=leads[0].id,
                    channel="email",
                    status="success",
                    message_text=f"Sent Excel report ({len(leads)} leads) to {recipient}",
                    error_message=None
                )
                db.add(log_entry)
                db.commit()

            return True, f"Excel report with {len(leads)} leads emailed successfully to {recipient}."

        except Exception as e:
            logger.error(f"Failed to send email report: {e}")
            diag = diagnose_network_error(e, context="Email SMTP Server")
            return False, diag["message"]
