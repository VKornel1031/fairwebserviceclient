# Fair Autószerviz · Ügyfélportál

A working Hungarian booking prototype, styled to match [Fair Autószerviz's main website](https://fairautoweb.vercel.app/). Built with Next.js App Router, React, TypeScript and Lucide icons.

## Run locally

Requires Node.js 22 or 24 and npm.

```sh
npm ci
npm run dev
```

Open port **3000**. To run the production version instead:

```sh
npm run build
npm start
```

No environment variables, API keys, PocketBase installation or homelab access are required. Development output uses `.next-dev`; production output uses `.next`, so a build does not overwrite a running development server.

## Try the prototype

The public welcome page is at `/`, with one main booking action, a short three-step explanation and compact account/partner links. The dashboard at `/attekintes` adapts to five profiles: customer, partner, reception, owner/manager and administrator. The owner also manages the workshop calendar. Homepage account invitations open the registration tab directly.

- **Guest:** choose a service, an available weekday/time, enter sample contact and vehicle details, review, and submit. View the resulting booking in **Foglalásaim**, download an `.ics` file, request a different time or cancel it.
- **Personal account:** register in **Saját fiók**, edit contact details and reminder preferences, add/edit/delete vehicles, and choose a default vehicle. Subsequent bookings fill in those details. Sign out and sign back in with the credentials you created.
- **Company account:** tick **Céges partnerként regisztrálok** when registering. In **Partnerközpont**, edit company details, manage a fleet and view company bookings. Each company account has separate vehicles and company details. Partners also get fleet search, booking status filters and CSV exports limited to their own company.
- **Demo accounts:** the **Demó mód** button in the header lets you enter a sample customer, partner, receptionist, owner/manager or administrator account without a password. The sample partner includes two vehicles and one explicitly labelled sample appointment. There is no mechanic profile. Reception staff use their own **Munkafelvevő** workspace.
- **Owner / manager:** choose **Tulajdonos / vezető** in the demo menu. `/vezetes` shows workshop-wide booking counts, upcoming workload, customer mix, 7/30-day filtered reports and CSV downloads. **Műhely és naptár** opens `/muhely`, where the owner approves requests, starts/completes work, cancels requests and blocks/reopens dates. These are summaries of local records, not financial reports. Older staff sessions move to reception; existing bookings and vehicles are kept.
- **Reception:** **Munkafelvevő** opens `/munkafelvetel` for customer intake, appointment confirmation, rescheduling, cancellation and contact details. Bookings entered for customers use their details rather than the staff profile. Reception has no repair-progress controls, reports, closure management or account administration.
- **Administrator:** **Adminisztrátor** opens `/admin` to add/edit/delete accounts and assign roles. Admin-created demo accounts require no password; use **Profil kipróbálása** to open a specific account. Real email/password authentication will be added with PocketBase. Deleting an account removes its saved vehicles and company details, while historical booking snapshots remain as guest bookings. The currently signed-in admin cannot delete or demote itself. Admin also accesses every other workspace.
- **Restart:** **Demó mód → Demó újrakezdése** opens a confirmation. Confirming removes this browser's demo accounts, vehicles, bookings and closures, restores the sample data, and signs out. Theme preferences and unrelated browser storage are preserved. Cancelling leaves your data intact.
- **Theme:** the moon/sun button switches between persistent light and dark themes.

## What is real in the prototype

Data is saved in this browser's localStorage and survives reloads. Forms validate required fields, email, phone and vehicle year. Availability accounts for weekdays, garage hours (06:00–17:00 Budapest time), blocked dates, service duration and **two concurrent appointments**. Arrival slots are hourly and the booking horizon is 90 days. Capacity is intentionally a demo setting, not a claim about actual workshop availability.

Submitting rechecks the latest stored capacity. Web Locks serialize cooperating same-origin browser tabs when supported. Rescheduling replaces the original booking and returns it to requested status. Cancellation frees capacity. Bookings retain contact and vehicle snapshots independently of later profile edits.

New requests are labelled **Telefonos egyeztetésre vár**. Reception staff, owners/managers and admins can confirm them after the phone call; the demo records who confirmed them and when. Rescheduling clears that confirmation and requires another call. This does not initiate a phone call or send email.

Passwords for locally registered accounts are salted and hashed using Web Crypto PBKDF2; plaintext passwords are not persisted. This remains a **local demonstration, not secure backend authentication**. Demo roles can be freely selected, all local records are inspectable, and these permissions must not be used for production data.

## Deliberate boundaries

- No real appointments are sent to Fair Autószerviz.
- No API keys, SQL credentials, homelab endpoints or external database calls.
- No email, verification messages, password recovery or reminder delivery.
- No cross-device sync, remote authorization, payments, coworker invitations or multi-user organisation membership.
- No automatic expiry of pending requests yet; the owner can approve or cancel them.
- A guest can manage guest bookings stored in the same browser. Production guest management will require expiring, unguessable server-validated links.
- Clearing this site's browser storage resets local data; the next visit recreates the sample data. Use sample personal information and a disposable demo password.

## Checks

```sh
npm run typecheck
npm run build
npm test
npm run format:check
```

Browser tests use the system Chromium at `/usr/bin/chromium`. For a different installation:

```sh
CHROMIUM_PATH=/path/to/chromium npm test
```

The test runner starts the dev server if needed. Tests cover guest booking and persistence, calendar download, rescheduling/cancellation, registration/sign-in, profile autofill, vehicle management, separate company fleets, reception intake, admin account management, owner-managed status transitions, closures, capacity rechecks, mobile navigation and theme persistence, plus homepage booking handoff, role-specific navigation, company-scoped exports, management reporting, saved-data compatibility, confirmed demo reset and responsive navigation.

A Hungarian walkthrough for presenting the complete local demo: [`docs/DEMO_WALKTHROUGH.md`](./docs/DEMO_WALKTHROUGH.md).

The requested customer and staff email flow for the later live system is recorded in [`docs/PRODUCTION_EMAIL_REQUIREMENTS.md`](./docs/PRODUCTION_EMAIL_REQUIREMENTS.md). No email sending, preview inbox or SMTP integration is implemented in the demo.

## Editable site content and legal pages

Public business/contact details, service definitions and demo booking defaults live in [`content/site.ts`](./content/site.ts). Legal page copy lives in [`content/legal.ts`](./content/legal.ts). The public homepage and portal footers link to the privacy notice, terms, storage notice, imprint and consumer information, all with matching light/dark styling. These are clearly marked draft templates for the current local demo; missing official company details remain explicit placeholders.

Consumer notice and editable downloads: `content/consumer.ts` and `content/consumer-forms.ts`. Terms acknowledgement versions are recorded for new local accounts/bookings. Fonts are served locally with their original licences. Public homepage visits no longer create a demo account database.

Hungarian legal preparation and source review: [`docs/HUNGARIAN_LEGAL_READINESS.md`](./docs/HUNGARIAN_LEGAL_READINESS.md). `npm run legal:check` currently exits nonzero because verified company details and operator reviews are still missing; it is a completeness check, not a compliance certificate.

Hungarian editing guide: [`docs/CONTENT_EDITING.md`](./docs/CONTENT_EDITING.md).

PocketBase account setup, fields, tested API rules, verification and SMTP guidance: [`docs/POCKETBASE_SETUP.md`](./docs/POCKETBASE_SETUP.md). The collection rules were verified separately against the user's PocketBase version, 0.26.3; the frontend is still in demo mode and has no live PocketBase connection.

## Local account rules

`lib/permissions.ts` defines role labels and local capabilities. `reception` coordinates appointments; `manager` also manages workshop work and reports; `admin` additionally administers accounts. Public registration only creates customers or demo partners. These client-side demo rules must be enforced independently by the future backend. Deleted sample accounts stay deleted; restarting the demo restores all five profiles.

## Future PocketBase integration

PocketBase on the homelab will manage SQLite internally. The local storage boundary is in `lib/demo.ts` and `components/provider.tsx`; it is the replacement point for the PocketBase client and backend operations.

Production work should introduce:

1. PocketBase auth and server-enforced collection rules, verified accounts and password recovery.
2. Users, organisations, memberships, vehicles, services, appointments, availability rules, closures, events and notification jobs, with versioned migrations.
3. A custom booking/rescheduling endpoint that validates all fields and reserves workshop capacity in **one SQLite transaction**. Browser locks are not a substitute for this.
4. Server-generated guest management links, request expiry, status history and owner/manager permissions.
5. SMTP and a persistent scheduler for confirmation/reminder emails.
6. Stable homelab HTTPS access, backup/restore and health monitoring.

The main site's booking buttons can later point to `/idopont?service=inspection` (or `maintenance`, `diagnostics`, `tyres`, `other`). Vehicle links use `?vehicle=<id>`; availability previews can also pass `date=YYYY-MM-DD&time=HH:mm`.

The logo and workshop photograph in `public/images` come from the user's referenced main website. Font families and palette match its public styling (font files are now served locally): Outfit headings, Inter text, off-white/charcoal surfaces and grayscale photography.
