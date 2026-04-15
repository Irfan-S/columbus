"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development: unregister any previously-installed SW and clear its caches.
    // The SW caches _next/static/*.js which aren't content-hashed in dev, so it
    // will happily serve you stale JS bundles across reloads (code changes vanish,
    // map assets render monochrome, etc.).
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — not critical
    });
  }, []);

  return null;
}
