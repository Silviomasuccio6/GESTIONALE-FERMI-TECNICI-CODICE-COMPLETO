---
title: "Website Legal Publication Review Checklist"
owner: "Fleetum"
version: "0.1.0-draft"
status: "draft"
review_required: true
review_type:
  - legal
  - privacy
  - tax
  - security
last_updated: "2026-07-29"
applicability: "Fleetum SaaS Public Website"
---

> Bozza tecnica per revisione professionale. Non costituisce consulenza legale,
> fiscale, privacy o cybersecurity.

# Gate legale per la pubblicazione

Le pagine `/privacy`, `/cookie`, `/termini` e `/dpa` devono restare `noindex`
finche tutte le approvazioni applicabili non sono documentate.

## Dati del titolare e del fornitore

- [ ] Ragione sociale, forma giuridica, sede e contatti definitivi.
- [ ] Partita IVA e codice fiscale verificati.
- [ ] PEC e contatti privacy/supporto/sicurezza verificati.
- [ ] Titolare, responsabile, eventuale DPO e rappresentante UE corretti.
- [ ] Legge applicabile, foro e meccanismi di reclamo approvati.

## Privacy e cookie

- [ ] Finalita, basi giuridiche e categorie di interessati validate.
- [ ] Tempi di conservazione coerenti con codice, cron e procedure operative.
- [ ] Diritti degli interessati e canali di richiesta verificati.
- [ ] Elenco subprocessori reale e aggiornato.
- [ ] Trasferimenti extra SEE e relative garanzie documentati.
- [ ] Cookie necessari e analytics first-party descritti correttamente.
- [ ] Banner, revoca consenso e Do Not Track verificati.
- [ ] Nessun pixel o SDK terzo non dichiarato.

## Contratto SaaS, DPA e condizioni economiche

- [ ] Termini, SaaS Agreement e DPA coerenti tra loro.
- [ ] Piani, IVA inclusa, trial con carta, rinnovo e cancellazione coerenti con Stripe.
- [ ] Refund/cancellation policy approvata.
- [ ] SLA, limitazioni di responsabilita e supporto approvati.
- [ ] Ruoli privacy multi-tenant e istruzioni del cliente definiti.
- [ ] Portabilita, cancellazione, restituzione dati e fine contratto definite.

## Sicurezza e claim

- [ ] Claim di sicurezza confrontati con i controlli realmente attivi.
- [ ] Backup, RPO/RTO, incident response e data breach non descritti come garanzie assolute.
- [ ] Vulnerability disclosure e canale security verificati.
- [ ] Nessuna certificazione dichiarata senza evidenza valida.

## Revisione fiscale

- [ ] Prezzi IVA inclusa e condizioni B2B confermati.
- [ ] Ricevute, fatture e documenti di cortesia descritti correttamente.
- [ ] Fatturazione elettronica e conservazione non dichiarate se non effettivamente disponibili.
- [ ] Trattamento trial, sconti, rimborsi e insoluti validato.

## Registro approvazioni

| Revisione | Professionista | Data | Versione/evidenza | Esito |
| --- | --- | --- | --- | --- |
| Legale |  |  |  | TODO_LEGAL_REVIEW |
| Privacy/DPO |  |  |  | TODO_PRIVACY_REVIEW |
| Fiscale |  |  |  | TODO_TAX_REVIEW |
| Cybersecurity |  |  |  | TODO_SECURITY_REVIEW |

## Passaggio a pubblicazione

Solo dopo tutte le approvazioni:

1. aggiornare i documenti sorgente in `legal/fleetum-saas`;
2. assegnare versione, data di efficacia e owner;
3. aggiornare le pagine web con il testo approvato;
4. rimuovere la dicitura “Bozza tecnica”;
5. rimuovere `noindex` dalle sole pagine approvate;
6. aggiungerle alla sitemap;
7. conservare evidenza delle versioni e delle approvazioni.

TODO_LEGAL_REVIEW: approvazione professionale obbligatoria.
TODO_PRIVACY_REVIEW: validare ruoli, basi giuridiche, retention e subprocessori.
TODO_TAX_REVIEW: validare prezzi, IVA, trial, rimborsi e documenti fiscali.
TODO_SECURITY_REVIEW: validare claim e misure tecniche pubblicate.
