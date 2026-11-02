# Security verification · 2 November 2026

The verified flow is company registration and email confirmation → authenticated Next.js API → PocketBase authorization and persistence → account, fleet and appointment screens. Guest bookings use a separate capability cookie. Tests use disposable loopback databases and intercepted mail.

## Results

| Check                                                         | Result                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete browser/API/data regression suite, PocketBase 0.40.6 | **77 passed**                                                                                                                                                       |
| Avatar checks after hardening historical file metadata        | **4 passed**                                                                                                                                                        |
| Production Next.js build and TypeScript                       | Passed                                                                                                                                                              |
| Production browser security check                             | Passed: fresh nonces, private caching, hydration, persistent theme, blocked injected HTML scripts/handlers, secure cookie flags, CSRF and missing-backend rejection |
| 0.26.3 → 0.40.6 upgrade                                       | Passed                                                                                                                                                              |
| 0.26.6 → 0.40.6 upgrade                                       | Passed                                                                                                                                                              |
| Actual updater shell script with a filesystem Docker double   | Passed: success, download failure, corrupted code, corrupted binary, backup failure and installation failure                                                        |
| Dependency audit, including development dependencies          | **0 known vulnerabilities**                                                                                                                                         |
| Sendmail wrapper checks                                       | 6 passed; optional real BusyBox check skipped                                                                                                                       |
| Formatting, shell syntax, Python compilation and whitespace   | Passed                                                                                                                                                              |

The upgrade checks preserve account credentials, roles, suspensions, protected admins, vehicle ownership/defaults, appointments, file contents, SMTP settings and custom backup/rate-limit configuration. A previously public legacy avatar is denied anonymously after upgrade and remains accessible to its owner through a signed file token. Applying the same migration files twice is safe through the migration history. Failure counters survive restart and expire correctly.

## Boundaries checked

| Boundary                       | Evidence                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser → website API          | Cross-origin writes, mass assignment, malformed/oversized bodies and missing sessions are rejected; cookies are HttpOnly, host-scoped and Secure in production.                                                                                   |
| Website → PocketBase           | Explicit production HTTPS configuration and backend readiness are required; no superuser credential is used by the website.                                                                                                                       |
| Native PocketBase API          | Collection aliases and forged forwarding headers cannot bypass address limits. Admin mutations require the actor's password, with a target whose password differs from the admin's. Password/email proof limits apply before password validation. |
| Database → authorized response | Owner/staff permissions, suspension and verification revocation, private counters/files, booking capacity races, revisions and durable mail are covered.                                                                                          |
| Response → screen              | Account changes isolate fleets, prices stay read-only for customers, and a delayed garage response cannot fill a staff customer booking with the staff member's own car.                                                                          |

The React review checked abort cleanup, current-viewer checks and booking-mode resolution before autofill. The UI labels and keyboard controls remain covered by browser tests.

## Deployment scope

The production browser check uses a local production build. No live customer database was used or changed, and no real email was sent. The updater's Docker operations were tested with a filesystem double; actual database upgrades used real PocketBase executables. Live Docker storage, proxy policies and off-machine restoration still require operator verification.

Use [the complete security updater](./SECURITY_UPDATE.md), which verifies the executable and every code/configuration asset before stopping the existing container and making an offline backup. The guide identifies the existing CasaOS data-mount mismatch, native superuser protection/MFA, OS/CA updates and off-machine backup requirements.

`npm run legal:check` still fails intentionally on unfinished operator/legal declarations. The draft flag, business details, processors, retention declarations and operational reviews were not marked complete without evidence.
