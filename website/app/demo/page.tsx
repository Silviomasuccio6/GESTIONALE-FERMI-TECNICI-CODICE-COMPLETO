import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { DemoForm } from "../../components/demo-form";
import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Richiedi una demo",
  description:
    "Richiedi una demo Fleetum costruita su sedi, flotta, processi e priorità reali del tuo autonoleggio.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="demo-page">
          <div className="detail-inner demo-layout">
            <div className="demo-copy">
              <Breadcrumbs items={[{ label: "Demo", href: "/demo" }]} />
              <span className="kicker">Demo Fleetum · percorso guidato</span>
              <h1>20 minuti sul tuo flusso reale.</h1>
              <p>
                Partiamo da sedi, flotta e priorità per mostrare solo ciò che
                serve al tuo team.
              </p>
              <a className="demo-tour-link" href="/tour">
                Preferisci vedere prima il prodotto? Apri la demo interattiva.
              </a>
              <div className="demo-steps">
                <article>
                  <span>01</span>
                  <div>
                    <strong>Tre dati iniziali</strong>
                    <p>Nome, email di lavoro e dimensione flotta.</p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <strong>Scegli una preferenza</strong>
                    <p>Giorno, orario e percorso operativo.</p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <strong>Conferma con il team Fleetum</strong>
                    <p>
                      Ricevi un contatto per validare giorno, orario e
                      percorso della demo.
                    </p>
                  </div>
                </article>
              </div>
            </div>
            <DemoForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
