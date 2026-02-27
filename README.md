# FrancoisAI

A personal cooking app for two people sharing a household — recipe management with URL import, weekly meal planning, a shared shopping list with automatic staple restocking, and a fridge/freezer/pantry inventory tracker.

> **Designed for exactly 2 users.** All data (recipes, meal plan, shopping list) is shared between both users in real time. The database enforces a hard cap of 2 accounts.

## Features

- **Recipes** — import from any recipe URL or create manually; search by name or ingredient; add individual ingredients directly to the shopping list
- **Meal Planner** — shared weekly grid with past/future week navigation; tap any recipe entry to go straight to the recipe
- **Shopping List** — shared list with autocomplete from history, staple items auto-added each Monday
- **Inventory** — track stock grouped by fridge/freezer/pantry/other; items added automatically when checked off the shopping list; quantity stepper, location picker, and restock shortcut
- **AI Chat** — cooking assistant via Gemini API *(coming soon)*

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Database & Auth | Supabase (PostgreSQL + Google OAuth) |
| Recipe scraping | Supabase Edge Function (Deno) |
| Hosting | Vercel |

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account and project
- A [Google Cloud](https://console.cloud.google.com) project with OAuth configured (see below)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd FrancoisAI
npm install
```

### 2. Set up Supabase

**Create the database schema:**

1. Go to your Supabase project → **SQL Editor**
2. Open [`supabase/schema.sql`](supabase/schema.sql) and paste the entire contents into the editor
3. Before running, find the two `REPLACE_WITH_USER*_EMAIL` placeholders in the `enforce_user_limit` function and swap them for the two Google account email addresses that should have access
4. Run the script

**Configure Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add to **Authorised redirect URIs**:

   ```text
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client Secret**
5. In Supabase dashboard → **Authentication → Providers → Google**: enable Google and paste both values

### 3. Configure environment variables

Create a `.env` file in the project root:

```text
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in your Supabase dashboard under **Project Settings → API**.

### 4. Start the dev server

```bash
npm run dev
```

### 5. Deploy the Edge Function

The recipe URL importer runs as a Supabase Edge Function. Deploy it once:

```bash
npx supabase login
npx supabase functions deploy scrape-recipe --project-ref <your-project-ref> --no-verify-jwt
```

> The `--no-verify-jwt` flag is required because the function is called with the anon key, which is not a JWT.

---

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Vite is auto-detected — leave all build settings as defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**

### 3. Update Supabase auth URLs

Once you have your Vercel domain (e.g. `your-app.vercel.app`), update two settings in your Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/**`

Also add the production callback URL to your Google OAuth client in Google Cloud Console:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

### 4. Deploy the Edge Function to production

```bash
npx supabase functions deploy scrape-recipe --project-ref <your-project-ref> --no-verify-jwt
```

---

## Notes

### 2-user limit

The `enforce_user_limit` database trigger prevents more than 2 accounts and validates an email allowlist. To remove this restriction entirely:

```sql
drop trigger if exists enforce_user_limit_trigger on auth.users;
drop function if exists enforce_user_limit();
```

Note that the app's data model is built around two people sharing everything — removing the limit without redesigning the data model will result in all users seeing each other's shopping lists and meal plans.

### Free tier longevity

- **Vercel Hobby** — effectively unlimited for personal use at this scale
- **Supabase Free** — handles up to 50,000 monthly active users; the only catch is projects pause after 7 days of inactivity. Two active users will naturally prevent this.

### Regenerating TypeScript types

If you modify the database schema, regenerate types with:

```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> > src/types/supabase.ts
```

Then re-append the convenience type aliases at the bottom of `src/types/supabase.ts` — they are marked with a comment block so you know exactly what to add back.

---

## Troubleshooting

### Recipe URL import returns 401

The Edge Function was deployed without the `--no-verify-jwt` flag. Redeploy it:

```bash
npx supabase functions deploy scrape-recipe --project-ref <your-project-ref> --no-verify-jwt
```

### Sign-in redirects back to login page

The Supabase redirect URL is missing or wrong. In your Supabase dashboard → **Authentication → URL Configuration**, make sure:

- **Site URL** matches your deployment domain exactly (e.g. `https://your-app.vercel.app`)
- **Redirect URLs** includes `https://your-app.vercel.app/**`

For local dev, add `http://localhost:5173/**` to the Redirect URLs list.

### "Signups are restricted" error on sign-in

The email address used isn't in the allowlist inside the `enforce_user_limit` database function. In your Supabase dashboard → **SQL Editor**, run:

```sql
create or replace function enforce_user_limit()
returns trigger as $$
declare
  user_count int;
begin
  if new.email not in (
    'your-first-email@gmail.com',
    'your-second-email@gmail.com'
  ) then
    raise exception 'Signups are restricted to invited users only.';
  end if;
  select count(*) into user_count from auth.users;
  if user_count >= 2 then
    raise exception 'This app is limited to 2 users.';
  end if;
  return new;
end;
$$ language plpgsql security definer;
```

### App loads slowly after being idle

Supabase free tier pauses projects after 7 days of inactivity. The first request wakes it up (10–30 seconds), after which it's normal. Upgrade to Supabase Pro to remove the pause.

### Exporting the current database schema

To dump the live schema from your Supabase project (useful for keeping `supabase/schema.sql` in sync after manual changes):

```bash
npx supabase db dump --project-ref <your-project-ref> > supabase/schema.sql
```
