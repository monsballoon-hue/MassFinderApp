#!/usr/bin/env node
// scripts/build-xrefs-ranked.js
// Builds ranked Bible cross-references from OpenBible.info Treasury of Scripture Knowledge.
// Source: https://a.openbible.info/data/cross-references.zip (CC-BY)
// Output: data/bible-xrefs.json
//
// Key format: "Abbr:Ch:Vs" (e.g., "Matt:26:26")
// Value format: [["Prov:8:22", 45], ...] sorted by votes descending (compact tuple format)
//
// Protestant 66-book canon — deuterocanonicals lack cross-refs in this dataset.
// Supplements from existing bible-xrefs.json for any refs not covered.
//
// Usage: node scripts/build-xrefs-ranked.js

var fs = require('fs');
var path = require('path');
var https = require('https');
var zlib = require('zlib');

var ZIP_URL = 'https://a.openbible.info/data/cross-references.zip';
var OUT = path.join(__dirname, '..', 'data', 'bible-xrefs.json');
var EXISTING = path.join(__dirname, '..', 'data', 'bible-xrefs.json');

// OSIS book abbreviations → MassFinder abbreviations
// Covers Protestant 66-book canon (OpenBible source)
var OSIS_TO_MF = {
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

// Parse "Gen.1.1" or range "Gen.1.1-Gen.1.3" (take first verse of range)
// Returns "Abbr:Ch:Vs" or null
function parseOSIS(ref) {
  var clean = ref.split('-')[0].trim();
  var parts = clean.split('.');
  if (parts.length < 3) return null;

  var mapped = OSIS_TO_MF[parts[0]];
  if (!mapped) return null;

  var ch = parseInt(parts[1], 10);
  var vs = parseInt(parts[2], 10);
  if (isNaN(ch) || isNaN(vs)) return null;

  return mapped + ':' + ch + ':' + vs;
}

// Download a URL, follow redirects, return Buffer
function fetchBuffer(url, callback) {
  var mod = url.indexOf('https') === 0 ? https : require('http');
  mod.get(url, { headers: { 'User-Agent': 'MassFinder-Build' } }, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
      return fetchBuffer(res.headers.location, callback);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('HTTP ' + res.statusCode));
    }
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() { callback(null, Buffer.concat(chunks)); });
    res.on('error', callback);
  }).on('error', callback);
}

// Minimal zip extraction — find the .txt file in the zip and return its contents
// ZIP format: local file headers followed by data
function extractTxtFromZip(buf) {
  var i = 0;
  while (i < buf.length - 4) {
    // Local file header signature: 0x04034b50
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x03 && buf[i + 3] === 0x04) {
      var compressionMethod = buf.readUInt16LE(i + 8);
      var compressedSize = buf.readUInt32LE(i + 18);
      var uncompressedSize = buf.readUInt32LE(i + 22);
      var nameLen = buf.readUInt16LE(i + 26);
      var extraLen = buf.readUInt16LE(i + 28);
      var name = buf.slice(i + 30, i + 30 + nameLen).toString('utf8');
      var dataStart = i + 30 + nameLen + extraLen;

      if (name.indexOf('.txt') >= 0) {
        if (compressionMethod === 0) {
          // Stored (no compression)
          return buf.slice(dataStart, dataStart + compressedSize).toString('utf8');
        } else if (compressionMethod === 8) {
          // Deflated
          var compressed = buf.slice(dataStart, dataStart + compressedSize);
          return zlib.inflateRawSync(compressed).toString('utf8');
        }
      }
      i = dataStart + compressedSize;
    } else {
      i++;
    }
  }
  return null;
}

function run() {
  // Try to read existing xrefs for fallback/supplement
  var existingXrefs = null;
  try {
    existingXrefs = JSON.parse(fs.readFileSync(EXISTING, 'utf8'));
  } catch (e) {
    // No existing file — that's fine
  }

  console.log('Downloading OpenBible.info cross-references...');
  fetchBuffer(ZIP_URL, function(err, zipBuf) {
    if (err) {
      console.error('Download failed: ' + err.message);
      if (existingXrefs) {
        console.log('Falling back to existing data with v:1 for all entries...');
        writeFallback(existingXrefs);
      } else {
        console.error('No existing data to fall back on. Exiting.');
        process.exit(1);
      }
      return;
    }

    console.log('  Downloaded ' + Math.round(zipBuf.length / 1024) + 'KB zip');

    var raw = extractTxtFromZip(zipBuf);
    if (!raw) {
      console.error('Could not find .txt file in zip');
      if (existingXrefs) {
        console.log('Falling back to existing data...');
        writeFallback(existingXrefs);
      } else {
        process.exit(1);
      }
      return;
    }

    var lines = raw.split('\n');
    console.log('  ' + lines.length + ' total lines');

    // Parse all cross-references with votes
    var xrefs = {};
    var parsed = 0;
    var skipped = 0;

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li].trim();
      if (!line || line.charAt(0) === '#' || line.indexOf('From Verse') === 0) continue;

      var cols = line.split('\t');
      if (cols.length < 3) continue;

      var fromRef = parseOSIS(cols[0]);
      var toRef = parseOSIS(cols[1]);
      var votes = parseInt(cols[2], 10);

      if (!fromRef || !toRef || fromRef === toRef) {
        skipped++;
        continue;
      }
      if (isNaN(votes)) votes = 0;

      if (!xrefs[fromRef]) xrefs[fromRef] = [];
      xrefs[fromRef].push([toRef, votes]);
      parsed++;
    }

    console.log('  ' + parsed + ' cross-references parsed');
    console.log('  ' + skipped + ' lines skipped');
    console.log('  ' + Object.keys(xrefs).length + ' source verses');

    // Sort each group by votes descending, deduplicate, trim low-relevance
    var trimmed = 0;
    var keys = Object.keys(xrefs);
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      var refs = xrefs[k];

      // Deduplicate (keep highest vote for each ref) — tuple format [ref, votes]
      var seen = {};
      for (var ri = 0; ri < refs.length; ri++) {
        var ref = refs[ri][0];
        var v = refs[ri][1];
        if (!seen[ref] || seen[ref] < v) {
          seen[ref] = v;
        }
      }
      var deduped = [];
      var refKeys = Object.keys(seen);
      for (var si = 0; si < refKeys.length; si++) {
        deduped.push([refKeys[si], seen[refKeys[si]]]);
      }

      // Sort by votes descending
      deduped.sort(function(a, b) { return b[1] - a[1]; });

      // Trim refs with v < 2 (low relevance) — but keep at least 3 refs per verse
      // Cap at 20 refs per verse (diminishing returns beyond that)
      var filtered = [];
      for (var fi = 0; fi < deduped.length; fi++) {
        if (filtered.length >= 20) { trimmed++; continue; }
        if (deduped[fi][1] >= 2 || filtered.length < 3) {
          filtered.push(deduped[fi]);
        } else {
          trimmed++;
        }
      }

      xrefs[k] = filtered;
    }

    console.log('  ' + trimmed + ' low-relevance refs trimmed (v < 2)');

    // Supplement from existing data — add any refs from existing that aren't in new data
    if (existingXrefs) {
      var supplemented = 0;
      var existingKeys = Object.keys(existingXrefs);
      for (var ei = 0; ei < existingKeys.length; ei++) {
        var ek = existingKeys[ei];
        var existingRefs = existingXrefs[ek];
        if (!Array.isArray(existingRefs)) continue;

        if (!xrefs[ek]) {
          // Entire verse missing from new data — add with v:1
          xrefs[ek] = [];
          for (var eri = 0; eri < existingRefs.length; eri++) {
            var er = existingRefs[eri];
            // Handle old string format, object format, or tuple format
            var refStr = typeof er === 'string' ? er : (Array.isArray(er) ? er[0] : er.ref);
            xrefs[ek].push([refStr, 1]);
            supplemented++;
          }
        }
        // Don't add individual refs to verses that already have data —
        // OpenBible data is more curated/ranked than scrollmapper
      }
      console.log('  ' + supplemented + ' refs supplemented from existing data');
    }

    // Write output
    fs.writeFileSync(OUT, JSON.stringify(xrefs), 'utf8');
    var sizeKB = Math.round(fs.statSync(OUT).size / 1024);
    var totalRefs = 0;
    var finalKeys = Object.keys(xrefs);
    for (var ti = 0; ti < finalKeys.length; ti++) {
      totalRefs += xrefs[finalKeys[ti]].length;
    }
    console.log('\nDone. Output: data/bible-xrefs.json');
    console.log('  ' + finalKeys.length + ' source verses, ' + totalRefs + ' total refs, ' + sizeKB + 'KB');
  });
}

// Fallback: convert existing unranked data to ranked format with v:1
function writeFallback(existing) {
  var ranked = {};
  var keys = Object.keys(existing);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var refs = existing[k];
    if (!Array.isArray(refs)) continue;
    ranked[k] = [];
    for (var j = 0; j < refs.length; j++) {
      var r = refs[j];
      var refStr = typeof r === 'string' ? r : (Array.isArray(r) ? r[0] : r.ref);
      ranked[k].push([refStr, 1]);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(ranked), 'utf8');
  var sizeKB = Math.round(fs.statSync(OUT).size / 1024);
  console.log('Fallback done. Output: data/bible-xrefs.json (' + sizeKB + 'KB)');
}

run();
