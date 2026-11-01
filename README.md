# Fair Autószerviz · Ügyfélportál

Hungarian service portal built with Next.js, React and TypeScript, matching [Fair Autószerviz's website](https://fairautoweb.vercel.app/).

## Account management

Accounts now use **PocketBase**, without SMTP or email verification:

- Register as a **customer**, then sign in immediately using email and password.
- Save personal and optional company details across devices.
- Accounts display initials; profile picture controls and their setup message have been removed.
- Change email address or password with your current password.
- Admins create, search, edit, suspend and delete accounts, and assign `customer`, `partner`, `reception`, `manager` or `admin` roles.
- Navigation follows the current PocketBase role. The demo role switcher and password-free profile switching have been removed.
- Admin changes require the admin's password. Self-demotion/deletion and changes to a protected root admin are blocked.
- Sessions use HttpOnly cookies; real tokens, passwords and profiles are not stored in browser localStorage. Each authenticated API call checks PocketBase again.

**Setup is required on your PocketBase and Vercel deployment.** Follow [`docs/POCKETBASE_SETUP.md`](./docs/POCKETBASE_SETUP.md), including the versioned migration, first normal `users` admin, and environment settings. No superuser credentials or API keys belong in this app. No avatar setup is needed for the current UI. Public registration defaults to disabled until explicitly enabled after migration.

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

**Real:** registration, login/logout, account/profile management, admin account CRUD, suspension and role assignment.

**Still a prototype:** bookings, vehicles, fleets, workshop operations and reports. Signed-in workspaces show the appropriate role layout with empty operational data and an explicit notice. Operational mutations are blocked until their backend is built. Guest booking remains a separate local demonstration using sample details, with availability checks, calendar downloads, rescheduling and cancellation. It does not notify the garage or send email. Accounts never receive this browser's demo data as real company records.

There is no SMTP, email preview, verification mail or email password recovery. For now, an admin can reset another user's password after independently checking their identity. Future mail requirements remain in [`docs/PRODUCTION_EMAIL_REQUIREMENTS.md`](./docs/PRODUCTION_EMAIL_REQUIREMENTS.md).

## Checks

```sh
npm run typecheck
npm run build
npm run format:check
PB_BINARY=/path/to/pocketbase npm test
PB_BINARY=/path/to/pocketbase npm run test:migration
```

Integration tests require Python 3, a separately installed PocketBase executable (tested with **0.26.3**) and Chromium (`/usr/bin/chromium`, or set `CHROMIUM_PATH`). They create a disposable SQLite database on **127.0.0.1:3101**, apply the real migration, seed only test accounts and start a separate Next server on **3100**. They never reuse a running app or send test credentials to the homelab. Test data is removed when the server exits. Never run the test seeding script against a company database.

Coverage includes account registration/login/profile persistence, cookie isolation, native PocketBase permissions, CSRF and input rejection, admin CRUD, role changes, suspended/deleted access, email/password updates, protected admin handling and login throttling. Guest booking, capacity, calendar, confirmation rules, legal links, home navigation, mobile layout and themes remain covered.

## Editable content and legal documents

Business/contact details, services and booking defaults: [`content/site.ts`](./content/site.ts). Legal document text: [`content/legal.ts`](./content/legal.ts). Consumer information and editable downloads: `content/consumer.ts` and `content/consumer-forms.ts`. The footer links to privacy, ÁSZF, storage, imprint and consumer information using the site's theme.

The documents describe real PocketBase accounts alongside the local booking demonstration. They remain **draft templates** until official business details, retention, processors and operational reviews are completed. [`docs/HUNGARIAN_LEGAL_READINESS.md`](./docs/HUNGARIAN_LEGAL_READINESS.md) lists outstanding operator work. `npm run legal:check` intentionally fails while those requirements are incomplete; it is not a compliance certificate. Editing instructions: [`docs/CONTENT_EDITING.md`](./docs/CONTENT_EDITING.md).

## Next integration steps

PocketBase manages SQLite internally. Remaining work includes company membership/vehicle/appointment collections with independent access rules, transactional server-side capacity reservations, guest management tokens, status history and notification jobs. The existing appointment confirmation workflow remains the basis for the later backend. Browser storage or client-side permissions must never authorize these future operations.

Before company production use, upgrade the old homelab PocketBase, enable backend/edge rate limits, protect superuser routes, test backup restoration and complete the legal/operator settings. See the security boundaries in the setup guide.
