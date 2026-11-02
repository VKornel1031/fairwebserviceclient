# Fair Autószerviz · Ügyfélportál

Hungarian service portal built with Next.js, React and TypeScript, matching [Fair Autószerviz's website](https://fairautoweb.vercel.app/).

**Security update:** install the matching backend release using [docs/SECURITY_UPDATE.md](./docs/SECURITY_UPDATE.md). It adds persistent authentication limits, stricter native permissions, production CSP, and a verified PocketBase 0.40.6 upgrade with an offline backup before changes. Authenticated operations require the updated backend security policy.

## Account management

Accounts use **PocketBase** with email verification for new accounts:

- Register a **company partner** with a company name and Hungarian tax number, confirm the email address, then sign in using email and password. Individuals book as guests.
- Save contact details and required company details across devices.
- Save, edit, search and delete cars in PocketBase, and choose a default vehicle. Each company account has a private fleet; admins can manage all vehicles. Fleet lists are paginated.
- Accounts display initials; profile picture controls and their setup message have been removed.
- Change an email address with your current password and a confirmation link sent to the new address. Change a password while signed in, or request a password-reset email.
- Admins create, search, edit, suspend and delete accounts, and assign `partner`, `reception`, `manager` or `admin` roles.
- Navigation follows the current PocketBase role. The demo role switcher and password-free profile switching have been removed.
- Admin changes require the admin's password. Self-demotion/deletion and changes to a protected root admin are blocked.
- Sessions use HttpOnly cookies; real tokens, passwords and profiles are not stored in browser localStorage. Each authenticated API call checks PocketBase again.

**Existing CasaOS installation:** copy the complete [CasaOS deployment command block](./docs/SECURITY_UPDATE.md#copy-paste-installation-on-the-casaos-host), with the reviewed commit and checksum already filled in. It installs the host prerequisites, checks the documented Debian/Ubuntu and Docker setup, makes an offline backup, upgrades PocketBase, applies pending update migrations and verifies readiness. Working SMTP credentials are preserved. The [Hungarian CasaOS guide](./docs/CASAOS_POCKETBASE.md) contains the same block. Earlier partial update commands do not install the current security policy.

**Setup is required on your PocketBase and Vercel deployment.** Follow [`docs/POCKETBASE_SETUP.md`](./docs/POCKETBASE_SETUP.md), including the versioned migration, first normal `users` admin, and environment settings. No superuser credentials or API keys belong in this app. No avatar setup is needed for the current UI. Public registration defaults to disabled until explicitly enabled after migration.

**Company-only registration:** apply the forward migration and hook using [docs/COMPANY_ACCOUNTS.md](./docs/COMPANY_ACCOUNTS.md). Existing accounts, cars and bookings are preserved; legacy customer accounts become partners. The removed Customer role cannot be selected or created.

Saved cars additionally need the single migration in [`docs/SAVED_VEHICLES.md`](./docs/SAVED_VEHICLES.md). It uses native PocketBase permissions and does **not** require custom hooks, SMTP, or new Vercel credentials. Appointment setup is described below.

## Appointments

Tire service is not offered. **Műszaki vizsga is arranged only by phone** at 06 20 347 3705 or 06 20 405 6299. Its card cannot be selected for online booking. The existing PocketBase installation needs the three-file update in [docs/SERVICE_BOOKING.md](./docs/SERVICE_BOOKING.md); no new migration is required. Service policies and public contact numbers are editable in `content/booking.json`.

Guest and company partner requests now persist in PocketBase. Saved contact details prefill the booking form for every signed-in role, including admins and staff. Staff use a separate “Ügyfélnek foglalok” option for blank customer intake. A single saved car fills automatically; multiple cars require a choice. New guest forms stay blank. Accounts can save a VIN with each car; every new appointment requires it. Customers manage their own requests; reception staff confirm by phone, cancel or reschedule, and managers/admins also start and complete work, manage closures and view real reports.

**Pending requests do not reserve capacity. Phone confirmation reserves it atomically.** Concurrent confirmations cannot exceed workshop capacity. Rescheduling returns a request to awaiting confirmation. Availability, access rules and status changes are enforced in PocketBase, including direct API calls.

Staff can add a gross HUF estimate after confirmation, either a single total or an itemized parts/labour breakdown. Customers and partners see it in their appointment details. Rescheduling clears the current estimate.

Install the migrations and hook/config files using the **copy-and-paste, in-place CasaOS commands in [docs/APPOINTMENTS.md](./docs/APPOINTMENTS.md)**. They use the existing running container and `/pocketbase/pb_data`; no data redirection, new container, credentials or environment variables are required. Until that backend installation is complete, the portal shows a setup message instead of saving fake local requests.

## Run locally

Requires Node.js 22 or 24 and npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open port **3000**. Set `AUTH_APP_ORIGIN=http://localhost:3000` for local development. Configure `POCKETBASE_URL` for your intended backend; ordinary development defaults to the supplied homelab URL. To use an isolated local PocketBase, set it to `http://127.0.0.1:8090` and apply the migration there. HTTPS is mandatory for backend connections in production. Keep inherited proxy and CA settings in managed cloud environments.

```sh
npm run build
npm start
```

Production authentication requires HTTPS and `AUTH_APP_ORIGIN` matching the deployed origin. Development output uses `.next-dev`; production output uses `.next`; integration tests use `.next-test`.

## Current scope

**Real:** account/profile management, role assignment, private garages, guest/partner appointment requests, phone confirmation, workshop status tracking, cancellation/rescheduling, history, closures and aggregate reports. Guest access uses an HttpOnly capability cookie; account access follows the stored PocketBase role. Requests and personal data are not kept in localStorage.

**Remaining:** shared company membership across multiple accounts, scheduled reminders, repair contracts, work orders and invoicing. A partner's fleet currently belongs to that individual account. Guest-created completed/cancelled requests and related history/mail copies are automatically removed 30 days after closure; open or account-owned records are retained.

Optional appointment notifications use a durable PocketBase outbox and its native mail client; delivery defaults to **off**. Admins can view sanitized queue/transport status and retry failed handoffs without resending accepted messages. Gmail SMTP settings, tested with delivery to the operator’s own inbox, are in [docs/GMAIL_SMTP.md](./docs/GMAIL_SMTP.md). The operator has confirmed delivery from the intended company sender. Unix Sendmail setup and the CasaOS localhost fix are in [docs/LOCAL_SENDMAIL.md](./docs/LOCAL_SENDMAIL.md); activation and price details are in [docs/APPOINTMENT_PRICES_AND_MAIL.md](./docs/APPOINTMENT_PRICES_AND_MAIL.md). Account verification, resend, confirmed email changes and password recovery use PocketBase's native signed-token flows. Emails use branded HTML layouts with the website’s actual logo ([PocketBase logo update](./docs/EMAIL_LOGO.md)); appointment emails retain a text alternative and can include itemized price tables. There is no demo email-preview inbox. Mail workflow and remaining operator requirements are in [`docs/PRODUCTION_EMAIL_REQUIREMENTS.md`](./docs/PRODUCTION_EMAIL_REQUIREMENTS.md).

## Checks

```sh
npm run typecheck
npm run build
npm run format:check
PB_BINARY=/path/to/pocketbase npm test
PB_BINARY=/path/to/pocketbase npm run test:migration
python3 scripts/check-local-sendmail.py
# Optional: exercise the real BusyBox client against a strict loopback SMTP receiver.
BUSYBOX_BINARY=/path/to/busybox python3 scripts/check-local-sendmail.py
```

Integration tests require Python 3, a separately installed PocketBase executable (**0.40.6** for the current suite; **0.26.3/0.26.6** are tested as upgrade sources) and Chromium (`/usr/bin/chromium`, or set `CHROMIUM_PATH`). They create a disposable SQLite database on **127.0.0.1:3101**, apply the real migrations and hooks, seed only test accounts and start a separate Next server on **3100**. They never reuse a running app or send test credentials to the homelab. Test data is removed when the server exits. Never run the test seeding script against a company database.

Coverage includes account registration/login/profile persistence, cookie isolation, native PocketBase permissions, CSRF and input rejection, admin CRUD, role changes, suspended/deleted access, email/password updates, protected admin handling and login throttling. Saved-car persistence, owner isolation, native owner/default forgery rejection, defaults, duplicate plates, fleet pagination/search, concurrent selections and account-deletion cleanup are tested against a disposable PocketBase. Appointment coverage includes native API write restrictions, ownership, guest expiry, idempotent retries after later edits, concurrent confirmations, duration overlaps, closures, legal acceptance, saved-car prefill, staff UI actions, rescheduling, calendar downloads and recovering from a slot becoming full during checkout. VIN persistence and validation, pricing permissions, computed totals, edit conflicts, multi-car selection, blank guest forms and durable mail retries are covered. Mail tests intercept messages locally and never deliver them to a real recipient. Legal links, home navigation, mobile layout and themes remain covered.

## Editable content and legal documents

Business/contact details: [`content/site.ts`](./content/site.ts). Shared service/schedule configuration: [`content/booking.json`](./content/booking.json), also copied into PocketBase as described in the appointment guide. Legal document text: [`content/legal.ts`](./content/legal.ts). Consumer information and editable downloads: `content/consumer.ts` and `content/consumer-forms.ts`. The footer links to privacy, ÁSZF, storage, imprint and consumer information using the site's theme.

The documents describe real PocketBase accounts, vehicles, appointment storage, phone confirmation and guest access cookies. They remain **draft templates** until official business details, retention, processors and operational reviews are completed. [`docs/HUNGARIAN_LEGAL_READINESS.md`](./docs/HUNGARIAN_LEGAL_READINESS.md) lists outstanding operator work. `npm run legal:check` intentionally fails while those requirements are incomplete; it is not a compliance certificate. Editing instructions: [`docs/CONTENT_EDITING.md`](./docs/CONTENT_EDITING.md).

## Next integration steps

PocketBase manages SQLite internally. Company membership across multiple accounts and scheduled reminders remain future work. Browser storage and client-side permissions never authorize appointment operations.

Before public use, apply the security update, protect superuser access, correct the CasaOS data mount before recreating its container, test off-machine backup restoration and complete the legal/operator settings. The deployment requirements are in the security update guide.

The supplied legal documents are readable from the footer and downloadable as TXT/Word. Editable sources: `content/privacy.ts`, `content/data-security.ts`, `content/legal.ts` and `content/site.ts`. Original uploads and correction notes are in [docs/legal-sources](./docs/legal-sources/README.md). Final test findings are recorded in [docs/FINAL_TESTING.md](./docs/FINAL_TESTING.md).
