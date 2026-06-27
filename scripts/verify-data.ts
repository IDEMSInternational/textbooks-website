/**
 * Validates every per-textbook JSON document in `src/content/textbooks/`:
 *
 *   1. against the shared JSON Schema (`schemas/textbook.schema.json`), and
 *   2. against catalogue-wide invariants a per-file schema can't express:
 *        - every `id` (an <owner>/<repo> pair) is unique across files, and
 *        - each file is named `<owner>__<repo>.json`, derived from its `id`.
 *
 * This is the headless / CI counterpart to the live editor validation wired up
 * in `.vscode/settings.json`. Both read the SAME schema, so the field contract
 * has a single source of truth. The data layer (`src/lib/textbooks.ts`) stays
 * deliberately lenient at runtime (it skips malformed records); this script is
 * the strict gate that fails loudly so authoring mistakes are caught before a
 * book silently vanishes from the catalogue.
 *
 * Run with: npm run test:data   (tsx scripts/verify-data.ts)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dataDir = join(root, 'src/content/textbooks');
const schemaPath = join(root, 'schemas/textbook.schema.json');

/** Loosely-typed view of the subset of JSON Schema keywords we support. */
interface Schema {
  type?: 'object' | 'string' | 'array' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  minLength?: number;
  minItems?: number;
  pattern?: string;
  format?: string;
  enum?: unknown[];
}

const schema: Schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

/**
 * The filename a document's `id` must live under: an `<owner>/<repo>` pair maps
 * to `<owner>__<repo>.json`. Returns null when the id isn't in owner/repo form
 * (the schema check reports that separately).
 */
function fileNameForId(id: string): string | null {
  const m = /^([^/]+)\/([^/]+)$/.exec(id);
  return m ? `${m[1]}__${m[2]}.json` : null;
}

/** JSON-Schema-flavoured type name (arrays and null are distinct from object). */
function typeOf(v: unknown): string {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

/**
 * Minimal JSON-Schema validator covering ONLY the keywords used by
 * `textbook.schema.json` (type, required, properties, additionalProperties,
 * items, minLength, minItems, pattern, format:uri, enum). Pushes human-readable
 * messages into `errors`. Intentionally tiny — not a general-purpose validator.
 */
function validate(value: unknown, sch: Schema, path: string, errors: string[]): void {
  if (sch.type) {
    const actual = typeOf(value);
    if (actual !== sch.type) {
      errors.push(`${path || '(root)'}: expected ${sch.type}, got ${actual}`);
      return; // wrong type → don't cascade into sub-checks
    }
  }

  if (sch.type === 'string' && typeof value === 'string') {
    if (sch.minLength != null && value.length < sch.minLength) {
      errors.push(`${path}: must not be empty`);
    }
    if (sch.pattern && !new RegExp(sch.pattern).test(value)) {
      errors.push(`${path}: "${value}" does not match required pattern ${sch.pattern}`);
    }
    if (sch.format === 'uri') {
      try {
        new URL(value);
      } catch {
        errors.push(`${path}: "${value}" is not a valid absolute URI`);
      }
    }
    if (sch.enum && !sch.enum.includes(value)) {
      errors.push(`${path}: must be one of ${sch.enum.join(', ')}`);
    }
  }

  if (sch.type === 'array' && Array.isArray(value)) {
    if (sch.minItems != null && value.length < sch.minItems) {
      errors.push(`${path}: must contain at least ${sch.minItems} item(s)`);
    }
    if (sch.items) {
      value.forEach((item, i) => validate(item, sch.items!, `${path}[${i}]`, errors));
    }
  }

  if (sch.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const props = sch.properties ?? {};
    for (const req of sch.required ?? []) {
      if (!(req in obj)) errors.push(`${path || '(root)'}: missing required field "${req}"`);
    }
    if (sch.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props)) {
          errors.push(`${path || '(root)'}: unexpected field "${key}" (put new fields under "meta")`);
        }
      }
    }
    for (const [key, child] of Object.entries(props)) {
      if (key in obj) validate(obj[key], child, path ? `${path}.${key}` : key, errors);
    }
  }
}

const files = readdirSync(dataDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  ok ? pass++ : fail++;
}

const seenIds = new Map<string, string>(); // id -> first filename that used it

check('at least one textbook document exists', files.length > 0, `found ${files.length} in ${dataDir}`);

for (const file of files) {
  const full = join(dataDir, file);
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    check(`${file}: parses as JSON`, false, String(err));
    continue;
  }

  const errors: string[] = [];
  validate(doc, schema, '', errors);
  check(`${file}: matches schema`, errors.length === 0, '\n    - ' + errors.join('\n    - '));

  // Cross-file invariants — only meaningful once the document has a usable id.
  const id = (doc as { id?: unknown }).id;
  if (typeof id === 'string' && id.length > 0) {
    const expected = fileNameForId(id);
    check(
      `${file}: filename derived from id`,
      expected !== null && file === expected,
      expected ? `expected ${expected}` : `id is not in owner/repo form`,
    );
    const prev = seenIds.get(id);
    check(`${file}: id "${id}" is unique`, prev === undefined, `also used by ${prev}`);
    seenIds.set(id, file);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
// Throwing keeps this script free of Node type deps while still producing a
// non-zero exit code (and a clear stack-free failure) when a check fails.
if (fail > 0) throw new Error(`${fail} data validation check(s) failed`);
