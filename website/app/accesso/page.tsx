import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import {
  Arrow,
  SiteFooter,
  SiteHeader,
} from "../../components/site-chrome";
import { appLoginUrl } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Accesso al gestionale Fleetum",
  description:
    "Passa dal sito Fleetum all’area riservata oppure esplora la demo se stai ancora valutando il gestionale.",
  path: "/accesso",
  index: false,
});

export default function AccessPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero access-hero">
          <div className="detail-inner access-layout">
            <div className="detail-hero-copy">
              <Breadcrumbs items={[{ label: "Accedi", href: "/accesso" }]} />
              <span className="kicker">Area riservata Fleetum</span>
              <h1>Il sito pubblico finisce qui. Il lavoro continua nel gestionale.</h1>
              <p>
                Questa pagina separa con chiarezza l’esplorazione del prodotto
                dall’accesso operativo dei clienti.
              </p>
            </div>

            <section className="access-panel" aria-labelledby="access-panel-title">
              <span>Sei già cliente?</span>
              <h2 id="access-panel-title">Apri l’area riservata.</h2>
              <p>
                Il pulsante porta all’accesso sicuro del gestionale Fleetum.
                Il sito pubblico non richiede né conserva le credenziali.
              </p>
              <a
                className="button button-primary"
                href={appLoginUrl}
                rel="noreferrer"
              >
                Vai al login del gestionale <Arrow />
              </a>
              <small>Destinazione esterna: area riservata Fleetum</small>
            </section>
          </div>
        </section>

        <section className="detail-scene access-paths-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Scegli il percorso corretto</span>
              <h2>Accesso, valutazione e confronto restano separati.</h2>
              <p>
                In questo modo ogni visitatore sa sempre cosa accadrà dopo il
                clic.
              </p>
            </div>
            <div className="access-paths">
              <article>
                <span>01</span>
                <h3>Devi lavorare nel gestionale</h3>
                <p>
                  Usa l’area riservata esterna con le credenziali del tuo
                  workspace.
                </p>
                <a href={appLoginUrl} rel="noreferrer">
                  Apri il login <Arrow />
                </a>
              </article>
              <article>
                <span>02</span>
                <h3>Vuoi capire come funziona</h3>
                <p>
                  Esplora booking, contratto, scadenze e KPI senza lasciare
                  dati.
                </p>
                <a href="/tour">
                  Apri la demo interattiva <Arrow />
                </a>
              </article>
              <article>
                <span>03</span>
                <h3>Vuoi valutarlo sul tuo processo</h3>
                <p>
                  Prepara una richiesta demo basata su sedi, flotta e priorità
                  reali.
                </p>
                <a href="/demo">
                  Prenota demo 20 min <Arrow />
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
