"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { Provider, usePortal } from "./provider";

function Welcome() {
  const { user } = usePortal();
  const [dark, setDark] = useState(false);

  useEffect(
    () => setDark(document.documentElement.dataset.theme === "dark"),
    [],
  );

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("fairauto-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className="welcome-home">
      <a href="#home-main" className="skip-link">
        Ugrás a tartalomra
      </a>
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
          <nav className="home-nav" aria-label="Főoldal navigáció">
            <a href="#hogyan-mukodik" className="home-how-link">
              Hogyan működik?
            </a>
            <Link className="home-signin" href={user ? "/attekintes" : "/fiok"}>
              {user ? "Saját portálom" : "Bejelentkezés"}{" "}
              <ArrowUpRight size={14} />
            </Link>
            <button
              className="home-theme"
              onClick={toggleTheme}
              aria-label={dark ? "Világos téma" : "Sötét téma"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </nav>
        </header>
        <main id="home-main">
          <section
            className="home-hero home-container"
            aria-labelledby="home-title"
          >
            <p className="home-overline">FAIR AUTÓSZERVIZ · SZÉKESFEHÉRVÁR</p>
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
              Foglalj szervizidőpontot egyszerűen.
              <br />
              Az autódról mi gondoskodunk.
            </p>
            <Link className="home-primary" href="/idopont">
              Időpontot foglalok <ArrowUpRight size={19} />
            </Link>
            <p className="home-guest-note">
              Vendégként is foglalhatsz. Regisztráció nélkül.
            </p>
          </section>
        </main>
      </div>
      <section
        className="home-how home-container"
        id="hogyan-mukodik"
        aria-labelledby="home-how-title"
      >
        <div className="home-section-heading">
          <p className="home-section-label">EGYSZERŰBB, MINT GONDOLNÁD</p>
          <h2 id="home-how-title">Három lépés. És már várunk.</h2>
        </div>
        <ol className="home-steps">
          <li>
            <span className="home-step-index">01</span>
            <div>
              <h3>Mondd el, miben segíthetünk.</h3>
              <p>
                Válassz szolgáltatást, és írd le, mire van szüksége az autódnak.
              </p>
            </div>
          </li>
          <li>
            <span className="home-step-index">02</span>
            <div>
              <h3>Válassz egy jó időpontot.</h3>
              <p>
                Keress egy szabad napot, és add meg a kapcsolatfelvételhez
                szükséges adatokat.
              </p>
            </div>
          </li>
          <li>
            <span className="home-step-index">03</span>
            <div>
              <h3>A többit egyeztetjük.</h3>
              <p>
                A műhely visszaigazolja az időpontot, és megbeszéli veled a
                részleteket.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-top">
            <span>Fair Autószerviz Fehérvár</span>
            <p>
              Székesfehérvár, Balatoni út 8. <span>·</span> H–P 06:00–17:00
            </p>
          </div>
          <div className="home-footer-links">
            <nav aria-label="További lehetőségek">
              <Link href={user ? "/attekintes" : "/fiok?mode=register"}>
                {user ? "Ügyfélportál megnyitása" : "Saját fiók létrehozása"}
              </Link>
              <Link href="/partnerek">Céges partnerek</Link>
            </nav>
            <a href="tel:+36204055958">
              +36 20 405 5958 <ArrowUpRight size={13} />
            </a>
          </div>
          <p className="home-demo-note">
            Bemutató oldal · A foglalások ebben a böngészőben tárolódnak. Valódi
            időpontkérés vagy e-mail-küldés nem történik.
          </p>
        </div>
      </footer>
    </div>
  );
}
export default function Home() {
  return (
    <Provider>
      <Welcome />
    </Provider>
  );
}
