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
```powershell
pytest --cov=app
```

## Deploy (Render)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set env vars from `.env.example` in Render's dashboard (use your Supabase pooled connection string for `DATABASE_URL`)
