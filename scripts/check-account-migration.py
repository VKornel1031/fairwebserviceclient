"""Verify upgrading existing accounts and rerunning the migration in a disposable local DB."""
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

binary = os.environ.get("PB_BINARY") or shutil.which("pocketbase")
if not binary:
    raise SystemExit("Set PB_BINARY to a PocketBase executable.")
binary = str(Path(binary).resolve())
with socket.socket() as listener:
    listener.bind(("127.0.0.1", 0))
    port = listener.getsockname()[1]
base = f"http://127.0.0.1:{port}"
password = secrets.token_urlsafe(24)


def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(base + path, headers=headers, method=method,
                                 data=json.dumps(data).encode() if data is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read()
            return response.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


with tempfile.TemporaryDirectory(prefix="fair-migration-check-") as directory:
    root = Path(directory)
    migrations = root / "migrations"
    migrations.mkdir()
    options = ["--dir", str(root / "data"), "--migrationsDir", str(migrations), "--dev=false"]
    subprocess.run([binary, "superuser", "upsert", "root@example.test", password, *options], check=True, stdout=subprocess.DEVNULL)
    server = None

    def start():
        global server
        server = subprocess.Popen([binary, "serve", f"--http=127.0.0.1:{port}", *options], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            assert server.poll() is None, "Disposable PocketBase failed to start"
            try:
                if api("GET", "/api/health")[0] == 200:
                    break
            except urllib.error.URLError:
                pass
            time.sleep(0.05)
        status, result = api("POST", "/api/collections/_superusers/auth-with-password", {"identity": "root@example.test", "password": password})
        assert status == 200
        return result["token"]

    def stop():
        if server:
            server.terminate()
            server.wait(timeout=10)

    try:
        token = start()
        status, collection = api("GET", "/api/collections/users", token=token)
        assert status == 200
        fields = collection["fields"] + [
            {"name": "phone", "type": "text", "max": 25},
            {"name": "city", "type": "text", "max": 100},
            {"name": "reminders", "type": "bool"},
            {"name": "role", "type": "select", "required": True, "maxSelect": 1, "values": ["customer", "partner", "reception", "manager", "admin"]},
        ]
        status, before = api("PATCH", "/api/collections/users", {"fields": fields}, token)
        assert status == 200
        ids = {field["name"]: field["id"] for field in before["fields"]}
        status, legacy = api("POST", "/api/collections/users/records", {"name": "Existing Owner", "email": "legacy@example.test", "password": password, "passwordConfirm": password, "role": "admin", "phone": "+36301234567", "city": "Székesfehérvár"}, token)
        assert status == 200
        stop()
        migration = Path(__file__).resolve().parents[1] / "pocketbase/pb_migrations/1793404800_account_management.js"
        shutil.copyfile(migration, migrations / migration.name)
        subprocess.run([binary, "migrate", "up", *options], check=True, stdout=subprocess.DEVNULL)
        token = start()
        status, after = api("GET", "/api/collections/users", token=token)
        assert status == 200
        assert all(next(field["id"] for field in after["fields"] if field["name"] == name) == value for name, value in ids.items()), "Existing field IDs changed"
        status, record = api("GET", f'/api/collections/users/records/{legacy["id"]}', token=token)
        assert status == 200 and record["active"] and record["protectedRoot"]
        assert record["email"] == legacy["email"] and record["phone"] == legacy["phone"] and record["city"] == legacy["city"]
        assert after["authRule"] == "active = true" and after["authToken"]["duration"] == 28800
        assert api("POST", "/api/collections/users/auth-with-password", {"identity": record["email"], "password": password})[0] == 200
        assert api("PATCH", f'/api/collections/users/records/{legacy["id"]}', {"active": False}, token)[0] == 200
        stop()
        shutil.copyfile(migration, migrations / "1793404801_repeat_account_management.js")
        subprocess.run([binary, "migrate", "up", *options], check=True, stdout=subprocess.DEVNULL)
        token = start()
        status, record = api("GET", f'/api/collections/users/records/{legacy["id"]}', token=token)
        assert status == 200 and not record["active"], "Migration reactivated a suspended account"
        assert api("POST", "/api/collections/users/auth-with-password", {"identity": record["email"], "password": password})[0] != 200
        print("PASS: existing account data and field IDs preserved, first admin protected, unverified login enabled, 8h tokens set, suspended account stays disabled on rerun.")
    finally:
        stop()
