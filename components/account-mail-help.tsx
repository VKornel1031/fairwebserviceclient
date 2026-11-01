"use client";
import { useState, type FormEvent } from "react";
import { accountRequest } from "@/lib/accounts";
import { Field } from "./fields";

export default function AccountMailHelp({ email }: { email?: string }) {
  const [purpose, setPurpose] = useState<"verify" | "reset" | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function send(identity: string, action: "verify" | "reset") {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await accountRequest<{ message: string }>(
        action === "verify"
          ? "/api/auth/resend-verification"
          : "/api/auth/request-password-reset",
        "POST",
        { email: identity },
      );
      setMessage(result.message);
      setPurpose(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "A levél most nem kérhető.",
      );
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("email");
    if (typeof value === "string" && purpose) void send(value, purpose);
  }
  return (
    <div className="account-mail-help">
      {email ? (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => void send(email, "verify")}
        >
          {busy ? "Egy pillanat…" : "E-mail-cím megerősítése"}
        </button>
      ) : (
        <div className="button-row">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setPurpose("verify");
              setError("");
              setMessage("");
            }}
          >
            Új megerősítő levél
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setPurpose("reset");
              setError("");
              setMessage("");
            }}
          >
            Elfelejtett jelszó
          </button>
        </div>
      )}
      {purpose && !email && (
        <form className="stack-form" onSubmit={submit}>
          <p className="small muted">
            {purpose === "verify"
              ? "Add meg a fiókod e-mail-címét az új megerősítő levélhez."
              : "Új jelszó beállításához küldünk hivatkozást."}
          </p>
          <Field
            name="email"
            label="E-mail-cím a levélhez"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
          <button className="button button-outline" disabled={busy}>
            {busy ? "Egy pillanat…" : "Levél kérése"}
          </button>
        </form>
      )}
      {message && (
        <p className="info-box" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
