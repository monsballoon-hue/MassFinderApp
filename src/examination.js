// src/examination.js — Examination of Conscience (MOD-03)
// Full-screen overlay with expandable commandment sections, tappable CCC refs,
// Act of Contrition, confession tracker, and "Find Confession Near Me" button.
// Privacy first: no data stored about which questions resonate.
// UX: Apple HIG — inset grouped list, animated expand/collapse, haptics, swipe-dismiss.

var refs = require('./refs.js');
var ui = require('./ui.js');

var _examData = null;
var _expanded = {};  // commandment key → bool

// ── Haptic feedback (shared with rosary.js pattern) ──
function _haptic() {
  try {
    if (navigator.vibrate) { navigator.vibrate(10); return; }
    var label = document.createElement('label');
    label.ariaHidden = 'true';
    label.style.display = 'none';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.head.appendChild(label);
    label.click();
    document.head.removeChild(label);
  } catch (e) {}
}

// ── Load data ──
function _loadData(cb) {
  if (_examData) return cb(_examData);
  fetch('data/examination.json').then(function(r) { return r.json(); })
    .then(function(d) { _examData = d; cb(d); })
    .catch(function(e) { console.warn('[Examination] Failed to load data:', e); });
}

// ── Escape HTML ──
function _esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Render a single commandment/precepts row within a group ──
function _renderSection(section, key, isFirst, isLast) {
  var isExpanded = !!_expanded[key];
  var cccRef = section.ccc ? refs.renderRef('ccc', section.ccc) : '';

  // Number badge for numbered commandments
  var numBadge = section.number
    ? '<span class="exam-num">' + section.number + '</span>'
    : '<span class="exam-num exam-num--icon">\u2690</span>';

  var html = '<div class="exam-row' + (isExpanded ? ' expanded' : '') + (isFirst ? ' exam-row--first' : '') + (isLast ? ' exam-row--last' : '') + '" data-key="' + key + '">';
  html += '<button class="exam-row-header" onclick="examToggleSection(\'' + key + '\')" aria-expanded="' + isExpanded + '">';
  html += numBadge;
  html += '<span class="exam-row-title">' + _esc(section.title) + '</span>';
  html += '<svg class="exam-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';
  html += '</button>';

  // Animated body wrapper — uses grid-template-rows for smooth height transition
  html += '<div class="exam-row-body">';
  html += '<div class="exam-row-inner">';
  if (cccRef) {
    html += '<div class="exam-ccc-ref">' + cccRef + '</div>';
  }
  section.questions.forEach(function(q) {
    var qRef = q.ccc ? refs.renderRef('ccc', q.ccc) : '';
    html += '<div class="exam-q">';
    html += '<span class="exam-q-text">' + _esc(q.text) + '</span>';
    if (qRef) html += '<span class="exam-q-ref">' + qRef + '</span>';
    html += '</div>';
  });
  html += '</div></div></div>';
  return html;
}

// ── Render prayer block ──
function _renderPrayer(prayer, icon) {
  if (!prayer) return '';
  var paragraphs = prayer.text.split('\n\n');
  var html = '<div class="exam-prayer">';
  html += '<div class="exam-prayer-head">';
  if (icon) html += '<span class="exam-prayer-icon">' + icon + '</span>';
  html += '<span class="exam-prayer-title">' + _esc(prayer.title) + '</span>';
  html += '</div>';
  paragraphs.forEach(function(p) {
    html += '<p class="exam-prayer-text">' + _esc(p.trim()) + '</p>';
  });
  html += '</div>';
  return html;
}

// ── Render How to Confess ──
function _renderHowTo(howTo) {
  if (!howTo) return '';
  var html = '<details class="exam-howto">';
  html += '<summary class="exam-howto-header">';
  html += '<span class="exam-num exam-num--icon">?</span>';
  html += '<span class="exam-howto-label">' + _esc(howTo.title) + '</span>';
  html += '<svg class="exam-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';
  html += '</summary>';
  html += '<ol class="exam-howto-steps">';
  howTo.steps.forEach(function(step) {
    html += '<li>' + _esc(step) + '</li>';
  });
  html += '</ol></details>';
  return html;
}

// ── Full render ──
function _renderExamination(d) {
  var body = document.getElementById('examBody');
  var html = '';

  // Prayer before confession
  html += _renderPrayer(d.prayers.prayer_before, '\uD83D\uDD6F');

  // How to Confess guide
  html += _renderHowTo(d.how_to_confess);

  // Ten Commandments — iOS inset grouped list
  html += '<div class="exam-group-label">The Ten Commandments</div>';
  html += '<div class="exam-group">';
  d.commandments.forEach(function(cmd, i) {
    html += _renderSection(cmd, 'cmd-' + cmd.number, i === 0, i === d.commandments.length - 1);
  });
  html += '</div>';

  // Precepts of the Church — separate group
  html += '<div class="exam-group-label">Precepts of the Church</div>';
  html += '<div class="exam-group">';
  html += _renderSection(d.precepts, 'precepts', true, true);
  html += '</div>';

  // Prayers section
  html += '<div class="exam-group-label">Prayers</div>';
  html += _renderPrayer(d.prayers.act_of_contrition, '\u2720');
  html += _renderPrayer(d.prayers.thanksgiving, '\uD83D\uDE4F');

  // Confession tracker
  var lastConf = localStorage.getItem('mf-last-confession');
  var trackerHtml = '';
  if (lastConf) {
    var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
    trackerHtml = '<div class="exam-tracker-status">Last Confession: ' + (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago') + '</div>';
  }
  html += '<div class="exam-tracker">';
  html += trackerHtml;
  html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">';
  html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>';
  html += 'I went to Confession today</button>';
  html += '</div>';

  // Find Confession Near Me
  html += '<button class="exam-find-btn" onclick="examFindConfession()">';
  html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  html += 'Find Confession Near Me</button>';

  body.innerHTML = html;
  refs.initRefTaps(body);

  // Wire scroll progress
  _initScrollProgress();
}

// ── Scroll progress bar ──
function _initScrollProgress() {
  var body = document.getElementById('examBody');
  var bar = document.getElementById('examProgress');
  if (!body || !bar) return;
  body.addEventListener('scroll', function() {
    var pct = body.scrollTop / (body.scrollHeight - body.clientHeight);
    bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, pct)) + ')';
  }, { passive: true });
}

// ── Toggle commandment section (animated) ──
function examToggleSection(key) {
  _expanded[key] = !_expanded[key];
  _haptic();
  var row = document.querySelector('.exam-row[data-key="' + key + '"]');
  if (!row) return;
  var header = row.querySelector('.exam-row-header');
  if (_expanded[key]) {
    row.classList.add('expanded');
    header.setAttribute('aria-expanded', 'true');
  } else {
    row.classList.remove('expanded');
    header.setAttribute('aria-expanded', 'false');
  }
}

// ── Swipe-to-dismiss ──
function _initSwipeDismiss() {
  var overlay = document.getElementById('examOverlay');
  if (!overlay || overlay._swipeInit) return;
  overlay._swipeInit = true;
  var startY = 0;
  var headerEl = overlay.querySelector('.exam-header');
  var bodyEl = overlay.querySelector('.exam-body');
  headerEl.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  headerEl.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    if (dy > 60) closeExamination();
  }, { passive: true });
  // Also allow swipe from body when scrolled to top
  bodyEl.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  bodyEl.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    if (dy > 80 && bodyEl.scrollTop <= 5) closeExamination();
  }, { passive: true });
}

// ── Open overlay ──
function openExamination() {
  _expanded = {};
  window._lastFocused = document.activeElement;
  _loadData(function(d) {
    _renderExamination(d);
    var overlay = document.getElementById('examOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    _initSwipeDismiss();
    ui.trapFocus(overlay);
    _haptic();
  });
}

// ── Close overlay ──
function closeExamination() {
  var overlay = document.getElementById('examOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  ui.releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
}

// ── Mark confession date ──
function examMarkConfession() {
  localStorage.setItem('mf-last-confession', String(Date.now()));
  _haptic();
  var render = require('./render.js');
  render.showToast('God bless you! Recorded for your reference.');
  // Re-render tracker area
  var status = document.querySelector('.exam-tracker-status');
  if (status) {
    status.textContent = 'Last Confession: Today';
  } else {
    var tracker = document.querySelector('.exam-tracker');
    if (tracker) {
      var div = document.createElement('div');
      div.className = 'exam-tracker-status';
      div.textContent = 'Last Confession: Today';
      tracker.insertBefore(div, tracker.firstChild);
    }
  }
  // Animate the button
  var btn = document.querySelector('.exam-tracker-btn');
  if (btn) { btn.classList.add('confirmed'); setTimeout(function() { btn.classList.remove('confirmed'); }, 1200); }
  // Update More tab tracker if visible
  _updateMoreTabTracker();
}

// ── Update More tab confession tracker display ──
function _updateMoreTabTracker() {
  var el = document.getElementById('confessionTracker');
  if (!el) return;
  var lastConf = localStorage.getItem('mf-last-confession');
  if (!lastConf) { el.style.display = 'none'; return; }
  var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
  var label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago';
  el.style.display = '';
  el.innerHTML = '<span class="confession-tracker-icon">&#10003;</span> Last Confession: ' + label;
  // Gentle nudge after 30 days
  if (daysAgo >= 30) {
    el.innerHTML += ' <span class="confession-tracker-nudge">&mdash; <a href="#" onclick="examFindConfession();return false">Find Confession?</a></span>';
  }
}

// ── Find Confession Near Me ──
function examFindConfession() {
  _haptic();
  closeExamination();
  var ui2 = require('./ui.js');
  ui2.switchTab('panelFind');
  // Activate confession chip
  setTimeout(function() {
    document.querySelectorAll('.chip[data-filter]').forEach(function(c) { c.classList.remove('active'); });
    var confChip = document.querySelector('.chip[data-filter="confession"]');
    if (confChip) {
      confChip.classList.add('active');
      confChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    var data = require('./data.js');
    data.state.currentFilter = 'confession';
    data.filterChurches();
    var render = require('./render.js');
    render.renderCards();
  }, 300);
}

// ── Get confession tracker info (for More tab) ──
function getConfessionStatus() {
  var lastConf = localStorage.getItem('mf-last-confession');
  if (!lastConf) return null;
  var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
  return { daysAgo: daysAgo, timestamp: parseInt(lastConf, 10) };
}

module.exports = {
  openExamination: openExamination,
  closeExamination: closeExamination,
  examToggleSection: examToggleSection,
  examMarkConfession: examMarkConfession,
  examFindConfession: examFindConfession,
  getConfessionStatus: getConfessionStatus,
  _updateMoreTabTracker: _updateMoreTabTracker,
};
