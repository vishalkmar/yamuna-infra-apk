# Yamuna Infra — Build Context

Single source of truth for "what's done, what's next, why". Read this before
resuming any module — your conversation context may have been compressed.

The blueprint PDF (`RealEstate_App_Blueprint.pdf` in the user's Drive) defines
**26 modules** across 3 phases. We build them one at a time, **end-to-end**
(backend → frontend → tests → demo state) before moving on.

---

## Module status

| # | Module                                | Phase | Status     |
|---|---------------------------------------|-------|------------|
| 0 | Auth + Foundation (nav, theme, mocks) | —     | ✅ Done    |
| 1 | Booking Docket & Welcome Kit          | 1     | ✅ Done    |
| 2 | Payment & Billing Dashboard           | 1     | ✅ Done    |
| 3 | Invoice & Document Repository         | 1     | ✅ Done    |
| 4 | Construction Progress Tracker         | 1     | ✅ Done    |
| 5 | Site Visit & Virtual Tour Booking     | 1     | ✅ Done    |
| 6 | Customer Support & Service Desk       | 1     | ✅ Done    |
| 7 | Digital Possession Dashboard          | 2     | ✅ Done    |
| 8 | Home Inspection & Snag Management     | 2     | ✅ Done    |
| 9 | Move-In Assistance                    | 2     | ✅ Done    |
| 10| Home Cleaning Scheduler               | 3     | ✅ Done    |
| 11| Housekeeping & Domestic Assistance    | 3     | ✅ Done    |
| 12| Cook Booking                          | 3     | ✅ Done    |
| 13| Meal Ordering Service                 | 3     | ✅ Done    |
| 14| Emergency SOS Assistance              | 3     | ✅ Done    |
| 15| Doctor & Healthcare Booking           | 3     | ✅ Done    |
| 16| Wheelchair & Mobility Assistance      | 3     | ✅ Done    |
| 17| Ayurvedic Wellness & Spa              | 3     | ✅ Done    |
| 18| Spiritual Concierge Services          | 3     | ✅ Done    |
| 19| Vrindavan Temple Directory            | 3     | ✅ Done    |
| 20| Darshan & Transport Booking           | 3     | ✅ Done    |
| 21| Resident Community Portal             | 3     | ✅ Done    |
| 22| Visitor Management System             | 3     | ✅ Done    |
| 23| Clubhouse & Amenity Booking           | 3     | ✅ Done    |
| 24| Exclusive Resident Benefits           | 3     | ✅ Done    |
| 25| New Project & Investment Opportunities| 3     | ✅ Done    |
| 26| AI Concierge & My Vrindavan Companion | 3     | ✅ Done    |
| 27| Resident Profile (details/prefs/family/KYC) | 4 | ✅ Done    |
| 28| Configurable AI Concierge (RAG admin)  | 4   | 🔜 Planned |
| 29| Reminders 2.0 (any category + device alarms) | 4 | ✅ Done* |
| 30| App Settings (language/privacy/access) | 4   | ✅ Done    |
| 31| SOS Management (contacts + auto dispatch) | 4 | ✅ Done* |
| 32| Service offerings drill-down (provider→items) | 4 | ✅ Done |
| 33| Cashfree checkout on bookings           | 4   | ✅ Done    |
| 34| Darshan & Transport (Ola/Uber-style)    | 4   | ✅ Done    |
| 35| Food Ordering (mini food app)           | 4   | ✅ Done    |
| 36| Notifications feed                      | 4   | ✅ Done    |

> **Phase 4** = post-blueprint enhancements requested by the client after the
> 26-module build. Built one module at a time, same end-to-end checklist.

---

## Phase 4 mandates (post-blueprint)

### Module 27 — Resident Profile ✅ Done
Dynamic Profile Details screen replacing the old stub. Sections: **Personal
details**, **Preferences** (language, dietary, contact channels, festival
alerts), **Family members** (add/edit/remove), **KYC** (submit + status chip).
Mock-first: `src/api/profileApi.js`, `mockApi.getProfile/...`, `profileSlice`,
`ProfileDetailsScreen` + 4 sheets, `utils/profile.js` (pure `profileCompletion`).
Backend `/profile/*` endpoints are stubbed in the API client but NOT yet built.

### Module 28 — Configurable AI Concierge (RAG) 🔜 THE BIG ONE
The Vrindavan Companion chatbot must become a **fully admin-configurable RAG
system**. Target architecture (permanent):
- **Admin console** to manage the knowledge base: upload **PDFs**, connect a
  **DB**, attach **documents**, and add **instruction/prompt** snippets.
- Backend **ingestion + embeddings** (env already has `EMBEDDINGS_*`, NVIDIA
  `nv-embedqa-e5-v5`) → **vector store** → retrieval injected into the chat
  prompt. Per-tenant/per-community knowledge bases.
- Chat served via backend `/ai/chat` so the **LLM key never ships in the app**.
- Falls back to the built-in rule-based replies when unconfigured.

**INTERIM (shipped now):** the app calls NVIDIA NIM (OpenAI-compatible) DIRECTLY
from `src/api/llm.js`, keyed by `ENV.LLM.apiKey` in `src/constants/env.js`
(grounded by a static Vrindavan system prompt — no retrieval yet). This ships
the key inside the build → demo-only, to be replaced by the backend RAG design
above. The chat UI now lives in a **global floating 🤖 button** beside SOS
(`FloatingChatButton`), not inside the Companion screen.

### Module 29 — Reminders 2.0 ✅ Done* (*needs one APK rebuild)
Companion reminders generalised beyond medicine to **any category** (medicine,
payment/EMI, home service, darshan, booking, other) via `REMINDER_CATEGORIES`.
Time is set/shown in **12-hour AM/PM** (`utils/reminders.js`: `parse24`,
`to24`, `to12hLabel`, `nextOccurrenceMs` — all unit-tested). Real **device
alarms** via `@notifee/react-native` (v9.1.8): `src/services/notifications.js`
(`ensureNotifPermission`, `scheduleReminder`, `cancelReminder`,
`rescheduleAll`). The Companion screen reschedules whenever the reminder list
changes; the new `ReminderSheet` replaced `MedicationReminderSheet`.

- Manifest perms added: `POST_NOTIFICATIONS`, `VIBRATE`, `SCHEDULE_EXACT_ALARM`,
  `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`.
- `notifications.js` lazy-requires notifee + try/catches everything, so the JS
  **no-ops gracefully on the current build** (and in Jest) — reminders won't
  ring until the native module ships.
- **REBUILD REQUIRED** (notifee is native). On the low-RAM PC: close all apps,
  then from plain PowerShell:
  `cd android; .\gradlew assembleRelease` (config already arm64-only, 1 worker).
- Device must be on **IST** for "Indian time"; alarms use device local time.
- Android 12+ exact alarms: if the OS blocks exact timing, grant "Alarms &
  reminders" for the app in system settings (perms are declared).

### Module 30 — App Settings ✅ Done
Settings stub replaced by `src/screens/settings/SettingsScreen.js` +
`settingsSlice` + `settingsApi` + `mockApi.getSettings/updateSettings`.
Sections: **Language** (en/hi), **Notifications** (master + per-type toggles),
**Privacy** (profile visibility, analytics, biometric lock), **App access**
(opens system permission settings via `Linking.openSettings`), **About**
(version from package.json, Terms/Privacy links). Auto-saves on each change.

### Module 32 — Service offerings drill-down ✅ Done
Provider cards (cleaning / housekeeping / cook) are now **clickable categories**
→ `ProviderOfferingsScreen` lists that provider's bookable **offerings**
(generated from `_OFFERING_TEMPLATES` × `priceFrom` in mock, attached by
`getServiceProviders`), each with its own price + **Book now**. Same pattern
extends to the other service screens later (healthcare/wellness/etc. are already
catalog-style). Booking record now stores `offeringName` + `amount`.

### Module 33 — Cashfree checkout on bookings ✅ Done
Extracted the Payments WebView checkout into reusable
`src/components/CashfreeCheckout.js` (Payments dashboard now imports it too).
`ServiceBookingSheet` now: book → if priced, `paymentApi.initiate` → open
Cashfree checkout → `verify` → confirm. **Real Cashfree sandbox opens only with
the backend running** (`USE_MOCK_API=false`, creds already in `server/.env`); in
mock mode the checkout shows the placeholder link. Wire the same component into
amenity/other booking flows the same way.

### Module 34 — Darshan & Transport (Ola/Uber-style) ✅ Done
`TransportScreen` (the "Darshan" route now points here, not SpiritualScreen).
Pickup/drop via `LocationPicker` (curated `_VRINDAVAN_PLACES` with coords +
free-text search + "Use current location" through the guarded geolocation
service) → `transportSlice.loadEstimate` → vehicle options (auto / mini / sedan
/ shared bus) with **distance-based fares** (`utils/transport.js`: `haversineKm`,
`fareFor`, `estimateOptions` — unit-tested) → **Pay fare via Cashfree** (reuses
`CashfreeCheckout`) → ride saved, "My rides" list. Quick temple-drop chips.
Mock: `getTransportPlaces / getVehicleEstimates / bookRide / getMyRides`.

- **No map view** and **no native rebuild** for this module (geolocation already
  shipped with Module 31). A live map would need `react-native-maps` + Maps key.
- **Live Google Places**: set a real `ENV.GOOGLE_MAPS_KEY` and back
  `transportApi.places` with the Places Autocomplete API; the UI already routes
  through it. Until then the curated Vrindavan list is used.
- Distances use straight-line haversine (good enough for fare preview); a real
  Distance Matrix call can replace it server-side later.
- No driver app — booked rides land with us (status `confirmed` in mock).

### Module 35 — Food Ordering (mini food app) ✅ Done
Meal tab revamped into a food-delivery app: `MealOrderScreen` shows food
**categories** (image + icon) → `FoodCategoryScreen` lists **items with images**,
veg dot, rating, price + ADD/qty steppers → `CartBar` (sticky) → `CartScreen`
(qty edit, item total + delivery fee + grand total) → **Cashfree** payment →
order placed → "My orders". State in `foodSlice` (catalog thunks + cart
reducers); pure cart math in `utils/cart.js` (unit-tested). Mock: `getFoodCategories
/ getFoodItems / placeFoodOrder / getFoodOrders` with `_FOOD_CATEGORIES` +
`_FOOD_ITEMS` (picsum images). Monthly tiffin subscription still reachable via
the existing `MealOrderSheet`.

### Module 36 — Notifications feed ✅ Done
`NotificationsScreen` (real, replaces the stub in Home + Profile stacks) — feed
with unread highlight, mark-one/all-read, time-ago, per-type icons. Mock
`getNotifications`. `src/screens/stubs.js` deleted (all stubs now real).

### Crash fixes + reminder alarm (this round)
- **Crash on ProfileDetails / SOS Management**: sheet `defaults(null)` threw
  (`= {}` default only covers `undefined`). Call sites now pass `x || {}`.
- **Reminders silent**: Android channels are immutable, so the old silent
  channel stuck. Bumped to `reminders-alarm-v2` with sound + `vibrationPattern`,
  and the notification now uses `loopSound`, `lightUpScreen`, `fullScreenAction`,
  `AndroidCategory.ALARM` → rings + vibrates like an alarm.

### Module 31 — SOS Management ✅ Done* (*needs the same APK rebuild)
Profile → **SOS Management** (`SosManagementScreen`) — Android-style add/edit/
remove **persons** (name, email, phone) via `SosPersonSheet`, stored through
the existing `sosSlice` contacts (now carry `email`). On SOS (floating button
**and** SOS screen): capture **location** and dispatch.

- **Location**: `@react-native-community/geolocation` (native, guarded in
  `src/services/location.js`) + `ACCESS_FINE/COARSE_LOCATION` manifest perms.
- **Dispatch** (`src/services/sos.js` → `sosApi.dispatch`): builds a Google
  Maps link + message (`utils/sosDispatch.js`, unit-tested) and sends to every
  person. **Email is real** via the backend `POST /api/sos/dispatch`
  (`server/src/services/emailService.js`, **nodemailer** + `SMTP_*` from
  `server/.env`). **SMS/WhatsApp** go through the existing pluggable gateway
  (console in dev → swap for a real SMS gateway / WhatsApp Business API for
  true auto-send). SOS Management also has per-person **WhatsApp/SMS** buttons
  that open the apps with the location pre-filled (real device send, one tap).
- Mock mode simulates the dispatch summary so the flow is verifiable in-app
  without the server; run the Node server for real emails.
- **Same APK rebuild** as Module 29 covers geolocation (already npm-installed).
  Grant Location permission on first SOS.

---

## Per-module delivery checklist

For each module we always do, in this order:

1. **Migration `00X_moduleN_xxx.sql`** — schema additions + seed
2. **Backend Model** — pure DB layer
3. **Backend Middleware** — ownership / access (if needed)
4. **Backend Controller** — thin HTTP layer
5. **Backend Routes** — Joi validation, mount in `routes/index.js`
6. **Backend smoke test** — curl all endpoints + edge cases (validation, ownership)
7. **Frontend API client** (`src/api/xxxApi.js`) — with mock + real switch
8. **Frontend mock data** updated in `src/api/mock.js`
9. **Frontend Slice** (`src/store/slices/xxxSlice.js`) — thunks + reducers
10. **Frontend reusable components** if needed
11. **Frontend Screen** — replace stub
12. **Wire into `src/navigation/*Stack.js`** and remove from `stubs.js`
13. **Frontend Jest test** — slice reducers + any pure helpers
14. **Final lint + jest run** — must end with 0 errors
15. **Mark module complete in this file**

---

## Architecture decisions (cement them)

- **Frontend**: React Native CLI 0.85, **JavaScript only** (no TS). Default
  `USE_MOCK_API=true` so the app works without a backend; flip in
  [src/constants/env.js](src/constants/env.js) for real backend testing.
- **Backend**: Express MVC, mysql2 pool. Folders: `config/`, `middleware/`,
  `models/`, `controllers/`, `routes/`, `services/`, `utils/`.
- **Auth**: OTP → JWT (7d). User auto-registered on first verified login.
  `users.primary_booking_id` synced from `booking_owners` after each verify.
- **Auth navigation (release-critical)**: RootNavigator shows `<SplashScreen/>`
  while a `booting` flag is true, then **conditionally renders** AuthStack OR
  MainDrawer from `isLoggedIn`. NEVER `navigation.reset`/navigate to those
  conditional routes (Splash/OTP/logout) — that combo renders blank after splash
  in release/Hermes. Login = let `isLoggedIn` flip; logout = just `dispatch(logout())`.
- **Ownership boundary**: every per-booking route runs through
  `ensureBookingOwner` middleware (Module 1+). Every per-project route runs
  through `ensureProjectAccess` (Module 4+).
- **Payments**: **Cashfree PG v3** (NOT Razorpay) — env supports both
  `CASHFREE_SECRET_KEY` and `CASHFREE_APP_SECRET` naming.
- **Webhooks**: raw body capture in `app.js` for HMAC verification.
- **Migrations**: idempotent via `schema_migrations` tracker. Each migration
  file runs at most once (checksummed).
- **Tests**: Jest. Frontend in `__tests__/`, backend in `server/__tests__/`.
  Frontend root `npm test` finds both.

---

## Live DB

- Host: `37.122.148.188:3306`, DB `iccictor_infra` (shared cPanel host).
- Sometimes hits ETIMEDOUT — retry once.
- For debugging, use the server's existing pool via
  `server/__tmp__/fetch_otp.js`-style helpers (new direct connections often
  get throttled).

## Seed test user

- mobile `9876543210` → user id 1 → Piyush Sharma → owns booking `BK-2024-00421`
- mobile `9999999999` → auto-created by tests, NO bookings → used for 403 tests
- OTP gateway in dev = console (logs to server stdout / saved in `otps` table)

---

## Build environment (machine constraint)

- **3.4 GB RAM total, ~200 MB free** at any time on user's PC.
- **Gradle release/debug builds OOM** because IDEs (VSCode ×3, Claude Code) +
  Memory Compression eat ~1 GB.
- Workaround for APK: user closes all apps, runs from plain PowerShell:
  ```
  cd C:\Users\Vishal\Desktop\infra\infra\android
  .\gradlew assembleRelease
  ```
- `android/gradle.properties` set to: `Xmx2048m`, `arm64-v8a` only,
  `parallel=false`, `workers.max=1`.

---

## Cumulative test count (must keep growing)

| Module done | Total tests passing |
|---|---|
| Module 1 | 25 |
| Module 2 | 45 |
| Module 3 | 58 |
| Module 4 | 91 (75 FE + 16 BE)  |
| Module 5 | 119 (85 FE + 34 BE) |
| Module 6 | 142 (94 FE + 48 BE) |
| Module 7 | 156 (99 FE + 57 BE) |
| Module 8 | 174 (105 FE + 69 BE)|
| Module 9 | 191 (112 FE + 79 BE)|
| Module 10| 203 (118 FE + 85 BE)|
| Module 11| 209 (121 FE + 88 BE)|
| Module 12| 216 (125 FE + 91 BE)|
| Module 13| 229 (131 FE + 98 BE)|
| Module 14| 246 (138 FE + 108 BE)|
| Module 15| 268 (146 FE + 122 BE)|
| Module 16| 284 (156 FE + 128 BE)|
| Module 17| 301 (163 FE + 138 BE)|
| Module 18-20| 313 (170 FE + 143 BE)|
| Module 21-23| 329 (178 FE + 151 BE)|
| Module 24-26| 362 (190 FE + 172 BE)|
| **ALL 26 DONE** | **362 — 🎉 blueprint complete** |

`npm run lint` must end with 0 errors (stylistic warnings OK).

---

## Tone

User speaks Hinglish; respond in same register. Keep summaries tight, no
trailing fluff. Always state results, never narrate process.
