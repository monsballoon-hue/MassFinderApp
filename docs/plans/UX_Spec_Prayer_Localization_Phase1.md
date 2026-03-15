# UX Spec: Prayer Content Localization — Spanish Phase 1 (I18N series)

**Created:** 2026-03-15
**Status:** Spec ready
**Source:** Pastoral Advisor (Fr. Mike) handoff → Research (IDEA-096) → This spec
**Backlog items:** IDEA-096 (research, done), IDEA-097 (this spec)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_I18N.md
**Depends on:** examination.js (implemented), settings.js (implemented), reader system (implemented), utils.js (implemented)
**Dependencies on this:** IDEA-098 (Rosary Phase 2), IDEA-099 (Stations Phase 3), IDEA-100 (Prayerbook Phase 4)

| ID | Title | Files | Status |
|----|-------|-------|--------|
| I18N-01 | Shared `getPrayerText()` helper | src/utils.js | new |
| I18N-02 | Prayer Language picker in Settings | src/settings.js, src/app.js | new |
| I18N-03 | Wire `_t()` shorthand in examination.js | src/examination.js | new |
| I18N-04 | Localize opening prayer screen | src/examination.js | new |
| I18N-05 | Localize section hero titles | src/examination.js | new |
| I18N-06 | Localize question text (both render paths) | src/examination.js | new |
| I18N-07 | Localize prayers (Act of Contrition, Thanksgiving, Prayer Before) | src/examination.js | new |
| I18N-08 | Localize How to Confess (title + steps) | src/examination.js | new |
| I18N-09 | Localize confessional summary preamble + labels | src/examination.js | new |
| I18N-10 | Add `title_es` to commandments + precepts | data/examination.json | new |
| I18N-11 | Add `text_es` to all 66 questions | data/examination.json | new |
| I18N-12 | Add `text_es` / `title_es` to prayers | data/examination.json | new |
| I18N-13 | Convert how_to_confess steps to objects + add `text_es` | data/examination.json | new |
| I18N-14 | Localize pastoral note for Q31 (suicide) | src/examination.js | new |
| I18N-15 | Localize all remaining hardcoded UI strings | src/examination.js | new |

---

## Context

### The pastoral case

32 Spanish-language Mass services and 9 bilingual (en/es) services exist in parish_data.json. These aren't abstractions — they represent real families who attend Spanish Mass every week at parishes like Our Lady of the Sacred Heart and St. Martha's.

Maria, 34, attends Spanish Mass with her three kids. She can find Mass times in the app. But when she opens the Examination of Conscience to prepare for confession, every question, every prayer, every instruction is in English. An examination of conscience in a second language creates distance at the moment you need closeness to God. Prayer in your heart language matters.

The pastoral advisor identified Spanish prayer tools as the #2 priority (after data accuracy). This spec addresses the highest-value piece: the Examination of Conscience, which is the prayer tool most tightly bound to a specific sacrament (Penance/Reconciliation).

### Why Examination first

The Examination of Conscience is the natural starting point for three reasons:

1. **Pastoral urgency.** It's sacramental preparation — Maria is reading these questions in a confessional or in the pew before confession. Every other prayer tool (Rosary, Stations) can be prayed in either language without friction; the Examen *asks questions* the person needs to understand deeply.

2. **Contained scope.** 90 translatable strings (66 questions, 10 commandment titles, 1 precepts title, 3 prayer title/text pairs, 6 how-to steps, 1 how-to title). Compare to prayers.json (Rosary mysteries + stations + novenas = 200+ strings).

3. **Infrastructure bootstrap.** This spec builds the shared `getPrayerText()` helper, the Settings language picker, and the data model conventions that Phases 2-4 reuse with zero additional plumbing.

### Data model decision (from IDEA-096 research)

Three options were evaluated:

**Option A — Inline dual-language fields (SELECTED):** Add `text_es` alongside `text` in the same JSON files. Content co-located → prevents maintenance drift. Bloat: examination.json grows ~8KB (14KB → ~22KB). Zero loader changes. Simple convention: touch `text`, check `text_es`.

**Option B — Parallel locale files (REJECTED):** Separate `examination-es.json`. Clean separation but every content change requires two files. The #1 cause of localization drift in solo-dev projects.

**Option C — i18n framework (REJECTED):** Key-value bundles with message IDs. Massively over-engineered for 3-4 data files. 10+ hours of plumbing before any translation ships.

### What is NOT being localized

- **App UI chrome:** Buttons, labels, tab names, bottom nav, toasts outside the exam module. The app stays English.
- **Parish data:** Church names, service notes, addresses.
- **CCC references:** The catechism.json text stays English. CCC paragraph numbers (§2087) are language-agnostic.
- **Other prayer modules:** Rosary, Stations, Chaplet, Prayerbook, Novenas — all future phases.

---

## Three personas for this spec

**Maria (34, bilingual, phone-native):** Attends Spanish Mass with her kids. Comfortable with phones. She'll find the language setting in Settings on her own. She needs the Examination questions and prayers in Spanish to prepare for confession authentically. She may switch back to English for the CCC snippets — that's fine.

**Abuela Rosa (68, Spanish-dominant, low tech comfort):** Maria's mother, attends the same parish. Uses the app because Maria installed it on her phone. She will NOT find Settings on her own — Maria will set it for her. Once set, the entire Examination flow must work in Spanish without any English-language navigation traps. Buttons like "Next" and "Done" must be in Spanish.

**Fr. Thomas (parish priest, bilingual):** Hears confessions in both languages. Occasionally shows parishioners the app. Needs to toggle between English and Spanish easily to show the tool to different penitents during the same afternoon.

---

## I18N-01: Shared `getPrayerText()` helper

**Priority:** P0 — prerequisite for everything else
**Files:** `src/utils.js`

### What

A single helper function in utils.js that every prayer module will use to read localized text. The function reads `localStorage('mf-prayer-lang')`, looks for an `_es` (or `_pl`, `_pt`) suffixed field on the data object, and falls back silently to the base English field.

### Design rationale

- **Silent fallback is pastoral.** If a string doesn't have a Spanish translation yet, it falls back to English with no indicator. A mix of languages in prayer is better than a missing prayer. This was an explicit pastoral direction from Fr. Mike.
- **Field-suffix convention** (`text_es`, `title_es`) instead of nested `translations.es.text` because: (a) it's flat and scannable in the JSON, (b) it requires zero structural changes to the data files, (c) it scales to `text_pl` / `text_pt` with the same pattern.
- **localStorage key:** `mf-prayer-lang`. Default: absent (treated as `'en'`). Follows existing `mf-` prefix convention. Lives in Settings alongside theme, text size, and rosary preference.

### Function signature

```javascript
// getPrayerText(item, field) → string
// item: any object from prayer JSON data (question, prayer, commandment, step)
// field: the base field name ('text', 'title')
// returns: item.text_es if lang=es and field exists, else item.text
```

### Fallback chain

```
localStorage 'mf-prayer-lang' → 'es'
  → item.text_es exists? → return item.text_es
  → item.text_es missing? → return item.text (English, silent)

localStorage absent or 'en'
  → return item.text (English)

localStorage throws (private browsing)
  → return item.text (English)
```

### Test checklist
- [ ] `getPrayerText({text: 'Hello', text_es: 'Hola'}, 'text')` returns `'Hola'` when lang=es
- [ ] `getPrayerText({text: 'Hello'}, 'text')` returns `'Hello'` when lang=es (silent fallback)
- [ ] `getPrayerText({text: 'Hello', text_es: 'Hola'}, 'text')` returns `'Hello'` when lang=en
- [ ] `getPrayerText({text: 'Hello', text_es: 'Hola'}, 'text')` returns `'Hello'` when lang absent
- [ ] Function does not throw in any scenario

---

## I18N-02: Prayer Language picker in Settings

**Priority:** P0 — prerequisite for everything else
**Files:** `src/settings.js`, `src/app.js`

### User story

**Fr. Thomas** opens Settings. Under the "Prayer" group, above the existing Rosary Mystery toggle, he sees a new segmented control: **"Prayer Language"** with two buttons: **English** (active by default) and **Español**. He taps "Español." The button activates immediately. He closes Settings, opens the Examination, and everything is in Spanish. He finishes, goes back to Settings, taps "English" for the next penitent.

**Maria** sets this once for Abuela Rosa's phone and never touches it again.

### Before

The Prayer settings group currently shows:
```
Prayer
  Rosary Mystery        [Auto] [Manual]
  Confession Tracking   [toggle]
```

### After

```
Prayer
  Prayer Language       [English] [Español]
  Rosary Mystery        [Auto] [Manual]
  Confession Tracking   [toggle]
```

### Design rationale

- **Segmented control, not a dropdown.** Matches the existing Theme and Text Size patterns. With only 2 options (English, Español), a segmented control is ideal. When Polish is added (Phase 5+), this becomes a 3-segment control — still fits. At 4+ languages, it would need to become a dropdown, but that's far out.
- **"Español" not "Spanish."** The label should be in the target language so Spanish-dominant users can identify it. Same convention used by iOS, Android, and every major app.
- **Under "Prayer" not "Display."** This affects prayer content, not UI chrome. Keeping it in the Prayer group signals what it changes.
- **Not included in "Clear Prayer Activity."** Language preference is a display setting, not prayer activity data. `settingsClearAll` covers it (clears all `mf-*` keys).

### Test checklist
- [ ] Language picker renders as first item in Prayer settings group
- [ ] "English" is active by default (no localStorage key set)
- [ ] Tapping "Español" activates it, persists to localStorage
- [ ] Closing and reopening Settings shows the persisted choice
- [ ] "Clear All Data" resets language to English
- [ ] "Clear Prayer Activity" does NOT reset language

---

## I18N-03 through I18N-09: examination.js render path localization

**Priority:** P1 — the core work
**Files:** `src/examination.js`

### Architecture note

examination.js has **two render paths** due to historical layering:

1. **Section-by-section flow (current primary):** `_initSectionFlow()` → `_renderCurrentSection()` → one commandment at a time, crossfade navigation, footer with Previous/Next. This is what 99% of users see.

2. **Legacy full render:** `_renderExamination()` renders all commandments as expandable accordions on a single scrollable page. Still callable but not the default entry point.

Both paths must be localized. Every `section.title`, `q.text`, `prayer.title`, `prayer.text`, and how-to step must go through the `_t()` shorthand.

### I18N-04: Opening prayer screen

**User story:** Maria opens the Examination. Before any questions appear, she sees a centering moment — a cross icon and the Prayer Before Confession in Spanish. The button says "Comenzar Examen" instead of "Begin Examination." This first screen sets the language tone for the entire experience.

**Before:** `d.prayers.prayer_before.text` rendered directly.
**After:** `_t(d.prayers.prayer_before, 'text')` — reads `text_es` if available.

### I18N-05: Section hero titles

**User story:** As Maria navigates through commandments, each section hero shows the commandment title. "I am the Lord your God; you shall not have strange gods before Me." becomes "Yo soy el Señor tu Dios; no tendrás otros dioses fuera de Mí."

**Before:** `section.title` rendered directly.
**After:** `_t(section, 'title')` — reads `title_es` if available.

**Note:** The `cmdTitle` variable (used as a `data-cmd` attribute on checkboxes and later rendered in the summary groupings) must also be localized so the summary shows "1.º Mandamiento" not "1st Commandment" in Spanish mode.

### I18N-06: Question text

**User story:** Maria reads "¿He dudado o negado las enseñanzas de la Iglesia Católica?" instead of "Have I doubted or denied the teachings of the Catholic Church?"

**Before:** `q.text` rendered directly in both `_renderCurrentSection()` and `_renderSection()`.
**After:** `_t(q, 'text')` in both locations.

### I18N-07: Prayers (Act of Contrition, Thanksgiving, Prayer Before)

**User story:** On the summary screen, Maria sees the Act of Contrition in Spanish — "Dios mío, me arrepiento de todo corazón..." — the traditional Baltimore Catechism equivalent approved for Spanish-speaking parishes.

**Render points (4 total):**
1. Opening screen prayer (I18N-04 covers this)
2. `_renderPrayer()` function — title and text
3. `_renderSummaryScreen()` — Act of Contrition title + text, Thanksgiving title + text
4. `_renderExamination()` (legacy) — same

All use `_t(prayer, 'title')` and `_t(prayer, 'text')`.

### I18N-08: How to Confess

**User story:** Abuela Rosa taps the info icon during the examination. The modal shows "Cómo Ir a Confesarse" with 6 steps in Spanish: "Examina tu conciencia..." She's never been to confession in the US before — the Spanish steps give her confidence.

**Data structure change:** The how_to_confess steps are currently plain strings in an array. To add `text_es`, they must become objects: `{ "text": "...", "text_es": "..." }`. A backward-compatible guard (`typeof step === 'string'`) ensures old data format still works.

**Render points (2 total):**
1. `_renderHowTo()` — collapsed details element
2. `examShowHowTo()` — modal overlay

### I18N-09: Confessional summary preamble + labels

**User story:** Maria views her summary. It reads "Bendígame, Padre, porque he pecado. Han pasado 14 días desde mi última confesión." followed by "Estos son mis pecados:" — exactly what she would say in the confessional. The groupings show "1.º Mandamiento" and "Preceptos de la Iglesia."

**Affected strings:**
- "Bless me, Father, for I have sinned." → "Bendígame, Padre, porque he pecado."
- "It has been X days since my last confession." → "Han pasado X días desde mi última confesión."
- "These are my sins:" → "Estos son mis pecados:"
- `_shortCmdLabel()` output: "1st Commandment" → "1.º Mandamiento", "Precepts of the Church" → "Preceptos de la Iglesia"
- `_toActionFormat()`: Must strip Spanish prefixes ("¿He", "¿") in addition to English ones

### Test checklist (all I18N-03 through I18N-09)
- [ ] Opening prayer in Spanish when lang=es
- [ ] "Comenzar Examen" button text
- [ ] All 10 commandment titles in Spanish
- [ ] Precepts title "Preceptos de la Iglesia"
- [ ] All 66 question texts in Spanish
- [ ] How-to-Confess modal title + steps in Spanish
- [ ] Act of Contrition in Spanish on summary screen
- [ ] Thanksgiving prayer in Spanish
- [ ] Preamble: "Bendígame, Padre..." with correct day count in Spanish
- [ ] Groupings: "1.º Mandamiento" through "10.º Mandamiento"
- [ ] `_toActionFormat()` correctly strips "¿He" prefix
- [ ] All of the above in English when lang=en (regression)

---

## I18N-10 through I18N-13: examination.json data changes

**Priority:** P1 — the content
**Files:** `data/examination.json`

### Translation sourcing

**Standard prayers (Act of Contrition, Prayer Before, Thanksgiving):**

Multiple versions of the Acto de Contrición exist in Spanish Catholic tradition. The version used here matches the Baltimore Catechism English version currently in the app — an attrition-based formula that mentions fear of hell AND love of God, ending with a resolution to confess, do penance, and amend one's life. This is the version commonly taught in US Spanish-speaking parishes and matches the USCCB brochure text.

**Commandment titles:**

The Ten Commandments in Spanish follow the standard catechetical formulation used in the Catecismo de la Iglesia Católica (Spanish edition). These are liturgically fixed — there is no variation.

**Examination questions:**

The 66 questions are catechetical, not liturgical — they don't have "official" translations. The Spanish translations maintain:
- The same second-person self-examination form ("¿He..." = "Have I...")
- The same theological precision (pecado mortal = mortal sin, pecado grave = serious sin)
- Natural Spanish phrasing, not word-for-word translation
- Pastoral sensitivity on Q31 (suicide) matching the English pastoral note

**How-to-confess steps:**

These are practical instructions, not prayers. The translations use natural instructional Spanish ("Examina tu conciencia...", "Entra al confesionario...") with the standard confessional greeting: "Bendígame, Padre, porque he pecado."

### I18N-13 structure change: how_to_confess steps

The steps array changes from `["string1", "string2"]` to `[{"text": "string1", "text_es": "..."}, ...]`. This is the only structural change in the data file. All other additions are new fields on existing objects.

### Test checklist (data)
- [ ] examination.json is valid JSON after all additions
- [ ] Every commandment object has `title_es`
- [ ] Precepts object has `title_es`
- [ ] Every question object has `text_es`
- [ ] All 3 prayer objects have `title_es` and `text_es`
- [ ] how_to_confess has `title_es`
- [ ] All 6 how_to_confess steps are objects with `text` and `text_es`
- [ ] No `text_es` contains HTML — all plain text (HTML escaping handled by `_esc()`)
- [ ] Q31 `text_es` matches the pastoral sensitivity of the English version
- [ ] Spanish Act of Contrition includes both fear-of-hell and love-of-God motives (matching Baltimore Catechism structure)

---

## I18N-14: Pastoral note for Q31 (suicide)

**Priority:** P1 — safety-critical
**Files:** `src/examination.js`

### User story

Maria checks Q31 ("¿He contemplado o intentado el suicidio?"). The pastoral note appears in Spanish: a message that God loves her and help is available, with the 988 Suicide & Crisis Lifeline (which has Spanish-speaking operators), and the CCC §2283 quote about God's mercy toward those who have taken their own lives.

### Design rationale

- **988 stays as "988."** The number works in both languages. The label changes to "Línea de Prevención del Suicidio y Crisis."
- **CCC §2283 quote stays attributed in English.** The catechism.json is English. The quote text is translated to Spanish, but the citation remains "CCC §2283" — it's a universal reference number.
- **This is safety-critical localization.** A person in crisis reading this note in their second language might not fully absorb the support message. The Spanish version must be clear, warm, and direct.

### Test checklist
- [ ] Check Q31 in Spanish mode → pastoral note appears in Spanish
- [ ] 988 link is functional (tel:988)
- [ ] Uncheck Q31 → pastoral note disappears
- [ ] Check Q31 in English mode → pastoral note appears in English (regression)

---

## I18N-15: Remaining hardcoded UI strings

**Priority:** P2 — completeness
**Files:** `src/examination.js`

### What

Every hardcoded English string rendered inside the examination reader overlay that isn't covered by the data-driven items above. This is the difference between "the questions are in Spanish" and "the entire experience is in Spanish." Abuela Rosa should not see "Begin Examination" / "Next →" / "View Summary" / "Done" in English when the prayer language is set to Español.

### Complete string inventory

| English | Spanish | Location |
|---------|---------|----------|
| Examination of Conscience | Examen de Conciencia | Reader title (getTitle) |
| Begin Examination | Comenzar Examen | Opening screen button |
| Summary for Confession | Resumen para la Confesión | Summary header |
| This list exists only during this session. Nothing is saved. | Esta lista existe solo durante esta sesión. No se guarda nada. | Summary privacy note |
| No items selected yet. Check items above as you examine your conscience. | No hay elementos seleccionados. Marca los elementos mientras examinas tu conciencia. | Empty summary state |
| Noted for your confession summary | Anotado para tu resumen de confesión | First-check toast |
| ← Previous | ← Anterior | Footer nav |
| Next → | Siguiente → | Footer nav |
| View Summary → | Ver Resumen → | Footer nav (last section) |
| X item(s) noted | X anotado(s) | Footer count |
| No items noted | Sin anotaciones | Footer count (empty) |
| ← Back | ← Volver | Summary screen footer |
| Done | Listo | Summary screen footer |
| I went to confession today | Fui a confesarme hoy | Tracker button |
| Find Confession Near Me | Encontrar Confesión Cerca | CTA button |
| Go in peace to love and serve the Lord. | Ve en paz para amar y servir al Señor. | Closing blessing |
| Last Confession: Today/Yesterday/X days ago | Última Confesión: Hoy/Ayer/Hace X días | Tracker status |
| End Examination? | ¿Terminar Examen? | Exit dialog title |
| Your X noted item(s) will be cleared... | Tus X anotación(es) se borrarán... | Exit dialog message |
| Continue Examining | Continuar Examinando | Exit dialog cancel |
| End & Clear | Terminar y Borrar | Exit dialog confirm |
| 1st Commandment | 1.º Mandamiento | Summary grouping |
| Precepts of the Church | Preceptos de la Iglesia | Summary grouping |

### Design rationale

- **Pattern:** `(localStorage.getItem('mf-prayer-lang') === 'es') ? spanishText : englishText`. Simple ternary, no abstraction layer. This is 20-25 insertion points in examination.js — manageable for direct inline localization. An abstraction layer (string table, i18n function) is over-engineering for a single module.
- **When Phase 2-4 arrive:** If the same strings appear in rosary.js/stations.js (e.g., "Done", "Back"), they'll use the same inline ternary. If string reuse becomes painful across 4+ modules, a lightweight string map in config.js can be introduced — but not preemptively.

### Test checklist
- [ ] Every string in the table above renders correctly in Spanish mode
- [ ] Every string in the table above renders correctly in English mode
- [ ] No English text "leaks" into the Spanish examination flow
- [ ] Plural handling: "1 anotado" (singular), "3 anotados" (plural)
- [ ] Days-ago label: "Hoy" / "Ayer" / "Hace 5 días"
- [ ] Exit dialog text adapts to current language

---

## Scope boundaries

### In scope
- `data/examination.json` — add `title_es`, `text_es` fields; convert how_to_confess steps to objects
- `src/examination.js` — wire `_t()` through all render paths; localize hardcoded strings
- `src/utils.js` — add `getPrayerText()` helper
- `src/settings.js` — add language picker
- `src/app.js` — wire `window.setSettingPrayerLang`

### Out of scope
- All other prayer modules (rosary.js, stations.js, chaplet.js, prayerbook.js, novena.js)
- All other data files (prayers.json, prayerbook.json)
- CSS changes (none needed — Spanish text fits existing responsive layouts)
- UI chrome localization (tab names, bottom nav, other modules)
- CCC catechism.json localization
- Bilingual reviewer recruitment (happens outside the code implementation)

### Future phases (separate specs)
- **Phase 2 (IDEA-098):** Rosary core prayers + mysteries → prayers.json `text_es` + rosary.js wiring
- **Phase 3 (IDEA-099):** Stations + Chaplet → prayers.json `text_es` + stations.js/chaplet.js wiring
- **Phase 4 (IDEA-100):** Prayerbook + optionally Novenas → prayerbook.json `text_es` + prayerbook.js wiring
- **Phase 5+ (not yet logged):** Polish (`text_pl`, 28 services) and Portuguese (`text_pt`, 10 services) — same pattern, no restructuring

---

## Estimated effort

| Group | Hours |
|-------|-------|
| I18N-01 + I18N-02 (infrastructure) | 0.5 |
| I18N-03 through I18N-09 (examination.js wiring) | 1.5 |
| I18N-10 through I18N-13 (examination.json data entry) | 1.0 |
| I18N-14 (pastoral note Q31) | 0.5 |
| I18N-15 (hardcoded strings) | 1.0 |
| Testing (both languages, fallback, dark mode, text sizes) | 0.5 |
| **Total** | **5.0** |

This is a single-session implementation for Claude Code. The Claude Code Prompt (`CLAUDE_CODE_PROMPT_I18N.md`) contains exact before/after code, line-by-line instructions, and the complete Spanish translation table for all 66 questions.
