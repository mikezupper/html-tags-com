#!/usr/bin/env node
/**
 * Build html-tags.com into dist/.
 *
 * Steps: clean dist/, copy static/ verbatim, then generate from data/tags/*.json:
 * dist/tags/<slug>.html (one per element), dist/tags/index.html (explorer),
 * dist/cheatsheet.html, dist/sitemap.xml, and inject the tag grid into
 * dist/index.html between the TAG-GRID markers.
 *
 * Run: npm run build   (Node >= 20, no dependencies)
 */
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const BASE = "https://html-tags.com";
const LAST_VERIFIED = "2026-07-24";
const REPO = "https://github.com/mikezupper/html-tags-com";
const SKILL_REPO = "https://github.com/mikezupper/semantic-html-skill";

const CATEGORY_ORDER = [
  "Document structure", "Sectioning & landmarks", "Grouping content",
  "Inline text semantics", "Edits", "Media & embedded content",
  "Tables", "Forms", "Interactive", "Scripting",
];
const DATA_FILES = [
  "document", "sectioning", "grouping", "text", "edits",
  "media", "tables", "forms", "interactive-scripting",
];
const BADGE = {
  widely: "Baseline: Widely available",
  newly: "Baseline: Newly available",
  limited: "Experimental — limited availability",
};
const EXAMPLE_TITLES = {
  "field-guide.html": "the full-vocabulary field guide",
  "recipe.html": "the recipe example",
  "glossary.html": "the glossary example",
  "terminal-manual.html": "the CLI manual example",
  "conference-schedule.html": "the conference schedule example",
  "world-poetry.html": "the poetry anthology example",
  "help-center.html": "the help center example",
  "product-order.html": "the product order example",
  "release-notes.html": "the release notes example",
};

function loadTags() {
  const tags = DATA_FILES.flatMap((name) =>
    JSON.parse(readFileSync(join(ROOT, "data", "tags", `${name}.json`), "utf8")));
  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  tags.sort((a, b) => order.get(a.category) - order.get(b.category));
  return tags;
}

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escAttr = (s) => esc(s).replaceAll('"', "&quot;");

const TOGGLE = `    <p>
      <input type="checkbox" id="css-toggle" checked>
      <label for="css-toggle">Styled view</label>
    </p>`;

const SITE_FOOTER = `  <footer>
    <p><small>Every page on this site validates against the
    <a href="https://validator.w3.org/nu/">Nu HTML Checker</a> with zero errors and
    zero warnings — <a href="${REPO}/actions">checked in CI on every commit</a>.
    View source: the markup <em>is</em> the documentation.
    <a href="${REPO}">Contribute on GitHub</a>.</small></p>
    <p><small>Verified against the
    <a href="https://html.spec.whatwg.org/multipage/">HTML Living Standard</a> on
    <time datetime="${LAST_VERIFIED}">${LAST_VERIFIED}</time>.
    Text licensed <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>.</small></p>
  </footer>`;

function pageHead(title, desc, canonical, cssHref, jsonld) {
  const ld = jsonld
    ? `  <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 1)}\n  </script>\n`
    : "";
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(desc)}">
  <link rel="canonical" href="${canonical}">
  <link rel="stylesheet" href="${cssHref}">
${ld}</head>`;
}

function attrRows(attributes) {
  return attributes.map((a) => {
    const [name, d] = a.includes(" — ") ? a.split(" — ", 2) : [a, ""];
    return `          <dt><code>${esc(name)}</code></dt>\n          <dd>${esc(d)}</dd>`;
  }).join("\n");
}

function tagPage(t) {
  const disp = t.display;
  const name = `&lt;${esc(disp)}&gt;`;
  const desc = `The HTML <${disp}> element: ${t.summary} When to use it, when to `
    + "avoid it, key attributes, a live example, and authoritative references.";
  const canonical = `${BASE}/tags/${t.slug}.html`;
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle",
        headline: `The HTML <${disp}> element`,
        description: t.summary,
        dateModified: LAST_VERIFIED,
        mainEntityOfPage: canonical },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "html-tags.com", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Tags", item: `${BASE}/tags/` },
        { "@type": "ListItem", position: 3, name: disp, item: canonical }] },
    ],
  };

  let attrsSection = "";
  if (t.attributes.length) {
    attrsSection = `
      <section aria-labelledby="attrs-h">
        <h2 id="attrs-h">Key attributes</h2>
        <dl>
${attrRows(t.attributes)}
        </dl>
      </section>`;
  }

  let exampleSection = "";
  if (t.snippet) {
    const live = t.render ? `
          <div>
${t.snippet}
          </div>` : "";
    const caption = t.render
      ? "Rendered live above, source below."
      : "Source — this snippet needs a fuller context to render.";
    exampleSection = `
      <section aria-labelledby="example-h">
        <h2 id="example-h">Example</h2>
        <figure>${live}
          <pre><code>${esc(t.snippet)}</code></pre>
          <figcaption>${caption}</figcaption>
        </figure>
      </section>`;
  }

  let exampleLink = "";
  if (t.example) {
    const href = t.example === "field-guide.html" ? "../field-guide.html" : `../examples/${t.example}`;
    exampleLink = `\n          <li><a href="${href}">See it used in context in `
      + `${EXAMPLE_TITLES[t.example]}</a></li>`;
  }

  return `${pageHead(`<${disp}> — when and how to use it · HTML Tags`, desc, canonical, "../styles/tag.css", jsonld)}
<body>
  <a href="#main">Skip to main content</a>
  <header>
    <p><a href="../">html-tags.com</a></p>
${TOGGLE}
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="../">Home</a></li>
        <li><a href="./">Tags</a></li>
        <li><a href="" aria-current="page">${name}</a></li>
      </ol>
    </nav>
  </header>
  <main id="main">
    <article>
      <header>
        <hgroup>
          <h1><code>${name}</code></h1>
          <p>${esc(t.summary)}</p>
        </hgroup>
        <p><data value="${t.baseline}">${esc(BADGE[t.baseline])}</data> ·
           <data value="${escAttr(t.category)}">${esc(t.category)}</data></p>
      </header>

      <section aria-labelledby="use-h">
        <h2 id="use-h">When to use it</h2>
        <p>${esc(t.use)}</p>
      </section>

      <section aria-labelledby="avoid-h">
        <h2 id="avoid-h">When not to</h2>
        <p>${esc(t.avoid)}</p>
      </section>
${attrsSection}${exampleSection}

      <section aria-labelledby="refs-h">
        <h2 id="refs-h">Authoritative references</h2>
        <ul>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/${t.mdn}" rel="external">MDN: the ${name} element</a></li>
          <li><a href="${t.spec}" rel="external">Specification entry</a></li>${exampleLink}
        </ul>
      </section>
    </article>
  </main>
${SITE_FOOTER}
</body>
</html>
`;
}

function gridMarkup(tags, hrefPrefix, headingLevel) {
  const h = `h${headingLevel}`;
  const out = [];
  for (const cat of CATEGORY_ORDER) {
    out.push(`        <${h}>${esc(cat)}</${h}>`);
    out.push("        <ul>");
    for (const t of tags.filter((x) => x.category === cat)) {
      out.push(`          <li><a href="${hrefPrefix}${t.slug}.html">`
        + `<code>&lt;${esc(t.display)}&gt;</code></a></li>`);
    }
    out.push("        </ul>");
  }
  return out.join("\n");
}

function explorerPage(tags) {
  const jsonld = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "All HTML tags", url: `${BASE}/tags/`,
    description: `Reference pages for all ${tags.length} living HTML elements.`,
    dateModified: LAST_VERIFIED,
  };
  return `${pageHead("All HTML tags, by family · HTML Tags",
    `Reference pages for all ${tags.length} living HTML elements — when to use each, when not to, attributes, live examples, and links to MDN and the spec.`,
    `${BASE}/tags/`, "../styles/tag.css", jsonld)}
<body>
  <a href="#main">Skip to main content</a>
  <header>
    <p><a href="../">html-tags.com</a></p>
${TOGGLE}
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="../">Home</a></li>
        <li><a href="" aria-current="page">Tags</a></li>
      </ol>
    </nav>
  </header>
  <main id="main">
    <article>
      <header>
        <hgroup>
          <h1>All HTML tags</h1>
          <p>${tags.length} living elements, grouped by family — every page tells you
          when to use it, when not to, and shows it working.</p>
        </hgroup>
      </header>
${gridMarkup(tags, "", 2)}
      <p>Looking for <code>&lt;center&gt;</code>, <code>&lt;font&gt;</code>, or
      <code>&lt;marquee&gt;</code>? They are deprecated and deliberately absent —
      see <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements#obsolete_and_deprecated_elements" rel="external">MDN's obsolete elements list</a>
      for what replaced them.</p>
    </article>
  </main>
${SITE_FOOTER}
</body>
</html>
`;
}

function cheatsheetPage(tags) {
  const rows = [];
  for (const cat of CATEGORY_ORDER) {
    rows.push(`      <section>\n        <h2>${esc(cat)}</h2>\n        <dl>`);
    for (const t of tags.filter((x) => x.category === cat)) {
      rows.push(`          <dt><a href="tags/${t.slug}.html">`
        + `<code>&lt;${esc(t.display)}&gt;</code></a></dt>`);
      rows.push(`          <dd>${esc(t.summary)}</dd>`);
    }
    rows.push("        </dl>\n      </section>");
  }
  return `${pageHead("HTML tags cheat sheet — every element on one page · HTML Tags",
    `A printable one-page reference: all ${tags.length} living HTML elements with a one-line summary of what each is for.`,
    `${BASE}/cheatsheet.html`, "styles/cheatsheet.css")}
<body>
  <a href="#main">Skip to main content</a>
  <header>
    <p><a href="./">html-tags.com</a></p>
${TOGGLE}
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="./">Home</a></li>
        <li><a href="" aria-current="page">Cheat sheet</a></li>
      </ol>
    </nav>
  </header>
  <main id="main">
    <article>
      <header>
        <hgroup>
          <h1>The HTML cheat sheet</h1>
          <p>All ${tags.length} living elements, one line each. Print it — this page
          carries its own print stylesheet.</p>
        </hgroup>
      </header>
${rows.join("\n")}
    </article>
  </main>
${SITE_FOOTER}
</body>
</html>
`;
}

function sitemap(tags) {
  const urls = [`${BASE}/`, `${BASE}/tags/`, `${BASE}/cheatsheet.html`, `${BASE}/field-guide.html`,
    `${BASE}/examples/`];
  const examples = readdirSync(join(ROOT, "static", "examples"))
    .filter((f) => f.endsWith(".html") && f !== "index.html").sort();
  urls.push(...examples.map((f) => `${BASE}/examples/${f}`));
  urls.push(...tags.map((t) => `${BASE}/tags/${t.slug}.html`));
  const entries = urls.map(
    (u) => `  <url><loc>${u}</loc><lastmod>${LAST_VERIFIED}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function injectGrid(tags) {
  const index = join(DIST, "index.html");
  const s = readFileSync(index, "utf8");
  const start = "<!-- TAG-GRID:START -->";
  const end = "<!-- TAG-GRID:END -->";
  const i = s.indexOf(start) + start.length;
  const j = s.indexOf(end);
  if (i < start.length || j < 0) throw new Error("TAG-GRID markers missing in static/index.html");
  writeFileSync(index, `${s.slice(0, i)}\n${gridMarkup(tags, "tags/", 3)}\n        ${s.slice(j)}`);
}

function main() {
  const tags = loadTags();
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, "tags"), { recursive: true });
  cpSync(join(ROOT, "static"), DIST, { recursive: true });
  for (const t of tags) writeFileSync(join(DIST, "tags", `${t.slug}.html`), tagPage(t));
  writeFileSync(join(DIST, "tags", "index.html"), explorerPage(tags));
  writeFileSync(join(DIST, "cheatsheet.html"), cheatsheetPage(tags));
  writeFileSync(join(DIST, "sitemap.xml"), sitemap(tags));
  injectGrid(tags);
  console.log(`built ${tags.length} tag pages + explorer + cheatsheet + sitemap into dist/`);
}

main();
