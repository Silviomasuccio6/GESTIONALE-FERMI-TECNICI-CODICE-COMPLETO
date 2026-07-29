"use client";

import { useMemo, useState } from "react";
import { plans } from "../lib/site-data";
import { Arrow } from "./site-chrome";

type BillingCycle = "monthly" | "annual";

const comparisonRows = [
  ["Booking e gestione flotta", true, true, true],
  ["Clienti e contratti", true, true, true],
  ["Dashboard operative", true, true, true],
  ["Scadenze principali", true, true, true],
  ["Contratti evoluti", false, true, true],
  ["Manutenzioni e listini", false, true, true],
  ["Statistiche e alert", false, true, true],
  ["Controllo multi-sede", false, false, true],
  ["Governance avanzata", false, false, true],
  ["Automazioni e integrazioni", false, false, true],
] as const;

function annualPrice(monthlyPrice: string) {
  return Number(monthlyPrice) * 12 * 0.85;
}

function formatPrice(value: number, digits = 0) {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function PricingExperience() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const isAnnual = billing === "annual";
  const pricing = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        annual: annualPrice(plan.price),
        monthlyEquivalent: annualPrice(plan.price) / 12,
      })),
    [],
  );

  return (
    <div className="pricing-experience">
      <div className="billing-switcher" aria-label="Ciclo di fatturazione">
        <button
          type="button"
          aria-pressed={!isAnnual}
          onClick={() => setBilling("monthly")}
        >
          Mensile
        </button>
        <button
          type="button"
          aria-pressed={isAnnual}
          onClick={() => setBilling("annual")}
        >
          Annuale <span>−15%</span>
        </button>
      </div>

      <p className="billing-condition" aria-live="polite">
        {isAnnual
          ? "Fatturazione annuale anticipata con sconto del 15%. Importi IVA inclusa."
          : "Fatturazione mensile. Puoi valutare il piano durante 14 giorni di prova."}
      </p>

      <div className="pricing-grid pricing-grid-page">
        {pricing.map((plan) => (
          <article
            key={plan.name}
            className={plan.featured ? "price-card featured" : "price-card"}
          >
            {plan.featured && <span className="recommended">Consigliato</span>}
            <h3>{plan.name}</h3>
            <div className="price">
              <sup>€</sup>
              <strong>
                {isAnnual
                  ? formatPrice(plan.monthlyEquivalent, 2)
                  : plan.price}
              </strong>
              <span>/mese</span>
            </div>
            <small className="vat-label">IVA inclusa</small>
            {isAnnual && (
              <small className="annual-total">
                {formatPrice(plan.annual, 2)} € fatturati ogni anno
              </small>
            )}
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span> {feature}
                </li>
              ))}
            </ul>
            <a
              href={`/demo?plan=${plan.name.toLowerCase()}`}
              data-track="plan_select"
              data-plan={plan.name.toLowerCase()}
              data-billing={billing}
              data-location="pricing_page"
            >
              {plan.name === "Enterprise"
                ? "Prenota consulenza"
                : "Inizia prova guidata"}{" "}
              <Arrow />
            </a>
          </article>
        ))}
      </div>

      <div className="comparison-table-wrap" tabIndex={0}>
        <table className="comparison-table">
          <caption>Confronto delle funzionalità incluse nei piani Fleetum</caption>
          <thead>
            <tr>
              <th scope="col">Funzionalità</th>
              {plans.map((plan) => (
                <th key={plan.name} scope="col">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([feature, ...availability]) => (
              <tr key={feature}>
                <th scope="row">{feature}</th>
                {availability.map((included, index) => (
                  <td key={`${feature}-${plans[index].name}`}>
                    <span className={included ? "included" : "not-included"}>
                      {included ? "Incluso" : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="trial-conditions" aria-label="Condizioni della prova">
        <strong>Condizioni della prova</strong>
        <p>
          Il flusso commerciale prevede 14 giorni di prova e richiede un
          metodo di pagamento valido prima dell’attivazione. Dopo la demo,
          l’attivazione avviene nell’area riservata tramite Stripe: il sito
          pubblico non acquisisce direttamente i dati della carta.
        </p>
      </aside>
    </div>
  );
}
