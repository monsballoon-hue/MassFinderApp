// src/examination.js — Examination of Conscience (MOD-03)
// Full-screen overlay with expandable commandment sections, tappable CCC refs,
// interactive checklist, compiled summary, confession tracker, and "Find Confession Near Me".
// Privacy: checked items exist only in memory — cleared when overlay closes.
// UX: Apple HIG — inset grouped list, animated expand/collapse, haptics, swipe-dismiss,
//     inline CCC expansion (avoids z-index collision with overlay).

var refs = require('./refs.js');
var ui = require('./ui.js');

// ── State ──
var _examData = null;
var _expanded = {};         // section key → bool
var _checked = {};          // question id → { text, commandment }
var _cccParagraphs = null;  // lazy-loaded catechism paragraph map

// ── Haptic feedback ──
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

// ── Load examination data ──
function _loadData(cb) {
  if (_examData) return cb(_examData);
  fetch('data/examination.json').then(function(r) { return r.json(); })
    .then(function(d) { _examData = d; cb(d); })
    .catch(function(e) { console.warn('[Examination] Failed to load data:', e); });
}

// ── Load catechism data for inline CCC ──
function _loadCCC(cb) {
  if (_cccParagraphs) return cb();
  fetch('data/catechism.json').then(function(r) { return r.json(); })
    .then(function(d) {
      _cccParagraphs = {};
      Object.keys(d.paragraphs).forEach(function(k) {
        _cccParagraphs[parseInt(k, 10)] = d.paragraphs[k];
      });
      cb();
    }).catch(function() { cb(); });
}

// ── Parse CCC range (e.g. "2087-2089" → [2087,2088,2089]) ──
// isSectionLevel: true for commandment header refs (cap at 1 paragraph)
function _parseCCCRange(numStr, isSectionLevel) {
  var m = String(numStr).match(/(\d+)[\-\u2013](\d+)/);
  if (m) {
    var s = parseInt(m[1], 10), end = parseInt(m[2], 10);
    // Section headers span many paragraphs — show only the first
    var cap = isSectionLevel ? s : Math.min(end, s + 4);
    var ids = [];
    for (var i = s; i <= cap; i++) ids.push(i);
    return ids;
  }
  return [parseInt(numStr, 10)];
}

// ── Escape HTML ──
function _esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Strip CCC internal reference markers ──
function _stripRefs(t) { return t.replace(/\s*\(\d[\d,\s\-\u2013]*\)\s*/g, ' ').trim(); }

// ── Toggle inline CCC expansion ──
function _toggleInlineCCC(span, numStr) {
  // For question-level refs, insert inside .exam-q-content (column flex) so it flows below text.
  // For section-level refs, insert inside .exam-ccc-ref container.
  var container = span.closest('.exam-q-content') || span.closest('.exam-ccc-ref') || span.parentNode;

  // If already expanded, collapse
  var existing = container.querySelector('.exam-ccc-card');
  if (existing) {
    existing.remove();
    span.classList.remove('ref-tap--active');
    return;
  }

  // Close any other open inline CCC
  var body = document.getElementById('examBody');
  body.querySelectorAll('.exam-ccc-card').forEach(function(el) { el.remove(); });
  body.querySelectorAll('.ref-tap--active').forEach(function(el) { el.classList.remove('ref-tap--active'); });

  span.classList.add('ref-tap--active');
  _haptic();

  // Detect if this is a section-level ref (inside .exam-ccc-ref container at top of section)
  var isSectionLevel = !!span.closest('.exam-ccc-ref');

  _loadCCC(function() {
    var ids = _parseCCCRange(numStr, isSectionLevel);
    var card = document.createElement('div');
    card.className = 'exam-ccc-card';
    // Header
    var html = '<div class="exam-ccc-card-header">';
    html += '<div class="exam-ccc-card-icon">\u00A7</div>';
    html += '<div class="exam-ccc-card-label">Catechism \u00A7' + _esc(numStr) + '</div>';
    html += '</div>';
    // Body
    html += '<div class="exam-ccc-card-body">';
    ids.forEach(function(id, idx) {
      var text = _cccParagraphs && _cccParagraphs[id];
      if (ids.length > 1) {
        html += '<div class="exam-ccc-card-num' + (idx > 0 ? '' : '') + '">\u00A7\u00A0' + id + '</div>';
      }
      if (text) {
        var clean = _stripRefs(text).trim();
        var lines = clean.split('\n');
        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          if (line.charAt(0) === '>') {
            html += '<p class="exam-ccc-card-quote">' + _esc(line.slice(1).trim()) + '</p>';
          } else {
            html += '<p class="exam-ccc-card-text">' + _esc(line) + '</p>';
          }
        });
      } else {
        html += '<p class="exam-ccc-card-text" style="color:var(--color-text-tertiary)">Full text not in local dataset.</p>';
      }
    });
    html += '</div>';
    // For section-level refs spanning many paragraphs, add a "See full range" link
    if (isSectionLevel) {
      var rangeMatch = String(numStr).match(/(\d+)[\-\u2013](\d+)/);
      if (rangeMatch && (parseInt(rangeMatch[2], 10) - parseInt(rangeMatch[1], 10)) > 1) {
        html += '<p class="exam-ccc-card-more" onclick="closeExamination();setTimeout(function(){openCCC(\'' + _esc(numStr) + '\')},350)">See full range \u00A7' + _esc(numStr) + ' in Catechism \u2192</p>';
      }
    }
    card.innerHTML = html;
    container.appendChild(card);
  });
}

// ── Wire inline CCC on all ref-tap spans inside exam body ──
function _wireInlineCCC() {
  var body = document.getElementById('examBody');
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
    : '<span class="exam-num exam-num--icon">\u2690</span>';

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
    html += '<div class="exam-q' + (isChecked ? ' checked' : '') + '" data-qid="' + q.id + '">';
    html += '<label class="exam-check">';
    html += '<input type="checkbox" class="exam-checkbox" data-qid="' + q.id + '" data-cmd="' + _esc(cmdTitle) + '"' + (isChecked ? ' checked' : '') + '>';
    html += '<span class="exam-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>';
    html += '</label>';
    html += '<div class="exam-q-content">';
    html += '<div class="exam-q-text">' + _esc(q.text) + '</div>';
    if (qRef) html += '<div class="exam-q-ref">' + qRef + '</div>';
    html += '</div></div>';
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

  // Footer bar — always visible, but content changes
  var footer = document.getElementById('examFooter');
  if (footer) {
    footer.classList.add('visible');
    var countEl = document.getElementById('examCheckedCount');
    if (countEl) {
      countEl.textContent = count > 0 ? count + ' item' + (count !== 1 ? 's' : '') + ' noted' : 'No items noted yet';
    }
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
  }
  _haptic();
  // Log examination review (Change 19)
  try {
    var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
    // Only log once per day
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
  var body = document.getElementById('examBody');
  var html = '';

  // Prayer before confession
  html += _renderPrayer(d.prayers.prayer_before);

  // How to Confess guide
  html += _renderHowTo(d.how_to_confess);

  // Ten Commandments — iOS inset grouped list
  html += '<div class="exam-group-label">The Ten Commandments</div>';
  html += '<div class="exam-expand-hint">Tap a commandment to expand</div>';
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
        // Brief "Noted" feedback
        var noteEl = qEl.querySelector('.exam-q-noted');
        if (!noteEl) {
          noteEl = document.createElement('span');
          noteEl.className = 'exam-q-noted';
          noteEl.textContent = '\u2713 Noted';
          var content = qEl.querySelector('.exam-q-content');
          if (content) content.appendChild(noteEl);
        }
      } else {
        delete _checked[qid];
        qEl.classList.remove('checked');
        var noteEl = qEl.querySelector('.exam-q-noted');
        if (noteEl) noteEl.remove();
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
  var body = document.getElementById('examBody');
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
  _checked = {};
  window._lastFocused = document.activeElement;
  _loadData(function(d) {
    _expanded['cmd-1'] = true;
    var overlay = document.getElementById('examOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    _initSwipeDismiss();
    ui.trapFocus(overlay);
    _haptic();

    // Show opening prayer as a centering moment
    var body = document.getElementById('examBody');
    body.innerHTML = '<div class="exam-opening">'
      + '<div class="exam-opening-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M12 2v20M5 9l7-7 7 7"/></svg></div>'
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
}

// ── Close overlay ──
function closeExamination() {
  var count = Object.keys(_checked).length;
  if (count > 0) {
    if (!confirm('Close examination? Your ' + count + ' marked item' + (count !== 1 ? 's' : '') + ' will be cleared.')) return;
  }
  var overlay = document.getElementById('examOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  // Clear session state — privacy first
  _checked = {};
  var footer = document.getElementById('examFooter');
  if (footer) footer.classList.remove('visible');
  ui.releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
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
  closeExamination();
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
  examToggleSection: examToggleSection,
  examMarkConfession: examMarkConfession,
  examFindConfession: examFindConfession,
  examScrollToSummary: examScrollToSummary,
  getConfessionStatus: getConfessionStatus,
  _updateMoreTabTracker: _updateMoreTabTracker,
};
