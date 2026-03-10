// src/rosary.js — Guided Rosary Module (MOD-02 + UX-05)
var utils = require('./utils.js');

// ── State ──
var _data = null;
var _set = null;         // 'Joyful' | 'Sorrowful' | 'Glorious' | 'Luminous'
var _mysteries = null;
var _screen = 'select';  // 'select' | 'opening' | 'decade' | 'closing'
var _decade = 0;         // 0-4
var _bead = 0;           // 0-10 (Hail Mary counter within decade)
var _wakeLock = null;
var _touchStartX = 0;
var _touchStartY = 0;
var _longPressTimer = null;

var SET_META = {
  Joyful:    { color: '#4A90D9', desc: 'Monday & Saturday' },
  Sorrowful: { color: '#C0392B', desc: 'Tuesday & Friday' },
  Glorious:  { color: '#D4A017', desc: 'Wednesday & Sunday' },
  Luminous:  { color: '#27AE60', desc: 'Thursday' }
};

// ── Load prayer data (lazy) ──
function _load() {
  if (_data) return Promise.resolve(_data);
  return fetch('/data/prayers.json').then(function(r) { return r.json(); })
    .then(function(d) { _data = d; return d; });
}

// ── Day-based mystery selection (with Lent override) ──
function _todaySet() {
  if (!_data) return 'Joyful';
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var today = days[new Date().getDay()];
  var set = _data.dayMysteries[today] || 'Joyful';
  // During Lent, Sorrowful is traditional on days that would otherwise be Joyful
  if (utils.isLentSeason() && set === 'Joyful' && today !== 'saturday') {
    set = 'Sorrowful';
  }
  return set;
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

// Re-acquire wake lock when page becomes visible again
function _handleVisibility() {
  if (document.visibilityState === 'visible' && document.getElementById('rosaryOverlay').classList.contains('open')) {
    _acquireWakeLock();
  }
}

// ── Format prayer text (line breaks → HTML) ──
function _fmtPrayer(text) {
  if (!text) return '';
  return utils.esc(text).replace(/\r\n/g, '\n').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

function _ordinal(n) {
  var s = ['', '1st', '2nd', '3rd', '4th', '5th'];
  return s[n] || n + 'th';
}

// ── Open Rosary ──
function openRosary(mysterySet) {
  var overlay = document.getElementById('rosaryOverlay');
  // Show loading state
  document.getElementById('rosaryBody').innerHTML = '<div class="rosary-loading"><div class="rosary-loading-spinner"></div><p>Loading prayers\u2026</p></div>';
  document.getElementById('rosaryProgress').innerHTML = '';
  document.getElementById('rosaryNav').innerHTML = '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  _load().then(function() {
    _screen = mysterySet ? 'opening' : 'select';
    _set = mysterySet || _todaySet();
    _mysteries = _data.mysteries[_set];
    _decade = 0;
    _bead = 0;
    _render();
    _acquireWakeLock();
    document.addEventListener('visibilitychange', _handleVisibility);
    _initSwipe();
  });
}

// ── Close Rosary ──
function closeRosary() {
  document.getElementById('rosaryOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _releaseWakeLock();
  document.removeEventListener('visibilitychange', _handleVisibility);
  _teardownSwipe();
}

// ── Select mystery set ──
function rosarySelectSet(setName) {
  _set = setName;
  _mysteries = _data.mysteries[_set];
  _decade = 0;
  _bead = 0;
  _screen = 'opening';
  _render();
  _scrollTop();
}

// ── Navigate between screens ──
function rosaryNext() {
  if (_screen === 'select') return; // need explicit set selection
  if (_screen === 'opening') {
    _screen = 'decade';
    _decade = 0;
    _bead = 0;
  } else if (_screen === 'decade') {
    if (_decade < 4) { _decade++; _bead = 0; }
    else { _screen = 'closing'; }
  } else if (_screen === 'closing') {
    closeRosary();
    return;
  }
  _render();
  _scrollTop();
}

function rosaryPrev() {
  if (_screen === 'closing') {
    _screen = 'decade';
    _decade = 4;
    _bead = 0;
  } else if (_screen === 'decade') {
    if (_decade > 0) { _decade--; _bead = 0; }
    else { _screen = 'opening'; }
  } else if (_screen === 'opening') {
    _screen = 'select';
  }
  _render();
  _scrollTop();
}

// ── Jump to decade from progress dots ──
function rosaryGoTo(decadeIdx) {
  if (decadeIdx < 0 || decadeIdx > 4) return;
  _screen = 'decade';
  _decade = decadeIdx;
  _bead = 0;
  _render();
  _scrollTop();
}

// ── Bead tap — advance Hail Mary counter ──
function rosaryBeadTap() {
  if (_screen !== 'decade' || _bead >= 10) return;
  _bead++;
  _updateBeadUI();
}

// ── Bead reset (long press) ──
function rosaryBeadReset() {
  if (_screen !== 'decade' || _bead === 0) return;
  _bead = 0;
  _updateBeadUI();
}

function _updateBeadUI() {
  var el = document.getElementById('rosaryBeads');
  if (el) el.innerHTML = _beadDotsHtml();
  var label = document.getElementById('rosaryBeadLabel');
  if (label) {
    if (_bead === 0) label.textContent = 'Tap to count';
    else if (_bead >= 10) label.textContent = 'All 10 complete';
    else label.textContent = 'Hail Mary ' + _bead + ' of 10';
  }
  // Update completion state
  var section = document.querySelector('.rosary-hm-section');
  if (section) section.classList.toggle('complete', _bead >= 10);
}

function _scrollTop() {
  var b = document.getElementById('rosaryBody');
  if (b) b.scrollTop = 0;
}

// ── Swipe gesture for decade navigation ──
function _initSwipe() {
  var body = document.getElementById('rosaryBody');
  if (!body) return;
  body.addEventListener('touchstart', _onTouchStart, { passive: true });
  body.addEventListener('touchend', _onTouchEnd, { passive: true });
}

function _teardownSwipe() {
  var body = document.getElementById('rosaryBody');
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
  // Only trigger if horizontal swipe > 60px and more horizontal than vertical
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  if (_screen === 'select') return;
  if (dx < 0) rosaryNext();  // swipe left → next
  else rosaryPrev();         // swipe right → prev
}

// ── Render main dispatcher ──
function _render() {
  var title = document.getElementById('rosaryTitle');
  var body = document.getElementById('rosaryBody');
  var progress = document.getElementById('rosaryProgress');
  var nav = document.getElementById('rosaryNav');
  if (_screen === 'select') _renderSelect(title, body, progress, nav);
  else if (_screen === 'opening') _renderOpening(title, body, progress, nav);
  else if (_screen === 'decade') _renderDecade(title, body, progress, nav);
  else if (_screen === 'closing') _renderClosing(title, body, progress, nav);
}

// ── Render: Select screen ──
function _renderSelect(title, body, progress, nav) {
  title.textContent = 'The Holy Rosary';
  progress.innerHTML = '';
  nav.innerHTML = '';
  var todaySet = _todaySet();
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var dayName = days[new Date().getDay()];
  var isLent = utils.isLentSeason();

  body.innerHTML = '<div class="rosary-select">'
    + '<div class="rosary-select-intro">'
    + '<svg class="rosary-cross-svg" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
    + '<p>Today is <strong>' + dayName + '</strong></p>'
    + (isLent ? '<p class="rosary-select-season">Lenten Season</p>' : '')
    + '<p class="rosary-select-rec">The traditional mysteries for today are the<br><strong>' + todaySet + ' Mysteries</strong></p>'
    + '</div>'
    // Prominent CTA for today's recommendation
    + '<button class="rosary-begin-btn" onclick="rosarySelectSet(\'' + todaySet + '\')" style="--set-color:' + (SET_META[todaySet] || {}).color + '">'
    + 'Begin ' + todaySet + ' Mysteries</button>'
    + '<div class="rosary-select-divider"><span>or choose</span></div>'
    + '<div class="rosary-set-grid">'
    + Object.keys(_data.mysteries).map(function(s) {
      var meta = SET_META[s] || {};
      if (s === todaySet) return ''; // already shown above
      return '<button class="rosary-set-btn" onclick="rosarySelectSet(\'' + s + '\')" style="--set-color:' + (meta.color || '#666') + '">'
        + '<span class="rosary-set-name">' + s + '</span>'
        + '<span class="rosary-set-day">' + (meta.desc || '') + '</span>'
        + '</button>';
    }).join('')
    + '</div></div>';
}

// ── Render: Opening prayers ──
function _renderOpening(title, body, progress, nav) {
  title.textContent = _set + ' Mysteries';
  progress.innerHTML = _dotsHtml(-1);
  var p = _data.prayers;
  body.innerHTML = '<div class="rosary-prayers">'
    + '<h3 class="rosary-section-title">Opening Prayers</h3>'
    + _prayerBlock('Sign of the Cross', p.sign_of_cross)
    + _prayerBlock('Apostles\' Creed', p.apostles_creed)
    + _prayerBlock('Our Father', p.our_father)
    + _prayerBlock('Three Hail Marys', p.hail_mary, 'For an increase of Faith, Hope, and Charity')
    + _prayerBlock('Glory Be', p.glory_be)
    + '</div>';
  nav.innerHTML = _navHtml('Back', 'Begin First Decade \u2192');
}

// ── Render: Decade ──
function _renderDecade(title, body, progress, nav) {
  var m = _mysteries[_decade];
  var meta = SET_META[_set] || {};
  title.textContent = _set + ' Mysteries';
  progress.innerHTML = _dotsHtml(_decade);
  var p = _data.prayers;

  // CCC refs
  var cccHtml = '';
  if (m.ccc && m.ccc.length) {
    cccHtml = '<div class="rosary-mystery-refs">' + m.ccc.map(function(n) {
      return '<span class="ccc-ref" onclick="window.openCCC(\'' + n + '\');event.stopPropagation()">CCC ' + n + '</span>';
    }).join(' ') + '</div>';
  }

  body.innerHTML = '<div class="rosary-decade">'
    // Mystery card
    + '<div class="rosary-mystery" style="--set-color:' + (meta.color || '#666') + '">'
    + '<div class="rosary-mystery-num">' + _ordinal(_decade + 1) + ' ' + _set + ' Mystery</div>'
    + '<h3 class="rosary-mystery-title">' + utils.esc(m.title) + '</h3>'
    + '<div class="rosary-mystery-scripture" onclick="window._refTap(\'bible\',\'' + utils.esc(m.scripture) + '\')">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> '
    + utils.esc(m.scripture) + '</div>'
    + '<p class="rosary-mystery-meditation">' + utils.esc(m.meditation) + '</p>'
    + '<div class="rosary-mystery-fruit"><strong>Fruit:</strong> ' + utils.esc(m.fruit) + '</div>'
    + cccHtml
    + '</div>'
    // Our Father (collapsible)
    + _prayerBlockCollapsible('Our Father', p.our_father)
    // Hail Mary bead counter
    + '<div class="rosary-hm-section' + (_bead >= 10 ? ' complete' : '') + '">'
    + '<div class="rosary-hm-header">10 Hail Marys</div>'
    + '<div class="rosary-beads" id="rosaryBeads" role="group" aria-label="Hail Mary bead counter, ' + _bead + ' of 10">'
    + _beadDotsHtml() + '</div>'
    + '<div class="rosary-bead-label" id="rosaryBeadLabel">'
    + (_bead === 0 ? 'Tap to count' : _bead >= 10 ? 'All 10 complete' : 'Hail Mary ' + _bead + ' of 10')
    + '</div>'
    + (_bead === 0 ? '<div class="rosary-bead-hint">Tap beads to count \u00b7 hold to reset</div>' : _bead < 10 ? '<div class="rosary-bead-hint">Hold to reset</div>' : '')
    + '</div>'
    + _prayerBlockCollapsible('Hail Mary', p.hail_mary)
    // Glory Be + O My Jesus (collapsible)
    + _prayerBlockCollapsible('Glory Be', p.glory_be)
    + _prayerBlockCollapsible('O My Jesus', p.o_my_jesus, 'Fatima Prayer')
    + '</div>';

  var prevLabel = _decade === 0 ? '\u2190 Opening' : '\u2190 ' + _ordinal(_decade) + ' Decade';
  var nextLabel = _decade < 4 ? _ordinal(_decade + 2) + ' Decade \u2192' : 'Closing \u2192';
  nav.innerHTML = _navHtml(prevLabel, nextLabel);

  // Attach bead handlers programmatically (avoids window.* exposure + touch/click double-fire)
  var beadEl = document.getElementById('rosaryBeads');
  if (beadEl) {
    var _touchFired = false;
    beadEl.addEventListener('touchstart', function() {
      _longPressTimer = setTimeout(function() {
        rosaryBeadReset();
        _longPressTimer = null;
      }, 600);
    }, { passive: true });
    beadEl.addEventListener('touchend', function() {
      _touchFired = true;
      setTimeout(function() { _touchFired = false; }, 300);
      if (_longPressTimer) {
        clearTimeout(_longPressTimer);
        _longPressTimer = null;
        rosaryBeadTap();
      }
    }, { passive: true });
    beadEl.addEventListener('click', function() {
      if (_touchFired) return; // already handled by touch
      rosaryBeadTap();
    });
  }
}

// ── Render: Closing ──
function _renderClosing(title, body, progress, nav) {
  title.textContent = _set + ' Mysteries';
  progress.innerHTML = _dotsHtml(5);
  var p = _data.prayers;
  body.innerHTML = '<div class="rosary-prayers">'
    + '<h3 class="rosary-section-title">Closing Prayers</h3>'
    + _prayerBlock('Hail, Holy Queen', p.hail_holy_queen)
    + _prayerBlock('Sign of the Cross', p.sign_of_cross)
    + '<div class="rosary-complete">'
    + '<svg class="rosary-complete-cross" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
    + '<p>May the Holy Rosary bring you peace<br>and draw you closer to our Lord.</p>'
    + '</div></div>';
  nav.innerHTML = _navHtml('\u2190 Fifth Decade', 'Amen');
}

// ── HTML helpers ──
function _prayerBlock(name, text, subtitle) {
  return '<div class="rosary-prayer-block">'
    + '<div class="rosary-prayer-name">' + name + '</div>'
    + (subtitle ? '<div class="rosary-prayer-sub">' + subtitle + '</div>' : '')
    + '<div class="rosary-prayer-text"><p>' + _fmtPrayer(text) + '</p></div>'
    + '</div>';
}

// Collapsible prayer block — experienced pray-ers can collapse texts they know
function _prayerBlockCollapsible(name, text, subtitle) {
  return '<details class="rosary-prayer-block rosary-prayer-collapsible" open>'
    + '<summary class="rosary-prayer-name">' + name
    + '<svg class="rosary-prayer-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
    + '</summary>'
    + (subtitle ? '<div class="rosary-prayer-sub">' + subtitle + '</div>' : '')
    + '<div class="rosary-prayer-text"><p>' + _fmtPrayer(text) + '</p></div>'
    + '</details>';
}

function _dotsHtml(active) {
  var html = '<div class="rosary-dots" role="navigation" aria-label="Decade progress">';
  for (var i = 0; i < 5; i++) {
    var cls = 'rosary-dot';
    if (i < active) cls += ' done';
    else if (i === active) cls += ' active';
    html += '<button class="' + cls + '" onclick="rosaryGoTo(' + i + ')" aria-label="Go to ' + _ordinal(i + 1) + ' decade" title="' + _ordinal(i + 1) + ' Decade"></button>';
  }
  return html + '</div>';
}

function _beadDotsHtml() {
  var html = '';
  for (var i = 0; i < 10; i++) {
    html += '<div class="rosary-bead' + (i < _bead ? ' filled' : '') + (i === _bead - 1 ? ' latest' : '') + '" aria-hidden="true"></div>';
  }
  return html;
}

function _navHtml(prevLabel, nextLabel) {
  return '<button class="rosary-nav-btn rosary-nav-secondary" onclick="rosaryPrev()">' + prevLabel + '</button>'
    + '<button class="rosary-nav-btn rosary-nav-primary" onclick="rosaryNext()">' + nextLabel + '</button>';
}

module.exports = {
  openRosary: openRosary,
  closeRosary: closeRosary,
  rosarySelectSet: rosarySelectSet,
  rosaryNext: rosaryNext,
  rosaryPrev: rosaryPrev,
  rosaryGoTo: rosaryGoTo,
  rosaryBeadTap: rosaryBeadTap,
  rosaryBeadReset: rosaryBeadReset,
};
