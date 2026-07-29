import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import {
  Arrow,
  PageCta,
  SiteFooter,
  SiteHeader,
} from "../../components/site-chrome";
import { WebPageJsonLd } from "../../components/web-page-json-ld";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Software gestionale per autonoleggio",
  description:
    "Scopri come Fleetum collega booking, contratti digitali, clienti, veicoli, manutenzioni e KPI in un unico flusso operativo.",
  path: "/prodotto",
});

const journey = [
  ["01", "Cliente", "Anagrafica, patente, documenti e storico."],
  ["02", "Prenotazione", "Disponibilità, sede, tariffa e veicolo."],
  ["03", "Contratto", "Condizioni, firma e invio collegati."],
  ["04", "Uscita", "Consegna, chilometri e stato del mezzo."],
  ["05", "Rientro", "Consuntivo, extra e prossima disponibilità."],
  ["06", "Controllo", "Scadenze, manutenzione e KPI aggiornati."],
];

export default function ProductPage() {
  return (
    <>
      <WebPageJsonLd
        name="Software gestionale per autonoleggio Fleetum"
        description="Scopri come Fleetum collega booking, contratti digitali, clienti, veicoli, manutenzioni e KPI in un unico flusso operativo."
        path="/prodotto"
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero product-hero">
          <div className="detail-inner detail-hero-grid">
            <div className="detail-hero-copy">
              <Breadcrumbs items={[{ label: "Prodotto", href: "/prodotto" }]} />
              <span className="kicker">Software autonoleggio</span>
              <h1>Una regia unica per ogni noleggio.</h1>
              <p>
                Fleetum unisce booking, contratti, clienti, flotta e
                redditività in un sistema progettato per chi deve decidere in
                pochi secondi.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="/demo">
                  Vedi il flusso completo <Arrow />
                </a>
                <a className="button button-ghost" href="/moduli">
                  Esplora i moduli
                </a>
              </div>
            </div>

            <div className="product-preview" aria-label="Scenario dimostrativo Fleetum">
              <div className="preview-top">
                <div>
                  <span>CONTROL ROOM · DATI DIMOSTRATIVI</span>
                  <strong>Priorità operative</strong>
                </div>
                <b>Operativo</b>
              </div>
              <div className="preview-kpis">
                <article>
                  <span>Uscite oggi</span>
                  <strong>12</strong>
                  <small>3 in preparazione</small>
                </article>
                <article>
                  <span>Disponibilità</span>
                  <strong>68%</strong>
                  <small>tutte le sedi</small>
                </article>
                <article>
                  <span>Da verificare</span>
                  <strong>04</strong>
                  <small>prima delle 11:00</small>
                </article>
              </div>
              <div className="preview-timeline">
                <div className="timeline-head">
                  <span>Veicolo</span>
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mer</span>
                  <span>Gio</span>
                  <span>Ven</span>
                </div>
                {[
                  ["GF100AA", "Prenotato · rientro 18:30"],
                  ["GF101AB", "Disponibile · Roma Centro"],
                  ["GF102AC", "Manutenzione programmata"],
                  ["GF104AE", "Contratto firmato"],
                ].map(([plate, status], index) => (
                  <div className="timeline-row" key={plate}>
                    <strong>{plate}</strong>
                    <span className={`timeline-bar bar-${index + 1}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="detail-scene journey-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Un flusso collegato</span>
              <h2>Dal primo contatto al report finale.</h2>
              <p>
                Ogni passaggio aggiorna il successivo. Il team riduce
                duplicazioni e mantiene il contesto operativo.
              </p>
            </div>
            <div className="journey-grid">
              {journey.map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene decision-scene">
          <div className="detail-inner decision-layout">
            <div className="detail-heading">
              <span className="kicker">Progettato intorno alle decisioni</span>
              <h2>Il dato utile arriva nel momento giusto.</h2>
              <p>
                Non una raccolta di schermate scollegate, ma informazioni
                organizzate intorno al veicolo e al noleggio.
              </p>
            </div>
            <div className="decision-grid">
              <article>
                <span>Banco</span>
                <h3>Cosa parte, cosa rientra, cosa manca.</h3>
                <p>
                  Il turno si apre sulle priorità reali, non su una sequenza di
                  menu da controllare.
                </p>
              </article>
              <article>
                <span>Operations</span>
                <h3>Disponibilità e manutenzione nella stessa vista.</h3>
                <p>
                  Il fermo tecnico entra nel calendario e protegge la
                  pianificazione futura.
                </p>
              </article>
              <article>
                <span>Direzione</span>
                <h3>Occupazione e ricavi leggibili per sede.</h3>
                <p>
                  KPI coerenti aiutano a confrontare periodi, mezzi e processi
                  senza ricostruzioni manuali.
                </p>
              </article>
            </div>
          </div>
        </section>

        <PageCta />
      </main>
      <SiteFooter />
    </>
  );
}
