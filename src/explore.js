// src/explore.js — Library module (formerly Explore)
// Browse CCC hierarchy, Bible books, Baltimore, Summa, Lectionary.
// CCC and Bible content opens in their dedicated readers.
// Data loading delegated to graph.js; search delegated to search.js.
var utils = require('./utils.js');
var reader = require('./reader.js');
var graph = require('./graph.js');
var search = require('./search.js');

// Local aliases — assigned from graph after ensure(), used by landing pages
var _cccParas = null;
var _baltimore = null;
var _summaCache = null;
var _lectionary = null;
var _cccHierarchy = null;

// ── Reader module registration ──
reader.registerModule('explore', {
  getTitle: function() { return 'Library'; },
  getHeaderExtra: function() { return ''; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    var type = params.type;
    var id = params.id;

    // Redirect CCC/Bible to their dedicated readers
    if (type === 'ccc' && id) {
      reader.readerOpen('ccc', { num: String(id) });
      return;
    }
    if (type === 'bible' && id) {
      reader.readerOpen('bible', { ref: id });
      return;
    }

    var loadPhrase = _loadingPhrases[Math.floor(utils.getNow().getTime() / 86400000) % _loadingPhrases.length];
    bodyEl.innerHTML = '<div class="explore-loading">' + utils.esc(loadPhrase) + '</div>';

    graph.ensure(['ccc', 'footnotes', 'bibleXrefs', 'hierarchy', 'baltimore', 'lectionary', 'summa']).then(function() {
      _cccParas = graph.getCCCParagraphs();
      _cccHierarchy = graph.getCCCHierarchy();
      _baltimore = graph.getBaltimore();
      _summaCache = graph.getSumma();
      _lectionary = graph.getLectionary();

      if (type === 'summa' && id) {
        _renderSummaDetail(id);
      } else if (type === 'baltimore' && id) {
        _renderBaltimoreDetail(id);
      } else {
        _renderLanding();
      }
    });
  },
  onClose: function() {}
});

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

  var html = '';

  // Contemplative opener — today's Q&A
  var daysSinceEpoch = Math.floor(utils.getNow().getTime() / 86400000);
  if (_baltimore && _baltimore.questions && _baltimore.questions.length) {
    var todayQA = _baltimore.questions[daysSinceEpoch % _baltimore.questions.length];
    html += '<div class="explore-opener">'
      + '<div class="explore-opener-text">' + utils.esc(todayQA.question) + '</div>'
      + '<div class="explore-opener-answer">' + utils.esc(todayQA.answer) + '</div>'
      + (todayQA.ccc ? '<button class="explore-opener-link" onclick="openCCC(\'' + todayQA.ccc + '\')">Read this teaching \u203A</button>' : '')
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
  var body = document.getElementById('readerBody');

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
      html += '<button class="explore-bible-book" onclick="openBible(\'' + utils.esc(b.name) + ' 1\')">'
        + '<span class="explore-bible-book-name">' + utils.esc(b.name) + '</span>'
        + '</button>';
    });
    html += '</div>';
  });
  return html;
}

// ── Bible landing ──
function _exploreBibleLanding() {
  var body = document.getElementById('readerBody');

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
  var body = document.getElementById('readerBody');

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

// ── Baltimore detail (simplified — no connections) ──
function _renderBaltimoreDetail(id) {
  var body = document.getElementById('readerBody');
  var bqa = null;
  var bqIdx = -1;
  if (_baltimore && _baltimore.questions) {
    for (var bi = 0; bi < _baltimore.questions.length; bi++) {
      if (String(_baltimore.questions[bi].id) === String(id)) {
        bqa = _baltimore.questions[bi];
        bqIdx = bi;
        break;
      }
    }
  }
  if (!bqa) { body.innerHTML = '<div class="explore-empty">Question not found.</div>'; return; }

  var html = '<div class="explore-baltimore-detail">';
  html += '<div class="explore-baltimore-q">Q' + bqa.id + '. ' + utils.esc(bqa.question) + '</div>';
  html += '<div class="explore-baltimore-a">A. ' + utils.esc(bqa.answer) + '</div>';
  html += '</div>';
  if (bqa.ccc) {
    html += '<button class="explore-open-btn" onclick="openCCC(\'' + bqa.ccc + '\')">Read \u00A7' + bqa.ccc + ' in Catechism</button>';
  }

  // Prev/next navigation
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

  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Summa landing ──
function _exploreSummaLanding() {
  var body = document.getElementById('readerBody');

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

// ── Summa detail (simplified — no connections) ──
function _renderSummaDetail(id) {
  var body = document.getElementById('readerBody');
  var art = null;
  if (_summaCache && _summaCache.articles) {
    for (var si = 0; si < _summaCache.articles.length; si++) {
      if (_summaCache.articles[si].id === id) { art = _summaCache.articles[si]; break; }
    }
  }
  if (!art) { body.innerHTML = '<div class="explore-empty">Article not found.</div>'; return; }

  var html = '<div class="explore-summa-detail">';
  html += '<div class="summa-question">' + utils.esc(art.q) + '</div>';
  html += '<div class="summa-article">' + utils.esc(art.a) + '</div>';
  html += '<div class="summa-body">' + utils.esc(art.body) + '</div>';
  html += '<div class="summa-cite">St. Thomas Aquinas \u00b7 ' + utils.esc(art.part)
    + ' \u00b7 Q.' + utils.esc(art.id.split('.')[1].replace('Q', ''))
    + ', A.' + utils.esc(art.id.split('.')[2].replace('A', ''))
    + '</div>';
  html += '</div>';
  body.innerHTML = html;
  body.scrollTop = 0;
}

// ── Lectionary landing ──
function _exploreLectionaryLanding() {
  var body = document.getElementById('readerBody');

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
          html += '<div class="explore-lect-reading" onclick="openBible(\'' + utils.esc(ref).replace(/'/g, '\\\'') + '\')">'
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
        html += '<div class="explore-lect-reading" onclick="openBible(\'' + utils.esc(ref).replace(/'/g, '\\\'') + '\')">'
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

function exploreHome() {
  _renderLanding();
}

function explorePivot(type, id) {
  // CCC and Bible route to their dedicated readers
  if (type === 'ccc') {
    reader.readerOpen('ccc', { num: String(id) });
    return;
  }
  if (type === 'bible') {
    reader.readerOpen('bible', { ref: id });
    return;
  }
  // Other types stay within Library
  reader.readerOpen('explore', { type: type, id: id });
}

function explorePop() {
  reader.readerBack();
}

function exploreBack() {
  reader.readerBack();
}

// ── Topic browse ──
function exploreTopic(startNum, endNum) {
  // Ensure Library is open in the reader
  var cur = reader.getCurrent();
  if (!cur || cur.mode !== 'explore') {
    reader.readerOpen('explore', { type: 'landing', id: null });
  }

  // Need data loaded first
  graph.ensure(['ccc', 'hierarchy']).then(function() {
    _cccParas = graph.getCCCParagraphs();
    _cccHierarchy = graph.getCCCHierarchy();
    var body = document.getElementById('readerBody');
    var ctx = graph.getHierarchyPath(startNum);

    var html = '<div class="explore-context">' + utils.esc(ctx) + '</div>';
    html += '<div class="explore-topic-list">';
    for (var n = startNum; n <= endNum; n++) {
      var text = _cccParas && _cccParas[n];
      if (!text) continue;
      var preview = utils.getPreview(text);
      html += '<div class="explore-item explore-item--tap" onclick="openCCC(\'' + n + '\')">'
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
