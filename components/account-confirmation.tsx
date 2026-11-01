"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { accountRequest } from "@/lib/accounts";
import { site } from "@/content/site";
import { Field } from "./fields";
import { PageHeading } from "./ui";
import LegalLinks from "./legal-links";
import ThemeToggle from "./theme-toggle";

type Action = "verify" | "reset" | "email";
const titles = {
  verify: "E-mail-cím megerősítése",
  reset: "Új jelszó beállítása",
  email: "E-mail-cím módosításának megerősítése",
};
export default function AccountConfirmation() {
  const [link, setLink] = useState<{ action: Action; token: string } | null>(
    null,
  );
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState("");
  const [error, setError] = useState("");
  const parsed = useRef(false);
  useEffect(() => {
    if (parsed.current) return;
    parsed.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const action = fragment.get("action"),
      token = fragment.get("token");
    // Fragments are never sent to the web server or in Referer headers. Keep the token only in memory.
    window.history.replaceState(null, "", window.location.pathname);
    if (
      action &&
      ["verify", "reset", "email"].includes(action) &&
      token &&
      token.length <= 4096
    )
      setLink({ action: action as Action, token });
    else
      setError(
        "A hivatkozás hiányos vagy hibás. Nyisd meg újra a levélből, vagy kérj új levelet.",
      );
    setReady(true);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!link || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const action =
        link.action === "verify"
          ? "confirm-verification"
          : link.action === "reset"
            ? "confirm-password-reset"
            : "confirm-email-change";
      const data = {
        token: link.token,
        ...(link.action === "verify" ? {} : { password: form.get("password") }),
        ...(link.action === "reset"
          ? { passwordConfirm: form.get("passwordConfirm") }
          : {}),
      };
      const result = await accountRequest<{ message: string }>(
        `/api/auth/${action}`,
        "POST",
        data,
      );
      setDone(result.message);
      setLink(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "A megerősítés nem sikerült.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="legal-page">
      <header className="legal-header legal-container">
        <Link className="legal-brand" href="/">
          <img src={site.logo} alt={site.name} width={139} height={62} />
        </Link>
        <ThemeToggle />
      </header>
      <main className="legal-container account-confirmation" id="main">
        <PageHeading
          eyebrow="FIÓKBIZTONSÁG"
          title={link ? titles[link.action] : "A fiókod biztonsága."}
          description="A hivatkozás megnyitása önmagában nem változtatja meg a fiókodat."
        />
        <section className="panel auth-panel">
          {!ready && <p role="status">A hivatkozás betöltése…</p>}
          {done && (
            <p className="info-box" role="status">
              {done}
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {link && !done && (
            <form className="stack-form" onSubmit={submit}>
              <p className="muted">
                {link.action === "verify"
                  ? "A megerősítés csak az e-mail-címedet igazolja; a fiókod szerepköre nem változik."
                  : "A folytatáshoz add meg a kért jelszót."}
              </p>
              {link.action !== "verify" && (
                <Field
                  label={
                    link.action === "reset" ? "Új jelszó" : "Jelenlegi jelszó"
                  }
                  name="password"
                  type="password"
                  autoComplete={
                    link.action === "reset"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={link.action === "reset" ? 12 : undefined}
                  maxLength={link.action === "reset" ? 64 : 256}
                  required
                />
              )}
              {link.action === "reset" && (
                <Field
                  label="Új jelszó ismét"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={64}
                  required
                />
              )}
              <button className="button" disabled={busy}>
                {busy
                  ? "Egy pillanat…"
                  : link.action === "reset"
                    ? "Új jelszó mentése"
                    : "Megerősítés"}
              </button>
            </form>
          )}
          <p className="form-legal-note">
            <Link href="/fiok">Vissza a bejelentkezéshez</Link>
          </p>
        </section>
      </main>
      <footer className="legal-footer legal-container">
        <span>{site.shortName}</span>
        <LegalLinks />
      </footer>
    </div>
  );
}
