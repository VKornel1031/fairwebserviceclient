"use client";
import Link from "next/link";
import { site, locationLabel } from "@/content/site";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Plus,
} from "lucide-react";
import { usePortal } from "./provider";
import { PageHeading } from "./ui";
import { dateLabel, endTime, services, statusNames, today } from "@/lib/demo";

export default function CustomerOverview() {
  const { user, garage, appointments } = usePortal();
  const upcoming = appointments.summary?.next;
  const car = garage.summary?.defaultVehicle;
  const vehicleCount = garage.summary?.totalItems || 0;
  return (
    <div className="customer-overview">
      <PageHeading
        eyebrow="A TE SZERVIZED"
        title={
          user
            ? `Szia, ${user.name.split(" ")[1] || user.name.split(" ")[0]}!`
            : "Jó kezekben. Jó időben."
        }
        description="A következő időpontod és az autóid. Pont annyi, amire szükséged van."
        action={
          <Link href="/idopont" className="button">
            <Plus size={16} /> Új időpontfoglalás
          </Link>
        }
      />
      <section className="customer-next" aria-labelledby="customer-next-title">
        <div className="customer-card-heading">
          <CalendarDays size={21} strokeWidth={1.4} />
          <span className="eyebrow">KÖVETKEZŐ TALÁLKOZÁSUNK</span>
        </div>
        {upcoming ? (
          <>
            <div className="customer-appointment">
              <div>
                <h2 id="customer-next-title">
                  {dateLabel(upcoming.date, { month: "long", day: "numeric" })}{" "}
                  · {upcoming.time}
                </h2>
                <p>{upcoming.serviceName}</p>
                <span className="muted">
                  {upcoming.vehicle.make} {upcoming.vehicle.model} ·{" "}
                  {upcoming.vehicle.plate}
                </span>
              </div>
              <span className={`status status-${upcoming.status}`}>
                <span />
                {statusNames[upcoming.status]}
              </span>
            </div>
            <div className="customer-next-footer">
              <span>
                {upcoming.time}–{endTime(upcoming.time, upcoming.duration)} ·
                {site.contact.street}
              </span>
              <Link href="/foglalasaim" className="text-link">
                Részletek és módosítás <ArrowRight size={16} />
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 id="customer-next-title">
              Amikor szükséged van ránk, itt vagyunk.
            </h2>
            <p className="customer-empty-copy">
              {appointments.loading && !appointments.summary
                ? "Időpontkérések betöltése…"
                : appointments.error
                  ? "Az időpontok most nem tölthetők be. Nyisd meg a Foglalásaim oldalt az újrapróbáláshoz."
                  : "Még nincs közelgő időpontod. Válassz szolgáltatást és egy neked megfelelő napot."}
            </p>
            <span className="customer-location">
              {site.shortName} · {locationLabel}
            </span>
          </>
        )}
      </section>
      <section
        className="customer-car-row"
        aria-labelledby="customer-car-title"
      >
        <span className="customer-car-icon">
          <CarFront size={26} strokeWidth={1.3} />
        </span>
        <div>
          <h3 id="customer-car-title">
            {car ? `${car.make} ${car.model}` : "Az autóid adatai, kéznél."}
          </h3>
          <p>
            {user && garage.error
              ? "A járművek most nem tölthetők be."
              : user && garage.loading && !garage.summary
                ? "A járművek betöltése…"
                : car
                  ? `${car.plate} · ${car.year}${vehicleCount > 1 ? ` · +${vehicleCount - 1} további jármű` : ""}`
                  : user
                    ? "Mentsd el a járműved, és legközelebb kitöltjük helyetted."
                    : "Saját fiókkal elmentheted az autóid adatait."}
          </p>
        </div>
        <Link href={user ? "/jarmuvek" : "/fiok"} className="text-link">
          {user ? "Járművek kezelése" : "Fiókot hozok létre"}{" "}
          <ArrowUpRight size={16} />
        </Link>
      </section>
    </div>
  );
}
