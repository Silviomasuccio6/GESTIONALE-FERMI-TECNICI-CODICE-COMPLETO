export const publicOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://fleetum.it";

export const appLoginUrl =
  process.env.NEXT_PUBLIC_APP_LOGIN_URL?.trim() || "https://fleetum.it/login";

export const isIndexable =
  process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

export type PrimaryNavItem = {
  href: string;
  label: string;
  description: string;
  activePaths?: readonly string[];
};

export const primaryNav: PrimaryNavItem[] = [
  {
    href: "/prodotto",
    label: "Prodotto",
    description: "Il flusso operativo completo",
  },
  {
    href: "/moduli",
    label: "Moduli",
    description: "Booking, contratti, flotta e KPI",
  },
  {
    href: "/soluzioni",
    label: "Soluzioni",
    description: "Percorsi dedicati ai processi chiave",
    activePaths: [
      "/booking-noleggi",
      "/contratti-digitali",
      "/gestionale-flotta",
      "/scadenze-manutenzione",
    ],
  },
  {
    href: "/come-funziona",
    label: "Come funziona",
    description: "Analisi, configurazione e adozione",
  },
  {
    href: "/sicurezza",
    label: "Sicurezza",
    description: "Dati, ruoli e continuità",
  },
  {
    href: "/prezzi",
    label: "Prezzi",
    description: "Piani e confronto funzionalità",
  },
  {
    href: "/chi-siamo",
    label: "Chi siamo",
    description: "Il progetto e i principi Fleetum",
  },
];

export const modules = [
  {
    number: "01",
    name: "Booking noleggi",
    copy: "Planner mensile per veicolo, sede e stato operativo.",
    detail:
      "Disponibilità, uscite, rientri e sovrapposizioni restano leggibili nello stesso calendario.",
  },
  {
    number: "02",
    name: "Contratti digitali",
    copy: "PDF brandizzati, firma cliente e invio multicanale.",
    detail:
      "Cliente, guidatori, veicolo, condizioni e firma confluiscono in un documento collegato al booking.",
  },
  {
    number: "03",
    name: "Clienti",
    copy: "Persone e società con documenti, patente e storico.",
    detail:
      "Una scheda ordinata conserva anagrafiche, documenti e attività utili al prossimo noleggio.",
  },
  {
    number: "04",
    name: "Veicoli",
    copy: "Targhe, sedi, disponibilità, revisioni e manutenzione.",
    detail:
      "Ogni mezzo mantiene un quadro operativo unico, leggibile dal banco e dalla direzione.",
  },
  {
    number: "05",
    name: "Scadenziario",
    copy: "Avvisi su revisioni, chilometri e priorità operative.",
    detail:
      "Le scadenze entrano nella pianificazione prima di trasformarsi in un fermo imprevisto.",
  },
  {
    number: "06",
    name: "Fermi tecnici",
    copy: "Aperture, responsabili, tempi, costi e impatto sui booking.",
    detail:
      "Manutenzione e indisponibilità restano visibili accanto alle prenotazioni interessate.",
  },
  {
    number: "07",
    name: "Listini",
    copy: "Pacchetti km, extra e prezzi sempre coerenti.",
    detail:
      "Regole e condizioni commerciali alimentano preventivi e contratti senza duplicazioni manuali.",
  },
  {
    number: "08",
    name: "Dashboard KPI",
    copy: "Ricavi, occupazione, contratti e rientri in una vista.",
    detail:
      "Le priorità operative vengono prima dei grafici: il team vede subito dove intervenire.",
  },
];

export const plans = [
  {
    name: "Starter",
    price: "149",
    description: "Per piccoli autonoleggi che vogliono uscire da fogli e chat.",
    features: [
      "Booking e flotta",
      "Clienti e contratti",
      "Dashboard operativa",
      "Scadenze principali",
    ],
  },
  {
    name: "Pro",
    price: "199",
    description: "Per team che gestiscono noleggi e contratti ogni giorno.",
    featured: true,
    features: [
      "Flussi contrattuali evoluti",
      "Manutenzioni e listini",
      "Statistiche e alert",
      "Operatività avanzata",
    ],
  },
  {
    name: "Enterprise",
    price: "249",
    description:
      "Per aziende multi-sede con governance e processi complessi.",
    features: [
      "Controllo multi-sede",
      "Governance avanzata",
      "Automazioni e integrazioni",
      "Supporto prioritario",
    ],
  },
];

export const faqs = [
  {
    question: "A chi è rivolto Fleetum?",
    answer:
      "Ad autonoleggi e operatori di flotta che vogliono collegare booking, contratti, clienti, veicoli e scadenze in un unico flusso.",
  },
  {
    question: "Posso vedere Fleetum sul mio processo reale?",
    answer:
      "Sì. La demo parte da sedi, numero di veicoli e modo di lavorare, così il percorso resta concreto e non una presentazione generica.",
  },
  {
    question: "I prezzi includono l’IVA?",
    answer:
      "Sì. I prezzi mensili mostrati per Starter, Pro ed Enterprise includono l’IVA.",
  },
  {
    question: "È prevista una prova?",
    answer:
      "Il flusso prevede 14 giorni di prova. Prima dell’attivazione viene richiesto un metodo di pagamento valido.",
  },
  {
    question: "Fleetum gestisce più sedi?",
    answer:
      "Il piano Enterprise è pensato per aziende multi-sede che richiedono governance e processi più complessi.",
  },
  {
    question: "Come vengono gestiti ruoli e dati?",
    answer:
      "Fleetum è progettato con workspace separati, ruoli, audit operativo, accesso autenticato e procedure di backup da verificare nel contesto produttivo.",
  },
];

export const securityItems = [
  {
    number: "01",
    title: "Workspace separati",
    copy: "Architettura multi-tenant pensata per isolare aziende e dati.",
  },
  {
    number: "02",
    title: "Ruoli e permessi",
    copy: "Accesso alle funzioni in base al profilo operativo autorizzato.",
  },
  {
    number: "03",
    title: "Audit operativo",
    copy: "Le operazioni sensibili producono evidenze utili alla verifica.",
  },
  {
    number: "04",
    title: "Documenti protetti",
    copy: "Accesso autenticato e gestione privata dei file applicativi.",
  },
  {
    number: "05",
    title: "Backup e continuità",
    copy: "Procedure operative da completare e verificare nell’ambiente produttivo.",
  },
  {
    number: "06",
    title: "Privacy by workflow",
    copy: "Dati, responsabilità e conservazione vengono trattati come parte del processo.",
  },
];

export const legalDocuments = {
  privacy: {
    eyebrow: "Privacy",
    title: "Informativa privacy Fleetum",
    intro:
      "Questa informativa descrive in modo operativo come Fleetum supporta i clienti SaaS nella gestione di dati, documenti, contratti e processi di flotta.",
    items: [
      [
        "Dati trattati",
        "Dati anagrafici, contatti, dati aziendali, documenti, patente, prenotazioni, contratti, firme, veicoli, manutenzioni, scadenze, log tecnici e audit applicativi.",
      ],
      [
        "Finalità",
        "Erogazione del gestionale, gestione noleggi, contratti, comunicazioni operative, sicurezza, assistenza, obblighi amministrativi e miglioramento del servizio.",
      ],
      [
        "Ruoli privacy",
        "Il cliente SaaS opera normalmente come titolare del trattamento sui dati dei propri clienti. Fleetum opera come fornitore o responsabile tecnico secondo accordi contrattuali e DPA da finalizzare.",
      ],
      [
        "Conservazione",
        "I dati sono conservati per il tempo necessario a finalità contrattuali, fiscali, operative e di sicurezza. Le policy di retention devono essere configurate e validate per ogni contesto produttivo.",
      ],
      [
        "Diritti",
        "Accesso, rettifica, cancellazione, limitazione, opposizione e portabilità possono essere esercitati tramite i canali privacy indicati dal titolare del trattamento.",
      ],
    ],
  },
  termini: {
    eyebrow: "Termini",
    title: "Termini e condizioni del servizio",
    intro:
      "Documento operativo preliminare per l’utilizzo di Fleetum come SaaS B2B. La versione contrattuale finale deve essere approvata legalmente prima della vendita definitiva.",
    items: [
      [
        "Oggetto",
        "Fleetum fornisce strumenti software per booking noleggi, contratti, clienti, flotta, manutenzioni, scadenze e dashboard operative.",
      ],
      [
        "Account aziendale",
        "Ogni azienda cliente opera nel proprio workspace tenant. Gli utenti devono mantenere credenziali sicure e usare ruoli coerenti con le responsabilità interne.",
      ],
      [
        "Piani e pagamenti",
        "L’accesso alle funzionalità dipende dal piano attivo. Mancati pagamenti o uso non conforme possono comportare limitazioni o sospensione del servizio.",
      ],
      [
        "Dati e contenuti",
        "Il cliente resta responsabile della correttezza dei dati inseriti, dei documenti caricati e dell’utilizzo dei contratti generati.",
      ],
      [
        "Disponibilità",
        "Fleetum è progettato per uso professionale, con backup, monitoraggio e procedure operative da completare in ambiente di produzione.",
      ],
    ],
  },
  dpa: {
    eyebrow: "DPA",
    title: "Data Processing Agreement — schema operativo",
    intro:
      "Schema tecnico-organizzativo per disciplinare il trattamento dati tra cliente SaaS e Fleetum. Non sostituisce il DPA legale definitivo.",
    items: [
      [
        "Categorie dati",
        "Clienti noleggio, referenti aziendali, utenti tenant, documenti, contratti, log applicativi e dati relativi a veicoli e operazioni.",
      ],
      [
        "Misure tecniche",
        "Tenant isolation, ruoli, audit log, HTTPS, controlli upload, backup e monitoraggio sono le misure applicative previste o in completamento.",
      ],
      [
        "Subfornitori",
        "Provider cloud, email, pagamento, storage, monitoraggio e servizi infrastrutturali devono essere elencati e mantenuti aggiornati.",
      ],
      [
        "Incidenti",
        "Eventuali incidenti devono essere gestiti con processo di escalation, analisi impatto, mitigazione e comunicazione secondo normativa applicabile.",
      ],
    ],
  },
  cookie: {
    eyebrow: "Cookie",
    title: "Cookie Policy",
    intro:
      "Fleetum usa cookie tecnici necessari al funzionamento e può usare strumenti analytics solo dopo consenso esplicito.",
    items: [
      [
        "Cookie necessari",
        "Servono per memorizzare le preferenze privacy e garantire le funzioni essenziali del sito. Non includono strumenti pubblicitari.",
      ],
      [
        "Analytics first-party",
        "Dopo consenso, Fleetum può registrare pagina visitata, tipo di interazione, origine del referrer e parametri campagna. Gli eventi usano identificatori pseudonimi di visitatore e sessione; non includono i dati inseriti nel form demo.",
      ],
      [
        "Marketing",
        "Non sono attivi cookie pubblicitari, remarketing o profilazione marketing. La categoria resta disabilitata nell’interfaccia finché tali strumenti non vengono introdotti e documentati.",
      ],
      [
        "Revoca",
        "Puoi modificare o revocare il consenso in qualsiasi momento usando il pulsante Preferenze cookie disponibile nel sito.",
      ],
    ],
  },
} as const;
