# Social Lead Finder - Complete Source Code Bundle

This document contains the entire source code for the **Social Lead Finder** project, including backend Python services, REST API routes, database models, test suite, React Vite frontend dashboard, configuration files, and documentation.

---

## Project File & Directory Structure

```
social-lead-finder/
├── backend/
│   ├── api/
│   │   ├── routes_leads.py
│   │   ├── routes_search.py
│   │   ├── routes_settings.py
│   │   └── routes_stats.py
│   ├── database/
│   │   ├── db.py
│   │   └── models.py
│   ├── services/
│   │   ├── deduplicator.py
│   │   ├── exa_service.py
│   │   ├── lead_filter.py
│   │   ├── lead_parser.py
│   │   ├── notification_service.py
│   │   └── scheduler.py
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_lead_filter.py
│   │   ├── test_parser_dedup.py
│   │   ├── test_raw_mcporter.py
│   │   ├── test_real_search.py
│   │   └── test_run_all.py
│   ├── utils/
│   │   └── logging_config.py
│   ├── .env.example
│   ├── app.py
│   ├── config.py
│   └── requirements.txt
├── data/
│   ├── .gitkeep
│   └── leads.db
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── LeadDetailModal.jsx
│   │   │   ├── LeadTable.jsx
│   │   │   ├── SearchQueryModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── pages/
│   │   │   ├── Automation.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leads.jsx
│   │   │   ├── SearchQueries.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md
└── social-lead-finder.md
```

---

## Table of Contents

1. [backend/app.py](#backendapppy)
2. [backend/config.py](#backendconfigpy)
3. [backend/requirements.txt](#backendrequirementstxt)
4. [backend/.env.example](#backendenvexample)
5. [backend/utils/logging_config.py](#backendutilsloggingconfigpy)
6. [backend/database/db.py](#backenddatabasedbpy)
7. [backend/database/models.py](#backenddatabasemodelspy)
8. [backend/services/exa_service.py](#backendservicesexaservicepy)
9. [backend/services/lead_parser.py](#backendservicesleadparserpy)
10. [backend/services/lead_filter.py](#backendservicesleadfilterpy)
11. [backend/services/deduplicator.py](#backendservicesdeduplicatorpy)
12. [backend/services/notification_service.py](#backendservicesnotificationservicepy)
13. [backend/services/scheduler.py](#backendservicesschedulerpy)
14. [backend/api/routes_leads.py](#backendapiroutesleadspy)
15. [backend/api/routes_search.py](#backendapiroutessearchpy)
16. [backend/api/routes_stats.py](#backendapiroutesstatspy)
17. [backend/api/routes_settings.py](#backendapiroutessettingspy)
18. [backend/tests/test_lead_filter.py](#backendteststestleadfilterpy)
19. [backend/tests/test_parser_dedup.py](#backendteststestparserdeduppy)
20. [backend/tests/test_api.py](#backendteststestapipy)
21. [backend/tests/test_raw_mcporter.py](#backendteststestrawmcporterpy)
22. [backend/tests/test_real_search.py](#backendteststestrealsearchpy)
23. [backend/tests/test_run_all.py](#backendteststestrunallpy)
24. [frontend/package.json](#frontendpackagejson)
25. [frontend/vite.config.js](#frontendviteconfigjs)
26. [frontend/index.html](#frontendindexhtml)
27. [frontend/src/index.css](#frontendsrcindexcss)
28. [frontend/src/main.jsx](#frontendsrcmainjsx)
29. [frontend/src/App.jsx](#frontendsrcappjsx)
30. [frontend/src/services/api.js](#frontendsrcservicesapijs)
31. [frontend/src/components/Sidebar.jsx](#frontendsrccomponentssidebarjsx)
32. [frontend/src/components/Header.jsx](#frontendsrccomponentsheaderjsx)
33. [frontend/src/components/StatCard.jsx](#frontendsrccomponentsstatcardjsx)
34. [frontend/src/components/LeadTable.jsx](#frontendsrccomponentsleadtablejsx)
35. [frontend/src/components/LeadDetailModal.jsx](#frontendsrccomponentsleaddetailmodaljsx)
36. [frontend/src/components/SearchQueryModal.jsx](#frontendsrccomponentssearchquerymodaljsx)
37. [frontend/src/pages/Dashboard.jsx](#frontendsrcpagesdashboardjsx)
38. [frontend/src/pages/Leads.jsx](#frontendsrcpagesleadsjsx)
39. [frontend/src/pages/Automation.jsx](#frontendsrcpagesautomationjsx)
40. [frontend/src/pages/SearchQueries.jsx](#frontendsrcpagessearchqueriesjsx)
41. [frontend/src/pages/Settings.jsx](#frontendsrcpagessettingsjsx)
42. [README.md](#readmemd)

---

### <a id="backendapppy"></a>backend/app.py

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from database.db import init_db, get_db, SessionLocal
from database.models import Lead
from services.scheduler import start_scheduler
from utils.logging_config import logger

from api.routes_leads import bp_leads
from api.routes_search import bp_search
from api.routes_stats import bp_stats
from api.routes_settings import bp_settings

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend on port 5173 or ngrok
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints
    app.register_blueprint(bp_leads)
    app.register_blueprint(bp_search)
    app.register_blueprint(bp_stats)
    app.register_blueprint(bp_settings)

    # API Key Middleware (Highest leverage for lowest effort)
    @app.before_request
    def check_api_key():
        api_key = getattr(Config, "API_KEY", None) or os.getenv("API_KEY", "").strip()
        if not api_key:
            return  # No API key configured, public/dev mode

        if request.method == "OPTIONS" or request.path in ["/api/health"]:
            return  # Bypass CORS preflight and health checks

        provided_key = request.headers.get("X-API-Key") or request.args.get("api_key")
        if provided_key != api_key:
            return jsonify({"success": False, "error": "Unauthorized: Invalid or missing API Key"}), 401

    # Teardown hook to remove thread-local SQLAlchemy session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        SessionLocal.remove()

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_status = "ok"
        try:
            with get_db() as db:
                db.query(Lead).count()
        except Exception as e:
            db_status = f"error: {str(e)}"

        return jsonify({
            "status": "healthy",
            "service": "social-lead-finder-backend",
            "version": "1.0.0",
            "database": db_status,
            "port": Config.PORT
        }), 200

    # Initialize Database Schema & Default Seeds
    init_db()

    # Start APScheduler Background Job
    if Config.SCHEDULER_ENABLED:
        try:
            start_scheduler(app)
        except Exception as e:
            logger.error(f"Could not start scheduler: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting Social Lead Finder Flask server on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=False)

```

---

### <a id="backendconfigpy"></a>backend/config.py

```python
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-social-lead-finder")
    PORT = int(os.getenv("PORT", 5050))
    HOST = os.getenv("HOST", "127.0.0.1")

    # Database
    DATABASE_PATH = DATA_DIR / "leads.db"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Scheduler
    SEARCH_INTERVAL_MINUTES = int(os.getenv("SEARCH_INTERVAL_MINUTES", 60))
    SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() in ("true", "1", "yes")

    # Notifications
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    TELEGRAM_ENABLED = os.getenv("TELEGRAM_ENABLED", "false").lower() in ("true", "1", "yes")

    EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() in ("true", "1", "yes")
    SMTP_SERVER = os.getenv("SMTP_SERVER", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

    # Branding Defaults
    COMPANY_NAME = os.getenv("COMPANY_NAME", "LeadPulse AI")
    COMPANY_TAGLINE = os.getenv("COMPANY_TAGLINE", "Automated Social Lead Discovery Engine")
    COMPANY_LOGO = os.getenv("COMPANY_LOGO", "⚡")
    PRIMARY_COLOR = os.getenv("PRIMARY_COLOR", "#4F46E5")

```

---

### <a id="backendrequirementstxt"></a>backend/requirements.txt

```plaintext
Flask==3.0.2
Flask-CORS==4.0.0
SQLAlchemy==2.0.27
pydantic==2.6.1
APScheduler==3.10.4
python-dotenv==1.0.1
requests==2.31.0
pytest==8.0.1

```

---

### <a id="backendenvexample"></a>backend/.env.example

```plaintext
PORT=5050
HOST=127.0.0.1
SECRET_KEY=change-me-in-production

SEARCH_INTERVAL_MINUTES=60
SCHEDULER_ENABLED=true

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ENABLED=false

COMPANY_NAME=LeadPulse AI
COMPANY_TAGLINE=Automated Social Lead Discovery Engine
COMPANY_LOGO=⚡
PRIMARY_COLOR=#4F46E5

```

---

### <a id="backendutilsloggingconfigpy"></a>backend/utils/logging_config.py

```python
import logging
import sys

def setup_logging():
    logger = logging.getLogger("social_lead_finder")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger

logger = setup_logging()

```

---

### <a id="backenddatabasedbpy"></a>backend/database/db.py

```python
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from config import Config
from database.models import Base, SearchQuery, Setting
from utils.logging_config import logger

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False} if "sqlite" in Config.SQLALCHEMY_DATABASE_URI else {},
    echo=False
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    seed_default_queries()
    seed_default_settings()

def seed_default_queries():
    default_queries = [
        {"name": "Digital Marketing Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a digital marketing agency"', "source": "LinkedIn"},
        {"name": "Digital Marketing Agency - Need", "query": 'site:linkedin.com/posts "need a digital marketing agency"', "source": "LinkedIn"},
        {"name": "Digital Marketer - Looking For", "query": 'site:linkedin.com/posts "looking for a digital marketer"', "source": "LinkedIn"},
        {"name": "Digital Marketer - Need", "query": 'site:linkedin.com/posts "need a digital marketer"', "source": "LinkedIn"},
        {"name": "SEO Agency - Looking For", "query": 'site:linkedin.com/posts "looking for an SEO agency"', "source": "LinkedIn"},
        {"name": "SEO Services - Need", "query": 'site:linkedin.com/posts "need SEO services"', "source": "LinkedIn"},
        {"name": "Social Media Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a social media agency"', "source": "LinkedIn"},
        {"name": "Social Media Marketing - Need", "query": 'site:linkedin.com/posts "need social media marketing"', "source": "LinkedIn"},
        {"name": "Web Dev Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a web development agency"', "source": "LinkedIn"},
        {"name": "Website - Need", "query": 'site:linkedin.com/posts "need a website"', "source": "LinkedIn"},
    ]

    with get_db() as db:
        existing_count = db.query(SearchQuery).count()
        if existing_count == 0:
            logger.info("Seeding initial default search queries...")
            for dq in default_queries:
                db.add(SearchQuery(**dq, enabled=True))

def seed_default_settings():
    default_settings = {
        "company_name": Config.COMPANY_NAME,
        "company_tagline": Config.COMPANY_TAGLINE,
        "company_logo": Config.COMPANY_LOGO,
        "primary_color": Config.PRIMARY_COLOR,
        "search_interval_minutes": str(Config.SEARCH_INTERVAL_MINUTES),
        "telegram_enabled": str(Config.TELEGRAM_ENABLED).lower(),
        "telegram_bot_token": Config.TELEGRAM_BOT_TOKEN,
        "telegram_chat_id": Config.TELEGRAM_CHAT_ID,
    }

    with get_db() as db:
        for k, v in default_settings.items():
            setting = db.query(Setting).filter_by(key=k).first()
            if not setting:
                db.add(Setting(key=k, value=v))

```

---

### <a id="backenddatabasemodelspy"></a>backend/database/models.py

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, default="LinkedIn")
    source_id = Column(String(255), nullable=True, index=True)
    url = Column(String(1024), nullable=False, index=True)
    title = Column(String(512), nullable=True)
    author_name = Column(String(255), nullable=True, default="Not provided")
    author_role = Column(String(255), nullable=True, default="Not provided")
    company_name = Column(String(255), nullable=True, default="Company not provided", index=True)
    company_url = Column(String(1024), nullable=True, default="Not available")
    company_industry = Column(String(255), nullable=True, default="Not available")
    location = Column(String(255), nullable=True, default="Location not available")
    service = Column(String(255), nullable=False, index=True)
    matched_keywords = Column(Text, nullable=True)  # Comma-separated or JSON list
    content = Column(Text, nullable=True)
    published_at = Column(String(100), nullable=True, index=True)
    discovered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), nullable=False, default="new", index=True)  # new, contacted, qualified, converted, rejected
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notifications = relationship("NotificationLog", back_populates="lead", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "source_id": self.source_id,
            "url": self.url,
            "title": self.title,
            "author_name": self.author_name,
            "author_role": self.author_role,
            "company_name": self.company_name,
            "company_url": self.company_url,
            "company_industry": self.company_industry,
            "location": self.location,
            "service": self.service,
            "matched_keywords": self.matched_keywords,
            "content": self.content,
            "published_at": self.published_at,
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class SearchQuery(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    source = Column(String(50), nullable=False, default="LinkedIn")
    enabled = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    results_count = Column(Integer, default=0)
    leads_found_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "query": self.query,
            "source": self.source,
            "enabled": self.enabled,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "results_count": self.results_count,
            "leads_found_count": self.leads_found_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class NotificationLog(Base):
    __tablename__ = "notification_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    channel = Column(String(50), nullable=False)  # telegram, email
    status = Column(String(50), nullable=False)   # success, failed
    message_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "channel": self.channel,
            "status": self.status,
            "message_text": self.message_text,
            "error_message": self.error_message,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }

```

---

### <a id="backendservicesexaservicepy"></a>backend/services/exa_service.py

```python
import json
import os
import sys
import re
import shutil
import subprocess
from typing import List, Dict, Any
from utils.logging_config import logger

def get_mcporter_executable() -> str:
    """
    Dynamically resolves the path or command to run mcporter on Windows or Unix.
    Uses shutil.which('mcporter.cmd') and shutil.which('mcporter').
    Does not hardcode user directories.
    """
    cmd = shutil.which("mcporter.cmd") or shutil.which("mcporter")
    if cmd:
        return cmd
    return "mcporter.cmd" if sys.platform == "win32" else "mcporter"

def search_web(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """
    Executes web search using mcporter call exa.web_search_exa.
    Returns standard result dictionaries.
    """
    num_results = min(max(1, int(num_results)), 50)
    mcporter_executable = get_mcporter_executable()
    logger.info(f"Executing web search for query: '{query}' (num_results={num_results}) via {mcporter_executable}")

    cmd = [
        mcporter_executable,
        "call",
        "exa.web_search_exa",
        f"query={query}",
        f"numResults={num_results}"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
            timeout=60
        )
    except FileNotFoundError as e:
        logger.error(f"mcporter executable not found at '{mcporter_executable}': {e}")
        raise RuntimeError(f"mcporter executable not found: {e}") from e
    except subprocess.TimeoutExpired as e:
        logger.error(f"mcporter command execution timed out after 60s: {e}")
        raise RuntimeError("mcporter command timed out after 60s") from e
    except Exception as e:
        logger.error(f"Failed to run mcporter: {e}")
        raise RuntimeError(f"Failed to run mcporter: {e}") from e

    if result.returncode != 0:
        err_msg = result.stderr.strip() or f"Process exited with code {result.returncode}"
        logger.error(f"mcporter failed with exit code {result.returncode}: {err_msg}")
        raise RuntimeError(f"mcporter execution failed (code {result.returncode}): {err_msg}")

    output_text = result.stdout.strip()
    if not output_text:
        logger.info("mcporter returned empty output (0 search results).")
        return []

    return parse_mcporter_output(output_text)

def parse_mcporter_output(output_text: str) -> List[Dict[str, Any]]:
    """
    Parses output from mcporter (text blocks or JSON fallback) into standard dictionaries.
    """
    if not output_text or not output_text.strip():
        return []

    # Fallback check if output happens to be JSON formatted
    if output_text.startswith("{") or output_text.startswith("["):
        try:
            data = json.loads(output_text)
            if isinstance(data, list):
                return [normalize_item_dict(item) for item in data if isinstance(item, dict)]
            elif isinstance(data, dict):
                items = data.get("results") or data.get("items") or []
                if items:
                    return [normalize_item_dict(item) for item in items if isinstance(item, dict)]
        except Exception:
            pass

    # Parse text blocks separated by '---'
    raw_blocks = re.split(r"\n\s*---\s*\n", output_text.strip())
    results = []

    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue

        title = ""
        url = ""
        published_at = ""
        author = ""
        content_lines = []
        in_highlights = False

        lines = block.split("\n")
        for line in lines:
            line_str = line.rstrip()
            line_strip = line_str.strip()

            if not in_highlights:
                if line_strip.startswith("Title:"):
                    title = line_strip[6:].strip()
                elif line_strip.startswith("URL:"):
                    url = line_strip[4:].strip()
                elif line_strip.startswith("Published:"):
                    published_at = line_strip[10:].strip()
                elif line_strip.startswith("Author:"):
                    author = line_strip[7:].strip()
                elif line_strip.startswith("Highlights:"):
                    in_highlights = True
                elif line_strip:
                    content_lines.append(line_str)
            else:
                content_lines.append(line_str)

        if not title:
            title = "LinkedIn Post"
        if not author or author.lower() in ["not provided", "none"]:
            author = extract_author_from_url_or_title(url, title)

        content = "\n".join(content_lines).strip()
        if not content:
            content = title

        source = "LinkedIn" if "linkedin.com" in url.lower() else "Public Web"

        if url:
            results.append({
                "title": title,
                "url": url,
                "published_at": published_at or "Recently",
                "author": author,
                "content": content,
                "source": source
            })

    return results

def normalize_item_dict(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a single Exa result dictionary if JSON output is encountered.
    """
    url = item.get("url") or item.get("link") or ""
    title = item.get("title") or item.get("name") or "LinkedIn Post"
    published_at = item.get("published_date") or item.get("publishedDate") or item.get("published_at") or item.get("date") or "Recently"
    author = item.get("author") or item.get("author_name") or item.get("authorName") or extract_author_from_url_or_title(url, title)

    content_parts = []
    if item.get("text"):
        content_parts.append(str(item["text"]))
    if item.get("snippet"):
        content_parts.append(str(item["snippet"]))
    if item.get("highlights"):
        if isinstance(item["highlights"], list):
            content_parts.extend([str(h) for h in item["highlights"]])
        else:
            content_parts.append(str(item["highlights"]))

    content = "\n".join(content_parts) if content_parts else title
    source = "LinkedIn" if "linkedin.com" in url.lower() else "Public Web"

    return {
        "title": title,
        "url": url,
        "published_at": published_at,
        "author": author,
        "content": content,
        "source": source
    }

def extract_author_from_url_or_title(url: str, title: str) -> str:
    """Extract candidate author name from title or URL pattern."""
    if title and " - " in title:
        parts = title.split(" - ")
        if len(parts) > 1 and "linkedin" not in parts[0].lower():
            return parts[0].strip()
    if title and " on LinkedIn" in title:
        parts = title.split(" on LinkedIn")
        return parts[0].strip()
    if title and " | " in title:
        parts = title.split(" | ")
        if len(parts) > 1 and "linkedin" not in parts[-1].lower():
            return parts[-1].strip()

    match = re.search(r"linkedin\.com/in/([a-zA-Z0-9\-]+)", url)
    if match:
        raw_slug = match.group(1)
        name = " ".join([word.capitalize() for word in raw_slug.split("-") if not word.isdigit()])
        return name if name else "Not provided"

    return "Not provided"

```

---

### <a id="backendservicesleadparserpy"></a>backend/services/lead_parser.py

```python
import re
from typing import Dict, Any

def parse_lead_data(raw_item: Dict[str, Any], matched_service: str, matched_keywords: list) -> Dict[str, Any]:
    """
    Parses a raw Exa result into structured Lead fields, extracting company name, author, location, and role.
    Strictly avoids hallucination.
    """
    url = raw_item.get("url", "")
    title = raw_item.get("title", "")
    content = raw_item.get("content", "") or title
    author = raw_item.get("author", "Not provided")
    published_at = raw_item.get("published_at", "Recently")
    source = raw_item.get("source", "LinkedIn")

    # Generate source_id from URL
    source_id = extract_source_id(url)

    # Extract author name and role if available
    author_name, author_role = parse_author_and_role(author, title, content)

    # Extract company information strictly if present
    company_name, company_url, company_industry = parse_company_info(title, content, author_role)

    # Extract location if mentioned
    location = parse_location(content, title)

    return {
        "source": source,
        "source_id": source_id,
        "url": url,
        "title": title,
        "author_name": author_name,
        "author_role": author_role,
        "company_name": company_name,
        "company_url": company_url,
        "company_industry": company_industry,
        "location": location,
        "service": matched_service,
        "matched_keywords": ", ".join(matched_keywords),
        "content": content,
        "published_at": published_at,
        "status": "new",
        "notes": ""
    }

def extract_source_id(url: str) -> str:
    """Extract unique post ID or normalized slug from URL."""
    if not url:
        return ""
    # E.g. linkedin.com/posts/username-activity-1234567890
    match = re.search(r"activity-(\d+)", url)
    if match:
        return match.group(1)
    
    # Hash or fallback URL path slug
    clean_url = url.split("?")[0].rstrip("/")
    parts = clean_url.split("/")
    return parts[-1] if parts else url

def parse_author_and_role(author_raw: str, title: str, content: str) -> tuple[str, str]:
    author_name = author_raw if author_raw and author_raw != "Not provided" else "Not provided"
    author_role = "Not provided"

    # Try title pattern: "Name - Role/Company | LinkedIn"
    if title and " - " in title:
        parts = title.split(" - ")
        if len(parts) >= 2:
            potential_name = parts[0].strip()
            potential_role = parts[1].split("|")[0].split("on LinkedIn")[0].strip()
            if author_name == "Not provided" and potential_name and "linkedin" not in potential_name.lower():
                author_name = potential_name
            if potential_role and "linkedin" not in potential_role.lower():
                author_role = potential_role

    # Pattern match headlines in content (e.g. "Founder at XYZ", "Marketing Director")
    if author_role == "Not provided" and content:
        headline_match = re.search(r'\b(Founder|CEO|Co-Founder|Director|Manager|Head of \w+|VP|Owner|Partner)\b[^.\n,]*', content, re.IGNORECASE)
        if headline_match:
            author_role = headline_match.group(0).strip()

    return author_name, author_role

def parse_company_info(title: str, content: str, author_role: str) -> tuple[str, str, str]:
    company_name = "Company not provided"
    company_url = "Not available"
    company_industry = "Not available"

    # Look for "at <Company>" patterns in title or headline
    text_to_search = f"{title}\n{author_role}\n{content[:300]}"
    
    # Match patterns like "Founder at Acme Corp" or "CEO @ TechLabs"
    at_match = re.search(r'\b(?:at|@|for)\s+([A-Z][A-Za-z0-9\s&\.\-]{2,30})\b', text_to_search)
    if at_match:
        candidate = at_match.group(1).strip()
        # Ensure candidate is not a common noun or LinkedIn word
        if candidate.lower() not in ["our team", "a company", "an agency", "linkedin", "my company", "the company", "us"]:
            company_name = candidate

    # Look for domain names in content
    domain_match = re.search(r'\b(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|co|io|org|net|in))\b', content)
    if domain_match:
        domain = domain_match.group(1).lower()
        if "linkedin" not in domain and "twitter" not in domain and "facebook" not in domain:
            company_url = f"https://{domain}"
            if company_name == "Company not provided":
                # Convert domain prefix to company name (e.g., acmefoods.com -> Acmefoods)
                comp_prefix = domain.split(".")[0]
                company_name = comp_prefix.capitalize()

    return company_name, company_url, company_industry

def parse_location(content: str, title: str) -> str:
    # Common location patterns in posts (e.g. "based in London", "operating from Mumbai", "in New York")
    loc_match = re.search(r'\b(?:based in|located in|operating from|hiring in|in)\s+([A-Z][a-zA-Z\s]{2,20})\b', f"{title} {content}")
    if loc_match:
        cand = loc_match.group(1).strip()
        if cand.lower() not in ["our team", "the us", "this post", "search", "need", "digital", "social", "india", "usa"]:
            return cand
    return "Location not available"

```

---

### <a id="backendservicesleadfilterpy"></a>backend/services/lead_filter.py

```python
import re
from typing import Dict, Any, Tuple, Optional, List

# Keywords that explicitly indicate a candidate seeking employment or internal job-seeking post
REJECT_KEYWORDS = [
    "looking for a job",
    "looking for work",
    "seeking employment",
    "job seeker",
    "my resume",
    "my cv",
    "i am looking for a job",
    "i am looking for work",
    "open to work",
    "open for work",
    "seeking a role",
    "hire me",
]

# Keywords indicating positive client demand / business looking for services or hiring freelancers/agencies
POSITIVE_INTENT_KEYWORDS = [
    "looking for",
    "need",
    "seeking",
    "require",
    "required",
    "want",
    "searching for",
    "need help with",
    "looking to hire",
    "looking for an agency",
    "looking for a freelancer",
    "looking for a partner",
    "recommendations for",
    "any recommendation for",
    "who can help us",
    "hiring",
    "hire",
    "looking to outsource",
    "outsourcing",
]

# Known default service category mappings
SERVICE_KEYWORD_MAP = {
    "digital marketing agency": "Digital Marketing",
    "digital marketer": "Digital Marketing",
    "digital marketing": "Digital Marketing",
    "seo agency": "SEO",
    "seo services": "SEO",
    "seo": "SEO",
    "social media agency": "Social Media Marketing",
    "social media marketing": "Social Media Marketing",
    "social media manager": "Social Media Marketing",
    "performance marketing": "Performance Marketing",
    "google ads": "Performance Marketing",
    "meta ads": "Performance Marketing",
    "facebook ads": "Performance Marketing",
    "paid advertising": "Performance Marketing",
    "web development agency": "Web Development",
    "web development": "Web Development",
    "website development": "Web Development",
    "web developer": "Web Development",
    "website developer": "Web Development",
    "need a website": "Web Development",
    "graphic design": "Graphic Design",
    "graphic designer": "Graphic Design",
    "content marketing": "Content Marketing",
    "lead generation": "Lead Generation",
    "marketing automation": "Marketing Automation",
    "branding": "Branding",
    "video editing": "Video Production",
    "video editor": "Video Production",
    "copywriter": "Content Writing",
    "app development": "App Development",
    "app developer": "App Development",
}

def evaluate_lead_intent(text: str, custom_category: Optional[str] = None) -> Tuple[bool, Optional[str], List[str], Optional[str]]:
    """
    Evaluates whether text represents a valid service lead (positive intent) vs job-seeker candidate post.
    Dynamically supports all custom topics (graphic design, hiring, web dev, etc.).
    
    Returns:
        (is_lead: bool, service_category: Optional[str], matched_keywords: list, rejection_reason: Optional[str])
    """
    if not text:
        return False, None, [], "Empty content"

    text_lower = text.lower()

    # 1. Check for explicit job-seeker candidate rejection terms (e.g. "I am looking for a job")
    for reject in REJECT_KEYWORDS:
        if re.search(r'\b' + re.escape(reject) + r'\b', text_lower):
            return False, None, [], f"Matched job-seeker keyword: '{reject}'"

    # 2. Check for positive intent keyword
    matched_intents = []
    for positive in POSITIVE_INTENT_KEYWORDS:
        if re.search(r'\b' + re.escape(positive) + r'\b', text_lower):
            matched_intents.append(positive)

    # 3. Determine Service Category
    matched_service = custom_category
    matched_service_keywords = []

    sorted_service_terms = sorted(SERVICE_KEYWORD_MAP.keys(), key=len, reverse=True)
    for term in sorted_service_terms:
        if re.search(r'\b' + re.escape(term) + r'\b', text_lower):
            if not matched_service:
                matched_service = SERVICE_KEYWORD_MAP[term]
            matched_service_keywords.append(term)

    # Fallback to general category if intent matches or query was executed
    if not matched_service:
        matched_service = custom_category if custom_category else "General Service"

    all_matched = list(set(matched_intents + matched_service_keywords))
    if not all_matched:
        all_matched = ["service search"]

    return True, matched_service, all_matched, None

```

---

### <a id="backendservicesdeduplicatorpy"></a>backend/services/deduplicator.py

```python
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from database.models import Lead
from utils.logging_config import logger

def normalize_url(url: str) -> str:
    """Normalize URL by stripping query parameters and trailing slashes."""
    if not url:
        return ""
    clean = url.split("?")[0].split("#")[0].rstrip("/")
    return clean.lower()

def check_and_save_lead(db: Session, lead_data: Dict[str, Any]) -> Tuple[Lead, bool]:
    """
    Checks if a lead exists by (source + source_id) or (source + normalized_url).
    If it exists, updates useful metadata and returns (lead_obj, is_new=False).
    If it does not exist, inserts it and returns (lead_obj, is_new=True).
    """
    source = lead_data.get("source", "LinkedIn")
    source_id = lead_data.get("source_id", "")
    url = lead_data.get("url", "")
    norm_url = normalize_url(url)

    existing_lead = None

    # 1. Primary check: source + source_id
    if source_id:
        existing_lead = db.query(Lead).filter(
            Lead.source == source,
            Lead.source_id == source_id
        ).first()

    # 2. Fallback check: source + normalized url matching
    if not existing_lead and url:
        all_source_leads = db.query(Lead).filter(Lead.source == source).all()
        for l in all_source_leads:
            if normalize_url(l.url) == norm_url:
                existing_lead = l
                break

    if existing_lead:
        logger.info(f"Duplicate lead detected for URL: {url}. Updating metadata.")
        # Update useful fields if newer or missing
        if lead_data.get("content") and len(lead_data["content"]) > len(existing_lead.content or ""):
            existing_lead.content = lead_data["content"]
        if existing_lead.company_name == "Company not provided" and lead_data.get("company_name") and lead_data.get("company_name") != "Company not provided":
            existing_lead.company_name = lead_data["company_name"]
        if existing_lead.location == "Location not available" and lead_data.get("location") and lead_data.get("location") != "Location not available":
            existing_lead.location = lead_data["location"]
        
        db.add(existing_lead)
        db.commit()
        db.refresh(existing_lead)
        return existing_lead, False

    # Insert new lead
    new_lead = Lead(**lead_data)
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    logger.info(f"Saved new lead ID {new_lead.id} ({new_lead.service} - {new_lead.company_name})")
    return new_lead, True

```

---

### <a id="backendservicesnotificationservicepy"></a>backend/services/notification_service.py

```python
import requests
from sqlalchemy.orm import Session
from config import Config
from database.models import Lead, NotificationLog, Setting
from utils.logging_config import logger

def escape_tg(text: str) -> str:
    """Escapes special Telegram Markdown V1 entities in dynamic field content."""
    return str(text or "").replace("_", "\\_").replace("*", "\\*").replace("`", "\\`").replace("[", "\\[")

def send_telegram_notification(db: Session, lead: Lead) -> bool:
    """
    Sends a formatted Telegram message for a newly discovered lead.
    Only proceeds if Telegram notifications are enabled and credentials exist.
    """
    # Fetch settings from DB or Config
    telegram_enabled_setting = db.query(Setting).filter_by(key="telegram_enabled").first()
    bot_token_setting = db.query(Setting).filter_by(key="telegram_bot_token").first()
    chat_id_setting = db.query(Setting).filter_by(key="telegram_chat_id").first()

    is_enabled = (telegram_enabled_setting.value.lower() == "true") if telegram_enabled_setting else Config.TELEGRAM_ENABLED
    bot_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else Config.TELEGRAM_BOT_TOKEN
    chat_id = chat_id_setting.value if chat_id_setting and chat_id_setting.value else Config.TELEGRAM_CHAT_ID

    if not is_enabled:
        logger.debug("Telegram notifications are disabled.")
        return False

    if not bot_token or not chat_id:
        logger.warning("Telegram enabled but TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.")
        return False

    # Check if notification was already sent for this lead
    existing_log = db.query(NotificationLog).filter_by(lead_id=lead.id, channel="telegram", status="success").first()
    if existing_log:
        logger.info(f"Telegram notification already sent for lead ID {lead.id}.")
        return False

    raw_content = lead.content or ""
    requirement_snippet = raw_content[:250] + ("..." if len(raw_content) > 250 else "")

    msg_text = (
        f"🔥 *NEW POTENTIAL LEAD*\n\n"
        f"*Company:*\n{escape_tg(lead.company_name)}\n\n"
        f"*Contact:*\n{escape_tg(lead.author_name)} ({escape_tg(lead.author_role)})\n\n"
        f"*Location:*\n{escape_tg(lead.location)}\n\n"
        f"*Service:*\n{escape_tg(lead.service)}\n\n"
        f"*Requirement:*\n{escape_tg(requirement_snippet)}\n\n"
        f"*Matched:*\n{escape_tg(lead.matched_keywords)}\n\n"
        f"*Source:*\n{escape_tg(lead.source)}\n\n"
        f"[View Post]({lead.url})"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": msg_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
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
            logger.error(f"Telegram API error: {err_msg}")
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

```

---

### <a id="backendservicesschedulerpy"></a>backend/services/scheduler.py

```python
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database.db import get_db
from database.models import SearchQuery, Setting
from services.exa_service import search_web
from services.lead_filter import evaluate_lead_intent
from services.lead_parser import parse_lead_data
from services.deduplicator import check_and_save_lead
from services.notification_service import send_telegram_notification
from utils.logging_config import logger

scheduler = BackgroundScheduler(daemon=True)

def run_search_pipeline(query_id: int = None, custom_query: str = None) -> dict:
    """
    Runs the lead discovery pipeline.
    - If custom_query is provided, executes ONLY that typed query string.
    - If query_id is provided, executes ONLY that specific configured query.
    - Otherwise, executes all ENABLED search queries.
    """
    logger.info(f"--- Starting Search Pipeline (query_id={query_id}, custom_query='{custom_query}') ---")
    start_time = datetime.utcnow()

    total_results_fetched = 0
    total_new_leads_found = 0
    queries_processed = 0

    with get_db() as db:
        queries_to_run = []

        if custom_query and custom_query.strip():
            raw_q = custom_query.strip()
            # If user typed plain text without site operator, format nicely for Exa
            formatted_q = raw_q if "site:" in raw_q else f'site:linkedin.com/posts "{raw_q}"'
            queries_to_run.append({
                "id": None,
                "name": f"Custom: {raw_q[:30]}",
                "query": formatted_q,
                "source": "LinkedIn"
            })
        elif query_id:
            q_obj = db.query(SearchQuery).filter_by(id=query_id).first()
            if q_obj:
                queries_to_run.append({
                    "id": q_obj.id,
                    "name": q_obj.name,
                    "query": q_obj.query,
                    "source": q_obj.source,
                    "model": q_obj
                })
        else:
            enabled_objs = db.query(SearchQuery).filter_by(enabled=True).all()
            for q_obj in enabled_objs:
                queries_to_run.append({
                    "id": q_obj.id,
                    "name": q_obj.name,
                    "query": q_obj.query,
                    "source": q_obj.source,
                    "model": q_obj
                })

        for q in queries_to_run:
            logger.info(f"Processing Search Query '{q['name']}': {q['query']}")
            raw_items = search_web(query=q['query'], num_results=10)
            total_results_fetched += len(raw_items)
            new_leads_for_query = 0

            for raw_item in raw_items:
                content_to_check = f"{raw_item.get('title', '')} {raw_item.get('content', '')}"
                is_lead, matched_service, matched_keywords, reject_reason = evaluate_lead_intent(content_to_check, custom_category=q.get('name'))

                if is_lead and matched_service:
                    lead_data = parse_lead_data(raw_item, matched_service, matched_keywords)
                    saved_lead, is_new = check_and_save_lead(db, lead_data)
                    
                    if is_new:
                        new_leads_for_query += 1
                        total_new_leads_found += 1
                        send_telegram_notification(db, saved_lead)
                else:
                    logger.debug(f"Filtered out post '{raw_item.get('url')}': {reject_reason}")

            # Update stats if bound to DB model
            if q.get("model"):
                q_model = q["model"]
                q_model.last_run_at = datetime.utcnow()
                q_model.results_count = (q_model.results_count or 0) + len(raw_items)
                q_model.leads_found_count = (q_model.leads_found_count or 0) + new_leads_for_query
                db.add(q_model)
                db.commit()

            queries_processed += 1

    duration_sec = (datetime.utcnow() - start_time).total_seconds()
    logger.info(
        f"--- Finished Search Pipeline in {duration_sec:.2f}s --- "
        f"(Queries: {queries_processed}, Results: {total_results_fetched}, New Leads: {total_new_leads_found})"
    )

    return {
        "success": True,
        "duration_seconds": duration_sec,
        "queries_processed": queries_processed,
        "total_results": total_results_fetched,
        "new_leads_found": total_new_leads_found,
        "executed_at": datetime.utcnow().isoformat()
    }

def start_scheduler(app=None):
    """
    Initializes and starts the APScheduler background job if enabled.
    """
    if scheduler.running:
        logger.info("Scheduler is already running.")
        return

    interval_minutes = 60
    with get_db() as db:
        interval_setting = db.query(Setting).filter_by(key="search_interval_minutes").first()
        if interval_setting and interval_setting.value.isdigit():
            interval_minutes = int(interval_setting.value)

    scheduler.add_job(
        func=run_search_pipeline,
        trigger="interval",
        minutes=interval_minutes,
        id="automated_lead_search_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info(f"APScheduler started successfully. Job scheduled every {interval_minutes} minutes.")

def update_scheduler_interval(minutes: int):
    """
    Updates the interval for the scheduled search job dynamically.
    """
    if scheduler.running:
        scheduler.reschedule_job("automated_lead_search_job", trigger="interval", minutes=minutes)
        logger.info(f"Rescheduled search job to run every {minutes} minutes.")

```

---

### <a id="backendapiroutesleadspy"></a>backend/api/routes_leads.py

```python
from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db
from database.models import Lead

bp_leads = Blueprint("leads", __name__, url_prefix="/api/leads")

@bp_leads.route("", methods=["GET"])
def get_leads():
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        limit_param = int(request.args.get("limit", 20))
        limit = min(max(1, limit_param), 100)  # Server-side cap between 1 and 100
    except (ValueError, TypeError):
        limit = 20

    search = (request.args.get("search") or "").strip()
    service = (request.args.get("service") or "").strip()
    keyword = (request.args.get("keyword") or "").strip() or service  # Safe kw.strip handling
    source = (request.args.get("source") or "").strip()
    status = (request.args.get("status") or "").strip()
    location = (request.args.get("location") or "").strip()
    date_from = (request.args.get("date_from") or "").strip()
    date_to = (request.args.get("date_to") or "").strip()

    with get_db() as db:
        query = db.query(Lead)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Lead.title.ilike(search_pattern)) |
                (Lead.content.ilike(search_pattern)) |
                (Lead.company_name.ilike(search_pattern)) |
                (Lead.author_name.ilike(search_pattern)) |
                (Lead.matched_keywords.ilike(search_pattern)) |
                (Lead.service.ilike(search_pattern))
            )

        if keyword:
            kw_pattern = f"%{keyword}%"
            query = query.filter(
                (Lead.service.ilike(kw_pattern)) |
                (Lead.matched_keywords.ilike(kw_pattern)) |
                (Lead.title.ilike(kw_pattern)) |
                (Lead.content.ilike(kw_pattern))
            )

        if source:
            query = query.filter(Lead.source.ilike(f"%{source}%"))
        if status:
            query = query.filter(Lead.status == status)
        if location:
            query = query.filter(Lead.location.ilike(f"%{location}%"))

        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                query = query.filter(Lead.discovered_at >= dt_from)
            except ValueError:
                pass

        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                query = query.filter(Lead.discovered_at <= dt_to)
            except ValueError:
                pass

        total = query.count()
        leads = query.order_by(Lead.discovered_at.desc()).offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            "success": True,
            "leads": [l.to_dict() for l in leads],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit if limit > 0 else 1
            }
        }), 200

@bp_leads.route("/<int:lead_id>", methods=["GET"])
def get_lead_by_id(lead_id):
    with get_db() as db:
        lead = db.query(Lead).filter_by(id=lead_id).first()
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
        return jsonify({"success": True, "lead": lead.to_dict()}), 200

@bp_leads.route("/<int:lead_id>", methods=["PATCH"])
def update_lead(lead_id):
    data = request.get_json() or {}
    allowed_statuses = ["new", "contacted", "qualified", "converted", "rejected"]

    with get_db() as db:
        lead = db.query(Lead).filter_by(id=lead_id).first()
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404

        if "status" in data:
            new_status = str(data["status"]).lower().strip()
            if new_status not in allowed_statuses:
                return jsonify({"success": False, "error": f"Invalid status. Allowed: {allowed_statuses}"}), 400
            lead.status = new_status

        if "notes" in data:
            lead.notes = str(data["notes"])

        lead.updated_at = datetime.utcnow()
        db.add(lead)
        db.commit()
        db.refresh(lead)

        return jsonify({"success": True, "lead": lead.to_dict()}), 200

```

---

### <a id="backendapiroutessearchpy"></a>backend/api/routes_search.py

```python
from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db
from database.models import SearchQuery
from services.exa_service import search_web
from services.scheduler import run_search_pipeline

bp_search = Blueprint("search", __name__, url_prefix="/api")

@bp_search.route("/search", methods=["POST"])
def adhoc_search():
    data = request.get_json() or {}
    query = (data.get("query") or "").strip()
    
    try:
        raw_num = int(data.get("num_results", 10))
        num_results = min(max(1, raw_num), 50)  # Server-side capping max 50
    except (ValueError, TypeError):
        num_results = 10

    if not query:
        return jsonify({"success": False, "error": "Query string is required"}), 400

    try:
        results = search_web(query=query, num_results=num_results)
        return jsonify({
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "mcporter_execution_failed",
            "details": str(e)
        }), 500

@bp_search.route("/search/run", methods=["POST"])
def run_full_pipeline():
    data = request.get_json() or {}
    query_id = data.get("query_id")
    custom_query = data.get("custom_query")
    result_metrics = run_search_pipeline(query_id=query_id, custom_query=custom_query)
    return jsonify(result_metrics), 200

# CRUD Search Queries
@bp_search.route("/search-queries", methods=["GET"])
def get_search_queries():
    with get_db() as db:
        queries = db.query(SearchQuery).order_by(SearchQuery.created_at.desc()).all()
        return jsonify({
            "success": True,
            "search_queries": [q.to_dict() for q in queries]
        }), 200

@bp_search.route("/search-queries", methods=["POST"])
def create_search_query():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    query = (data.get("query") or "").strip()
    source = (data.get("source") or "LinkedIn").strip()
    enabled = bool(data.get("enabled", True))

    if not name or not query:
        return jsonify({"success": False, "error": "Name and query string are required"}), 400

    with get_db() as db:
        new_q = SearchQuery(name=name, query=query, source=source, enabled=enabled)
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        return jsonify({"success": True, "search_query": new_q.to_dict()}), 201

@bp_search.route("/search-queries/<int:query_id>", methods=["PATCH"])
def update_search_query(query_id):
    data = request.get_json() or {}

    with get_db() as db:
        q = db.query(SearchQuery).filter_by(id=query_id).first()
        if not q:
            return jsonify({"success": False, "error": "Search query not found"}), 404

        if "name" in data:
            q.name = (data["name"] or "").strip()
        if "query" in data:
            q.query = (data["query"] or "").strip()
        if "source" in data:
            q.source = (data["source"] or "").strip()
        if "enabled" in data:
            q.enabled = bool(data["enabled"])

        q.updated_at = datetime.utcnow()
        db.add(q)
        db.commit()
        db.refresh(q)
        return jsonify({"success": True, "search_query": q.to_dict()}), 200

@bp_search.route("/search-queries/<int:query_id>", methods=["DELETE"])
def delete_search_query(query_id):
    with get_db() as db:
        q = db.query(SearchQuery).filter_by(id=query_id).first()
        if not q:
            return jsonify({"success": False, "error": "Search query not found"}), 404

        db.delete(q)
        db.commit()
        return jsonify({"success": True, "message": "Search query deleted"}), 200

```

---

### <a id="backendapiroutesstatspy"></a>backend/api/routes_stats.py

```python
from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from database.db import get_db
from database.models import Lead

bp_stats = Blueprint("stats", __name__, url_prefix="/api/stats")

@bp_stats.route("", methods=["GET"])
def get_stats():
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())

    with get_db() as db:
        total_leads = db.query(Lead).count()
        new_leads = db.query(Lead).filter(Lead.status == "new").count()
        contacted_leads = db.query(Lead).filter(Lead.status == "contacted").count()
        qualified_leads = db.query(Lead).filter(Lead.status == "qualified").count()
        converted_leads = db.query(Lead).filter(Lead.status == "converted").count()
        rejected_leads = db.query(Lead).filter(Lead.status == "rejected").count()

        today_leads = db.query(Lead).filter(Lead.discovered_at >= today_start).count()
        this_week_leads = db.query(Lead).filter(Lead.discovered_at >= week_start).count()

        # Breakdown by service
        service_rows = db.query(Lead.service, func.count(Lead.id)).group_by(Lead.service).all()
        by_service = [{"service": r[0] or "Unknown", "count": r[1]} for r in service_rows]

        # Breakdown by source
        source_rows = db.query(Lead.source, func.count(Lead.id)).group_by(Lead.source).all()
        by_source = [{"source": r[0] or "Unknown", "count": r[1]} for r in source_rows]

        # Breakdown by status
        by_status = [
            {"status": "new", "count": new_leads},
            {"status": "contacted", "count": contacted_leads},
            {"status": "qualified", "count": qualified_leads},
            {"status": "converted", "count": converted_leads},
            {"status": "rejected", "count": rejected_leads},
        ]

        # Leads over last 7 days
        over_time = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            day_start_dt = datetime(day_date.year, day_date.month, day_date.day)
            day_end_dt = day_start_dt + timedelta(days=1)
            cnt = db.query(Lead).filter(Lead.discovered_at >= day_start_dt, Lead.discovered_at < day_end_dt).count()
            over_time.append({
                "date": day_date.strftime("%b %d"),
                "leads": cnt
            })

        return jsonify({
            "success": True,
            "total_leads": total_leads,
            "new_leads": new_leads,
            "contacted_leads": contacted_leads,
            "qualified_leads": qualified_leads,
            "converted_leads": converted_leads,
            "today": today_leads,
            "this_week": this_week_leads,
            "by_service": by_service,
            "by_source": by_source,
            "by_status": by_status,
            "over_time": over_time
        }), 200

```

---

### <a id="backendapiroutessettingspy"></a>backend/api/routes_settings.py

```python
import os
import shutil
import subprocess
from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db
from database.models import Setting, SearchQuery, Lead
from services.scheduler import scheduler, update_scheduler_interval
from services.exa_service import get_mcporter_executable
from config import Config

bp_settings = Blueprint("settings", __name__, url_prefix="/api/settings")

@bp_settings.route("", methods=["GET"])
def get_settings():
    with get_db() as db:
        settings_rows = db.query(Setting).all()
        settings_dict = {s.key: s.value for s in settings_rows}

        # Check system health components
        health_status = check_system_health(db)

        # Build active queries summary
        active_queries_count = db.query(SearchQuery).filter_by(enabled=True).count()

        # Build scheduler metrics
        next_run = None
        job = scheduler.get_job("automated_lead_search_job") if scheduler.running else None
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

        return jsonify({
            "success": True,
            "settings": settings_dict,
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
            setting = db.query(Setting).filter_by(key=k).first()
            if setting:
                setting.value = str(v)
                setting.updated_at = datetime.utcnow()
            else:
                setting = Setting(key=k, value=str(v))
            db.add(setting)

            # Update scheduler dynamically if interval changed
            if k == "search_interval_minutes" and str(v).isdigit():
                update_scheduler_interval(int(v))

        db.commit()
        return jsonify({"success": True, "message": "Settings updated successfully"}), 200

def check_system_health(db):
    health = {
        "backend": "healthy",
        "database": "healthy",
        "mcporter": "unknown",
        "exa": "unknown",
        "scheduler": "running" if (scheduler and scheduler.running) else "stopped",
        "telegram": "disabled"
    }

    # Database check
    try:
        db.query(Lead).count()
    except Exception as e:
        health["database"] = f"unhealthy: {e}"

    # mcporter check
    mcporter_bin = get_mcporter_executable()
    mcporter_exists = shutil.which("mcporter.cmd") or shutil.which("mcporter") or os.path.exists(mcporter_bin)

    if not mcporter_exists:
        health["mcporter"] = "not_found"
        health["exa"] = "not_configured"
    else:
        health["mcporter"] = "healthy"
        try:
            res = subprocess.run([mcporter_bin, "list"], capture_output=True, text=True, timeout=10, encoding="utf-8", errors="replace")
            if res.returncode == 0 and "exa" in res.stdout.lower():
                health["exa"] = "connected"
            elif res.returncode == 0:
                health["exa"] = "not_found"
            else:
                health["exa"] = f"error (code {res.returncode})"
        except Exception as e:
            health["exa"] = f"error: {str(e)}"

    # Telegram check
    telegram_enabled_setting = db.query(Setting).filter_by(key="telegram_enabled").first()
    bot_token_setting = db.query(Setting).filter_by(key="telegram_bot_token").first()
    chat_id_setting = db.query(Setting).filter_by(key="telegram_chat_id").first()

    if telegram_enabled_setting and telegram_enabled_setting.value.lower() == "true":
        if bot_token_setting and bot_token_setting.value and chat_id_setting and chat_id_setting.value:
            health["telegram"] = "configured"
        else:
            health["telegram"] = "missing_credentials"

    return health

```

---

### <a id="backendteststestleadfilterpy"></a>backend/tests/test_lead_filter.py

```python
import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from services.lead_filter import evaluate_lead_intent

def test_positive_lead_intent():
    post = "Looking for a digital marketing agency for our FMCG brand in Mumbai."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is True
    assert service == "Digital Marketing"
    assert "looking for" in keywords or "digital marketing agency" in keywords
    assert reason is None

def test_positive_meta_ads_lead():
    post = "We need someone to manage our Meta Ads and Google Ads campaigns."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is True
    assert service == "Performance Marketing"

def test_job_seeker_rejection():
    post = "I am a digital marketer looking for a job. Here is my resume."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is False
    assert "Matched job-seeker keyword" in reason

def test_internal_hiring_rejection():
    post = "We are looking for a digital marketer to join our team as full-time position."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is False
    assert "Matched job-seeker keyword" in reason

```

---

### <a id="backendteststestparserdeduppy"></a>backend/tests/test_parser_dedup.py

```python
import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base, Lead
from services.lead_parser import parse_lead_data
from services.deduplicator import check_and_save_lead

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_parse_lead_data():
    raw_item = {
        "title": "Neel Sinha - Founder at ABC Foods | LinkedIn",
        "url": "https://linkedin.com/posts/neel-sinha-activity-1234567890",
        "author": "Neel Sinha",
        "published_at": "2 hours ago",
        "content": "Looking for a Digital Marketing agency operating from Mumbai.",
        "source": "LinkedIn"
    }

    parsed = parse_lead_data(raw_item, "Digital Marketing", ["looking for", "digital marketing agency"])
    assert parsed["author_name"] == "Neel Sinha"
    assert parsed["author_role"] == "Founder at ABC Foods"
    assert parsed["company_name"] == "ABC Foods"
    assert parsed["location"] == "Mumbai"
    assert parsed["service"] == "Digital Marketing"
    assert parsed["source_id"] == "1234567890"

def test_deduplication_prevention(db_session):
    lead_data = {
        "source": "LinkedIn",
        "source_id": "9999",
        "url": "https://linkedin.com/posts/test-lead-9999",
        "title": "Need SEO Services",
        "author_name": "Test User",
        "service": "SEO",
        "content": "Need SEO Services immediately"
    }

    # First insertion
    lead1, is_new1 = check_and_save_lead(db_session, lead_data)
    assert is_new1 is True
    assert db_session.query(Lead).count() == 1

    # Duplicate insertion attempt
    lead2, is_new2 = check_and_save_lead(db_session, lead_data)
    assert is_new2 is False
    assert db_session.query(Lead).count() == 1
    assert lead1.id == lead2.id

```

---

### <a id="backendteststestapipy"></a>backend/tests/test_api.py

```python
import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_get_leads_empty(client):
    res = client.get("/api/leads")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "leads" in data
    assert "pagination" in data

def test_get_stats(client):
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "total_leads" in data
    assert "by_service" in data

def test_get_settings(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "settings" in data
    assert "system_health" in data

```

---

### <a id="backendteststestrawmcporterpy"></a>backend/tests/test_raw_mcporter.py

```python
import sys
import shutil
import subprocess

def get_mcporter_executable():
    return (
        shutil.which("mcporter.cmd") or
        shutil.which("mcporter") or
        "mcporter.cmd"
    )

if __name__ == "__main__":
    exe = get_mcporter_executable()
    query = 'site:linkedin.com/posts "looking for a digital marketing agency"'
    num_results = 3

    cmd = [
        exe,
        "call",
        "exa.web_search_exa",
        f"query={query}",
        f"numResults={num_results}"
    ]

    print(f"Executing command: {cmd}")
    res = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    print(f"Exit Code: {res.returncode}")
    print("=== STDOUT SNIPPET ===")
    safe_stdout = res.stdout.encode('ascii', errors='backslashreplace').decode('ascii')
    print(safe_stdout[:2000])

```

---

### <a id="backendteststestrealsearchpy"></a>backend/tests/test_real_search.py

```python
import sys
import subprocess
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from services.exa_service import search_web, get_mcporter_executable

def run_test():
    query = 'site:linkedin.com/posts "looking for a digital marketing agency"'
    num_results = 3

    print(f"Calling search_web with query='{query}', num_results={num_results}...")

    try:
        results = search_web(query=query, num_results=num_results)
        print(f"\nNumber of results: {len(results)}")

        if not results:
            print("\n[DIAGNOSTICS] No results returned. Testing mcporter command output directly...")
            mcporter_bin = get_mcporter_executable()
            cmd = [
                mcporter_bin,
                "call",
                "exa.web_search_exa",
                f"query={query}",
                f"numResults={num_results}"
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
            print(f"mcporter exit code: {res.returncode}")
            print(f"mcporter stdout:\n{res.stdout}")
            print(f"mcporter stderr:\n{res.stderr}")
        else:
            for i, item in enumerate(results, start=1):
                print(f"\n--- Result #{i} ---")
                print(f"Title:  {item.get('title')}")
                print(f"URL:    {item.get('url')}")
                print(f"Author: {item.get('author')}")

    except Exception as e:
        print(f"\n[ERROR] search_web execution failed: {e}")
        print("\n[DIAGNOSTICS] Testing mcporter executable status...")
        mcporter_bin = get_mcporter_executable()
        print(f"mcporter executable resolved path: {mcporter_bin}")
        res = subprocess.run([mcporter_bin, "list"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(f"mcporter list exit code: {res.returncode}")
        print(f"mcporter list stdout:\n{res.stdout}")
        print(f"mcporter list stderr:\n{res.stderr}")

if __name__ == "__main__":
    run_test()

```

---

### <a id="backendteststestrunallpy"></a>backend/tests/test_run_all.py

```python
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database.db import get_db, init_db
from database.models import Lead
from services.scheduler import run_search_pipeline

if __name__ == "__main__":
    init_db()
    print("Running full pipeline for ALL 10 search queries...")
    metrics = run_search_pipeline(query_id=None)
    print("Metrics:", metrics)
    with get_db() as db:
        count = db.query(Lead).count()
        print(f"\nTOTAL LEADS IN DATABASE: {count}")

```

---

### <a id="frontendpackagejson"></a>frontend/package.json

```json
{
  "name": "social-lead-finder-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "axios": "^1.6.7",
    "lucide-react": "^0.330.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "recharts": "^2.12.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.0"
  }
}

```

---

### <a id="frontendviteconfigjs"></a>frontend/vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'curdle-clustered-tarmac.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

```

---

### <a id="frontendindexhtml"></a>frontend/index.html

```html
<!doctype html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Social Lead Finder | Automated Discovery Engine</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="h-full font-['Plus_Jakarta_Sans',sans-serif] antialiased bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
    <div id="root" class="h-full flex flex-col"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

---

### <a id="frontendsrcindexcss"></a>frontend/src/index.css

```css
@import "tailwindcss";

@layer base {
  body {
    background-color: #090d16;
    color: #f1f5f9;
  }
}

/* Custom Glassmorphism Effects */
.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.glass-card:hover {
  border-color: rgba(99, 102, 241, 0.4);
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

```

---

### <a id="frontendsrcmainjsx"></a>frontend/src/main.jsx

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

```

---

### <a id="frontendsrcappjsx"></a>frontend/src/App.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LeadDetailModal from './components/LeadDetailModal';

import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Automation from './pages/Automation';
import SearchQueries from './pages/SearchQueries';
import Settings from './pages/Settings';

import { getSettings, triggerFullSearchPipeline, updateLead } from './services/api';

const App = () => {
  const location = useLocation();
  const [branding, setBranding] = useState({
    company_name: 'LeadPulse AI',
    company_tagline: 'Automated Social Lead Discovery Engine',
    company_logo: '⚡',
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRunMetrics, setSearchRunMetrics] = useState(null);

  const fetchBrandingAndHealth = async () => {
    try {
      const res = await getSettings();
      if (res.success) {
        if (res.settings) {
          setBranding((prev) => ({
            ...prev,
            company_name: res.settings.company_name || prev.company_name,
            company_tagline: res.settings.company_tagline || prev.company_tagline,
            company_logo: res.settings.company_logo || prev.company_logo,
          }));
        }
        setHealthStatus(res.system_health);
      }
    } catch (err) {
      console.error('Failed to load branding/health:', err);
    }
  };

  useEffect(() => {
    fetchBrandingAndHealth();
  }, []);

  const handleRunSearch = async (options = {}) => {
    try {
      setIsSearching(true);
      const metrics = await triggerFullSearchPipeline(options);
      setSearchRunMetrics(metrics);
      // Refresh page data if on dashboard or leads
      window.dispatchEvent(new Event('lead_data_updated'));
    } catch (err) {
      console.error('Manual search trigger failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await updateLead(leadId, { status: newStatus });
      if (res.success) {
        setSelectedLead(res.lead);
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleSaveLeadNotes = async (leadId, notes) => {
    try {
      const res = await updateLead(leadId, { notes });
      if (res.success) {
        setSelectedLead(res.lead);
      }
    } catch (err) {
      console.error('Failed to save lead notes:', err);
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/leads':
        return 'Discovered Leads';
      case '/automation':
        return 'Automation Engine';
      case '/search-queries':
        return 'Search Queries';
      case '/settings':
        return 'System Settings';
      default:
        return 'Social Lead Finder';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar branding={branding} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={getPageTitle()}
          onRunSearch={handleRunSearch}
          isSearching={isSearching}
          healthStatus={healthStatus}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  onSelectLead={setSelectedLead}
                  onRunSearch={handleRunSearch}
                  isSearching={isSearching}
                />
              }
            />
            <Route path="/leads" element={<Leads onSelectLead={setSelectedLead} />} />
            <Route
              path="/automation"
              element={
                <Automation
                  onRunSearch={handleRunSearch}
                  isSearching={isSearching}
                  searchRunMetrics={searchRunMetrics}
                />
              }
            />
            <Route path="/search-queries" element={<SearchQueries />} />
            <Route
              path="/settings"
              element={
                <Settings
                  onBrandingUpdated={(newB) => setBranding((prev) => ({ ...prev, ...newB }))}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* Lead Detail Slide-over Modal */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateLeadStatus}
        onSaveNotes={handleSaveLeadNotes}
      />
    </div>
  );
};

export default App;

```

---

### <a id="frontendsrcservicesapijs"></a>frontend/src/services/api.js

```javascript
import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getLeads = async (params = {}) => {
  const res = await api.get('/leads', { params });
  return res.data;
};

export const getLeadById = async (id) => {
  const res = await api.get(`/leads/${id}`);
  return res.data;
};

export const updateLead = async (id, data) => {
  const res = await api.patch(`/leads/${id}`, data);
  return res.data;
};

export const getStats = async () => {
  const res = await api.get('/stats');
  return res.data;
};

export const runAdhocSearch = async (query, numResults = 10) => {
  const res = await api.post('/search', { query, num_results: numResults });
  return res.data;
};

export const triggerFullSearchPipeline = async ({ queryId = null, customQuery = null } = {}) => {
  const res = await api.post('/search/run', { query_id: queryId, custom_query: customQuery });
  return res.data;
};

export const getSearchQueries = async () => {
  const res = await api.get('/search-queries');
  return res.data;
};

export const createSearchQuery = async (data) => {
  const res = await api.post('/search-queries', data);
  return res.data;
};

export const updateSearchQuery = async (id, data) => {
  const res = await api.patch(`/search-queries/${id}`, data);
  return res.data;
};

export const deleteSearchQuery = async (id) => {
  const res = await api.delete(`/search-queries/${id}`);
  return res.data;
};

export const getSettings = async () => {
  const res = await api.get('/settings');
  return res.data;
};

export const updateSettings = async (data) => {
  const res = await api.patch('/settings', data);
  return res.data;
};

export default api;

```

---

### <a id="frontendsrccomponentssidebarjsx"></a>frontend/src/components/Sidebar.jsx

```javascript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Search, Settings, ShieldCheck } from 'lucide-react';

const Sidebar = ({ branding }) => {
  const companyName = branding?.company_name || 'LeadPulse AI';
  const logo = branding?.company_logo || '⚡';
  const tagline = branding?.company_tagline || 'Lead Discovery Engine';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Automation', path: '/automation', icon: Zap },
    { name: 'Search Queries', path: '/search-queries', icon: Search },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/10 shrink-0">
            {logo}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-white truncate tracking-tight">{companyName}</h1>
            <p className="text-xs text-slate-400 truncate">{tagline}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-300 font-medium block">Deterministic Search</span>
            <span className="text-[10px] text-slate-500">Exa MCP + Python</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

```

---

### <a id="frontendsrccomponentsheaderjsx"></a>frontend/src/components/Header.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Activity, Search, ChevronDown } from 'lucide-react';
import { getSearchQueries } from '../services/api';

const Header = ({ title, onRunSearch, isSearching, healthStatus }) => {
  const [selectedQueryId, setSelectedQueryId] = useState('');
  const [typedQuery, setTypedQuery] = useState('');
  const [configuredQueries, setConfiguredQueries] = useState([]);

  useEffect(() => {
    getSearchQueries().then((res) => {
      if (res.success) {
        setConfiguredQueries(res.search_queries || []);
      }
    }).catch(() => {});
  }, []);

  const isHealthy = healthStatus?.backend === 'healthy' && healthStatus?.database === 'healthy';

  const handleTriggerRun = () => {
    const cleanTyped = typedQuery.trim();
    if (cleanTyped) {
      onRunSearch({ customQuery: cleanTyped });
    } else if (selectedQueryId) {
      onRunSearch({ queryId: parseInt(selectedQueryId, 10) });
    } else {
      onRunSearch({});
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between shrink-0 gap-4">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      {/* Target Search Execution Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl justify-end">
        {/* Select Specific Configured Query Dropdown */}
        <select
          value={selectedQueryId}
          onChange={(e) => {
            setSelectedQueryId(e.target.value);
            if (e.target.value) setTypedQuery('');
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none max-w-[200px] truncate cursor-pointer"
        >
          <option value="">-- All Active Queries --</option>
          {configuredQueries.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>

        {/* Or Type Any Custom Search String Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Type custom query to run..."
            value={typedQuery}
            onChange={(e) => {
              setTypedQuery(e.target.value);
              if (e.target.value) setSelectedQueryId('');
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Execute Selected / Typed Search Button */}
        <button
          onClick={handleTriggerRun}
          disabled={isSearching}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isSearching ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning Web...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {typedQuery.trim()
                  ? 'Run Typed Query'
                  : selectedQueryId
                  ? 'Run Selected Query'
                  : 'Run Active Queries'}
              </span>
            </>
          )}
        </button>

        {/* System Health Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs shrink-0">
          <Activity className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-300 font-medium">
            {isHealthy ? 'Operational' : 'Degraded'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;

```

---

### <a id="frontendsrccomponentsstatcardjsx"></a>frontend/src/components/StatCard.jsx

```javascript
import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitle }) => {
  const colorStyles = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }[color] || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  return (
    <div className="glass-card p-5 rounded-2xl transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorStyles}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;

```

---

### <a id="frontendsrccomponentsleadtablejsx"></a>frontend/src/components/LeadTable.jsx

```javascript
import React from 'react';
import { ExternalLink, Eye, MapPin, Building, User } from 'lucide-react';

const LeadTable = ({ leads, onSelectLead, onStatusChange }) => {
  const statusBadges = {
    new: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    converted: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    rejected: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 glass-card rounded-2xl">
        <Building className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <p className="text-base font-medium text-slate-400">No matching leads found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your filter parameters or trigger an auto-search run.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-card border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
          <tr>
            <th className="py-4 px-5">Company</th>
            <th className="py-4 px-5">Contact</th>
            <th className="py-4 px-5">Service</th>
            <th className="py-4 px-5">Location</th>
            <th className="py-4 px-5">Source</th>
            <th className="py-4 px-5">Posted</th>
            <th className="py-4 px-5">Status</th>
            <th className="py-4 px-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
              {/* Visually Prominent Company Column */}
              <td className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors block text-base leading-tight">
                      {lead.company_name}
                    </span>
                    {lead.company_url && lead.company_url !== 'Not available' && (
                      <a
                        href={lead.company_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {lead.company_url.replace('https://', '')}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </td>

              {/* Contact Person & Role */}
              <td className="py-4 px-5">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-200 block text-xs">{lead.author_name}</span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{lead.author_role}</span>
                  </div>
                </div>
              </td>

              {/* Service Needed */}
              <td className="py-4 px-5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {lead.service}
                </span>
              </td>

              {/* Location */}
              <td className="py-4 px-5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{lead.location}</span>
                </div>
              </td>

              {/* Source */}
              <td className="py-4 px-5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {lead.source}
                </span>
              </td>

              {/* Posted Date */}
              <td className="py-4 px-5 text-xs text-slate-400">
                {lead.published_at || 'Recently'}
              </td>

              {/* Status Badge */}
              <td className="py-4 px-5">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all ${statusBadges[lead.status] || statusBadges.new}`}
                >
                  <option value="new" className="bg-slate-900 text-indigo-400">NEW</option>
                  <option value="contacted" className="bg-slate-900 text-amber-400">CONTACTED</option>
                  <option value="qualified" className="bg-slate-900 text-emerald-400">QUALIFIED</option>
                  <option value="converted" className="bg-slate-900 text-purple-400">CONVERTED</option>
                  <option value="rejected" className="bg-slate-900 text-slate-400">REJECTED</option>
                </select>
              </td>

              {/* Actions */}
              <td className="py-4 px-5 text-right">
                <button
                  onClick={() => onSelectLead(lead)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;

```

---

### <a id="frontendsrccomponentsleaddetailmodaljsx"></a>frontend/src/components/LeadDetailModal.jsx

```javascript
import React, { useState } from 'react';
import { X, ExternalLink, Building, User, MapPin, Tag, Calendar, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

const LeadDetailModal = ({ lead, onClose, onUpdateStatus, onSaveNotes }) => {
  const [notesText, setNotesText] = useState(lead?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  if (!lead) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onSaveNotes(lead.id, notesText);
    setIsSavingNotes(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{lead.company_name}</h2>
              <p className="text-xs text-slate-400">{lead.service} Lead • {lead.source}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Quick Actions Header */}
          <div className="p-4 rounded-xl glass-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {lead.status}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onUpdateStatus(lead.id, 'contacted')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer"
              >
                Mark Contacted
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'qualified')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors cursor-pointer"
              >
                Mark Qualified
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'converted')}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors cursor-pointer"
              >
                Mark Converted
              </button>
              <button
                onClick={() => onUpdateStatus(lead.id, 'rejected')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Contact Person
              </span>
              <p className="font-semibold text-white text-sm">{lead.author_name}</p>
              <p className="text-xs text-slate-400">{lead.author_role}</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Location
              </span>
              <p className="font-semibold text-white text-sm">{lead.location}</p>
              <p className="text-xs text-slate-400">Target Region</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Published Date
              </span>
              <p className="font-semibold text-white text-sm">{lead.published_at || 'Recently'}</p>
              <p className="text-xs text-slate-500">Discovered: {new Date(lead.discovered_at).toLocaleDateString()}</p>
            </div>

            <div className="p-4 rounded-xl glass-card space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" /> Matched Intent Keywords
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(lead.matched_keywords || '').split(',').map((kw, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                    {kw.strip ? kw.strip() : kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Full Post Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>Full Post Content</span>
              <a
                href={lead.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-normal"
              >
                Open Original Post <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <div className="p-4 rounded-xl glass-card text-sm text-slate-300 whitespace-pre-wrap leading-relaxed border-l-2 border-l-indigo-500">
              {lead.content || lead.title}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Lead Notes
            </h3>
            <textarea
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add internal notes about outreach attempt, deal size, or requirements..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Open Original Post</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;

```

---

### <a id="frontendsrccomponentssearchquerymodaljsx"></a>frontend/src/components/SearchQueryModal.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const SearchQueryModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setQuery(initialData.query || '');
      setSource(initialData.source || 'LinkedIn');
      setEnabled(initialData.enabled !== false);
    } else {
      setName('');
      setQuery('');
      setSource('LinkedIn');
      setEnabled(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, query, source, enabled });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              {initialData ? 'Edit Search Query' : 'Add New Search Query'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Query Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Digital Marketing Agency - Need"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Exa Search Query String</label>
            <textarea
              rows={3}
              required
              placeholder='site:linkedin.com/posts "looking for a digital marketing agency"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:border-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Exa operators like site:linkedin.com/posts and exact phrase matching in quotes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Platform</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter / X</option>
                <option value="Reddit">Reddit</option>
                <option value="Public Web">Public Web</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
                />
                <span className="text-xs text-slate-300 font-medium">Enable Automatic Search</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Save Query
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchQueryModal;

```

---

### <a id="frontendsrcpagesdashboardjsx"></a>frontend/src/pages/Dashboard.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, Zap, TrendingUp, PieChart as PieIcon, Layers, Play } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import StatCard from '../components/StatCard';
import LeadTable from '../components/LeadTable';
import { getStats, getLeads, updateLead } from '../services/api';

const Dashboard = ({ onSelectLead, onRunSearch, isSearching }) => {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, leadsRes] = await Promise.all([
        getStats(),
        getLeads({ limit: 5 })
      ]);

      if (statsRes.success) setStats(statsRes);
      if (leadsRes.success) setRecentLeads(leadsRes.leads);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for custom update events when search runs
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('lead_data_updated', handleUpdate);
    return () => window.removeEventListener('lead_data_updated', handleUpdate);
  }, []);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          color="indigo"
          subtitle="Real leads in database"
        />
        <StatCard
          title="New Leads"
          value={stats?.new_leads || 0}
          icon={Zap}
          color="emerald"
          subtitle="Pending review"
        />
        <StatCard
          title="Today's Leads"
          value={stats?.today || 0}
          icon={Calendar}
          color="amber"
          subtitle="Discovered in last 24h"
        />
        <StatCard
          title="Qualified Leads"
          value={stats?.qualified_leads || 0}
          icon={UserCheck}
          color="purple"
          subtitle="High-intent opportunities"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Leads Over Time</h3>
            </div>
            <span className="text-xs text-slate-400">Last 7 Days</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.over_time || []}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Service Category Bar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Leads by Category</h3>
            </div>
            <span className="text-xs text-slate-400">Real Category Breakdown</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.by_service || []}>
                <XAxis dataKey="service" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Leads Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Recent Potential Leads</h3>
          {onRunSearch && (
            <button
              onClick={() => onRunSearch({})}
              disabled={isSearching}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isSearching ? 'Searching...' : 'Run Auto-Search Now'}</span>
            </button>
          )}
        </div>
        <LeadTable
          leads={recentLeads}
          onSelectLead={onSelectLead}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;

```

---

### <a id="frontendsrcpagesleadsjsx"></a>frontend/src/pages/Leads.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, X, Tag } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import { getLeads, updateLead } from '../services/api';

const Leads = ({ onSelectLead }) => {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState(''); // Flexible typed keyword filter (job, digital marketing, SEO, etc.)
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Quick preset keyword chips for convenience
  const quickKeywordChips = [
    'Digital Marketing',
    'SEO',
    'Social Media',
    'Web Development',
    'Google Ads',
    'Lead Generation',
    'Job',
    'Hiring',
    'Agency',
    'Freelancer'
  ];

  const fetchLeadsData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const res = await getLeads({
        page: pageNumber,
        limit: pagination.limit,
        search,
        keyword, // Free-form typed keyword or service filter
        status,
        source,
        location
      });
      if (res.success) {
        setLeads(res.leads);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData(1);
  }, [status, source]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeadsData(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setKeyword('');
    setStatus('');
    setSource('');
    setLocation('');
    fetchLeadsData(1);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      fetchLeadsData(pagination.page);
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Filters Bar */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Query Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by company name, title, content, or person..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Flexible Free-Form Typed Keyword / Filter Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Tag className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Type any filter (e.g. Digital Marketing, Job, SEO, Hiring)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="new">NEW</option>
              <option value="contacted">CONTACTED</option>
              <option value="qualified">QUALIFIED</option>
              <option value="converted">CONVERTED</option>
              <option value="rejected">REJECTED</option>
            </select>

            {/* Source Filter */}
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">All Sources</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Public Web">Public Web</option>
            </select>

            {/* Submit Filter Button */}
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>

            {(search || keyword || status || source || location) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Quick Keyword Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Filter Chips:</span>
            {quickKeywordChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setKeyword(chip);
                  fetchLeadsData(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  keyword.toLowerCase() === chip.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                + {chip}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Main Leads Data Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex justify-center glass-card rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <LeadTable
            leads={leads}
            onSelectLead={onSelectLead}
            onStatusChange={handleStatusChange}
          />

          {/* Pagination Bar */}
          <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{leads.length}</span> of <span className="font-semibold text-white">{pagination.total}</span> leads
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeadsData(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs font-bold text-slate-300 px-2">
                Page {pagination.page} / {pagination.total_pages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchLeadsData(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;

```

---

### <a id="frontendsrcpagesautomationjsx"></a>frontend/src/pages/Automation.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Zap, Play, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers, Edit, Trash2, Power, Save } from 'lucide-react';
import { getSettings, updateSettings, getSearchQueries, updateSearchQuery, deleteSearchQuery } from '../services/api';

const Automation = ({ onRunSearch, isSearching, searchRunMetrics }) => {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInterval, setIsSavingInterval] = useState(false);

  const fetchAutomationData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, queriesRes] = await Promise.all([
        getSettings(),
        getSearchQueries()
      ]);
      if (settingsRes.success) {
        setAutomationStatus(settingsRes.automation_status);
        if (settingsRes.settings?.search_interval_minutes) {
          setIntervalMinutes(settingsRes.settings.search_interval_minutes);
        }
      }
      if (queriesRes.success) setQueries(queriesRes.search_queries);
    } catch (err) {
      console.error('Failed to fetch automation settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const handleUpdateInterval = async (newMinutes) => {
    try {
      setIsSavingInterval(true);
      setIntervalMinutes(String(newMinutes));
      await updateSettings({ search_interval_minutes: String(newMinutes) });
      fetchAutomationData();
    } catch (err) {
      console.error('Failed to update interval:', err);
    } finally {
      setIsSavingInterval(false);
    }
  };

  const handleToggleQuery = async (queryObj) => {
    try {
      await updateSearchQuery(queryObj.id, { enabled: !queryObj.enabled });
      fetchAutomationData();
    } catch (err) {
      console.error('Failed to toggle query:', err);
    }
  };

  const handleDeleteQuery = async (id) => {
    if (window.confirm('Are you sure you want to delete this search query?')) {
      try {
        await deleteSearchQuery(id);
        fetchAutomationData();
      } catch (err) {
        console.error('Failed to delete query:', err);
      }
    }
  };

  const scheduleOptions = [
    { label: 'Every 15 Mins', value: '15' },
    { label: 'Every 30 Mins', value: '30' },
    { label: 'Every 1 Hour', value: '60' },
    { label: 'Every 2 Hours', value: '120' },
    { label: 'Every 6 Hours', value: '360' },
    { label: 'Every 12 Hours', value: '720' },
    { label: 'Every 24 Hours', value: '1440' },
  ];

  if (isLoading) {
    return (
      <div className="p-8 text-center flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Automation Status Metrics Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">APScheduler Background Engine</h2>
              <p className="text-xs text-slate-400">Runs automatically in Python background on your configured schedule</p>
            </div>
          </div>

          <button
            onClick={() => onRunSearch({})}
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Run Search Now</span>
          </button>
        </div>

        {/* Schedule Frequency Controller */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Configure Search Timing Interval</span>
            </div>
            <span className="text-xs text-slate-400">Current Interval: <strong className="text-indigo-400">{intervalMinutes} mins</strong></span>
          </div>

          <div className="flex flex-wrap gap-2">
            {scheduleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleUpdateInterval(opt.value)}
                disabled={isSavingInterval}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  String(intervalMinutes) === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Automation Status</span>
            <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Active & Scheduled
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Next Scheduled Run</span>
            <span className="text-sm font-semibold text-slate-200 block mt-1">
              {automationStatus?.next_run_at ? new Date(automationStatus.next_run_at).toLocaleTimeString() : 'Pending schedule trigger'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Active Search Queries</span>
            <span className="text-lg font-extrabold text-white mt-1 block">
              {queries.filter(q => q.enabled).length} Enabled / {queries.length} Total
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block">Last Manual Run Metrics</span>
            <span className="text-xs font-semibold text-indigo-400 block mt-1">
              {searchRunMetrics ? `${searchRunMetrics.new_leads_found} new leads (${searchRunMetrics.duration_seconds}s)` : 'No recent manual run'}
            </span>
          </div>
        </div>
      </div>

      {/* Configured Queries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Configured Automated Queries</h3>
          <span className="text-xs text-slate-400">{queries.length} total queries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queries.map((q) => (
            <div key={q.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{q.name}</h4>
                  <span className="text-[11px] text-slate-400">Source: {q.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleQuery(q)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      q.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {q.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                  <button
                    onClick={() => handleDeleteQuery(q.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800/80 truncate">
                {q.query}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Leads Found: <strong className="text-white">{q.leads_found_count || 0}</strong></span>
                <span>Last Executed: {q.last_run_at ? new Date(q.last_run_at).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Automation;

```

---

### <a id="frontendsrcpagessearchqueriesjsx"></a>frontend/src/pages/SearchQueries.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Power, Play, RefreshCw } from 'lucide-react';
import SearchQueryModal from '../components/SearchQueryModal';
import { getSearchQueries, createSearchQuery, updateSearchQuery, deleteSearchQuery, triggerFullSearchPipeline } from '../services/api';

const SearchQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningQueryId, setRunningQueryId] = useState(null);

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      const res = await getSearchQueries();
      if (res.success) setQueries(res.search_queries);
    } catch (err) {
      console.error('Failed to fetch search queries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedQuery(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q) => {
    setSelectedQuery(q);
    setIsModalOpen(true);
  };

  const handleSaveQuery = async (formData) => {
    try {
      if (selectedQuery) {
        await updateSearchQuery(selectedQuery.id, formData);
      } else {
        await createSearchQuery(formData);
      }
      setIsModalOpen(false);
      fetchQueries();
    } catch (err) {
      console.error('Failed to save search query:', err);
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      await updateSearchQuery(q.id, { enabled: !q.enabled });
      fetchQueries();
    } catch (err) {
      console.error('Failed to toggle search query:', err);
    }
  };

  const handleRunSingleQuery = async (queryId) => {
    try {
      setRunningQueryId(queryId);
      await triggerFullSearchPipeline({ queryId });
      fetchQueries();
    } catch (err) {
      console.error('Failed to run single search query:', err);
    } finally {
      setRunningQueryId(null);
    }
  };

  const handleDeleteQuery = async (id) => {
    if (window.confirm('Delete this search query?')) {
      try {
        await deleteSearchQuery(id);
        fetchQueries();
      } catch (err) {
        console.error('Failed to delete search query:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Search Query Management</h2>
          <p className="text-xs text-slate-400 font-normal">
            Configure target search terms. Click <strong className="text-indigo-400">"Run This Query"</strong> to execute ONLY that specific query.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Search Query</span>
        </button>
      </div>

      {/* Query List Table */}
      {isLoading ? (
        <div className="p-12 text-center flex justify-center glass-card rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl glass-card border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
              <tr>
                <th className="py-4 px-5">Query Name</th>
                <th className="py-4 px-5">Search Query String</th>
                <th className="py-4 px-5">Source</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Results</th>
                <th className="py-4 px-5">Leads Found</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queries.map((q) => (
                <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-5 font-bold text-white text-sm">{q.name}</td>
                  <td className="py-4 px-5 font-mono text-xs text-indigo-300 max-w-xs truncate">{q.query}</td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {q.source}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <button
                      onClick={() => handleToggleStatus(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                        q.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {q.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-300">{q.results_count || 0}</td>
                  <td className="py-4 px-5 text-xs font-bold text-emerald-400">{q.leads_found_count || 0}</td>
                  <td className="py-4 px-5 text-right space-x-2">
                    {/* Run ONLY This Query Action Button */}
                    <button
                      onClick={() => handleRunSingleQuery(q.id)}
                      disabled={runningQueryId === q.id}
                      title="Run ONLY this query"
                      className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors cursor-pointer text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {runningQueryId === q.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>Run Only This</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(q.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer inline-flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Integration */}
      <SearchQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveQuery}
        initialData={selectedQuery}
      />
    </div>
  );
};

export default SearchQueries;

```

---

### <a id="frontendsrcpagessettingsjsx"></a>frontend/src/pages/Settings.jsx

```javascript
import React, { useState, useEffect } from 'react';
import { Save, Building, Bell, Search, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

const Settings = ({ onBrandingUpdated }) => {
  const [settings, setSettings] = useState({
    company_name: 'LeadPulse AI',
    company_tagline: 'Automated Social Lead Discovery Engine',
    company_logo: '⚡',
    primary_color: '#4F46E5',
    search_interval_minutes: '60',
    telegram_enabled: 'false',
    telegram_bot_token: '',
    telegram_chat_id: '',
  });

  const [systemHealth, setSystemHealth] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettingsData = async () => {
    try {
      const res = await getSettings();
      if (res.success) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
        setSystemHealth(res.system_health);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onBrandingUpdated) onBrandingUpdated(settings);
      fetchSettingsData();
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Company Branding */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Company Branding</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Logo / Badge Icon</label>
              <input
                type="text"
                name="company_logo"
                value={settings.company_logo}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Tagline</label>
              <input
                type="text"
                name="company_tagline"
                value={settings.company_tagline}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Search Settings */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Search className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Search Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Auto-Search Interval (Minutes)</label>
              <input
                type="number"
                name="search_interval_minutes"
                min="5"
                max="1440"
                value={settings.search_interval_minutes}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default is 60 minutes. Minimum 5 mins.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Settings */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Telegram Notifications</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="telegram_enabled"
                checked={settings.telegram_enabled === 'true'}
                onChange={handleChange}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
              />
              <span className="text-xs font-semibold text-slate-200">Enable Telegram Alerts</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telegram Bot Token</label>
              <input
                type="password"
                name="telegram_bot_token"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={settings.telegram_bot_token}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                name="telegram_chat_id"
                placeholder="-100123456789 or user ID"
                value={settings.telegram_chat_id}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: System Health Diagnostics */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">System Health & Diagnostics</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {systemHealth && Object.entries(systemHealth).map(([key, val]) => (
              <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 uppercase font-semibold block">{key}</span>
                <span className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
                  val === 'healthy' || val === 'connected' || val === 'running' || val === 'configured'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {val === 'healthy' || val === 'connected' || val === 'running' || val === 'configured' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Settings;

```

---

### <a id="readmemd"></a>README.md

```markdown
# Social Lead Finder ⚡

**Social Lead Finder** is a Python-based system and SaaS dashboard that automatically discovers PUBLIC online posts where businesses or people are actively looking for services (Digital Marketing, SEO, Social Media Marketing, Performance Marketing, Google/Meta Ads, Web Development, Content Marketing, Lead Generation, Marketing Automation, Branding).

Built **100% deterministically without LLMs, AI classifiers, or n8n**.

---

## 🎯 Key Features

1. **Public Web Discovery**: Calls `mcporter` → Exa MCP → public web search via safe `subprocess.run` (without `shell=True`).
2. **Deterministic Intent Filtering**: Evaluates positive hiring & agency search keywords while strictly rejecting job-seekers (resumes, CVs, employment seekers).
3. **Structured Lead Parsing**: Extracts Company Name, Contact Person, Role, Location, Target Service, and Matched Keywords without hallucination.
4. **Smart Deduplication**: Prevents duplicate leads by `source + source_id` or normalized URL matching while updating useful metadata.
5. **SQLite & REST API**: Powered by SQLAlchemy ORM with indexed fields and Flask REST endpoints (`/api/leads`, `/api/search`, `/api/stats`, `/api/settings`).
6. **Automatic Background Scheduling**: APScheduler background runner executes active queries automatically on a configurable interval (default: 60 minutes).
7. **Telegram Notifications**: Dispatches formatted markdown alerts to Telegram Bot API whenever a NEW lead is discovered.
8. **SaaS React Client Dashboard**: Built with React, Vite, Tailwind CSS, Axios, React Router, and Recharts. Supports custom company branding, KPI cards, visual analytics, data table filters, pagination, lead detail drawers, search query CRUD, and live system health diagnostics.

---

## 🚀 Quick Start

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start Backend Flask Server (Port 5050)
```bash
python backend/app.py
```

### 4. Start Frontend React Server (Port 5173)
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚙️ Configuration (`backend/.env`)

```env
PORT=5050
HOST=127.0.0.1
SEARCH_INTERVAL_MINUTES=60
SCHEDULER_ENABLED=true

TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_ENABLED=false

COMPANY_NAME=LeadPulse AI
COMPANY_TAGLINE=Automated Social Lead Discovery Engine
COMPANY_LOGO=⚡
PRIMARY_COLOR=#4F46E5
```

---

## 🧪 Testing

Run backend unit and integration test suite:
```bash
python -m pytest backend/tests
```

Run manual search test pipeline:
```bash
python backend/tests/test_real_search.py
```

---

## 📄 License
MIT License

```

---
