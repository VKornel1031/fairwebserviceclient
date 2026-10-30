"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { site, locationLabel } from "@/content/site";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CarFront,
  ShieldCheck,
  MapPin,
  Download,
  UserRound,
  Info,
} from "lucide-react";
import { usePortal } from "./provider";
import { isWorkshopRole } from "@/lib/reports";
import { PageHeading, ServiceIcon } from "./ui";
import { Field } from "./fields";
import { calendarFile } from "@/lib/calendar";
import {
  services,
  times,
  today,
  addDays,
  nextBusinessDay,
  available,
  dateLabel,
  id,
  endTime,
  type Appointment,
  type Profile,
} from "@/lib/demo";
const blankContact: Profile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  reminders: true,
};
const blankCar = { plate: "", make: "", model: "", year: "" };
export default function Booking() {
  const { store, user, mutate } = usePortal();
  const [step, setStep] = useState(0);
  const [serviceId, setService] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState<Profile>(
    user
      ? {
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          reminders: user.reminders,
        }
      : blankContact,
  );
  const [car, setCar] = useState(blankCar);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [savedCar, setSavedCar] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ownCars = store.vehicles.filter((v) => v.owner === user?.id);
  const service = services.find((s) => s.id === serviceId);
  const duration = service?.duration || 60;
  const [month, setMonth] = useState(() => nextBusinessDay().slice(0, 7));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editing = params.get("edit");
    if (editing) {
      const a = store.appointments.find(
        (a) =>
          a.id === editing &&
          (a.owner === (user?.id || null) || isWorkshopRole(user?.role)),
      );
      if (a && !["cancelled", "completed", "progress"].includes(a.status)) {
        setEditId(a.id);
        setService(a.service);
        setCar(a.vehicle);
        setContact(a.contact);
        setNote(a.note);
        setStep(1);
      } else setError("Ez a foglalás nem módosítható ebben a fiókban.");
      return;
    }
    const sid = params.get("service");
    if (services.some((s) => s.id === sid)) setService(sid!);
    const d = params.get("date");
    const t = params.get("time");
    if (
      d &&
      /^\d{4}-\d{2}-\d{2}$/.test(d) &&
      d >= today() &&
      d <= addDays(today(), site.booking.horizonDays)
    ) {
      setDay(d);
      setMonth(d.slice(0, 7));
      if (t && times.includes(t)) setTime(t);
    }
    const defaultCar =
      ownCars.find((v) => v.id === params.get("vehicle")) ||
      ownCars.find((v) => v.isDefault) ||
      ownCars[0];
    if (defaultCar) {
      setCar(defaultCar);
      setSavedCar(defaultCar.id);
    }
    // The route mounts with an already hydrated store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function changeService(sid: string) {
    setService(sid);
    setTime("");
    setError("");
  }
  function next() {
    setError("");
    if (step === 0 && !service) {
      setError("Válassz egy szolgáltatást a folytatáshoz.");
      return;
    }
    if (
      step === 1 &&
      (!day ||
        !time ||
        !available(store, day, time, duration, editId || undefined))
    ) {
      setError("Válassz egy elérhető napot és időpontot.");
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function details(e: FormEvent) {
    e.preventDefault();
    next();
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!service || !day || !time || !consent) return;
    setBusy(true);
    setError("");
    let result: Appointment | undefined;
    const save = () => {
      const ok = mutate((s) => {
        if (!available(s, day, time, duration, editId || undefined))
          throw new Error(
            "Ez az időpont közben betelt. Kérjük, válassz másikat.",
          );
        const existing = editId
          ? s.appointments.find((a) => a.id === editId)
          : undefined;
        if (
          editId &&
          (!existing ||
            ["cancelled", "completed", "progress"].includes(existing.status))
        )
          throw new Error(
            "A foglalás állapota megváltozott, már nem módosítható.",
          );
        result = {
          id: editId || id(),
          owner: existing?.owner ?? user?.id ?? null,
          organization: existing?.organization ?? user?.role === "partner",
          service: serviceId,
          date: day,
          time,
          duration,
          contact: {
            ...contact,
            name: contact.name.trim(),
            email: contact.email.trim().toLowerCase(),
            city: contact.city.trim(),
          },
          vehicle: {
            plate: car.plate.trim().toUpperCase(),
            make: car.make.trim(),
            model: car.model.trim(),
            year: car.year,
          },
          note: note.trim(),
          status: "requested",
          created: existing?.created || new Date().toISOString(),
        };
        return {
          ...s,
          appointments: editId
            ? s.appointments.map((a) => (a.id === editId ? result! : a))
            : [...s.appointments, result],
        };
      });
      if (ok && result) setSuccess(result);
      else {
        setError(
          "Nem sikerült lefoglalni az időpontot. Ellenőrizd az elérhetőséget és a tárhelyet.",
        );
        setStep(1);
      }
    };
    try {
      if (navigator.locks)
        await navigator.locks.request("fairauto-booking", save);
      else save();
    } catch {
      setError("A foglalás nem menthető. Próbáld újra.");
    } finally {
      setBusy(false);
    }
  }
  const first = new Date(`${month}-01T12:00:00`);
  const padding = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();
  function shiftMonth(delta: number) {
    const d = new Date(first);
    d.setMonth(d.getMonth() + delta);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  if (success)
    return (
      <>
        <PageHeading
          eyebrow="IDŐPONTFOGLALÁS"
          title="Egy lépéssel közelebb a gondtalan úthoz."
          description="A demófoglalásodat elmentettük ebbe a böngészőbe."
        />
        <section className="success-card">
          <div className="success-symbol">
            <Check size={32} />
          </div>
          <span className="eyebrow">KÉRÉS RÖGZÍTVE</span>
          <h2>
            {editId
              ? "Az új időpontodat rögzítettük."
              : "Köszönjük a bizalmat!"}
          </h2>
          <p className="muted">
            A foglalás visszaigazolásra vár. A prototípus nem küld e-mailt és
            nem továbbít kérést a szerviznek.
          </p>
          <div className="confirmation-id">
            FOGLALÁSI AZONOSÍTÓ <strong>{success.id}</strong>
          </div>
          <div className="confirmation-details">
            <p>
              <CalendarDays size={19} />
              <span>
                {dateLabel(success.date)}
                <strong>
                  {success.time} – {endTime(success.time, success.duration)}
                </strong>
              </span>
            </p>
            <p>
              <CarFront size={19} />
              <span>
                {success.vehicle.make} {success.vehicle.model}
                <strong>{success.vehicle.plate}</strong>
              </span>
            </p>
            <p>
              <ShieldCheck size={19} />
              <span>
                {service?.name}
                <strong>Visszaigazolásra vár</strong>
              </span>
            </p>
          </div>
          <div className="button-row">
            <Link href="/foglalasaim" className="button">
              Foglalásaim megtekintése <ArrowRight size={17} />
            </Link>
            <button
              className="button button-outline"
              onClick={() => calendarFile(success)}
            >
              <Download size={16} /> Naptárba mentés
            </button>
          </div>
          {!user && (
            <p className="success-account">
              Legközelebb még egyszerűbb.{" "}
              <Link href="/fiok">
                Hozz létre saját fiókot <ArrowUpRight size={13} />
              </Link>
            </p>
          )}
        </section>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="EGYSZERŰEN, A SAJÁT TEMPÓDBAN"
        title={editId ? "Válassz új időpontot." : "Találjunk időt az autódra."}
        description="Néhány adat, egy jó időpont. A többit személyesen egyeztetjük."
      />
      <div className="booking-progress" aria-label="Foglalási lépések">
        {["Szolgáltatás", "Időpont", "Adataid", "Áttekintés"].map(
          (label, i) => (
            <button
              key={label}
              disabled={i > step}
              onClick={() => {
                setStep(i);
                setError("");
              }}
              className={`${i === step ? "current" : ""} ${i < step ? "done" : ""}`}
              aria-current={i === step ? "step" : undefined}
            >
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              {label}
            </button>
          ),
        )}
      </div>
      <div className="booking-layout">
        <section className="booking-panel">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {step === 0 && (
            <>
              <div className="panel-title">
                <span className="step-number">01 / 04</span>
                <h2>Miben segíthetünk?</h2>
                <p>Válaszd ki a számodra megfelelő szolgáltatást.</p>
              </div>
              <div className="service-options">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => changeService(s.id)}
                    className={`service-option ${serviceId === s.id ? "selected" : ""}`}
                    aria-pressed={serviceId === s.id}
                  >
                    <span className="option-icon">
                      <ServiceIcon name={s.icon} />
                    </span>
                    <span>
                      <strong>{s.name}</strong>
                      <small>{s.description}</small>
                      <em>kb. {s.duration} perc</em>
                    </span>
                    <span className="radio-mark">
                      {serviceId === s.id && <span />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="panel-actions">
                <span className="muted small">
                  Nem tudod pontosan? Válaszd az egyéb szervizigényt.
                </span>
                <button className="button" onClick={next}>
                  Tovább az időpontokhoz <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="panel-title">
                <span className="step-number">02 / 04</span>
                <h2>Mikor találkozzunk?</h2>
                <p>Válassz munkanapot, majd egy szabad érkezési időpontot.</p>
              </div>
              <div className="calendar">
                <div className="calendar-heading">
                  <h3>
                    {dateLabel(`${month}-01`, {
                      year: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <div>
                    <button
                      className="icon-button"
                      aria-label="Előző hónap"
                      disabled={month <= today().slice(0, 7)}
                      onClick={() => shiftMonth(-1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Következő hónap"
                      disabled={
                        month >=
                        addDays(today(), site.booking.horizonDays).slice(0, 7)
                      }
                      onClick={() => shiftMonth(1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="calendar-grid">
                  {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map((d) => (
                    <span key={d} className="weekday">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: padding }, (_, i) => (
                    <span key={`pad${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = `${month}-${String(i + 1).padStart(2, "0")}`;
                    const enabled =
                      d <= addDays(today(), site.booking.horizonDays) &&
                      times.some((t) =>
                        available(store, d, t, duration, editId || undefined),
                      );
                    return (
                      <button
                        key={d}
                        aria-label={dateLabel(d, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        aria-pressed={day === d}
                        disabled={!enabled}
                        className={`calendar-day ${day === d ? "selected" : ""} ${d === today() ? "is-today" : ""}`}
                        onClick={() => {
                          setDay(d);
                          setTime("");
                          setError("");
                        }}
                      >
                        {i + 1}
                        {enabled && <span />}
                      </button>
                    );
                  })}
                </div>
                <div className="calendar-legend">
                  <span>
                    <i /> Elérhető nap
                  </span>
                  <span>Hétvégén zárva tartunk</span>
                </div>
              </div>
              <div className="time-section">
                <div className="section-title">
                  <h3>
                    {day
                      ? dateLabel(day, { month: "long", day: "numeric" })
                      : "Válassz egy napot"}
                    <span className="muted"> · érkezési időpont</span>
                  </h3>
                  <span className="small muted">Budapesti idő</span>
                </div>
                {day ? (
                  <div className="time-grid">
                    {times.map((t) => (
                      <button
                        key={t}
                        disabled={
                          !available(
                            store,
                            day,
                            t,
                            duration,
                            editId || undefined,
                          )
                        }
                        aria-pressed={time === t}
                        className={time === t ? "selected" : ""}
                        onClick={() => {
                          setTime(t);
                          setError("");
                        }}
                      >
                        {t}
                        {time === t && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="hint-box">
                    A szabad időpontokat a nap kiválasztása után mutatjuk.
                  </p>
                )}
              </div>
              <div className="panel-actions">
                <button className="text-button" onClick={() => setStep(0)}>
                  <ArrowLeft size={16} /> Vissza
                </button>
                <button className="button" onClick={next}>
                  Tovább az adatokhoz <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <form onSubmit={details}>
              <div className="panel-title">
                <span className="step-number">03 / 04</span>
                <h2>Hogyan érhetünk el?</h2>
                <p>
                  {user
                    ? "Az elmentett adataidat előre kitöltöttük."
                    : "Fiók nélkül is foglalhatsz. Kérjük, a demóban mintaadatokat adj meg."}
                </p>
              </div>
              {!user && (
                <div className="login-hint">
                  <UserRound size={18} />
                  <span>Van már fiókod? Az adataid ott várnak.</span>
                  <Link href="/fiok">
                    Bejelentkezés <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
              <div className="form-grid">
                <Field
                  label="Teljes név"
                  required
                  autoComplete="name"
                  maxLength={100}
                  value={contact.name}
                  placeholder="pl. Kovács Péter"
                  onChange={(e) =>
                    setContact({ ...contact, name: e.target.value })
                  }
                  pattern=".*\S.*"
                />
                <Field
                  label="Mobiltelefonszám"
                  required
                  type="tel"
                  autoComplete="tel"
                  maxLength={25}
                  minLength={7}
                  pattern="[+0-9 \(\)\-]{7,25}"
                  title="Legalább 7 karakter: számok, +, szóköz, zárójel vagy kötőjel."
                  value={contact.phone}
                  placeholder="+36 30 123 4567"
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                />
                <Field
                  label="E-mail-cím"
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  value={contact.email}
                  placeholder="peter@example.com"
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                />
                <Field
                  label="Település"
                  required
                  autoComplete="address-level2"
                  maxLength={100}
                  pattern=".*\S.*"
                  value={contact.city}
                  placeholder="pl. Székesfehérvár"
                  onChange={(e) =>
                    setContact({ ...contact, city: e.target.value })
                  }
                />
              </div>
              <div className="form-section-title">
                <CarFront size={19} />
                <h3>Az autód adatai</h3>
              </div>
              {ownCars.length > 0 && (
                <label className="field saved-select">
                  <span>
                    {user?.role === "partner"
                      ? "Jármű a céges flottából"
                      : "Mentett jármű kiválasztása"}
                  </span>
                  <select
                    value={savedCar}
                    onChange={(e) => {
                      setSavedCar(e.target.value);
                      setCar(
                        ownCars.find((v) => v.id === e.target.value) ||
                          blankCar,
                      );
                    }}
                  >
                    <option value="">Másik jármű adatait adom meg</option>
                    {ownCars.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} · {v.plate}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="form-grid">
                <Field
                  label="Rendszám"
                  required
                  maxLength={15}
                  minLength={3}
                  pattern=".*\S.*"
                  value={car.plate}
                  className="plate-input"
                  placeholder="ABC-123"
                  onChange={(e) =>
                    setCar({ ...car, plate: e.target.value.toUpperCase() })
                  }
                />
                <Field
                  label="Gyártási év"
                  required
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  value={car.year}
                  placeholder="2018"
                  onChange={(e) => setCar({ ...car, year: e.target.value })}
                />
                <Field
                  label="Márka"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={car.make}
                  placeholder="Volkswagen"
                  onChange={(e) => setCar({ ...car, make: e.target.value })}
                />
                <Field
                  label="Modell"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={car.model}
                  placeholder="Golf VII"
                  onChange={(e) => setCar({ ...car, model: e.target.value })}
                />
                <label className="field field-wide">
                  <span>
                    Megjegyzés <small> · nem kötelező</small>
                  </span>
                  <textarea
                    maxLength={1500}
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      user?.role === "partner"
                        ? "Hiba leírása, céges hivatkozás vagy megrendelésszám…"
                        : "Mit tapasztalsz? Van valami, amiről jó, ha előre tudunk?"
                    }
                  />
                </label>
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={16} /> Vissza
                </button>
                <button className="button" type="submit">
                  Foglalás áttekintése <ArrowRight size={17} />
                </button>
              </div>
            </form>
          )}
          {step === 3 && (
            <form onSubmit={submit}>
              <div className="panel-title">
                <span className="step-number">04 / 04</span>
                <h2>Minden a helyén?</h2>
                <p>Ellenőrizd az adatokat, és küldd el a demó időpontkérést.</p>
              </div>
              <div className="review-group">
                <div className="section-title">
                  <h3>Szolgáltatás és időpont</h3>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Módosítás
                  </button>
                </div>
                <p>{service?.name}</p>
                <strong>
                  {dateLabel(day)} · {time}
                </strong>
                <p className="muted">Becsült időtartam: {duration} perc</p>
              </div>
              <div className="review-group">
                <div className="section-title">
                  <h3>Kapcsolattartó és jármű</h3>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Módosítás
                  </button>
                </div>
                <p>
                  {contact.name} · {contact.city}
                </p>
                <p>
                  {contact.phone} · {contact.email}
                </p>
                <strong>
                  {car.make} {car.model} ({car.year}) · {car.plate}
                </strong>
                {note && <p className="review-note">{note}</p>}
              </div>
              <div className="info-box">
                <Info size={18} />
                <p>
                  Az időpont a műhely jóváhagyása után válik véglegessé. Ez a
                  demó nem küld valódi foglalást vagy e-mailt.
                </p>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Megértettem, hogy ez egy helyi prototípus, és az adataim ebben
                  a böngészőben tárolódnak. Mintaadatokat használok.
                </span>
              </label>
              <p className="form-legal-note">
                Kapcsolódó dokumentumok:{" "}
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
              <div className="panel-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft size={16} /> Vissza
                </button>
                <button className="button" type="submit" disabled={busy}>
                  {busy
                    ? "Mentés…"
                    : editId
                      ? "Új időpont kérése"
                      : "Időpontkérés elküldése"}{" "}
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="booking-aside">
          <div className="booking-summary">
            <span className="eyebrow">A FOGLALÁSOD</span>
            <h3>Egy jó döntés az autódnak.</h3>
            <div className="summary-item">
              <ServiceIcon name={service?.icon || "wrench"} size={20} />
              <div>
                <small>Szolgáltatás</small>
                <strong>{service?.name || "Még nem választottál"}</strong>
                {service && <span>kb. {duration} perc</span>}
              </div>
            </div>
            <div className="summary-item">
              <CalendarDays size={20} />
              <div>
                <small>Időpont</small>
                <strong>
                  {day
                    ? dateLabel(day, { month: "long", day: "numeric" })
                    : "Válassz egy szabad napot"}
                </strong>
                {time && (
                  <span>
                    {time} – {endTime(time, duration)}
                  </span>
                )}
              </div>
            </div>
            {car.plate && (
              <div className="summary-item">
                <CarFront size={20} />
                <div>
                  <small>Jármű</small>
                  <strong>
                    {car.make} {car.model}
                  </strong>
                  <span>{car.plate}</span>
                </div>
              </div>
            )}
            <div className="summary-location">
              <MapPin size={16} />
              <span>
                {site.name}
                <small>{locationLabel}</small>
              </span>
            </div>
          </div>
          <div className="booking-note">
            <ShieldCheck size={22} />
            <h4>Korrekt egyeztetés, tiszta helyzet.</h4>
            <p>
              A pontos teendőket és az árat a műhely egyezteti veled. A foglalás
              nem jelent fizetési kötelezettséget.
            </p>
          </div>
          <p className="demo-footnote">
            DEMÓ · Nincs szükség API-kulcsra.
            <br />A mentések csak ebben a böngészőben érhetők el.
          </p>
        </aside>
      </div>
    </>
  );
}
