"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { Provider, usePortal } from "./provider";
import { ServiceIcon } from "./ui";
import {
  addDays,
  available,
  dateLabel,
  services,
  times,
  today,
} from "@/lib/demo";

function Welcome() {
  const { store, ready, user } = usePortal();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [serviceId, setServiceId] = useState("maintenance");
  const [preferredTime, setPreferredTime] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);

  useEffect(
    () => setDark(document.documentElement.dataset.theme === "dark"),
    [],
  );
  useEffect(() => {
    if (!menu) return;
    navigation.current?.querySelector<HTMLElement>("a")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menu]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("fairauto-theme", next ? "dark" : "light");
    } catch {}
  }

  const service = services.find((s) => s.id === serviceId)!;
  let nextDay = "";
  let slots: string[] = [];
  if (ready) {
    for (let offset = 0; offset <= 90; offset++) {
      const date = addDays(today(), offset);
      const options = times.filter((time) =>
        available(store, date, time, service.duration),
      );
      if (options.length) {
        nextDay = date;
        slots = options.slice(0, 3);
        break;
      }
    }
  }
  const selectedTime = slots.includes(preferredTime) ? preferredTime : slots[0];
  const bookingUrl = nextDay
    ? `/idopont?service=${serviceId}&date=${nextDay}&time=${selectedTime}`
    : `/idopont?service=${serviceId}`;

  return (
    <div className="welcome-home">
      <a href="#home-main" className="skip-link">
        Ugrás a tartalomra
      </a>
      <div className="home-demo-note">
        <span /> Bemutató oldal · A foglalások helyben tárolódnak, valódi
        időpontkérés nem történik.
      </div>
      <div className="home-opening">
        <img
          className="home-opening-photo"
          src="/images/workshop.jpg"
          alt=""
          fetchPriority="high"
        />
        <div className="home-opening-shade" />
        <header className="home-header home-container">
          <Link
            href="/"
            className="home-brand"
            aria-label="Fair Autószerviz – főoldal"
          >
            <img
              src="/images/fair-logo.png"
              alt="Fair Autószerviz Fehérvár"
              width={144}
              height={64}
            />
          </Link>
          <nav
            ref={navigation}
            id="home-navigation"
            className={`home-nav ${menu ? "is-open" : ""}`}
            aria-label="Főoldal navigáció"
          >
            <a href="#szolgaltatasok" onClick={() => setMenu(false)}>
              Szolgáltatások
            </a>
            <a href="#hogyan-mukodik" onClick={() => setMenu(false)}>
              Hogyan működik?
            </a>
            <Link href="/partnerek">
              Céges partnerek <ArrowUpRight size={12} />
            </Link>
          </nav>
          <div className="home-header-actions">
            <button
              className="home-theme"
              onClick={toggleTheme}
              aria-label={dark ? "Világos téma" : "Sötét téma"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link className="home-signin" href={user ? "/attekintes" : "/fiok"}>
              <UserRound size={15} />
              {user ? "Saját portálom" : "Bejelentkezés"}
            </Link>
            <Link href="/idopont" className="home-header-book">
              Időpontfoglalás <ArrowUpRight size={15} />
            </Link>
            <button
              ref={menuButton}
              className="home-menu"
              aria-label={menu ? "Menü bezárása" : "Menü megnyitása"}
              aria-expanded={menu}
              aria-controls="home-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </header>
        <main id="home-main">
          <section
            className="home-hero home-container"
            aria-labelledby="home-title"
          >
            <div className="home-hero-copy">
              <p className="home-overline">
                <span /> FAIR AUTÓSZERVIZ · SZÉKESFEHÉRVÁR
              </p>
              <h1 id="home-title">
                Jó kezekben.
                <br />
                <span>
                  Már az első
                  <br />
                  időponttól.
                </span>
              </h1>
              <p className="home-hero-description">
                Gondoskodás az autódnak. Nyugalom neked.
                <br />
                Foglalj szervizidőpontot egyszerűen, amikor neked jó.
              </p>
              <div className="home-hero-actions">
                <Link className="home-primary" href="/idopont">
                  Időpontot foglalok <ArrowUpRight size={19} />
                </Link>
                <a className="home-hero-secondary" href="#hogyan-mukodik">
                  Így működik <ArrowDown size={15} />
                </a>
              </div>
              <div className="home-guest-note">
                <CheckCircle2 size={14} />
                <span>Vendégként is foglalhatsz. Regisztráció nélkül.</span>
              </div>
            </div>
            <aside
              className="home-quick-book"
              aria-labelledby="quick-book-title"
            >
              <div className="home-quick-top">
                <span className="home-overline">
                  EGY JÓ IDŐPONTTAL KEZDŐDIK
                </span>
                <CalendarDays size={21} strokeWidth={1.3} />
              </div>
              <h2 id="quick-book-title">Találjunk időt az autódra.</h2>
              <p>Nézd meg a következő szabad lehetőséget.</p>
              <label className="home-service-select">
                <span>Miben segíthetünk?</span>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setPreferredTime("");
                  }}
                  disabled={!ready}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </label>
              <div className="home-quick-date" aria-live="polite">
                {nextDay ? (
                  <>
                    <span>{Number(nextDay.slice(-2))}</span>
                    <div>
                      <strong>{dateLabel(nextDay, { month: "long" })}</strong>
                      <small>{dateLabel(nextDay, { weekday: "long" })}</small>
                    </div>
                    <span className="home-next-tag">KÖVETKEZŐ SZABAD NAP</span>
                  </>
                ) : (
                  <p>
                    {ready
                      ? "Nézzünk egy másik lehetőséget."
                      : "Szabad időpontok keresése…"}
                  </p>
                )}
              </div>
              {slots.length > 0 && (
                <div
                  className="home-quick-times"
                  aria-label="Választható érkezési időpontok"
                >
                  {slots.map((time) => (
                    <button
                      key={time}
                      aria-pressed={selectedTime === time}
                      className={selectedTime === time ? "selected" : ""}
                      onClick={() => setPreferredTime(time)}
                    >
                      {time}
                      {selectedTime === time && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
              <Link href={bookingUrl} className="home-quick-cta">
                {nextDay
                  ? "Ezt az időpontot választom"
                  : "Összes időpont megtekintése"}
                <ArrowUpRight size={17} />
              </Link>
              <p className="home-quick-footnote">
                <ShieldCheck size={13} /> Véglegesítés a műhely visszaigazolása
                után.
              </p>
            </aside>
          </section>
          <div className="home-hero-bottom home-container">
            <a href="#szolgaltatasok">
              Ismerd meg a lehetőségeket <ArrowDown size={15} />
            </a>
            <span>
              <MapPin size={13} /> Balatoni út 8., Székesfehérvár
            </span>
            <span>
              <Clock3 size={13} /> H–P · 06:00–17:00
            </span>
          </div>
          <div className="home-below-hero">
            <section
              className="home-trust home-container"
              aria-label="A Fair Autószerviz előnyei"
            >
              <span>
                <ShieldCheck size={20} strokeWidth={1.3} /> Márkafüggetlen
                szakértelem
              </span>
              <span>
                <CalendarDays size={20} strokeWidth={1.3} /> Egyszerű online
                időpontkérés
              </span>
              <span>
                <Wrench size={20} strokeWidth={1.3} /> Személyes, korrekt
                egyeztetés
              </span>
            </section>
            <section
              className="home-services home-container"
              id="szolgaltatasok"
              aria-labelledby="home-services-title"
            >
              <div className="home-section-heading">
                <div>
                  <p className="home-section-label">AMIBEN SZÁMÍTHATSZ RÁNK</p>
                  <h2 id="home-services-title">
                    A hétköznapi gondoskodástól
                    <br />a biztos továbbindulásig.
                  </h2>
                </div>
                <p>
                  Bármit vezetsz, ugyanazzal a figyelemmel várunk.
                  <br />
                  Válaszd ki, mire van szüksége az autódnak.
                </p>
              </div>
              <div className="home-service-grid">
                {services.slice(0, 4).map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/idopont?service=${s.id}`}
                    className="home-service-card"
                  >
                    <div>
                      <ServiceIcon name={s.icon} size={31} />
                      <span>0{i + 1}</span>
                    </div>
                    <span className="home-service-tag">{s.tag}</span>
                    <h3>{s.short}</h3>
                    <p>{s.description}</p>
                    <span className="home-service-link">
                      Időpontot kérek <ArrowUpRight size={17} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
            <section
              className="home-how home-container"
              id="hogyan-mukodik"
              aria-labelledby="home-how-title"
            >
              <div className="home-section-heading">
                <div>
                  <p className="home-section-label">
                    KEVESEBB SZERVEZÉS. TÖBB NYUGALOM.
                  </p>
                  <h2 id="home-how-title">Három lépés. És már úton is vagy.</h2>
                </div>
                <Link href="/idopont" className="home-inline-link">
                  Kezdjük a foglalást <ArrowUpRight size={17} />
                </Link>
              </div>
              <ol className="home-steps">
                <li>
                  <span className="home-step-index">01</span>
                  <div>
                    <h3>Mondd el, miben segíthetünk.</h3>
                    <p>
                      Válassz szolgáltatást, és ha szeretnéd, írd le, mit
                      tapasztalsz az autóddal.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="home-step-index">02</span>
                  <div>
                    <h3>Válassz egy jó időpontot.</h3>
                    <p>
                      Nézd meg a szabad napokat, add meg az elérhetőségedet és a
                      jármű adatait.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="home-step-index">03</span>
                  <div>
                    <h3>A részleteket ránk bízhatod.</h3>
                    <p>
                      A műhely visszaigazolja az időpontot, és egyezteti veled a
                      pontos teendőket.
                    </p>
                  </div>
                </li>
              </ol>
            </section>
            <section className="home-account-section">
              <div className="home-account-inner home-container">
                <div
                  className="home-garage-visual"
                  aria-label="A mentett járművek bemutatója"
                >
                  <div className="home-garage-top">
                    <span>
                      <CarFront size={17} /> SAJÁT GARÁZS
                    </span>
                    <span className="home-sample-tag">MINTA</span>
                  </div>
                  <div className="home-garage-car">
                    <CarFront size={118} strokeWidth={0.7} />
                  </div>
                  <div className="home-garage-model">
                    <div>
                      <h3>Volkswagen Golf</h3>
                      <p>2018 · A következő útra is készen</p>
                    </div>
                    <span className="home-garage-check">
                      <Check size={15} />
                    </span>
                  </div>
                  <div className="home-garage-plate">
                    <span>H</span> ABC-123
                  </div>
                  <div className="home-garage-bottom">
                    <span>
                      <CheckCircle2 size={14} /> Adataid elmentve
                    </span>
                    <span>
                      Legközelebb már kitöltjük helyetted{" "}
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                  <span className="home-garage-caption">
                    Egy hely, ahol az autóid adatai mindig kéznél vannak.
                  </span>
                </div>
                <div className="home-account-copy">
                  <p className="home-section-label">
                    A KÖVETKEZŐ ALKALOM MÉG EGYSZERŰBB
                  </p>
                  <h2>
                    Egyszer megadod.
                    <br />
                    <span>Mi megjegyezzük.</span>
                  </h2>
                  <p>
                    Saját fiókkal kevesebb az adatbevitel, és több az
                    átláthatóság. Az autós ügyeid végre egy helyre kerülnek.
                  </p>
                  <ul>
                    <li>
                      <Check size={16} /> Mentett járművek és automatikus
                      adatkitöltés
                    </li>
                    <li>
                      <Check size={16} /> Közelgő és korábbi foglalások egy
                      helyen
                    </li>
                    <li>
                      <Check size={16} /> Egyszerű módosítás és lemondás
                    </li>
                  </ul>
                  <div className="home-account-actions">
                    <Link
                      href={user ? "/attekintes" : "/fiok?mode=register"}
                      className="button"
                    >
                      {user
                        ? "Megnyitom a portálomat"
                        : "Saját fiókot hozok létre"}{" "}
                      <ArrowUpRight size={17} />
                    </Link>
                    <Link href="/idopont" className="home-inline-link">
                      Inkább vendégként foglalok <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <section
              className="home-partner home-container"
              aria-labelledby="home-partner-title"
            >
              <div className="home-partner-icon">
                <Building2 size={38} strokeWidth={1} />
              </div>
              <div>
                <p className="home-overline">CÉGES AUTÓK. KÖZÖS FIGYELEM.</p>
                <h2 id="home-partner-title">
                  A flottádnak is van nálunk helye.
                </h2>
                <p>
                  Kezeld a céges járműveket és foglalásokat egyetlen felületen.
                </p>
              </div>
              <Link href="/partnerek" className="home-primary">
                Megnézem a partnerközpontot <ArrowUpRight size={17} />
              </Link>
            </section>
            <section
              className="home-faq home-container"
              aria-labelledby="home-faq-title"
            >
              <div>
                <p className="home-section-label">JÓ, HA ELŐRE TUDOD</p>
                <h2 id="home-faq-title">Mielőtt elindulnál.</h2>
                <p>
                  Ha inkább személyesen kérdeznél,
                  <br />
                  egy telefonra vagyunk.
                </p>
                <a href="tel:+36204055958" className="home-inline-link">
                  +36 20 405 5958 <ArrowUpRight size={16} />
                </a>
              </div>
              <div className="home-faq-list">
                {[
                  {
                    q: "Fiók nélkül is foglalhatok?",
                    a: "Igen. Vendégként is megadhatod a kívánt szolgáltatást és időpontot. Csak az elérhetőségedre és az autód alapadataira lesz szükségünk. Saját fiókot később is létrehozhatsz.",
                  },
                  {
                    q: "Mikor lesz végleges az időpontom?",
                    a: "Az időpontkérés a műhely visszaigazolása után válik véglegessé. A pontos munkát és az árat külön egyeztetjük. Ez a bemutató nem továbbít valódi kérést a szerviznek.",
                  },
                  {
                    q: "Módosíthatom vagy lemondhatom a foglalást?",
                    a: "Igen, a Foglalásaim oldalon választhatsz új időpontot, vagy lemondhatod a még el nem kezdett szervizt. A demóban az adatok ebben a böngészőben érhetők el.",
                  },
                ].map((item) => (
                  <details key={item.q}>
                    <summary>
                      {item.q}
                      <PlusMark />
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
            <footer className="home-footer">
              <div className="home-container">
                <div className="home-footer-main">
                  <div>
                    <Link href="/" className="home-footer-brand">
                      <img
                        src="/images/fair-logo.png"
                        alt="Fair Autószerviz Fehérvár"
                        width={135}
                        height={60}
                      />
                    </Link>
                    <p>Korrekt szerviz. Gondtalanabb kilométerek.</p>
                  </div>
                  <div>
                    <span className="home-section-label">ITT VÁRUNK</span>
                    <p>8000 Székesfehérvár, Balatoni út 8.</p>
                    <p>Hétfő–péntek · 06:00–17:00</p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Fair+Autószerviz+Fehérvár+Balatoni+út+8"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Útvonaltervezés <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <div>
                    <span className="home-section-label">BESZÉLJÜNK</span>
                    <a href="tel:+36204055958" className="home-footer-phone">
                      +36 20 405 5958
                    </a>
                    <a href="mailto:kborsos@fairauto.eu">kborsos@fairauto.eu</a>
                    <Link href="/attekintes">
                      Ügyfélportál megnyitása <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
                <div className="home-footer-bottom">
                  <span>
                    © {new Date().getFullYear()} Fair Autószerviz Fehérvár
                  </span>
                  <span>
                    Bemutató · Nincs valódi foglalás vagy e-mail-küldés.
                  </span>
                  <a
                    href="https://fairautoweb.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    A szerviz weboldala <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
function PlusMark() {
  return <span className="home-faq-plus" aria-hidden="true" />;
}
export default function Home() {
  return (
    <Provider>
      <Welcome />
    </Provider>
  );
}
