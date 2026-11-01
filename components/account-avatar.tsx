"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Trash2, UserRound } from "lucide-react";
import { accountRequest, type Account } from "@/lib/accounts";
import { AVATAR_IMAGE_TYPES, AVATAR_UPLOAD_LIMIT } from "@/lib/avatar";
import { usePortal } from "./provider";

export function AccountAvatar({
  user,
  className = "avatar",
}: {
  user: Account | null;
  className?: string;
}) {
  const { user: viewer } = usePortal();
  const [failed, setFailed] = useState("");
  const source = user?.avatar
    ? `${viewer?.id === user.id ? "/api/account/avatar" : `/api/admin/accounts/${encodeURIComponent(user.id)}/avatar`}?v=${encodeURIComponent(user.id + ":" + user.avatar)}`
    : "";
  return (
    <span className={className} aria-hidden="true">
      {source && failed !== source ? (
        <img src={source} alt="" onError={() => setFailed(source)} />
      ) : user ? (
        user.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
      ) : (
        <UserRound size={17} />
      )}
    </span>
  );
}

export function AvatarEditor({
  disabled = false,
  onBusyChange,
}: {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { user, acceptAccount, notify } = usePortal();
  const input = useRef<HTMLInputElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    accountRequest<{ ready: boolean }>(
      "/api/account/avatar/policy",
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setEnabled(result.ready);
      })
      .catch(() => {
        if (!controller.signal.aborted) setEnabled(false);
      });
    return () => controller.abort();
  }, [user!.id]);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function clearSelection() {
    setFile(null);
    if (input.current) input.current.value = "";
  }
  function select(next: File | undefined) {
    setError("");
    clearSelection();
    if (!next) return;
    if (!(AVATAR_IMAGE_TYPES as readonly string[]).includes(next.type)) {
      setError("JPG, PNG vagy WebP képet válassz.");
      return;
    }
    if (next.size > AVATAR_UPLOAD_LIMIT) {
      setError("A kép legfeljebb 2 MB lehet.");
      return;
    }
    setFile(next);
  }
  async function save(remove = false) {
    if (disabled || busy || (!remove && !file)) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const form = new FormData();
      if (file && !remove) form.set("avatar", file);
      const result = await accountRequest<{ user: Account }>(
        "/api/account/avatar",
        remove ? "DELETE" : "PUT",
        remove ? undefined : form,
      );
      clearSelection();
      acceptAccount(result.user);
      notify(
        remove
          ? "A profilképedet eltávolítottuk."
          : "A profilképedet elmentettük.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni a profilképet.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <section className="avatar-editor" aria-label="Profilkép kezelése">
      {preview ? (
        <span className="avatar avatar-editor-image">
          <img src={preview} alt="Kiválasztott profilkép előnézete" />
        </span>
      ) : (
        <AccountAvatar user={user} className="avatar avatar-editor-image" />
      )}
      <div className="avatar-editor-controls">
        <h3>Profilkép</h3>
        <p className="small muted">JPG, PNG vagy WebP · legfeljebb 2 MB.</p>
        <input
          ref={input}
          className="sr-only"
          aria-label="Profilkép kiválasztása"
          type="file"
          accept={AVATAR_IMAGE_TYPES.join(",")}
          disabled={disabled || busy || !enabled}
          onChange={(event) => select(event.target.files?.[0])}
        />
        <div className="button-row">
          <button
            type="button"
            className="button button-outline"
            disabled={disabled || busy || !enabled}
            onClick={() => input.current?.click()}
          >
            <Camera size={15} />
            {user!.avatar || file ? "Másik kép" : "Kép feltöltése"}
          </button>
          {file ? (
            <>
              <button
                type="button"
                className="button"
                disabled={disabled || busy}
                onClick={() => {
                  void save();
                }}
              >
                <Check size={15} />
                {busy ? "Mentés…" : "Kép mentése"}
              </button>
              <button
                type="button"
                className="text-button"
                disabled={disabled || busy}
                onClick={clearSelection}
              >
                Mégse
              </button>
            </>
          ) : (
            user!.avatar && (
              <button
                type="button"
                className="text-button"
                disabled={disabled || busy || !enabled}
                onClick={() => {
                  void save(true);
                }}
              >
                <Trash2 size={15} />
                Eltávolítás
              </button>
            )
          )}
        </div>
        {enabled === false && (
          <p className="small muted">
            A profilképkezelés beállítása folyamatban van.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
