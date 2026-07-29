/* eslint-disable @next/next/no-img-element -- Fleetum brand assets are pre-optimized WebP/PNG files with intrinsic dimensions. */
import { JsonLd } from "../components/json-ld";
import {
  Arrow,
  SiteFooter,
  SiteHeader,
} from "../components/site-chrome";
import { faqs, publicOrigin } from "../lib/site-data";

const frictionPoints = [
  {
    number: "01",
    title: "Prenotazioni sparse",
    copy: "Telefonate, chat e fogli separati rendono difficile leggere disponibilità, uscite e rientri.",
  },
  {
    number: "02",
    title: "Contratti da rincorrere",
    copy: "PDF, firme, invii e versioni restano scollegati da cliente, veicolo e prenotazione.",
  },
  {
    number: "03",
    title: "Scadenze dimenticate",
    copy: "Revisioni e manutenzioni emergono troppo tardi, spesso quando il mezzo è già prenotato.",
  },
  {
    number: "04",
    title: "Numeri poco leggibili",
    copy: "Occupazione, ricavi e criticità diventano difficili da leggere quando l’operatività accelera.",
  },
];

const flowSteps = [
  "Cliente",
  "Prenotazione",
  "Contratto",
  "Uscita",
  "Rientro",
  "Manutenzione",
  "Report",
];

const modules = [
  ["01", "Booking noleggi", "Planner mensile per mezzo, sede e stato operativo."],
  ["02", "Contratti digitali", "PDF brandizzati, firma cliente e invio multicanale."],
  ["03", "Clienti", "Persone e società con documenti, patente e storico."],
  ["04", "Veicoli", "Targhe, sedi, disponibilità, revisioni e manutenzione."],
  ["05", "Scadenziario", "Avvisi su revisioni, chilometri e priorità operative."],
  ["06", "Fermi tecnici", "Aperture, owner, tempi, costi e impatto sui booking."],
  ["07", "Listini", "Pacchetti km, extra e snapshot prezzi sempre coerenti."],
  ["08", "Dashboard KPI", "Ricavi, occupazione, contratti e rientri in una vista."],
];

const plans = [
  {
    name: "Starter",
    price: "149",
    description: "Per piccoli autonoleggi che vogliono uscire da fogli e chat.",
    features: [
      "Booking e flotta",
      "Clienti e contratti",
      "Dashboard operativa",
      "Scadenze principali",
    ],
  },
  {
    name: "Pro",
    price: "199",
    description: "Per team che gestiscono flotta e contratti ogni giorno.",
    featured: true,
    features: [
      "Flussi contrattuali evoluti",
      "Manutenzioni e listini",
      "Statistiche e alert",
      "Operatività avanzata",
    ],
  },
  {
    name: "Enterprise",
    price: "249",
    description: "Per aziende con più sedi, processi e governance.",
    features: [
      "Controllo multi-sede",
      "Governance avanzata",
      "Automazioni e integrazioni",
      "Supporto prioritario",
    ],
  },
];

const BookingPlanner = () => (
  <div className="planner" aria-label="Anteprima del calendario booking Fleetum">
    <div className="planner-head">
      <div>
        <span>BOOKING CONTROL ROOM</span>
        <strong>Aprile 2026</strong>
      </div>
      <div className="planner-meta">
        <span>Roma Centro</span>
        <span className="occupancy">78% occupazione</span>
      </div>
    </div>
    <div className="planner-days">
      <span>Veicolo</span>
      {["04", "05", "06", "07", "08", "09", "10"].map((day) => (
        <span key={day}>{day}</span>
      ))}
    </div>
    <div className="planner-row">
      <strong>GF100AA</strong>
      <span className="booking booking-blue">Mario Rossi · uscita 09:00</span>
    </div>
    <div className="planner-row">
      <strong>GF101AB</strong>
      <span className="booking booking-cyan">Disponibile</span>
    </div>
    <div className="planner-row">
      <strong>GF102AC</strong>
      <span className="booking booking-dark">Azienda Demo · rientro</span>
    </div>
    <div className="planner-row">
      <strong>GF104AE</strong>
      <span className="booking booking-soft">Contratto firmato</span>
    </div>
  </div>
);

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${publicOrigin}/#software`,
          name: "Fleetum",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Gestionale SaaS per booking, contratti, clienti, flotta, manutenzioni, scadenze e KPI degli autonoleggi.",
          url: publicOrigin,
          offers: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: plan.price,
            priceCurrency: "EUR",
            url: `${publicOrigin}/prezzi`,
          })),
        }}
      />
      <SiteHeader />

      <aside className="scene-nav" aria-label="Indice delle scene">
        <a href="#top" aria-label="Introduzione">
          <span>01</span>
        </a>
        <a href="#problema" aria-label="Il problema">
          <span>02</span>
        </a>
        <a href="#flusso" aria-label="Flusso operativo">
          <span>03</span>
        </a>
        <a href="#contratti" aria-label="Contratti digitali">
          <span>04</span>
        </a>
        <a href="#moduli" aria-label="Moduli">
          <span>05</span>
        </a>
        <a href="#sicurezza" aria-label="Sicurezza">
          <span>06</span>
        </a>
        <a href="#prezzi" aria-label="Prezzi">
          <span>07</span>
        </a>
        <a href="#fiducia" aria-label="Perché Fleetum">
          <span>08</span>
        </a>
        <a href="#faq" aria-label="Domande frequenti">
          <span>09</span>
        </a>
      </aside>

      <main id="main-content">
        <section className="scene scene-hero" id="top">
          <div className="scene-inner hero-layout">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="live-dot" />
                SaaS per autonoleggi e flotte
              </div>
              <h1>
                Il sistema operativo
                <br />
                per <em>autonoleggi moderni.</em>
              </h1>
              <p>
                Fleetum collega prenotazioni, contratti digitali, clienti,
                veicoli, manutenzioni, scadenze e KPI in un’unica control room.
              </p>
              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href="/tour"
                  data-track="hero_cta_click"
                  data-location="home_hero"
                >
                  Guarda la demo di 90 secondi <Arrow />
                </a>
                <a
                  className="button button-ghost"
                  href="/prezzi#roi"
                  data-track="hero_cta_click"
                  data-location="home_hero_roi"
                >
                  Calcola il tuo risparmio
                </a>
              </div>
              <div className="hero-proof">
                <span>Booking mensile</span>
                <span>Contratti digitali</span>
                <span>Scadenze automatiche</span>
              </div>
            </div>

            <div className="control-stage">
              <div className="control-glow" />
              <div className="control-room">
                <div className="app-rail">
                  <img
                    src="/brand/fleetum-favicon-light.png"
                    alt=""
                    width="38"
                    height="38"
                  />
                  <span className="rail-active">⌂</span>
                  <span>▦</span>
                  <span>◫</span>
                  <span>◎</span>
                  <i />
                  <b>SM</b>
                </div>
                <div className="control-content">
                  <div className="control-topbar">
                    <div>
                      <span>FLEETUM CONTROL ROOM · DATI DIMOSTRATIVI</span>
                      <strong>Buongiorno</strong>
                    </div>
                    <span className="status-pill">
                      <i /> Operativo
                    </span>
                  </div>
                  <div className="kpi-row">
                    <article>
                      <span>Disponibili oggi</span>
                      <strong>68%</strong>
                      <small>per sede e fascia oraria</small>
                    </article>
                    <article>
                      <span>Ricavi mese</span>
                      <strong>€ 42.8k</strong>
                      <small>booking + consuntivo</small>
                    </article>
                    <article className="kpi-alert">
                      <span>Da presidiare</span>
                      <strong>04</strong>
                      <small>contratti da firmare</small>
                    </article>
                  </div>
                  <BookingPlanner />
                </div>
              </div>
              <div className="stage-badge badge-one">
                <span>7</span>
                <div>
                  <small>Rientri oggi</small>
                  <strong>2 da presidiare</strong>
                </div>
              </div>
              <div className="stage-badge badge-two">
                <span>✓</span>
                <div>
                  <small>Contratti digitali</small>
                  <strong>Firma acquisita</strong>
                </div>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#problema">
            Scopri il sistema <span>↓</span>
          </a>
        </section>

        <section className="scene scene-problem" id="problema">
          <div className="scene-inner">
            <div className="scene-heading split-heading">
              <div>
                <span className="kicker">02 — PROBLEMA OPERATIVO</span>
                <h2>
                  Quando il noleggio cresce,
                  <br />
                  Excel non basta più.
                </h2>
              </div>
              <p>
                Fleetum elimina attrito dai processi quotidiani: meno passaggi
                manuali, più controllo su flotta, clienti e contratti.
              </p>
            </div>
            <div className="friction-grid">
              {frictionPoints.map((item) => (
                <article key={item.number} className="friction-card">
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="problem-close">
              <span>Da frammentato</span>
              <i />
              <strong>A un unico flusso operativo</strong>
            </div>
          </div>
        </section>

        <section className="scene scene-flow" id="flusso">
          <div className="scene-inner flow-layout">
            <div className="scene-heading">
              <span className="kicker light">03 — FLUSSO OPERATIVO</span>
              <h2>Ogni processo, collegato.</h2>
              <p>
                Cliente, prenotazione, contratto e veicolo restano nello stesso
                percorso, dal primo contatto al report finale.
              </p>
            </div>
            <div className="flow-steps" aria-label="Flusso operativo Fleetum">
              {flowSteps.map((step, index) => (
                <div key={step} className="flow-step">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="flow-product">
              <div className="flow-copy">
                <span>BOOKING CONTROL ROOM</span>
                <h3>Il calendario diventa il centro operativo.</h3>
                <p>
                  Leggi disponibilità, uscite, rientri e criticità prima che
                  diventino problemi al banco.
                </p>
                <ul>
                  <li>Barre multi-giorno leggibili</li>
                  <li>Stato manutenzione vicino alla targa</li>
                  <li>Cliente e contratto collegati al booking</li>
                </ul>
              </div>
              <BookingPlanner />
            </div>
          </div>
        </section>

        <section className="scene scene-contracts" id="contratti">
          <div className="scene-inner contracts-layout">
            <div className="contract-stack" aria-label="Anteprima contratto digitale">
              <div className="contract-sheet sheet-back" />
              <div className="contract-sheet">
                <div className="contract-head">
                  <img
                    src="/brand/fleetum-favicon-dark.png"
                    alt=""
                    width="42"
                    height="42"
                  />
                  <div>
                    <strong>Scenario operativo dimostrativo</strong>
                    <span>Azienda e dati di esempio</span>
                  </div>
                  <b>RA-2026-1048</b>
                </div>
                <span className="contract-label">CONTRATTO NOLEGGIO</span>
                <h3>Locazione veicolo senza conducente</h3>
                <div className="contract-fields">
                  <div>
                    <span>Cliente</span>
                    <strong>Marco Conti</strong>
                    <small>Patente e documento verificati</small>
                  </div>
                  <div>
                    <span>Veicolo</span>
                    <strong>Ford Transit · GF204RT</strong>
                    <small>Km uscita 42.180</small>
                  </div>
                  <div>
                    <span>Uscita</span>
                    <strong>18 Apr · 09:00</strong>
                  </div>
                  <div>
                    <span>Rientro</span>
                    <strong>21 Apr · 18:30</strong>
                  </div>
                </div>
                <div className="contract-total">
                  <span>Totale previsto</span>
                  <strong>€ 420,00</strong>
                </div>
                <div className="signature-row">
                  <span>Data 18/04/2026</span>
                  <i>Firma cliente</i>
                  <b>✓ Firmato</b>
                </div>
              </div>
            </div>
            <div className="contracts-copy">
              <span className="kicker">04 — CONTRATTI DIGITALI</span>
              <h2>
                Professionali,
                <br />
                firmati, inviati.
              </h2>
              <p>
                Template brandizzati con dati azienda, intestatario, guidatori,
                condizioni, firma cliente e invio multicanale.
              </p>
              <div className="channel-row">
                <span>Email</span>
                <span>PDF</span>
                <span>WhatsApp</span>
                <span>Firma</span>
              </div>
              <a className="inline-link" href="/tour">
                Apri la demo interattiva <Arrow />
              </a>
            </div>
          </div>
        </section>

        <section className="scene scene-modules" id="moduli">
          <div className="scene-inner">
            <div className="scene-heading split-heading">
              <div>
                <span className="kicker">05 — MODULI FLEETUM</span>
                <h2>Tutto quello che serve, senza frammentazione.</h2>
              </div>
              <p>
                Ogni modulo alimenta gli altri. Un aggiornamento diventa subito
                informazione utile per banco, operations e direzione.
              </p>
            </div>
            <div className="module-grid">
              {modules.map(([number, name, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{name}</h3>
                  <p>{copy}</p>
                  <i aria-hidden="true">↗</i>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="scene scene-security" id="sicurezza">
          <div className="scene-inner security-layout">
            <div className="security-copy">
              <span className="kicker light">06 — SAAS E SICUREZZA</span>
              <h2>
                Progettato per aziende,
                <br />
                dati e processi reali.
              </h2>
              <p>
                Fleetum separa workspace, ruoli e responsabilità. Ogni azione
                sensibile lascia un’evidenza chiara e verificabile.
              </p>
              <a className="button button-white" href="/demo">
                Parla con il team <Arrow />
              </a>
            </div>
            <div className="security-board">
              <article>
                <span>01</span>
                <h3>Workspace separati</h3>
                <p>Architettura multi-tenant pensata per isolare aziende e dati.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Ruoli e permessi</h3>
                <p>Accessi controllati per admin, manager, operatori e lettori.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Audit operativo</h3>
                <p>Contratti, documenti e invii producono evidenze tracciabili.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Backup e continuità</h3>
                <p>Processi di rilascio e salvaguardia progettati per un SaaS B2B.</p>
              </article>
              <div className="security-seal">
                <img
                  src="/brand/fleetum-favicon-light.png"
                  alt=""
                  width="54"
                  height="54"
                />
                <span>
                  <small>FLEETUM PLATFORM</small>
                  <strong>Controllo, isolamento, continuità.</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="scene scene-pricing" id="prezzi">
          <div className="scene-inner pricing-layout">
            <div className="scene-heading pricing-heading">
              <span className="kicker">07 — PREZZI</span>
              <h2>Piani chiari per crescere con controllo.</h2>
              <p>
                Scegli il piano in base alla complessità operativa del tuo
                autonoleggio. Prezzi mensili IVA inclusa.
              </p>
            </div>
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={plan.featured ? "price-card featured" : "price-card"}
                >
                  {plan.featured && <span className="recommended">Consigliato</span>}
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <sup>€</sup>
                    <strong>{plan.price}</strong>
                    <span>/mese</span>
                  </div>
                  <p>{plan.description}</p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span>✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`/demo?plan=${plan.name.toLowerCase()}`}
                    data-track="plan_select"
                    data-plan={plan.name.toLowerCase()}
                    data-location="home_pricing"
                  >
                    {plan.name === "Enterprise"
                      ? "Prenota consulenza"
                      : "Inizia prova guidata"}{" "}
                    <Arrow />
                  </a>
                </article>
              ))}
            </div>
            <p className="pricing-disclaimer">
              Il trial di 14 giorni richiede un metodo di pagamento valido
              prima dell’attivazione.
            </p>
          </div>
        </section>

        <section className="scene scene-trust" id="fiducia">
          <div className="scene-inner trust-layout">
            <div className="scene-heading">
              <span className="kicker">08 — FIDUCIA OPERATIVA</span>
              <h2>Concretezza prima delle promesse.</h2>
              <p>
                Fleetum presenta ciò che il prodotto deve rendere verificabile:
                dati collegati, responsabilità chiare e decisioni più rapide.
              </p>
            </div>
            <div className="trust-grid">
              <article>
                <span>01</span>
                <h3>Demo sul tuo processo</h3>
                <p>
                  Sedi, flotta e priorità reali guidano la configurazione della
                  dimostrazione.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>Prezzi leggibili</h3>
                <p>
                  Tre piani mensili, IVA inclusa, con condizioni del trial
                  dichiarate prima dell’attivazione.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Nessuna prova inventata</h3>
                <p>
                  Testimonianze e casi studio entreranno nel sito solo quando
                  saranno autentici e verificabili.
                </p>
              </article>
              <article>
                <span>04</span>
                <h3>Documenti trasparenti</h3>
                <p>
                  Privacy, termini e DPA sono pubblicati come bozze operative da
                  validare prima della vendita definitiva.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="scene scene-faq" id="faq">
          <div className="scene-inner faq-layout">
            <div className="scene-heading">
              <span className="kicker">09 — DOMANDE FREQUENTI</span>
              <h2>Prima di vedere Fleetum in azione.</h2>
              <p>
                Risposte essenziali su prodotto, prezzi, prova e gestione
                operativa.
              </p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {faq.question}
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="scene scene-final" id="demo">
          <div className="final-glow" />
          <div className="scene-inner final-content">
            <img
              src="/brand/fleetum-logo-on-light.webp"
              alt="Fleetum"
              width="320"
              height="95"
            />
            <span className="kicker light">PRONTO A PARTIRE</span>
            <h2>
              Porta il tuo autonoleggio
              <br />
              in una control room digitale.
            </h2>
            <p>
              Crea il workspace, configura azienda e flotta, poi gestisci
              prenotazioni e contratti con un flusso professionale.
            </p>
            <div className="final-actions">
              <a className="button button-primary" href="/tour">
                Guarda la demo interattiva <Arrow />
              </a>
              <a className="button button-ghost" href="/demo">
                Prenota demo 20 min
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
