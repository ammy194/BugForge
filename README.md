# ⚡ BugForge — Modern Developer Bug & Issue Tracking Platform

> **A modern, developer-first reconstruction of Bugzilla engineered for high-velocity software engineering teams.**
> Built with Express + TypeScript, Supabase PostgreSQL with defense-in-depth Row Level Security (RLS), React 18, Tailwind CSS, Grok AI intelligent triage, and bidirectional GitHub/CI ecosystem integrations.

---

## 🚀 Key Highlights & Architectural Innovation

| Capability | Legacy Bugzilla | BugForge Innovation |
| :--- | :--- | :--- |
| **User Experience** | Fragmented HTML tables & dense forms | Modern Linear/GitHub-style UX with fluid dark mode & micro-interactions |
| **Workflow Engine** | Fixed global transitions | Configurable Finite State Machine (FSM) enforcing role-checked lifecycle rules |
| **Intelligence** | Manual duplicate searching | Real-time Grok AI Duplicate Detection Radar with resilient local heuristic fallback |
| **AI Root Cause** | None | Instant stack trace diagnosis and Unified Git Diff code patch synthesizer |
| **Git Ecosystem** | Legacy manual attachments | Bidirectional commit linking (`Fixes ECOM-1042`), PR auto-transitions, and branch helpers |
| **CI/CD Quality** | Manual filing | Automated defect ticket ingestion directly from CI test failures with build logs |
| **Security & RBAC** | Basic application guards | Multi-tier Project RBAC + defense-in-depth Supabase Row-Level Security (RLS) |
| **Telemetry & MTTR**| Static tabular reports | Executive telemetry dashboard: MTTR, velocity ratio, component hotspots, & RFC-4180 CSV/JSON export |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React 18 + Vite Frontend\n(Tailwind CSS + Power Shortcuts)"]
    API["Express 4 + TypeScript REST API\n(Validation, RBAC Middleware, FSM Engine)"]
    DB[("Supabase PostgreSQL\n(13 Tables + Defense-in-Depth RLS)")]
    Grok["Grok AI / xAI LLM\n(Duplicate Radar & Root Cause Diff)"]
    Fallback["Heuristic NLP Fallback\n(Zero-Block Resiliency)"]
    GH["GitHub & CI/CD Webhooks\n(Commits, PRs, Automated Ingestion)"]

    Client -->|REST + JWT / Persona Tokens| API
    API -->|Data Layer + RLS Guard| DB
    API -->|Real-time Triage| Grok
    Grok -.->|API Outage Fallback| Fallback
    GH -->|Inbound Webhook Payload| API
    API -->|Outbound Webhooks (Slack/Discord)| Client
```

---

## 👥 Demo Personas (1-Click Switcher)

BugForge features built-in personas with dedicated roles and permissions:

| Persona | Name | Role | Pre-configured Email | Test Token |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Alex Martin | `ADMIN` (Global Master) | `admin@bugforge.dev` | `Bearer demo_admin` |
| **Project Manager** | Sarah Connor | `PROJECT_MANAGER` | `pm@bugforge.dev` | `Bearer demo_pm` |
| **Lead Developer** | Bob Chen | `DEVELOPER` | `bob.dev@bugforge.dev` | `Bearer demo_dev` |
| **QA Reporter** | Elena Rostova | `REPORTER` | `qa.reporter@bugforge.dev` | `Bearer demo_reporter` |

---

## ⚡ Power-User Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`⌘K`** or **`/`** | Focus Command Palette & Global Search |
| **`B`** or **`C`** | Open "Report Defect" Modal |
| **`G` then `I`** | Navigate to Issues Backlog |
| **`G` then `P`** | Navigate to Projects & RBAC |
| **`G` then `A`** | Navigate to Analytics & MTTR Telemetry |
| **`G` then `R`** | Navigate to Releases & Milestones |
| **`G` then `S`** | Navigate to Settings & Webhooks |
| **`?`** | Open Keyboard Shortcuts Cheatsheet |

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js `v18+` or Docker / Docker Compose

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ammy194/BugForge.git
cd BugForge

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in both folders or at root:
```bash
# Backend .env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key-32-chars-minimum
GROK_API_KEY=your-grok-xai-key (Optional - falls back seamlessly)
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend Express REST API (http://localhost:5000)
cd backend && npm run dev

# Terminal 2: Frontend Vite App (http://localhost:5173)
cd frontend && npm run dev
```

### 4. Run Automated Test Suites
```bash
cd backend && npm test
```
*Executes all 55 integration tests across authentication, RBAC, issue creation, workflow state machine transitions, comments, mentions, full-text search, AI duplicate radar, GitHub webhooks, and analytics exports.*

---

## 🐳 Docker Deployment

To spin up the entire production-grade stack with Docker Compose:

```bash
docker-compose up --build
```
- **Frontend**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000`

---

## 📡 REST API Endpoints Catalog

- **Health**: `GET /api/v1/health`
- **Auth**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/sync-profile`
- **Users**: `GET /api/v1/users`, `GET /api/v1/users/me`
- **Projects**: `GET / POST / PATCH / DELETE /api/v1/projects`
- **RBAC Members**: `GET / POST / PATCH / DELETE /api/v1/projects/:id/members`
- **Issues**: `GET / POST /api/v1/issues`, `GET / PATCH /api/v1/issues/:id`
- **FSM Workflow**: `GET /api/v1/issues/:id/transitions`, `POST /api/v1/issues/:id/transition`
- **Collaboration**: `GET / POST / DELETE /api/v1/issues/:id/comments`, `GET /api/v1/issues/:id/timeline`
- **AI Intelligence**: `POST /api/v1/ai/duplicates`, `POST /api/v1/ai/extract`, `POST /api/v1/ai/root-cause`, `POST /api/v1/ai/nl-query`
- **Developer Ecosystem**: `POST /api/v1/github/webhook`, `POST /api/v1/ci/webhook`, `GET /api/v1/github/branch/:issueId`
- **Outbound Webhooks**: `GET / POST / DELETE /api/v1/webhooks`
- **Analytics & Exports**: `GET /api/v1/analytics/overview`, `GET /api/v1/analytics/export/csv`, `GET /api/v1/analytics/export/json`

---

## 📄 License
MIT © 2026 BugForge Team. Built for the Modern Developer.
