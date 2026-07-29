/* eslint-disable @next/next/no-img-element -- The small Fleetum seal is already optimized and has intrinsic dimensions. */
import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageCta, SiteFooter, SiteHeader } from "../../components/site-chrome";
import { WebPageJsonLd } from "../../components/web-page-json-ld";
import { securityItems } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sicurezza, privacy e continuità operativa",
  description:
    "Scopri l’approccio Fleetum a workspace, ruoli, audit, documenti, backup e processi privacy per il gestionale autonoleggio.",
  path: "/sicurezza",
});

export default function SecurityPage() {
  return (
    <>
      <WebPageJsonLd
        name="Sicurezza, privacy e continuità operativa Fleetum"
        description="Scopri l’approccio Fleetum a workspace, ruoli, audit, documenti, backup e processi privacy per il gestionale autonoleggio."
        path="/sicurezza"
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero security-page-hero">
          <div className="detail-inner detail-hero-grid">
            <div className="detail-hero-copy">
              <Breadcrumbs items={[{ label: "Sicurezza", href: "/sicurezza" }]} />
              <span className="kicker">SaaS e sicurezza</span>
              <h1>Dati, ruoli e processi aziendali.</h1>
              <p>
                Privacy, sicurezza e continuità operativa sono processi da
                mantenere e verificare, non semplici badge da esporre.
              </p>
            </div>
            <div className="security-summary">
              <img
                src="/brand/fleetum-favicon-light.png"
                alt=""
                width="90"
                height="90"
              />
              <span>FLEETUM PLATFORM</span>
              <strong>Controllo, isolamento, continuità.</strong>
              <p>
                Le misure definitive dipendono dall’ambiente produttivo e
                devono essere validate con la documentazione legale.
              </p>
            </div>
          </div>
        </section>

        <section className="detail-scene security-detail-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Fiducia operativa</span>
              <h2>Sei aree da progettare e verificare.</h2>
              <p>
                Ogni area deve diventare un controllo concreto del prodotto e
                della sua gestione quotidiana.
              </p>
            </div>
            <div className="security-detail-grid">
              {securityItems.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene security-process-scene">
          <div className="detail-inner process-layout">
            <div className="detail-heading">
              <span className="kicker">Processo prima del badge</span>
              <h2>Ciò che verrà dichiarato deve poter essere dimostrato.</h2>
            </div>
            <div className="process-list">
              <article>
                <span>01</span>
                <div>
                  <h3>Definire</h3>
                  <p>Ruoli, responsabilità, retention e subfornitori.</p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Applicare</h3>
                  <p>Controlli tecnici, monitoraggio e procedure operative.</p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Verificare</h3>
                  <p>Evidenze, incident response, ripristino e revisione.</p>
                </div>
              </article>
              <article>
                <span>04</span>
                <div>
                  <h3>Comunicare</h3>
                  <p>Documenti aggiornati e promesse coerenti con la realtà.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <PageCta title="Parliamo dei requisiti del tuo contesto." />
      </main>
      <SiteFooter />
    </>
  );
}
