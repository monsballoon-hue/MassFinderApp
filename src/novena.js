// src/novena.js — Novena Tracker (MOD-05) — Multi-novena tracking (OW-18)
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');

// ── State ──
var _data = null;
var _novenas = null;      // all novena definitions
var _active = null;       // currently selected novena object
var _activeId = null;     // novena ID string
var _currentDay = 0;      // 0-indexed (day 1 = index 0)
var _screen = 'select';   // 'select' | 'prayer' | 'complete'
var _wakeLock = null;

// ── Reader module registration ──
reader.registerModule('novena', {
  getTitle: function() { return 'Novenas'; },
  render: function(params, bodyEl, footerEl) {
    bodyEl.innerHTML = '<div class="novena-loading"><div class="novena-loading-spinner"></div><p>Loading novenas\u2026</p></div>';
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    _load().then(function() {
      _novenas = _data.novenas;
      if (params.id) {
        _selectNovena(params.id);
      } else {
        _migrateOldTracking();
        _screen = 'select';
        _render();
      }
      _acquireWakeLock();
    });
  },
  onClose: function() {
    _releaseWakeLock();
  }
});

// ── Load prayer data (lazy) ──
function _load() {
  if (_data) return Promise.resolve(_data);
  return fetch('/data/prayers.json').then(function(r) { return r.json(); })
    .then(function(d) { _data = d; return d; });
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

// ── Format prayer text (line breaks → HTML) ──
function _fmtPrayer(text) {
  if (!text) return '';
  return utils.esc(text).replace(/\r\n/g, '\n').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// ── Multi-novena localStorage tracking ──
function _migrateOldTracking() {
  try {
    var old = localStorage.getItem('mf-novena-active');
    if (!old) return;
    var parsed = JSON.parse(old);
    if (parsed && parsed.id) {
      var all = _getAllTracking();
      if (!all[parsed.id]) {
        all[parsed.id] = { startDate: parsed.startDate, completedDays: parsed.completedDays || [] };
        localStorage.setItem('mf-novena-tracking', JSON.stringify(all));
      }
    }
    localStorage.removeItem('mf-novena-active');
  } catch (e) {}
}

function _getAllTracking() {
  try {
    return JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
  } catch (e) { return {}; }
}

function _getTracking(id) {
  var all = _getAllTracking();
  return id ? (all[id] || null) : all;
}

function _setTracking(id, obj) {
  var all = _getAllTracking();
  all[id] = obj;
  localStorage.setItem('mf-novena-tracking', JSON.stringify(all));
}

function _clearTracking(id) {
  var all = _getAllTracking();
  delete all[id];
  localStorage.setItem('mf-novena-tracking', JSON.stringify(all));
}

function _getActiveList() {
  var all = _getAllTracking();
  return Object.keys(all).map(function(id) { return { id: id, tracking: all[id] }; });
}

function _computeCurrentDay(tracking) {
  if (!tracking) return 0;
  var start = new Date(tracking.startDate + 'T00:00:00');
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = Math.floor((today - start) / 86400000);
  return Math.min(diff, 8);
}

// ── Open Novena ──
function openNovena(novenaId) {
  reader.readerOpen('novena', { id: novenaId || null });
}

// ── Close Novena ──
function closeNovena() {
  reader.readerClose();
}

// ── Render dispatcher ──
function _render() {
  var title = document.getElementById('readerTitle');
  var body = document.getElementById('readerBody');
  var footer = document.getElementById('readerFooter');
  footer.style.display = '';
  if (_screen === 'select') _renderSelect(title, body, footer);
  else if (_screen === 'prayer') _renderPrayer(title, body, footer);
  else if (_screen === 'complete') _renderComplete(title, body, footer);
}

// ── Render: Select screen with master progress card ──
function _renderSelect(title, body, footer) {
  title.textContent = 'Novenas';
  footer.innerHTML = '';
  footer.style.display = 'none';
  var activeList = _getActiveList();
  var html = '<div class="novena-select">';

  // Master progress card
  if (activeList.length) {
    html += '<div class="novena-master-card">';
    html += '<div class="novena-master-label">Your Active Novenas</div>';
    activeList.forEach(function(item) {
      var nov = _novenas.filter(function(n) { return n.id === item.id; })[0];
      if (!nov) return;
      var dayNum = _computeCurrentDay(item.tracking) + 1;
      var completed = (item.tracking.completedDays || []).length;
      var dotsHtml = '<div class="novena-master-dots">';
      for (var d = 0; d < 9; d++) {
        var dotCls = 'novena-master-dot';
        if ((item.tracking.completedDays || []).indexOf(d + 1) >= 0) dotCls += ' done';
        dotsHtml += '<div class="' + dotCls + '"></div>';
      }
      dotsHtml += '</div>';
      html += '<div class="novena-master-row" onclick="novenaSelect(\'' + item.id + '\')">'
        + '<div class="novena-master-info">'
        + '<div class="novena-master-title">' + utils.esc(nov.title) + '</div>'
        + '<div class="novena-master-progress">Day ' + dayNum + ' of 9 \u00b7 ' + completed + ' completed</div>'
        + '</div>'
        + dotsHtml
        + '<span class="novena-master-chevron">\u203A</span>'
        + '</div>';
    });
    html += '</div>';
  }

  // All novenas list
  html += '<div class="novena-list-label">Available Novenas</div>';
  var allTracking = _getAllTracking();
  _novenas.forEach(function(n) {
    var isActive = !!allTracking[n.id];
    html += '<button class="novena-list-item' + (isActive ? ' active' : '') + '" onclick="novenaSelect(\'' + n.id + '\')">';
    html += '<div class="novena-list-item-body">';
    html += '<div class="novena-list-title">' + utils.esc(n.title) + '</div>';
    html += '<div class="novena-list-desc">' + utils.esc(n.description) + '</div>';
    html += '</div>';
    html += '<span class="novena-list-chevron">\u203A</span>';
    html += '</button>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ── Render: Prayer screen ──
function _renderPrayer(title, body, footer) {
  var dayData = _active.days[_currentDay];
  var dayNum = _currentDay + 1;
  var tracking = _getTracking(_activeId);
  var isCompleted = tracking && (tracking.completedDays || []).indexOf(dayNum) >= 0;
  title.textContent = utils.esc(_active.title);

  // Day dots (9 total)
  var dotsHtml = '<div class="novena-dots">';
  for (var i = 0; i < 9; i++) {
    var cls = 'novena-dot';
    var done = tracking && (tracking.completedDays || []).indexOf(i + 1) >= 0;
    if (done) cls += ' done';
    if (i === _currentDay) cls += ' active';
    dotsHtml += '<button class="' + cls + '" onclick="novenaGoToDay(' + i + ')" aria-label="Day ' + (i + 1) + '"></button>';
  }
  dotsHtml += '</div>';

  var backBtn = '<button class="novena-back-btn" onclick="novenaBack()">\u2190 All Novenas</button>';

  body.innerHTML = '<div class="novena-prayer">'
    + backBtn
    + dotsHtml
    + '<div class="novena-day-num">Day ' + dayNum + ' of 9</div>'
    + (dayData.title ? '<h3 class="novena-day-title">' + utils.esc(dayData.title) + '</h3>' : '')
    + (dayData.intention ? '<div class="novena-intention"><span class="novena-intention-label">Intention:</span> ' + utils.esc(dayData.intention) + '</div>' : '')
    + (dayData.meditation ? '<div class="novena-day-meditation"><p>' + _fmtPrayer(dayData.meditation) + '</p></div>' : '')
    + '<div class="novena-day-prayer"><p>' + _fmtPrayer(dayData.prayer) + '</p></div>'
    + (dayData.response ? '<div class="novena-day-response"><div class="novena-resp-label">Response</div><p>' + _fmtPrayer(dayData.response) + '</p></div>' : '')
    + (dayData.closing_prayer ? '<div class="novena-day-closing"><p>' + _fmtPrayer(dayData.closing_prayer) + '</p></div>' : '')
    + '</div>';

  var markBtn = isCompleted
    ? '<span class="novena-completed-badge">\u2713 Day ' + dayNum + ' Complete</span>'
      + '<button class="novena-done-btn" onclick="closeNovena()">Done</button>'
    : '<button class="novena-mark-btn" onclick="novenaMarkDay()">Complete Day ' + dayNum + '</button>';

  footer.style.display = '';
  footer.innerHTML = '<div class="novena-nav-inner">' + markBtn + '</div>';
}

// ── Render: Complete screen ──
function _renderComplete(title, body, footer) {
  title.textContent = '';
  footer.style.display = '';
  footer.innerHTML = '<button class="novena-nav-close-btn" onclick="closeNovena()">Amen</button>';
  body.innerHTML = '<div class="novena-complete-screen">'
    + '<div class="novena-complete-icon">\u2665</div>'
    + '<h3 class="novena-complete-title">Novena Complete</h3>'
    + '<p class="novena-complete-quote">\u201CAsk and it will be given to you; seek and you will find; knock and the door will be opened to you.\u201D</p>'
    + '<p class="novena-complete-ref">\u2014 Matthew 7:7</p>'
    + '<p class="novena-complete-msg">Your nine days of prayer are complete.<br>May God answer your intentions in His perfect will.</p>'
    + '<button class="novena-complete-new-btn" onclick="novenaStartNew()">Begin Another Novena</button>'
    + '</div>';
}

// ── Day Completion & Tracking ──
function novenaMarkDay() {
  var tracking = _getTracking(_activeId);
  if (!tracking) return;
  var dayNum = _currentDay + 1;
  if (!tracking.completedDays) tracking.completedDays = [];
  if (tracking.completedDays.indexOf(dayNum) < 0) {
    tracking.completedDays.push(dayNum);
    _setTracking(_activeId, tracking);
  }
  _haptic.confirm();

  // Check if all 9 complete
  if (tracking.completedDays.length >= 9) {
    try {
      var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
      log.push({ type: 'novena', date: new Date().toISOString().slice(0, 10), novena: _activeId });
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      log = log.filter(function(e) { return e.date >= cutoff; });
      localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    } catch (e) {}
    _clearTracking(_activeId);
    _screen = 'complete';
  }
  _render();
}

function novenaSelect(id) {
  _selectNovena(id);
  _haptic();
}

function _selectNovena(id) {
  var nov = _novenas.filter(function(n) { return n.id === id; })[0];
  if (!nov) return;
  _active = nov;
  _activeId = id;

  var tracking = _getTracking(id);
  if (tracking) {
    _currentDay = _computeCurrentDay(tracking);
  } else {
    var today = new Date().toISOString().slice(0, 10);
    _setTracking(id, { startDate: today, completedDays: [] });
    _currentDay = 0;
  }
  _screen = 'prayer';
  _render();
}

function novenaResume() {
  _screen = 'select';
  _render();
  _haptic();
}

function novenaGoToDay(idx) {
  if (idx < 0 || idx > 8) return;
  _currentDay = idx;
  _render();
  _haptic();
}

function novenaBack() {
  _screen = 'select';
  _render();
  _haptic();
}

function novenaStartNew() {
  _screen = 'select';
  _active = null;
  _activeId = null;
  _render();
  _haptic();
}

module.exports = {
  openNovena: openNovena,
  closeNovena: closeNovena,
  novenaSelect: novenaSelect,
  novenaResume: novenaResume,
  novenaMarkDay: novenaMarkDay,
  novenaGoToDay: novenaGoToDay,
  novenaBack: novenaBack,
  novenaStartNew: novenaStartNew,
  _computeCurrentDay: _computeCurrentDay,
};
