// src/refs.js — Universal Reference Resolver (MOD-01)
// Renders tappable HTML spans for CCC paragraphs and Bible references.
// Context-aware routing: Layer A preview in prayer/outside contexts,
// Layer B direct navigation when already in a reading module.
//
// Usage:
//   refs.renderRef('ccc', '2180')           → '<span class="ref-tap ...">CCC 2180</span>'
//   refs.renderRef('bible', 'John 3:16')    → '<span class="ref-tap ...">John 3:16</span>'
//   refs.renderRef('ccc', '613', 'see CCC') → custom label
//
// In HTML onclick handlers, calls window._refTap(type, val).
// After rendering dynamic HTML, call refs.initRefTaps(container) to wire keyboard.

var reader = require('./reader.js');
var graph = require('./graph.js');

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderRef(type, val, label) {
  var display;
  if (label !== undefined) {
    display = label;
  } else if (type === 'ccc') {
    display = 'CCC\u00A0' + _esc(String(val));
  } else {
    display = _esc(String(val));
  }
  var aria;
  if (type === 'ccc') {
    aria = 'Catechism paragraph ' + val;
  } else if (type === 'bible') {
    aria = 'Scripture: ' + val;
  } else {
    aria = String(val);
  }
  return '<span class="ref-tap ref-tap--' + type + '"'
    + ' onclick="window._refTap(\'' + _esc(type) + '\',\'' + _esc(String(val)) + '\')"'
    + ' role="button" tabindex="0"'
    + ' aria-label="' + _esc(aria) + '">'
    + display + '</span>';
}

// ── Context-aware routing ──

function handleRefTap(type, val) {
  var current = reader.getCurrent();
  var inReader = !!current;
  var inPrayer = inReader && ['rosary', 'examination', 'stations', 'novena'].indexOf(current.mode) >= 0;
  var inReading = inReader && ['ccc', 'bible', 'explore'].indexOf(current.mode) >= 0;

  if (!inReader || inPrayer) {
    // LAYER A: Show preview mini-sheet (bridge context)
    _showPreview(type, val);
  } else {
    // LAYER B: Direct reader navigation (already in reading context)
    if (type === 'ccc') {
      reader.readerOpen('ccc', { num: String(val) });
    } else if (type === 'bible') {
      reader.readerOpen('bible', { ref: String(val) });
    }
  }
}

// ── Layer A: Preview Mini-Sheet ──

var _previewOpen = false;

function _showPreview(type, val) {
  var preview = document.getElementById('refPreview');
  var backdrop = document.getElementById('refPreviewBackdrop');
  var content = document.getElementById('refPreviewContent');
  if (!preview || !content) return;

  var haptics = require('./haptics.js');
  haptics.confirm();
  content.innerHTML = '<div class="ref-preview-loading">Loading\u2026</div>';
  preview.classList.add('open');
  backdrop.classList.add('open');
  _previewOpen = true;

  var loadTypes = (type === 'ccc')
    ? ['ccc', 'hierarchy']
    : ['ccc', 'footnotes'];

  graph.ensure(loadTypes).then(function() {
    if (!_previewOpen) return; // dismissed before data loaded

    var html = '';
    if (type === 'ccc') {
      html = _renderCCCPreview(val);
    } else if (type === 'bible') {
      html = _renderBiblePreview(val);
    }
    content.innerHTML = html;
  });
}

function _renderCCCPreview(numStr) {
  var num = parseInt(numStr, 10);
  var text = graph.getCCCParagraph(num);
  var hierarchy = graph.getCCCHierarchy();

  var html = '<div class="ref-preview-header">';
  html += '<div class="ref-preview-icon ref-preview-icon--ccc">\u00A7</div>';
  html += '<div class="ref-preview-meta">';
  html += '<div class="ref-preview-label">Catechism \u00A7' + _esc(numStr) + '</div>';

  // Hierarchy context
  if (hierarchy && hierarchy.lookup && hierarchy.lookup[num]) {
    var idx = hierarchy.lookup[num];
    var h = hierarchy.hierarchy;
    var ctx = [];
    if (idx[0] >= 0 && h[idx[0]]) ctx.push(h[idx[0]].title);
    if (idx[2] >= 0 && h[idx[0]] && h[idx[0]].sections && h[idx[0]].sections[idx[1]] &&
        h[idx[0]].sections[idx[1]].chapters && h[idx[0]].sections[idx[1]].chapters[idx[2]]) {
      ctx.push(h[idx[0]].sections[idx[1]].chapters[idx[2]].title);
    }
    if (ctx.length) {
      html += '<div class="ref-preview-context">' + _esc(ctx.join(' \u203A ')) + '</div>';
    }
  }
  html += '</div></div>';

  // Preview text
  if (text) {
    var clean = text.replace(/\s*\(\d[\d,\s\-\u2013]*\)\s*/g, ' ').replace(/>/g, '').replace(/\*/g, '').trim();
    var firstSentence = clean.match(/^(.{20,200}[.!?]["\u201d]?)(\s|$)/);
    var preview = firstSentence ? firstSentence[1] : clean.slice(0, 160);
    if (preview.length < clean.length) preview += '\u2026';
    html += '<div class="ref-preview-text">' + _esc(preview) + '</div>';
  }

  // Action buttons
  html += '<div class="ref-preview-actions">';
  html += '<button class="ref-preview-btn ref-preview-btn--primary" onclick="_refPreviewOpen(\'ccc\',\'' + _esc(numStr) + '\')">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>'
    + ' Read \u00A7' + _esc(numStr) + '</button>';
  html += '<button class="ref-preview-btn ref-preview-btn--explore" onclick="_refPreviewExplore(\'ccc\',\'' + _esc(numStr) + '\')">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>'
    + ' Explore Connections</button>';
  html += '</div>';

  return html;
}

function _renderBiblePreview(refStr) {
  var html = '<div class="ref-preview-header">';
  html += '<div class="ref-preview-icon ref-preview-icon--bible">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>'
    + '</div>';
  html += '<div class="ref-preview-meta">';
  html += '<div class="ref-preview-label">' + _esc(refStr) + '</div>';
  html += '<div class="ref-preview-context">Douay-Rheims Bible</div>';
  html += '</div></div>';

  html += '<div class="ref-preview-text ref-preview-text--bible">'
    + 'Tap to read the full passage in context.</div>';

  html += '<div class="ref-preview-actions">';
  html += '<button class="ref-preview-btn ref-preview-btn--primary" onclick="_refPreviewOpen(\'bible\',\'' + _esc(refStr).replace(/'/g, '&#39;') + '\')">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>'
    + ' Read in Bible</button>';
  html += '<button class="ref-preview-btn ref-preview-btn--explore" onclick="_refPreviewExplore(\'bible\',\'' + _esc(refStr).replace(/'/g, '&#39;') + '\')">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>'
    + ' Explore Connections</button>';
  html += '</div>';

  return html;
}

function _closePreview() {
  var preview = document.getElementById('refPreview');
  var backdrop = document.getElementById('refPreviewBackdrop');
  if (preview) preview.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  _previewOpen = false;
}

// Window bindings for onclick in preview HTML
window._refPreviewOpen = function(type, val) {
  _closePreview();
  if (type === 'ccc') reader.readerOpen('ccc', { num: String(val) });
  if (type === 'bible') reader.readerOpen('bible', { ref: String(val) });
};
window._refPreviewExplore = function(type, val) {
  _closePreview();
  reader.readerOpen('explore', { type: type, id: String(val) });
};

// ── Initialize preview dismiss handlers ──

function initPreviewDismiss() {
  var backdrop = document.getElementById('refPreviewBackdrop');
  if (backdrop) backdrop.addEventListener('click', _closePreview);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && _previewOpen) _closePreview();
  });

  // Swipe down to dismiss
  var preview = document.getElementById('refPreview');
  if (!preview) return;
  var startY = 0;
  preview.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  preview.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    if (dy > 60) _closePreview();
  }, { passive: true });
}

// Wire keyboard activation (Enter/Space) for ref-tap spans in a container.
// Safe to call multiple times — each span is only initialized once.
function initRefTaps(container) {
  var el = container || document;
  el.querySelectorAll('.ref-tap').forEach(function(span) {
    if (span._refInit) return;
    span._refInit = true;
    span.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); span.click(); }
    });
  });
}

module.exports = {
  renderRef: renderRef,
  handleRefTap: handleRefTap,
  initRefTaps: initRefTaps,
  initPreviewDismiss: initPreviewDismiss,
};
