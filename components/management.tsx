"use client";
import { useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  BarChart3,
  Clock3,
  Wrench,
  Search,
} from "lucide-react";
import { usePortal } from "./provider";
import { PageHeading } from "./ui";
import { Empty } from "./fields";
import {
  addDays,
  dateLabel,
  services,
  statusNames,
  today,
  weekday,
  minutes as clockMinutes,
} from "@/lib/demo";
import { downloadAppointments } from "@/lib/reports";
import { canViewReports } from "@/lib/permissions";

export default function Management() {
  const { user, store, demo } = usePortal();
  const [period, setPeriod] = useState("7");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  if (!canViewReports(user?.role))
    return (
      <>
        <PageHeading
          eyebrow="VEZETŐI ÁTTEKINTÉS"
          title="A műhely egésze, egy helyen."
          description={`Összesített nézet a ${site.shortName} tulajdonosainak és vezetőinek.`}
        />
        <Empty
          icon={<BarChart3 size={32} />}
          title="Ez a vezetői munkaterület."
          description="A demóban külön vezetői nézettel próbálhatod ki az összesítéseket és a riportokat. A saját foglalásaidat a megszokott oldalakon találod."
        >
          <button className="button" onClick={() => demo("manager")}>
            Vezetői demó megnyitása <ArrowUpRight size={16} />
          </button>
        </Empty>
      </>
    );
  const start = today();
  const end = addDays(start, Number(period) - 1);
  const periodRows = store.appointments.filter(
    (a) => a.date >= start && a.date <= end,
  );
  const active = periodRows.filter((a) => a.status !== "cancelled");
  const waiting = store.appointments.filter((a) => a.status === "requested");
  const list = periodRows
    .filter(
      (a) =>
        (status === "all" || a.status === status) &&
        `${a.contact.name} ${a.vehicle.plate} ${a.vehicle.make} ${a.id}`
          .toLocaleLowerCase("hu")
          .includes(query.toLocaleLowerCase("hu")),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const peak = Math.max(
    1,
    ...days.map((day) => active.filter((a) => a.date === day).length),
  );
  const workingDays = Array.from({ length: Number(period) }, (_, i) =>
    addDays(start, i),
  ).filter(
    (day) =>
      !site.booking.closedWeekdays.includes(weekday(day)) &&
      !store.blockedDates.includes(day),
  ).length;
  const minutes = active.reduce((n, a) => n + a.duration, 0);
  const utilization = workingDays
    ? Math.round(
        (minutes /
          (workingDays *
            (clockMinutes(site.booking.closesAt) -
              clockMinutes(site.booking.opensAt)) *
            site.booking.capacity)) *
          100,
      )
    : null;
  const types = [
    {
      name: "Céges partner",
      count: active.filter((a) => a.organization).length,
    },
    {
      name: "Magánügyfél",
      count: active.filter((a) => !a.organization && a.owner).length,
    },
    { name: "Vendég", count: active.filter((a) => !a.owner).length },
  ];
  return (
    <div className="management-overview">
      <PageHeading
        eyebrow={`${site.shortName.toLocaleUpperCase("hu")} · VEZETŐI NÉZET`}
        title="A részletekből teljes kép."
        description="Műhelyszintű foglalások, terhelés és ügyfélösszetétel."
        action={
          <Link href="/muhely" className="button">
            Műhely megnyitása <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="management-toolbar">
        <span>
          {dateLabel(start, { month: "long", day: "numeric" })} –{" "}
          {dateLabel(end, { month: "long", day: "numeric" })}
        </span>
        <label>
          Időszak
          <select
            aria-label="Riport időszaka"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Következő 7 nap</option>
            <option value="30">Következő 30 nap</option>
          </select>
        </label>
      </div>
      <div className="management-stats">
        <article>
          <span>Időszak foglalásai</span>
          <strong>
            {active.length}
            <CalendarDays size={21} />
          </strong>
          <small>Lemondott időpontok nélkül</small>
        </article>
        <Link href="/muhely?filter=requests">
          <span>Jóváhagyásra vár</span>
          <strong>
            {waiting.length}
            <Clock3 size={21} />
          </strong>
          <small>
            Összes beérkezett kérés <ArrowUpRight size={12} />
          </small>
        </Link>
        <article>
          <span>Tervezett munkaidő</span>
          <strong>
            {(minutes / 60).toLocaleString("hu-HU", {
              maximumFractionDigits: 1,
            })}
            <Wrench size={21} />
          </strong>
          <small>Óra · becsült szervizidőtartam</small>
        </article>
        <article>
          <span>Demókapacitás lekötése</span>
          <strong>
            {utilization === null ? "—" : `${utilization}%`}
            <BarChart3 size={21} />
          </strong>
          <small>
            {site.booking.capacity} párhuzamos időpont · {site.hours.short}
          </small>
        </article>
      </div>
      <div className="management-charts">
        <section className="report-panel">
          <div className="section-title">
            <h2>A következő hét terhelése</h2>
            <span className="small muted">Foglalások száma</span>
          </div>
          <div className="workload-bars">
            {days.map((day) => {
              const count = store.appointments.filter(
                (a) => a.date === day && a.status !== "cancelled",
              ).length;
              const closed =
                site.booking.closedWeekdays.includes(weekday(day)) ||
                store.blockedDates.includes(day);
              return (
                <Link
                  key={day}
                  className={`workload-day ${closed ? "closed" : ""}`}
                  href={`/muhely?date=${day}`}
                  aria-label={`${dateLabel(day)}: ${count} foglalás${closed ? ", zárva" : ""}`}
                >
                  <span>{count}</span>
                  <div>
                    <i
                      style={{
                        height: `${Math.max(3, (count / peak) * 100)}%`,
                      }}
                    />
                  </div>
                  <strong>{dateLabel(day, { weekday: "short" })}</strong>
                  <small>
                    {Number(day.slice(-2))}
                    {closed ? " · zárva" : ""}
                  </small>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="report-panel customer-mix">
          <h2>Ügyfélösszetétel</h2>
          <p className="muted small">Az időszak aktív foglalásai</p>
          {types.map((type, i) => (
            <div key={type.name}>
              <span>
                <i className={`mix-dot mix-${i}`} />
                {type.name}
              </span>
              <strong>{type.count}</strong>
            </div>
          ))}
          <p className="report-note">
            A helyi demóadatok összesítése. Pénzügyi vagy bevételi adatokat nem
            tartalmaz.
          </p>
        </section>
      </div>
      <section className="management-bookings">
        <div className="section-title">
          <h2>Foglalási riport</h2>
          <button
            className="button button-outline"
            disabled={!list.length}
            onClick={() =>
              downloadAppointments(list, `fairauto-vezetes-${start}-${end}.csv`)
            }
          >
            <Download size={15} /> Riport letöltése
          </button>
        </div>
        <div className="report-filters">
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Riport keresése"
              placeholder="Név, rendszám vagy azonosító"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="report-status">
            Állapot
            <select
              aria-label="Riport állapota"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Minden állapot</option>
              {Object.entries(statusNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className="small muted">{list.length} találat</span>
        </div>
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
                    <span className="sr-only">Megnyitás</span>
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
                      <strong>{a.contact.name}</strong>
                      <span>
                        {a.vehicle.plate} ·{" "}
                        {a.organization
                          ? "Céges partner"
                          : a.owner
                            ? "Magánügyfél"
                            : "Vendég"}
                      </span>
                    </td>
                    <td>
                      {services.find((s) => s.id === a.service)?.short}
                      <span>{a.id}</span>
                    </td>
                    <td>
                      <span className={`status status-${a.status}`}>
                        <span />
                        {statusNames[a.status]}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/muhely?date=${a.date}&appointment=${a.id}`}
                        className="icon-button"
                        aria-label={`${a.id} megnyitása`}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="report-empty">
            Ebben az időszakban nincs a szűrésnek megfelelő foglalás.
          </div>
        )}
      </section>
    </div>
  );
}
