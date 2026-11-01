"""Disposable, loopback-only PocketBase for integration tests. Never uses the homelab.

PB_BINARY=/path/to/pocketbase python3 scripts/test-pocketbase.py
Requires PocketBase 0.26.3+; no SMTP or external services are configured.
"""
import json
import os
import shutil
import signal
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

binary = os.environ.get("PB_BINARY") or shutil.which("pocketbase")
if not binary:
    raise SystemExit("Set PB_BINARY to a PocketBase executable before running integration tests.")
binary = str(Path(binary).resolve())
base = "http://127.0.0.1:3101"
secret = "Local-integration-only-928374!"


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


with tempfile.TemporaryDirectory(prefix="fair-pb-tests-") as directory:
    root = Path(directory)
    migrations = root / "pb_migrations"
    shutil.copytree(Path(__file__).resolve().parents[1] / "pocketbase/pb_migrations", migrations)
    hooks = root / "pb_hooks"
    shutil.copytree(Path(__file__).resolve().parents[1] / "pocketbase/pb_hooks", hooks)
    shutil.copy2(Path(__file__).resolve().parents[1] / "content/booking.json", hooks / "fairauto-booking.json")
    # Optional notifications are enabled only with a test-only mail interceptor: no external delivery.
    mail_config = json.loads((Path(__file__).resolve().parents[1] / "pocketbase/mail.example.json").read_text())
    mail_config["enabled"] = True
    (hooks / "fairauto-mail.json").write_text(json.dumps(mail_config))
    (migrations / "1793512801_test_mail_capture.js").write_text('''
migrate((app) => {
  const c = new Collection({ name: "test_mail_capture", type: "base" });
  c.fields.add(new TextField({ name: "recipient", max: 254 }));
  c.fields.add(new TextField({ name: "subject", max: 500 }));
  c.fields.add(new TextField({ name: "html", max: 50000 }));
  app.save(c);
  const legacy = new Record(app.findCollectionByNameOrId("users"));
  legacy.set("name", "Legacy Personal Account");
  legacy.set("email", "legacy@fairauto.test");
  legacy.setPassword("Local-integration-only-928374!");
  legacy.set("role", "customer");
  legacy.set("active", true);
  app.save(legacy);
}, () => {});
''')
    (hooks / "mail-interceptor.pb.js").write_text('''
onMailerSend((e) => {
  if ($app.store().get("fairauto_test_mail_failure")) throw new Error("Simulated transport failure");
  const r = new Record($app.findCollectionByNameOrId("test_mail_capture"));
  r.set("recipient", e.message.to[0].address); r.set("subject", e.message.subject); r.set("html", e.message.html);
  $app.save(r);
  // Intentionally do not call e.next(): this fixture never sends email.
});
routerAdd("POST", "/api/fairauto-test/mail", (e) => {
  const input = e.requestInfo().body;
  $app.store().set("fairauto_test_mail_failure", input.fail === true);
  if (input.clear === true) {
    $app.db().newQuery("DELETE FROM appointment_mail").execute();
    $app.db().newQuery("DELETE FROM test_mail_capture").execute();
    return e.json(200, { cleared: true });
  }
  return e.json(200, require(__hooks + "/fairauto-mail.js").process($app));
}, $apis.requireSuperuserAuth());
''')
    # Test-only: emulate a successful public creation response with internal fields redacted.
    # This temporary hook is never installed on the homelab or included in production pb_hooks.
    (hooks / "registration-response.pb.js").write_text('''
onRecordEnrich((event) => {
  const info = event.requestInfo;
  if (info && info.body && info.body.passwordConfirm &&
      event.record.getString("email").endsWith("@minimal-response.example.test")) {
    event.record.hide("active", "protectedRoot", "termsVersion", "companyName");
  }
  event.next();
}, "users");
''')
    options = ["--dir", str(root / "pb_data"), "--migrationsDir", str(migrations), "--hooksDir", str(hooks), "--dev=false"]
    subprocess.run([binary, "superuser", "upsert", "root@fairauto.test", secret, *options], check=True)
    server = subprocess.Popen([binary, "serve", "--http=127.0.0.1:3101", *options])

    def stop(*_):
        server.terminate()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        for _ in range(100):
            if server.poll() is not None:
                raise RuntimeError("Local PocketBase failed to start.")
            try:
                if api("GET", "/api/health")[0] == 200:
                    break
            except urllib.error.URLError:
                pass
            time.sleep(0.1)
        status, auth = api("POST", "/api/collections/_superusers/auth-with-password",
                           {"identity": "root@fairauto.test", "password": secret})
        assert status == 200, "Local superuser authentication failed"
        for role in ["admin", "partner", "reception", "manager"]:
            status, record = api("POST", "/api/collections/users/records", {
                "name": "Test " + role, "email": role + "@fairauto.test", "password": secret,
                "passwordConfirm": secret, "role": role, "active": True,
                "protectedRoot": role == "admin", "emailVisibility": False,
                "companyName": "Seed Test Kft." if role == "partner" else "",
                "companyTax": "12345678-2-19" if role == "partner" else "",
            }, auth["token"])
            assert status == 200, f"Could not seed {role}: {record}"
        print("Disposable PocketBase ready on 127.0.0.1:3101", flush=True)
        server.wait()
    finally:
        server.terminate()
        server.wait(timeout=10)
