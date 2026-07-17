# OpsPilot 🚀

> **AI Operations Co-pilot for Small Business Owners**  
> One dashboard. Three AI modules. No more disconnected guesswork.

---

## The Problem

Small business owners — shop keepers, salon managers, team leads — run their operations almost entirely on gut feel.

- **Attendance** is tracked on paper or WhatsApp, with no way to spot patterns like chronic late arrivals or buddy-punching.
- **Marketing** is an afterthought. Getting a good Instagram caption or LinkedIn post takes 30 minutes they don't have.
- **Scheduling** is disconnected from what's actually happening — a staff member who's reliably absent every Friday still gets scheduled on Fridays.

These three problems are solved separately today (or not solved at all). OpsPilot brings them together under one AI-powered dashboard.

---

## Current Scope (Hackathon Build)

### ✅ Module 1: Workforce Pulse (Fully Functional)
The flagship module. Real attendance tracking with real anomaly detection.

- **Check-in / Check-out** screen — staff picker + timestamped record to SQLite via FastAPI
- **Real anomaly detection** (not mocked) — three Python detectors run on live data:
  1. **Late arrival** — flags staff late >40% of shifts; detects weekday clustering (e.g. "always late Mondays")
  2. **Buddy-punch signal** — flags any two staff whose check-ins are within 2 minutes on 2+ occasions
  3. **Missed-shift clustering** — flags absences that repeat on the same weekday
- **AI Weekly Report** — a sharp, human-sounding ops report referencing real seeded flags. Currently hardcoded as a high-quality demo; LLM call wired in tomorrow.
- **Seeded data** — 5 realistic staff members (Indian names) with 3 weeks of attendance data, deliberately baked with all three anomaly patterns for instant demo value.

### ✅ Module 2: Content Spark (Mocked, Functional)
Demonstrates the AI copy generation pattern.

- Text input for product/promo description + Generate button
- Returns 3 content variants: Instagram caption (with hashtags), LinkedIn professional post, one-line tagline
- Two hardcoded input→output pairs so demo works fully offline
- Each output card has a **Copy** button
- `# TODO: replace mock with live LLM call (NIM/Llama)` clearly marked in code

### ✅ Module 3: Smart Scheduler (Vision Stub)
Shows the integration story — how Pulse data drives scheduling decisions.

- 3 static shift suggestion cards, each explicitly referencing a detected Pulse anomaly
- "Powered by Workforce Pulse data" badge on every card
- Clear "coming tomorrow" placeholder for the full calendar view

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v3 + Framer Motion + React Router |
| Backend  | FastAPI + SQLite (SQLAlchemy) + Python |
| Icons    | lucide-react |
| Style    | Dark-mode-first, card-based panels, Inter font, subtle gradient accents |

---

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # seed the database with 3 weeks of attendance + anomaly patterns
uvicorn main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

> The Vite dev server proxies all `/api` calls to `localhost:8000`, so no CORS config needed.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/staff` | List all staff members |
| `POST` | `/api/attendance` | Record check-in or check-out |
| `GET` | `/api/pulse/flags` | Run real anomaly detection, return structured JSON |
| `GET` | `/api/pulse/report` | Return AI weekly ops report (hardcoded → LLM tomorrow) |
| `GET` | `/api/pulse/attendance` | Full attendance log |

---

## Tomorrow's Roadmap

### 🔴 Priority 1: Live LLM Throughout
- Wire `/api/pulse/report` to **NVIDIA NIM / Llama 3** with a structured prompt over the flags JSON
- Wire Content Spark to the same LLM endpoint for real generation
- Add streaming output to both UIs (token-by-token reveal)

### 🟡 Priority 2: Smart Scheduler Logic
- Read live Pulse data in the scheduler: late-day patterns → buffer recommendations, buddy-punch pairs → staggered starts, missed-shift clusters → backup coverage alerts
- Build a proper weekly calendar grid UI

### 🟢 Priority 3: Delivery & Alerts
- WhatsApp / SMS weekly digest via Twilio — send the Pulse report to the owner every Monday morning
- Push notifications for real-time check-in anomalies

---

## Seeded Anomaly Patterns (for demo)

| Staff | Pattern |
|-------|---------|
| Priya Menon | Late every Monday (check-in ~10:05–10:20, expected 9:30) |
| Arun Sharma + Faisal Khan | Synchronized check-ins on Mon/Wed/Fri (within 60s) — buddy-punch signal |
| Deepa Nair | Absent all 3 Fridays in the seeded window — missed-shift clustering |
| Rohit Verma | Normal attendance throughout |

---

*Built at hackathon speed. Production-ready architecture. Tomorrow we go live.*
