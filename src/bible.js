// src/bible.js — Scripture bottom sheet module
// Opens a bottom sheet for any Bible reference tapped in MassFinder.
// Loads data/bible-drb/[book].json (lazy, per-book) + data/bible-xrefs.json (lazy, once).
// Mirrors ccc.js architecture exactly.

var _bookCache = {};    // { 'matthew': { book, abbr, testament, chapters, verses } }
var _xrefs = null;      // bible-xrefs.json data (null until first load)
var _history = [];      // navigation stack of refStr values
var _currentRef = '';
var _speaking = false;  // UX-04 Web Speech state

// ── 73-book metadata ──
// Each entry: file (no extension), canonical name, abbr used in xrefs,
// alt name/abbr variants (lowercased for lookup), testament, genre label
var _BOOKS = [
  // OT — Pentateuch
  { file: 'genesis',       name: 'Genesis',         abbr: 'Gen',    alt: ['gn'],                              testament: 'OT', genre: 'Pentateuch' },
  { file: 'exodus',        name: 'Exodus',           abbr: 'Exod',   alt: ['ex'],                              testament: 'OT', genre: 'Pentateuch' },
  { file: 'leviticus',     name: 'Leviticus',        abbr: 'Lev',    alt: ['lv'],                              testament: 'OT', genre: 'Pentateuch' },
  { file: 'numbers',       name: 'Numbers',          abbr: 'Num',    alt: ['nm'],                              testament: 'OT', genre: 'Pentateuch' },
  { file: 'deuteronomy',   name: 'Deuteronomy',      abbr: 'Deut',   alt: ['dt'],                              testament: 'OT', genre: 'Pentateuch' },
  // OT — Historical
  { file: 'joshua',        name: 'Joshua',           abbr: 'Josh',   alt: ['jos','josue'],                     testament: 'OT', genre: 'Historical' },
  { file: 'judges',        name: 'Judges',           abbr: 'Judg',   alt: ['jgs'],                             testament: 'OT', genre: 'Historical' },
  { file: 'ruth',          name: 'Ruth',             abbr: 'Ruth',   alt: ['ru'],                              testament: 'OT', genre: 'Historical' },
  { file: '1samuel',       name: '1 Samuel',         abbr: '1Sam',   alt: ['1sam','i sam','1 sm','isam'],       testament: 'OT', genre: 'Historical' },
  { file: '2samuel',       name: '2 Samuel',         abbr: '2Sam',   alt: ['2sam','ii sam','2 sm','iisam'],     testament: 'OT', genre: 'Historical' },
  { file: '1kings',        name: '1 Kings',          abbr: '1Kgs',   alt: ['1kgs','i kgs','3 kings','ikgs'],   testament: 'OT', genre: 'Historical' },
  { file: '2kings',        name: '2 Kings',          abbr: '2Kgs',   alt: ['2kgs','ii kgs','4 kings','iikgs'], testament: 'OT', genre: 'Historical' },
  { file: '1chronicles',   name: '1 Chronicles',     abbr: '1Chr',   alt: ['1chr','i chr','1 chron','ichr'],   testament: 'OT', genre: 'Historical' },
  { file: '2chronicles',   name: '2 Chronicles',     abbr: '2Chr',   alt: ['2chr','ii chr','2 chron','iichr'], testament: 'OT', genre: 'Historical' },
  { file: 'ezra',          name: 'Ezra',             abbr: 'Ezra',   alt: ['ezr'],                             testament: 'OT', genre: 'Historical' },
  { file: 'nehemiah',      name: 'Nehemiah',         abbr: 'Neh',    alt: [],                                  testament: 'OT', genre: 'Historical' },
  { file: 'tobit',         name: 'Tobit',            abbr: 'Tob',    alt: ['tobias','tb'],                     testament: 'OT', genre: 'Historical' },
  { file: 'judith',        name: 'Judith',           abbr: 'Jdt',    alt: ['jth'],                             testament: 'OT', genre: 'Historical' },
  { file: 'esther',        name: 'Esther',           abbr: 'Esth',   alt: ['est'],                             testament: 'OT', genre: 'Historical' },
  { file: '1maccabees',    name: '1 Maccabees',      abbr: '1Macc',  alt: ['1macc','i macc','1 mc','1 machabees','imacc'], testament: 'OT', genre: 'Historical' },
  { file: '2maccabees',    name: '2 Maccabees',      abbr: '2Macc',  alt: ['2macc','ii macc','2 mc','2 machabees','iimacc'], testament: 'OT', genre: 'Historical' },
  // OT — Wisdom
  { file: 'job',           name: 'Job',              abbr: 'Job',    alt: ['jb'],                              testament: 'OT', genre: 'Wisdom' },
  { file: 'psalms',        name: 'Psalms',           abbr: 'Ps',     alt: ['psalm','pss'],                     testament: 'OT', genre: 'Wisdom' },
  { file: 'proverbs',      name: 'Proverbs',         abbr: 'Prov',   alt: ['prv','pro'],                       testament: 'OT', genre: 'Wisdom' },
  { file: 'ecclesiastes',  name: 'Ecclesiastes',     abbr: 'Eccles', alt: ['eccl','qoh','qoheleth'],           testament: 'OT', genre: 'Wisdom' },
  { file: 'songofsolomon', name: 'Song of Solomon',  abbr: 'Song',   alt: ['song of songs','canticle','canticles','sg','cant','ss'], testament: 'OT', genre: 'Wisdom' },
  { file: 'wisdom',        name: 'Wisdom',           abbr: 'Wis',    alt: ['ws'],                              testament: 'OT', genre: 'Wisdom' },
  { file: 'sirach',        name: 'Sirach',           abbr: 'Sir',    alt: ['ecclesiasticus','ecclus'],         testament: 'OT', genre: 'Wisdom' },
  // OT — Prophets
  { file: 'isaiah',        name: 'Isaiah',           abbr: 'Isa',    alt: ['is','isaias'],                     testament: 'OT', genre: 'Prophets' },
  { file: 'jeremiah',      name: 'Jeremiah',         abbr: 'Jer',    alt: ['jeremias'],                        testament: 'OT', genre: 'Prophets' },
  { file: 'lamentations',  name: 'Lamentations',     abbr: 'Lam',    alt: [],                                  testament: 'OT', genre: 'Prophets' },
  { file: 'baruch',        name: 'Baruch',           abbr: 'Bar',    alt: [],                                  testament: 'OT', genre: 'Prophets' },
  { file: 'ezekiel',       name: 'Ezekiel',          abbr: 'Ezek',   alt: ['ez','ezechiel'],                   testament: 'OT', genre: 'Prophets' },
  { file: 'daniel',        name: 'Daniel',           abbr: 'Dan',    alt: ['dn'],                              testament: 'OT', genre: 'Prophets' },
  { file: 'hosea',         name: 'Hosea',            abbr: 'Hos',    alt: ['osee'],                            testament: 'OT', genre: 'Prophets' },
  { file: 'joel',          name: 'Joel',             abbr: 'Joel',   alt: ['jl'],                              testament: 'OT', genre: 'Prophets' },
  { file: 'amos',          name: 'Amos',             abbr: 'Amos',   alt: ['am'],                              testament: 'OT', genre: 'Prophets' },
  { file: 'obadiah',       name: 'Obadiah',          abbr: 'Obad',   alt: ['abdias','ob'],                     testament: 'OT', genre: 'Prophets' },
  { file: 'jonah',         name: 'Jonah',            abbr: 'Jon',    alt: ['jonas'],                           testament: 'OT', genre: 'Prophets' },
  { file: 'micah',         name: 'Micah',            abbr: 'Mic',    alt: ['micheas'],                         testament: 'OT', genre: 'Prophets' },
  { file: 'nahum',         name: 'Nahum',            abbr: 'Nah',    alt: ['na'],                              testament: 'OT', genre: 'Prophets' },
  { file: 'habakkuk',      name: 'Habakkuk',         abbr: 'Hab',    alt: ['habacuc'],                         testament: 'OT', genre: 'Prophets' },
  { file: 'zephaniah',     name: 'Zephaniah',        abbr: 'Zeph',   alt: ['sophonias'],                       testament: 'OT', genre: 'Prophets' },
  { file: 'haggai',        name: 'Haggai',           abbr: 'Hag',    alt: ['aggeus'],                          testament: 'OT', genre: 'Prophets' },
  { file: 'zechariah',     name: 'Zechariah',        abbr: 'Zech',   alt: ['zacharias'],                       testament: 'OT', genre: 'Prophets' },
  { file: 'malachi',       name: 'Malachi',          abbr: 'Mal',    alt: ['malachias'],                       testament: 'OT', genre: 'Prophets' },
  // NT — Gospels & Acts
  { file: 'matthew',       name: 'Matthew',          abbr: 'Matt',   alt: ['mt'],                              testament: 'NT', genre: 'Gospel' },
  { file: 'mark',          name: 'Mark',             abbr: 'Mark',   alt: ['mk'],                              testament: 'NT', genre: 'Gospel' },
  { file: 'luke',          name: 'Luke',             abbr: 'Luke',   alt: ['lk'],                              testament: 'NT', genre: 'Gospel' },
  { file: 'john',          name: 'John',             abbr: 'John',   alt: ['jn'],                              testament: 'NT', genre: 'Gospel' },
  { file: 'acts',          name: 'Acts',             abbr: 'Acts',   alt: ['acts of the apostles'],            testament: 'NT', genre: 'Historical' },
  // NT — Pauline Epistles
  { file: 'romans',        name: 'Romans',           abbr: 'Rom',    alt: ['rm'],                              testament: 'NT', genre: 'Pauline Epistle' },
  { file: '1corinthians',  name: '1 Corinthians',    abbr: '1Cor',   alt: ['1cor','i cor','icor'],             testament: 'NT', genre: 'Pauline Epistle' },
  { file: '2corinthians',  name: '2 Corinthians',    abbr: '2Cor',   alt: ['2cor','ii cor','iicor'],           testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'galatians',     name: 'Galatians',        abbr: 'Gal',    alt: [],                                  testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'ephesians',     name: 'Ephesians',        abbr: 'Eph',    alt: [],                                  testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'philippians',   name: 'Philippians',      abbr: 'Phil',   alt: [],                                  testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'colossians',    name: 'Colossians',       abbr: 'Col',    alt: [],                                  testament: 'NT', genre: 'Pauline Epistle' },
  { file: '1thessalonians',name: '1 Thessalonians',  abbr: '1Thess', alt: ['1thess','i thess','ithess'],       testament: 'NT', genre: 'Pauline Epistle' },
  { file: '2thessalonians',name: '2 Thessalonians',  abbr: '2Thess', alt: ['2thess','ii thess','iithess'],     testament: 'NT', genre: 'Pauline Epistle' },
  { file: '1timothy',      name: '1 Timothy',        abbr: '1Tim',   alt: ['1tim','i tim','itim'],             testament: 'NT', genre: 'Pauline Epistle' },
  { file: '2timothy',      name: '2 Timothy',        abbr: '2Tim',   alt: ['2tim','ii tim','iitim'],           testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'titus',         name: 'Titus',            abbr: 'Titus',  alt: ['ti'],                              testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'philemon',      name: 'Philemon',         abbr: 'Phlm',   alt: ['philem'],                          testament: 'NT', genre: 'Pauline Epistle' },
  { file: 'hebrews',       name: 'Hebrews',          abbr: 'Heb',    alt: [],                                  testament: 'NT', genre: 'Pauline Epistle' },
  // NT — Catholic Epistles
  { file: 'james',         name: 'James',            abbr: 'Jas',    alt: ['jam'],                             testament: 'NT', genre: 'Catholic Epistle' },
  { file: '1peter',        name: '1 Peter',          abbr: '1Pet',   alt: ['1pet','i pet','1 pt','ipet'],      testament: 'NT', genre: 'Catholic Epistle' },
  { file: '2peter',        name: '2 Peter',          abbr: '2Pet',   alt: ['2pet','ii pet','2 pt','iipet'],    testament: 'NT', genre: 'Catholic Epistle' },
  { file: '1john',         name: '1 John',           abbr: '1John',  alt: ['1john','i john','1 jn','ijohn'],   testament: 'NT', genre: 'Catholic Epistle' },
  { file: '2john',         name: '2 John',           abbr: '2John',  alt: ['2john','ii john','2 jn','iijohn'], testament: 'NT', genre: 'Catholic Epistle' },
  { file: '3john',         name: '3 John',           abbr: '3John',  alt: ['3john','iii john','3 jn','iiijohn'], testament: 'NT', genre: 'Catholic Epistle' },
  { file: 'jude',          name: 'Jude',             abbr: 'Jude',   alt: [],                                  testament: 'NT', genre: 'Catholic Epistle' },
  // NT — Apocalyptic
  { file: 'revelation',    name: 'Revelation',       abbr: 'Rev',    alt: ['rv','apocalypse','apoc'],          testament: 'NT', genre: 'Apocalyptic' }
];

// Build lookup map: any known name/abbr/alt variant (lowercased, no spaces) → book object
var _BOOK_LOOKUP = {};
_BOOKS.forEach(function(b) {
  var keys = [b.name, b.abbr, b.file].concat(b.alt || []);
  keys.forEach(function(k) {
    var norm = k.toLowerCase().replace(/\s+/g, '');
    _BOOK_LOOKUP[norm] = b;
    // Also register with spaces as-is (lowercased)
    _BOOK_LOOKUP[k.toLowerCase()] = b;
  });
});

// ── Reference parser ──
// "Matt 26:26-28" → { book, chapter, startVerse, endVerse }
// "1 Cor 11:24"   → { book, chapter:11, startVerse:24, endVerse:24 }
// "Ps 23"         → { book, chapter:23, startVerse:1, endVerse:999 }
function _parseRef(refStr) {
  if (!refStr) return null;
  var s = refStr.trim();

  // Pattern: (book name)(whitespace)(chapter):(startVerse)(optional –endVerse)
  var m = s.match(/^(.+?)\s+(\d+):(\d+)(?:\s*[-\u2013]\s*(\d+))?$/);
  if (m) {
    var bookStr = m[1].trim();
    var book = _BOOK_LOOKUP[bookStr.toLowerCase()] || _BOOK_LOOKUP[bookStr.toLowerCase().replace(/\s+/g, '')];
    if (!book) return null;
    return {
      book: book,
      chapter: parseInt(m[2], 10),
      startVerse: parseInt(m[3], 10),
      endVerse: m[4] ? parseInt(m[4], 10) : parseInt(m[3], 10)
    };
  }

  // Fallback: book + chapter only (e.g. "Ps 23")
  var m2 = s.match(/^(.+?)\s+(\d+)$/);
  if (m2) {
    var bookStr2 = m2[1].trim();
    var book2 = _BOOK_LOOKUP[bookStr2.toLowerCase()] || _BOOK_LOOKUP[bookStr2.toLowerCase().replace(/\s+/g, '')];
    if (book2) return { book: book2, chapter: parseInt(m2[2], 10), startVerse: 1, endVerse: 999 };
  }

  return null;
}

// ── Data loading ──
function _loadBook(filename) {
  if (_bookCache[filename]) return Promise.resolve(_bookCache[filename]);
  return fetch('/data/bible-drb/' + filename + '.json')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(d) { _bookCache[filename] = d; return d; });
}

function _loadXrefs() {
  if (_xrefs) return Promise.resolve();
  return fetch('/data/bible-xrefs.json')
    .then(function(r) { return r.json(); })
    .then(function(d) { _xrefs = d; })
    .catch(function() { _xrefs = {}; }); // xrefs are enhancement — never block render
}

// ── Helpers ──
function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Group consecutive verse refs from xrefs into display ranges
// Input:  ["Mark:14:22","Mark:14:23","Luke:22:19"]
// Output: [{ abbr:'Mark', chapter:14, startVerse:22, endVerse:23 }, ...]
function _groupConsecutiveRefs(refs) {
  var parsed = refs.map(function(r) {
    var parts = r.split(':');
    return { abbr: parts[0], chapter: parseInt(parts[1], 10), verse: parseInt(parts[2], 10) };
  }).sort(function(a, b) {
    var ak = a.abbr + ':' + String(a.chapter).padStart(4, '0');
    var bk = b.abbr + ':' + String(b.chapter).padStart(4, '0');
    return ak < bk ? -1 : ak > bk ? 1 : a.verse - b.verse;
  });

  var groups = [];
  parsed.forEach(function(p) {
    var last = groups[groups.length - 1];
    if (last && last.abbr === p.abbr && last.chapter === p.chapter && p.verse <= last.endVerse + 2) {
      last.endVerse = p.verse;
    } else {
      groups.push({ abbr: p.abbr, chapter: p.chapter, startVerse: p.verse, endVerse: p.verse });
    }
  });
  return groups;
}

function _resolveAbbrToBook(abbr) {
  return _BOOK_LOOKUP[abbr.toLowerCase().replace(/\s+/g, '')] || null;
}

// ── Content rendering ──
async function _renderBibleContent(refStr) {
  var bodyEl = document.getElementById('bibleSheetBody');
  var relEl = document.getElementById('bibleSheetRelated');
  bodyEl.innerHTML = '<div class="bible-loading">Loading\u2026</div>';
  relEl.innerHTML = '';

  var parsed = _parseRef(refStr);
  if (!parsed) {
    bodyEl.innerHTML = '<p class="bible-error">Unable to parse reference: ' + _esc(refStr) + '</p>';
    return;
  }

  // Load book and xrefs in parallel — xrefs failure is non-fatal
  var bookData;
  try {
    var results = await Promise.all([
      _loadBook(parsed.book.file),
      _loadXrefs()
    ]);
    bookData = results[0];
  } catch (e) {
    bodyEl.innerHTML = '<p class="bible-error">Could not load scripture text.</p>';
    return;
  }

  if (!bookData) {
    bodyEl.innerHTML = '<p class="bible-error">Book not available offline.</p>';
    return;
  }

  // Section context (e.g. "New Testament · Gospel")
  var testamentLabel = parsed.book.testament === 'NT' ? 'New Testament' : 'Old Testament';
  var context = testamentLabel + ' \u00b7 ' + parsed.book.genre;
  var html = '<div class="bible-section-context">' + _esc(context) + '</div>';

  // Reference header
  html += '<div class="bible-ref-header">' + _esc(parsed.book.name) + ' ' + parsed.chapter + ':' + parsed.startVerse;
  if (parsed.endVerse !== parsed.startVerse && parsed.endVerse !== 999) {
    html += '\u2013' + parsed.endVerse;
  }
  html += '</div>';
  html += '<div class="bible-translation-label">Douay-Rheims Bible</div>';

  // Verse text — collect verses in range
  html += '<div class="bible-verse-text">';
  var verseTexts = [];
  var endVerse = parsed.endVerse === 999
    ? (bookData.chapters || 200) * 200  // effectively unlimited for whole-chapter
    : Math.min(parsed.endVerse, parsed.startVerse + 199); // safety cap: max 200 verses

  for (var v = parsed.startVerse; v <= endVerse; v++) {
    var key = parsed.chapter + ':' + v;
    var text = bookData.verses[key];
    if (!text) {
      if (v === parsed.startVerse) break; // first verse not found — chapter/verse doesn't exist
      break; // consecutive gap means end of chapter
    }
    verseTexts.push(text);
    html += '<span class="bible-verse-num">' + v + '</span> ' + _esc(text) + ' ';
  }
  html += '</div>';

  if (!verseTexts.length) {
    html = '<div class="bible-section-context">' + _esc(context) + '</div>'
      + '<div class="bible-ref-header">' + _esc(parsed.book.name) + ' ' + parsed.chapter + ':' + parsed.startVerse + '</div>'
      + '<p class="bible-error">Verse not found in local dataset.</p>';
    bodyEl.innerHTML = html;
    relEl.innerHTML = '';
    _currentRef = refStr;
    return;
  }

  // Listen button (UX-04 — only if speechSynthesis available)
  if ('speechSynthesis' in window) {
    html += '<button class="bible-listen-btn" id="bibleListenBtn" onclick="bibleReadAloud()">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">'
      + '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
      + '<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>'
      + '</svg>'
      + ' <span>Listen</span></button>';
  }

  bodyEl.innerHTML = html;
  bodyEl._verseText = verseTexts.join(' '); // stored for read-aloud

  // Related passages from xrefs
  var relHtml = '';
  if (_xrefs) {
    var relatedRefs = [];
    var checkEnd = Math.min(parsed.endVerse === 999 ? parsed.startVerse : parsed.endVerse, parsed.startVerse + 5);
    for (var rv = parsed.startVerse; rv <= checkEnd; rv++) {
      // xrefs keys use abbr without spaces, e.g. "Matt:26:26" or "1Cor:11:24"
      var xkey = parsed.book.abbr + ':' + parsed.chapter + ':' + rv;
      var xkeyNoSpace = parsed.book.abbr.replace(/\s+/g, '') + ':' + parsed.chapter + ':' + rv;
      var refs = _xrefs[xkey] || _xrefs[xkeyNoSpace] || [];
      refs.forEach(function(r) {
        if (relatedRefs.indexOf(r) < 0) relatedRefs.push(r);
      });
    }

    if (relatedRefs.length) {
      var passages = _groupConsecutiveRefs(relatedRefs);
      relHtml += '<div class="bible-related-section">';
      relHtml += '<div class="bible-related-header">Related Passages</div>';
      passages.slice(0, 12).forEach(function(p) {
        var pBook = _resolveAbbrToBook(p.abbr);
        var label = pBook ? pBook.name : p.abbr;
        var refLabel = label + ' ' + p.chapter + ':' + p.startVerse;
        if (p.endVerse !== p.startVerse) refLabel += '\u2013' + p.endVerse;
        var genre = pBook ? pBook.genre : '';
        relHtml += '<div class="bible-related-item" onclick="bibleNavigate(\'' + _esc(refLabel) + '\')">'
          + '<span class="bible-related-ref">' + _esc(refLabel) + '</span>'
          + (genre ? '<span class="bible-related-genre">' + _esc(genre) + '</span>' : '')
          + '</div>';
      });
      relHtml += '</div>';
    }
  }

  relEl.innerHTML = relHtml;
  document.getElementById('bibleSheetScroll').scrollTop = 0;
  _currentRef = refStr;
}

// ── Crossfade navigation (mirrors ccc.js) ──
function _crossfadeTo(refStr) {
  var scroll = document.getElementById('bibleSheetScroll');
  scroll.style.opacity = '0';
  setTimeout(function() {
    _renderBibleContent(refStr).then(function() {
      scroll.style.opacity = '1';
    });
  }, 150);
}

function bibleNavigate(refStr) {
  _history.push(_currentRef);
  document.getElementById('bibleBackBtn').style.display = 'inline-flex';
  _crossfadeTo(refStr);
}

function bibleGoBack() {
  if (!_history.length) return;
  var prev = _history.pop();
  if (!_history.length) document.getElementById('bibleBackBtn').style.display = 'none';
  _crossfadeTo(prev);
}

// ── Swipe-to-dismiss (mirrors ccc.js) ──
function _initSwipeDismiss() {
  var sheet = document.getElementById('bibleSheet');
  if (!sheet || sheet._swipeInit) return;
  sheet._swipeInit = true;
  var startY = 0;
  var scrollEl = sheet.querySelector('.bible-sheet-scroll');
  sheet.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  sheet.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - startY;
    var atTop = !scrollEl || scrollEl.scrollTop <= 5;
    if (dy > 72 && atTop) closeBible();
  }, { passive: true });
}

// ── Open / Close ──
function openBible(refStr) {
  // Cancel any active speech when opening new reference
  if (_speaking) { speechSynthesis.cancel(); _speaking = false; }
  _history = [];
  document.getElementById('bibleBackBtn').style.display = 'none';
  document.getElementById('bibleOverlay').classList.add('open');
  document.getElementById('bibleSheet').classList.add('open');
  document.body.style.overflow = 'hidden';
  window._lastFocused = document.activeElement;
  _initSwipeDismiss();
  _renderBibleContent(refStr);
  var ui = require('./ui.js');
  ui.trapFocus(document.getElementById('bibleSheet'));
}

function closeBible() {
  if (_speaking) { speechSynthesis.cancel(); _speaking = false; }
  document.getElementById('bibleOverlay').classList.remove('open');
  document.getElementById('bibleSheet').classList.remove('open');
  document.body.style.overflow = '';
  var ui = require('./ui.js');
  ui.releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
}

// ── UX-04: Read Aloud ──
function bibleReadAloud() {
  var bodyEl = document.getElementById('bibleSheetBody');
  var btn = document.getElementById('bibleListenBtn');
  if (_speaking) {
    speechSynthesis.cancel();
    _speaking = false;
    if (btn) btn.classList.remove('speaking');
    return;
  }
  var text = bodyEl ? bodyEl._verseText : '';
  if (!text) return;
  var utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.lang = 'en-US';
  utt.onend = function() {
    _speaking = false;
    var b = document.getElementById('bibleListenBtn');
    if (b) b.classList.remove('speaking');
  };
  speechSynthesis.speak(utt);
  _speaking = true;
  if (btn) btn.classList.add('speaking');
}

module.exports = {
  openBible: openBible,
  closeBible: closeBible,
  bibleNavigate: bibleNavigate,
  bibleGoBack: bibleGoBack,
  bibleReadAloud: bibleReadAloud
};
