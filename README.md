# WNY Moving — Employee Availability Calendar

A black-and-white, dark-mode availability calendar where each employee signs in with their own email and password and marks the days they can work. Built mobile-first — it installs on phones like an app.

## Two versions in this repo

| File | What it is |
|---|---|
| `index.html` | **The live app.** Sign-in with email/password, shared realtime database, per-person permissions. Requires the one-time Firebase setup in [`SETUP.md`](SETUP.md). |
| `offline.html` | A no-setup demo that stores data only in your own browser. Good for trying the interface. |

## Features

- **Individual logins** — every employee has their own email + password (handled by Google Firebase Auth; passwords are hashed and never visible)
- **Invite-code signup** — only people with your company invite code can create an account; change the code anytime
- **Permissions** — employees can only edit *their own* days, name, and color; admins can edit everyone, remove employees, and change settings
- **Live sync** — changes appear on everyone's screen in real time
- **Per-employee colors** — auto-assigned, changeable via a palette or any custom color
- **Three availability states** per day, in the employee's color: Available (solid), Partial (striped), Unavailable (outlined, struck through)
- **Daily headcount** — each day shows how many people are available
- **Phone app** — add to home screen (PWA) with a full-screen black UI, big touch targets, and a tap-to-edit day sheet
- **Black & white dark mode** throughout; color is used only to identify people

## Getting it live

Follow [`SETUP.md`](SETUP.md) — about 15 minutes, free:

1. Create a Firebase project (Google's app platform) and paste its config into `firebase-config.js`
2. Enable Email/Password authentication
3. Create the Firestore database and publish `firestore.rules`
4. Create the `settings/company` document with your invite code and admin email
5. Host the site (GitHub Pages or Firebase Hosting) and share the link + invite code with your team

## Project files

- `index.html` — the entire app (UI + logic)
- `firebase-config.js` — where your Firebase project config goes
- `firestore.rules` — database security rules (enforced server-side by Google)
- `manifest.webmanifest`, `sw.js`, `icons/` — phone-app (PWA) support
- `SETUP.md` — step-by-step go-live guide
- `offline.html` — standalone local-only demo
