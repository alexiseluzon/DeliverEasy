# DelivEasy — Backend (FastAPI)

## Setup (PowerShell)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env   # then fill in your Supabase connection string
```

## Run
```powershell
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

## Migrations
```powershell
alembic revision --autogenerate -m "init tables"
alembic upgrade head
```

## Tests
Tests run against a **separate** Supabase project so they never touch production data —
the suite truncates all app tables after every run.

```powershell
Copy-Item .env.test.example .env.test   # fill in a separate test Supabase project
$env:ENV_FILE = ".env.test"
alembic upgrade head                     # apply schema to the test DB once
pytest --cov=app
```

## Deploy (Render)
1. Push this repo to GitHub if you haven't already.
2. On [render.com](https://render.com) → New → Web Service → connect your GitHub repo.
3. Set:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in Render's dashboard (values from your `.env`, **not** the file itself):
   - `DATABASE_URL` — your Supabase pooled connection string
   - `JWT_SECRET_KEY` — a strong random value (not the dev placeholder)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — if used
   - `ALLOWED_ORIGINS` — your deployed web app's URL once you have it (e.g. `https://your-app.vercel.app`); comma-separate multiple origins
5. Deploy. Render assigns a URL like `https://your-service.onrender.com` — note it for the web/mobile `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL`.

The start command runs migrations automatically on every deploy, so the production schema always matches the latest code — no manual `alembic upgrade head` step needed after the first deploy.

**Free tier note**: Render's free web services spin down after inactivity and take ~30–60s to wake on the next request — normal, not a bug, if your first request after idle time is slow.