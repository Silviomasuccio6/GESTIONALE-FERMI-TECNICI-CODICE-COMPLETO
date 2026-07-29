export type LandingPageData = {
  slug: string;
  label: string;
  kicker: string;
  title: string;
  description: string;
  question: string;
  answer: string;
  overviewTitle: string;
  overview: string[];
  outcomes: { title: string; copy: string }[];
  workflowTitle: string;
  workflow: { phase: string; input: string; output: string }[];
  assuranceTitle: string;
  assurance: string[];
  faqs: { question: string; answer: string }[];
  related: { label: string; href: string }[];
};

export const landingPages: Record<string, LandingPageData> = {
  "booking-noleggi": {
    slug: "booking-noleggi",
    label: "Booking noleggi",
    kicker: "Planner e disponibilità",
    title: "Booking noleggi: disponibilità e operazioni nella stessa vista.",
    description:
      "Scopri come Fleetum collega disponibilità, prenotazioni, sedi, contratti e rientri in un unico booking per autonoleggi.",
    question: "Come funziona un software di booking per autonoleggi?",
    answer:
      "Un software di booking per autonoleggi deve mostrare quali veicoli sono realmente disponibili, in quale sede e per quale intervallo, prima di confermare una prenotazione. Fleetum organizza richieste, assegnazioni, uscite e rientri in un planner condiviso. Il booking non resta isolato: riusa i dati del cliente, prepara il contratto, aggiorna lo stato del mezzo e segnala eventuali sovrapposizioni con manutenzioni o fermi tecnici. Il team può quindi partire dalla stessa informazione, riducendo controlli su fogli, chat e calendari separati. In una configurazione reale, regole tariffarie, permessi, notifiche e automazioni vanno adattati alle sedi e al processo dell’azienda. La demo interattiva mostra il modello operativo con dati dimostrativi, senza creare prenotazioni reali.",
    overviewTitle: "Dal calendario a una regia operativa.",
    overview: [
      "Un planner utile non si limita a colorare intervalli. Deve rendere leggibile la relazione tra richiesta, veicolo, cliente, sede, tariffa e attività da completare. Se una di queste informazioni resta fuori dal sistema, il banco deve ricostruire il contesto prima di ogni decisione. Fleetum imposta il booking come origine di un flusso: i dati confermati alimentano contratto, uscita, rientro e reporting.",
      "La disponibilità deve tenere conto non solo delle prenotazioni già confermate, ma anche di rientri previsti, fermi tecnici e manutenzioni programmate. La vista operativa evidenzia le priorità senza dichiarare automazioni non ancora verificate. L’obiettivo è ridurre le verifiche ripetitive e permettere al team di capire subito dove esiste un conflitto da risolvere.",
      "Per le aziende con più sedi, la stessa logica può essere estesa a filtri, permessi e responsabilità differenti. La configurazione va definita durante l’analisi iniziale: sedi, fasce orarie, classi veicolo, regole di assegnazione e condizioni commerciali non sono uguali per tutti gli autonoleggi.",
    ],
    outcomes: [
      {
        title: "Disponibilità leggibile",
        copy: "Veicoli, intervalli, sedi e stati operativi vengono consultati nello stesso contesto.",
      },
      {
        title: "Passaggi collegati",
        copy: "Il booking alimenta contratto, consegna, rientro e aggiornamento della flotta.",
      },
      {
        title: "Priorità condivise",
        copy: "Banco e operations lavorano su un quadro comune invece di ricostruire informazioni sparse.",
      },
    ],
    workflowTitle: "Quali passaggi collega il booking?",
    workflow: [
      {
        phase: "Richiesta",
        input: "Date, sede, classe veicolo e contatto.",
        output: "Intervallo da verificare.",
      },
      {
        phase: "Disponibilità",
        input: "Prenotazioni, rientri e fermi previsti.",
        output: "Mezzi compatibili da valutare.",
      },
      {
        phase: "Conferma",
        input: "Cliente, tariffa e veicolo assegnato.",
        output: "Booking pronto per il contratto.",
      },
      {
        phase: "Operatività",
        input: "Uscita, rientro, chilometri ed eventuali extra.",
        output: "Flotta e KPI aggiornati.",
      },
    ],
    assuranceTitle: "Configurazione, migrazione e controllo.",
    assurance: [
      "La migrazione parte da un inventario delle fonti esistenti: fogli, calendari, anagrafiche e contratti. Prima dell’importazione serve definire quali dati sono affidabili, quali vanno normalizzati e quali non devono essere portati nel nuovo sistema.",
      "Ruoli e permessi devono riflettere le responsabilità reali. Le dichiarazioni definitive su backup, continuità e conservazione dipendono dall’ambiente produttivo e vanno validate prima del rilascio.",
    ],
    faqs: [
      {
        question: "Il planner evita automaticamente ogni sovrapposizione?",
        answer:
          "Il sistema è progettato per rendere visibili conflitti e indisponibilità. Regole automatiche e blocchi definitivi devono essere configurati e testati sul processo reale.",
      },
      {
        question: "Posso gestire più sedi?",
        answer:
          "La configurazione Enterprise è pensata per scenari multi-sede, con filtri e governance da definire durante l’analisi.",
      },
      {
        question: "La demo crea prenotazioni vere?",
        answer:
          "No. La demo interattiva usa esclusivamente scenari dimostrativi e non crea prenotazioni reali.",
      },
    ],
    related: [
      { label: "Contratti digitali", href: "/contratti-digitali" },
      { label: "Gestionale flotta", href: "/gestionale-flotta" },
      { label: "Confronta i piani", href: "/prezzi" },
    ],
  },
  "contratti-digitali": {
    slug: "contratti-digitali",
    label: "Contratti digitali",
    kicker: "Documenti e firma",
    title: "Contratti digitali collegati a cliente, veicolo e booking.",
    description:
      "Fleetum organizza dati, condizioni, documenti e firma del contratto di noleggio nello stesso flusso operativo.",
    question: "Come si digitalizza un contratto di autonoleggio?",
    answer:
      "Digitalizzare un contratto di autonoleggio significa collegare il documento ai dati già approvati nel booking, evitando copie manuali tra sistemi diversi. Fleetum riunisce cliente, guidatori, veicolo, periodo, tariffa, extra e condizioni in un flusso che prepara il PDF e mantiene il documento associato alla prenotazione. La firma e l’invio possono essere integrati solo dopo aver definito validità, canali e responsabilità nel contesto produttivo. Il vantaggio operativo è avere una versione riconoscibile, uno stato leggibile e uno storico collegato al noleggio. La conformità legale non deriva dal solo software: modelli contrattuali, informative, conservazione e modalità di firma devono essere revisionati da professionisti. La demo interattiva mostra l’esperienza con dati dimostrativi, senza generare contratti validi né trasmettere documenti.",
    overviewTitle: "Un documento non dovrebbe perdere il suo contesto.",
    overview: [
      "Quando il contratto nasce da un file separato, ogni modifica rischia di introdurre differenze tra prenotazione, anagrafica e condizioni applicate. Fleetum tratta il documento come una fase del noleggio: i dati confermati vengono riutilizzati e restano collegati al veicolo e al cliente. Questo riduce la necessità di cercare l’ultima versione tra cartelle, email e chat.",
      "Lo stato del contratto deve essere immediato: da preparare, da verificare, da firmare o completato. La piattaforma può organizzare questi passaggi e le relative evidenze, mentre i canali effettivi di firma e invio vanno selezionati in fase di implementazione. Non vengono dichiarate firme qualificate o conservazioni certificate senza una specifica integrazione verificata.",
      "I modelli devono riflettere il tipo di noleggio, le condizioni commerciali e le responsabilità aziendali. Per questo la configurazione non consiste solo nel caricare un logo: servono mappatura dei campi, gestione delle varianti, regole di accesso e un processo di approvazione dei testi.",
    ],
    outcomes: [
      {
        title: "Dati coerenti",
        copy: "Cliente, veicolo e condizioni derivano dal booking approvato.",
      },
      {
        title: "Stato visibile",
        copy: "Il team riconosce quali contratti richiedono verifica, firma o completamento.",
      },
      {
        title: "Storico collegato",
        copy: "Documento e attività restano associati al noleggio anziché dispersi.",
      },
    ],
    workflowTitle: "Da quali informazioni nasce il contratto?",
    workflow: [
      {
        phase: "Anagrafica",
        input: "Cliente, società, guidatori e documenti.",
        output: "Soggetti identificati.",
      },
      {
        phase: "Noleggio",
        input: "Veicolo, periodo, sede e tariffa.",
        output: "Condizioni operative.",
      },
      {
        phase: "Documento",
        input: "Modello approvato, extra e clausole.",
        output: "PDF da verificare.",
      },
      {
        phase: "Completamento",
        input: "Firma e canale configurato.",
        output: "Evidenza collegata al booking.",
      },
    ],
    assuranceTitle: "Validazione legale e protezione dei documenti.",
    assurance: [
      "Prima dell’uso reale vanno approvati modelli, informative, condizioni e DPA. Fleetum non sostituisce la consulenza legale e non attribuisce validità a testi ancora in bozza.",
      "Accessi, retention, download e cancellazione devono seguire ruoli definiti. Storage privato, backup e procedure di incidente vanno verificati nell’infrastruttura scelta per la produzione.",
    ],
    faqs: [
      {
        question: "Fleetum include una firma con valore legale?",
        answer:
          "L’esperienza è predisposta per integrare un processo di firma, ma il livello giuridico dipende dal provider e dalla configurazione effettivamente approvati.",
      },
      {
        question: "Posso usare il mio modello di contratto?",
        answer:
          "Il modello può essere mappato dopo una verifica dei campi, delle varianti e dei testi definitivi.",
      },
      {
        question: "Dove restano i documenti nella demo?",
        answer:
          "La demo interattiva non carica né invia documenti reali.",
      },
    ],
    related: [
      { label: "Booking noleggi", href: "/booking-noleggi" },
      { label: "Sicurezza e privacy", href: "/sicurezza" },
      { label: "Richiedi una demo", href: "/demo" },
    ],
  },
  "gestionale-flotta": {
    slug: "gestionale-flotta",
    label: "Gestionale flotta",
    kicker: "Veicoli e operatività",
    title: "Gestionale flotta per disponibilità, utilizzo e controllo.",
    description:
      "Organizza veicoli, sedi, disponibilità, booking, manutenzioni e indicatori operativi con Fleetum.",
    question: "A cosa serve un gestionale flotta per autonoleggio?",
    answer:
      "Un gestionale flotta per autonoleggio serve a sapere non solo quali veicoli possiedi, ma quali possono essere noleggiati, dove si trovano e quali attività ne limitano l’uso. Fleetum collega la scheda del mezzo a booking, rientri, scadenze, manutenzioni e indicatori operativi. La targa diventa così un punto di accesso a storico e priorità, mentre sede e stato aiutano il team a distinguere disponibilità commerciale da semplice presenza fisica. Il sistema è pensato per ridurre ricostruzioni manuali e rendere confrontabili dati che spesso vivono in fogli separati. Automazioni, telematica e integrazioni dipendono dalla configurazione reale e non sono date per attive nella demo. La demo interattiva mostra dati dimostrativi, non effettua controlli su veicoli veri e non sostituisce procedure tecniche o amministrative dell’azienda.",
    overviewTitle: "La scheda veicolo come centro operativo.",
    overview: [
      "Una targa isolata non racconta se il mezzo è prenotato, in rientro, fermo o in attesa di manutenzione. Fleetum organizza questi eventi intorno alla scheda veicolo e li rende consultabili nel flusso quotidiano. Il team può partire dalla stessa definizione di stato e ridurre interpretazioni differenti tra banco e operations.",
      "La disponibilità commerciale dipende dall’intervallo temporale e dalle attività pianificate. Collegare booking e manutenzione aiuta a vedere in anticipo una sovrapposizione; non elimina però la necessità di regole aziendali, controlli e responsabilità chiare. Le notifiche devono essere tarate per evitare sia silenzi pericolosi sia un eccesso di alert.",
      "Per la direzione, una base coerente permette di leggere occupazione, ricavi e fermi per sede o categoria. Gli esempi visivi sono dimostrativi: metriche, formule e fonti vanno concordate prima di essere usate per decisioni economiche reali.",
    ],
    outcomes: [
      {
        title: "Stato condiviso",
        copy: "Banco, operations e direzione leggono la stessa condizione del mezzo.",
      },
      {
        title: "Storico consultabile",
        copy: "Booking, rientri e attività tecniche restano collegati alla targa.",
      },
      {
        title: "KPI definibili",
        copy: "Occupazione e fermi possono essere misurati su fonti e formule approvate.",
      },
    ],
    workflowTitle: "Quali dati compongono la vista flotta?",
    workflow: [
      {
        phase: "Identità",
        input: "Targa, categoria, sede e informazioni del mezzo.",
        output: "Scheda univoca.",
      },
      {
        phase: "Uso",
        input: "Booking, uscite, rientri e chilometri.",
        output: "Stato operativo aggiornato.",
      },
      {
        phase: "Cura",
        input: "Scadenze, fermi e manutenzioni.",
        output: "Attività da pianificare.",
      },
      {
        phase: "Controllo",
        input: "Dati coerenti per periodo e sede.",
        output: "Indicatori da verificare.",
      },
    ],
    assuranceTitle: "Importazione e qualità del dato.",
    assurance: [
      "Prima di migrare una flotta occorre normalizzare targhe, sedi, categorie e stati. Record duplicati o definizioni incoerenti produrrebbero una nuova interfaccia ma non un controllo migliore.",
      "Permessi, tracciamento delle modifiche e procedure di ripristino devono essere testati in produzione. Eventuali integrazioni con telematica, contabilità o provider esterni richiedono un progetto specifico.",
    ],
    faqs: [
      {
        question: "Fleetum sostituisce i sistemi telematici?",
        answer:
          "No. Può essere progettata un’integrazione, ma posizione e telemetria richiedono fonti esterne autorizzate.",
      },
      {
        question: "Come si calcola l’occupazione?",
        answer:
          "La formula deve essere definita con l’azienda, chiarendo intervalli, indisponibilità e veicoli inclusi.",
      },
      {
        question: "Posso separare le sedi?",
        answer:
          "Sì, lo scenario multi-sede è previsto nel piano Enterprise e va configurato con ruoli e visibilità adeguati.",
      },
    ],
    related: [
      { label: "Scadenze e manutenzione", href: "/scadenze-manutenzione" },
      { label: "Booking noleggi", href: "/booking-noleggi" },
      { label: "Esplora i moduli", href: "/moduli" },
    ],
  },
  "scadenze-manutenzione": {
    slug: "scadenze-manutenzione",
    label: "Scadenze e manutenzione",
    kicker: "Prevenzione operativa",
    title: "Scadenze e manutenzione prima che blocchino un booking.",
    description:
      "Collega revisioni, chilometri, manutenzioni e fermi tecnici alla pianificazione dei noleggi con Fleetum.",
    question: "Come gestire scadenze e manutenzione di una flotta a noleggio?",
    answer:
      "Per gestire scadenze e manutenzione di una flotta a noleggio occorre collegare ogni attività tecnica al veicolo, alla data o soglia prevista e ai booking che potrebbero essere coinvolti. Fleetum organizza revisioni, manutenzioni programmate e fermi tecnici nello stesso contesto della disponibilità. In questo modo il team può vedere una criticità prima di assegnare il mezzo e definire priorità, responsabile e stato dell’intervento. Il software supporta il processo, ma non sostituisce i controlli tecnici, le prescrizioni normative o le decisioni del responsabile flotta. Soglie chilometriche, frequenze e notifiche devono essere configurate su dati affidabili. La demo interattiva usa scadenze dimostrative, non invia avvisi reali e non certifica l’idoneità di alcun veicolo.",
    overviewTitle: "Dallo scadenziario isolato alla pianificazione.",
    overview: [
      "Una scadenza vista troppo tardi può trasformarsi in un fermo imprevisto o in una riassegnazione urgente. Fleetum rende l’attività visibile accanto ai periodi di utilizzo, così l’operatore può valutarne l’impatto sul booking. La priorità non deriva solo dalla data: contano sede, disponibilità alternativa e stato effettivo del mezzo.",
      "I fermi tecnici richiedono un percorso distinto dalle manutenzioni programmate. Apertura, responsabile, motivo, costi e chiusura devono restare leggibili senza confondere il dato tecnico con lo stato commerciale. Il modello operativo aiuta a mantenere lo storico, mentre le procedure dell’officina o del fornitore restano responsabilità dell’azienda.",
      "Gli alert devono essere utili e verificabili. Prima dell’attivazione vanno definite le fonti dei chilometri, le frequenze di aggiornamento e i destinatari. Una notifica basata su dati incompleti può generare falsa sicurezza; per questo importazione e controllo qualità sono parte del progetto.",
    ],
    outcomes: [
      {
        title: "Impatto visibile",
        copy: "La scadenza viene letta insieme alle prenotazioni potenzialmente coinvolte.",
      },
      {
        title: "Responsabilità chiara",
        copy: "Ogni fermo può avere stato, referente e prossima azione definiti.",
      },
      {
        title: "Storico ordinato",
        copy: "Eventi e costi possono restare associati al veicolo per analisi successive.",
      },
    ],
    workflowTitle: "Come entra una scadenza nel flusso?",
    workflow: [
      {
        phase: "Regola",
        input: "Data, chilometri o condizione da monitorare.",
        output: "Soglia configurata.",
      },
      {
        phase: "Segnale",
        input: "Dati aggiornati e anticipo definito.",
        output: "Priorità da valutare.",
      },
      {
        phase: "Pianificazione",
        input: "Booking, sede e disponibilità alternative.",
        output: "Finestra di intervento.",
      },
      {
        phase: "Chiusura",
        input: "Esito, costi e nuovo riferimento.",
        output: "Storico e prossima soglia.",
      },
    ],
    assuranceTitle: "Dati tecnici, ruoli e verifiche.",
    assurance: [
      "La migrazione deve distinguere scadenze ancora valide, attività concluse e record senza fonte. Ogni soglia va associata a una responsabilità interna e a un processo di verifica.",
      "Le dichiarazioni su disponibilità, backup e alert dipendono dall’ambiente produttivo. Il responsabile flotta mantiene l’ultima decisione sulla sicurezza e sull’idoneità del mezzo.",
    ],
    faqs: [
      {
        question: "Fleetum certifica che un veicolo può circolare?",
        answer:
          "No. Organizza informazioni e priorità, ma l’idoneità dipende da controlli e responsabilità professionali.",
      },
      {
        question: "Gli alert partono via email o messaggio?",
        answer:
          "I canali vanno scelti e testati nella configurazione produttiva; la demo interattiva non invia alert reali.",
      },
      {
        question: "Posso registrare costi e tempi del fermo?",
        answer:
          "Il modello prevede l’associazione di tempi, costi e responsabilità al fermo tecnico.",
      },
    ],
    related: [
      { label: "Gestionale flotta", href: "/gestionale-flotta" },
      { label: "Sicurezza", href: "/sicurezza" },
      { label: "Come funziona Fleetum", href: "/come-funziona" },
    ],
  },
  "come-funziona": {
    slug: "come-funziona",
    label: "Come funziona",
    kicker: "Adozione e migrazione",
    title: "Come funziona Fleetum, dalla demo all’operatività.",
    description:
      "Dalla mappatura dei processi alla configurazione, migrazione e verifica: scopri come si introduce Fleetum in un autonoleggio.",
    question: "Come si introduce Fleetum in un autonoleggio?",
    answer:
      "Fleetum si introduce partendo dal processo reale dell’autonoleggio, non da un elenco generico di funzioni. La prima fase chiarisce sedi, numero di veicoli, ruoli, fonti dati e priorità. Segue una configurazione del flusso minimo: anagrafiche, booking, contratti, stati della flotta e scadenze. I dati da migrare vengono inventariati e verificati prima dell’importazione, evitando di trasferire duplicati o campi senza fonte. Il team prova scenari concreti e valida permessi, responsabilità e risultati attesi. Solo dopo questa verifica si definiscono eventuali integrazioni, automazioni e rilascio. Backup, continuità, privacy e documenti legali devono essere approvati nell’ambiente produttivo. La demo interattiva consente di valutare struttura e interazioni con scenari dimostrativi; la richiesta demo invia invece i dati indicati al team Fleetum.",
    overviewTitle: "Un percorso controllato, non un cambio improvviso.",
    overview: [
      "Il primo obiettivo è costruire un linguaggio comune. Termini come disponibile, confermato, in rientro o fermo devono avere lo stesso significato per banco, operations e direzione. La mappa del processo identifica passaggi, eccezioni e fonti utilizzate oggi; da qui si definisce lo scenario minimo che Fleetum deve rappresentare.",
      "La configurazione iniziale privilegia il lavoro quotidiano: anagrafiche, veicoli, booking e responsabilità. Aggiungere subito ogni automazione aumenterebbe il rischio di replicare processi non ancora chiariti. Le integrazioni vengono quindi valutate dopo che dati e stati principali sono stati verificati su casi reali controllati.",
      "Il rilascio produttivo richiede una checklist distinta dall’esperienza grafica. Comprende accessi, retention, backup, incident response, testi legali, subfornitori e canali di assistenza. Il sito descrive ciò che è progettato e segnala ciò che resta da confermare, senza trasformare una predisposizione in una promessa.",
    ],
    outcomes: [
      {
        title: "Processo mappato",
        copy: "Sedi, ruoli, eccezioni e fonti vengono chiariti prima della configurazione.",
      },
      {
        title: "Dati verificati",
        copy: "Migrazione e normalizzazione avvengono su un perimetro approvato.",
      },
      {
        title: "Rilascio misurabile",
        copy: "Scenari, controlli e responsabilità vengono testati prima dell’uso reale.",
      },
    ],
    workflowTitle: "Quali sono le fasi di adozione?",
    workflow: [
      {
        phase: "Analisi",
        input: "Processi, sedi, ruoli e problemi prioritari.",
        output: "Perimetro condiviso.",
      },
      {
        phase: "Configurazione",
        input: "Stati, moduli e permessi necessari.",
        output: "Flusso minimo verificabile.",
      },
      {
        phase: "Migrazione",
        input: "Fonti inventariate, pulite e approvate.",
        output: "Dati coerenti nel sistema.",
      },
      {
        phase: "Verifica",
        input: "Scenari operativi e controlli produttivi.",
        output: "Decisione di rilascio.",
      },
    ],
    assuranceTitle: "Cosa viene verificato prima del rilascio?",
    assurance: [
      "Accessi, permessi, backup, ripristino, logging e procedure di incidente devono produrre evidenze. Privacy, termini, DPA e cookie richiedono dati societari e revisione professionale.",
      "Il team verifica percorsi critici su desktop e mobile, qualità dei dati, casi di errore e responsabilità di assistenza. La pubblicazione del sito e il collegamento al dominio restano una decisione separata.",
    ],
    faqs: [
      {
        question: "Quanto dura l’introduzione?",
        answer:
          "La durata dipende da sedi, qualità dei dati, moduli e integrazioni. Non viene indicato un tempo standard senza analisi.",
      },
      {
        question: "Devo migrare tutti i dati?",
        answer:
          "No. Il perimetro va scelto in base a utilità, qualità e obblighi di conservazione.",
      },
      {
        question: "Il sito pubblico attiva Fleetum?",
        answer:
          "No. Il sito presenta prodotto e demo; l’attivazione richiede onboarding, scelta del piano e checkout Stripe nell’area riservata.",
      },
    ],
    related: [
      { label: "Panoramica prodotto", href: "/prodotto" },
      { label: "Sicurezza e continuità", href: "/sicurezza" },
      { label: "Richiedi una demo", href: "/demo" },
    ],
  },
};
