import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { PageCta, SiteFooter, SiteHeader } from "../../components/site-chrome";
import { WebPageJsonLd } from "../../components/web-page-json-ld";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Chi siamo: il progetto Fleetum",
  description:
    "Fleetum progetta un sistema operativo per rendere più leggibile e controllabile il lavoro quotidiano di autonoleggi e flotte.",
  path: "/chi-siamo",
});

export default function AboutPage() {
  return (
    <>
      <WebPageJsonLd
        name="Chi siamo: il progetto Fleetum"
        description="Fleetum progetta un sistema operativo per rendere più leggibile e controllabile il lavoro quotidiano di autonoleggi e flotte."
        path="/chi-siamo"
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero about-hero">
          <div className="detail-inner detail-hero-copy">
            <Breadcrumbs items={[{ label: "Chi siamo", href: "/chi-siamo" }]} />
            <span className="kicker">Chi siamo</span>
            <h1>Fleetum nasce intorno al lavoro operativo.</h1>
            <p>
              Progettiamo un sistema che rende prenotazioni, contratti, mezzi e
              decisioni più leggibili per chi gestisce un autonoleggio ogni
              giorno.
            </p>
          </div>
        </section>

        <section className="detail-scene mission-scene">
          <div className="detail-inner mission-layout">
            <div className="detail-heading">
              <span className="kicker">La direzione</span>
              <h2>Meno frammentazione. Più controllo.</h2>
            </div>
            <div className="mission-copy">
              <p>
                Il valore non è avere più funzioni. È collegare i passaggi che
                oggi richiedono fogli, chat, PDF e verifiche manuali.
              </p>
              <p>
                Fleetum mette il noleggio al centro e organizza intorno a esso
                cliente, veicolo, contratto, manutenzione e risultato.
              </p>
            </div>
          </div>
        </section>

        <section className="detail-scene principles-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Principi di prodotto</span>
              <h2>Quattro scelte che guidano Fleetum.</h2>
            </div>
            <div className="principles-grid">
              <article>
                <span>01</span>
                <h3>Chiarezza operativa</h3>
                <p>Prima le priorità, poi la profondità dei dati.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Flussi collegati</h3>
                <p>Un dato inserito bene deve alimentare tutto il percorso.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Promesse verificabili</h3>
                <p>Niente numeri, clienti o certificazioni non dimostrabili.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Crescita controllata</h3>
                <p>Dal primo workspace alla governance multi-sede.</p>
              </article>
            </div>
          </div>
        </section>

        <PageCta title="Raccontaci come lavora il tuo autonoleggio." />
      </main>
      <SiteFooter />
    </>
  );
}
