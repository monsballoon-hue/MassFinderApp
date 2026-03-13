// src/search.js — Unified cross-source search engine
// Single fuzzy search across CCC, Baltimore, Summa with query classification.
// Replaces duplicated search in ccc.js and explore.js.

var createFuzzySearch = require('@nozbe/microfuzz').default;
var graph = require('./graph.js');
var utils = require('./utils.js');

// ── Fuzzy search indexes (built lazily) ──
var _cccFuzzy = null;
var _baltFuzzy = null;
var _summaFuzzy = null;

// ── Book name lookup (built lazily from bible.js BOOKS) ──
var _bookLookup = null;

function _buildBookLookup() {
  if (_bookLookup) return;
  _bookLookup = {};
  try {
    var BOOKS = require('./bible.js').BOOKS;
    if (!BOOKS) return;
    BOOKS.forEach(function(b) {
      _bookLookup[b.name.toLowerCase()] = b;
      _bookLookup[b.abbr.toLowerCase()] = b;
      (b.alt || []).forEach(function(a) {
        _bookLookup[a.toLowerCase()] = b;
      });
    });
  } catch (e) { /* bible.js not loaded yet */ }
}

function _resolveBookName(input) {
  _buildBookLookup();
  if (!_bookLookup) return null;
  var key = input.toLowerCase().replace(/\s+/g, ' ').trim();
  return _bookLookup[key] || null;
}

// ── Query classification ──
// Detects structural patterns: CCC numbers, Bible refs, Baltimore Q numbers

function classifyQuery(q) {
  var trimmed = q.trim();

  // CCC paragraph number: "§484", "ccc 484", "484" (if 1-2865)
  var cccMatch = trimmed.match(/^(?:\u00A7|\u00B6|ccc\s*)?(\d{1,4})$/i);
  if (cccMatch) {
    var n = parseInt(cccMatch[1], 10);
    if (n >= 1 && n <= 2865) return { type: 'ccc-direct', num: n };
  }

  // Bible reference: "John 3:16", "Jn 3:16", "1 Cor 13", "Gen 1:1"
  var bibleMatch = trimmed.match(/^((?:1\s*|2\s*|3\s*)?[A-Za-z]+)\s+(\d+)(?::(\d+)(?:\s*[-\u2013]\s*(\d+))?)?$/);
  if (bibleMatch) {
    var bookName = bibleMatch[1].trim();
    var resolved = _resolveBookName(bookName);
    if (resolved) {
      return {
        type: 'bible-direct',
        book: resolved,
        chapter: parseInt(bibleMatch[2], 10),
        verse: bibleMatch[3] ? parseInt(bibleMatch[3], 10) : null,
        raw: trimmed
      };
    }
  }

  // Baltimore question: "Q42", "q 42", "question 42"
  var baltMatch = trimmed.match(/^(?:q(?:uestion)?\s*)(\d{1,3})$/i);
  if (baltMatch) {
    var qNum = parseInt(baltMatch[1], 10);
    if (qNum >= 1 && qNum <= 220) return { type: 'baltimore-direct', id: qNum };
  }

  return { type: 'text', query: trimmed };
}

// ── Index builders ──

function _buildCCCFuzzy() {
  if (_cccFuzzy) return;
  var paras = graph.getCCCParagraphs();
  var hierarchy = graph.getCCCHierarchy();
  if (!paras) return;

  var items = [];
  Object.keys(paras).forEach(function(num) {
    var text = paras[num].replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '').replace(/\n/g, ' ');
    var section = '';
    if (hierarchy && hierarchy.lookup && hierarchy.lookup[num]) {
      var idx = hierarchy.lookup[num];
      var h = hierarchy.hierarchy;
      var titles = [];
      if (idx[0] >= 0 && h[idx[0]]) titles.push(h[idx[0]].title);
      if (idx[2] >= 0 && h[idx[0]] && h[idx[0]].sections &&
          h[idx[0]].sections[idx[1]] && h[idx[0]].sections[idx[1]].chapters &&
          h[idx[0]].sections[idx[1]].chapters[idx[2]]) {
        titles.push(h[idx[0]].sections[idx[1]].chapters[idx[2]].title);
      }
      section = titles.join(' ');
    }
    items.push({ num: num, text: text, section: section });
  });

  _cccFuzzy = createFuzzySearch(items, {
    getText: function(item) { return [item.section, item.text]; }
  });
}

function _buildBaltFuzzy() {
  if (_baltFuzzy) return;
  var baltimore = graph.getBaltimore();
  if (!baltimore || !baltimore.questions) return;

  var items = baltimore.questions.map(function(qa) {
    return { id: qa.id, q: qa.question, a: qa.answer, ccc: qa.ccc };
  });
  _baltFuzzy = createFuzzySearch(items, {
    getText: function(item) { return [item.q, item.a]; }
  });
}

function _buildSummaFuzzy() {
  if (_summaFuzzy) return;
  var summa = graph.getSumma();
  if (!summa || !summa.articles) return;

  var items = summa.articles.map(function(art) {
    return { id: art.id, topic: art.topic, q: art.q, a: art.a, part: art.part };
  });
  _summaFuzzy = createFuzzySearch(items, {
    getText: function(item) { return [item.topic, item.q, item.a]; }
  });
}

// ── Main query function ──
// Returns { groups: [{ source, label, items }], total }
// Each item: { type, ref, label, preview, context, score }

function query(q, opts) {
  var classified = classifyQuery(q);
  var sources = (opts && opts.sources) || null;
  var maxPerGroup = (opts && opts.maxPerGroup) || 12;
  var results = { groups: [], total: 0 };

  // ── Direct reference matches (highest priority) ──
  if (classified.type === 'ccc-direct') {
    var text = graph.getCCCParagraph(classified.num);
    if (text) {
      var preview = utils.getPreview(text);
      results.groups.push({
        source: 'ccc', label: 'Catechism',
        items: [{ type: 'ccc', ref: String(classified.num), label: '\u00A7' + classified.num, preview: preview, score: 1.0 }]
      });
      results.total++;
    }
  } else if (classified.type === 'bible-direct') {
    results.groups.push({
      source: 'bible', label: 'Scripture',
      items: [{ type: 'bible', ref: classified.raw, label: classified.raw, preview: 'Tap to read passage', score: 1.0 }]
    });
    results.total++;
  } else if (classified.type === 'baltimore-direct') {
    var baltimore = graph.getBaltimore();
    if (baltimore && baltimore.questions) {
      for (var qi = 0; qi < baltimore.questions.length; qi++) {
        if (baltimore.questions[qi].id === classified.id) {
          var qa = baltimore.questions[qi];
          results.groups.push({
            source: 'baltimore', label: 'Baltimore Catechism',
            items: [{ type: 'baltimore', ref: String(qa.id), label: 'Q' + qa.id + '. ' + qa.question, preview: qa.answer, score: 1.0 }]
          });
          results.total++;
          break;
        }
      }
    }
  }

  // ── Fuzzy text search (runs for text queries and appends to direct match results) ──
  if (classified.type === 'text') {
    var textQuery = classified.query;

    // CCC fuzzy
    if (!sources || sources.indexOf('ccc') >= 0) {
      _buildCCCFuzzy();
      if (_cccFuzzy) {
        var cccResults = _cccFuzzy(textQuery);
        if (cccResults.length) {
          var cccItems = cccResults.slice(0, maxPerGroup).map(function(r) {
            var rText = r.item.text || '';
            var rPreview = rText.slice(0, 120);
            if (rText.length > 120) rPreview += '\u2026';
            return {
              type: 'ccc', ref: r.item.num, label: '\u00A7' + r.item.num,
              preview: rPreview, context: r.item.section, score: r.score || 0.5
            };
          });
          if (cccItems.length) {
            results.groups.push({ source: 'ccc', label: 'Catechism', items: cccItems });
            results.total += cccItems.length;
          }
        }
      }
    }

    // Baltimore fuzzy
    if (!sources || sources.indexOf('baltimore') >= 0) {
      _buildBaltFuzzy();
      if (_baltFuzzy) {
        var baltResults = _baltFuzzy(textQuery);
        if (baltResults.length) {
          var baltItems = baltResults.slice(0, 5).map(function(r) {
            return {
              type: 'baltimore', ref: String(r.item.id),
              label: 'Q' + r.item.id + '. ' + r.item.q,
              preview: r.item.a, score: r.score || 0.5
            };
          });
          results.groups.push({ source: 'baltimore', label: 'Baltimore Catechism', items: baltItems });
          results.total += baltItems.length;
        }
      }
    }

    // Summa fuzzy
    if (!sources || sources.indexOf('summa') >= 0) {
      _buildSummaFuzzy();
      if (_summaFuzzy) {
        var summaResults = _summaFuzzy(textQuery);
        if (summaResults.length) {
          var summaItems = summaResults.slice(0, 5).map(function(r) {
            return {
              type: 'summa', ref: r.item.id, label: r.item.q,
              preview: r.item.a,
              context: r.item.topic + ' \u00b7 ' + r.item.part,
              score: r.score || 0.5
            };
          });
          results.groups.push({ source: 'summa', label: 'Summa Theologica', items: summaItems });
          results.total += summaItems.length;
        }
      }
    }
  }

  return results;
}

// Prebuild indexes for faster first query
function warmup(types) {
  if (!types || types.indexOf('ccc') >= 0) _buildCCCFuzzy();
  if (!types || types.indexOf('baltimore') >= 0) _buildBaltFuzzy();
  if (!types || types.indexOf('summa') >= 0) _buildSummaFuzzy();
}

module.exports = {
  query: query,
  warmup: warmup,
  classifyQuery: classifyQuery
};
