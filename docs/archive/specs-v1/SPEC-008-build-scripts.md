# SPEC-008 — Build Script Improvements: romcal & build-examination.js
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Opus (fresh clone required — these involve research + architecture decisions)
**Estimated total effort:** ~4 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-008-A | IDEA-004 | build-examination.js build script | open |
| SPEC-008-B | IDEA-002, IDEA-020 | romcal offline liturgical calendar build script | open |

---

## Context for Claude Code
**Fresh clone required.** Read `scripts/build-litcal.js`, `scripts/` directory listing, `data/examination.json`, `data/litcal-2026.json`, `package.json`, and `CLAUDE.md` before beginning.

**Design principles:**
- CommonJS everywhere — no ES module syntax in build scripts
- No arrow functions
- Local-first: build outputs must be reproducible without network access (after initial `npm install`)
- CI: `npm run build` → esbuild IIFE + auto SW cache bump. Build scripts are separate from the main build and run on-demand or in CI.
- Output format must exactly match existing JSON schemas — CI validates these

**Ordering:** SPEC-008-A first (simpler, self-contained). SPEC-008-B second (more complex, involves an npm package research step).

---

## SPEC-008-A — build-examination.js build script
**Origin:** IDEA-004 | **Status:** open

### Goal
`data/examination.json` was hand-authored with no reproducible build pipeline. Create `scripts/build-examination.js` to transform a structured source (e.g., ConfessIt translation JSON, or a well-structured plain-text source) into the examination data file, establishing reproducibility if the data ever needs updating.

### Files affected
- `scripts/build-examination.js` (new file)
- `package.json` — add an npm script entry
- `data/examination.json` (read-only during build, output overwritten)

### Steps

**Step 1: Understand the existing data structure**
Read `data/examination.json` in full before writing any code. Document the schema at the top of `build-examination.js` in a comment block:
```js
/**
 * build-examination.js
 *
 * Transforms source examination-of-conscience data into data/examination.json
 *
 * Source: [describe source file format here after reading examination.json]
 * Output schema: [document the schema here]
 *
 * Usage: node scripts/build-examination.js [--source path/to/source.json]
 * Default source: scripts/examination-source.json
 */
```

**Step 2: Choose source format**
The source should be a JSON file at `scripts/examination-source.json` that is easier to edit than the output. The build script transforms it into the canonical `data/examination.json` format. If the examination.json is already in a clean, directly-editable format (no transformation needed), the script's job is to validate the schema and write a normalized output.

**Step 3: Implement the script**
```js
'use strict';

var fs = require('fs');
var path = require('path');

var SOURCE_PATH = path.join(__dirname, 'examination-source.json');
var OUTPUT_PATH = path.join(__dirname, '..', 'data', 'examination.json');

function buildExamination() {
  // Read source
  var source = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));

  // Validate required fields (read examination.json schema first)
  // Transform if needed
  // Write output
  var output = transform(source);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log('examination.json written: ' + output.items.length + ' items');
}

function transform(source) {
  // transformation logic here
  return source; // or transformed output
}

buildExamination();
```

**Step 4: Add npm script to package.json**
```json
"scripts": {
  "build:examination": "node scripts/build-examination.js"
}
```

**Step 5: Copy current examination.json as the initial source**
`cp data/examination.json scripts/examination-source.json`

This ensures the first run of `npm run build:examination` produces identical output to the current `data/examination.json`.

### Test checklist
- [ ] `node scripts/build-examination.js` runs without error
- [ ] Output `data/examination.json` is byte-for-byte identical to the pre-existing file (first run)
- [ ] Schema validation CI passes after the script runs (`npm run build` or equivalent)
- [ ] `package.json` has `build:examination` script entry
- [ ] Script has JSDoc comment at top describing source format, output schema, and usage
- [ ] CommonJS only — no `import`/`export`, no arrow functions

### Claude Code notes
Read `data/examination.json` completely before writing a single line of build script code. The schema is the specification. If the examination data is already flat and clean (no denormalization or transformation needed), the script's primary value is schema validation — implement validation logic accordingly. Check `scripts/` for existing build scripts (build-litcal.js, build-bible-drb.js, etc.) and follow the same code style and error handling patterns.

---

## SPEC-008-B — romcal offline liturgical calendar build script
**Origin:** IDEA-002, IDEA-020 | **Status:** open

### Goal
`scripts/build-litcal.js` currently fetches liturgical calendar data from the LitCal API at build time, creating a network dependency. Replace this API call with the `romcal` npm package so calendar data is computed locally, making builds fully offline-capable.

**Pre-implementation research gate:** Before writing code, complete the romcal API investigation described below. If the romcal package cannot produce output matching the existing schema, document the blockers and halt — do not partially rewrite the script.

### Files affected
- `scripts/build-litcal.js` (rewrite)
- `package.json` — add `romcal` dependency
- `data/litcal-2026.json` and `data/litcal-2027.json` (regenerated outputs — must match existing schema)

### Step 1: Research romcal API (do this before writing any code)

```bash
npm install romcal --save-dev
node -e "const romcal = require('romcal'); console.log(Object.keys(romcal));"
```

Investigate:
1. What is the current major version of romcal on npm?
2. How is a Calendar instantiated? (constructor signature, options)
3. Which US national calendar plugin to use?
4. What does the output of `calendar.generateCalendar(2026)` look like? (log a sample day)
5. Does the output contain: date, season, season week, weekday name, celebration name, liturgical color, rank?
6. What is the exact output structure — compare to `data/litcal-2026.json`

Document findings as comments in the script before the implementation.

### Step 2: Existing schema (read data/litcal-2026.json)

Read `data/litcal-2026.json` and document the schema in the script header. At minimum, identify:
- Top-level structure (array vs object keyed by date)
- Per-day fields and their types
- Season enum values (must match `config.js`)
- Any computed fields that can be derived from romcal output

### Step 3: Implement the build script

```js
'use strict';

/**
 * build-litcal.js
 *
 * Generates data/litcal-YYYY.json for each target year using the romcal npm package.
 * Replaces the previous LitCal API fetch approach with a fully local computation.
 *
 * Usage: node scripts/build-litcal.js
 * Output: data/litcal-2026.json, data/litcal-2027.json
 *
 * romcal version: [fill in after research]
 * Calendar: United States General Roman Calendar
 */

var fs = require('fs');
var path = require('path');
// var romcal = require('romcal');  // fill in correct require after research

var TARGET_YEARS = [2026, 2027];
var OUTPUT_DIR = path.join(__dirname, '..', 'data');

function buildYear(year) {
  // Initialize romcal calendar — fill in after researching API
  // var calendar = new romcal.Calendar({ ... });
  // var rawCalendar = calendar.generateCalendar(year);

  // Transform rawCalendar to match data/litcal-YYYY.json schema
  var output = transformCalendar(rawCalendar, year);

  var outputPath = path.join(OUTPUT_DIR, 'litcal-' + year + '.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('litcal-' + year + '.json written: ' + Object.keys(output).length + ' days');
}

function transformCalendar(raw, year) {
  // Map romcal output to existing schema
  // Must produce output identical in structure to the existing litcal-YYYY.json files
  return {};
}

TARGET_YEARS.forEach(function(year) {
  buildYear(year);
});
```

### Step 4: Schema compatibility validation

After generating new JSON files, compare them field-by-field against the existing pre-built files:
```bash
node -e "
  var old = require('./data/litcal-2026.json');
  var newData = require('./data/litcal-2026-new.json');
  var oldKeys = Object.keys(old);
  var newKeys = Object.keys(newData);
  console.log('Old days:', oldKeys.length, 'New days:', newKeys.length);
  // compare a sample day
  console.log('OLD sample:', JSON.stringify(old[oldKeys[0]], null, 2));
  console.log('NEW sample:', JSON.stringify(newData[newKeys[0]], null, 2));
"
```

The output must pass the existing CI schema validation (`npm run validate` or equivalent).

### Step 5: Keep pre-built files as fallback

After the script is validated:
- The pre-built `data/litcal-2026.json` and `data/litcal-2027.json` remain in the repo as committed fallbacks
- Add a comment to the script noting that the pre-built files are the authoritative fallback if romcal is unavailable
- The SW cache serves these files at runtime — the script only regenerates them when run explicitly

### Test checklist
- [ ] `npm install` with romcal added to devDependencies completes without error
- [ ] `node scripts/build-litcal.js` runs without error
- [ ] Generated `litcal-2026.json` matches the existing file's schema (same keys, same field names)
- [ ] Generated `litcal-2027.json` matches the existing file's schema
- [ ] CI schema validation passes on the generated output
- [ ] Script has full JSDoc header documenting romcal version, calendar used, and output schema
- [ ] No LitCal API fetch code remains in the script
- [ ] No arrow functions, no ES module syntax

### Claude Code notes
The romcal package has had breaking API changes across major versions — do not assume the API from old examples or tutorials. Install it and inspect the actual exports before writing any integration code. If romcal's season naming does not match `config.js` enums exactly, write a mapping table in the `transformCalendar()` function — do not change `config.js`. The pre-built JSON files are the source of truth for the target schema.
