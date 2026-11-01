"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { accountRequest } from "@/lib/accounts";
import {
  addDays,
  dateLabel,
  endTime,
  statusNames,
  today,
  type Status,
} from "@/lib/demo";
import {
  canCoordinateAppointments,
  canManageWorkshop,
} from "@/lib/permissions";
import type {
  AppointmentDetail,
  AppointmentPage,
  LiveAppointment,
} from "@/lib/live-appointments";
import { calendarFile } from "@/lib/calendar";
import { downloadAppointments } from "@/lib/reports";
import { usePortal } from "./provider";
import { Empty, Field } from "./fields";
import { Modal, PageHeading } from "./ui";
import ConfirmationNote from "./confirmation-note";
import AppointmentPrice from "./appointment-price";

export default function AppointmentList({
  mode = "own",
  embedded = false,
  from = "",
  to = "",
}: {
  mode?: "own" | "reception" | "workshop" | "report";
  embedded?: boolean;
  from?: string;
  to?: string;
}) {
  const { user } = usePortal();
  const internal = mode !== "own",
    operational = mode !== "reception" && canManageWorkshop(user?.role);
  const permitted =
    !internal ||
    (mode === "reception"
      ? canCoordinateAppointments(user?.role)
      : canManageWorkshop(user?.role));
  const [filter, setFilter] = useState(internal ? "day" : "upcoming"),
    [day, setDay] = useState(today),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [selected, setSelected] = useState(""),
    [closures, setClosures] = useState(false);
  const [listing, setListing] = useState({
    key: "",
    data: null as AppointmentPage | null,
    error: "",
    loading: true,
  });
  const key = [
    user?.id || "guest",
    user?.role || "guest",
    mode,
    filter,
    day,
    search,
    status,
    page,
    revision,
    from,
    to,
  ].join(":");
  const data = listing.key === key ? listing.data : null,
    error = listing.key === key ? listing.error : "",
    loading = listing.key !== key || listing.loading;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search),
      date = params.get("date");
    if (internal) {
      if (params.get("filter") === "requests") setFilter("requests");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setDay(date);
    }
    const identifier = params.get("appointment");
    if (identifier && /^[a-z0-9]{15}$/.test(identifier))
      setSelected(identifier);
  }, [internal, user?.id]);
  useEffect(() => {
    if (!permitted) return;
    const controller = new AbortController();
    setListing({ key, data: null, error: "", loading: true });
    const params = new URLSearchParams({
      scope: internal ? "staff" : "own",
      page: String(page),
      q: search,
      filter: internal ? "all" : filter,
    });
    if (internal && mode !== "report" && filter === "day")
      params.set("date", day);
    if (internal && filter === "requests") params.set("status", "requested");
    else if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    accountRequest<AppointmentPage>(
      "/api/appointments?" + params,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        if (page > 1 && page > Math.max(1, result.totalPages)) {
          setPage(Math.max(1, result.totalPages));
          return;
        }
        setListing({ key, data: result, error: "", loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setListing({
            key,
            data: null,
            error:
              e instanceof Error ? e.message : "A foglalások nem tölthetők be.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [key, permitted]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("fairauto-appointments", refresh);
    return () => window.removeEventListener("fairauto-appointments", refresh);
  }, []);
  if (!permitted)
    return (
      <>
        <PageHeading
          eyebrow={mode === "reception" ? "MUNKAFELVÉTEL" : "MŰHELY"}
          title="A szerviz napja, átláthatóan."
          description="Időpontkérések és napi egyeztetések."
        />
        <Empty
          icon={<ClipboardList size={32} />}
          title={
            mode === "reception"
              ? "Itt kezdődik az ügyfélfogadás."
              : "Ez a vezetői műhelynézet."
          }
          description="Ehhez a munkatérhez munkafelvevői vagy vezetői jogosultság szükséges."
        >
          <Link className="button" href="/fiok">
            Bejelentkezés <ArrowRight size={16} />
          </Link>
        </Empty>
      </>
    );
  return (
    <>
      {!embedded && (
        <PageHeading
          eyebrow={
            internal
              ? mode === "reception"
                ? "MUNKAFELVEVŐI MUNKATÉR"
                : "MŰHELY ÉS NAPTÁR"
              : "FOGLALÁSAIM"
          }
          title={
            internal
              ? mode === "reception"
                ? "Munkafelvétel, egyszerűen."
                : "Jó munkát, jó napot!"
              : "A következő találkozásunk."
          }
          description={
            internal
              ? "Beérkező kérések, telefonos visszaigazolás és napi időpontkezelés."
              : user
                ? "A fiókodhoz tartozó időpontkérések és visszaigazolások."
                : "Az ebben a böngészőben leadott vendégkéréseid. A böngészőadatok törlése után telefonon keresd a szervizt."
          }
          action={
            <Link href="/idopont" className="button">
              <Plus size={16} />
              {internal ? "Új időpont felvétele" : "Új időpontfoglalás"}
            </Link>
          }
        />
      )}
      <div className="list-toolbar">
        <div className="tabs">
          {(internal && mode !== "report"
            ? [
                ["requests", "Egyeztetésre vár"],
                ["day", "Kiválasztott nap"],
                ["all", "Összes"],
              ]
            : internal
              ? []
              : [
                  ["upcoming", "Közelgő"],
                  ["past", "Korábbi"],
                  ["all", "Összes"],
                ]
          ).map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {internal && operational && mode !== "report" && (
          <button
            className="button button-outline"
            onClick={() => setClosures(true)}
          >
            <SlidersHorizontal size={16} /> Zárvatartás kezelése
          </button>
        )}
      </div>
      {internal && mode !== "report" && filter === "day" && (
        <div className="appointment-day">
          <button
            className="icon-button"
            aria-label="Előző nap"
            onClick={() => {
              setDay(addDays(day, -1));
              setPage(1);
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <Field
            label="Kiválasztott nap"
            type="date"
            value={day}
            onChange={(event) => {
              setDay(event.target.value);
              setPage(1);
            }}
          />
          <button
            className="icon-button"
            aria-label="Következő nap"
            onClick={() => {
              setDay(addDays(day, 1));
              setPage(1);
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <form
        className="vehicle-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(query.trim());
          setPage(1);
        }}
      >
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Foglalások keresése"
            maxLength={100}
            value={query}
            placeholder={
              internal
                ? "Név, rendszám vagy azonosító"
                : "Rendszám vagy azonosító"
            }
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button className="button button-outline" type="submit">
          Keresés
        </button>
        {search && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setQuery("");
              setSearch("");
              setPage(1);
            }}
          >
            Szűrés törlése
          </button>
        )}
        {internal && filter !== "requests" && (
          <label className="field appointment-status-filter">
            <span>Állapot</span>
            <select
              aria-label="Foglalások állapota"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Minden állapot</option>
              {Object.entries(statusNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>
      {loading ? (
        <p role="status" className="muted">
          Időpontkérések betöltése…
        </p>
      ) : error ? (
        <div className="info-box" role="alert">
          <p>{error}</p>
          <button
            className="button button-outline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Újrapróbálás
          </button>
        </div>
      ) : !data?.items.length ? (
        <Empty
          icon={<CalendarDays size={30} />}
          title={
            internal
              ? "Ebben a nézetben nincs időpontkérés."
              : "Itt lesz a következő találkozásunk."
          }
          description="Az elküldött kérések és visszaigazolások ebben a listában jelennek meg."
        />
      ) : (
        <>
          <div className="section-title">
            <p className="small muted">{data.totalItems} találat</p>
            {mode === "report" && (
              <button
                className="button button-outline"
                onClick={() =>
                  downloadAppointments(data.items, "fairauto-idopontok.csv")
                }
              >
                <Download size={15} /> Aktuális oldal letöltése
              </button>
            )}
          </div>
          {internal ? (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Időpont</th>
                    <th>Ügyfél / jármű</th>
                    <th>Szolgáltatás</th>
                    <th>Állapot</th>
                    <th>
                      <span className="sr-only">Megnyitás</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.time}</strong>
                        <span>
                          {dateLabel(a.date, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <strong>{a.contact.name}</strong>
                        <span>
                          {a.vehicle.plate} · {a.vehicle.make} {a.vehicle.model}
                        </span>
                      </td>
                      <td>
                        {a.serviceName}
                        <span>{a.reference}</span>
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
                          aria-label={`${a.reference} kezelése`}
                          onClick={() => setSelected(a.id)}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="appointment-list">
              {data.items.map((a) => (
                <article className="appointment-card" key={a.id}>
                  <div className="appointment-date">
                    <span>{dateLabel(a.date, { month: "short" })}</span>
                    <strong>{Number(a.date.slice(-2))}</strong>
                    <small>{a.time}</small>
                  </div>
                  <div className="appointment-info">
                    <h3>{a.serviceName}</h3>
                    <p>
                      {a.vehicle.make} {a.vehicle.model} · {a.vehicle.plate}
                    </p>
                    <small className="muted">{a.reference}</small>
                  </div>
                  <span className={`status status-${a.status}`}>
                    <span />
                    {statusNames[a.status]}
                  </span>
                  <button
                    className="button button-outline"
                    onClick={() => setSelected(a.id)}
                  >
                    Részletek
                  </button>
                </article>
              ))}
            </div>
          )}
          {data.totalPages > 1 && (
            <nav
              className="vehicle-pagination"
              aria-label="Foglalások lapozása"
            >
              <button
                className="button button-outline"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft size={16} /> Előző
              </button>
              <span>
                {page} / {data.totalPages}
              </span>
              <button
                className="button button-outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Következő <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}
      {selected && (
        <AppointmentModal
          key={
            (user?.id || "guest") +
            ":" +
            (user?.role || "guest") +
            ":" +
            selected
          }
          identifier={selected}
          internal={internal}
          operational={operational}
          close={() => setSelected("")}
        />
      )}
      {closures && <Closures close={() => setClosures(false)} day={day} />}
    </>
  );
}

function AppointmentModal({
  identifier,
  internal,
  operational,
  close,
}: {
  identifier: string;
  internal: boolean;
  operational: boolean;
  close: () => void;
}) {
  const { appointmentsChanged, notify } = usePortal();
  const epoch = useRef(0);
  const [detail, setDetail] = useState<AppointmentDetail | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [cancelling, setCancelling] = useState(false);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const revision = ++epoch.current;
      try {
        const result = await accountRequest<AppointmentDetail>(
          "/api/appointments/" + identifier,
          "GET",
          undefined,
          signal,
        );
        if (!signal?.aborted && revision === epoch.current) setDetail(result);
      } catch (e) {
        if (!signal?.aborted && revision === epoch.current)
          setError(
            e instanceof Error ? e.message : "Az időpont nem tölthető be.",
          );
      }
    },
    [identifier],
  );
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  const a = detail?.appointment;
  async function change(next: Status) {
    if (!a || busy) return;
    ++epoch.current;
    setBusy(true);
    setError("");
    try {
      const result = await accountRequest<{ appointment: LiveAppointment }>(
        `/api/appointments/${a.id}/status`,
        "POST",
        { status: next, revision: a.revision },
      );
      setDetail((old) =>
        old ? { ...old, appointment: result.appointment } : old,
      );
      setCancelling(false);
      appointmentsChanged();
      notify(
        next === "cancelled"
          ? "Az időpontot lemondtuk."
          : "A foglalás állapotát frissítettük.",
      );
      void refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Nem sikerült módosítani az állapotot.",
      );
      void refresh();
    } finally {
      setBusy(false);
    }
  }
  const editable =
    a &&
    ["requested", "confirmed"].includes(a.status) &&
    (internal ||
      a.date > today() ||
      (a.date === today() &&
        a.time >
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Budapest",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date())));
  return (
    <Modal
      title={internal ? "Foglalás kezelése" : "Időpontkérés részletei"}
      close={() => {
        if (!busy) close();
      }}
    >
      <div className="modal-form">
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {!a ? (
          <>
            <p className="muted">Részletek betöltése…</p>
            {error && (
              <button
                className="button button-outline"
                onClick={() => void refresh()}
              >
                Újrapróbálás
              </button>
            )}
          </>
        ) : (
          <>
            <div className="booking-detail-top">
              <span className={`status status-${a.status}`}>
                <span />
                {statusNames[a.status]}
              </span>
              <code>{a.reference}</code>
            </div>
            <h2 className="detail-title">
              {internal ? a.contact.name : a.serviceName}
            </h2>
            <div className="detail-grid">
              <div>
                <small>Időpont</small>
                <strong>{dateLabel(a.date)}</strong>
                <span>
                  {a.time}–{endTime(a.time, a.duration)}
                </span>
              </div>
              <div>
                <small>Jármű</small>
                <strong>
                  {a.vehicle.make} {a.vehicle.model}
                </strong>
                <span>
                  {a.vehicle.plate} · {a.vehicle.year}
                </span>
                {a.vehicle.vin && <span>VIN: {a.vehicle.vin}</span>}
              </div>
              <div>
                <small>Kapcsolattartó</small>
                <strong>{a.contact.name}</strong>
                <a href={`tel:${a.contact.phone.replace(/[^+\d]/g, "")}`}>
                  {a.contact.phone}
                </a>
                <a href={`mailto:${a.contact.email}`}>{a.contact.email}</a>
                <span>{a.contact.city}</span>
              </div>
              <div>
                <small>Szolgáltatás</small>
                <strong>{a.serviceName}</strong>
                {a.priceLabel && <span>{a.priceLabel}</span>}
                <span>
                  {a.organization
                    ? `Céges partner · ${a.companyName}`
                    : a.owner
                      ? "Regisztrált ügyfél"
                      : "Vendégfoglalás"}
                </span>
              </div>
            </div>
            {a.note && <div className="hint-box">{a.note}</div>}
            <ConfirmationNote appointment={a} internal={internal} />
            <AppointmentPrice
              appointment={a}
              editable={internal}
              disabled={busy}
              onConflict={() => void refresh()}
              onSaved={(appointment) => {
                ++epoch.current;
                setDetail((old) => (old ? { ...old, appointment } : old));
                appointmentsChanged();
                notify("Az árat elmentettük.");
                void refresh();
              }}
            />
            <div className="button-row">
              {internal && a.status === "requested" && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void change("confirmed")}
                >
                  <Check size={16} /> Visszaigazolás
                </button>
              )}
              {operational && a.status === "confirmed" && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void change("progress")}
                >
                  <Wrench size={16} /> Munka indítása
                </button>
              )}
              {operational && a.status === "progress" && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void change("completed")}
                >
                  <Check size={16} /> Elkészült
                </button>
              )}
              {editable && (
                <>
                  <Link
                    className="button button-outline"
                    href={`/idopont?edit=${a.id}`}
                  >
                    Új időpont <CalendarDays size={16} />
                  </Link>
                  <button
                    className="text-button danger-text"
                    disabled={busy}
                    onClick={() => setCancelling(true)}
                  >
                    {internal ? "Lemondás / elutasítás" : "Lemondás"}
                  </button>
                </>
              )}
              <button
                className="button button-outline"
                onClick={() => calendarFile(a)}
              >
                <Download size={16} /> Naptárba
              </button>
            </div>
            <details className="appointment-history">
              <summary>Állapotelőzmények</summary>
              <ol>
                {detail.history.map((item, index) => (
                  <li key={index}>
                    <strong>
                      {item.action === "price_updated"
                        ? "Ár frissítve"
                        : item.action === "rescheduled"
                          ? "Új időpont kérve"
                          : item.action === "requested"
                            ? "Kérés rögzítve"
                            : statusNames[item.action as Status] || item.action}
                    </strong>
                    <span>
                      {new Date(item.at).toLocaleString("hu-HU", {
                        timeZone: "Europe/Budapest",
                      })}
                      {internal && item.actorName ? ` · ${item.actorName}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}
        {cancelling && (
          <Modal
            title="Lemondod az időpontot?"
            close={() => {
              if (!busy) setCancelling(false);
            }}
          >
            <div className="modal-form">
              <p>
                A kérést lemondottra állítjuk. A visszaigazolt időpont
                kapacitása felszabadul.
              </p>
              <div className="button-row">
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => setCancelling(false)}
                >
                  Mégse
                </button>
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={() => void change("cancelled")}
                >
                  Időpont lemondása
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

function Closures({ close, day }: { close: () => void; day: string }) {
  const { appointmentsChanged, notify } = usePortal();
  const [dates, setDates] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [date, setDate] = useState(day < today() ? today() : day);
  const load = useCallback(async () => {
    try {
      const result = await accountRequest<{ dates: string[] }>(
        "/api/appointments/closures",
      );
      setDates(result.dates);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nem tölthető be a zárvatartás.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(value: string, closing: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await accountRequest(
        "/api/appointments/closures",
        closing ? "PUT" : "DELETE",
        { date: value },
      );
      await load();
      appointmentsChanged();
      notify(
        closing
          ? "A napot lezártuk új foglalások előtt."
          : "A nap újra foglalható.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nem sikerült menteni.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Zárvatartás kezelése"
      close={() => {
        if (!busy) close();
      }}
    >
      <div className="modal-form">
        <p className="muted">
          Lezárt napra nem kérhető vagy igazolható vissza új időpont. A meglévő
          visszaigazolt foglalásokat külön kell egyeztetni.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form
          className="closure-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save(date, true);
          }}
        >
          <Field
            label="Lezárandó nap"
            type="date"
            required
            min={today()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <button className="button" disabled={busy}>
            Nap lezárása
          </button>
        </form>
        <div className="closure-list">
          {dates.length ? (
            dates.map((day) => (
              <div key={day}>
                <span>{dateLabel(day)}</span>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void save(day, false)}
                >
                  Újranyitás
                </button>
              </div>
            ))
          ) : (
            <p className="muted small">Nincs külön lezárt nap.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
