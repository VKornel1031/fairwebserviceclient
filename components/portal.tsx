"use client";
import { useEffect, useState } from "react";
import { Modal } from "./ui";
import CustomerOverview from "./customer-overview";
import Management from "./management";
import Administration from "./administration";
import { AccountAvatar } from "./account-avatar";
import { canAdminister, canViewReports, roleLabels } from "@/lib/permissions";
import Link from "next/link";
import LegalLinks from "./legal-links";
import { site, address } from "@/content/site";
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
  CircleHelp,
  MapPin,
  Clock3,
  Phone,
  BarChart3,
  Mail,
  ClipboardList,
} from "lucide-react";
import { usePortal } from "./provider";
import Booking from "./booking";
import {
  Account,
  Vehicles,
  Partners,
  Workshop,
  Reception,
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
  reception: "Munkafelvétel",
  admin: "Fiókkezelés",
  management: "Vezetői áttekintés",
};
function Shell({ view }: { view: View }) {
  const { user, store, ready } = usePortal();
  const admin = canAdminister(user?.role);
  const management = canViewReports(user?.role);
  const reception = user?.role === "reception";
  const partner = user?.role === "partner";
  const activeView =
    view === "overview"
      ? admin
        ? "admin"
        : management
          ? "management"
          : reception
            ? "reception"
            : partner
              ? "partners"
              : "overview"
      : view;
  const workspaceName = admin
    ? "Adminisztráció"
    : management
      ? "Vezetői munkatér"
      : reception
        ? "Munkafelvevői munkatér"
        : partner
          ? "Partnerközpont"
          : "Ügyfélportál";
  const mainNav = management
    ? [
        ...(admin
          ? [
              {
                view: "admin",
                href: "/admin",
                label: "Fiókkezelés",
                icon: UserRound,
              },
              {
                view: "reception",
                href: "/munkafelvetel",
                label: "Munkafelvétel",
                icon: ClipboardList,
              },
            ]
          : []),
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
    : reception
      ? [
          {
            view: "reception",
            href: "/munkafelvetel",
            label: "Munkafelvétel",
            icon: ClipboardList,
          },
          {
            view: "booking",
            href: "/idopont",
            label: "Új időpont felvétele",
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
  // No guest/customer navigation until the server has resolved the account.
  if (!ready)
    return (
      <div className="loading" role="status">
        A műhely ajtaja nyílik…
      </div>
    );
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
          aria-label={`${site.shortName} – főoldal`}
        >
          <img src={site.logo} alt={site.name} />
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
          {management
            ? "MŰHELYIRÁNYÍTÁS"
            : reception
              ? "ÜGYFÉLFOGADÁS"
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
          <a className="sidebar-contact" href={site.contact.phoneHref}>
            <Phone size={15} />
            <span>{site.contact.phone}</span>
          </a>
          <a
            className="main-site"
            href={site.mainWebsite}
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
              <AccountAvatar user={user} />
              <span className="user-menu-text">
                {user ? user.name : "Vendég"}
                <small>{user ? roleLabels[user.role] : "Bejelentkezés"}</small>
              </span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <main id="main" className="main">
          {ready &&
            user &&
            activeView !== "account" &&
            activeView !== "admin" && (
              <div className="info-box account-scope">
                <strong>A fiókkezelés már elérhető.</strong>
                <p>
                  Az időpontok, járművek és riportok bekötése a következő lépés.
                  Ezen az oldalon még nincs élő szervizadat.
                </p>
                <Link className="text-link" href="/fiok">
                  Saját adatok kezelése
                </Link>
              </div>
            )}
          {activeView === "admin" ? (
            <Administration />
          ) : activeView === "management" ? (
            <Management />
          ) : activeView === "overview" ? (
            <CustomerOverview />
          ) : activeView === "booking" && user ? (
            <div className="panel">
              <h1>Hamarosan itt is foglalhatsz.</h1>
              <p>
                A fiókodat már használhatod. Az online időpontkérés bekötése még
                folyamatban van.
              </p>
              <a className="button" href={site.contact.phoneHref}>
                Telefonos időpontkérés
              </a>
            </div>
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
          ) : activeView === "reception" ? (
            <Reception />
          ) : (
            <Workshop />
          )}
        </main>
        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>
            <span className="footer-dot" /> Minden kilométeren számíthatsz ránk.
          </span>
          <button onClick={() => setHelp(true)}>
            Kapcsolat <ArrowUpRight size={12} />
          </button>
          <LegalLinks />
        </footer>
      </div>
      {help && (
        <Modal
          title="Itt vagyunk, ha szükséged van ránk."
          close={() => setHelp(false)}
        >
          <div className="help-content">
            <p className="muted">{site.name}</p>
            <a href={site.contact.phoneHref}>
              <Phone size={18} /> {site.contact.phone}
            </a>
            <a href={`mailto:${site.contact.email}`}>
              <Mail size={18} /> {site.contact.email}
            </a>
            <p>
              <MapPin size={18} /> {address}
            </p>
            <p>
              <Clock3 size={18} /> {site.hours.long}
            </p>
            <div className="info-box">
              <strong>A prototípus adatkezelése</strong>
              <p>
                A fiókokat a PocketBase tárolja. A szerepköröket az
                adminisztrátor kezeli. Az időpontfoglaló továbbra is helyi
                bemutató: nem küld valódi kérést vagy levelet, ott csak
                mintaadatokat adj meg.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export default function Portal({ view }: { view: View }) {
  return <Shell view={view} />;
}
