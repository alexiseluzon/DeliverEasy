# DelivEasy

Delivery & inventory management platform — vendor web dashboard, customer/rider mobile app, FastAPI backend.

**Stack:** Next.js (TS) · Expo (React Native) · FastAPI · SQLAlchemy 2.0 (async) · Supabase (Postgres/Auth/Storage) · Alembic

## Structure
```
apps/web/       Vendor & admin dashboard (Next.js)
apps/mobile/    Customer + rider app (Expo)
backend/        REST API (FastAPI)
```

## Hosting
- Web → Vercel
- Backend → Render
- Database/Auth/Storage → Supabase

## Local setup
See `backend/README.md`, `apps/web/README.md`, `apps/mobile/README.md` (added as each part is scaffolded).

---
Copyright © 2026 [Your Name]. All rights reserved.
This is a personal portfolio project; not intended for production commercial use.
