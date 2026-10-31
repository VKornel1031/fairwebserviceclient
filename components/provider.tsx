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
  initialStore,
  readStore,
  writeStore,
  SESSION_KEY,
  type Store,
} from "@/lib/demo";
import {
  accountRequest,
  type Account,
  type AccountCapabilities,
} from "@/lib/accounts";

type Context = {
  store: Store;
  user: Account | null;
  capabilities: AccountCapabilities;
  ready: boolean;
  sessionError: string;
  acceptAccount: (account: Account) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  mutate: (fn: (s: Store) => Store) => boolean;
  notify: (text: string) => void;
};
const PortalContext = createContext<Context>(null!);
export function usePortal() {
  return useContext(PortalContext);
}

export function Provider({
  children,
  initializeDemo = true,
}: {
  children: ReactNode;
  initializeDemo?: boolean;
}) {
  const [store, setStore] = useState<Store>(initialStore);
  const [user, setUser] = useState<Account | null>(null);
  const [capabilities, setCapabilities] = useState<AccountCapabilities>({
    registration: false,
  });
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [toast, setToast] = useState("");
  const epoch = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
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
    // Old local demo identities can never establish a real account session.
    try {
      localStorage.removeItem(SESSION_KEY);
      const saved = readStore();
      if (initializeDemo) writeStore(saved);
      setStore(saved);
    } catch {
      setToast("A böngésző helyi demótárhelye nem érhető el.");
    }
    void refreshSession();
    const sync = () => {
      try {
        setStore(readStore());
      } catch {}
    };
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
      channel.current.onmessage = () => {
        void refreshSession();
      };
    }
    const timer = setInterval(focus, 60_000);
    window.addEventListener("focus", focus);
    window.addEventListener("storage", sync);
    window.addEventListener("fairauto-store", sync);
    window.addEventListener("fairauto-session-expired", expired);
    return () => {
      ++epoch.current;
      clearInterval(timer);
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("focus", focus);
      window.removeEventListener("storage", sync);
      window.removeEventListener("fairauto-store", sync);
      window.removeEventListener("fairauto-session-expired", expired);
    };
  }, [initializeDemo, refreshSession]);
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
  function mutate(fn: (s: Store) => Store) {
    if (user) {
      setToast(
        "A foglalások és járművek adatbázisos kezelése a következő lépés. A fiókadatok a Saját fiók oldalon menthetők.",
      );
      return false;
    }
    try {
      const next = fn(readStore());
      writeStore(next);
      setStore(next);
      return true;
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Nem sikerült menteni a módosítást.",
      );
      return false;
    }
  }
  return (
    <PortalContext.Provider
      value={{
        store: user
          ? {
              version: 1,
              rolesRevision: 2,
              users: [user],
              vehicles: [],
              appointments: [],
              blockedDates: [],
              companies: {
                [user.id]: {
                  name: user.companyName,
                  tax: user.companyTax,
                  city: user.companyCity,
                },
              },
            }
          : store,
        user,
        ready,
        capabilities,
        sessionError,
        acceptAccount,
        refreshSession,
        logout,
        mutate,
        notify: setToast,
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
