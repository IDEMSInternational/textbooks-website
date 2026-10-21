# Open, Adaptive Digital Textbooks — website

The website for IDEMS' **Open, Adaptive Statistics & Data Science Textbooks**.
Two things live here:

1. A **marketing / landing site** (Home, Innovation, About IDEMS, Impact and
   Standards, Join) — component-driven content authored in Markdown/MDX.
2. A **Library** (`/library`) — a static, client-filtered index of openly hosted
   digital textbooks. The textbooks themselves are **not** hosted here; every
   entry links out to an externally hosted site (e.g. GitHub Pages).

Built with **Astro** + **TypeScript**, fully static. No backend, no database.
The only external call is the Join page's interest form, which posts client-side
to a Google Form; the Library's search and filtering are entirely client-side.

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

There's also an optional end-to-end browser check that drives a locally
installed Chrome (via `puppeteer-core`, no download) to confirm the Library's
interactive behaviour against a running server:

```bash
npm run preview &
node scripts/verify-browser.mjs http://localhost:4321
```

---

## What's on the site

- **Home** (`/`) — the marketing landing page: hero, the problem/solution
  narrative, per-audience use cases, testimonials and the IDEMS team.
- **Innovation** (`/innovation`) — a component-driven page describing the
  three-layer architecture and the roadmap.
- **About IDEMS** (`/idems`) and **Impact and Standards** (`/impact-and-standards`)
  — prose content pages.
- **Join** (`/join`) — a "register your interest" form that posts to a Google
  Form.
- **Library** (`/library`) — the searchable index:
  - Multi-select filters for **language**, **software**, **subject**, derived
    dynamically from the data (never hardcoded).
  - Case-insensitive **search** across title, description, keywords and authors.
  - Filters + search combine as `(language AND software AND subject) AND search`,
    with **OR within** a facet and **AND across** facets.
  - All filter/search state lives in the **URL** (`?language=en&software=python&search=matrix`)
    so views are shareable and browser back/forward works.

The header nav is built automatically from the content pages (see below), so
adding a page adds it to the menu with no routing changes.

---

## Two content models

The repo has two independent content layers, each authored as plain files:

### 1. Marketing / content pages (`src/content/pages/*.{md,mdx}`)

Each file is a page. Frontmatter drives routing and navigation; the body is the
content. Two templates:

- `template: page` (default) — reading-width **prose**.
- `template: sections` — a full-width, **component-driven** layout. The
  design-system blocks (`Section`, `Card`, `CardGrid`, `Button`, `ButtonGroup`,
  `Row`, `Rows`, `Steps`, `InterestForm`, `ArchitectureDiagram`) are put in
  scope for the MDX, so authors use `<Section>` / `<Card>` **without importing
  anything**. See `src/content/pages/innovation.mdx` for a worked example.

### 2. Textbook data (`src/content/textbooks/*.json`)

One JSON document per textbook, read through a single data-abstraction layer
(`src/lib/textbooks.ts`) and rendered as cards on the Library page. Deliberately
**not** an Astro content collection, so the source can later be swapped for
Action-generated data without touching the UI (see
[Automation readiness](#automation-readiness-not-implemented)).

---

## Architecture

```
src/
├─ content/
│  ├─ textbooks/*.json        # STRUCTURED data layer — one JSON document per textbook
│  └─ pages/*.{md,mdx}        # CONTENT layer (prose + component-driven MDX pages)
├─ content.config.ts          # defines the `pages` collection (+ stops auto-collection)
├─ lib/
│  ├─ types.ts                # Textbook type, facet/state types (single source of truth)
│  ├─ textbooks.ts            # DATA ABSTRACTION LAYER — the only place that knows the source
│  └─ filtering.ts            # pure filter + URL (de)serialisation logic (no DOM, testable)
├─ components/
│  ├─ Layout.astro            # site shell (head, nav, footer)
│  ├─ Section, Card, CardGrid, Accordion, Steps, Button, Row, …  # design system
│  ├─ Team.astro, InterestForm.astro, ArchitectureDiagram.astro  # page-specific blocks
│  ├─ SearchBar.astro, FilterPanel.astro, StatusBadge.astro      # Library UI
│  └─ TextbookCard.astro      # depends only on core fields; chips only if present
├─ scripts/
│  ├─ library.ts              # Library client JS: filtering + URL state
│  └─ audience-toggle.ts      # Home page per-audience toggle
├─ styles/global.css          # design tokens + base + prose styles
└─ pages/
   ├─ index.astro             # Home
   ├─ library.astro           # Library
   └─ [slug].astro            # generic route for every content page
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
- **Design-system components** (`Section`, `Card`, `CardGrid`, …) are content-
  agnostic building blocks, shared between `.astro` pages and MDX content.
- **Library UI components** depend only on the five guaranteed textbook fields
  and render optional metadata only when present.

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

Drop a Markdown/MDX file into `src/content/pages/`:

```md
---
title: FAQ
slug: faq
template: page   # "page" = prose (default); "sections" = component-driven layout
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

For a **component-driven** page, set `template: sections` and use `.mdx`; the
design-system components listed under [Two content models](#two-content-models)
are already in scope — no imports required.

> **Note on `layout` vs `template`:** Astro 5 reserves the `layout` frontmatter
> key for its legacy markdown layout feature (it tries to resolve the value as a
> component path, which breaks the build). We use `template` instead as a neutral
> layout hint; the generic `[slug].astro` route applies the site layout. `slug`
> defaults to the filename when omitted.

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
requirements with **zero dependencies**. If the dataset grows large enough to
need ranked/fuzzy search, `lib/filtering.ts` is the single seam to swap in
Fuse.js or FlexSearch (client-side only — no external search service).

---

## Deployment

Fully static (`dist/`), so it works as-is on **GitHub Pages** and **Cloudflare
Pages**. This repo deploys to GitHub Pages on every push to `main` via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), served at the
custom domain **statsbooks.idems.international**. A separate CI workflow
([`ci.yml`](.github/workflows/ci.yml)) type-checks, runs the tests and does a
full build on every pull request.

- **Domain root (current) / Cloudflare Pages / custom domain:** `base` is `'/'`
  in `astro.config.mjs`; no per-path config needed.
- **GitHub Pages project subpath** (e.g. `.../textbooks-website`): set `site`
  and `base` in `astro.config.mjs`, e.g. `base: '/textbooks-website'`. Internal
  links respect `base` automatically — `.astro` files via
  `import.meta.env.BASE_URL`, and markdown/MDX links via the `remarkBaseLinks`
  plugin in the config.

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
