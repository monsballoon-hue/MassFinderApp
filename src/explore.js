// src/explore.js — CCC Explore module (OW-21)
// Deep cross-reference exploration: CCC <-> Baltimore <-> Scripture <-> Lectionary
// Data loading delegated to graph.js; search delegated to search.js.
var utils = require('./utils.js');
var reader = require('./reader.js');
var graph = require('./graph.js');
var search = require('./search.js');

// ── State ──
var _history = [];       // navigation stack: [{ type, id }]
var _current = null;     // { type: 'ccc'|'bible'|'summa', id: string }
// Local aliases — assigned from graph after ensure(), used by landing pages
var _cccParas = null;
var _baltimore = null;
var _summaCache = null;
var _lectionary = null;
var _cccHierarchy = null;

// ── Reader module registration ──
reader.registerModule('explore', {
  getTitle: function() { return 'Explore'; },
  getHeaderExtra: function() {
    // Origin anchor in reader.js replaces the old breadcrumb trail
    return '';
  },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    var loadPhrase = _loadingPhrases[Math.floor(utils.getNow().getTime() / 86400000) % _loadingPhrases.length];
    bodyEl.innerHTML = '<div class="explore-loading">' + utils.esc(loadPhrase) + '</div>';

    graph.ensure(['ccc', 'footnotes', 'bibleXrefs', 'hierarchy', 'baltimore', 'lectionary', 'summa']).then(function() {
      // Assign local aliases for landing page compatibility
      _cccParas = graph.getCCCParagraphs();
      _cccHierarchy = graph.getCCCHierarchy();
      _baltimore = graph.getBaltimore();
      _summaCache = graph.getSumma();
      _lectionary = graph.getLectionary();

      var type = params.type;
      var id = params.id;
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
  },
  onClose: function() {
    // Reset state on close
    _history = [];
    _current = null;
  }
});

// Data loading delegated to graph.js (shared singleton)
// Reverse indexes (bibleToCCC, bibleToLect, etc.) built lazily by graph.js

// ── Connection generation (via graph.js shared indexes) ──
function _generateConnections(type, id) {
  var connections = [];

  if (type === 'ccc') {
    var gCCC = graph.forCCC(parseInt(id, 10));

    // Scripture citations (from authoritative footnotes via graph)
    if (gCCC.bible.length) {
      connections.push({
        group: 'Scripture',
        items: gCCC.bible.map(function(ref) {
          return { type: 'bible', label: ref, ref: ref };
        })
      });
    }

    // CCC cross-references
    if (gCCC.ccc.length) {
      var seen = {};
      seen[parseInt(id, 10)] = true;
      var related = gCCC.ccc.filter(function(rid) {
        if (seen[rid]) return false;
        seen[rid] = true;
        return true;
      }).map(function(rid) {
        var rtext = graph.getCCCParagraph(rid);
        return {
          type: 'ccc', label: '\u00A7' + rid,
          detail: rtext ? _getPreview(rtext) : '',
          context: _getHierarchyPath(rid),
          ref: String(rid)
        };
      });
      if (related.length) {
        connections.push({ group: 'Related', items: related });
      }
    }

    // Baltimore companion
    if (gCCC.baltimore.length) {
      var balt = graph.getBaltimore();
      if (balt && balt.questions) {
        var baltItems = [];
        gCCC.baltimore.forEach(function(qId) {
          for (var i = 0; i < balt.questions.length; i++) {
            if (balt.questions[i].id === qId) {
              var qa = balt.questions[i];
              baltItems.push({ type: 'baltimore', label: 'Q' + qa.id + '. ' + qa.question, detail: qa.answer, ref: String(qa.id) });
              break;
            }
          }
        });
        if (baltItems.length) {
          connections.push({ group: 'Baltimore Catechism', items: baltItems });
        }
      }
    }

    // Summa companion (multi-keyword topic matching via graph)
    if (gCCC.summa.length) {
      var summa = graph.getSumma();
      if (summa && summa.articles) {
        var summaItems = [];
        gCCC.summa.forEach(function(artId) {
          for (var i = 0; i < summa.articles.length; i++) {
            if (summa.articles[i].id === artId) {
              var art = summa.articles[i];
              summaItems.push({ type: 'summa', label: art.a, detail: art.q + ' \u00b7 ' + art.part, id: art.id });
              break;
            }
          }
        });
        if (summaItems.length) {
          connections.push({ group: 'Summa', items: summaItems });
        }
      }
    }

    // Lectionary — check each cited scripture ref
    var lectSeen = {};
    var lectResults = [];
    gCCC.bible.slice(0, 5).forEach(function(ref) {
      var bResult = graph.forBible(ref);
      (bResult.lectionary || []).forEach(function(lr) {
        var key = lr.day + (lr.cycle || '');
        if (!lectSeen[key]) {
          lectSeen[key] = true;
          var label = lr.day.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          if (lr.cycle) label += ' (Year ' + lr.cycle + ')';
          lectResults.push({ type: 'info', label: label, detail: lr.type ? lr.type.replace(/_/g, ' ') : '' });
        }
      });
    });
    if (lectResults.length) {
      connections.push({ group: 'When You\u2019ll Hear This at Mass', items: lectResults.slice(0, 5) });
    }
  }

  if (type === 'bible') {
    var gBible = graph.forBible(id);

    // Bible cross-references
    if (gBible.bible.length) {
      connections.push({
        group: 'Cross-References',
        items: gBible.bible.slice(0, 20).map(function(r) {
          var refStr = Array.isArray(r) ? r[0] : r;
          return { type: 'bible', label: refStr, ref: refStr };
        })
      });
    }

    // CCC paragraphs citing this verse (from footnote reverse index)
    if (gBible.ccc.length) {
      connections.push({
        group: 'Catechism',
        items: gBible.ccc.map(function(num) {
          var text = graph.getCCCParagraph(num);
          return {
            type: 'ccc', label: '\u00A7' + num,
            detail: text ? _getPreview(text) : '',
            context: _getHierarchyPath(num),
            ref: String(num)
          };
        })
      });
    }

    // Lectionary matches
    if (gBible.lectionary.length) {
      connections.push({
        group: 'When You\u2019ll Hear This at Mass',
        items: gBible.lectionary.slice(0, 5).map(function(lr) {
          var label = lr.day.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          if (lr.cycle) label += ' (Year ' + lr.cycle + ')';
          return { type: 'info', label: label, detail: lr.type ? lr.type.replace(/_/g, ' ') : '' };
        })
      });
    }
  }

  return connections;
}

// ── P2-03: Prev/Next navigation ──
function _getCCCPrev(id) {
  var num = parseInt(id, 10);
  for (var i = num - 1; i >= 1; i--) {
    if (_cccParas && _cccParas[i]) return String(i);
  }
  return null;
}

function _getCCCNext(id) {
  var num = parseInt(id, 10);
  for (var i = num + 1; i <= 2865; i++) {
    if (_cccParas && _cccParas[i]) return String(i);
  }
  return null;
}

function _getSummaPrev(id) {
  if (!_summaCache || !_summaCache.articles) return null;
  for (var i = 0; i < _summaCache.articles.length; i++) {
    if (_summaCache.articles[i].id === id) {
      return i > 0 ? _summaCache.articles[i - 1].id : null;
    }
  }
  return null;
}

function _getSummaNext(id) {
  if (!_summaCache || !_summaCache.articles) return null;
  for (var i = 0; i < _summaCache.articles.length; i++) {
    if (_summaCache.articles[i].id === id) {
      return i < _summaCache.articles.length - 1 ? _summaCache.articles[i + 1].id : null;
    }
  }
  return null;
}

function _renderPageNav(sourceType, currentId) {
  var prev = null;
  var next = null;
  var posLabel = '';

  if (sourceType === 'ccc') {
    prev = _getCCCPrev(currentId);
    next = _getCCCNext(currentId);
    posLabel = '\u00A7' + currentId + ' of 2,865';
  } else if (sourceType === 'summa') {
    prev = _getSummaPrev(currentId);
    next = _getSummaNext(currentId);
    posLabel = currentId;
  }

  if (!prev && !next) return '';

  var html = '<div class="explore-page-nav">';
  if (prev) {
    html += '<button class="explore-nav-btn" onclick="explorePivot(\'' + sourceType + '\',\'' + utils.esc(prev) + '\')">\u2190</button>';
  } else {
    html += '<div class="explore-nav-spacer"></div>';
  }
  html += '<span class="explore-nav-pos">' + utils.esc(posLabel) + '</span>';
  if (next) {
    html += '<button class="explore-nav-btn" onclick="explorePivot(\'' + sourceType + '\',\'' + utils.esc(next) + '\')">\u2192</button>';
  } else {
    html += '<div class="explore-nav-spacer"></div>';
  }
  html += '</div>';
  return html;
}

// ── Hierarchy breadcrumb path for CCC paragraphs ──
function _getHierarchyPath(num) {
  if (!_cccHierarchy || !_cccHierarchy.lookup || !_cccHierarchy.hierarchy) return '';
  var idx = _cccHierarchy.lookup[num];
  if (!idx) return '';
  var h = _cccHierarchy.hierarchy;
  var parts = [];
  if (idx[0] >= 0 && h[idx[0]]) parts.push(h[idx[0]].title);
  if (idx[1] >= 0 && h[idx[0]] && h[idx[0]].sections[idx[1]]) parts.push(h[idx[0]].sections[idx[1]].title);
  if (idx[2] >= 0 && h[idx[0]] && h[idx[0]].sections[idx[1]] && h[idx[0]].sections[idx[1]].chapters[idx[2]]) {
    parts.push(h[idx[0]].sections[idx[1]].chapters[idx[2]].title);
  }
  return parts.join(' \u203A ');
}

function _getPreview(raw) {
  var clean = utils.stripCCCRefs(raw).replace(/>/g, '').replace(/\*/g, '').trim();
  var m = clean.match(/^(.{10,120}[.!?]["\u201d]?)(\s|$)/);
  var preview = m ? m[1].trim() : clean.slice(0, 100).trim();
  if (preview.length < clean.length) preview += '\u2026';
  return preview;
}

// ── Open Bible/CCC from Explore — uses reader stack ──
function _openBibleFromExplore(ref) {
  reader.readerOpen('bible', { ref: ref });
}

function _openCCCFromExplore(num) {
  reader.readerOpen('ccc', { num: String(num) });
}

// ── Connection tab switching ──
function _switchConnTab(idx) {
  var container = document.getElementById('exploreConnTabs');
  if (!container) return;
  var tabs = container.querySelectorAll('.explore-conn-tab');
  var panels = container.querySelectorAll('.explore-conn-panel');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle('explore-conn-tab--active', i === idx);
  }
  for (var j = 0; j < panels.length; j++) {
    panels[j].style.display = j === idx ? '' : 'none';
  }
}

// Breadcrumb trail removed — origin anchor in reader.js provides navigation context

// ── Rendering ──
function _render() {
  var body = document.getElementById('readerBody');
  if (!body || !_current) return;

  // Origin anchor updated by reader.js automatically

  // Primary content
  var html = '';

  if (_current.type === 'ccc') {
    var num = parseInt(_current.id, 10);
    var ctx = _getHierarchyPath(num);
    var text = _cccParas && _cccParas[num];

    html += '<div class="explore-heading">';
    html += '<div class="explore-primary-num">\u00A7' + num + '</div>';
    if (ctx) html += '<div class="explore-context">' + utils.esc(ctx) + '</div>';
    html += '</div>';

    if (text) {
      var preview = _getPreview(text);
      html += '<div class="explore-primary-text explore-muted">' + utils.esc(preview) + '</div>';
    } else {
      html += '<div class="explore-primary-text explore-muted">Full text not in local dataset.</div>';
    }

    html += '<button class="explore-open-btn" onclick="_openCCCFromExplore(' + num + ')">Read in Catechism</button>';
  } else if (_current.type === 'bible') {
    html += '<div class="explore-primary-num">' + utils.esc(_current.id) + '</div>';
    html += '<div class="explore-primary-text explore-muted">Tap to read full passage in the Bible reader.</div>';
    html += '<button class="explore-open-btn" onclick="_openBibleFromExplore(\'' + utils.esc(_current.id).replace(/'/g, '\\\'') + '\')">Open in Bible</button>';
  } else if (_current.type === 'summa') {
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
  } else if (_current.type === 'baltimore') {
    var bqa = null;
    var bqIdx = -1;
    if (_baltimore && _baltimore.questions) {
      for (var bi = 0; bi < _baltimore.questions.length; bi++) {
        if (String(_baltimore.questions[bi].id) === String(_current.id)) {
          bqa = _baltimore.questions[bi];
          bqIdx = bi;
          break;
        }
      }
    }
    if (bqa) {
      html += '<div class="explore-heading">';
      html += '<div class="explore-primary-num">Q' + bqa.id + '</div>';
      html += '</div>';
      html += '<div class="explore-baltimore-detail">';
      html += '<div class="explore-baltimore-q">Q. ' + utils.esc(bqa.question) + '</div>';
      html += '<div class="explore-baltimore-a">A. ' + utils.esc(bqa.answer) + '</div>';
      html += '</div>';
      if (bqa.ccc) {
        html += '<button class="explore-open-btn" onclick="_openCCCFromExplore(' + bqa.ccc + ')">Read \u00A7' + bqa.ccc + ' in Catechism</button>';
      }
      var bqPrev = bqIdx > 0 ? _baltimore.questions[bqIdx - 1] : null;
      var bqNext = bqIdx < _baltimore.questions.length - 1 ? _baltimore.questions[bqIdx + 1] : null;
      if (bqPrev || bqNext) {
        html += '<div class="explore-page-nav">';
        if (bqPrev) {
          html += '<button class="explore-nav-btn" onclick="explorePivot(\'baltimore\',\'' + bqPrev.id + '\')">\u2190 Q' + bqPrev.id + '</button>';
        } else {
          html += '<div class="explore-nav-spacer"></div>';
        }
        html += '<span class="explore-nav-pos">Q' + bqa.id + ' of ' + _baltimore.questions.length + '</span>';
        if (bqNext) {
          html += '<button class="explore-nav-btn" onclick="explorePivot(\'baltimore\',\'' + bqNext.id + '\')">Q' + bqNext.id + ' \u2192</button>';
        } else {
          html += '<div class="explore-nav-spacer"></div>';
        }
        html += '</div>';
      }
    } else {
      html += '<div class="explore-empty">Question not found.</div>';
    }
  }

  // Connection tabs with counts and overflow
  var connections = _generateConnections(_current.type, _current.id);
  if (connections.length) {
    html += '<div class="explore-conn" id="exploreConnTabs">';
    html += '<div class="explore-conn-tabs">';
    connections.forEach(function(group, gi) {
      var activeClass = gi === 0 ? ' explore-conn-tab--active' : '';
      html += '<button class="explore-conn-tab' + activeClass + '" onclick="_switchConnTab(' + gi + ')">'
        + utils.esc(group.group)
        + '<span class="explore-conn-tab-count">' + group.items.length + '</span>'
        + '</button>';
    });
    html += '</div>';

    connections.forEach(function(group, gi) {
      var visClass = gi === 0 ? '' : ' style="display:none"';
      html += '<div class="explore-conn-panel" data-conn-idx="' + gi + '"' + visClass + '>';
      var showCount = Math.min(5, group.items.length);
      for (var ci = 0; ci < showCount; ci++) {
        html += _renderConnectionItem(group.items[ci]);
      }
      if (group.items.length > showCount) {
        html += '<details class="explore-conn-overflow"><summary class="explore-conn-overflow-btn">'
          + (group.items.length - showCount) + ' more</summary>';
        for (var oi = showCount; oi < group.items.length; oi++) {
          html += _renderConnectionItem(group.items[oi]);
        }
        html += '</details>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  if (!connections.length && _current.type !== 'summa' && _current.type !== 'baltimore') {
    html += '<div class="explore-empty">No connections found for this reference.</div>';
  }

  // Prev/Next navigation footer
  if (_current.type === 'ccc' || _current.type === 'summa') {
    html += _renderPageNav(_current.type, _current.id);
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
  var body = document.getElementById('readerBody');
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

  // Five source cards in clean grid
  html += '<div class="explore-section-label">Content</div>';
  html += '<div class="explore-source-grid">';

  html += '<button class="explore-source-card" onclick="_exploreCCCLanding()">'
    + '<div class="explore-source-title">Catechism (CCC)</div>'
    + '<div class="explore-source-sub">2,865 paragraphs</div>'
    + '</button>';
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

// ── Search (EX-02 — unified via search.js) ──
var _searchDebounce = null;

function _exploreSearch(query) {
  clearTimeout(_searchDebounce);
  var el = document.getElementById('exploreSearchResults');
  if (!el) return;
  var q = (query || '').trim();
  if (q.length < 2) { el.innerHTML = ''; return; }

  _searchDebounce = setTimeout(function() {
    var sr = search.query(q, { maxPerGroup: 5 });

    if (!sr.groups.length) {
      el.innerHTML = q.length >= 3 ? '<div class="explore-search-empty">No results for \u201c' + utils.esc(query) + '\u201d</div>' : '';
      return;
    }

    var html = '';
    sr.groups.forEach(function(group) {
      html += '<div class="explore-search-group">';
      html += '<div class="explore-search-group-label">' + utils.esc(group.label) + '</div>';
      group.items.forEach(function(item) {
        var onclick = '';
        if (item.type === 'ccc' && item.ref) {
          onclick = ' onclick="explorePivot(\'ccc\',\'' + utils.esc(item.ref) + '\')"';
        } else if (item.type === 'baltimore' && item.ref) {
          onclick = ' onclick="explorePivot(\'baltimore\',\'' + utils.esc(item.ref) + '\')"';
        } else if (item.type === 'summa' && item.ref) {
          onclick = ' onclick="explorePivot(\'summa\',\'' + utils.esc(item.ref) + '\')"';
        } else if (item.type === 'bible' && item.ref) {
          onclick = ' onclick="explorePivot(\'bible\',\'' + utils.esc(item.ref).replace(/'/g, '\\\'') + '\')"';
        }
        html += '<div class="explore-item explore-item--tap"' + onclick + '>';
        html += '<div class="explore-item-label">' + utils.esc(item.label) + '</div>';
        if (item.context) html += '<div class="explore-item-context">' + utils.esc(item.context) + '</div>';
        if (item.preview) html += '<div class="explore-item-detail">' + utils.esc(item.preview) + '</div>';
        html += '</div>';
      });
      if (group.items.length >= 5) {
        html += '<div class="explore-search-more">' + group.items.length + '+ results</div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }, 200);
}

// ── CCC Hierarchy TOC ──
function _exploreCCCLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('readerBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Catechism (CCC)</span>';

  if (_cccHierarchy && _cccHierarchy.hierarchy) {
    var html = '';
    _cccHierarchy.hierarchy.forEach(function(part, pi) {
      html += '<details class="explore-hier-part"' + (pi === 0 ? ' open' : '') + '>'
        + '<summary class="explore-hier-part-header">'
        + '<span class="explore-hier-part-title">' + utils.esc(part.title) + '</span>'
        + '<span class="explore-hier-range">\u00A7' + part.range[0] + '\u2013' + part.range[1] + '</span>'
        + '</summary>';

      part.sections.forEach(function(section) {
        if (section.chapters.length === 0) {
          html += '<div class="explore-item explore-item--tap" onclick="exploreTopic(' + section.range[0] + ',' + section.range[1] + ')">'
            + '<div class="explore-item-label">' + utils.esc(section.title) + '</div>'
            + '<div class="explore-item-context">\u00A7' + section.range[0] + '\u2013' + section.range[1] + '</div>'
            + '</div>';
        } else {
          html += '<details class="explore-hier-section">'
            + '<summary class="explore-hier-section-header">'
            + '<span>' + utils.esc(section.title) + '</span>'
            + '<span class="explore-hier-range">\u00A7' + section.range[0] + '\u2013' + section.range[1] + '</span>'
            + '</summary>';

          section.chapters.forEach(function(chapter) {
            if (chapter.articles.length === 0) {
              html += '<div class="explore-item explore-item--tap" style="padding-left:var(--space-3)" onclick="exploreTopic(' + chapter.range[0] + ',' + chapter.range[1] + ')">'
                + '<div class="explore-item-label">' + utils.esc(chapter.title) + '</div>'
                + '<div class="explore-item-context">\u00A7' + chapter.range[0] + '\u2013' + chapter.range[1] + '</div>'
                + '</div>';
            } else {
              html += '<details class="explore-hier-chapter">'
                + '<summary class="explore-hier-chapter-header">' + utils.esc(chapter.title)
                + '<span class="explore-hier-range">\u00A7' + chapter.range[0] + '\u2013' + chapter.range[1] + '</span></summary>';
              chapter.articles.forEach(function(article) {
                html += '<div class="explore-item explore-item--tap" style="padding-left:var(--space-4)" onclick="exploreTopic(' + article.range[0] + ',' + article.range[1] + ')">'
                  + '<div class="explore-item-label">' + utils.esc(article.title) + '</div>'
                  + '<div class="explore-item-context">\u00A7' + article.range[0] + '\u2013' + article.range[1] + '</div>'
                  + '</div>';
              });
              html += '</details>';
            }
          });
          html += '</details>';
        }
      });
      html += '</details>';
    });

    body.innerHTML = html;
    body.scrollTop = 0;
  } else {
    body.innerHTML = '<div class="explore-empty">Hierarchy data not available. Try reloading.</div>';
  }
}

// ── Bible genre grouping ──
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
      html += '<button class="explore-bible-book" onclick="_openBibleFromExplore(\'' + utils.esc(b.name) + ' 1\')">'
        + '<span class="explore-bible-book-name">' + utils.esc(b.name) + '</span>'
        + '</button>';
    });
    html += '</div>';
  });
  return html;
}

// ── Bible landing ──
function _exploreBibleLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('readerBody');
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

// ── Baltimore helpers ──
function _renderBaltimoreRow(qa) {
  var onclick = ' onclick="explorePivot(\'baltimore\',\'' + qa.id + '\')"';
  return '<div class="explore-item explore-item--tap"' + onclick + '>'
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

// ── Baltimore landing ──
function _exploreBaltLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('readerBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Baltimore Catechism</span>';

  if (!_baltimore || !_baltimore.questions) {
    body.innerHTML = '<div class="explore-loading">Loading\u2026</div>';
    graph.ensure(['baltimore']).then(function() {
      _baltimore = graph.getBaltimore();
      if (_baltimore) { _exploreBaltLanding(); }
      else { body.innerHTML = '<div class="explore-empty">Could not load Baltimore Catechism.</div>'; }
    });
    return;
  }

  var html = '';

  html += '<div class="explore-search-wrap">'
    + '<div class="explore-search-bar">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + '<input type="text" placeholder="Search questions\u2026" oninput="_filterBaltimore(this.value)">'
    + '</div></div>';

  html += '<div id="baltimoreList">';
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

// ── Summa landing ──
function _exploreSummaLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('readerBody');
  var trail = document.getElementById('exploreTrail');
  if (trail) trail.innerHTML = '<span class="explore-crumb" onclick="_renderLanding()">Home</span><span class="explore-crumb-sep">\u203A</span><span class="explore-crumb explore-crumb--active">Summa Theologica</span>';

  if (!_summaCache) {
    body.innerHTML = '<div class="explore-loading">Loading\u2026</div>';
    graph.ensure(['summa']).then(function() {
      _summaCache = graph.getSumma();
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

// ── Lectionary landing ──
function _exploreLectionaryLanding() {
  _current = null;
  _history = [];
  var body = document.getElementById('readerBody');
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
  reader.readerOpen('explore', { type: type || 'landing', id: id || null });
}

function closeExplore() {
  reader.readerClose();
}

// ── Home ──
function exploreHome() {
  _history = [];
  _current = null;
  _renderLanding();
}

function explorePivot(type, id) {
  // Route through reader stack so back button and origin anchor work
  reader.readerOpen('explore', { type: type, id: id, _pushExplore: true });
}

function explorePop(targetIdx) {
  // Legacy — breadcrumb trail removed; use reader back or origin anchor instead
  reader.readerBack();
}

function exploreBack() {
  // Reader stack handles cross-source back navigation via readerBack()
  reader.readerBack();
}

// ── Topic browse ──
function exploreTopic(startNum, endNum) {
  // Ensure Explore is open in the reader
  var cur = reader.getCurrent();
  if (!cur || cur.mode !== 'explore') {
    reader.readerOpen('explore', { type: 'landing', id: null });
  }

  _history = [];
  _current = null;

  // Need data loaded first
  graph.ensure(['ccc', 'hierarchy']).then(function() {
    _cccParas = graph.getCCCParagraphs();
    _cccHierarchy = graph.getCCCHierarchy();
    var body = document.getElementById('readerBody');
    var trail = document.getElementById('exploreTrail');
    var ctx = _getHierarchyPath(startNum);
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
window._exploreCCCLanding = _exploreCCCLanding;
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
  exploreHome: exploreHome
};
