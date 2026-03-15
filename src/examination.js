// src/examination.js — Examination of Conscience (MOD-03)
// Universal reader module with expandable commandment sections, tappable CCC refs,
// interactive checklist, compiled summary, confession tracker, and "Find Confession Near Me".
// Privacy: checked items exist only in memory — cleared when overlay closes.

var refs = require('./refs.js');
var ui = require('./ui.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');

// ── State ──
var _examData = null;
var _expanded = {};         // section key → bool
var _checked = {};          // question id → { text, commandment, skey }
var _sections = [];         // PTR-03: all sections (commandments + precepts)
var _currentSection = 0;    // PTR-03: current section index
var _shownLogHint = false;  // BT3-04: first-check toast flag

// I18N-03: Localization shorthand
function _t(item, field) { return utils.getPrayerText(item, field); }

// CFR1 + I18N-14: Pastoral note HTML for Q31 (suicide)
function _pastoralNoteHTML() {
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var isEs = (lang === 'es');

  var supportText = isEs
    ? 'Si estás luchando con pensamientos de autolesión, por favor ten presente que Dios te ama y que hay ayuda disponible. Llama o envía un mensaje de texto al <a href="tel:988" class="exam-pastoral-link">988</a> (Línea de Prevención del Suicidio y Crisis) en cualquier momento.'
    : 'If you are struggling with thoughts of self-harm, please know that God loves you and that help is available. Call or text <a href="tel:988" class="exam-pastoral-link">988</a> (Suicide &amp; Crisis Lifeline) anytime.';

  var quoteText = isEs
    ? '\u201CNo debemos desesperar de la salvación eterna de las personas que se han quitado la vida. Dios puede, por caminos que solo Él conoce, proveer la oportunidad de un arrepentimiento salvador.\u201D<span class="exam-pastoral-cite"> \u2014 CCC \u00A72283</span>'
    : '\u201CWe should not despair of the eternal salvation of persons who have taken their own lives. By ways known to him alone, God can provide the opportunity for salutary repentance.\u201D<span class="exam-pastoral-cite"> \u2014 CCC \u00A72283</span>';

  return '<div class="exam-pastoral-note">'
    + '<p class="exam-pastoral-support">' + supportText + '</p>'
    + '<p class="exam-pastoral-quote">' + quoteText + '</p>'
    + '</div>';
}

// ── Reader module registration ──
reader.registerModule('examination', {
  getTitle: function() {
    var lang = '';
    try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
    return (lang === 'es') ? 'Examen de Conciencia' : 'Examination of Conscience';
  },
  render: function(params, bodyEl, footerEl) {
    _expanded = {};
    _checked = {};

    // Footer hidden until examination begins
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    bodyEl.innerHTML = '<div class="exam-loading" style="text-align:center;padding:var(--space-8);color:var(--color-text-tertiary)">Preparing your examination\u2026</div>';

    _loadData(function(d) {
      _expanded['cmd-1'] = true;
      _haptic();

      // Show opening prayer as a centering moment — no progress bar, no scroll
      bodyEl.innerHTML = '<div class="exam-opening">'
        + '<div class="exam-opening-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="48"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>'
        + '<p class="exam-opening-text">' + _esc(_t(d.prayers.prayer_before, 'text')) + '</p>'
        + '<button class="exam-opening-btn" onclick="window._examBeginReview()">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Comenzar Examen' : 'Begin Examination') + '</button>'
        + '<p class="exam-opening-hint">' + ((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Un examen de conciencia guiado, secci\u00f3n por secci\u00f3n. Unos 10\u201315 minutos. No se guarda nada.' : 'A prayerful review of conscience, section by section. About 10\u201315 minutes. Nothing is saved.') + '</p>'
        + '</div>';

      window._examBeginReview = function() {
        delete window._examBeginReview;
        _haptic();
        _initSectionFlow(d);
      };
    });
  },
  onClose: function() {
    // Privacy first — clear session state
    _checked = {};
    _shownLogHint = false;
  }
});

// ── Load examination data ──
function _loadData(cb) {
  if (_examData) return cb(_examData);
  fetch('/data/examination.json').then(function(r) { return r.json(); })
    .then(function(d) { _examData = d; cb(d); })
    .catch(function(e) { console.warn('[Examination] Failed to load data:', e); });
}

// ── Escape HTML ──
var utils = require('./utils.js');
function _esc(s) { return utils.esc(s); }
function _stripRefs(t) { return utils.stripCCCRefs(t); }

// ── Render a commandment row within a group ──
function _renderSection(section, key, isFirst, isLast) {
  var isExpanded = !!_expanded[key];
  var cccRef = section.ccc ? refs.renderRef('ccc', section.ccc) : '';
  var cmdTitle = section.number
    ? section.number + '. ' + _t(section, 'title')
    : _t(section, 'title');

  var numBadge = section.number
    ? '<span class="exam-num">' + section.number + '</span>'
    : '<span class="exam-num exam-num--icon">P</span>';

  var html = '<div class="exam-row' + (isExpanded ? ' expanded' : '') + (isFirst ? ' exam-row--first' : '') + (isLast ? ' exam-row--last' : '') + '" data-key="' + key + '">';
  html += '<button class="exam-row-header" onclick="examToggleSection(\'' + key + '\')" aria-expanded="' + isExpanded + '">';
  html += numBadge;
  html += '<span class="exam-row-title">' + _esc(_t(section, 'title')) + '</span>';
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
    html += '<div class="exam-q-text">' + _esc(_t(q, 'text')) + '</div>';
    if (qRef) html += '<div class="exam-q-ref">' + qRef + '</div>';
    html += '</div></label>';
    if (q.id === 31 && _checked[31]) html += _pastoralNoteHTML();
  });
  html += '</div></div></div>';
  return html;
}

// ── Render prayer block ──
function _renderPrayer(prayer, icon) {
  if (!prayer) return '';
  var prayerText = _t(prayer, 'text');
  var paragraphs = prayerText.split('\n\n');
  var html = '<div class="exam-prayer">';
  html += '<div class="exam-prayer-head">';
  if (icon) html += '<span class="exam-prayer-icon">' + icon + '</span>';
  html += '<span class="exam-prayer-title">' + _esc(_t(prayer, 'title')) + '</span>';
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
  html += '<span class="exam-howto-label">' + _esc(_t(howTo, 'title')) + '</span>';
  html += '<svg class="exam-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';
  html += '</summary>';
  html += '<ol class="exam-howto-steps">';
  howTo.steps.forEach(function(step) {
    var stepText = (typeof step === 'string') ? step : _t(step, 'text');
    html += '<li>' + _esc(stepText) + '</li>';
  });
  html += '</ol></details>';
  return html;
}

// ── Confessional format helpers ──
function _toActionFormat(text) {
  var s = text
    .replace(/^¿/, '')
    .replace(/^(Have I|Did I|Do I|Have you|Did you|Am I|Was I|He)\s+/i, '')
    .replace(/\?$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function _shortCmdLabel(full) {
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var m = full.match(/^(\d+)\./);
  if (!m) {
    if (full.indexOf('Precepts') >= 0 || full.indexOf('Preceptos') >= 0) {
      return (lang === 'es') ? 'Preceptos de la Iglesia' : 'Precepts of the Church';
    }
    return full;
  }
  var n = parseInt(m[1], 10);
  if (lang === 'es') {
    return n + '.\u00BA Mandamiento';
  }
  var suf = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
  return n + suf + ' Commandment';
}

// ── Render summary section ──
function _renderSummaryHTML() {
  var keys = Object.keys(_checked);
  if (!keys.length) {
    var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
    return '<div class="exam-summary-empty">' + (_l ? 'No hay elementos seleccionados. Marca los elementos mientras examinas tu conciencia.' : 'No items selected yet. Check items above as you examine your conscience.') + '</div>';
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
  var lang = '';
  try { lang = localStorage.getItem('mf-prayer-lang') || ''; } catch (e) {}
  var html = '<div class="exam-summary-preamble">';
  var blessMeText = (lang === 'es') ? 'Bendígame, Padre, porque he pecado.' : 'Bless me, Father, for I have sinned.';
  var sinceText = '';
  if (daysSince !== null) {
    sinceText = (lang === 'es')
      ? ' Han pasado ' + (daysSince === 0 ? 'menos de un día' : daysSince + ' día' + (daysSince !== 1 ? 's' : '')) + ' desde mi última confesión.'
      : ' It has been ' + (daysSince === 0 ? 'less than a day' : daysSince + ' day' + (daysSince !== 1 ? 's' : '')) + ' since my last confession.';
  }
  var theseSinsText = (lang === 'es') ? 'Estos son mis pecados:' : 'These are my sins:';
  html += '<p>' + blessMeText + sinceText + '</p>';
  html += '<p>' + theseSinsText + '</p>';
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

  // Summary section (visible on summary screen)
  var summaryList = document.getElementById('examSummaryList');
  if (summaryList) {
    summaryList.innerHTML = _renderSummaryHTML();
  }

  // Summary title count
  var summaryCount = document.getElementById('examSummaryCount');
  if (summaryCount) {
    summaryCount.textContent = count ? ' (' + count + ')' : '';
  }

  // In section-by-section flow, refresh footer nav (shows updated count)
  if (_sections.length > 0 && _currentSection < _sections.length) {
    _updateFooterNav();
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
  var html = '';

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

  // Summary section — visually distinct from the checklist above
  html += '<div class="exam-summary" id="examSummary">';
  html += '<div class="exam-summary-header">';
  html += '<svg class="exam-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>';
  var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
  html += '<div><div class="exam-summary-title">' + (_l ? 'Resumen para la Confesión' : 'Summary for Confession') + '<span id="examSummaryCount"></span></div>';
  html += '<div class="exam-summary-privacy">' + (_l ? 'Esta lista existe solo durante esta sesión. No se guarda nada.' : 'This list exists only during this session. Nothing is saved.') + '</div></div>';
  html += '</div>';
  html += '<div class="exam-summary-list" id="examSummaryList">';
  html += _renderSummaryHTML();
  html += '</div></div>';

  // Prayers section
  // Act of Contrition — elevated presentation
  html += '<div class="exam-contrition">';
  html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.act_of_contrition, 'title')) + '</div>';
  _t(d.prayers.act_of_contrition, 'text').split('\n\n').forEach(function(p) {
    html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
  });
  html += '</div>';

  if (d.prayers.thanksgiving) {
    html += '<div class="exam-prayer-divider"></div>';
    html += '<div class="exam-contrition">';
    html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.thanksgiving, 'title')) + '</div>';
    _t(d.prayers.thanksgiving, 'text').split('\n\n').forEach(function(p) {
      html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
    });
    html += '</div>';
  }

  // Confession tracker
  var lastConf = localStorage.getItem('mf-last-confession');
  var trackerHtml = '';
  if (lastConf) {
    var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
    var agoLabel = _l
      ? (daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : 'Hace ' + daysAgo + ' días')
      : (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago');
    trackerHtml = '<div class="exam-tracker-status">' + (_l ? 'Última Confesión: ' : 'Last Confession: ') + agoLabel + '</div>';
  }
  html += '<div class="exam-tracker">';
  html += trackerHtml;
  html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">';
  html += (_l ? 'Fui a confesarme hoy' : 'I went to confession today') + '</button>';
  html += '</div>';

  // Find Confession Near Me
  html += '<button class="exam-find-btn" onclick="examFindConfession()">';
  html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  html += (_l ? 'Encontrar Confesión Cerca' : 'Find Confession Near Me') + '</button>';

  // Graceful ending — peaceful close section
  html += '<div class="exam-ending">';
  html += '<div class="exam-ending-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="36"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>';
  html += '<p class="exam-ending-text">' + (_l ? 'Ve en paz para amar y servir al Señor.' : 'Go in peace to love and serve the Lord.') + '</p>';
  html += '</div>';

  body.innerHTML = html;

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
        if (qid === 31 && !qEl.parentElement.querySelector('.exam-pastoral-note')) {
          qEl.insertAdjacentHTML('afterend', _pastoralNoteHTML());
        }
      } else {
        delete _checked[qid];
        qEl.classList.remove('checked');
        if (qid === 31) {
          var pn = qEl.parentElement && qEl.parentElement.querySelector('.exam-pastoral-note');
          if (pn) pn.remove();
        }
      }
      _haptic();
      _updateCheckedUI();
      var count = Object.keys(_checked).length;
      if (count === 1 && !_shownLogHint) {
        _shownLogHint = true;
        var render = require('./render.js');
        render.showToast((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Anotado para tu resumen de confesión' : 'Noted for your confession summary');
      }
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

// ── PTR-03: Section-by-section flow ──

function _initSectionFlow(d) {
  _sections = d.commandments.concat([d.precepts]);
  _currentSection = 0;

  // Build headerExtra: dots row + How-to-Confess icon button
  var headerExtra = document.getElementById('readerHeaderExtra');
  if (headerExtra) {
    headerExtra.innerHTML = _buildHeaderExtraHTML();
    headerExtra.style.display = '';
  }

  // Show footer
  var ft = document.getElementById('readerFooter');
  if (ft) { ft.style.display = ''; }

  _renderCurrentSection();
}

function _buildHeaderExtraHTML() {
  var infoSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  return '<div class="exam-header-extra-row">'
    + '<div class="exam-dots" id="examDots"></div>'
    + '<button class="exam-howto-icon-btn" onclick="examShowHowTo()" aria-label="How to Go to Confession">' + infoSvg + '</button>'
    + '</div>';
}

function _updateDots() {
  var dotsEl = document.getElementById('examDots');
  if (!dotsEl) return;
  var html = '';
  for (var i = 0; i < _sections.length; i++) {
    var section = _sections[i];
    var key = section.number ? 'cmd-' + section.number : 'precepts';
    var hasItems = _sectionHasItems(key);
    var cls = 'exam-dot';
    if (i === _currentSection) {
      cls += ' active';
    } else if (hasItems) {
      cls += ' has-items';
    } else if (i < _currentSection) {
      cls += ' done';
    }
    html += '<button class="exam-dot-btn" onclick="examGoToSection(' + i + ')" aria-label="Section ' + (i + 1) + '">'
      + '<span class="' + cls + '"></span>'
      + '</button>';
  }
  dotsEl.innerHTML = html;
}

function _sectionHasItems(key) {
  var keys = Object.keys(_checked);
  for (var i = 0; i < keys.length; i++) {
    if (_checked[keys[i]].skey === key) return true;
  }
  return false;
}

function _renderCurrentSection() {
  var snippet = require('./snippet.js');
  snippet.dismissSnippet();
  var section = _sections[_currentSection];
  var key = section.number ? 'cmd-' + section.number : 'precepts';
  var cmdTitle = section.number ? section.number + '. ' + _t(section, 'title') : _t(section, 'title');

  var body = document.getElementById('readerBody');

  // Section hero
  var cccRef = section.ccc ? refs.renderRef('ccc', section.ccc) : '';
  var html = '<div class="exam-section-hero">';
  html += '<div class="exam-section-num">' + (section.number ? section.number : 'P') + '</div>';
  html += '<div class="exam-section-title">' + _esc(_t(section, 'title')) + '</div>';
  if (cccRef) { html += '<div class="exam-section-ccc">' + cccRef + '</div>'; }
  html += '</div>';

  // Questions — always expanded
  html += '<div class="exam-section-questions">';
  section.questions.forEach(function(q) {
    var qRef = q.ccc ? refs.renderRef('ccc', q.ccc) : '';
    var isChecked = !!_checked[q.id];
    html += '<label class="exam-q' + (isChecked ? ' checked' : '') + '" data-qid="' + q.id + '">';
    html += '<input type="checkbox" class="exam-checkbox" data-qid="' + q.id + '" data-cmd="' + _esc(cmdTitle) + '" data-skey="' + key + '"' + (isChecked ? ' checked' : '') + '>';
    html += '<span class="exam-checkmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>';
    html += '<div class="exam-q-content">';
    html += '<div class="exam-q-text">' + _esc(_t(q, 'text')) + '</div>';
    if (qRef) { html += '<div class="exam-q-ref">' + qRef + '</div>'; }
    html += '</div></label>';
    if (q.id === 31 && _checked[31]) html += _pastoralNoteHTML();
  });
  html += '</div>';

  // Crossfade
  body.style.opacity = '0';
  body.style.transition = 'opacity 0.15s ease';
  setTimeout(function() {
    body.innerHTML = html;
    body.scrollTop = 0;
    body.style.opacity = '1';
    refs.initRefTaps(body);
    _wireCheckboxes(body);
    _updateDots();
    _updateFooterNav();
  }, 150);
}

function _wireCheckboxes(body) {
  if (body._examChangeWired) return;
  body._examChangeWired = true;
  body.addEventListener('change', function(e) {
    var cb = e.target;
    if (!cb.classList.contains('exam-checkbox')) return;
    var qid = parseInt(cb.dataset.qid, 10);
    var qEl = cb.closest('.exam-q');
    if (cb.checked) {
      _checked[qid] = {
        text: qEl.querySelector('.exam-q-text').textContent,
        commandment: cb.dataset.cmd,
        skey: cb.dataset.skey || ''
      };
      qEl.classList.add('checked');
      if (qid === 31 && !qEl.parentElement.querySelector('.exam-pastoral-note')) {
        qEl.insertAdjacentHTML('afterend', _pastoralNoteHTML());
      }
    } else {
      delete _checked[qid];
      qEl.classList.remove('checked');
      if (qid === 31) {
        var pn = qEl.parentElement && qEl.parentElement.querySelector('.exam-pastoral-note');
        if (pn) pn.remove();
      }
    }
    _haptic();
    _updateCheckedUI();
    var count = Object.keys(_checked).length;
    if (count === 1 && !_shownLogHint) {
      _shownLogHint = true;
      var render = require('./render.js');
      render.showToast((localStorage.getItem('mf-prayer-lang') === 'es') ? 'Anotado para tu resumen de confesión' : 'Noted for your confession summary');
    }
  });
}

function _updateFooterNav() {
  var ft = document.getElementById('readerFooter');
  if (!ft) return;
  if (_currentSection >= _sections.length) return; // summary screen manages its own footer

  var count = Object.keys(_checked).length;
  var isFirst = (_currentSection === 0);
  var isLast = (_currentSection === _sections.length - 1);

  var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
  var countLabel = count > 0
    ? '<button class="exam-nav-count exam-nav-count--link" onclick="examViewSummary()">' + count + (_l ? ' anotado' + (count !== 1 ? 's' : '') : ' item' + (count !== 1 ? 's' : '') + ' noted') + '</button>'
    : '<span class="exam-nav-count">' + (_l ? 'Sin anotaciones' : 'No items noted') + '</span>';
  var nextLabel = isLast ? (_l ? 'Ver Resumen \u2192' : 'View Summary \u2192') : (_l ? 'Siguiente \u2192' : 'Next \u2192');

  ft.innerHTML = '<div class="exam-nav" id="examNav">'
    + '<button class="exam-nav-back" onclick="examPrevSection()"' + (isFirst ? ' disabled' : '') + '>\u2190 ' + (_l ? 'Anterior' : 'Previous') + '</button>'
    + countLabel
    + '<button class="exam-nav-next" onclick="examNextSection()">' + nextLabel + '</button>'
    + '</div>';
}

function examNextSection() {
  _haptic();
  if (_currentSection >= _sections.length - 1) {
    examViewSummary();
    return;
  }
  _currentSection++;
  _renderCurrentSection();
}

function examPrevSection() {
  _haptic();
  if (_currentSection <= 0) return;
  _currentSection--;
  _renderCurrentSection();
}

function examGoToSection(n) {
  _haptic();
  if (n < 0 || n >= _sections.length) return;
  _currentSection = n;
  _renderCurrentSection();
}

function examViewSummary() {
  _haptic();
  _renderSummaryScreen();
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

function _renderSummaryScreen() {
  var d = _examData;
  if (!d) return;
  var body = document.getElementById('readerBody');
  body.style.opacity = '0';
  body.style.transition = 'opacity 0.15s ease';

  // Mark as past-last so _updateFooterNav and _updateDots know we're in summary
  _currentSection = _sections.length;

  setTimeout(function() {
    var html = '';

    // Summary section
    html += '<div class="exam-summary" id="examSummary">';
    html += '<div class="exam-summary-header">';
    html += '<svg class="exam-summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>';
    var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
    html += '<div><div class="exam-summary-title">' + (_l ? 'Resumen para la Confesión' : 'Summary for Confession') + '<span id="examSummaryCount"></span></div>';
    html += '<div class="exam-summary-privacy">' + (_l ? 'Esta lista existe solo durante esta sesión. No se guarda nada.' : 'This list exists only during this session. Nothing is saved.') + '</div></div>';
    html += '</div>';
    html += '<div class="exam-summary-list" id="examSummaryList">' + _renderSummaryHTML() + '</div>';
    html += '</div>';

    // Act of Contrition — elevated presentation
    html += '<div class="exam-contrition">';
    html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.act_of_contrition, 'title')) + '</div>';
    _t(d.prayers.act_of_contrition, 'text').split('\n\n').forEach(function(p) {
      html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
    });
    html += '</div>';
    if (d.prayers.thanksgiving) {
    html += '<div class="exam-prayer-divider"></div>';
    html += '<div class="exam-contrition">';
    html += '<div class="exam-contrition-title">' + _esc(_t(d.prayers.thanksgiving, 'title')) + '</div>';
    _t(d.prayers.thanksgiving, 'text').split('\n\n').forEach(function(p) {
      html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
    });
    html += '</div>';
  }

    // Confession tracker
    var lastConf = localStorage.getItem('mf-last-confession');
    var trackerHtml = '';
    if (lastConf) {
      var daysAgo = Math.floor((Date.now() - parseInt(lastConf, 10)) / 86400000);
      var agoLabel = _l
        ? (daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : 'Hace ' + daysAgo + ' días')
        : (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago');
      trackerHtml = '<div class="exam-tracker-status">' + (_l ? 'Última Confesión: ' : 'Last Confession: ') + agoLabel + '</div>';
    }
    html += '<div class="exam-tracker">' + trackerHtml;
    html += '<button class="exam-tracker-btn" onclick="examMarkConfession()">' + (_l ? 'Fui a confesarme hoy' : 'I went to confession today') + '</button>';
    html += '</div>';

    // Find Confession Near Me
    html += '<button class="exam-find-btn" onclick="examFindConfession()">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    html += (_l ? 'Encontrar Confesión Cerca' : 'Find Confession Near Me') + '</button>';

    // Graceful ending
    html += '<div class="exam-ending">';
    html += '<div class="exam-ending-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="36"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>';
    html += '<p class="exam-ending-text">' + (_l ? 'Ve en paz para amar y servir al Señor.' : 'Go in peace to love and serve the Lord.') + '</p>';
    html += '</div>';

    body.innerHTML = html;
    body.scrollTop = 0;
    body.style.opacity = '1';
    refs.initRefTaps(body);
    _updateCheckedUI();
    _updateDots();

    // Summary screen footer: back to examination + done
    var ft = document.getElementById('readerFooter');
    if (ft) {
      ft.innerHTML = '<div class="exam-nav" id="examNav">'
        + '<button class="exam-nav-back" onclick="examGoToSection(' + (_sections.length - 1) + ')">\u2190 ' + (_l ? 'Volver' : 'Back') + '</button>'
        + '<span class="exam-nav-count"></span>'
        + '<button class="exam-nav-next" onclick="examGracefulClose()">' + (_l ? 'Listo' : 'Done') + '</button>'
        + '</div>';
    }
  }, 150);
}

function examShowHowTo() {
  _haptic();
  var d = _examData;
  if (!d || !d.how_to_confess) return;
  var overlay = document.getElementById('readerOverlay');
  if (!overlay || overlay.querySelector('.exam-howto-modal')) return;

  var stepsHtml = '';
  d.how_to_confess.steps.forEach(function(step) {
    var stepText = (typeof step === 'string') ? step : _t(step, 'text');
    stepsHtml += '<li>' + _esc(stepText) + '</li>';
  });

  var closeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var wrapEl = document.createElement('div');
  wrapEl.className = 'exam-howto-modal';
  wrapEl.innerHTML = '<div class="exam-howto-modal-inner">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">'
    + '<span style="font-family:var(--font-display);font-size:var(--text-lg);font-weight:600;color:var(--color-text-primary);">' + _esc(_t(d.how_to_confess, 'title')) + '</span>'
    + '<button class="exam-howto-close" style="background:none;border:none;cursor:pointer;padding:var(--space-1);color:var(--color-text-secondary);-webkit-tap-highlight-color:transparent;">' + closeSvg + '</button>'
    + '</div>'
    + '<ol class="exam-howto-steps">' + stepsHtml + '</ol>'
    + '</div>';

  overlay.appendChild(wrapEl);
  wrapEl.querySelector('.exam-howto-close').addEventListener('click', function() { wrapEl.remove(); });
  wrapEl.addEventListener('click', function(e) { if (e.target === wrapEl) wrapEl.remove(); });
  requestAnimationFrame(function() { wrapEl.classList.add('visible'); });
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
  var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
  var wrap = document.createElement('div');
  wrap.className = 'exam-exit-dialog-wrap';
  wrap.innerHTML = '<div class="exam-exit-dialog">'
    + '<div class="exam-exit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>'
    + '<h4 class="exam-exit-title">' + (_l ? '¿Terminar Examen?' : 'End Examination?') + '</h4>'
    + '<p class="exam-exit-msg">' + (_l ? 'Tus ' + count + ' anotación' + (count !== 1 ? 'es' : '') + ' se borrarán por tu privacidad. Esto no se puede deshacer.' : 'Your ' + count + ' noted item' + plural + ' will be cleared for your privacy. This cannot be undone.') + '</p>'
    + '<div class="exam-exit-actions">'
    + '<button class="exam-exit-btn exam-exit-btn--cancel">' + (_l ? 'Continuar Examinando' : 'Continue Examining') + '</button>'
    + '<button class="exam-exit-btn exam-exit-btn--confirm">' + (_l ? 'Terminar y Borrar' : 'End &amp; Clear') + '</button>'
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
  var _l = (localStorage.getItem('mf-prayer-lang') === 'es');
  var todayLabel = (_l ? 'Última Confesión: ' : 'Last Confession: ') + (_l ? 'Hoy' : 'Today');
  var status = document.querySelector('.exam-tracker-status');
  if (status) {
    status.textContent = todayLabel;
  } else {
    var tracker = document.querySelector('.exam-tracker');
    if (tracker) {
      var div = document.createElement('div');
      div.className = 'exam-tracker-status';
      div.textContent = todayLabel;
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
  // PTR-03: Section-by-section navigation
  examNextSection: examNextSection,
  examPrevSection: examPrevSection,
  examGoToSection: examGoToSection,
  examViewSummary: examViewSummary,
  examShowHowTo: examShowHowTo,
};
