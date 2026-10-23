"use strict";

// agy-powerline.com is built from the repo by scripts/site/build.js and
// published on GitHub Pages (.github/workflows/pages.yml). Every page must be
// complete, load nothing from other sites, link only to pages that exist, and
// the sitemap must list exactly the pages search engines should index.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { record, ROOT, NODE } = require("../helpers");
const { KNOWN_KEYS } = require("../../src/lib/config-check");
const { VALID_WIDGET_IDS, defaultConfig, mergeConfig } = require("../../src/lib/config");
const { INDEXNOW_KEY } = require("../../scripts/site/build");
const { quotaPace, formatDuration } = require("../../scripts/site/quota-pace");
const { renderMarkdown } = require("../../scripts/site/markdown");

const SITE_URL = "https://agy-powerline.com/";

// Every HTML file under dir, as site paths: "index.html", "docs/faq/index.html"...
function htmlFiles(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return htmlFiles(path.join(dir, entry.name), rel);
    return entry.name.endsWith(".html") ? [rel] : [];
  });
}

// What a page loads from elsewhere: src/srcset, stylesheets and icons, CSS
// url() and @import. Links people click (<a href>) and the canonical and
// alternate URLs only name pages, so they don't count.
function externalLoads(html) {
  const remote = (url) => /^(?:https?:)?\/\//i.test(url.trim());
  const found = [];
  for (const m of html.matchAll(/\s(?:src|srcset)="([^"]*)"/g)) {
    if (remote(m[1])) found.push(m[1]);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const rel = (m[0].match(/\brel="([^"]*)"/) || [])[1] || "";
    const href = (m[0].match(/\bhref="([^"]*)"/) || [])[1] || "";
    if (!/^(canonical|alternate)$/.test(rel) && remote(href)) found.push(href);
  }
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)/g)) {
    if (remote(m[1])) found.push(m[1]);
  }
  for (const m of html.matchAll(/@import\s+(?:url\()?['"]?([^'");]+)/g)) {
    if (remote(m[1])) found.push(m[1]);
  }
  return found;
}

async function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "agy-verify-site-"));
  // A folder that doesn't exist yet, like _site/ on a fresh checkout.
  const out = path.join(root, "_site");

  try {
    const built = spawnSync(NODE, [path.join(ROOT, "scripts", "site", "build.js"), out], {
      encoding: "utf8",
      windowsHide: true,
    });
    record(
      "the site builds into a folder that doesn't exist yet",
      built.status === 0 && fs.existsSync(path.join(out, "index.html")),
      built.stderr.trim()
    );
    if (!fs.existsSync(path.join(out, "index.html"))) {
      return;
    }

    const files = htmlFiles(out);
    const pages = Object.fromEntries(
      files.map((file) => [file, fs.readFileSync(path.join(out, file), "utf8")])
    );
    const pageUrl = (file) => SITE_URL + file.replace(/(^|\/)index\.html$/, "$1");
    const indexable = files.filter(
      (file) => !/<meta name="robots" content="noindex/.test(pages[file])
    );

    const incomplete = files.filter((file) => {
      const html = pages[file];
      return !(
        /^<!doctype html>\s*<html lang="(en|fr)">\s*<head>/i.test(html) &&
        /<meta charset="utf-8"/i.test(html) &&
        /<meta name="viewport" content="width=device-width, initial-scale=1"/.test(html) &&
        /<title>[^<]+<\/title>/.test(html) &&
        /<meta\s+name="description"\s+content="[^"]+"/.test(html) &&
        (html.match(/<h1[\s>]/g) || []).length === 1 &&
        /<\/body>\s*<\/html>\s*$/.test(html)
      );
    });
    record(
      "every page is complete: doctype, language, charset, viewport, title, description, one h1",
      incomplete.length === 0,
      incomplete.join(", ")
    );

    const unfilled = files.filter((file) =>
      /\{\{\w+\}\}|<!--(SITE_\w+|PREVIEW|INTRO|CARDS|HERO_BAR|PALETTE_ITEMS|\w+_OPTIONS)-->|\/\* SITE_\w+ \*\//.test(
        pages[file]
      )
    );
    record("no page keeps a template placeholder", unfilled.length === 0, unfilled.join(", "));

    const noCsp = files.filter(
      (file) =>
        !/<meta http-equiv="Content-Security-Policy" content="default-src 'none';[^"]*img-src 'self' data:;/.test(
          pages[file]
        )
    );
    record(
      "every page allows only its own inline style and script, and images from the site",
      noCsp.length === 0,
      noCsp.join(", ")
    );

    const loads = files.flatMap((file) =>
      externalLoads(pages[file]).map((url) => `${file}: ${url}`)
    );
    record(
      "no page loads anything from other sites",
      loads.length === 0,
      loads.slice(0, 5).join(", ")
    );

    const badCanonical = indexable.filter(
      (file) => !pages[file].includes(`<link rel="canonical" href="${pageUrl(file)}" />`)
    );
    record(
      "every indexable page names its own canonical URL",
      badCanonical.length === 0,
      badCanonical.join(", ")
    );

    const badJsonLd = [];
    for (const file of files) {
      for (const m of pages[file].matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      )) {
        try {
          JSON.parse(m[1]);
        } catch {
          badJsonLd.push(file);
        }
      }
    }
    record("every JSON-LD block is valid JSON", badJsonLd.length === 0, badJsonLd.join(", "));

    // Root-relative links and images must reach a file this build wrote.
    const broken = new Set();
    for (const file of files) {
      for (const m of pages[file].matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
        const target = m[1].endsWith("/") ? `${m[1]}index.html` : m[1];
        if (!fs.existsSync(path.join(out, target))) broken.add(`${file} -> ${m[1]}`);
      }
    }
    record(
      "every link and image inside the site points to a file the build wrote",
      broken.size === 0,
      [...broken].slice(0, 8).join(", ")
    );

    const home = pages["index.html"];
    const fr = pages["fr/index.html"] || "";
    const alternates = (html) =>
      html.includes(`<link rel="alternate" hreflang="en" href="${SITE_URL}" />`) &&
      html.includes(`<link rel="alternate" hreflang="fr" href="${SITE_URL}fr/" />`) &&
      html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}" />`);
    record(
      "the English and French home pages name each other with hreflang",
      /<html lang="fr">/.test(fr) && alternates(home) && alternates(fr)
    );

    const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    const expected = indexable.map(pageUrl).sort();
    // A page's lastmod is the last commit that changed its source, so a page
    // whose source isn't committed yet has none.
    record(
      "sitemap.xml lists exactly the indexable pages, with valid lastmod dates",
      sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>') &&
        JSON.stringify([...locs].sort()) === JSON.stringify(expected) &&
        lastmods.length > 0 &&
        lastmods.every((d) => !Number.isNaN(Date.parse(d))) &&
        !locs.some((loc) => loc.includes("404")),
      `${locs.length} in the sitemap, ${expected.length} indexable`
    );

    const robots = fs.readFileSync(path.join(out, "robots.txt"), "utf8");
    record(
      "robots.txt allows everything and points to the sitemap",
      /^User-agent: \*$/m.test(robots) &&
        !/^Disallow: \/\s*$/m.test(robots) &&
        robots.includes(`Sitemap: ${SITE_URL}sitemap.xml`)
    );

    const feed = fs.readFileSync(path.join(out, "changelog.xml"), "utf8");
    record(
      "changelog.xml is an Atom feed with an entry per release",
      feed.startsWith('<?xml version="1.0" encoding="utf-8"?>') &&
        feed.includes('<feed xmlns="http://www.w3.org/2005/Atom">') &&
        (feed.match(/<entry>/g) || []).length >= 1
    );

    let schema = null;
    try {
      schema = JSON.parse(fs.readFileSync(path.join(out, "schema", "v1.json"), "utf8"));
    } catch {
      schema = null;
    }
    const schemaKeys = schema ? Object.keys(schema.properties).sort() : [];
    const knownKeys = [...KNOWN_KEYS, "agyPowerline"].sort();
    record(
      "the config schema knows exactly the settings the bar reads",
      JSON.stringify(schemaKeys) === JSON.stringify(knownKeys),
      `schema: ${schemaKeys.join(" ")} / bar: ${knownKeys.join(" ")}`
    );
    const merged = mergeConfig(defaultConfig());
    const widgetIds = schema ? schema.definitions.widget.properties.id.enum : [];
    record(
      "the default config fits the schema's keys and widget ids",
      schema !== null &&
        Object.keys(merged).every((key) => schemaKeys.includes(key)) &&
        JSON.stringify([...widgetIds].sort()) === JSON.stringify([...VALID_WIDGET_IDS].sort()) &&
        merged.widgets.every((w) => widgetIds.includes(w.id))
    );

    const keyFile = path.join(out, `${INDEXNOW_KEY}.txt`);
    const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "pages.yml"), "utf8");
    record(
      "the IndexNow key file holds the key the Pages workflow sends",
      fs.existsSync(keyFile) &&
        fs.readFileSync(keyFile, "utf8").trim() === INDEXNOW_KEY &&
        workflow.includes(`KEY: ${INDEXNOW_KEY}`)
    );

    record(
      "llms.txt on the site is the repo's llms.txt",
      fs.readFileSync(path.join(out, "llms.txt"), "utf8") ===
        fs.readFileSync(path.join(ROOT, "llms.txt"), "utf8")
    );

    const missingFiles = [
      "404.html",
      "llms-full.txt",
      "site.webmanifest",
      "favicon.ico",
      "icon.svg",
      "apple-touch-icon.png",
      "og.png",
    ].filter((file) => !fs.existsSync(path.join(out, file)));
    record(
      "the site has its 404 page, manifest, icons and social card",
      missingFiles.length === 0,
      missingFiles.join(", ")
    );

    // The widget previews are drawn on the build machine: none may show its
    // host name or home folder.
    const widgetsPage = pages["widgets/index.html"] || "";
    record(
      "the widget page shows nothing about the machine that built it",
      widgetsPage.length > 0 &&
        !widgetsPage.includes(os.hostname()) &&
        !widgetsPage.includes(os.homedir()) &&
        !widgetsPage.includes(os.homedir().replace(/\\/g, "/"))
    );

    // The calculator's math: 72% left with 2hr 47m to go in a 5-hour window
    // is 44.3% of the window gone and 28% used, so it lasts.
    const pace = quotaPace({ window: "5h", leftPct: 72, resetIn: 2 * 3600 + 47 * 60 });
    const behind = quotaPace({ window: "7d", leftPct: 20, resetIn: 4 * 86400 });
    record(
      "the quota calculator says whether a quota lasts until its reset",
      pace.status === "ahead" &&
        Math.abs(pace.elapsedPct - 44.33) < 0.01 &&
        Math.abs(pace.leftAtReset - 36.84) < 0.01 &&
        behind.status === "behind" &&
        behind.runsOutIn < 4 * 86400 &&
        quotaPace({ window: "5h", leftPct: 0, resetIn: 60 }).status === "empty" &&
        Boolean(quotaPace({ window: "5h", leftPct: 50, resetIn: 6 * 3600 }).error) &&
        Boolean(quotaPace({ window: "5h", leftPct: 120, resetIn: 60 }).error) &&
        formatDuration(2 * 3600 + 47 * 60) === "2hr 47m" &&
        formatDuration(86400 + 17 * 3600) === "1d 17h"
    );

    const md = renderMarkdown(
      "# Hello world\n\nSome `<b>` and **bold**.\n\n## Hello world\n\n| a | b |\n| - | - |\n| 1 | 2 |\n"
    );
    record(
      "the Markdown renderer slugs headings like GitHub, escapes code and builds tables",
      md.html.includes('id="hello-world"') &&
        md.html.includes('id="hello-world-1"') &&
        md.html.includes("<code>&lt;b&gt;</code>") &&
        md.html.includes("<strong>bold</strong>") &&
        /<table>[\s\S]*<td>1<\/td>[\s\S]*<\/table>/.test(md.html),
      md.html
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

module.exports = { run };
