# Social Lead Finderx

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

## 📦 Production Installer Build (`lead finder v2.exe`)

Lead Finder v2 includes a production-grade build pipeline that compiles the React frontend, runs verification tests, bundles a self-contained runtime with PyInstaller, and packages everything with Inno Setup into a single distributable setup executable.

### 1. Build Single-File Installer
```bash
python build_production.py
```

### 2. Output Deliverable
- **File**: `installer_dist\lead finder v2.exe`
- **Features**:
  - Single standalone setup executable (~34 MB)
  - Zero Python, Node.js, or dependency installation required for end-users
  - Automatic prerequisite verification & silent installation for Microsoft Edge WebView2 Evergreen Runtime
  - Bundled Visual C++ and Python native runtimes
  - Automatic provisioning of `%APPDATA%\SocialLeadFinder` data, log, and config directories
  - Desktop shortcut and Start Menu program group integration
  - Windows Run (`Win+R`) & Command Prompt registration (`leadfinder.exe`, `SocialLeadFinder.exe`)
  - Full silent deployment support (`/VERYSILENT /SUPPRESSMSGBOXES`)
  - Clean uninstallation with option to preserve or purge user lead database

---

## 📄 License
MIT License

