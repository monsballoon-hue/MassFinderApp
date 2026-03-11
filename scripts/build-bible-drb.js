#!/usr/bin/env node
// scripts/build-bible-drb.js
// Fetches Douay-Rheims Bible from GitHub, splits into per-book JSON files.
// Source: isaacronan/douay-rheims-json (public domain)
// Output: data/bible-drb/*.json (73 files) + data/bible-drb/_index.json
//
// Usage: node scripts/build-bible-drb.js

var fs = require('fs');
var path = require('path');
var https = require('https');

var BOOKS_URL = 'https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/books.json';
var VERSES_URL = 'https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/verses.json';
var OUT_DIR = path.join(__dirname, '..', 'data', 'bible-drb');

// Full 73-book metadata table
// Maps DRB source shortnames → canonical MassFinder names, abbreviations, filenames, testament
var BOOK_META = [
  // OT — Pentateuch
  { src: 'Genesis',              name: 'Genesis',        abbr: 'Gen',    file: 'genesis',         testament: 'OT' },
  { src: 'Exodus',               name: 'Exodus',         abbr: 'Exod',   file: 'exodus',          testament: 'OT' },
  { src: 'Leviticus',            name: 'Leviticus',      abbr: 'Lev',    file: 'leviticus',       testament: 'OT' },
  { src: 'Numbers',              name: 'Numbers',        abbr: 'Num',    file: 'numbers',         testament: 'OT' },
  { src: 'Deuteronomy',          name: 'Deuteronomy',    abbr: 'Deut',   file: 'deuteronomy',     testament: 'OT' },
  // OT — Historical
  { src: 'Josue',                name: 'Joshua',         abbr: 'Josh',   file: 'joshua',          testament: 'OT' },
  { src: 'Judges',               name: 'Judges',         abbr: 'Judg',   file: 'judges',          testament: 'OT' },
  { src: 'Ruth',                 name: 'Ruth',           abbr: 'Ruth',   file: 'ruth',            testament: 'OT' },
  { src: '1 Kings',              name: '1 Samuel',       abbr: '1Sam',   file: '1samuel',         testament: 'OT' },
  { src: '2 Kings',              name: '2 Samuel',       abbr: '2Sam',   file: '2samuel',         testament: 'OT' },
  { src: '3 Kings',              name: '1 Kings',        abbr: '1Kgs',   file: '1kings',          testament: 'OT' },
  { src: '4 Kings',              name: '2 Kings',        abbr: '2Kgs',   file: '2kings',          testament: 'OT' },
  { src: '1 Paralipomenon',      name: '1 Chronicles',   abbr: '1Chr',   file: '1chronicles',     testament: 'OT' },
  { src: '2 Paralipomenon',      name: '2 Chronicles',   abbr: '2Chr',   file: '2chronicles',     testament: 'OT' },
  { src: '1 Esdras',             name: 'Ezra',           abbr: 'Ezra',   file: 'ezra',            testament: 'OT' },
  { src: '2 Esdras',             name: 'Nehemiah',       abbr: 'Neh',    file: 'nehemiah',        testament: 'OT' },
  { src: 'Tobias',               name: 'Tobit',          abbr: 'Tob',    file: 'tobit',           testament: 'OT' },
  { src: 'Judith',               name: 'Judith',         abbr: 'Jdt',    file: 'judith',          testament: 'OT' },
  { src: 'Esther',               name: 'Esther',         abbr: 'Esth',   file: 'esther',          testament: 'OT' },
  { src: '1 Machabees',          name: '1 Maccabees',    abbr: '1Macc',  file: '1maccabees',      testament: 'OT' },
  { src: '2 Machabees',          name: '2 Maccabees',    abbr: '2Macc',  file: '2maccabees',      testament: 'OT' },
  // OT — Wisdom
  { src: 'Job',                  name: 'Job',            abbr: 'Job',    file: 'job',             testament: 'OT' },
  { src: 'Psalms',               name: 'Psalms',         abbr: 'Ps',     file: 'psalms',          testament: 'OT' },
  { src: 'Proverbs',             name: 'Proverbs',       abbr: 'Prov',   file: 'proverbs',        testament: 'OT' },
  { src: 'Ecclesiastes',         name: 'Ecclesiastes',   abbr: 'Eccles', file: 'ecclesiastes',    testament: 'OT' },
  { src: 'Canticle of Canticles',name: 'Song of Solomon',abbr: 'Song',   file: 'songofsolomon',   testament: 'OT' },
  { src: 'Wisdom',               name: 'Wisdom',         abbr: 'Wis',    file: 'wisdom',          testament: 'OT' },
  { src: 'Ecclesiasticus',       name: 'Sirach',         abbr: 'Sir',    file: 'sirach',          testament: 'OT' },
  // OT — Prophets
  { src: 'Isaias',               name: 'Isaiah',         abbr: 'Isa',    file: 'isaiah',          testament: 'OT' },
  { src: 'Jeremias',             name: 'Jeremiah',       abbr: 'Jer',    file: 'jeremiah',        testament: 'OT' },
  { src: 'Lamentations',         name: 'Lamentations',   abbr: 'Lam',    file: 'lamentations',    testament: 'OT' },
  { src: 'Baruch',               name: 'Baruch',         abbr: 'Bar',    file: 'baruch',          testament: 'OT' },
  { src: 'Ezechiel',             name: 'Ezekiel',        abbr: 'Ezek',   file: 'ezekiel',         testament: 'OT' },
  { src: 'Daniel',               name: 'Daniel',         abbr: 'Dan',    file: 'daniel',          testament: 'OT' },
  { src: 'Osee',                 name: 'Hosea',          abbr: 'Hos',    file: 'hosea',           testament: 'OT' },
  { src: 'Joel',                 name: 'Joel',           abbr: 'Joel',   file: 'joel',            testament: 'OT' },
  { src: 'Amos',                 name: 'Amos',           abbr: 'Amos',   file: 'amos',            testament: 'OT' },
  { src: 'Abdias',               name: 'Obadiah',        abbr: 'Obad',   file: 'obadiah',         testament: 'OT' },
  { src: 'Jonas',                name: 'Jonah',          abbr: 'Jon',    file: 'jonah',           testament: 'OT' },
  { src: 'Micheas',              name: 'Micah',          abbr: 'Mic',    file: 'micah',           testament: 'OT' },
  { src: 'Nahum',                name: 'Nahum',          abbr: 'Nah',    file: 'nahum',           testament: 'OT' },
  { src: 'Habacuc',              name: 'Habakkuk',       abbr: 'Hab',    file: 'habakkuk',        testament: 'OT' },
  { src: 'Sophonias',            name: 'Zephaniah',      abbr: 'Zeph',   file: 'zephaniah',       testament: 'OT' },
  { src: 'Aggeus',               name: 'Haggai',         abbr: 'Hag',    file: 'haggai',          testament: 'OT' },
  { src: 'Zacharias',            name: 'Zechariah',      abbr: 'Zech',   file: 'zechariah',       testament: 'OT' },
  { src: 'Malachias',            name: 'Malachi',        abbr: 'Mal',    file: 'malachi',         testament: 'OT' },
  // NT — Gospels & Acts
  { src: 'Matthew',              name: 'Matthew',        abbr: 'Matt',   file: 'matthew',         testament: 'NT' },
  { src: 'Mark',                 name: 'Mark',           abbr: 'Mark',   file: 'mark',            testament: 'NT' },
  { src: 'Luke',                 name: 'Luke',           abbr: 'Luke',   file: 'luke',            testament: 'NT' },
  { src: 'John',                 name: 'John',           abbr: 'John',   file: 'john',            testament: 'NT' },
  { src: 'Acts',                 name: 'Acts',           abbr: 'Acts',   file: 'acts',            testament: 'NT' },
  // NT — Pauline Epistles
  { src: 'Romans',               name: 'Romans',         abbr: 'Rom',    file: 'romans',          testament: 'NT' },
  { src: '1 Corinthians',        name: '1 Corinthians',  abbr: '1Cor',   file: '1corinthians',    testament: 'NT' },
  { src: '2 Corinthians',        name: '2 Corinthians',  abbr: '2Cor',   file: '2corinthians',    testament: 'NT' },
  { src: 'Galatians',            name: 'Galatians',      abbr: 'Gal',    file: 'galatians',       testament: 'NT' },
  { src: 'Ephesians',            name: 'Ephesians',      abbr: 'Eph',    file: 'ephesians',       testament: 'NT' },
  { src: 'Philippians',          name: 'Philippians',    abbr: 'Phil',   file: 'philippians',     testament: 'NT' },
  { src: 'Colossians',           name: 'Colossians',     abbr: 'Col',    file: 'colossians',      testament: 'NT' },
  { src: '1 Thessalonians',      name: '1 Thessalonians',abbr: '1Thess', file: '1thessalonians',  testament: 'NT' },
  { src: '2 Thessalonians',      name: '2 Thessalonians',abbr: '2Thess', file: '2thessalonians',  testament: 'NT' },
  { src: '1 Timothy',            name: '1 Timothy',      abbr: '1Tim',   file: '1timothy',        testament: 'NT' },
  { src: '2 Timothy',            name: '2 Timothy',      abbr: '2Tim',   file: '2timothy',        testament: 'NT' },
  { src: 'Titus',                name: 'Titus',          abbr: 'Titus',  file: 'titus',           testament: 'NT' },
  { src: 'Philemon',             name: 'Philemon',       abbr: 'Phlm',   file: 'philemon',        testament: 'NT' },
  { src: 'Hebrews',              name: 'Hebrews',        abbr: 'Heb',    file: 'hebrews',         testament: 'NT' },
  // NT — Catholic Epistles
  { src: 'James',                name: 'James',          abbr: 'Jas',    file: 'james',           testament: 'NT' },
  { src: '1 Peter',              name: '1 Peter',        abbr: '1Pet',   file: '1peter',          testament: 'NT' },
  { src: '2 Peter',              name: '2 Peter',        abbr: '2Pet',   file: '2peter',          testament: 'NT' },
  { src: '1 John',               name: '1 John',         abbr: '1John',  file: '1john',           testament: 'NT' },
  { src: '2 John',               name: '2 John',         abbr: '2John',  file: '2john',           testament: 'NT' },
  { src: '3 John',               name: '3 John',         abbr: '3John',  file: '3john',           testament: 'NT' },
  { src: 'Jude',                 name: 'Jude',           abbr: 'Jude',   file: 'jude',            testament: 'NT' },
  // NT — Apocalypse
  { src: 'Apocalypse',           name: 'Revelation',     abbr: 'Rev',    file: 'revelation',      testament: 'NT' }
];

// Build lookup: DRB source shortname → BOOK_META entry
var META_BY_SRC = {};
BOOK_META.forEach(function(m) { META_BY_SRC[m.src] = m; });

function fetchJSON(url, callback) {
  https.get(url, { headers: { 'User-Agent': 'MassFinder-Build' } }, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return fetchJSON(res.headers.location, callback);
    }
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() {
      var body = Buffer.concat(chunks).toString('utf8');
      try {
        callback(null, JSON.parse(body));
      } catch (e) {
        callback(new Error('JSON parse failed from ' + url + ': ' + e.message));
      }
    });
    res.on('error', callback);
  }).on('error', callback);
}

function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('Created ' + OUT_DIR);
  }

  console.log('Fetching books.json...');
  fetchJSON(BOOKS_URL, function(err, books) {
    if (err) { console.error('ERROR: ' + err.message); process.exit(1); }
    console.log('  ' + books.length + ' books');

    console.log('Fetching verses.json (~3MB, may take a moment)...');
    fetchJSON(VERSES_URL, function(err2, verses) {
      if (err2) { console.error('ERROR: ' + err2.message); process.exit(1); }
      console.log('  ' + verses.length + ' verses');
      processData(books, verses);
    });
  });
}

function processData(books, verses) {
  // Build booknumber → DRB shortname map
  var bookNumToSrc = {};
  books.forEach(function(b) {
    bookNumToSrc[b.booknumber] = b.shortname;
  });

  // Build booknumber → chapter count map
  var bookNumToChapters = {};
  books.forEach(function(b) {
    bookNumToChapters[b.booknumber] = b.chapters ? b.chapters.length : 0;
  });

  // Group verses by booknumber
  var versesByBook = {};
  verses.forEach(function(v) {
    var bn = v.booknumber;
    if (!versesByBook[bn]) versesByBook[bn] = {};
    versesByBook[bn][v.chapternumber + ':' + v.versenumber] = v.text;
  });

  // Write per-book files using BOOK_META canonical names/files
  var manifest = [];
  var totalBooks = 0;
  var totalVerses = 0;

  // Process in canonical BOOK_META order
  BOOK_META.forEach(function(meta) {
    // Find the booknumber for this source name
    var bn = null;
    Object.keys(bookNumToSrc).forEach(function(num) {
      if (bookNumToSrc[num] === meta.src) bn = Number(num);
    });

    if (bn === null) {
      console.warn('  WARNING: Could not find booknumber for "' + meta.src + '" — skipping');
      return;
    }

    var bookVerses = versesByBook[bn] || {};
    var verseCount = Object.keys(bookVerses).length;
    var chapters = bookNumToChapters[bn] || 0;

    var output = {
      book: meta.name,
      abbr: meta.abbr,
      testament: meta.testament,
      chapters: chapters,
      verses: bookVerses
    };

    var outPath = path.join(OUT_DIR, meta.file + '.json');
    fs.writeFileSync(outPath, JSON.stringify(output), 'utf8');
    totalVerses += verseCount;
    totalBooks++;

    console.log('  ' + meta.file + '.json — ' + chapters + ' ch, ' + verseCount + ' verses');

    manifest.push({
      id: meta.file,
      name: meta.name,
      abbr: meta.abbr,
      testament: meta.testament,
      chapters: chapters
    });
  });

  // Delete old legacy files (hyphenated or archaic names) that are no longer used
  var legacyFiles = [
    '1-samuel.json', '2-samuel.json', '1-kings.json', '2-kings.json',
    '1-chronicles.json', '2-chronicles.json', '1-maccabees.json', '2-maccabees.json',
    '1-corinthians.json', '2-corinthians.json', '1-thessalonians.json', '2-thessalonians.json',
    '1-timothy.json', '2-timothy.json', '1-peter.json', '2-peter.json',
    '1-john.json', '2-john.json', '3-john.json',
    'song-of-solomon.json',
    'isaias.json', 'jeremias.json', 'ezechiel.json', 'habacuc.json',
    'zacharias.json', 'malachias.json', 'tobias.json'
  ];
  var deleted = 0;
  legacyFiles.forEach(function(f) {
    var p = path.join(OUT_DIR, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      deleted++;
    }
  });
  if (deleted > 0) console.log('\nDeleted ' + deleted + ' legacy files');

  // Write _index.json
  var indexPath = path.join(OUT_DIR, '_index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ books: manifest }), 'utf8');
  console.log('\nWrote _index.json with ' + manifest.length + ' books');
  console.log('Total: ' + totalBooks + ' books, ' + totalVerses + ' verses');
  console.log('Done — output in data/bible-drb/');
}

run();
