"use client";
import { useCallback, useState } from "react";
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
import { accountRequest, AccountRequestError } from "@/lib/accounts";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import type { AppointmentDashboard } from "@/lib/live-appointments";
import AppointmentList from "./appointment-list";
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
  const { user } = usePortal();
  const [period, setPeriod] = useState("7");
  const [revision, setRevision] = useState(0),
    [state, setState] = useState({
      key: "",
      data: null as AppointmentDashboard | null,
      error: "",
    });
  const key =
    (user?.id || "") + ":" + (user?.role || "") + ":" + period + ":" + revision;
  const load = useCallback(
    async (signal: AbortSignal) => {
      try {
        const data = await accountRequest<AppointmentDashboard>(
          "/api/appointments/dashboard?days=" + period,
          "GET",
          undefined,
          signal,
        );
        if (!signal.aborted) setState({ key, data, error: "" });
      } catch (error) {
        if (signal.aborted) return;
        const revoked =
          error instanceof AccountRequestError &&
          [401, 403].includes(error.status);
        setState((old) => ({
          key,
          data: !revoked && old.key === key ? old.data : null,
          error:
            error instanceof Error
              ? error.message
              : "A riport nem tölthető be.",
        }));
      }
    },
    [key, period],
  );
  useLiveRefresh(load, canViewReports(user?.role));
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
          description="A vezetői munkatérhez vezetői vagy adminisztrátori hozzáférés szükséges. A saját fiókodat a Saját fiók oldalon kezelheted."
        >
          <Link className="button" href="/fiok">
            Bejelentkezés <ArrowUpRight size={16} />
          </Link>
        </Empty>
      </>
    );
  const summary = state.key === key ? state.data : null;
  if (!summary)
    return (
      <>
        <PageHeading
          eyebrow="VEZETŐI ÁTTEKINTÉS"
          title="A részletekből teljes kép."
          description="A mentett időpontkérések összesítése."
        />
        {state.key === key && state.error ? (
          <div className="info-box" role="alert">
            <p>{state.error}</p>
            <button
              className="button button-outline"
              onClick={() => setRevision((value) => value + 1)}
            >
              Újrapróbálás
            </button>
          </div>
        ) : (
          <p role="status" className="muted">
            Riport betöltése…
          </p>
        )}
      </>
    );
  const { start, end, waiting } = summary,
    minutes = summary.totals.minutes;
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const peak = Math.max(1, ...summary.days.map((row) => row.total));
  const utilization = summary.workingDays
    ? Math.round(
        (summary.totals.reservedMinutes /
          (summary.workingDays * summary.workMinutes * summary.capacity)) *
          100,
      )
    : null;
  const types = [
    { name: "Céges partner", count: summary.totals.partners },
    { name: "Magánügyfél", count: summary.totals.customers },
    { name: "Vendég", count: summary.totals.guests },
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
      {state.key === key && state.error && (
        <p className="info-box" role="status">
          {state.error}
        </p>
      )}
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
            {summary.totals.active}
            <CalendarDays size={21} />
          </strong>
          <small>Lemondott időpontok nélkül</small>
        </article>
        <Link href="/muhely?filter=requests">
          <span>Jóváhagyásra vár</span>
          <strong>
            {waiting}
            <Clock3 size={21} />
          </strong>
          <small>
            Összes beérkezett kérés <ArrowUpRight size={12} />
          </small>
        </Link>
        <article>
          <span>Igényelt szervizidő</span>
          <strong>
            {(minutes / 60).toLocaleString("hu-HU", {
              maximumFractionDigits: 1,
            })}
            <Wrench size={21} />
          </strong>
          <small>Óra · becsült szervizidőtartam</small>
        </article>
        <article>
          <span>Műhelykapacitás lekötése</span>
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
              const count =
                summary.days.find((row) => row.date === day)?.total || 0;
              const closed =
                site.booking.closedWeekdays.includes(weekday(day)) ||
                summary.closures.includes(day);
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
            A mentett időpontkérések és visszaigazolások összesítése. A
            kapacitást a visszaigazolt időpontok foglalják.
          </p>
        </section>
      </div>
      <section className="management-bookings">
        <div className="section-title">
          <h2>Foglalási riport</h2>
        </div>
        <AppointmentList mode="report" embedded from={start} to={end} />
      </section>
    </div>
  );
}
