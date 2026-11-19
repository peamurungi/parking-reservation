# Parking Slot Reservation System

**Student:** MURUNGI Peace (223019597) · Project 51 · Medium · Transport
**Live app:** _paste your Vercel link here_ · **API:** _paste your Render link here_
Docs: [Brief](docs/BRIEF.md) · [Data model](docs/DATA_MODEL.md) · [Demo script](docs/DEMO_SCRIPT.md) · [Deploy guide](docs/DEPLOY.md)

**Why this stack:** Supabase gives free managed Postgres plus login; Django REST writes the API and validation quickly; a relational database fits slots, users and reservations, and Postgres can enforce no-overlap itself.

Stack A: **Next.js** (client) + **Django REST** (server) + **Supabase** (Postgres + Auth).
Roles: **driver** (reserves slots, sees own reservations) and **attendant** (sees everything, manages slots, sees revenue).

```
Browser (Next.js) --token--> Django API --SQL--> Supabase Postgres
        \--------- login --------> Supabase Auth
```

## 1. Supabase (Stage 3 / Task 1)
1. Create a project at supabase.com.
2. SQL editor: paste and run `supabase/schema.sql`. This creates `slots`, `reservations`, `profiles`, 10 sample slots, the **no-overlap constraint** and security rules.
3. Authentication > Providers: Email on (turn off "Confirm email" while testing).
4. Sign up once in the app, then make yourself attendant (SQL editor):
   `update profiles set role = 'attendant' where user_id = (select id from auth.users where email = 'you@example.com');`

## 2. Django server (Task 2 and 4)
```bash
cd api
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in DATABASE_URL, SUPABASE_URL (and JWT secret if legacy)
python manage.py runserver  # http://localhost:8000
python manage.py test       # 9 tests, no Supabase needed (uses SQLite)
```
Do **not** run `migrate` for the parking tables: Supabase owns them (`schema.sql`).

| Method | Address | Who | Notes |
|---|---|---|---|
| GET | /api/slots/ | signed in | adds `occupied` for the map (`?at=ISO-time`) |
| POST/PATCH/DELETE | /api/slots/ | attendant | 409 if the slot has reservations |
| GET | /api/reservations/ | signed in | driver: own only; attendant: all; paginated (10) |
| POST | /api/reservations/ | signed in | overlap -> 400, fee = hours (rounded up) x rate |
| GET/PATCH/DELETE | /api/reservations/:id/ | owner or attendant | 404 if missing or not yours |
| GET | /api/analytics/revenue-per-day/ | attendant | `[{day, revenue, reservations}]` |

Status codes: 200/201/204 ok, 400 bad input or overlap, 401 no/invalid token, 403 wrong role, 404 missing, 409 conflict.

## 3. Next.js client (Task 3)
```bash
cd web
npm install
cp .env.local.example .env.local   # Supabase URL + anon key, API url
npm run dev                        # http://localhost:3000
```
Pages: `/login` (sign up / log in), `/` parking map (green free, red occupied), `/reserve` form, `/reservations` list (paginated), `/reservations/:id` detail + cancel, `/analytics` (attendant).
Every page shows loading, empty and error states.

## 4. Push to GitHub
```bash
git init && git add . && git commit -m "Parking reservation: first version"
git branch -M main
# create an EMPTY repo on github.com first, then:
git remote add origin https://github.com/<you>/parking-reservation.git
git push -u origin main
```
Check `git status` shows no `.env` files before you commit. Work in small commits (one per stage) so your **process evidence** is visible.

## 5. Deploy (Stage 7)
- **Frontend -> Vercel:** import the repo, root directory `web`, add the 3 env vars (`NEXT_PUBLIC_API_URL` = your live Django URL).
- **Django -> Render/Railway:** root `api`, build `pip install -r requirements.txt`, start `gunicorn config.wsgi`. Env: `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `CLIENT_URL` (your Vercel URL, for CORS).

## 6. Class activities: answers to write in your report
**Predict the status code.** "Driver reserves a slot": **201 Created** on success; 400 if times overlap or input is bad; 401 if the token expired.
**Log reading.** Django terminal shows `"POST /api/reservations/ HTTP/1.1" 201 ...`. A preceding `GET /api/me/` and `GET /api/slots/` are the page loading. Match each line to a click.
**Break it on purpose.** Reserve A1 10:00-12:00, then A1 11:00-13:00 -> server returns **400** `Slot A1 is already reserved from 10:00 to 12:00...`. The form shows that message in red. (Back-to-back 12:00-13:00 is allowed.) Two simultaneous clicks are stopped by the database `no_overlap` constraint, also a 400.
**Trace "driver reserves a slot".** Click Reserve -> `fetch` POST with `Authorization: Bearer <token>` -> Django `SupabaseAuthentication` verifies signature/expiry and reads the user id -> role looked up in `profiles` -> serializer validates plate, times, overlap -> fee calculated -> row inserted in Postgres -> `201` + JSON -> page redirects to the detail page. Failure: `400` with a message (or `401`/`403`).

## 7. Four-week plan
- **Week 1:** brief (5 user stories, 3 screens), run `schema.sql`, practise the overlap SQL.
- **Week 2:** API + tests; test every endpoint with curl.
- **Week 3:** UI, login, roles, security checks ("try to break it").
- **Week 4:** deploy, README, 2-minute demo.

## Security checklist already built in
Token verified server-side; user id taken from the token, never the body; ownership filter on every query; ORM only (no string SQL); CORS limited to your client; secrets in `.env`; RLS on all tables.
