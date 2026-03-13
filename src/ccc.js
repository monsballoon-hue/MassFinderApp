// src/ccc.js — CCC (Catechism of the Catholic Church) Reading Room
// Universal reader module — registers with reader.js for overlay management.
// Loads data/catechism.json (2,865 paragraphs) and renders paragraphs in the shared reader overlay.

var utils = require('./utils.js');
var cccData = require('./ccc-data.js');
var reader = require('./reader.js');
var search = require('./search.js');
var studyDb = require('./study-db.js');
var studyUi = require('./study-ui.js');
var tts = require('./tts.js');
var connections = require('./connections.js');
var _cccData = null, _cccXrefs = null, _cccCurrentNum = '';
var _cccPlainText = '';
var _cccSearchTimer = null;
var _cccFootnotes = null;

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
  // Load footnotes in parallel (non-blocking — render works without them)
  if (!_cccFootnotes) {
    try {
      var resp = await fetch('data/ccc-footnotes.json');
      if (resp.ok) _cccFootnotes = await resp.json();
    } catch (e) { /* footnotes are enhancement-only */ }
  }
}

function _mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

// Wrap Scripture citations embedded in CCC paragraph text with tappable ref spans.
function _wrapCCCScriptureRefs(html) {
  var pattern = /\b((?:1\s*|2\s*|3\s*)?(?:Mt|Mk|Lk|Jn|Acts|Rom|(?:1\s*|2\s*)?Cor|Gal|Eph|Phil|Col|(?:1\s*|2\s*)?Thess|(?:1\s*|2\s*)?Tim|Tit|Phlm|Heb|Jas|(?:1\s*|2\s*)?Pet|(?:1\s*|2\s*|3\s*)?Jn|Jude|Rev|Gen|Exod?|Lev|Num|Deut?|Josh|Judg|Ruth|(?:1\s*|2\s*)?Sam|(?:1\s*|2\s*|3\s*|4\s*)?Kgs|(?:1\s*|2\s*)?Chr|Ezra|Neh|Tob|Jdt|Esth|(?:1\s*|2\s*)?Macc|Job|Ps[s]?|Prov|Eccl(?:es)?|Song|Wis|Sir|Is[a]?|Jer|Lam|Bar|Ezek?|Dan|Hos|Joel|Amos|Obad|Jon[ah]?|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt(?:hew)?|Mark|Luke|John|Romans|(?:First|Second|Third|1st|2nd|3rd)\s+\w+|Matthew|Revelation)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;

  return html.replace(pattern, function(ref) {
    var escaped = ref.replace(/'/g, '&#39;');
    return '<span class="ref-tap ref-tap--bible" role="button" tabindex="0" onclick="window._refTap(\'bible\',\'' + escaped + '\',this)" aria-label="Scripture: ' + escaped + '">' + ref + '</span>';
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
  return utils.getPreview(raw);
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
  bodyEl.innerHTML = '<div class="ccc-loading">Loading\u2026</div>';
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
  var plainParts = [];
  ids.forEach(function(id, idx) {
    var text = _cccData && _cccData[id];
    bodyHtml += '<div class="ccc-para-wrap annotatable" data-source="ccc" data-address="' + id + '">';
    bodyHtml += '<div class="ccc-para-num' + (idx === 0 ? ' ccc-para-num--first' : '') + '">&#167;&nbsp;' + id + '</div>';
    if (text) {
      bodyHtml += _renderParaText(text);
      // Collect plain text for TTS — strip markdown/formatting
      plainParts.push(text.replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '').replace(/\n/g, ' '));
    }
    else { bodyHtml += '<p class="ccc-para-text" style="color:var(--color-text-tertiary)">Full text not in local dataset.</p>'; }
    bodyHtml += '</div>'; // close .ccc-para-wrap
  });
  _cccPlainText = plainParts.join(' ').trim();

  // ST-18: Listen button
  if (tts.isSupported()) {
    bodyHtml += '<button class="reader-listen-btn" id="cccListenBtn" onclick="cccReadAloud()">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16">'
      + '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
      + '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
      + '</svg>'
      + ' <span id="cccListenLabel">Listen</span></button>';
  }

  // Footnotes / Sources collapsible section
  var footnotes = _cccFootnotes && _cccFootnotes[primaryId];
  if (footnotes && footnotes.length) {
    bodyHtml += '<details class="ccc-sources">';
    bodyHtml += '<summary class="ccc-sources-header">Sources <span class="ccc-sources-count">' + footnotes.length + '</span></summary>';
    bodyHtml += '<div class="ccc-sources-body">';
    footnotes.forEach(function(fn) {
      var icon = fn.type === 'scripture' ? 'Scripture'
        : fn.type === 'church_father' ? 'Church Father'
        : fn.type === 'council' ? 'Council'
        : fn.type === 'liturgical' ? 'Liturgical'
        : 'Document';
      bodyHtml += '<div class="ccc-source-item">';
      bodyHtml += '<span class="ccc-source-type">' + utils.esc(icon) + '</span>';
      if (fn.source) bodyHtml += '<span class="ccc-source-name">' + utils.esc(fn.source) + '</span>';
      if (fn.work) bodyHtml += '<span class="ccc-source-work">' + utils.esc(fn.work) + '</span>';
      if (fn.ref && fn.type === 'scripture') {
        var cleanRef = fn.ref.replace(/^cf\.\s*/i, '').replace(/\u21d2\s*/g, '').trim();
        bodyHtml += '<span class="ref-tap ref-tap--bible" onclick="window._refTap(\'bible\',\'' + utils.esc(cleanRef).replace(/'/g, '&#39;') + '\',this)">' + utils.esc(fn.ref) + '</span>';
      } else if (fn.ref && !fn.work) {
        bodyHtml += '<span class="ccc-source-ref">' + utils.esc(fn.ref) + '</span>';
      }
      bodyHtml += '</div>';
    });
    bodyHtml += '</div></details>';
  }

  // Inline connections (tiered — populated async after render)
  bodyHtml += '<div id="cccConnections" class="reader-connections"></div>';

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
  // Scroll readerBody (the scrollable container) to top
  var readerBody = document.getElementById('readerBody');
  if (readerBody) readerBody.scrollTop = 0;
  _cccCurrentNum = numStr;

  // ST-11: Init study layer and apply existing annotations
  studyUi.initStudyLayer(readerBody);
  var cccAddresses = ids.map(function(id) { return String(id); });
  studyUi.applyAnnotations('ccc', readerBody, cccAddresses);

  // ST-05: Auto-save reading progress on scroll
  var _cccProgressTimer = null;
  if (readerBody && !readerBody._cccProgressInit) {
    readerBody._cccProgressInit = true;
    readerBody.addEventListener('scroll', function() {
      clearTimeout(_cccProgressTimer);
      _cccProgressTimer = setTimeout(function() {
        if (_cccCurrentNum) {
          studyDb.saveProgress('ccc', null, _cccCurrentNum, readerBody.scrollTop);
        }
      }, 3000);
    }, { passive: true });
  }

  // Inline connections (async — loads data, renders tiered connections below content)
  var connEl = document.getElementById('cccConnections');
  if (connEl) connections.renderConnections('ccc', String(primaryId), connEl);
}

// ── Reader module registration ──
reader.registerModule('ccc', {
  getTitle: function(params) {
    return 'Catechism \u00A7' + (params && params.num ? params.num : '');
  },
  render: function(params, bodyEl, footerEl) {
    var numStr = params && params.num ? String(params.num) : '1';
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    // Create wrapper divs inside bodyEl for _renderCCCContent
    bodyEl.innerHTML = '<div id="cccSheetBody"></div>'
      + '<div id="cccSearchResults" style="display:none"></div>';

    _renderCCCContent(numStr);
    _initSearch();
  },
  onClose: function() {
    _cccCurrentNum = '';
    tts.stop();
    clearTimeout(_cccSearchTimer);
  },
  getHeaderExtra: function() {
    return '<div class="ccc-search-bar">'
      + '<input type="search" id="cccSearchInput" class="ccc-search-input" placeholder="Search the Catechism\u2026" autocomplete="off" />'
      + '</div>';
  }
});

function cccNavigate(numStr) {
  reader.readerOpen('ccc', { num: String(numStr) });
}

function cccGoBack() {
  reader.readerBack();
}

function openCCC(numStr) {
  var input = document.getElementById('cccSearchInput');
  if (input) input.value = '';
  _hideSearchResults();
  reader.readerOpen('ccc', { num: String(numStr) });
}

function closeCCC() {
  reader.readerClose();
}

// openCCCAboveExam — in the reader model, CCC opens above exam via the stack automatically
function openCCCAboveExam(numStr) {
  openCCC(numStr);
}

// ── CCC Search (powered by unified search.js) ──

function _initSearch() {
  var input = document.getElementById('cccSearchInput');
  if (!input || input._searchInit) return;
  input._searchInit = true;
  input.addEventListener('input', function() {
    clearTimeout(_cccSearchTimer);
    var q = input.value.trim();
    if (!q) { _hideSearchResults(); return; }
    _cccSearchTimer = setTimeout(function() { _doSearch(q); }, 200);
  });
}

function _doSearch(query) {
  var sr = search.query(query, { sources: ['ccc'], maxPerGroup: 12 });
  var items = [];
  sr.groups.forEach(function(g) {
    if (g.source === 'ccc') items = g.items;
  });
  _showSearchResults(items);
}

function _showSearchResults(results) {
  var el = document.getElementById('cccSearchResults');
  var body = document.getElementById('cccSheetBody');
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<div class="ccc-search-empty">No results found</div>';
    el.style.display = '';
    if (body) body.style.display = 'none';
    return;
  }
  el.innerHTML = results.map(function(r) {
    var num = r.ref;
    var ctx = r.context || _getSectionContext(num);
    return '<div class="ccc-search-item" onclick="cccSearchSelect(\'' + num + '\')">'
      + '<div class="ccc-search-item-top">'
      + '<span class="ccc-search-num">\u00A7' + num + '</span>'
      + (ctx ? '<span class="ccc-search-ctx">' + utils.esc(ctx) + '</span>' : '')
      + '</div>'
      + '<div class="ccc-search-preview">' + utils.esc(r.preview || '') + '</div>'
      + '</div>';
  }).join('');
  el.style.display = '';
  if (body) body.style.display = 'none';
}

function _hideSearchResults() {
  var el = document.getElementById('cccSearchResults');
  var body = document.getElementById('cccSheetBody');
  if (el) el.style.display = 'none';
  if (body) body.style.display = '';
}

function cccSearchSelect(numStr) {
  var input = document.getElementById('cccSearchInput');
  if (input) input.value = '';
  _hideSearchResults();
  cccNavigate(numStr);
}

// ST-18: CCC Read Aloud
function cccReadAloud() {
  if (!_cccPlainText) return;
  tts.onStateChange(function(state) {
    _updateCCCListenBtn(state);
    if (state === 'error') {
      var render = require('./render.js');
      if (render.showToast) render.showToast('Read Aloud is not available on this device');
    }
  });
  tts.togglePlayPause(_cccPlainText);
}

function _updateCCCListenBtn(state) {
  var btn = document.getElementById('cccListenBtn');
  var label = document.getElementById('cccListenLabel');
  if (!btn) return;
  if (!state) state = tts.getState();
  if (state === 'playing') {
    btn.classList.add('is-playing');
    if (label) label.textContent = 'Pause';
  } else {
    btn.classList.remove('is-playing');
    if (label) label.textContent = 'Listen';
  }
}

function getCurrentPlainText() { return _cccPlainText || ''; }

module.exports = {
  openCCC: openCCC,
  closeCCC: closeCCC,
  openCCCAboveExam: openCCCAboveExam,
  cccNavigate: cccNavigate,
  cccGoBack: cccGoBack,
  cccReadAloud: cccReadAloud,
  getCurrentPlainText: getCurrentPlainText,
  cccSearchSelect: cccSearchSelect,
  _toggleCCCSectionPicker: _toggleCCCSectionPicker,
};
