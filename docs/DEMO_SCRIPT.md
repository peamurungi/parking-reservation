# 2-minute demo script

Prepare before recording: Django server and `npm run dev` running, one driver account and one attendant account, the browser open on `/login`, the terminal with the Django log visible next to it.

| Time | Do | Say |
|---|---|---|
| 0:00 | Show the login page. Log in as the **driver**. | "This is my Parking Slot Reservation System. Drivers log in with Supabase Auth." |
| 0:15 | Show the map. | "Green slots are free now, red ones are occupied. The server works this out from the reservations." |
| 0:25 | Click a green slot, enter plate `RAB123A`, pick a 2-hour time, click **Reserve**. | "I reserve slot A1 for two hours. The server calculates the fee from the hours: 2000 RWF." |
| 0:45 | Point at the Django terminal. | "Here is the request in the log: POST /api/reservations/ returned **201 Created**." |
| 0:55 | Reserve the **same slot for an overlapping time**. | "Now I break it on purpose, reserving a time that clashes." |
| 1:05 | Show the red message and the log line `400`. | "The server answers 400 Bad Request with a clear message, and the database also has a no-overlap constraint as a second protection." |
| 1:20 | Open **Reservations**, then a detail page. | "Drivers only see their own reservations. A different driver gets a 404 for someone else's." |
| 1:35 | Log out, log in as the **attendant**. Open **Revenue**. | "The attendant has a different role. Django checks the role from the verified token before showing revenue per day." |
| 1:50 | Show GitHub repo and the live link. | "The code is on GitHub with a README, tests and the live link." |
| 2:00 | End. | |

## Checkpoint question: answer ready
**Trace "driver reserves a slot", and which status comes back when it fails?**
Browser form -> `fetch` POST with the Supabase access token in the `Authorization` header -> Django verifies the token signature and reads the user id -> looks up the role in `profiles` -> serializer validates plate, times and overlap -> fee is calculated -> row inserted in Postgres -> **201** and JSON -> the page redirects to the detail page. On failure: **400** (bad input or overlap), **401** (no or expired token), **403** (wrong role) or **404** (not found).
