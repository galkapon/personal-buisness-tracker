# Business Time Tracker

A cross-device time tracking app for freelancers — works on iPhone (installable as PWA) and Windows.

## Features

- ⏱️ Start/stop timer for projects
- 📝 Write notes on what you're working on
- 🎯 Manage multiple projects
- 📱 Responsive design (iPhone + desktop)
- 🔄 Sync across devices in real-time
- 🔐 Secure authentication

## Quick Start

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org))
- Supabase account (free at [supabase.com](https://supabase.com))

### 1. Set up Supabase

1. Sign up at [supabase.com](https://supabase.com) (free tier, no credit card needed)
2. Create a new project called "personal-business-tracker" (or similar)
3. Copy your **Project URL** and **Anon Key** from Settings → API

### 2. Set up database schema

1. In Supabase, go to **SQL Editor**
2. Open a new query and paste the contents of `supabase/schema.sql`
3. Run the query

This creates the `projects` and `time_entries` tables with Row Level Security policies.

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase URL and anon key.

### 4. Install and run locally

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`. Sign up with any email/password to test.

### 5. Deploy to GitHub Pages

1. Push to your GitHub repo:
   ```bash
   git add .
   git commit -m "Initial commit: time tracker scaffold"
   git push origin main
   ```

2. On GitHub, go to **Settings → Secrets and variables → Actions**
   - Add `VITE_SUPABASE_URL` with your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` with your anon key

3. GitHub Actions will automatically build and deploy to `https://your-username.github.io/personal-buisness-tracker/`

### 6. Use on iPhone

1. Open the deployed URL in Safari
2. Tap **Share** → **Add to Home Screen**
3. Launch it as a full-screen app

The app will sync projects and time entries across devices in real-time.

## Development

- `npm run dev` — start local dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build locally

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase (managed Postgres + Auth)
- **Hosting**: GitHub Pages (static) + Supabase (serverless database)
- **Sync**: Real-time Postgres subscriptions via Supabase client

## Roadmap

- [ ] Project history / analytics
- [ ] Export time entries (CSV)
- [ ] Recurring projects
- [ ] Time entry editing / deletion
- [ ] Project archiving
- [ ] Dark mode
