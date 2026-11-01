"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { accountRequest } from "@/lib/accounts";
import {
  displayPlate,
  type SavedVehicle,
  type VehicleList,
} from "@/lib/vehicles";
import { usePortal } from "./provider";
import { Empty, Field } from "./fields";
import { Modal, PageHeading } from "./ui";

const blank = { plate: "", make: "", model: "", year: "", vin: "" };
export default function Vehicles({ embedded = false }: { embedded?: boolean }) {
  const { user, notify, refreshGarage } = usePortal();
  const [editing, setEditing] = useState<SavedVehicle | null>(null);
  const [removing, setRemoving] = useState<SavedVehicle | null>(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("own");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const key = `${user?.id}:${user?.role}:${scope}:${search}:${page}:${revision}`;
  const [listing, setListing] = useState({
    key: "",
    data: null as VehicleList | null,
    error: "",
    loading: true,
  });
  const data = listing.key === key ? listing.data : null;
  const loading = listing.key !== key || listing.loading;
  const error = listing.key === key ? listing.error : "";
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setListing({ key, data: null, error: "", loading: true });
    const params = new URLSearchParams({
      scope,
      page: String(page),
      q: search,
    });
    accountRequest<VehicleList>(
      `/api/vehicles?${params}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages);
          return;
        }
        if (result.totalItems === 0 && page > 1) {
          setPage(1);
          return;
        }
        setListing({ key, data: result, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setListing({
            key,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "A járművek most nem tölthetők be.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [key, user?.id, scope, page, search]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("fairauto-vehicles", refresh);
    return () => window.removeEventListener("fairauto-vehicles", refresh);
  }, []);
  useEffect(() => {
    if (user?.role !== "admin") setScope("own");
  }, [user?.role]);
  function add() {
    setEditing(null);
    setForm(blank);
    setFormError("");
    setOpen(true);
  }
  function edit(car: SavedVehicle) {
    setEditing(car);
    setForm({
      plate: displayPlate(car.plate),
      make: car.make,
      model: car.model,
      year: car.year,
      vin: car.vin,
    });
    setFormError("");
    setOpen(true);
  }
  function changed(message: string) {
    setRevision((value) => value + 1);
    void refreshGarage(true);
    notify(message);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      await accountRequest(
        editing ? `/api/vehicles/${editing.id}` : "/api/vehicles",
        editing ? "PATCH" : "POST",
        form,
      );
      setOpen(false);
      changed(
        editing
          ? "A jármű adatait frissítettük."
          : "A járművet elmentettük a fiókodhoz.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni a járművet.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removing || busy) return;
    setBusy(true);
    setFormError("");
    try {
      await accountRequest(`/api/vehicles/${removing.id}`, "DELETE");
      setRemoving(null);
      changed("A járművet töröltük.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Nem sikerült törölni a járművet.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function makeDefault(car: SavedVehicle) {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await accountRequest("/api/vehicles/default", "PUT", {
        vehicleId: car.id,
      });
      changed("Az alapértelmezett járművet frissítettük.");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Nem sikerült kiválasztani a járművet.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <>
        <PageHeading
          eyebrow="JÁRMŰVEIM"
          title="Minden autód, egy helyen."
          description="Saját fiókkal elmentheted az autóid adatait."
        />
        <Empty
          icon={<CarFront size={34} />}
          title="Adj saját helyet az autódnak."
          description="Jelentkezz be vagy hozz létre fiókot a járművek mentéséhez."
        >
          <Link href="/fiok" className="button">
            Bejelentkezés / regisztráció <ArrowRight size={17} />
          </Link>
        </Empty>
      </>
    );
  return (
    <>
      {embedded ? (
        <div className="section-title">
          <h2>Céges járművek</h2>
          <button
            className="button button-outline"
            disabled={loading || !!error}
            onClick={add}
          >
            <Plus size={16} /> Jármű hozzáadása
          </button>
        </div>
      ) : (
        <PageHeading
          eyebrow={user.role === "partner" ? "CÉGES FLOTTA" : "JÁRMŰVEIM"}
          title="Ismerjük meg az autóidat."
          description="A fiókodhoz mentett járműveid minden eszközödön elérhetők."
          action={
            <button
              className="button"
              disabled={loading || !!error}
              onClick={add}
            >
              <Plus size={17} /> Jármű hozzáadása
            </button>
          }
        />
      )}
      {user.role === "admin" && (
        <div className="tabs" aria-label="Járműlista">
          <button
            className={scope === "own" ? "active" : ""}
            onClick={() => {
              setScope("own");
              setPage(1);
            }}
          >
            Saját járművek
          </button>
          <button
            className={scope === "all" ? "active" : ""}
            onClick={() => {
              setScope("all");
              setPage(1);
            }}
          >
            Összes jármű
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
            aria-label="Járművek keresése"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rendszám, VIN, márka vagy modell"
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
      </form>
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {loading ? (
        <p className="muted" role="status">
          Járművek betöltése…
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
      ) : data?.items.length ? (
        <>
          <p className="small muted">{data.totalItems} mentett jármű</p>
          <div className="vehicles-grid">
            {data.items
              .filter(
                (car) =>
                  car.owner === user.id ||
                  (scope === "all" && user.role === "admin"),
              )
              .map((car) => (
                <article key={car.id} className="vehicle-card">
                  <div className="vehicle-top">
                    <CarFront size={48} strokeWidth={1} />
                    {car.isDefault && (
                      <span className="default-badge">
                        <Star size={11} /> Alapértelmezett
                      </span>
                    )}
                  </div>
                  <h2>
                    {car.make} <span>{car.model}</span>
                  </h2>
                  <p className="muted">
                    {car.year} ·{" "}
                    {scope === "all"
                      ? car.ownerName || "Fiókhoz mentett jármű"
                      : user.role === "partner"
                        ? "Céges jármű"
                        : "Saját jármű"}
                  </p>
                  <span className="license-plate">
                    <span>H</span>
                    {displayPlate(car.plate)}
                  </span>
                  {car.vin && (
                    <p className="small muted vehicle-vin">VIN: {car.vin}</p>
                  )}
                  <div className="vehicle-actions">
                    <div>
                      {car.owner === user.id && !car.isDefault && (
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => void makeDefault(car)}
                        >
                          <Star size={15} /> Alapértelmezettnek
                        </button>
                      )}
                    </div>
                    <div>
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={`${displayPlate(car.plate)} szerkesztése`}
                        onClick={() => edit(car)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={`${displayPlate(car.plate)} törlése`}
                        onClick={() => {
                          setRemoving(car);
                          setFormError("");
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
          {data.totalPages > 1 && (
            <nav
              className="vehicle-pagination"
              aria-label="Járműlista lapozása"
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
      ) : (
        <Empty
          icon={<CarFront size={32} />}
          title={
            search
              ? "Nincs találat a keresésre."
              : "Az első autód helye már megvan."
          }
          description="Add meg a rendszámot, a márkát, a modellt és a gyártási évet."
        >
          {!search && (
            <button className="button" onClick={add}>
              <Plus size={17} /> Jármű hozzáadása
            </button>
          )}
        </Empty>
      )}
      {open && (
        <Modal
          title={editing ? "Jármű szerkesztése" : "Új jármű hozzáadása"}
          close={() => {
            if (!busy) setOpen(false);
          }}
        >
          <form className="modal-form" onSubmit={(event) => void save(event)}>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <fieldset className="account-fieldset" disabled={busy}>
              <div className="form-grid">
                <Field
                  label="Rendszám"
                  required
                  minLength={3}
                  maxLength={30}
                  value={form.plate}
                  placeholder="ABC-123"
                  className="plate-input"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      plate: event.target.value.toUpperCase(),
                    })
                  }
                />
                <Field
                  label="Gyártási év"
                  type="number"
                  required
                  min={1886}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  placeholder="2018"
                  onChange={(event) =>
                    setForm({ ...form, year: event.target.value })
                  }
                />
                <Field
                  label="Márka"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={form.make}
                  placeholder="Volkswagen"
                  onChange={(event) =>
                    setForm({ ...form, make: event.target.value })
                  }
                />
                <Field
                  label="Modell"
                  required
                  maxLength={60}
                  pattern=".*\S.*"
                  value={form.model}
                  placeholder="Golf VII"
                  onChange={(event) =>
                    setForm({ ...form, model: event.target.value })
                  }
                />
                <Field
                  label="Alvázszám (VIN)"
                  wide
                  minLength={17}
                  maxLength={17}
                  pattern="[A-HJ-NPR-Z0-9]{17}"
                  autoComplete="off"
                  value={form.vin}
                  hint="17 karakter, I, O és Q nélkül. Mentett autónál később is megadhatod; foglaláshoz szükséges."
                  onChange={(event) =>
                    setForm({
                      ...form,
                      vin: event.target.value.toUpperCase().replace(/\s/g, ""),
                    })
                  }
                />
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setOpen(false)}
                >
                  Mégse
                </button>
                <button type="submit" className="button">
                  {busy ? "Mentés…" : "Jármű mentése"}
                  <Check size={17} />
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal
          title="Törlöd ezt a járművet?"
          close={() => {
            if (!busy) setRemoving(null);
          }}
        >
          <div className="modal-form">
            <p>
              {removing.make} {removing.model} · {displayPlate(removing.plate)}
            </p>
            <p className="modal-intro">
              A járművet eltávolítjuk a mentett listából.
            </p>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="button-row">
              <button
                className="button button-outline"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Mégse
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={() => void remove()}
              >
                {busy ? "Törlés…" : "Jármű törlése"}
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
