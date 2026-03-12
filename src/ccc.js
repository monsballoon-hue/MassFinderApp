// src/ccc.js — CCC (Catechism of the Catholic Church) Reading Room
// Loads data/catechism.json (2,865 paragraphs) and renders paragraphs in a full-screen reading overlay

var utils = require('./utils.js');
var cccData = require('./ccc-data.js');
var createFuzzySearch = require('@nozbe/microfuzz').default;
var _cccData = null, _cccXrefs = null, _cccHistory = [], _cccCurrentNum = '';
var _cccSearchIndex = null, _cccSearchTimer = null;

// CCC-06: Section context lookup — paragraph number ranges to section labels
var _CCC_SECTIONS = [
  [1, 25, 'Prologue'],
  [26, 49, 'Part One \u00b7 The Desire for God'],
  [50, 141, 'Part One \u00b7 God Comes to Meet Man'],
  [142, 184, 'Part One \u00b7 The Response of Faith'],
  [185, 278, 'Part One \u00b7 The Creeds'],
  [279, 421, 'Part One \u00b7 Creator of Heaven and Earth'],
  [422, 682, 'Part One \u00b7 Jesus Christ, Son of God'],
  [683, 747, 'Part One \u00b7 The Holy Spirit'],
  [748, 975, 'Part One \u00b7 The Church'],
  [976, 1065, 'Part One \u00b7 Forgiveness \u00b7 Resurrection \u00b7 Eternal Life'],
  [1066, 1209, 'Part Two \u00b7 The Sacramental Economy'],
  [1210, 1419, 'Part Two \u00b7 Baptism \u00b7 Confirmation \u00b7 Eucharist'],
  [1420, 1532, 'Part Two \u00b7 Penance \u00b7 Anointing of the Sick'],
  [1533, 1666, 'Part Two \u00b7 Holy Orders \u00b7 Matrimony'],
  [1667, 1690, 'Part Two \u00b7 Sacramentals \u00b7 Funerals'],
  [1691, 1876, 'Part Three \u00b7 The Dignity of the Human Person'],
  [1877, 2051, 'Part Three \u00b7 The Human Community \u00b7 The Law \u00b7 Grace'],
  [2052, 2557, 'Part Three \u00b7 The Ten Commandments'],
  [2558, 2758, 'Part Four \u00b7 Christian Prayer'],
  [2759, 2865, 'Part Four \u00b7 The Lord\u2019s Prayer']
];

function _getSectionContext(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < _CCC_SECTIONS.length; i++) {
    if (n >= _CCC_SECTIONS[i][0] && n <= _CCC_SECTIONS[i][1]) return _CCC_SECTIONS[i][2];
  }
  return '';
}

function _getSectionIndex(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < _CCC_SECTIONS.length; i++) {
    if (n >= _CCC_SECTIONS[i][0] && n <= _CCC_SECTIONS[i][1]) return i;
  }
  return -1;
}

// CR-02: Section picker toggle
function _toggleCCCSectionPicker() {
  var picker = document.getElementById('cccSectionPicker');
  if (!picker) return;
  picker.style.display = picker.style.display === 'none' ? '' : 'none';
}

async function _loadCCCData() {
  if (_cccData) return;
  var d = await cccData.load();
  if (d) { _cccData = d.paragraphs; _cccXrefs = d.xrefs; }
}

function _mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

// Wrap Scripture citations embedded in CCC paragraph text with tappable ref spans.
// CCC uses formats: "Mt 26:26", "cf. Jn 3:16", "1 Cor 11:24-25", "Ps 22:1"
// Runs against already-HTML-escaped text — safe because Scripture refs contain no HTML chars.
function _wrapCCCScriptureRefs(html) {
  // Matches standard Bible Book Abbr + Chapter:Verse(-Verse)
  // Preceded by optional "cf." or "Cf." prefix (kept in match, not captured separately)
  var pattern = /\b((?:1\s*|2\s*|3\s*)?(?:Mt|Mk|Lk|Jn|Acts|Rom|(?:1\s*|2\s*)?Cor|Gal|Eph|Phil|Col|(?:1\s*|2\s*)?Thess|(?:1\s*|2\s*)?Tim|Tit|Phlm|Heb|Jas|(?:1\s*|2\s*)?Pet|(?:1\s*|2\s*|3\s*)?Jn|Jude|Rev|Gen|Exod?|Lev|Num|Deut?|Josh|Judg|Ruth|(?:1\s*|2\s*)?Sam|(?:1\s*|2\s*|3\s*|4\s*)?Kgs|(?:1\s*|2\s*)?Chr|Ezra|Neh|Tob|Jdt|Esth|(?:1\s*|2\s*)?Macc|Job|Ps[s]?|Prov|Eccl(?:es)?|Song|Wis|Sir|Is[a]?|Jer|Lam|Bar|Ezek?|Dan|Hos|Joel|Amos|Obad|Jon[ah]?|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt(?:hew)?|Mark|Luke|John|Romans|(?:First|Second|Third|1st|2nd|3rd)\s+\w+|Matthew|Revelation)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;

  return html.replace(pattern, function(ref) {
    var escaped = ref.replace(/'/g, '&#39;');
    return '<span class="ref-tap ref-tap--bible" role="button" tabindex="0" onclick="window._refTap(\'bible\',\'' + escaped + '\')" aria-label="Scripture: ' + escaped + '">' + ref + '</span>';
  });
}

function _renderParaText(raw) {
  var clean = utils.stripCCCRefs(raw).trim();
  var lines = clean.split('\n');
  var html = '', bq = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.charAt(0) === '>') {
      if (!bq) { html += '<blockquote class="ccc-blockquote">'; bq = true; }
      html += '<p>' + _mdItalic(utils.esc(line.slice(1).trim())) + '</p>';
    } else {
      if (bq) { html += '</blockquote>'; bq = false; }
      html += '<p class="ccc-para-text">' + _mdItalic(utils.esc(line)) + '</p>';
    }
  }
  if (bq) html += '</blockquote>';
  return _wrapCCCScriptureRefs(html);
}

function _getPreview(raw) {
  var clean = utils.stripCCCRefs(raw).replace(/>/g, '').replace(/\*/g, '').trim();
  var m = clean.match(/^(.{10,160}[.!?]["\u201d]?)(\s|$)/);
  var preview = m ? m[1].trim() : clean.slice(0, 140).trim();
  if (preview.length < clean.length) preview += '\u2026';
  return preview;
}

function _parseCCCRange(numStr) {
  var m = numStr.match(/(\d+)[\-\u2013](\d+)/);
  if (m) {
    var ids = [], s = parseInt(m[1], 10), e = parseInt(m[2], 10);
    for (var i = s; i <= e; i++) ids.push(i);
    return ids;
  }
  return [parseInt(numStr, 10)];
}

async function _renderCCCContent(numStr) {
  var bodyEl = document.getElementById('cccSheetBody');
  var relEl = document.getElementById('cccSheetRelated');
  bodyEl.innerHTML = '<div class="ccc-loading">Loading\u2026</div>';
  relEl.innerHTML = '';
  await _loadCCCData();

  var ids = _parseCCCRange(numStr);
  var bodyHtml = '';
  var primaryId = ids[0];
  var primaryNum = parseInt(primaryId, 10);

  // CR-02: Section picker button (replaces static section context)
  var context = _getSectionContext(primaryId);
  var secIdx = _getSectionIndex(primaryId);
  if (context) {
    bodyHtml += '<button class="ccc-section-picker-btn" onclick="_toggleCCCSectionPicker()">'
      + utils.esc(context)
      + ' <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="1,1 5,5 9,1"/></svg>'
      + '</button>';
  }

  // CR-02: Hidden section picker panel
  bodyHtml += '<div class="ccc-section-picker" id="cccSectionPicker" style="display:none">';
  for (var si = 0; si < _CCC_SECTIONS.length; si++) {
    var sec = _CCC_SECTIONS[si];
    var isActive = si === secIdx;
    bodyHtml += '<button class="ccc-section-btn' + (isActive ? ' ccc-section-active' : '') + '" onclick="_toggleCCCSectionPicker();cccNavigate(\'' + sec[0] + '\')">'
      + '<span class="ccc-section-label">' + utils.esc(sec[2]) + '</span>'
      + '<span class="ccc-section-range">\u00A7' + sec[0] + '\u2013' + sec[1] + '</span>'
      + '</button>';
  }
  bodyHtml += '</div>';

  // Paragraph heading + content
  ids.forEach(function(id, idx) {
    var text = _cccData && _cccData[id];
    var numEl = '<div class="ccc-para-num' + (idx === 0 ? ' ccc-para-num--first' : '') + '">&#167;&nbsp;' + id + '</div>';
    bodyHtml += numEl;
    if (text) { bodyHtml += _renderParaText(text); }
    else { bodyHtml += '<p class="ccc-para-text" style="color:var(--color-text-tertiary)">Full text not in local dataset.</p>'; }
  });

  // Related paragraphs (forward + reverse refs from primary id)
  var relatedIds = [], seen = {};
  ids.forEach(function(id) { seen[id] = true; });
  if (_cccXrefs && _cccXrefs[primaryId]) {
    var xr = _cccXrefs[primaryId];
    (xr.fwd || []).concat(xr.rev || []).forEach(function(id) {
      if (!seen[id]) { seen[id] = true; relatedIds.push(id); }
    });
    relatedIds.sort(function(a, b) { return a - b; });
  }

  // CCC-07: Related teachings as invitation cards with section context
  var relHtml = '';
  if (relatedIds.length) {
    relHtml += '<div class="ccc-related-section">';
    relHtml += '<div class="ccc-related-header">See Also</div>';
    relatedIds.forEach(function(id) {
      var text = _cccData && _cccData[id];
      if (!text) return;
      var preview = _getPreview(text);
      var ctx = _getSectionContext(id);
      relHtml += '<div class="ccc-related-item" onclick="cccNavigate(\'' + id + '\')">'
        + '<div class="ccc-related-top">'
        + '<span class="ccc-related-num">&#167;&nbsp;' + id + '</span>'
        + (ctx ? '<span class="ccc-related-context">' + utils.esc(ctx) + '</span>' : '')
        + '</div>'
        + '<div class="ccc-related-preview">' + utils.esc(preview) + '</div>'
        + '</div>';
    });
    relHtml += '</div>';
  }

  // Explore button
  bodyHtml += '<button class="ccc-explore-btn" onclick="openExplore(\'ccc\',\'' + primaryId + '\')">Explore connections \u203A</button>';

  // CR-01: Prev/next sequential navigation
  var prevNum = null, nextNum = null;
  for (var p = primaryNum - 1; p >= 1; p--) {
    if (_cccData[p]) { prevNum = p; break; }
  }
  for (var n = primaryNum + 1; n <= 2865; n++) {
    if (_cccData[n]) { nextNum = n; break; }
  }
  if (prevNum || nextNum) {
    bodyHtml += '<div class="ccc-page-nav">';
    if (prevNum) {
      bodyHtml += '<button class="ccc-nav-btn" onclick="cccNavigate(\'' + prevNum + '\')">'
        + '<span class="ccc-nav-arrow">\u2190</span>'
        + '<span class="ccc-nav-label">\u00A7' + prevNum + '</span>'
        + '</button>';
    } else {
      bodyHtml += '<div class="ccc-nav-spacer"></div>';
    }
    bodyHtml += '<span class="ccc-nav-pos">\u00A7' + primaryNum + ' of 2,865</span>';
    if (nextNum) {
      bodyHtml += '<button class="ccc-nav-btn" onclick="cccNavigate(\'' + nextNum + '\')">'
        + '<span class="ccc-nav-label">\u00A7' + nextNum + '</span>'
        + '<span class="ccc-nav-arrow">\u2192</span>'
        + '</button>';
    } else {
      bodyHtml += '<div class="ccc-nav-spacer"></div>';
    }
    bodyHtml += '</div>';
  }

  bodyEl.innerHTML = bodyHtml;
  relEl.innerHTML = relHtml;
  document.getElementById('cccSheetScroll').scrollTop = 0;
  _cccCurrentNum = numStr;

  // Baltimore companion card — async append if mapping exists
  cccData.loadBaltimore().then(function(b) {
    if (!b) return;
    var card = _renderBaltimoreCard(b, ids[0]);
    if (card) {
      var cardEl = document.createElement('div');
      cardEl.innerHTML = card;
      // Insert before the explore button
      var exploreBtn = bodyEl.querySelector('.ccc-explore-btn');
      if (exploreBtn) bodyEl.insertBefore(cardEl.firstChild, exploreBtn);
      else bodyEl.appendChild(cardEl.firstChild);
    }
  });
}

function _renderBaltimoreCard(baltimore, cccNum) {
  var qa = baltimore.byCCC[String(cccNum)];
  if (!qa) return '';
  return '<div class="ccc-baltimore-card">'
    + '<div class="ccc-baltimore-label">Baltimore Catechism #' + qa.id + '</div>'
    + '<div class="ccc-baltimore-q">Q. ' + utils.esc(qa.question) + '</div>'
    + '<div class="ccc-baltimore-a">A. ' + utils.esc(qa.answer) + '</div>'
    + '</div>';
}

function _crossfadeTo(numStr) {
  var scroll = document.getElementById('cccSheetScroll');
  scroll.style.opacity = '0';
  setTimeout(function() {
    _renderCCCContent(numStr).then(function() {
      scroll.style.opacity = '1';
    });
  }, 150);
}

function cccNavigate(numStr) {
  _cccHistory.push(_cccCurrentNum);
  document.getElementById('cccBackBtn').style.display = 'inline-flex';
  _crossfadeTo(numStr);
}

function cccGoBack() {
  if (!_cccHistory.length) return;
  var prev = _cccHistory.pop();
  if (!_cccHistory.length) document.getElementById('cccBackBtn').style.display = 'none';
  _crossfadeTo(prev);
}

function _initSwipeDismiss() {
  var sheet = document.getElementById('cccSheet');
  if (!sheet || sheet._swipeInit) return;
  sheet._swipeInit = true;
  var startY = 0;
  var scrollEl = sheet.querySelector('.ccc-sheet-scroll');
  sheet.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  sheet.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    // Only dismiss if scrolled to top — prevents closing when scrolling back up through content
    var atTop = !scrollEl || scrollEl.scrollTop <= 5;
    if (dy > 72 && atTop) closeCCC();
  }, { passive: true });
}

function openCCC(numStr) {
  _cccHistory = [];
  document.getElementById('cccBackBtn').style.display = 'none';
  document.getElementById('cccOverlay').classList.add('open');
  document.getElementById('cccSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
  window._lastFocused = document.activeElement;
  _initSwipeDismiss();
  _initSearch();
  var input = document.getElementById('cccSearchInput');
  if (input) input.value = '';
  _hideSearchResults();
  // RD-06: Two-beat entry — container slides up, then content fades in
  var scroll = document.getElementById('cccSheetScroll');
  scroll.style.opacity = '0';
  _renderCCCContent(numStr);
  setTimeout(function() {
    scroll.style.opacity = '1';
    scroll.style.transition = 'opacity 0.3s ease';
  }, 200);
  // Focus trap
  var ui = require('./ui.js');
  ui.trapFocus(document.getElementById('cccSheet'));
}

function closeCCC() {
  var overlay = document.getElementById('cccOverlay');
  var sheet = document.getElementById('cccSheet');
  // RD-06: Reset entry transition
  var scroll = document.getElementById('cccSheetScroll');
  if (scroll) { scroll.style.opacity = ''; scroll.style.transition = ''; }
  overlay.classList.remove('open');
  sheet.classList.remove('open');
  // Restore z-index if boosted for above-exam display
  if (overlay._origZ) {
    overlay.style.zIndex = '';
    sheet.style.zIndex = '';
    overlay._origZ = false;
    // Restore body lock since exam is still open underneath
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  var ui = require('./ui.js');
  ui.releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
}

// Open CCC above the exam overlay (z-index 2000) without closing exam
function openCCCAboveExam(numStr) {
  var overlay = document.getElementById('cccOverlay');
  var sheet = document.getElementById('cccSheet');
  overlay.style.zIndex = '2010';
  sheet.style.zIndex = '2011';
  overlay._origZ = true;
  openCCC(numStr);
}

// ── CCC Search (LIB-02: microfuzz) ──
function _buildSearchIndex() {
  if (_cccSearchIndex || !_cccData) return;
  var items = [];
  Object.keys(_cccData).forEach(function(num) {
    var text = _cccData[num].replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '').replace(/\n/g, ' ');
    items.push({ num: num, text: text });
  });
  _cccSearchIndex = createFuzzySearch(items, {
    getText: function(item) { return [item.text]; }
  });
}

function _initSearch() {
  var input = document.getElementById('cccSearchInput');
  if (!input || input._searchInit) return;
  input._searchInit = true;
  input.addEventListener('input', function() {
    clearTimeout(_cccSearchTimer);
    var q = input.value.trim();
    if (!q) { _hideSearchResults(); return; }
    // If user types a paragraph number directly, navigate to it
    if (/^\d+$/.test(q) && parseInt(q) >= 1 && parseInt(q) <= 2865) {
      _cccSearchTimer = setTimeout(function() {
        _showSearchResults([{ item: { num: q, text: _cccData && _cccData[q] ? _cccData[q].slice(0, 140) : '' } }]);
      }, 200);
      return;
    }
    _cccSearchTimer = setTimeout(function() { _doSearch(q); }, 250);
  });
}

function _doSearch(query) {
  if (!_cccData) {
    _loadCCCData().then(function() {
      _buildSearchIndex();
      _doSearch(query);
    });
    return;
  }
  _buildSearchIndex();
  if (!_cccSearchIndex) return;
  var results = _cccSearchIndex(query);
  _showSearchResults(results.slice(0, 12));
}

function _showSearchResults(results) {
  var el = document.getElementById('cccSearchResults');
  var body = document.getElementById('cccSheetBody');
  var related = document.getElementById('cccSheetRelated');
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<div class="ccc-search-empty">No results found</div>';
    el.style.display = '';
    body.style.display = 'none';
    related.style.display = 'none';
    return;
  }
  el.innerHTML = results.map(function(r) {
    var num = r.item.num;
    var text = r.item.text || '';
    var preview = text.slice(0, 120);
    if (text.length > 120) preview += '\u2026';
    var ctx = _getSectionContext(num);
    return '<div class="ccc-search-item" onclick="cccSearchSelect(\'' + num + '\')">'
      + '<div class="ccc-search-item-top">'
      + '<span class="ccc-search-num">\u00A7' + num + '</span>'
      + (ctx ? '<span class="ccc-search-ctx">' + utils.esc(ctx) + '</span>' : '')
      + '</div>'
      + '<div class="ccc-search-preview">' + utils.esc(preview) + '</div>'
      + '</div>';
  }).join('');
  el.style.display = '';
  body.style.display = 'none';
  related.style.display = 'none';
}

function _hideSearchResults() {
  var el = document.getElementById('cccSearchResults');
  var body = document.getElementById('cccSheetBody');
  var related = document.getElementById('cccSheetRelated');
  if (el) el.style.display = 'none';
  if (body) body.style.display = '';
  if (related) related.style.display = '';
}

function cccSearchSelect(numStr) {
  var input = document.getElementById('cccSearchInput');
  if (input) input.value = '';
  _hideSearchResults();
  cccNavigate(numStr);
}

module.exports = {
  openCCC: openCCC,
  closeCCC: closeCCC,
  openCCCAboveExam: openCCCAboveExam,
  cccNavigate: cccNavigate,
  cccGoBack: cccGoBack,
  cccSearchSelect: cccSearchSelect,
  _toggleCCCSectionPicker: _toggleCCCSectionPicker,
};
