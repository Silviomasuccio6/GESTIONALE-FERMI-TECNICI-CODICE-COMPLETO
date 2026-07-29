/* eslint-disable @next/next/no-img-element -- Fleetum logo files are pre-optimized WebP assets with intrinsic dimensions. */
import { MobileStickyCta, SiteNavigation } from "./site-navigation";

export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Vai al contenuto
      </a>
      <header className="site-header">
        {/* vinext uses native anchors for reliable local RSC navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="brand" href="/" aria-label="Fleetum, torna alla home">
          <img
            src="/brand/fleetum-logo-header.webp"
            alt="Fleetum"
            width="270"
            height="70"
          />
        </a>

        <SiteNavigation />

        <div className="header-actions">
          <a className="login-link" href="/accesso">
            Accedi
          </a>
          <a
            className="button button-small"
            href="/demo"
            data-track="hero_cta_click"
            data-location="header"
          >
            Prenota demo 20 min <Arrow />
          </a>
        </div>
      </header>
      <MobileStickyCta />

    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="global-footer">
      <div className="global-footer-main">
        <div className="footer-brand">
          <img
            src="/brand/fleetum-logo-on-light.webp"
            alt="Fleetum"
            width="320"
            height="95"
          />
          <p>
            Il sistema operativo per booking, contratti, flotta e redditività
            degli autonoleggi moderni.
          </p>
          <a className="inline-link" href="/tour">
            Guarda la demo interattiva <Arrow />
          </a>
        </div>

        <div className="footer-column">
          <strong>Prodotto</strong>
          <a href="/prodotto">Software autonoleggio</a>
          <a href="/moduli">Moduli</a>
          <a href="/soluzioni">Soluzioni</a>
          <a href="/sicurezza">Sicurezza</a>
          <a href="/prezzi">Prezzi</a>
        </div>

        <div className="footer-column">
          <strong>Soluzioni</strong>
          <a href="/booking-noleggi">Booking noleggi</a>
          <a href="/contratti-digitali">Contratti digitali</a>
          <a href="/gestionale-flotta">Gestionale flotta</a>
          <a href="/scadenze-manutenzione">Scadenze e manutenzione</a>
          <a href="/come-funziona">Come funziona</a>
        </div>

        <div className="footer-column">
          <strong>Fleetum</strong>
          <a href="/chi-siamo">Chi siamo</a>
          <a href="/tour">Demo interattiva</a>
          <a href="/demo">Richiedi demo</a>
          <a href="/accesso">Accedi</a>
        </div>

        <div className="footer-column">
          <strong>Legale</strong>
          <a href="/privacy">Privacy</a>
          <a href="/cookie">Cookie</a>
          <a href="/termini">Termini</a>
          <a href="/dpa">DPA</a>
        </div>
      </div>
      <div className="global-footer-bottom">
        <span>© 2026 Fleetum. SaaS B2B per autonoleggi e fleet management.</span>
        <span>Progettato e operato in Italia.</span>
      </div>
    </footer>
  );
}

export function PageCta({
  title = "La prossima prenotazione può partire meglio.",
  copy = "Raccontaci sedi, flotta e modo di lavorare. Prepariamo una demo mirata, non una presentazione generica.",
}: {
  title?: string;
  copy?: string;
}) {
  return (
    <section className="detail-scene page-cta">
      <div className="page-cta-glow" />
      <div className="detail-inner page-cta-content">
        <span className="kicker">Fleetum sul tuo flusso reale</span>
        <h2>{title}</h2>
        <p>{copy}</p>
        <div className="hero-actions">
          <a className="button button-primary" href="/tour">
            Guarda la demo di 90 secondi <Arrow />
          </a>
          <a className="button button-ghost" href="/demo">
            Prenota demo 20 min
          </a>
        </div>
      </div>
    </section>
  );
}
