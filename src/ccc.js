// src/ccc.js — CCC (Catechism of the Catholic Church) bottom sheet
// Loads ccc-mini.json and renders paragraph references in a bottom sheet

var _cccData = null, _cccXrefs = null, _cccHistory = [], _cccCurrentNum = '';

async function _loadCCCData() {
  if (_cccData) return;
  try {
    var resp = await fetch('/ccc-mini.json');
    var json = await resp.json();
    _cccData = {};
    Object.keys(json.paragraphs).forEach(function(k) { _cccData[parseInt(k, 10)] = json.paragraphs[k]; });
    _cccXrefs = {};
    Object.keys(json.xrefs).forEach(function(k) { _cccXrefs[parseInt(k, 10)] = json.xrefs[k]; });
  } catch (e) {}
}

function _cccEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function _stripRefs(t) { return t.replace(/\s*\(\d[\d,\s\-\u2013]*\)\s*/g, ' ').trim(); }
function _mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

function _renderParaText(raw) {
  var clean = _stripRefs(raw).trim();
  var lines = clean.split('\n');
  var html = '', bq = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.charAt(0) === '>') {
      if (!bq) { html += '<blockquote class="ccc-blockquote">'; bq = true; }
      html += '<p>' + _mdItalic(_cccEsc(line.slice(1).trim())) + '</p>';
    } else {
      if (bq) { html += '</blockquote>'; bq = false; }
      html += '<p class="ccc-para-text">' + _mdItalic(_cccEsc(line)) + '</p>';
    }
  }
  if (bq) html += '</blockquote>';
  return html;
}

function _getPreview(raw) {
  var clean = _stripRefs(raw).replace(/>/g, '').replace(/\*/g, '').trim();
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

  var relHtml = '';
  if (relatedIds.length) {
    relHtml += '<hr class="ccc-divider"><div class="ccc-related-header">Related Teachings</div>';
    relatedIds.forEach(function(id) {
      var text = _cccData && _cccData[id];
      if (!text) return;
      var preview = _getPreview(text);
      relHtml += '<div class="ccc-related-item" onclick="cccNavigate(\'' + id + '\')">' +
        '<div class="ccc-related-num">&#167;&nbsp;' + id + '</div>' +
        '<div class="ccc-related-preview">' + _cccEsc(preview) + '</div>' +
        '</div>';
    });
  }

  bodyEl.innerHTML = bodyHtml;
  relEl.innerHTML = relHtml;
  document.getElementById('cccSheetScroll').scrollTop = 0;
  _cccCurrentNum = numStr;
}

function cccNavigate(numStr) {
  _cccHistory.push(_cccCurrentNum);
  document.getElementById('cccBackBtn').style.display = 'inline-flex';
  _renderCCCContent(numStr);
}

function cccGoBack() {
  if (!_cccHistory.length) return;
  var prev = _cccHistory.pop();
  if (!_cccHistory.length) document.getElementById('cccBackBtn').style.display = 'none';
  _renderCCCContent(prev);
}

function _initSwipeDismiss() {
  var sheet = document.getElementById('cccSheet');
  if (!sheet || sheet._swipeInit) return;
  sheet._swipeInit = true;
  var startY = 0;
  sheet.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  sheet.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    if (dy > 72) closeCCC();
  }, { passive: true });
}

function openCCC(numStr) {
  _cccHistory = [];
  document.getElementById('cccBackBtn').style.display = 'none';
  document.getElementById('cccOverlay').classList.add('open');
  document.getElementById('cccSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
  _initSwipeDismiss();
  _renderCCCContent(numStr);
}

function closeCCC() {
  document.getElementById('cccOverlay').classList.remove('open');
  document.getElementById('cccSheet').classList.remove('open');
  document.body.style.overflow = '';
}

module.exports = {
  openCCC: openCCC,
  closeCCC: closeCCC,
  cccNavigate: cccNavigate,
  cccGoBack: cccGoBack,
};
