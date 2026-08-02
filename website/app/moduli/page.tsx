import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageCta, SiteFooter, SiteHeader } from "../../components/site-chrome";
import { WebPageJsonLd } from "../../components/web-page-json-ld";
import { modules } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Moduli per booking, contratti e gestione flotta",
  description:
    "Tutti i moduli Fleetum: booking, contratti digitali, clienti, veicoli, scadenze, manutenzioni, listini e dashboard KPI.",
  path: "/moduli",
});

export default function ModulesPage() {
  return (
    <>
      <WebPageJsonLd
        name="Moduli per booking, contratti e gestione flotta"
        description="Tutti i moduli Fleetum: booking, contratti digitali, clienti, veicoli, scadenze, manutenzioni, listini e dashboard KPI."
        path="/moduli"
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero modules-hero">
          <div className="detail-inner detail-hero-copy">
            <Breadcrumbs items={[{ label: "Moduli", href: "/moduli" }]} />
            <span className="kicker">Booking · contratti · flotta · KPI</span>
            <h1>Otto moduli che condividono gli stessi dati.</h1>
            <p>
              Una modifica al booking aggiorna le informazioni disponibili per
              contratto, flotta, scadenze e report.
            </p>
            <div className="module-index" aria-label="Indice moduli">
              {modules.map((module) => (
                <a key={module.number} href={`#modulo-${module.number}`}>
                  <span>{module.number}</span>
                  {module.name}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene module-detail-scene">
          <div className="detail-inner module-detail-grid">
            {modules.map((module) => (
              <article id={`modulo-${module.number}`} key={module.number}>
                <span>{module.number}</span>
                <div>
                  <h2>{module.name}</h2>
                  <p>{module.detail}</p>
                  <strong>{module.copy}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-scene connected-scene">
          <div className="detail-inner connected-layout">
            <div className="detail-heading">
              <span className="kicker">Dal booking ai KPI</span>
              <h2>Il booking non finisce nel calendario.</h2>
              <p>
                Continua nel contratto, nel rientro, nella manutenzione e nei
                report. Cliente, veicolo e stato restano collegati.
              </p>
            </div>
            <div className="connection-list">
              <div>
                <span>01</span>
                <strong>Prenotazione</strong>
                <p>Definisce veicolo, cliente, tariffa e intervallo.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Contratto</strong>
                <p>Riusa i dati approvati e raccoglie la firma.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Operatività</strong>
                <p>Aggiorna disponibilità, scadenze e manutenzione.</p>
              </div>
              <div>
                <span>04</span>
                <strong>Controllo</strong>
                <p>Restituisce priorità e indicatori alla squadra.</p>
              </div>
            </div>
          </div>
        </section>

        <PageCta title="Costruiamo la demo sui moduli che ti servono." />
      </main>
      <SiteFooter />
    </>
  );
}
