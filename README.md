# Serviro — Web Development & IT Service Marketplace

A real, working MVP built with plain **HTML + Tailwind CSS (CDN) + vanilla
JavaScript + Firebase** (Authentication + Firestore). Customers browse
providers and book them; providers manage bookings through a full workflow;
admins oversee everything.

## Files

```
index.html      Auth + role-selection screen (Customer / Provider)
customer.html   Customer dashboard — discover providers, book, track, review
provider.html   Provider dashboard — manage incoming bookings end to end
admin.html      Admin dashboard — stats + view/edit/delete across all data
app.js          ALL app logic in one file (Firebase config, auth, Firestore, UI)
style.css       Design system: light/dark theme tokens, components, animation
README.md       This file
```

## Run it

No build step — serve the folder statically and open `index.html`:

```bash
npx serve .
# or
python3 -m http.server 8080
```

In the Firebase console for this project, make sure:
- **Authentication → Sign-in method → Email/Password** is enabled.
- **Firestore Database** exists, with rules that allow authenticated
  read/write on `users`, `providers`, `bookings`, `reviews`, `system`
  (permissive test-mode rules are fine for a hackathon demo).

## Logging in

The role cards on the sign-in screen only matter for **Create Account**
(they set the new user's role). **Sign In** always redirects to whichever
dashboard matches the account's real role in Firestore — so there's nothing
to toggle, just sign in.

### Demo accounts (seeded automatically on first load)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@serviro.com` | `Serviro@Admin123` |
| Provider | `sarah.khan@serviro.io` | `Provider@123` |
| Provider | `ali.ahmed@serviro.io` | `Provider@123` |
| Provider | `hamza.malik@serviro.io` | `Provider@123` |
| Provider | `ayesha.noor@serviro.io` | `Provider@123` |
| Provider | `usman.raza@serviro.io` | `Provider@123` |
| Provider | `zainab.fatima@serviro.io` | `Provider@123` |

These are **real Firebase Auth accounts** (created once via an isolated
secondary Firebase app instance so seeding never disturbs whoever is
currently signed in) — not fake placeholder data. Only someone with the
password can sign in and manage that account's bookings, exactly like any
other user. The admin login is not exposed anywhere in the customer/provider
UI — you need the credentials above.

Every account — customer, provider, or admin — only ever sees and manages
its own data: a provider's dashboard is filtered to bookings where
`providerId` matches their own UID, and every page checks the signed-in
user's role in Firestore and redirects away if it doesn't match.

## The booking workflow

```
Customer Login → Browse Providers → View Provider → Book Provider →
Pending → Provider Accepts/Rejects → Accepted → Start Project →
In Progress → Complete Project (URL + note) → Completed →
Customer Opens Live URL → Customer Reviews
```

- Booking a provider generates an ID like `SRV-2026-A82K91`.
- A provider can **Accept** or **Reject** a pending booking. A rejected
  booking never becomes anything else. Accept → **Start Project** →
  In Progress → **Complete Project** (requires a valid `http(s)://` URL and
  a note) → Completed.
- The customer then sees an **Open Live Project** button and can leave one
  star rating + review per booking, which recalculates the provider's
  average rating.

## Admin capabilities

- Live stats: total/customer/provider counts, bookings by status, reviews.
- **Users** — view every account, edit name/role.
- **Providers** — view, edit profile fields (service, rate, skills,
  location, availability, about), or delete.
- **Bookings** — view full detail, manually override status, or delete.
- **Reviews** — view and delete.
- From the Users tab, **Activity** jumps to Bookings filtered to that
  person's requests (as customer) or jobs (as provider) — this is how admin
  checks a specific customer's or provider's progress.

## Theme

One accent color (orange), two surfaces:
- **Dark** — near-black background.
- **Light** — white background.

Toggle with the sun/moon button in the navbar; the choice is saved to
`localStorage` and persists across pages and reloads.

## Firestore collections

- `users` — `{ uid, name, email, role, createdAt }`
- `providers` — doc ID = provider's UID; profile + service info
- `bookings` — doc ID = generated booking ID; full request + status + timestamps
- `reviews` — doc ID = booking ID (enforces one review per booking)
- `system/seed_status` — internal flag so demo accounts are only seeded once
