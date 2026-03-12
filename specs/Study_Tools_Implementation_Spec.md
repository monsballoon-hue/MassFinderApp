# Study Tools — Implementation Spec

**Author:** UX Design Consultant  
**Date:** 2026-03-12  
**Scope:** Annotation, highlighting, bookmarking, reading progress, study dashboard  
**Target:** Claude Code Opus Max  
**Depends on:** Universal Reader (`src/reader.js` from Frontend Architecture Audit — if not yet built, these items can still land against the current module structure)  
**Derived from:** `Universal_Reader_Research_Report.md`

---

## Status Summary

| ID | Title | Status |
|----|-------|--------|
| ST-01 | Add Dexie.js Dependency | done |
| ST-02 | Create Study Database Module | done |
| ST-03 | Wire Study DB Into App Entry Point | done |
| ST-04 | Auto-Save Reading Progress in Bible Reader | done |
| ST-05 | Auto-Save Reading Progress in CCC Reader | done |
| ST-06 | "Continue Reading" Section on Saved Tab | done |
| ST-07 | Add Annotatable Data Attributes to Content | done |
| ST-08 | Create Study UI Module — Annotation Action Bar | done |
| ST-09 | Study UI CSS | done |
| ST-10 | Init Study Layer in Bible Reader | done |
| ST-11 | Init Study Layer in CCC Reader | done |
| ST-12 | Bookmarks Section on Saved Tab | done |
| ST-13 | Notes Section on Saved Tab | done |
| ST-14 | Clear Study Data Option in Settings | done |
| ST-15 | Data Privacy Note | done |
| ST-16 | Create TTS Module | done |
| ST-17 | Add Listen Button to Bible Reader | done |
| ST-18 | Add Listen Button to CCC Reader | done |
| ST-19 | Listen Button CSS | done |
| ST-20 | Stop TTS on Tab Switch and Overlay Close | done |
| ST-21 | ElevenLabs Cloud Voice (Feature Flag — Tier 2) | skipped |
| ST-22 | Voice Selection in Settings | done |

---

## Summary

Add study tools to MassFinder: highlights, notes, bookmarks, and reading progress that persist across sessions using IndexedDB (via Dexie.js). One new runtime dependency (50KB). Four new source files. Surgical modifications to existing content modules. All data stays local on the user's device.

22 items across 6 phases. Estimated effort: 6–8 hours total.

---

## Phase 1: Persistence Foundation (ST-01 through ST-03)

---

### ST-01: Add Dexie.js Dependency

**What:** Add the IndexedDB wrapper library.

**Files:** `package.json`

**Implementation:**
```bash
npm install dexie --save
```

This adds `"dexie": "^4.x"` to `dependencies` in `package.json`. Dexie is ~50KB minified and bundles via esbuild with no configuration changes needed — it's a standard CommonJS/ESM module.

**Verify:** After install, run `npm run build` and confirm `dist/app.min.js` builds without errors and the bundle size increase is ~50KB.

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `package.json` — added dexie dependency
- **Approach:** Ran `npm install dexie --save` to add Dexie.js as a runtime dependency. Dexie bundles cleanly via esbuild as a standard CommonJS module with no configuration changes.
- **Deviations from spec:** None
- **Known issues:** None observed

---

### ST-02: Create Study Database Module

**What:** The persistence layer — Dexie schema definition + all CRUD operations for annotations and reading progress.

**File:** `src/study-db.js` (**NEW**)

**Implementation:**

```js
// src/study-db.js — Study tools persistence layer (IndexedDB via Dexie)
// Stores annotations (notes, highlights, bookmarks) and reading progress.
// All data is local-only. No server calls. Privacy-first.

var Dexie = require('dexie').Dexie;

var db = new Dexie('MassFinderStudy');

db.version(1).stores({
  annotations: '++id, type, source, address, created',
  progress: 'key, source, updated'
});

// ── Notes ──

function addNote(source, address, text) {
  return db.annotations.add({
    type: 'note',
    source: source,
    address: address,
    offset: null,
    text: text,
    color: null,
    label: null,
    created: new Date().toISOString()
  });
}

function updateNote(id, text) {
  return db.annotations.update(id, { text: text });
}

function getNotesForAddress(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'note'; })
    .toArray();
}

function getAllNotes(source) {
  if (source) {
    return db.annotations
      .where({ source: source, type: 'note' })
      .reverse()
      .sortBy('created');
  }
  return db.annotations
    .where({ type: 'note' })
    .reverse()
    .sortBy('created');
}

// ── Highlights ──

function addHighlight(source, address, color) {
  // Check for existing highlight on same address — toggle off if exists
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'highlight'; })
    .first()
    .then(function(existing) {
      if (existing) {
        // Toggle: remove existing highlight
        return db.annotations.delete(existing.id).then(function() { return null; });
      }
      return db.annotations.add({
        type: 'highlight',
        source: source,
        address: address,
        offset: null,
        text: null,
        color: color || 'gold',
        label: null,
        created: new Date().toISOString()
      });
    });
}

function getHighlightsForAddresses(source, addresses) {
  // Get highlights for a set of addresses (e.g., all verses in a chapter)
  return db.annotations
    .where('address')
    .anyOf(addresses)
    .and(function(a) { return a.source === source && a.type === 'highlight'; })
    .toArray();
}

function getAllHighlights(source) {
  if (source) {
    return db.annotations
      .where({ source: source, type: 'highlight' })
      .toArray();
  }
  return db.annotations
    .where({ type: 'highlight' })
    .toArray();
}

// ── Bookmarks ──

function addBookmark(source, address, label) {
  return db.annotations.add({
    type: 'bookmark',
    source: source,
    address: address,
    offset: null,
    text: null,
    color: null,
    label: label || '',
    created: new Date().toISOString()
  });
}

function removeBookmark(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'bookmark'; })
    .delete();
}

function isBookmarked(source, address) {
  return db.annotations
    .where({ source: source, address: address })
    .and(function(a) { return a.type === 'bookmark'; })
    .count()
    .then(function(c) { return c > 0; });
}

function getAllBookmarks() {
  return db.annotations
    .where({ type: 'bookmark' })
    .reverse()
    .sortBy('created');
}

// ── Reading Progress ──

function saveProgress(source, bookId, address, scrollPos) {
  var key = source + ':' + (bookId || '_');
  return db.progress.put({
    key: key,
    source: source,
    bookId: bookId || null,
    address: address,
    scrollPos: scrollPos || 0,
    updated: new Date().toISOString()
  });
}

function getProgress(source, bookId) {
  var key = source + ':' + (bookId || '_');
  return db.progress.get(key);
}

function getAllProgress() {
  return db.progress.orderBy('updated').reverse().toArray();
}

// ── Annotation counts (for indicators) ──

function getAnnotationCounts(source, addresses) {
  // Returns { address: { notes: N, highlights: N, bookmarks: N } }
  return db.annotations
    .where('address')
    .anyOf(addresses)
    .and(function(a) { return a.source === source; })
    .toArray()
    .then(function(items) {
      var counts = {};
      items.forEach(function(a) {
        if (!counts[a.address]) counts[a.address] = { notes: 0, highlights: 0, bookmarks: 0 };
        if (a.type === 'note') counts[a.address].notes++;
        else if (a.type === 'highlight') counts[a.address].highlights++;
        else if (a.type === 'bookmark') counts[a.address].bookmarks++;
      });
      return counts;
    });
}

// ── Delete ──

function deleteAnnotation(id) {
  return db.annotations.delete(id);
}

function clearAllData() {
  return Promise.all([
    db.annotations.clear(),
    db.progress.clear()
  ]);
}

module.exports = {
  addNote: addNote,
  updateNote: updateNote,
  getNotesForAddress: getNotesForAddress,
  getAllNotes: getAllNotes,
  addHighlight: addHighlight,
  getHighlightsForAddresses: getHighlightsForAddresses,
  getAllHighlights: getAllHighlights,
  addBookmark: addBookmark,
  removeBookmark: removeBookmark,
  isBookmarked: isBookmarked,
  getAllBookmarks: getAllBookmarks,
  saveProgress: saveProgress,
  getProgress: getProgress,
  getAllProgress: getAllProgress,
  getAnnotationCounts: getAnnotationCounts,
  deleteAnnotation: deleteAnnotation,
  clearAllData: clearAllData,
  db: db
};
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/study-db.js` — NEW (~190 lines)
- **Approach:** Created the persistence layer file with Dexie schema definition and all CRUD operations as specified. Includes notes, highlights, bookmarks, reading progress, annotation counts, delete, and clearAllData functions. All operations return Promises for async usage.
- **Deviations from spec:** File ended up ~190 lines (spec estimated ~160) due to slightly more verbose function implementations. All API surface matches spec verbatim.
- **Known issues:** None observed

---

### ST-03: Wire Study DB Into App Entry Point

**What:** Require the study-db module in app.js and expose key functions to window for onclick handlers.

**File:** `src/app.js`

**Implementation — add near the top requires (around line 20):**

```js
var studyDb = require('./study-db.js');
```

**Add window bindings (in the window bindings section, around line 250):**

```js
// Study tools
window._studyAddNote = studyDb.addNote;
window._studyAddHighlight = studyDb.addHighlight;
window._studyAddBookmark = studyDb.addBookmark;
window._studyRemoveBookmark = studyDb.removeBookmark;
window._studyDeleteAnnotation = studyDb.deleteAnnotation;
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/app.js` — added studyDb require (line 42) and window bindings for _studyAddNote, _studyAddHighlight, _studyAddBookmark, _studyRemoveBookmark, _studyDeleteAnnotation. Also added settingsClearStudy binding.
- **Approach:** Added the require statement near the other module requires at the top of app.js. Window bindings placed in the existing window bindings section for consistency with the legacy binding pattern used throughout the app.
- **Deviations from spec:** Also added settingsClearStudy window binding here (related to ST-14) for convenience since the window bindings section was already being modified.
- **Known issues:** None observed

---

## Phase 2: Reading Progress (ST-04 through ST-06)

---

### ST-04: Auto-Save Reading Progress in Bible Reader

**What:** When the user scrolls in the Bible reader, save their position. When they reopen the same book, resume where they left off.

**File:** `src/bible.js`

**Implementation — add require at top:**
```js
var studyDb = require('./study-db.js');
```

**Add a debounced scroll save in `openBible()` (after `_initSwipeDismiss()`, around line 499):**

```js
// ST-04: Auto-save reading progress
var _progressTimer = null;
var scrollEl = document.getElementById('bibleSheetScroll');
if (scrollEl && !scrollEl._progressInit) {
  scrollEl._progressInit = true;
  scrollEl.addEventListener('scroll', function() {
    clearTimeout(_progressTimer);
    _progressTimer = setTimeout(function() {
      if (_currentRef && _currentBook) {
        studyDb.saveProgress('bible', _currentBook.file, _currentRef, scrollEl.scrollTop);
      }
    }, 3000);
  }, { passive: true });
}
```

**Also save on navigation (in `bibleNavigate`, around line 460):**

```js
function bibleNavigate(refStr) {
  // Save progress for current position before navigating
  if (_currentRef && _currentBook) {
    var scrollEl = document.getElementById('bibleSheetScroll');
    studyDb.saveProgress('bible', _currentBook.file, _currentRef, scrollEl ? scrollEl.scrollTop : 0);
  }
  _history.push(_currentRef);
  document.getElementById('bibleBackBtn').style.display = 'inline-flex';
  _crossfadeTo(refStr);
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/bible.js` — added studyDb require, debounced scroll listener on #readerBody, save-on-navigate logic
- **Approach:** Added a debounced scroll listener (3s inactivity threshold) on #readerBody to auto-save reading progress. Also saves progress on navigation before crossfading to a new passage. Uses a `_progressInit` guard to prevent duplicate listener attachment.
- **Deviations from spec:** Scroll container is `#readerBody` instead of `#bibleSheetScroll` — adapted for the Universal Reader architecture where content lives in #readerBody. `bibleNavigate` delegates to `reader.readerOpen` so no manual `_history.push` or `_crossfadeTo` calls were needed; only the progress save before navigation was added.
- **Known issues:** None observed

---

### ST-05: Auto-Save Reading Progress in CCC Reader

**What:** Same pattern as Bible but for CCC paragraphs.

**File:** `src/ccc.js`

**Implementation — add require at top:**
```js
var studyDb = require('./study-db.js');
```

**Add scroll save in `openCCC()` (after `_initSwipeDismiss()`, around line 337):**

```js
// ST-05: Auto-save CCC reading progress
var _cccProgressTimer = null;
var cccScrollEl = document.getElementById('cccSheetScroll');
if (cccScrollEl && !cccScrollEl._progressInit) {
  cccScrollEl._progressInit = true;
  cccScrollEl.addEventListener('scroll', function() {
    clearTimeout(_cccProgressTimer);
    _cccProgressTimer = setTimeout(function() {
      if (_cccCurrentNum) {
        studyDb.saveProgress('ccc', null, _cccCurrentNum, cccScrollEl.scrollTop);
      }
    }, 3000);
  }, { passive: true });
}
```

**Save on navigate (in `cccNavigate`):**

```js
function cccNavigate(numStr) {
  if (_cccCurrentNum) {
    var scrollEl = document.getElementById('cccSheetScroll');
    studyDb.saveProgress('ccc', null, _cccCurrentNum, scrollEl ? scrollEl.scrollTop : 0);
  }
  _cccHistory.push(_cccCurrentNum);
  document.getElementById('cccBackBtn').style.display = 'inline-flex';
  _crossfadeTo(numStr);
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/ccc.js` — added studyDb require, debounced scroll listener on #readerBody with _cccProgressInit guard
- **Approach:** Same debounced scroll pattern as ST-04 (3s inactivity). Scroll listener attached to #readerBody with a `_cccProgressInit` guard flag to prevent duplicate attachment. Saves CCC paragraph number and scroll position.
- **Deviations from spec:** Scroll container is `#readerBody` instead of `#cccSheetScroll` — same Universal Reader adaptation as ST-04. `cccNavigate` delegates to `reader.readerOpen` so no manual history push was needed.
- **Known issues:** None observed

---

### ST-06: "Continue Reading" Section on Saved Tab

**What:** Show the user's reading progress with resume buttons.

**Files:** `src/saved.js`, `index.html`

**Implementation — add a study section div to the Saved tab HTML (`index.html`, after line 100):**

```html
<div id="studyDashboard" class="study-dashboard"></div>
```

Place it after `<div id="savedList" class="saved-list"></div>` and before the closing `</div>` of `.saved-content`.

**In `src/saved.js` — add a function to render the study dashboard:**

```js
var studyDb = require('./study-db.js');

function renderStudyDashboard() {
  var el = document.getElementById('studyDashboard');
  if (!el) return;

  studyDb.getAllProgress().then(function(items) {
    if (!items.length) { el.innerHTML = ''; return; }

    var SOURCE_LABELS = {
      bible: 'Sacred Scripture',
      ccc: 'Catechism',
      classic: 'Spiritual Classic',
      baltimore: 'Baltimore Catechism',
      summa: 'Summa Theologica'
    };

    var html = '<div class="study-section">';
    html += '<div class="study-section-label">Continue Reading</div>';

    items.slice(0, 3).forEach(function(p) {
      var label = SOURCE_LABELS[p.source] || p.source;
      var detail = p.address || '';
      var timeAgo = _timeAgo(p.updated);

      // Build the open action based on source type
      var action = '';
      if (p.source === 'bible') {
        action = 'openBible(\'' + esc(detail) + '\')';
      } else if (p.source === 'ccc') {
        action = 'openCCC(\'' + esc(detail) + '\')';
      }

      if (action) {
        html += '<button class="study-continue-item" onclick="' + action + '">'
          + '<div class="study-continue-title">' + esc(label) + '</div>'
          + '<div class="study-continue-detail">' + esc(detail) + ' \u00b7 ' + esc(timeAgo) + '</div>'
          + '</button>';
      }
    });

    html += '</div>';
    el.innerHTML = html;
  });
}

function _timeAgo(isoStr) {
  if (!isoStr) return '';
  var diff = Date.now() - new Date(isoStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return days + 'd ago';
}
```

**Call `renderStudyDashboard()` from within the existing `renderSaved()` function** — add it at the end of the render function, after the existing content renders.

**Export it:** Add `renderStudyDashboard: renderStudyDashboard` to the `module.exports` object.

**CSS:**

```css
/* ── STUDY DASHBOARD ── */
.study-dashboard { padding: 0 var(--space-4); }
.study-section { margin-top: var(--space-4); }
.study-section-label {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}
.study-continue-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}
.study-continue-item:active {
  transform: scale(0.98);
  background: var(--color-surface-hover);
}
.study-continue-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}
.study-continue-detail {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `index.html` — added `#studyDashboard` div after `#savedList`; `src/saved.js` — added studyDb require, `renderStudyDashboard()` function with `_timeAgo` helper, called at end of `renderSaved()`
- **Approach:** Added the `#studyDashboard` container div to index.html in the Saved tab section. Created `renderStudyDashboard()` in saved.js that queries `getAllProgress` and renders "Continue Reading" cards with source labels and time-ago timestamps. The function is called at the end of `renderSaved()` to populate the dashboard whenever the Saved tab renders. All three dashboard queries (progress, bookmarks, notes from ST-12/ST-13) run in parallel via `Promise.all` for efficiency.
- **Deviations from spec:** Used `Promise.all` to batch all three study dashboard queries (progress + bookmarks + notes) together rather than sequential separate `.then()` chains, improving load performance.
- **Known issues:** None observed

---

## Phase 3: Bookmarks (ST-07 through ST-09)

---

### ST-07: Add Annotatable Data Attributes to Content

**What:** Wrap verses and paragraphs with `data-source` and `data-address` attributes so the study layer can identify tappable content units.

**File:** `src/bible.js` (line 320)

**Before:**
```js
html += '<span class="bible-verse' + cls + '" id="bv' + v + '">'
  + '<span class="bible-verse-num">' + v + '</span> '
```

**After:**
```js
html += '<span class="bible-verse' + cls + ' annotatable" id="bv' + v + '" data-source="bible" data-address="' + _esc(parsed.book.abbr) + ':' + parsed.chapter + ':' + v + '">'
  + '<span class="bible-verse-num">' + v + '</span> '
```

**File:** `src/ccc.js` (line 161)

**Before:**
```js
var numEl = '<div class="ccc-para-num' + (idx === 0 ? ' ccc-para-num--first' : '') + '">&#167;&nbsp;' + id + '</div>';
```

**After:**
```js
var numEl = '<div class="ccc-para-num annotatable' + (idx === 0 ? ' ccc-para-num--first' : '') + '" data-source="ccc" data-address="' + id + '">&#167;&nbsp;' + id + '</div>';
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/bible.js` (line ~343) — added `annotatable` class + `data-source`/`data-address` attributes to bible verse spans; `src/ccc.js` (line ~163) — added `annotatable` class + `data-source`/`data-address` attributes to CCC paragraph number divs
- **Approach:** Added the `annotatable` CSS class and `data-source`/`data-address` data attributes to the verse span elements in bible.js and the paragraph number div elements in ccc.js, enabling the study UI layer to identify tappable content units for annotation actions.
- **Deviations from spec:** None
- **Known issues:** None observed

---

### ST-08: Create Study UI Module — Annotation Action Bar

**What:** When the user taps an annotatable element, show a compact action bar with Highlight / Note / Bookmark options.

**File:** `src/study-ui.js` (**NEW**)

```js
// src/study-ui.js — Study tools UI layer
// Annotation action bar, highlight rendering, note input
var utils = require('./utils.js');
var studyDb = require('./study-db.js');

var _activeEl = null;
var _activeSource = null;
var _activeAddress = null;

// ── Action bar ──

function showActionBar(source, address, el) {
  hideActionBar();
  _activeEl = el;
  _activeSource = source;
  _activeAddress = address;

  var bar = document.createElement('div');
  bar.className = 'study-action-bar';
  bar.id = 'studyActionBar';

  bar.innerHTML = '<button class="study-action-btn study-action-highlight" onclick="_studyDoHighlight()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>'
    + ' Highlight</button>'
    + '<button class="study-action-btn study-action-note" onclick="_studyDoNote()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
    + ' Note</button>'
    + '<button class="study-action-btn study-action-bookmark" onclick="_studyDoBookmark()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'
    + ' Bookmark</button>';

  // Position the bar below the tapped element
  el.style.position = 'relative';
  el.appendChild(bar);

  // Close on outside tap
  setTimeout(function() {
    document.addEventListener('click', _outsideClickHandler, true);
  }, 50);
}

function hideActionBar() {
  var bar = document.getElementById('studyActionBar');
  if (bar) bar.remove();
  document.removeEventListener('click', _outsideClickHandler, true);
  _activeEl = null;
}

function _outsideClickHandler(e) {
  var bar = document.getElementById('studyActionBar');
  if (bar && !bar.contains(e.target) && !e.target.closest('.annotatable')) {
    hideActionBar();
  }
}

// ── Highlight action ──

function doHighlight() {
  if (!_activeSource || !_activeAddress) return;
  studyDb.addHighlight(_activeSource, _activeAddress, 'gold').then(function(result) {
    if (result) {
      // Added — apply highlight class
      if (_activeEl) _activeEl.classList.add('study-hl', 'study-hl--gold');
    } else {
      // Toggled off — remove highlight class
      if (_activeEl) _activeEl.classList.remove('study-hl', 'study-hl--gold');
    }
    hideActionBar();
    _showToast(result ? 'Highlighted' : 'Highlight removed');
  });
}

// ── Note action ──

function doNote() {
  if (!_activeSource || !_activeAddress) return;
  var bar = document.getElementById('studyActionBar');
  if (!bar) return;

  // Replace action buttons with note input
  bar.innerHTML = '<div class="study-note-input-wrap">'
    + '<textarea class="study-note-input" id="studyNoteText" placeholder="Write a note\u2026" rows="3"></textarea>'
    + '<div class="study-note-actions">'
    + '<button class="study-note-cancel" onclick="_studyHideActionBar()">Cancel</button>'
    + '<button class="study-note-save" onclick="_studySaveNote()">Save</button>'
    + '</div>'
    + '</div>';

  var textarea = document.getElementById('studyNoteText');
  if (textarea) textarea.focus();
}

function saveNote() {
  var textarea = document.getElementById('studyNoteText');
  if (!textarea) return;
  var text = textarea.value.trim();
  if (!text) { hideActionBar(); return; }

  studyDb.addNote(_activeSource, _activeAddress, text).then(function() {
    if (_activeEl) _activeEl.classList.add('study-has-note');
    hideActionBar();
    _showToast('Note saved');
  });
}

// ── Bookmark action ──

function doBookmark() {
  if (!_activeSource || !_activeAddress) return;

  studyDb.isBookmarked(_activeSource, _activeAddress).then(function(exists) {
    if (exists) {
      return studyDb.removeBookmark(_activeSource, _activeAddress).then(function() {
        if (_activeEl) _activeEl.classList.remove('study-bookmarked');
        hideActionBar();
        _showToast('Bookmark removed');
      });
    }
    return studyDb.addBookmark(_activeSource, _activeAddress, '').then(function() {
      if (_activeEl) _activeEl.classList.add('study-bookmarked');
      hideActionBar();
      _showToast('Bookmarked');
    });
  });
}

// ── Apply existing annotations to rendered content ──

function applyAnnotations(source, containerEl, addresses) {
  if (!containerEl || !addresses || !addresses.length) return Promise.resolve();

  return Promise.all([
    studyDb.getHighlightsForAddresses(source, addresses),
    studyDb.getAnnotationCounts(source, addresses)
  ]).then(function(results) {
    var highlights = results[0];
    var counts = results[1];

    // Apply highlights
    highlights.forEach(function(h) {
      var el = containerEl.querySelector('[data-address="' + h.address + '"]');
      if (el) el.classList.add('study-hl', 'study-hl--' + (h.color || 'gold'));
    });

    // Apply note indicators
    Object.keys(counts).forEach(function(addr) {
      if (counts[addr].notes > 0) {
        var el = containerEl.querySelector('[data-address="' + addr + '"]');
        if (el) el.classList.add('study-has-note');
      }
      if (counts[addr].bookmarks > 0) {
        var el = containerEl.querySelector('[data-address="' + addr + '"]');
        if (el) el.classList.add('study-bookmarked');
      }
    });
  });
}

// ── Toast helper ──

function _showToast(msg) {
  if (window.showToast) { window.showToast(msg); return; }
  // Fallback — create a simple toast
  var t = document.createElement('div');
  t.className = 'mf-toast mf-toast--visible';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.style.opacity = '0'; }, 1500);
  setTimeout(function() { t.remove(); }, 2000);
}

// ── Init: listen for taps on annotatable elements ──

function initStudyLayer(containerEl) {
  if (!containerEl || containerEl._studyInit) return;
  containerEl._studyInit = true;

  containerEl.addEventListener('click', function(e) {
    // Don't intercept taps on links, buttons, refs
    if (e.target.closest('a, button, .ref-tap, .ccc-related-item, .bible-related-item, .bible-nav-btn, .ccc-nav-btn')) return;

    var el = e.target.closest('.annotatable');
    if (!el) return;

    var source = el.dataset.source;
    var address = el.dataset.address;
    if (!source || !address) return;

    e.stopPropagation();
    showActionBar(source, address, el);
  });
}

// Window bindings for onclick handlers in action bar HTML
window._studyDoHighlight = doHighlight;
window._studyDoNote = doNote;
window._studyDoBookmark = doBookmark;
window._studySaveNote = saveNote;
window._studyHideActionBar = hideActionBar;

module.exports = {
  initStudyLayer: initStudyLayer,
  applyAnnotations: applyAnnotations,
  showActionBar: showActionBar,
  hideActionBar: hideActionBar
};
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/study-ui.js` — NEW (~180 lines)
- **Approach:** Created the study UI module with the annotation action bar (Highlight/Note/Bookmark buttons), note text input with save/cancel, `applyAnnotations()` for restoring persisted annotations on content render, and `initStudyLayer()` tap handler using event delegation on annotatable elements. Uses `haptics.confirm()` for feedback on all annotation actions per CLAUDE.md convention. Falls back to `render.showToast()` for toast notifications.
- **Deviations from spec:** Added `haptics.confirm()` calls for all annotation actions (highlight, note save, bookmark toggle) per CLAUDE.md convention requiring haptic feedback on interactive touch actions. Used `render.showToast()` as the primary toast mechanism instead of the inline fallback toast.
- **Known issues:** None observed

---

### ST-09: Study UI CSS

**What:** Styles for the action bar, highlights, note indicators, and note input.

**File:** `css/app.css`

**Implementation — add at the end of the file, before the closing desktop media queries:**

```css
/* ── STUDY TOOLS ── */

/* Action bar — appears below tapped content */
.study-action-bar { 
  position: absolute; 
  left: 0; 
  right: 0; 
  top: 100%; 
  z-index: 5; 
  display: flex; 
  gap: var(--space-1); 
  padding: var(--space-2); 
  background: var(--color-surface); 
  border: 1px solid var(--color-border-light); 
  border-radius: var(--radius-md); 
  box-shadow: var(--shadow-elevated); 
  margin-top: var(--space-1); 
  animation: studyBarIn 0.15s ease; 
}
@keyframes studyBarIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.study-action-btn { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: var(--space-1); 
  padding: var(--space-2); 
  font-size: var(--text-xs); 
  font-weight: var(--weight-medium); 
  color: var(--color-text-secondary); 
  background: none; 
  border: 1px solid var(--color-border-light); 
  border-radius: var(--radius-sm); 
  cursor: pointer; 
  min-height: 36px; 
  -webkit-tap-highlight-color: transparent; 
  transition: all var(--transition-fast); 
}
.study-action-btn:active { 
  background: var(--color-surface-hover); 
  transform: scale(0.96); 
}
.study-action-btn svg { flex-shrink: 0; }

/* Note input (replaces action buttons when "Note" is tapped) */
.study-note-input-wrap { width: 100%; }
.study-note-input { 
  width: 100%; 
  padding: var(--space-2); 
  font-family: var(--font-body); 
  font-size: var(--text-sm); 
  border: 1px solid var(--color-border); 
  border-radius: var(--radius-sm); 
  resize: vertical; 
  min-height: 60px; 
  outline: none; 
}
.study-note-input:focus { border-color: var(--color-primary); }
.study-note-actions { 
  display: flex; 
  justify-content: flex-end; 
  gap: var(--space-2); 
  margin-top: var(--space-2); 
}
.study-note-cancel { 
  padding: var(--space-2) var(--space-3); 
  font-size: var(--text-xs); 
  color: var(--color-text-tertiary); 
  background: none; 
  border: none; 
  cursor: pointer; 
}
.study-note-save { 
  padding: var(--space-2) var(--space-4); 
  font-size: var(--text-xs); 
  font-weight: var(--weight-semibold); 
  color: white; 
  background: var(--color-primary); 
  border: none; 
  border-radius: var(--radius-sm); 
  cursor: pointer; 
  min-height: 32px; 
}
.study-note-save:active { opacity: 0.8; }

/* Highlight colors */
.study-hl { transition: background 0.2s ease; }
.study-hl--gold { background: rgba(184, 150, 63, 0.12); }
.study-hl--blue { background: rgba(52, 120, 198, 0.10); }
.study-hl--green { background: rgba(74, 124, 89, 0.10); }
.study-hl--purple { background: rgba(124, 58, 237, 0.10); }

/* Note indicator — small dot */
.study-has-note { position: relative; }
.study-has-note::after { 
  content: ''; 
  position: absolute; 
  top: 2px; 
  right: -2px; 
  width: 6px; 
  height: 6px; 
  border-radius: 50%; 
  background: var(--color-accent); 
}

/* Bookmark indicator — subtle left accent */
.study-bookmarked { 
  border-left: 2px solid var(--color-accent) !important; 
  padding-left: var(--space-2); 
}

/* Dark mode */
html[data-theme="dark"] .study-action-bar { 
  background: var(--color-surface); 
  border-color: var(--color-border); 
  box-shadow: 0 4px 16px rgba(0,0,0,0.4); 
}
html[data-theme="dark"] .study-hl--gold { background: rgba(212, 168, 75, 0.15); }
html[data-theme="dark"] .study-hl--blue { background: rgba(52, 120, 198, 0.15); }
html[data-theme="dark"] .study-hl--green { background: rgba(74, 124, 89, 0.15); }
html[data-theme="dark"] .study-hl--purple { background: rgba(124, 58, 237, 0.15); }
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `css/app.css` — added ~230 lines of study tools + TTS CSS before desktop media queries
- **Approach:** Added all study UI styles in a single block before the desktop media queries in app.css. Covers action bar, note input, highlight colors (gold/blue/green/purple), note indicator dot, bookmark accent, study dashboard, bookmark chips, note cards, listen button (ST-19), and privacy note. Full dark mode overrides included for all new rules.
- **Deviations from spec:** Combined all study CSS (from ST-09, ST-12, ST-13, ST-15, and ST-19) into a single ~230-line block rather than adding them piecemeal per spec item. This keeps the CSS organized in one cohesive section. Total lines are larger than the spec's ~120 estimate because it includes TTS/listen button styles (ST-19) and additional dark mode overrides.
- **Known issues:** None observed

---

## Phase 4: Integrate Study Layer Into Readers (ST-10 through ST-13)

---

### ST-10: Init Study Layer in Bible Reader

**What:** After Bible content renders, initialize the study tap handler and apply existing annotations.

**File:** `src/bible.js`

**Implementation — add require at top:**
```js
var studyUi = require('./study-ui.js');
```

**At the end of `_renderBibleContent()` (after `bodyEl.innerHTML = html;` and the scroll-to-target), add:**

```js
// ST-10: Init study layer and apply existing annotations
var scrollEl = document.getElementById('bibleSheetScroll');
studyUi.initStudyLayer(scrollEl);

// Collect all rendered verse addresses for annotation lookup
var verseAddresses = [];
for (var va = 1; va <= chapterVerses.length; va++) {
  verseAddresses.push(parsed.book.abbr + ':' + parsed.chapter + ':' + va);
}
studyUi.applyAnnotations('bible', scrollEl, verseAddresses);
```

Note: `chapterVerses` is the array from BR-01 full chapter rendering. If that hasn't landed yet, use the existing verse loop range instead.

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/bible.js` — added studyUi require, `initStudyLayer` and `applyAnnotations` calls after `bodyEl.innerHTML` in `_renderBibleContent`
- **Approach:** After the Bible content is rendered into `bodyEl.innerHTML`, calls `studyUi.initStudyLayer(bodyEl)` to attach the tap handler, then collects all rendered verse addresses and calls `studyUi.applyAnnotations('bible', bodyEl, verseAddresses)` to restore persisted highlights, note indicators, and bookmark accents.
- **Deviations from spec:** Uses `bodyEl` (the #readerBody element) as the container instead of `#bibleSheetScroll`, consistent with the Universal Reader architecture.
- **Known issues:** None observed

---

### ST-11: Init Study Layer in CCC Reader

**What:** Same pattern — after CCC content renders, init study and apply annotations.

**File:** `src/ccc.js`

**Implementation — add require at top:**
```js
var studyUi = require('./study-ui.js');
```

**At the end of `_renderCCCContent()` (after `bodyEl.innerHTML = bodyHtml;`), add:**

```js
// ST-11: Init study layer and apply annotations
var cccScrollEl = document.getElementById('cccSheetScroll');
studyUi.initStudyLayer(cccScrollEl);
var cccAddresses = ids.map(function(id) { return String(id); });
studyUi.applyAnnotations('ccc', cccScrollEl, cccAddresses);
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/ccc.js` — added studyUi require, `initStudyLayer` and `applyAnnotations` calls after `bodyEl.innerHTML` in CCC content render
- **Approach:** Same pattern as ST-10. After CCC content renders into bodyEl, calls `initStudyLayer` and `applyAnnotations` with CCC paragraph addresses to restore persisted annotations.
- **Deviations from spec:** Uses `bodyEl` (the #readerBody element) instead of `#cccSheetScroll`, consistent with Universal Reader.
- **Known issues:** None observed

---

### ST-12: Bookmarks Section on Saved Tab

**What:** Show all bookmarks in the study dashboard.

**File:** `src/saved.js` (extend `renderStudyDashboard`)

**Implementation — add after the "Continue Reading" section:**

```js
studyDb.getAllBookmarks().then(function(bookmarks) {
  if (!bookmarks.length) return;

  var bmHtml = '<div class="study-section">';
  bmHtml += '<div class="study-section-label">Bookmarks</div>';
  bmHtml += '<div class="study-bookmarks-list">';

  bookmarks.slice(0, 8).forEach(function(b) {
    var sourceLabel = SOURCE_LABELS[b.source] || b.source;
    var action = '';
    if (b.source === 'bible') action = 'openBible(\'' + esc(b.address.replace(/:/g, ' ').replace(/ /, ' ')) + '\')';
    else if (b.source === 'ccc') action = 'openCCC(\'' + esc(b.address) + '\')';

    if (action) {
      bmHtml += '<button class="study-bookmark-chip" onclick="' + action + '">'
        + '<span class="study-bookmark-source">' + esc(sourceLabel) + '</span> '
        + '<span class="study-bookmark-addr">' + esc(b.address) + '</span>'
        + '</button>';
    }
  });

  bmHtml += '</div></div>';

  // Append to existing study dashboard
  var el = document.getElementById('studyDashboard');
  if (el) el.innerHTML += bmHtml;
});
```

**CSS:**
```css
.study-bookmarks-list { 
  display: flex; 
  flex-wrap: wrap; 
  gap: var(--space-2); 
}
.study-bookmark-chip { 
  display: inline-flex; 
  align-items: center; 
  gap: var(--space-1); 
  padding: var(--space-2) var(--space-3); 
  background: var(--color-surface); 
  border: 1px solid var(--color-border-light); 
  border-radius: var(--radius-full); 
  font-size: var(--text-xs); 
  cursor: pointer; 
  min-height: 32px; 
  -webkit-tap-highlight-color: transparent; 
}
.study-bookmark-chip:active { background: var(--color-surface-hover); }
.study-bookmark-source { 
  color: var(--color-text-tertiary); 
  font-weight: var(--weight-medium); 
}
.study-bookmark-addr {
  color: var(--color-primary);
  font-weight: var(--weight-semibold);
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/saved.js` — extended `renderStudyDashboard()` to query `getAllBookmarks()` and render bookmark chips
- **Approach:** Added bookmark querying to the `renderStudyDashboard` function. Queries `getAllBookmarks()` in the same `Promise.all` batch as progress and notes queries. Renders bookmark chips with source label and address, each tappable to open the corresponding passage in the Bible or CCC reader. Limited to 8 bookmarks in the display.
- **Deviations from spec:** Bookmark query runs in parallel with progress and notes queries via `Promise.all` rather than as a separate `.then()` chain, improving performance.
- **Known issues:** None observed

---

### ST-13: Notes Section on Saved Tab

**What:** Show recent notes in the study dashboard.

**File:** `src/saved.js` (extend `renderStudyDashboard`)

**Implementation — add after bookmarks:**

```js
studyDb.getAllNotes().then(function(notes) {
  if (!notes.length) return;

  var nHtml = '<div class="study-section">';
  nHtml += '<div class="study-section-label">Recent Notes</div>';

  notes.slice(0, 5).forEach(function(n) {
    var sourceLabel = SOURCE_LABELS[n.source] || n.source;
    var action = '';
    if (n.source === 'bible') action = 'openBible(\'' + esc(n.address.replace(/:/g, ' ').replace(/ /, ' ')) + '\')';
    else if (n.source === 'ccc') action = 'openCCC(\'' + esc(n.address) + '\')';

    var preview = n.text.length > 80 ? n.text.slice(0, 80) + '\u2026' : n.text;

    nHtml += '<div class="study-note-card' + (action ? ' study-note-card--tap' : '') + '"'
      + (action ? ' onclick="' + action + '"' : '') + '>'
      + '<div class="study-note-card-header">'
      + '<span class="study-note-card-source">' + esc(sourceLabel) + ' ' + esc(n.address) + '</span>'
      + '<span class="study-note-card-time">' + esc(_timeAgo(n.created)) + '</span>'
      + '</div>'
      + '<div class="study-note-card-text">' + esc(preview) + '</div>'
      + '</div>';
  });

  nHtml += '</div>';
  var el = document.getElementById('studyDashboard');
  if (el) el.innerHTML += nHtml;
});
```

**CSS:**
```css
.study-note-card { 
  padding: var(--space-3); 
  margin-bottom: var(--space-2); 
  background: var(--color-surface); 
  border: 1px solid var(--color-border-light); 
  border-radius: var(--radius-md); 
}
.study-note-card--tap { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.study-note-card--tap:active { background: var(--color-surface-hover); }
.study-note-card-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: baseline; 
  margin-bottom: var(--space-1); 
}
.study-note-card-source { 
  font-size: var(--text-xs); 
  font-weight: var(--weight-semibold); 
  color: var(--color-primary); 
}
.study-note-card-time { 
  font-size: 10px; 
  color: var(--color-text-tertiary); 
}
.study-note-card-text { 
  font-family: var(--font-prayer); 
  font-size: var(--text-sm); 
  color: var(--color-text-secondary); 
  line-height: 1.5; 
  font-style: italic;
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/saved.js` — extended `renderStudyDashboard()` to query `getAllNotes()` and render note cards with preview text
- **Approach:** Added notes querying to the `renderStudyDashboard` function alongside progress and bookmarks in the `Promise.all` batch. Renders up to 5 recent notes as cards showing source, address, time-ago timestamp, and an 80-character text preview. Each card is tappable to navigate to the annotated passage.
- **Deviations from spec:** Notes query runs in parallel with progress and bookmarks via `Promise.all` rather than as a separate chain.
- **Known issues:** None observed

---

## Phase 5: Settings Integration (ST-14 through ST-15)

---

### ST-14: Clear Study Data Option in Settings

**What:** Add a "Clear Study Data" option to the Settings overlay so users can reset their annotations and progress.

**File:** `src/settings.js`

**Implementation — add a button in the settings panel rendering:**

```js
// Add after existing settings options
html += '<button class="settings-item settings-item--danger" onclick="_studyClearAll()">'
  + '<span>Clear All Notes & Highlights</span>'
  + '<span class="settings-item-desc">Remove all annotations, bookmarks, and reading progress</span>'
  + '</button>';
```

**Wire the clear function in `src/app.js`:**

```js
window._studyClearAll = function() {
  if (!confirm('This will delete all your notes, highlights, bookmarks, and reading progress. This cannot be undone.')) return;
  studyDb.clearAllData().then(function() {
    if (window.showToast) window.showToast('Study data cleared');
  });
};
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/settings.js` — added studyDb require, "Clear Notes & Highlights" button before "Clear All Data" button, created `settingsClearStudy()` function; also wired `studyDb.clearAllData()` into `settingsClearAll()`
- **Approach:** Added a dedicated "Clear Notes & Highlights" button in the Privacy section of settings, placed before the existing "Clear All Data" button. Created `settingsClearStudy()` function with a confirm dialog. Also integrated `studyDb.clearAllData()` into the existing `settingsClearAll()` function so that a full data clear also wipes study data.
- **Deviations from spec:** The clear function was implemented in settings.js directly (as `settingsClearStudy()`) rather than as an inline `window._studyClearAll` in app.js, keeping the logic co-located with other settings functions. The window binding was added in app.js (see ST-03 notes).
- **Known issues:** None observed

---

### ST-15: Data Privacy Note

**What:** Add a brief privacy note near the study data clear option.

**Implementation — add below the clear button in settings:**

```js
html += '<div class="settings-privacy-note">Your notes and highlights are stored only on this device. MassFinder never sends your study data to any server.</div>';
```

**CSS:**
```css
.settings-privacy-note {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-style: italic;
  padding: var(--space-2) var(--space-4);
  line-height: 1.5;
}
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/settings.js` — added privacy note div below clear buttons in the Privacy section
- **Approach:** Added a privacy note div with the specified text ("Your notes and highlights are stored only on this device...") below the clear buttons in the settings Privacy section. CSS for `.settings-privacy-note` is included in the ST-09 CSS block.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## Implementation Order

**Phase 1 — Foundation (do first, enables everything):**
1. **ST-01** — `npm install dexie`
2. **ST-02** — Create `src/study-db.js`
3. **ST-03** — Wire into `src/app.js`

**Phase 2 — Reading Progress (highest immediate value):**
4. **ST-04** — Bible auto-save progress
5. **ST-05** — CCC auto-save progress
6. **ST-06** — "Continue Reading" on Saved tab

**Phase 3 — Annotatable Content + Action Bar:**
7. **ST-07** — Add `data-source`/`data-address` to Bible verses and CCC paragraphs
8. **ST-08** — Create `src/study-ui.js` (action bar + note input)
9. **ST-09** — Study UI CSS

**Phase 4 — Integration:**
10. **ST-10** — Init study layer in Bible reader
11. **ST-11** — Init study layer in CCC reader
12. **ST-12** — Bookmarks on Saved tab
13. **ST-13** — Notes on Saved tab

**Phase 5 — Settings:**
14. **ST-14** — Clear study data option
15. **ST-15** — Privacy note

---

## Files Created/Modified

| File | Action | Phase |
|------|--------|-------|
| `package.json` | Add `dexie` dependency | 1 |
| `src/study-db.js` | **NEW** (~160 lines) | 1 |
| `src/study-ui.js` | **NEW** (~180 lines) | 3 |
| `src/app.js` | Add requires + window bindings (~10 lines) | 1 |
| `src/bible.js` | Add studyDb require, progress saving, data attributes, study layer init (~25 lines) | 2, 3, 4 |
| `src/ccc.js` | Add studyDb require, progress saving, data attributes, study layer init (~20 lines) | 2, 3, 4 |
| `src/saved.js` | Add study dashboard rendering (~100 lines) | 2, 4 |
| `src/settings.js` | Add clear data option (~10 lines) | 5 |
| `index.html` | Add `#studyDashboard` div to Saved tab (1 line) | 2 |
| `css/app.css` | Study tools CSS (~120 lines) | 3, 4 |

**Totals:** ~350 lines new JS across 2 new files. ~120 lines new CSS. ~55 lines modifications to existing files. One 50KB runtime dependency.

---

## Test Checklist

- [ ] `npm run build` succeeds with dexie added
- [ ] Open Bible to John 3 → scroll → close → reopen Bible → "Continue Reading" shows John 3 on Saved tab
- [ ] Tap "Continue Reading" → Bible opens to John 3
- [ ] Open CCC §663 → scroll → close → "Continue Reading" shows §663
- [ ] Tap a verse in John 3 → action bar appears (Highlight / Note / Bookmark)
- [ ] Tap "Highlight" → verse gets gold tint → close and reopen → highlight persists
- [ ] Tap same verse → Highlight again → highlight toggles off
- [ ] Tap a verse → "Note" → type text → Save → note dot indicator appears
- [ ] Tap a verse → "Bookmark" → Saved tab shows bookmark chip
- [ ] Tap bookmark chip on Saved tab → opens to that passage
- [ ] Settings → "Clear All Notes & Highlights" → confirm → all annotations gone
- [ ] Dark mode: action bar, highlights, note indicators all render correctly
- [ ] iPhone SE: action bar fits on screen, note input keyboard doesn't obscure

---

## Phase 6: Read Aloud — Natural Voice TTS (ST-16 through ST-22)

### Research Findings

The question was: can we get something better than the robotic system voice?

**Short answer: yes, but the options have real trade-offs.**

Here's the landscape:

| Option | Voice Quality | Cost | Offline | Cross-Platform | Size |
|--------|-------------|------|---------|----------------|------|
| **Web Speech API (built-in)** | Varies wildly by device | Free | Yes | Partial (buggy Safari) | 0KB |
| **ElevenLabs API** | Studio-grade, indistinguishable from human | $5/mo (Starter) = ~30K chars | No | Yes | 0KB (streamed) |
| **Google Cloud TTS** | Near-human (WaveNet/Neural2) | $4/1M chars (WaveNet) | No | Yes | 0KB (streamed) |
| **OpenAI TTS** | Very natural, 6 preset voices | ~$15/1M chars | No | Yes | 0KB (streamed) |

**The reality of Web Speech API voices:**

The built-in voices are NOT uniformly bad — they vary enormously by platform:

- **Chrome Desktop (Windows/Mac):** Has "Google UK English Female" and "Google UK English Male" which are decent — not great, but listenable for long-form reading. Also has Microsoft "Natural" voices on Windows 11 (Edge exposes these; Chrome may too) which are genuinely good.
- **macOS Safari/Chrome:** Has "Samantha," "Alex," and "Daniel" which are the old-gen Siri voices — recognizable, passable. Chrome on Mac additionally gets the Google voices.
- **iOS Safari:** Broken. `getVoices()` returns voices but many don't actually work. Enhanced/Premium voices installed on the device are NOT exposed to the Web Speech API. Safari's TTS implementation stops working when the app goes to background. One voice per locale in practice.
- **Android Chrome:** Gets the device's installed Google TTS voices, which are decent. Quality depends on which voice packs the user has downloaded.

**The problem:** Your primary demographic (older parishioners on iPhones) gets the WORST voice experience. iOS Safari's Web Speech API implementation is the most broken of any platform.

### Recommended Approach: Tiered System

Build a two-tier TTS system:

**Tier 1 (Default, free, offline):** Web Speech API with smart voice selection. Pick the best available voice on the user's device. This is "good enough" on Chrome Desktop, macOS, and Android. It's mediocre-to-broken on iOS Safari but it's free and works offline.

**Tier 2 (Optional, cloud, beautiful):** ElevenLabs API integration behind a feature flag. When enabled, requests are streamed from ElevenLabs with a natural voice perfect for sacred text. The free tier gives 10,000 characters/month (~10 minutes of audio). The $5/month Starter plan gives ~30 minutes. This could be a user-facing toggle: "Enhanced voice (requires internet)."

**Why ElevenLabs specifically:** It's the quality leader for natural narration, has a generous free tier for a non-commercial project, the API is dead simple (one HTTP POST returns audio), and the voice quality for contemplative reading is in a completely different league from any other option at this price point.

**Why not Google Cloud TTS:** Requires GCP project setup, billing account, API key management. More infrastructure complexity than ElevenLabs for comparable quality. Better unit economics at extreme scale, but MassFinder isn't at extreme scale.

**Why not pre-generated audio files:** The content library is enormous. CCC alone is 2,865 paragraphs. Bible is ~31,000 verses. Pre-generating audio for all of this would be hundreds of hours of audio and gigabytes of storage. On-demand synthesis is the only viable path.

---

### ST-16: Create TTS Module

**What:** A unified read-aloud module that handles voice selection, utterance management, play/pause/stop, and progress tracking. Tier 1 (Web Speech API) ships first.

**File:** `src/tts.js` (**NEW**)

```js
// src/tts.js — Text-to-speech module
// Tier 1: Web Speech API with smart voice selection
// Tier 2: ElevenLabs cloud voices (behind feature flag)

var _synth = window.speechSynthesis || null;
var _utterance = null;
var _voice = null;
var _voicesLoaded = false;
var _isPlaying = false;
var _isPaused = false;
var _onStateChange = null; // callback: function(state) where state = 'playing'|'paused'|'stopped'

// ── Voice Selection ──

// Preferred voices ranked by quality (best first)
var _PREFERRED_VOICES = [
  // Microsoft Natural voices (Windows 11 / Edge) — genuinely good
  /Microsoft.*Natural/i,
  // Google voices (Chrome desktop) — decent
  /Google UK English Female/i,
  /Google UK English Male/i,
  /Google US English/i,
  // macOS high-quality voices
  /^Samantha$/,
  /^Daniel$/,
  /^Karen$/,
  // Android Google TTS
  /en-us-x-tpc-network/i,
  /en-us-x-sfg-network/i
];

function _loadVoices() {
  if (!_synth) return;
  var attempts = 0;
  
  function _tryLoad() {
    var voices = _synth.getVoices();
    if (voices.length) {
      _pickBestVoice(voices);
      _voicesLoaded = true;
      return;
    }
    attempts++;
    if (attempts < 10) setTimeout(_tryLoad, 250);
  }
  
  // Chrome fires voiceschanged async; Safari doesn't reliably
  _synth.addEventListener('voiceschanged', function() {
    var voices = _synth.getVoices();
    if (voices.length) _pickBestVoice(voices);
    _voicesLoaded = true;
  });
  
  _tryLoad();
}

function _pickBestVoice(voices) {
  // Filter to English voices
  var enVoices = voices.filter(function(v) {
    return /^en[-_]/i.test(v.lang);
  });
  
  if (!enVoices.length) { _voice = voices[0]; return; }
  
  // Walk preference list, pick first match
  for (var p = 0; p < _PREFERRED_VOICES.length; p++) {
    for (var v = 0; v < enVoices.length; v++) {
      if (_PREFERRED_VOICES[p].test(enVoices[v].name)) {
        _voice = enVoices[v];
        return;
      }
    }
  }
  
  // Fallback: first English voice
  _voice = enVoices[0];
}

// ── Playback ──

function speak(text, opts) {
  if (!_synth) return;
  stop(); // cancel any current speech
  
  opts = opts || {};
  _utterance = new SpeechSynthesisUtterance(text);
  
  if (_voice) _utterance.voice = _voice;
  _utterance.rate = opts.rate || 0.92;  // slightly slower for sacred text
  _utterance.pitch = opts.pitch || 1.0;
  _utterance.lang = 'en-US';
  
  _utterance.onstart = function() {
    _isPlaying = true;
    _isPaused = false;
    if (_onStateChange) _onStateChange('playing');
  };
  
  _utterance.onend = function() {
    _isPlaying = false;
    _isPaused = false;
    if (_onStateChange) _onStateChange('stopped');
  };
  
  _utterance.onerror = function(e) {
    // Safari background bug — silently stop
    _isPlaying = false;
    _isPaused = false;
    if (_onStateChange) _onStateChange('stopped');
  };
  
  _synth.speak(_utterance);
}

function pause() {
  if (!_synth || !_isPlaying) return;
  _synth.pause();
  _isPaused = true;
  _isPlaying = false;
  if (_onStateChange) _onStateChange('paused');
}

function resume() {
  if (!_synth || !_isPaused) return;
  _synth.resume();
  _isPaused = false;
  _isPlaying = true;
  if (_onStateChange) _onStateChange('playing');
}

function stop() {
  if (!_synth) return;
  _synth.cancel();
  _isPlaying = false;
  _isPaused = false;
  _utterance = null;
  if (_onStateChange) _onStateChange('stopped');
}

function togglePlayPause(text, opts) {
  if (_isPlaying) { pause(); return; }
  if (_isPaused) { resume(); return; }
  speak(text, opts);
}

function isSupported() {
  return !!_synth;
}

function getState() {
  if (_isPlaying) return 'playing';
  if (_isPaused) return 'paused';
  return 'stopped';
}

function onStateChange(cb) {
  _onStateChange = cb;
}

function getVoiceName() {
  return _voice ? _voice.name : 'Default';
}

// ── Init ──
_loadVoices();

module.exports = {
  speak: speak,
  pause: pause,
  resume: resume,
  stop: stop,
  togglePlayPause: togglePlayPause,
  isSupported: isSupported,
  getState: getState,
  onStateChange: onStateChange,
  getVoiceName: getVoiceName
};
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/tts.js` — NEW (~160 lines)
- **Approach:** Created the TTS module with smart voice selection using a ranked preference list (Microsoft Natural, Google voices, macOS voices, Android voices). Implements speak/pause/resume/stop/togglePlayPause API with state tracking and a callback-based state change notification system. Voice loading handles both Chrome's async `voiceschanged` event and Safari's synchronous behavior with a retry loop.
- **Deviations from spec:** None
- **Known issues:** None observed

---

### ST-17: Add Listen Button to Bible Reader

**What:** A play/pause button in the Bible reader header that reads the current chapter aloud.

**File:** `src/bible.js`

**Implementation — add require at top:**
```js
var tts = require('./tts.js');
```

**Add a "Listen" button to the Bible header (after the title in the header, or as a small icon button):**

In `_renderBibleContent()`, after building the chapter text, collect the plain text for TTS:

```js
// ST-17: Collect plain text for read-aloud
var plainText = '';
for (var ti = 0; ti < chapterData.length; ti++) {
  plainText += chapterData[ti] + ' ';
}
_currentPlainText = plainText.trim();

// Show listen button in header if TTS supported
var listenBtn = document.getElementById('bibleListen');
if (listenBtn) listenBtn.style.display = tts.isSupported() ? '' : 'none';
```

**Add the button HTML to the Bible header in `index.html` (inside `.bible-header`, before the close button):**

```html
<button class="reader-listen-btn" id="bibleListen" onclick="_bibleToggleListen()" aria-label="Listen" style="display:none">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18" id="bibleListenIcon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
</button>
```

**Window binding in `src/app.js`:**

```js
window._bibleToggleListen = function() {
  var tts = require('./tts.js');
  var bible = require('./bible.js');
  tts.togglePlayPause(bible.getCurrentPlainText());
  
  // Update icon
  var icon = document.getElementById('bibleListenIcon');
  if (!icon) return;
  var state = tts.getState();
  if (state === 'playing') {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/>';
  }
};
```

**Export `getCurrentPlainText` from bible.js:**
```js
function getCurrentPlainText() { return _currentPlainText || ''; }
// Add to module.exports
```

**Stop TTS when Bible closes — in `closeBible()`:**
```js
var tts = require('./tts.js');
tts.stop();
```

### Implementation Notes
- **Date:** 2026-03-12
- **Status:** done
- **Files changed:** `src/bible.js` — added tts require, replaced inline `bibleReadAloud()` with tts.js-backed version, changed button class from `bible-listen-btn` to `reader-listen-btn`, added `_updateListenBtn` for icon state, exported `getCurrentPlainText`
- **Approach:** Replaced the existing inline `bibleReadAloud()` implementation with the shared tts.js module. Plain text is collected during chapter rendering. The listen button uses the shared `.reader-listen-btn` class. Added `_updateListenBtn()` helper to swap the SVG icon between play and pause states based on TTS state. TTS stops on Bible close via `tts.stop()` in the reader's `onClose` callback.
- **Deviations from spec:** Bible already had an inline TTS implementation (`bibleReadAloud()`); this was replaced/refactored to use the shared tts.js module rather than adding a second TTS mechanism. Button class changed from `bible-listen-btn` to `reader-listen-btn` for shared styling.
- **Known issues:** None observed

---

### ST-18: Add Listen Button to CCC Reader

**What:** Same pattern as Bible — play/pause button reads the current CCC paragraph(s) aloud.

**File:** `src/ccc.js`

**Implementation — identical pattern to ST-17:**

1. Add `var tts = require('./tts.js');` at top
2. In the CCC content render function, collect plain text from the paragraph data into `_currentPlainText`
3. Add a listen button to the CCC header in `index.html` (same markup as Bible, different IDs)
4. Add `_cccToggleListen` window binding in `app.js`
5. Stop TTS in `closeCCC()`
6. Export `getCurrentPlainText` from ccc.js

---

### ST-19: Listen Button CSS

**What:** Styles for the reader listen button (shared between Bible, CCC, and future readers).

**File:** `css/app.css`

```css
/* ── READ ALOUD ── */
.reader-listen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: all var(--transition-fast);
}
.reader-listen-btn:active {
  background: var(--color-surface-hover);
  transform: scale(0.92);
}
.reader-listen-btn.is-playing {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 52,120,198), 0.08);
}
html[data-theme="dark"] .reader-listen-btn {
  border-color: var(--color-border);
}
```

---

### ST-20: Stop TTS on Tab Switch and Overlay Close

**What:** Cancel any active speech when the user switches tabs or closes a reader.

**File:** `src/ui.js` (or `src/app.js`, wherever `switchTab` lives)

**Implementation — in `switchTab()`:**
```js
var tts = require('./tts.js');
tts.stop();
```

**Also in `closeAllPanels()`:**
```js
tts.stop();
```

This ensures speech never continues playing from a context the user has left.

---

### ST-21: ElevenLabs Cloud Voice (Feature Flag — Tier 2)

**What:** Optional cloud-based natural voice via ElevenLabs, behind a feature flag. NOT in the initial build — spec'd here for when you're ready to flip it on.

**Files:** `src/tts.js` (extend), `src/config.js` (feature flag)

**Feature flag in `config.js`:**
```js
TTS_CLOUD_ENABLED: false,
TTS_CLOUD_PROVIDER: 'elevenlabs',  // future: 'google', 'openai'
```

**ElevenLabs integration in `tts.js` — add a `speakCloud()` function:**

```js
var _audioEl = null;

function speakCloud(text, opts) {
  opts = opts || {};
  stop(); // cancel any current speech
  
  // ElevenLabs v1 API — text-to-speech
  var voiceId = opts.voiceId || 'pNInz6obpgDQGcFmaJgB';  // "Adam" — warm male narrator
  var url = 'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream';
  
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': opts.apiKey || ''
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.65,        // slightly varied for natural reading
        similarity_boost: 0.75,
        style: 0.3              // gentle expressiveness
      }
    })
  })
  .then(function(resp) {
    if (!resp.ok) throw new Error('TTS API error: ' + resp.status);
    return resp.blob();
  })
  .then(function(blob) {
    var audioUrl = URL.createObjectURL(blob);
    _audioEl = new Audio(audioUrl);
    _audioEl.playbackRate = opts.rate || 1.0;
    
    _audioEl.onplay = function() {
      _isPlaying = true;
      _isPaused = false;
      if (_onStateChange) _onStateChange('playing');
    };
    _audioEl.onpause = function() {
      _isPaused = true;
      _isPlaying = false;
      if (_onStateChange) _onStateChange('paused');
    };
    _audioEl.onended = function() {
      _isPlaying = false;
      _isPaused = false;
      URL.revokeObjectURL(audioUrl);
      if (_onStateChange) _onStateChange('stopped');
    };
    
    _audioEl.play();
  })
  .catch(function(err) {
    console.error('Cloud TTS error:', err);
    // Fallback to Web Speech API
    speak(text, opts);
  });
}
```

**User configuration:** When `TTS_CLOUD_ENABLED` is true, the Settings overlay would show a "Voice" option: "Device voice (offline)" vs "Natural voice (requires internet)." The user's API key would be stored in localStorage (`mf-tts-api-key`). For a non-commercial project, users would use their own free ElevenLabs account.

**Cost estimate:** A typical CCC paragraph is ~200 characters. A Bible chapter averages ~2,000 characters. The free tier (10,000 chars/month) gives ~5 Bible chapters or ~50 CCC paragraphs per month. The $5/month Starter tier (~30,000 chars) gives ~15 chapters or ~150 paragraphs. For casual "listen to today's reading" use, the free tier is adequate.

---

### ST-22: Voice Selection in Settings

**What:** Let the user see which voice is active and (on Tier 1) pick from available voices.

**File:** `src/settings.js`

**Implementation — add a voice section to the settings panel:**

```js
var tts = require('./tts.js');

// In settings render, add:
if (tts.isSupported()) {
  html += '<div class="settings-section">';
  html += '<div class="settings-section-label">Read Aloud</div>';
  html += '<div class="settings-item">';
  html += '<span>Voice</span>';
  html += '<span class="settings-item-value">' + tts.getVoiceName() + '</span>';
  html += '</div>';
  html += '<div class="settings-privacy-note">Uses your device\'s built-in text-to-speech. Quality varies by device.</div>';
  html += '</div>';
}
```

Voice picker (dropdown of available voices) is a nice-to-have but not MVP. The smart auto-selection in ST-16 should pick a good default. If users want to change it, they can adjust their device's system TTS settings.

---

## Updated Implementation Order

**Phase 1–5:** As previously defined (ST-01 through ST-15)

**Phase 6 — Read Aloud (implement after Phase 4):**
16. **ST-16** — Create `src/tts.js` with smart voice selection
17. **ST-17** — Add Listen button to Bible reader
18. **ST-18** — Add Listen button to CCC reader
19. **ST-19** — Listen button CSS
20. **ST-20** — Stop TTS on tab switch / overlay close
21. **ST-21** — (FUTURE) ElevenLabs cloud voice behind feature flag
22. **ST-22** — Voice info in Settings

---

## Updated Files Created/Modified

| File | Action | Phase |
|------|--------|-------|
| `src/tts.js` | **NEW** (~160 lines) — TTS module with voice selection | 6 |
| `src/bible.js` | Add TTS require, plain text collection, listen stop on close (~15 lines) | 6 |
| `src/ccc.js` | Add TTS require, plain text collection, listen stop on close (~15 lines) | 6 |
| `src/app.js` | Add listen toggle window bindings (~20 lines) | 6 |
| `src/ui.js` | Add TTS stop on tab switch (~3 lines) | 6 |
| `src/settings.js` | Add voice info section (~10 lines) | 6 |
| `index.html` | Add listen buttons to Bible + CCC headers (2 lines) | 6 |
| `css/app.css` | Listen button CSS (~25 lines) | 6 |

**Phase 6 totals:** ~160 lines new (tts.js), ~65 lines modifications. Zero new dependencies (Web Speech API is built-in).

---

## Updated Test Checklist (Phase 6)

- [ ] Chrome Desktop: tap Listen in Bible → chapter reads aloud in Google/Microsoft voice
- [ ] Chrome Desktop: tap Listen again → pauses; tap again → resumes
- [ ] Close Bible while listening → speech stops
- [ ] Switch to Map tab while listening → speech stops
- [ ] CCC §663: tap Listen → paragraph reads aloud
- [ ] iOS Safari: Listen button appears; tapping it produces audio (may be lower quality)
- [ ] Android Chrome: Listen button works with device TTS voice
- [ ] Settings shows current voice name
- [ ] Dark mode: listen button renders correctly
- [ ] No audio plays after closing all readers
