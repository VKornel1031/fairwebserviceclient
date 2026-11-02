# Security update · 2 November 2026

This release hardens the website and PocketBase together. Install the backend update in a short maintenance window, then sign in again. The website refuses authenticated operations against an older or incomplete backend security policy.

## What changed

- User and superuser password failures are counted atomically in PocketBase's SQLite database: eight attempts per address and auth collection in 15 minutes. Success clears that address's failures. Refreshing a session does not use the failure budget. Counts survive restarts and apply across frontend instances, collection names/IDs and forged forwarding headers. An application user cannot exhaust a same-address superuser's separate budget.
- Verification, recovery and email-change requests share a persistent per-address budget. Nonexistent addresses receive the same limits. Private counters contain hashes and expire automatically.
- Native password-change proofs have their own persistent per-account failure budget. The retired direct email-change route returns 410 without checking any password, closing a separate password-checking oracle.
- Password/email changes share the proof budget even through native endpoints. Administrator create/edit/delete requests require the acting administrator's current password inside PocketBase; the login failure budget also covers these proofs. The website supplies a transient `adminPassword` request value. It is never a collection field or response value; schema checks reject an installation that could store it. Token-only direct requests cannot skip the check.
- Native collection rules and custom appointment routes reject accounts that have lost required email verification. Legacy accounts keep their documented access without being falsely marked verified. Suspended accounts remain suspended.
- Existing avatar files become protected even if the old optional avatar migration was skipped. New uploads are limited to one JPEG/PNG/WebP of at most 1 MiB, and unused native thumbnail generation is disabled. Historical files are retained.
- PocketBase's native rate limiter is enabled. Separate limits accommodate the website's shared backend connection and fleet creation. Existing operator rules for the same labels remain intact. Unused batch requests are disabled.
- Production pages use a different CSP nonce on every response, with no inline-script or eval allowance. React and the initial theme script receive that nonce. Objects, framing, inline event handlers and external browser connections are blocked. Nonce-bearing pages and API responses are not cached. Production HTTPS/origin/backend configuration is checked explicitly.
- Direct bookings reject overflowing times such as `05:60` and misleading JSON media types.
- The updater installs pinned **PocketBase 0.40.6**, including newer upstream security fixes. SHA-256 checksums for all installed code/configuration assets and the official AMD64/ARM64 ZIPs are embedded in the script; the executable is downloaded and verified before stopping the current container.
- Daily native backups are enabled when no schedule exists, with at least seven copies. Existing schedules, backup destinations, proxy trust, sender settings, SMTP credentials and appointment-mail configuration are retained.

The CSP permits inline styles because React and the current UI use style attributes. Script execution uses nonces and `strict-dynamic`. Authorization remains in API handlers and PocketBase rules; middleware adds browser protections.

## Copy-paste installation on the CasaOS host

Use the exact commit SHA linked in the delivery message. The repository is currently public. Install `unzip` if missing (`sudo apt-get install unzip` on Debian/CasaOS).

```bash
FAIRAUTO_REF=PASTE_THE_FULL_DELIVERED_COMMIT_SHA
FAIRAUTO_SCRIPT=$(mktemp /tmp/fairauto-security.XXXXXX.sh) &&
curl --proto '=https' --tlsv1.2 -fsSL \
  "https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/$FAIRAUTO_REF/scripts/update-pocketbase-security.sh" \
  -o "$FAIRAUTO_SCRIPT" &&
sudo bash "$FAIRAUTO_SCRIPT" "$FAIRAUTO_REF"
```

The delivery message includes the script's SHA-256 to verify the download before execution. No password or API key belongs in this command.

The updater targets the existing `pocketbase` container, `/pocketbase/pb_data/data.db`, default hook/migration paths and `WorkingDir=/pocketbase`. It accepts documented 0.26.3/0.26.6 installations or an already updated 0.40.6 installation on Linux AMD64/ARM64. Custom startup directories or disabled automatic migrations stop the preflight. It does not create a container, redirect data or change mounts.

All downloads finish first. The container is stopped, and the actual database, uploads, old executable, hooks, migrations and container metadata are copied into a root-private host directory. A checked `snapshot.tar.gz` and `SHA256SUMS` are created **before** installing code. Download the archive to a separate machine. The archive and container metadata may contain personal data or secrets; keep them private.

The update overlays code and booking configuration, retaining `fairauto-mail.json` and sendmail. Applied migrations are skipped; recent email/retention migrations are included if pending. The earlier account, vehicle and appointment schema must already be installed. PocketBase upgrades its core schema when the new executable starts.

Success requires executable version 0.40.6, local security policy `{"ready":true,"version":1}`, and working appointment configuration. Download failures leave the running installation alone. Backup/installation failures leave the container stopped and print the completed backup location when one exists. Do not recreate the container to resolve an error.

Read-only checks after success:

```sh
sudo docker exec pocketbase /pocketbase/pocketbase --version
sudo docker exec pocketbase /bin/sh -c \
  'wget -qO- http://127.0.0.1:8090/api/fairauto/security-policy'
sudo docker exec pocketbase /bin/sh -c \
  'wget -qO- http://127.0.0.1:8090/api/fairauto/appointments/config'
```

## Recovery

The backup contains the old executable and matching database. A downgrade must restore these together. Keep the failed installation's current data separately before restoring; it may contain new requests. Stop PocketBase, verify the archive's SHA-256, extract it into a separate directory, and restore the complete `pb_data`, executable, hooks and migrations into the same container. Recovery should replace the complete directory from the snapshot; overlaying an old database can leave incompatible or orphaned files. Do not switch the data path to `/pb_data` or recreate the container with the old CasaOS defaults.

## Server-side work before public operation

The repository cannot apply settings on your CasaOS, Cloudflare or mail accounts. Complete these deployment steps:

1. Protect `/_/` and native superuser API access with Cloudflare Access or a VPN. Enable superuser MFA after testing recovery. Remove image-provided default credentials. Restrict direct origin exposure and retain TLS verification.
2. Correct CasaOS persistence before container recreation: this installation's live data is at **`/pocketbase/pb_data`**, while the historical mount was `/pb_data`. The updater preserves the current container and makes an external snapshot; it does not rewrite the managed CasaOS service. Mount the actual data directory, preserve the verified executable/hooks on rebuilds, and test restoration in isolation.
3. Update the host/container OS CA bundle and maintain OS/image security patches. Replacing the executable does not refresh the old image's OS. The [0.40.6 release](https://github.com/pocketbase/pocketbase/releases/tag/v0.40.6) specifically recommends checking CA updates.
4. Keep off-machine backups and monitor free space and daily jobs. Native backups on the same disk do not protect against losing that disk. Existing backups and external mailboxes have separate retention obligations.
5. Set production `AUTH_APP_ORIGIN` to the exact HTTPS website origin and `POCKETBASE_URL` to the HTTPS backend origin. Keep email `Application / App URL` and `fairauto-mail.json.appUrl` aligned. After deployment, verify delivery to your own mailbox.
6. Apply edge limits per real visitor for sustained abuse. Backend requests share frontend/proxy egress IPs; native IP limits supplement persistent address limits. Trust proxy headers only when the origin is restricted to that proxy.

The legal readiness check still reports incomplete operator/legal declarations. Security testing does not fill those declarations or make the draft documents final.

## Verification

Regression tests use disposable loopback-only databases and intercepted mail. They cover account permissions/revocation, native access, guests, booking races, vehicles, prices, mail, retention and browser flows. A separate production browser check verifies nonce/cache isolation, hydration and enforcement against injected HTML.

```sh
npm ci
npm run build
npm run typecheck
npm run test:production-security
PB_BINARY=/path/to/pocketbase npm test
PB_BINARY=/path/to/pocketbase npm run test:migration
PB_BINARY=/path/to/pocketbase-0.26.6 \
  PB_UPGRADE_BINARY=/path/to/pocketbase-0.40.6 npm run test:migration
PB_RELEASE_ARCHIVE=/path/to/pocketbase_0.40.6_linux_amd64.zip npm run test:updater
python3 scripts/check-local-sendmail.py
npm audit
```

The updater test exercises the shell script against a filesystem Docker double, including download, backup and installation failures. The database upgrade check starts with the older executable, applies new core/application migrations with 0.40.6, verifies preserved records and mail settings, and checks limit persistence and expiry. These checks do not certify live storage, proxy configuration or backup restoration.
