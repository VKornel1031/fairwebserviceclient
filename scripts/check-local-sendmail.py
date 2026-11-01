"""Read-only local tests for private Sendmail setup; never touch system configuration."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import contextlib
import io
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("setup_mail", ROOT / "scripts/setup-local-sendmail.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class ConfigurationChecks(unittest.TestCase):
    def test_smtp_probe_waits_for_multiline_greeting_before_quit(self):
        program = '''
import select, sys, time
time.sleep(0.1)
if select.select([sys.stdin], [], [], 0)[0]: sys.exit(1)
print("220-delayed greeting", flush=True)
time.sleep(0.1)
if select.select([sys.stdin], [], [], 0)[0]: sys.exit(2)
print("220 ready", flush=True)
if sys.stdin.buffer.readline() != b"QUIT\\r\\n": sys.exit(3)
print("221 goodbye", flush=True)
'''
        setup.smtp_probe([sys.executable, "-u", "-c", program], timeout=2)

    def test_smtp_probe_rejects_non_success_greeting(self):
        with self.assertRaises(RuntimeError):
            setup.smtp_probe([sys.executable, "-u", "-c", 'print("554 rejected", flush=True)'], timeout=2)

    def test_failed_configuration_build_restores_previous_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mc, access = root / "sendmail.mc", root / "access"
            originals = {
                mc: "FEATURE(`access_db')dnl\nMAILER(`smtp')dnl\n",
                mc.with_suffix(".cf"): "original compiled configuration\n",
                access: "Connect:127.0.0.1 RELAY\n",
                access.with_name("access.db"): "original access database\n",
            }
            for path, value in originals.items(): path.write_text(value)
            (root / "sendmail-wrapper.sh").write_text((ROOT / "pocketbase/sendmail-wrapper.sh").read_text())
            def execute(args, **kwargs):
                if args[0] == "make": raise subprocess.CalledProcessError(2, args)
                return subprocess.CompletedProcess(args, 0)
            def output(args, **kwargs):
                return '{"bridge":{"IPAddress":"172.17.0.2","Gateway":"172.17.0.1"}}' if args[0] == "docker" else ""
            with patch.object(setup, "ROOT", root), patch.object(setup, "MC", mc), patch.object(setup, "ACCESS", access), patch.object(setup.os, "geteuid", return_value=0), patch.object(setup, "run", side_effect=execute), patch.object(setup.subprocess, "check_output", side_effect=output), patch.object(setup.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)), patch("sys.argv", ["setup-local-sendmail.py"]), contextlib.redirect_stdout(io.StringIO()):
                with self.assertRaises(subprocess.CalledProcessError): setup.main()
            for path, value in originals.items(): self.assertEqual(path.read_text(), value)
            self.assertEqual(len(list((root / "mail-backups").glob("*"))), 1)

    def test_private_listener_and_exact_relay_are_idempotent_and_preserve_existing_config(self):
        source = "dnl existing\nFEATURE(`access_db')dnl\nMAILER(`local')dnl\nMAILER(`smtp')dnl\n"
        first = setup.mail_configuration(source, "172.17.0.1")
        self.assertEqual(first, setup.mail_configuration(first, "172.17.0.1"))
        self.assertIn("Addr=172.17.0.1", first)
        self.assertNotIn("Addr=0.0.0.0", first)
        self.assertTrue(first.endswith("MAILER(`local')dnl\nMAILER(`smtp')dnl\n"))
        access = setup.relay_configuration("Connect:127.0.0.1 RELAY\n", "172.17.0.2")
        updated = setup.relay_configuration(access, "172.17.0.3")
        self.assertIn("Connect:127.0.0.1 RELAY", updated)
        self.assertNotIn("172.17.0.2", updated)
        self.assertIn("Connect:172.17.0.3\tRELAY", updated)
        self.assertNotIn("Connect:172.17\t", updated)

    def test_ambiguous_or_public_networks_are_rejected(self):
        self.assertEqual(setup.network_addresses({"bridge": {"IPAddress": "172.17.0.2", "Gateway": "172.17.0.1"}}), ("172.17.0.2", "172.17.0.1"))
        for networks in [{}, {"x": {"IPAddress": "8.8.8.8", "Gateway": "8.8.4.4"}}, {"a": {"IPAddress": "172.17.0.2", "Gateway": "172.17.0.1"}, "b": {"IPAddress": "172.18.0.2", "Gateway": "172.18.0.1"}}]:
            with self.assertRaises(ValueError): setup.network_addresses(networks)

    def test_wrapper_preserves_message_and_sender_but_rejects_flags_and_header_injection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fake = root / "busybox"
            fake.write_text('''#!/bin/sh
cmd=$1; shift
if [ "$cmd" = sendmail ]; then
  printf '%s\\n' "$@" > "''' + str(root / "args") + '''"
  cat > "''' + str(root / "body") + '''"
else
  exec "$cmd" "$@"
fi
''')
            fake.chmod(0o755)
            script = (ROOT / "pocketbase/sendmail-wrapper.sh").read_text().replace("busybox=/bin/busybox", "busybox=" + str(fake)).replace("__FAIRAUTO_MAIL_SERVER__", "172.17.0.1:2525")
            wrapper = root / "sendmail"
            wrapper.write_text(script)
            msg = b'From: =?utf-8?q?Fair_Aut=C3=B3?= <hello@example.test>\r\nTo: customer@example.test\r\n\r\nBody\r\nFrom: forged@example.test\r\n'
            result = subprocess.run(["sh", str(wrapper), "customer@example.test"], input=msg, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual((root / "body").read_bytes(), msg)
            self.assertEqual((root / "args").read_text().splitlines(), ["-w", "45", "-S", "172.17.0.1:2525", "-f", "hello@example.test", "customer@example.test"])
            for recipient in ["-X/tmp/log@example.test", "test@example.test\nBcc: evil@example.test", "test@example.test;id"]:
                self.assertNotEqual(subprocess.run(["sh", str(wrapper), recipient], input=msg, capture_output=True).returncode, 0)
            self.assertNotEqual(subprocess.run(["sh", str(wrapper), "customer@example.test"], input=b"Subject: Missing sender\n\nFrom: forged@example.test", capture_output=True).returncode, 0)


if __name__ == "__main__":
    unittest.main()
