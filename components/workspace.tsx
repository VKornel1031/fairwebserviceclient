"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { legalAcknowledgement } from "@/lib/legal";
import { site } from "@/content/site";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  CarFront,
  CalendarDays,
  UserRound,
  Building2,
  Wrench,
  Check,
  Pencil,
  Trash2,
  Star,
  LogOut,
  Download,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  X,
  Mail,
  SlidersHorizontal,
  ClipboardList,
} from "lucide-react";
import { usePortal } from "./provider";
import { Modal, PageHeading } from "./ui";
import { Field, Empty } from "./fields";
import { calendarFile } from "@/lib/calendar";
import { changeAppointmentStatus } from "@/lib/appointments";
import ConfirmationNote from "./confirmation-note";
import { downloadAppointments } from "@/lib/reports";
import {
  canManageWorkshop,
  canCoordinateAppointments,
  roleLabels,
} from "@/lib/permissions";
import {
  services,
  id,
  passwordDigest,
  statusNames,
  dateLabel,
  today,
  addDays,
  nextBusinessDay,
  endTime,
  type Vehicle,
  type Status,
  type Profile,
} from "@/lib/demo";

export function Account() {
  const { user, store, mutate, session, notify, demo } = usePortal();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [business, setBusiness] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register")
      setMode("register");
  }, []);
  async function auth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    try {
      if (mode === "register") {
        if (form.get("acceptTerms") !== "on") {
          setError(
            "A regisztrációhoz fogadd el a demó használati feltételeit.",
          );
          return;
        }
        const salt = crypto.randomUUID();
        const hash = await passwordDigest(password, salt);
        const uid = id("USR");
        const ok = mutate((s) => {
          if (s.users.some((u) => u.email.toLowerCase() === email))
            throw new Error(
              "Ez az e-mail-cím már szerepel a helyi demóban. Jelentkezz be.",
            );
          return {
            ...s,
            users: [
              ...s.users,
              {
                id: uid,
                name: String(form.get("name")).trim(),
                email,
                phone: "",
                city: "",
                reminders: true,
                role: business ? "partner" : "customer",
                legalAcknowledgement: legalAcknowledgement(),
                passwordHash: hash,
                salt,
              },
            ],
            companies: business
              ? {
                  ...s.companies,
                  [uid]: {
                    name: String(form.get("company")).trim(),
                    tax: "",
                    city: "",
                  },
                }
              : s.companies,
          };
        });
        if (ok) {
          session(uid);
          notify(
            "A helyi demófiókod elkészült. Most elmentheted az adataidat.",
          );
        }
      } else {
        const candidate = store.users.find(
          (u) => u.email.toLowerCase() === email && u.passwordHash,
        );
        if (
          !candidate?.salt ||
          (await passwordDigest(password, candidate.salt)) !==
            candidate.passwordHash
        ) {
          setError(
            "Hibás e-mail-cím vagy jelszó. A mintafiókokat a demógombbal nyithatod meg.",
          );
          return;
        }
        session(candidate.id);
        notify("Sikeres bejelentkezés. Jó újra itt!");
      }
    } catch {
      setError(
        "A fiókművelet nem sikerült. Használj HTTPS-t vagy localhostot, és engedélyezd a helyi tárhelyet.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <>
        <PageHeading
          eyebrow="A KÖVETKEZŐ FOGLALÁS MÁR EGYSZERŰBB LESZ"
          title="Saját hely az autós ügyeidnek."
          description="Mentsd el az adataidat, kezeld a járműveidet, és tartsd kézben az időpontjaidat."
        />
        <div className="auth-layout">
          <section className="panel auth-panel">
            <div className="tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Bejelentkezés
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Fiók létrehozása
              </button>
            </div>
            <h2>
              {mode === "login"
                ? "Jó újra találkozni."
                : "Ismerjük meg egymást."}
            </h2>
            <p className="muted">
              {mode === "login"
                ? "Lépj be a böngészőben létrehozott demófiókodba."
                : "Helyi demófiók, valódi személyes adatok nélkül."}
            </p>
            <form onSubmit={auth} className="stack-form">
              {mode === "register" && (
                <Field
                  name="name"
                  label="Teljes név"
                  autoComplete="name"
                  required
                  maxLength={100}
                  pattern=".*\S.*"
                  placeholder="Kovács Péter"
                />
              )}
              <Field
                name="email"
                label="E-mail-cím"
                required
                type="email"
                autoComplete="email"
                maxLength={150}
                placeholder="peter@example.com"
              />
              <Field
                name="password"
                label="Jelszó"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                maxLength={128}
                required
                hint={
                  mode === "register"
                    ? "Legalább 8 karakter. Ne használj máshol is használt jelszót."
                    : undefined
                }
              />
              {mode === "register" && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={business}
                      onChange={(e) => setBusiness(e.target.checked)}
                    />
                    <span>Céges partnerként regisztrálok</span>
                  </label>
                  {business && (
                    <Field
                      name="company"
                      label="Cégnév"
                      required
                      maxLength={120}
                      pattern=".*\S.*"
                    />
                  )}
                  <label className="checkbox-label">
                    <input type="checkbox" name="acceptTerms" required />
                    <span>
                      Megértettem, hogy ez egy helyi demó. A fiókom és adataim
                      csak ebben a böngészőben érhetők el. Elfogadom a demó
                      használatára vonatkozó ÁSZF-et.
                    </span>
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="button full-width"
                disabled={busy}
              >
                {busy
                  ? "Egy pillanat…"
                  : mode === "login"
                    ? "Bejelentkezés"
                    : "Demófiók létrehozása"}{" "}
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
            <div className="auth-divider">
              <span>vagy próbáld ki rögtön</span>
            </div>
            <button
              className="button button-outline full-width"
              onClick={() => demo("customer")}
            >
              <UserRound size={17} /> Magánügyfél demófiók
            </button>
            <p className="demo-footnote">
              Nincs e-mail-ellenőrzés vagy jelszó-visszaállító levél a demóban.
              A helyi fiók nem kapcsolódik éles rendszerhez.
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
              <p>
                Mentett járművek. Átlátható foglalások.
                <br />
                Kevesebb adatbevitel, minden alkalommal.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  return <ProfileForm key={user.id} />;
}
function ProfileForm() {
  const { user, store, mutate, session, notify } = usePortal();
  const [profile, setProfile] = useState<Profile>({ ...user! });
  function save(e: FormEvent) {
    e.preventDefault();
    const ok = mutate((s) => {
      if (
        s.users.some(
          (u) =>
            u.id !== user!.id &&
            u.email.toLowerCase() === profile.email.trim().toLowerCase(),
        )
      )
        throw new Error("Ez az e-mail-cím már foglalt a demóban.");
      return {
        ...s,
        users: s.users.map((u) =>
          u.id === user!.id
            ? {
                ...u,
                ...profile,
                name: profile.name.trim(),
                email: profile.email.trim().toLowerCase(),
                city: profile.city.trim(),
              }
            : u,
        ),
      };
    });
    if (ok) notify("A személyes adataidat elmentettük.");
  }
  return (
    <>
      <PageHeading
        eyebrow="SAJÁT FIÓK"
        title="A részletek, amik számítanak."
        description="Ezeket az adatokat töltjük ki helyetted a következő foglaláskor."
        action={
          <button
            className="button button-outline"
            onClick={() => {
              session(null);
              notify(
                "Kijelentkeztél. A mentett adataid megmaradnak ebben a böngészőben.",
              );
            }}
          >
            <LogOut size={16} /> Kijelentkezés
          </button>
        }
      />
      <div className="profile-layout">
        <form className="panel" onSubmit={save}>
          <div className="panel-title">
            <h2>Személyes adatok</h2>
            <p>A módosítások a korábbi foglalásaid adatait nem írják át.</p>
          </div>
          <div className="form-grid">
            <Field
              label="Teljes név"
              required
              maxLength={100}
              pattern=".*\S.*"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Field
              label="E-mail-cím"
              required
              type="email"
              maxLength={150}
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
            <Field
              label="Mobiltelefonszám"
              type="tel"
              pattern="[+0-9 \(\)\-]{7,25}"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
            <Field
              label="Település"
              maxLength={100}
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
          </div>
          <div className="form-section-title">
            <Mail size={18} />
            <h3>Értesítési beállítások</h3>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={profile.reminders}
              onChange={(e) =>
                setProfile({ ...profile, reminders: e.target.checked })
              }
            />
            <span>
              Kérek e-mail-emlékeztetőt a foglalásaim előtt.
              <small className="block muted">
                A preferenciát mentjük; a prototípus nem küld levelet.
              </small>
            </span>
          </label>
          <div className="panel-actions">
            <span />
            <button className="button" type="submit">
              Változtatások mentése <Check size={17} />
            </button>
          </div>
        </form>
        <aside className="profile-aside">
          <span className="large-avatar">
            {user!.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <h3>{user!.name}</h3>
          <p className="muted">{roleLabels[user!.role]}</p>
          <div className="profile-stats">
            <span>
              <strong>
                {store.vehicles.filter((v) => v.owner === user!.id).length}
              </strong>
              mentett jármű
            </span>
            <span>
              <strong>
                {store.appointments.filter((a) => a.owner === user!.id).length}
              </strong>
              foglalás
            </span>
          </div>
          <Link href="/idopont" className="button full-width">
            Új időpont <Plus size={17} />
          </Link>
        </aside>
      </div>
    </>
  );
}

export function Vehicles({ embedded = false }: { embedded?: boolean }) {
  const { user, store, mutate, notify } = usePortal();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [removing, setRemoving] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    plate: "",
    make: "",
    model: "",
    year: "",
    isDefault: false,
  });
  const [open, setOpen] = useState(false);
  const [fleetQuery, setFleetQuery] = useState("");
  const cars = store.vehicles.filter(
    (v) =>
      v.owner === user?.id &&
      `${v.plate} ${v.make} ${v.model}`
        .toLocaleLowerCase("hu")
        .includes(fleetQuery.toLocaleLowerCase("hu")),
  );
  function add() {
    setEditing(null);
    setForm({
      plate: "",
      make: "",
      model: "",
      year: "",
      isDefault: !store.vehicles.some((v) => v.owner === user?.id),
    });
    setOpen(true);
  }
  function edit(v: Vehicle) {
    setEditing(v);
    setForm(v);
    setOpen(true);
  }
  function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const ok = mutate((s) => {
      const plate = form.plate.trim().toUpperCase();
      if (
        s.vehicles.some(
          (v) =>
            v.owner === user.id && v.plate === plate && v.id !== editing?.id,
        )
      )
        throw new Error("Ezt a rendszámot már elmentetted.");
      const car: Vehicle = {
        ...form,
        plate,
        make: form.make.trim(),
        model: form.model.trim(),
        id: editing?.id || id("CAR"),
        owner: user.id,
      };
      const owned = s.vehicles.filter((v) => v.owner === user.id);
      if (!owned.length) car.isDefault = true;
      let vehicles = car.isDefault
        ? s.vehicles.map((v) =>
            v.owner === user.id ? { ...v, isDefault: false } : v,
          )
        : s.vehicles;
      if (editing)
        vehicles = vehicles.map((v) => (v.id === editing.id ? car : v));
      else vehicles = [...vehicles, car];
      if (!vehicles.some((v) => v.owner === user.id && v.isDefault)) {
        const first = vehicles.find((v) => v.owner === user.id);
        vehicles = vehicles.map((v) =>
          v.id === first?.id ? { ...v, isDefault: true } : v,
        );
      }
      return { ...s, vehicles };
    });
    if (ok) {
      setOpen(false);
      notify(
        editing
          ? "A jármű adatait frissítettük."
          : "Új jármű elmentve. A következő foglaláskor már kiválaszthatod.",
      );
    }
  }
  if (!user)
    return (
      <>
        <PageHeading
          eyebrow="JÁRMŰVEIM"
          title="Minden autód, egy helyen."
          description="Saját fiókkal elmentheted az autóid adatait a gyorsabb foglaláshoz."
        />
        <Empty
          icon={<CarFront size={34} />}
          title="Adj saját helyet az autódnak."
          description="Jelentkezz be vagy hozz létre helyi demófiókot a járművek mentéséhez."
        >
          <Link href="/fiok" className="button">
            Bejelentkezés / regisztráció <ArrowRight size={17} />
          </Link>
        </Empty>
      </>
    );
  return (
    <>
      {!embedded ? (
        <PageHeading
          eyebrow={user.role === "partner" ? "CÉGES FLOTTA" : "JÁRMŰVEIM"}
          title="Ismerjük meg az autóidat."
          description="A mentett jármű adatai foglaláskor automatikusan kitöltődnek."
          action={
            <button className="button" onClick={add}>
              <Plus size={17} /> Jármű hozzáadása
            </button>
          }
        />
      ) : (
        <div className="section-title">
          <h2>Céges járművek</h2>
          <button className="button button-outline" onClick={add}>
            <Plus size={16} /> Jármű hozzáadása
          </button>
        </div>
      )}
      {user.role === "partner" && (
        <label className="search-input fleet-search">
          <Search size={16} />
          <input
            aria-label="Céges járművek keresése"
            value={fleetQuery}
            onChange={(e) => setFleetQuery(e.target.value)}
            placeholder="Rendszám, márka vagy modell"
          />
        </label>
      )}
      {cars.length ? (
        <div className="vehicles-grid">
          {cars.map((v) => (
            <article key={v.id} className="vehicle-card">
              <div className="vehicle-top">
                <CarFront size={48} strokeWidth={1} />
                {v.isDefault && (
                  <span className="default-badge">
                    <Star size={11} /> Alapértelmezett
                  </span>
                )}
              </div>
              <h2>
                {v.make} <span>{v.model}</span>
              </h2>
              <p className="muted">
                {v.year} ·{" "}
                {user.role === "partner" ? "Céges jármű" : "Saját jármű"}
              </p>
              <span className="license-plate">
                <span>H</span>
                {v.plate}
              </span>
              <div className="vehicle-actions">
                <Link href={`/idopont?vehicle=${v.id}`} className="text-link">
                  Időpontfoglalás <ArrowUpRight size={16} />
                </Link>
                <div>
                  <button
                    className="icon-button"
                    title="Szerkesztés"
                    aria-label={`${v.plate} szerkesztése`}
                    onClick={() => edit(v)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    title="Törlés"
                    aria-label={`${v.plate} törlése`}
                    onClick={() => setRemoving(v)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={<CarFront size={32} />}
          title={
            fleetQuery
              ? "Nincs ilyen jármű a flottában."
              : "Az első autód helye már megvan."
          }
          description="Add meg a rendszámot és az alapadatokat. Legközelebb már nem kell újra beírnod."
        >
          <button className="button" onClick={add}>
            <Plus size={17} /> Jármű hozzáadása
          </button>
        </Empty>
      )}
      {open && (
        <Modal
          title={editing ? "Jármű szerkesztése" : "Új jármű hozzáadása"}
          close={() => setOpen(false)}
        >
          <form className="modal-form" onSubmit={save}>
            <div className="form-grid">
              <Field
                label="Rendszám"
                required
                minLength={3}
                maxLength={15}
                pattern=".*\S.*"
                value={form.plate}
                placeholder="ABC-123"
                className="plate-input"
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
              />
              <Field
                label="Gyártási év"
                type="number"
                required
                min={1950}
                max={new Date().getFullYear() + 1}
                value={form.year}
                placeholder="2018"
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
              <Field
                label="Márka"
                required
                maxLength={60}
                pattern=".*\S.*"
                value={form.make}
                placeholder="Volkswagen"
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
              <Field
                label="Modell"
                required
                maxLength={60}
                pattern=".*\S.*"
                value={form.model}
                placeholder="Golf VII"
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
              />
              <span>Ez legyen az alapértelmezett járművem</span>
            </label>
            <div className="panel-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setOpen(false)}
              >
                Mégse
              </button>
              <button type="submit" className="button">
                Jármű mentése <Check size={17} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Törlöd ezt a járművet?" close={() => setRemoving(null)}>
          <div className="modal-form">
            <p className="muted">
              {removing.make} {removing.model} · {removing.plate}
            </p>
            <p className="modal-intro">
              A korábbi foglalásokban szereplő járműadatok megmaradnak.
            </p>
            <div className="button-row">
              <button
                className="button button-outline"
                onClick={() => setRemoving(null)}
              >
                Mégse
              </button>
              <button
                className="button danger"
                onClick={() => {
                  const ok = mutate((s) => {
                    let vehicles = s.vehicles.filter(
                      (v) => v.id !== removing.id,
                    );
                    if (
                      !vehicles.some((v) => v.owner === user.id && v.isDefault)
                    ) {
                      const first = vehicles.find((v) => v.owner === user.id);
                      vehicles = vehicles.map((v) =>
                        v.id === first?.id ? { ...v, isDefault: true } : v,
                      );
                    }
                    return { ...s, vehicles };
                  });
                  if (ok) {
                    setRemoving(null);
                    notify("A járművet töröltük.");
                  }
                }}
              >
                Jármű törlése <Trash2 size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Appointments({ embedded = false }: { embedded?: boolean }) {
  const { user, store, mutate, notify } = usePortal();
  const [filter, setFilter] = useState("upcoming");
  const [detail, setDetail] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const own = store.appointments.filter((a) => a.owner === (user?.id || null));
  const list = own
    .filter((a) => {
      const past =
        ["completed", "cancelled"].includes(a.status) || a.date < today();
      return (
        (filter === "all" || (filter === "past" ? past : !past)) &&
        (statusFilter === "all" || a.status === statusFilter) &&
        `${a.vehicle.plate} ${a.vehicle.make} ${a.vehicle.model} ${a.id}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort(
      (a, b) =>
        (filter === "past" ? -1 : 1) *
        (a.date + a.time).localeCompare(b.date + b.time),
    );
  const selected = store.appointments.find((a) => a.id === detail);
  return (
    <>
      {!embedded && (
        <PageHeading
          eyebrow="FOGLALÁSAIM"
          title="A következő találkozásunk."
          description={
            user
              ? "Tervezd meg, kövesd nyomon, vagy módosítsd az időpontjaidat."
              : "Az ebben a böngészőben leadott vendégfoglalásaid. A demó nem küld valódi időpontkérést."
          }
          action={
            <Link href="/idopont" className="button">
              <Plus size={17} /> Új időpontfoglalás
            </Link>
          }
        />
      )}
      <div className="list-toolbar">
        <div className="tabs">
          <button
            className={filter === "upcoming" ? "active" : ""}
            onClick={() => setFilter("upcoming")}
          >
            Közelgő{" "}
            <span>
              {
                own.filter(
                  (a) =>
                    a.date >= today() &&
                    !["cancelled", "completed"].includes(a.status),
                ).length
              }
            </span>
          </button>
          <button
            className={filter === "past" ? "active" : ""}
            onClick={() => setFilter("past")}
          >
            Korábbi
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Összes
          </button>
        </div>
        <label className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rendszám vagy jármű keresése"
            aria-label="Foglalások keresése"
          />
        </label>
      </div>
      {user?.role === "partner" && (
        <div className="partner-report-tools">
          <label>
            Állapot
            <select
              aria-label="Céges foglalások állapota"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Minden állapot</option>
              {Object.entries(statusNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className="muted small">
            {list.length} találat · csak a saját céged foglalásai
          </span>
          <button
            className="button button-outline"
            disabled={!list.length}
            onClick={() =>
              downloadAppointments(list, "fairauto-ceges-foglalasok.csv")
            }
          >
            <Download size={15} /> Foglalások exportálása
          </button>
        </div>
      )}
      {list.length ? (
        <div className="appointment-list">
          {list.map((a) => (
            <article className="appointment-card" key={a.id}>
              <div className="appointment-date">
                <span>{dateLabel(a.date, { month: "short" })}</span>
                <strong>{Number(a.date.slice(-2))}</strong>
                <small>{dateLabel(a.date, { weekday: "short" })}</small>
              </div>
              <div className="appointment-info">
                <span className={`status status-${a.status}`}>
                  <span />
                  {statusNames[a.status]}
                </span>
                <h3>{services.find((s) => s.id === a.service)?.name}</h3>
                <p>
                  <CarFront size={14} /> {a.vehicle.make} {a.vehicle.model}
                  <i /> {a.vehicle.plate}
                </p>
                <span className="muted small">
                  <Clock3 size={13} /> {a.time} – {endTime(a.time, a.duration)}{" "}
                  · {site.contact.street}
                </span>
              </div>
              <button
                className="button button-outline"
                onClick={() => setDetail(a.id)}
              >
                Részletek <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={<CalendarDays size={32} />}
          title={
            query ? "Nincs találat." : "Itt lesz a következő találkozásunk."
          }
          description={
            query
              ? "Próbálj másik rendszámot vagy járműnevet."
              : "Ebben a nézetben még nincs foglalásod. Válassz egy megfelelő időpontot."
          }
        >
          {!query && (
            <Link href="/idopont" className="button">
              Időpontot foglalok <ArrowUpRight size={17} />
            </Link>
          )}
        </Empty>
      )}
      {selected && (
        <Modal title="A foglalás részletei" close={() => setDetail(null)}>
          <div className="modal-form">
            <div className="booking-detail-top">
              <span className={`status status-${selected.status}`}>
                <span />
                {statusNames[selected.status]}
              </span>
              <code>{selected.id}</code>
            </div>
            <h2 className="detail-title">
              {services.find((s) => s.id === selected.service)?.name}
            </h2>
            <div className="detail-grid">
              <div>
                <small>Időpont</small>
                <strong>{dateLabel(selected.date)}</strong>
                <span>
                  {selected.time} – {endTime(selected.time, selected.duration)}
                </span>
              </div>
              <div>
                <small>Jármű</small>
                <strong>
                  {selected.vehicle.make} {selected.vehicle.model}
                </strong>
                <span>
                  {selected.vehicle.plate} · {selected.vehicle.year}
                </span>
              </div>
              <div>
                <small>Kapcsolattartó</small>
                <strong>{selected.contact.name}</strong>
                <span>{selected.contact.phone}</span>
                <span>{selected.contact.email}</span>
              </div>
              <div>
                <small>Település</small>
                <strong>{selected.contact.city}</strong>
                <span>Helyszín: {site.contact.street}</span>
              </div>
            </div>
            {selected.note && <div className="hint-box">{selected.note}</div>}
            <ConfirmationNote appointment={selected} />
            <div className="button-row">
              <button
                className="button button-outline"
                onClick={() => calendarFile(selected)}
              >
                <Download size={16} /> Naptárba
              </button>
              {!["cancelled", "completed", "progress"].includes(
                selected.status,
              ) &&
                selected.date >= today() && (
                  <>
                    <Link
                      className="button"
                      href={`/idopont?edit=${selected.id}`}
                    >
                      Új időpont <ArrowRight size={16} />
                    </Link>
                    <button
                      className="text-button danger-text"
                      onClick={() => setCancel(selected.id)}
                    >
                      Lemondás
                    </button>
                  </>
                )}
            </div>
          </div>
        </Modal>
      )}
      {cancel && (
        <Modal title="Lemondod az időpontot?" close={() => setCancel(null)}>
          <div className="modal-form">
            <p className="muted">
              A foglalást lemondottra állítjuk, és az időpont újra elérhetővé
              válik a demóban.
            </p>
            <div className="panel-actions">
              <button className="text-button" onClick={() => setCancel(null)}>
                Mégse
              </button>
              <button
                className="button danger"
                onClick={() => {
                  if (
                    mutate((s) => ({
                      ...s,
                      appointments: s.appointments.map((a) =>
                        a.id === cancel ? { ...a, status: "cancelled" } : a,
                      ),
                    }))
                  ) {
                    setCancel(null);
                    notify("Az időpontot lemondtuk.");
                  }
                }}
              >
                Időpont lemondása <X size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Partners() {
  const { user, store, demo, mutate, notify } = usePortal();
  const [settings, setSettings] = useState(false);
  const [tab, setTab] = useState("fleet");
  const company = store.companies[user?.id || ""] || {
    name: "",
    tax: "",
    city: "",
  };
  if (user?.role !== "partner")
    return (
      <>
        <PageHeading
          eyebrow="PARTNERKÖZPONT"
          title="A flottád is jó kezekben."
          description="Céges járművek, közös áttekintés és egyszerűbb szervizszervezés."
        />
        <section className="partner-landing">
          <div>
            <span className="eyebrow">
              KEVESEBB ÁLLÁSIDŐ. TÖBB TERVEZHETŐSÉG.
            </span>
            <h2>Egy partner a teljes flottádhoz.</h2>
            <p>
              Mentsd el a céges járműveket, foglalj a vállalkozásod nevében, és
              kövesd az időpontokat egyetlen felületen.
            </p>
            <div className="button-row">
              <button className="button" onClick={() => demo("partner")}>
                Partnerdemó kipróbálása <ArrowUpRight size={17} />
              </button>
              <Link href="/fiok" className="text-link">
                Céges fiók létrehozása <ArrowRight size={16} />
              </Link>
            </div>
            <p className="small muted">
              Regisztrációkor jelöld be a „Céges partnerként regisztrálok”
              lehetőséget.
            </p>
          </div>
          <Building2 size={150} strokeWidth={0.6} />
        </section>
        <div className="partner-benefits">
          {[
            {
              icon: CarFront,
              title: "Közös járműpark",
              text: "Minden rendszám és járműadat egy helyen.",
            },
            {
              icon: CalendarDays,
              title: "Átlátható foglalások",
              text: "A céges időpontok áttekintése és módosítása.",
            },
            {
              icon: ShieldCheck,
              title: "Személyes egyeztetés",
              text: "A javítás részleteit mindig megbeszéljük.",
            },
          ].map((b) => (
            <div key={b.title}>
              <b.icon size={27} strokeWidth={1.3} />
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </>
    );
  const cars = store.vehicles.filter((v) => v.owner === user.id);
  const bookings = store.appointments.filter(
    (a) =>
      a.owner === user.id &&
      a.date >= today() &&
      !["cancelled", "completed"].includes(a.status),
  );
  return (
    <>
      <PageHeading
        eyebrow="PARTNERKÖZPONT"
        title={company.name || "A céged szervizközpontja."}
        description="Céges autók és időpontok. Minden, ami a flottádhoz kell."
        action={
          <Link href="/idopont" className="button">
            <Plus size={17} /> Céges időpontfoglalás
          </Link>
        }
      />
      <div className="stats-grid">
        <div>
          <span>Jármű a flottában</span>
          <strong>
            {cars.length.toString().padStart(2, "0")}
            <CarFront size={24} />
          </strong>
          <small>Mindig kéznél lévő járműadatok</small>
        </div>
        <div>
          <span>Közelgő időpont</span>
          <strong>
            {bookings.length.toString().padStart(2, "0")}
            <CalendarDays size={24} />
          </strong>
          <small>A következő szervizek tervezéséhez</small>
        </div>
        <button className="company-settings" onClick={() => setSettings(true)}>
          <span>
            Céges adatok <Pencil size={14} />
          </span>
          <h3>{company.name}</h3>
          <small>
            {company.tax || "Adószám hozzáadása"} ·{" "}
            {company.city || "Település hozzáadása"}
          </small>
        </button>
      </div>
      <div className="tabs partner-tabs">
        <button
          className={tab === "fleet" ? "active" : ""}
          onClick={() => setTab("fleet")}
        >
          Járműpark
        </button>
        <button
          className={tab === "appointments" ? "active" : ""}
          onClick={() => setTab("appointments")}
        >
          Céges foglalások
        </button>
      </div>
      {tab === "fleet" ? <Vehicles embedded /> : <Appointments embedded />}
      <p className="demo-footnote">
        A demóban minden céges fióknak saját flottája és egy kapcsolattartója
        van. Több munkatárs közös hozzáférése egy későbbi változatban lesz
        elérhető.
      </p>
      {settings && (
        <Modal title="Céges adatok" close={() => setSettings(false)}>
          <form
            className="modal-form stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                mutate((s) => ({
                  ...s,
                  companies: {
                    ...s.companies,
                    [user.id]: {
                      name: String(f.get("name")).trim(),
                      tax: String(f.get("tax")).trim(),
                      city: String(f.get("city")).trim(),
                    },
                  },
                }))
              ) {
                setSettings(false);
                notify("Céges adatok mentve.");
              }
            }}
          >
            <Field
              name="name"
              label="Cégnév"
              required
              maxLength={120}
              pattern=".*\S.*"
              defaultValue={company.name}
            />
            <Field
              name="tax"
              label="Adószám"
              maxLength={30}
              defaultValue={company.tax}
            />
            <Field
              name="city"
              label="Település"
              maxLength={100}
              defaultValue={company.city}
            />
            <button className="button" type="submit">
              Adatok mentése <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Workshop() {
  return <AppointmentDesk />;
}
export function Reception() {
  return <AppointmentDesk reception />;
}
function AppointmentDesk({ reception = false }: { reception?: boolean }) {
  const { user, store, demo, mutate, notify } = usePortal();
  const permitted = reception
    ? canCoordinateAppointments(user?.role)
    : canManageWorkshop(user?.role);
  const operational = !reception && canManageWorkshop(user?.role);
  const [day, setDay] = useState(nextBusinessDay);
  const [filter, setFilter] = useState("day");
  const [selected, setSelected] = useState<string | null>(null);
  const [closure, setClosure] = useState(false);
  useEffect(() => {
    if (!permitted) return;
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date");
    if (
      date &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(new Date(`${date}T12:00:00`).getTime())
    )
      setDay(date);
    if (params.get("filter") === "requests") setFilter("requests");
    const appointment = params.get("appointment");
    if (appointment && store.appointments.some((a) => a.id === appointment))
      setSelected(appointment);
  }, [user?.role, reception]);
  if (!permitted)
    return (
      <>
        <PageHeading
          eyebrow={reception ? "MUNKAFELVÉTEL" : "MŰHELY"}
          title="A szerviz napja, átláthatóan."
          description={
            reception
              ? "Ügyfélfogadás, időpontkérések és napi egyeztetések."
              : "Vezetői nézet a foglalások jóváhagyásához és a napi munkához."
          }
        />
        <Empty
          icon={reception ? <ClipboardList size={32} /> : <Wrench size={32} />}
          title={
            reception
              ? "Itt kezdődik az ügyfélfogadás."
              : "Ez a vezetői műhelynézet."
          }
          description={
            reception
              ? "A munkafelvevői demóban kipróbálhatod a kérések jóváhagyását, az időpontegyeztetést és az ügyféladatok kezelését."
              : "A munkafelvevői feladatokat a Munkafelvétel oldalon találod. A műhelyfolyamatok és a zárvatartás kezelése a vezetői nézethez tartozik."
          }
        >
          {user?.role === "reception" ? (
            <Link className="button" href="/munkafelvetel">
              Munkafelvétel megnyitása <ArrowRight size={17} />
            </Link>
          ) : (
            <button
              className="button"
              onClick={() => demo(reception ? "reception" : "manager")}
            >
              {reception
                ? "Munkafelvevői demó megnyitása"
                : "Vezetői demó megnyitása"}{" "}
              <ArrowRight size={17} />
            </button>
          )}
        </Empty>
      </>
    );
  const requests = store.appointments.filter((a) => a.status === "requested");
  const list = store.appointments
    .filter((a) =>
      filter === "requests"
        ? a.status === "requested"
        : filter === "all"
          ? true
          : a.date === day,
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const a = store.appointments.find((x) => x.id === selected);
  function status(next: Status) {
    if (!selected || !user) return;
    const ok = mutate((s) =>
      changeAppointmentStatus(s, selected, next, user.id),
    );
    if (ok) notify("A foglalás állapotát frissítettük.");
  }
  return (
    <>
      <PageHeading
        eyebrow={reception ? "MUNKAFELVEVŐI MUNKATÉR" : "MŰHELY ÉS NAPTÁR"}
        title={
          reception ? "Munkafelvétel, egyszerűen." : "Jó munkát, jó napot!"
        }
        description={
          reception
            ? "Beérkező kérések, ügyféladatok és napi időpontegyeztetés."
            : "Időpontok, jóváhagyások és műhelyfeladatok egy helyen."
        }
        action={
          reception ? (
            <Link className="button" href="/idopont">
              Új időpont felvétele <Plus size={17} />
            </Link>
          ) : (
            <button
              className="button button-outline"
              onClick={() => setClosure(true)}
            >
              <SlidersHorizontal size={16} /> Zárvatartás kezelése
            </button>
          )
        }
      />
      <div className="stats-grid">
        <div>
          <span>Telefonos egyeztetésre vár</span>
          <strong>
            {requests.length.toString().padStart(2, "0")}
            <Clock3 size={24} />
          </strong>
          <small>Ügyfél- és partnerkérések</small>
        </div>
        <div>
          <span>Kiválasztott nap foglalásai</span>
          <strong>
            {store.appointments
              .filter((a) => a.date === day && a.status !== "cancelled")
              .length.toString()
              .padStart(2, "0")}
            <CalendarDays size={24} />
          </strong>
          <small>{dateLabel(day)}</small>
        </div>
        <div>
          <span>{reception ? "Visszaigazolt időpontok" : "Demókapacitás"}</span>
          <strong>
            {(reception
              ? store.appointments.filter(
                  (a) => a.date === day && a.status === "confirmed",
                ).length
              : site.booking.capacity
            )
              .toString()
              .padStart(2, "0")}
            {reception ? <Check size={24} /> : <Wrench size={24} />}
          </strong>
          <small>
            {reception
              ? "Érkezésre váró ügyfelek a kiválasztott napon"
              : `Egyszerre ${site.booking.capacity} időpont · ${site.hours.short}`}
          </small>
        </div>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          <button
            className={filter === "day" ? "active" : ""}
            onClick={() => setFilter("day")}
          >
            Napi naptár
          </button>
          <button
            className={filter === "requests" ? "active" : ""}
            onClick={() => setFilter("requests")}
          >
            Kérések <span>{requests.length}</span>
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Összes
          </button>
        </div>
        {filter === "day" && (
          <div className="date-picker">
            <button
              className="icon-button"
              aria-label="Előző nap"
              onClick={() => setDay(addDays(day, -1))}
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              aria-label="Naptár napja"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
            />
            <button
              className="icon-button"
              aria-label="Következő nap"
              onClick={() => setDay(addDays(day, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      {store.blockedDates.includes(day) && filter === "day" && (
        <div className="info-box">
          Ez a nap új foglalások előtt le van zárva. A korábbi időpontok
          változatlanul megmaradnak.
        </div>
      )}
      {list.length ? (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Időpont</th>
                <th>Ügyfél / jármű</th>
                <th>Szolgáltatás</th>
                <th>Állapot</th>
                <th>
                  <span className="sr-only">Művelet</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.time}</strong>
                    <span>
                      {dateLabel(a.date, { month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td>
                    <strong>
                      {a.contact.name}
                      {a.organization && <Building2 size={13} />}
                    </strong>
                    <span>
                      {a.vehicle.plate} · {a.vehicle.make} {a.vehicle.model}
                    </span>
                  </td>
                  <td>
                    {services.find((s) => s.id === a.service)?.short}
                    <span>{a.duration} perc</span>
                  </td>
                  <td>
                    <span className={`status status-${a.status}`}>
                      <span />
                      {statusNames[a.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`${a.id} kezelése`}
                      onClick={() => setSelected(a.id)}
                    >
                      <ArrowUpRight size={19} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon={<CalendarDays size={30} />}
          title="Szabad a pálya."
          description="Ebben a nézetben nincs foglalás. A vendégként vagy ügyfélként leadott kérések itt jelennek meg."
        />
      )}
      {a && (
        <Modal title="Foglalás kezelése" close={() => setSelected(null)}>
          <div className="modal-form">
            <div className="booking-detail-top">
              <span className={`status status-${a.status}`}>
                <span />
                {statusNames[a.status]}
              </span>
              <code>{a.id}</code>
            </div>
            <h2 className="detail-title">{a.contact.name}</h2>
            <div className="detail-grid">
              <div>
                <small>Szolgáltatás</small>
                <strong>
                  {services.find((s) => s.id === a.service)?.name}
                </strong>
                <span>
                  {dateLabel(a.date)} · {a.time}
                </span>
              </div>
              <div>
                <small>Jármű</small>
                <strong>
                  {a.vehicle.make} {a.vehicle.model} ({a.vehicle.year})
                </strong>
                <span>{a.vehicle.plate}</span>
              </div>
              <div>
                <small>Elérhetőség</small>
                <strong>
                  <a href={`tel:${a.contact.phone.replace(/[^+\d]/g, "")}`}>
                    {a.contact.phone}
                  </a>
                </strong>
                <a href={`mailto:${a.contact.email}`}>{a.contact.email}</a>
                <span>{a.contact.city}</span>
              </div>
              <div>
                <small>Típus</small>
                <strong>
                  {a.organization
                    ? "Céges partner"
                    : a.owner
                      ? "Regisztrált ügyfél"
                      : "Vendégfoglalás"}
                </strong>
                <span>{a.demo ? "Mintaidőpont" : "Helyi demófoglalás"}</span>
              </div>
            </div>
            {a.note && <div className="hint-box">{a.note}</div>}
            <ConfirmationNote appointment={a} internal />
            <div className="button-row">
              {a.status === "requested" && (
                <button className="button" onClick={() => status("confirmed")}>
                  <Check size={17} /> Visszaigazolás
                </button>
              )}
              {operational && a.status === "confirmed" && (
                <button className="button" onClick={() => status("progress")}>
                  <Wrench size={17} /> Munka indítása
                </button>
              )}
              {operational && a.status === "progress" && (
                <button className="button" onClick={() => status("completed")}>
                  <Check size={17} /> Elkészült
                </button>
              )}
              {["requested", "confirmed"].includes(a.status) && (
                <Link
                  className="button button-outline"
                  href={`/idopont?edit=${encodeURIComponent(a.id)}`}
                >
                  Új időpont egyeztetése <CalendarDays size={17} />
                </Link>
              )}
              {["requested", "confirmed"].includes(a.status) && (
                <button
                  className="button button-outline danger-text"
                  onClick={() => status("cancelled")}
                >
                  Lemondás / elutasítás
                </button>
              )}
            </div>
            <p className="demo-footnote">
              Az állapotváltások helyben mentődnek; a demó nem küld értesítést
              az ügyfélnek.
            </p>
          </div>
        </Modal>
      )}
      {operational && closure && (
        <Modal title="Zárvatartás kezelése" close={() => setClosure(false)}>
          <div className="modal-form">
            <p className="muted">
              A lezárt napokra nem lehet új időpontot kérni. A meglévő
              foglalásokat külön kell egyeztetni.
            </p>
            <form
              className="closure-form"
              onSubmit={(e) => {
                e.preventDefault();
                const d = String(new FormData(e.currentTarget).get("date"));
                if (
                  mutate((s) => ({
                    ...s,
                    blockedDates: [...new Set([...s.blockedDates, d])],
                  }))
                )
                  notify("A napot lezártuk új foglalások előtt.");
              }}
            >
              <Field
                name="date"
                label="Lezárandó nap"
                type="date"
                min={today()}
                required
                defaultValue={day < today() ? today() : day}
              />
              <button className="button" type="submit">
                Nap lezárása
              </button>
            </form>
            <div className="closure-list">
              {store.blockedDates.length ? (
                [...store.blockedDates].sort().map((d) => (
                  <div key={d}>
                    <span>{dateLabel(d)}</span>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (
                          mutate((s) => ({
                            ...s,
                            blockedDates: s.blockedDates.filter((x) => x !== d),
                          }))
                        )
                          notify("A nap újra foglalható.");
                      }}
                    >
                      Újranyitás <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted small">Nincs külön lezárt nap.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
