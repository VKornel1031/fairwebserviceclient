# Security and service-document verification · 3 November 2026

The verified flow is company registration and email confirmation → authenticated Next.js API → PocketBase authorization and persistence → account, fleet and appointment screens. Guest bookings use a separate capability cookie. Tests use disposable loopback databases and intercepted mail.

## Results

| Check                                                                          | Result                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete browser/API/data regression suite, PocketBase 0.40.6                  | **85 passed**                                                                                                                                                                            |
| Avatar checks after hardening historical file metadata                         | **4 passed**                                                                                                                                                                             |
| Production Next.js build and TypeScript                                        | Passed                                                                                                                                                                                   |
| Production browser security check                                              | Passed: fresh nonces, private caching, hydration, persistent theme, blocked injected HTML scripts/handlers, secure cookie flags, CSRF and missing-backend rejection                      |
| 0.26.3 → 0.40.6 upgrade                                                        | Passed                                                                                                                                                                                   |
| 0.26.6 → 0.40.6 upgrade                                                        | Passed                                                                                                                                                                                   |
| Actual updater shell script with a filesystem Docker double                    | Passed: older and already-updated 0.40.6 installations, download failure, corrupted code, corrupted binary, backup failure, timezone installation failure and code installation failure  |
| Real Docker compatibility, Debian 12 and `argonptg/pocketbase:0.26.6` on AMD64 | Passed: offline backup, 0.40.6 upgrade, automatic migrations, Budapest timezone installation, readiness, legacy login, retained uploads/mail configuration and unchanged container/mount |
| Dependency audit, including development dependencies                           | **0 known vulnerabilities**                                                                                                                                                              |
| Sendmail wrapper checks                                                        | 6 passed; optional real BusyBox check skipped                                                                                                                                            |
| Formatting, shell syntax, Python compilation and whitespace                    | Passed                                                                                                                                                                                   |

The upgrade checks preserve account credentials, roles, suspensions, protected admins, vehicle ownership/defaults, appointments, file contents, SMTP settings and custom backup/rate-limit configuration. A previously public legacy avatar is denied anonymously after upgrade and remains accessible to its owner through a signed file token. Applying the same migration files twice is safe through the migration history. Failure counters survive restart and expire correctly.

The real Docker check used the documented image (`sha256:0481dcd7d226252f4b341f070bd1cb76db58d44025a49c5ea53d7c9ec7d542e7`) and reproduced the historical `/pb_data` mount while keeping the active database at `/pocketbase/pb_data`. The original updater reached security readiness but failed the booking check because the minimal image lacked Budapest timezone data. The corrected updater copies the host's distribution-managed timezone file after the offline backup and before restart. The full real-container check then passed, including booking's winter/summer timezone validation and a login using the legacy test account's original password.

The English, Hungarian and earlier update guides now carry the same complete deployment block, including prerequisites, the release commit and script checksum. All shell blocks have valid Bash syntax; the installation blocks contain no placeholders and check the script hash before execution.

## Document, latency and automatic-refresh checks

The new price/document flow passed browser and API tests for reception, admin and owner/manager permissions; PDF, JPG and PNG round trips; the 3 MB limit; wrong file contents/extensions; stale revisions; private owner and guest downloads; immediate suspension revocation; denial of native record and protected-file access; immutable attachments across email retries and replacement; and cascading record/file deletion. Test email attachments were read and hashed by an interceptor; no test email left the disposable fixture.

The visible booking list detects a new pending request from a separate client without page navigation, while preserving unsubmitted search text and an open dialog. Manager waiting counts update without changing the report period. A controlled clock checks hidden-tab suspension and prevents overlapping reads. The authentication check verifies that readiness and authentication overlap, both must succeed, revocation is checked again on the next request and the session token’s original expiry is retained.

A fresh production build passed browser nonce/cache, hydration, cookie and origin checks. Vercel configuration selects Frankfurt for the next deployment; this is not a measured live-server latency guarantee. The existing 0.40.6 installation is supported; its document migration/readiness check passed without a core-version change. Both documented older core-version upgrade paths passed as well.

The updated shell installer also passed in a real disposable Debian 12 host container with an actual `argonptg/pocketbase:0.26.6` container. This run supplied the reviewed source assets and official cached binary ZIP locally through the download test adapter, then checked their pinned SHA-256 values. It verified offline backup, automatic document/security migrations, timezone checks, document readiness, retained live-data marker and mail configuration, and unchanged container/mounts. This supplements the earlier real network-download compatibility run; it does not inspect the user’s live CasaOS server.

The current legal pages have no public template badge. The ÁSZF and privacy text cover service documents, the common version is `2026-11-03.1`, and current text/Word downloads match that version. Previous texts are retained under `docs/legal-history/2026-11-01.6-draft/`. Confirmed company details were retained; unconfirmed operator declarations remain on the internal checklist.

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

The production browser check uses a local production build. No live customer database was used or changed, and no real email was sent. The updater's Docker operations were tested with both a filesystem double and a real disposable AMD64 container using the documented image. The real host-prerequisite check ran in a disposable Debian 12 container. This checks the Docker procedure, not the CasaOS web interface or the user's live server. ARM64 is supported by the updater but was not executed in this Docker check. Live storage, proxy policies and off-machine restoration still require operator verification.

Use [the complete security updater](./SECURITY_UPDATE.md), which verifies the executable and every code/configuration asset before stopping the existing container and making an offline backup. The guide identifies the existing CasaOS data-mount mismatch, native superuser protection/MFA, OS/CA updates and off-machine backup requirements.

`npm run legal:check` still fails intentionally on unfinished operator/legal declarations. The company details were confirmed by the operator. Other unconfirmed declarations and reviews were not marked complete without evidence.
