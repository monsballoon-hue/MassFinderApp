// src/graph.js — Shared cross-reference graph
// Single instance replaces duplicated data in explore.js + bible.js.
// All indexes built lazily on first access. No Web Worker needed — total
// build time for all reverse indexes is <30ms on mid-range phones.

var cccData = require('./ccc-data.js');

// ── Forward data (loaded from JSON, lazily) ──
var _cccParas = null;        // {int: "text"} via cccData
var _cccXrefs = null;        // {int: [int...]} via cccData
var _cccFootnotes = null;    // {"663": [{num, type, ref}, ...]}
var _bibleXrefs = null;      // {"Gen:1:1": [["John:1:1", 360], ...]}
var _cccHierarchy = null;    // {hierarchy: [...], lookup: {...}}
var _baltimore = null;       // {questions: [...], byCCC: {...}}
var _lectionary = null;      // {sundays: {A:{...}}, weekdays: {...}}
var _summa = null;           // {articles: [...]}

// ── Reverse indexes (built lazily) ──
var _bibleToCCC = null;      // "Mt 28:19" → [2, 4, 849, ...]
var _cccToScripture = null;  // 663 → ["Lk 24:51", "Acts 1:9"]
var _bibleToLect = null;     // "Isaiah:2:1" → [{cycle, day, type}]
var _cccToBaltimore = null;  // "355" → [1]
var _summaByTopic = null;    // "god" → ["FP.Q1.A1", ...]

// ── Loading helpers ──
var _loadPromises = {};

function _loadOnce(key, fetcher) {
  if (_loadPromises[key]) return _loadPromises[key];
  _loadPromises[key] = fetcher().catch(function(e) {
    _loadPromises[key] = null; // allow retry on failure
    return null;
  });
  return _loadPromises[key];
}

function _ensureCCC() {
  return _loadOnce('ccc', function() {
    return cccData.load().then(function(d) {
      if (d) { _cccParas = d.paragraphs; _cccXrefs = d.xrefs; }
    });
  });
}

function _ensureFootnotes() {
  return _loadOnce('footnotes', function() {
    return fetch('/data/ccc-footnotes.json').then(function(r) { return r.json(); })
      .then(function(d) { _cccFootnotes = d; });
  });
}

function _ensureBibleXrefs() {
  return _loadOnce('bibleXrefs', function() {
    return fetch('/data/bible-xrefs.json').then(function(r) { return r.json(); })
      .then(function(d) { _bibleXrefs = d; });
  });
}

function _ensureHierarchy() {
  return _loadOnce('hierarchy', function() {
    return fetch('/data/ccc-hierarchy.json').then(function(r) { return r.json(); })
      .then(function(d) { _cccHierarchy = d; });
  });
}

function _ensureBaltimore() {
  return _loadOnce('baltimore', function() {
    return cccData.loadBaltimore().then(function(b) { _baltimore = b; });
  });
}

function _ensureLectionary() {
  return _loadOnce('lectionary', function() {
    return fetch('/data/lectionary-index.json').then(function(r) { return r.json(); })
      .then(function(d) { _lectionary = d; });
  });
}

function _ensureSumma() {
  return _loadOnce('summa', function() {
    return fetch('/data/summa-daily.json').then(function(r) { return r.json(); })
      .then(function(d) { _summa = d; });
  });
}

// ── Reverse index builders ──

function _buildBibleToCCC() {
  if (_bibleToCCC) return;
  _bibleToCCC = {};
  _cccToScripture = {};
  if (!_cccFootnotes) return;

  Object.keys(_cccFootnotes).forEach(function(paraNum) {
    var notes = _cccFootnotes[paraNum];
    var num = parseInt(paraNum, 10);
    if (!notes || !Array.isArray(notes)) return;

    notes.forEach(function(note) {
      if (note.type !== 'scripture') return;
      var ref = _cleanFootnoteRef(note.ref);
      if (!ref) return;

      // Bible → CCC
      if (!_bibleToCCC[ref]) _bibleToCCC[ref] = [];
      if (_bibleToCCC[ref].indexOf(num) < 0) _bibleToCCC[ref].push(num);

      // CCC → Scripture (reverse)
      if (!_cccToScripture[num]) _cccToScripture[num] = [];
      if (_cccToScripture[num].indexOf(ref) < 0) _cccToScripture[num].push(ref);
    });
  });
}

function _buildBibleToLect() {
  if (_bibleToLect) return;
  _bibleToLect = {};
  if (!_lectionary) return;

  function scanCycle(cycleName, days) {
    if (!days) return;
    Object.keys(days).forEach(function(dayKey) {
      var readings = days[dayKey];
      Object.keys(readings).forEach(function(readingType) {
        var val = readings[readingType];
        if (typeof val !== 'string') return;
        var bookRef = _extractBookRef(val);
        if (!bookRef) return;
        if (!_bibleToLect[bookRef]) _bibleToLect[bookRef] = [];
        _bibleToLect[bookRef].push({
          cycle: cycleName, day: dayKey, type: readingType
        });
      });
    });
  }

  if (_lectionary.sundays) {
    Object.keys(_lectionary.sundays).forEach(function(c) {
      scanCycle(c, _lectionary.sundays[c]);
    });
  }
  if (_lectionary.weekdays) {
    Object.keys(_lectionary.weekdays).forEach(function(y) {
      scanCycle(null, _lectionary.weekdays[y]);
    });
  }
}

function _buildCCCToBaltimore() {
  if (_cccToBaltimore) return;
  _cccToBaltimore = {};
  if (!_baltimore || !_baltimore.questions) return;

  _baltimore.questions.forEach(function(qa) {
    if (!qa.ccc) return;
    var cccNum = String(qa.ccc);
    if (!_cccToBaltimore[cccNum]) _cccToBaltimore[cccNum] = [];
    _cccToBaltimore[cccNum].push(qa.id);
  });
}

var _STOPS = { 'the': 1, 'and': 1, 'for': 1, 'with': 1, 'from': 1, 'that': 1, 'this': 1, 'into': 1, 'about': 1 };

function _buildSummaByTopic() {
  if (_summaByTopic) return;
  _summaByTopic = {};
  if (!_summa || !_summa.articles) return;

  _summa.articles.forEach(function(art) {
    if (!art.topic) return;
    var keywords = art.topic.toLowerCase().split(/[\s,]+/);
    keywords.forEach(function(kw) {
      if (kw.length < 4 || _STOPS[kw]) return;
      if (!_summaByTopic[kw]) _summaByTopic[kw] = [];
      _summaByTopic[kw].push(art.id);
    });
  });
}

// ── Reference helpers ──

function _cleanFootnoteRef(raw) {
  if (!raw) return null;
  // Strip "Cf. ⇒ " prefix, standardize
  var clean = raw.replace(/^Cf\.?\s*\u21d2?\s*/i, '').replace(/^cf\.?\s*/i, '').trim();
  // Must look like a scripture ref: "Book Ch:Vs"
  var m = clean.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return m[1].trim() + ' ' + m[2] + ':' + m[3];
}

function _extractBookRef(refStr) {
  // "Isaiah 2:1-5" → "Isaiah 2:1"
  var m = refStr.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return m[1].trim() + ' ' + m[2] + ':' + m[3];
}

// ── Public API ──

function ensure(types) {
  var promises = [];
  types.forEach(function(t) {
    if (t === 'ccc') promises.push(_ensureCCC());
    if (t === 'footnotes') promises.push(_ensureFootnotes());
    if (t === 'bibleXrefs') promises.push(_ensureBibleXrefs());
    if (t === 'hierarchy') promises.push(_ensureHierarchy());
    if (t === 'baltimore') promises.push(_ensureBaltimore());
    if (t === 'lectionary') promises.push(_ensureLectionary());
    if (t === 'summa') promises.push(_ensureSumma());
  });
  return Promise.all(promises);
}

function forBible(ref) {
  _buildBibleToCCC();
  _buildBibleToLect();

  var result = { bible: [], ccc: [], lectionary: [] };

  // Bible → Bible cross-references
  if (_bibleXrefs) {
    var m = ref.match(/^(.+?)\s+(\d+):(\d+)/);
    var xrefKey = m ? m[1] + ':' + m[2] + ':' + m[3] : ref.replace(/\s+/g, ':');
    result.bible = _bibleXrefs[xrefKey] || [];
  }

  // Bible → CCC (which CCC paragraphs cite this verse)
  if (_bibleToCCC) {
    var cleaned = _cleanFootnoteRef(ref) || ref;
    result.ccc = _bibleToCCC[cleaned] || [];
  }

  // Bible → Lectionary
  if (_bibleToLect) {
    var lectRef = _extractBookRef(ref) || ref;
    result.lectionary = _bibleToLect[lectRef] || [];
  }

  return result;
}

function forCCC(num) {
  _buildBibleToCCC();
  _buildCCCToBaltimore();
  _buildSummaByTopic();

  var n = parseInt(num, 10);
  var result = { ccc: [], bible: [], baltimore: [], summa: [] };

  // CCC → CCC cross-references
  if (_cccXrefs && _cccXrefs[n]) {
    var xr = _cccXrefs[n];
    result.ccc = Array.isArray(xr) ? xr : (xr.fwd || []).concat(xr.rev || []);
  }

  // CCC → Scripture (from footnotes)
  if (_cccToScripture && _cccToScripture[n]) {
    result.bible = _cccToScripture[n];
  }

  // CCC → Baltimore
  if (_cccToBaltimore) {
    result.baltimore = _cccToBaltimore[String(n)] || [];
  }

  // CCC → Summa (multi-keyword topic matching)
  if (_summaByTopic && _cccHierarchy) {
    var idx = _cccHierarchy.lookup && _cccHierarchy.lookup[n];
    if (idx) {
      var h = _cccHierarchy.hierarchy;
      var titles = [];
      if (idx[0] >= 0 && h[idx[0]]) titles.push(h[idx[0]].title);
      if (idx[1] >= 0 && h[idx[0]] && h[idx[0]].sections && h[idx[0]].sections[idx[1]]) {
        titles.push(h[idx[0]].sections[idx[1]].title);
      }
      if (idx[2] >= 0 && h[idx[0]] && h[idx[0]].sections && h[idx[0]].sections[idx[1]] &&
          h[idx[0]].sections[idx[1]].chapters && h[idx[0]].sections[idx[1]].chapters[idx[2]]) {
        titles.push(h[idx[0]].sections[idx[1]].chapters[idx[2]].title);
      }

      var scored = {};
      titles.join(' ').toLowerCase().split(/[\s,;:()\u2013]+/).forEach(function(kw) {
        if (kw.length < 4 || _STOPS[kw]) return;
        (_summaByTopic[kw] || []).forEach(function(artId) {
          scored[artId] = (scored[artId] || 0) + 1;
        });
      });

      var sorted = Object.keys(scored).sort(function(a, b) { return scored[b] - scored[a]; });
      result.summa = sorted.slice(0, 5);
    }
  }

  return result;
}

// Direct data accessors
function getCCCParagraph(num) { return _cccParas ? _cccParas[parseInt(num, 10)] : null; }
function getCCCParagraphs() { return _cccParas; }
function getCCCHierarchy() { return _cccHierarchy; }
function getBaltimore() { return _baltimore; }
function getSumma() { return _summa; }
function getLectionary() { return _lectionary; }

module.exports = {
  ensure: ensure,
  forBible: forBible,
  forCCC: forCCC,
  getCCCParagraph: getCCCParagraph,
  getCCCParagraphs: getCCCParagraphs,
  getCCCHierarchy: getCCCHierarchy,
  getBaltimore: getBaltimore,
  getSumma: getSumma,
  getLectionary: getLectionary
};
