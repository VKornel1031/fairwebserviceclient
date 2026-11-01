"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  CarFront,
  CalendarDays,
  Building2,
  Check,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { accountRequest, type Account as AccountRecord } from "@/lib/accounts";
import { usePortal } from "./provider";
import { Field } from "./fields";
import { Modal, PageHeading } from "./ui";
import { companyTaxHint, companyTaxPattern } from "@/lib/company";
import Vehicles from "./vehicles";
import AppointmentList from "./appointment-list";
export { Account } from "./account";
export { default as Vehicles } from "./vehicles";
export function Appointments({ embedded = false }: { embedded?: boolean }) {
  return <AppointmentList embedded={embedded} />;
}
export function Workshop() {
  return <AppointmentList mode="workshop" />;
}
export function Reception() {
  return <AppointmentList mode="reception" />;
}
export function Partners() {
  const { user, notify, garage, appointments, acceptAccount } = usePortal();
  const [companyBusy, setCompanyBusy] = useState(false),
    [companyError, setCompanyError] = useState("");
  const [settings, setSettings] = useState(false);
  const [tab, setTab] = useState("fleet");
  const company = {
    name: user?.companyName || "",
    tax: user?.companyTax || "",
    city: user?.companyCity || "",
  };
  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (companyBusy) return;
    const fields = new FormData(event.currentTarget);
    setCompanyBusy(true);
    setCompanyError("");
    try {
      const result = await accountRequest<{ user: AccountRecord }>(
        "/api/account",
        "PATCH",
        {
          companyName: String(fields.get("name") || "").trim(),
          companyTax: String(fields.get("tax") || "").trim(),
          companyCity: String(fields.get("city") || "").trim(),
        },
      );
      acceptAccount(result.user);
      setSettings(false);
      notify("Céges adatok mentve.");
    } catch (error) {
      setCompanyError(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni a céges adatokat.",
      );
    } finally {
      setCompanyBusy(false);
    }
  }
  if (user?.role !== "partner" && user?.role !== "admin")
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
              <Link className="button" href="/fiok?mode=register">
                Céges fiók igénylése <ArrowUpRight size={17} />
              </Link>
              <Link href="/fiok" className="text-link">
                Céges fiók létrehozása <ArrowRight size={16} />
              </Link>
            </div>
            <p className="small muted">
              Regisztrálj cégnévvel és adószámmal; a fiókod céges partnerként
              indul.
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
  const vehicleCount = garage.summary?.totalItems || 0;
  const upcomingCount = appointments.summary?.upcomingCount || 0;
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
            {garage.error
              ? "—"
              : garage.loading && !garage.summary
                ? "…"
                : vehicleCount.toString().padStart(2, "0")}
            <CarFront size={24} />
          </strong>
          <small>Mindig kéznél lévő járműadatok</small>
        </div>
        <div>
          <span>Közelgő időpont</span>
          <strong>
            {appointments.loading && !appointments.summary
              ? "…"
              : upcomingCount.toString().padStart(2, "0")}
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
        A mentett járművek ehhez a partnerfiókhoz tartoznak. Több munkatárs
        közös hozzáférése egy későbbi változatban lesz elérhető.
      </p>
      {settings && (
        <Modal
          title="Céges adatok"
          close={() => {
            if (!companyBusy) setSettings(false);
          }}
        >
          <form
            className="modal-form stack-form"
            onSubmit={(event) => void saveCompany(event)}
          >
            {companyError && (
              <p className="form-error" role="alert">
                {companyError}
              </p>
            )}
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
              required={user?.role === "partner"}
              pattern={user?.role === "partner" ? companyTaxPattern : undefined}
              hint={companyTaxHint}
              defaultValue={company.tax}
            />
            <Field
              name="city"
              label="Település"
              maxLength={100}
              defaultValue={company.city}
            />
            <button className="button" type="submit" disabled={companyBusy}>
              Adatok mentése <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
