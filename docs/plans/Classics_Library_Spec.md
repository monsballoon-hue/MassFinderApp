# Classics Library — Implementation Spec

**Author:** UX Design Consultant  
**Date:** 2026-03-11  
**Scope:** New content module — Catholic spiritual classics as readable books within Explore  
**Depends on:** Content Readers Spec (Bible reader upgrades), Content Reader Design Spec (immersive reading room)  
**License constraint:** All texts must be public domain (pre-1929 English translation) or explicitly free-use  

---

## What This Is

A library of the greatest Catholic spiritual classics, readable chapter-by-chapter inside the same immersive reading environment as the Bible and CCC. Each book is lazy-loaded, independently navigable, and cross-referenced to Scripture and the Catechism. The architecture mirrors the existing Bible per-book pattern: one JSON file per book in `data/classics/`, loaded on demand.

---

## The Library — Prioritized by Impact

### Wave 1 — Start Here (3 books, ~600KB total)

These are the three most widely read Catholic books after the Bible. All public domain. All structurally clean (books → chapters). All densely cross-referenced to Scripture.

| # | Title | Author | Date | Structure | Est. Size | Source | Scripture Density |
|---|---|---|---|---|---|---|---|
| 1 | **The Imitation of Christ** | Thomas à Kempis | ~1418 | 4 books, 114 chapters | ~180KB | CCEL / Gutenberg | Extremely high — 1,000+ references |
| 2 | **Confessions** | St. Augustine | ~397 | 13 books | ~250KB | CCEL (Pusey trans.) | High — Psalms woven throughout |
| 3 | **Story of a Soul** | St. Thérèse of Lisieux | 1898 | 11 chapters + epilogue | ~170KB | CCEL (Taylor 1912 trans.) | Moderate |

**Why these three first:**
- The Imitation of Christ has more editions than any book except the Bible. It's short (114 chapters, most under 500 words). Perfect for daily reading. Its structure maps directly to the reader's prev/next pattern.
- The Confessions is the first spiritual autobiography. It's deeply personal and draws non-readers in. The 13-book structure is clean.
- Story of a Soul is the most beloved modern saint's autobiography. St. Thérèse is a Doctor of the Church. The 1912 Taylor translation is public domain and widely used.

### Wave 2 — The Mystics (4 books, ~800KB total)

| # | Title | Author | Date | Structure | Est. Size |
|---|---|---|---|---|---|
| 4 | **Dark Night of the Soul** | St. John of the Cross | 1585 | 2 books, 24 chapters | ~120KB |
| 5 | **Interior Castle** | St. Teresa of Ávila | 1577 | 7 mansions (books), ~35 chapters | ~180KB |
| 6 | **Introduction to the Devout Life** | St. Francis de Sales | 1609 | 5 parts, ~130 chapters | ~300KB |
| 7 | **The Practice of the Presence of God** | Brother Lawrence | 1692 | 16 conversations + letters | ~50KB |

### Wave 3 — The Doctors & Fathers (4 books, ~1.5MB total)

| # | Title | Author | Date | Structure | Est. Size |
|---|---|---|---|---|---|
| 8 | **Dialogue** | St. Catherine of Siena | 1370 | 4 treatises, 167 chapters | ~400KB |
| 9 | **City of God** (selections) | St. Augustine | ~426 | 22 books (curate key chapters) | ~500KB |
| 10 | **True Devotion to the Blessed Virgin Mary** | St. Louis de Montfort | 1843 | 3 parts, ~120 sections | ~150KB |
| 11 | **Spiritual Exercises** | St. Ignatius of Loyola | 1548 | 4 weeks of exercises | ~100KB |

### Not Available (copyright protected — requires permission)

| Title | Author | Issue |
|---|---|---|
| Diary of St. Faustina | St. Faustina Kowalska | Marian Fathers hold English copyright. Digital apps require written permission + possible royalty. Non-commercial parish use exempted for excerpts under 1,000 words. **Action: Submit permissions request to Marian Fathers as a separate initiative.** |
| Story of a Soul (ICS translation) | — | ICS translation is copyrighted. Use the 1912 Taylor translation (PD) instead. |
| Modern translations of John of the Cross | — | Use the pre-1929 Peers/Lewis translations. |
| Anything by modern authors (Sheen, Merton, etc.) | — | 20th century = copyrighted. |

---

## Data Format

Each classic follows the Bible per-book JSON pattern for consistency:

```json
{
  "meta": {
    "title": "The Imitation of Christ",
    "author": "Thomas à Kempis",
    "translator": "Aloysius Croft and Harold Bolton",
    "date": "c. 1418",
    "translation_date": "1940",
    "source": "Christian Classics Ethereal Library (ccel.org)",
    "license": "Public domain (US)",
    "description": "The most widely read Christian devotional work after the Bible.",
    "books": 4,
    "chapters": 114
  },
  "toc": [
    {
      "book": 1,
      "title": "Helpful Counsels of the Spiritual Life",
      "chapters": [
        { "ch": 1, "title": "Imitating Christ and Despising All Vanities on Earth" },
        { "ch": 2, "title": "Having a Humble Opinion of Self" },
        { "ch": 3, "title": "The Doctrine of Truth" }
      ]
    },
    {
      "book": 2,
      "title": "Directives for the Interior Life",
      "chapters": [...]
    }
  ],
  "chapters": {
    "1:1": {
      "title": "Imitating Christ and Despising All Vanities on Earth",
      "book": 1,
      "text": "\"He who follows Me, walks not in darkness,\" says the Lord. By these words of Christ we are advised to imitate His life and habits..."
    },
    "1:2": {
      "title": "Having a Humble Opinion of Self",
      "book": 1,
      "text": "Every man naturally desires knowledge..."
    }
  }
}
```

**Key format choices:**
- `chapters` keyed by `book:chapter` (e.g., `"1:1"`, `"3:14"`) — mirrors Bible's `chapter:verse` keying
- `toc` is the full table of contents for navigation
- `meta` has everything needed for display and attribution
- Each chapter's `text` is plain text (no HTML) — the reader handles typographic rendering
- File stored at `data/classics/imitation-of-christ.json`

---

## Build Pipeline

### Script: `scripts/build-classic.js`

A generic build script that takes a source text file and a structure definition, outputs the JSON format above.

```
Usage: node scripts/build-classic.js --source sources/imitation.txt --config sources/imitation-config.json --output data/classics/imitation-of-christ.json
```

**Config file format** (`sources/imitation-config.json`):
```json
{
  "meta": {
    "title": "The Imitation of Christ",
    "author": "Thomas à Kempis",
    "translator": "Aloysius Croft and Harold Bolton",
    "date": "c. 1418",
    "source": "ccel.org",
    "license": "Public domain (US)"
  },
  "structure": {
    "bookPattern": "^BOOK (ONE|TWO|THREE|FOUR)$",
    "chapterPattern": "^Chapter (\\d+)$",
    "titlePattern": "^([A-Z][A-Za-z\\s,\\-']+)$"
  }
}
```

The build script:
1. Reads the plain-text source
2. Splits by book/chapter markers using the regex patterns
3. Cleans whitespace, normalizes line breaks
4. Extracts chapter titles
5. Extracts Scripture references from text using the same regex pattern as `_extractScriptureRefs()` in explore.js — stores them in a `refs` array per chapter for cross-referencing
6. Builds the JSON structure
7. Writes to `data/classics/`

**For Wave 1, the realistic approach is semi-manual:** download the CCEL plain text, clean it by hand (remove page numbers, fix OCR artifacts), define the structure config, and run the build script. Each book is a one-time ~30-minute preparation task.

### Source Acquisition

| Book | Source URL | Format | Notes |
|---|---|---|---|
| Imitation of Christ | `ccel.org/ccel/kempis/imitation` | HTML with chapter links / RTF / PDF | The RTF version is cleanest. Also on Gutenberg (#1653) as plain text. |
| Confessions | `ccel.org/ccel/augustine/confess` | HTML with book divisions | Pusey translation. Clear book/chapter structure. |
| Story of a Soul | `ccel.org/ccel/therese/autobio` | HTML/PDF | Taylor 1912 translation. Chapter structure explicit. |
| Dark Night | `goodcatholicbooks.org` | PDF | Peers translation. Two books with chapters. |
| Interior Castle | `ccel.org` or `goodcatholicbooks.org` | HTML/PDF | Seven mansions with chapters. |
| Introduction to Devout Life | `ccel.org` | HTML/PDF | Five parts, many short chapters. |
| Practice of Presence of God | `ccel.org` | HTML/PDF | Very short. Letters + conversations. |

---

## Classics Index

A master index file lists all available classics:

**File:** `data/classics/_index.json`

```json
{
  "classics": [
    {
      "id": "imitation-of-christ",
      "title": "The Imitation of Christ",
      "author": "Thomas à Kempis",
      "date": "c. 1418",
      "books": 4,
      "chapters": 114,
      "description": "The most widely read devotional work after the Bible.",
      "tags": ["devotional", "spiritual life", "eucharist", "humility"]
    },
    {
      "id": "confessions",
      "title": "Confessions",
      "author": "St. Augustine",
      "date": "c. 397",
      "books": 13,
      "chapters": 13,
      "description": "The first great spiritual autobiography.",
      "tags": ["autobiography", "conversion", "grace", "psalms"]
    }
  ]
}
```

This index is small (~2KB) and loaded once. Individual book JSONs are lazy-loaded when the user opens them — same pattern as Bible books.

---

## Reader Integration

### In Explore — The Library Landing

Add a "Classics" source card to the Explore landing page alongside CCC, Bible, Baltimore, Summa, and Lectionary:

```js
html += '<button class="explore-source-card" onclick="_exploreClassicsLanding()">'
  + '<div class="explore-source-title">Spiritual Classics</div>'
  + '<div class="explore-source-sub">' + classicCount + ' books</div>'
  + '</button>';
```

The Classics landing page shows the available books as cards:

```js
function _exploreClassicsLanding() {
  // Load _index.json, render book cards
  fetch('/data/classics/_index.json').then(function(r) { return r.json(); }).then(function(idx) {
    var html = '';
    idx.classics.forEach(function(book) {
      html += '<button class="explore-classic-card" onclick="_openClassicReader(\'' + book.id + '\')">'
        + '<div class="explore-classic-title">' + utils.esc(book.title) + '</div>'
        + '<div class="explore-classic-author">' + utils.esc(book.author) + '</div>'
        + '<div class="explore-classic-meta">' + utils.esc(book.date) + ' · ' + book.chapters + ' chapters</div>'
        + '</button>';
    });
    body.innerHTML = html;
  });
}
```

### The Classic Reader — Reuses the Reading Room

When a user opens a classic, it opens in a full-screen reader identical to the Bible reader (from `Content_Reader_Design_Spec.md`):

- Full-screen warm parchment overlay with liturgical season tint
- Translucent blur header
- Centered 540px content column
- Georgia serif at 18px / 2.0 line-height
- Chapter prev/next navigation at the bottom
- Chapter picker in the header
- Table of contents accessible from the book title

**Implementation:** The classic reader can be a new module (`src/classics.js`) or integrated into `bible.js` since the rendering pattern is identical. The key difference: classics use `book:chapter` keys instead of `chapter:verse`, and the content is continuous prose (no verse numbers).

```js
// src/classics.js — Spiritual Classics reader
var _cache = {};      // { 'imitation-of-christ': { meta, toc, chapters } }
var _currentBook = null;
var _currentChapter = '';

function _loadClassic(bookId) {
  if (_cache[bookId]) return Promise.resolve(_cache[bookId]);
  return fetch('/data/classics/' + bookId + '.json')
    .then(function(r) { return r.json(); })
    .then(function(d) { _cache[bookId] = d; return d; });
}

function openClassic(bookId, chapterKey) {
  _currentBook = bookId;
  _currentChapter = chapterKey || '1:1';
  // Open full-screen overlay (same pattern as openBible)
  document.getElementById('classicOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  _loadClassic(bookId).then(function(data) {
    _renderClassicContent(data);
  });
}

function _renderClassicContent(data) {
  var ch = data.chapters[_currentChapter];
  if (!ch) return;
  
  var html = '';
  
  // Book + chapter heading (centered)
  html += '<div class="classic-context">' + utils.esc(data.meta.author) + '</div>';
  html += '<div class="classic-chapter-heading">' + utils.esc(ch.title) + '</div>';
  
  // Body text — rendered as paragraphs
  var paragraphs = ch.text.split('\n\n');
  html += '<div class="classic-text">';
  paragraphs.forEach(function(p) {
    var trimmed = p.trim();
    if (trimmed) html += '<p>' + utils.esc(trimmed) + '</p>';
  });
  html += '</div>';
  
  // Chapter navigation
  var keys = Object.keys(data.chapters);
  var idx = keys.indexOf(_currentChapter);
  var prevKey = idx > 0 ? keys[idx - 1] : null;
  var nextKey = idx < keys.length - 1 ? keys[idx + 1] : null;
  
  html += '<div class="classic-chapter-nav">';
  if (prevKey) {
    html += '<button class="classic-nav-btn" onclick="_classicNav(\'' + prevKey + '\')">'
      + '<span class="classic-nav-arrow">\u2190</span>'
      + '<span class="classic-nav-label">' + utils.esc(data.chapters[prevKey].title).slice(0, 30) + '</span>'
      + '</button>';
  } else {
    html += '<div class="classic-nav-spacer"></div>';
  }
  html += '<span class="classic-nav-pos">Chapter ' + (idx + 1) + ' of ' + keys.length + '</span>';
  if (nextKey) {
    html += '<button class="classic-nav-btn" onclick="_classicNav(\'' + nextKey + '\')">'
      + '<span class="classic-nav-label">' + utils.esc(data.chapters[nextKey].title).slice(0, 30) + '</span>'
      + '<span class="classic-nav-arrow">\u2192</span>'
      + '</button>';
  } else {
    html += '<div class="classic-nav-spacer"></div>';
  }
  html += '</div>';
  
  document.getElementById('classicBody').innerHTML = html;
  document.getElementById('classicScroll').scrollTop = 0;
}
```

### Cross-Referencing

Each chapter's `refs` array (extracted at build time) enables connections to the Bible and CCC:

```js
// After rendering chapter text, show connections if refs exist
if (ch.refs && ch.refs.length) {
  html += '<details class="classic-refs-section">'
    + '<summary class="classic-refs-summary">Scripture References <span class="classic-refs-count">' + ch.refs.length + '</span></summary>'
    + '<div class="classic-refs-body">';
  ch.refs.forEach(function(ref) {
    html += '<div class="classic-ref-item" onclick="_openBibleFromClassic(\'' + utils.esc(ref) + '\')">'
      + '<span class="classic-ref-label">' + utils.esc(ref) + '</span>'
      + '</div>';
  });
  html += '</div></details>';
}
```

This is the same pattern as the Bible reader's cross-references — collapsible, secondary to the text, clickable into the Bible reader.

---

## CSS — Inherits From the Reading Room

The Classic reader uses the same CSS as the Bible reader from `Content_Reader_Design_Spec.md`. The few unique elements:

```css
/* Classic reader overlay — same as Bible reader */
.classic-overlay { 
  position: fixed; 
  inset: 0; 
  z-index: 2001; 
  background: linear-gradient(180deg, #F8F6F1 0%, #F0EDE5 100%); 
  display: flex; 
  flex-direction: column; 
  transform: translateY(100%); 
  transition: transform 0.5s cubic-bezier(0.28, 0.11, 0.32, 1); 
}
.classic-overlay.open { transform: translateY(0); }

/* Classic-specific text treatment */
.classic-context { 
  font-size: var(--text-xs); 
  color: var(--color-text-tertiary); 
  text-align: center; 
  text-transform: uppercase; 
  letter-spacing: 0.04em; 
  margin-bottom: var(--space-2); 
}
.classic-chapter-heading { 
  font-family: var(--font-display); 
  font-size: var(--text-xl); 
  font-weight: 700; 
  color: var(--color-text-primary); 
  text-align: center; 
  line-height: 1.3; 
  margin-bottom: var(--space-6); 
  padding-bottom: var(--space-4); 
  border-bottom: 1px solid var(--color-border-light); 
}
.classic-text { 
  font-family: var(--font-prayer); 
  font-size: 1.125rem; 
  line-height: 2.0; 
  color: var(--color-text-primary); 
}
.classic-text p { 
  margin: 0 0 var(--space-4); 
  text-indent: 1.5em; 
}
.classic-text p:first-child { 
  text-indent: 0; 
}
```

The `text-indent: 1.5em` on paragraphs is a book convention — every paragraph after the first is indented. This small detail makes prose feel like a printed book rather than a web page.

---

## HTML — Classic Reader Overlay

Add to `index.html` alongside the Bible and CCC overlays:

```html
<!-- Classic Reader Overlay -->
<div id="classicOverlay" class="classic-overlay" role="dialog" aria-modal="true" aria-label="Classic Reader">
  <div class="classic-header">
    <button class="classic-close-btn" onclick="closeClassic()" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="classic-title" id="classicTitle">Spiritual Classic</div>
    <button class="classic-toc-btn" onclick="_toggleClassicTOC()" aria-label="Table of Contents">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
  <div class="classic-scroll" id="classicScroll">
    <div id="classicBody"></div>
  </div>
</div>
```

The header has: close button (left), title (center), TOC button (right — hamburger icon opens the table of contents as a slide-down panel).

---

## The Imitation of Christ — Detailed Build Plan

Since this is the first book, here's the specific pipeline:

### Step 1: Acquire Source Text

Download from Project Gutenberg (#1653) or CCEL. The Gutenberg plain-text version is cleanest:
```
https://www.gutenberg.org/files/1653/1653-0.txt
```

The Croft & Bolton translation (1940, but translating a 1418 text — the translation itself is public domain as a work-for-hire published without copyright renewal).

### Step 2: Create Structure Config

The Imitation has 4 books:
- Book One: "Helpful Counsels of the Spiritual Life" (25 chapters)
- Book Two: "Directives for the Interior Life" (12 chapters)
- Book Three: "On Interior Consolation" (59 chapters)
- Book Four: "On the Blessed Sacrament" (18 chapters)

Total: 114 chapters. Average chapter length: ~300-500 words. Perfect for daily reading.

### Step 3: Run Build Script

```bash
node scripts/build-classic.js \
  --source sources/imitation-of-christ.txt \
  --config sources/imitation-config.json \
  --output data/classics/imitation-of-christ.json
```

### Step 4: Validate

```bash
node scripts/validate-classic.js data/classics/imitation-of-christ.json
# Should output:
# ✓ 114 chapters, 4 books
# ✓ 847 Scripture references extracted
# ✓ Total size: 178KB
```

### Step 5: Register in Index

Add to `data/classics/_index.json`.

### Step 6: Wire Into Explore

The Classics landing page picks up the new book automatically from the index.

---

## Search Integration

Classics participate in the unified Explore search. The search scans chapter titles and the first 200 characters of each chapter's text:

```js
// In exploreSearch(), add a Classics section
if (_classicsIndex) {
  var classicHits = [];
  _classicsIndex.classics.forEach(function(book) {
    // Search book title + author + description + tags
    var bookText = (book.title + ' ' + book.author + ' ' + book.description + ' ' + (book.tags || []).join(' ')).toLowerCase();
    if (words.every(function(w) { return bookText.indexOf(w) >= 0; })) {
      classicHits.push({ type: 'classic', id: book.id, label: book.title, detail: book.author + ' · ' + book.date });
    }
  });
  if (classicHits.length) {
    results.push({ source: 'Classics', items: classicHits.slice(0, 3) });
  }
}
```

Full-text chapter search happens once the book is loaded (lazy — only searched if the user has opened it before).

---

## Data Budget

| Item | Size | Loading |
|---|---|---|
| `data/classics/_index.json` | ~2KB | Loaded with Explore |
| `data/classics/imitation-of-christ.json` | ~180KB | Lazy — on first open |
| `data/classics/confessions.json` | ~250KB | Lazy |
| `data/classics/story-of-a-soul.json` | ~170KB | Lazy |
| Wave 1 total | ~600KB | Only loaded when read |
| Full library (11 books) | ~3MB | Only loaded per-book |

For comparison, `data/bible-drb/` is 4.8MB across 73 files. The entire classics library at full build is less than one Bible translation.

---

## Implementation Order

1. **Create `data/classics/` directory** and `_index.json`
2. **Write `scripts/build-classic.js`** — generic source-to-JSON converter
3. **Acquire and clean Imitation of Christ source text** (~30 min manual)
4. **Build `imitation-of-christ.json`** — first book
5. **Write `src/classics.js`** — reader module (open, render, navigate, close)
6. **Add Classic overlay to `index.html`**
7. **Add Classic CSS to `css/app.css`** (inherits Reading Room design)
8. **Add Classics card to Explore landing page**
9. **Wire window bindings in `src/app.js`**
10. **Test full reading flow** — open book, read chapter, prev/next, TOC, close
11. **Build Confessions and Story of a Soul** — repeat steps 3-4 for each
12. **Add Scripture cross-reference extraction** to build script
13. **Connect refs to Bible reader** via `_openBibleFromClassic()`

---

## Files Created/Modified

| File | Action | Phase |
|---|---|---|
| `data/classics/_index.json` | **NEW** | 1 |
| `data/classics/imitation-of-christ.json` | **NEW** | 1 |
| `data/classics/confessions.json` | **NEW** (Wave 1) | 2 |
| `data/classics/story-of-a-soul.json` | **NEW** (Wave 1) | 2 |
| `scripts/build-classic.js` | **NEW** | 1 |
| `sources/imitation-of-christ.txt` | **NEW** (source text) | 1 |
| `sources/imitation-config.json` | **NEW** (structure def) | 1 |
| `src/classics.js` | **NEW** (~200 lines) | 1 |
| `src/app.js` | Add window bindings for classics | 1 |
| `src/explore.js` | Add Classics to landing + search | 1 |
| `index.html` | Add Classic overlay HTML | 1 |
| `css/app.css` | Add Classic reader CSS (~60 lines) | 1 |

---

## Future: The Faustina Path

St. Faustina's Diary requires a permissions request to the Marian Fathers. The request should reference:

- MassFinder is non-commercial (AGPL-3.0, self-funded)
- The app serves Catholic parishes in Western New England
- The text would be read-only (no modifications, proper attribution)
- "Used with permission of the Marian Fathers of the Immaculate Conception of the B.V.M." attribution displayed

**Contact:** permissions@marian.org or the form at thedivinemercy.org/house/copyright

This is a relationship worth building. If granted, the Diary integrates into the Classics reader identically — a JSON file with numbered diary entries as chapters, cross-referenced to Scripture. But it's a separate initiative from the public domain library.

---

## What Success Looks Like

A user opens Explore, taps "Spiritual Classics," sees three book cards. Taps "The Imitation of Christ." The warm parchment reading room opens. The chapter heading says "Imitating Christ and Despising All Vanities on Earth" in Playfair Display. Below it, Georgia serif at 18px with double line-spacing:

> "He who follows Me, walks not in darkness," says the Lord. By these words of Christ we are advised to imitate His life and habits, if we wish to be truly enlightened and free from all blindness of heart.

The user reads. At the bottom, a pill button: "Having a Humble Opinion of Self →". They tap it. The next chapter slides in. They keep reading. At the bottom of that chapter, a collapsed "Scripture References (4)" section. They tap it and see "John 8:12", "Ecclesiastes 1:8", "1 Corinthians 8:1". They tap "John 8:12" and the Bible reader opens to the full chapter of John 8, with verse 12 highlighted.

They're reading a 600-year-old book that connects to the Bible that connects to the Catechism. The threads of 2,000 years of Catholic tradition, alive in their hand. That's the mission.
