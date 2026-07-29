"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { primaryNav, type PrimaryNavItem } from "../lib/site-data";

function subscribeToPathname(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getPathname() {
  return window.location.pathname;
}

function isCurrentPath(pathname: string, item: PrimaryNavItem) {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return Boolean(
    item.activePaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ),
  );
}

export function SiteNavigation() {
  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathname,
    () => "",
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <>
      <nav className="desktop-nav" aria-label="Navigazione principale">
        {primaryNav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={isCurrentPath(pathname, item) ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <button
        className="mobile-menu-button"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onClick={() => setMenuOpen((current) => !current)}
      >
        {menuOpen ? "Chiudi" : "Menu"}
      </button>

      <nav
        className={menuOpen ? "mobile-menu is-open" : "mobile-menu"}
        id="mobile-menu"
        aria-label="Navigazione mobile"
      >
        {primaryNav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={isCurrentPath(pathname, item) ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </a>
        ))}
        <a
          href="/accesso"
          aria-current={pathname === "/accesso" ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span>Accedi</span>
          <small>Passa dall’area pubblica al gestionale</small>
        </a>
        <a
          href="/demo"
          aria-current={pathname === "/demo" ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span>Prenota demo 20 min</span>
          <small>Partiamo dal processo del tuo autonoleggio</small>
        </a>
        <a
          className="mobile-menu-demo"
          href="/tour"
          aria-current={pathname === "/tour" ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <span>Guarda la demo interattiva</span>
          <small>Esplora Fleetum senza lasciare dati</small>
        </a>
      </nav>

    </>
  );
}

export function MobileStickyCta() {
  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getPathname,
    () => "",
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > Math.min(window.innerHeight * 0.55, 460));
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  if (pathname === "/demo" || pathname === "/tour") return null;

  return (
    <a
      className={isVisible ? "mobile-sticky-cta is-visible" : "mobile-sticky-cta"}
      href="/tour"
      data-track="hero_cta_click"
      data-location="mobile_sticky"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      Guarda la demo
    </a>
  );
}
