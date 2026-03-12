// src/stations.js — Stations of the Cross (MOD-04)
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');

// ── State ──
var _data = null;
var _station = 0;        // 0-13 (current station index)
var _screen = 'intro';   // 'intro' | 'station' | 'closing'
var _wakeLock = null;
var _touchStartX = 0;
var _touchStartY = 0;
var _swipeHintShown = false;

// ── Reader module registration ──
reader.registerModule('stations', {
  getTitle: function() { return 'Stations of the Cross'; },
  render: function(params, bodyEl, footerEl) {
    bodyEl.innerHTML = '<div class="stations-loading"><div class="stations-loading-spinner"></div><p>Loading prayers\u2026</p></div>';
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    _load().then(function() {
      _screen = 'intro';
      _station = 0;
      _render();
      _acquireWakeLock();
      document.addEventListener('visibilitychange', _handleVisibility);
      _initSwipe();
    });
  },
  onClose: function() {
    _releaseWakeLock();
    document.removeEventListener('visibilitychange', _handleVisibility);
    _teardownSwipe();
  }
});

// ── Load prayer data (lazy) ──
function _load() {
  if (_data) return Promise.resolve(_data);
  return fetch('/data/prayers.json').then(function(r) { return r.json(); })
    .then(function(d) { _data = d; return d; });
}

// ── Wake Lock (UX-05) ──
function _acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock.request('screen').then(function(lock) {
    _wakeLock = lock;
    lock.addEventListener('release', function() { _wakeLock = null; });
  }).catch(function() {});
}

function _releaseWakeLock() {
  if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
}

function _handleVisibility() {
  var cur = reader.getCurrent();
  if (document.visibilityState === 'visible' && cur && cur.mode === 'stations') {
    _acquireWakeLock();
  }
}

// ── Format prayer text (line breaks → HTML) ──
function _fmtPrayer(text) {
  if (!text) return '';
  return utils.esc(text).replace(/\r\n/g, '\n').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// ── Open Stations ──
function openStations() {
  reader.readerOpen('stations', {});
}

// ── Close Stations ──
function closeStations() {
  reader.readerClose();
}

// ── Navigate: Next ──
function stationsNext() {
  if (_screen === 'intro') {
    _screen = 'station';
    _station = 0;
  } else if (_screen === 'station') {
    if (_station < 13) { _station++; }
    else { _screen = 'closing'; }
  } else if (_screen === 'closing') {
    // Log completion
    try {
      var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
      log.push({ type: 'stations', date: new Date().toISOString().slice(0, 10) });
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      log = log.filter(function(e) { return e.date >= cutoff; });
      localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    } catch (e) {}
    _renderComplete();
    _haptic.confirm();
    return;
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

// ── Navigate: Prev ──
function stationsPrev() {
  if (_screen === 'closing') {
    _screen = 'station';
    _station = 13;
  } else if (_screen === 'station') {
    if (_station > 0) { _station--; }
    else { _screen = 'intro'; }
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

// ── Jump to station from progress dots ──
function stationsGoTo(idx) {
  if (idx < 0 || idx > 13) return;
  _screen = 'station';
  _station = idx;
  _render();
  _scrollTop();
}

// ── Scroll to top of body ──
function _scrollTop() {
  var b = document.getElementById('readerBody');
  if (b) b.scrollTop = 0;
}

// ── Crossfade transition ──
function _transitionTo(renderFn) {
  var body = document.getElementById('readerBody');
  if (!body) { renderFn(); return; }
  body.style.transition = 'opacity 150ms ease';
  body.style.opacity = '0';
  setTimeout(function() {
    renderFn();
    _scrollTop();
    body.style.transition = 'opacity 200ms ease';
    body.style.opacity = '1';
  }, 150);
}

// ── Swipe gesture for station navigation ──
function _initSwipe() {
  var body = document.getElementById('readerBody');
  if (!body) return;
  body.addEventListener('touchstart', _onTouchStart, { passive: true });
  body.addEventListener('touchend', _onTouchEnd, { passive: true });
}

function _teardownSwipe() {
  var body = document.getElementById('readerBody');
  if (!body) return;
  body.removeEventListener('touchstart', _onTouchStart);
  body.removeEventListener('touchend', _onTouchEnd);
}

function _onTouchStart(e) {
  _touchStartX = e.changedTouches[0].clientX;
  _touchStartY = e.changedTouches[0].clientY;
}

function _onTouchEnd(e) {
  var dx = e.changedTouches[0].clientX - _touchStartX;
  var dy = e.changedTouches[0].clientY - _touchStartY;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  if (_screen === 'intro') return;
  if (dx < 0) stationsNext();
  else stationsPrev();
}

// ── Render dispatcher ──
function _render() {
  var title = document.getElementById('readerTitle');
  var body = document.getElementById('readerBody');
  var footer = document.getElementById('readerFooter');
  footer.style.display = '';
  if (_screen === 'intro') _renderIntro(title, body, footer);
  else if (_screen === 'station') _renderStation(title, body, footer);
  else if (_screen === 'closing') _renderClosing(title, body, footer);
}

// ── Render: Intro screen ──
function _renderIntro(title, body, footer) {
  title.textContent = 'Stations of the Cross';
  body.innerHTML = '<div class="stations-intro">'
    + '<div class="stations-intro-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="64"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>'
    + '<h3 class="stations-intro-title">The Way of the Cross</h3>'
    + '<p class="stations-intro-text">Walk with Jesus on His journey to Calvary through 14 stations of prayer and meditation.</p>'
    + '<p class="stations-intro-instruction">At each station, we pause to reflect on Christ\u2019s suffering and offer our prayers.</p>'
    + '</div>';
  footer.innerHTML = '<button class="stations-nav-btn stations-nav-primary" onclick="stationsNext()">Begin \u2192</button>';
}

// ── Render: Station prayer screen ──
function _renderStation(title, body, footer) {
  var refs = require('./refs.js');
  var s = _data.stations[_station];
  title.textContent = 'Station ' + s.id + ' of 14';

  var scriptureHtml = '';
  if (s.scripture) {
    scriptureHtml = '<div class="stations-scripture">' + refs.renderRef('bible', s.scripture) + '</div>';
  }

  body.innerHTML = _dotsHtml(_station)
    + '<div class="stations-prayer">'
    + '<div class="stations-num">Station ' + s.id + '</div>'
    + '<h3 class="stations-station-title">' + utils.esc(s.title) + '</h3>'
    + scriptureHtml
    + '<div class="stations-versicle">'
    + '<div class="stations-v-label">V.</div>'
    + '<div class="stations-v-text">' + utils.esc(s.verse) + '</div>'
    + '</div>'
    + '<div class="stations-response">'
    + '<div class="stations-r-label">R.</div>'
    + '<div class="stations-r-text">' + utils.esc(s.response) + '</div>'
    + '</div>'
    + '<div class="stations-meditation">'
    + '<div class="stations-meditation-label">Meditation</div>'
    + '<div class="stations-meditation-text"><p>' + _fmtPrayer(s.meditation) + '</p></div>'
    + '</div>'
    + '<div class="stations-prayer-block">'
    + '<div class="stations-prayer-label">Prayer</div>'
    + '<div class="stations-prayer-text"><p>' + _fmtPrayer(s.prayer) + '</p></div>'
    + '</div>'
    + '</div>';

  refs.initRefTaps(body);

  var prevLabel = _station === 0 ? '\u2190 Introduction' : '\u2190 Station ' + _station;
  var nextLabel = _station < 13 ? 'Station ' + (s.id + 1) + ' \u2192' : 'Closing \u2192';
  footer.innerHTML = _navHtml(prevLabel, nextLabel);

  // Swipe hint (show once)
  if (!_swipeHintShown) {
    _swipeHintShown = true;
    var hintEl = document.createElement('div');
    hintEl.className = 'stations-swipe-hint';
    hintEl.textContent = 'Swipe left or right to navigate';
    body.appendChild(hintEl);
    setTimeout(function() { if (hintEl.parentNode) hintEl.remove(); }, 3000);
  }
}

// ── Render: Closing prayers ──
function _renderClosing(title, body, footer) {
  title.textContent = 'Stations of the Cross';
  var p = _data.prayers;
  body.innerHTML = _dotsHtml(14) // all complete
    + '<div class="stations-closing-prayers">'
    + '<h3 class="stations-section-title">Closing Prayer</h3>'
    + _prayerBlock('Act of Contrition', p.act_of_contrition)
    + _prayerBlock('Sign of the Cross', p.sign_of_cross)
    + '</div>';
  footer.innerHTML = _navHtml('\u2190 Station 14', 'Amen');
}

// ── Render: Completion screen ──
function _renderComplete() {
  var bodyEl = document.getElementById('readerBody');
  var footerEl = document.getElementById('readerFooter');
  var titleEl = document.getElementById('readerTitle');
  if (titleEl) titleEl.textContent = '';
  if (footerEl) {
    footerEl.style.display = '';
    footerEl.innerHTML = '<button class="stations-nav-btn stations-nav-primary" onclick="closeStations()">Amen</button>';
  }
  if (bodyEl) {
    bodyEl.innerHTML = '<div class="stations-complete-screen">'
      + '<svg class="stations-complete-cross" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="64"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
      + '<h3 class="stations-complete-title">The Way of the Cross</h3>'
      + '<p class="stations-complete-quote">\u201CGreater love has no one than this: to lay down one\u2019s life for one\u2019s friends.\u201D</p>'
      + '<p class="stations-complete-ref">\u2014 John 15:13</p>'
      + '<p class="stations-complete-msg">May your walk with Christ bring you<br>closer to the mystery of His love.</p>'
      + '</div>';
  }
}

// ── HTML Helpers ──
function _dotsHtml(active) {
  var html = '<div class="stations-dots" role="navigation" aria-label="Station progress">';
  for (var i = 0; i < 14; i++) {
    var cls = 'stations-dot';
    if (i < active) cls += ' done';
    else if (i === active) cls += ' active';
    html += '<button class="' + cls + '" onclick="stationsGoTo(' + i + ')" aria-label="Go to Station ' + (i + 1) + '" title="Station ' + (i + 1) + '"></button>';
  }
  return html + '</div>';
}

function _prayerBlock(name, text) {
  return '<div class="stations-closing-block">'
    + '<div class="stations-closing-name">' + name + '</div>'
    + '<div class="stations-closing-text"><p>' + _fmtPrayer(text) + '</p></div>'
    + '</div>';
}

function _navHtml(prevLabel, nextLabel) {
  return '<button class="stations-nav-btn stations-nav-secondary" onclick="stationsPrev()">' + prevLabel + '</button>'
    + '<button class="stations-nav-btn stations-nav-primary" onclick="stationsNext()">' + nextLabel + '</button>';
}

module.exports = {
  openStations: openStations,
  closeStations: closeStations,
  stationsNext: stationsNext,
  stationsPrev: stationsPrev,
  stationsGoTo: stationsGoTo,
};
