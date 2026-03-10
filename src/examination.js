// src/examination.js — Examination of Conscience (MOD-03)
// Full-screen overlay with expandable commandment sections, tappable CCC refs,
// Act of Contrition, confession tracker, and "Find Confession Near Me" button.
// Privacy first: no data stored about which questions resonate.

var refs = require('./refs.js');
var ui = require('./ui.js');

var _examData = null;
var _expanded = {};  // commandment number → bool

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

// ── Render a single commandment/precepts section ──
function _renderSection(section, key) {
  var isExpanded = !!_expanded[key];
  var numLabel = section.number ? section.number + '. ' : '';
  var cccRef = section.ccc ? refs.renderRef('ccc', section.ccc) : '';

  var html = '<div class="exam-section' + (isExpanded ? ' expanded' : '') + '" data-key="' + key + '">';
  html += '<button class="exam-section-header" onclick="examToggleSection(\'' + key + '\')" aria-expanded="' + isExpanded + '">';
  html += '<span class="exam-section-title">' + numLabel + _esc(section.title) + '</span>';
  html += '<svg class="exam-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  html += '</button>';

  html += '<div class="exam-section-body"' + (isExpanded ? '' : ' style="display:none"') + '>';
  if (cccRef) {
    html += '<div class="exam-ccc-badge">' + cccRef + '</div>';
  }
  html += '<ul class="exam-questions">';
  section.questions.forEach(function(q) {
    var qRef = q.ccc ? refs.renderRef('ccc', q.ccc) : '';
    html += '<li class="exam-question">';
    html += '<span class="exam-question-text">' + _esc(q.text) + '</span>';
    if (qRef) html += '<span class="exam-question-ref">' + qRef + '</span>';
    html += '</li>';
  });
  html += '</ul></div></div>';
  return html;
}

// ── Render prayer block ──
function _renderPrayer(prayer) {
  if (!prayer) return '';
  var paragraphs = prayer.text.split('\n\n');
  var html = '<div class="exam-prayer">';
  html += '<div class="exam-prayer-title">' + _esc(prayer.title) + '</div>';
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
  html += '<summary class="exam-howto-title">' + _esc(howTo.title) + '<svg class="exam-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>';
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
  html += _renderPrayer(d.prayers.prayer_before);

  html += '<div class="exam-divider"></div>';

  // How to Confess guide
  html += _renderHowTo(d.how_to_confess);

  html += '<div class="exam-divider"></div>';

  // Ten Commandments
  html += '<div class="exam-label">The Ten Commandments</div>';
  d.commandments.forEach(function(cmd) {
    html += _renderSection(cmd, 'cmd-' + cmd.number);
  });

  // Precepts of the Church
  html += '<div class="exam-divider"></div>';
  html += '<div class="exam-label">Precepts of the Church</div>';
  html += _renderSection(d.precepts, 'precepts');

  html += '<div class="exam-divider"></div>';

  // Act of Contrition
  html += _renderPrayer(d.prayers.act_of_contrition);

  // Thanksgiving prayer
  html += _renderPrayer(d.prayers.thanksgiving);

  html += '<div class="exam-divider"></div>';

  // Confession tracker
  var lastConf = localStorage.getItem('mf-last-confession');
  var trackerHtml = '';
  if (lastConf) {
    var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
    trackerHtml = '<div class="exam-tracker-status">Last Confession: ' + (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago') + '</div>';
  }
  html += '<div class="exam-tracker">';
  html += trackerHtml;
  html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">I went to Confession today</button>';
  html += '</div>';

  html += '<div class="exam-divider"></div>';

  // Find Confession Near Me
  html += '<button class="exam-find-btn" onclick="examFindConfession()">Find Confession Near Me</button>';

  body.innerHTML = html;
  refs.initRefTaps(body);
}

// ── Toggle commandment section ──
function examToggleSection(key) {
  _expanded[key] = !_expanded[key];
  var section = document.querySelector('.exam-section[data-key="' + key + '"]');
  if (!section) return;
  var body = section.querySelector('.exam-section-body');
  var header = section.querySelector('.exam-section-header');
  if (_expanded[key]) {
    section.classList.add('expanded');
    body.style.display = '';
    header.setAttribute('aria-expanded', 'true');
  } else {
    section.classList.remove('expanded');
    body.style.display = 'none';
    header.setAttribute('aria-expanded', 'false');
  }
}

// ── Open overlay ──
function openExamination() {
  _expanded = {};
  _loadData(function(d) {
    _renderExamination(d);
    var overlay = document.getElementById('examOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    ui.trapFocus(overlay);
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
