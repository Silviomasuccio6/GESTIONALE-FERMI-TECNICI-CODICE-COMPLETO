"use client";

import { useEffect, useRef, useState } from "react";
import { trackPublicEvent } from "../lib/public-analytics";
import { Arrow } from "./site-chrome";

const tourSteps = [
  {
    id: "booking",
    number: "01",
    label: "Booking",
    eyebrow: "Control room",
    title: "Disponibilità, uscite e rientri in una sola vista.",
    copy: "Il planner collega mezzo, cliente e stato operativo. Le criticità restano vicine alla prenotazione, non in un foglio separato.",
    outcome: "Individua subito disponibilità e sovrapposizioni.",
  },
  {
    id: "contract",
    number: "02",
    label: "Contratto",
    eyebrow: "Flusso digitale",
    title: "Dal booking al contratto senza ricopiare i dati.",
    copy: "Cliente, veicolo, orari e condizioni seguono la prenotazione. Il documento resta collegato al noleggio e al suo stato.",
    outcome: "Riduce passaggi manuali e versioni scollegate.",
  },
  {
    id: "maintenance",
    number: "03",
    label: "Scadenze",
    eyebrow: "Presidio flotta",
    title: "Le manutenzioni entrano nella pianificazione.",
    copy: "Revisioni, chilometri e fermi tecnici vengono letti insieme alle prenotazioni che potrebbero esserne coinvolte.",
    outcome: "Intervieni prima che un mezzo già prenotato diventi indisponibile.",
  },
  {
    id: "kpi",
    number: "04",
    label: "KPI",
    eyebrow: "Decisioni operative",
    title: "I numeri evidenziano dove agire.",
    copy: "Occupazione, ricavi, contratti e rientri vengono presentati come priorità operative, non come grafici isolati.",
    outcome: "Direzione e banco condividono lo stesso quadro.",
  },
] as const;

function BookingView() {
  return (
    <div className="tour-schedule" aria-label="Esempio booking Fleetum">
      <div className="tour-schedule-head">
        <div>
          <span>BOOKING CONTROL ROOM</span>
          <strong>Settimana operativa</strong>
        </div>
        <span>Roma Centro</span>
      </div>
      <div className="tour-schedule-days">
        <span>Veicolo</span>
        <span>Lun</span>
        <span>Mar</span>
        <span>Mer</span>
        <span>Gio</span>
        <span>Ven</span>
      </div>
      {[
        ["GF100AA", "Mario Rossi · uscita 09:00", "booking-blue"],
        ["GF101AB", "Disponibile", "booking-cyan"],
        ["GF102AC", "Rientro da presidiare", "booking-dark"],
        ["GF104AE", "Contratto firmato", "booking-soft"],
      ].map(([vehicle, booking, color]) => (
        <div className="tour-schedule-row" key={vehicle}>
          <strong>{vehicle}</strong>
          <span className={color}>{booking}</span>
        </div>
      ))}
    </div>
  );
}

function ContractView() {
  return (
    <div className="tour-contract" aria-label="Esempio contratto Fleetum">
      <div className="tour-document-head">
        <div>
          <span>CONTRATTO NOLEGGIO</span>
          <strong>RA-2026-1048</strong>
        </div>
        <span className="tour-status">Firma acquisita</span>
      </div>
      <div className="tour-document-grid">
        <div>
          <span>Cliente</span>
          <strong>Marco Conti</strong>
          <small>Documento verificato</small>
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
      <div className="tour-document-total">
        <span>Totale previsto</span>
        <strong>€ 420,00</strong>
      </div>
    </div>
  );
}

function MaintenanceView() {
  return (
    <div className="tour-maintenance" aria-label="Esempio scadenziario Fleetum">
      <div className="tour-list-head">
        <div>
          <span>SCADENZIARIO FLOTTA</span>
          <strong>Priorità della settimana</strong>
        </div>
        <span>3 da presidiare</span>
      </div>
      {[
        ["GF204RT", "Revisione", "Tra 8 giorni", "Alta"],
        ["GF101AB", "Tagliando 60.000 km", "Tra 520 km", "Media"],
        ["GF301MN", "Controllo pneumatici", "Tra 19 giorni", "Pianificata"],
      ].map(([vehicle, task, due, priority]) => (
        <div className="tour-maintenance-row" key={vehicle}>
          <strong>{vehicle}</strong>
          <div>
            <span>{task}</span>
            <small>{due}</small>
          </div>
          <b>{priority}</b>
        </div>
      ))}
    </div>
  );
}

function KpiView() {
  return (
    <div className="tour-kpis" aria-label="Esempio KPI Fleetum">
      <div className="tour-list-head">
        <div>
          <span>DASHBOARD OPERATIVA</span>
          <strong>Oggi, prima dell’apertura</strong>
        </div>
        <span>Dati aggiornati</span>
      </div>
      <div className="tour-kpi-grid">
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
        <article>
          <span>Da presidiare</span>
          <strong>04</strong>
          <small>contratti e rientri</small>
        </article>
      </div>
      <div className="tour-priority">
        <span>Priorità suggerita</span>
        <strong>Verifica due rientri prima delle 09:30.</strong>
      </div>
    </div>
  );
}

export function ProductTour() {
  const [activeIndex, setActiveIndex] = useState(0);
  const completed = useRef(false);
  const step = tourSteps[activeIndex];

  useEffect(() => {
    trackPublicEvent("product_tour_start");
  }, []);

  function selectStep(index: number) {
    setActiveIndex(index);
    trackPublicEvent("product_tour_step", {
      step: tourSteps[index].id,
      position: index + 1,
    });

    if (index === tourSteps.length - 1 && !completed.current) {
      completed.current = true;
      trackPublicEvent("product_tour_complete");
    }
  }

  return (
    <div className="product-tour">
      <div className="tour-progress" aria-label="Avanzamento demo">
        <span>
          Passaggio {activeIndex + 1} di {tourSteps.length}
        </span>
        <div>
          <i style={{ width: `${((activeIndex + 1) / tourSteps.length) * 100}%` }} />
        </div>
      </div>

      <div className="tour-tabs" role="tablist" aria-label="Flusso Fleetum">
        {tourSteps.map((item, index) => (
          <button
            key={item.id}
            id={`tour-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`tour-panel-${item.id}`}
            onClick={() => selectStep(index)}
          >
            <span>{item.number}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="tour-panel"
        id={`tour-panel-${step.id}`}
        role="tabpanel"
        aria-labelledby={`tour-tab-${step.id}`}
      >
        <div className="tour-copy">
          <span>{step.eyebrow}</span>
          <h2>{step.title}</h2>
          <p>{step.copy}</p>
          <div className="tour-outcome">
            <small>Risultato operativo</small>
            <strong>{step.outcome}</strong>
          </div>
          <div className="tour-controls">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => selectStep(activeIndex - 1)}
            >
              Indietro
            </button>
            {activeIndex < tourSteps.length - 1 ? (
              <button
                className="tour-next"
                type="button"
                onClick={() => selectStep(activeIndex + 1)}
              >
                Continua
              </button>
            ) : (
              <a
                className="tour-next"
                href="/demo"
                data-track="hero_cta_click"
                data-location="tour_complete"
              >
                Prenota demo 20 min <Arrow />
              </a>
            )}
          </div>
        </div>

        <div className="tour-product">
          <div className="tour-product-top">
            <div>
              <span>FLEETUM · DATI DIMOSTRATIVI</span>
              <strong>{step.label}</strong>
            </div>
            <span className="status-pill">
              <i /> Operativo
            </span>
          </div>
          {step.id === "booking" && <BookingView />}
          {step.id === "contract" && <ContractView />}
          {step.id === "maintenance" && <MaintenanceView />}
          {step.id === "kpi" && <KpiView />}
        </div>
      </div>
    </div>
  );
}
