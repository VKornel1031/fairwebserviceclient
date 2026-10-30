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

- **Guest:** choose a service, an available weekday/time, enter sample contact and vehicle details, review, and submit. View the resulting booking in **Foglalásaim**, download an `.ics` file, request a different time or cancel it.
- **Personal account:** register in **Saját fiók**, edit contact details and reminder preferences, add/edit/delete vehicles, and choose a default vehicle. Subsequent bookings fill in those details. Sign out and sign back in with the credentials you created.
- **Company account:** tick **Céges partnerként regisztrálok** when registering. In **Partnerközpont**, edit company details, manage a fleet and view company bookings. Each company account has separate vehicles and company details.
- **Demo accounts:** the **Demó mód** button in the header lets you enter a sample customer, partner or staff account without a password. The sample partner includes two vehicles and one explicitly labelled sample appointment.
- **Staff:** enter the **Műhely munkatárs** demo. Review all browser-local bookings, approve requests, start/complete work, reject/cancel a request and block/reopen dates. You can book as a guest, then switch to staff to approve that same request.
- **Theme:** the moon/sun button switches between persistent light and dark themes.

## What is real in the prototype

Data is saved in this browser's localStorage and survives reloads. Forms validate required fields, email, phone and vehicle year. Availability accounts for weekdays, garage hours (06:00–17:00 Budapest time), blocked dates, service duration and **two concurrent appointments**. Arrival slots are hourly and the booking horizon is 90 days. Capacity is intentionally a demo setting, not a claim about actual workshop availability.

Submitting rechecks the latest stored capacity. Web Locks serialize cooperating same-origin browser tabs when supported. Rescheduling replaces the original booking and returns it to requested status. Cancellation frees capacity. Bookings retain contact and vehicle snapshots independently of later profile edits.

Passwords for locally registered accounts are salted and hashed using Web Crypto PBKDF2; plaintext passwords are not persisted. This remains a **local demonstration, not secure backend authentication**. Demo roles can be freely selected, all local records are inspectable, and these permissions must not be used for production data.

## Deliberate boundaries

- No real appointments are sent to Fair Autószerviz.
- No API keys, SQL credentials, homelab endpoints or external database calls.
- No email, verification messages, password recovery or reminder delivery.
- No cross-device sync, remote authorization, payments, coworker invitations or multi-user organisation membership.
- No automatic expiry of pending requests yet; staff can approve or cancel them.
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

The test runner starts the dev server if needed. Tests cover guest booking and persistence, calendar download, rescheduling/cancellation, registration/sign-in, profile autofill, vehicle management, separate company fleets, staff status transitions, closures, capacity rechecks, mobile navigation and theme persistence.

## Future PocketBase integration

PocketBase on the homelab will manage SQLite internally. The local storage boundary is in `lib/demo.ts` and `components/provider.tsx`; it is the replacement point for the PocketBase client and backend operations.

Production work should introduce:

1. PocketBase auth and server-enforced collection rules, verified accounts and password recovery.
2. Users, organisations, memberships, vehicles, services, appointments, availability rules, closures, events and notification jobs, with versioned migrations.
3. A custom booking/rescheduling endpoint that validates all fields and reserves workshop capacity in **one SQLite transaction**. Browser locks are not a substitute for this.
4. Server-generated guest management links, request expiry, status history and staff permissions.
5. SMTP and a persistent scheduler for confirmation/reminder emails.
6. Stable homelab HTTPS access, backup/restore and health monitoring.

The main site's booking buttons can later point to `/idopont?service=inspection` (or `maintenance`, `diagnostics`, `tyres`, `other`). Vehicle links use `?vehicle=<id>`; availability previews can also pass `date=YYYY-MM-DD&time=HH:mm`.

The logo and workshop photograph in `public/images` come from the user's referenced main website. Font families and palette match its public styling: Outfit headings, Inter text, off-white/charcoal surfaces and grayscale photography.
