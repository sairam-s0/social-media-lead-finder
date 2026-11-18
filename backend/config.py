import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Base Directory Resolution
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Determine AppData Directory for Windows and Cross-Platform Production
# Runtime data (DB, logs, config) MUST live in %APPDATA%\SocialLeadFinder, never in Program Files!
if sys.platform == "win32":
    app_data_base = os.environ.get("APPDATA")
    if app_data_base:
        APP_DATA_DIR = Path(app_data_base) / "SocialLeadFinder"
    else:
        APP_DATA_DIR = Path.home() / "AppData" / "Roaming" / "SocialLeadFinder"
else:
    APP_DATA_DIR = Path.home() / ".social-lead-finder"

# Allow custom override if explicitly passed
if os.environ.get("APP_DATA_DIR"):
    APP_DATA_DIR = Path(os.environ["APP_DATA_DIR"]).resolve()

DATA_DIR = APP_DATA_DIR / "data"
LOGS_DIR = APP_DATA_DIR / "logs"

# Ensure runtime directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Static Frontend Directory Resolution (Supports both dev source tree & PyInstaller frozen bundle)
if getattr(sys, "frozen", False):
    BUNDLE_DIR = Path(getattr(sys, "_MEIPASS", BASE_DIR))
    STATIC_DIR = BUNDLE_DIR / "frontend_dist"
    if not STATIC_DIR.exists():
        STATIC_DIR = BUNDLE_DIR / "frontend" / "dist"
else:
    STATIC_DIR = PROJECT_ROOT / "frontend" / "dist"

# Load local .env only if present in dev mode (never hardcoded in production)
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)

class Config:
    VERSION = "2.0.1"
    APP_NAME = "Lead Finder v2"
    
    # Server Binding: Allow local network mobile connections
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5050))
    SECRET_KEY = os.getenv("SECRET_KEY", "prod-secret-lead-finder-local")

    # AppData Paths
    APP_DATA_DIR = APP_DATA_DIR
    DATA_DIR = DATA_DIR
    LOGS_DIR = LOGS_DIR
    STATIC_DIR = STATIC_DIR

    # Database Path (stored in %APPDATA%\SocialLeadFinder\data\leads.db)
    DATABASE_PATH = DATA_DIR / "leads.db"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH.as_posix()}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Scheduler Settings
    SEARCH_INTERVAL_MINUTES = int(os.getenv("SEARCH_INTERVAL_MINUTES", 60))
    SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() in ("true", "1", "yes")

    # Notification & Search Defaults
    TELEGRAM_ENABLED = os.getenv("TELEGRAM_ENABLED", "false").lower() in ("true", "1", "yes")

    # Branding Defaults (Customizable by user in wizard or settings)
    COMPANY_NAME = os.getenv("COMPANY_NAME", "LeadPulse AI")
    COMPANY_TAGLINE = os.getenv("COMPANY_TAGLINE", "Automated Social Lead Discovery Engine")
    COMPANY_LOGO = os.getenv("COMPANY_LOGO", "⚡")
    PRIMARY_COLOR = os.getenv("PRIMARY_COLOR", "#4F46E5")
