import type { LandingPageData } from "../lib/landing-pages";
import { publicOrigin, publicPageUrl } from "../lib/site-data";
import { Breadcrumbs } from "./breadcrumbs";
import { JsonLd } from "./json-ld";
import { PageCta, SiteFooter, SiteHeader } from "./site-chrome";

export function SeoLandingPage({ page }: { page: LandingPageData }) {
  const path = `/${page.slug}`;
  const url = publicPageUrl(path);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${url}#webpage`,
              url,
              name: page.title,
              description: page.description,
              inLanguage: "it-IT",
              isPartOf: { "@id": `${publicOrigin}/#website` },
              about: { "@id": `${publicOrigin}/#software` },
            },
            {
              "@type": "SoftwareApplication",
              "@id": `${publicOrigin}/#software`,
              name: "Fleetum",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: publicOrigin,
              description:
                "Gestionale SaaS per booking, contratti, clienti, flotta, manutenzioni, scadenze e KPI degli autonoleggi.",
            },
          ],
        }}
      />
      <SiteHeader />
      <main id="main-content" className="detail-page solution-page">
        <section className="detail-hero solution-hero">
          <div className="detail-inner solution-hero-grid">
            <div className="detail-hero-copy">
              <Breadcrumbs items={[{ label: page.label, href: path }]} />
              <span className="kicker">{page.kicker}</span>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="/demo">
                  Valuta il flusso in demo
                </a>
                <a className="button button-ghost" href="/prezzi">
                  Confronta i piani
                </a>
              </div>
            </div>
            <aside className="answer-card" aria-labelledby="direct-answer-title">
              <span>Risposta diretta</span>
              <h2 id="direct-answer-title">{page.question}</h2>
              <p>{page.answer}</p>
            </aside>
          </div>
        </section>

        <section className="detail-scene solution-overview">
          <div className="detail-inner solution-copy-layout">
            <div className="detail-heading">
              <span className="kicker">Contesto operativo</span>
              <h2>{page.overviewTitle}</h2>
            </div>
            <div className="longform-copy">
              {page.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="outcome-grid">
              {page.outcomes.map((outcome, index) => (
                <article key={outcome.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene workflow-scene">
          <div className="detail-inner">
            <div className="detail-heading">
              <span className="kicker">Flusso leggibile</span>
              <h2>{page.workflowTitle}</h2>
            </div>
            <div className="workflow-table-wrap" tabIndex={0}>
              <table className="workflow-table">
                <caption>{page.workflowTitle}</caption>
                <thead>
                  <tr>
                    <th scope="col">Fase</th>
                    <th scope="col">Informazioni in ingresso</th>
                    <th scope="col">Risultato operativo</th>
                  </tr>
                </thead>
                <tbody>
                  {page.workflow.map((row) => (
                    <tr key={row.phase}>
                      <th scope="row">{row.phase}</th>
                      <td>{row.input}</td>
                      <td>{row.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="detail-scene assurance-scene">
          <div className="detail-inner assurance-layout">
            <div className="detail-heading">
              <span className="kicker">Prima della produzione</span>
              <h2>{page.assuranceTitle}</h2>
            </div>
            <div className="assurance-copy">
              {page.assurance.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <a className="inline-link" href="/sicurezza">
                Approfondisci sicurezza e privacy
              </a>
            </div>
          </div>
        </section>

        <section className="detail-scene solution-faq-scene">
          <div className="detail-inner solution-faq-layout">
            <div className="detail-heading">
              <span className="kicker">Domande concrete</span>
              <h2>Cosa chiarire prima di decidere.</h2>
            </div>
            <div className="faq-list">
              {page.faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {faq.question}
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
            <nav className="related-links" aria-label="Approfondimenti correlati">
              <strong>Continua l’esplorazione</strong>
              <div>
                {page.related.map((link) => (
                  <a key={link.href} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </section>

        <PageCta />
      </main>
      <SiteFooter />
    </>
  );
}
