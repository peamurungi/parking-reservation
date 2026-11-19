# Deploy (Stage 7)

Order matters: **GitHub -> Render (server) -> Vercel (client) -> fix CORS.**
Free plans change; check each provider's page before relying on them. Render's free server sleeps when idle, so the first request can take about 50 seconds.

## 1. Server on Render
1. Sign in at render.com **with GitHub**. Click **New + -> Web Service** and pick the `parking-reservation` repo.
2. Settings:
   - **Root Directory:** `api`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn config.wsgi`
   - **Instance type:** Free
3. **Environment variables** (Advanced -> Add):

| Name | Value |
|---|---|
| `PYTHON_VERSION` | `3.13.5` (any 3.12 or newer) |
| `SECRET_KEY` | a long random text you invent |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `YOUR-SERVICE.onrender.com` (the address Render gives you) |
| `DATABASE_URL` | same session-pooler string as your local `api/.env` |
| `SUPABASE_URL` | `https://hbiirmldxhhfjuaqrvkb.supabase.co` |
| `SUPABASE_JWT_SECRET` | leave empty |
| `RATE_PER_HOUR` | `1000` |
| `CLIENT_URL` | `http://localhost:3000` for now (changed in step 3) |

4. Click **Create Web Service**. When it says **Live**, open `https://YOUR-SERVICE.onrender.com/api/slots/`. A `401 Unauthorized` answer in JSON means the server works (you have no token yet).

## 2. Client on Vercel
1. Sign in at vercel.com with GitHub. Click **Add New -> Project** and import the repo.
2. **Root Directory:** `web`. Framework: Next.js (detected).
3. **Environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your publishable key
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-SERVICE.onrender.com` (no slash at the end)
4. Click **Deploy**. You get a link like `https://parking-reservation.vercel.app`.

## 3. Let the server accept your website (CORS)
In Render -> your service -> **Environment**, change `CLIENT_URL` to your Vercel address, for example `https://parking-reservation.vercel.app` (no slash at the end). Save; Render redeploys.

## 4. Supabase Auth URLs
Supabase -> **Authentication -> URL Configuration**: set **Site URL** to your Vercel address.

## 5. Test from another phone
Open the Vercel link on a different phone, sign up, reserve a slot. If login loops back to the login page, the cause is almost always `CLIENT_URL`, `ALLOWED_HOSTS` or a missing `NEXT_PUBLIC_API_URL`. Check the Render **Logs** tab.

## 6. Final checks
- Debug is off (`DEBUG=False`).
- No `.env` files in GitHub.
- Put the live link at the top of the README.
