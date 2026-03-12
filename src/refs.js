// src/refs.js — Universal Reference Resolver (MOD-01)
// Renders tappable HTML spans for CCC paragraphs and Bible references.
// Phase 1: CCC only.  Phase 4: Bible (lazy-load data/bible-drb/).
//
// Usage:
//   refs.renderRef('ccc', '2180')           → '<span class="ref-tap ...">CCC 2180</span>'
//   refs.renderRef('bible', 'John 3:16')    → '<span class="ref-tap ...">John 3:16</span>'
//   refs.renderRef('ccc', '613', 'see CCC') → custom label
//
// In HTML onclick handlers, calls window._refTap(type, val).
// After rendering dynamic HTML, call refs.initRefTaps(container) to wire keyboard.

var reader = require('./reader.js');

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

function handleRefTap(type, val) {
  // v1 prod gate: Bible and CCC full readers disabled — inline/popup refs still work
  if (type === 'ccc' || type === 'bible') {
    return;
  }
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
