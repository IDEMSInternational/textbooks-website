/**
 * DATA ABSTRACTION LAYER
 * ----------------------
 * This module is the ONLY place that knows where textbook data comes from.
 * UI components and pages import from here, never from the raw JSON.
 *
 * The source is a COLLECTION of per-textbook JSON documents — one file per book
 * under `src/content/textbooks/<id>.json`. They are bundled into the build via
 * Vite's `import.meta.glob`, so adding, editing or removing a textbook is just a
 * file change in that folder: no code change here, no central manifest to keep
 * in sync. Later, a GitHub Action can generate those same per-repo documents
 * (from each textbook's `textbook.yml`) and drop them in the same folder — or
 * this function can be swapped to `fetch()` a remote source — WITHOUT any change
 * to UI code, as long as the returned shape stays `Textbook[]`.
 *
 * Keep this layer thin and explicit: load, normalise, derive facets. No
 * rendering concerns, no filtering concerns (those live in `filtering.ts`).
 */
import type { Textbook, Facet, FacetKey } from './types';
import { FACET_KEYS, facetValues } from './types';

/**
 * Eagerly load every per-textbook JSON document. The glob is resolved by Vite at
 * build time, so each file's parsed contents land on `.default`. The keys are
 * file paths; we only need the values. Order here is not relied upon — the
 * library is sorted explicitly below.
 */
const textbookModules = import.meta.glob<{ default: unknown }>(
  '../content/textbooks/*.json',
  { eager: true },
);

/** Human-readable labels for each facet group, used by the filter panel. */
const FACET_LABELS: Record<FacetKey, string> = {
  language: 'Language',
  software: 'Software',
  subject: 'Subject',
};

/**
 * Defensively coerce one raw record into a `Textbook`. Guarantees the five core
 * fields are present and well-typed; passes optional fields through only when
 * they are the expected type, so malformed/partial entries can never break the
 * UI. Returns `null` for records missing required fields (skipped by caller).
 */
function normalise(raw: unknown): Textbook | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // Required core fields — without these the entry is unusable.
  if (typeof r.id !== 'string' || r.id.length === 0) return null;
  if (typeof r.title !== 'string') return null;
  if (typeof r.url !== 'string') return null;

  const book: Textbook = {
    id: r.id,
    title: r.title,
    description: typeof r.description === 'string' ? r.description : '',
    authors: Array.isArray(r.authors)
      ? r.authors.filter((a): a is string => typeof a === 'string')
      : [],
    url: r.url,
  };

  // Optional facets — `language` is single-valued, `software`/`subject` are
  // lists (a book can be taught with more than one piece of software, or span
  // more than one subject area).
  if (typeof r.language === 'string') book.language = r.language;
  if (Array.isArray(r.software)) {
    book.software = r.software.filter((s): s is string => typeof s === 'string');
  }
  if (Array.isArray(r.subject)) {
    book.subject = r.subject.filter((s): s is string => typeof s === 'string');
  }

  if (Array.isArray(r.keywords)) {
    book.keywords = r.keywords.filter((k): k is string => typeof k === 'string');
  }

  // Unknown future fields are preserved verbatim in `meta` and ignored by the
  // UI until something opts in to reading them.
  if (typeof r.meta === 'object' && r.meta !== null) {
    book.meta = r.meta as Record<string, unknown>;
  }

  return book;
}

/** Memoised, normalised dataset (loaded once per build/server start). */
let cache: Textbook[] | null = null;

/**
 * Returns all textbooks. Synchronous today because the source is a set of
 * bundled imports; declared `async` so a future remote-fetch implementation is a
 * drop-in replacement that needs no caller changes.
 *
 * Records are normalised defensively (malformed/partial files are skipped) and
 * sorted by title so the library order is deterministic regardless of the
 * filesystem/glob order.
 */
export async function getTextbooks(): Promise<Textbook[]> {
  if (cache) return cache;
  cache = Object.values(textbookModules)
    .map((mod) => normalise(mod.default))
    .filter((b): b is Textbook => b !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
  return cache;
}

/** Convenience: total count, for the home-page stat. */
export async function getTextbookCount(): Promise<number> {
  return (await getTextbooks()).length;
}

/**
 * Derives the filter facets dynamically from the data — values are NEVER
 * hardcoded. Each facet lists the distinct values actually present, sorted
 * alphabetically (locale-aware). Facets with no values are omitted so the UI
 * doesn't render empty filter groups.
 */
export async function getFacets(): Promise<Facet[]> {
  const books = await getTextbooks();
  const facets: Facet[] = [];

  for (const key of FACET_KEYS) {
    const values = new Set<string>();
    for (const book of books) {
      for (const value of facetValues(book, key)) values.add(value);
    }
    if (values.size === 0) continue;
    facets.push({
      key,
      label: FACET_LABELS[key],
      values: [...values].sort((a, b) => a.localeCompare(b)),
    });
  }

  return facets;
}
