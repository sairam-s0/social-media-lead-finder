# Social Lead Finder

Social Lead Finder is a desktop and Android lead generation engine that automatically monitors public social networks and discussions to discover businesses and individuals actively seeking digital services.

It identifies high-intent buyer inquiries across LinkedIn, X (Twitter), Reddit, and the open web for agencies, freelancers, and B2B service providers.

---

## Releases (Version 1.0.2)

Lead Finder version 1.0.2 includes the refined desktop UI, Android package, and background discovery engine.

### Available Downloads

* **Windows Desktop Installer**: `installer_dist/lead finder v2.exe` (Version 1.0.2, ~38 MB standalone setup executable)
* **Android APK Package**: `android_dist/lead-finder-v2.apk` (Version 1.0.2, Android 8.0+)

---

## Core Feature Highlights

* **Automated Social Discovery**: Continuously scans public posts across LinkedIn, X (Twitter), Reddit, and open web discussions.
* **Deterministic Intent Engine**: Evaluates hiring signals, agency requests, and budget mentions without relying on non-deterministic LLMs or AI classifiers.
* **Job-Seeker Rejection Filter**: Rejects resumes, CVs, portfolios, and candidates seeking employment to keep lead lists clean.
* **Structured Data Extraction**: Automatically extracts company names, contact names, roles, target service categories, locations, and source URLs.
* **URL Normalization & Deduplication**: Canonicalizes URLs and tracks platform identifiers to avoid duplicate leads.
* **Background Scheduling Engine**: Runs automated discovery jobs via APScheduler on configurable intervals from 15 minutes to 24 hours.
* **Instant Notifications**: Sends markdown alerts to Telegram and email reports via SMTP.
* **Data Export**: One-click export to formatted CSV and multi-tab Excel (.xlsx) workbooks.
* **Linear-Inspired Desktop UI**: High-density desktop interface built with precision tables, headless popovers, and keyboard navigation.
* **Approved Native Android App**: Touch-optimized Android application supporting standalone discovery and local Wi-Fi sync.
* **Encrypted Security Vault**: Sensitive credentials (bot tokens, SMTP passwords) are protected with Windows DPAPI encryption.

For complete technical specifications, see [features.md](file:///e:/temp/edulenza/ai_automation/social-media-lead-finder/features.md).

---

## Target Service Categories

Lead Finder includes built-in queries and keyword models for:

* Digital Marketing & Growth Marketing
* Search Engine Optimization (SEO)
* Social Media Marketing & Management
* Performance Marketing (Google Ads, Meta Ads)
* Web Development & Full-Stack Engineering
* Content Marketing & Copywriting
* Lead Generation & Cold Email Outreach
* Brand Identity & Graphic Design

---

## System Requirements

* **Windows**: Windows 10 or Windows 11 (64-bit)
* **Android**: Android 8.0 (API level 26) or higher
* **Development Environment**: Python 3.10+ and Node.js 18+ (only required if developing or building from source)

---

## Quick Start (Running from Source)

### 1. Backend Service

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask REST API will start on `http://127.0.0.1:5050`. Database files are stored in `%APPDATA%\SocialLeadFinder\data\leads.db`.

### 2. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Configuration (`backend/.env`)

Configure settings in the application UI under **Settings**, or create `backend/.env`:

```env
PORT=5050
HOST=127.0.0.1
SEARCH_INTERVAL_MINUTES=60
SCHEDULER_ENABLED=true

# Optional Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_ENABLED=false

# Workspace Branding
COMPANY_NAME=LeadPulse
COMPANY_TAGLINE=Social Lead Discovery Engine
COMPANY_LOGO=⚡
PRIMARY_COLOR=#5e6ad2
```

---

## Automated Verification & Tests

Run the full pytest test suite:

```bash
python -m pytest backend/tests
```

Execute a real search pipeline check:

```bash
python backend/tests/test_real_search.py
```

---

## Compiling from Source

### Building the Windows Installer (`.exe`)

```bash
python build_production.py
```

Produces `installer_dist\lead finder v2.exe` packaged with Inno Setup and PyInstaller.

### Building the Android APK (`.apk`)

```bash
cd frontend
npm run build
npx cap sync android
cd android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
.\gradlew.bat assembleDebug
```

Output APK is copied to `android_dist\lead-finder-v2.apk`.

---

## Repository Structure

```
social-media-lead-finder/
├── backend/
│   ├── api/             # REST API routes (leads, search, stats, settings)
│   ├── database/        # SQLAlchemy database models and connection manager
│   ├── services/        # Exa connector, parser, deduplicator, email, scheduler
│   └── tests/           # Pytest test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # Tables, popovers, detail drawers, modals
│   │   ├── pages/       # Overview, Leads, Queries, Automation, Settings
│   │   └── services/    # API client and local sync manager
│   └── android/         # Capacitor Android native wrapper project
├── installer_dist/      # Windows standalone setup installer (v1.0.2)
├── android_dist/        # Packaged Android APK (v1.0.2)
├── features.md          # Comprehensive architectural and feature breakdown
├── DESIGN.md            # Design system tokens and layout rules
└── build_production.py  # Production compilation script
```

---

## License

MIT License
