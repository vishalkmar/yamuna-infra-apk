# Yamuna Infra — Google Play Store Release Guide

Everything needed to take this React Native app from source to a live Play Store
listing. Steps are in the order you should do them.

---

## 0. What is already configured

These were changed to make a Play release possible — you don't need to redo them.

| Setting | Before | Now | Why |
|---|---|---|---|
| `applicationId` | `com.infra` | `com.yamunainfra.app` | Permanent Play identity. `com.infra` was too generic to safely claim. |
| Release signing | debug keystore | `signingConfigs.release` from `android/keystore.properties` | **Play rejects debug-signed uploads.** |
| `versionCode` / `versionName` | `3` / `0.3.0` | `4` / `1.0.0` | First public release. |
| ABIs | `arm64-v8a` only | `armeabi-v7a,arm64-v8a,x86_64` | arm64-only excluded older 32-bit phones. The AAB splits per device, so nobody downloads all three. |
| Chatbot LLM key | shipped inside the app | server-side only | A key in the bundle can be extracted from the AAB by anyone. |

`namespace` stays `com.infra` — that's the Java/Kotlin package for `MainActivity`, and
Play never sees it. Only `applicationId` matters for the listing.

---

## 1. Back up the upload keystore — do this first

```
android/app/yamuna-upload.keystore    the key itself
android/keystore.properties           its passwords
```

Both are **gitignored on purpose**, so cloning the repo does not give you a working
release build. That also means git is not your backup.

**If you lose this keystore you can never update the app again.** Not "it's hard" —
Google cannot re-sign for you; you'd have to publish a brand-new listing under a new
package name and lose every install and review.

Copy both files to at least two places you control — a password manager (1Password,
Bitwarden), and encrypted cloud storage or an offline drive. Do it before you build.

> Enrolling in **Play App Signing** (Play Console offers this on your first upload —
> accept it) gives you one safety net: if the *upload* key is lost, Google can reset it
> because they hold the separate *app signing* key. Take it, but still keep your backups.

---

## 2. Build the release AAB

Play takes an **`.aab` (Android App Bundle)**, not an `.apk`.

```powershell
cd Mobile_app\android
.\gradlew.bat clean
.\gradlew.bat bundleRelease
```

Output:

```
android/app/build/outputs/bundle/release/app-release.aab
```

If Gradle dies with an OOM / heap error, this machine is RAM-starved — close VS Code,
Chrome and Metro first, or raise the heap in `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

Build fails with *"Missing android/keystore.properties"*? That guard is deliberate — it
stops a debug-signed artifact from silently reaching Play. Restore the file from your
backup (§1).

### Test the exact artifact before uploading

An AAB isn't directly installable. Use [bundletool](https://github.com/google/bundletool/releases)
to install the same build a real user would get:

```powershell
java -jar bundletool.jar build-apks `
  --bundle=app\build\outputs\bundle\release\app-release.aab `
  --output=yamuna.apks --connected-device `
  --ks=app\yamuna-upload.keystore --ks-key-alias=yamuna-upload
java -jar bundletool.jar install-apks --apks=yamuna.apks
```

Then walk the app end to end: login/OTP, payments, SOS, chatbot, notifications. Release
builds behave differently from debug (no Metro, minified JS, cleartext HTTP disabled) —
bugs that only appear here are common.

---

## 3. Create the Play Console account

<https://play.google.com/console> — **$25 one-time**, per account, forever.

**Register as an *organization*, not a personal account.** This matters more than it
looks: personal accounts created after Nov 2023 must run a **closed test with at least 12
testers for 14 continuous days** before they may apply for production. Organization
accounts skip that entirely.

Registering as an organization needs a D-U-N-S number (free, ~30 days to issue if you
don't have one) and takes a few days to verify. Start this before you need it — it is
usually the longest pole in the whole release.

---

## 4. Store listing assets

Prepare these before creating the listing; Play blocks submission until all are present.

| Asset | Spec | Notes |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, no transparency | `logo.png` in the repo is the source |
| Feature graphic | 1024×500 PNG/JPG, no transparency | Shown at the top of the listing |
| Phone screenshots | 2–8 images, min 320px, max 3840px, ≤8× aspect | Take from a real release build |
| Tablet screenshots | optional | Only if you declare tablet support |
| Short description | ≤80 chars | |
| Full description | ≤4000 chars | |

Screenshots must show the **actual app** — mockups with invented UI get rejected.

Suggested copy:

> **Short:** Your Vrindavan township companion — payments, services & darshan in one app.
>
> **Full:** Yamuna Infra is the resident app for our Vrindavan township. Track your
> booking and construction progress, pay installments and maintenance online, book
> clubhouse amenities and visitor passes, order meals and tiffin, arrange transport and
> darshan shuttles, request healthcare and mobility help, and reach emergency support
> instantly with SOS. The in-app Vrindavan Companion answers your questions about temple
> timings, community services and your account, any time.

---

## 5. Privacy policy — required, no exceptions

The app requests location and handles personal and payment data, so Play requires a
publicly reachable privacy policy URL before it will accept the listing. Host it on the
existing website (e.g. `https://<your-domain>/privacy`) and paste the URL into
**Policy → App content → Privacy policy**.

It must actually describe: what you collect (name, phone, email, address, location,
payment records), why, who you share it with (Cashfree for payments, Brevo for email,
Cloudinary for media, NVIDIA for chatbot queries), how long you keep it, and how a user
requests deletion.

---

## 6. Data safety form

Under **Policy → App content → Data safety**. Based on what this app actually does:

| Data type | Collected | Shared | Purpose |
|---|---|---|---|
| Name, email, phone | Yes | No | Account management, app functionality |
| Address / property details | Yes | No | App functionality |
| Approximate + precise location | Yes | No | SOS emergency dispatch |
| Payment history | Yes | Yes — Cashfree | Payment processing |
| Health info (companion check-ins) | Yes | No | App functionality |
| Photos / files (documents, dockets) | Yes | No | App functionality |
| In-app messages (chatbot) | Yes | Yes — NVIDIA (LLM provider) | App functionality |

Also declare: data is encrypted in transit, and users can request deletion.

**An inaccurate Data safety form is one of the most common rejection reasons.** It must
match what the code really does — cross-check against the permissions below.

---

## 7. Permission declarations — read this before you submit

`android/app/src/main/AndroidManifest.xml` currently requests:

```
INTERNET, POST_NOTIFICATIONS, VIBRATE,
SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED,
ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
```

Two need attention:

### `USE_EXACT_ALARM` — likely rejection

Google restricts this to apps whose **core purpose** is an alarm clock, calendar, or
timer. A township app with medicine reminders does not qualify, and Play's automated
review flags it.

The fix is to drop it and keep `SCHEDULE_EXACT_ALARM`, which does the same job but asks
the user for permission at runtime:

```xml
<!-- remove this line -->
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
```

Then send users to the system settings screen to grant exact alarms
(`ACTION_REQUEST_SCHEDULE_EXACT_ALARM`) the first time they create a reminder. Notifee
exposes this. If you keep `USE_EXACT_ALARM`, expect to argue your case in a policy
declaration form, and expect to lose.

### Location — prominent disclosure required

`ACCESS_FINE_LOCATION` requires an in-app disclosure **before** the OS permission dialog,
explaining that location is used for SOS emergency dispatch. A screen or dialog saying
so, shown the first time SOS is used, satisfies this. Play reviewers test for it.

The app does **not** request background location, which keeps you out of the much
stricter background-location review — don't add it without a very good reason.

---

## 8. Content rating & other declarations

**Policy → App content**, work top to bottom:

- **Content rating questionnaire** — answer honestly; this app should land at *Everyone*.
- **Target audience** — 18+ (it handles payments and property records). Declaring any
  under-13 audience triggers Families policy and a much harder review.
- **Ads** — declare *No ads*.
- **News app** — No.
- **COVID-19 apps** — No.
- **Government app** — No.
- **Financial features** — the app takes payments for services. Declare *Yes* under
  "does your app have financial features" if asked, but this is **not** a lending or
  banking app, so the heavy financial-services review does not apply.

On Play Billing: payments here are for **physical goods and real-world services**
(property installments, meals, transport, maintenance). Those are explicitly allowed to
use an external processor like Cashfree — Play Billing is only mandatory for digital
content consumed inside the app.

---

## 9. Release track

Do not go straight to production.

1. **Internal testing** — up to 100 testers by email, live in minutes. Use this to verify
   the signed AAB, payments against real Cashfree, and OTP delivery.
2. **Closed testing** — mandatory for personal accounts (12 testers × 14 days). Skip if
   you registered as an organization.
3. **Production** — staged rollout. Start at **20%**, watch crash-free rate and ANRs in
   the Play Console for 24–48 h, then go to 100%. A staged rollout can be halted; a full
   one cannot be taken back.

First review typically takes a few days, and can take up to a week or more for a brand
new developer account.

---

## 10. Before every future update

1. Bump **both** in `android/app/build.gradle`:
   ```gradle
   versionCode 5          // must strictly increase — Play rejects a reused value
   versionName "1.0.1"    // what users see
   ```
2. Move production `.env` / API config to the live values.
3. `.\gradlew.bat clean bundleRelease`
4. Test the AAB with bundletool (§2).
5. Upload → release notes → staged rollout.

---

## 11. Backend checklist (`shared_backend`)

The app is only as ready as the API behind it. Before going live, on the deployment host
(Render), set these environment variables to match `shared_backend/.env`:

```
LLM_MODEL=mistralai/mistral-nemotron
LLM_FALLBACK_MODELS=meta/llama-3.1-8b-instruct,meta/llama-3.1-70b-instruct
LLM_TIMEOUT_MS=12000
```

Editing the local `.env` does **not** change the deployed server — these must be set in
Render's dashboard.

Also switch Cashfree from sandbox to production (`CASHFREE_MODE`, `CASHFREE_APP_ID`,
`CASHFREE_APP_SECRET`, `CASHFREE_API_URL`) once payments are verified. Shipping a
sandbox-configured build means no real money moves.

Verify the AI stack any time from the admin portal:

```
GET /api/admin/ai/health
```

It really calls the provider and reports per-model latency, so a retired model shows up
as a red light instead of a silently dead chatbot.

---

## Quick reference

```powershell
# Build the release bundle
cd Mobile_app\android
.\gradlew.bat clean bundleRelease
#   -> app\build\outputs\bundle\release\app-release.aab

# Build a release APK instead (sideloading / direct distribution, not Play)
.\gradlew.bat assembleRelease
#   -> app\build\outputs\apk\release\app-release.apk

# Inspect what got signed
& "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat" verify --print-certs `
    app\build\outputs\apk\release\app-release.apk
```
