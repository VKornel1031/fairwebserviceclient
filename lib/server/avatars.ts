import "server-only";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import {
  AVATAR_IMAGE_TYPES,
  AVATAR_STORED_LIMIT,
  AVATAR_UPLOAD_LIMIT,
} from "../avatar";
import { AccountError, json, readLimitedBody, throttle } from "./http";
import {
  account,
  pb,
  pbImage,
  PocketBaseError,
  requireSession,
  type Session,
} from "./pocketbase";
import type { Account } from "../accounts";

async function avatarPolicy(session: Session) {
  try {
    const result = await pb<{ ready: boolean }>(
      "/api/fairauto/account/avatar-policy",
      "GET",
      undefined,
      session.token,
    );
    return result.ready === true;
  } catch (error) {
    if (error instanceof PocketBaseError && error.status === 404) return false;
    throw error;
  }
}
async function requireAvatarPolicy(session: Session) {
  if (!(await avatarPolicy(session)))
    throw new AccountError(
      503,
      "A profilképkezelés beállítása folyamatban van. Kérjük, jelezd az üzemeltetőnek.",
      "avatar_setup_required",
    );
}
export async function getAvatarPolicy() {
  const session = await requireSession();
  return json({
    ready: await avatarPolicy(session),
    maximumBytes: AVATAR_UPLOAD_LIMIT,
  });
}
async function normaliseImage(input: Buffer) {
  try {
    const image = sharp(input, {
      limitInputPixels: 20_000_000,
      pages: 1,
      failOn: "error",
    });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format))
      throw new Error("Unsupported image");
    // Sharp strips EXIF/location metadata by default; store a small static WebP only.
    const output = await image
      .rotate()
      .resize(512, 512, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    if (output.length > AVATAR_STORED_LIMIT) throw new Error("Image too large");
    return output;
  } catch {
    throw new AccountError(
      400,
      "Nem olvasható a kép. JPG, PNG vagy WebP fájlt válassz, legfeljebb 20 megapixeles méretben.",
    );
  }
}
export async function uploadAvatar(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "avatar-write", session.user.id, 12);
  await requireAvatarPolicy(session);
  const type = request.headers.get("content-type") || "";
  if (!/^multipart\/form-data\s*;/i.test(type))
    throw new AccountError(415, "Képfájlt válassz a feltöltéshez.");
  const limit = AVATAR_UPLOAD_LIMIT + 16_384;
  if (Number(request.headers.get("content-length")) > limit)
    throw new AccountError(413, "A kép legfeljebb 2 MB lehet.");
  const bytes = await readLimitedBody(request.body, limit);
  let form: FormData;
  try {
    form = await new Request("http://avatar-upload.invalid", {
      method: "POST",
      headers: { "Content-Type": type },
      body: new Uint8Array(bytes),
    }).formData();
  } catch {
    throw new AccountError(400, "Hibás feltöltési kérés.");
  }
  const entries = [...form.entries()];
  if (entries.length !== 1 || entries[0][0] !== "avatar")
    throw new AccountError(400, "Csak egy profilkép tölthető fel.");
  const file = entries[0][1];
  if (!(file instanceof File) || file.size === 0)
    throw new AccountError(400, "Válassz egy képfájlt.");
  if (file.size > AVATAR_UPLOAD_LIMIT)
    throw new AccountError(413, "A kép legfeljebb 2 MB lehet.");
  if (!(AVATAR_IMAGE_TYPES as readonly string[]).includes(file.type))
    throw new AccountError(415, "JPG, PNG vagy WebP képet válassz.");
  const image = await normaliseImage(Buffer.from(await file.arrayBuffer()));
  const upload = new FormData();
  upload.set(
    "avatar",
    new Blob([new Uint8Array(image)], { type: "image/webp" }),
    "avatar.webp",
  );
  const result = await pb<Record<string, unknown>>(
    `/api/collections/users/records/${session.user.id}`,
    "PATCH",
    upload,
    session.token,
  );
  return json({ user: account(result) });
}
export async function deleteAvatar(request: NextRequest) {
  const session = await requireSession();
  throttle(request, "avatar-write", session.user.id, 12);
  await requireAvatarPolicy(session);
  const result = await pb<Record<string, unknown>>(
    `/api/collections/users/records/${session.user.id}`,
    "PATCH",
    { avatar: "" },
    session.token,
  );
  return json({ user: account(result) });
}
export async function getAvatar(request: NextRequest, id?: string) {
  const session = await requireSession(id !== undefined);
  throttle(request, "avatar-read", session.user.id, 600, 6000);
  await requireAvatarPolicy(session);
  let target: Account = session.user;
  if (id !== undefined) {
    if (!/^[a-z0-9]{15}$/.test(id))
      throw new AccountError(400, "Érvénytelen fiókazonosító.");
    try {
      target = account(
        await pb(
          `/api/collections/users/records/${id}`,
          "GET",
          undefined,
          session.token,
        ),
      );
    } catch (error) {
      if (error instanceof PocketBaseError && error.status === 404)
        throw new AccountError(404, "Nincs profilkép.");
      throw error;
    }
  }
  if (!target.avatar) throw new AccountError(404, "Nincs profilkép.");
  const token = await pb<{ token: string }>(
    "/api/files/token",
    "POST",
    undefined,
    session.token,
  );
  if (
    typeof token.token !== "string" ||
    !/^[A-Za-z0-9._-]{16,4096}$/.test(token.token)
  )
    throw new AccountError(503, "A profilkép most nem tölthető be.");
  let image: Response;
  try {
    image = await pbImage(
      `/api/files/users/${target.id}/${encodeURIComponent(target.avatar)}?${new URLSearchParams({ token: token.token })}`,
    );
  } catch (error) {
    if (error instanceof PocketBaseError && [403, 404].includes(error.status))
      throw new AccountError(404, "Nincs profilkép.");
    throw error;
  }
  const buffer = await readLimitedBody(image.body, AVATAR_UPLOAD_LIMIT);
  const output = await normaliseImage(buffer);
  return new NextResponse(new Uint8Array(output), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": "inline; filename=avatar.webp",
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
