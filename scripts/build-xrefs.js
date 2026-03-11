#!/usr/bin/env node
// scripts/build-xrefs.js
// Fetches Bible cross-references from scrollmapper, builds compact JSON.
// Source: scrollmapper/bible_databases sources/extras/cross_references.txt
// License: CC-BY openbible.info (see file header)
// Output: data/bible-xrefs.json
//
// Key format: "Abbr:Chapter:Verse" (e.g., "Matt:26:26")
// Note: Protestant 66-book canon — deuterocanonicals (Tobit, Judith, Wisdom,
//       Sirach, Baruch, 1&2 Maccabees) are not cross-referenced in this dataset.
//
// Usage: node scripts/build-xrefs.js

var fs = require('fs');
var path = require('path');
var https = require('https');

var URL = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras/cross_references.txt';
var OUT = path.join(__dirname, '..', 'data', 'bible-xrefs.json');

// Map scrollmapper OSIS abbreviations → MassFinder abbreviations (from BOOK_META)
// scrollmapper uses Protestant 66-book canon
var ABBR_MAP = {
  'Gen': 'Gen',     'Exod': 'Exod',   'Lev': 'Lev',     'Num': 'Num',
  'Deut': 'Deut',   'Josh': 'Josh',   'Judg': 'Judg',   'Ruth': 'Ruth',
  '1Sam': '1Sam',   '2Sam': '2Sam',   '1Kgs': '1Kgs',   '2Kgs': '2Kgs',
  '1Chr': '1Chr',   '2Chr': '2Chr',   'Ezra': 'Ezra',   'Neh': 'Neh',
  'Esth': 'Esth',   'Job': 'Job',     'Ps': 'Ps',       'Prov': 'Prov',
  'Eccl': 'Eccles', 'Song': 'Song',   'Isa': 'Isa',     'Jer': 'Jer',
  'Lam': 'Lam',     'Ezek': 'Ezek',   'Dan': 'Dan',     'Hos': 'Hos',
  'Joel': 'Joel',   'Amos': 'Amos',   'Obad': 'Obad',   'Jonah': 'Jon',
  'Mic': 'Mic',     'Nah': 'Nah',     'Hab': 'Hab',     'Zeph': 'Zeph',
  'Hag': 'Hag',     'Zech': 'Zech',   'Mal': 'Mal',
  'Matt': 'Matt',   'Mark': 'Mark',   'Luke': 'Luke',   'John': 'John',
  'Acts': 'Acts',   'Rom': 'Rom',     '1Cor': '1Cor',   '2Cor': '2Cor',
  'Gal': 'Gal',     'Eph': 'Eph',     'Phil': 'Phil',   'Col': 'Col',
  '1Thess': '1Thess', '2Thess': '2Thess',
  '1Tim': '1Tim',   '2Tim': '2Tim',   'Titus': 'Titus', 'Phlm': 'Phlm',
  'Heb': 'Heb',     'Jas': 'Jas',     '1Pet': '1Pet',   '2Pet': '2Pet',
  '1John': '1John', '2John': '2John', '3John': '3John', 'Jude': 'Jude',
  'Rev': 'Rev'
};

// Parse a single verse reference like "Gen.1.1" or the first verse of "Gen.1.1-Gen.1.3"
// Returns "Abbr:Ch:Vs" or null if unrecognized
function parseVerseRef(ref) {
  // Handle ranges — take only the first verse
  var clean = ref.split('-')[0].trim();
  var parts = clean.split('.');
  if (parts.length < 3) return null;

  var bookAbbr = parts[0];
  var chapter = parseInt(parts[1], 10);
  var verse = parseInt(parts[2], 10);

  if (isNaN(chapter) || isNaN(verse)) return null;
  var mapped = ABBR_MAP[bookAbbr];
  if (!mapped) return null;

  return mapped + ':' + chapter + ':' + verse;
}

function fetchText(url, callback) {
  https.get(url, { headers: { 'User-Agent': 'MassFinder-Build' } }, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return fetchText(res.headers.location, callback);
    }
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() { callback(null, Buffer.concat(chunks).toString('utf8')); });
    res.on('error', callback);
  }).on('error', callback);
}

function run() {
  console.log('Fetching cross-references...');
  fetchText(URL, function(err, raw) {
    if (err) { console.error('ERROR: ' + err.message); process.exit(1); }

    var lines = raw.split('\n');
    console.log('  ' + lines.length + ' total lines');

    var xrefs = {};
    var parsed = 0;
    var skipped = 0;

    lines.forEach(function(line) {
      line = line.trim();
      // Skip blank lines, comment lines (starting with #), and header line
      if (!line || line.charAt(0) === '#' || line.indexOf('From Verse') === 0) return;

      var cols = line.split('\t');
      if (cols.length < 2) return;

      var fromRef = parseVerseRef(cols[0].trim());
      var toRef = parseVerseRef(cols[1].trim());

      if (!fromRef || !toRef || fromRef === toRef) {
        skipped++;
        return;
      }

      if (!xrefs[fromRef]) xrefs[fromRef] = [];
      if (xrefs[fromRef].indexOf(toRef) < 0) {
        xrefs[fromRef].push(toRef);
        parsed++;
      }
    });

    console.log('  ' + parsed + ' cross-references parsed');
    console.log('  ' + skipped + ' lines skipped (deuterocanonicals, ranges, or unknown)');
    console.log('  ' + Object.keys(xrefs).length + ' source verses with refs');

    // Cap refs per verse at 20 (diminishing returns beyond that)
    var capped = 0;
    Object.keys(xrefs).forEach(function(k) {
      if (xrefs[k].length > 20) {
        capped++;
        xrefs[k] = xrefs[k].slice(0, 20);
      }
    });
    if (capped > 0) console.log('  Capped ' + capped + ' verses at 20 refs max');

    fs.writeFileSync(OUT, JSON.stringify(xrefs), 'utf8');
    var sizeKB = Math.round(fs.statSync(OUT).size / 1024);
    console.log('\nDone. Output: data/bible-xrefs.json (' + sizeKB + 'KB)');
  });
}

run();
