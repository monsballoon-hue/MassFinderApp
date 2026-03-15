# Claude Code Prompt — I18N (Prayer Content Localization Phase 1)

**Spec:** `docs/plans/UX_Spec_Prayer_Localization.md`
**Scope:** `data/examination.json`, `src/examination.js`, `src/settings.js`, `src/utils.js`, `src/app.js`
**Do NOT modify:** `src/rosary.js`, `src/stations.js`, `src/chaplet.js`, `src/prayerbook.js`, `data/prayers.json`, `data/prayerbook.json`, `css/app.css`, build scripts, or modules not listed above

**Read the full spec first:** `docs/plans/UX_Spec_Prayer_Localization.md`

---

## Context

32 Spanish-language Mass services and 9 bilingual (en/es) services exist in the parish data. Spanish-speaking Catholics can find Mass times but every prayer tool is English-only. The Examination of Conscience is the highest pastoral priority — an examination in a second language creates distance at the moment you need closeness to God before confession.

This spec adds Spanish language support to the Examination of Conscience **only**. Rosary, Stations, Chaplet, and Prayerbook are future phases. The data model established here (inline `text_es` fields + shared helper) will be reused by all subsequent phases.

**What is NOT being localized:** UI chrome (buttons, labels, navigation, toasts), parish data, section headers generated in JS. Only the prayer content that people read while they pray.

---

## Implementation instructions

### Group 1: Shared infrastructure (do first)

**I18N-01 — `getPrayerText()` helper in utils.js**

1. In `src/utils.js`, add the following function before the `module.exports` block:

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

2. Add `getPrayerText` to the `module.exports` object in `src/utils.js`:

```javascript
getPrayerText: getPrayerText
```

**I18N-02 — Language picker in settings.js**

3. In `src/settings.js`, inside the `_render()` function, find the Prayer settings group. It currently starts with:

```javascript
  // ── Prayer ──
  html += '<div class="settings-group">'
    + '<div class="settings-group-title">Prayer</div>'
    + '<div class="settings-row">'
    + '<span class="settings-label">Rosary Mystery</span>'
```

Insert the language picker **before** the Rosary Mystery row, so it becomes the first item in the Prayer group. Add this right after `'<div class="settings-group-title">Prayer</div>'`:

```javascript
    + '<div class="settings-row">'
    + '<span class="settings-label">Prayer Language</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn' + (prayerLang === 'en' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'en\')">English</button>'
    + '<button class="settings-seg-btn' + (prayerLang === 'es' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'es\')">Español</button>'
    + '</div></div>'
```

4. At the top of the `_render()` function, alongside the existing localStorage reads (after `var confTracking = ...`), add:

```javascript
  var prayerLang = localStorage.getItem('mf-prayer-lang') || 'en';
```

5. Add the `setSettingPrayerLang` function to `src/settings.js` (after `toggleSettingConf`):

```javascript
function setSettingPrayerLang(lang) {
  localStorage.setItem('mf-prayer-lang', lang);
  _render();
}
```

6. Add `setSettingPrayerLang` to the `module.exports` object in `src/settings.js`:

```javascript
setSettingPrayerLang: setSettingPrayerLang
```

7. In `src/app.js`, find the block of `window.setSettingRosary = settings.setSettingRosary;` lines (~line 296) and add:

```javascript
window.setSettingPrayerLang = settings.setSettingPrayerLang;
```

### Group 2: examination.js localization (do all)

**I18N-03 — Wire getPrayerText into examination.js**

8. At the top of `src/examination.js`, alongside the existing requires, add:

```javascript
var utils = require('./utils.js');
```

Wait — `utils` is already required (line ~73: `var utils = require('./utils.js');`). That's fine. The `getPrayerText` function will be available via `utils.getPrayerText`.

Create a local shorthand after the existing `_esc` and `_stripRefs` declarations:

```javascript
function _t(item, field) { return utils.getPrayerText(item, field); }
```

**I18N-04 — Localize the opening prayer screen**

9. In `src/examination.js`, find the opening prayer render inside the `render` function (~line 48). The current code is:

```javascript
      + '<p class="exam-opening-text">' + _esc(d.prayers.prayer_before.text) + '</p>'
```

Replace with:

```javascript
      + '<p class="exam-opening-text">' + _esc(_t(d.prayers.prayer_before, 'text')) + '</p>'
```

**I18N-05 — Localize section hero titles**

10. In `src/examination.js`, find `_renderCurrentSection()`. The section title render (~line in the section hero block) currently reads:

```javascript
  html += '<div class="exam-section-title">' + _esc(section.title) + '</div>';
```

Replace with:

```javascript
  html += '<div class="exam-section-title">' + _esc(_t(section, 'title')) + '</div>';
```

11. The `cmdTitle` variable used for data attributes in the same function currently reads:

```javascript
  var cmdTitle = section.number ? section.number + '. ' + section.title : section.title;
```

Replace with:

```javascript
  var cmdTitle = section.number ? section.number + '. ' + _t(section, 'title') : _t(section, 'title');
```

**I18N-06 — Localize question text**

12. In `_renderCurrentSection()`, inside the `section.questions.forEach` loop, the question text render currently reads:

```javascript
    html += '<div class="exam-q-text">' + _esc(q.text) + '</div>';
```

Replace with:

```javascript
    html += '<div class="exam-q-text">' + _esc(_t(q, 'text')) + '</div>';
```

13. Apply the same change in the `_renderSection()` function (the legacy full-render path, also has a `section.questions.forEach` loop):

Find:
```javascript
    html += '<div class="exam-q-text">' + _esc(q.text) + '</div>';
```

Replace with:
```javascript
    html += '<div class="exam-q-text">' + _esc(_t(q, 'text')) + '</div>';
```

14. In `_renderSection()`, the section title render currently reads:

```javascript
  html += '<span class="exam-row-title">' + _esc(section.title) + '</span>';
```

Replace with:

```javascript
  html += '<span class="exam-row-title">' + _esc(_t(section, 'title')) + '</span>';
```

15. Also in `_renderSection()`, the `cmdTitle` variable:

```javascript
  var cmdTitle = section.number
    ? section.number + '. ' + section.title
    : section.title;
```

Replace with:

```javascript
  var cmdTitle = section.number
    ? section.number + '. ' + _t(section, 'title')
    : _t(section, 'title');
```

**I18N-07 — Localize prayers (Act of Contrition, Thanksgiving, Prayer Before)**

16. In `_renderPrayer()`, the prayer title and text currently read:

```javascript
  html += '<span class="exam-prayer-title">' + _esc(prayer.title) + '</span>';
  // ...
  paragraphs.forEach(function(p) {
    html += '<p class="exam-prayer-text">' + _esc(p.trim()) + '</p>';
  });
```

Replace the title line:
```javascript
  html += '<span class="exam-prayer-title">' + _esc(_t(prayer, 'title')) + '</span>';
```

Replace the paragraphs block:
```javascript
  var prayerText = _t(prayer, 'text');
  var paragraphs = prayerText.split('\n\n');
  // ...
  paragraphs.forEach(function(p) {
    html += '<p class="exam-prayer-text">' + _esc(p.trim()) + '</p>';
  });
```

17. In `_renderSummaryScreen()`, the Act of Contrition render currently reads:

```javascript
    html += '<div class="exam-contrition-title">' + _esc(d.prayers.act_of_contrition.title) + '</div>';
    d.prayers.act_of_contrition.text.split('\n\n').forEach(function(p) {
      html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
    });
```

Replace with:

```javascript
    html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.act_of_contrition, 'title')) + '</div>';
    _t(d.prayers.act_of_contrition, 'text').split('\n\n').forEach(function(p) {
      html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
    });
```

18. Apply the same pattern to the Thanksgiving prayer in `_renderSummaryScreen()`:

```javascript
    html += '<div class="exam-contrition-title">' + _esc(d.prayers.thanksgiving.title) + '</div>';
    d.prayers.thanksgiving.text.split('\n\n').forEach(function(p) {
```

Replace with:

```javascript
    html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.thanksgiving, 'title')) + '</div>';
    _t(d.prayers.thanksgiving, 'text').split('\n\n').forEach(function(p) {
```

19. Also in `_renderExamination()` (the legacy full render), apply the same changes to the Act of Contrition and Thanksgiving blocks. Find:

```javascript
    html += '<div class="exam-contrition-title">' + _esc(d.prayers.act_of_contrition.title) + '</div>';
```

and the Thanksgiving block. Apply the same `_t()` pattern as steps 17-18.

**I18N-08 — Localize How to Confess**

20. In `_renderHowTo()`, the title currently reads:

```javascript
  html += '<span class="exam-howto-label">' + _esc(howTo.title) + '</span>';
```

Replace with:

```javascript
  html += '<span class="exam-howto-label">' + _esc(_t(howTo, 'title')) + '</span>';
```

21. The steps loop currently reads:

```javascript
  howTo.steps.forEach(function(step) {
    html += '<li>' + _esc(step) + '</li>';
  });
```

The steps are plain strings, not objects with a `text` field. To localize them, the data structure needs to change. Replace:

```javascript
  howTo.steps.forEach(function(step, i) {
    var stepText = (typeof step === 'string') ? step : _t(step, 'text');
    html += '<li>' + _esc(stepText) + '</li>';
  });
```

**Important:** This means the how_to_confess steps must be converted from plain strings to objects in the JSON (see I18N-09 below).

22. Apply the same pattern in `examShowHowTo()` where the modal renders steps:

```javascript
  d.how_to_confess.steps.forEach(function(step) {
    stepsHtml += '<li>' + _esc(step) + '</li>';
  });
```

Replace with:

```javascript
  d.how_to_confess.steps.forEach(function(step) {
    var stepText = (typeof step === 'string') ? step : _t(step, 'text');
    stepsHtml += '<li>' + _esc(stepText) + '</li>';
  });
```

23. Also in `examShowHowTo()`, the title:

```javascript
    + '<span style="...">' + _esc(d.how_to_confess.title) + '</span>'
```

Replace with:

```javascript
    + '<span style="...">' + _esc(_t(d.how_to_confess, 'title')) + '</span>'
```

**I18N-09 — Localize confessional summary preamble**

24. In `_renderSummaryHTML()`, the preamble currently hardcodes English text:

```javascript
  html += '<p>Bless me, Father, for I have sinned.';
  // ...
  html += '<p>These are my sins:</p>';
```

Replace with a localized version:

```javascript
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var blessMeText = (lang === 'es') ? 'Bendígame, Padre, porque he pecado.' : 'Bless me, Father, for I have sinned.';
  var sinceText = (lang === 'es')
    ? ' Han pasado ' + (daysSince === 0 ? 'menos de un día' : daysSince + ' día' + (daysSince !== 1 ? 's' : '')) + ' desde mi última confesión.'
    : ' It has been ' + (daysSince === 0 ? 'less than a day' : daysSince + ' day' + (daysSince !== 1 ? 's' : '')) + ' since my last confession.';
  var theseSinsText = (lang === 'es') ? 'Estos son mis pecados:' : 'These are my sins:';

  html += '<p>' + blessMeText;
  if (daysSince !== null) {
    html += sinceText;
  }
  html += '</p>';
  html += '<p>' + theseSinsText + '</p>';
```

25. In the same function, `_shortCmdLabel()` generates English labels ("1st Commandment", "Precepts of the Church"). Add localization:

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

### Group 3: examination.json data changes (do all)

**I18N-10 — Add `title_es` fields to commandments**

26. In `data/examination.json`, add a `title_es` field to each commandment object. The Ten Commandments in Spanish are liturgically standardized:

```json
{ "number": 1, "title": "I am the Lord your God; you shall not have strange gods before Me.", "title_es": "Yo soy el Señor tu Dios; no tendrás otros dioses fuera de Mí.", "ccc": "2084-2141", ... }
{ "number": 2, "title": "You shall not take the name of the Lord your God in vain.", "title_es": "No tomarás el nombre del Señor tu Dios en vano.", "ccc": "2142-2167", ... }
{ "number": 3, "title": "Remember to keep holy the Lord's Day.", "title_es": "Santificarás las fiestas.", "ccc": "2168-2195", ... }
{ "number": 4, "title": "Honor your father and your mother.", "title_es": "Honrarás a tu padre y a tu madre.", "ccc": "2196-2257", ... }
{ "number": 5, "title": "You shall not kill.", "title_es": "No matarás.", "ccc": "2258-2330", ... }
{ "number": 6, "title": "You shall not commit adultery.", "title_es": "No cometerás actos impuros.", "ccc": "2331-2400", ... }
{ "number": 7, "title": "You shall not steal.", "title_es": "No robarás.", "ccc": "2401-2463", ... }
{ "number": 8, "title": "You shall not bear false witness against your neighbor.", "title_es": "No dirás falso testimonio ni mentirás.", "ccc": "2464-2513", ... }
{ "number": 9, "title": "You shall not covet your neighbor's wife.", "title_es": "No consentirás pensamientos ni deseos impuros.", "ccc": "2514-2533", ... }
{ "number": 10, "title": "You shall not covet your neighbor's goods.", "title_es": "No codiciarás los bienes ajenos.", "ccc": "2534-2557", ... }
```

27. Add `title_es` to the precepts object:

```json
{ "title": "Precepts of the Church", "title_es": "Preceptos de la Iglesia", "ccc": "2041-2043", ... }
```

**I18N-11 — Add `text_es` fields to all 66 questions**

28. Add a `text_es` field to every question object in `data/examination.json`. Below is the complete mapping. Apply each `text_es` to the question with the matching `id`.

**1st Commandment questions:**

| id | text_es |
|----|---------|
| 1 | ¿He dudado o negado las enseñanzas de la Iglesia Católica? |
| 2 | ¿He participado en prácticas ocultas, como astrología, quiromancia, tabla ouija, brujería o superstición? |
| 3 | ¿He recibido la Sagrada Comunión en estado de pecado mortal? |
| 4 | ¿He mentido o retenido intencionalmente un pecado grave en la confesión? |
| 5 | ¿He descuidado la oración durante un período prolongado? |
| 6 | ¿He puesto confianza excesiva en el dinero, el estatus, el poder u otras personas, tratándolos como si fueran más importantes que Dios? |
| 58 | ¿He sido perezoso en mi vida espiritual, descuidando la oración, los sacramentos o el crecimiento en la fe? |

**2nd Commandment questions:**

| id | text_es |
|----|---------|
| 7 | ¿He tomado el nombre de Dios en vano? |
| 8 | ¿He maldecido o usado lenguaje profano? |
| 9 | ¿He faltado al respeto a personas, lugares o cosas sagradas? |
| 10 | ¿He hecho un juramento falso o roto una promesa hecha a Dios? |

**3rd Commandment questions:**

| id | text_es |
|----|---------|
| 11 | ¿He faltado a Misa los domingos o los días de precepto sin razón grave? |
| 12 | ¿He llegado tarde a Misa o me he ido antes de tiempo sin motivo justificado? |
| 13 | ¿He dejado de observar los días de ayuno y abstinencia designados por la Iglesia? |
| 14 | ¿He hecho trabajo innecesario o compras los domingos cuando debería dedicar tiempo al descanso y a la familia? |

**4th Commandment questions:**

| id | text_es |
|----|---------|
| 15 | ¿He desobedecido o faltado al respeto a mis padres o personas en autoridad legítima? |
| 16 | ¿He descuidado mis deberes hacia mi cónyuge, hijos o familia? |
| 17 | ¿He dejado de dar buen ejemplo a quienes están a mi cargo? |
| 18 | ¿He dejado de cuidar el bienestar espiritual de mi familia? |

**5th Commandment questions:**

| id | text_es |
|----|---------|
| 19 | ¿He causado daño físico intencionalmente a otra persona? |
| 20 | ¿He procurado, aconsejado o apoyado el aborto? |
| 21 | ¿He guardado odio o rencor contra alguien? |
| 22 | ¿He sido cruel con los animales o descuidado la creación de Dios? |
| 23 | ¿He abusado del alcohol, las drogas o el tabaco? |
| 24 | ¿He contribuido al pecado de otra persona por mal ejemplo o negligencia? |
| 25 | ¿He dado escándalo con mis palabras o acciones, llevando a otros al pecado? |
| 59 | ¿He comido o bebido en exceso, faltando a la templanza? |

**6th Commandment questions:**

| id | text_es |
|----|---------|
| 26 | ¿He participado en actividad sexual fuera del matrimonio? |
| 27 | ¿He usado anticonceptivos artificiales? |
| 28 | ¿He visto pornografía o entretenimiento sexualmente explícito? |
| 29 | ¿He consentido deliberadamente pensamientos o deseos impuros? |
| 30 | ¿He participado en actividad sexual contraria a la ley moral? |

**7th Commandment questions:**

| id | text_es |
|----|---------|
| 32 | ¿He robado o tomado algo que no me pertenece? |
| 33 | ¿He hecho trampa en mis impuestos o negocios? |
| 34 | ¿He dañado o destruido la propiedad de otro intencionalmente? |
| 35 | ¿He dejado de pagar mis deudas o cumplir mis obligaciones financieras? |
| 36 | ¿He pagado salarios injustos o explotado a los trabajadores? |
| 37 | ¿He descuidado contribuir a las necesidades de la Iglesia según mis posibilidades? |

**8th Commandment questions:**

| id | text_es |
|----|---------|
| 38 | ¿He mentido? |
| 39 | ¿He chismeado o revelado faltas ajenas sin motivo justificado? |
| 40 | ¿He calumniado a alguien o dañado su reputación con afirmaciones falsas? |
| 41 | ¿He cometido perjurio o dado falso testimonio? |
| 42 | ¿He juzgado a otros precipitadamente sin conocer los hechos? |
| 43 | ¿He dejado de defender a alguien que estaba siendo tratado injustamente? |

**9th Commandment questions:**

| id | text_es |
|----|---------|
| 44 | ¿He consentido deliberadamente pensamientos impuros sobre otra persona? |
| 45 | ¿He dejado de guardar la modestia en el vestir y el comportamiento? |
| 46 | ¿He buscado intencionalmente ocasiones de tentación? |
| 47 | ¿He permitido que la lujuria o la fantasía controlen mis pensamientos? |

**10th Commandment questions:**

| id | text_es |
|----|---------|
| 48 | ¿He envidiado las posesiones, el éxito o las cualidades de los demás? |
| 49 | ¿He sido avaricioso o codicioso? |
| 50 | ¿He dejado de ser generoso con los necesitados cuando podía ayudar? |
| 51 | ¿He puesto las posesiones materiales por encima de Dios o de las personas? |

**5th Commandment — Q31 (suicide question):**

| id | text_es |
|----|---------|
| 31 | ¿He contemplado o intentado el suicidio? |

**Precepts questions:**

| id | text_es |
|----|---------|
| 52 | ¿He faltado a Misa los domingos y días de precepto? |
| 53 | ¿He dejado de confesarme al menos una vez al año? |
| 54 | ¿He dejado de recibir la Sagrada Comunión durante el tiempo de Pascua? |
| 55 | ¿He dejado de observar los días de ayuno y abstinencia? |
| 56 | ¿He dejado de contribuir a las necesidades de la Iglesia? |
| 57 | ¿He dejado de observar las leyes de la Iglesia sobre el matrimonio? |
| 60 | ¿He participado en la vida de mi parroquia y contribuido a su misión? |

**I18N-12 — Add `text_es` / `title_es` to prayers**

29. In `data/examination.json`, add Spanish translations to the three prayer objects:

**Prayer Before Confession:**
```json
{
  "title": "Prayer Before Confession",
  "title_es": "Oración Antes de la Confesión",
  "text": "Come, Holy Spirit, into my soul. ...",
  "text_es": "Ven, Espíritu Santo, a mi alma. Ilumina mi mente para que conozca los pecados que debo confesar, y concédeme la gracia de confesarlos plenamente, con humildad y con un corazón contrito. Ayúdame a proponer firmemente no volver a cometerlos.\n\nOh Bienaventurada Virgen, Madre de mi Redentor, espejo de inocencia y santidad, y refugio de los pecadores arrepentidos, intercede por mí por la Pasión de tu Hijo, para que obtenga la gracia de hacer una buena confesión.\n\nTodos ustedes, ángeles y santos benditos de Dios, rueguen por mí, pecador miserable, para que me arrepienta de mis malos caminos, y mi corazón esté por siempre unido al de ustedes en el amor eterno. Amén."
}
```

**Act of Contrition (Baltimore Catechism version → matching Spanish equivalent):**
```json
{
  "title": "Act of Contrition",
  "title_es": "Acto de Contrición",
  "text": "O my God, I am heartily sorry for having offended Thee, ...",
  "text_es": "Dios mío, me arrepiento de todo corazón de haberte ofendido, y detesto todos mis pecados, porque temo perder el cielo y sufrir las penas del infierno; pero más que nada porque te ofendí a Ti, Dios mío, que eres todo bondad y mereces todo mi amor. Propongo firmemente, con la ayuda de Tu gracia, confesar mis pecados, hacer penitencia y enmendar mi vida. Amén."
}
```

**Thanksgiving After Confession:**
```json
{
  "title": "Thanksgiving After Confession",
  "title_es": "Acción de Gracias Después de la Confesión",
  "text": "Almighty and merciful God, I thank You for the grace of this Sacrament. ...",
  "text_es": "Dios todopoderoso y misericordioso, te doy gracias por la gracia de este Sacramento. Te agradezco tu perdón y la restauración de tu amistad. Ayúdame, Señor, a evitar los pecados que he confesado y fortaléceme para vivir fielmente según tu voluntad. Que la Santísima Virgen María y todos los santos intercedan por mí. Por Cristo nuestro Señor. Amén."
}
```

**I18N-13 — Convert how_to_confess steps to objects and add `text_es`**

30. In `data/examination.json`, convert the `how_to_confess` section. Currently the steps are plain strings:

```json
"how_to_confess": {
  "title": "How to Go to Confession",
  "steps": [
    "Examine your conscience...",
    "Enter the confessional..."
  ]
}
```

Convert to objects with `text` and `text_es` fields, and add `title_es`:

```json
"how_to_confess": {
  "title": "How to Go to Confession",
  "title_es": "Cómo Ir a Confesarse",
  "steps": [
    {
      "text": "Examine your conscience using the questions in each section of this module.",
      "text_es": "Examina tu conciencia usando las preguntas en cada sección de este módulo."
    },
    {
      "text": "Enter the confessional and make the Sign of the Cross. Say: \"Bless me, Father, for I have sinned. It has been [weeks, months, or years] since my last confession.\"",
      "text_es": "Entra al confesionario y haz la Señal de la Cruz. Di: \"Bendígame, Padre, porque he pecado. Han pasado [semanas, meses o años] desde mi última confesión.\""
    },
    {
      "text": "Confess your sins to the priest. Be honest and complete, especially regarding serious (mortal) sins.",
      "text_es": "Confiesa tus pecados al sacerdote. Sé honesto y completo, especialmente con los pecados graves (mortales)."
    },
    {
      "text": "Listen to the priest's counsel and accept your penance.",
      "text_es": "Escucha el consejo del sacerdote y acepta tu penitencia."
    },
    {
      "text": "Pray the Act of Contrition when the priest asks you to.",
      "text_es": "Reza el Acto de Contrición cuando el sacerdote te lo pida."
    },
    {
      "text": "After receiving absolution, leave the confessional and complete your penance.",
      "text_es": "Después de recibir la absolución, sal del confesionario y cumple tu penitencia."
    }
  ]
}
```

**I18N-14 — Localize pastoral note for Q31**

31. In `src/examination.js`, the `_pastoralNoteHTML()` function currently hardcodes English text. Add localization:

```javascript
function _pastoralNoteHTML() {
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var isEs = (lang === 'es');

  var supportText = isEs
    ? 'Si estás luchando con pensamientos de autolesión, por favor ten presente que Dios te ama y que hay ayuda disponible. Llama o envía un mensaje de texto al <a href="tel:988" class="exam-pastoral-link">988</a> (Línea de Prevención del Suicidio y Crisis) en cualquier momento.'
    : 'If you are struggling with thoughts of self-harm, please know that God loves you and that help is available. Call or text <a href="tel:988" class="exam-pastoral-link">988</a> (Suicide &amp; Crisis Lifeline) anytime.';

  var quoteText = isEs
    ? '\u201CNo debemos desesperar de la salvación eterna de las personas que se han quitado la vida. Dios puede, por caminos que solo Él conoce, proveer la oportunidad de un arrepentimiento salvador.\u201D<span class="exam-pastoral-cite"> \u2014 CCC \u00A72283</span>'
    : '\u201CWe should not despair of the eternal salvation of persons who have taken their own lives. By ways known to him alone, God can provide the opportunity for salutary repentance.\u201D<span class="exam-pastoral-cite"> \u2014 CCC \u00A72283</span>';

  return '<div class="exam-pastoral-note">'
    + '<p class="exam-pastoral-support">' + supportText + '</p>'
    + '<p class="exam-pastoral-quote">' + quoteText + '</p>'
    + '</div>';
}
```

### Group 4: Static string localization in examination.js (do all)

**I18N-15 — Localize remaining hardcoded UI strings in examination.js**

32. The reader module title. In the `reader.registerModule('examination', ...)` call, the `getTitle` function returns a hardcoded string:

```javascript
  getTitle: function() { return 'Examination of Conscience'; },
```

Replace with:

```javascript
  getTitle: function() {
    var lang = '';
    try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
    return (lang === 'es') ? 'Examen de Conciencia' : 'Examination of Conscience';
  },
```

33. The opening screen "Begin Examination" button:

```javascript
      + '<button class="exam-opening-btn" onclick="window._examBeginReview()">Begin Examination</button>'
```

Replace with:

```javascript
      + '<button class="exam-opening-btn" onclick="window._examBeginReview()">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Comenzar Examen' : 'Begin Examination') + '</button>'
```

34. The summary section header text "Summary for Confession" and "This list exists only during this session. Nothing is saved." — these appear in both `_renderExamination()` and `_renderSummaryScreen()`. In both locations, replace:

```javascript
    html += '<div><div class="exam-summary-title">Summary for Confession<span id="examSummaryCount"></span></div>';
    html += '<div class="exam-summary-privacy">This list exists only during this session. Nothing is saved.</div></div>';
```

With:

```javascript
    var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
    html += '<div><div class="exam-summary-title">' + (_l ? 'Resumen para la Confesión' : 'Summary for Confession') + '<span id="examSummaryCount"></span></div>';
    html += '<div class="exam-summary-privacy">' + (_l ? 'Esta lista existe solo durante esta sesión. No se guarda nada.' : 'This list exists only during this session. Nothing is saved.') + '</div></div>';
```

35. The "No items selected yet" empty state in `_renderSummaryHTML()`:

```javascript
    return '<div class="exam-summary-empty">No items selected yet. Check items above as you examine your conscience.</div>';
```

Replace with:

```javascript
    var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
    return '<div class="exam-summary-empty">' + (_l ? 'No hay elementos seleccionados. Marca los elementos mientras examinas tu conciencia.' : 'No items selected yet. Check items above as you examine your conscience.') + '</div>';
```

36. The toast "Noted for your confession summary":

```javascript
        render.showToast('Noted for your confession summary');
```

Replace both occurrences (one in `_wireCheckboxes`, one in the legacy change handler) with:

```javascript
        render.showToast((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Anotado para tu resumen de confesión' : 'Noted for your confession summary');
```

37. Footer navigation labels. In `_updateFooterNav()`:

```javascript
  var nextLabel = isLast ? 'View Summary \u2192' : 'Next \u2192';
```

Replace with:

```javascript
  var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
  var nextLabel = isLast ? (_l ? 'Ver Resumen \u2192' : 'View Summary \u2192') : (_l ? 'Siguiente \u2192' : 'Next \u2192');
```

And the Previous button:

```javascript
    + '<button class="exam-nav-back" onclick="examPrevSection()"' + (isFirst ? ' disabled' : '') + '>\u2190 Previous</button>'
```

Replace with:

```javascript
    + '<button class="exam-nav-back" onclick="examPrevSection()"' + (isFirst ? ' disabled' : '') + '>\u2190 ' + (_l ? 'Anterior' : 'Previous') + '</button>'
```

And the count label:

```javascript
    ? '<button class="exam-nav-count exam-nav-count--link" onclick="examViewSummary()">' + count + ' item' + (count !== 1 ? 's' : '') + ' noted</button>'
    : '<span class="exam-nav-count">No items noted</span>';
```

Replace with:

```javascript
    ? '<button class="exam-nav-count exam-nav-count--link" onclick="examViewSummary()">' + count + (_l ? ' anotado' + (count !== 1 ? 's' : '') : ' item' + (count !== 1 ? 's' : '') + ' noted') + '</button>'
    : '<span class="exam-nav-count">' + (_l ? 'Sin anotaciones' : 'No items noted') + '</span>';
```

38. Summary screen footer "Back" and "Done" buttons:

```javascript
        + '<button class="exam-nav-back" onclick="examGoToSection(' + (_sections.length - 1) + ')">\u2190 Back</button>'
        + '<button class="exam-nav-next" onclick="examGracefulClose()">Done</button>'
```

Replace with:

```javascript
        + '<button class="exam-nav-back" onclick="examGoToSection(' + (_sections.length - 1) + ')">\u2190 ' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Volver' : 'Back') + '</button>'
        + '<button class="exam-nav-next" onclick="examGracefulClose()">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Listo' : 'Done') + '</button>'
```

39. Confession tracker strings. In `_renderSummaryScreen()` and `_renderExamination()`:

```javascript
    html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">I went to confession today</button>';
```

Replace with:

```javascript
    html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Fui a confesarme hoy' : 'I went to confession today') + '</button>';
```

40. "Find Confession Near Me" button (both render paths):

```javascript
    html += 'Find Confession Near Me</button>';
```

Replace with:

```javascript
    html += ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Encontrar Confesión Cerca' : 'Find Confession Near Me') + '</button>';
```

41. "Go in peace" closing text (both render paths):

```javascript
    html += '<p class="exam-ending-text">Go in peace to love and serve the Lord.</p>';
```

Replace with:

```javascript
    html += '<p class="exam-ending-text">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Ve en paz para amar y servir al Señor.' : 'Go in peace to love and serve the Lord.') + '</p>';
```

42. "Last Confession: Today/Yesterday/X days ago" strings in `examMarkConfession()` and the tracker rendering. In `_renderSummaryScreen()` and `_renderExamination()`:

```javascript
      trackerHtml = '<div class="exam-tracker-status">Last Confession: ' + (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago') + '</div>';
```

Replace with:

```javascript
      var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
      var agoLabel = _l
        ? (daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : 'Hace ' + daysAgo + ' días')
        : (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago');
      trackerHtml = '<div class="exam-tracker-status">' + (_l ? 'Última Confesión: ' : 'Last Confession: ') + agoLabel + '</div>';
```

43. The exit confirmation dialog in `_showExitConfirm()`:

```javascript
    + '<h4 class="exam-exit-title">End Examination?</h4>'
    + '<p class="exam-exit-msg">Your ' + count + ' noted item' + plural + ' will be cleared for your privacy. This cannot be undone.</p>'
    // ...
    + '<button class="exam-exit-btn exam-exit-btn--cancel">Continue Examining</button>'
    + '<button class="exam-exit-btn exam-exit-btn--confirm">End &amp; Clear</button>'
```

Replace with:

```javascript
    var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
    // ...
    + '<h4 class="exam-exit-title">' + (_l ? '¿Terminar Examen?' : 'End Examination?') + '</h4>'
    + '<p class="exam-exit-msg">' + (_l ? 'Tus ' + count + ' anotación' + (count !== 1 ? 'es' : '') + ' se borrarán por tu privacidad. Esto no se puede deshacer.' : 'Your ' + count + ' noted item' + plural + ' will be cleared for your privacy. This cannot be undone.') + '</p>'
    // ...
    + '<button class="exam-exit-btn exam-exit-btn--cancel">' + (_l ? 'Continuar Examinando' : 'Continue Examining') + '</button>'
    + '<button class="exam-exit-btn exam-exit-btn--confirm">' + (_l ? 'Terminar y Borrar' : 'End &amp; Clear') + '</button>'
```

---

## Key gotchas

- **`_t()` must never throw.** The helper reads localStorage and returns a string. If localStorage is unavailable (private browsing on old iOS), it silently falls back to English. The try/catch in `getPrayerText` handles this.

- **how_to_confess steps structure change.** Steps change from plain strings to objects with `text` / `text_es`. The JS code in I18N-08 uses `typeof step === 'string'` guard so the old format still works if someone runs old JS against new data or vice versa during rollout.

- **CCC references stay in English.** The CCC pills render paragraph numbers (§2087) which are language-agnostic. The CCC text itself in `catechism.json` is English — localizing the full 2,865-paragraph Catechism is out of scope. The `refs.renderRef('ccc', section.ccc)` calls do not change.

- **`_toActionFormat()` English stripping.** The `_toActionFormat()` function strips English question prefixes ("Have I", "Did I"). For Spanish it should strip "¿He" / "¿" prefix. Update:

```javascript
function _toActionFormat(text) {
  var s = text
    .replace(/^¿/, '')
    .replace(/^(Have I|Did I|Do I|Have you|Did you|Am I|Was I|He)\s+/i, '')
    .replace(/\?$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

- **localStorage key:** `mf-prayer-lang`. Values: `'en'` (or absent = English default), `'es'`. Follows existing `mf-` prefix convention.

- **`settingsClearAll` already covers it.** The `settingsClearAll()` function clears all `mf-*` keys, so `mf-prayer-lang` will be cleared on full reset. Do NOT add `mf-prayer-lang` to `settingsClearPrayer()` — language preference is a display setting, not prayer activity data.

- **No CSS changes.** The Spanish text is the same length (slightly longer) as English. The existing responsive styles accommodate variable-length text. No new CSS needed.

- **The "Preparing examination…" loading text** is fine to leave in English — it's a transient 100-200ms loading state. Not worth localizing.

---

## Test checklist

### Language switching
- [ ] Open Settings → Prayer group → "Prayer Language" segmented control visible as first item
- [ ] Default is "English" (active state)
- [ ] Tap "Español" → button activates, setting persists
- [ ] Close Settings, reopen → "Español" still active
- [ ] Clear All Data → language resets to English

### Examination in Spanish
- [ ] Set language to Español, open Examination
- [ ] Opening prayer screen shows "Oración Antes de la Confesión" in Spanish
- [ ] "Comenzar Examen" button text is in Spanish
- [ ] Reader overlay title shows "Examen de Conciencia"
- [ ] First commandment title shows "Yo soy el Señor tu Dios; no tendrás otros dioses fuera de Mí."
- [ ] All 66 question texts render in Spanish
- [ ] Precepts title shows "Preceptos de la Iglesia"
- [ ] How-to-Confess modal shows "Cómo Ir a Confesarse" with Spanish steps
- [ ] Footer nav shows "Anterior" / "Siguiente" / "Ver Resumen"
- [ ] Check an item → toast shows "Anotado para tu resumen de confesión"
- [ ] Footer count shows "1 anotado" / "3 anotados"
- [ ] View Summary → "Resumen para la Confesión" header
- [ ] Summary preamble: "Bendígame, Padre, porque he pecado..."
- [ ] Commandment groupings show "1.º Mandamiento" / "Preceptos de la Iglesia"
- [ ] Act of Contrition in Spanish (Dios mío, me arrepiento...)
- [ ] Thanksgiving in Spanish (Dios todopoderoso y misericordioso...)
- [ ] "Fui a confesarme hoy" button
- [ ] "Encontrar Confesión Cerca" button
- [ ] "Ve en paz para amar y servir al Señor." closing
- [ ] Exit dialog: "¿Terminar Examen?" / "Continuar Examinando" / "Terminar y Borrar"
- [ ] Check Q31 → pastoral note renders in Spanish with 988 link

### English remains unchanged
- [ ] Set language back to English
- [ ] Full Examination run-through — everything renders identically to current behavior
- [ ] Opening prayer, all questions, all prayers, all nav labels, summary — all English

### Fallback behavior
- [ ] If a question is missing `text_es`, it silently falls back to English text
- [ ] No errors in console when switching languages
- [ ] Remove `mf-prayer-lang` from localStorage manually → defaults to English

### Regression
- [ ] Rosary still opens and works (untouched by this spec)
- [ ] Stations still opens and works (untouched)
- [ ] Chaplet still opens and works (untouched)
- [ ] Prayerbook still opens and works (untouched)
- [ ] CCC pills in examination still work
- [ ] Confession guide reader module still works
- [ ] Settings: Theme, Text Size, Rosary Mystery, Confession Tracking all still work
- [ ] Dark mode: all examination content renders correctly in both languages

---

## BACKLOG reference

- **IDEA-096** — Research (done): data model decision
- **IDEA-097** — This spec (Phase 1: Examination)
- **IDEA-098** — Phase 2: Rosary (future spec)
- **IDEA-099** — Phase 3: Stations + Chaplet (future spec)
- **IDEA-100** — Phase 4: Prayerbook + Novenas (future spec)
