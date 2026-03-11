// src/explore.js — CCC Explore module (OW-21)
// Deep cross-reference exploration: CCC ↔ Baltimore ↔ Scripture ↔ Lectionary
var utils = require('./utils.js');
var cccData = require('./ccc-data.js');

// ── State ──
var _history = [];       // navigation stack: [{ type, id }]
var _current = null;     // { type: 'ccc'|'bible', id: string }
var _cccParas = null;    // cached CCC paragraphs
var _cccXrefs = null;    // cached CCC xrefs
var _baltimore = null;   // cached Baltimore { byCCC }
var _bibleXrefs = null;  // cached bible-xrefs.json
var _lectionary = null;  // cached lectionary-index.json
var _cccVerseIndex = null; // reverse index: Bible ref → [ccc §]

// CCC Section context (duplicated from ccc.js for independence)
var _CCC_SECTIONS = [
  [1, 25, 'Prologue'],
  [26, 49, 'The Desire for God'],
  [50, 141, 'God Comes to Meet Man'],
  [142, 184, 'The Response of Faith'],
  [185, 278, 'The Creeds'],
  [279, 421, 'Creator of Heaven and Earth'],
  [422, 682, 'Jesus Christ, Son of God'],
  [683, 747, 'The Holy Spirit'],
  [748, 975, 'The Church'],
  [976, 1065, 'Forgiveness, Resurrection, Eternal Life'],
  [1066, 1209, 'The Sacramental Economy'],
  [1210, 1419, 'Baptism, Confirmation, Eucharist'],
  [1420, 1532, 'Penance, Anointing of the Sick'],
  [1533, 1666, 'Holy Orders, Matrimony'],
  [1667, 1690, 'Sacramentals, Funerals'],
  [1691, 1876, 'The Dignity of the Human Person'],
  [1877, 2051, 'The Human Community, The Law, Grace'],
  [2052, 2557, 'The Ten Commandments'],
  [2558, 2758, 'Christian Prayer'],
  [2759, 2865, 'The Lord\u2019s Prayer']
];

function _getSectionContext(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < _CCC_SECTIONS.length; i++) {
    if (n >= _CCC_SECTIONS[i][0] && n <= _CCC_SECTIONS[i][1]) return _CCC_SECTIONS[i][2];
  }
  return '';
}

// ── Topic chips for browse mode ──
var _TOPICS = _CCC_SECTIONS.map(function(s) {
  return { label: s[2], start: s[0], end: s[1] };
});

// ── Data loading (all lazy, parallel where possible) ──
function _loadAll() {
  var promises = [];

  // CCC data
  promises.push(cccData.load().then(function(d) {
    if (d) { _cccParas = d.paragraphs; _cccXrefs = d.xrefs; }
  }));

  // Baltimore
  promises.push(cccData.loadBaltimore().then(function(b) {
    if (b) _baltimore = b;
  }));

  // Bible xrefs
  if (!_bibleXrefs) {
    promises.push(fetch('/data/bible-xrefs.json')
      .then(function(r) { return r.json(); })
      .then(function(d) { _bibleXrefs = d; })
      .catch(function() { _bibleXrefs = {}; })
    );
  }

  // Lectionary
  if (!_lectionary) {
    promises.push(fetch('/data/lectionary-index.json')
      .then(function(r) { return r.json(); })
      .then(function(d) { _lectionary = d; })
      .catch(function() { _lectionary = null; })
    );
  }

  return Promise.all(promises);
}

// Build reverse index: which CCC paragraphs cite which Bible verses
// Scans all 2,865 CCC paragraphs once with a simple regex
function _buildCCCVerseIndex() {
  if (_cccVerseIndex || !_cccParas) return;
  _cccVerseIndex = {};
  var pattern = /\b((?:1\s*|2\s*|3\s*)?(?:Mt|Mk|Lk|Jn|Acts|Rom|(?:1\s*|2\s*)?Cor|Gal|Eph|Phil|Col|(?:1\s*|2\s*)?Thess|(?:1\s*|2\s*)?Tim|Tit|Phlm|Heb|Jas|(?:1\s*|2\s*)?Pet|(?:1\s*|2\s*|3\s*)?Jn|Jude|Rev|Gen|Exod?|Lev|Num|Deut?|Josh|Judg|Ruth|(?:1\s*|2\s*)?Sam|(?:1\s*|2\s*|3\s*|4\s*)?Kgs|(?:1\s*|2\s*)?Chr|Ezra|Neh|Tob|Jdt|Esth|(?:1\s*|2\s*)?Macc|Job|Ps[s]?|Prov|Eccl(?:es)?|Song|Wis|Sir|Is[a]?|Jer|Lam|Bar|Ezek?|Dan|Hos|Joel|Amos|Obad|Jon[ah]?|Mic|Nah|Hab|Zeph|Hag|Zech|Mal)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;

  Object.keys(_cccParas).forEach(function(num) {
    var text = _cccParas[num];
    var match;
    while ((match = pattern.exec(text)) !== null) {
      var ref = match[1].trim();
      if (!_cccVerseIndex[ref]) _cccVerseIndex[ref] = [];
      if (_cccVerseIndex[ref].indexOf(num) < 0) _cccVerseIndex[ref].push(num);
    }
  });
}

// ── Lectionary search — find liturgical days that use a given reference ──
function _findInLectionary(refStr) {
  if (!_lectionary) return [];
  var results = [];
  var refLower = refStr.toLowerCase().replace(/\s+/g, ' ');

  function scanCycle(cycleName, days) {
    if (!days) return;
    Object.keys(days).forEach(function(dayKey) {
      var readings = days[dayKey];
      Object.keys(readings).forEach(function(readingType) {
        var val = readings[readingType];
        if (typeof val === 'string' && val.toLowerCase().indexOf(refLower.split(':')[0]) >= 0) {
          // Rough match on book+chapter
          var label = dayKey.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          if (cycleName) label += ' (Year ' + cycleName + ')';
          if (results.length < 5) {
            results.push({ label: label, type: readingType.replace(/_/g, ' ') });
          }
        }
      });
    });
  }

  // Scan sundays (A, B, C cycles)
  if (_lectionary.sundays) {
    Object.keys(_lectionary.sundays).forEach(function(cycle) {
      scanCycle(cycle, _lectionary.sundays[cycle]);
    });
  }
  // Scan weekdays
  if (_lectionary.weekdays) {
    Object.keys(_lectionary.weekdays).forEach(function(yearKey) {
      scanCycle(null, _lectionary.weekdays[yearKey]);
    });
  }

  return results;
}

// ── Extract scripture refs from CCC paragraph text ──
function _extractScriptureRefs(text) {
  if (!text) return [];
  var pattern = /\b((?:1\s*|2\s*|3\s*)?(?:Mt|Mk|Lk|Jn|Acts|Rom|(?:1\s*|2\s*)?Cor|Gal|Eph|Phil|Col|(?:1\s*|2\s*)?Thess|(?:1\s*|2\s*)?Tim|Tit|Phlm|Heb|Jas|(?:1\s*|2\s*)?Pet|(?:1\s*|2\s*|3\s*)?Jn|Jude|Rev|Gen|Exod?|Lev|Num|Deut?|Josh|Judg|Ruth|(?:1\s*|2\s*)?Sam|(?:1\s*|2\s*|3\s*|4\s*)?Kgs|(?:1\s*|2\s*)?Chr|Ezra|Neh|Tob|Jdt|Esth|(?:1\s*|2\s*)?Macc|Job|Ps[s]?|Prov|Eccl(?:es)?|Song|Wis|Sir|Is[a]?|Jer|Lam|Bar|Ezek?|Dan|Hos|Joel|Amos|Obad|Jon[ah]?|Mic|Nah|Hab|Zeph|Hag|Zech|Mal)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;
  var refs = [], match, seen = {};
  while ((match = pattern.exec(text)) !== null) {
    var ref = match[1].trim();
    if (!seen[ref]) { seen[ref] = true; refs.push(ref); }
  }
  return refs;
}

// ── Connection generation ──
function _generateConnections(type, id) {
  var connections = [];

  if (type === 'ccc') {
    var num = parseInt(id, 10);
    var text = _cccParas && _cccParas[num];

    // 1. Baltimore companion
    if (_baltimore && _baltimore.byCCC[String(num)]) {
      var qa = _baltimore.byCCC[String(num)];
      connections.push({
        group: 'Baltimore Catechism',
        items: [{ type: 'baltimore', label: 'Q' + qa.id + '. ' + qa.question, detail: 'A. ' + qa.answer }]
      });
    }

    // 2. Scripture citations from paragraph text
    if (text) {
      var scriptureRefs = _extractScriptureRefs(text);
      if (scriptureRefs.length) {
        connections.push({
          group: 'Scripture Citations',
          items: scriptureRefs.map(function(r) {
            return { type: 'bible', label: r, ref: r };
          }),
          maxVisible: 3
        });
      }
    }

    // 3. CCC cross-references
    if (_cccXrefs && _cccXrefs[num]) {
      var xr = _cccXrefs[num];
      var related = [];
      var seen = {};
      seen[num] = true;
      (xr.fwd || []).concat(xr.rev || []).forEach(function(rid) {
        if (!seen[rid]) {
          seen[rid] = true;
          var rtext = _cccParas && _cccParas[rid];
          var preview = rtext ? _getPreview(rtext) : '';
          var ctx = _getSectionContext(rid);
          related.push({ type: 'ccc', label: '\u00A7' + rid, detail: preview, context: ctx, ref: String(rid) });
        }
      });
      if (related.length) {
        connections.push({ group: 'Related Teachings', items: related, maxVisible: 3 });
      }
    }

    // 4. Lectionary matches for cited verses
    if (text) {
      var sRefs = _extractScriptureRefs(text);
      var lectResults = [];
      var lectSeen = {};
      sRefs.slice(0, 3).forEach(function(ref) {
        _findInLectionary(ref).forEach(function(lr) {
          if (!lectSeen[lr.label]) {
            lectSeen[lr.label] = true;
            lectResults.push(lr);
          }
        });
      });
      if (lectResults.length) {
        connections.push({
          group: 'In the Lectionary',
          items: lectResults.map(function(lr) {
            return { type: 'info', label: lr.label, detail: lr.type };
          }),
          maxVisible: 3
        });
      }
    }
  }

  if (type === 'bible') {
    // 1. Bible cross-references
    if (_bibleXrefs) {
      // id is a ref string like "John 3:16" — need to convert to xref key format
      var xrefKey = _refToXrefKey(id);
      var bibleRefs = _bibleXrefs[xrefKey] || [];
      if (bibleRefs.length) {
        connections.push({
          group: 'Cross-References',
          items: bibleRefs.slice(0, 20).map(function(r) {
            return { type: 'bible', label: r, ref: r };
          }),
          maxVisible: 3
        });
      }
    }

    // 2. CCC paragraphs that cite this verse
    _buildCCCVerseIndex();
    if (_cccVerseIndex) {
      // Try various key formats
      var verseKeys = [id];
      var cccNums = [];
      var cccSeen = {};
      verseKeys.forEach(function(vk) {
        (_cccVerseIndex[vk] || []).forEach(function(num) {
          if (!cccSeen[num]) {
            cccSeen[num] = true;
            var text = _cccParas && _cccParas[parseInt(num, 10)];
            cccNums.push({
              type: 'ccc', label: '\u00A7' + num,
              detail: text ? _getPreview(text) : '',
              context: _getSectionContext(num),
              ref: String(num)
            });
          }
        });
      });
      if (cccNums.length) {
        connections.push({ group: 'Catechism References', items: cccNums, maxVisible: 3 });
      }
    }

    // 3. Lectionary matches
    var lectMatches = _findInLectionary(id);
    if (lectMatches.length) {
      connections.push({
        group: 'In the Lectionary',
        items: lectMatches.map(function(lr) {
          return { type: 'info', label: lr.label, detail: lr.type };
        }),
        maxVisible: 3
      });
    }
  }

  return connections;
}

// Convert a human-readable ref like "John 3:16" to xref key format like "John:3:16"
function _refToXrefKey(ref) {
  // xref keys use format "Abbr:Ch:Vs" — try common transformations
  var m = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return ref;
  var book = m[1].trim();
  return book + ':' + m[2] + ':' + m[3];
}

function _getPreview(raw) {
  var clean = utils.stripCCCRefs(raw).replace(/>/g, '').replace(/\*/g, '').trim();
  var m = clean.match(/^(.{10,120}[.!?]["\u201d]?)(\s|$)/);
  var preview = m ? m[1].trim() : clean.slice(0, 100).trim();
  if (preview.length < clean.length) preview += '\u2026';
  return preview;
}

// ── Rendering ──
function _render() {
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (!body || !_current) return;

  // Breadcrumb trail
  var trailHtml = '';
  if (_history.length) {
    _history.forEach(function(h, i) {
      var label = h.type === 'ccc' ? '\u00A7' + h.id : h.id;
      trailHtml += '<span class="explore-crumb" onclick="explorePop(' + i + ')">' + utils.esc(label) + '</span>';
      trailHtml += '<span class="explore-crumb-sep">\u203A</span>';
    });
  }
  var curLabel = _current.type === 'ccc' ? '\u00A7' + _current.id : _current.id;
  trailHtml += '<span class="explore-crumb explore-crumb--active">' + utils.esc(curLabel) + '</span>';
  if (trail) trail.innerHTML = trailHtml;

  // Primary content
  var html = '';

  if (_current.type === 'ccc') {
    var num = parseInt(_current.id, 10);
    var ctx = _getSectionContext(num);
    var text = _cccParas && _cccParas[num];

    if (ctx) html += '<div class="explore-context">' + utils.esc(ctx) + '</div>';
    html += '<div class="explore-primary-num">\u00A7' + num + '</div>';
    if (text) {
      html += '<div class="explore-primary-text">' + _renderParaText(text) + '</div>';
    } else {
      html += '<div class="explore-primary-text explore-muted">Full text not in local dataset.</div>';
    }
  } else if (_current.type === 'bible') {
    html += '<div class="explore-primary-num">' + utils.esc(_current.id) + '</div>';
    html += '<div class="explore-primary-text explore-muted">Tap to read full passage in the Bible sheet.</div>';
    html += '<button class="explore-open-btn" onclick="closeBible();openBible(\'' + utils.esc(_current.id).replace(/'/g, '\\\'') + '\')">Open in Bible</button>';
  }

  // Connection cards
  var connections = _generateConnections(_current.type, _current.id);
  connections.forEach(function(group) {
    html += '<div class="explore-group">';
    html += '<div class="explore-group-header">' + utils.esc(group.group) + '</div>';

    var maxVis = group.maxVisible || group.items.length;
    var visible = group.items.slice(0, maxVis);
    var hidden = group.items.slice(maxVis);

    visible.forEach(function(item) {
      html += _renderConnectionItem(item);
    });

    if (hidden.length) {
      html += '<details class="explore-overflow"><summary class="explore-overflow-btn">'
        + hidden.length + ' more</summary>';
      hidden.forEach(function(item) {
        html += _renderConnectionItem(item);
      });
      html += '</details>';
    }

    html += '</div>';
  });

  if (!connections.length) {
    html += '<div class="explore-empty">No connections found for this reference.</div>';
  }

  body.innerHTML = html;
  body.scrollTop = 0;
}

function _renderConnectionItem(item) {
  var onclick = '';
  if (item.type === 'ccc') {
    onclick = ' onclick="explorePivot(\'ccc\',\'' + utils.esc(item.ref) + '\')"';
  } else if (item.type === 'bible') {
    onclick = ' onclick="explorePivot(\'bible\',\'' + utils.esc(item.ref || item.label).replace(/'/g, '\\\'') + '\')"';
  }
  var cls = 'explore-item' + (onclick ? ' explore-item--tap' : '');
  var html = '<div class="' + cls + '"' + onclick + '>';
  html += '<div class="explore-item-label">' + utils.esc(item.label) + '</div>';
  if (item.context) {
    html += '<div class="explore-item-context">' + utils.esc(item.context) + '</div>';
  }
  if (item.detail) {
    html += '<div class="explore-item-detail">' + utils.esc(item.detail) + '</div>';
  }
  html += '</div>';
  return html;
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
      html += '<p>' + _mdItalic(utils.esc(line)) + '</p>';
    }
  }
  if (bq) html += '</blockquote>';
  return html;
}

function _mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

// ── Navigation ──
function openExplore(type, id) {
  _history = [];
  _current = { type: type, id: id };
  var overlay = document.getElementById('exploreOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('exploreBody').innerHTML = '<div class="explore-loading">Loading\u2026</div>';

  _loadAll().then(function() {
    _buildCCCVerseIndex();
    _render();
  });
}

function closeExplore() {
  document.getElementById('exploreOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function explorePivot(type, id) {
  if (_current) _history.push({ type: _current.type, id: _current.id });
  _current = { type: type, id: id };
  // Crossfade
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '1';
  }, 150);
}

function explorePop(targetIdx) {
  if (targetIdx < 0 || targetIdx >= _history.length) return;
  _current = _history[targetIdx];
  _history = _history.slice(0, targetIdx);
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '1';
  }, 150);
}

function exploreBack() {
  if (!_history.length) { closeExplore(); return; }
  _current = _history.pop();
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '1';
  }, 150);
}

// ── Topic browse ──
function exploreTopic(startNum, endNum) {
  var overlay = document.getElementById('exploreOverlay');
  if (!overlay.classList.contains('open')) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  _history = [];
  _current = null;
  document.getElementById('exploreBody').innerHTML = '<div class="explore-loading">Loading\u2026</div>';

  _loadAll().then(function() {
    var body = document.getElementById('exploreBody');
    var trail = document.getElementById('exploreTrail');
    var ctx = _getSectionContext(startNum);
    if (trail) trail.innerHTML = '<span class="explore-crumb explore-crumb--active">' + utils.esc(ctx || 'Browse') + '</span>';

    var html = '<div class="explore-context">' + utils.esc(ctx) + '</div>';
    html += '<div class="explore-topic-list">';
    for (var n = startNum; n <= endNum; n++) {
      var text = _cccParas && _cccParas[n];
      if (!text) continue;
      var preview = _getPreview(text);
      html += '<div class="explore-item explore-item--tap" onclick="explorePivot(\'ccc\',\'' + n + '\')">'
        + '<div class="explore-item-label">\u00A7' + n + '</div>'
        + '<div class="explore-item-detail">' + utils.esc(preview) + '</div>'
        + '</div>';
    }
    html += '</div>';
    body.innerHTML = html;
    body.scrollTop = 0;
  });
}

module.exports = {
  openExplore: openExplore,
  closeExplore: closeExplore,
  explorePivot: explorePivot,
  explorePop: explorePop,
  exploreBack: exploreBack,
  exploreTopic: exploreTopic,
  _TOPICS: _TOPICS
};
