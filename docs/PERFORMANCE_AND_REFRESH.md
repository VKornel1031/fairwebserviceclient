# Website latency and booking refresh

The security release added a separate backend readiness check before every login and authenticated API request. Waiting for that network response before starting authentication added one full PocketBase round trip. Public production response headers also showed the website functions executing in `iad1` (US), while PocketBase is hosted on the Hungarian server.

Login now starts backend readiness and password authentication together. Session checks likewise start readiness and native session validation together. Both checks must succeed before access is granted. Every request still checks the current account with PocketBase; account roles, suspension, email eligibility and session expiry are not cached. Browser/API responses retain their private, no-store policy and production CSP nonces.

`vercel.json` places the next deployment's functions in `fra1` (Frankfurt), closer to the backend and intended users. This reduces the distance travelled by backend calls. Actual login time also depends on the server's password verification, network and cold starts; the change does not promise a fixed response time.

Appointment lists and the management dashboard check for updates every **five seconds** while visible. They also refresh on focus, returning to the tab and appointment-change notifications. A slow read is allowed to finish before another starts; an intervening change notification queues a follow-up. Navigating away or changing the account/filter aborts the old request. Hidden tabs pause timed reads.

Background updates retain the displayed list, filters, unsent search text, pagination and open dialogs. Temporary errors retain the last result with an error message; rejected authentication/authorization clears the result. Dashboard waiting counts update without a page reload. Writes continue to use server revisions to reject conflicting edits.

The latency and refresh changes are in the website/Vercel code. The service-document feature delivered with them additionally requires the current [CasaOS backend update](./SECURITY_UPDATE.md#copy-paste-installation-on-the-casaos-host), including its document migration.

## Checks

`npm run test:auth-latency` controls the order of upstream responses and verifies that authentication checks overlap, still wait for readiness, fail closed, revalidate revocation on the next request and retain the original session token's expiry.

The browser integration checks create an incoming pending booking from a separate client and verify automatic appearance without navigation, retained search drafts and dialogs, updated manager counts, hidden-tab suspension and no overlapping reads. They use the disposable local PocketBase fixture and never send test credentials to the live server.
