# D10 UX/UI Spec + Design System

Stato: ATTIVO
Versione: 1.0
Ambito: applicazione tenant Fleetum

## Principi

1. La leggibilita operativa viene prima della decorazione.
2. Ogni schermata espone una sola azione primaria; le azioni secondarie restano visibili ma non competono.
3. Informazioni, filtri e azioni compaiono vicino all'oggetto su cui operano.
4. Colore, icona e testo concorrono a descrivere lo stato: il colore non e mai l'unico segnale.
5. Le superfici sono stabili. Le card informative non si spostano al passaggio del mouse.
6. Le animazioni sono brevi, funzionali e disattivabili con `prefers-reduced-motion`.
7. Desktop privilegia densita e scansione; mobile privilegia priorita, sequenza e azioni raggiungibili.

## Fondamenta visive

- Font applicazione: Manrope con fallback Avenir Next e Segoe UI.
- Testo primario: slate ad alto contrasto; testo secondario non inferiore a contrasto WCAG AA.
- Colore azione: blu Fleetum. Il verde e riservato a disponibilita e successo; ambra ad attenzione; rosso a errore o blocco.
- Raggio standard: 12 px per controlli e card; 16 px solo per pannelli principali e dialog.
- Spaziatura: scala 4, 8, 12, 16, 24, 32 px.
- Ombre: una sola ombra sottile per separare livelli. Niente glow, shimmer continuo o sollevamenti su card non cliccabili.
- Icone: solo `lucide-react` o asset ufficiali presenti in `frontend/public/brand`.

## Gerarchia pagina

1. Topbar: contesto corrente, ricerca, notifiche e profilo.
2. Sidebar: sezioni Operativo, Flotta, Clienti e Azienda. La voce attiva usa fondo blu tenue e barra laterale.
3. Page header: eyebrow opzionale, titolo, descrizione e massimo due azioni immediate.
4. KPI: solo indicatori utili alla decisione sulla pagina corrente.
5. Contenuto operativo: filtri prima dei dati; stato vuoto, caricamento ed errore sempre previsti.

## Prenotazioni

- La timeline e il contenuto prioritario e deve iniziare entro il secondo viewport su mobile.
- Desktop mantiene veicolo e sede come colonne sticky.
- Lo stato di disponibilita e sempre testuale oltre che cromatico.
- Il giorno corrente e evidenziato con marker sottile, senza oscurare le prenotazioni.
- Il noleggio minimo e 24 ore; copy, validazione, prezzi e rappresentazione temporale devono concordare.
- Su mobile i KPI occupano al massimo tre righe e la navigazione principale contiene massimo cinque destinazioni.

## Piano e fatturazione

- Mostra prima piano corrente, rinnovo e metodo di pagamento.
- `Gestisci abbonamento` apre il portale Stripe; `Modifica metodo di pagamento` descrive esplicitamente l'azione.
- Il piano corrente e non cliccabile, i downgrade sono bloccati dove previsto, gli upgrade sono distinti.
- La pagina deve essere usabile a 390 px senza overflow orizzontale.

## Login e registrazione

- Il modulo e il solo punto focale.
- Sono ammessi un gradiente statico e una griglia discreta; niente particelle, tilt 3D o movimento continuo.
- Google usa un asset ufficiale; le icone di interfaccia provengono dalla libreria condivisa.
- Errori, loading e successo non devono spostare in modo imprevedibile i campi principali.

## Accessibilita

- Focus visibile per ogni elemento interattivo.
- Target minimo 44 x 44 px su touch per azioni primarie e navigazione.
- Label persistenti per i campi; placeholder solo come esempio.
- Dialog e menu chiudibili con Escape e con gestione corretta del focus.
- Tabelle con intestazioni semantiche; timeline accessibile anche da tastiera.
- Supporto obbligatorio a `prefers-reduced-motion`.

## Verifica prima della PR

- Desktop: 1440 x 1000.
- Tablet: 768 x 1024.
- Mobile: 390 x 844.
- Tema chiaro e scuro per l'app tenant.
- Login, Dashboard, Prenotazioni e Piano e fatturazione controllati visivamente.
- Nessun overflow orizzontale non intenzionale.
- Lint, build e test frontend verdi.
- Screenshot locali prima/dopo allegati alla revisione quando il cambiamento e visivo.

## Sorgenti

- Token e stili: `frontend/src/presentation/styles/global.css`.
- Componenti condivisi: `frontend/src/presentation/components/ui`.
- Layout tenant: `frontend/src/presentation/components/layout/app-layout.tsx`.
- Login: `frontend/src/features/auth`.
