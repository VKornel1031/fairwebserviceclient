"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { accountRequest, AccountRequestError } from "@/lib/accounts";
import type { LiveAppointment, PriceItem } from "@/lib/live-appointments";
import { Field } from "./fields";
const money = (value: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(value);
const kinds = { part: "Alkatrész", labour: "Munkadíj", other: "Egyéb" };
const blankItem = (): PriceItem => ({
  kind: "part",
  description: "",
  quantity: 1,
  unitPriceHuf: 0,
});

export default function AppointmentPrice({
  appointment,
  editable,
  disabled,
  onSaved,
  onConflict,
}: {
  appointment: LiveAppointment;
  editable: boolean;
  disabled: boolean;
  onSaved: (appointment: LiveAppointment) => void;
  onConflict: () => void;
}) {
  const price = appointment.price;
  const [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [mode, setMode] = useState<"total" | "itemized">(
      price?.mode || "total",
    ),
    [total, setTotal] = useState(price ? String(price.totalHuf) : ""),
    [items, setItems] = useState<PriceItem[]>(
      price?.items.length ? price.items : [blankItem()],
    ),
    [note, setNote] = useState(price?.note || "");
  const canEdit =
    editable &&
    ["confirmed", "progress", "completed"].includes(appointment.status);
  const calculated = items.reduce(
    (sum, line) => sum + line.quantity * line.unitPriceHuf,
    0,
  );
  function open() {
    setMode(price?.mode || "total");
    setTotal(price ? String(price.totalHuf) : "");
    setItems(price?.items.length ? price.items : [blankItem()]);
    setNote(price?.note || "");
    setError("");
    setEditing(true);
  }
  function change(index: number, patch: Partial<PriceItem>) {
    setItems((old) =>
      old.map((line, n) => (n === index ? { ...line, ...patch } : line)),
    );
  }
  return (
    <section className="appointment-price" aria-label="Ár és költségrészletek">
      <div className="section-title">
        <h3>Ár és költségrészletek</h3>
        {canEdit && !editing && (
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={open}
          >
            {price ? "Ár módosítása" : "Ár hozzáadása"}
          </button>
        )}
      </div>
      {price ? (
        <>
          <p className="price-total">
            <strong>{money(price.totalHuf)}</strong>
            <span>Tájékoztató bruttó árbecslés</span>
          </p>
          {price.mode === "itemized" && (
            <div className="price-lines">
              {price.items.map((line, n) => (
                <div className="price-line" key={n}>
                  <div>
                    <strong>{line.description}</strong>
                    <span>
                      {kinds[line.kind]} · {line.quantity} ×{" "}
                      {money(line.unitPriceHuf)}
                    </span>
                  </div>
                  <strong>{money(line.quantity * line.unitPriceHuf)}</strong>
                </div>
              ))}
            </div>
          )}
          {price.note && <p className="price-note">{price.note}</p>}
          <p className="small muted">
            Frissítve:{" "}
            {new Date(price.updatedAt).toLocaleString("hu-HU", {
              timeZone: "Europe/Budapest",
            })}
          </p>
        </>
      ) : (
        <p className="muted small">
          {["requested", "cancelled"].includes(appointment.status)
            ? "A szerviz a telefonos visszaigazolás után adhat meg árat."
            : "A szerviz még nem adott meg árat."}
        </p>
      )}
      <p className="small muted">
        Az összegek bruttó forintértékek. A javítás tartalmát és végleges díját
        külön egyeztetitek; ez nem számla és nem online javítási megrendelés.
      </p>
      {editing && canEdit && (
        <form
          className="price-editor"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || disabled) return;
            setBusy(true);
            setError("");
            try {
              const result = await accountRequest<{
                appointment: LiveAppointment;
              }>(`/api/appointments/${appointment.id}/price`, "PUT", {
                mode,
                ...(mode === "total" ? { totalHuf: Number(total) } : { items }),
                note,
                revision: appointment.revision,
              });
              onSaved(result.appointment);
              setEditing(false);
            } catch (e) {
              if (e instanceof AccountRequestError && e.status === 409)
                onConflict();
              setError(e instanceof Error ? e.message : "Az ár nem menthető.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy || disabled}>
            <label className="field">
              <span>Árazás módja</span>
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "total" | "itemized")
                }
              >
                <option value="total">Egy összeg</option>
                <option value="itemized">Tételes részletezés</option>
              </select>
            </label>
            {mode === "total" ? (
              <Field
                label="Bruttó ár (Ft)"
                type="number"
                min={0}
                max={1000000000}
                step={1}
                required
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            ) : (
              <>
                {items.map((line, index) => (
                  <div className="price-item-editor" key={index}>
                    <div className="section-title">
                      <strong>{index + 1}. tétel</strong>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`${index + 1}. tétel törlése`}
                        disabled={items.length === 1}
                        onClick={() =>
                          setItems((old) => old.filter((_, n) => n !== index))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <label className="field">
                      <span>{index + 1}. tétel típusa</span>
                      <select
                        value={line.kind}
                        onChange={(e) =>
                          change(index, {
                            kind: e.target.value as PriceItem["kind"],
                          })
                        }
                      >
                        {Object.entries(kinds).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label={`${index + 1}. tétel megnevezése`}
                      required
                      maxLength={160}
                      value={line.description}
                      onChange={(e) =>
                        change(index, { description: e.target.value })
                      }
                    />
                    <div className="form-grid">
                      <Field
                        label={`${index + 1}. tétel mennyisége`}
                        type="number"
                        required
                        min={1}
                        max={1000}
                        step={1}
                        value={line.quantity || ""}
                        onChange={(e) =>
                          change(index, { quantity: Number(e.target.value) })
                        }
                      />
                      <Field
                        label={`${index + 1}. tétel bruttó egységára (Ft)`}
                        type="number"
                        required
                        min={0}
                        max={1000000000}
                        step={1}
                        value={
                          Number.isNaN(line.unitPriceHuf)
                            ? ""
                            : line.unitPriceHuf
                        }
                        onChange={(e) =>
                          change(index, {
                            unitPriceHuf:
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <p className="small muted">
                      Tétel összege:{" "}
                      {money(line.quantity * line.unitPriceHuf || 0)}
                    </p>
                  </div>
                ))}
                <button
                  className="text-button"
                  type="button"
                  disabled={items.length >= 30}
                  onClick={() => setItems((old) => [...old, blankItem()])}
                >
                  <Plus size={16} /> Új tétel
                </button>
                <p>
                  Bruttó összesen: <strong>{money(calculated || 0)}</strong>
                </p>
              </>
            )}
            <label className="field">
              <span>Árhoz tartozó megjegyzés</span>
              <textarea
                maxLength={1000}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="button-row">
              <button className="button" type="submit">
                {busy ? "Mentés…" : "Ár mentése"}
              </button>
              <button
                className="button button-outline"
                type="button"
                onClick={() => setEditing(false)}
              >
                Mégse
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
