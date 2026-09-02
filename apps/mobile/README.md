# DelivEasy — Mobile (Expo)

Customer/rider app: browse catalog, track orders, push notifications on order status changes.

## Setup (PowerShell)
```powershell
cd apps/mobile
npm install
Copy-Item .env.example .env
npx expo start
```
Scan the QR code with Expo Go, or press `a` / `i` for an emulator.

> Push notifications only work on a **physical device** — simulators/emulators skip registration silently (see `src/lib/notifications.ts`).

## Tests
```powershell
npm test
```

## Build (EAS)
```powershell
npm install -g eas-cli
eas login
eas build:configure          # sets your real EAS project id in app.json
eas build --platform android --profile preview
```

## Notes
- `expo-notifications` requests permission on launch and grabs an Expo push token — send that token to your backend (`users` table) so the API can target devices when an order status changes.
- For SMS (delivery alerts, OTP) use Twilio from the **backend**, never from the client — keep the auth token server-side.

---
Copyright © 2026 [Your Name]. All rights reserved.
