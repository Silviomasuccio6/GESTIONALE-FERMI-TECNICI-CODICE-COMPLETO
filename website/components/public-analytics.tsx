"use client";

import { useEffect, useRef } from "react";
import {
  type FleetumEventName,
  trackPublicEvent,
} from "../lib/public-analytics";

function eventNameForPath(pathname: string): FleetumEventName {
  return pathname === "/prezzi" ? "pricing_view" : "page_view";
}

export function PublicAnalytics() {
  const lastPath = useRef("");

  useEffect(() => {
    function trackPage() {
      if (lastPath.current === window.location.pathname) return;
      lastPath.current = window.location.pathname;
      trackPublicEvent(eventNameForPath(window.location.pathname));
    }

    function trackClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tracked = target.closest<HTMLElement>("[data-track]");
      if (!tracked) return;

      const eventName = tracked.dataset.track as
        | FleetumEventName
        | undefined;
      if (!eventName) return;

      const metadata = Object.fromEntries(
        Object.entries(tracked.dataset)
          .filter(([key]) => key !== "track")
          .map(([key, value]) => [key, value ?? ""]),
      );
      trackPublicEvent(eventName, metadata);
    }

    trackPage();
    window.addEventListener("popstate", trackPage);
    document.addEventListener("click", trackClick);
    return () => {
      window.removeEventListener("popstate", trackPage);
      document.removeEventListener("click", trackClick);
    };
  }, []);

  return null;
}
