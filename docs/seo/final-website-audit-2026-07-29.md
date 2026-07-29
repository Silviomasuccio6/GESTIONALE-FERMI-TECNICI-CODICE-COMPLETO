# Fleetum - Audit finale sito pubblico

Data audit: 2026-07-29  
Ambito: sito pubblico, indicizzazione, catalogo commerciale, separazione dalle aree private e documentazione legale pubblicabile.

## Executive summary

Il sito Fleetum e tecnicamente pronto per una release SEO controllata. Le pagine pubbliche
sono prerenderizzate, hanno metadati coerenti, URL canonici, dati strutturati e una sitemap
limitata alle sole pagine indicizzabili. Gestionale, Platform Console, API e bozze legali
restano fuori dall'indice.

La chiusura definitiva richiede ancora due attivita esterne che non possono essere
automatizzate dal repository:

1. verifica della proprieta in Google Search Console e invio della sitemap da un account
   Google autorizzato;
2. approvazione professionale delle bozze legali da parte dei consulenti competenti.

## Score

| Area | Score | Motivazione |
| --- | ---: | --- |
| Technical SEO | 9.3/10 | Rendering statico, canonical, sitemap, robots, Schema.org e test automatici |
| Coerenza prezzi e claim | 9.2/10 | Catalogo condiviso e claim ricondotti a funzionalita verificabili |
| Separazione pubblico/privato | 9.5/10 | `noindex` HTML e header HTTP sulle superfici private |
| Performance release gate | 8.8/10 | Build ottimizzata e Lighthouse CI con soglie bloccanti |
| Compliance editoriale | 7.0/10 | Gate e checklist pronti, ma revisione professionale ancora necessaria |
| Stato complessivo | **8.9/10** | Pronto tecnicamente; restano Search Console e firme professionali |

Il crawler euristico usato come baseline ha restituito 69/100. Non e un punteggio
Lighthouse e sottostima il sito perche non interpreta completamente il rendering e i gate
CI. Il dato resta utile come fotografia comparativa, non come misura assoluta.

## Esito dei sei punti

### 1. Audit tecnico SEO finale

Stato: **completato tecnicamente**.

- Home, prezzi, prodotto, soluzioni, booking, contratti, flotta, manutenzione, sicurezza,
  demo e pagine informative risultano prerenderizzate.
- Gli endpoint pubblici verificati rispondono correttamente.
- Il banner cookie e stato corretto per mantenere un target touch minimo di 44 px.
- I controlli SEO critici sono ora parte del CI.

### 2. Prezzi, testi e funzionalita dichiarate

Stato: **completato**.

- Starter: 149 EUR/mese IVA inclusa.
- Pro: 199 EUR/mese IVA inclusa.
- Enterprise: 249 EUR/mese IVA inclusa.
- Annuale: sconto 15% calcolato dalla stessa fonte commerciale.
- Landing, pagina prezzi e applicazione usano il catalogo condiviso Fleetum.
- Rimossa la formula duplicata dal frontend del sito.
- I claim principali sono collegati a moduli realmente presenti: booking, contratti,
  redditivita veicolo, multi-sede, scadenze e sicurezza.
- Sono vietate formulazioni assolute non dimostrabili come "GDPR compliant garantito",
  "sicurezza totale" o uptime non contrattualizzato.

### 3. Canonical, sitemap, robots, Schema.org, OG e favicon

Stato: **completato nel repository**.

- Canonical normalizzati con slash finale.
- Open Graph URL coerenti con il canonical.
- `WebPage` JSON-LD presente sulle pagine indicizzabili.
- `Product` e `SoftwareApplication` espongono prezzi e IVA in modo coerente.
- Sitemap limitata alle 14 pagine pubbliche indicizzabili.
- Le pagine private e le bozze legali non entrano nella sitemap.
- OG image verificata in formato 1200x630.
- Favicon verificate per formato e dimensioni.
- Test statici bloccano regressioni su canonical, sitemap, prezzi e indicizzazione.

### 4. Google Search Console

Stato: **pronto, attivita esterna da completare**.

Procedura:

1. creare o aprire la proprieta dominio `fleetum.it`;
2. completare la verifica DNS se richiesta;
3. inviare `https://fleetum.it/sitemap.xml`;
4. ispezionare almeno home, prezzi, booking, contratti, flotta e demo;
5. verificare che gestionale e Platform Console risultino escluse tramite `noindex`;
6. salvare evidenza della proprieta, della sitemap accettata e delle URL ispezionate.

La procedura dettagliata e in `docs/seo/search-console-setup.md`.

### 5. Gestionale e Platform Console noindex

Stato: **completato nel repository; da verificare dopo il deploy**.

- Gestionale tenant: header `X-Robots-Tag: noindex, nofollow, noarchive`.
- Platform Console: meta robots e header `X-Robots-Tag`.
- API: header `X-Robots-Tag`.
- Le superfici private non compaiono nella sitemap.
- Il CI verifica che il sito pubblico non venga accidentalmente pubblicato con
  `Disallow: /`.

Controlli post-deploy:

```bash
curl -I https://fleetum.it/login
curl -I https://platform.fleetum.it/
curl -I https://api.fleetum.it/api/ready
```

Tutte e tre le risposte devono contenere:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

### 6. Documenti legali

Stato: **revisione tecnica completata; approvazione professionale pendente**.

- Le bozze pubbliche restano `draft`, `noindex` e fuori sitemap.
- E presente una checklist di pubblicazione con firme distinte legal, privacy, tax e
  security.
- Il documento non puo passare a `approved` senza responsabile, data, versione e
  approvazione esplicita.
- Nessuna bozza viene dichiarata legalmente valida dal codice o dal sito.

Checklist: `legal/fleetum-saas/website-publication-review-checklist.md`.

## Verifiche automatiche

- Lint backend, frontend e sito.
- Build backend, frontend e sito statico.
- Test backend, inclusi billing, privacy, storage, report e autorizzazioni.
- Test frontend.
- Test export statico sito.
- Audit dipendenze di produzione.
- Validazione Caddy.
- Controllo whitespace Git.

## Gate di pubblicazione

La release tecnica puo essere pubblicata quando:

- CI e Deploy Production sono verdi;
- home e pagine commerciali rispondono 200;
- sitemap contiene solo URL pubbliche;
- header `X-Robots-Tag` sono presenti sulle superfici private;
- prezzi pubblici corrispondono al catalogo condiviso.

La chiusura commerciale e legale e completa solo dopo:

- proprieta Search Console verificata e sitemap accettata;
- approvazione documentata di legale, privacy, fiscale e sicurezza.

## Rischi residui

1. Search Console non e verificabile senza accesso all'account Google e, se richiesto,
   al DNS del dominio.
2. Le bozze legali non devono diventare indicizzabili o definitive prima delle firme
   professionali.
3. Le performance vanno monitorate nel tempo con Lighthouse CI e dati reali Core Web
   Vitals, non soltanto con audit sintetici.
4. Qualunque modifica futura a prezzi o feature deve partire dal catalogo condiviso e
   superare i test del sito.
