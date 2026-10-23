"use strict";

// The home page's text in each language it is published in. The bar itself,
// theme names and descriptions, widget ids and commands stay in English
// (AGENTS.md): only the page around them is translated. A translation is
// reviewed line by line by a fluent speaker before it ships.
// Values are HTML: escape <, > and & in plain text.

const HOME_TEXT = {
  en: {
    lang: "en",
    title: "agy statusline for Google Antigravity CLI - agy-powerline",
    description:
      "agy-powerline is an agy statusline for Google Antigravity CLI: Gemini, Claude/GPT and Argon quotas with pace markers, context and git in agy's status bar. Preview every theme.",
    introLabel: "Introduction",
    heroTitle: "A powerline-style <code>agy</code> statusline for Google Antigravity CLI",
    heroSub:
      "See whether you'll run out of quota before it resets: your Gemini 5h/7d, Claude/GPT and Argon quotas with pace markers, the active model, context window and git status, at a glance. Every preview on this page is rendered by the real statusline code.",
    heroBarCaption:
      "The default agy-powerline bar with the dark-aurora theme: model, context window and git branch on the first row; the Gemini 5-hour and 7-day quotas with pace markers and reset timers on the second.",
    copy: "Copy",
    copied: "Copied",
    copiedStatus: "Copied %s to clipboard",
    copyInstall: "Copy install command",
    buildInBrowser: "Build your bar in the browser →",
    viewOnGithub: "View on GitHub",
    keyFacts: "Key facts",
    facts: (count) => [
      `<strong>${count} themes</strong> for dark, light &amp; color-blind terminals`,
      "<strong>3 layouts</strong> (pills, lines &amp; classic)",
      "<strong>Zero runtime dependencies</strong>",
      "<strong>Windows, macOS, Linux and WSL</strong>",
    ],
    whatTitle: "What is agy-powerline?",
    whatBody: [
      "agy-powerline is a status line for Antigravity CLI (<code>agy</code>), Google's coding agent for the terminal. agy runs it on every refresh and it draws the bar under the input box: the model, the context window, git, and your quotas with how fast you are using them.",
      "Pick widgets, a theme and a layout in an editor with a live preview, from presets or one by one. It makes no network calls, has no telemetry and needs only Node.js 20 or newer.",
    ],
    installTitle: "Install in 30 seconds",
    installSteps: [
      'Check that you have Node.js 20 or newer and <a href="https://antigravity.google/docs/cli/overview">Antigravity CLI</a>.',
      "Run <code>npx agy-powerline init</code> and pick a preset, a layout and a theme.",
      "Restart <code>agy</code> once. Change anything later with <code>npx agy-powerline configure</code>.",
    ],
    installMore:
      'Details: <a href="/install/">installation</a>, <a href="/guides/add-statusline-to-antigravity-cli/">how agy runs a status line</a> and <a href="/troubleshooting/">troubleshooting</a>.',
    shotsTitle: "In a real terminal",
    shots: {
      windows:
        "agy-powerline under agy's input box in Windows Terminal: a short conversation above, the three-row Pills bar below",
      "pills-dark":
        "agy-powerline Pills layout with the dark-aurora theme: model, context, project and git; Gemini 5h and 7d quotas with pace markers and resets; Claude/GPT and Argon weekly quotas",
      "lines-light": "agy-powerline Lines layout with the light-paper theme on a light terminal",
      "classic-dark":
        "agy-powerline Classic layout with the dark-aurora theme on a dark terminal, with block meters",
    },
    shotCaptions: {
      windows: "In agy, in Windows Terminal",
      "pills-dark": "Pills layout, dark-aurora",
      "lines-light": "Lines layout, light-paper",
      "classic-dark": "Classic layout, dark-aurora",
    },
    learnTitle: "Learn more",
    learnLinks: [
      ["/guides/antigravity-quota/", "See your Antigravity quota while you work"],
      ["/quota-calculator/", "Quota pace calculator"],
      ["/widgets/", "Every widget, with a preview"],
      ["/docs/payload/", "What agy sends to your status line"],
      ["/guides/", "All guides"],
    ],
    trustTitle: "Safe to run",
    trustBody:
      'Zero runtime dependencies, no network calls, and a config read only from your own install folder. <a href="/security/">What it does on your machine</a>.',
    trust: [
      [
        "https://scorecard.dev/viewer/?uri=github.com/wassim-azi/agy-powerline",
        "OpenSSF Scorecard",
      ],
      ["https://www.bestpractices.dev/projects/15655", "OpenSSF Best Practices"],
      ["https://www.npmjs.com/package/agy-powerline", "npm provenance"],
      ["/security/", "0 dependencies"],
      ["/privacy/", "No telemetry"],
      ["https://github.com/wassim-azi/agy-powerline/blob/main/LICENSE", "MIT license"],
    ],
    themesTitle: "Themes",
    displayOptions: "Display options",
    themesLegend: "Themes",
    all: "All",
    dark: "Dark",
    light: "Light",
    colorblind: "Color-blind",
    bgLegend: "Terminal background",
    intended: "Intended",
    colorVision: "Color vision",
    typical: "Typical",
    note: 'Contrast figures are the lowest across all widget colors: "Pill text" is text on a pill, "On terminal" is the lines layout text on the intended terminal background. 4.5:1 is the WCAG AA minimum for body text. Pill caps take the terminal\'s own background, so they blend into any terminal. Browsers can\'t draw Nerd Font glyphs, so the round caps and arrows are drawn with CSS in the same colors.',
    pillText: "Pill text",
    onTerminal: "On terminal",
    states: "OK · caution · danger",
    termDark: "dark terminal",
    termLight: "light terminal",
    quotaRow: "5h quota at 80% · 22% · 6% left",
    useTheme: "Use this theme →",
    useLabel: "Use",
    copyCommandFor: "Copy command for",
  },
  fr: {
    lang: "fr",
    title: "Statusline agy pour Google Antigravity CLI - agy-powerline",
    description:
      "agy-powerline est une statusline pour Google Antigravity CLI (agy) : quotas Gemini, Claude/GPT et Argon avec repère de rythme, contexte et git dans la barre d'agy. Tous les thèmes en aperçu.",
    introLabel: "Présentation",
    heroTitle: "Une statusline <code>agy</code> façon powerline pour Google Antigravity CLI",
    heroSub:
      "Voyez si votre quota tiendra jusqu'à sa remise à zéro : vos quotas Gemini 5 h / 7 j, Claude/GPT et Argon avec un repère de rythme, le modèle, la fenêtre de contexte et l'état git, d'un coup d'œil. Chaque aperçu de cette page est rendu par le vrai code de la statusline.",
    heroBarCaption:
      "La barre agy-powerline par défaut avec le thème dark-aurora : modèle, fenêtre de contexte et branche git sur la première ligne ; quotas Gemini 5 heures et 7 jours avec repères de rythme et délais de remise à zéro sur la seconde.",
    copy: "Copier",
    copied: "Copié",
    copiedStatus: "%s copié dans le presse-papiers",
    copyInstall: "Copier la commande d'installation",
    buildInBrowser: "Composer votre barre dans le navigateur →",
    viewOnGithub: "Voir sur GitHub",
    keyFacts: "En bref",
    facts: (count) => [
      `<strong>${count} thèmes</strong> pour terminaux sombres, clairs et daltoniens`,
      "<strong>3 dispositions</strong> (pills, lines et classic)",
      "<strong>Aucune dépendance</strong> à l'exécution",
      "<strong>Windows, macOS, Linux et WSL</strong>",
    ],
    whatTitle: "Qu'est-ce qu'agy-powerline ?",
    whatBody: [
      "agy-powerline est une statusline pour Antigravity CLI (<code>agy</code>), l'agent de code de Google pour le terminal. agy l'exécute à chaque rafraîchissement et elle dessine la barre sous la zone de saisie : le modèle, la fenêtre de contexte, git, et vos quotas avec le rythme auquel vous les consommez.",
      "Choisissez les widgets, un thème et une disposition dans un éditeur avec aperçu en direct, à partir de préréglages ou un par un. Elle ne fait aucun appel réseau, n'a aucune télémétrie et ne demande que Node.js 20 ou plus récent.",
    ],
    installTitle: "Installation en 30 secondes",
    installSteps: [
      'Vérifiez que vous avez Node.js 20 ou plus récent et <a href="https://antigravity.google/docs/cli/overview">Antigravity CLI</a>.',
      "Lancez <code>npx agy-powerline init</code> et choisissez un préréglage, une disposition et un thème.",
      "Redémarrez <code>agy</code> une fois. Modifiez tout plus tard avec <code>npx agy-powerline configure</code>.",
    ],
    installMore:
      'En détail (en anglais) : <a href="/install/">installation</a>, <a href="/guides/add-statusline-to-antigravity-cli/">comment agy exécute une statusline</a> et <a href="/troubleshooting/">dépannage</a>.',
    shotsTitle: "Dans un vrai terminal",
    shots: {
      windows:
        "agy-powerline sous la zone de saisie d'agy dans Windows Terminal : une courte conversation au-dessus, la barre Pills sur trois lignes en dessous",
      "pills-dark":
        "Disposition Pills d'agy-powerline avec le thème dark-aurora : modèle, contexte, projet et git ; quotas Gemini 5 h et 7 j avec repères de rythme et remises à zéro ; quotas hebdomadaires Claude/GPT et Argon",
      "lines-light":
        "Disposition Lines d'agy-powerline avec le thème light-paper sur un terminal clair",
      "classic-dark":
        "Disposition Classic d'agy-powerline avec le thème dark-aurora sur un terminal sombre, avec des jauges en blocs",
    },
    shotCaptions: {
      windows: "Dans agy, sous Windows Terminal",
      "pills-dark": "Disposition Pills, dark-aurora",
      "lines-light": "Disposition Lines, light-paper",
      "classic-dark": "Disposition Classic, dark-aurora",
    },
    learnTitle: "Pour aller plus loin (en anglais)",
    learnLinks: [
      ["/guides/antigravity-quota/", "Suivre son quota Antigravity en travaillant"],
      ["/quota-calculator/", "Calculateur de rythme de quota"],
      ["/widgets/", "Tous les widgets, avec aperçu"],
      ["/docs/payload/", "Ce qu'agy envoie à votre statusline"],
      ["/guides/", "Tous les guides"],
    ],
    trustTitle: "Sûre à exécuter",
    trustBody:
      "Aucune dépendance à l'exécution, aucun appel réseau, et une configuration lue uniquement dans votre propre dossier d'installation. <a href=\"/security/\">Ce qu'elle fait sur votre machine</a> (en anglais).",
    trust: [
      [
        "https://scorecard.dev/viewer/?uri=github.com/wassim-azi/agy-powerline",
        "OpenSSF Scorecard",
      ],
      ["https://www.bestpractices.dev/projects/15655", "OpenSSF Best Practices"],
      ["https://www.npmjs.com/package/agy-powerline", "Provenance npm"],
      ["/security/", "0 dépendance"],
      ["/privacy/", "Aucune télémétrie"],
      ["https://github.com/wassim-azi/agy-powerline/blob/main/LICENSE", "Licence MIT"],
    ],
    themesTitle: "Thèmes",
    displayOptions: "Options d'affichage",
    themesLegend: "Thèmes",
    all: "Tous",
    dark: "Sombres",
    light: "Clairs",
    colorblind: "Daltoniens",
    bgLegend: "Fond du terminal",
    intended: "Prévu",
    colorVision: "Vision des couleurs",
    typical: "Typique",
    note: "Les contrastes indiqués sont les plus faibles parmi toutes les couleurs de widgets : « Texte des pills » est le texte sur une pill, « Sur le terminal » est le texte de la disposition lines sur le fond de terminal prévu. 4,5:1 est le minimum WCAG AA pour le texte courant. Les extrémités des pills prennent le fond du terminal et s'y fondent. Les navigateurs ne savent pas dessiner les glyphes Nerd Font : les extrémités arrondies et les flèches sont dessinées en CSS, dans les mêmes couleurs.",
    pillText: "Texte des pills",
    onTerminal: "Sur le terminal",
    states: "OK · attention · danger",
    termDark: "terminal sombre",
    termLight: "terminal clair",
    quotaRow: "Quota 5 h à 80 % · 22 % · 6 % restants",
    useTheme: "Utiliser ce thème →",
    useLabel: "Utiliser",
    copyCommandFor: "Copier la commande pour",
  },
};

module.exports = { HOME_TEXT };
