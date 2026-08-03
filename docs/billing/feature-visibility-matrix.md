# Visibilità funzionalità per piano

## Regola di prodotto

Fleetum applica una gerarchia cumulativa:

- `STARTER`: funzionalità operative essenziali;
- `PRO`: tutte le funzionalità Starter più i moduli Pro;
- `ENTERPRISE`: tutte le funzionalità Starter e Pro più i moduli Enterprise.

La sorgente tecnica unica è `packages/commercial-plan-catalog`. Frontend e backend importano la stessa matrice, evitando divergenze tra menu, pagine e API.

## Comportamento dell'interfaccia

- Le funzionalità non incluse non compaiono nella navigazione o nelle pagine operative.
- Le URL premium aperte direttamente sono bloccate e riportano alla dashboard.
- Non vengono mostrate card sfocate, pulsanti disabilitati o lucchetti nelle attività quotidiane.
- La pagina `Piano e fatturazione` resta l'unica area in cui sono visibili e confrontabili tutti i piani.

## Controlli backend

Il backend verifica l'entitlement oltre ai permessi utente per:

- statistiche e filtri avanzati;
- export CSV/XLSX;
- azioni massive;
- report schedulati;
- configurazione webhook;
- consultazione ed export audit.

Un client non può quindi aggirare il limite chiamando direttamente l'API.

## Downgrade

Il downgrade non elimina dati o configurazioni premium. Le funzioni diventano invisibili e non utilizzabili, mentre i processi automatici premium vengono sospesi. Se il tenant torna a un piano compatibile, le configurazioni conservate possono essere riutilizzate.

## Regola per nuove funzionalità

Ogni nuova funzionalità commerciale deve essere aggiunta alla matrice condivisa e protetta nello stesso task in tutti i punti applicabili:

1. navigazione e componente frontend;
2. route diretta frontend;
3. endpoint backend;
4. job asincrono o cron;
5. test per Starter, Pro ed Enterprise.
