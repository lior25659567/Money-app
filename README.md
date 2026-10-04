# Money-app · הכסף שלי

A private, phone-friendly dashboard for my Mizrahi Tefahot bank account and Cal credit card.

```
Mizrahi + Cal ──► Moneyman (GitHub Actions, twice a day) ──► Supabase Postgres ──► this web app
```

| Folder | What's in it |
|---|---|
| `pipeline/` | Template for the Moneyman config (the scraper lives in a fork of `daniel-hauser/moneyman`) |
| `supabase/` | SQL that locks the data down and exposes it to the app read-only |
| `web/` | The app: Vite + React + TypeScript, Hebrew/RTL, installable on the home screen |

## Try it now (demo data)

```bash
cd web
npm install
npm run dev
```

With no Supabase keys in `web/.env` the app runs on made-up data.

## Setup

### 1. Data pipeline (Moneyman → Supabase)

1. Create a Supabase project. Copy the **Session pooler** connection string (Connect → Direct → Session pooler; it must contain `pooler.supabase.com`).
2. Create a Telegram bot with @BotFather and get your chat ID. Moneyman sends its logs there, since Actions logs on a public fork are public.
3. Fork `github.com/daniel-hauser/moneyman`.
4. Fill in `pipeline/moneyman-config.example.jsonc` **on your computer only**, paste it into a secret named `MONEYMAN_CONFIG` in the fork, then delete the filled-in copy. Never commit real passwords here.
5. In the fork: Actions → **build** → Run, then Actions → **scrape** → Run.
6. When Telegram reports success, change `daysBack` from 365 to 10 in the secret.

### 2. Lock down the database

1. Open `supabase/setup.sql`, replace `you@example.com` with your email.
2. Run it in Supabase → SQL Editor (only after the first scrape created `moneyman.transactions`).
3. Supabase → Authentication → Sign In / Providers: turn off **Allow new users to sign up** after your first login, if you like. The allowlist already blocks anyone else from reading data.
4. Authentication → URL Configuration: set **Site URL** to where the app runs (e.g. `https://<you>.github.io/Money-app/`) and add `http://localhost:5173` to Redirect URLs for local dev.

### 3. Run the app with real data

Copy `web/.env.example` to `web/.env` and fill in the project URL and anon key (Project Settings → API). Then `npm run dev`. You log in with a magic link sent to your email.

### 4. Put it on your phone

`.github/workflows/deploy-web.yml` publishes the app to GitHub Pages on every push to `main`:

1. Repo → Settings → Pages → Source: **GitHub Actions**. (Pages on a private repo needs a paid GitHub plan; Vercel or Netlify are free alternatives.)
2. Repo → Settings → Secrets and variables → Actions: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Open the site on your phone → Share → **Add to Home Screen**.

## What the app shows

- Income, expenses and net for the selected month, filterable by account
- 12-month income vs expenses chart (tap a month to jump to it)
- Top places the money went this month
- Searchable transaction list

**Double counting:** the monthly Cal bill also shows up as one debit in the Mizrahi account. The "hide Cal bill" toggle (on by default) drops Mizrahi debits whose description looks like a card bill (`web/src/data.ts`, `CARD_BILL`). If your bank describes it differently, adjust that pattern.

## Security notes

- Bank passwords live only in the Moneyman fork's GitHub secret.
- The app uses Supabase's public anon key. Row-level security plus the email allowlist in `supabase/setup.sql` mean only you can read transactions.
- The raw scraper JSON is not exposed to the app.
