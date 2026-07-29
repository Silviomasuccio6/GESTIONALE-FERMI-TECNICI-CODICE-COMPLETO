import type { legalDocuments } from "../lib/site-data";
import { Breadcrumbs } from "./breadcrumbs";
import { SiteFooter, SiteHeader } from "./site-chrome";

type Document = (typeof legalDocuments)[keyof typeof legalDocuments];

export function LegalPage({ document }: { document: Document }) {
  const path = `/${document.eyebrow.toLowerCase()}`.replace("/termini", "/termini");

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero legal-hero">
          <div className="detail-inner">
            <Breadcrumbs items={[{ label: document.eyebrow, href: path }]} />
            <span className="kicker">{document.eyebrow}</span>
            <h1>{document.title}</h1>
            <p>{document.intro}</p>
            <strong className="version-pill">
              Bozza tecnica · aggiornata 2026-07-28
            </strong>
          </div>
        </section>

        <section className="detail-scene legal-scene">
          <div className="detail-inner">
            <div className="legal-grid">
              {document.items.map(([title, copy], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{title}</h2>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <aside className="legal-note">
              <strong>Nota importante</strong>
              <p>
                Questi documenti sono predisposizioni operative. Per pieno
                valore legale servono revisione professionale, dati societari
                definitivi, elenco subfornitori e versionamento approvato.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
