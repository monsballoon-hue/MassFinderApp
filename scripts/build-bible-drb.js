#!/usr/bin/env node
// scripts/build-bible-drb.js — Fetch Douay-Rheims Bible and output per-book JSON
// Source: https://github.com/isaacronan/douay-rheims-json
//
// Usage: node scripts/build-bible-drb.js

var fs = require('fs');
var path = require('path');
var https = require('https');

var OUT_DIR = path.join(__dirname, '..', 'data', 'bible-drb');

var BOOKS_URL = 'https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/books.json';
var VERSES_URL = 'https://raw.githubusercontent.com/isaacronan/douay-rheims-json/master/verses.json';

// DRB archaic names → modern filenames
var NAME_OVERRIDES = {
  'Josue': 'joshua',
  '1 Kings': '1-samuel',
  '2 Kings': '2-samuel',
  '3 Kings': '1-kings',
  '4 Kings': '2-kings',
  '1 Paralipomenon': '1-chronicles',
  '2 Paralipomenon': '2-chronicles',
  '1 Esdras': 'ezra',
  '2 Esdras': 'nehemiah',
  'Canticle of Canticles': 'song-of-solomon',
  'Ecclesiasticus': 'sirach',
  'Osee': 'hosea',
  'Abdias': 'obadiah',
  'Jonas': 'jonah',
  'Micheas': 'micah',
  'Sophonias': 'zephaniah',
  'Aggeus': 'haggai',
  '1 Machabees': '1-maccabees',
  '2 Machabees': '2-maccabees',
  'Apocalypse': 'revelation'
};

function slugify(name) {
  if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];
  return name.toLowerCase().replace(/\s+/g, '-');
}

function fetchJSON(url, callback) {
  console.log('Fetching ' + url + ' ...');
  https.get(url, function(res) {
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() {
      var body = Buffer.concat(chunks).toString('utf8');
      try {
        var data = JSON.parse(body);
        callback(null, data);
      } catch (e) {
        callback(new Error('Failed to parse JSON from ' + url + ': ' + e.message));
      }
    });
    res.on('error', function(err) { callback(err); });
  }).on('error', function(err) { callback(err); });
}

function run() {
  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('Created ' + OUT_DIR);
  }

  // Fetch books first, then verses
  fetchJSON(BOOKS_URL, function(err, books) {
    if (err) {
      console.error('ERROR fetching books: ' + err.message);
      process.exit(1);
    }
    console.log('Fetched ' + books.length + ' books');

    fetchJSON(VERSES_URL, function(err2, verses) {
      if (err2) {
        console.error('ERROR fetching verses: ' + err2.message);
        process.exit(1);
      }
      console.log('Fetched ' + verses.length + ' verses');

      processData(books, verses);
    });
  });
}

function processData(books, verses) {
  // Build a map: booknumber → { name, slug, chapterCount }
  // Use shortname for slug generation (bookname is the full archaic title)
  var bookMap = {};
  books.forEach(function(b) {
    var slug = slugify(b.shortname);
    var chapterCount = b.chapters ? b.chapters.length : 0;
    bookMap[b.booknumber] = {
      name: b.shortname,
      slug: slug,
      chapters: chapterCount
    };
  });

  // Group verses by booknumber
  var versesByBook = {};
  verses.forEach(function(v) {
    var bn = v.booknumber;
    if (!versesByBook[bn]) versesByBook[bn] = {};
    var key = v.chapternumber + ':' + v.versenumber;
    versesByBook[bn][key] = v.text;
  });

  // Write per-book files
  var manifest = [];
  var bookNumbers = Object.keys(bookMap).map(Number).sort(function(a, b) { return a - b; });

  bookNumbers.forEach(function(bn) {
    var info = bookMap[bn];
    var bookVerses = versesByBook[bn] || {};
    var verseCount = Object.keys(bookVerses).length;

    var outPath = path.join(OUT_DIR, info.slug + '.json');
    fs.writeFileSync(outPath, JSON.stringify(bookVerses, null, 2), 'utf8');
    console.log('  ' + info.slug + '.json — ' + info.chapters + ' chapters, ' + verseCount + ' verses');

    manifest.push({
      id: info.slug,
      name: info.name,
      chapters: info.chapters
    });
  });

  // Write manifest
  var indexPath = path.join(OUT_DIR, '_index.json');
  var indexData = { books: manifest };
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
  console.log('\nWrote _index.json with ' + manifest.length + ' books');
  console.log('Done — output in data/bible-drb/');
}

run();
