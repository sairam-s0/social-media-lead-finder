# Feature Specification & Architecture Guide

This document provides a detailed breakdown of all functional modules, background services, deterministic filtering algorithms, REST API contracts, and integration workflows implemented in **Social Lead Finder**.

---

## Table of Contents

1. [Social Discovery & Web Search Engine](#1-social-discovery--web-search-engine)
2. [Deterministic Intent Filtering & Scoring](#2-deterministic-intent-filtering--scoring)
3. [Structured Entity Extraction](#3-structured-entity-extraction)
4. [Deduplication & Data Normalization](#4-deduplication--data-normalization)
5. [Database Architecture & ORM Models](#5-database-architecture--orm-models)
6. [REST API Endpoints](#6-rest-api-endpoints)
7. [Background Scheduling Engine](#7-background-scheduling-engine)
8. [Multi-Channel Notification System](#8-multi-channel-notification-system)
9. [Reporting & Data Export](#9-reporting--data-export)
10. [Client Applications & User Interface](#10-client-applications--user-interface)
11. [Security, Session Tokens & Credential Vault](#11-security-session-tokens--credential-vault)
12. [Mobile Synchronization & Offline Capabilities](#12-mobile-synchronization--offline-capabilities)

---

## 1. Social Discovery & Web Search Engine

The discovery engine monitors public social posts and online discussions across platforms without requiring authenticated social scrapers that risk account suspension.

### Supported Platforms
* **LinkedIn**: Searches public post URLs (`linkedin.com/posts/*`, `linkedin.com/pulse/*`).
* **Twitter / X**: Discovers public tweets and status posts matching hiring patterns.
* **Reddit**: Scans subreddits focused on entrepreneurship, startups, and marketing (`r/forhire`, `r/freelance`, `r/marketing`, `r/entrepreneur`).
* **Public Web**: Broad search targeting public community boards, forums, and company hiring portals.

### Search Execution Pipeline
* **MCP Integration**: Executes search queries through the Model Context Protocol (MCP) using `mcporter` to interface with the Exa search server.
* **Direct HTTPS Fallback**: If MCP is not present, queries fall back directly to Exa API over HTTPS with DPAPI-secured keys.
* **Subprocess Isolation**: Subprocess calls on Windows are spawned using `CREATE_NO_WINDOW` and `SW_HIDE` flags to prevent command prompts from flashing during background execution.

---

## 2. Deterministic Intent Filtering & Scoring

Unlike non-deterministic LLMs that suffer from hallucination and token cost overhead, Lead Finder uses a deterministic rule engine:

### Positive Intent Signals
Identifies posts where an entity is looking to hire, outsource, or contract an agency or specialist:
* **Hiring Verbs**: `"looking for"`, `"need a"`, `"seeking"`, `"recommend an agency"`, `"hire a"`, `"budget allocated"`, `"vendor wanted"`.
* **Service Domains**:
  * Digital Marketing & Performance Marketing
  * SEO (Search Engine Optimization)
  * Social Media Management & Growth
  * Paid Media (Google Ads, Meta Ads, TikTok Ads)
  * Web Development & Software Engineering
  * Content Marketing & Copywriting
  * Lead Generation & Cold Outreach
  * Brand Identity & Graphic Design

### Strict Negative Filtering (Job-Seeker Rejection)
Filters out candidates offering services or seeking jobs:
* **Excluded Terms**: `"resume"`, `"CV"`, `"open to work"`, `"hire me"`, `"portfolio inside"`, `"years of experience looking for role"`, `"unemployed"`, `"job seeker"`.

---

## 3. Structured Entity Extraction

Raw post texts are parsed to extract normalized structured fields:
* **Company Name**: Discovered from text cues (`at <Company>`, `@Company`, post headers).
* **Author / Contact Person**: Extracted from post metadata or parsed byline.
* **Role / Title**: Identifies buyer decision-makers (e.g. Founder, CEO, VP Marketing, Head of Growth).
* **Location**: Detects geographic indications or tags remote availability (`Remote`, `US`, `UK`, `EMEA`).
* **Service Category**: Standardizes raw queries into defined service categories.
* **Matched Keywords**: Retains the specific keyword triggers that passed the filter for auditability.

---

## 4. Deduplication & Data Normalization

Prevents duplicate notifications and bloated databases:
* **URL Normalization**: Strips tracking parameters (`utm_source`, `utm_medium`, tracking query parameters, trailing slashes, protocol variations).
* **Source ID Hashing**: Generates consistent hashes for platform IDs (`source + source_id`).
* **Smart Upsert**: If an existing lead is found, notes and user-updated statuses are preserved while updating discovery timestamps and metadata.

---

## 5. Database Architecture & ORM Models

Data persistence is managed via SQLAlchemy ORM with SQLite backend stored in `%APPDATA%\SocialLeadFinder\data\leads.db`.

### Key Tables
1. **`leads`**:
   * `id` (Primary Key, autoincrement integer)
   * `source` (String: LinkedIn, Twitter, Reddit, Web)
   * `source_id` (String: platform identifier)
   * `url` (String: canonical post URL)
   * `title` (String: post title or headline)
   * `company_name` (String, indexed)
   * `author_name` (String)
   * `author_role` (String)
   * `location` (String)
   * `service` (String, indexed)
   * `matched_keywords` (Text: list of matched keywords)
   * `content` (Text: full post text snippet)
   * `status` (String: `new`, `contacted`, `qualified`, `converted`, `rejected`)
   * `notes` (Text: user internal follow-up notes)
   * `created_at` / `updated_at` (DateTime)

2. **`search_queries`**:
   * `id`, `name`, `query`, `source`, `enabled`, `last_run_at`, `results_count`, `leads_found_count`.

3. **`settings`**:
   * Key-value configuration store for branding, scheduler intervals, and integration flags.

4. **`notification_logs`**:
   * Tracks sent notifications to Telegram and email to prevent re-alerting.

---

## 6. REST API Endpoints

The Flask backend serves REST endpoints:

### Lead Management
* `GET /api/leads`: Paginated lead retrieval with filter parameters (`search`, `keyword`, `status`, `source`, `location`, `page`, `limit`).
* `GET /api/leads/<id>`: Retrieve specific lead details.
* `PATCH /api/leads/<id>`: Update lead status (`new` -> `contacted` -> `qualified` -> `converted` -> `rejected`) or save notes.
* `DELETE /api/leads/<id>`: Remove lead.
* `GET /api/leads/export`: Download CSV or Excel (.xlsx) file.

### Search Operations
* `POST /api/search/run`: Trigger manual search execution (supports options: `{ queryId }` or `{ customQuery }`).
* `GET /api/search/queries`: List configured target search queries.
* `POST /api/search/queries`: Create new target search query.
* `PATCH /api/search/queries/<id>`: Update search query or toggle enabled state.
* `DELETE /api/search/queries/<id>`: Delete search query.

### System & Metrics
* `GET /api/stats`: Aggregate dashboard statistics (total, new, qualified, contacted, by platform, by service, and 7-day timeline).
* `GET /api/health`: Health status check (database integrity, local/LAN IP, port).
* `GET /api/settings`: Fetch workspace branding, scheduler configuration, and vault status.
* `POST /api/settings`: Update settings and encrypted secrets.
* `GET /api/auth/token`: Session token generation for API authentication.

---

## 7. Background Scheduling Engine

* Powered by **APScheduler** running within the Python process.
* Configurable intervals: 15 minutes, 30 minutes, 1 hour, 2 hours, 6 hours, 12 hours, or 24 hours.
* Sequential query processing with polite delays to avoid network rate limits.
* Automatic error recovery and retry handling on network interruptions.

---

## 8. Multi-Channel Notification System

* **Telegram Bot Alerts**: Formatted Markdown messages sent directly to your channel or direct chat whenever a lead is detected.
* **Email SMTP Digest**: Dispatches scheduled or on-demand HTML/plain-text lead summaries via configurable SMTP servers (Gmail, Outlook, custom SMTP).
* **In-App Toast Alerts**: Non-intrusive feedback toasts in both web and desktop interfaces.

---

## 9. Reporting & Data Export

* **CSV Export**: Standard comma-separated export compatible with any spreadsheet tool.
* **Excel Export (.xlsx)**: Multi-tab styled workbook generated with `openpyxl`:
  * Tab 1: Formatted lead records with headers, alternating rows, and status indicators.
  * Tab 2: Export metadata summary (generation date, total records, active filters).

---

## 10. Client Applications & User Interface

### Desktop Web App
* Built on React 18, Vite, and Tailwind CSS.
* Linear / Attio inspired high-density interface with true neutral slate surfaces (`#090a0f`, `#0f1117`).
* Custom headless popovers replacing native browser select inputs.
* Full keyboard accessibility with visible focus rings.

### Android Application
* Native Android wrapper powered by Capacitor.
* Dedicated mobile navigation bar and touch-friendly interaction targets.
* Standalone client-side execution with local storage fallback when offline.

---

## 11. Security, Session Tokens & Credential Vault

* **Session Token Protection**: Sensitive API endpoints enforce `X-Session-Token` header verification.
* **Windows DPAPI Vault**: Secret credentials (API keys, bot tokens, SMTP passwords) are stored encrypted via Windows Data Protection API (DPAPI).
* **Masked Display**: Keys are masked in the UI (`••••••••`) and never returned in plaintext API responses.

---

## 12. Mobile Synchronization & Offline Capabilities

* **QR Code Pairing**: Desktop dashboard provides a one-click QR code displaying the host LAN URL for immediate mobile pairing.
* **Local Mode**: Android app can operate in standalone mode with embedded discovery logic and local cache.
* **LAN Sync**: When connected to the same Wi-Fi network, mobile updates sync directly with the desktop SQLite database.
