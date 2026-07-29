import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { ProductTour } from "../../components/product-tour";
import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Demo interattiva gestionale autonoleggio",
  description:
    "Esplora in pochi passaggi booking, contratti, scadenze e KPI del gestionale Fleetum con dati dimostrativi.",
  path: "/tour",
});

export default function TourPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="tour-page">
          <div className="detail-inner">
            <div className="tour-page-heading">
              <Breadcrumbs items={[{ label: "Demo interattiva", href: "/tour" }]} />
              <span className="kicker">Demo interattiva · circa 90 secondi</span>
              <h1>Esplora Fleetum prima di lasciare i tuoi dati.</h1>
              <p>
                Quattro passaggi, dati dichiaratamente dimostrativi e nessun
                modulo da compilare. Alla fine puoi scegliere se approfondire
                sul processo reale del tuo autonoleggio.
              </p>
            </div>
            <ProductTour />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
