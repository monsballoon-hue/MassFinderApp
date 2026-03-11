// scripts/build-bible-cpdv.js
// Fetches the Catholic Public Domain Version (CPDV) Bible from
// https://github.com/FBIAgent05/Bible-CPDV and outputs per-book JSON
// files to data/bible-cpdv/ with chapter:verse keying.
//
// Run once: node scripts/build-bible-cpdv.js
// Output:   data/bible-cpdv/<book>.json  +  data/bible-cpdv/_index.json

var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

// ── Fetch helpers ──────────────────────────────────────────────────────────

function fetchText(url, redirectCount) {
  redirectCount = redirectCount || 0;
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var mod = parsed.protocol === 'https:' ? https : http;
    var opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'MassFinder-BuildScript/1.0',
        'Accept': 'application/json, */*'
      }
    };
    var req = mod.get(opts, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks).toString('utf8')); });
    });
    req.on('error', reject);
    req.end();
  });
}

function repairJson(text) {
  // Some CPDV files (Sirach, Lamentations) have malformed JSON:
  // "{\n},\n\n   "P": { ... }, "1": { ... } }"
  // This is two concatenated objects. Strip the leading empty object.
  var trimmed = text.trim();
  if (trimmed.indexOf('{') === 0) {
    var closeBrace = trimmed.indexOf('},');
    if (closeBrace !== -1 && closeBrace < 10) {
      // Check that everything between { and }, is whitespace
      var between = trimmed.substring(1, closeBrace).trim();
      if (between === '') {
        trimmed = '{' + trimmed.substring(closeBrace + 2);
      }
    }
  }
  return trimmed;
}

function fetchJson(url) {
  return fetchText(url).then(function(text) {
    var fixed = repairJson(text);
    try { return JSON.parse(fixed); }
    catch (e) { throw new Error('JSON parse error for ' + url + ': ' + e.message); }
  });
}

function delay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ── Book definitions ───────────────────────────────────────────────────────

// Each entry: [sourceFilename (without .json), outputSlug, displayName]
// Slug naming matches the DRB convention used elsewhere in the app.

var OT_BOOKS = [
  ['OT-01_Genesis',       'genesis',          'Genesis'],
  ['OT-02_Exodus',        'exodus',           'Exodus'],
  ['OT-03_Leviticus',     'leviticus',        'Leviticus'],
  ['OT-04_Numbers',       'numbers',          'Numbers'],
  ['OT-05_Deuteronomy',   'deuteronomy',      'Deuteronomy'],
  ['OT-06_Joshua',        'joshua',           'Joshua'],
  ['OT-07_Judges',        'judges',           'Judges'],
  ['OT-08_Ruth',          'ruth',             'Ruth'],
  ['OT-09_1-Samuel',      '1-samuel',         '1 Samuel'],
  ['OT-10_2-Samuel',      '2-samuel',         '2 Samuel'],
  ['OT-11_1-Kings',       '1-kings',          '1 Kings'],
  ['OT-12_2-Kings',       '2-kings',          '2 Kings'],
  ['OT-13_1-Chronicles',  '1-chronicles',     '1 Chronicles'],
  ['OT-14_2-Chronicles',  '2-chronicles',     '2 Chronicles'],
  ['OT-15_Ezra',          'ezra',             'Ezra'],
  ['OT-16_Nehemiah',      'nehemiah',         'Nehemiah'],
  ['OT-17_Tobit',         'tobit',            'Tobit'],
  ['OT-18_Judith',        'judith',           'Judith'],
  ['OT-19_Esther',        'esther',           'Esther'],
  ['OT-20_Job',           'job',              'Job'],
  ['OT-21_Psalms',        'psalms',           'Psalms'],
  ['OT-22_Proverbs',      'proverbs',         'Proverbs'],
  ['OT-23_Ecclesiastes',  'ecclesiastes',     'Ecclesiastes'],
  ['OT-24_Song2',         'song-of-solomon',  'Song of Solomon'],
  ['OT-25_Wisdom',        'wisdom',           'Wisdom'],
  ['OT-26_Sirach',        'sirach',           'Sirach'],
  ['OT-27_Isaiah',        'isaiah',           'Isaiah'],
  ['OT-28_Jeremiah',      'jeremiah',         'Jeremiah'],
  ['OT-29_Lamentations',  'lamentations',     'Lamentations'],
  ['OT-30_Baruch',        'baruch',           'Baruch'],
  ['OT-31_Ezekiel',       'ezekiel',         'Ezekiel'],
  ['OT-32_Daniel',        'daniel',           'Daniel'],
  ['OT-33_Hosea',         'hosea',            'Hosea'],
  ['OT-34_Joel',          'joel',             'Joel'],
  ['OT-35_Amos',          'amos',             'Amos'],
  ['OT-36_Obadiah',       'obadiah',          'Obadiah'],
  ['OT-37_Jonah',         'jonah',            'Jonah'],
  ['OT-38_Micah',         'micah',            'Micah'],
  ['OT-39_Nahum',         'nahum',            'Nahum'],
  ['OT-40_Habakkuk',      'habakkuk',         'Habakkuk'],
  ['OT-41_Zephaniah',     'zephaniah',        'Zephaniah'],
  ['OT-42_Haggai',        'haggai',           'Haggai'],
  ['OT-43_Zechariah',     'zechariah',        'Zechariah'],
  ['OT-44_Malachi',       'malachi',          'Malachi'],
  ['OT-45_1-Maccabees',   '1-maccabees',      '1 Maccabees'],
  ['OT-46_2-Maccabees',   '2-maccabees',      '2 Maccabees']
];

var NT_BOOKS = [
  ['NT-01_Matthew',          'matthew',          'Matthew'],
  ['NT-02_Mark',             'mark',             'Mark'],
  ['NT-03_Luke',             'luke',             'Luke'],
  ['NT-04_John',             'john',             'John'],
  ['NT-05_Acts',             'acts',             'Acts'],
  ['NT-06_Romans',           'romans',           'Romans'],
  ['NT-07_1-Corinthians',    '1-corinthians',    '1 Corinthians'],
  ['NT-08_2-Corinthians',    '2-corinthians',    '2 Corinthians'],
  ['NT-09_Galatians',        'galatians',        'Galatians'],
  ['NT-10_Ephesians',        'ephesians',        'Ephesians'],
  ['NT-11_Philippians',      'philippians',      'Philippians'],
  ['NT-12_Colossians',       'colossians',       'Colossians'],
  ['NT-13_1-Thessalonians',  '1-thessalonians',  '1 Thessalonians'],
  ['NT-14_2-Thessalonians',  '2-thessalonians',  '2 Thessalonians'],
  ['NT-15_1-Timothy',        '1-timothy',        '1 Timothy'],
  ['NT-16_2-Timothy',        '2-timothy',        '2 Timothy'],
  ['NT-17_Titus',            'titus',            'Titus'],
  ['NT-18_Philemon',         'philemon',         'Philemon'],
  ['NT-19_Hebrews',          'hebrews',          'Hebrews'],
  ['NT-20_James',            'james',            'James'],
  ['NT-21_1-Peter',          '1-peter',          '1 Peter'],
  ['NT-22_2-Peter',          '2-peter',          '2 Peter'],
  ['NT-23_1-John',           '1-john',           '1 John'],
  ['NT-24_2-John',           '2-john',           '2 John'],
  ['NT-25_3-John',           '3-john',           '3 John'],
  ['NT-26_Jude',             'jude',             'Jude'],
  ['NT-27_Revelation',       'revelation',       'Revelation']
];

var ALL_BOOKS = OT_BOOKS.concat(NT_BOOKS);

// ── Paths ──────────────────────────────────────────────────────────────────

var BASE_URL = 'https://raw.githubusercontent.com/FBIAgent05/Bible-CPDV/main/json/';
var OUT_DIR = path.join(__dirname, '..', 'data', 'bible-cpdv');

// ── Transform source format to chapter:verse flat map ──────────────────────

function transformBook(sourceData) {
  var result = {};
  var chapterCount = 0;
  // Filter to numeric chapter keys only (skip prologues like "P")
  var chapterKeys = Object.keys(sourceData).filter(function(k) {
    return /^\d+$/.test(k);
  }).sort(function(a, b) {
    return parseInt(a, 10) - parseInt(b, 10);
  });
  chapterKeys.forEach(function(ch) {
    var verses = sourceData[ch];
    var verseKeys = Object.keys(verses).filter(function(k) {
      return /^\d+$/.test(k);
    }).sort(function(a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    });
    verseKeys.forEach(function(v) {
      result[ch + ':' + v] = verses[v];
    });
    chapterCount++;
  });
  return { verses: result, chapters: chapterCount };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('Created ' + OUT_DIR);
  }

  var index = { books: [] };
  var total = ALL_BOOKS.length;
  var processed = 0;
  var errors = [];

  function processNext() {
    if (processed >= total) {
      // Write index
      var indexPath = path.join(OUT_DIR, '_index.json');
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
      console.log('\nWrote ' + indexPath);
      console.log('Done: ' + (total - errors.length) + '/' + total + ' books processed.');
      if (errors.length > 0) {
        console.log('Errors:');
        errors.forEach(function(e) { console.log('  ' + e); });
        process.exit(1);
      }
      return Promise.resolve();
    }

    var entry = ALL_BOOKS[processed];
    var sourceFile = entry[0];
    var slug = entry[1];
    var displayName = entry[2];
    var url = BASE_URL + sourceFile + '.json';

    processed++;
    console.log('[' + processed + '/' + total + '] Fetching ' + displayName + '...');

    return fetchJson(url)
      .then(function(data) {
        var result = transformBook(data);
        var outPath = path.join(OUT_DIR, slug + '.json');
        fs.writeFileSync(outPath, JSON.stringify(result.verses));
        index.books.push({
          id: slug,
          name: displayName,
          chapters: result.chapters
        });
        console.log('       → ' + slug + '.json (' + result.chapters + ' chapters, ' + Object.keys(result.verses).length + ' verses)');
      })
      .catch(function(err) {
        errors.push(displayName + ': ' + err.message);
        console.log('       ✗ ERROR: ' + err.message);
      })
      .then(function() {
        return delay(300);
      })
      .then(processNext);
  }

  return processNext();
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
