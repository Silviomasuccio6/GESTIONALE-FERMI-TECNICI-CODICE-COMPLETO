# Fleetum Website SEO Checklist

## Rendering

- [x] Le pagine marketing sono generate come HTML statico con Next.js.
- [x] Le pagine pubbliche hanno contenuto indicizzabile senza eseguire JavaScript.
- [x] Gestionale tenant e Platform Console restano SPA separate.
- [x] La demo pubblica usa l'API Fleetum esistente e non espone segreti.

## Metadata e discovery

- [x] Title e description unici.
- [x] Canonical assoluto per ogni pagina indicizzabile.
- [x] Open Graph e Twitter card.
- [x] Immagine social 1200x630.
- [x] Favicon light/dark 64x64 e Apple touch icon 180x180.
- [x] `robots.txt`.
- [x] `sitemap.xml` con sole pagine pubbliche canoniche.
- [x] `llms.txt`.
- [x] Redirect 308 dalle precedenti rotte SEO.

## Dati strutturati

- [x] `Organization`.
- [x] `WebSite`.
- [x] `SoftwareApplication`.
- [x] `WebPage` sulle pagine indicizzabili.
- [x] `Product` e offerte mensili sulla pagina prezzi.
- [x] `BreadcrumbList` sulle pagine interne.
- [x] `FAQPage` solo dove le domande sono visibili nella pagina.

## Prezzi e claim

- [x] Starter, Pro ed Enterprise derivano dal catalogo commerciale condiviso.
- [x] Prezzi mensili: 149 EUR, 199 EUR e 249 EUR, IVA inclusa.
- [x] Prezzi annuali derivati dallo sconto condiviso del 15%.
- [x] Test automatici impediscono la ricomparsa del vecchio prezzo 129 EUR.
- [x] I claim funzionali sono mappati a implementazioni reali.
- [x] I claim dipendenti da configurazioni esterne sono qualificati.

## Privacy e indicizzazione

- [x] Analytics first-party attivi solo dopo consenso Analytics.
- [x] Do Not Track rispettato dal client pubblico.
- [x] Login e gestionale ricevono `noindex`.
- [x] Platform Console riceve meta robots e `X-Robots-Tag`.
- [x] API riceve `X-Robots-Tag`.
- [x] Bozze Privacy, Cookie, Termini e DPA restano `noindex`.

## Performance e accessibilita

- [x] Immagini brand ottimizzate e dimensionate.
- [x] Asset Next con cache immutabile.
- [x] Link del cookie banner con target minimo 44px.
- [x] Lighthouse CI: Performance >= 85, SEO >= 95, Accessibility >= 90.
- [ ] Monitorare Core Web Vitals reali in Search Console dopo l'indicizzazione.

## Attivazioni esterne

- [ ] Verificare la proprieta Dominio `fleetum.it` in Search Console.
- [ ] Inviare e verificare `https://fleetum.it/sitemap.xml`.
- [ ] Ottenere approvazione professionale dei documenti legali.
- [ ] Solo dopo l'approvazione, rimuovere `noindex` dalle pagine legali.
