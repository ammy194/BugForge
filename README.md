# ⚡ BugForge — Modern Developer Bug & Issue Tracking Platform

> **A modern developer intelligence platform and developer-first reconstruction of Bugzilla engineered for high-velocity software engineering teams.**  
> Built with Express + TypeScript, React 18 + Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, Realtime, Row Level Security), Grok AI (xAI API), and bidirectional GitHub Actions / CI failure ingestion.

---

## 🌐 Production Deployment & Architecture

```text
                    PUBLIC USERS
                         │
                         ▼
                ┌──────────────────┐
                │      VERCEL      │
                │  React Frontend  │
                └────────┬─────────┘
                         │ HTTPS API (JSON)
                         ▼
                ┌──────────────────┐
                │      RENDER      │
                │ Node/Express API │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     SUPABASE          GROK          GITHUB
     Database           AI             API
     Auth
     Storage
     Realtime
     RLS
```

### Production Services & Target URLs
- **Frontend SPA**: [https://bug-forge-frontend.vercel.app/](https://bug-forge-frontend.vercel.app/) (Deployed via Vercel with SPA routing)
- **Backend REST API**: [https://bugforge-backend.onrender.com](https://bugforge-backend.onrender.com) (Deployed via Render with `/health` checks)
- **Database & Auth**: Supabase PostgreSQL with 7 applied migrations and defense-in-depth RLS.
- **AI Intelligence**: Grok API (`https://api.x.ai/v1`) executed exclusively on the Render backend with resilient heuristic offline fallback.
- **GitHub Repository**: [https://github.com/ammy194/BugForge](https://github.com/ammy194/BugForge)

---

## 🚀 Key Features & Developer Intelligence

| Feature | Legacy Bugzilla | BugForge Innovation |
| :--- | :--- | :--- |
| **CI Failure Ingestion** | Manual filing | Automated test failure ingestion with 1-click bug creation and git SHA linking |
| **AI Bug Triage & Grok** | None | Root cause hypotheses, smart component classification, and missing info checklist |
| **2-Tier Duplicate Radar** | Dense table search | Candidate narrowing + semantic overlap scoring with 4 resolution actions |
| **Bug Quality Score** | None | 0–100 deterministic quality meter evaluating repro steps, logs, and stack traces |
| **Smart Assignment** | Manual dropdown | Multi-factor routing heuristic: component ownership, domain expertise, and workload balance |
| **Release Health Radar** | Manual reports | Mathematical 0–100 readiness scoring formula, blocker alerts, and markdown release notes |
| **GitHub Activity Panel** | Manual text links | PR status badges (reviews, CI checks, diff stats), branch copy buttons, linked commits |
| **Realtime Collaboration** | Full page reloads | Live viewer presence pills, broadcast typing indicators, and conflict warning alerts |
| **Telemetry & Metrics** | Basic statistics | Mean Time to Detect (MTTD), MTTR, Bug Reopen Rate, Defect Escape Rate, and Component Health Index |
| **Security & Audit Center** | Basic log files | Immutable SOC2 & ISO compliant audit trail (`/audit`) tracking roles, exports, and auth logins |

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
| **`G` then `R`** | Navigate to Releases & Milestones |
| **`G` then `C`** | Navigate to CI/CD Test Failures |
| **`G` then `T`** | Navigate to Analytics & MTTR Telemetry |
| **`G` then `A`** | Navigate to Security & Audit Center |
| **`G` then `S`** | Navigate to Settings & Webhooks |
| **`?`** | Open Keyboard Shortcuts Cheatsheet |

---

## 🛠️ Local Development & Deployment Guide

### Prerequisites
- Node.js `v18+` or Docker / Docker Compose
- Supabase project (or local fallback mode)

### 1. Clone & Install
```bash
git clone https://github.com/ammy194/BugForge.git
cd BugForge

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

#### Backend Environment Variables (Render / Server-Side)
```ini
PORT=10000
NODE_ENV=production
CLIENT_URL=https://bugforge-app.vercel.app
FRONTEND_URL=https://bugforge-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
GROK_API_KEY=xai-your-grok-api-key
GROK_API_URL=https://api.x.ai/v1
GITHUB_TOKEN=ghp_your_github_token
```

#### Frontend Environment Variables (Vercel / Browser)
```ini
VITE_API_BASE_URL=https://bugforge-backend.onrender.com/api/v1
VITE_API_URL=https://bugforge-backend.onrender.com/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Deploying to Render (Backend)
1. In Render, select **New Web Service** from the GitHub repository `ammy194/BugForge`.
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Set **Health Check Path**: `/health`
6. Add the Backend environment variables.

### 4. Deploying to Vercel (Frontend)
1. In Vercel, import the `ammy194/BugForge` repository.
2. Set **Framework Preset**: `Vite`
3. Set **Root Directory**: `frontend` (or use root with `vercel.json`)
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Add the Frontend environment variables (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## 🔒 Security Architecture
- **Server-Side AI API Keys**: Grok API keys and GitHub tokens are kept exclusively in server environment variables on Render and are NEVER sent to the browser.
- **Defense-in-Depth RLS**: Supabase PostgreSQL tables implement Row Level Security policies matching user project memberships.
- **Dynamic CORS**: API validates production Vercel domains, preview URLs, and localhost.
- **SOC2 Audit Trail**: Immutable logging of role modifications, exports, logins, and settings updates at `/audit`.

---

## 🧪 Automated Test Suite

Run the full test suite with Vitest:
```bash
npm test --workspace=backend
```
**71 / 71 Tests Passing** across 17 test suites covering authentication, project RBAC, issues FSM, AI duplicate detection, Grok triage, release readiness, git links, and security audits.
