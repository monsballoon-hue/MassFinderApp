// scripts/build-ccc-footnotes.js
// Extracts CCC footnote/source citations from nossbigg/catechism-ccc-json v0.0.2.
// Maps footnote numbers to the CCC paragraph they appear in, and categorizes
// each citation as scripture, church_father, council, or other.
//
// Run once: node scripts/build-ccc-footnotes.js
// Output:   data/ccc-footnotes.json

var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

// ── Fetch helpers ──────────────────────────────────────────────────────────

function fetchJSON(url, redirectCount) {
  redirectCount = redirectCount || 0;
  if (redirectCount > 10) return Promise.reject(new Error('Too many redirects'));
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var mod = parsed.protocol === 'https:' ? https : http;
    var opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'MassFinder-BuildScript/1.0',
        'Accept': 'application/json, application/octet-stream, */*'
      }
    };
    var req = mod.get(opts, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

// ── Citation classification ────────────────────────────────────────────────

// Known Church Fathers and Doctors
var CHURCH_FATHERS = [
  'St. Ambrose', 'St. Augustine', 'St. Athanasius', 'St. Basil',
  'St. John Chrysostom', 'St. John Damascene', 'St. Jerome', 'St. Gregory',
  'St. Cyril', 'St. Hilary', 'St. Irenaeus', 'St. Clement',
  'St. Leo the Great', 'St. Thomas Aquinas', 'St. Anselm',
  'St. Bonaventure', 'St. Bernard', 'St. Bede', 'St. Maximus',
  'St. Ignatius', 'St. Justin', 'St. Cyprian', 'St. Fulgentius',
  'St. Caesaria', 'Tertullian', 'Origen', 'St. Peter Chrysologus',
  'St. Ephraem', 'St. Therese', 'St. Teresa', 'St. Francis',
  'St. Catherine', 'St. Dominic', 'St. Rose', 'St. Joan',
  'St. Elizabeth', 'Newman'
];

// Bible book abbreviations for detecting scripture refs
var BIBLE_BOOKS = [
  'Gen', 'Ex', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth',
  '1 Sam', '2 Sam', '1 Kings', '2 Kings', '1 Chron', '2 Chron',
  'Ezra', 'Neh', 'Tob', 'Jdt', 'Esth', 'Job', 'Ps', 'Prov',
  'Eccl', 'Song', 'Wis', 'Sir', 'Isa', 'Jer', 'Lam', 'Bar',
  'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad', 'Jon', 'Mic',
  'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
  '1 Macc', '2 Macc', 'Mt', 'Mk', 'Lk', 'Jn', 'Acts',
  'Rom', 'Cor', '1 Cor', '2 Cor', 'Gal', 'Eph', 'Phil', 'Col',
  '1 Thess', '2 Thess', '1 Tim', '2 Tim', 'Tit', 'Philem',
  'Heb', 'Jas', '1 Pet', '2 Pet', '1 Jn', '2 Jn', '3 Jn',
  'Jude', 'Rev'
];

// Council/magisterial document abbreviations
var COUNCIL_DOCS = [
  'LG', 'GS', 'DV', 'SC', 'AG', 'AA', 'PO', 'OT', 'PC', 'CD',
  'UR', 'OE', 'IM', 'GE', 'NA', 'DH', 'Ad gentes',
  'DS', 'CIC', 'CCEO', 'CDF', 'DCG', 'CT', 'EN', 'FC',
  'MD', 'RH', 'RP', 'SRS', 'CA', 'VS', 'EV', 'FR',
  'Council of Trent', 'Vatican Council', 'Lateran Council',
  'Nicaea', 'Constantinople', 'Chalcedon', 'Ephesus'
];

function classifyCitation(text) {
  if (!text) return 'other';
  var cleaned = text.replace(/^⇒\s*/, '').trim();

  // Check for scripture: starts with a Bible book abbreviation or has chapter:verse pattern
  for (var i = 0; i < BIBLE_BOOKS.length; i++) {
    if (cleaned.indexOf(BIBLE_BOOKS[i]) === 0 ||
        cleaned.indexOf('cf. ' + BIBLE_BOOKS[i]) === 0) {
      return 'scripture';
    }
  }
  // Catch patterns like "1 Cor 12:4" or "cf. Rom 8:28"
  if (/^(cf\.\s+)?\d?\s*[A-Z][a-z]+\s+\d+[,:]\d+/.test(cleaned)) return 'scripture';

  // Check for Church Fathers
  for (var j = 0; j < CHURCH_FATHERS.length; j++) {
    if (cleaned.indexOf(CHURCH_FATHERS[j]) !== -1) return 'church_father';
  }
  // Patristic citations often have PG/PL (Patrologia Graeca/Latina) references
  if (/\bPG\b/.test(cleaned) || /\bPL\b/.test(cleaned)) return 'church_father';
  if (/\bDe fide\b/.test(cleaned) || /\bContra\b/.test(cleaned)) return 'church_father';

  // Check for council/magisterial documents
  for (var k = 0; k < COUNCIL_DOCS.length; k++) {
    if (cleaned.indexOf(COUNCIL_DOCS[k]) !== -1) return 'council';
  }

  // Liturgical books
  if (/Roman Missal|Roman Catechism|Catech\. R\.|Liturgy of the Hours/.test(cleaned)) return 'liturgical';

  return 'other';
}

function parseCitation(text) {
  if (!text) return { ref: text, type: 'other' };
  var cleaned = text.replace(/^⇒\s*/, '').replace(/\.\s*$/, '').trim();
  var type = classifyCitation(text);

  var result = { type: type, ref: cleaned };

  if (type === 'church_father') {
    // Try to extract source name and work
    // Pattern: "St. John Damascene, De fide orth. 4, 2: PG 94, 1104C"
    var match = cleaned.match(/^((?:St\.\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(.*)/);
    if (match) {
      result.source = match[1];
      result.work = match[2];
    }
  }

  return result;
}

// ── Main build ─────────────────────────────────────────────────────────────

var SOURCE_URL = 'https://github.com/nossbigg/catechism-ccc-json/releases/download/v0.0.2/ccc.json';

async function build() {
  console.log('Fetching nossbigg/catechism-ccc-json v0.0.2...');
  var data = await fetchJSON(SOURCE_URL);
  console.log('  Loaded. page_nodes: ' + Object.keys(data.page_nodes).length + ' sections');

  // Step 1: Walk all sections. Use each section's OWN footnotes lookup
  // (footnote numbers are NOT globally unique — they can repeat across sections)
  var paraFootnotes = {}; // { "663": [ { num, type, ref, source?, work? } ] }
  var fnCount = 0;

  Object.keys(data.page_nodes).forEach(function(key) {
    var node = data.page_nodes[key];
    if (!node.paragraphs) return;

    // This section's footnote lookup (keyed by footnote number)
    var sectionFn = node.footnotes || {};

    var currentParaNum = null;
    var currentRefs = [];

    function flushRefs() {
      if (!currentParaNum || currentRefs.length === 0) return;
      if (!paraFootnotes[currentParaNum]) paraFootnotes[currentParaNum] = [];
      currentRefs.forEach(function(refNum) {
        var fn = sectionFn[String(refNum)];
        if (fn && fn.refs) {
          fn.refs.forEach(function(r) {
            var parsed = parseCitation(r.text);
            var entry = { num: refNum, type: parsed.type, ref: parsed.ref };
            if (parsed.source) entry.source = parsed.source;
            if (parsed.work) entry.work = parsed.work;
            paraFootnotes[currentParaNum].push(entry);
            fnCount++;
          });
        }
      });
    }

    node.paragraphs.forEach(function(para) {
      para.elements.forEach(function(el) {
        if (el.type === 'ref-ccc') {
          flushRefs();
          currentParaNum = el.ref_number;
          currentRefs = [];
        } else if (el.type === 'ref') {
          currentRefs.push(el.number);
        }
      });
    });

    // Flush last paragraph in section
    flushRefs();
  });

  var parasWithFn = Object.keys(paraFootnotes).length;
  var totalEntries = 0;
  Object.keys(paraFootnotes).forEach(function(k) { totalEntries += paraFootnotes[k].length; });

  // Step 3: Count by type
  var typeCounts = {};
  Object.keys(paraFootnotes).forEach(function(pnum) {
    paraFootnotes[pnum].forEach(function(entry) {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
    });
  });

  console.log('  Paragraphs with footnotes: ' + parasWithFn);
  console.log('  Total footnote entries: ' + totalEntries);
  console.log('  By type:', typeCounts);

  // Verify §663 and §662
  console.log('  §663 footnotes:', JSON.stringify(paraFootnotes['663']));
  console.log('  §662 footnotes:', JSON.stringify(paraFootnotes['662']));

  // Step 4: Write output
  var outPath = path.join(__dirname, '..', 'data', 'ccc-footnotes.json');
  fs.writeFileSync(outPath, JSON.stringify(paraFootnotes, null, 0), 'utf8');
  var size = fs.statSync(outPath).size;
  console.log('\n  Written: ' + outPath);
  console.log('  Size: ' + (size / 1024).toFixed(1) + 'KB');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
