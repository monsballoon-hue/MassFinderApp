// src/bible.js — Scripture reader module (Reading Room)
// Universal reader module with full chapter rendering,
// chapter/book pickers, sequential navigation, and collapsible cross-references.
// Loads data/bible-drb/[book].json (lazy, per-book) + data/bible-xrefs.json (lazy, once).

var reader = require('./reader.js');

var _bookCache = {};    // { 'matthew': { book, abbr, testament, chapters, verses } }
var _xrefs = null;      // bible-xrefs.json data (null until first load)
var _currentRef = '';
var _currentBook = null; // current book object from _BOOKS
var _bookChapters = null; // { filename: chapterCount } from _index.json
var _speaking = false;  // UX-04 Web Speech state

// ── 73-book metadata ──
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
    _BOOK_LOOKUP[k.toLowerCase()] = b;
  });
});

// ── Reference parser ──
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
    .catch(function() { _xrefs = {}; });
}

function _loadIndex() {
  if (_bookChapters) return Promise.resolve();
  return fetch('/data/bible-drb/_index.json')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      _bookChapters = {};
      (d.books || []).forEach(function(b) { _bookChapters[b.id] = b.chapters; });
    })
    .catch(function() { _bookChapters = {}; });
}

// ── Helpers ──
function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _getBookIndex(book) {
  for (var i = 0; i < _BOOKS.length; i++) {
    if (_BOOKS[i].file === book.file) return i;
  }
  return -1;
}

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

// ── Picker toggles (BR-03, BR-05) ──
function _toggleChapterPicker() {
  var grid = document.getElementById('bibleChapterGrid');
  var bookGrid = document.getElementById('bibleBookPicker');
  if (bookGrid) bookGrid.style.display = 'none';
  if (grid) grid.style.display = grid.style.display === 'none' ? '' : 'none';
}

function _toggleBookPicker() {
  var panel = document.getElementById('bibleBookPicker');
  var chGrid = document.getElementById('bibleChapterGrid');
  if (chGrid) chGrid.style.display = 'none';
  if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

window._toggleChapterPicker = _toggleChapterPicker;
window._toggleBookPicker = _toggleBookPicker;

// ── Reader module registration ──
reader.registerModule('bible', {
  getTitle: function(params) {
    var parsed = _parseRef(params.ref);
    if (!parsed) return 'Scripture';
    return parsed.book.name;
  },
  render: function(params, bodyEl, footerEl) {
    // Create wrapper divs inside bodyEl for _renderBibleContent to target
    bodyEl.innerHTML = '<div id="bibleSheetBody"></div><div id="bibleSheetRelated"></div>';
    footerEl.style.display = 'none';
    _renderBibleContent(params.ref);
  },
  onClose: function() {
    // Cancel speech on close
    if (_speaking) {
      speechSynthesis.cancel();
      _speaking = false;
    }
  }
});

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

  // Load book, xrefs, and index in parallel — xrefs/index failures are non-fatal
  var bookData;
  try {
    var results = await Promise.all([
      _loadBook(parsed.book.file),
      _loadXrefs(),
      _loadIndex()
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

  _currentBook = parsed.book;
  var isWholeChapter = (parsed.endVerse === 999);

  // Section context (e.g. "New Testament · Gospel")
  var testamentLabel = parsed.book.testament === 'NT' ? 'New Testament' : 'Old Testament';
  var context = testamentLabel + ' \u00b7 ' + parsed.book.genre;
  var html = '<div class="bible-section-context">' + _esc(context) + '</div>';

  // ── BR-03/BR-05: Reference header with book + chapter picker buttons ──
  var chevronSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>';

  html += '<div class="bible-ref-header">'
    + '<button class="bible-book-picker-btn" onclick="_toggleBookPicker()">'
    + _esc(parsed.book.name) + ' ' + chevronSvg + '</button> '
    + '<button class="bible-chapter-picker-btn" onclick="_toggleChapterPicker()">';
  if (isWholeChapter) {
    html += parsed.chapter;
  } else {
    html += parsed.chapter + ':' + parsed.startVerse;
    if (parsed.endVerse !== parsed.startVerse) html += '\u2013' + parsed.endVerse;
  }
  html += ' ' + chevronSvg + '</button></div>';
  html += '<div class="bible-translation-label">Douay-Rheims Bible</div>';

  // ── BR-05: Book picker panel (hidden) ──
  html += '<div class="bible-book-picker" id="bibleBookPicker" style="display:none">';
  var currentGenre = '';
  _BOOKS.forEach(function(b) {
    var genre = b.testament + ' \u00b7 ' + b.genre;
    if (genre !== currentGenre) {
      if (currentGenre) html += '</div>';
      currentGenre = genre;
      html += '<div class="bible-genre-label">' + _esc(genre) + '</div><div class="bible-book-list">';
    }
    var active = b.file === parsed.book.file ? ' bible-book-active' : '';
    html += '<button class="bible-book-btn' + active + '" onclick="bibleNavigate(\'' + _esc(b.name + ' 1') + '\')">' + _esc(b.name) + '</button>';
  });
  html += '</div></div>';

  // ── BR-03: Chapter picker grid (hidden) ──
  html += '<div class="bible-chapter-grid" id="bibleChapterGrid" style="display:none">';
  for (var ch = 1; ch <= bookData.chapters; ch++) {
    var activeClass = ch === parsed.chapter ? ' bible-ch-active' : '';
    html += '<button class="bible-ch-btn' + activeClass + '" onclick="bibleNavigate(\'' + _esc(parsed.book.name + ' ' + ch) + '\')">' + ch + '</button>';
  }
  html += '</div>';

  // ── BR-01: Full chapter rendering with target verse highlight ──
  html += '<div class="bible-verse-text">';
  var verseTexts = [];
  for (var v = 1; v <= 999; v++) {
    var key = parsed.chapter + ':' + v;
    var text = bookData.verses[key];
    if (!text) {
      if (v === 1) break;
      break;
    }
    verseTexts.push(text);
    var isTarget = !isWholeChapter && v >= parsed.startVerse && v <= parsed.endVerse;
    var cls = isTarget ? ' bible-verse--target' : '';
    html += '<span class="bible-verse' + cls + '" id="bv' + v + '">'
      + '<span class="bible-verse-num">' + v + '</span> '
      + _esc(text) + ' '
      + '</span>';
  }
  html += '</div>';

  if (!verseTexts.length) {
    html = '<div class="bible-section-context">' + _esc(context) + '</div>'
      + '<div class="bible-ref-header">' + _esc(parsed.book.name) + ' ' + parsed.chapter + '</div>'
      + '<p class="bible-error">Chapter not found in local dataset.</p>';
    bodyEl.innerHTML = html;
    relEl.innerHTML = '';
    _currentRef = refStr;
    return;
  }

  // Listen button (UX-04)
  if ('speechSynthesis' in window) {
    html += '<button class="bible-listen-btn" id="bibleListenBtn" onclick="bibleReadAloud()">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">'
      + '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
      + '<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>'
      + '</svg>'
      + ' <span>Listen</span></button>';
  }

  // ── BR-02: Chapter navigation (prev/next) ──
  var bookIdx = _getBookIndex(parsed.book);
  var prevRef = null, nextRef = null;
  var prevLabel = '', nextLabel = '';

  if (parsed.chapter > 1) {
    prevRef = parsed.book.name + ' ' + (parsed.chapter - 1);
    prevLabel = 'Chapter ' + (parsed.chapter - 1);
  } else if (bookIdx > 0) {
    var prevBook = _BOOKS[bookIdx - 1];
    var prevChapters = _bookChapters ? _bookChapters[prevBook.file] : null;
    if (prevChapters) {
      prevRef = prevBook.name + ' ' + prevChapters;
      prevLabel = prevBook.name;
    }
  }

  if (parsed.chapter < bookData.chapters) {
    nextRef = parsed.book.name + ' ' + (parsed.chapter + 1);
    nextLabel = 'Chapter ' + (parsed.chapter + 1);
  } else if (bookIdx < _BOOKS.length - 1) {
    var nextBook = _BOOKS[bookIdx + 1];
    nextRef = nextBook.name + ' 1';
    nextLabel = nextBook.name;
  }

  html += '<div class="bible-chapter-nav">';
  if (prevRef) {
    html += '<button class="bible-nav-btn" onclick="bibleNavigate(\'' + _esc(prevRef) + '\')">'
      + '<span class="bible-nav-arrow">\u2190</span>'
      + '<span class="bible-nav-label">' + _esc(prevLabel) + '</span>'
      + '</button>';
  } else {
    html += '<div class="bible-nav-spacer"></div>';
  }
  html += '<span class="bible-nav-pos">' + _esc(parsed.book.name) + ' ' + parsed.chapter + ' of ' + bookData.chapters + '</span>';
  if (nextRef) {
    html += '<button class="bible-nav-btn" onclick="bibleNavigate(\'' + _esc(nextRef) + '\')">'
      + '<span class="bible-nav-label">' + _esc(nextLabel) + '</span>'
      + '<span class="bible-nav-arrow">\u2192</span>'
      + '</button>';
  } else {
    html += '<div class="bible-nav-spacer"></div>';
  }
  html += '</div>';

  // SLV-02: LORD → small-caps (typographic convention)
  html = html.replace(/\bLORD\b/g, '<span class="sc">LORD</span>');
  bodyEl.innerHTML = html;
  bodyEl._verseText = verseTexts.join(' ');

  // ── BR-04: Cross-references as collapsible margin notes ──
  var relHtml = '';
  if (_xrefs) {
    var relatedRefs = [];
    var checkEnd = Math.min(isWholeChapter ? 5 : parsed.endVerse, parsed.startVerse + 5);
    for (var rv = parsed.startVerse; rv <= checkEnd; rv++) {
      var xkey = parsed.book.abbr + ':' + parsed.chapter + ':' + rv;
      var xkeyNoSpace = parsed.book.abbr.replace(/\s+/g, '') + ':' + parsed.chapter + ':' + rv;
      var refs = _xrefs[xkey] || _xrefs[xkeyNoSpace] || [];
      refs.forEach(function(r) {
        var ref = Array.isArray(r) ? r[0] : r;
        if (relatedRefs.indexOf(ref) < 0) relatedRefs.push(ref);
      });
    }

    if (relatedRefs.length) {
      var passages = _groupConsecutiveRefs(relatedRefs);
      relHtml += '<details class="bible-refs-section">'
        + '<summary class="bible-refs-summary">Cross-References <span class="bible-refs-count">' + passages.length + '</span></summary>'
        + '<div class="bible-refs-body">';
      passages.forEach(function(p) {
        var pBook = _resolveAbbrToBook(p.abbr);
        var label = pBook ? pBook.name : p.abbr;
        var refLabel = label + ' ' + p.chapter + ':' + p.startVerse;
        if (p.endVerse !== p.startVerse) refLabel += '\u2013' + p.endVerse;
        var genre = pBook ? pBook.genre : '';
        relHtml += '<div class="bible-related-item" onclick="bibleNavigate(\'' + _esc(refLabel) + '\')">'
          + '<span class="bible-related-ref">' + _esc(refLabel) + '</span>'
          + (genre ? ' <span class="bible-related-genre">' + _esc(genre) + '</span>' : '')
          + '</div>';
      });
      relHtml += '</div></details>';
    }
  }

  // Explore button — reader handles switching, no need to close first
  relHtml += '<button class="bible-explore-btn" onclick="_openExploreFromBible(\'' + _esc(refStr).replace(/'/g, '\\\'') + '\')">Explore connections \u203A</button>';

  relEl.innerHTML = relHtml;

  // Scroll: target verse or top — use readerBody as scroll container
  var scrollContainer = document.getElementById('readerBody');
  if (!isWholeChapter) {
    setTimeout(function() {
      var targetEl = document.getElementById('bv' + parsed.startVerse);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } else if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }

  _currentRef = refStr;
}

// ── Open / Close — delegate to reader ──
function openBible(refStr) {
  if (_speaking) { speechSynthesis.cancel(); _speaking = false; }
  reader.readerOpen('bible', { ref: refStr });
}

function closeBible() {
  reader.readerClose();
}

// ── Navigation — delegate to reader stack ──
function bibleNavigate(refStr) {
  reader.readerOpen('bible', { ref: refStr });
}

function bibleGoBack() {
  reader.readerBack();
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

// Open Explore from Bible — reader stack handles cross-module navigation
function _openExploreFromBible(refStr) {
  reader.readerOpen('explore', { type: 'bible', id: refStr });
}
window._openExploreFromBible = _openExploreFromBible;

module.exports = {
  openBible: openBible,
  closeBible: closeBible,
  bibleNavigate: bibleNavigate,
  bibleGoBack: bibleGoBack,
  bibleReadAloud: bibleReadAloud,
  // Shared helpers for snippet.js
  parseRef: _parseRef,
  loadBook: _loadBook,
  getBookCached: function(filename) { return _bookCache[filename] || null; },
};
