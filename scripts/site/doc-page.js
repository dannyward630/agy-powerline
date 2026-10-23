"use strict";

// The page around the site's text pages (docs, guides, About, FAQ...): the
// shared header and footer, a breadcrumb, an "On this page" list built from
// the headings, and styles for the rendered Markdown.

const { injectSiteChrome, absoluteUrl, esc, REPO_URL } = require("./layout");

const PROSE_CSS = `
      /* Text reads best at about 80 characters a line, so the column and the
         "On this page" list sit together in the middle of wide screens. */
      .doc-wrap {
        max-width: 1020px;
        width: 100%;
        margin: 0 auto;
        padding: 24px 16px 64px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 28px;
      }
      @media (min-width: 1000px) {
        .doc-wrap.has-toc {
          grid-template-columns: minmax(0, 1fr) 240px;
        }
        .doc-toc {
          position: sticky;
          top: 76px;
          align-self: start;
          max-height: calc(100vh - 96px);
          overflow-y: auto;
        }
      }
      .breadcrumb ol {
        list-style: none;
        margin: 0 0 8px;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        font-size: 0.85rem;
        color: var(--muted);
      }
      .breadcrumb li + li::before {
        content: "›";
        margin-right: 4px;
      }
      .breadcrumb a {
        color: var(--muted);
      }
      .doc-toc {
        font-size: 0.86rem;
        border-left: 1px solid var(--line);
        padding-left: 14px;
      }
      .doc-toc h2 {
        margin: 0 0 8px;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }
      .doc-toc ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }
      .doc-toc a {
        color: var(--fg);
        text-decoration: none;
      }
      .doc-toc a:hover {
        color: var(--accent);
        text-decoration: underline;
      }
      .prose {
        min-width: 0;
        max-width: 80ch;
      }
      .prose > :first-child {
        margin-top: 0;
      }
      .prose h1 {
        font-size: clamp(1.6rem, 3vw, 2.2rem);
        letter-spacing: -0.02em;
        line-height: 1.2;
        margin: 0 0 12px;
      }
      .prose h2 {
        font-size: 1.35rem;
        margin: 36px 0 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--line);
        scroll-margin-top: 76px;
      }
      .prose h3 {
        font-size: 1.08rem;
        margin: 26px 0 8px;
        scroll-margin-top: 76px;
      }
      .prose h4 {
        font-size: 1rem;
        margin: 20px 0 6px;
        scroll-margin-top: 76px;
      }
      .prose p,
      .prose ul,
      .prose ol,
      .prose blockquote,
      .prose pre,
      .prose .table-wrap {
        margin: 0 0 14px;
      }
      .prose li {
        margin: 4px 0;
      }
      .prose li > ul,
      .prose li > ol {
        margin: 4px 0;
      }
      .prose a {
        color: var(--accent);
        text-underline-offset: 2px;
      }
      .prose code {
        font-family: var(--font-mono);
        font-size: 0.88em;
        background: var(--accent-soft);
        border-radius: 4px;
        padding: 1px 5px;
        overflow-wrap: anywhere;
      }
      .prose pre {
        background: var(--term-dark-bg);
        color: var(--term-dark-fg);
        border: 1px solid var(--term-dark-border);
        border-radius: var(--radius-md);
        padding: 12px 14px;
        overflow-x: auto;
        font-size: 0.85rem;
        line-height: 1.45;
      }
      .prose pre code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
        overflow-wrap: normal;
      }
      .prose blockquote {
        border-left: 3px solid var(--accent);
        padding: 2px 14px;
        color: var(--muted);
        background: var(--surface);
      }
      .prose .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
      }
      .prose table {
        border-collapse: collapse;
        width: 100%;
        font-size: 0.9rem;
      }
      .prose th,
      .prose td {
        text-align: left;
        vertical-align: top;
        padding: 7px 10px;
        border-bottom: 1px solid var(--line);
      }
      .prose th {
        background: var(--surface);
        font-weight: 600;
      }
      .prose tr:last-child td {
        border-bottom: 0;
      }
      .prose img {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius-sm);
      }
      .prose hr {
        border: 0;
        border-top: 1px solid var(--line);
        margin: 28px 0;
      }
      .lede {
        font-size: 1.05rem;
        color: var(--muted);
      }
      .doc-meta {
        margin-top: 32px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        font-size: 0.85rem;
        color: var(--muted);
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
      }
      .doc-meta a {
        color: var(--accent);
      }
      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
        margin: 0 0 18px;
        padding: 0;
        list-style: none;
      }
      .card-grid li {
        margin: 0;
      }
      .card-link {
        display: grid;
        gap: 4px;
        height: 100%;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--fg);
        text-decoration: none;
        box-shadow: var(--shadow-sm);
      }
      .card-link:hover {
        border-color: var(--accent);
      }
      .card-link strong {
        color: var(--accent);
      }
      .card-link span {
        color: var(--muted);
        font-size: 0.9rem;
      }
      .prose .screen-wrap {
        margin: 0 0 14px;
      }
`;

function breadcrumbData(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => {
      const item = { "@type": "ListItem", position: i + 1, name: crumb.name };
      // The last crumb is the page itself, which takes no item URL.
      if (i < crumbs.length - 1) item.item = absoluteUrl(crumb.path);
      return item;
    }),
  };
}

function breadcrumbHtml(crumbs) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${crumbs
    .map((crumb, i) =>
      i < crumbs.length - 1
        ? `<li><a href="/${esc(crumb.path)}">${esc(crumb.name)}</a></li>`
        : `<li aria-current="page">${esc(crumb.name)}</li>`
    )
    .join("")}</ol></nav>`;
}

function tocHtml(headings) {
  const items = headings.filter((h) => h.level === 2);
  if (items.length < 3) return "";
  return `<aside class="doc-toc" aria-label="On this page">
        <h2>On this page</h2>
        <ul>
          ${items.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join("\n          ")}
        </ul>
      </aside>`;
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// page: { path, title, description, bodyHtml, headings, crumbs, currentPage,
// structuredData, source, lastmod, extraCss, script, ogType }
function buildDocPage(page) {
  const crumbs = page.crumbs || [{ name: "agy-powerline", path: "" }];
  const structuredData = [
    ...(crumbs.length > 1 ? [breadcrumbData(crumbs)] : []),
    ...(Array.isArray(page.structuredData)
      ? page.structuredData
      : page.structuredData
        ? [page.structuredData]
        : []),
  ];
  const toc = page.toc === false ? "" : tocHtml(page.headings || []);
  const meta = [];
  if (page.lastmod) meta.push(`<span>Updated ${esc(formatDate(page.lastmod))}</span>`);
  if (page.source) {
    meta.push(
      `<a href="${REPO_URL}/blob/main/${esc(page.source)}">Edit this page on GitHub</a>`,
      `<a href="${REPO_URL}/issues">Report a problem</a>`
    );
  }
  const template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- Nothing loads from other sites: the page is its own inline style and script. -->
    <!--SITE_CSP-->
    <!--SITE_HEAD-->
    <style>
      /* SITE_CSS */
${PROSE_CSS}${page.extraCss || ""}
    </style>
  </head>
  <body>
    <!--SITE_HEADER-->
    <main class="doc-wrap${toc ? " has-toc" : ""}" id="main">
      <article class="prose">
        ${crumbs.length > 1 ? breadcrumbHtml(crumbs) : ""}
        ${page.bodyHtml}
        ${meta.length ? `<footer class="doc-meta">${meta.join("\n          ")}</footer>` : ""}
      </article>
      ${toc}
    </main>
    <!--SITE_FOOTER-->
    <script>
      /* SITE_THEME_SCRIPT */
    </script>${page.script ? `\n    <script>\n${page.script}\n    </script>` : ""}
  </body>
</html>
`;
  return injectSiteChrome(template, {
    title: page.title,
    description: page.description,
    currentPage: page.currentPage || "docs",
    pagePath: page.path,
    structuredData,
    ogType: page.ogType,
  });
}

module.exports = { buildDocPage, breadcrumbData, PROSE_CSS, formatDate };
