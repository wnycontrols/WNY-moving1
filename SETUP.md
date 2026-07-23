# Going Live — Setup Guide

Follow these steps once and your availability calendar becomes a live website (and phone app) where every employee signs in with their **own email and password**. Nobody without an account — and nobody without your **invite code** — can get in.

Everything here uses the **free** tiers of Firebase (Google) and GitHub. Budget about 15–20 minutes.

---

## Part 1 — Create your Firebase project (the "backend")

Firebase is Google's app platform. It stores your data, handles logins, and keeps passwords secure (they're hashed by Google — even you can't see them).

1. Go to <https://console.firebase.google.com> and sign in with a Google account (your `wnycontrols@gmail.com` works).
2. Click **Create a project** → name it `wny-moving` → you can turn **off** Google Analytics → **Create project**.

### Step 2: Get your config and paste it into the app

1. On the project overview page, click the **`</>` (Web)** icon to add a web app. Nickname: `wny-calendar`. Don't check "Firebase Hosting" for now. Click **Register app**.
2. You'll see a code block containing `firebaseConfig = { apiKey: "...", ... }`.
3. Open the file **`firebase-config.js`** in this project and replace the placeholder values with yours (keep the same format). Commit/upload the change.

> These config values are **safe to publish** — they only identify your project. Security is enforced by the rules in Part 1, Step 4.

### Step 3: Turn on email/password sign-in

1. In the left menu: **Build → Authentication** → **Get started**.
2. Choose **Email/Password** → toggle **Enable** → **Save**.

### Step 4: Create the database and paste the security rules

1. Left menu: **Build → Firestore Database** → **Create database** → choose **Production mode** → pick the location closest to you (e.g. `us-east4`) → **Enable**.
2. Open the **Rules** tab, delete what's there, and paste the entire contents of the **`firestore.rules`** file from this project. Click **Publish**.

These rules are what make it secure:
- Only signed-in team members can see the calendar.
- Each employee can only edit **their own** availability, name, and color.
- Only admins (you) can edit everyone, remove employees, and change settings.
- New accounts only work with the correct invite code.

### Step 5: Create your company settings (invite code + admin)

1. Still in Firestore, open the **Data** tab → **Start collection**.
2. Collection ID: `settings` → Next.
3. Document ID: `company` (type it exactly, lowercase).
4. Add two fields:
   - Field `inviteCode`, type **string**, value: pick a code, e.g. `WNY2026` (this is what you'll give employees so they can join).
   - Field `adminEmails`, type **array**, then add a string element with **your email in lowercase**, e.g. `wnycontrols@gmail.com`.
5. Click **Save**.

---

## Part 2 — Put the site online (hosting)

The easiest option since this code is already on GitHub:

### GitHub Pages (free)

1. Go to your repository on <https://github.com> → **Settings** → **Pages**.
2. Under **Build and deployment**, Source: **Deploy from a branch** → Branch: `main` (merge this branch into `main` first), folder `/ (root)` → **Save**.
3. In a minute or two your site is live at `https://<your-username>.github.io/WNY-moving1/`.

> Note: free GitHub Pages requires the repository to be **public**. That's fine — your data is NOT in the repository; it lives in Firebase behind logins. If you'd rather keep the repo private, use Firebase Hosting (also free): install Node.js, run `npm i -g firebase-tools`, `firebase login`, `firebase init hosting` (public directory: `.`), then `firebase deploy`.

### Authorize your site's address in Firebase

1. Firebase console → **Authentication → Settings → Authorized domains**.
2. Make sure your site's domain (e.g. `your-username.github.io`) is listed; click **Add domain** if not.

---

## Part 3 — First sign-in and inviting your team

1. Open your live site. Tap **Create Account** — use the **same email you put in `adminEmails`** (lowercase), pick a password, enter your invite code. You're now the admin (you'll see `· admin` in the header and a ⚙ settings button).
2. Text your employees the **site link** and the **invite code**. Each of them taps **Create Account**, enters their name, their own email, their own password, and the code. They instantly appear on the calendar with their own color.
3. Everyone marks their own days; you can mark and manage everyone's.

### On phones — install it like an app

- **iPhone**: open the site in Safari → Share button → **Add to Home Screen**.
- **Android**: open the site in Chrome → menu (⋮) → **Add to Home screen** (or the "Install app" prompt).

It opens full-screen with the WNY icon, just like a native app.

---

## Ongoing management

| Task | How |
|---|---|
| Change the invite code | ⚙ settings in the app (admin only) |
| Add another admin | ⚙ settings → add their email (lowercase, one per line) |
| Remove an employee | Click the **×** on their chip (admin only), then also delete their login: Firebase console → Authentication → Users → ⋮ → Delete |
| Employee forgot password | They tap **Forgot password?** on the sign-in screen — Google emails them a reset link |
| Change someone's availability for them | As admin, select their chip (desktop) or tap the day and tap their name (phone) |

## Security notes

- Passwords are stored and verified by Google Firebase — hashed, never visible to anyone, protected against brute-force attempts.
- The invite code only gates **joining**; change it whenever you want (e.g. after someone leaves). Existing accounts keep working.
- When someone leaves: remove them in the app **and** delete their user in Firebase Authentication so they can't sign in at all.
- The free Firebase tier (50,000 reads / 20,000 writes per day) is far more than a small team will ever use, so expect $0/month.
