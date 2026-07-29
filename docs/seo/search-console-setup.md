# Google Search Console - Fleetum

## Stato

Il repository e il sito sono pronti per Search Console:

- `https://fleetum.it/robots.txt` risponde e indica la sitemap;
- `https://fleetum.it/sitemap.xml` contiene esclusivamente le 14 pagine pubbliche canoniche;
- login, gestionale, Platform Console e bozze legali sono esclusi dall'indice;
- canonical, Open Graph e dati strutturati sono emessi nell'HTML statico.

La verifica della proprieta e l'invio effettivo della sitemap richiedono accesso
all'account Google e al DNS del dominio. Queste due operazioni non possono essere
dichiarate completate sulla sola base del codice.

## Proprieta consigliata

1. Aprire [Google Search Console](https://search.google.com/search-console/).
2. Selezionare **Aggiungi proprieta**.
3. Scegliere **Dominio**, non "Prefisso URL".
4. Inserire `fleetum.it`, senza protocollo o percorso.
5. Copiare il record TXT fornito da Google.
6. Aggiungerlo al DNS del dominio radice.
7. Tornare in Search Console e selezionare **Verifica**.

La proprieta Dominio copre `fleetum.it`, `www.fleetum.it` e i sottodomini.
Il valore TXT non deve essere inserito nel repository o nei file environment.

## Invio sitemap

Dopo la verifica:

1. aprire **Indicizzazione > Sitemap**;
2. inviare `https://fleetum.it/sitemap.xml`;
3. verificare che lo stato diventi **Operazione riuscita**;
4. registrare owner, data e screenshot/evidenza nella checklist di rilascio.

Non usare la Google Indexing API per pagine SaaS ordinarie: non e lo strumento
previsto per questo tipo di contenuto.

## URL prioritari

Usare **Controllo URL** per verificare e, se necessario, richiedere l'indicizzazione di:

- `https://fleetum.it/`
- `https://fleetum.it/prodotto`
- `https://fleetum.it/booking-noleggi`
- `https://fleetum.it/contratti-digitali`
- `https://fleetum.it/gestionale-flotta`
- `https://fleetum.it/prezzi`
- `https://fleetum.it/demo`

Le vecchie rotte `/software-autonoleggio`, `/software-rent-a-car`,
`/contratti-noleggio-digitali` e `/report-redditivita-veicolo` sono redirect
permanenti e non devono essere inviate come URL canonici.

## Verifica aree private

Usare **Controllo URL** anche su un campione di URL privati e confermare che non
siano indicizzabili:

- `https://fleetum.it/login`
- `https://fleetum.it/dashboard`
- `https://platform.fleetum.it/`

Il risultato atteso e `noindex` tramite meta tag e/o header `X-Robots-Tag`.

## Monitoraggio

Ogni settimana nel primo mese, poi mensilmente:

- pagine indicizzate ed escluse;
- errori sitemap e canonical;
- query, impression, click e CTR;
- Core Web Vitals reali;
- azioni manuali e problemi di sicurezza;
- pagine con impression ma CTR basso;
- conversioni organiche confrontate con gli eventi first-party Fleetum.

## Accesso API opzionale

Gli strumenti SEO locali possono leggere Search Console solo dopo aver
configurato credenziali Google autorizzate fuori dal repository. Il file locale
previsto e `~/.config/codex-seo/google-api.json`; non deve mai essere committato.

## Evidenza di completamento

- [ ] Proprieta Dominio `fleetum.it` verificata.
- [ ] Sitemap inviata e accettata.
- [ ] URL prioritari controllati.
- [ ] Login, dashboard e Platform Console risultano non indicizzabili.
- [ ] Owner operativo assegnato.
- [ ] Data ultima verifica registrata: `________________`.
