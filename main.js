/* Nova Launcher · scripts de la web.
   Qué hace: idioma, aviso de términos, versión y novedades (desde GitHub y el README),
   vídeo de fondo, línea de progreso y animaciones. */
(function () {
  "use strict";

  const REPO = "JustMarcoDev/nova-launcher";
  const API = `https://api.github.com/repos/${REPO}`;
  const RELEASES_URL = `https://github.com/${REPO}/releases`;
  const README_URL = `https://raw.githubusercontent.com/${REPO}/main/README.md`;

  const KEY_LANG = "nova-lang";
  const KEY_TOS = "nova-tos-accepted";

  const LANGS = ["es", "en", "fr", "it"];
  const LOCALES = { es: "es-ES", en: "en-US", fr: "fr-FR", it: "it-IT" };

  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(pointer: fine)").matches;

  let currentLang = "es";
  const originals = new Map(); // textos originales (español) de cada elemento

  // Datos que se rellenan al cargar desde GitHub
  const state = {
    release: null,        // última estable según la API { tag, date }
    exeUrl: null,         // enlace directo al .exe
    releaseFailed: false, // la API no respondió
    beta: null,           // última beta según la API { tag, date }
    releases: null,       // lista de releases de la API
    readmeStable: null,   // última estable según el README { tag, date }
    readmeBeta: null,     // última beta según el README { tag, date }
    changelog: null,      // entradas del historial
    changelogFailed: false,
  };

  root.classList.add("js");


  /* ----- Almacenamiento seguro (puede fallar en modo privado) ----- */

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* sin almacenamiento: la preferencia solo dura esta visita */
      }
    },
  };


  /* ----- Textos de la interfaz (inglés, francés, italiano) -----
     El español ya está en el HTML y se guarda como original. */

  const DICT = {
    es: {
      lang_group: "Idioma",
      version_loading: "Buscando la última versión…",
      version_fmt: "Versión {v} · .exe",
      version_fallback: "Ver última versión",
      published_on: "Publicada el",
      news_loading: "Cargando novedades…",
      news_fail: "No se pudo cargar el historial ahora mismo. Puedes verlo en GitHub.",
    },
    en: {
      lang_group: "Language",
      nav_about: "About", nav_how: "How to start", nav_req: "Requirements", nav_news: "News",
      nav_creators: "Creators", nav_help: "Help", btn_download_short: "Download",
      hero_eyebrow: "Minecraft launcher · Windows",
      hero_lead: "Play Minecraft in any version, from the old betas to the latest, with a fluid space-themed interface made for you.",
      btn_download_win: "Download for Windows", btn_discover: "Discover Nova",
      stat_versions: "Minecraft versions",
      stat_loaders: "loaders: Vanilla, Fabric, Forge and NeoForge",
      stat_instances: "instances with their own mods and worlds",
      about_eyebrow: "About Nova", about_title: "A launcher made for playing, not for configuring",
      about_intro: "Nova brings everything you need into one app: versions, mods, accounts and settings, with an interface that looks as good as the game.",
      c1_t: "Every version", c1_d: "From the old betas to 26.3. Install the one you want, whenever you want, without searching the internet.",
      c2_t: "Independent instances", c2_d: "Each instance has its own mods, settings and worlds. Whatever you try in one never breaks the others.",
      c3_t: "Mods and modpacks", c3_d: "Search and manage mods from Modrinth and CurseForge, or build your own modpack from scratch inside the launcher.",
      c4_t: "Space design", c4_d: "Smooth animations and a background that comes alive while you choose what to play. You notice it from the first second.",
      c5_t: "Made for everyone", c5_d: "Accent colours, typefaces, text size and bold text so the interface reads comfortably on any screen.",
      c6_t: "Updates itself", c6_d: "It warns you when a new version comes out and updates from its own interface. No reinstalling every time.",
      c7_t: "Offline or Microsoft account", c7_d: "Play offline with an offline account or sign in with your official Microsoft account, whichever you prefer.",
      c8_t: "Fast and optimised", c8_d: "Careful startup and controlled memory use, with a RAM recommendation for your computer.",
      how_eyebrow: "How to start", how_title: "From download to playing in four steps",
      s1_t: "Download the installer", s1_d: "A single .exe file. The button always takes you to the latest published version.",
      s2_t: "Install it your way", s2_d: "Choose the install folder and, if you want, a desktop shortcut.",
      s3_t: "Pick a version and play", s3_d: "Select the Minecraft version you want and press Play. The instance is created automatically.",
      s4_t: "Stay up to date", s4_d: "Nova tells you about news and updates from inside, without losing your instances.",
      req_eyebrow: "Requirements", req_title: "What you need to play",
      req_os_t: "Operating system", req_os_d: "Windows 11, 64-bit.",
      req_ram_t: "RAM memory", req_ram_d: "Minimum 4 GB. Recommended 8 GB or more. With 8 GB or less, Nova turns on low-power mode.",
      req_disk_t: "Disk space", req_disk_d: "Recommended at least 5 GB free; more if you use many versions and mods.",
      req_java_t: "Java", req_java_d: "You don't need to install it. Nova downloads the right version for each Minecraft.",
      req_note: "Approximate requirements based on the latest published beta.",
      news_eyebrow: "News", news_title: "Version history",
      news_stable: "Latest stable version", news_beta: "Latest beta",
      news_more: "See everything on GitHub",
      tut_eyebrow: "Tutorial", tut_title: "Download tutorial",
      tut_soon: "Coming soon. We'll add a step-by-step tutorial here to download and install Nova.",
      dl_eyebrow: "Download", dl_title: "Ready for takeoff",
      dl_desc: "Download the installer, run it and in a minute you'll have Nova ready to play.",
      dl_check1: "Windows 11, 64-bit", dl_check2: "A .exe installer, nothing to compile",
      dl_check3: "Internet connection to download versions and mods",
      dl_btn: "Download Nova", dl_all: "See all versions",
      cr_eyebrow: "Creators", cr_title: "The people behind Nova",
      cr_astrion_role: "Studio", cr_astrion_d: "Independent studio behind Nova Launcher: design, code and every detail of the universe around it.",
      cr_marco_role: "Developer and project lead", cr_marco_d: "Video game developer in training. Designs, programs and publishes every version of Nova, from the first beta to today.",
      soc_title: "Social media", soc_desc: "Follow the project and stay up to date.",
      help_eyebrow: "Help", help_title: "Frequently asked questions",
      q1: "Windows blocks the installer. Is it safe?",
      a1: `<p>It's normal for new apps that don't have a paid digital signature yet. To continue:</p><ol><li>On the SmartScreen window, click <strong>More info</strong>.</li><li>Click <strong>Run anyway</strong>.</li><li>If Microsoft Defender quarantines it, open <strong>Windows Security → Virus &amp; threat protection → Protection history</strong>, find the item and click <strong>Allow</strong>.</li></ol><p>Always download from this website or the official GitHub repository.</p>`,
      q2: "How do I update Nova?",
      a2: "Nova checks for updates when it opens and every hour. When the notice appears, close it completely and open it again: the update installs by itself. No need to reinstall anything.",
      q3: "Which Minecraft versions does it support?",
      a3: "All of them, from the old betas to 26.3. You can install the one you want and have several at once, each in its own instance.",
      q4: "Is Nova related to Mojang or Microsoft?",
      a4: "No. Nova Launcher is an independent project by Astrion Studio. Minecraft is a registered trademark of Mojang Studios and Microsoft.",
      foot_copy: "© 2026 Astrion Studio · All rights reserved",
      foot_terms: "Terms and conditions", foot_privacy: "Privacy",
      foot_aff: "Not affiliated with Mojang Studios or Microsoft. Minecraft is a registered trademark of its respective owners.",
      tos_title: "Before you start",
      tos_text: "To use this website and Nova Launcher you must accept our terms and conditions.",
      tos_read: "Read full terms", tos_accept: "I accept the terms",
      e404_title: "This orbit is empty", e404_text: "The page you're looking for doesn't exist or has moved.", e404_btn: "Back to home",
      version_fmt: "Version {v} · .exe", version_fallback: "See latest version", published_on: "Published on",
      news_fail: "We couldn't load the history right now. You can see it on GitHub.",
    },
    fr: {
      lang_group: "Langue",
      nav_about: "À propos", nav_how: "Commencer", nav_req: "Configuration", nav_news: "Nouveautés",
      nav_creators: "Créateurs", nav_help: "Aide", btn_download_short: "Télécharger",
      hero_eyebrow: "Launcher Minecraft · Windows",
      hero_lead: "Joue à Minecraft dans n'importe quelle version, des vieilles bêtas à la plus récente, avec une interface fluide et spatiale pensée pour toi.",
      btn_download_win: "Télécharger pour Windows", btn_discover: "Découvrir Nova",
      stat_versions: "versions de Minecraft",
      stat_loaders: "loaders : Vanilla, Fabric, Forge et NeoForge",
      stat_instances: "instances avec leurs propres mods et mondes",
      about_eyebrow: "À propos de Nova", about_title: "Un launcher conçu pour jouer, pas pour configurer",
      about_intro: "Nova réunit tout ce dont tu as besoin en une seule app : versions, mods, comptes et réglages, avec une interface aussi soignée que le jeu.",
      c1_t: "Toutes les versions", c1_d: "Des vieilles bêtas à la 26.3. Installe celle que tu veux, quand tu veux, sans rien chercher sur internet.",
      c2_t: "Instances indépendantes", c2_d: "Chaque instance a ses propres mods, réglages et mondes. Ce que tu testes dans l'une ne casse jamais les autres.",
      c3_t: "Mods et modpacks", c3_d: "Cherche et gère des mods de Modrinth et CurseForge, ou crée ton propre modpack depuis zéro dans le launcher.",
      c4_t: "Design spatial", c4_d: "Animations fluides et un fond qui prend vie pendant que tu choisis quoi jouer. On le remarque dès la première seconde.",
      c5_t: "Pour tout le monde", c5_d: "Couleurs d'accent, polices, taille du texte et texte en gras pour une lecture confortable sur n'importe quel écran.",
      c6_t: "Se met à jour seul", c6_d: "Il te prévient quand sort une nouvelle version et se met à jour depuis sa propre interface. Plus besoin de réinstaller.",
      c7_t: "Compte hors ligne ou Microsoft", c7_d: "Joue hors ligne avec un compte hors ligne ou connecte-toi avec ton compte Microsoft officiel, au choix.",
      c8_t: "Rapide et optimisé", c8_d: "Démarrage soigné et mémoire maîtrisée, avec une recommandation de RAM adaptée à ton ordinateur.",
      how_eyebrow: "Commencer", how_title: "Du téléchargement au jeu en quatre étapes",
      s1_t: "Télécharge l'installateur", s1_d: "Un seul fichier .exe. Le bouton te mène toujours à la dernière version publiée.",
      s2_t: "Installe-le à ta façon", s2_d: "Choisis le dossier d'installation et, si tu veux, un raccourci sur le bureau.",
      s3_t: "Choisis une version et joue", s3_d: "Sélectionne la version de Minecraft voulue et appuie sur Jouer. L'instance se crée toute seule.",
      s4_t: "Reste à jour", s4_d: "Nova te tient au courant des nouveautés et se met à jour de l'intérieur, sans perdre tes instances.",
      req_eyebrow: "Configuration", req_title: "Ce qu'il te faut pour jouer",
      req_os_t: "Système d'exploitation", req_os_d: "Windows 11, 64 bits.",
      req_ram_t: "Mémoire RAM", req_ram_d: "Minimum 4 Go. Recommandé 8 Go ou plus. Avec 8 Go ou moins, Nova active le mode basse consommation.",
      req_disk_t: "Espace disque", req_disk_d: "Recommandé au moins 5 Go libres ; davantage si tu utilises beaucoup de versions et de mods.",
      req_java_t: "Java", req_java_d: "Pas besoin de l'installer. Nova télécharge la version adaptée à chaque Minecraft.",
      req_note: "Configuration indicative d'après la dernière bêta publiée.",
      news_eyebrow: "Nouveautés", news_title: "Historique des versions",
      news_stable: "Dernière version stable", news_beta: "Dernière bêta",
      news_more: "Tout voir sur GitHub",
      tut_eyebrow: "Tutoriel", tut_title: "Tutoriel de téléchargement",
      tut_soon: "Bientôt disponible. Nous ajouterons ici un tutoriel pas à pas pour télécharger et installer Nova.",
      dl_eyebrow: "Téléchargement", dl_title: "Prêt au décollage",
      dl_desc: "Télécharge l'installateur, lance-le et en une minute Nova sera prêt à jouer.",
      dl_check1: "Windows 11, 64 bits", dl_check2: "Installateur .exe, rien à compiler",
      dl_check3: "Connexion internet pour télécharger versions et mods",
      dl_btn: "Télécharger Nova", dl_all: "Voir toutes les versions",
      cr_eyebrow: "Créateurs", cr_title: "Les personnes derrière Nova",
      cr_astrion_role: "Studio", cr_astrion_d: "Studio indépendant qui donne vie à Nova Launcher : design, code et chaque détail de l'univers qui l'entoure.",
      cr_marco_role: "Développeur et chef de projet", cr_marco_d: "Développeur de jeux vidéo en formation. Il conçoit, programme et publie chaque version de Nova, de la première bêta à aujourd'hui.",
      soc_title: "Réseaux sociaux", soc_desc: "Suis le projet et reste informé des nouveautés.",
      help_eyebrow: "Aide", help_title: "Questions fréquentes",
      q1: "Windows bloque l'installateur. Est-ce sûr ?",
      a1: `<p>C'est normal pour les nouvelles applis qui n'ont pas encore de signature numérique payante. Pour continuer :</p><ol><li>Dans la fenêtre SmartScreen, clique sur <strong>Plus d'infos</strong>.</li><li>Clique sur <strong>Exécuter quand même</strong>.</li><li>Si Microsoft Defender le met en quarantaine, ouvre <strong>Sécurité Windows → Protection contre les virus et menaces → Historique de protection</strong>, trouve l'élément et clique sur <strong>Autoriser</strong>.</li></ol><p>Télécharge toujours depuis ce site ou le dépôt officiel de GitHub.</p>`,
      q2: "Comment mettre Nova à jour ?",
      a2: "Nova cherche les mises à jour à l'ouverture et toutes les heures. Quand l'avis apparaît, ferme-le complètement puis rouvre-le : la mise à jour s'installe toute seule. Rien à réinstaller.",
      q3: "Quelles versions de Minecraft sont prises en charge ?",
      a3: "Toutes, des vieilles bêtas à la 26.3. Tu peux installer celle que tu veux et en avoir plusieurs en même temps, chacune dans son instance.",
      q4: "Nova est-il lié à Mojang ou Microsoft ?",
      a4: "Non. Nova Launcher est un projet indépendant d'Astrion Studio. Minecraft est une marque déposée de Mojang Studios et Microsoft.",
      foot_copy: "© 2026 Astrion Studio · Tous droits réservés",
      foot_terms: "Conditions générales", foot_privacy: "Confidentialité",
      foot_aff: "Non affilié à Mojang Studios ni à Microsoft. Minecraft est une marque déposée de ses propriétaires respectifs.",
      tos_title: "Avant de commencer",
      tos_text: "Pour utiliser ce site et Nova Launcher, tu dois accepter nos conditions générales.",
      tos_read: "Lire les conditions complètes", tos_accept: "J'accepte les conditions",
      e404_title: "Cette orbite est vide", e404_text: "La page que tu cherches n'existe pas ou a été déplacée.", e404_btn: "Retour à l'accueil",
      version_fmt: "Version {v} · .exe", version_fallback: "Voir la dernière version", published_on: "Publiée le",
      news_fail: "Impossible de charger l'historique pour le moment. Tu peux le voir sur GitHub.",
    },
    it: {
      lang_group: "Lingua",
      nav_about: "Info", nav_how: "Come iniziare", nav_req: "Requisiti", nav_news: "Novità",
      nav_creators: "Creatori", nav_help: "Aiuto", btn_download_short: "Scarica",
      hero_eyebrow: "Launcher di Minecraft · Windows",
      hero_lead: "Gioca a Minecraft in qualsiasi versione, dalle vecchie beta all'ultima, con un'interfaccia fluida e spaziale pensata per te.",
      btn_download_win: "Scarica per Windows", btn_discover: "Scopri Nova",
      stat_versions: "versioni di Minecraft",
      stat_loaders: "loader: Vanilla, Fabric, Forge e NeoForge",
      stat_instances: "istanze con mod e mondi propri",
      about_eyebrow: "Info su Nova", about_title: "Un launcher pensato per giocare, non per configurare",
      about_intro: "Nova riunisce tutto ciò che ti serve in un'unica app: versioni, mod, account e impostazioni, con un'interfaccia all'altezza del gioco.",
      c1_t: "Tutte le versioni", c1_d: "Dalle vecchie beta alla 26.3. Installa quella che vuoi, quando vuoi, senza cercare nulla su internet.",
      c2_t: "Istanze indipendenti", c2_d: "Ogni istanza ha mod, impostazioni e mondi propri. Quello che provi in una non rompe mai le altre.",
      c3_t: "Mod e modpack", c3_d: "Cerca e gestisci mod da Modrinth e CurseForge, oppure crea il tuo modpack da zero dentro il launcher.",
      c4_t: "Design spaziale", c4_d: "Animazioni fluide e uno sfondo che prende vita mentre scegli cosa giocare. Si nota dal primo secondo.",
      c5_t: "Pensato per tutti", c5_d: "Colori d'accento, caratteri, dimensione del testo e grassetto per leggere comodamente su ogni schermo.",
      c6_t: "Si aggiorna da solo", c6_d: "Ti avvisa quando esce una nuova versione e si aggiorna dalla sua interfaccia. Niente reinstallazioni.",
      c7_t: "Account offline o Microsoft", c7_d: "Gioca offline con un account offline o accedi con il tuo account Microsoft ufficiale, come preferisci.",
      c8_t: "Veloce e ottimizzato", c8_d: "Avvio curato e uso di memoria controllato, con un consiglio sulla RAM in base al tuo computer.",
      how_eyebrow: "Come iniziare", how_title: "Dal download al gioco in quattro passi",
      s1_t: "Scarica l'installer", s1_d: "Un solo file .exe. Il pulsante ti porta sempre all'ultima versione pubblicata.",
      s2_t: "Installalo come preferisci", s2_d: "Scegli la cartella di installazione e, se vuoi, un collegamento sul desktop.",
      s3_t: "Scegli una versione e gioca", s3_d: "Seleziona la versione di Minecraft che vuoi e premi Gioca. L'istanza viene creata da sola.",
      s4_t: "Resta aggiornato", s4_d: "Nova ti avvisa delle novità e si aggiorna dall'interno, senza perdere le tue istanze.",
      req_eyebrow: "Requisiti", req_title: "Cosa ti serve per giocare",
      req_os_t: "Sistema operativo", req_os_d: "Windows 11 a 64 bit.",
      req_ram_t: "Memoria RAM", req_ram_d: "Minimo 4 GB. Consigliati 8 GB o più. Con 8 GB o meno, Nova attiva la modalità a basso consumo.",
      req_disk_t: "Spazio su disco", req_disk_d: "Consigliati almeno 5 GB liberi; di più se usi molte versioni e mod.",
      req_java_t: "Java", req_java_d: "Non serve installarlo. Nova scarica la versione giusta per ogni Minecraft.",
      req_note: "Requisiti indicativi basati sull'ultima beta pubblicata.",
      news_eyebrow: "Novità", news_title: "Cronologia delle versioni",
      news_stable: "Ultima versione stabile", news_beta: "Ultima beta",
      news_more: "Vedi tutto su GitHub",
      tut_eyebrow: "Tutorial", tut_title: "Tutorial di download",
      tut_soon: "In arrivo. Qui aggiungeremo un tutorial passo passo per scaricare e installare Nova.",
      dl_eyebrow: "Download", dl_title: "Pronto al decollo",
      dl_desc: "Scarica l'installer, avvialo e in un minuto Nova sarà pronto per giocare.",
      dl_check1: "Windows 11 a 64 bit", dl_check2: "Installer .exe, nulla da compilare",
      dl_check3: "Connessione internet per scaricare versioni e mod",
      dl_btn: "Scarica Nova", dl_all: "Vedi tutte le versioni",
      cr_eyebrow: "Creatori", cr_title: "Le persone dietro Nova",
      cr_astrion_role: "Studio", cr_astrion_d: "Studio indipendente che dà vita a Nova Launcher: design, codice e ogni dettaglio dell'universo che lo circonda.",
      cr_marco_role: "Sviluppatore e responsabile del progetto", cr_marco_d: "Sviluppatore di videogiochi in formazione. Progetta, programma e pubblica ogni versione di Nova, dalla prima beta a oggi.",
      soc_title: "Social", soc_desc: "Segui il progetto e resta aggiornato.",
      help_eyebrow: "Aiuto", help_title: "Domande frequenti",
      q1: "Windows blocca l'installer. È sicuro?",
      a1: `<p>È normale per le app nuove che non hanno ancora una firma digitale a pagamento. Per continuare:</p><ol><li>Nella finestra SmartScreen, clicca su <strong>Ulteriori informazioni</strong>.</li><li>Clicca su <strong>Esegui comunque</strong>.</li><li>Se Microsoft Defender lo mette in quarantena, apri <strong>Sicurezza di Windows → Protezione da virus e minacce → Cronologia protezione</strong>, trova l'elemento e clicca su <strong>Consenti</strong>.</li></ol><p>Scarica sempre da questo sito o dal repository ufficiale di GitHub.</p>`,
      q2: "Come aggiorno Nova?",
      a2: "Nova controlla gli aggiornamenti all'apertura e ogni ora. Quando compare l'avviso, chiudilo del tutto e riaprilo: l'aggiornamento si installa da solo. Non serve reinstallare nulla.",
      q3: "Quali versioni di Minecraft supporta?",
      a3: "Tutte, dalle vecchie beta alla 26.3. Puoi installare quella che vuoi e averne più di una insieme, ognuna nella propria istanza.",
      q4: "Nova ha a che fare con Mojang o Microsoft?",
      a4: "No. Nova Launcher è un progetto indipendente di Astrion Studio. Minecraft è un marchio registrato di Mojang Studios e Microsoft.",
      foot_copy: "© 2026 Astrion Studio · Tutti i diritti riservati",
      foot_terms: "Termini e condizioni", foot_privacy: "Privacy",
      foot_aff: "Non affiliato a Mojang Studios né a Microsoft. Minecraft è un marchio registrato dei rispettivi proprietari.",
      tos_title: "Prima di iniziare",
      tos_text: "Per usare questo sito e Nova Launcher devi accettare i nostri termini e condizioni.",
      tos_read: "Leggi i termini completi", tos_accept: "Accetto i termini",
      e404_title: "Quest'orbita è vuota", e404_text: "La pagina che cerchi non esiste o è stata spostata.", e404_btn: "Torna alla home",
      version_fmt: "Versione {v} · .exe", version_fallback: "Vedi ultima versione", published_on: "Pubblicata il",
      news_fail: "Impossibile caricare la cronologia ora. Puoi vederla su GitHub.",
    },
  };

  // Textos del script en español (los que no están en el HTML)
  const SPANISH = DICT.es;

  function tr(key) {
    const table = DICT[currentLang] || {};
    return table[key] ?? SPANISH[key];
  }

  function rememberOriginals() {
    document.querySelectorAll("[data-i18n]").forEach((el) => originals.set(el, el.textContent));
    document.querySelectorAll("[data-i18n-html]").forEach((el) => originals.set(el, el.innerHTML));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => originals.set(el, el.getAttribute("aria-label")));
  }

  // Cambia todos los textos. Si una clave no existe en el idioma, deja el español.
  function applyLang(lang) {
    currentLang = LANGS.includes(lang) ? lang : "es";
    root.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.id === "version-label" || el.hasAttribute("data-version")) return; // lo gestiona renderVersion
      el.textContent = tr(el.dataset.i18n) ?? originals.get(el);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = tr(el.dataset.i18nHtml) ?? originals.get(el);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", tr(el.dataset.i18nAria) ?? originals.get(el));
    });

    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      const active = btn.dataset.lang === currentLang;
      btn.setAttribute("aria-pressed", String(active));
    });
    movePill();

    renderAll();
  }

  // Coloca la píldora degradada bajo el idioma activo
  function movePill() {
    const active = document.querySelector('.lang-switch button[aria-pressed="true"]');
    const pill = document.querySelector(".lang-pill");
    if (!active || !pill) return;
    pill.style.left = active.offsetLeft + "px";
    pill.style.width = active.offsetWidth + "px";
  }

  function initLang() {
    const buttons = document.querySelectorAll(".lang-switch button");

    let lang = storage.get(KEY_LANG);
    if (!LANGS.includes(lang)) {
      const browser = (navigator.language || "es").slice(0, 2).toLowerCase();
      lang = LANGS.includes(browser) ? browser : "es";
    }
    applyLang(lang);

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        applyLang(btn.dataset.lang);
        storage.set(KEY_LANG, currentLang);
      });
    });

    window.addEventListener("resize", movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  }


  /* ----- Aviso de términos (solo la primera visita) ----- */

  function initTerms() {
    const tos = document.getElementById("tos");
    if (!tos || storage.get(KEY_TOS) === "1") return;

    const accept = document.getElementById("tos-accept");
    tos.hidden = false;
    document.body.classList.add("no-scroll");
    if (accept) {
      accept.focus();
      accept.addEventListener("click", () => {
        storage.set(KEY_TOS, "1");
        tos.hidden = true;
        document.body.classList.remove("no-scroll");
      });
    }
  }


  /* ----- Textos y fechas ----- */

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Convierte **negrita** y `código` en HTML, escapando antes el texto
  function inline(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString(LOCALES[currentLang] || "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // "0.2.15-beta.8 — Título" → { version: "0.2.15-beta.8", beta: true }
  function parseVersion(title) {
    const m = title.match(/(\d+\.\d+\.\d+)(?:-beta\.(\d+))?/);
    if (!m) return null;
    return { version: m[2] ? `${m[1]}-beta.${m[2]}` : m[1], beta: !!m[2] };
  }

  function findReleaseDate(version) {
    if (!version || !state.releases) return null;
    const hit = state.releases.find((r) => (r.tag_name || "").replace(/^v/, "") === version);
    return hit ? hit.published_at : null;
  }

  // Versión estable y beta que se muestran: primero la API, si no el README
  function stableInfo() {
    return state.release || state.readmeStable;
  }
  function betaInfo() {
    return state.beta || state.readmeBeta;
  }


  /* ----- Versión de descarga ----- */

  function renderVersion() {
    const labels = document.querySelectorAll("#version-label, [data-version]");
    const buttons = document.querySelectorAll("#download-btn, [data-download]");
    const stable = stableInfo();

    let text = tr("version_loading");
    if (stable && stable.tag) text = tr("version_fmt").replace("{v}", stable.tag);
    else if (state.releaseFailed) text = tr("version_fallback");
    labels.forEach((el) => (el.textContent = text));

    if (state.exeUrl) buttons.forEach((b) => (b.href = state.exeUrl));
    else if (state.releaseFailed) buttons.forEach((b) => (b.href = RELEASES_URL));
  }


  /* ----- Estado: última estable y última beta ----- */

  function setStatus(tagId, dateId, info) {
    const tagEl = document.getElementById(tagId);
    const dateEl = document.getElementById(dateId);
    if (!tagEl || !dateEl) return;

    tagEl.textContent = info && info.tag ? info.tag : "—";
    const date = info ? formatDate(info.date) : "";
    dateEl.textContent = date ? `${tr("published_on")} ${date}` : "";
  }

  function renderStatus() {
    setStatus("status-stable-tag", "status-stable-date", stableInfo());
    setStatus("status-beta-tag", "status-beta-date", betaInfo());
  }


  /* ----- Historial de versiones (README, con respaldo en los releases) ----- */

  // Lee el historial del README: cada "### versión — título" es una entrada
  function parseChangelog(md) {
    const lines = md.split(/\r?\n/);
    const start = lines.findIndex((l) => /^#{1,6}\s+.*historial/i.test(l));
    if (start === -1) return [];

    const level = lines[start].match(/^#+/)[0].length;
    const entries = [];
    let current = null;

    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i];
      const heading = line.match(/^(#{1,6})\s+(.*)$/);

      if (heading) {
        if (heading[1].length <= level) break; // siguiente sección: fin del historial
        const title = heading[2].replace(/[#*`]/g, "").trim();
        const parsed = parseVersion(title);
        if (parsed) {
          current = {
            title,
            version: parsed.version,
            beta: parsed.beta,
            date: findReleaseDate(parsed.version),
            items: [],
          };
          entries.push(current);
        } else if (current) {
          current.items.push({ text: `**${title}**`, bullet: false });
        }
        continue;
      }

      if (!current) continue;
      const trimmed = line.trim();
      if (!trimmed || /^[-*_]{3,}$/.test(trimmed) || trimmed.startsWith("<")) continue;

      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      if (bullet) current.items.push({ text: bullet[1], bullet: true });
      else current.items.push({ text: trimmed, bullet: false });
    }

    return entries.filter((e) => e.items.length);
  }

  // Respaldo si el README no se puede leer: usa los releases de GitHub
  function releasesToEntries(list) {
    return list.slice(0, 1).map((r) => ({
      title: r.tag_name + (r.prerelease ? " (beta)" : ""),
      version: (r.tag_name || "").replace(/^v/, ""),
      beta: !!r.prerelease,
      date: r.published_at,
      items: (r.body || "")
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => {
          const bullet = l.match(/^\s*[-*]\s+(.*)$/);
          return { text: bullet ? bullet[1] : l.trim(), bullet: !!bullet };
        }),
    }));
  }

  function renderChangelog() {
    const box = document.getElementById("news-body");
    if (!box) return;

    if (state.changelogFailed || (state.changelog && !state.changelog.length)) {
      box.textContent = tr("news_fail");
      return;
    }
    if (!state.changelog) {
      box.textContent = tr("news_loading");
      return;
    }

    box.innerHTML = state.changelog
      .map((entry) => {
        const date = entry.date
          ? `<p>${escapeHtml(tr("published_on"))} ${escapeHtml(formatDate(entry.date))}</p>`
          : "";
        const items = entry.items.map((i) => `<li>${inline(i.text)}</li>`).join("");
        return `<h4>${escapeHtml(entry.title)}</h4>${date}${items ? `<ul>${items}</ul>` : ""}`;
      })
      .join("");
  }

  function renderAll() {
    renderVersion();
    renderStatus();
    renderChangelog();
  }


  /* ----- Carga de datos desde GitHub ----- */

  async function fetchJSON(url) {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function loadReleaseData() {
    try {
      const latest = await fetchJSON(`${API}/releases/latest`);
      const exe = (latest.assets || []).find((a) => a.name.toLowerCase().endsWith(".exe"));
      state.release = { tag: (latest.tag_name || latest.name || "").replace(/^v/, ""), date: latest.published_at };
      state.exeUrl = exe ? exe.browser_download_url : null;
    } catch (err) {
      state.releaseFailed = true;
    }

    try {
      const list = await fetchJSON(`${API}/releases?per_page=30`);
      state.releases = list;
      const beta = list.find((r) => r.prerelease);
      if (beta) state.beta = { tag: beta.tag_name.replace(/^v/, ""), date: beta.published_at };
    } catch (err) {
      /* sin lista de releases: no hay fechas ni beta de la API */
    }

    renderAll();
  }

  async function loadChangelog() {
    try {
      const res = await fetch(README_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const entries = parseChangelog(await res.text());
      if (!entries.length) throw new Error("README sin historial");

      // La primera entrada de cada tipo es la más reciente
      const stable = entries.find((e) => !e.beta);
      const beta = entries.find((e) => e.beta);
      state.readmeStable = stable ? { tag: stable.version, date: stable.date } : null;
      state.readmeBeta = beta ? { tag: beta.version, date: beta.date } : null;

      state.changelog = entries.slice(0, 1); // solo la versión más reciente
    } catch (err) {
      state.changelog = state.releases ? releasesToEntries(state.releases) : null;
      state.changelogFailed = !state.changelog;
    }

    renderAll();
  }

  async function loadRemoteData() {
    await loadReleaseData();
    await loadChangelog();
  }


  /* ----- Vídeo de fondo que baja con el scroll ----- */

  function initBackgroundVideo() {
    const bgVideo = document.querySelector(".hero-video");
    if (!bgVideo) return;

    if (prefersReduced) {
      bgVideo.pause();
      return;
    }

    // Se pausa cuando la pestaña no está visible
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) bgVideo.pause();
      else bgVideo.play().catch(() => {});
    });

    let ticking = false;

    // El vídeo mide 130% de la pantalla: el 30% extra permite desplazarlo
    function moveVideo() {
      const overflow = window.innerHeight * 0.3;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      bgVideo.style.transform = `translate3d(0, ${-overflow * (1 - progress)}px, 0)`;
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(moveVideo);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", moveVideo);
    moveVideo();
  }


  /* ----- Cabecera y línea de progreso ----- */

  function initHeaderAndProgress() {
    const topbar = document.getElementById("topbar");
    const progressBar = document.querySelector(".scroll-rail span");

    function update() {
      if (topbar) topbar.classList.toggle("scrolled", window.scrollY > 24);

      if (progressBar) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        progressBar.style.transform = `scaleY(${Math.min(1, window.scrollY / maxScroll)})`;
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }


  /* ----- Secciones que aparecen al bajar ----- */

  function initReveal() {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => observer.observe(el));
  }


  /* ----- Onda al hacer clic en los botones ----- */

  function initRipple() {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");

        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = e.clientX - rect.left - size / 2 + "px";
        ripple.style.top = e.clientY - rect.top - size / 2 + "px";

        btn.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      });
    });
  }


  /* ----- Brillo que sigue al ratón en las tarjetas (solo con ratón) ----- */

  function initCardGlow() {
    if (!canHover) return;
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - rect.left + "px");
        card.style.setProperty("--my", e.clientY - rect.top + "px");
      });
    });
  }


  /* ----- Arranque ----- */

  rememberOriginals();
  initLang();
  initTerms();
  if (document.getElementById("news-body")) loadRemoteData();
  initBackgroundVideo();
  initHeaderAndProgress();
  initReveal();
  initRipple();
  initCardGlow();
})();
