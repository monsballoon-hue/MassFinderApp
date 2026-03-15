// src/chaplet.js — Divine Mercy Chaplet (PMD-01/02)
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');
function _t(item, field) { return utils.getPrayerText(item, field); }
function _prayerText(p) { return (typeof p === 'object' && p) ? _t(p, 'text') : (p || ''); }

// ── State ──
var _data = null;       // full prayers.json
var _chaplet = null;    // chaplet object from prayers.json
var _screen = 'intro';  // 'intro' | 'opening' | 'decade' | 'closing' | 'final'
var _decade = 0;        // 0-4
var _bead = 0;          // 0 = large bead, 1-10 = small beads
var _openingStep = 0;   // 0-3 (sign of cross, our father, hail mary, creed)
var _closingRep = 0;    // 0-2 (three repetitions of "Holy God...")
var _wakeLock = null;
var _touchStartX = 0;
var _touchStartY = 0;

// ── Reader module registration ──
reader.registerModule('chaplet', {
  getTitle: function() { return 'Divine Mercy Chaplet'; },
  render: function(params, bodyEl, footerEl) {
    bodyEl.innerHTML = '<div class="chaplet-loading"><div class="rosary-loading-spinner"></div><p>Loading\u2026</p></div>';
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    _load().then(function() {
      _screen = 'intro';
      _decade = 0;
      _bead = 0;
      _openingStep = 0;
      _closingRep = 0;
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
    .then(function(d) { _data = d; _chaplet = d.chaplet; return d; });
}

// ── Wake Lock ──
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
  if (document.visibilityState === 'visible' && cur && cur.mode === 'chaplet') {
    _acquireWakeLock();
  }
}

// ── Format prayer text ──
function _fmtPrayer(text) {
  if (!text) return '';
  return utils.esc(text).replace(/\r\n/g, '\n').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// ── Open / Close ──
function openChaplet() {
  reader.readerOpen('chaplet', {});
}

function closeChaplet() {
  reader.readerClose();
}

// ── Navigation ──
function chapletNext() {
  if (_screen === 'intro') {
    _screen = 'opening';
    _openingStep = 0;
  } else if (_screen === 'opening') {
    if (_openingStep < 3) {
      _openingStep++;
    } else {
      _screen = 'decade';
      _decade = 0;
      _bead = 0;
    }
  } else if (_screen === 'decade') {
    if (_bead < 10) {
      _bead++;
    } else {
      // End of decade
      if (_decade < 4) {
        _decade++;
        _bead = 0;
      } else {
        _screen = 'closing';
        _closingRep = 0;
      }
    }
  } else if (_screen === 'closing') {
    if (_closingRep < 2) {
      _closingRep++;
    } else {
      _screen = 'final';
    }
  } else if (_screen === 'final') {
    // Log completion
    try {
      var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
      log.push({ type: 'chaplet', date: new Date().toISOString().slice(0, 10) });
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      log = log.filter(function(e) { return e.date >= cutoff; });
      localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    } catch (e) {}
    _haptic.confirm();
    closeChaplet();
    return;
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

function chapletPrev() {
  if (_screen === 'final') {
    _screen = 'closing';
    _closingRep = 2;
  } else if (_screen === 'closing') {
    if (_closingRep > 0) {
      _closingRep--;
    } else {
      _screen = 'decade';
      _decade = 4;
      _bead = 10;
    }
  } else if (_screen === 'decade') {
    if (_bead > 0) {
      _bead--;
    } else {
      if (_decade > 0) {
        _decade--;
        _bead = 10;
      } else {
        _screen = 'opening';
        _openingStep = 3;
      }
    }
  } else if (_screen === 'opening') {
    if (_openingStep > 0) {
      _openingStep--;
    } else {
      _screen = 'intro';
    }
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

// ── Crossfade transition ──
function _transitionTo(renderFn) {
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

// ── Swipe gesture ──
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
  if (dx < 0) chapletNext();
  else chapletPrev();
}

// ── Render dispatcher ──
function _render() {
  var title = document.getElementById('readerTitle');
  var body = document.getElementById('readerBody');
  var footer = document.getElementById('readerFooter');
  footer.style.display = '';

  if (_screen === 'intro') _renderIntro(title, body, footer);
  else if (_screen === 'opening') _renderOpening(title, body, footer);
  else if (_screen === 'decade') _renderDecade(title, body, footer);
  else if (_screen === 'closing') _renderClosing(title, body, footer);
  else if (_screen === 'final') _renderFinal(title, body, footer);
}

// ── Render: Intro screen ──
function _renderIntro(title, body, footer) {
  title.textContent = 'Divine Mercy Chaplet';
  footer.innerHTML = '';
  footer.style.display = 'none';

  body.innerHTML = '<div class="chaplet-intro">'
    + '<svg class="chaplet-intro-cross" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="52"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
    + '<h2 class="chaplet-intro-title">The Divine Mercy Chaplet</h2>'
    + '<p class="chaplet-intro-origin">' + utils.esc(_t(_chaplet, 'origin')) + '</p>'
    + '<blockquote class="chaplet-intro-quote">'
    + '<p>\u201C' + utils.esc(_chaplet.quote.text) + '\u201D</p>'
    + '<cite class="chaplet-intro-ref">\u2014 ' + utils.esc(_chaplet.quote.ref) + '</cite>'
    + '</blockquote>'
    + '<button class="chaplet-begin" onclick="chapletNext()">Begin</button>'
    + '</div>';
}

// ── Render: Opening prayers ──
function _renderOpening(title, body, footer) {
  title.textContent = 'Divine Mercy Chaplet';
  var prayerIds = _chaplet.opening;
  var names = ['Sign of the Cross', 'Our Father', 'Hail Mary', 'Apostles\' Creed'];
  var prayerKey = prayerIds[_openingStep];
  var prayerText = _prayerText(_data.prayers[prayerKey]);

  body.innerHTML = '<div class="chaplet-prayer">'
    + '<div class="chaplet-decade-label">Opening \u00b7 ' + (_openingStep + 1) + ' of 4</div>'
    + '<h3 class="chaplet-step-title">' + names[_openingStep] + '</h3>'
    + '<div class="chaplet-prayer-text"><p>' + _fmtPrayer(prayerText) + '</p></div>'
    + '</div>';

  footer.style.display = '';
  footer.innerHTML = _navHtml(
    _openingStep === 0 ? '\u2190 Back' : '\u2190 ' + names[_openingStep - 1],
    _openingStep < 3 ? names[_openingStep + 1] + ' \u2192' : 'First Decade \u2192'
  );
}

// ── Render: Decade ──
function _renderDecade(title, body, footer) {
  title.textContent = 'Divine Mercy Chaplet';

  var isLargeBead = (_bead === 0);
  var prayerText = isLargeBead ? _prayerText(_chaplet.decade_large) : _prayerText(_chaplet.decade_small);
  var beadLabel = isLargeBead
    ? 'Large Bead'
    : 'Bead ' + _bead + ' of 10';

  body.innerHTML = '<div class="chaplet-prayer">'
    + '<div class="chaplet-decade-label">Decade ' + (_decade + 1) + ' of 5 \u00b7 ' + beadLabel + '</div>'
    + _decadeDotsHtml()
    + '<div class="chaplet-prayer-text"><p>' + _fmtPrayer(prayerText) + '</p></div>'
    + '</div>';

  var prevLabel = (_bead === 0 && _decade === 0) ? '\u2190 Opening' : '\u2190 Back';
  var nextLabel = (_bead < 10) ? 'Continue \u2192' : (_decade < 4 ? 'Next Decade \u2192' : 'Closing \u2192');
  footer.style.display = '';
  footer.innerHTML = _navHtml(prevLabel, nextLabel);
}

// ── Render: Closing (3x Holy God) ──
function _renderClosing(title, body, footer) {
  title.textContent = 'Divine Mercy Chaplet';

  body.innerHTML = '<div class="chaplet-prayer">'
    + '<div class="chaplet-decade-label">Closing \u00b7 ' + (_closingRep + 1) + ' of 3</div>'
    + '<div class="chaplet-prayer-text"><p>' + _fmtPrayer(_prayerText(_chaplet.closing)) + '</p></div>'
    + '</div>';

  footer.style.display = '';
  footer.innerHTML = _navHtml(
    _closingRep === 0 ? '\u2190 Fifth Decade' : '\u2190 Back',
    _closingRep < 2 ? 'Continue \u2192' : 'Closing Prayer \u2192'
  );
}

// ── Render: Final (optional closing prayer + Amen) ──
function _renderFinal(title, body, footer) {
  title.textContent = '';

  body.innerHTML = '<div class="chaplet-prayer chaplet-final">'
    + '<svg class="chaplet-final-cross" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="52"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
    + '<div class="chaplet-prayer-text"><p>' + _fmtPrayer(_prayerText(_chaplet.optional_closing)) + '</p></div>'
    + '</div>';

  footer.style.display = '';
  footer.innerHTML = '<div style="display:flex"><button class="rosary-nav-btn rosary-nav-primary" onclick="chapletNext()">Amen</button></div>';
}

// ── Bead dots for decade screen ──
function _decadeDotsHtml() {
  if (_bead === 0) return ''; // large bead — no dot display
  var html = '<div class="chaplet-beads">';
  for (var i = 1; i <= 10; i++) {
    var cls = 'chaplet-bead';
    if (i < _bead) cls += ' done';
    else if (i === _bead) cls += ' active';
    html += '<div class="' + cls + '"></div>';
  }
  html += '</div>';
  return html;
}

// ── Nav buttons HTML ──
function _navHtml(prevLabel, nextLabel) {
  return '<div style="display:flex;gap:var(--space-3)">'
    + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="chapletPrev()">' + prevLabel + '</button>'
    + '<button class="rosary-nav-btn rosary-nav-primary" onclick="chapletNext()">' + nextLabel + '</button>'
    + '</div>';
}

module.exports = {
  openChaplet: openChaplet,
  closeChaplet: closeChaplet,
  chapletNext: chapletNext,
  chapletPrev: chapletPrev,
};
