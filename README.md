# Dayflow HRMS — Real-Time Enterprise HR Management System

> Built for Hackathon Excellence | **FastAPI** + **Async SQLAlchemy** + **PostgreSQL** + **React (Vite/Tailwind)** | Fully Dockerized

Dayflow HRMS is a high-performance, scalable Human Resource Management System designed with zero third-party API dependencies. It leverages native PostgreSQL capabilities (**`LISTEN/NOTIFY` triggers**, **JSONB audit trails**, and **window function analytics**) to deliver real-time data streaming and predictive HR insights.

---

## 🌟 Key Highlights & Innovative Features

### ⚡ 1. PostgreSQL-Native Real-Time Event Pipeline (Zero Redis/RabbitMQ)
Instead of relying on external message brokers, Dayflow utilizes PostgreSQL's native `LISTEN / NOTIFY` pub/sub engine. 
- Database triggers automatically broadcast JSON payloads on table events (`check_in`, `check_out`, `leave_applied`, `leave_reviewed`).
- A background Python listener streams these events to connected clients via WebSockets (`ws://localhost:8000/ws/live`).

### 📊 2. Predictive "Burnout Risk Index" (Pure SQL Analytics)
Computes real-time employee fatigue scores (`Low`, `Medium`, `High`, `Critical`) using SQL window logic:
- Analyzes 30-day overtime accumulation, 90-day leave utilization, and 14-day consecutive work shifts.
- Generates actionable HR recommendations (e.g., *"Mandatory 3-day time-off recommended"*).

### 🛡️ 3. Immutable JSONB System Audit Trail
- Automated triggers record all schema mutations (`INSERT`, `UPDATE`, `DELETE`) on salary, roles, and leave approvals into a PostgreSQL `audit_log` table.
- Stores exact `old_data` and `new_data` snapshots in JSONB for complete enterprise data governance.

### 🔑 4. 1-Click Demo Login Presets
Includes rapid login shortcuts directly on the authentication screen for instant judging evaluation:
- 👑 **Admin**: `admin@dayflow.com` / `admin123`
- 👔 **HR Officer**: `hr@dayflow.com` / `hr123`
- 🧑‍💻 **Employee**: `alex@dayflow.com` / `emp123`

---

## 🏗️ Architecture & Technology Stack

```
                               ┌───────────────────────────┐
                               │     React + Tailwind UI   │
                               └─────────────┬─────────────┘
                                             │ REST API / WebSockets
                               ┌─────────────▼─────────────┐
                               │  FastAPI (Async Uvicorn)  │
                               └─────────────┬─────────────┘
                                             │ Async SQLAlchemy
                               ┌─────────────▼─────────────┐
                               │  PostgreSQL 15 (Docker)   │
                               │  - LISTEN / NOTIFY        │
                               │  - JSONB Audit Triggers   │
                               └───────────────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Python 3.11, FastAPI, Async SQLAlchemy, Pydantic v2, PyJWT |
| **Database** | PostgreSQL 15 (PostgreSQL Triggers & Functions) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Option A: Run with Docker Compose (Recommended)

Start the database, backend API, and frontend client in isolated containers:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Spin up all Docker containers
docker compose up --build -d

# 3. Apply database migrations & seed initial demo data
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI OpenAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: `localhost:5432`

---

### Option B: Local Manual Setup (Without Docker)

#### **1. Backend Setup**
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### **2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

---

## 📑 API Route Summary

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | Register new user account |
| `/api/auth/login` | `POST` | Public | Obtain OAuth2 JWT access token |
| `/api/auth/me` | `GET` | Authenticated | Fetch current profile |
| `/api/attendance/today-status` | `GET` | Authenticated | Get current shift clock-in state |
| `/api/attendance/check-in` | `POST` | Authenticated | Record daily start shift |
| `/api/attendance/check-out` | `POST` | Authenticated | Record daily end shift & calculate hours |
| `/api/leave/balances` | `GET` | Authenticated | View remaining leave days |
| `/api/leave/apply` | `POST` | Authenticated | Submit new leave application |
| `/api/leave/all-requests` | `GET` | Admin / HR | View company leave queue |
| `/api/leave/{id}/review` | `POST` | Admin / HR | Approve or reject leave request |
| `/api/analytics/burnout-risk` | `GET` | Admin / HR | Fetch employee burnout risk scores |
| `/api/analytics/audit-logs` | `GET` | Admin / HR | Fetch PostgreSQL JSONB mutation history |
| `/ws/live` | `WS` | All | Real-time PostgreSQL event stream |

---

## 🔒 Security & Code Standards

- **Role-Based Access Control (RBAC)**: Strict route dependencies (`require_roles("admin", "hr_officer")`).
- **Row-Level Security Ready**: Scoped database sessions (`get_scoped_db`).
- **Password Hashing**: Bcrypt salted password hashing.
- **JWT Authorization**: Signed bearer token validation.
