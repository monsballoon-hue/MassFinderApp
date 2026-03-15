// src/prayer-core.js — Shared prayer infrastructure (ARC-01)
// Foundation layer: wake lock, swipe, crossfade, completion logging, prayer formatting.
// Imported by prayer modules. Does NOT import reader.js (avoids circular deps).

var utils = require('./utils.js');

// ── Wake Lock ──
var _wakeLock = null;

function _acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock.request('screen').then(function(lock) {
    _wakeLock = lock;
    _wakeLock.addEventListener('release', function() { _wakeLock = null; });
  }).catch(function() {});
}

function _releaseWakeLock() {
  if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
}

// Returns a visibilitychange handler that re-acquires wake lock when returning
// to the app while a specific prayer mode is active.
// Uses lazy require to avoid circular import with reader.js.
function _onVisibility(mode) {
  return function() {
    var reader = require('./reader.js');
    var cur = reader.getCurrent();
    if (document.visibilityState === 'visible' && cur && cur.mode === mode) {
      _acquireWakeLock();
    }
  };
}

// ── Prayer Text Formatting ──
// Converts plain text with line breaks to HTML paragraphs.
// Handles both string and object-with-text-property inputs.
function fmtPrayer(text) {
  if (!text) return '';
  if (typeof text === 'object' && text) {
    // Support getPrayerText-style objects with .text property
    text = utils.getPrayerText ? utils.getPrayerText(text, 'text') : (text.text || '');
  }
  return utils.esc(text).replace(/\r\n/g, '\n').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// ── Scroll ──
function scrollTop() {
  var body = document.getElementById('readerBody');
  if (body) body.scrollTop = 0;
}

// ── Crossfade Transition ──
// 150ms fade out → renderFn() → scroll to top → 200ms fade in.
function crossfade(renderFn) {
  var body = document.getElementById('readerBody');
  if (!body) { renderFn(); return; }
  body.style.transition = 'opacity 150ms ease';
  body.style.opacity = '0';
  setTimeout(function() {
    renderFn();
    if (body) body.scrollTop = 0;
    body.style.transition = 'opacity 200ms ease';
    body.style.opacity = '1';
  }, 150);
}

// ── Completion Logging ──
// Writes to mf-prayer-log with 90-day rolling window.
// extra: optional object merged into log entry (e.g. { set: 'Joyful' })
function logCompletion(type, extra) {
  try {
    var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
    var entry = { type: type, date: new Date().toISOString().slice(0, 10) };
    if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) entry[k] = extra[k]; } }
    log.push(entry);
    var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    log = log.filter(function(e) { return e.date >= cutoff; });
    localStorage.setItem('mf-prayer-log', JSON.stringify(log));
  } catch (e) {}
}

// ── Swipe Gesture ──
// Attaches horizontal swipe to readerBody. Returns teardown function.
// Threshold: dx > 60 && |dx| > |dy| * 1.5
function initSwipe(nextFn, prevFn) {
  var body = document.getElementById('readerBody');
  if (!body) return function() {};
  var startX = 0, startY = 0;
  function onStart(e) {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }
  function onEnd(e) {
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && nextFn) nextFn();
    else if (dx > 0 && prevFn) prevFn();
  }
  body.addEventListener('touchstart', onStart, { passive: true });
  body.addEventListener('touchend', onEnd, { passive: true });
  return function() {
    body.removeEventListener('touchstart', onStart);
    body.removeEventListener('touchend', onEnd);
  };
}

// ── Nav Buttons HTML ──
// Returns two-button flex layout. prevFnName/nextFnName are onclick handler names (strings).
function navHtml(prevLabel, prevFnName, nextLabel, nextFnName) {
  return '<div style="display:flex;gap:var(--space-3)">'
    + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="' + prevFnName + '()">' + prevLabel + '</button>'
    + '<button class="rosary-nav-btn rosary-nav-primary" onclick="' + nextFnName + '()">' + nextLabel + '</button>'
    + '</div>';
}

module.exports = {
  wakeLock: {
    acquire: _acquireWakeLock,
    release: _releaseWakeLock,
    onVisibility: _onVisibility
  },
  fmtPrayer: fmtPrayer,
  scrollTop: scrollTop,
  crossfade: crossfade,
  logCompletion: logCompletion,
  initSwipe: initSwipe,
  navHtml: navHtml
};
