"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { accountRequest } from "@/lib/accounts";
import {
  displayPlate,
  type SavedVehicle,
  type VehicleList,
} from "@/lib/vehicles";
import { usePortal } from "./provider";

export default function SavedVehiclePicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (vehicle: SavedVehicle | null) => void;
}) {
  const { user, garage } = usePortal();
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [data, setData] = useState<VehicleList | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    const params = new URLSearchParams({ q: search, page: String(page) });
    accountRequest<VehicleList>(
      "/api/vehicles?" + params,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "A mentett járművek nem tölthetők be.",
          );
      });
    return () => controller.abort();
  }, [search, page, user?.id]);
  const defaultCar = garage.summary?.defaultVehicle;
  const items = [...(data?.items || [])];
  if (defaultCar && !items.some((car) => car.id === defaultCar.id))
    items.unshift(defaultCar);
  return (
    <div className="saved-vehicle-picker">
      <label className="field">
        <span>
          {user?.role === "partner"
            ? "Jármű a céges flottából"
            : "Mentett jármű kiválasztása"}
        </span>
        <select
          value={selected}
          onChange={(event) =>
            onChange(items.find((car) => car.id === event.target.value) || null)
          }
        >
          <option value="">Másik jármű adatait adom meg</option>
          {items.map((car) => (
            <option key={car.id} value={car.id}>
              {car.make} {car.model} · {displayPlate(car.plate)}
            </option>
          ))}
        </select>
      </label>
      {(garage.summary?.totalItems || 0) > 24 && (
        <>
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Mentett járművek keresése"
              maxLength={100}
              placeholder="Rendszám, márka vagy modell"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setSearch(query);
                  setPage(1);
                }
              }}
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              className="text-button"
              disabled={page <= 1}
              aria-label="Mentett járművek előző oldala"
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={14} />
              Előző
            </button>
            <span className="small muted">
              {page} / {data?.totalPages || 1}
            </span>
            <button
              type="button"
              className="text-button"
              disabled={!data || page >= data.totalPages}
              aria-label="Mentett járművek következő oldala"
              onClick={() => setPage((value) => value + 1)}
            >
              Következő
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="small muted">
          {error} A jármű adatait kézzel is megadhatod.
        </p>
      )}
    </div>
  );
}
