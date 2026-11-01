import type { Role } from "./demo";

/** Safe account data returned to the browser. Never includes auth tokens. */
export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  reminders: boolean;
  role: Role;
  verified: boolean;
  active: boolean;
  protectedRoot: boolean;
  companyName: string;
  companyTax: string;
  companyCity: string;
  partnerRequested: boolean;
  setupReady: boolean;
  avatar: string;
  defaultVehicle: string;
};
export type AccountCapabilities = { registration: boolean };

export async function accountRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers:
      method === "GET" || body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (data?.code === "session_expired" && typeof window !== "undefined")
      window.dispatchEvent(new Event("fairauto-session-expired"));
    throw new Error(
      data?.error || "A fiókművelet most nem érhető el. Próbáld újra.",
    );
  }
  return data as T;
}
