# Open Textbook Library

A minimal, static **library of digital textbooks**. The textbooks themselves
are **not** hosted here — every entry links out to an externally hosted site
(e.g. GitHub Pages). This app is purely a discovery / index layer.

Built with **Astro** + **TypeScript**, fully static, client-side search and
filtering, no backend, no database, no external APIs.

---

## Quick start

Requires **Node 22+**.

```bash
npm install
npm run dev          # local dev server
npm run build        # static build → dist/
npm run preview      # serve the built site
npm run check        # astro + TypeScript type check
npm run test:logic   # verify the pure filtering/URL logic
npm run test:data    # validate every textbook JSON against the schema
npm run test         # both of the above
```

---

## What it does

- **Home** (`/`) — short description + a live textbook count.
- **Library** (`/library`) — the primary feature:
  - Multi-select filters for **language**, **software**, **subject**, derived
    dynamically from the data (never hardcoded).
  - Case-insensitive **search** across title, description, keywords and authors.
  - Filters + search combine as `(language AND software AND subject) AND search`,
    with **OR within** a facet and **AND across** facets.
  - All filter/search state lives in the **URL** (`?language=en&software=python&search=matrix`)
    so views are shareable and browser back/forward works.
- **Markdown pages** (`/idems`, `/community`, …) — driven entirely by files
  in `src/content/pages/`. Add a page by dropping in a Markdown file; no routing
  changes.

---

## Architecture

Two-layer content architecture:

```
src/
├─ content/
│  ├─ textbooks/*.json        # STRUCTURED data layer — one JSON document per textbook
│  └─ pages/*.md              # CONTENT layer (static markdown pages)
├─ content.config.ts          # defines the `pages` collection (+ stops auto-collection)
├─ lib/
│  ├─ types.ts                # Textbook type, facet/state types (single source of truth)
│  ├─ textbooks.ts            # DATA ABSTRACTION LAYER — the only place that knows the source
│  └─ filtering.ts            # pure filter + URL (de)serialisation logic (no DOM, testable)
├─ components/
│  ├─ Layout.astro            # site shell (head, nav, footer)
│  ├─ SearchBar.astro
│  ├─ FilterPanel.astro       # renders facets derived from the data
│  └─ TextbookCard.astro      # depends only on core fields; chips only if present
├─ scripts/
│  └─ library.ts              # the only client JS: filtering + URL state (~2KB)
├─ styles/global.css          # design tokens + base + prose styles
└─ pages/
   ├─ index.astro
   ├─ library.astro
   └─ [slug].astro            # generic route for every markdown page
```

**Clear separation of concerns:**

- **Data layer** (`lib/textbooks.ts`) is the _only_ module that reads the data
  source. Today it bundles a folder of per-textbook JSON documents
  (`src/content/textbooks/*.json`) via `import.meta.glob`; tomorrow it can
  `fetch()` a remote source or read Action-built data — the UI never changes
  because the returned shape stays `Textbook[]`. It also normalises records
  defensively, sorts them by title and derives facets.
- **Filtering logic** (`lib/filtering.ts`) is pure and framework-free, so the
  same rules are testable (`npm run test:logic`) and mirrored by the client.
- **UI components** depend only on the five guaranteed fields and render
  optional metadata only when present.

### Schema-flexible but UI-stable

Only `id`, `title`, `description`, `authors`, `url` are guaranteed. Everything
else (`language`, `software`, `subject`, `keywords`) is optional, and the `meta`
bag holds arbitrary future fields (`edition`, `license`, `prerequisites`, …).
Unknown fields are ignored safely and never break rendering — so new metadata
can be added over time **without schema migrations**: add it under `meta`, which
is an open object. (The JSON Schema validates the known fields and steers genuinely
new data into `meta` rather than new top-level keys, keeping the contract stable.)

---

## Adding content

### Add a textbook

Drop a new JSON document into `src/content/textbooks/`, one file per book. The
`id` is the textbook's **own GitHub repository** in `<owner>/<repo>` form —
GitHub guarantees that's globally unique, so no two entries collide. The filename
is derived from it as `<owner>__<repo>.json` (e.g. id `example-press/ml-in-python`
→ `src/content/textbooks/example-press__ml-in-python.json`):

```json
{
  "id": "owner/repo",
  "title": "Title",
  "description": "One-paragraph summary.",
  "authors": ["Author One"],
  "url": "https://owner.github.io/repo/",
  "language": "en",
  "software": ["Python"],
  "subject": ["cs"],
  "keywords": ["topic", "topic"],
  "meta": { "license": "CC-BY-4.0" }
}
```

Note `id` (the source **repo**, as `owner/repo`) and `url` (where the book is
**published**, e.g. GitHub Pages) are distinct. Only the first five fields are
required. The data
layer picks the file up automatically (no central list to edit), and new facet
values appear in the filters automatically. Library order is by title.

Each document is validated against a JSON Schema
([`schemas/textbook.schema.json`](schemas/textbook.schema.json)):

- **In your editor:** `.vscode/settings.json` maps the schema onto
  `src/content/textbooks/*.json`, so VS Code flags missing/mistyped fields (and an
  `id` not in `owner/repo` form) as you type.
- **In CI / locally:** `npm run test:data` validates every document against the
  same schema and checks library-wide invariants (unique `id`s; filename
  derived from `id`). The runtime data layer stays lenient and skips malformed
  records, so this check is what fails loudly on an authoring mistake before a
  book silently drops out of the library.

### Add a static page

Drop a Markdown file into `src/content/pages/`:

```md
---
title: FAQ
slug: faq
template: page
description: Frequently asked questions.
# optional nav controls:
nav: true      # default true — set false to keep it routable but out of the menu
order: 3       # optional sort key for the header nav (lower first)
---

# FAQ
…
```

It is served at `/faq` **and is added to the header nav automatically** (the nav
is built from the `pages` collection, after Home and Library). No routing or
layout changes needed. Use `nav: false` to hide a page from the menu, and
`order` to position it (ties fall back to alphabetical by title).

> **Note on `layout` vs `template`:** the brief's example used `layout: page`,
> but Astro 5 reserves the `layout` frontmatter key for its legacy markdown
> layout feature (it tries to resolve the value as a component path, which
> breaks the build). We use `template` instead as a neutral layout hint; the
> generic `[slug].astro` route applies the site layout. `slug` defaults to the
> filename when omitted.

---

## Styling choice

**Plain CSS with design tokens**, not a utility framework. Rationale: the design
is deliberately minimal and the surface area is small, so a handful of CSS custom
properties (spacing scale, type scale, colour) plus per-component scoped styles
are easier to read and audit than a framework — and ship near-zero CSS overhead.
Tokens live in `src/styles/global.css`; everything references them for a
consistent spacing/type rhythm.

## Search choice

Plain **case-insensitive substring** matching over a precomputed searchable
string (title + description + keywords + authors). It fully meets the
requirements with **zero dependencies**. The library ships ~2 KB of JS. If the
dataset grows large enough to need ranked/fuzzy search, `lib/filtering.ts` is the
single seam to swap in Fuse.js or FlexSearch (client-side only — no external
search service).

---

## Deployment

Fully static (`dist/`), so it works as-is on **GitHub Pages** and **Cloudflare
Pages**.

- **Cloudflare Pages / custom domain / root:** no config needed.
- **GitHub Pages project subpath:** set `site` and `base` in `astro.config.mjs`,
  e.g. `site: 'https://<user>.github.io'`, `base: '/textbooks-website'`. All
  internal links already use `import.meta.env.BASE_URL`, so they respect `base`.

---

## Automation readiness (not implemented)

The architecture is ready for a future GitHub Action without any structural
rewrite. Intended flow:

1. Each textbook repo carries a small `textbook.yml` metadata file.
2. An Action reads those files, **validates** them against
   [`schemas/textbook.schema.json`](schemas/textbook.schema.json) — the same
   language-agnostic contract used by the editor and `npm run test:data` — and
   writes one JSON document per textbook into `src/content/textbooks/` (the same
   folder the data layer already reads).
3. A commit/push triggers a rebuild and redeploy.

Why no code changes are needed when that lands:

- `lib/textbooks.ts` is the single swappable data seam.
- The schema is additive (`meta` bag + optional fields), so new metadata needs
  no migration.
- Facets and filters derive from the data, so new values appear automatically.

This is intentionally **not built** here.
