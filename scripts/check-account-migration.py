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
        customers = []
        for active in [True, False]:
            status, customer = api("POST", "/api/collections/users/records", {
                "name": "Existing personal account", "email": f"person-{active}@example.test",
                "password": password, "passwordConfirm": password,
                "role": "customer", "active": active, "phone": "+36301234567",
                "companyName": "", "companyTax": "",
            }, token)
            assert status == 200
            customers.append(customer)
        stop()
        source = Path(__file__).resolve().parents[1] / "pocketbase/pb_migrations"
        for name in ["1793494800_saved_vehicles.js", "1793502000_appointments.js", "1793512800_prices_vin_and_mail.js"]:
            shutil.copyfile(source / name, migrations / name)
        subprocess.run([binary, "migrate", "up", *options], check=True, stdout=subprocess.DEVNULL)
        token = start()
        status, car = api("POST", "/api/collections/vehicles/records", {
            "owner": customers[0]["id"], "plate": "OLD123", "make": "Ford", "model": "Focus",
            "year": 2020, "vin": "WVWZZZ1JZXW000001",
        }, token)
        assert status == 200
        assert api("PATCH", f'/api/collections/users/records/{customers[0]["id"]}', {"defaultVehicle": car["id"]}, token)[0] == 200
        status, appointment = api("POST", "/api/collections/appointments/records", {
            "owner": customers[0]["id"], "vehicleId": car["id"], "reference": "FA-LEGACY-1",
            "service": "other", "serviceName": "Existing request", "date": "2026-11-02", "time": "09:00",
            "duration": 60, "startMinute": 540, "endMinute": 600, "status": "requested",
            "contact": {"name": "Existing contact", "email": customers[0]["email"]},
            "vehicle": {"plate": "OLD123", "vin": "WVWZZZ1JZXW000001"},
            "termsVersion": "legacy", "termsAcceptedAt": "2026-11-01 12:00:00.000Z",
            "requestHash": "a" * 64, "payloadHash": "b" * 64, "revision": 1,
        }, token)
        assert status == 200
        stop()
        migration = Path(__file__).resolve().parents[1] / "pocketbase/pb_migrations/1793534400_company_accounts.js"
        shutil.copyfile(migration, migrations / migration.name)
        subprocess.run([binary, "migrate", "up", *options], check=True, stdout=subprocess.DEVNULL)
        token = start()
        status, company_schema = api("GET", "/api/collections/users", token=token)
        assert status == 200
        assert next(f["values"] for f in company_schema["fields"] if f["name"] == "role") == ["partner", "reception", "manager", "admin"]
        assert all(next(f["id"] for f in company_schema["fields"] if f["name"] == name) == value for name, value in ids.items())
        for before_customer in customers:
            status, after_customer = api("GET", f'/api/collections/users/records/{before_customer["id"]}', token=token)
            assert status == 200 and after_customer["role"] == "partner"
            for field in ["id", "email", "phone", "active", "companyName", "companyTax"]:
                assert after_customer[field] == before_customer[field], field
            if before_customer["active"]:
                assert after_customer["defaultVehicle"] == car["id"]
            status, _ = api("POST", "/api/collections/users/auth-with-password", {"identity": after_customer["email"], "password": password})
            assert (status == 200) == before_customer["active"]
        status, admin = api("GET", f'/api/collections/users/records/{legacy["id"]}', token=token)
        assert status == 200 and admin["role"] == "admin" and not admin["active"] and admin["protectedRoot"]
        for collection, before_record in [("vehicles", car), ("appointments", appointment)]:
            status, after_record = api("GET", f'/api/collections/{collection}/records/{before_record["id"]}', token=token)
            assert status == 200 and after_record == before_record, collection
        print("PASS: account data, field IDs, car/default ownership and appointment snapshots preserved; legacy customers converted without deletion or reactivation; admin protection and password login preserved.")
    finally:
        stop()
