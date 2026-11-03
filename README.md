# RoomSplit

A rental dashboard for owners who rent out their home one room at a time.
One mortgage, several tenants, shared costs split fairly.

Built with Node.js, Express, EJS templates, express-session and SQLite
(Node's built-in `node:sqlite`), plus plain CSS and JavaScript.

## Run it

Requires Node.js 22.13 or newer.

    npm install
    npm run seed     # optional: creates a demo owner with a sample 3-room condo
    npm start

Then open http://localhost:3000

Demo login (after `npm run seed`): username `demo`, password `roomsplit-demo`.
You can also create your own account on the Sign up page.

The data lives in `roomsplit.db` in the project folder (created on first run,
not committed). Delete that file to start fresh.

## Pages

| Page | Path | Who can see it |
| --- | --- | --- |
| Home | `/` | Everyone |
| About | `/about` | Everyone |
| Log in | `/login` | Everyone |
| Sign up | `/register` | Everyone |
| Dashboard | `/dashboard` | Logged-in owners |
| Rooms (CRUD) | `/rooms` | Logged-in owners |
| Tenants (CRUD) | `/tenants` | Logged-in owners |
| Payments (CRUD) | `/payments` | Logged-in owners |
| Shared costs (CRUD) + calculator | `/expenses` | Logged-in owners |
| Scenario comparison | `/scenarios` | Logged-in owners |

## Features

- **Rent and expense calculator**: enter mortgage, HOA, utilities and internet,
  split shared costs across rooms (evenly or by square footage), and see
  break-even rent and profit per room.
- **Room and tenant tracker**: add rooms, assign a tenant to each, store lease
  start and end dates, log payments and flag late rent (late = paid after the 5th).
- **Scenario comparison**: whole-unit rental vs renting by the room, with an
  occupancy slider and monthly and yearly cash flow side by side.
- **Owner dashboard**: monthly income and costs, occupancy rate, upcoming
  lease renewals (next 60 days), overdue rent, and a six-month chart.

## How login works

- Passwords are hashed with scrypt and a random salt; they are never stored as typed.
- On login the user's id and name are saved in the session (`req.session.user`),
  and the nav bar shows "Hi, *name*" on every page.
- The session cookie has no expiry date, so it is a browser-session cookie: you
  stay logged in until you close the browser or click **Log out** (which destroys
  the session). Note: if Chrome/Edge is set to "Continue where you left off", the
  browser may restore session cookies after a restart.
- `server.js` puts every owner page behind `requireLogin` (`lib/auth.js`):
  - viewing an owner page while logged out redirects to the login page;
  - any create, update or delete request while logged out is refused with a
    **401 "You need to be logged in"** page and nothing is saved.
- Every query is filtered by the logged-in owner's id, so owners can only see
  and change their own records.

## Video walkthrough checklist

1. Logged out: open Home and About. Try `/rooms` or `/dashboard`, and you're sent to Log in.
2. Sign up (or log in as `demo`). The nav now shows your name.
3. **Create**: add a cost on Costs, a room on Rooms, a tenant on Tenants, a payment on Payments.
4. **Read**: see them in the lists, the calculator, the dashboard and Scenarios.
5. **Update**: click Edit on a room (change its rent), save, and see the new value.
6. **Delete**: click Delete on a payment or room and confirm.
7. Show the login lasts: open a new tab to `/dashboard` and you're still logged in.
8. Show logged-out changes are blocked: open Rooms in two tabs, click
   **Log out** in one, then in the other tab click **Delete** (or submit the
   Add room form). You get "You need to be logged in… Nothing was saved."
   Log back in and the record is still there.
9. Close the browser completely, reopen the site, and you're logged out.

## Project layout

    server.js          app setup, session, route mounting, login guard
    db.js              SQLite connection and schema
    seed.js            demo data
    lib/               auth (hashing, guard), form validation, status rules, helpers
    routes/            auth, dashboard, rooms, tenants, payments, expenses, scenarios
    views/             EJS pages and shared header/footer partials
    public/css/        stylesheet
    public/js/         nav, confirmations, validation, calculator, chart, scenarios
