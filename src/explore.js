// src/explore.js — CCC Explore module (OW-21)
// Deep cross-reference exploration: CCC <-> Baltimore <-> Scripture <-> Lectionary
var utils = require('./utils.js');
var cccData = require('./ccc-data.js');

// ── State ──
var _history = [];       // navigation stack: [{ type, id }]
var _current = null;     // { type: 'ccc'|'bible'|'summa', id: string }
var _cccParas = null;    // cached CCC paragraphs
var _cccXrefs = null;    // cached CCC xrefs
var _baltimore = null;   // cached Baltimore { byCCC }
var _bibleXrefs = null;  // cached bible-xrefs.json
var _lectionary = null;  // cached lectionary-index.json
var _cccVerseIndex = null; // reverse index: Bible ref -> [ccc par]
var _summaCache = null;   // cached summa-daily.json

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

  // Summa
  if (!_summaCache) {
    promises.push(fetch('/data/summa-daily.json')
      .then(function(r) { return r.json(); })
      .then(function(d) { _summaCache = d; })
      .catch(function() { _summaCache = null; })
    );
  }

  return Promise.all(promises);
}

// Build reverse index: which CCC paragraphs cite which Bible verses
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
          var label = dayKey.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          if (cycleName) label += ' (Year ' + cycleName + ')';
          if (results.length < 5) {
            results.push({ label: label, type: readingType.replace(/_/g, ' ') });
          }
        }
      });
    });
  }

  if (_lectionary.sundays) {
    Object.keys(_lectionary.sundays).forEach(function(cycle) {
      scanCycle(cycle, _lectionary.sundays[cycle]);
    });
  }
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

    // Scripture citations from paragraph text
    if (text) {
      var scriptureRefs = _extractScriptureRefs(text);
      if (scriptureRefs.length) {
        connections.push({
          group: 'Scripture',
          items: scriptureRefs.map(function(r) {
            return { type: 'bible', label: r, ref: r };
          })
        });
      }
    }

    // CCC cross-references
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
        connections.push({ group: 'Related', items: related });
      }
    }

    // Lectionary matches for cited verses
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
          group: 'At Mass',
          items: lectResults.map(function(lr) {
            return { type: 'info', label: lr.label, detail: lr.type };
          })
        });
      }
    }

    // Summa companion — topic match
    if (_summaCache && _summaCache.articles) {
      var sectionCtx = _getSectionContext(num);
      if (sectionCtx) {
        var topicWord = sectionCtx.toLowerCase().split(' ')[0];
        var summaHits = _summaCache.articles.filter(function(art) {
          return art.topic && art.topic.toLowerCase().indexOf(topicWord) >= 0;
        }).slice(0, 2);
        if (summaHits.length) {
          connections.push({
            group: 'Summa',
            items: summaHits.map(function(art) {
              return { type: 'summa', label: art.a, detail: art.q + ' \u00b7 ' + art.part, id: art.id };
            })
          });
        }
      }
    }
  }

  if (type === 'bible') {
    // Bible cross-references
    if (_bibleXrefs) {
      var xrefKey = _refToXrefKey(id);
      var bibleRefs = _bibleXrefs[xrefKey] || [];
      if (bibleRefs.length) {
        connections.push({
          group: 'Cross-References',
          items: bibleRefs.slice(0, 20).map(function(r) {
            return { type: 'bible', label: r, ref: r };
          })
        });
      }
    }

    // CCC paragraphs that cite this verse
    _buildCCCVerseIndex();
    if (_cccVerseIndex) {
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
        connections.push({ group: 'Catechism', items: cccNums });
      }
    }

    // Lectionary matches
    var lectMatches = _findInLectionary(id);
    if (lectMatches.length) {
      connections.push({
        group: 'At Mass',
        items: lectMatches.map(function(lr) {
          return { type: 'info', label: lr.label, detail: lr.type };
        })
      });
    }
  }

  return connections;
}

// Convert a human-readable ref like "John 3:16" to xref key format like "John:3:16"
function _refToXrefKey(ref) {
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

// ── BUG-01: Close Explore before opening external sheets ──
function _openBibleFromExplore(ref) {
  closeExplore();
  setTimeout(function() {
    if (window.openBible) window.openBible(ref);
  }, 100);
}

function _openCCCFromExplore(num) {
  closeExplore();
  setTimeout(function() {
    if (window.openCCC) window.openCCC(String(num));
  }, 100);
}

// ── REF-02: Connection tab switching ──
function _switchConnTab(idx) {
  var tabs = document.querySelectorAll('.explore-conn-tab');
  var panels = document.querySelectorAll('.explore-conn-panel');
  tabs.forEach(function(t, i) { t.classList.toggle('explore-conn-tab--active', i === idx); });
  panels.forEach(function(p, i) { p.style.display = i === idx ? '' : 'none'; });
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
      var label = h.type === 'ccc' ? '\u00A7' + h.id : h.type === 'summa' ? 'Summa' : h.id;
      trailHtml += '<span class="explore-crumb" onclick="explorePop(' + i + ')">' + utils.esc(label) + '</span>';
      trailHtml += '<span class="explore-crumb-sep">\u203A</span>';
    });
  }
  var curLabel = _current.type === 'ccc' ? '\u00A7' + _current.id
    : _current.type === 'summa' ? 'Summa'
    : _current.id;
  trailHtml += '<span class="explore-crumb explore-crumb--active">' + utils.esc(curLabel) + '</span>';
  if (trail) trail.innerHTML = trailHtml;

  // Primary content
  var html = '';

  if (_current.type === 'ccc') {
    var num = parseInt(_current.id, 10);
    var ctx = _getSectionContext(num);
    var text = _cccParas && _cccParas[num];

    // BT-03: Drop-cap heading
    html += '<div class="explore-heading">';
    html += '<div class="explore-primary-num">\u00A7' + num + '</div>';
    if (ctx) html += '<div class="explore-context">' + utils.esc(ctx) + '</div>';
    html += '</div>';

    if (text) {
      html += '<div class="explore-primary-text">' + _renderParaText(text) + '</div>';
    } else {
      html += '<div class="explore-primary-text explore-muted">Full text not in local dataset.</div>';
    }

    // EX-06: Baltimore companion inline
    if (_baltimore && _baltimore.byCCC && _baltimore.byCCC[String(num)]) {
      var qa = _baltimore.byCCC[String(num)];
      html += '<div class="explore-baltimore-inline">'
        + '<div class="explore-baltimore-label">Baltimore Catechism Q' + qa.id + '</div>'
        + '<div class="explore-baltimore-q">' + utils.esc(qa.question) + '</div>'
        + '<div class="explore-baltimore-a">' + utils.esc(qa.answer) + '</div>'
        + '</div>';
    }
  } else if (_current.type === 'bible') {
    html += '<div class="explore-primary-num">' + utils.esc(_current.id) + '</div>';
    html += '<div class="explore-primary-text explore-muted">Tap to read full passage in the Bible sheet.</div>';
    html += '<button class="explore-open-btn" onclick="_openBibleFromExplore(\'' + utils.esc(_current.id).replace(/'/g, '\\\'') + '\')">Open in Bible</button>';
  } else if (_current.type === 'summa') {
    // BUG-03: Summa detail view
    var summaArt = null;
    if (_summaCache && _summaCache.articles) {
      for (var si = 0; si < _summaCache.articles.length; si++) {
        if (_summaCache.articles[si].id === _current.id) { summaArt = _summaCache.articles[si]; break; }
      }
    }
    if (summaArt) {
      html += '<div class="explore-heading">';
      html += '<div class="explore-context">' + utils.esc(summaArt.topic) + '</div>';
      html += '</div>';
      html += '<div class="explore-summa-detail">';
      html += '<div class="summa-question">' + utils.esc(summaArt.q) + '</div>';
      html += '<div class="summa-article">' + utils.esc(summaArt.a) + '</div>';
      html += '<div class="summa-body">' + utils.esc(summaArt.body) + '</div>';
      html += '<div class="summa-cite">St. Thomas Aquinas \u00b7 ' + utils.esc(summaArt.part)
        + ' \u00b7 Q.' + utils.esc(summaArt.id.split('.')[1].replace('Q', ''))
        + ', A.' + utils.esc(summaArt.id.split('.')[2].replace('A', ''))
        + '</div>';
      html += '</div>';
    } else {
      html += '<div class="explore-empty">Article not found.</div>';
    }
  }

  // REF-02: Connection tabs instead of stacked groups
  var connections = _generateConnections(_current.type, _current.id);
  if (connections.length) {
    html += '<div class="explore-conn-tabs" id="exploreConnTabs">';
    html += '<div class="explore-conn-tab-bar">';
    connections.forEach(function(group, gi) {
      var activeClass = gi === 0 ? ' explore-conn-tab--active' : '';
      html += '<button class="explore-conn-tab' + activeClass + '" onclick="_switchConnTab(' + gi + ')">' + utils.esc(group.group) + '</button>';
    });
    html += '</div>';

    connections.forEach(function(group, gi) {
      var visClass = gi === 0 ? '' : ' style="display:none"';
      html += '<div class="explore-conn-panel" data-conn-idx="' + gi + '"' + visClass + '>';
      group.items.forEach(function(item) {
        html += _renderConnectionItem(item);
      });
      html += '</div>';
    });
    html += '</div>';
  }

  if (!connections.length && _current.type !== 'summa') {
    html += '<div class="explore-empty">No connections found for this reference.</div>';
  }

  body.innerHTML = html;
  body.scrollTop = 0;
  if (trail) {
    setTimeout(function() { trail.scrollLeft = trail.scrollWidth; }, 50);
  }
}

function _renderConnectionItem(item) {
  var onclick = '';
  if (item.type === 'ccc') {
    onclick = ' onclick="explorePivot(\'ccc\',\'' + utils.esc(item.ref) + '\')"';
  } else if (item.type === 'bible') {
    onclick = ' onclick="explorePivot(\'bible\',\'' + utils.esc(item.ref || item.label).replace(/'/g, '\\\'') + '\')"';
  } else if (item.type === 'summa' && item.id) {
    onclick = ' onclick="explorePivot(\'summa\',\'' + utils.esc(item.id) + '\')"';
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

// ── Loading phrases (EX-01) ──
var _loadingPhrases = [
  'Ask, and it shall be given you\u2026',
  'Be still, and know\u2026',
  'Come now, let us reason together\u2026',
  'The truth will set you free\u2026',
  'Seek and you will find\u2026',
  'Taste and see\u2026',
  'Deep calls to deep\u2026'
];

// ── Landing page renderer ──
function _renderLanding() {
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '';

  var html = '';

  // BT-07: Contemplative opener — today's Q&A
  var daysSinceEpoch = Math.floor(utils.getNow().getTime() / 86400000);
  if (_baltimore && _baltimore.questions && _baltimore.questions.length) {
    var todayQA = _baltimore.questions[daysSinceEpoch % _baltimore.questions.length];
    html += '<div class="explore-opener">'
      + '<div class="explore-opener-text">' + utils.esc(todayQA.question) + '</div>'
      + '<div class="explore-opener-answer">' + utils.esc(todayQA.answer) + '</div>'
      + (todayQA.ccc ? '<button class="explore-opener-link" onclick="explorePivot(\'ccc\',\'' + todayQA.ccc + '\')">Explore this teaching \u203A</button>' : '')
      + '</div>';
  }

  // Search bar
  html += '<div class="explore-search-wrap">'
    + '<div class="explore-search-bar">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + '<input id="exploreSearchInput" type="text" placeholder="Search the Catechism, Scripture, or a topic\u2026" oninput="_exploreSearch(this.value)">'
    + '</div>'
    + '<div id="exploreSearchResults" class="explore-search-results"></div>'
    + '</div>';

  // REF-01: Content sources — CCC collapsed, then 4 source cards
  html += '<div class="explore-section-label">Content</div>';
  html += '<div class="explore-source-grid">';

  // CCC as collapsible first card spanning full width
  html += '<details class="explore-source-card explore-source-card--ccc">'
    + '<summary class="explore-source-summary">'
    + '<div><div class="explore-source-title">Catechism (CCC)</div>'
    + '<div class="explore-source-sub">2,865 paragraphs \u00b7 20 sections</div></div>'
    + '</summary>'
    + '<div class="explore-ccc-sections">';
  _TOPICS.forEach(function(t) {
    html += '<button class="explore-ccc-section-btn" onclick="exploreTopic(' + t.start + ',' + t.end + ')">'
      + utils.esc(t.label) + '<span class="explore-ccc-range">\u00A7' + t.start + '\u2013' + t.end + '</span>'
      + '</button>';
  });
  html += '</div></details>';

  html += '<button class="explore-source-card" onclick="_exploreBibleLanding()">'
    + '<div class="explore-source-title">Sacred Scripture</div>'
    + '<div class="explore-source-sub">73 books \u00b7 DRB &amp; CPDV</div>'
    + '</button>';
  html += '<button class="explore-source-card" onclick="_exploreBaltLanding()">'
    + '<div class="explore-source-title">Baltimore Catechism</div>'
    + '<div class="explore-source-sub">220 questions &amp; answers</div>'
    + '</button>';
  html += '<button class="explore-source-card" onclick="_exploreSummaLanding()">'
    + '<div class="explore-source-title">Summa Theologica</div>'
    + '<div class="explore-source-sub">366 curated articles</div>'
    + '</button>';
  html += '<button class="explore-source-card" onclick="_exploreLectionaryLanding()">'
    + '<div class="explore-source-title">Lectionary</div>'
    + '<div class="explore-source-sub">Sunday &amp; feast readings</div>'
    + '</button>';
  html += '</div>';

  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Search (EX-02) ──
var _searchDebounce = null;

function _exploreSearch(query) {
  clearTimeout(_searchDebounce);
  var el = document.getElementById('exploreSearchResults');
  if (!el) return;
  var q = (query || '').trim().toLowerCase();
  if (q.length < 2) { el.innerHTML = ''; return; }

  _searchDebounce = setTimeout(function() {
    var results = [];

    // 1. CCC paragraph number direct match
    var numMatch = q.match(/^[\u00A7]?\s*(\d+)$/);
    if (numMatch) {
      var num = parseInt(numMatch[1], 10);
      if (_cccParas && _cccParas[num]) {
        results.push({ group: 'Catechism', items: [{ type: 'ccc', label: '\u00A7' + num, detail: _getPreview(_cccParas[num]), ref: String(num) }] });
      }
    }

    // 2. CCC text search
    if (_cccParas && !numMatch) {
      var cccHits = [];
      var words = q.split(/\s+/).filter(function(w) { return w.length >= 3; });
      if (words.length) {
        var paraKeys = Object.keys(_cccParas);
        for (var pi = 0; pi < paraKeys.length; pi++) {
          var pNum = paraKeys[pi];
          var pText = _cccParas[pNum].toLowerCase();
          if (words.every(function(w) { return pText.indexOf(w) >= 0; })) {
            cccHits.push({ type: 'ccc', label: '\u00A7' + pNum, detail: _getPreview(_cccParas[pNum]), context: _getSectionContext(pNum), ref: String(pNum) });
            if (cccHits.length >= 5) break;
          }
        }
      }
      if (cccHits.length) {
        results.push({ group: 'Catechism', items: cccHits.slice(0, 3), overflow: cccHits.length > 3 ? cccHits.length : 0 });
      }
    }

    // 3. Baltimore Q&A search
    if (_baltimore && _baltimore.questions) {
      var baltHits = [];
      _baltimore.questions.forEach(function(qa) {
        var combined = (qa.question + ' ' + qa.answer).toLowerCase();
        if (q.split(/\s+/).every(function(w) { return combined.indexOf(w) >= 0; })) {
          baltHits.push({ type: 'ccc', label: 'Q' + qa.id + '. ' + qa.question, detail: qa.answer, ref: qa.ccc ? String(qa.ccc) : null });
        }
      });
      if (baltHits.length) {
        results.push({ group: 'Baltimore Catechism', items: baltHits.slice(0, 3), overflow: baltHits.length > 3 ? baltHits.length : 0 });
      }
    }

    // 4. Summa topic search
    if (_summaCache && _summaCache.articles) {
      var summaHits = [];
      _summaCache.articles.forEach(function(art) {
        var combined = (art.topic + ' ' + art.q + ' ' + art.a).toLowerCase();
        if (q.split(/\s+/).every(function(w) { return combined.indexOf(w) >= 0; })) {
          summaHits.push({ type: 'summa', label: art.q, detail: art.a, id: art.id });
        }
      });
      if (summaHits.length) {
        results.push({ group: 'Summa Theologica', items: summaHits.slice(0, 3), overflow: summaHits.length > 3 ? summaHits.length : 0 });
      }
    }

    // Render results
    if (!results.length) {
      el.innerHTML = q.length >= 3 ? '<div class="explore-search-empty">No results for \u201c' + utils.esc(query) + '\u201d</div>' : '';
      return;
    }

    var html = '';
    results.forEach(function(group) {
      html += '<div class="explore-search-group">';
      html += '<div class="explore-search-group-label">' + utils.esc(group.group) + '</div>';
      group.items.forEach(function(item) {
        // BUG-04: Handle all item types in search results
        var onclick = '';
        if (item.type === 'ccc' && item.ref) {
          onclick = ' onclick="explorePivot(\'ccc\',\'' + utils.esc(item.ref) + '\')"';
        } else if (item.type === 'summa' && item.id) {
          onclick = ' onclick="explorePivot(\'summa\',\'' + utils.esc(item.id) + '\')"';
        } else if (item.type === 'bible' && (item.ref || item.label)) {
          onclick = ' onclick="explorePivot(\'bible\',\'' + utils.esc(item.ref || item.label).replace(/'/g, '\\\'') + '\')"';
        }
        html += '<div class="explore-item explore-item--tap"' + onclick + '>';
        html += '<div class="explore-item-label">' + utils.esc(item.label) + '</div>';
        if (item.context) html += '<div class="explore-item-context">' + utils.esc(item.context) + '</div>';
        if (item.detail) html += '<div class="explore-item-detail">' + utils.esc(item.detail) + '</div>';
        html += '</div>';
      });
      if (group.overflow) {
        html += '<div class="explore-search-more">' + group.overflow + ' total results</div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }, 200);
}

// ── REF-05: Bible genre grouping ──
var _OT_GENRES = [
  { label: 'Pentateuch', ids: ['genesis','exodus','leviticus','numbers','deuteronomy'] },
  { label: 'Historical', ids: ['joshua','judges','ruth','1samuel','2samuel','1kings','2kings','1chronicles','2chronicles','ezra','nehemiah','tobit','judith','esther','1maccabees','2maccabees'] },
  { label: 'Wisdom', ids: ['job','psalms','proverbs','ecclesiastes','songofsolomon','wisdom','sirach'] },
  { label: 'Prophets', ids: ['isaiah','jeremiah','lamentations','baruch','ezekiel','daniel','hosea','joel','amos','obadiah','jonah','micah','nahum','habakkuk','zephaniah','haggai','zechariah','malachi'] }
];
var _NT_GENRES = [
  { label: 'Gospels', ids: ['matthew','mark','luke','john'] },
  { label: 'Acts & Letters', ids: ['acts','romans','1corinthians','2corinthians','galatians','ephesians','philippians','colossians','1thessalonians','2thessalonians','1timothy','2timothy','titus','philemon','hebrews'] },
  { label: 'Catholic Epistles', ids: ['james','1peter','2peter','1john','2john','3john','jude'] },
  { label: 'Revelation', ids: ['revelation'] }
];

function _renderGenreGroups(groups, bookList) {
  var html = '';
  groups.forEach(function(genre) {
    var books = bookList.filter(function(b) { return genre.ids.indexOf(b.id) >= 0; });
    if (!books.length) return;
    html += '<div class="explore-bible-genre-label">' + utils.esc(genre.label) + '</div>';
    html += '<div class="explore-bible-books">';
    books.forEach(function(b) {
      html += '<button class="explore-bible-book" onclick="_openBibleFromExplore(\'' + utils.esc(b.name) + ' 1:1\')">'
        + '<span class="explore-bible-book-name">' + utils.esc(b.name) + '</span>'
        + '</button>';
    });
    html += '</div>';
  });
  return html;
}

// ── Bible landing (EX-03 + REF-05) ──
function _exploreBibleLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Sacred Scripture</span>';

  fetch('/data/bible-drb/_index.json').then(function(r) { return r.json(); }).then(function(index) {
    var bookList = index.books || [];

    var html = '<div class="explore-section-label">Old Testament</div>';
    html += _renderGenreGroups(_OT_GENRES, bookList);

    html += '<div class="explore-section-label">New Testament</div>';
    html += _renderGenreGroups(_NT_GENRES, bookList);

    body.innerHTML = html;
    body.scrollTop = 0;
  }).catch(function() {
    body.innerHTML = '<div class="explore-empty">Could not load Bible index.</div>';
  });
}

// ── REF-03: Baltimore helpers ──
function _renderBaltimoreRow(qa) {
  var onclick = qa.ccc ? ' onclick="explorePivot(\'ccc\',\'' + qa.ccc + '\')"' : '';
  var cls = qa.ccc ? ' explore-item--tap' : '';
  return '<div class="explore-item' + cls + '"' + onclick + '>'
    + '<div class="explore-item-label">Q' + qa.id + '. ' + utils.esc(qa.question) + '</div>'
    + '<div class="explore-item-detail">' + utils.esc(qa.answer) + '</div>'
    + '</div>';
}

function _showAllBaltimore() {
  if (!_baltimore) return;
  var el = document.getElementById('baltimoreList');
  if (!el) return;
  var html = '';
  _baltimore.questions.forEach(function(qa) { html += _renderBaltimoreRow(qa); });
  el.innerHTML = html;
}

function _filterBaltimore(query) {
  if (!_baltimore) return;
  var el = document.getElementById('baltimoreList');
  if (!el) return;
  var q = (query || '').trim().toLowerCase();
  if (q.length < 2) {
    _showAllBaltimore();
    return;
  }
  var hits = _baltimore.questions.filter(function(qa) {
    return (qa.question + ' ' + qa.answer).toLowerCase().indexOf(q) >= 0;
  });
  el.innerHTML = hits.length
    ? hits.map(_renderBaltimoreRow).join('')
    : '<div class="explore-empty">No questions match \u201c' + utils.esc(query) + '\u201d</div>';
}

// ── Baltimore landing (EX-04 + REF-03) ──
function _exploreBaltLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Baltimore Catechism</span>';

  if (!_baltimore || !_baltimore.questions) {
    body.innerHTML = '<div class="explore-loading">Loading\u2026</div>';
    cccData.loadBaltimore().then(function(b) {
      if (b) { _baltimore = b; _exploreBaltLanding(); }
      else { body.innerHTML = '<div class="explore-empty">Could not load Baltimore Catechism.</div>'; }
    });
    return;
  }

  var html = '';

  // Search within Baltimore
  html += '<div class="explore-search-wrap">'
    + '<div class="explore-search-bar">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + '<input type="text" placeholder="Search questions\u2026" oninput="_filterBaltimore(this.value)">'
    + '</div></div>';

  html += '<div id="baltimoreList">';
  // Show first 15
  _baltimore.questions.slice(0, 15).forEach(function(qa) {
    html += _renderBaltimoreRow(qa);
  });
  if (_baltimore.questions.length > 15) {
    html += '<button class="explore-show-all-btn" onclick="_showAllBaltimore()">Show all ' + _baltimore.questions.length + ' questions</button>';
  }
  html += '</div>';

  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Summa landing (EX-12 + REF-04) ──
function _exploreSummaLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Summa Theologica</span>';

  if (!_summaCache) {
    body.innerHTML = '<div class="explore-loading">Loading\u2026</div>';
    fetch('/data/summa-daily.json').then(function(r) { return r.json(); }).then(function(d) {
      _summaCache = d;
      _exploreSummaLanding();
    });
    return;
  }

  var topics = {};
  var topicOrder = [];
  _summaCache.articles.forEach(function(art) {
    var t = art.topic || 'Other';
    if (!topics[t]) { topics[t] = []; topicOrder.push(t); }
    topics[t].push(art);
  });

  var html = '';
  topicOrder.forEach(function(topic) {
    html += '<details class="explore-summa-topic">'
      + '<summary class="explore-summa-topic-header">' + utils.esc(topic)
      + '<span class="explore-summa-topic-count">' + topics[topic].length + '</span>'
      + '<svg class="explore-summa-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>'
      + '</summary>'
      + '<div class="explore-summa-topic-body">';
    // BUG-02: Make Summa items clickable
    topics[topic].forEach(function(art) {
      html += '<div class="explore-item explore-item--tap" onclick="explorePivot(\'summa\',\'' + utils.esc(art.id) + '\')">'
        + '<div class="explore-item-label">' + utils.esc(art.a) + '</div>'
        + '<div class="explore-item-context">' + utils.esc(art.q) + ' \u00b7 ' + utils.esc(art.part) + '</div>'
        + '</div>';
    });
    html += '</div></details>';
  });

  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Lectionary landing (EX-13 + BUG-05) ──
function _exploreLectionaryLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('exploreBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Lectionary</span>';

  if (!_lectionary) {
    body.innerHTML = '<div class="explore-empty">Could not load lectionary data.</div>';
    return;
  }

  var yearChar = String.fromCharCode(65 + (utils.getNow().getFullYear() % 3));
  var html = '<div class="explore-section-label">Sunday Readings \u00b7 Year ' + yearChar + '</div>';

  var seasonLabels = {
    'advent': 'Advent', 'christmas': 'Christmas', 'lent': 'Lent',
    'easter': 'Easter', 'ordinary': 'Ordinary Time',
    'holy': 'Holy Week', 'pentecost': 'Pentecost'
  };
  var readingOrder = ['first_reading', 'psalm', 'second_reading', 'gospel'];
  var readingLabels = { first_reading: 'First Reading', psalm: 'Responsorial Psalm', second_reading: 'Second Reading', gospel: 'Gospel' };

  if (_lectionary.sundays && _lectionary.sundays[yearChar]) {
    var days = Object.keys(_lectionary.sundays[yearChar]);

    // Group by season prefix
    var seasons = {};
    var seasonOrder = [];
    days.forEach(function(dayKey) {
      var prefix = dayKey.split('_')[0];
      if (!seasons[prefix]) { seasons[prefix] = []; seasonOrder.push(prefix); }
      seasons[prefix].push(dayKey);
    });

    seasonOrder.forEach(function(prefix) {
      var label = seasonLabels[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
      html += '<div class="explore-lect-season">';
      html += '<div class="explore-lect-season-label">' + utils.esc(label) + '</div>';

      seasons[prefix].forEach(function(dayKey) {
        var readings = _lectionary.sundays[yearChar][dayKey];
        var dayLabel = dayKey.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        // Strip season prefix for cleaner label
        var shortLabel = dayLabel;
        Object.keys(seasonLabels).forEach(function(p) {
          shortLabel = shortLabel.replace(new RegExp('^' + seasonLabels[p] + '\\s*', 'i'), '');
        });
        if (!shortLabel || shortLabel === dayLabel) shortLabel = dayLabel;

        html += '<details class="explore-lect-day">'
          + '<summary class="explore-lect-day-header">' + utils.esc(shortLabel || dayLabel) + '</summary>'
          + '<div class="explore-lect-day-body">';

        readingOrder.forEach(function(type) {
          var ref = readings[type];
          if (!ref) return;
          var typeLabel = readingLabels[type] || type.replace(/_/g, ' ');
          html += '<div class="explore-lect-reading" onclick="_openBibleFromExplore(\'' + utils.esc(ref).replace(/'/g, '\\\'') + '\')">'
            + '<span class="explore-lect-type">' + utils.esc(typeLabel) + '</span>'
            + '<span class="explore-lect-ref">' + utils.esc(ref) + '</span>'
            + '</div>';
        });

        html += '</div></details>';
      });
      html += '</div>';
    });
  }

  // Feasts section
  if (_lectionary.feasts) {
    html += '<div class="explore-section-label">Feasts &amp; Solemnities</div>';
    Object.keys(_lectionary.feasts).forEach(function(feastKey) {
      var readings = _lectionary.feasts[feastKey];
      var feastLabel = feastKey.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });

      html += '<details class="explore-lect-day">'
        + '<summary class="explore-lect-day-header">' + utils.esc(feastLabel) + '</summary>'
        + '<div class="explore-lect-day-body">';

      readingOrder.forEach(function(type) {
        var ref = readings[type];
        if (!ref) return;
        var typeLabel = readingLabels[type] || type;
        html += '<div class="explore-lect-reading" onclick="_openBibleFromExplore(\'' + utils.esc(ref).replace(/'/g, '\\\'') + '\')">'
          + '<span class="explore-lect-type">' + utils.esc(typeLabel) + '</span>'
          + '<span class="explore-lect-ref">' + utils.esc(ref) + '</span>'
          + '</div>';
      });

      html += '</div></details>';
    });
  }

  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Navigation ──
function openExplore(type, id) {
  var overlay = document.getElementById('exploreOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  var loadPhrase = _loadingPhrases[Math.floor(utils.getNow().getTime() / 86400000) % _loadingPhrases.length];
  document.getElementById('exploreBody').innerHTML = '<div class="explore-loading">' + utils.esc(loadPhrase) + '</div>';

  _loadAll().then(function() {
    _buildCCCVerseIndex();
    if (type === 'landing' || (type === 'ccc' && id === '1' && !_history.length)) {
      _current = null;
      _history = [];
      _renderLanding();
    } else {
      _history = [];
      _current = { type: type, id: id };
      _render();
    }
  });
}

function closeExplore() {
  document.getElementById('exploreOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Home (EX-05) ──
function exploreHome() {
  _history = [];
  _current = null;
  _renderLanding();
}

function explorePivot(type, id) {
  if (_current) _history.push({ type: _current.type, id: _current.id });
  _current = { type: type, id: id };
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '';
    body.className = 'explore-body explore-body--entering';
    setTimeout(function() { body.className = 'explore-body'; }, 300);
  }, 120);
}

function explorePop(targetIdx) {
  if (targetIdx < 0 || targetIdx >= _history.length) return;
  _current = _history[targetIdx];
  _history = _history.slice(0, targetIdx);
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '';
    body.className = 'explore-body explore-body--returning';
    setTimeout(function() { body.className = 'explore-body'; }, 250);
  }, 120);
}

function exploreBack() {
  if (!_history.length) {
    if (_current) {
      _current = null;
      _renderLanding();
      return;
    }
    closeExplore();
    return;
  }
  _current = _history.pop();
  var body = document.getElementById('exploreBody');
  body.style.opacity = '0';
  setTimeout(function() {
    _render();
    body.style.opacity = '';
    body.className = 'explore-body explore-body--returning';
    setTimeout(function() { body.className = 'explore-body'; }, 250);
  }, 120);
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
    if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">' + utils.esc(ctx || 'Browse') + '</span>';

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

// ── Window bindings for onclick handlers ──
window._exploreSearch = _exploreSearch;
window._exploreBibleLanding = _exploreBibleLanding;
window._exploreBaltLanding = _exploreBaltLanding;
window._exploreSummaLanding = _exploreSummaLanding;
window._exploreLectionaryLanding = _exploreLectionaryLanding;
window._renderLanding = _renderLanding;
window.exploreHome = exploreHome;
window._openBibleFromExplore = _openBibleFromExplore;
window._openCCCFromExplore = _openCCCFromExplore;
window._switchConnTab = _switchConnTab;
window._filterBaltimore = _filterBaltimore;
window._showAllBaltimore = _showAllBaltimore;

module.exports = {
  openExplore: openExplore,
  closeExplore: closeExplore,
  explorePivot: explorePivot,
  explorePop: explorePop,
  exploreBack: exploreBack,
  exploreTopic: exploreTopic,
  exploreHome: exploreHome,
  _TOPICS: _TOPICS
};
