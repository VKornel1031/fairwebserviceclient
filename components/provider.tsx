"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  accountRequest,
  type Account,
  type AccountCapabilities,
} from "@/lib/accounts";
import type { GarageSummary } from "@/lib/vehicles";
import type { AppointmentSummary } from "@/lib/live-appointments";

type Resource<T> = { summary: T | null; loading: boolean; error: string };
function useResource<T extends { viewer?: string; ownerId?: string }>(
  path: string,
  viewer: string,
  key: string,
  enabled: boolean,
  event: string,
) {
  const [state, setState] = useState<Resource<T> & { key: string }>({
    key: "",
    summary: null,
    loading: false,
    error: "",
  });
  const epoch = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const revision = ++epoch.current;
    setState((old) => ({
      key,
      summary: old.key === key ? old.summary : null,
      loading: true,
      error: "",
    }));
    try {
      const result = await accountRequest<T>(path);
      if (revision !== epoch.current) return;
      if ((result.viewer ?? result.ownerId) !== viewer)
        throw new Error(
          "A bejelentkezett fiók megváltozott. Frissítsd az oldalt.",
        );
      setState({ key, summary: result, loading: false, error: "" });
    } catch (error) {
      if (revision === epoch.current)
        setState({
          key,
          summary: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Az adatok most nem tölthetők be.",
        });
    }
  }, [enabled, key, path, viewer]);
  useEffect(() => {
    void refresh();
    const focus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(focus, 60000);
    window.addEventListener("focus", focus);
    window.addEventListener(event, focus);
    return () => {
      ++epoch.current;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener(event, focus);
    };
  }, [refresh, event]);
  return {
    resource:
      enabled && state.key === key
        ? state
        : { summary: null, loading: enabled, error: "" },
    refresh,
  };
}

type Context = {
  user: Account | null;
  capabilities: AccountCapabilities;
  ready: boolean;
  sessionError: string;
  acceptAccount: (account: Account) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  notify: (message: string) => void;
  garage: Resource<GarageSummary>;
  refreshGarage: (broadcast?: boolean) => Promise<void>;
  appointments: Resource<AppointmentSummary>;
  refreshAppointments: () => Promise<void>;
  appointmentsChanged: () => void;
};
const PortalContext = createContext<Context>(null!);
export function usePortal() {
  return useContext(PortalContext);
}
export function Provider({
  children,
  workspace = true,
}: {
  children: ReactNode;
  workspace?: boolean;
}) {
  const [user, setUser] = useState<Account | null>(null);
  const [capabilities, setCapabilities] = useState<AccountCapabilities>({
    registration: false,
  });
  const [ready, setReady] = useState(false),
    [sessionError, setSessionError] = useState(""),
    [toast, setToast] = useState("");
  const epoch = useRef(0),
    channel = useRef<BroadcastChannel | null>(null);
  const viewer = user?.id || "guest",
    key = viewer + ":" + (user?.role || "guest");
  const garage = useResource<GarageSummary>(
    "/api/vehicles/summary",
    viewer,
    key,
    workspace && !!user,
    "fairauto-vehicles",
  );
  const appointments = useResource<AppointmentSummary>(
    "/api/appointments/summary",
    viewer,
    key,
    workspace && ready,
    "fairauto-appointments",
  );
  const refreshSession = useCallback(async () => {
    const revision = ++epoch.current;
    try {
      const result = await accountRequest<{
        user: Account | null;
        capabilities: AccountCapabilities;
      }>("/api/auth/session");
      if (revision !== epoch.current) return;
      setUser(result.user);
      setCapabilities(result.capabilities);
      setSessionError("");
    } catch (error) {
      if (revision !== epoch.current) return;
      setUser(null);
      setSessionError(
        error instanceof Error
          ? error.message
          : "A fiókszolgáltatás nem érhető el.",
      );
    } finally {
      if (revision === epoch.current) setReady(true);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.removeItem("fairauto-session-v1");
    } catch {}
    void refreshSession();
    const focus = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    const expired = () => {
      ++epoch.current;
      setUser(null);
      setSessionError("");
    };
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("fairauto-account");
      channel.current.onmessage = (event) => {
        if (event.data === "vehicles" || event.data === "appointments")
          window.dispatchEvent(new Event("fairauto-" + event.data));
        else void refreshSession();
      };
    }
    const timer = setInterval(focus, 60000);
    window.addEventListener("focus", focus);
    window.addEventListener("fairauto-session-expired", expired);
    return () => {
      ++epoch.current;
      clearInterval(timer);
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("focus", focus);
      window.removeEventListener("fairauto-session-expired", expired);
    };
  }, [refreshSession]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function acceptAccount(account: Account) {
    ++epoch.current;
    setUser(account);
    setSessionError("");
    setReady(true);
    channel.current?.postMessage("changed");
  }
  async function logout() {
    await accountRequest("/api/auth/logout", "POST");
    ++epoch.current;
    setUser(null);
    setSessionError("");
    channel.current?.postMessage("changed");
  }
  async function refreshGarage(broadcast = false) {
    if (broadcast) channel.current?.postMessage("vehicles");
    await garage.refresh();
  }
  function appointmentsChanged() {
    window.dispatchEvent(new Event("fairauto-appointments"));
    channel.current?.postMessage("appointments");
  }
  return (
    <PortalContext.Provider
      value={{
        user,
        capabilities,
        ready,
        sessionError,
        acceptAccount,
        refreshSession,
        logout,
        notify: setToast,
        garage: garage.resource,
        refreshGarage,
        appointments: appointments.resource,
        refreshAppointments: appointments.refresh,
        appointmentsChanged,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Értesítés bezárása" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </PortalContext.Provider>
  );
}
