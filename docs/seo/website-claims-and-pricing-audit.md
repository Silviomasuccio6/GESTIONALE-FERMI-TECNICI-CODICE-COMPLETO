# Audit claim e prezzi del sito Fleetum

Data audit: 2026-07-29

## Regola di pubblicazione

Ogni claim pubblico deve essere:

1. supportato da una route, un servizio o una UI realmente presenti;
2. qualificato quando dipende da piano, permessi o configurazioni esterne;
3. rimosso o corretto se il comportamento verificabile cambia.

## Prezzi

La fonte unica e `packages/commercial-plan-catalog`.

| Piano | Mensile IVA inclusa | Annuale IVA inclusa | Sconto annuale |
| --- | ---: | ---: | ---: |
| Starter | 149 EUR | 1.519,80 EUR | 15% |
| Pro | 199 EUR | 2.029,80 EUR | 15% |
| Enterprise | 249 EUR | 2.539,80 EUR | 15% |

Sito, frontend tenant e backend devono importare lo stesso catalogo. I Price ID
Stripe restano configurazioni environment e devono corrispondere ai sei prezzi.

## Matrice delle funzionalita

| Claim pubblico | Evidenza nel prodotto | Stato | Vincoli da dichiarare |
| --- | --- | --- | --- |
| Booking operativo | Route e controller rental booking; pagina booking e calendario nel frontend | Confermato | Funzioni disponibili secondo piano e permessi |
| Contratti digitali | Endpoint contratto, generazione PDF, invio email/WhatsApp e pagina contratti | Confermato | Invio esterno dipende dai provider configurati |
| Anagrafiche clienti | Route customer, pagina clienti, documenti e upload protetti | Confermato | Trattamento soggetto a ruoli, retention e policy cliente |
| Flotta, manutenzioni e scadenze | Route master data e pagine veicoli, manutenzioni e scadenze | Confermato | Alert e automazioni dipendono dal piano/configurazione |
| ROI e redditivita veicolo | API profitability, export e sezione statistiche | Confermato | Risultati stimati in base a ricavi/costi disponibili |
| Operativita multi-sede | Filtri `siteId`, sedi e permessi nel backend/frontend | Confermato | Numero sedi e governance dipendono dal piano |
| Ruoli e audit | Middleware permessi, route audit e console operativa | Confermato | Profondita audit dipendente dagli entitlement |
| Trial di 14 giorni con carta | Checkout Stripe con raccolta carta e license guard | Confermato | Richiede Stripe configurato e conferma webhook |
| Sicurezza e backup | Policy, controlli upload, backup e restore runbook | Confermato con riserva | Non descrivere come certificazione o garanzia assoluta |
| Supporto prioritario | Entitlement e copy commerciale | Da validare operativamente | Definire canale, orari e SLA prima della vendita |

## Claim vietati senza evidenza aggiuntiva

- “Conforme GDPR” come garanzia assoluta.
- “Sicurezza certificata” senza certificazione vigente.
- “Disponibilita garantita” senza SLA approvato e misurazione pubblica.
- “Fatturazione elettronica certificata” senza integrazione e validazione fiscale.
- “Backup infallibile” o “zero perdita dati”.

## Gate ad ogni modifica

- [ ] Il catalogo condiviso e stato aggiornato prima della UI.
- [ ] I sei Price ID Stripe corrispondono a piano e ciclo.
- [ ] Home, `/prezzi`, signup e pagina piano mostrano gli stessi importi.
- [ ] Le funzionalita dichiarate hanno test o evidenza tecnica.
- [ ] Le dipendenze da provider/piano sono indicate.
- [ ] Nessun testo promette validita legale, fiscale o di sicurezza assoluta.
