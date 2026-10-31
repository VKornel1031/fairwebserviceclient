"use client";
import { useState, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePortal } from "./provider";
import { Modal, PageHeading } from "./ui";
import { Empty, Field } from "./fields";
import { id, type Role, type Store, type User } from "@/lib/demo";
import { canAdminister, roleLabels, roleHome } from "@/lib/permissions";

export default function Administration() {
  const { user, store, mutate, notify, demo, session } = usePortal();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ account: User | null } | null>(null);
  const [role, setRole] = useState<Role>("customer");
  const [deleting, setDeleting] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!canAdminister(user?.role))
    return (
      <>
        <PageHeading
          eyebrow="ADMINISZTRÁCIÓ"
          title="Fiókok és jogosultságok."
          description="Az adminisztrátor kezeli az ügyfél-, partner- és munkatársi fiókokat."
        />
        <Empty
          icon={<ShieldCheck size={32} />}
          title="Ez az adminisztrátor munkaterülete."
          description="A fiókok létrehozása, szerkesztése és törlése az adminisztrátori profilhoz tartozik."
        >
          <button className="button" onClick={() => demo("admin")}>
            Adminisztrátori demó megnyitása
          </button>
        </Empty>
      </>
    );

  function change(fn: (state: Store) => Store) {
    return mutate((state) => {
      if (
        !canAdminister(
          state.users.find((account) => account.id === user!.id)?.role,
        )
      )
        throw new Error("Ehhez adminisztrátori jogosultság szükséges.");
      return fn(state);
    });
  }
  function open(account: User | null) {
    setRole(account?.role || "customer");
    setError("");
    setEditor({ account });
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const accountId = editor?.account?.id || id("USR");
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "")
      .trim()
      .toLowerCase();
    const phone = String(data.get("phone") || "").trim();
    const city = String(data.get("city") || "").trim();
    const company = {
      name: String(data.get("companyName") || "").trim(),
      tax: String(data.get("companyTax") || "").trim(),
      city: String(data.get("companyCity") || "").trim(),
    };
    if (!name || !email || (role === "partner" && !company.name)) {
      setError("Töltsd ki a kötelező adatokat.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ok = change((state) => {
        const existing = state.users.find(
          (account) => account.id === accountId,
        );
        if (editor?.account && !existing)
          throw new Error("A fiók időközben megszűnt.");
        if (
          state.users.some(
            (account) =>
              account.id !== accountId && account.email.toLowerCase() === email,
          )
        )
          throw new Error("Ezzel az e-mail-címmel már létezik fiók.");
        if (accountId === user!.id && role !== "admin")
          throw new Error(
            "A saját adminisztrátori szerepkörödet itt nem módosíthatod.",
          );
        const next: User = {
          ...existing,
          id: accountId,
          name,
          email,
          phone,
          city,
          reminders: existing?.reminders ?? false,
          role,
        };
        return {
          ...state,
          users: existing
            ? state.users.map((account) =>
                account.id === accountId ? next : account,
              )
            : [...state.users, next],
          companies:
            role === "partner"
              ? { ...state.companies, [accountId]: company }
              : state.companies,
        };
      });
      if (ok) {
        setEditor(null);
        notify("A fiókot elmentettük a helyi demóba.");
      } else
        setError(
          "A fiók nem menthető. Ellenőrizd az értesítésben jelzett hibát.",
        );
    } catch {
      setError("A fiók nem menthető. Próbáld újra.");
    } finally {
      setBusy(false);
    }
  }
  const accounts = store.users.filter((account) =>
    `${account.name} ${account.email} ${roleLabels[account.role]}`
      .toLocaleLowerCase("hu")
      .includes(query.trim().toLocaleLowerCase("hu")),
  );
  const editing = editor?.account;
  const company = editing ? store.companies[editing.id] : undefined;
  return (
    <>
      <PageHeading
        eyebrow="ADMINISZTRÁTOR"
        title="Fiókok és jogosultságok."
        description="Ügyfelek, partnerek, munkafelvevők és vezetők kezelése."
        action={
          <button className="button" onClick={() => open(null)}>
            Új fiók <Plus size={17} />
          </button>
        }
      />
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Fiókok keresése"
            placeholder="Név, e-mail vagy szerepkör…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span className="muted small">{accounts.length} fiók</span>
      </div>
      {accounts.length ? (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Fiók</th>
                <th>Elérhetőség</th>
                <th>Szerepkör</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.name}</strong>
                    <span>
                      {account.id === user!.id
                        ? "Jelenlegi fiókod"
                        : account.id.startsWith("demo-")
                          ? "Mintafiók"
                          : "Helyi demófiók"}
                    </span>
                  </td>
                  <td>
                    <strong>{account.email}</strong>
                    <span>{account.phone || "Nincs telefonszám"}</span>
                  </td>
                  <td>{roleLabels[account.role]}</td>
                  <td>
                    <div className="button-row">
                      <button
                        className="icon-button"
                        aria-label={`${account.email} profiljának kipróbálása`}
                        title="Profil kipróbálása"
                        onClick={() => {
                          session(account.id);
                          router.push(roleHome[account.role]);
                        }}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`${account.email} szerkesztése`}
                        onClick={() => open(account)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button danger-text"
                        aria-label={`${account.email} törlése`}
                        disabled={account.id === user!.id}
                        title={
                          account.id === user!.id
                            ? "A bejelentkezett adminfiókot nem törölheted."
                            : "Fiók törlése"
                        }
                        onClick={() => setDeleting(account)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon={<Search size={30} />}
          title="Nincs ilyen fiók."
          description="Próbálj másik nevet, e-mail-címet vagy szerepkört."
        />
      )}
      <p className="demo-footnote">
        A fiókok és jogosultságok ebben a böngészőben működnek. A demó nem küld
        meghívót vagy jelszó-visszaállító e-mailt. A saját adminisztrátori
        szerepköröd és fiókod itt nem törölhető.
      </p>
      {editor && (
        <Modal
          title={editing ? "Fiók szerkesztése" : "Új fiók létrehozása"}
          close={() => !busy && setEditor(null)}
        >
          <form className="modal-form stack-form" onSubmit={save}>
            <Field
              name="name"
              label="Teljes név"
              required
              maxLength={100}
              defaultValue={editing?.name || ""}
            />
            <Field
              name="email"
              label="E-mail-cím"
              type="email"
              required
              maxLength={150}
              defaultValue={editing?.email || ""}
            />
            <label className="field">
              <span>Szerepkör</span>
              <select
                aria-label="Szerepkör"
                value={role}
                disabled={editing?.id === user!.id}
                onChange={(event) => setRole(event.target.value as Role)}
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              name="phone"
              label="Mobiltelefonszám"
              type="tel"
              maxLength={25}
              defaultValue={editing?.phone || ""}
            />
            <Field
              name="city"
              label="Település"
              maxLength={100}
              defaultValue={editing?.city || ""}
            />
            {role === "partner" && (
              <>
                <Field
                  name="companyName"
                  label="Cégnév"
                  required
                  maxLength={120}
                  defaultValue={company?.name || ""}
                />
                <Field
                  name="companyTax"
                  label="Adószám"
                  maxLength={30}
                  defaultValue={company?.tax || ""}
                />
                <Field
                  name="companyCity"
                  label="Cég települése"
                  maxLength={100}
                  defaultValue={company?.city || ""}
                />
              </>
            )}
            <p className="muted small">
              Csak mintaadatokat adj meg. Ebben a demóban nem kell jelszó; a
              létrehozott fiókot a profil kipróbálása gombbal nyithatod meg.
            </p>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="panel-actions">
              <button
                className="text-button"
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Mégse
              </button>
              <button className="button" type="submit" disabled={busy}>
                {busy ? "Mentés…" : "Fiók mentése"} <Check size={17} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Törlöd a fiókot?" close={() => setDeleting(null)}>
          <div className="modal-form">
            <p className="muted">
              <strong>
                {deleting.name} · {deleting.email}
              </strong>
            </p>
            <p className="modal-intro">
              A fiókot, a hozzá tartozó mentett járműveket és céges adatokat
              töröljük. A korábbi foglalások a meglévő kapcsolattartási
              adatokkal, vendégfoglalásként megmaradnak.
            </p>
            <div className="panel-actions">
              <button className="text-button" onClick={() => setDeleting(null)}>
                Mégse
              </button>
              <button
                className="button danger"
                onClick={() => {
                  if (
                    change((state) => {
                      if (deleting.id === user!.id)
                        throw new Error(
                          "A jelenlegi adminfiókot nem törölheted.",
                        );
                      const companies = { ...state.companies };
                      delete companies[deleting.id];
                      return {
                        ...state,
                        users: state.users.filter(
                          (account) => account.id !== deleting.id,
                        ),
                        vehicles: state.vehicles.filter(
                          (vehicle) => vehicle.owner !== deleting.id,
                        ),
                        appointments: state.appointments.map((appointment) =>
                          appointment.owner === deleting.id
                            ? { ...appointment, owner: null }
                            : appointment,
                        ),
                        companies,
                      };
                    })
                  ) {
                    setDeleting(null);
                    notify(
                      "A fiókot töröltük. A korábbi foglalásokat megőriztük.",
                    );
                  }
                }}
              >
                Fiók végleges törlése <Trash2 size={17} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
