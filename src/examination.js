// src/examination.js — Examination of Conscience (MOD-03)
// Universal reader module with expandable commandment sections, tappable CCC refs,
// interactive checklist, compiled summary, confession tracker, and "Find Confession Near Me".
// Privacy: checked items exist only in memory — cleared when overlay closes.

var refs = require('./refs.js');
var ui = require('./ui.js');
var _haptic = require('./haptics.js');
var cccData = require('./ccc-data.js');
var reader = require('./reader.js');

// ── State ──
var _examData = null;
var _expanded = {};         // section key → bool
var _checked = {};          // question id → { text, commandment }
var _cccParagraphs = null;  // lazy-loaded catechism paragraph map

// ── Reader module registration ──
reader.registerModule('examination', {
  getTitle: function() { return 'Examination of Conscience'; },
  render: function(params, bodyEl, footerEl) {
    _expanded = {};
    _checked = {};

    footerEl.style.display = '';
    footerEl.innerHTML = '<div class="exam-footer-bar" id="examFooter">'
      + '<span id="examCheckedCount">No items noted yet</span>'
      + '<button class="exam-footer-btn" onclick="examScrollToSummary()">View Summary</button>'
      + '</div>';

    bodyEl.innerHTML = '<div class="exam-loading" style="text-align:center;padding:var(--space-8);color:var(--color-text-tertiary)">Preparing examination\u2026</div>';

    _loadData(function(d) {
      _expanded['cmd-1'] = true;
      _haptic();

      // Show opening prayer as a centering moment
      bodyEl.innerHTML = '<div class="exam-progress-bar" id="examProgress"></div>'
        + '<div class="exam-opening">'
        + '<div class="exam-opening-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="48"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>'
        + '<h3 class="exam-opening-title">' + _esc(d.prayers.prayer_before.title) + '</h3>'
        + '<p class="exam-opening-text">' + _esc(d.prayers.prayer_before.text) + '</p>'
        + '<button class="exam-opening-btn" onclick="window._examBeginReview()">Begin Examination</button>'
        + '</div>';

      window._examBeginReview = function() {
        delete window._examBeginReview;
        _haptic();
        _renderExamination(d);
      };
    });
  },
  onClose: function() {
    // Privacy first — clear session state
    _checked = {};
  }
});

// ── Load examination data ──
function _loadData(cb) {
  if (_examData) return cb(_examData);
  fetch('/data/examination.json').then(function(r) { return r.json(); })
    .then(function(d) { _examData = d; cb(d); })
    .catch(function(e) { console.warn('[Examination] Failed to load data:', e); });
}

// ── Load catechism data for inline CCC (TD-04: shared loader) ──
function _loadCCC(cb) {
  if (_cccParagraphs) return cb();
  cccData.load(function(d) {
    if (d) _cccParagraphs = d.paragraphs;
    cb();
  });
}

// ── Parse CCC range — always returns topline paragraph only ──
function _parseCCCRange(numStr) {
  var m = String(numStr).match(/(\d+)[\-\u2013](\d+)/);
  if (m) {
    return [parseInt(m[1], 10)];
  }
  return [parseInt(numStr, 10)];
}

// ── Escape HTML ──
var utils = require('./utils.js');
function _esc(s) { return utils.esc(s); }
function _stripRefs(t) { return utils.stripCCCRefs(t); }

// ── Toggle inline CCC expansion ──
function _toggleInlineCCC(span, numStr) {
  var container = span.closest('.exam-q-content') || span.closest('.exam-ccc-ref') || span.parentNode;

  // If already expanded, collapse
  var existing = container.querySelector('.exam-ccc-card');
  if (existing) {
    existing.remove();
    span.classList.remove('ref-tap--active');
    return;
  }

  // Close any other open inline CCC
  var body = document.getElementById('readerBody');
  body.querySelectorAll('.exam-ccc-card').forEach(function(el) { el.remove(); });
  body.querySelectorAll('.ref-tap--active').forEach(function(el) { el.classList.remove('ref-tap--active'); });

  span.classList.add('ref-tap--active');
  _haptic();

  _loadCCC(function() {
    var ids = _parseCCCRange(numStr);
    var card = document.createElement('div');
    card.className = 'exam-ccc-card';
    var html = '<div class="exam-ccc-card-header">';
    html += '<div class="exam-ccc-card-icon">\u00A7</div>';
    html += '<div class="exam-ccc-card-label">Catechism \u00A7' + _esc(numStr) + '</div>';
    html += '</div>';
    html += '<div class="exam-ccc-card-body">';
    ids.forEach(function(id) {
      var text = _cccParagraphs && _cccParagraphs[id];
      if (text) {
        var clean = _stripRefs(text).trim();
        var firstLine = clean.split('\n').filter(function(l) { return l.trim(); })[0] || '';
        if (firstLine.charAt(0) === '>') {
          html += '<p class="exam-ccc-card-quote">' + _esc(firstLine.slice(1).trim()) + '</p>';
        } else {
          html += '<p class="exam-ccc-card-text">' + _esc(firstLine) + '</p>';
        }
      } else {
        html += '<p class="exam-ccc-card-text" style="color:var(--color-text-tertiary)">Full text not in local dataset.</p>';
      }
    });
    html += '</div>';
    // "See full range" link — opens CCC in reader (pushes exam to stack)
    var rangeMatch = String(numStr).match(/(\d+)[\-\u2013](\d+)/);
    if (rangeMatch && (parseInt(rangeMatch[2], 10) - parseInt(rangeMatch[1], 10)) > 0) {
      html += '<p class="exam-ccc-card-more" onclick="openCCCAboveExam(\'' + _esc(numStr) + '\')">See full range \u00A7' + _esc(numStr) + ' in Catechism \u2192</p>';
    }
    card.innerHTML = html;
    container.appendChild(card);
  });
}

// ── Wire inline CCC on all ref-tap spans inside exam body ──
function _wireInlineCCC() {
  var body = document.getElementById('readerBody');
  body.querySelectorAll('.ref-tap--ccc').forEach(function(span) {
    var match = (span.getAttribute('onclick') || '').match(/_refTap\('ccc','([^']+)'\)/);
    if (!match) return;
    var cccNum = match[1];
    span.removeAttribute('onclick');
    span.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      _toggleInlineCCC(span, cccNum);
    });
  });
}

// ── Render a commandment row within a group ──
function _renderSection(section, key, isFirst, isLast) {
  var isExpanded = !!_expanded[key];
  var cccRef = section.ccc ? refs.renderRef('ccc', section.ccc) : '';
  var cmdTitle = section.number
    ? section.number + '. ' + section.title
    : section.title;

  var numBadge = section.number
    ? '<span class="exam-num">' + section.number + '</span>'
    : '<span class="exam-num exam-num--icon">P</span>';

  var html = '<div class="exam-row' + (isExpanded ? ' expanded' : '') + (isFirst ? ' exam-row--first' : '') + (isLast ? ' exam-row--last' : '') + '" data-key="' + key + '">';
  html += '<button class="exam-row-header" onclick="examToggleSection(\'' + key + '\')" aria-expanded="' + isExpanded + '">';
  html += numBadge;
  html += '<span class="exam-row-title">' + _esc(section.title) + '</span>';
  html += '<svg class="exam-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';
  html += '</button>';

  html += '<div class="exam-row-body"><div class="exam-row-inner">';
  if (cccRef) {
    html += '<div class="exam-ccc-ref">' + cccRef + '</div>';
  }
  section.questions.forEach(function(q) {
    var qRef = q.ccc ? refs.renderRef('ccc', q.ccc) : '';
    var isChecked = !!_checked[q.id];
    html += '<label class="exam-q' + (isChecked ? ' checked' : '') + '" data-qid="' + q.id + '">';
    html += '<input type="checkbox" class="exam-checkbox" data-qid="' + q.id + '" data-cmd="' + _esc(cmdTitle) + '"' + (isChecked ? ' checked' : '') + '>';
    html += '<span class="exam-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>';
    html += '<div class="exam-q-content">';
    html += '<div class="exam-q-text">' + _esc(q.text) + '</div>';
    if (qRef) html += '<div class="exam-q-ref">' + qRef + '</div>';
    html += '</div></label>';
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
  html += '<span class="exam-num exam-num--icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>';
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

// ── Confessional format helpers ──
function _toActionFormat(text) {
  var s = text.replace(/^(Have I|Did I|Do I|Have you|Did you|Am I|Was I)\s+/i, '').replace(/\?$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function _shortCmdLabel(full) {
  var m = full.match(/^(\d+)\./);
  if (!m) {
    if (full.indexOf('Precepts') >= 0) return 'Precepts of the Church';
    return full;
  }
  var n = parseInt(m[1], 10);
  var suf = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return n + suf + ' Commandment';
}

// ── Render summary section ──
function _renderSummaryHTML() {
  var keys = Object.keys(_checked);
  if (!keys.length) {
    return '<div class="exam-summary-empty">No items selected yet. Check items above as you examine your conscience.</div>';
  }

  // Group by commandment
  var groups = {};
  var order = [];
  keys.forEach(function(qid) {
    var item = _checked[qid];
    if (!groups[item.commandment]) {
      groups[item.commandment] = [];
      order.push(item.commandment);
    }
    groups[item.commandment].push(item.text);
  });

  // Preamble in confessional format
  var lastConf = localStorage.getItem('mf-last-confession');
  var daysSince = lastConf ? Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000) : null;
  var html = '<div class="exam-summary-preamble">';
  html += '<p>Bless me, Father, for I have sinned.';
  if (daysSince !== null) {
    html += ' It has been ' + (daysSince === 0 ? 'less than a day' : daysSince + ' day' + (daysSince !== 1 ? 's' : '')) + ' since my last confession.';
  }
  html += '</p>';
  html += '<p>These are my sins:</p>';
  html += '</div>';

  order.forEach(function(cmd) {
    html += '<div class="exam-summary-group">';
    html += '<div class="exam-summary-cmd">' + _esc(_shortCmdLabel(cmd)) + '</div>';
    html += '<ul class="exam-summary-items">';
    groups[cmd].forEach(function(text) {
      html += '<li>' + _esc(_toActionFormat(text)) + '</li>';
    });
    html += '</ul></div>';
  });
  return html;
}

// ── Update checked count UI ──
function _updateCheckedUI() {
  var count = Object.keys(_checked).length;

  var countEl = document.getElementById('examCheckedCount');
  if (countEl) {
    countEl.textContent = count > 0 ? count + ' item' + (count !== 1 ? 's' : '') + ' noted' : 'No items noted yet';
  }

  // Summary section
  var summaryList = document.getElementById('examSummaryList');
  if (summaryList) {
    summaryList.innerHTML = _renderSummaryHTML();
  }

  // Summary title count
  var summaryCount = document.getElementById('examSummaryCount');
  if (summaryCount) {
    summaryCount.textContent = count ? ' (' + count + ')' : '';
  }
}

// ── Scroll to summary section ──
function examScrollToSummary() {
  var summary = document.getElementById('examSummary');
  if (summary) {
    summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    summary.classList.add('exam-summary--revealed');
    setTimeout(function() { summary.classList.remove('exam-summary--revealed'); }, 1500);
  }
  _haptic();
  // Log examination review
  try {
    var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
    var today = new Date().toISOString().slice(0, 10);
    var alreadyLogged = log.some(function(e) { return e.type === 'examination' && e.date === today; });
    if (!alreadyLogged) {
      log.push({ type: 'examination', date: today });
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      log = log.filter(function(e) { return e.date >= cutoff; });
      localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    }
  } catch (e) {}
}

// ── Full render ──
function _renderExamination(d) {
  var body = document.getElementById('readerBody');
  var html = '<div class="exam-progress-bar" id="examProgress"></div>';

  // How to Confess guide
  html += _renderHowTo(d.how_to_confess);

  // Ten Commandments — iOS inset grouped list
  html += '<div class="exam-group-label">The Ten Commandments</div>';
  html += '<div class="exam-group">';
  d.commandments.forEach(function(cmd, i) {
    html += _renderSection(cmd, 'cmd-' + cmd.number, i === 0, i === d.commandments.length - 1);
  });
  html += '</div>';

  // Precepts of the Church
  html += '<div class="exam-group-label">Precepts of the Church</div>';
  html += '<div class="exam-group">';
  html += _renderSection(d.precepts, 'precepts', true, true);
  html += '</div>';

  // Summary section
  html += '<div class="exam-summary" id="examSummary">';
  html += '<div class="exam-summary-title">Summary for Confession<span id="examSummaryCount"></span></div>';
  html += '<div class="exam-summary-privacy">This list exists only during this session. Nothing is saved.</div>';
  html += '<div class="exam-summary-list" id="examSummaryList">';
  html += _renderSummaryHTML();
  html += '</div></div>';

  // Prayers section
  html += '<div class="exam-group-label">Prayers</div>';

  // Act of Contrition — elevated presentation
  html += '<div class="exam-contrition">';
  html += '<div class="exam-contrition-title">' + _esc(d.prayers.act_of_contrition.title) + '</div>';
  var actText = d.prayers.act_of_contrition.text.split('\n\n');
  actText.forEach(function(p) {
    html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
  });
  html += '</div>';

  html += _renderPrayer(d.prayers.thanksgiving);

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
  html += 'I received the Sacrament of Reconciliation</button>';
  html += '</div>';

  // Find Confession Near Me
  html += '<button class="exam-find-btn" onclick="examFindConfession()">';
  html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  html += 'Find Confession Near Me</button>';

  // Graceful ending — peaceful close section
  html += '<div class="exam-ending">';
  html += '<div class="exam-ending-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="36"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>';
  html += '<p class="exam-ending-text">Go in peace to love and serve the Lord.</p>';
  html += '<button class="exam-ending-btn" onclick="examGracefulClose()">Return to MassFinder</button>';
  html += '</div>';

  body.innerHTML = html;

  // Wire inline CCC (override default openCCC behavior within overlay)
  _wireInlineCCC();

  // Wire keyboard for remaining ref-tap spans
  refs.initRefTaps(body);

  // Wire checkbox change via event delegation (guard against duplicate listeners)
  if (!body._examChangeWired) {
    body._examChangeWired = true;
    body.addEventListener('change', function(e) {
      var cb = e.target;
      if (!cb.classList.contains('exam-checkbox')) return;
      var qid = parseInt(cb.dataset.qid, 10);
      var qEl = cb.closest('.exam-q');
      if (cb.checked) {
        _checked[qid] = {
          text: qEl.querySelector('.exam-q-text').textContent,
          commandment: cb.dataset.cmd
        };
        qEl.classList.add('checked');
      } else {
        delete _checked[qid];
        qEl.classList.remove('checked');
      }
      _haptic();
      _updateCheckedUI();
    });
  }

  // Scroll progress
  _initScrollProgress();

  // Update footer state
  _updateCheckedUI();
}

// ── Scroll progress bar ──
function _initScrollProgress() {
  var body = document.getElementById('readerBody');
  var bar = document.getElementById('examProgress');
  if (!body || !bar) return;
  if (body._examScrollWired) return;
  body._examScrollWired = true;
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

// ── Open overlay ──
function openExamination() {
  reader.readerOpen('examination', {});
}

// ── Close overlay ──
function closeExamination() {
  var count = Object.keys(_checked).length;
  if (count > 0) {
    _showExitConfirm(count);
    return;
  }
  _doClose();
}

function _doClose() {
  // Clear session state — privacy first
  _checked = {};
  reader.readerClose();
}

// Graceful close — user tapped "Return to MassFinder" at the end, skip confirmation
function examGracefulClose() {
  _haptic();
  _doClose();
}

function _showExitConfirm(count) {
  var overlay = document.getElementById('readerOverlay');
  // Prevent duplicates
  var existing = overlay.querySelector('.exam-exit-dialog-wrap');
  if (existing) return;
  var plural = count !== 1 ? 's' : '';
  var wrap = document.createElement('div');
  wrap.className = 'exam-exit-dialog-wrap';
  wrap.innerHTML = '<div class="exam-exit-dialog">'
    + '<div class="exam-exit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>'
    + '<h4 class="exam-exit-title">End Examination?</h4>'
    + '<p class="exam-exit-msg">Your ' + count + ' noted item' + plural + ' will be cleared for your privacy. This cannot be undone.</p>'
    + '<div class="exam-exit-actions">'
    + '<button class="exam-exit-btn exam-exit-btn--cancel">Continue Examining</button>'
    + '<button class="exam-exit-btn exam-exit-btn--confirm">End &amp; Clear</button>'
    + '</div></div>';
  overlay.appendChild(wrap);
  // Animate in
  requestAnimationFrame(function() { wrap.classList.add('visible'); });
  // Wire buttons
  wrap.querySelector('.exam-exit-btn--cancel').addEventListener('click', function() {
    wrap.classList.remove('visible');
    setTimeout(function() { wrap.remove(); }, 200);
  });
  wrap.querySelector('.exam-exit-btn--confirm').addEventListener('click', function() {
    _doClose();
  });
  // Backdrop tap = cancel
  wrap.addEventListener('click', function(e) {
    if (e.target === wrap) {
      wrap.classList.remove('visible');
      setTimeout(function() { wrap.remove(); }, 200);
    }
  });
}

// ── Mark confession date ──
function examMarkConfession() {
  localStorage.setItem('mf-last-confession', String(Date.now()));
  _haptic();
  var render = require('./render.js');
  render.showToast('Recorded. God\u2019s mercy is with you.');
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
  var btn = document.querySelector('.exam-tracker-btn');
  if (btn) { btn.classList.add('confirmed'); setTimeout(function() { btn.classList.remove('confirmed'); }, 1200); }
  _updateMoreTabTracker();
}

// ── Update More tab confession tracker ──
function _updateMoreTabTracker() {
  var el = document.getElementById('confessionTracker');
  if (!el) return;
  var lastConf = localStorage.getItem('mf-last-confession');
  if (!lastConf) { el.style.display = 'none'; return; }
  var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
  var label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago';
  el.style.display = '';
  el.innerHTML = '<span class="confession-tracker-icon">&#10003;</span> Last Confession: ' + label;
  if (daysAgo >= 30) {
    el.innerHTML += ' <span class="confession-tracker-nudge">&mdash; <a href="#" onclick="examFindConfession();return false">Find Confession?</a></span>';
  }
}

// ── Find Confession Near Me ──
function examFindConfession() {
  _haptic();
  _doClose();
  var ui2 = require('./ui.js');
  ui2.switchTab('panelFind');
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

// ── Get confession tracker info ──
function getConfessionStatus() {
  var lastConf = localStorage.getItem('mf-last-confession');
  if (!lastConf) return null;
  var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
  return { daysAgo: daysAgo, timestamp: parseInt(lastConf, 10) };
}

module.exports = {
  openExamination: openExamination,
  closeExamination: closeExamination,
  examGracefulClose: examGracefulClose,
  examToggleSection: examToggleSection,
  examMarkConfession: examMarkConfession,
  examFindConfession: examFindConfession,
  examScrollToSummary: examScrollToSummary,
  getConfessionStatus: getConfessionStatus,
  _updateMoreTabTracker: _updateMoreTabTracker,
};
