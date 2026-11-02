"""Exercise the real updater's success and failure paths using a filesystem Docker double.

PB_RELEASE_ARCHIVE=/path/to/pocketbase_0.40.6_linux_amd64.zip python3 scripts/check-security-updater.py
The real release checksum is verified by the updater. No Docker daemon or network is used.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

repo = Path(__file__).resolve().parents[1]
archive = Path(os.environ["PB_RELEASE_ARCHIVE"]).resolve()
assert archive.is_file()
fake = r'''#!/usr/bin/env python3
import json, os, shutil, sys
from pathlib import Path
name = Path(sys.argv[0]).name
args = sys.argv[1:]
root = Path(os.environ["UPDATER_FIXTURE"])
container = root / "container"
statefile = root / "state.json"
state = json.loads(statefile.read_text())
mode = os.environ["UPDATER_MODE"]
def save(): statefile.write_text(json.dumps(state))
def remote(value): return container / value.split(":", 1)[1].removeprefix("/pocketbase/").removesuffix("/.")
if name == "id": print("0"); sys.exit(0)
if name == "curl":
    if mode == "download_failure": sys.exit(22)
    url = next(a for a in args if a.startswith("https://"))
    target = Path(args[args.index("-o") + 1])
    if "releases/download" in url: source = Path(os.environ["PB_RELEASE_ARCHIVE"])
    else: source = Path(os.environ["UPDATER_REPO"]) / url.split("/" + "a" * 40 + "/")[1]
    shutil.copyfile(source, target)
    if (mode == "asset_tamper" and url.endswith("fairauto-security.js")) or (mode == "archive_tamper" and "releases/download" in url):
        with target.open("ab") as output: output.write(b"tampered")
    sys.exit(0)
state["calls"].append(args)
save()
command = args[0]
if command == "inspect":
    if "--format" not in args: print(json.dumps({"fixture": True})); sys.exit(0)
    form = args[args.index("--format") + 1]
    if "Running" in form: print(str(state["running"]).lower())
    elif "WorkingDir" in form: print("/pocketbase")
    else: print('["/pocketbase/pocketbase"] ["serve","--http=0.0.0.0:8090"]')
elif command == "exec":
    assert state["running"], "exec attempted on a stopped container"
    if args[2:] == ["uname", "-m"]: print("x86_64")
    elif args[2] == "/pocketbase/pocketbase":
        print("pocketbase version " + ("0.26.6" if (container / "pocketbase").read_bytes() == b"old-binary" else "0.40.6"))
    elif "security-policy" in args[-1]: print('{"ready":true,"version":1}')
    elif "appointments/config" in args[-1]: print('{}')
    elif args[-1].startswith("test -d "):
        sys.exit(0 if (container / args[-1].split("/pocketbase/")[1]).is_dir() else 1)
    else: assert (container / "pb_data/data.db").is_file()
elif command == "stop": state["running"] = False; save()
elif command == "start":
    assert list((root / "host/backups").glob("*/snapshot.tar.gz")), "Started without an offline backup"
    state["running"] = True; save()
elif command == "cp":
    source, target = args[1:]
    from_container = source.startswith("pocketbase:")
    assert not state["running"], "Read or changed a live database/container during installation"
    if mode == "backup_failure" and from_container and "pb_data" in source: sys.exit(1)
    if mode == "install_failure" and not from_container: sys.exit(1)
    src = remote(source) if from_container else Path(source)
    dst = remote(target) if not from_container else Path(target)
    if src.is_dir():
        if not source.endswith("/.") and dst.is_dir(): dst = dst / src.name
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        if dst.is_dir(): dst = dst / src.name
        shutil.copy2(src, dst)
else: raise AssertionError(args)
'''

for mode in ["success", "download_failure", "asset_tamper", "archive_tamper", "backup_failure", "install_failure"]:
    with tempfile.TemporaryDirectory(prefix="fair-updater-") as directory:
        root = Path(directory)
        commands = root / "bin"
        commands.mkdir()
        for name in ["docker", "curl", "id"]:
            path = commands / name
            path.write_text(fake)
            path.chmod(0o755)
        container = root / "container"
        for name in ["pb_data", "pb_hooks", "pb_migrations"]:
            (container / name).mkdir(parents=True)
        database = container / "pb_data/data.db"
        database.write_bytes(b"existing-account-and-booking-data")
        (container / "pb_data/private-upload").write_bytes(b"existing-file")
        mail = container / "pb_hooks/fairauto-mail.json"
        mail.write_text('{"enabled":true,"appUrl":"https://operator.example.test"}')
        (container / "pocketbase").write_bytes(b"old-binary")
        (root / "state.json").write_text(json.dumps({"running": True, "calls": []}))
        env = {**os.environ, "PATH": str(commands) + os.pathsep + os.environ["PATH"],
               "UPDATER_FIXTURE": str(root), "UPDATER_REPO": str(repo), "UPDATER_MODE": mode,
               "PB_HOST_ROOT": str(root / "host"), "PB_RELEASE_ARCHIVE": str(archive)}
        result = subprocess.run(["bash", str(repo / "scripts/update-pocketbase-security.sh"), "a" * 40],
                                env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        assert (result.returncode == 0) == (mode == "success"), (mode, result.stdout, result.stderr)
        state = json.loads((root / "state.json").read_text())
        assert database.read_bytes() == b"existing-account-and-booking-data"
        assert json.loads(mail.read_text())["appUrl"] == "https://operator.example.test"
        assert state["running"] == (mode in ["success", "download_failure", "asset_tamper", "archive_tamper"])
        snapshots = list((root / "host").glob("backups/*/snapshot.tar.gz"))
        assert bool(snapshots) == (mode in ["success", "install_failure"])
        for snapshot in snapshots:
            with tarfile.open(snapshot) as backup:
                assert backup.extractfile("pb_data/data.db").read() == database.read_bytes()
                assert backup.extractfile("pocketbase").read() == b"old-binary"
                assert backup.extractfile("pb_hooks/fairauto-mail.json").read() == mail.read_bytes()
        if mode != "success": assert (container / "pocketbase").read_bytes() == b"old-binary"
        else:
            assert (container / "pocketbase").read_bytes() != b"old-binary"
            assert (container / "pb_hooks/security.pb.js").is_file()
            assert (container / "pb_migrations/1793628000_security_hardening.js").is_file()
        if mode in ["download_failure", "asset_tamper", "archive_tamper"]: assert not any(call[0] == "stop" for call in state["calls"])
print("PASS: updater rejects tampered code/binaries, backs up offline before writes, preserves data/mail config, and stops safely on download, backup or installation failure.")
