// src/reader.js — Universal reader/overlay manager
// One container replaces 10 independent overlay systems.
// Content modules register themselves via registerModule().
// Navigation stack enables cross-source back navigation (CCC → Bible → back to CCC).

var ui = require('./ui.js');

var _stack = [];    // navigation stack: [{ mode, params, scrollPos }]
var _current = null; // { mode: 'ccc', params: { num: '663' } }
var _modules = {};   // registered content modules

// Content modules register themselves — each must implement:
//   getTitle(params) → string
//   render(params, bodyEl, footerEl) → void (may be async)
//   onClose() → void (optional cleanup)
//   getHeaderExtra(params) → string (optional extra header HTML)
function registerModule(mode, module) {
  _modules[mode] = module;
}

var _backSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>';

function _updateBackBtn() {
  var btn = document.getElementById('readerBackBtn');
  btn.style.visibility = _stack.length ? 'visible' : 'hidden';
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

function readerOpen(mode, params) {
  var overlay = document.getElementById('readerOverlay');
  if (!overlay) return;
  var isNewOpen = !overlay.classList.contains('open');
  var prevMode = _current ? _current.mode : null;

  // Cross-module transition → push current to stack (enables back nav)
  // Same-module navigation (CCC §1→§2, Bible ch3→ch4) → replace current (no stack growth)
  if (_current && _current.mode !== mode) {
    _current.scrollPos = document.getElementById('readerBody').scrollTop;
    _stack.push(_current);
  }

  _current = { mode: mode, params: params };

  var mod = _modules[mode];
  if (!mod) return;

  // Update header
  document.getElementById('readerTitle').textContent = mod.getTitle ? mod.getTitle(params) : '';
  _updateBackBtn();

  // Header extra — only replace when switching to a different mode
  // (preserves search inputs, breadcrumbs during same-mode navigation)
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
    // SLV-08: Prayer tool entry pause (non-blocking)
    var _sacredPause = require('./sacred-pause.js');
    var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, firstfriday: 1, examination: 1 };
    if (PRAYER_MODES[mode]) {
      _sacredPause.show({
        title: mod.getTitle ? mod.getTitle(params) : '',
        message: 'In the name of the Father,\nand of the Son,\nand of the Holy Spirit. Amen.',
        timeout: 4000,
        storageKey: 'mf-prayer-pause-' + mode,
        guard: 'session'
      });
    }

    overlay.classList.add('open');
    document.body.classList.add('reader-open');
    document.body.dataset.scrollPos = String(window.scrollY);
    window._lastFocused = document.activeElement;

    // Content fade-in after container animation
    bodyEl.style.opacity = '0';
    mod.render(params, bodyEl, footerEl);
    setTimeout(function() {
      bodyEl.style.opacity = '1';
      bodyEl.style.transition = 'opacity 0.3s ease';
    }, 200);

    ui.trapFocus(overlay);
  } else {
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
  var scrollPos = parseInt(document.body.dataset.scrollPos || '0', 10);
  document.body.classList.remove('reader-open');
  window.scrollTo(0, scrollPos);

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

  // Reset
  var bodyEl = document.getElementById('readerBody');
  bodyEl.style.opacity = '';
  bodyEl.style.transition = '';
  document.getElementById('readerFooter').style.display = 'none';
  document.getElementById('readerFooter').innerHTML = '';
  var headerExtra = document.getElementById('readerHeaderExtra');
  if (headerExtra) { headerExtra.innerHTML = ''; headerExtra.style.display = 'none'; }
  overlay.removeAttribute('data-mode');

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

// PTR-02: Backdrop click-to-dismiss (desktop) — prayer modules excluded
function _initBackdropDismiss() {
  var overlay = document.getElementById('readerOverlay');
  if (!overlay) return;
  overlay.addEventListener('click', function(e) {
    if (e.target !== overlay) return;
    if (_current && ['rosary', 'examination', 'stations', 'novena'].indexOf(_current.mode) >= 0) return;
    readerClose();
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
  _initBackdropDismiss: _initBackdropDismiss,
};
