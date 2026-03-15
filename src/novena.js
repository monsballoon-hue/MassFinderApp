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

function _computeCurrentDay(tracking, totalDays) {
  // Current day = next unfinished day (based on completed count, not calendar diff)
  if (!tracking) return 0;
  var max = (totalDays || 9) - 1;
  return Math.min((tracking.completedDays || []).length, max);
}

function _todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function _alreadyPrayedToday(tracking) {
  return tracking && tracking.lastCompletedDate === _todayStr();
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
      var totalDays = nov.days.length;
      var dayNum = _computeCurrentDay(item.tracking, totalDays) + 1;
      var completed = (item.tracking.completedDays || []).length;
      var dotsHtml = '';
      if (totalDays <= 12) {
        dotsHtml = '<div class="novena-master-dots">';
        for (var d = 0; d < totalDays; d++) {
          var dotCls = 'novena-master-dot';
          if ((item.tracking.completedDays || []).indexOf(d + 1) >= 0) dotCls += ' done';
          dotsHtml += '<div class="' + dotCls + '"></div>';
        }
        dotsHtml += '</div>';
      } else {
        var pct = Math.round((completed / totalDays) * 100);
        dotsHtml = '<div class="novena-progress-bar"><div class="novena-progress-fill" style="width:' + pct + '%"></div></div>';
      }
      var progressLabel = _alreadyPrayedToday(item.tracking)
        ? 'Day ' + dayNum + ' available tomorrow'
        : 'Day ' + dayNum + ' of ' + totalDays + ' \u00b7 ' + completed + ' completed';
      html += '<div class="novena-master-row" onclick="novenaSelect(\'' + item.id + '\')">'
        + '<div class="novena-master-info">'
        + '<div class="novena-master-title">' + utils.esc(nov.title) + '</div>'
        + '<div class="novena-master-progress">' + progressLabel + '</div>'
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
  html += '<div class="novena-more-note">Have a novena suggestion? <a href="mailto:massfinderapp@gmail.com?subject=Novena%20Request" class="novena-more-link">Let us know</a></div>';
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

  // Day dots — completed days tappable; next day locked if already prayed today; future days always locked
  var totalDays = _active.days.length;
  var nextUnlocked = _computeCurrentDay(tracking, totalDays); // 0-indexed index of next day to pray
  var alreadyPrayedToday = _alreadyPrayedToday(tracking);
  var dotsHtml = '';
  if (totalDays <= 12) {
    dotsHtml = '<div class="novena-dots">';
    for (var i = 0; i < totalDays; i++) {
      var cls = 'novena-dot';
      var done = tracking && (tracking.completedDays || []).indexOf(i + 1) >= 0;
      if (done) cls += ' done';
      if (i === _currentDay) cls += ' active';
      if (i > nextUnlocked || (alreadyPrayedToday && i >= nextUnlocked)) {
        cls += ' locked';
        dotsHtml += '<span class="' + cls + '" aria-label="Day ' + (i + 1) + ' locked"></span>';
      } else {
        dotsHtml += '<button class="' + cls + '" onclick="novenaGoToDay(' + i + ')" aria-label="Day ' + (i + 1) + '"></button>';
      }
    }
    dotsHtml += '</div>';
  } else {
    var completed = (tracking && tracking.completedDays) ? tracking.completedDays.length : 0;
    var pct = Math.round((completed / totalDays) * 100);
    dotsHtml = '<div class="novena-progress-bar novena-progress-bar--prayer"><div class="novena-progress-fill" style="width:' + pct + '%"></div></div>';
  }

  var backBtn = '<button class="novena-back-btn" onclick="novenaBack()">\u2190 All Novenas</button>';

  body.innerHTML = '<div class="novena-prayer">'
    + backBtn
    + dotsHtml
    + '<div class="novena-day-num">Day ' + dayNum + ' of ' + totalDays + '</div>'
    + (dayData.title ? '<h3 class="novena-day-title">' + utils.esc(dayData.title) + '</h3>' : '')
    + (dayData.intention ? '<div class="novena-intention"><span class="novena-intention-label">Intention:</span> ' + utils.esc(dayData.intention) + '</div>' : '')
    + (dayData.meditation ? '<div class="novena-day-meditation"><p>' + _fmtPrayer(dayData.meditation) + '</p></div>' : '')
    + '<div class="novena-day-prayer"><p>' + _fmtPrayer(dayData.prayer) + '</p></div>'
    + (dayData.response ? '<div class="novena-day-response"><div class="novena-resp-label">Response</div><p>' + _fmtPrayer(dayData.response) + '</p></div>' : '')
    + (dayData.closing_prayer ? '<div class="novena-day-closing"><p>' + _fmtPrayer(dayData.closing_prayer) + '</p></div>' : '')
    + '</div>';

  var alreadyToday = _alreadyPrayedToday(tracking) && !isCompleted;
  var markBtn;
  if (isCompleted) {
    markBtn = '<span class="novena-completed-badge">\u2713 Day ' + dayNum + ' Complete</span>'
      + '<button class="novena-done-btn" onclick="closeNovena()">Done</button>';
  } else if (alreadyToday) {
    markBtn = '<span class="novena-tomorrow-note">Day ' + dayNum + ' will be ready tomorrow</span>';
  } else {
    markBtn = '<button class="novena-mark-btn" onclick="novenaMarkDay()">Complete Day ' + dayNum + '</button>';
  }

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
    + '<p class="novena-complete-msg">Your days of prayer are complete.<br>May God answer your intentions in His perfect will.</p>'
    + '<button class="novena-complete-new-btn" onclick="novenaStartNew()">Begin Another Novena</button>'
    + '</div>';
}

// ── Day Completion & Tracking ──
function novenaMarkDay() {
  var tracking = _getTracking(_activeId);
  if (!tracking) return;
  // One day per calendar day
  if (_alreadyPrayedToday(tracking)) { _render(); return; }
  var dayNum = _currentDay + 1;
  // Sequential only — can only mark the next day in order
  if (dayNum !== (tracking.completedDays || []).length + 1) { _render(); return; }
  if (!tracking.completedDays) tracking.completedDays = [];
  if (tracking.completedDays.indexOf(dayNum) < 0) {
    tracking.completedDays.push(dayNum);
    tracking.lastCompletedDate = _todayStr();
    _setTracking(_activeId, tracking);
  }
  _haptic.confirm();

  // Check if all days complete
  var totalDays = _active.days.length;
  if (tracking.completedDays.length >= totalDays) {
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
    // If already prayed today, open to last completed day for review, not the next locked day
    var nextDay = _computeCurrentDay(tracking, nov.days.length);
    _currentDay = (_alreadyPrayedToday(tracking) && nextDay > 0) ? nextDay - 1 : nextDay;
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
  var maxIdx = _active ? _active.days.length - 1 : 8;
  if (idx < 0 || idx > maxIdx) return;
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

function _getTotalDays(novenaId) {
  if (!_data || !_data.novenas) return 9;
  var nov = _data.novenas.filter(function(n) { return n.id === novenaId; })[0];
  return nov ? nov.days.length : 9;
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
  _getTotalDays: _getTotalDays,
};
