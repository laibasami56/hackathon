# Serviro — Web Development & IT Service Marketplace

A real, working MVP connecting customers with web development / IT service
providers, where customers file **complaints/support requests** against a
provider and track them through to resolution. Built with plain HTML,
Tailwind CSS (CDN), vanilla JavaScript, and Firebase (Authentication +
Firestore).

## Files

```
index.html      Auth + role-selection screen (Customer / Provider, Sign In / Create Account)
customer.html   Customer dashboard — browse & search providers, view profiles, file complaints, track them, review
provider.html   Provider dashboard — manage incoming complaints through the full resolution workflow
app.js          ALL application logic (single file, as required) — Firebase config, auth, Firestore CRUD, UI
style.css       Custom animations, scroll-reveal, cards, badges, buttons, modals, SweetAlert2 theming
README.md       This file
```

There is no admin panel/dashboard in this build — it was removed on request.
Only the Customer and Provider roles exist.

## Running it

No build step. Serve the folder with any static server and open `index.html`:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Firebase project credentials are already wired up in `app.js` (Auth +
Firestore). Make sure, in the Firebase console for this project:

- **Authentication → Sign-in method → Email/Password** is enabled.
- **Firestore Database** is created (in production or test mode) with rules
  that allow authenticated reads/writes to `users`, `providers`,
  `complaints` and `reviews` (a permissive test-mode rule set is fine for a
  hackathon demo).

## The complaint workflow

```
Customer Login → Browse Providers → View Provider → File a Complaint →
Pending → Provider Accepts → Accepted → Start Resolving → In Progress →
Resolve Complaint → Completed → Customer Views Resolution → Customer Reviews
```

- A customer files a complaint against a specific provider (subject,
  preferred date/time, location, estimated budget, complaint details,
  optional notes). This gets a generated ID like `CMP-2026-A82K91` and is
  saved to Firestore with status `Pending`.
- The provider can **Accept** or **Reject** a pending complaint. Accept →
  `Accepted`, unlocking **Start Resolving** → `In Progress`, unlocking
  **Resolve Complaint** (requires a valid `http(s)://` resolution URL + a
  resolution note) → `Completed`.
- The customer then sees a **View Resolution** button on that complaint and
  can leave a 1–5 star review (once per complaint), which feeds into the
  provider's average rating.

## Demo providers vs. real providers

Six seeded demo providers (Sarah Khan, Ali Ahmed, Hamza Malik, Ayesha Noor,
Usman Raza, Zainab Fatima) exist purely so the "Browse Providers" list isn't
empty for a first-time visitor. They're marked `isDemo: true`, show a
**Demo** badge, and their **File Complaint** action is disabled with an
explanatory note — since they have no real Firebase account, a complaint
against one would have nowhere to be seen from a provider dashboard.

To test the full workflow, file a complaint against a **real, signed-up
provider account** (see steps below).

## How to test end-to-end (2 browser profiles needed)

1. **Window A (normal):** open `index.html` → Customer → Create Account.
2. **Window B (incognito/private):** open `index.html` → Provider → Create
   Account. This creates a real provider profile that instantly appears in
   Window A's "Browse Providers" (alongside the demo ones, which show a
   **Demo** badge).
3. In Window A, search/filter, open the **real** provider's profile, click
   **File a Complaint**, fill the form, submit → you get a
   `CMP-2026-XXXXXX` complaint ID.
4. In Window B, open the Provider Dashboard — the complaint appears with
   **Accept** / **Reject**. Walk it through Accept → Start Resolving →
   Resolve Complaint (needs a valid `https://` URL + a resolution note).
5. Back in Window A → **My Complaints** → the resolved complaint shows
   **View Resolution** and **Leave a Review**.

## Firestore collections

- `users` — `{ uid, name, email, role, createdAt }`
- `providers` — profile + service info, doc ID is either a demo ID or the
  provider's Firebase `uid`
- `complaints` — doc ID = generated complaint ID; full request + status +
  resolution fields
- `reviews` — doc ID = complaint ID (enforces one review per complaint)