# ANNAPURNA Frontend

React + TypeScript + Vite + Tailwind CSS v4 frontend for the **ANNAPURNA** food-rescue platform, connected to the FastAPI + MySQL backend.

## Features

- Role-isolated workspaces for **Donor**, **NGO**, and **Volunteer** users
- Login & Registration with 3-role selection and quick demo role sign-in
- Donor UI: Overview dashboard, publish/remove surplus food listings, review & accept/reject NGO requests
- NGO UI: Recipient Portal overview, browse & request available surplus food, track request approval status
- Volunteer UI: Dispatch Portal overview, claim available rescue runs, confirm pickup & delivery
- Live community impact dashboard
- Centralized Axios client (`src/lib/api.ts`) with JWT Bearer token authentication

## Run Locally with FastAPI Backend

1. Start the FastAPI + MySQL backend in `/backend` on port `8000`:
   ```bash
   cd ../backend
   uv sync
   uv run python -m app.db.create_tables
   uv run uvicorn app.main:app --reload --port 8000
   ```

2. Start the frontend dev server in `/frontend` on port `5173`:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. Open `http://localhost:5173`. All `/api/*` requests are proxied to `http://127.0.0.1:8000`.
