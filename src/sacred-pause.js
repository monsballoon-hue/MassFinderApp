// src/sacred-pause.js — Shared sacred pause overlay system
// Full-screen contemplative moment between utility and devotional contexts.
// Consumers call show() with content; the system handles everything else.

var _active = false;
var _timeout = null;
var _sessionCount = 0;
var MAX_PER_SESSION = 2;

function show(opts) {
  if (!opts || !opts.title) return false;
  if (_active) return false;
  if (_sessionCount >= MAX_PER_SESSION) return false;

  // Storage guard
  if (opts.storageKey) {
    try {
      if (opts.guard === 'session') {
        if (sessionStorage.getItem(opts.storageKey)) return false;
      } else if (opts.guard === 'day') {
        var today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(opts.storageKey) === today) return false;
      } else if (opts.guard === 'once') {
        if (localStorage.getItem(opts.storageKey) === (opts.storageVal || '1')) return false;
      } else {
        if (localStorage.getItem(opts.storageKey) === opts.storageVal) return false;
      }
    } catch (e) {}
  }

  _active = true;
  _sessionCount++;

  var timeout = Math.max(1500, Math.min(5000, opts.timeout || 4000));

  var el = document.getElementById('sacredPause');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sacredPause';
    document.body.insertBefore(el, document.body.firstChild);
  }
  el.className = 'sacred-pause';
  el.innerHTML = '<div class="sacred-pause-content">'
    + (opts.label ? '<div class="sacred-pause-label">' + opts.label + '</div>' : '')
    + '<div class="sacred-pause-title">' + opts.title + '</div>'
    + (opts.message ? '<div class="sacred-pause-message">' + opts.message + '</div>' : '')
    + '</div>';

  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(_timeout);
    el.classList.add('dismissing');
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
      _active = false;
      if (opts.onDismiss) opts.onDismiss();
    }, 800);
  }
  el.addEventListener('click', dismiss);
  _timeout = setTimeout(dismiss, timeout);

  // Persist guard
  if (opts.storageKey) {
    try {
      if (opts.guard === 'session') {
        sessionStorage.setItem(opts.storageKey, '1');
      } else if (opts.guard === 'day') {
        localStorage.setItem(opts.storageKey, new Date().toISOString().slice(0, 10));
      } else {
        localStorage.setItem(opts.storageKey, opts.storageVal || '1');
      }
    } catch (e) {}
  }

  return true;
}

function isActive() {
  return _active;
}

function showAfter(opts, delay) {
  if (!_active) return show(opts);
  var d = delay || 600;
  var origDismiss = opts.onDismiss;
  var poll = setInterval(function() {
    if (!_active) {
      clearInterval(poll);
      setTimeout(function() {
        opts.onDismiss = origDismiss;
        show(opts);
      }, d);
    }
  }, 100);
}

module.exports = {
  show: show,
  showAfter: showAfter,
  isActive: isActive
};
