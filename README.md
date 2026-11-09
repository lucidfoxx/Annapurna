# ANNAPURNA — Food Rescue & Redistribution Platform (with Admin Platform Management Console)

ANNAPURNA connects **Food Donors**, **NGOs / Recipients**, **Volunteers**, and **Platform Administrators** in a role-isolated ecosystem to rescue surplus food and coordinate community redistribution.

---

## Project Structure

- `/frontend` — Standalone Vite + React 19 + Tailwind CSS v4 frontend application (mirrored in `/src` for the integrated full-stack runner).
- `/backend` — FastAPI + SQLAlchemy 2.0 + MySQL (PyMySQL) + Alembic + JWT (`uv` managed) backend with modular Admin Platform Governance routers.
- `/server.ts` — Integrated Express + Vite preview server on port `3000` for live previewing.

---

## 1. Running the Backend (`FastAPI` + `MySQL` + `uv`)

```bash
cd backend
cp .env.example .env
# Update DATABASE_URL in .env (e.g. mysql+pymysql://root:password@127.0.0.1:3306/annapurna_db)

# Install dependencies via uv
uv sync

# Run Alembic database migrations (non-destructive)
uv run alembic upgrade head

# Seed initial tables & sample network users (Donor, NGO, Volunteer)
uv run python -m app.db.create_tables

# Start FastAPI server on port 8000
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 2. Initializing or Promoting the First Administrator

Public registration of the `Admin` role is strictly blocked (`403 Forbidden`). You can create or promote the initial Administrator using either of these two controlled methods:

### Method A: CLI Promotion / Creation Command (`app.db.promote_admin`)
```bash
cd backend

# Promote an existing user to Admin:
uv run python -m app.db.promote_admin --email donor1@shareplate.org

# Or create a brand-new Admin account from the CLI:
uv run python -m app.db.promote_admin --email admin@annapurna.org --name "Platform Admin" --password "YourStrongPassword123!"
```

### Method B: One-Time Initial Admin Setup in UI (`/login`)
When `0` administrators exist in the database, `/api/auth/bootstrap-status` returns `{"has_admin": false}` and the `/login` screen displays a **First-Time Platform Setup — Initialize Admin** banner (`POST /api/auth/bootstrap-admin`). Once the first administrator exists, this endpoint permanently locks (`403 Forbidden`), and all future role promotions must be performed by an authenticated Admin in `/admin/users` or via the CLI.

---

## 3. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 4. Admin Dashboard Modules (`/admin/*`)

| Route | Module | Key Capabilities |
| :--- | :--- | :--- |
| `/admin` | **Overview Dashboard** | 14 live database KPIs, Donation Activity chart, User Registrations chart, Request Status breakdown, Recent Audit Trail, Recent Listings & Requests |
| `/admin/users` | **Users & RBAC** | Search, filter by role/status, inspect user activity history, edit profile, change role (with self-demotion & last-admin safeguards), suspend/activate/delete |
| `/admin/listings` | **Food Listings Moderation** | Search, category/status/flagged filters, flag suspicious/unsafe food with moderation notes, soft-remove (`status = "removed"`), restore |
| `/admin/requests` | **Food Requests & Disputes** | Filter by status/disputes, inspect donor & recipient context, moderate & resolve disputes (`approve`, `reject`, `cancel`, `under_review`) |
| `/admin/volunteers` | **Volunteer Operations** | Monitor volunteer availability, active pickups, completed deliveries, inspect assignment history, assign/reassign volunteers to handovers |
| `/admin/donations` | **Lifecycle Monitor** | Visual 6-stage pipeline tracker (`Listing Created` → `Recipient Requested` → `Donor Decision` → `Volunteer Assigned` → `Food Picked Up` → `Delivered`) |
| `/admin/database` | **Database Explorer** | Read-only sanitized ORM table viewer (`users`, `food_listings`, `donation_requests`, `volunteer_handovers`, `notifications`, `audit_logs`, `platform_settings`) + sanitized CSV export |
| `/admin/audit-logs` | **Immutable Audit Logs** | Searchable, filterable chronological log of all admin mutations with before/after JSON state diff inspector |
| `/admin/notifications` | **Announcements** | Broadcast targeted or platform-wide notifications to Donors, NGOs, Volunteers, or specific users |
| `/admin/settings` | **Platform Settings** | Manage platform name, support contact, default expiry window, notification toggles, registration policy, and maintenance mode |
Full Stop , Lowl
