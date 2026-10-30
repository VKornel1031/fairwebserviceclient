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
  STORE_KEY,
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
  notify: (text: string) => void;
};
const PortalContext = createContext<Context>(null!);
export function usePortal() {
  return useContext(PortalContext);
}
export function Provider({ children }: { children: ReactNode }) {
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
      if (!localStorage.getItem(STORE_KEY)) writeStore(s);
      setStore(s);
      setUserId(localStorage.getItem(SESSION_KEY));
    } catch {
      setToast(
        "A böngésző tárhelye nem érhető el vagy sérült. A mentéshez engedélyezd a helyi tárhelyet.",
      );
    }
    setReady(true);
    const sync = () => {
      try {
        setStore(readStore());
        setUserId(localStorage.getItem(SESSION_KEY));
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
  }, []);
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
    session(`demo-${role}`);
    notify("Demónézet megnyitva. Kizárólag helyi mintaadatokat használsz.");
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
