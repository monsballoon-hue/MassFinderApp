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

  // Highlight the selected element
  el.classList.add('study-action-target');

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

  // Append to readerBody as sticky-bottom toolbar
  var readerBody = document.getElementById('readerBody');
  if (readerBody) {
    readerBody.appendChild(bar);
  } else {
    el.appendChild(bar);
  }

  // Close on outside tap
  setTimeout(function() {
    document.addEventListener('click', _outsideClickHandler, true);
  }, 50);
}

function hideActionBar() {
  var bar = document.getElementById('studyActionBar');
  if (bar) bar.remove();
  if (_activeEl) _activeEl.classList.remove('study-action-target');
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
  var haptics = require('./haptics.js');
  studyDb.addHighlight(_activeSource, _activeAddress, 'gold').then(function(result) {
    if (result) {
      // Added — apply highlight class
      if (_activeEl) _activeEl.classList.add('study-hl', 'study-hl--gold');
    } else {
      // Toggled off — remove highlight class
      if (_activeEl) _activeEl.classList.remove('study-hl', 'study-hl--gold');
    }
    haptics.confirm();
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

  var haptics = require('./haptics.js');
  studyDb.addNote(_activeSource, _activeAddress, text).then(function() {
    if (_activeEl) _activeEl.classList.add('study-has-note');
    haptics.confirm();
    hideActionBar();
    _showToast('Note saved');
  });
}

// ── Bookmark action ──

function doBookmark() {
  if (!_activeSource || !_activeAddress) return;
  var haptics = require('./haptics.js');

  studyDb.isBookmarked(_activeSource, _activeAddress).then(function(exists) {
    if (exists) {
      return studyDb.removeBookmark(_activeSource, _activeAddress).then(function() {
        if (_activeEl) _activeEl.classList.remove('study-bookmarked');
        haptics.confirm();
        hideActionBar();
        _showToast('Bookmark removed');
      });
    }
    return studyDb.addBookmark(_activeSource, _activeAddress, '').then(function() {
      if (_activeEl) _activeEl.classList.add('study-bookmarked');
      haptics.confirm();
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
        var el2 = containerEl.querySelector('[data-address="' + addr + '"]');
        if (el2) el2.classList.add('study-bookmarked');
      }
    });
  });
}

// ── Toast helper ──

function _showToast(msg) {
  if (window.showToast) { window.showToast(msg); return; }
  var render = require('./render.js');
  if (render.showToast) { render.showToast(msg); return; }
  // Fallback — create a simple toast
  var t = document.createElement('div');
  t.className = 'mf-toast show';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.classList.remove('show'); }, 1500);
  setTimeout(function() { t.remove(); }, 2000);
}

// ── Init: listen for taps on annotatable elements ──

function initStudyLayer(containerEl) {
  if (!containerEl || containerEl._studyInit) return;
  containerEl._studyInit = true;

  containerEl.addEventListener('click', function(e) {
    // Don't intercept taps on links, buttons, refs, nav
    if (e.target.closest('a, button, .ref-tap, .ccc-related-item, .bible-related-item, .bible-nav-btn, .ccc-nav-btn, .bible-listen-btn, .ccc-explore-btn, .bible-explore-btn, details')) return;

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
