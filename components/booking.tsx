"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { accountRequest, AccountRequestError } from "@/lib/accounts";
import {
  prepareBooking,
  type BookingContext,
  type Availability,
  type LiveAppointment,
  type AppointmentDetail,
} from "@/lib/live-appointments";
import SavedVehiclePicker from "./saved-vehicle-picker";
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
import { canCoordinateAppointments } from "@/lib/permissions";
import { PageHeading, ServiceIcon } from "./ui";
import { Field } from "./fields";
import { calendarFile } from "@/lib/calendar";
import {
  today,
  addDays,
  nextBusinessDay,
  dateLabel,
  endTime,
  statusNames,
  type Profile,
} from "@/lib/demo";
const blankContact: Profile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  reminders: true,
};
const blankCar = { plate: "", make: "", model: "", year: "", vin: "" };
export default function Booking() {
  const {
    user,
    garage,
    appointmentsChanged,
    refreshAppointments,
    refreshSession,
  } = usePortal();
  const coordinator = canCoordinateAppointments(user?.role);
  const [onBehalf, setOnBehalf] = useState(false);
  const [context, setContext] = useState<BookingContext | null>(null),
    [contextError, setContextError] = useState(""),
    [contextRevision, setContextRevision] = useState(0);
  const [availability, setAvailability] = useState<Availability | null>(null),
    [availabilityRevision, setAvailabilityRevision] = useState(0);
  const [step, setStep] = useState(0),
    [serviceId, setService] = useState(""),
    [day, setDay] = useState(""),
    [time, setTime] = useState("");
  const [contact, setContact] = useState<Profile>(
    user && !onBehalf
      ? {
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          reminders: false,
        }
      : blankContact,
  );
  const [car, setCar] = useState(blankCar),
    [savedCar, setSavedCar] = useState("");
  const [note, setNote] = useState(""),
    [consent, setConsent] = useState(false),
    [editId, setEditId] = useState<string | null>(null),
    [editRevision, setEditRevision] = useState(0);
  const [organization, setOrganization] = useState(user?.role === "partner"),
    [companyName, setCompanyName] = useState(user?.companyName || "");
  const [success, setSuccess] = useState<LiveAppointment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [month, setMonth] = useState(() => nextBusinessDay().slice(0, 7));
  const vehicleTouched = useRef(false),
    requestId = useRef("");
  const services = context?.config.services || [],
    times = availability?.times || [];
  const service = services.find((item) => item.id === serviceId),
    duration = service?.duration || 60;
  useEffect(() => {
    const controller = new AbortController();
    setContext(null);
    setContextError("");
    prepareBooking(controller.signal)
      .then(async (result) => {
        if (controller.signal.aborted) return;
        if (result.viewer !== (user?.id || "guest")) {
          void refreshSession();
          throw new Error(
            "A bejelentkezett fiók megváltozott. Frissítsd az oldalt.",
          );
        }
        const params = new URLSearchParams(window.location.search),
          editing = params.get("edit");
        if (editing) {
          const details = await accountRequest<AppointmentDetail>(
            "/api/appointments/" + encodeURIComponent(editing),
            "GET",
            undefined,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          const a = details.appointment;
          setOnBehalf(coordinator && a.owner !== user?.id);
          if (!["requested", "confirmed"].includes(a.status))
            throw new Error("Ez az időpontkérés már nem módosítható.");
          vehicleTouched.current = true;
          setEditId(a.id);
          setEditRevision(a.revision);
          setService(a.service);
          setCar(a.vehicle);
          setSavedCar("manual");
          setContact(a.contact);
          setNote(a.note);
          setOrganization(a.organization);
          setCompanyName(a.companyName);
          setStep(1);
          setMonth(a.date.slice(0, 7));
        } else {
          const forCustomer = coordinator && params.get("for") === "customer";
          setOnBehalf(forCustomer);
          setContact(
            forCustomer
              ? blankContact
              : result.prefill?.contact || blankContact,
          );
          setCompanyName(forCustomer ? "" : result.prefill?.companyName || "");
          if (forCustomer) {
            setCar(blankCar);
            setSavedCar("");
          }
          const sid = params.get("service");
          if (result.config.services.some((item) => item.id === sid))
            setService(sid!);
          const date = params.get("date"),
            time = params.get("time");
          if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            setDay(date);
            setMonth(date.slice(0, 7));
            if (time) setTime(time);
          }
        }
        setContext(result);
        void refreshAppointments();
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setContextError(
            e instanceof Error ? e.message : "A foglalás most nem indítható.",
          );
      });
    return () => controller.abort();
  }, [contextRevision, user?.id]);
  useEffect(() => {
    if (
      !user ||
      onBehalf ||
      vehicleTouched.current ||
      new URLSearchParams(window.location.search).has("edit")
    )
      return;
    const preferred = garage.summary?.defaultVehicle;
    if (preferred && garage.summary?.totalItems === 1) {
      setCar(preferred);
      setSavedCar(preferred.id);
    }
  }, [garage.summary, user?.id, onBehalf]);
  useEffect(() => {
    if (!context || !serviceId) return;
    const controller = new AbortController();
    setAvailability(null);
    const params = new URLSearchParams({ service: serviceId });
    if (editId) params.set("exclude", editId);
    accountRequest<Availability>(
      "/api/appointments/availability?" + params,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setAvailability(result);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Az időpontok nem tölthetők be.",
          );
      });
    return () => controller.abort();
  }, [context, serviceId, editId, availabilityRevision]);
  function changeService(value: string) {
    setAvailability(null);
    setService(value);
    setTime("");
    setError("");
  }
  function changeCar(next: typeof blankCar) {
    vehicleTouched.current = true;
    setSavedCar("manual");
    setCar(next);
  }
  function next() {
    setError("");
    if (step === 0 && !service) {
      setError("Válassz egy szolgáltatást a folytatáshoz.");
      return;
    }
    if (step === 1 && !availability?.days[day]?.includes(time)) {
      setError("Válassz egy elérhető napot és időpontot.");
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function details(event: FormEvent) {
    event.preventDefault();
    next();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !context || !service || !day || !time || !consent) return;
    setBusy(true);
    setError("");
    if (!requestId.current) requestId.current = crypto.randomUUID();
    const payload = {
      bookingFor: onBehalf ? "customer" : "self",
      service: serviceId,
      date: day,
      time,
      contact,
      vehicle: {
        plate: car.plate,
        make: car.make,
        model: car.model,
        year: car.year,
        vin: car.vin,
      },
      vehicleId: savedCar && savedCar !== "manual" ? savedCar : undefined,
      note,
      acceptTerms: true,
      termsVersion: context.config.termsVersion,
      viewerId: context.viewer,
      organization,
      companyName,
      ...(editId
        ? { revision: editRevision }
        : { requestId: requestId.current }),
    };
    try {
      const result = await accountRequest<{ appointment: LiveAppointment }>(
        editId ? `/api/appointments/${editId}` : "/api/appointments",
        editId ? "PATCH" : "POST",
        payload,
      );
      setSuccess(result.appointment);
      appointmentsChanged();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "A kérés nem menthető. Próbáld újra.",
      );
      if (
        e instanceof AccountRequestError &&
        ["slot_taken", "slot_unavailable"].includes(e.code || "")
      ) {
        setStep(1);
        setTime("");
        setAvailabilityRevision((value) => value + 1);
      }
      if (
        e instanceof AccountRequestError &&
        ["vehicle_changed", "vehicle_missing"].includes(e.code || "")
      ) {
        setStep(2);
        setSavedCar("");
        setConsent(false);
      }
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
  if (!context || contextError)
    return (
      <>
        <PageHeading
          eyebrow="IDŐPONTFOGLALÁS"
          title="Találjunk időt az autódra."
          description="Időpontkérés telefonos visszaigazolással."
        />
        <section className="panel">
          {contextError ? (
            <>
              <p className="form-error" role="alert">
                {contextError}
              </p>
              <button
                className="button button-outline"
                onClick={() => setContextRevision((value) => value + 1)}
              >
                Újrapróbálás
              </button>
            </>
          ) : (
            <p role="status">A foglalási lehetőségek betöltése…</p>
          )}
        </section>
      </>
    );
  if (success)
    return (
      <>
        <PageHeading
          eyebrow="IDŐPONTFOGLALÁS"
          title="Egy lépéssel közelebb a gondtalan úthoz."
          description="Az időpontkérésedet elmentettük a szerviz rendszerében."
        />
        <section className="success-card">
          <div className="success-symbol">
            <Check size={32} />
          </div>
          <span className="eyebrow">KÉRÉS RÖGZÍTVE</span>
          <h2>
            {onBehalf
              ? "Az ügyfél időpontkérését rögzítettük."
              : editId
                ? "Az új időpontodat rögzítettük."
                : "Köszönjük a bizalmat!"}
          </h2>
          <p className="muted">
            {success.status === "requested"
              ? "Az időpontkérés telefonos egyeztetésre vár. A szerviz a megadott mobiltelefonszámon egyeztet veled. A kiválasztott időpontot a telefonos visszaigazolás biztosítja."
              : `A mentett időpontkérés aktuális állapota: ${statusNames[success.status]}. A részleteket az időpontkezelésben találod.`}
          </p>
          <div className="confirmation-id">
            FOGLALÁSI AZONOSÍTÓ <strong>{success.reference}</strong>
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
                {success.serviceName}
                <strong>{statusNames[success.status]}</strong>
              </span>
            </p>
          </div>
          <div className="button-row">
            <Link
              href={
                onBehalf
                  ? `${user?.role === "reception" ? "/munkafelvetel" : "/muhely"}?appointment=${encodeURIComponent(success.id)}`
                  : "/foglalasaim"
              }
              className="button"
            >
              {onBehalf
                ? "Időpontkezelés megnyitása"
                : "Foglalásaim megtekintése"}{" "}
              <ArrowRight size={17} />
            </Link>
            <button
              className="button button-outline"
              onClick={() => calendarFile(success)}
            >
              <Download size={16} /> Naptárba mentés
            </button>
            <button
              className="text-button"
              onClick={() => {
                requestId.current = "";
                setSuccess(null);
                setEditId(null);
                setEditRevision(0);
                setStep(0);
                setDay("");
                setTime("");
                setService("");
                setConsent(false);
                setNote("");
                setError("");
                setContact(
                  onBehalf
                    ? blankContact
                    : context.prefill?.contact || blankContact,
                );
                setOrganization(!onBehalf && user?.role === "partner");
                setCompanyName(
                  onBehalf ? "" : context.prefill?.companyName || "",
                );
                const onlyCar =
                  user && !onBehalf && garage.summary?.totalItems === 1
                    ? garage.summary.defaultVehicle
                    : null;
                vehicleTouched.current = false;
                setCar(onlyCar || blankCar);
                setSavedCar(onlyCar?.id || "");
                window.history.replaceState(
                  null,
                  "",
                  onBehalf ? "/idopont?for=customer" : "/idopont",
                );
              }}
            >
              Másik időpontot kérek
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
        title={
          editId
            ? "Válassz új időpontot."
            : onBehalf
              ? "Időpont felvétele ügyfélnek."
              : "Találjunk időt az autódra."
        }
        description={
          onBehalf
            ? "Add meg az ügyfél és a jármű adatait. A munka tartalmát és a végleges árat külön egyeztetitek."
            : "Néhány adat, egy jó időpont. A többit személyesen egyeztetjük."
        }
      />
      {coordinator && !editId && (
        <label className="checkbox-label booking-for-customer">
          <input
            type="checkbox"
            checked={onBehalf}
            disabled={busy}
            onChange={(event) => {
              const forCustomer = event.target.checked;
              setOnBehalf(forCustomer);
              setContact(
                forCustomer
                  ? blankContact
                  : context.prefill?.contact || blankContact,
              );
              setCompanyName(
                forCustomer ? "" : context.prefill?.companyName || "",
              );
              setOrganization(false);
              vehicleTouched.current = false;
              const onlyCar =
                !forCustomer && garage.summary?.totalItems === 1
                  ? garage.summary.defaultVehicle
                  : null;
              setCar(onlyCar || blankCar);
              setSavedCar(onlyCar?.id || "");
              setConsent(false);
              setStep(0);
              const params = new URLSearchParams(window.location.search);
              if (forCustomer) params.set("for", "customer");
              else params.delete("for");
              window.history.replaceState(
                null,
                "",
                "/idopont" + (params.size ? "?" + params : ""),
              );
            }}
          />
          <span>Ügyfélnek foglalok</span>
        </label>
      )}
      <div className="booking-progress" aria-label="Foglalási lépések">
        {[
          "Szolgáltatás",
          "Időpont",
          onBehalf ? "Ügyfél adatai" : "Adataid",
          "Áttekintés",
        ].map((label, i) => (
          <button
            key={label}
            disabled={busy || i > step}
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
        ))}
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
                      <em>
                        kb. {s.duration} perc
                        {s.priceLabel && ` · ${s.priceLabel}`}
                      </em>
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
              {!availability && (
                <p className="hint-box" role="status">
                  A szabad időpontok betöltése…
                </p>
              )}
              {!availability && error && (
                <button
                  className="button button-outline"
                  onClick={() => setAvailabilityRevision((value) => value + 1)}
                >
                  Időpontok frissítése
                </button>
              )}
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
                    const enabled = !!availability?.days[d]?.length;
                    return (
                      <button
                        key={d}
                        data-date={d}
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
                        disabled={!availability?.days[day]?.includes(t)}
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
            <form
              onSubmit={details}
              autoComplete={user && !onBehalf ? "on" : "off"}
            >
              <div className="panel-title">
                <span className="step-number">03 / 04</span>
                <h2>Hogyan érhetünk el?</h2>
                <p>
                  {onBehalf
                    ? "Add meg az ügyfél kapcsolattartási adatait."
                    : user
                      ? "Az elmentett adataidat előre kitöltöttük."
                      : "Fiók nélkül is kérhetsz időpontot. Add meg az egyeztetéshez használható elérhetőségeidet."}
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
                  autoComplete={user && !onBehalf ? "name" : "off"}
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
                  autoComplete={user && !onBehalf ? "tel" : "off"}
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
                  autoComplete={user && !onBehalf ? "email" : "off"}
                  maxLength={254}
                  value={contact.email}
                  placeholder="peter@example.com"
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                />
                <Field
                  label="Település"
                  required
                  autoComplete={user && !onBehalf ? "address-level2" : "off"}
                  maxLength={100}
                  pattern=".*\S.*"
                  value={contact.city}
                  placeholder="pl. Székesfehérvár"
                  onChange={(e) =>
                    setContact({ ...contact, city: e.target.value })
                  }
                />
              </div>
              {onBehalf && (
                <>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={organization}
                      onChange={(event) =>
                        setOrganization(event.target.checked)
                      }
                    />
                    <span>Céges időpontkérés</span>
                  </label>
                  {organization && (
                    <Field
                      label="Cégnév"
                      required
                      maxLength={120}
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                    />
                  )}
                </>
              )}
              <div className="form-section-title">
                <CarFront size={19} />
                <h3>Az autód adatai</h3>
              </div>
              {user && !onBehalf && (
                <SavedVehiclePicker
                  selected={savedCar}
                  onChange={(vehicle) => {
                    vehicleTouched.current = true;
                    setSavedCar(vehicle?.id || "manual");
                    setCar(vehicle || blankCar);
                  }}
                />
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
                    changeCar({ ...car, plate: e.target.value.toUpperCase() })
                  }
                />
                <Field
                  label="Gyártási év"
                  required
                  type="number"
                  min={1886}
                  max={new Date().getFullYear() + 1}
                  value={car.year}
                  placeholder="2018"
                  onChange={(e) => changeCar({ ...car, year: e.target.value })}
                />
                <Field
                  label="Márka"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={car.make}
                  placeholder="Volkswagen"
                  onChange={(e) => changeCar({ ...car, make: e.target.value })}
                />
                <Field
                  label="Modell"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={car.model}
                  placeholder="Golf VII"
                  onChange={(e) => changeCar({ ...car, model: e.target.value })}
                />
                <Field
                  label="Alvázszám (VIN)"
                  required
                  wide
                  minLength={17}
                  maxLength={17}
                  pattern="[A-HJ-NPR-Z0-9]{17}"
                  autoComplete="off"
                  hint="17 karakter, I, O és Q nélkül. Az alvázszám a forgalmi engedély E mezőjében található."
                  value={car.vin}
                  onChange={(event) =>
                    changeCar({
                      ...car,
                      vin: event.target.value.toUpperCase().replace(/\s/g, ""),
                    })
                  }
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
                <p>Ellenőrizd az adatokat, és küldd el az időpontkérést.</p>
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
                  {context.config.schedule.requestNotice} A kért időpont
                  telefonos visszaigazolásig nem jelent biztosított
                  műhelykapacitást.
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
                  Elfogadom az ÁSZF-et, megismertem az Adatkezelési
                  Tájékoztatót, és tudomásul veszem, hogy az időpont telefonos
                  visszaigazolásra vár. A javításról és a végleges árról külön
                  állapodunk meg.
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
            Az időpontot a telefonos visszaigazolás biztosítja. Vendégként az
            itt leadott kéréseidet ebben a böngészőben tudod kezelni. A
            böngészőadatok törlése után telefonon keresd a szervizt.
          </p>
        </aside>
      </div>
    </>
  );
}
