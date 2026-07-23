# html-tags.com

> The reference for modern semantic HTML — every living element with when-to-use guidance, honest when-not-to warnings, live examples, Baseline support status, and links to MDN and the WHATWG spec.

[![Build & Validate](https://github.com/mikezupper/html-tags-com/actions/workflows/validate.yml/badge.svg)](https://github.com/mikezupper/html-tags-com/actions/workflows/validate.yml)
![Node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![Dependencies](https://img.shields.io/badge/npm_dependencies-0-brightgreen)
![Elements](https://img.shields.io/badge/tag_pages-112-blue)
![W3C Validated](https://img.shields.io/badge/Nu_Checker-0_errors_·_0_warnings-brightgreen?logo=w3c&logoColor=white)
![License](https://img.shields.io/badge/license-CC_BY_4.0-lightgrey)

## Structure

| Path | What it is |
|---|---|
| `data/tags/*.json` | **The source of truth** — one file per element family; each entry holds a tag's summary, when-to-use / when-not guidance, attributes, Baseline status, snippet, and MDN + spec links. |
| `build.mjs` | The generator (Node ≥ 20, zero dependencies). Cleans `dist/`, copies `static/`, generates the 112 tag pages, the explorer, the cheat sheet, and `sitemap.xml`, and injects the tag grid into the landing page. |
| `static/` | Handwritten pages copied verbatim into the build: the landing template, the field-guide demo, the eight styled examples, the design system stylesheets, `robots.txt`, `404.html`, `_headers`. |
| `dist/` | Build output (gitignored). What Cloudflare Pages serves. |

## Build

```bash
npm run build     # -> dist/
```

No install step — the build has zero npm dependencies.

## Deployment

Deployed by the **Cloudflare Pages GitHub connection** (not GitHub Actions):

- Framework preset: **None**
- Build command: **`npm run build`**
- Build output directory: **`dist`**
- Production branch: **`main`** — every PR gets a preview deployment automatically.

CI (`validate.yml`) independently builds and validates every generated page against the current [Nu HTML Checker](https://validator.w3.org/nu/); any error **or warning** fails the build.

## Editing tag content

1. Edit the relevant `data/tags/<family>.json`.
2. `npm run build` and open `dist/tags/<tag>.html` to check it.
3. Open a PR — CI validates, Cloudflare builds a preview.

## Related

- The **semantic-html agent skill** (teach a coding agent to write markup like this): [mikezupper/semantic-html-skill](https://github.com/mikezupper/semantic-html-skill)
- Sources this site defers to: the [HTML Living Standard](https://html.spec.whatwg.org/multipage/), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML), [Baseline](https://webstatus.dev/)

## License

Text and markup licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
