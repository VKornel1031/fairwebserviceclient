# Security update · 2 November 2026

This release hardens the website and PocketBase together. Install the backend update in a short maintenance window, then sign in again. The website refuses authenticated operations against an older or incomplete backend security policy.

## Copy-paste installation on the CasaOS host

On your existing Debian/Ubuntu CasaOS machine, open an SSH session or the host terminal where you previously ran `sudo docker` commands. Copy the **entire block below**. No commit, path, password, API key or other value needs replacing. Run it on the host, outside the PocketBase container.

```bash
sudo apt-get update &&
sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y bash ca-certificates coreutils curl tar unzip tzdata &&
sudo curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 120 https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/57b6a2c9fbe834f4005d174a02e1f65dbc9b990b/scripts/update-pocketbase-security.sh -o /root/fairauto-security-update.sh &&
printf '%s  %s\n' '02901801b25c2c3e9d6de43892e6f39e6709a2ec17e9e52940d1931852eafaca' '/root/fairauto-security-update.sh' | sudo sha256sum -c - &&
sudo bash /root/fairauto-security-update.sh 57b6a2c9fbe834f4005d174a02e1f65dbc9b990b &&
sudo docker exec pocketbase /pocketbase/pocketbase --version &&
sudo docker exec pocketbase /bin/sh -c 'wget -qO- http://127.0.0.1:8090/api/fairauto/security-policy'
```

Enter your normal CasaOS/Linux sudo password if the terminal asks. The repository is public, so GitHub login is unnecessary. The SHA-256 check must print `OK` before the updater runs. The download and its installed assets are pinned to the reviewed backend release, even if this documentation is updated later.

The block installs the required host utilities and `tzdata`, checks compatibility, downloads and verifies the release, stops the existing container, saves a verified offline backup, upgrades PocketBase to **0.40.6**, installs the matching hooks and configuration, starts the same container, and checks security readiness. It copies the distribution-managed Budapest timezone data into the container so booking can validate winter and summer time. Pending included migrations run automatically at startup; applied migrations are skipped. You do not need a separate `migrate up` or restart command.

Success ends with `pocketbase version 0.40.6` and a JSON response containing `"ready":true` and `"version":1`. The updater prints the offline backup path under `/DATA/AppData/pocketbase/backups/`. Download that backup to a separate machine and sign in to the website again.

If a command fails, later commands in the block stop. Read the error and use the diagnostics below; do not recreate the container. The update completes the PocketBase work described here. The [account-specific production settings](#server-side-work-before-public-operation) remain separate.

## CasaOS compatibility

[CasaOS supports Docker apps and recommends Debian 12](https://github.com/IceWhaleTech/CasaOS#system-compatibility). These commands use the existing Docker engine and standard Debian/Ubuntu host packages. The updater uses documented Docker operations, including [copying files from and into a stopped container](https://docs.docker.com/reference/cli/docker/container/cp/).

This procedure targets the installation recorded in your earlier terminal output:

| Item                        | Required value                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Host                        | Debian/Ubuntu with `apt-get`, `sudo`, Bash and the existing CasaOS Docker engine           |
| Existing container          | `pocketbase`, already running                                                              |
| Container working directory | `/pocketbase`                                                                              |
| Startup                     | `serve --http=0.0.0.0:8090`, default hook/migration paths and automatic migrations enabled |
| Active database             | `/pocketbase/pb_data/data.db`                                                              |
| Executable                  | `/pocketbase/pocketbase`                                                                   |
| Accepted starting versions  | 0.26.3, 0.26.6 or an already updated 0.40.6                                                |
| Container architecture      | `x86_64` / AMD64 or `aarch64` / ARM64                                                      |
| Container utilities         | `/bin/sh` and `wget`                                                                       |

The host `tzdata` package provides `/usr/share/zoneinfo/Europe/Budapest`; the command block installs it automatically.

CasaOS also supports ARMv7, but this updater does not install a 32-bit binary. Custom startup directories or disabled automatic migrations stop the preflight. The updater checks the version, architecture, paths and required utilities before stopping PocketBase. It preserves the existing container and its mounts; it does not reinstall Docker or CasaOS.

CasaOS may still display the original `argonptg/pocketbase:0.26.6` image tag. The version command verifies the actual updated executable. Before recreating the app or installing a new image through CasaOS, complete the [persistence step below](#server-side-work-before-public-operation).

Optional read-only checks for the recorded container settings:

```sh
sudo docker inspect pocketbase --format 'Running={{.State.Running}} WorkingDir={{.Config.WorkingDir}} Args={{json .Args}}' &&
sudo docker exec pocketbase uname -m &&
sudo docker exec pocketbase /pocketbase/pocketbase --version &&
sudo docker exec pocketbase /bin/sh -c 'test -s /pocketbase/pb_data/data.db && command -v wget'
```

Your earlier output established the container paths, not the current health of the live server. Compatibility and upgrade tests use disposable data; the command above performs the live preflight when you run it.

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
- Minimal CasaOS images receive the host's distribution-managed `Europe/Budapest` timezone data. Booking verifies both winter and summer offsets; missing host timezone data stops the preflight before downtime.
- Daily native backups are enabled when no schedule exists, with at least seven copies. Existing schedules, backup destinations, proxy trust, sender settings, SMTP credentials and appointment-mail configuration are retained.

The CSP permits inline styles because React and the current UI use style attributes. Script execution uses nonces and `strict-dynamic`. Authorization remains in API handlers and PocketBase rules; middleware adds browser protections.

## Backup, migrations and diagnostics

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

If the updater reports a startup or readiness failure, inspect the state and recent logs:

```sh
sudo docker inspect pocketbase --format 'Status={{.State.Status}} ExitCode={{.State.ExitCode}}' &&
sudo docker logs --tail 100 pocketbase
```

Review logs locally; avoid posting customer data or credentials. A failed installation may intentionally leave PocketBase stopped so the error can be investigated before further changes.

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
