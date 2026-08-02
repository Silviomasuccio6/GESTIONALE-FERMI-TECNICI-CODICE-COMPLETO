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
  title: "Soluzioni per autonoleggi e gestione flotta",
  description:
    "Esplora le soluzioni Fleetum per booking noleggi, contratti digitali, gestione flotta, scadenze e manutenzione.",
  path: "/soluzioni",
});

const solutions = [
  {
    number: "01",
    href: "/booking-noleggi",
    label: "Booking noleggi",
    context: "Disponibilità, sedi, uscite e rientri",
    copy: "Mostra disponibilità, cliente, veicolo e stato del noleggio nello stesso calendario.",
  },
  {
    number: "02",
    href: "/contratti-digitali",
    label: "Contratti digitali",
    context: "Dati, documenti e firma",
    copy: "Riusa le informazioni approvate nel booking e mantiene ogni documento vicino al suo noleggio.",
  },
  {
    number: "03",
    href: "/gestionale-flotta",
    label: "Gestionale flotta",
    context: "Veicoli, sedi, utilizzo e priorità",
    copy: "Organizza lo stato operativo della flotta intorno a targhe, prenotazioni e attività tecniche.",
  },
  {
    number: "04",
    href: "/scadenze-manutenzione",
    label: "Scadenze e manutenzione",
    context: "Prevenzione, fermi e pianificazione",
    copy: "Porta revisioni e manutenzioni nel contesto dei booking che potrebbero esserne coinvolti.",
  },
] as const;

const operatingModels = [
  {
    number: "01",
    title: "Piccolo autonoleggio",
    copy: "Un’unica vista per sostituire fogli, chat e controlli ripetuti, partendo dal flusso essenziale.",
    href: "/prezzi?profilo=starter",
    action: "Valuta Starter",
  },
  {
    number: "02",
    title: "Team operativo",
    copy: "Booking, contratti e flotta condivisi tra banco e operations, con stati leggibili e responsabilità chiare.",
    href: "/prezzi?profilo=pro",
    action: "Valuta Pro",
  },
  {
    number: "03",
    title: "Azienda multi-sede",
    copy: "Processi comuni, visibilità per sede e governance da configurare sul modello organizzativo reale.",
    href: "/prezzi?profilo=enterprise",
    action: "Valuta Enterprise",
  },
] as const;

export default function SolutionsPage() {
  return (
    <>
      <WebPageJsonLd
        name="Soluzioni per autonoleggi e gestione flotta"
        description="Esplora le soluzioni Fleetum per booking noleggi, contratti digitali, gestione flotta, scadenze e manutenzione."
        path="/soluzioni"
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero solutions-hero">
          <div className="detail-inner detail-hero-grid">
            <div className="detail-hero-copy">
              <Breadcrumbs items={[{ label: "Soluzioni", href: "/soluzioni" }]} />
              <span className="kicker">Quattro processi chiave</span>
              <h1>Scegli il processo che vuoi organizzare.</h1>
              <p>
                Approfondisci booking, contratti, flotta oppure scadenze e
                verifica dati, passaggi e controlli previsti.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="/tour">
                  Guarda il flusso completo <Arrow />
                </a>
                <a className="button button-ghost" href="/come-funziona">
                  Scopri come si adotta
                </a>
              </div>
            </div>

            <nav
              className="solutions-directory"
              aria-label="Indice delle soluzioni Fleetum"
            >
              <span className="solutions-directory-label">
                Quattro percorsi operativi
              </span>
              {solutions.map((solution) => (
                <a href={solution.href} key={solution.href}>
                  <span>{solution.number}</span>
                  <div>
                    <strong>{solution.label}</strong>
                    <small>{solution.context}</small>
                  </div>
                  <Arrow />
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="detail-scene solutions-catalog-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Booking, contratti, flotta e scadenze</span>
              <h2>Approfondisci l’area che vuoi migliorare.</h2>
              <p>
                Ogni soluzione risponde a un problema specifico senza perdere
                il collegamento con il resto dell’operatività.
              </p>
            </div>
            <div className="solutions-catalog">
              {solutions.map((solution) => (
                <article key={solution.href}>
                  <div>
                    <span>{solution.number}</span>
                    <small>{solution.context}</small>
                  </div>
                  <h3>{solution.label}</h3>
                  <p>{solution.copy}</p>
                  <a href={solution.href}>
                    Approfondisci <Arrow />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene operating-models-scene">
          <div className="detail-inner operating-models-layout">
            <div className="detail-heading">
              <span className="kicker">Piccolo team, operations o multi-sede</span>
              <h2>Funzioni e configurazione cambiano con la tua struttura.</h2>
              <p>
                Dimensione della flotta e numero di sedi cambiano profondità,
                governance e percorso di attivazione.
              </p>
            </div>
            <div className="operating-models">
              {operatingModels.map((model) => (
                <article key={model.number}>
                  <span>{model.number}</span>
                  <h3>{model.title}</h3>
                  <p>{model.copy}</p>
                  <a href={model.href}>{model.action}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PageCta
          title="Mostraci quale processo vuoi organizzare per primo."
          copy="Apri la demo interattiva oppure indicaci sedi, flotta e priorità per preparare un confronto mirato."
        />
      </main>
      <SiteFooter />
    </>
  );
}
