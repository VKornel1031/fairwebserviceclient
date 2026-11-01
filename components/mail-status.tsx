"use client";
import { useState } from "react";
import { accountRequest } from "@/lib/accounts";
type MailStatus = {
  enabled: boolean;
  configuration: string;
  transport: string;
  senderConfigured: boolean;
  sendmailAvailable: boolean;
  workerRegistered: boolean;
  workerRunning: boolean;
  counts: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    retryable: number;
  };
  lastError: string;
  attempts: number;
};
const errors: Record<string, string> = {
  transport_failed:
    "A levélküldő nem vette át az üzenetet. Ellenőrizd a helyi Sendmail-kapcsolatot.",
  invalid_sender: "A PocketBase feladócíme hiányos vagy érvénytelen.",
  sendmail_missing: "A Sendmail kliens hiányzik a PocketBase környezetéből.",
  smtp_connection_failed: "A levélkiszolgáló nem érhető el.",
  smtp_authentication_failed: "A levélkiszolgáló elutasította a hitelesítést.",
  recipient_changed:
    "Egy korábbi munkatársi cím vagy jogosultság megváltozott; ezt az értesítést nem küldjük újra.",
  attempts_exhausted:
    "Elfogytak a küldési próbálkozások. A kapcsolat javítása után újrapróbálható.",
};
export default function MailStatusPanel() {
  const [data, setData] = useState<MailStatus | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setData(
        await accountRequest<MailStatus>("/api/appointments/mail-status"),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "A levelezés állapota nem tölthető be.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className="panel mail-status-panel"
      onToggle={(event) => {
        if (event.currentTarget.open && !data && !busy) void refresh();
      }}
    >
      <summary>E-mail értesítések állapota</summary>
      <div className="mail-status-body">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {busy && (
          <p className="muted" role="status">
            Állapot ellenőrzése…
          </p>
        )}
        {data && (
          <>
            <p>
              <strong>
                {data.enabled
                  ? "Bekapcsolva"
                  : data.configuration === "invalid"
                    ? "A levelezés beállítása hiányos"
                    : "Kikapcsolva"}
              </strong>{" "}
              · {data.transport === "sendmail" ? "Helyi Sendmail" : "SMTP"}
            </p>
            {!data.enabled && (
              <p className="muted">
                A helyi fairauto-mail.json beállításában kell engedélyezni az
                időpontértesítéseket.
              </p>
            )}
            {!data.workerRegistered && (
              <p className="form-error">
                Az értesítések ütemezője nem működik. Frissítsd a foglalási
                hookokat, és indítsd újra a PocketBase-t.
              </p>
            )}
            {data.workerRegistered && !data.workerRunning && (
              <p className="muted">
                Az ütemező jelenleg nem fut. Indítás után a következő egész
                percnél indul; ha később sem fut, indítsd újra a PocketBase-t.
              </p>
            )}
            {!data.senderConfigured && (
              <p className="form-error">
                Adj meg érvényes feladócímét a PocketBase levelezési
                beállításaiban.
              </p>
            )}
            <p className="small muted">
              Várakozó: {data.counts.pending} · Folyamatban:{" "}
              {data.counts.processing} · Átadva: {data.counts.sent} ·
              Sikertelen: {data.counts.failed}
            </p>
            {data.lastError && (
              <p>
                {errors[data.lastError] ||
                  "A legutóbbi értesítés küldése sikertelen volt."}
              </p>
            )}
            <p className="small muted">
              Az „Átadva” a levélküldő átvételét jelenti. A postaládás
              kézbesítést a levelezőszerver naplója igazolhatja.
            </p>
            {data.counts.retryable > 0 && (
              <button
                type="button"
                className="button button-outline"
                disabled={
                  busy ||
                  !data.enabled ||
                  !data.workerRegistered ||
                  !data.workerRunning
                }
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    const result = await accountRequest<{ requeued: number }>(
                      "/api/appointments/mail-retry",
                      "POST",
                      {},
                    );
                    setNotice(
                      `${result.requeued} értesítés újra küldésre vár. A következő ütemezés próbálja elküldeni.`,
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Az újrapróbálás nem indítható.",
                    );
                  } finally {
                    setBusy(false);
                    void refresh();
                  }
                }}
              >
                Sikertelen küldések újrapróbálása
              </button>
            )}
          </>
        )}
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => void refresh()}
        >
          E-mail állapot frissítése
        </button>
      </div>
    </details>
  );
}
