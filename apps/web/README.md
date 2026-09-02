# DelivEasy — Web (Next.js)

Vendor/admin dashboard: catalog management, order tracking.

## Setup (PowerShell)
```powershell
cd apps/web
npm install
Copy-Item .env.example .env.local
npm run dev
```
App: http://localhost:3000 (requires backend running on :8000)

## Tests
```powershell
npm test              # unit (Jest + Testing Library)
npm run test:e2e      # e2e (Playwright, requires dev server)
```

## Deploy (Vercel)
- Root directory: `apps/web`
- Env var: `NEXT_PUBLIC_API_URL` → your Render backend URL + `/api/v1`

---
Copyright © 2026 [Your Name]. All rights reserved.
