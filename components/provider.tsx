"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  initialStore,
  readStore,
  writeStore,
  SESSION_KEY,
  type Store,
  type User,
  type Role,
} from "@/lib/demo";
type Context = {
  store: Store;
  user: User | null;
  ready: boolean;
  mutate: (fn: (s: Store) => Store) => boolean;
  session: (id: string | null) => void;
  demo: (role: Role) => void;
  resetDemo: () => boolean;
  notify: (text: string) => void;
};
function savedSession(store: Store) {
  const previous = localStorage.getItem(SESSION_KEY);
  const current = previous === "demo-staff" ? "demo-reception" : previous;
  if (current && !store.users.some((user) => user.id === current)) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  if (current && current !== previous)
    localStorage.setItem(SESSION_KEY, current);
  return current;
}
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
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  function notify(text: string) {
    setToast(text);
  }
  useEffect(() => {
    try {
      const s = readStore();
      if (initializeDemo) writeStore(s);
      setStore(s);
      setUserId(savedSession(s));
    } catch {
      setToast(
        "A böngésző tárhelye nem érhető el vagy sérült. A mentéshez engedélyezd a helyi tárhelyet.",
      );
    }
    setReady(true);
    const sync = () => {
      try {
        const next = readStore();
        setStore(next);
        setUserId(savedSession(next));
      } catch {
        setToast("A mentett adatok nem tölthetők be.");
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("fairauto-store", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("fairauto-store", sync);
    };
  }, [initializeDemo]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  function mutate(fn: (s: Store) => Store) {
    try {
      const next = fn(readStore());
      writeStore(next);
      setStore(next);
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Nem sikerült menteni a módosítást.",
      );
      return false;
    }
  }
  function session(id: string | null) {
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
      setUserId(id);
    } catch {
      notify("A bejelentkezéshez engedélyezd a böngésző tárhelyét.");
    }
  }
  function demo(role: Role) {
    const account =
      store.users.find(
        (account) => account.id === `demo-${role}` && account.role === role,
      ) || store.users.find((account) => account.role === role);
    if (!account) {
      notify(
        "Ez a mintafiók már nem elérhető. Az admin kezelheti a fiókokat, vagy újrakezdheted a demót.",
      );
      return;
    }
    session(account.id);
    notify("Demónézet megnyitva. Kizárólag helyi mintaadatokat használsz.");
  }
  function resetDemo() {
    try {
      const next = initialStore();
      localStorage.removeItem(SESSION_KEY);
      writeStore(next);
      setStore(next);
      setUserId(null);
      notify("A mintaadatokat visszaállítottuk. Újra kipróbálhatod a demót.");
      return true;
    } catch {
      notify(
        "A demó nem állítható vissza. Ellenőrizd a böngésző helyi tárhelyét.",
      );
      return false;
    }
  }
  return (
    <PortalContext.Provider
      value={{
        store,
        user: store.users.find((u) => u.id === userId) || null,
        ready,
        mutate,
        session,
        demo,
        resetDemo,
        notify,
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
