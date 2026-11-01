#!/usr/bin/env python3
"""Connect the existing CasaOS PocketBase BusyBox client to host Sendmail.

Only host mail configuration and the container's sendmail executable change.
No PocketBase data, ports, mounts, environment, auth, or Tunnel settings change.
Run on the CasaOS host as root; --check prints the proposed addresses only.
"""
import argparse
from datetime import datetime, timezone
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import selectors
import subprocess
import tempfile
import time

BEGIN = "dnl BEGIN FAIRAUTO POCKETBASE MAIL"
END = "dnl END FAIRAUTO POCKETBASE MAIL"
ACCESS_BEGIN = "# BEGIN FAIRAUTO POCKETBASE MAIL"
ACCESS_END = "# END FAIRAUTO POCKETBASE MAIL"
ROOT = Path("/DATA/AppData/pocketbase")
MC = Path("/etc/mail/sendmail.mc")
ACCESS = Path("/etc/mail/access")


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def network_addresses(networks):
    found = []
    for network in networks.values():
        try:
            client = ipaddress.IPv4Address(network.get("IPAddress", ""))
            gateway = ipaddress.IPv4Address(network.get("Gateway", ""))
        except ipaddress.AddressValueError:
            continue
        if not client.is_private or not gateway.is_private or client.is_loopback or gateway.is_loopback:
            raise ValueError("Only a private Docker IPv4 bridge is supported.")
        found.append((str(client), str(gateway)))
    if len(found) != 1:
        raise ValueError("Expected one private Docker IPv4 bridge. No settings changed.")
    return found[0]


def replace_block(source, begin, end, block):
    if source.count(begin) != source.count(end) or source.count(begin) > 1:
        raise ValueError("Ambiguous existing Fairauto configuration block.")
    return re.sub(re.escape(begin) + r"\n.*?" + re.escape(end) + r"\n?", "", source, flags=re.S), block


def mail_configuration(source, gateway):
    if "access_db" not in source:
        raise ValueError("Sendmail access_db feature is required. No settings changed.")
    clean, _ = replace_block(source, BEGIN, END, "")
    first_mailer = re.search(r"(?m)^\s*MAILER\(", clean)
    if not first_mailer:
        raise ValueError("Expected Debian Sendmail .mc configuration. No settings changed.")
    block = BEGIN + "\nDAEMON_OPTIONS(`Family=inet, Name=FAIRAUTO-PB, Port=2525, Addr=" + gateway + "')dnl\n" + END + "\n"
    return clean[:first_mailer.start()] + block + clean[first_mailer.start():]


def relay_configuration(source, client):
    clean, _ = replace_block(source, ACCESS_BEGIN, ACCESS_END, "")
    return clean.rstrip() + "\n" + ACCESS_BEGIN + "\nConnect:" + client + "\tRELAY\n" + ACCESS_END + "\n"


def smtp_probe(command, timeout=30):
    """Wait for a complete SMTP greeting before QUIT; never pipeline before 220."""
    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        buffer = b""
        deadline = time.monotonic() + timeout
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ)
            ready = False
            while not ready:
                remaining = deadline - time.monotonic()
                if remaining <= 0 or not selector.select(remaining):
                    raise RuntimeError("Timed out waiting for the private SMTP greeting; no message was sent.")
                chunk = os.read(process.stdout.fileno(), 4096)
                if not chunk:
                    raise RuntimeError("The private SMTP connection closed before its greeting; no message was sent.")
                buffer += chunk
                if len(buffer) > 16384:
                    raise RuntimeError("Unexpectedly large SMTP greeting; no message was sent.")
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    if line.startswith(b"220 ") or line.rstrip() == b"220":
                        ready = True
                        break
                    if not line.startswith(b"220-"):
                        code = line[:3].decode("ascii", errors="replace")
                        raise RuntimeError("Private SMTP greeting was rejected (code " + code + "); no message was sent.")
        process.communicate(input=b"QUIT\r\n", timeout=5)
        if process.returncode:
            raise RuntimeError("The SMTP probe exited with a transport error; no message was sent.")
    finally:
        if process.poll() is None:
            process.kill()
            process.communicate()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Read-only preflight; do not change files or restart services")
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise SystemExit("Run this helper with sudo on the CasaOS host.")
    networks = json.loads(subprocess.check_output(["docker", "inspect", "pocketbase", "--format", "{{json .NetworkSettings.Networks}}"], text=True))
    client, gateway = network_addresses(networks)
    run(["systemctl", "is-active", "--quiet", "sendmail"])
    run(["docker", "exec", "pocketbase", "/bin/busybox", "true"])
    listeners = subprocess.check_output(["ss", "-H", "-ltnp", "sport = :2525"], text=True)
    if listeners.strip() and not (BEGIN in MC.read_text() and "sendmail" in listeners and gateway + ":2525" in listeners):
        raise SystemExit("Port 2525 is already used by another listener. No settings changed.")
    new_mc = mail_configuration(MC.read_text(), gateway)
    new_access = relay_configuration(ACCESS.read_text(), client)
    wrapper_path = ROOT / "sendmail-wrapper.sh"
    wrapper = wrapper_path.read_text().replace("__FAIRAUTO_MAIL_SERVER__", gateway + ":2525")
    if "__FAIRAUTO_" in wrapper or not wrapper.startswith("#!/bin/sh\n"):
        raise SystemExit("Download the matching sendmail-wrapper.sh before running this helper.")
    print("PocketBase IP:", client, "Private host listener:", gateway + ":2525", flush=True)
    if args.check:
        print("Preflight passed; no settings changed.")
        return
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    backup = ROOT / "mail-backups" / stamp
    backup.mkdir(parents=True, mode=0o700)
    original_files = []
    mail_paths = [MC, MC.with_suffix(".cf"), ACCESS, ACCESS.with_name("access.db")]
    for path in mail_paths:
        if path.exists():
            shutil.copy2(path, backup / path.name)
            original_files.append(path)
    container_backup = "/usr/sbin/sendmail.fairauto-backup-" + stamp
    # cp -P preserves the BusyBox symlink. Never overwrite or follow it into /bin/busybox.
    run(["docker", "exec", "pocketbase", "cp", "-P", "/usr/sbin/sendmail", container_backup])
    replaced_client = False
    try:
        MC.write_text(new_mc)
        ACCESS.write_text(new_access)
        run(["make", "-C", "/etc/mail", "sendmail.cf", "access.db"])
        run(["systemctl", "restart", "sendmail"])
        run(["systemctl", "is-active", "--quiet", "sendmail"])
        # Check only a banner/QUIT exchange; no message or recipient is submitted.
        smtp_probe(["docker", "exec", "-i", "pocketbase", "/bin/busybox", "nc", "-w", "30", gateway, "2525"])
        with tempfile.TemporaryDirectory(prefix="fairauto-sendmail-") as directory:
            generated = Path(directory) / "sendmail"
            generated.write_text(wrapper)
            generated.chmod(0o755)
            run(["docker", "exec", "pocketbase", "rm", "-f", "/usr/sbin/sendmail"])
            replaced_client = True
            run(["docker", "cp", str(generated), "pocketbase:/usr/sbin/sendmail"])
            run(["docker", "exec", "pocketbase", "chmod", "755", "/usr/sbin/sendmail"])
        print("Installed. Backups:", backup)
        print("Container client backup:", container_backup)
        print("Now send a test to your OWN inbox from PocketBase Mail settings. App notifications remain disabled until you enable them.")
    except Exception:
        for path in original_files:
            shutil.copy2(backup / path.name, path)
        for path in mail_paths:
            if path not in original_files and path.exists():
                path.unlink()
        if replaced_client:
            subprocess.run(["docker", "exec", "pocketbase", "rm", "-f", "/usr/sbin/sendmail"], check=False)
            subprocess.run(["docker", "exec", "pocketbase", "cp", "-P", container_backup, "/usr/sbin/sendmail"], check=False)
        subprocess.run(["systemctl", "restart", "sendmail"], check=False)
        print("Installation failed. Previous mail configuration restored; backups:", backup, flush=True)
        raise


if __name__ == "__main__":
    main()
