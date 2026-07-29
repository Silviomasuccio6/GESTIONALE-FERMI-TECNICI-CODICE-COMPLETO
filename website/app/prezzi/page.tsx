import type { Metadata } from "next";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { JsonLd } from "../../components/json-ld";
import {
  PageCta,
  SiteFooter,
  SiteHeader,
} from "../../components/site-chrome";
import { PricingExperience } from "../../components/pricing-experience";
import { RoiCalculator } from "../../components/roi-calculator";
import { faqs, plans, publicOrigin } from "../../lib/site-data";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Prezzi software autonoleggio",
  description:
    "Confronta i piani Fleetum Starter, Pro ed Enterprise. Prezzi mensili IVA inclusa e prova di 14 giorni con metodo di pagamento.",
  path: "/prezzi",
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Fleetum",
          description: "Software SaaS B2B per autonoleggi e fleet management.",
          url: `${publicOrigin}/prezzi`,
          offers: plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: plan.price,
            priceCurrency: "EUR",
            availability: "https://schema.org/OnlineOnly",
          })),
        }}
      />
      <SiteHeader />
      <main id="main-content" className="detail-page">
        <section className="detail-hero pricing-page-hero">
          <div className="detail-inner detail-hero-copy">
            <Breadcrumbs items={[{ label: "Prezzi", href: "/prezzi" }]} />
            <span className="kicker">Prezzi Fleetum</span>
            <h1>Un piano chiaro per il tuo modo di lavorare.</h1>
            <p>
              Prezzi mensili IVA inclusa, confronto immediato e condizioni della
              prova visibili prima di scegliere.
            </p>
            <div className="price-preview-row">
              {plans.map((plan) => (
                <a
                  key={plan.name}
                  href={`/demo?plan=${plan.name.toLowerCase()}`}
                  data-track="plan_select"
                  data-plan={plan.name.toLowerCase()}
                  data-location="pricing_hero"
                >
                  <span>{plan.name}</span>
                  <strong>{plan.price} €</strong>
                  <small>
                    /mese ·{" "}
                    {plan.name === "Enterprise" ? "Consulenza" : "Inizia"}
                  </small>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene plans-scene">
          <div className="detail-inner">
            <div className="detail-heading centered-heading">
              <span className="kicker">Prezzi IVA inclusa</span>
              <h2>Scegli il livello operativo.</h2>
              <p>
                Il trial di 14 giorni richiede un metodo di pagamento valido
                prima dell’attivazione.
              </p>
            </div>
            <PricingExperience />
          </div>
        </section>

        <section className="detail-scene roi-scene" id="roi">
          <div className="detail-inner">
            <RoiCalculator />
          </div>
        </section>

        <section className="detail-scene activation-scene">
          <div className="detail-inner activation-layout">
            <div className="detail-heading">
              <span className="kicker">Flusso trasparente</span>
              <h2>Dalla demo all’attivazione.</h2>
              <p>
                Ogni passaggio rende esplicita la decisione successiva, senza
                nascondere condizioni commerciali.
              </p>
            </div>
            <div className="activation-steps">
              {[
                ["01", "Confronta", "Livello operativo e funzioni necessarie."],
                ["02", "Scegli", "Piano e ciclo di fatturazione."],
                ["03", "Configura", "Dati aziendali e metodo di pagamento."],
                ["04", "Attiva", "Trial o abbonamento vengono confermati."],
              ].map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-scene faq-page-scene">
          <div className="detail-inner faq-layout">
            <div className="detail-heading">
              <span className="kicker">Domande frequenti</span>
              <h2>Prima di scegliere un piano.</h2>
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

        <PageCta title="Valutiamo insieme il piano giusto." />
      </main>
      <SiteFooter />
    </>
  );
}
