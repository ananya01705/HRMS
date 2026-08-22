# Dayflow HRMS — hackathon starter

FastAPI + async SQLAlchemy + PostgreSQL + React (Vite/Tailwind), fully dockerized.

## Quick start

```bash
cp .env.example .env   # already done, edit SECRET_KEY if you like
docker compose up --build
```

- Backend: http://localhost:8000 (docs at /docs)
- Frontend: http://localhost:5173
- Postgres: localhost:5432 (user/pass in .env)

Run migrations once the containers are up:

```bash
docker compose exec backend alembic revision --autogenerate -m "init"
docker compose exec backend alembic upgrade head
```

## Folder structure

```
backend/app/
  core/         config, db session, security (JWT, password hashing)
  models/       SQLAlchemy models — one file per domain
  schemas/      Pydantic request/response schemas
  api/          FastAPI routers — one file per domain
  services/     business logic, the LISTEN/NOTIFY bridge lives here

frontend/src/
  modules/auth/                owned by Person A
  modules/attendance-leave/    owned by Person B
  modules/payroll-analytics/   owned by Person C
  shared/api/client.js         axios instance with auth header, reuse this
```

## Hour 0-2: agree on this schema before splitting off

Core tables everyone's work depends on — nail these down together first.

```
users            id, employee_code, email, hashed_password, full_name, role, is_verified, created_at
attendance       id, user_id (FK), date, check_in, check_out, status
leave_requests   id, user_id (FK), leave_type, start_date, end_date, status, remarks, reviewed_by
payroll          id, user_id (FK), basic_salary, allowances, deductions, effective_from
audit_log        id, table_name, record_id, action, changed_by, changed_at, old_data, new_data (jsonb)
```

Keep `role` as an enum (`admin`, `hr_officer`, `employee`) — RLS policies and route guards both key off it.

## Task ownership

### Person A — Foundation, auth & security ✅ implemented in this scaffold
- `backend/app/api/auth.py` — signup/login/me are fully implemented, not stubs
- `backend/app/api/deps.py` — `get_current_user`, `require_roles(...)`, and `get_scoped_db`
  (the RLS-aware DB dependency) are all implemented
- `backend/sql/audit_trigger.sql` — run once after your first migration
- `backend/sql/rls_policies.sql` — run once Person B's attendance/leave tables exist

**Your build order for the day:**
1. `docker compose up --build`, confirm `/docs` loads
2. `docker compose exec backend alembic revision --autogenerate -m "init"` then `alembic upgrade head`
3. Test signup → login → `/api/auth/me` with a real token in `/docs`
4. Run `audit_trigger.sql` against the db (`docker compose exec db psql -U hrms_user -d hrms_db -f /dev/stdin < backend/sql/audit_trigger.sql`)
5. Build `frontend/src/modules/auth/` (login/signup forms, store the token, redirect on success)
6. Once B has pushed `attendance`/`leave_requests` models and migrated: run `rls_policies.sql`,
   tell B/C to swap `Depends(get_db)` for `Depends(get_scoped_db)` on their protected routes
7. Add employee profile view/edit endpoints + page (extend `User` model with address/phone as editable fields)
8. For the rest of the day: you're the integration point — help B/C wire `get_scoped_db` and `require_roles` into their routers

### Person B — Attendance, leave & real-time layer
- New models: `Attendance`, `LeaveRequest` in `backend/app/models/`
- `backend/app/api/attendance.py`, `backend/app/api/leave.py` — implement the TODOs
- `backend/app/services/notify_listener.py` — the pg_notify trigger + listener (steps are commented in the file)
- `backend/app/api/websocket.py` — wire `broadcast()` into the listener callback
- `frontend/src/modules/attendance-leave/` — check-in/out UI, leave form, live dashboard using a WebSocket hook

### Person C — Payroll, analytics & frontend polish
- New model: `Payroll` in `backend/app/models/`
- `backend/app/api/payroll.py` — implement the TODOs, including the burnout-score query
- A materialized view for reporting (add via Alembic migration)
- Server-side payslip PDF generation
- `frontend/src/modules/payroll-analytics/` — payroll views, charts (recharts), overall Tailwind theme consistency across all three modules

## Notes
- All backend TODOs are marked with `TODO(Person X)` — grep for your name to find your starting points.
- The websocket endpoint is at `ws://localhost:8000/ws/live` — frontend just needs to open it and re-render on message.
- Don't skip the hour 14-16 integration checkpoint from the plan — merge early, merge often.
