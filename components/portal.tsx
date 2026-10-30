"use client";
import { useEffect, useState } from "react";
import { Modal } from "./ui";
import CustomerOverview from "./customer-overview";
import Management from "./management";
import Link from "next/link";
import {
  ArrowUpRight,
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
  BarChart3,
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
import type { View } from "@/lib/demo";
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
  management: "Vezetői áttekintés",
};
function Shell({ view }: { view: View }) {
  const { user, store, ready, session, demo } = usePortal();
  const management = user?.role === "manager";
  const staff = user?.role === "staff";
  const partner = user?.role === "partner";
  const activeView =
    view === "overview"
      ? management
        ? "management"
        : staff
          ? "workshop"
          : partner
            ? "partners"
            : "overview"
      : view;
  const workspaceName = management
    ? "Vezetői munkatér"
    : staff
      ? "Műhely"
      : partner
        ? "Partnerközpont"
        : "Ügyfélportál";
  const mainNav = management
    ? [
        {
          view: "management",
          href: "/vezetes",
          label: "Vezetői áttekintés",
          icon: BarChart3,
        },
        {
          view: "workshop",
          href: "/muhely",
          label: "Műhely és naptár",
          icon: Wrench,
        },
        {
          view: "booking",
          href: "/idopont",
          label: "Új időpont",
          icon: CalendarDays,
        },
      ]
    : staff
      ? [
          {
            view: "workshop",
            href: "/muhely",
            label: "Műhely és naptár",
            icon: Wrench,
          },
          {
            view: "booking",
            href: "/idopont",
            label: "Új időpont",
            icon: CalendarDays,
          },
        ]
      : partner
        ? [
            {
              view: "partners",
              href: "/partnerek",
              label: "Partnerközpont",
              icon: Building2,
            },
            {
              view: "booking",
              href: "/idopont",
              label: "Céges időpontfoglalás",
              icon: CalendarDays,
            },
            {
              view: "appointments",
              href: "/foglalasaim",
              label: "Céges foglalások",
              icon: Clock3,
            },
            {
              view: "vehicles",
              href: "/jarmuvek",
              label: "Járműpark",
              icon: CarFront,
            },
          ]
        : nav;
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
          <span>{workspaceName.toLocaleUpperCase("hu")}</span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="Menü bezárása"
        >
          <X />
        </button>
        <div className="sidebar-label">
          {management || staff
            ? "MŰHELYIRÁNYÍTÁS"
            : partner
              ? "A CÉGED SZERVIZE"
              : "A TE SZERVIZED"}
        </div>
        <nav aria-label="Fő navigáció">
          {mainNav.map((n) => (
            <Link
              key={n.view}
              href={n.href}
              className={`nav-item ${activeView === n.view ? "active" : ""}`}
              aria-current={activeView === n.view ? "page" : undefined}
            >
              <n.icon size={19} strokeWidth={1.6} />
              <span>{n.label}</span>
              {n.view === "appointments" && count > 0 && (
                <span className="nav-count">{count}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label second">A FIÓKOD</div>
        <nav aria-label="További oldalak">
          <Link
            href="/fiok"
            className={`nav-item ${view === "account" ? "active" : ""}`}
          >
            <UserRound size={19} strokeWidth={1.6} />
            <span>Saját fiók</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <a className="sidebar-contact" href="tel:+36204055958">
            <Phone size={15} />
            <span>+36 20 405 5958</span>
          </a>
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
            <span>{workspaceName}</span>
            <ChevronRight size={13} />
            <strong>{names[activeView]}</strong>
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
                    : user?.role === "manager"
                      ? "Tulajdonos / vezető"
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
          ) : activeView === "management" ? (
            <Management />
          ) : activeView === "overview" ? (
            <CustomerOverview />
          ) : activeView === "booking" ? (
            <Booking />
          ) : activeView === "account" ? (
            <Account />
          ) : activeView === "vehicles" ? (
            <Vehicles />
          ) : activeView === "appointments" ? (
            <Appointments />
          ) : activeView === "partners" ? (
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
                  role: "manager",
                  label: "Tulajdonos / vezető",
                  desc: "Műhelyszintű riportok, terhelés és összesítések.",
                  icon: BarChart3,
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
                  r.role === "manager"
                    ? "/vezetes"
                    : r.role === "staff"
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
export default function Portal({ view }: { view: View }) {
  return (
    <Provider>
      <Shell view={view} />
    </Provider>
  );
}
