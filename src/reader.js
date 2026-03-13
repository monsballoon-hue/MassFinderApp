// src/reader.js — Universal reader/overlay manager
// One container replaces 10 independent overlay systems.
// Content modules register themselves via registerModule().
// Navigation stack enables cross-source back navigation (CCC → Bible → back to CCC).
// Origin anchor shows where the journey started and enables one-tap return.

var ui = require('./ui.js');

var _stack = [];    // navigation stack: [{ mode, params, scrollPos }]
var _current = null; // { mode: 'ccc', params: { num: '663' } }
var _modules = {};   // registered content modules
var _closingViaPopstate = false; // guard for History API

// Content modules register themselves — each must implement:
//   getTitle(params) → string
//   render(params, bodyEl, footerEl) → void (may be async)
//   onClose() → void (optional cleanup)
//   getHeaderExtra(params) → string (optional extra header HTML)
//   getState() → object (optional — enrich params before stacking)
function registerModule(mode, module) {
  _modules[mode] = module;
}

var _backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>';

function _updateBackBtn() {
  var btn = document.getElementById('readerBackBtn');
  btn.style.display = _stack.length ? '' : 'none';
  if (_stack.length) {
    var top = _stack[_stack.length - 1];
    var topMod = _modules[top.mode];
    var label = topMod && topMod.getTitle ? topMod.getTitle(top.params) : '';
    btn.innerHTML = _backSvg + (label ? '<span class="reader-back-label">' + label + '</span>' : '');
    btn.setAttribute('aria-label', label ? 'Back to ' + label : 'Back');
  } else {
    btn.innerHTML = _backSvg;
    btn.setAttribute('aria-label', 'Back');
  }
}

// ── Origin Anchor Banner ──

var _contextMap = {
  rosary: 'Rosary', examination: 'Examination', stations: 'Stations',
  novena: 'Novena', ccc: 'Catechism', bible: 'Bible',
  explore: 'Explore', settings: 'Settings'
};

function _updateOriginBanner() {
  var banner = document.getElementById('readerOrigin');
  if (!banner) return;

  if (_stack.length < 2) {
    banner.style.display = 'none';
    return;
  }

  var origin = _stack[0];
  var ctx = _contextMap[origin.mode] || origin.mode;

  var labelEl = document.getElementById('readerOriginLabel');
  labelEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink:0"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>'
    + ' <span>From ' + ctx + '</span>'
    + ' <span class="reader-origin-dots">' + _renderDepthDots(_stack.length) + '</span>';

  banner.style.display = '';
}

function _renderDepthDots(depth) {
  if (depth <= 7) {
    var dots = '';
    for (var i = 0; i < depth; i++) dots += '\u25CF';
    return '<span class="reader-depth-dots">' + dots + '</span>';
  }
  return '<span class="reader-depth-dots">\u25CF\u25CF ' + depth + ' \u25CF\u25CF</span>';
}

function readerOpen(mode, params) {
  var overlay = document.getElementById('readerOverlay');
  if (!overlay) return;
  var isNewOpen = !overlay.classList.contains('open');
  var prevMode = _current ? _current.mode : null;

  // Cross-module transition → push current to stack (enables back nav)
  // Same-module navigation (CCC §1→§2, Bible ch3→ch4) → replace current (no stack growth)
  // Exception: explore with _pushExplore flag → push even for same-module (source pivots)
  if (_current && (_current.mode !== mode || (mode === 'explore' && params._pushExplore))) {
    _current.scrollPos = document.getElementById('readerBody').scrollTop;
    // Let the current module enrich its params before stacking
    var curMod = _modules[_current.mode];
    if (curMod && curMod.getState) {
      var enriched = curMod.getState();
      if (enriched) {
        Object.keys(enriched).forEach(function(k) { _current.params[k] = enriched[k]; });
      }
    }
    _stack.push(_current);
  }

  _current = { mode: mode, params: params };

  var mod = _modules[mode];
  if (!mod) return;

  // Update header
  document.getElementById('readerTitle').textContent = mod.getTitle ? mod.getTitle(params) : '';
  _updateBackBtn();
  _updateOriginBanner();

  // Header extra — only replace when switching to a different mode
  // (preserves search inputs during same-mode navigation)
  var headerExtra = document.getElementById('readerHeaderExtra');
  if (headerExtra && (isNewOpen || prevMode !== mode)) {
    headerExtra.innerHTML = mod.getHeaderExtra ? mod.getHeaderExtra(params) : '';
    headerExtra.style.display = headerExtra.innerHTML ? '' : 'none';
  }

  var bodyEl = document.getElementById('readerBody');
  var footerEl = document.getElementById('readerFooter');

  // Set mode attribute for CSS scoping
  overlay.setAttribute('data-mode', mode);

  if (isNewOpen) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    window._lastFocused = document.activeElement;

    // Push browser history for Android back button support
    history.pushState({ mf: 'reader' }, '');

    // Content fade-in after container animation
    bodyEl.style.opacity = '0';
    mod.render(params, bodyEl, footerEl);
    setTimeout(function() {
      bodyEl.style.opacity = '1';
      bodyEl.style.transition = 'opacity 0.3s ease';
    }, 200);

    ui.trapFocus(overlay);
  } else {
    // Push history on cross-module transitions within reader
    if (prevMode !== mode || (mode === 'explore' && params._pushExplore)) {
      history.pushState({ mf: 'reader', depth: _stack.length }, '');
    }

    // Crossfade within the already-open reader
    bodyEl.style.opacity = '0';
    setTimeout(function() {
      mod.render(params, bodyEl, footerEl);
      bodyEl.style.opacity = '1';
      bodyEl.scrollTop = 0;
    }, 150);
  }
}

function readerBack() {
  if (!_stack.length) { readerClose(); return; }
  var prev = _stack.pop();
  _current = prev;

  var mod = _modules[prev.mode];
  if (!mod) return;

  var overlay = document.getElementById('readerOverlay');
  overlay.setAttribute('data-mode', prev.mode);

  document.getElementById('readerTitle').textContent = mod.getTitle ? mod.getTitle(prev.params) : '';
  _updateBackBtn();
  _updateOriginBanner();

  // Restore header extra for the module we're returning to
  var headerExtra = document.getElementById('readerHeaderExtra');
  if (headerExtra) {
    headerExtra.innerHTML = mod.getHeaderExtra ? mod.getHeaderExtra(prev.params) : '';
    headerExtra.style.display = headerExtra.innerHTML ? '' : 'none';
  }

  var bodyEl = document.getElementById('readerBody');
  var footerEl = document.getElementById('readerFooter');

  prev.params._restore = true;
  bodyEl.style.opacity = '0';
  setTimeout(function() {
    mod.render(prev.params, bodyEl, footerEl);
    bodyEl.style.opacity = '1';
    bodyEl.scrollTop = prev.scrollPos || 0;
  }, 150);
}

function readerClose() {
  var overlay = document.getElementById('readerOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';

  // Notify ALL modules in the stack (privacy cleanup, wake lock release, etc.)
  _stack.forEach(function(entry) {
    var mod = _modules[entry.mode];
    if (mod && mod.onClose) mod.onClose();
  });

  // Notify current module
  if (_current && _modules[_current.mode] && _modules[_current.mode].onClose) {
    _modules[_current.mode].onClose();
  }

  _stack = [];
  _current = null;

  // Reset origin banner
  var banner = document.getElementById('readerOrigin');
  if (banner) banner.style.display = 'none';

  // Reset
  var bodyEl = document.getElementById('readerBody');
  bodyEl.style.opacity = '';
  bodyEl.style.transition = '';
  document.getElementById('readerFooter').style.display = 'none';
  document.getElementById('readerFooter').innerHTML = '';
  var headerExtra = document.getElementById('readerHeaderExtra');
  if (headerExtra) { headerExtra.innerHTML = ''; headerExtra.style.display = 'none'; }
  overlay.removeAttribute('data-mode');

  // Clean up browser history — replace current state so back button
  // doesn't re-trigger reader popstate after close
  if (!_closingViaPopstate) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  ui.releaseFocus();
  if (window._lastFocused && window._lastFocused.focus) {
    window._lastFocused.focus();
  }
}

// Navigate within the current mode (updates back button, pushes to stack)
function readerNavigate(mode, params) {
  readerOpen(mode, params);
}

// Get current state (for modules that need to check)
function getCurrent() { return _current; }
function getStack() { return _stack; }

// Stable key for comparing params
function _jsonKey(p) {
  if (!p) return '';
  try { return JSON.stringify(p); } catch (e) { return ''; }
}

// ── History API Integration (Android back button) ──

function _initHistoryIntegration() {
  window.addEventListener('popstate', function() {
    var overlay = document.getElementById('readerOverlay');
    if (overlay && overlay.classList.contains('open')) {
      if (_stack.length > 0) {
        readerBack();
      } else {
        _closingViaPopstate = true;
        readerClose();
        _closingViaPopstate = false;
      }
      return;
    }
    // If ref preview is open, close it
    if (typeof window._refPreviewClose === 'function') {
      window._refPreviewClose();
    }
  });
}

// Swipe-to-dismiss: attach to reader body
function _initSwipeDismiss() {
  var header = document.querySelector('.reader-header');
  var body = document.getElementById('readerBody');
  if (!header || !body) return;

  var startY = 0, startX = 0;
  function onStart(e) {
    var t = e.touches ? e.touches[0] : e;
    startY = t.clientY;
    startX = t.clientX;
  }
  function onEnd(e) {
    var t = e.changedTouches ? e.changedTouches[0] : e;
    var dy = t.clientY - startY;
    var dx = Math.abs(t.clientX - startX);
    if (dy > 80 && dy > dx && body.scrollTop <= 5) {
      // Don't allow swipe-to-dismiss for prayer modules — user must explicitly close
      if (_current && ['rosary', 'examination', 'stations', 'novena'].indexOf(_current.mode) >= 0) return;
      readerClose();
    }
  }
  body.addEventListener('touchstart', onStart, { passive: true });
  body.addEventListener('touchend', onEnd, { passive: true });
}

module.exports = {
  registerModule: registerModule,
  readerOpen: readerOpen,
  readerBack: readerBack,
  readerClose: readerClose,
  readerNavigate: readerNavigate,
  getCurrent: getCurrent,
  getStack: getStack,
  _initSwipeDismiss: _initSwipeDismiss,
  _initHistoryIntegration: _initHistoryIntegration,
};
