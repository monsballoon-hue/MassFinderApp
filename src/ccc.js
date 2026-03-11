// src/ccc.js — CCC (Catechism of the Catholic Church) bottom sheet
// Loads data/catechism.json (2,865 paragraphs) and renders paragraph references in a bottom sheet

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

async function _loadCCCData() {
  if (_cccData) return;
  var d = await cccData.load();
  if (d) { _cccData = d.paragraphs; _cccXrefs = d.xrefs; }
}

function _mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

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
  return html;
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

  // CCC-06: Show section context once for the primary paragraph
  var context = _getSectionContext(ids[0]);
  if (context) {
    bodyHtml += '<div class="ccc-section-context">' + utils.esc(context) + '</div>';
  }

  ids.forEach(function(id, idx) {
    var text = _cccData && _cccData[id];
    var numEl = '<div class="ccc-para-num' + (idx === 0 ? ' ccc-para-num--first' : '') + '">&#167;&nbsp;' + id + '</div>';
    bodyHtml += numEl;
    if (text) { bodyHtml += _renderParaText(text); }
    else { bodyHtml += '<p class="ccc-para-text" style="color:var(--color-text-tertiary)">Full text not in local dataset.</p>'; }
  });

  // Related paragraphs (forward + reverse refs from primary id)
  var primaryId = ids[0];
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

  bodyEl.innerHTML = bodyHtml;
  relEl.innerHTML = relHtml;
  document.getElementById('cccSheetScroll').scrollTop = 0;
  _cccCurrentNum = numStr;
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

function _initDialogDismiss() {
  var sheet = document.getElementById('cccSheet');
  if (!sheet || sheet._dialogInit) return;
  sheet._dialogInit = true;
  // Backdrop click — dialog click fires on the dialog itself when backdrop is clicked
  sheet.addEventListener('click', function(e) {
    if (e.target === sheet) closeCCC();
  });
  // Native Escape key — dialog fires 'cancel' event
  sheet.addEventListener('cancel', function(e) {
    e.preventDefault(); // prevent default close to run our cleanup
    closeCCC();
  });
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
  var sheet = document.getElementById('cccSheet');
  document.getElementById('cccBackBtn').style.display = 'none';
  window._lastFocused = document.activeElement;
  // LIB-05: native <dialog> — showModal() handles backdrop, scroll-lock, focus trap, Escape
  if (!sheet.open) sheet.showModal();
  _initDialogDismiss();
  _initSwipeDismiss();
  _initSearch();
  var input = document.getElementById('cccSearchInput');
  if (input) input.value = '';
  _hideSearchResults();
  _renderCCCContent(numStr);
}

function closeCCC() {
  var sheet = document.getElementById('cccSheet');
  // LIB-05: native <dialog> — close() handles backdrop removal + focus restore
  if (sheet.open) sheet.close();
  // Restore z-index if boosted for above-exam display
  if (sheet._aboveExam) {
    sheet.style.zIndex = '';
    sheet._aboveExam = false;
    // Restore body lock since exam is still open underneath
    document.body.style.overflow = 'hidden';
  }
  if (window._lastFocused) window._lastFocused.focus();
}

// Open CCC above the exam overlay (z-index 2000) without closing exam
function openCCCAboveExam(numStr) {
  var sheet = document.getElementById('cccSheet');
  sheet.style.zIndex = '2011';
  sheet._aboveExam = true;
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
};
