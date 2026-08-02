"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackPublicEvent } from "../lib/public-analytics";
import { Arrow } from "./site-chrome";

type RoiInputs = {
  rentals: number;
  minutes: number;
  hourlyValue: number;
};

const initialInputs: RoiInputs = {
  rentals: 120,
  minutes: 18,
  hourlyValue: 22,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RoiCalculator() {
  const [inputs, setInputs] = useState(initialInputs);
  const [hasCalculated, setHasCalculated] = useState(false);
  const result = useMemo(() => {
    const hours = (inputs.rentals * inputs.minutes) / 60;
    return {
      hours,
      value: hours * inputs.hourlyValue,
    };
  }, [inputs]);

  function update(key: keyof RoiInputs, value: string) {
    const numeric = Number(value);
    const limits: Record<keyof RoiInputs, [number, number]> = {
      rentals: [1, 2000],
      minutes: [1, 120],
      hourlyValue: [1, 250],
    };
    setInputs((current) => ({
      ...current,
      [key]: clamp(Number.isFinite(numeric) ? numeric : 0, ...limits[key]),
    }));
    setHasCalculated(false);
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasCalculated(true);
    trackPublicEvent("roi_calculated", {
      rentals: inputs.rentals,
      minutes_per_rental: inputs.minutes,
      hourly_value: inputs.hourlyValue,
      estimated_hours: Math.round(result.hours),
    });
  }

  return (
    <div className="roi-calculator">
      <div className="roi-copy">
        <span className="kicker">Calcolo sui tuoi dati</span>
        <h2>Quanto pesa oggi il lavoro ripetitivo?</h2>
        <p>
          Inserisci i tuoi volumi. Il calcolo non promette un risparmio: rende
          visibile il valore del tempo che oggi assorbono ricopie, controlli e
          passaggi manuali.
        </p>
        <div className="roi-assumptions">
          <strong>Come viene calcolato</strong>
          <span>Noleggi mensili × minuti recuperabili × valore orario.</span>
        </div>
      </div>

      <form onSubmit={calculate}>
        <div className="roi-fields">
          <label>
            <span>Noleggi al mese</span>
            <input
              type="number"
              min="1"
              max="2000"
              value={inputs.rentals}
              onChange={(event) => update("rentals", event.target.value)}
            />
          </label>
          <label>
            <span>Minuti manuali per noleggio</span>
            <input
              type="number"
              min="1"
              max="120"
              value={inputs.minutes}
              onChange={(event) => update("minutes", event.target.value)}
            />
          </label>
          <label>
            <span>Valore orario del team</span>
            <div className="roi-money-field">
              <span>€</span>
              <input
                type="number"
                min="1"
                max="250"
                value={inputs.hourlyValue}
                onChange={(event) => update("hourlyValue", event.target.value)}
              />
            </div>
          </label>
        </div>

        <button className="button button-primary" type="submit">
          Calcola lo scenario
        </button>

        <div
          className={hasCalculated ? "roi-result is-visible" : "roi-result"}
          aria-live="polite"
        >
          <div>
            <span>Tempo mensile coinvolto</span>
            <strong>{Math.round(result.hours)} ore</strong>
          </div>
          <div>
            <span>Valore indicativo del tempo</span>
            <strong>{euro(result.value)}</strong>
          </div>
          {hasCalculated && (
            <a
              href="/demo?intent=roi"
              data-track="hero_cta_click"
              data-location="roi_result"
            >
              Valuta lo scenario sul tuo flusso <Arrow />
            </a>
          )}
        </div>
        <p className="roi-note">
          Stima esplorativa basata esclusivamente sui valori inseriti. Non è una
          garanzia di risultato economico o operativo.
        </p>
      </form>
    </div>
  );
}
