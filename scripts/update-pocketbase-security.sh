#!/usr/bin/env bash
# In-place update for the documented CasaOS /pocketbase installation. No image or volume changes.
set -Eeuo pipefail
umask 077

release_ref=${1:-}
[[ $release_ref =~ ^[a-f0-9]{40}$ ]] || { echo 'Pass the full reviewed Git commit SHA as the first argument.' >&2; exit 1; }
[[ $(id -u) == 0 ]] || { echo 'Run this updater with sudo.' >&2; exit 1; }
container=${PB_CONTAINER:-pocketbase}
host_root=${PB_HOST_ROOT:-/DATA/AppData/pocketbase}
[[ $host_root == /* && $host_root != / ]] || { echo 'PB_HOST_ROOT must be an absolute application directory.' >&2; exit 1; }
for utility in docker curl tar sha256sum mktemp unzip; do command -v "$utility" >/dev/null || { echo "Required command missing: $utility" >&2; exit 1; }; done

stage=$(mktemp -d /tmp/fairauto-security.XXXXXX)
backup=''
stopped=false
backup_complete=false
cleanup() {
  local result=$?
  rm -rf -- "$stage"
  if (( result != 0 )); then
    echo 'Update failed. Do not recreate the container or change its data mounts.' >&2
    if [[ $backup_complete == true ]]; then echo "Verified offline backup: $backup/snapshot.tar.gz" >&2; fi
    if [[ $stopped == true ]]; then echo 'The container is stopped; review the error before starting it.' >&2; fi
  fi
}
trap cleanup EXIT

[[ $(docker inspect --format '{{.State.Running}}' "$container") == true ]] || { echo 'The existing PocketBase container must be running for the preflight.' >&2; exit 1; }
[[ $(docker inspect --format '{{.Config.WorkingDir}}' "$container") == /pocketbase ]] || { echo 'Unexpected WorkingDir; this updater targets /pocketbase.' >&2; exit 1; }
start_command=$(docker inspect --format '{{json .Config.Entrypoint}} {{json .Config.Cmd}}' "$container")
if [[ $start_command == *--dir* || $start_command == *--hooksDir* || $start_command == *--migrationsDir* || $start_command == *--automigrate=false* ]]; then
  echo 'Custom startup paths or disabled automigration detected. Review the deployment before using this updater.' >&2
  exit 1
fi
version=$(docker exec "$container" /pocketbase/pocketbase --version)
[[ $version == 'pocketbase version 0.26.6' || $version == 'pocketbase version 0.26.3' || $version == 'pocketbase version 0.40.6' ]] || { echo "Untested PocketBase version: $version. Review the upgrade guide first." >&2; exit 1; }
docker exec "$container" /bin/sh -c 'test -s /pocketbase/pb_data/data.db && command -v wget >/dev/null'
architecture=$(docker exec "$container" uname -m)
case "$architecture" in
  x86_64) archive_arch=amd64; archive_sha=0e1f609158ed945f809f8a02ae012aa0427129c66ebb63c1aee76f2c0309373f ;;
  aarch64) archive_arch=arm64; archive_sha=d22c66ceb67ca92b7d767f36d826e848a276bcfa3c197ead20bf87c42208984f ;;
  *) echo "Unsupported container architecture: $architecture" >&2; exit 1 ;;
esac

# Finish every download before stopping or modifying the working installation.
mkdir -p "$stage/pb_hooks" "$stage/pb_migrations"
chmod 0755 "$stage/pb_hooks" "$stage/pb_migrations"
curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 120 "https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_linux_$archive_arch.zip" -o "$stage/pocketbase.zip"
printf '%s  %s\n' "$archive_sha" "$stage/pocketbase.zip" | sha256sum -c -
unzip -p "$stage/pocketbase.zip" pocketbase > "$stage/pocketbase"
chmod 0755 "$stage/pocketbase"
source_url="https://raw.githubusercontent.com/VKornel1031/fairwebserviceclient/$release_ref"
hooks=(account.pb.js appointments.pb.js company-accounts.pb.js email-verification.pb.js fairauto-appointments.js fairauto-mail.js fairauto-retention.js fairauto-security.js security.pb.js)
migrations=(1793541600_guest_retention.js 1793545200_email_verification.js 1793548800_email_website_logo.js 1793552400_email_portal_caption.js 1793628000_security_hardening.js)
for file in "${hooks[@]}"; do
  curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 60 "$source_url/pocketbase/pb_hooks/$file" -o "$stage/pb_hooks/$file"
  test -s "$stage/pb_hooks/$file"
  chmod 0644 "$stage/pb_hooks/$file"
done
for file in "${migrations[@]}"; do
  curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 60 "$source_url/pocketbase/pb_migrations/$file" -o "$stage/pb_migrations/$file"
  test -s "$stage/pb_migrations/$file"
  chmod 0644 "$stage/pb_migrations/$file"
done
curl --proto '=https' --tlsv1.2 -fsSL --retry 2 --max-time 60 "$source_url/content/booking.json" -o "$stage/pb_hooks/fairauto-booking.json"
test -s "$stage/pb_hooks/fairauto-booking.json"
chmod 0644 "$stage/pb_hooks/fairauto-booking.json"

# The delivered script authenticates the code assets as well as the executable.
# BEGIN ASSET CHECKSUMS
(cd "$stage" && sha256sum -c - <<'FAIRAUTO_ASSETS'
fc5c73ac2f5b5887bd3b4d6c316a1267b0a1b11e4021e828180ae501d1ec960c  pb_hooks/account.pb.js
a55eff0f926236f73488871dd044ca646d79322f84e1ff908908729e07f0494a  pb_hooks/appointments.pb.js
944e8b75b77aaf12ccd59ec9ffa3eaa3827e7634e4a949dbb229b53738f19acc  pb_hooks/company-accounts.pb.js
e82f6c0d87ec97d4ddf18fb1af940694218407d94055e03adcdd46e5338b007c  pb_hooks/email-verification.pb.js
fbeb861278e8fec6e99a989349292c1564538cd3c98b95fb54e3bb3b1449ec20  pb_hooks/fairauto-appointments.js
bacd2929754719159ca61f24880fe35334e44929b2ae5e9c96bf9f1ce741d8b4  pb_hooks/fairauto-mail.js
1f2ddd5cb143e57a1672033c9914ac0f50e903225d4c9e42436944f23304cb7c  pb_hooks/fairauto-retention.js
e9976e172df3c35e97ddf0ca6c9fbb78a3bd3c1ff7130581c6215d37bdce0220  pb_hooks/fairauto-security.js
4eaef9da532d25b4dab40730a9e6e5f8865a51968c0d3fee775342a8a608d7af  pb_hooks/security.pb.js
29dd00e75352fcf9c52059b5044fd02e37627d6808f21f2af1b6c53ff5a3c912  pb_migrations/1793541600_guest_retention.js
6ab5304fa4fc64f97518d99eb082471ef0a23a1e28beff2762b33320dab1809e  pb_migrations/1793545200_email_verification.js
feef547bc99e87f11926353939f55348dc932f758de1fcf270bf921b8d646d7c  pb_migrations/1793548800_email_website_logo.js
bd5aae5f03a4fec9a34cf06cc386f21133d29f74088e7718a253aee780c01e01  pb_migrations/1793552400_email_portal_caption.js
3beba393e6d78a6586a9105689abb0e822451a8e8af02b2b41195931cc9b599b  pb_migrations/1793628000_security_hardening.js
c0dae9291301d60c9344be840376a29a82e728b398ee66ff134eea71139cfb31  pb_hooks/fairauto-booking.json
FAIRAUTO_ASSETS
)
# END ASSET CHECKSUMS

mkdir -p "$host_root/backups"
backup=$(mktemp -d "$host_root/backups/security-$(date -u +%Y%m%dT%H%M%SZ).XXXXXX")
docker inspect "$container" > "$backup/container.json"
has_hooks=false
has_migrations=false
if docker exec "$container" /bin/sh -c 'test -d /pocketbase/pb_hooks'; then has_hooks=true; fi
if docker exec "$container" /bin/sh -c 'test -d /pocketbase/pb_migrations'; then has_migrations=true; fi
docker stop --time 30 "$container"
stopped=true
mkdir -p "$backup/pb_data" "$backup/pb_hooks" "$backup/pb_migrations"
docker cp "$container:/pocketbase/pb_data/." "$backup/pb_data/"
docker cp "$container:/pocketbase/pocketbase" "$backup/pocketbase"
test -s "$backup/pb_data/data.db"
if [[ $has_hooks == true ]]; then docker cp "$container:/pocketbase/pb_hooks/." "$backup/pb_hooks/"; fi
if [[ $has_migrations == true ]]; then docker cp "$container:/pocketbase/pb_migrations/." "$backup/pb_migrations/"; fi
tar -czf "$backup/snapshot.tar.gz" -C "$backup" pb_data pb_hooks pb_migrations pocketbase container.json
tar -tzf "$backup/snapshot.tar.gz" >/dev/null
(cd "$backup" && sha256sum snapshot.tar.gz > SHA256SUMS && sha256sum -c SHA256SUMS)
backup_complete=true

# Merge code only: fairauto-mail.json, sendmail and existing SMTP settings are preserved.
mkdir -p "$host_root/pb_hooks" "$host_root/pb_migrations"
cp -R "$stage/pb_hooks/." "$host_root/pb_hooks/"
cp -R "$stage/pb_migrations/." "$host_root/pb_migrations/"
docker cp "$stage/pb_hooks" "$container:/pocketbase/"
docker cp "$stage/pb_migrations" "$container:/pocketbase/"
docker cp "$stage/pocketbase" "$container:/pocketbase/pocketbase"
docker start "$container"
stopped=false
ready=false
for ((attempt = 0; attempt < 45; attempt++)); do
  policy=$(docker exec "$container" /bin/sh -c 'wget -qO- http://127.0.0.1:8090/api/fairauto/security-policy' 2>/dev/null || true)
  policy=${policy//[[:space:]]/}
  if [[ $policy == *'"ready":true'* && $policy == *'"version":1'* ]]; then ready=true; break; fi
  sleep 1
done
[[ $ready == true ]] || { echo 'PocketBase did not pass its security readiness check. Inspect docker logs pocketbase.' >&2; exit 1; }
[[ $(docker exec "$container" /pocketbase/pocketbase --version) == 'pocketbase version 0.40.6' ]] || { echo 'PocketBase binary version check failed.' >&2; exit 1; }
docker exec "$container" /bin/sh -c 'wget -qO- http://127.0.0.1:8090/api/fairauto/appointments/config >/dev/null'
echo "Security update installed from $release_ref"
echo "Offline backup: $backup/snapshot.tar.gz"
echo 'Download that backup to a separate machine. Sign in again on the website.'
