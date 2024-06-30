"use client";

import { useEffect } from "react";

export const ServiceWorkerInstaller = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) =>
          console.log("service worker scope is: ", registration.scope),
        );
    }
  }, []);
  return null;
};
