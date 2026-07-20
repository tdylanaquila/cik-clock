# CIK Clock

A time clock for Cast Iron Kitchen. Runs on an iPad in the kitchen. Staff tap a
4-digit PIN, pick their job, and clock in/out. Works fully offline. Syncs to a
Google Sheet when online.

- Big keypad, plain language, no clutter for staff.
- Manager console behind a master PIN (default `1957`).
- All data stored locally first (localStorage). Optional sync to Google Sheets.
- Installable to the iPad home screen as a PWA.

---

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The whole app. This is the only file you'd ever edit. |
| `manifest.webmanifest` | Tells iPad it's an installable app. |
| `sw.js` | Service worker — makes it work offline after first load. |
| `apps-script.gs` | The Google Apps Script code to paste into your Google Sheet. |
| `icon-*.png` | App icons for iPad home screen and Android. |
| `vercel.json` | Tells Vercel how to serve the app (small tweaks). |
| `.gitignore` | Files git should ignore. |
| `README.md` | This file. |

---

## Part 1 — Quick local test (optional but recommended)

Before deploying, make sure it opens on your Mac.

Just double-click `index.html`, or open a Terminal in this folder and run:

```
open index.html
```

You'll see the keypad. Tap `1003` (Cheryl's placeholder PIN) → pick a job →
you'll see the "Thanks Cheryl, you're clocked in" screen. Tap `1003` again to
clock out.

To open the manager console, type `1957` on the keypad. From there you can
change PINs, edit wages, and paste your Google Sheet sync URL.

> Note: opening the file directly (`file://`) won't fully register the service
> worker — that only kicks in once it's hosted on Vercel. That's fine for
> testing the UI locally.

---

## Part 2 — Set up the Google Sheet sync (do this before or after deployment)

You only need this once. If you skip it, the app still works — it just stays on
the iPad and you'd have to download CSV backups.

### 2a. Create the sheet
1. Go to https://sheets.google.com and create a **new blank spreadsheet**.
2. Rename it something like **"CIK Clock — Time Punches"**.

### 2b. Paste the Apps Script
1. In your new sheet, click **Extensions → Apps Script**. A new tab opens.
2. You'll see a file called `Code.gs` with a blank `function myFunction() { }` in it.
   Delete everything.
3. Open `apps-script.gs` from this project (in Finder or VS Code) and copy
   **all** of its contents. Paste into the Apps Script editor.
4. Click the **💾 save** icon (or Cmd-S). Give the project a name like
   "CIK Clock Sync".

### 2c. Deploy as a Web App
1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the **⚙️ gear** icon next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description**: anything, e.g. "CIK Clock v1"
   - **Execute as**: **Me (your@gmail.com)**
   - **Who has access**: **Anyone**  *(this must be Anyone — the iPad hits it without a Google login)*
4. Click **Deploy**.
5. Google will ask you to **Authorize access**. Click Authorize, pick your
   Google account, and if you see a "Google hasn't verified this app" screen,
   click **Advanced → Go to CIK Clock Sync (unsafe)** → **Allow**. (It's your own
   script, so this warning is normal.)
6. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy.../exec`.

### 2d. Paste the URL into CIK Clock
1. On the iPad (or in your browser test), tap `1957` for the manager console.
2. Go to the **Settings** tab.
3. Paste the URL into "Google Sheet sync" and tap **Save URL**.
4. Tap **Test sync**. You should see "Connected! The sheet answered."
5. Any punches after this will show up in the sheet's `Punch Log` and `Summary`
   tabs. Edits to a punch update the same row (matched by unique Punch ID).

> If you ever change the Apps Script and re-deploy, you get a **new URL** —
> paste the new URL into Settings.

---

## Part 3 — Get it on the internet with GitHub + Vercel

We're going to put the code on GitHub (a free code-hosting site) and then hook
Vercel (a free web host) to it. When you make edits and push, Vercel auto-updates
the live app at the same permanent URL.

You need:
- A **GitHub** account (free).
- A **Vercel** account (free). You can sign in to Vercel *with your GitHub
  account*, so you only need to create GitHub first.

### 3a. Set up a GitHub account (skip if you have one)
1. Go to https://github.com/signup.
2. Enter your email, a password, and a username. The username shows up in your
   repo URLs, so keep it short — something like `dylan-cik`, `cikitchen`, etc.
3. Verify the email GitHub sends you.

### 3b. Install `git` (skip if already installed)
Open Terminal (Applications → Utilities → Terminal) and run:
```
git --version
```
If you see a version number, you're good. If it says "install command line
developer tools", click **Install** and wait a few minutes. Try again after.

### 3c. Tell git who you are (one-time)
In Terminal, replace with your info:
```
git config --global user.name "Dylan"
git config --global user.email "tdylanaquila@gmail.com"
```

### 3d. Create the repo on GitHub
1. Go to https://github.com/new.
2. **Repository name**: `cik-clock`  (or anything).
3. Leave it **Public** (private also works — Vercel supports both on free plan).
4. **Do NOT** check "Add a README" or add a `.gitignore` — we already have them.
5. Click **Create repository**.
6. On the next page, GitHub will show you commands. **Don't run them yet** —
   we'll do it below in a moment.

### 3e. Push this folder to GitHub
In Terminal, `cd` into this project folder:
```
cd /Users/Shared/CIK_Clock
```

Then run (I'll run the `git init` and first commit for you in this same
conversation — see below — but the *push* has to happen from your machine
because it needs your GitHub login):

```
git remote add origin https://github.com/YOUR-USERNAME/cik-clock.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. On the first push, GitHub
will pop up a login window in your browser — sign in and approve.

**"Push" means:** upload the current code to GitHub. From this point on, every
edit + commit + push updates GitHub, and Vercel auto-redeploys.

### 3f. Sign up for Vercel and connect the repo
1. Go to https://vercel.com/signup.
2. Choose **Continue with GitHub**. Log in with the account you just made.
3. Vercel asks which repositories it can access — pick "All repositories" (or
   just this one).
4. Once you're on the Vercel dashboard, click **Add New → Project**.
5. You'll see `cik-clock` in the list. Click **Import**.
6. On the "Configure Project" screen, **don't change anything** — leave the
   framework as "Other", root directory as-is. Just click **Deploy**.
7. Wait ~30 seconds. When it's done, Vercel gives you a URL like
   `https://cik-clock.vercel.app` or `https://cik-clock-yourusername.vercel.app`.
   **This is your permanent link.**

### 3g. Confirm the workflow
From here on:
- You (or me, in Claude Code) edit `index.html`.
- In Terminal:
  ```
  git add .
  git commit -m "describe what changed"
  git push
  ```
- Vercel sees the push and automatically redeploys within ~30 seconds. The URL
  stays the same forever.

If you'd rather not use Terminal every time, you can also use GitHub's
[Desktop app](https://desktop.github.com/) — it has buttons for "commit" and
"push" so you don't have to type commands. Same effect.

---

## Part 4 — Install it on the iPad

1. On the iPad, open **Safari** (must be Safari — Chrome on iOS doesn't
   support home-screen PWAs the same way).
2. Go to your Vercel URL.
3. Wait for the app to load fully once (this is what makes it work offline
   later — the service worker caches everything).
4. Tap the **Share** button (square with arrow, at the bottom).
5. Scroll down and tap **Add to Home Screen**.
6. Name it "CIK Clock" and tap **Add**.
7. Close Safari. On the home screen, tap the new CIK Clock icon. It opens
   full-screen with no Safari chrome — this is the mode staff use.

### Lock the iPad to just this app (Guided Access)
This is what prevents someone from swiping out to Notes, Safari, etc.

**First-time setup:**
1. Open **Settings → Accessibility → Guided Access**.
2. Toggle **Guided Access** on.
3. Tap **Passcode Settings → Set Guided Access Passcode**. Pick a passcode
   only you know. **Turn on Face ID / Touch ID** if the iPad has it — makes
   exiting easier for you.

**To lock the iPad into CIK Clock:**
1. Open CIK Clock from the home screen.
2. **Triple-click the side button** (or the home button on older iPads).
3. Tap **Start** in the top corner. The iPad is now locked to this app.

**To unlock:**
- Triple-click the side/home button and enter the Guided Access passcode (or
  use Face/Touch ID).

Also worth doing on the iPad:
- **Settings → Display & Brightness → Auto-Lock → Never** (so it doesn't sleep).
- Plug it in permanently. It'll stay on the app as long as it has power.

---

## Editing later

The whole app is in `index.html`. Two easy ways to change it:

**Easy: ask Claude Code.** Just describe what you want changed — "make the
keypad numbers bigger", "add a new job called Baking", "change the
16-hour missed-punch warning to 12 hours". I'll edit the file, and once
you push, Vercel redeploys at the same URL.

**Manual:** open `index.html` in any text editor. The most useful things live
near the top:

- `const IDLE_TIMEOUT_MS = 45_000;` — how long before a screen returns to the
  main keypad on its own.
- `const CONFIRM_MS = 5_000;` — how long the "Thanks, you're clocked in"
  screen stays.
- `const MISSED_PUNCH_HOURS = 16;` — how many hours before an open shift is
  flagged as a missed punch-out.
- `const JOBS = ["Prep Cook", "Prep Plate", "Catering"];` — the jobs list. Add
  or rename here. Also update `JOB_KEYS` in the line just below.
- `seedState()` — the initial staff data if the app has never been used on a
  device.

After any edit: `git add . && git commit -m "..." && git push` — Vercel picks
up the change.

---

## Troubleshooting

**"That PIN wasn't found" when I know the PIN is right.**
Manager → Staff → make sure they're marked **active**. If you changed the PIN
recently, tap Save.

**"Test sync" says "Couldn't reach the sheet"**
- Make sure the Apps Script deployment is set to **Who has access: Anyone**.
- Make sure you pasted the URL that ends with `/exec` (not the editor URL).
- If you changed the Apps Script code, you need to **Deploy → Manage deployments
  → ✏️ Edit → New version → Deploy**. This gives you a new URL, which you paste
  into Settings.

**iPad shows an old version after I pushed a change.**
Because the service worker caches. To force a refresh: on the iPad, open the
CIK Clock icon, then use Safari to visit the URL and do a hard reload
(Settings → Safari → Clear History and Website Data will also work, but that's
overkill). The version constant `CACHE_VERSION` in `sw.js` gets bumped when I
make changes — that also busts the cache.

**I need a backup of everything.**
Manager → Settings → **Download backup**. Save the JSON file somewhere safe
(email it to yourself, iCloud, etc). You can restore it from the same screen.

**The iPad lost power / lost internet during a shift.**
Everything is saved locally the moment someone taps clock in or out. When the
iPad comes back online, unsynced punches push to the sheet automatically. The
badge in the top-right corner shows sync status.
