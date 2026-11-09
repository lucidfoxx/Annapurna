# ANNAPURNA Backend (FastAPI + SQLAlchemy 2.0 + MySQL + Alembic + `uv`)

## Quick Start with `uv`

```bash
cd backend
cp .env.example .env

# 1. Sync environment dependencies
uv sync

# 2. Apply database schema migrations
uv run alembic upgrade head

# 3. Initialize tables & default non-admin demo accounts
uv run python -m app.db.create_tables

# 4. Promote or create your Administrator account
uv run python -m app.db.promote_admin --email admin@annapurna.org --name "Platform Admin" --password "SecureAdminPass123!"

# 5. Start the FastAPI server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Running Automated RBAC & API Tests

```bash
cd backend
uv run pytest
```
