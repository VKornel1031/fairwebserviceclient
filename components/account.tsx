"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, LogOut, ShieldCheck } from "lucide-react";
import { usePortal } from "./provider";
import { Field } from "./fields";
import { PageHeading } from "./ui";
import { accountRequest, type Account as AccountRecord } from "@/lib/accounts";
import { roleLabels } from "@/lib/permissions";
import { AccountAvatar } from "./account-avatar";

export function Account() {
  const { user, capabilities, acceptAccount, sessionError, refreshSession } =
    usePortal();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register")
      setMode("register");
  }, []);
  useEffect(() => {
    if (user) setMode("login");
  }, [user]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const result = await accountRequest<{ user: AccountRecord }>(
          "/api/auth/login",
          "POST",
          {
            email: data.get("email"),
            password: data.get("password"),
          },
        );
        form.reset();
        acceptAccount(result.user);
      } else {
        const result = await accountRequest<{ message: string }>(
          "/api/auth/register",
          "POST",
          {
            name: data.get("name"),
            email: data.get("email"),
            password: data.get("password"),
            passwordConfirm: data.get("passwordConfirm"),
            acceptTerms: data.get("acceptTerms") === "on",
          },
        );
        form.reset();
        setMode("login");
        setMessage(result.message);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Nem sikerült a művelet.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (user) return <Profile key={user.id} />;
  return (
    <>
      <PageHeading
        eyebrow="SAJÁT FIÓK"
        title="Saját hely az autós ügyeidnek."
        description="Hozz létre fiókot, és mentsd el a kapcsolattartási adataidat."
      />
      <div className="auth-layout">
        <section className="panel auth-panel">
          <div className="tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Bejelentkezés
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
            >
              Fiók létrehozása
            </button>
          </div>
          <h2>
            {mode === "login" ? "Jó újra találkozni." : "Ismerjük meg egymást."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Lépj be az e-mail-címeddel és jelszavaddal."
              : "Minden új fiók magánügyfélként indul. Céges és munkatársi hozzáférést az adminisztrátor adhat."}
          </p>
          {sessionError && (
            <div className="info-box" role="alert">
              <p>{sessionError}</p>
              <button
                className="text-button"
                onClick={() => {
                  void refreshSession();
                }}
              >
                Újrapróbálás
              </button>
            </div>
          )}
          {mode === "register" && !capabilities.registration && (
            <p className="info-box">
              A regisztráció beállítása folyamatban van. Egyelőre a meglévő
              fiókoddal tudsz belépni.
            </p>
          )}
          {message && (
            <p className="info-box" role="status">
              {message}
            </p>
          )}
          <form key={mode} className="stack-form" onSubmit={submit}>
            {mode === "register" && (
              <Field
                name="name"
                label="Teljes név"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
              />
            )}
            <Field
              name="email"
              label="E-mail-cím"
              autoComplete="username"
              type="email"
              required
              maxLength={254}
            />
            <Field
              name="password"
              label="Jelszó"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              type="password"
              required
              minLength={mode === "register" ? 12 : undefined}
              maxLength={mode === "register" ? 64 : 256}
              hint={
                mode === "register"
                  ? "Legalább 12, legfeljebb 64 karakter."
                  : undefined
              }
            />
            {mode === "register" && (
              <>
                <Field
                  name="passwordConfirm"
                  label="Jelszó ismét"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={64}
                />
                <label className="checkbox-label">
                  <input name="acceptTerms" type="checkbox" required />
                  <span>
                    Elfogadom az{" "}
                    <Link href="/aszf" target="_blank">
                      ÁSZF-et
                    </Link>
                    , és megismertem az{" "}
                    <Link href="/adatkezelesi-tajekoztato" target="_blank">
                      Adatkezelési Tájékoztatót
                    </Link>
                    .
                  </span>
                </label>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button full-width"
              disabled={
                busy || (mode === "register" && !capabilities.registration)
              }
            >
              {busy
                ? "Egy pillanat…"
                : mode === "login"
                  ? "Bejelentkezés"
                  : "Regisztráció"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="form-legal-note">
            <Link
              href="/adatkezelesi-tajekoztato"
              target="_blank"
              rel="noreferrer"
            >
              Adatkezelési Tájékoztató
            </Link>{" "}
            ·{" "}
            <Link href="/aszf" target="_blank" rel="noreferrer">
              ÁSZF
            </Link>
          </p>
          <p className="demo-footnote">
            E-mailes ellenőrzés és jelszó-visszaállítás egyelőre nem érhető el.
            Elfelejtett jelszó esetén keresd az üzemeltetőt.
          </p>
        </section>
        <div className="auth-promo">
          <img src="/images/workshop.jpg" alt="Szervizműhely" />
          <div>
            <ShieldCheck size={34} strokeWidth={1.3} />
            <h2>
              Az autódról gondoskodunk.
              <br />A részleteket megjegyezzük.
            </h2>
            <p>A saját fiókod, minden eszközödön.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Profile() {
  const { user, acceptAccount, logout, notify } = usePortal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function save(
    event: FormEvent<HTMLFormElement>,
    action: "profile" | "email" | "password",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await accountRequest<{ user: AccountRecord }>(
        action === "profile" ? "/api/account" : `/api/auth/change-${action}`,
        action === "profile" ? "PATCH" : "POST",
        data,
      );
      if (action !== "profile") form.reset();
      acceptAccount(result.user);
      setSuccess(
        action === "password"
          ? "A jelszavad megváltozott. Más eszközökön újra be kell jelentkezned."
          : "A változtatásokat elmentettük.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Nem sikerült menteni.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="SAJÁT FIÓK"
        title="A részletek, amik számítanak."
        description="A mentett fiókadataid minden eszközödön elérhetők."
        action={
          <button
            className="button button-outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await logout();
              } catch (error) {
                notify(
                  error instanceof Error
                    ? error.message
                    : "Nem sikerült kijelentkezni.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <LogOut size={16} />
            Kijelentkezés
          </button>
        }
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="info-box" role="status">
          {success}
        </p>
      )}
      {!user!.setupReady && (
        <p className="info-box">
          Az üzemeltetőnek be kell fejeznie a PocketBase fiókkezelési
          beállítását.
        </p>
      )}
      <div className="profile-layout">
        <div className="account-sections">
          <form className="panel" onSubmit={(event) => save(event, "profile")}>
            <div className="panel-title">
              <h2>Személyes adatok</h2>
              <p>{user!.email}</p>
            </div>
            <fieldset disabled={busy} className="account-fieldset">
              <div className="form-grid">
                <Field
                  label="Teljes név"
                  name="name"
                  defaultValue={user!.name}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
                <Field
                  label="Mobiltelefonszám"
                  name="phone"
                  defaultValue={user!.phone}
                  type="tel"
                  maxLength={25}
                  autoComplete="tel"
                />
                <Field
                  label="Település"
                  name="city"
                  defaultValue={user!.city}
                  maxLength={100}
                  autoComplete="address-level2"
                />
              </div>
              {user!.setupReady && (
                <details className="account-details">
                  <summary>Céges adatok</summary>
                  <div className="form-grid">
                    <Field
                      label="Cégnév"
                      name="companyName"
                      defaultValue={user!.companyName}
                      maxLength={120}
                      autoComplete="organization"
                    />
                    <Field
                      label="Adószám"
                      name="companyTax"
                      defaultValue={user!.companyTax}
                      maxLength={30}
                    />
                    <Field
                      label="Cég települése"
                      name="companyCity"
                      defaultValue={user!.companyCity}
                      maxLength={100}
                    />
                  </div>
                  <p className="small muted">
                    A céges adatok kitöltése nem változtatja meg a
                    szerepkörödet. Partnerhozzáférésért keresd az
                    adminisztrátort.
                  </p>
                </details>
              )}
              <div className="panel-actions">
                <span />
                <button className="button" type="submit">
                  Változtatások mentése
                  <Check size={16} />
                </button>
              </div>
            </fieldset>
          </form>
          <details className="panel account-details">
            <summary>Belépési adatok módosítása</summary>
            <form
              className="stack-form"
              onSubmit={(event) => save(event, "email")}
            >
              <h3>E-mail-cím módosítása</h3>
              <Field
                label="Új e-mail-cím"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
              <Field
                label="Jelenlegi jelszó"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <button className="button button-outline" disabled={busy}>
                E-mail-cím mentése
              </button>
            </form>
            <form
              className="stack-form"
              onSubmit={(event) => save(event, "password")}
            >
              <h3>Jelszó módosítása</h3>
              <Field
                label="Jelenlegi jelszó"
                name="oldPassword"
                type="password"
                autoComplete="current-password"
                required
              />
              <Field
                label="Új jelszó"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={64}
              />
              <Field
                label="Új jelszó ismét"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={64}
              />
              <button className="button button-outline" disabled={busy}>
                Jelszó mentése
              </button>
            </form>
          </details>
        </div>
        <aside className="profile-aside">
          <AccountAvatar user={user} className="large-avatar" />
          <h3>{user!.name}</h3>
          <p className="muted">{roleLabels[user!.role]}</p>
          <p className="small muted">
            A hozzáférésedet az adminisztrátor kezeli.
          </p>
          {user!.role === "admin" && (
            <Link href="/admin" className="button full-width">
              Fiókkezelés
              <ArrowRight size={16} />
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
