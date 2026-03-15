# UX Spec: Prayer Content Localization — Maria's Language (I18N series)

**Created:** 2026-03-15
**Status:** Spec-ready
**Source:** Pastoral Advisor (Fr. Mike) handoff → Research (IDEA-096) → This spec
**Backlog items:** IDEA-096 (research, done), IDEA-097 (Phase 1), IDEA-098 (Phase 2), IDEA-099 (Phase 3), IDEA-100 (Phase 4)
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_I18N.md`
**Depends on:** Reader system (implemented), examination.js (implemented), settings.js (implemented), utils.js (implemented)

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| I18N-01 | `getPrayerText()` shared helper in utils.js | P0 | new |
| I18N-02 | Prayer Language picker in Settings | P0 | new |
| I18N-03 | Wire `_t()` shorthand into examination.js | P0 | new |
| I18N-04 | Localize opening prayer screen | P1 | new |
| I18N-05 | Localize commandment / precept section titles | P1 | new |
| I18N-06 | Localize all 66 question texts | P1 | new |
| I18N-07 | Localize prayers (Act of Contrition, Thanksgiving, Prayer Before) | P1 | new |
| I18N-08 | Localize How to Go to Confession (title + 6 steps) | P1 | new |
| I18N-09 | Localize confessional summary preamble | P1 | new |
| I18N-10 | Add `title_es` to commandments + precepts in examination.json | P1 | new |
| I18N-11 | Add `text_es` to all 66 questions in examination.json | P1 | new |
| I18N-12 | Add `text_es` / `title_es` to 3 prayers in examination.json | P1 | new |
| I18N-13 | Convert how_to_confess steps to objects, add `text_es` | P1 | new |
| I18N-14 | Localize pastoral note for Q31 (suicide) | P1 | new |
| I18N-15 | Localize all remaining hardcoded UI strings in examination.js | P2 | new |

---

## Context: Maria

Maria is 34 years old. She attends Spanish Mass at Our Lady of the Sacred Heart with her three kids every Sunday. She found this app through a friend at her parish and uses it to check Mass times. The Find tab works for her — she can see the "Misa en Español" note on her church's listing.

But last Lent, Maria wanted to prepare for confession. She opened the Examination of Conscience. Every question was in English. The prayer before confession, the Act of Contrition, the how-to steps — all English. Maria speaks English well enough for work and daily life, but prayer is different. Confession is different. You need to name your sins honestly, feel the weight of the words, let the Act of Contrition be a real cry of the heart. That doesn't happen in your second language.

Maria closed the module and prepared on her own.

The parish data tells us Maria is not alone: **32 services** carry `language: "es"` and **9 more** are bilingual `["en", "es"]`. These represent real families at real parishes. Their prayer life deserves the same support the English-speaking community already has.

**The pastoral advisor's directive:** This is not a feature request — it is a pastoral gap. The decision to add Spanish prayer content has been made. Research was asked only to determine *how*, not *whether*.

---

## Design Principles for This Feature

### 1. Prayer content only — not UI chrome

We are localizing the text that people read while they pray: questions they examine their conscience by, prayers they recite before the priest, the Act of Contrition they say with tears. We are NOT localizing button labels, navigation tabs, toast messages, or app infrastructure. The distinction matters because:

- Maria navigates the app in English already. She doesn't need "Buscar" instead of "Find."
- Localizing UI chrome would require touching every module. That's a different project.
- However, **strings that are part of the prayer experience** — even if they look like UI (e.g., "Begin Examination," "View Summary," navigation within the prayer tool) — should follow the prayer language setting. When Maria is in the Examination, she should be fully immersed.

The boundary: anything rendered inside the reader overlay for the Examination module follows the prayer language. Everything outside the reader stays English.

### 2. Silent English fallback

If a string doesn't have a Spanish translation, it falls back to English with no indicator. No "[EN]" badges, no "translation missing" warnings. A mix of languages in prayer is better than a broken experience. The `getPrayerText()` helper enforces this: `item.text_es || item.text`.

### 3. Liturgically approved texts for standard prayers

The Padre Nuestro, Ave María, Acto de Contrición, and other standard prayers have official translations approved by the USCCB and Vatican. We use those — never a fresh translation. The examination questions (catechetical content) do not have official translations and need a bilingual Catholic reviewer.

### 4. Data model: inline locale fields

Research (IDEA-096) evaluated three approaches and selected inline dual-language fields. The rationale is documented in the BACKLOG but bears repeating here because it drives every data decision in this spec:

**Why inline (`text` + `text_es` in same JSON) over parallel files (`examination-es.json`):**

- Content co-location prevents drift. When you edit a question's English text, the Spanish field is right there — you see it, you update it or flag it. With parallel files, you edit one and forget the other. This is the #1 cause of localization rot in small projects.
- Zero loader changes. The examination module already fetches `examination.json` once. No new fetch paths, no conditional loading, no language-detection-before-fetch complexity.
- Modest bloat. Examination goes from 14KB → ~22KB. Gzipped delta: ~3KB. For a cached PWA, this is nothing.
- Simple convention: if you touch `text`, check `text_es`. That's the entire maintenance rule.

**Why NOT key-value locale bundles (i18next pattern):**

- Over-engineered. Would require rewriting every prayer module to use message keys instead of inline text. 10+ hours of plumbing before any actual translation happens.
- The app has 3 data files with prayer content, not 300 UI screens. Industrial i18n tooling solves a problem we don't have.

### 5. Future languages: same pattern, no restructuring

Polish (28 services), Portuguese (10 services), and French (1 service) are the remaining non-English demographics. The inline pattern extends by adding `text_pl`, `text_pt` fields. The helper already handles it: `item['text_' + lang] || item.text`. No restructuring needed for 3-5 languages.

If the project ever serves 8+ languages (unlikely for a Western New England regional app), migration to separate files would be warranted. That bridge is years away.

---

## Data Model

### Current structure (examination.json)

```
examination.json
├── commandments: [ { number, title, ccc, questions: [ { id, text, ccc } ] } ]
├── precepts: { title, ccc, questions: [ { id, text, ccc } ] }
├── prayers: { prayer_before: { title, text }, act_of_contrition: { title, text }, thanksgiving: { title, text } }
└── how_to_confess: { title, steps: [ "string", "string", ... ] }
```

### Target structure (examination.json with locale fields)

```
examination.json
├── commandments: [ { number, title, title_es, ccc, questions: [ { id, text, text_es, ccc } ] } ]
├── precepts: { title, title_es, ccc, questions: [ { id, text, text_es, ccc } ] }
├── prayers: { prayer_before: { title, title_es, text, text_es }, ... }
└── how_to_confess: { title, title_es, steps: [ { text, text_es }, ... ] }
```

**Breaking change:** `how_to_confess.steps` changes from an array of strings to an array of objects. The JS code must handle both formats during the transition (backward-compatible guard: `typeof step === 'string'`).

### localStorage key

`mf-prayer-lang` — Values: absent or `'en'` (English default), `'es'` (Spanish). Follows existing `mf-` prefix convention. Persists across sessions. Cleared by "Clear All Data" in Settings (already covered by the `mf-*` wildcard clear). NOT cleared by "Clear Prayer Activity" — language preference is a display setting, not activity data.

---

## The Translation Corpus

### Translatable string inventory

| Category | Count | Source for Spanish |
|----------|-------|--------------------|
| Commandment titles (10) | 10 | Liturgically standardized (Catecismo de la Iglesia Católica) |
| Precepts title | 1 | Liturgically standardized |
| Examination questions | 66 | Needs bilingual Catholic reviewer |
| Prayer Before Confession (title + text) | 2 | Adapted from standard devotional texts |
| Act of Contrition (title + text) | 2 | USCCB-approved Baltimore Catechism equivalent |
| Thanksgiving After Confession (title + text) | 2 | Adapted from standard devotional texts |
| How to Confess title | 1 | Direct translation |
| How to Confess steps | 6 | Direct translation |
| **Total data strings** | **90** | |
| Hardcoded UI strings inside examination.js | ~25 | Direct translation |
| **Grand total** | **~115** | |

### Source authority for standard prayers

The Act of Contrition in the app is the Baltimore Catechism version ("O my God, I am heartily sorry for having offended Thee..."). The Spanish equivalent is the traditional "Dios mío, me arrepiento de todo corazón de haberte ofendido..." form, widely used in U.S. Spanish-language parishes and consistent with USCCB catechetical materials.

The Prayer Before Confession and Thanksgiving After Confession are devotional (not liturgical) prayers. Their Spanish translations are straightforward devotional translations, not requiring Vatican approval.

The Commandment titles use the traditional Spanish catechetical formulations from the Catecismo de la Iglesia Católica.

### Reviewer requirement

The 66 examination questions are catechetical content that touches sensitive moral territory — sexuality (Q26-30), suicide (Q31), substance abuse (Q23), family duties (Q15-18). Machine translation is not appropriate. A bilingual Catholic familiar with the theological vocabulary should review the translations before release. Ideal reviewer: a Spanish-speaking catechist, deacon, or priest from one of the parishes with Spanish Mass services.

The translations provided in this spec are a strong starting point written with theological precision, but they should be reviewed by a native speaker before going live.

---

## ITEM 1: Shared Infrastructure

These items establish the foundation that all four phases will reuse. They must be implemented first.

---

### I18N-01: `getPrayerText()` Shared Helper

**Priority:** P0 (prerequisite for everything)
**File:** `src/utils.js`

#### What

A single helper function that reads the user's prayer language preference from localStorage and returns the localized string with silent English fallback. Every prayer module will call this function instead of accessing `.text` directly.

#### Implementation

Add to `src/utils.js` before the `module.exports` block:

```javascript
// ── Prayer content localization helper ──
// Returns localized text for a given field, with silent English fallback.
// Usage: getPrayerText(item, 'text') → returns item.text_es if lang=es, else item.text
// Usage: getPrayerText(item, 'title') → returns item.title_es if lang=es, else item.title
function getPrayerText(item, field) {
  if (!item) return '';
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  if (lang && lang !== 'en') {
    var localized = item[field + '_' + lang];
    if (localized) return localized;
  }
  return item[field] || '';
}
```

Add `getPrayerText: getPrayerText` to the `module.exports` object.

#### Design rationale

- **try/catch around localStorage:** Private browsing on old iOS can throw. The helper must never crash.
- **Empty string default:** If `item` is null or the field doesn't exist, return `''` rather than `undefined`. Prevents `_esc(undefined)` producing "undefined" in the DOM.
- **Field-name concatenation:** `item[field + '_' + lang]` means the same helper works for `text`, `title`, or any future field. No separate functions needed.
- **Why not a module-level cached lang variable?** Because the user can change language in Settings while the Examination is open. Reading localStorage on each call ensures immediate response. The performance cost is negligible — localStorage reads are synchronous and fast, and examination renders are infrequent (user taps, not animation loops).

#### Test checklist

- [ ] `getPrayerText({ text: 'hello', text_es: 'hola' }, 'text')` returns `'hola'` when `mf-prayer-lang` is `'es'`
- [ ] Same call returns `'hello'` when `mf-prayer-lang` is absent
- [ ] Same call returns `'hello'` when `mf-prayer-lang` is `'en'`
- [ ] `getPrayerText({ text: 'hello' }, 'text')` returns `'hello'` when `mf-prayer-lang` is `'es'` (fallback — no `text_es` field)
- [ ] `getPrayerText(null, 'text')` returns `''`
- [ ] `getPrayerText({ title: 'Act of Contrition', title_es: 'Acto de Contrición' }, 'title')` returns localized title

---

### I18N-02: Prayer Language Picker in Settings

**Priority:** P0 (prerequisite for user access)
**File:** `src/settings.js`, `src/app.js`

#### What

A segmented control in the Prayer section of Settings allowing the user to switch between English and Español. Follows the identical UX pattern as the existing Theme (Light/Dark) and Rosary Mystery (Auto/Manual) controls.

#### User story

- **Maria:** Opens Settings to adjust text size (she already knows where it is). Sees "Prayer Language" with English/Español. Taps Español. Closes Settings. Opens Examination of Conscience. Everything is in Spanish. She doesn't need to be told it worked — the prayers are in her language.
- **English-only user:** Never touches the setting. Default is English. Zero impact on their experience.
- **Bilingual user:** Can switch back and forth freely. The setting takes effect immediately on the next render.

#### Before

The Prayer group in Settings currently contains:
1. Rosary Mystery (Auto / Manual)
2. Confession Date Tracking (toggle)

#### After

The Prayer group becomes:
1. **Prayer Language (English / Español)** ← new, first position
2. Rosary Mystery (Auto / Manual)
3. Confession Date Tracking (toggle)

Prayer Language is first because it's the broadest-impact setting — it affects every prayer module, while Rosary Mystery only affects one.

#### Implementation

In `src/settings.js`, `_render()` function:

1. Add `var prayerLang = localStorage.getItem('mf-prayer-lang') || 'en';` alongside existing localStorage reads.

2. Insert the language picker HTML after `'<div class="settings-group-title">Prayer</div>'` and before the Rosary Mystery row:

```javascript
    + '<div class="settings-row">'
    + '<span class="settings-label">Prayer Language</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn' + (prayerLang === 'en' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'en\')">English</button>'
    + '<button class="settings-seg-btn' + (prayerLang === 'es' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'es\')">Español</button>'
    + '</div></div>'
```

3. Add the handler function:

```javascript
function setSettingPrayerLang(lang) {
  localStorage.setItem('mf-prayer-lang', lang);
  _render();
}
```

4. Export `setSettingPrayerLang` and wire `window.setSettingPrayerLang` in `app.js`.

#### Design rationale

- **Segmented control, not dropdown:** Matches existing Settings patterns. Only 2 options (for now). When Polish/Portuguese are added, this becomes a 3-4 option segmented control or transitions to a dropdown at that point.
- **"Español" not "Spanish":** The label for a language should be in that language. A Spanish speaker scanning Settings will recognize "Español" instantly. This is standard practice (iOS, Android, Chrome all do this).
- **No confirmation, no reload:** Changing the setting re-renders the Settings panel immediately (visual feedback via the active button state). The next time the user opens a prayer module, it renders in the new language. No reload required because prayer modules fetch and render fresh each time they open.
- **No "System" or "Auto" option:** The app's user base is regional. We don't have system-level language detection logic, and inferring language from Mass attendance would be creepy. Explicit choice is respectful and simple.

#### Test checklist

- [ ] Settings → Prayer group → "Prayer Language" row visible, first in group
- [ ] Default selection: "English" active
- [ ] Tap "Español" → button activates, "English" deactivates
- [ ] Close and reopen Settings → "Español" still active (persists)
- [ ] "Clear All Data" → reopen Settings → "English" is active (reset)
- [ ] "Clear Prayer Activity" → reopen Settings → language preference unchanged (not cleared)

---

## ITEM 2: Examination of Conscience Localization

These items wire the `getPrayerText()` helper into every text render point in `src/examination.js`. The examination has two render paths — the **section-by-section flow** (primary, used since PTR-03) and the **legacy full render** (fallback). Both must be localized.

---

### I18N-03: Wire `_t()` Shorthand

**Priority:** P0 (prerequisite for I18N-04 through I18N-15)
**File:** `src/examination.js`

`src/examination.js` already requires `utils.js` (line ~73). Add a local shorthand immediately after the existing `_esc` and `_stripRefs` declarations:

```javascript
function _t(item, field) { return utils.getPrayerText(item, field); }
```

This keeps the render code readable. `_esc(_t(section, 'title'))` reads as "escape the translated title."

---

### I18N-04: Localize Opening Prayer Screen

**File:** `src/examination.js`, reader module `render` function

#### Before

```javascript
+ '<p class="exam-opening-text">' + _esc(d.prayers.prayer_before.text) + '</p>'
+ '<button class="exam-opening-btn" onclick="window._examBeginReview()">Begin Examination</button>'
```

#### After

```javascript
+ '<p class="exam-opening-text">' + _esc(_t(d.prayers.prayer_before, 'text')) + '</p>'
+ '<button class="exam-opening-btn" onclick="window._examBeginReview()">'
+ ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Comenzar Examen' : 'Begin Examination') + '</button>'
```

#### Design rationale

The opening prayer is the first thing Maria sees. If this is in English, she'll assume the whole module is English and close it. The button text "Comenzar Examen" follows the pattern — everything inside the reader overlay follows the prayer language.

---

### I18N-05: Localize Commandment / Precept Section Titles

**File:** `src/examination.js`

#### What

All 10 commandment titles and the precepts title rendered in both the section-by-section flow (`_renderCurrentSection`) and the legacy full render (`_renderSection`) must use `_t(section, 'title')` instead of `section.title`.

#### Render points to change (6 locations)

1. `_renderCurrentSection()` → `exam-section-title` div: `_esc(section.title)` → `_esc(_t(section, 'title'))`
2. `_renderCurrentSection()` → `cmdTitle` variable: `section.title` → `_t(section, 'title')`
3. `_renderSection()` → `exam-row-title` span: `_esc(section.title)` → `_esc(_t(section, 'title'))`
4. `_renderSection()` → `cmdTitle` variable: `section.title` → `_t(section, 'title')`

#### Important: `cmdTitle` feeds the confessional summary

The `cmdTitle` string is stored in `data-cmd` attribute on each checkbox. When a question is checked, `_checked[qid].commandment` receives this value. The `_shortCmdLabel()` function then processes it for the summary display. Since `cmdTitle` will now contain Spanish text when the language is Spanish, `_shortCmdLabel` must also handle Spanish input:

```javascript
function _shortCmdLabel(full) {
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var m = full.match(/^(\d+)\./);
  if (!m) {
    if (full.indexOf('Precepts') >= 0 || full.indexOf('Preceptos') >= 0) {
      return (lang === 'es') ? 'Preceptos de la Iglesia' : 'Precepts of the Church';
    }
    return full;
  }
  var n = parseInt(m[1], 10);
  if (lang === 'es') {
    return n + '.\u00BA Mandamiento';
  }
  var suf = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return n + suf + ' Commandment';
}
```

Also update `_toActionFormat()` to strip Spanish question prefixes:

```javascript
function _toActionFormat(text) {
  var s = text
    .replace(/^¿/, '')
    .replace(/^(Have I|Did I|Do I|Have you|Did you|Am I|Was I|He)\s+/i, '')
    .replace(/\?$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

#### Test checklist

- [ ] In Español mode: "1. Yo soy el Señor tu Dios..." renders as section title
- [ ] Summary groups show "1.º Mandamiento", "Preceptos de la Iglesia"
- [ ] Summary action items strip "¿He " prefix correctly
- [ ] In English mode: all titles unchanged from current behavior

---

### I18N-06: Localize All 66 Question Texts

**File:** `src/examination.js`

#### What

Two render points — one in `_renderCurrentSection()` (section-by-section flow), one in `_renderSection()` (legacy full render) — both render `q.text`. Both change to `_t(q, 'text')`.

#### Before (both locations)

```javascript
html += '<div class="exam-q-text">' + _esc(q.text) + '</div>';
```

#### After (both locations)

```javascript
html += '<div class="exam-q-text">' + _esc(_t(q, 'text')) + '</div>';
```

#### Note on the summary path

The confessional summary reads checked question text from the DOM (`qEl.querySelector('.exam-q-text').textContent`), not from the data object. Since the DOM already contains the localized text after this change, the summary will automatically display questions in whatever language they were rendered in. No additional change needed for `_checked[qid].text` storage.

---

### I18N-07: Localize Prayers

**File:** `src/examination.js`

#### What

Three prayers (Prayer Before Confession, Act of Contrition, Thanksgiving) are rendered in multiple places. All `prayer.title` and `prayer.text` references change to `_t(prayer, 'title')` and `_t(prayer, 'text')`.

#### Render points (8 locations)

| Function | Field | Line context |
|----------|-------|------|
| `_renderPrayer()` | `prayer.title` | `.exam-prayer-title` span |
| `_renderPrayer()` | `prayer.text` | `.exam-prayer-text` paragraphs (var assignment) |
| `_renderExamination()` | `d.prayers.act_of_contrition.title` | `.exam-contrition-title` div |
| `_renderExamination()` | `d.prayers.act_of_contrition.text` | `.exam-contrition-text` split |
| `_renderExamination()` | `d.prayers.thanksgiving.title` | `.exam-contrition-title` div |
| `_renderExamination()` | `d.prayers.thanksgiving.text` | `.exam-contrition-text` split |
| `_renderSummaryScreen()` | `d.prayers.act_of_contrition.title` + `.text` | Same as above |
| `_renderSummaryScreen()` | `d.prayers.thanksgiving.title` + `.text` | Same as above |

All follow the same pattern: `.title` → `_t(obj, 'title')`, `.text` → `_t(obj, 'text')`.

#### Test checklist

- [ ] Opening prayer screen: Spanish prayer text in Español mode
- [ ] Summary screen: Act of Contrition in Spanish ("Dios mío, me arrepiento de todo corazón...")
- [ ] Summary screen: Thanksgiving in Spanish
- [ ] English mode: all prayers unchanged

---

### I18N-08: Localize How to Go to Confession

**File:** `src/examination.js`

#### What

The how-to-confess section has a title and 6 steps. The title localizes via `_t()`. The steps require a structural change because they are currently plain strings, not objects.

#### Breaking change: steps become objects

See I18N-13 (data change). The JS code must handle both the old format (plain strings) and the new format (objects with `text`/`text_es`):

```javascript
howTo.steps.forEach(function(step) {
  var stepText = (typeof step === 'string') ? step : _t(step, 'text');
  html += '<li>' + _esc(stepText) + '</li>';
});
```

This guard means old cached data (plain strings) still works, and new data (objects) gets localized. Two locations: `_renderHowTo()` and `examShowHowTo()`.

The title in both locations changes from `_esc(howTo.title)` to `_esc(_t(howTo, 'title'))`.

---

### I18N-09: Localize Confessional Summary Preamble

**File:** `src/examination.js`, `_renderSummaryHTML()`

#### What

The confessional format preamble is the text Maria would actually say to the priest. It must be in her language.

#### Before

```javascript
html += '<p>Bless me, Father, for I have sinned.';
// ...
html += '<p>These are my sins:</p>';
```

#### After

```javascript
var lang = '';
try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
var isEs = (lang === 'es');
var blessMeText = isEs ? 'Bendígame, Padre, porque he pecado.' : 'Bless me, Father, for I have sinned.';
// ... (days-since logic with Spanish number formatting)
var theseSinsText = isEs ? 'Estos son mis pecados:' : 'These are my sins:';
```

#### Design rationale

This is arguably the most important localization in the entire module. Maria will be in the confessional, phone in hand, reading these words aloud to the priest. "Bendígame, Padre, porque he pecado" — those are the words she learned as a child. They must be right.

---

### I18N-14: Localize Pastoral Note for Q31

**File:** `src/examination.js`, `_pastoralNoteHTML()`

#### What

Q31 ("Have I contemplated or attempted suicide?") triggers a pastoral note with the 988 crisis line and CCC §2283 quote. This note must be in the user's prayer language.

#### Design rationale

A person in crisis reading an examination of conscience in Spanish should see the help message in Spanish. The 988 Suicide & Crisis Lifeline supports Spanish-language callers. The CCC §2283 quote ("No debemos desesperar de la salvación eterna...") is from the official Spanish Catechism.

#### Implementation

The function checks `mf-prayer-lang` and returns the appropriate HTML. The 988 link stays the same — it's a phone number, language-agnostic. The CCC citation stays "CCC §2283" — paragraph numbers are universal.

---

### I18N-15: Localize Remaining Hardcoded UI Strings

**File:** `src/examination.js`

#### What

~25 strings that are part of the prayer experience but are currently hardcoded in JavaScript. These include navigation labels, status messages, the exit confirmation dialog, and the closing blessing.

#### Complete string inventory

| Location | English | Spanish |
|----------|---------|---------|
| Reader title | Examination of Conscience | Examen de Conciencia |
| Opening button | Begin Examination | Comenzar Examen |
| Nav: Previous | ← Previous | ← Anterior |
| Nav: Next | Next → | Siguiente → |
| Nav: View Summary | View Summary → | Ver Resumen → |
| Nav: item count (singular) | 1 item noted | 1 anotado |
| Nav: item count (plural) | 3 items noted | 3 anotados |
| Nav: no items | No items noted | Sin anotaciones |
| Summary header | Summary for Confession | Resumen para la Confesión |
| Summary privacy | This list exists only during this session. Nothing is saved. | Esta lista existe solo durante esta sesión. No se guarda nada. |
| Summary empty state | No items selected yet. Check items above as you examine your conscience. | No hay elementos seleccionados. Marca los elementos mientras examinas tu conciencia. |
| Toast: first check | Noted for your confession summary | Anotado para tu resumen de confesión |
| Tracker label | Last Confession: | Última Confesión: |
| Tracker: Today | Today | Hoy |
| Tracker: Yesterday | Yesterday | Ayer |
| Tracker: X days ago | X days ago | Hace X días |
| Tracker button | I went to confession today | Fui a confesarme hoy |
| Find button | Find Confession Near Me | Encontrar Confesión Cerca |
| Closing text | Go in peace to love and serve the Lord. | Ve en paz para amar y servir al Señor. |
| Exit title | End Examination? | ¿Terminar Examen? |
| Exit message | Your X noted items will be cleared... | Tus X anotaciones se borrarán... |
| Exit: continue | Continue Examining | Continuar Examinando |
| Exit: confirm | End & Clear | Terminar y Borrar |
| Summary footer: Back | ← Back | ← Volver |
| Summary footer: Done | Done | Listo |
| Commandment label | Xth Commandment | X.º Mandamiento |
| Precepts label | Precepts of the Church | Preceptos de la Iglesia |

#### Implementation pattern

All use inline ternary based on `localStorage.getItem('mf-prayer-lang') === 'es'`. For functions with multiple strings, read the preference once into a local `_l` variable at the top of the function to avoid repeated localStorage reads within a single render.

---

## ITEM 3: examination.json Data Changes

These items modify the data file. They add `title_es` and `text_es` fields alongside existing English content.

---

### I18N-10: Commandment and Precept Titles in Spanish

**File:** `data/examination.json`

The Ten Commandments in Spanish follow the standard catechetical formulation from the Catecismo de la Iglesia Católica:

| # | English `title` | Spanish `title_es` |
|---|---|---|
| 1 | I am the Lord your God; you shall not have strange gods before Me. | Yo soy el Señor tu Dios; no tendrás otros dioses fuera de Mí. |
| 2 | You shall not take the name of the Lord your God in vain. | No tomarás el nombre del Señor tu Dios en vano. |
| 3 | Remember to keep holy the Lord's Day. | Santificarás las fiestas. |
| 4 | Honor your father and your mother. | Honrarás a tu padre y a tu madre. |
| 5 | You shall not kill. | No matarás. |
| 6 | You shall not commit adultery. | No cometerás actos impuros. |
| 7 | You shall not steal. | No robarás. |
| 8 | You shall not bear false witness against your neighbor. | No dirás falso testimonio ni mentirás. |
| 9 | You shall not covet your neighbor's wife. | No consentirás pensamientos ni deseos impuros. |
| 10 | You shall not covet your neighbor's goods. | No codiciarás los bienes ajenos. |
| P | Precepts of the Church | Preceptos de la Iglesia |

---

### I18N-11: All 66 Examination Questions in Spanish

**File:** `data/examination.json`

The complete translation table is provided in the Claude Code prompt (`CLAUDE_CODE_PROMPT_I18N.md`, step 28). All 66 questions have `text_es` values. These translations use standard theological vocabulary (pecado mortal, pecado venial, sacramento, examen de conciencia) and follow established Spanish catechetical phrasing.

**Reviewer note:** These translations should be reviewed by a native Spanish-speaking Catholic before release. See the "Reviewer requirement" section above.

---

### I18N-12: Prayer Texts in Spanish

**File:** `data/examination.json`

Three prayers receive `title_es` and `text_es` fields. The Act of Contrition uses the traditional Spanish formulation consistent with USCCB catechetical materials. Full texts are provided in the Claude Code prompt (step 29).

---

### I18N-13: How to Confess Steps — Structure Change

**File:** `data/examination.json`

#### Before

```json
"steps": [
  "Examine your conscience using the questions in each section of this module.",
  "Enter the confessional and make the Sign of the Cross..."
]
```

#### After

```json
"steps": [
  {
    "text": "Examine your conscience using the questions in each section of this module.",
    "text_es": "Examina tu conciencia usando las preguntas en cada sección de este módulo."
  },
  {
    "text": "Enter the confessional and make the Sign of the Cross...",
    "text_es": "Entra al confesionario y haz la Señal de la Cruz..."
  }
]
```

Full step translations are in the Claude Code prompt (step 30).

---

## Cascading Impact Analysis

| Module | Impact | Action |
|--------|--------|--------|
| `src/examination.js` | Primary target | Modified extensively |
| `src/settings.js` | New language picker | Modified (3 additions) |
| `src/utils.js` | New helper function | Modified (1 addition) |
| `src/app.js` | New window binding | Modified (1 line) |
| `data/examination.json` | New locale fields | Modified extensively |
| `css/app.css` | None | No changes needed |
| `src/rosary.js` | None (Phase 2) | Do not modify |
| `src/stations.js` | None (Phase 3) | Do not modify |
| `src/chaplet.js` | None (Phase 3) | Do not modify |
| `src/prayerbook.js` | None (Phase 4) | Do not modify |
| `data/prayers.json` | None (Phase 2-3) | Do not modify |
| `data/prayerbook.json` | None (Phase 4) | Do not modify |
| `src/devotions.js` | Confession guide content stays English | Do not modify |
| `src/reader.js` | Reader infrastructure unchanged | Do not modify |
| `src/refs.js` | CCC references stay English | Do not modify |
| Build scripts | No impact | Do not modify |
| Service worker | Cache key unaffected (same files) | Do not modify |

---

## Implementation Order

1. **I18N-01** — `getPrayerText()` helper (foundation)
2. **I18N-02** — Settings language picker (user access)
3. **I18N-03** — Wire `_t()` shorthand (prerequisite for all render changes)
4. **I18N-10 through I18N-13** — Data changes to examination.json (translations must exist before render code reads them)
5. **I18N-04 through I18N-09** — Core render path localization
6. **I18N-14** — Pastoral note for Q31
7. **I18N-15** — Remaining UI strings

Items 4-7 can be done in any order after 1-3, but the above sequence minimizes partial-state risk.

---

## Future Phases (out of scope for this spec)

| Phase | Scope | Estimated effort | Spec |
|-------|-------|-----------------|------|
| 2 | Rosary core prayers + 20 mysteries | 3-4 hrs | Future spec |
| 3 | Stations of the Cross + Chaplet | 3-4 hrs | Future spec |
| 4 | Prayerbook + optionally Novenas | 3-8 hrs | Future spec |

Each future phase reuses `getPrayerText()`, the `mf-prayer-lang` key, and the Settings picker established in Phase 1. When Phase 2 ships, Polish and Portuguese could also be added to the Settings picker (adding buttons to the segmented control and locale fields to the data).

---

## Summary

90 strings in examination.json get Spanish translations. ~25 hardcoded strings in examination.js get localized inline. One shared helper function enables the entire pattern. One Settings control gives the user access. Zero CSS changes. Zero build changes. Zero impact on other prayer modules.

The result: Maria opens the Examination of Conscience, and for the first time, the words on her screen are the words of her heart.
