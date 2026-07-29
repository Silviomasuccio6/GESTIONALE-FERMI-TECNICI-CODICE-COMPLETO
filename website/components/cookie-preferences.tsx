"use client";

import { useEffect, useRef, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
} from "../lib/public-api";

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function CookiePreferences() {
  const [isReady, setIsReady] = useState(false);
  const [hasSavedPreferences, setHasSavedPreferences] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<"banner" | "trigger">("banner");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(
          COOKIE_CONSENT_STORAGE_KEY,
        );
        if (stored) {
          const parsed = JSON.parse(stored) as CookiePreferences;
          setAnalytics(Boolean(parsed.analytics));
          setHasSavedPreferences(true);
        }
      } catch {
        // A blocked storage API leaves optional cookies disabled.
      } finally {
        setIsReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isCustomizing) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    queueMicrotask(() => dialogRef.current?.focus());

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCustomizing(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnFocusTarget = returnFocusRef.current;
      queueMicrotask(() => {
        document
          .querySelector<HTMLButtonElement>(
            `[data-cookie-return-focus="${returnFocusTarget}"]`,
          )
          ?.focus();
      });
    };
  }, [isCustomizing]);

  function openPreferences(source: "banner" | "trigger") {
    returnFocusRef.current = source;
    setIsCustomizing(true);
  }

  function save(nextAnalytics: boolean, nextMarketing: boolean) {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: nextAnalytics,
      marketing: nextMarketing,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify(preferences),
      );
    } catch {
      // Preferences still apply to this local in-memory session.
    }

    setAnalytics(nextAnalytics);
    setHasSavedPreferences(true);
    setIsCustomizing(false);
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_EVENT, {
        detail: preferences,
      }),
    );
  }

  if (!isReady) return null;

  return (
    <>
      {!hasSavedPreferences && !isCustomizing && (
        <section
          className="cookie-banner"
          aria-label="Preferenze cookie"
          aria-live="polite"
        >
          <div>
            <strong>Sei tu a scegliere cosa misurare.</strong>
            <p>
              I cookie necessari sono sempre attivi. Le statistiche Fleetum
              restano disattivate finché non le autorizzi. Non utilizziamo
              strumenti di marketing in questa fase.
            </p>
            <a href="/cookie">Leggi la Cookie Policy</a>
          </div>
          <div className="cookie-actions">
            <button type="button" onClick={() => save(false, false)}>
              Rifiuta non necessari
            </button>
            <button
              data-cookie-return-focus="banner"
              type="button"
              onClick={() => openPreferences("banner")}
            >
              Personalizza
            </button>
            <button
              className="cookie-accept"
              type="button"
              onClick={() => save(true, false)}
            >
              Accetta Analytics
            </button>
          </div>
        </section>
      )}

      {isCustomizing && (
        <div className="cookie-dialog-backdrop">
          <section
            className="cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-dialog-title"
            aria-describedby="cookie-dialog-description"
            ref={dialogRef}
            tabIndex={-1}
          >
            <span>Preferenze privacy</span>
            <h2 id="cookie-dialog-title">Scegli quali categorie autorizzare.</h2>
            <p id="cookie-dialog-description">
              Le statistiche first-party Fleetum vengono inviate solo dopo il
              consenso e usano identificatori pseudonimi. La scelta viene
              memorizzata in questo browser.
            </p>
            <div className="cookie-options">
              <label>
                <span>
                  <strong>Necessari</strong>
                  <small>Preferenze essenziali e sicurezza.</small>
                </span>
                <input type="checkbox" checked disabled />
              </label>
              <label>
                <span>
                  <strong>Analytics</strong>
                  <small>
                    Misurazione first-party pseudonima, solo dopo consenso.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
              </label>
              <label aria-disabled="true">
                <span>
                  <strong>Marketing</strong>
                  <small>Non utilizzato: nessun tracciamento marketing attivo.</small>
                </span>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                />
              </label>
            </div>
            <div className="cookie-actions">
              {hasSavedPreferences && (
                <button type="button" onClick={() => setIsCustomizing(false)}>
                  Annulla
                </button>
              )}
              <button
                className="cookie-accept"
                type="button"
                onClick={() => save(analytics, false)}
              >
                Salva preferenze
              </button>
            </div>
          </section>
        </div>
      )}

      {hasSavedPreferences && !isCustomizing && (
        <button
          data-cookie-return-focus="trigger"
          className="cookie-preferences-trigger"
          type="button"
          onClick={() => openPreferences("trigger")}
        >
          Preferenze cookie
        </button>
      )}
    </>
  );
}
