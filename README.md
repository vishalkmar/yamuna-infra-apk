# Yamuna Infra — Customer Experience App

A React Native (JavaScript) mobile app + Express/MySQL backend for the 26-module
Real Estate Customer Experience blueprint (booking → possession → resident
services → AI concierge).

```
infra/
├── App.js                     React Native entry
├── src/                       Frontend source
│   ├── api/                   axios client + per-module API wrappers + mock layer
│   ├── components/            Reusable UI (Button, Input, Card, RadioGroup …)
│   ├── constants/             ENV switches
│   ├── navigation/            Root → Auth | Drawer(Tabs(Stacks))
│   ├── screens/               One folder per phase, plus stubs.js for not-yet-built modules
│   ├── store/                 Redux Toolkit store + slices
│   ├── theme/                 Palette, spacing, radius, typography, Paper theme
│   └── utils/                 toast, validation (Yup), formatters
└── server/                    Express + MySQL backend
    ├── migrations/            SQL schema + seed data
    └── src/
        ├── config/            env.js, db.js (mysql2 pool)
        ├── controllers/       Thin HTTP layer
        ├── middleware/        auth (JWT), validate (Joi), error
        ├── models/            DB access layer
        ├── routes/            Express routers, mounted at /api/*
        ├── services/          Business logic (auth, sms)
        ├── utils/             AppError, asyncHandler, response helpers
        └── scripts/migrate.js Runs all .sql files in /migrations
```

---

## 1 · Prerequisites

| Tool       | Version             | Notes                                     |
| ---------- | ------------------- | ----------------------------------------- |
| Node.js    | ≥ 22.11 (frontend), ≥ 18 (backend) | Use the same version everywhere |
| npm        | ≥ 10                |                                           |
| MySQL      | ≥ 8.0               | Local install or Docker                   |
| Android SDK / Xcode | Latest     | For running the RN app on a device        |

---

## 2 · Backend setup

```bash
cd server
cp .env.example .env       # fill in DB password + JWT_SECRET
npm install
npm run migrate            # creates DB + tables + seed
npm run dev                # starts on http://localhost:4000
```

Verify it's up:

```bash
curl http://localhost:4000/api/health
# → { "status": "ok", "uptime": 1.234 }
```

OTP login flow (the demo SMS provider just logs to console):

```bash
# 1. request OTP
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'

# 2. check the server console for the OTP, then verify
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456"}'

# 3. use the returned token
curl http://localhost:4000/api/booking/BK-2024-00421 \
  -H "Authorization: Bearer <token>"
```

### Implemented endpoints

| Module       | Method | Path                                           |
| ------------ | ------ | ---------------------------------------------- |
| Auth         | POST   | `/api/auth/send-otp`                           |
| Auth         | POST   | `/api/auth/verify-otp`                         |
| Auth         | GET    | `/api/auth/me`                                 |
| Booking      | GET    | `/api/booking/mine`                            |
| Booking      | GET    | `/api/booking/:bookingId`                      |
| Booking      | GET    | `/api/booking/:bookingId/documents`            |
| Booking      | GET    | `/api/booking/:bookingId/documents/:docId/download` |
| Payment      | GET    | `/api/payment/schedule/:bookingId`             |
| Payment      | GET    | `/api/payment/history/:bookingId`              |
| Payment      | POST   | `/api/payment/initiate`                        |
| Payment      | POST   | `/api/payment/verify`                          |

The remaining 21 modules from the blueprint are stubbed in
`server/src/routes/index.js` (commented), with matching DB tables already
present in the migration. Follow the same Model → Service → Controller → Route
pattern when adding them.

---

## 3 · Frontend setup

```bash
cd ..             # back to repo root
npm install       # already done if you followed earlier steps
npm start         # starts Metro bundler

# in another shell:
npm run android   # or npm run ios
```

By default the app runs against the **mock API** layer
(`src/constants/env.js` → `USE_MOCK_API: true`) so it works without the
backend. To hit the real backend, flip the flag:

```js
// src/constants/env.js
USE_MOCK_API: false,
API_BASE_URL: 'http://10.0.2.2:4000/api',  // Android emulator → host
// For iOS simulator use 'http://localhost:4000/api'
// For a physical device use your machine's LAN IP
```

### Demo credentials

| Field   | Value     |
| ------- | --------- |
| Mobile  | any 10-digit number starting with 6-9 |
| OTP     | `123456` (mock) or whatever the backend logs to console |

---

## 4 · What's complete vs stubbed

✅ **Foundation (production-ready):**

- Auth flow (Splash, Login, OTP) with form validation + redux state
- Navigation: Root → Auth | Drawer → Tabs (Home / Services / Community / Profile) → Stacks
- Reusable components: Button, Input, Card, RadioGroup, StatusChip, SectionHeader, ScreenContainer
- Theme system, toast config, axios + interceptors, mock API switch
- Redux store with persistence, axios JWT interceptor, validation schemas

✅ **2 modules fully implemented:**

- **Module 1 — Booking Docket** (Details / Documents / Welcome Kit / RM Contact tabs)
- **Module 2 — Payment Dashboard** (Upcoming / History / Ledger tabs + Pay Now sheet with full Razorpay-ready form)

📦 **24 modules scaffolded as stubs** — each has its own screen + nav entry +
api file slot. Replace the `ModuleStub` placeholder with the real UI when ready.

✅ **Backend:**

- Express MVC with Joi validation, JWT auth, rate-limiting, error handling
- MySQL pool + full 30-table schema (every blueprint module mapped to tables)
- Migration runner with seed data
- Auth + Booking + Payment fully wired

---

## 5 · Adding a new module — the playbook

Take **Site Visit** as the example. Follow these steps to bring any of the
stubbed modules to life:

### Backend

1. `server/src/models/SiteVisitModel.js` — DB access
2. `server/src/controllers/siteVisitController.js` — HTTP layer
3. `server/src/routes/siteVisitRoutes.js` — Joi schemas + endpoints
4. Mount it in `server/src/routes/index.js`:
   ```js
   router.use('/site-visit', siteVisitRoutes);
   ```

### Frontend

1. `src/api/siteVisitApi.js` — wrap axios calls (with `USE_MOCK_API` switch)
2. Replace the stub at `src/screens/stubs.js` `SiteVisitScreen` with a real
   screen file at `src/screens/sitevisit/SiteVisitScreen.js`
3. Update the import in `src/navigation/HomeStack.js`
4. (Optional) Add a redux slice if the data needs to be shared across screens
5. Use the existing components (`Input`, `Button`, `RadioGroup`) + a Yup schema
   from `src/utils/validation.js` to build the form

---

## 6 · Integration TODOs (production hardening)

- **OTP**: swap `services/smsService.js` console provider for MSG91/Twilio
- **Payments**: complete Razorpay HMAC signature verification in `paymentController.verify`
- **File storage**: replace local `storage_path` with S3/GCS signed URLs in
  document download
- **FCM**: install `@react-native-firebase/messaging`, wire token registration
  on login, add notifications table writes server-side
- **Maps / Razorpay / Voice**: install respective RN SDKs once API keys are ready
- **Assets**: pull logo + app icon from the shared Drive folder into `src/assets/`

---

## 7 · Helpful commands

```bash
# Frontend
npm start                      # Metro bundler
npm run android                # build + install on Android device/emulator
npm run ios                    # iOS simulator (macOS only)
npm test                       # Jest
npm run lint                   # ESLint

# Backend
cd server
npm run dev                    # nodemon hot-reload
npm start                      # production node
npm run migrate                # apply DB schema + seed
```
