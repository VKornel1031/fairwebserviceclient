"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePortal } from "./provider";
import { Modal, PageHeading } from "./ui";
import { Empty, Field } from "./fields";
import { accountRequest, type Account } from "@/lib/accounts";
import { roleLabels } from "@/lib/permissions";
import type { Role } from "@/lib/demo";
import { AccountAvatar } from "./account-avatar";

import MailStatusPanel from "./mail-status";

type Listing = {
  items: Account[];
  totalItems: number;
  totalPages: number;
  page: number;
};
export default function Administration() {
  const { user, notify } = usePortal();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [editor, setEditor] = useState<{ account: Account | null } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const permitted = user?.role === "admin" && user.setupReady;
  useEffect(() => {
    setListing(null);
    if (!permitted) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    accountRequest<Listing>(
      `/api/admin/accounts?${new URLSearchParams({ q: search, page: String(page) })}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setListing(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Nem tölthetők be a fiókok.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [permitted, user?.id, page, search, revision]);
  async function save(event: FormEvent<HTMLFormElement>, remove = false) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(data);
    if (!remove) payload.active = data.get("active") === "on";
    if (!payload.password) {
      delete payload.password;
      delete payload.passwordConfirm;
    }
    const target = remove ? deleting : editor?.account;
    setBusy(true);
    setFormError("");
    try {
      await accountRequest(
        `/api/admin/accounts${target ? `/${target.id}` : ""}`,
        remove ? "DELETE" : target ? "PATCH" : "POST",
        payload,
      );
      form.reset();
      setEditor(null);
      setDeleting(null);
      setRevision((value) => value + 1);
      notify(
        remove
          ? "A fiókot töröltük."
          : "A fiókot elmentettük. A jogosultságok a következő ellenőrzéskor frissülnek.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Nem sikerült a módosítás.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADMINISZTRÁCIÓ"
        title="Fiókok és jogosultságok."
        description="Ügyfelek, partnerek és munkatársak hozzáférése egy helyen."
        action={
          permitted ? (
            <button
              className="button"
              onClick={() => {
                setFormError("");
                setEditor({ account: null });
              }}
            >
              <Plus size={17} />
              Új fiók
            </button>
          ) : undefined
        }
      />
      {permitted && <MailStatusPanel key={user?.id} />}
      {!permitted ? (
        <Empty
          icon={<ShieldCheck size={32} />}
          title={
            user?.role === "admin"
              ? "A fiókkezelés beállítása szükséges."
              : "Ez az adminisztrátor munkaterülete."
          }
          description={
            user?.role === "admin"
              ? "Alkalmazd a repóban található PocketBase migrációt a fiókkezelés engedélyezéséhez."
              : "A fiókok kezeléséhez adminisztrátori hozzáférés szükséges."
          }
        >
          <Link className="button" href="/fiok">
            Saját fiók
          </Link>
        </Empty>
      ) : (
        <section className="panel">
          <form
            className="account-search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query);
              setPage(1);
            }}
          >
            <Field
              label="Fiókok keresése"
              type="search"
              placeholder="Név vagy e-mail-cím"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={100}
            />
            <button className="button button-outline">
              <Search size={16} />
              Keresés
            </button>
          </form>
          {error && (
            <p role="alert" className="form-error">
              {error}
              <button
                className="text-button"
                onClick={() => setRevision((value) => value + 1)}
              >
                Újrapróbálás
              </button>
            </p>
          )}
          {loading && (
            <p role="status" className="muted">
              Fiókok betöltése…
            </p>
          )}
          {listing && (
            <>
              <p className="small muted">{listing.totalItems} fiók</p>
              <div className="account-table-wrap">
                <table className="account-table">
                  <thead>
                    <tr>
                      <th>Név és e-mail-cím</th>
                      <th>Szerepkör</th>
                      <th>Állapot</th>
                      <th>
                        <span className="sr-only">Műveletek</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {listing.items.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="account-person">
                            <AccountAvatar user={account} />
                            <div>
                              <strong>{account.name}</strong>
                              <small className="block muted">
                                {account.email || "Rejtett e-mail-cím"}
                              </small>
                              {account.companyName && (
                                <small className="block muted">
                                  {account.companyName}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{roleLabels[account.role]}</td>
                        <td>
                          {account.active ? "Aktív" : "Letiltva"}
                          {account.protectedRoot && (
                            <small className="block muted">Védett admin</small>
                          )}
                        </td>
                        <td>
                          {account.id === user!.id ? (
                            <Link href="/fiok" className="text-link">
                              Saját fiók
                            </Link>
                          ) : (
                            !account.protectedRoot && (
                              <div className="button-row">
                                <button
                                  className="icon-button"
                                  aria-label={`${account.name} szerkesztése`}
                                  onClick={() => {
                                    setFormError("");
                                    setEditor({ account });
                                  }}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`${account.name} törlése`}
                                  onClick={() => {
                                    setFormError("");
                                    setDeleting(account);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!listing.items.length && (
                <p className="muted">Nincs a keresésnek megfelelő fiók.</p>
              )}
              <div className="panel-actions">
                <button
                  className="text-button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft size={16} />
                  Előző
                </button>
                <span className="muted">
                  {page} / {Math.max(1, listing.totalPages)}
                </span>
                <button
                  className="text-button"
                  disabled={page >= listing.totalPages || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Következő
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {editor && (
        <Modal
          title={editor.account ? "Fiók szerkesztése" : "Új fiók létrehozása"}
          close={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form className="modal-form" onSubmit={(event) => save(event)}>
            <fieldset disabled={busy} className="account-fieldset">
              <div className="form-grid">
                <Field
                  label="Teljes név"
                  name="name"
                  defaultValue={editor.account?.name}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="off"
                />
                <Field
                  label="E-mail-cím"
                  name="email"
                  defaultValue={editor.account?.email}
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="off"
                />
                <Field
                  label="Mobiltelefonszám"
                  name="phone"
                  defaultValue={editor.account?.phone}
                  maxLength={25}
                  type="tel"
                />
                <Field
                  label="Település"
                  name="city"
                  defaultValue={editor.account?.city}
                  maxLength={100}
                />
                <div className="field">
                  <label className="field-label" htmlFor="account-role">
                    Szerepkör
                  </label>
                  <select
                    name="role"
                    id="account-role"
                    defaultValue={editor.account?.role || "partner"}
                  >
                    {(Object.keys(roleLabels) as Role[]).map((role) => (
                      <option value={role} key={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editor.account?.active ?? true}
                  />
                  <span>Aktív fiók</span>
                </label>
                <Field
                  label="Cégnév"
                  name="companyName"
                  defaultValue={editor.account?.companyName}
                  maxLength={120}
                />
                <Field
                  label="Adószám"
                  name="companyTax"
                  defaultValue={editor.account?.companyTax}
                  maxLength={30}
                  hint="Céges partnerhez a cégnév és az adószám kötelező."
                />
                <Field
                  label="Cég települése"
                  name="companyCity"
                  defaultValue={editor.account?.companyCity}
                  maxLength={100}
                />
              </div>
              <details className="account-details" open={!editor.account}>
                <summary>
                  {editor.account
                    ? "Új jelszó beállítása (opcionális)"
                    : "Kezdeti jelszó"}
                </summary>
                <div className="form-grid">
                  <Field
                    name="password"
                    label="Fiók új jelszava"
                    type="password"
                    autoComplete="new-password"
                    required={!editor.account}
                    minLength={12}
                    maxLength={64}
                  />
                  <Field
                    name="passwordConfirm"
                    label="Fiók új jelszava ismét"
                    type="password"
                    autoComplete="new-password"
                    required={!editor.account}
                    minLength={12}
                    maxLength={64}
                  />
                </div>
              </details>
              <Field
                name="adminPassword"
                label="Saját adminjelszavad"
                type="password"
                autoComplete="current-password"
                required
                hint="A módosításhoz erősítsd meg a saját jelszavadat."
              />
              {formError && (
                <p role="alert" className="form-error">
                  {formError}
                </p>
              )}
              <div className="panel-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setEditor(null)}
                >
                  Mégse
                </button>
                <button className="button">
                  {busy ? "Mentés…" : "Fiók mentése"}
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Fiók törlése"
          close={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <form className="modal-form" onSubmit={(event) => save(event, true)}>
            <fieldset disabled={busy} className="account-fieldset">
              <p>
                <strong>{deleting.name}</strong> fiókjának törlése végleges. A
                felhasználó nem tud többé belépni.
              </p>
              <p className="muted">
                A megerősítéshez írd be ezt az e-mail-címet: {deleting.email}
              </p>
              <Field
                name="confirmEmail"
                label="Törlendő fiók e-mail-címe"
                type="email"
                required
                autoComplete="off"
              />
              <Field
                name="adminPassword"
                label="Saját adminjelszavad"
                type="password"
                required
                autoComplete="current-password"
              />
              {formError && (
                <p role="alert" className="form-error">
                  {formError}
                </p>
              )}
              <div className="panel-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setDeleting(null)}
                >
                  Mégse
                </button>
                <button className="button danger">Fiók végleges törlése</button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
    </>
  );
}
