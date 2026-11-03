"use client";

import { useEffect } from "react";

/** Refresh visible views without overlapping reads or replacing their local UI state. */
export function useLiveRefresh(
  load: (signal: AbortSignal) => Promise<void>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let current: AbortController | null = null;
    let queued = false;
    const refresh = async (queue = false) => {
      if (disposed) return;
      if (current) {
        queued ||= queue;
        return;
      }
      current = new AbortController();
      try {
        await load(current.signal);
      } finally {
        current = null;
        if (queued && !disposed) {
          queued = false;
          if (document.visibilityState === "visible") void refresh();
        }
      }
    };
    const visible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    void refresh();
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("fairauto-appointments", visible);
    return () => {
      disposed = true;
      current?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("fairauto-appointments", visible);
    };
  }, [load, enabled]);
}
