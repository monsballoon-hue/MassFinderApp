// src/refs.js — Universal Reference Resolver (MOD-01)
// Renders tappable HTML spans for CCC paragraphs and Bible references.
// Context-aware routing: Tier 1 inline snippet in prayer/outside contexts,
// Tier 2 direct navigation when already in a reading module.
//
// Usage:
//   refs.renderRef('ccc', '2180')           → '<span class="ref-tap ...">CCC 2180</span>'
//   refs.renderRef('bible', 'John 3:16')    → '<span class="ref-tap ...">John 3:16</span>'
//   refs.renderRef('ccc', '613', 'see CCC') → custom label
//
// In HTML onclick handlers, calls window._refTap(type, val, this).
// After rendering dynamic HTML, call refs.initRefTaps(container) to wire keyboard.

var reader = require('./reader.js');
var snippet = require('./snippet.js');

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
    + ' onclick="event.stopPropagation();window._refTap(\'' + _esc(type) + '\',\'' + _esc(String(val)) + '\',this)"'
    + ' role="button" tabindex="0"'
    + ' aria-label="' + _esc(aria) + '">'
    + display + '</span>';
}

// Context-aware routing: snippet (Tier 1) inside prayer tools or outside reader;
// direct navigation (Tier 2) when already in a reading context.
function handleRefTap(type, val, el) {
  var current = reader.getCurrent();
  var inPrayer = current && ['rosary', 'examination', 'stations', 'novena'].indexOf(current.mode) >= 0;

  if (!current || inPrayer) {
    snippet.showSnippet(type, val, el);
    return;
  }
  // Tier 2 (CCC/Bible full readers) gated in v1 on this branch
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
};
