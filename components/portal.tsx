"use client";
import { useEffect, useState } from "react";
import { ServiceIcon, PageHeading, Modal } from "./ui";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  CalendarDays,
  CarFront,
  UserRound,
  Building2,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  CircleHelp,
  MapPin,
  Clock3,
  Phone,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { Provider, usePortal } from "./provider";
import Booking from "./booking";
import {
  Account,
  Vehicles,
  Partners,
  Workshop,
  Appointments,
} from "./workspace";
import {
  services,
  dateLabel,
  nextBusinessDay,
  times,
  available,
  statusNames,
  type View,
} from "@/lib/demo";
const nav = [
  {
    view: "overview",
    href: "/attekintes",
    label: "Áttekintés",
    icon: LayoutDashboard,
  },
  {
    view: "booking",
    href: "/idopont",
    label: "Időpontfoglalás",
    icon: CalendarDays,
  },
  {
    view: "appointments",
    href: "/foglalasaim",
    label: "Foglalásaim",
    icon: Clock3,
  },
  { view: "vehicles", href: "/jarmuvek", label: "Járműveim", icon: CarFront },
];
const names: Record<View, string> = {
  overview: "Áttekintés",
  booking: "Időpontfoglalás",
  appointments: "Foglalásaim",
  vehicles: "Járműveim",
  account: "Saját fiók",
  partners: "Partnerközpont",
  workshop: "Műhely",
};
function Shell({ view }: { view: View }) {
  const { user, store, ready, session, demo } = usePortal();
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.dataset.theme === "dark"),
    [],
  );
  function theme() {
    const v = !dark;
    setDark(v);
    document.documentElement.dataset.theme = v ? "dark" : "light";
    try {
      localStorage.setItem("fairauto-theme", v ? "dark" : "light");
    } catch {}
  }
  const count = store.appointments.filter(
    (a) =>
      a.owner === (user?.id || null) &&
      !["completed", "cancelled"].includes(a.status),
  ).length;
  return (
    <>
      <a href="#main" className="skip-link">
        Ugrás a tartalomra
      </a>
      {menu && <div className="sidebar-scrim" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link
          href="/"
          className="brand"
          aria-label="Fair Autószerviz – főoldal"
        >
          <img src="/images/fair-logo.png" alt="Fair Autószerviz Fehérvár" />
          <span>ÜGYFÉLPORTÁL</span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="Menü bezárása"
        >
          <X />
        </button>
        <div className="sidebar-label">A TE SZERVIZED</div>
        <nav aria-label="Fő navigáció">
          {nav.map((n) => (
            <Link
              key={n.view}
              href={n.href}
              className={`nav-item ${view === n.view ? "active" : ""}`}
              aria-current={view === n.view ? "page" : undefined}
            >
              <n.icon size={19} strokeWidth={1.6} />
              <span>{n.label}</span>
              {n.view === "appointments" && count > 0 && (
                <span className="nav-count">{count}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label second">MÉG TÖBB LEHETŐSÉG</div>
        <nav aria-label="További oldalak">
          <Link
            href="/partnerek"
            className={`nav-item ${view === "partners" ? "active" : ""}`}
          >
            <Building2 size={19} strokeWidth={1.6} />
            <span>Partnerközpont</span>
            <span className="tiny-label">CÉGES</span>
          </Link>
          <Link
            href="/fiok"
            className={`nav-item ${view === "account" ? "active" : ""}`}
          >
            <UserRound size={19} strokeWidth={1.6} />
            <span>Saját fiók</span>
          </Link>
          {user?.role === "staff" && (
            <Link
              href="/muhely"
              className={`nav-item ${view === "workshop" ? "active" : ""}`}
            >
              <Wrench size={19} />
              <span>Műhely és naptár</span>
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">
              <Wrench size={20} strokeWidth={1.5} />
            </span>
            <h3>Segítünk úton maradni.</h3>
            <p>Kérdésed van? Beszéljünk!</p>
            <a href="tel:+36204055958">
              +36 20 405 5958 <ArrowUpRight size={15} />
            </a>
          </div>
          <a
            className="main-site"
            href="https://fairautoweb.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            A szerviz weboldala <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Menü megnyitása"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Ügyfélportál</span>
            <ChevronRight size={13} />
            <strong>{names[view]}</strong>
          </div>
          <div className="top-actions">
            <button className="demo-pill" onClick={() => setDemoOpen(true)}>
              <span /> Demó mód <ChevronDown size={12} />
            </button>
            <span className="top-divider" />
            <button
              className="icon-button"
              aria-label={dark ? "Világos téma" : "Sötét téma"}
              onClick={theme}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button help-button"
              aria-label="Segítség"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
            <Link className="user-menu" href="/fiok">
              <span className="avatar">
                {user ? (
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                ) : (
                  <UserRound size={17} />
                )}
              </span>
              <span className="user-menu-text">
                {user ? user.name : "Vendég"}
                <small>
                  {user?.role === "partner"
                    ? "Céges partner"
                    : user?.role === "staff"
                      ? "Munkatárs"
                      : user
                        ? "Saját fiók"
                        : "Bejelentkezés"}
                </small>
              </span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <main id="main" className="main">
          {!ready ? (
            <div className="loading">A műhely ajtaja nyílik…</div>
          ) : view === "overview" ? (
            <Overview />
          ) : view === "booking" ? (
            <Booking />
          ) : view === "account" ? (
            <Account />
          ) : view === "vehicles" ? (
            <Vehicles />
          ) : view === "appointments" ? (
            <Appointments />
          ) : view === "partners" ? (
            <Partners />
          ) : (
            <Workshop />
          )}
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Fair Autószerviz Fehérvár</span>
          <span>
            <span className="footer-dot" /> Minden kilométeren számíthatsz ránk.
          </span>
          <button onClick={() => setHelp(true)}>
            Kapcsolat és adatkezelés <ArrowUpRight size={12} />
          </button>
        </footer>
      </div>
      {demoOpen && (
        <Modal title="Próbáld ki a portált" close={() => setDemoOpen(false)}>
          <p className="muted modal-intro">
            Ez egy működő, böngészőben tárolt prototípus. Nincs valódi foglalás,
            e-mail-küldés vagy homelab-kapcsolat. Kérjük, mintaadatokat
            használj.
          </p>
          <div className="demo-options">
            {(
              [
                {
                  role: "customer",
                  label: "Magánügyfél",
                  desc: "Saját autók, foglalások és személyes adatok.",
                  icon: UserRound,
                },
                {
                  role: "partner",
                  label: "Céges partner",
                  desc: "Közös flotta és céges időpontok.",
                  icon: Building2,
                },
                {
                  role: "staff",
                  label: "Műhely munkatárs",
                  desc: "Naptár, jóváhagyás és nyitvatartás.",
                  icon: Wrench,
                },
              ] as const
            ).map((r) => (
              <Link
                href={
                  r.role === "staff"
                    ? "/muhely"
                    : r.role === "partner"
                      ? "/partnerek"
                      : "/attekintes"
                }
                key={r.role}
                className="demo-option"
                onClick={() => {
                  demo(r.role);
                  setDemoOpen(false);
                }}
              >
                <r.icon size={23} />
                <span>
                  <strong>{r.label}</strong>
                  <small>{r.desc}</small>
                </span>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
          {user && (
            <button
              className="text-button modal-logout"
              onClick={() => {
                session(null);
                setDemoOpen(false);
              }}
            >
              <LogOut size={16} /> Folytatás vendégként
            </button>
          )}
        </Modal>
      )}
      {help && (
        <Modal
          title="Itt vagyunk, ha szükséged van ránk."
          close={() => setHelp(false)}
        >
          <div className="help-content">
            <p className="muted">Fair Autószerviz Fehérvár</p>
            <a href="tel:+36204055958">
              <Phone size={18} /> +36 20 405 5958
            </a>
            <a href="mailto:kborsos@fairauto.eu">
              <Mail size={18} /> kborsos@fairauto.eu
            </a>
            <p>
              <MapPin size={18} /> 8000 Székesfehérvár, Balatoni út 8.
            </p>
            <p>
              <Clock3 size={18} /> Hétfő–péntek · 06:00–17:00
            </p>
            <div className="info-box">
              <strong>A prototípus adatkezelése</strong>
              <p>
                Az itt megadott adatok kizárólag ebben a böngészőben maradnak. A
                demónézetek szabadon válthatók; ez nem éles jogosultságkezelés.
                Ne adj meg valós személyes adatokat vagy máshol használt
                jelszót. A böngésző webhelyadatainak törlése eltávolítja a
                mentéseket.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
function Overview() {
  const { user, store } = usePortal();
  const upcoming = store.appointments
    .filter(
      (a) =>
        a.owner === (user?.id || null) &&
        a.date >=
          new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Budapest",
          }).format(new Date()) &&
        !["cancelled", "completed"].includes(a.status),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const day = nextBusinessDay();
  const slots = times.filter((t) => available(store, day, t, 60)).slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="FAIR AUTÓSZERVIZ FEHÉRVÁR"
        title={
          user
            ? `Szia, ${user.name.split(" ")[1] || user.name.split(" ")[0]}! Jó újra itt.`
            : "Jó kezekben. Jó időben."
        }
        description="Kevesebb szervezés, több gondtalan kilométer. Intézd a szervizt egyszerűen."
        action={
          <div className="today-label">
            <CalendarDays size={17} />
            <span>
              {dateLabel(
                new Intl.DateTimeFormat("sv-SE", {
                  timeZone: "Europe/Budapest",
                }).format(new Date()),
                { year: "numeric", month: "long", day: "numeric" },
              )}
            </span>
          </div>
        }
      />
      <section className="dashboard-top">
        <div className="hero-card">
          <img
            src="/images/workshop.jpg"
            alt="Motor és alkatrészek a szervizben"
            className="hero-photo"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="hero-tag">
              <span /> A következő útra is felkészítünk
            </span>
            <h2>
              Az autódra figyelünk.
              <br />
              <span>Az idődre is.</span>
            </h2>
            <p>
              Válassz szolgáltatást és időpontot.
              <br />A többit bízd ránk.
            </p>
            <Link href="/idopont" className="button button-white">
              Időpontot foglalok <ArrowUpRight size={18} />
            </Link>
            <div className="hero-foot">
              <ShieldCheck size={15} />
              <span>Márkafüggetlen szakértelem</span>
              <i /> <span>Székesfehérvár</span>
            </div>
          </div>
          <span className="hero-image-caption">FAIR · A MŰHELYED</span>
        </div>
        <div className="availability-card">
          <div className="card-heading">
            <span className="eyebrow">
              {upcoming ? "KÖVETKEZŐ IDŐPONTOD" : "TERVEZZ ELŐRE"}
            </span>
            <span className="rounded-icon">
              <CalendarDays size={18} />
            </span>
          </div>
          <h2>
            {upcoming ? "Találkozunk a műhelyben." : "Mikor lenne jó neked?"}
          </h2>
          <p className="muted">
            {upcoming
              ? "Minden fontos részlet egy helyen."
              : "A következő munkanap szabad időpontjai."}
          </p>
          <div className="date-feature">
            <span>
              {new Date(`${upcoming?.date || day}T12:00:00`).getDate()}
            </span>
            <div>
              <strong>
                {dateLabel(upcoming?.date || day, { month: "long" })}
              </strong>
              <small>
                {dateLabel(upcoming?.date || day, { weekday: "long" })}
              </small>
            </div>
            <span className="date-year">
              {(upcoming?.date || day).slice(0, 4)}
            </span>
          </div>
          {upcoming ? (
            <div className="upcoming-mini">
              <strong>
                {upcoming.time} ·{" "}
                {services.find((s) => s.id === upcoming.service)?.short}
              </strong>
              <span>
                {upcoming.vehicle.make} {upcoming.vehicle.model} ·{" "}
                {upcoming.vehicle.plate}
              </span>
              <span className={`status status-${upcoming.status}`}>
                <span />
                {statusNames[upcoming.status]}
              </span>
            </div>
          ) : (
            <div className="slot-preview">
              {slots.map((t) => (
                <Link
                  key={t}
                  href={`/idopont?service=diagnostics&date=${day}&time=${t}`}
                >
                  {t}
                  <ArrowUpRight size={13} />
                </Link>
              ))}
              {!slots.length && (
                <span className="muted">Másik napra is választhatsz.</span>
              )}
            </div>
          )}
          <Link
            href={upcoming ? "/foglalasaim" : "/idopont"}
            className="card-bottom-link"
          >
            {upcoming ? "Foglalás részletei" : "Összes időpont megtekintése"}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="services-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">AMIBEN SEGÍTHETÜNK</p>
            <h2>Mire van szüksége az autódnak?</h2>
          </div>
          <Link href="/idopont" className="text-link">
            Összes szolgáltatás <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="services-grid">
          {services.slice(0, 4).map((s, i) => (
            <Link
              className="service-card"
              href={`/idopont?service=${s.id}`}
              key={s.id}
            >
              <div className="service-card-top">
                <ServiceIcon name={s.icon} size={29} />
                <span>0{i + 1}</span>
              </div>
              <h3>{s.short}</h3>
              <p>{s.description}</p>
              <div className="service-card-bottom">
                <span>
                  <Clock3 size={12} /> kb. {s.duration} perc
                </span>
                <span className="service-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="dashboard-bottom">
        <div className="account-promo">
          <div className="promo-icon">
            <CarFront size={28} strokeWidth={1.3} />
          </div>
          <div>
            <span className="eyebrow">
              EGYSZER MEGADOD. LEGKÖZELEBB MÁR VÁR.
            </span>
            <h3>
              {user
                ? "Az autóidnak is van saját helye."
                : "Saját fiók, kevesebb teendő."}
            </h3>
            <p>
              Mentsd el az adataidat és az autóidat, hogy a következő foglalás
              még egyszerűbb legyen.
            </p>
            <Link href={user ? "/jarmuvek" : "/fiok"} className="text-link">
              {user ? "Járműveim kezelése" : "Fiókot hozok létre"}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="workshop-info">
          <span className="eyebrow">ITT VÁRUNK</span>
          <h3>Ismerős hely. Biztos háttér.</h3>
          <p>
            <MapPin size={15} /> Székesfehérvár, Balatoni út 8.
          </p>
          <p>
            <Clock3 size={15} /> H–P 06:00–17:00 <span className="info-dot" />
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Fair+Autószerviz+Fehérvár+Balatoni+út+8"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Útvonaltervezés <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <div className="trust-line">
        <span>
          <ShieldCheck size={15} /> Korrekt hozzáállás
        </span>
        <i />
        <span>Átlátható egyeztetés</span>
        <i />
        <span>Több mint egy szerviz</span>
      </div>
    </>
  );
}
export default function Portal({ view }: { view: View }) {
  return (
    <Provider>
      <Shell view={view} />
    </Provider>
  );
}
