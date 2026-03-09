// scripts/build-catechism.js
// Fetches all 2,865 CCC paragraphs from aseemsavio/catholicism-in-json,
// builds a paragraph lookup + bidirectional cross-reference index,
// and writes data/catechism.json.
//
// Run once: node scripts/build-catechism.js
// Output:   data/catechism.json  (~1-2MB raw, ~427KB gzipped)

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

function fetchJson(url) {
  return fetchText(url).then(function(text) {
    try { return JSON.parse(text); }
    catch (e) { throw new Error('JSON parse error for ' + url + ': ' + e.message); }
  });
}

// ── Cross-reference extraction ─────────────────────────────────────────────
// Matches (1234), (1234, 5678), (1234-1240), (1234–1240) in paragraph text.

var REF_RE = /\((\d[\d,\s\u2013\-]*\d|\d)\)/g;
var MAX_PARA = 2865;

function extractRefs(text) {
  var refs = [];
  var m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(text)) !== null) {
    var inner = m[1].trim();
    // Range: "1234-1240" or "1234–1240"
    var rangeM = inner.match(/^(\d+)[\-\u2013](\d+)$/);
    if (rangeM) {
      var s = parseInt(rangeM[1], 10), e = parseInt(rangeM[2], 10);
      if (s >= 1 && e <= MAX_PARA && e > s && (e - s) < 20) {
        for (var i = s; i <= e; i++) refs.push(i);
      }
    } else {
      // Comma-separated or single: "1234" or "1234, 5678"
      inner.split(',').forEach(function(part) {
        var n = parseInt(part.trim(), 10);
        if (!isNaN(n) && n >= 1 && n <= MAX_PARA) refs.push(n);
      });
    }
  }
  return refs;
}

// ── Normalise source data into { id: text } ────────────────────────────────

function normalise(source) {
  var out = {};

  function put(num, text) {
    var n = parseInt(num, 10);
    if (!isNaN(n) && n >= 1 && n <= MAX_PARA && text && typeof text === 'string') {
      out[n] = text.trim();
    }
  }

  // Format A: { paragraphs: { "1": "text", ... } }
  if (source && source.paragraphs && !Array.isArray(source.paragraphs)) {
    Object.keys(source.paragraphs).forEach(function(k) {
      var v = source.paragraphs[k];
      if (typeof v === 'string') put(k, v);
      else if (v && typeof v === 'object') put(k, v.text || v.content || v.paragraph || '');
    });

  // Format B: { paragraphs: [ { number|num|id: N, text|content: "..." }, ... ] }
  } else if (source && Array.isArray(source.paragraphs)) {
    source.paragraphs.forEach(function(item) {
      var num = item.number || item.num || item.id || item.para_num || item.n;
      var text = item.text || item.content || item.paragraph || item.para || '';
      put(num, text);
    });

  // Format C: top-level array
  } else if (Array.isArray(source)) {
    source.forEach(function(item) {
      var num = item.number || item.num || item.id || item.para_num || item.n;
      var text = item.text || item.content || item.paragraph || item.para || '';
      put(num, text);
    });

  // Format D: top-level { "1": "text" } or { "1": { text: "..." } }
  } else if (source && typeof source === 'object') {
    Object.keys(source).forEach(function(k) {
      var n = parseInt(k, 10);
      if (!isNaN(n)) {
        var v = source[k];
        if (typeof v === 'string') put(k, v);
        else if (v && typeof v === 'object') put(k, v.text || v.content || v.paragraph || '');
      }
    });
  }

  return out;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Candidate URLs — tried in order
  var candidates = [
    // GitHub releases API (find latest release asset)
    'releases',
    // Common raw file paths
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/master/catechism-of-the-catholic-church.json',
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/main/catechism-of-the-catholic-church.json',
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/master/ccc.json',
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/main/ccc.json',
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/master/data/ccc.json',
    'https://raw.githubusercontent.com/aseemsavio/catholicism-in-json/main/data/ccc.json',
  ];

  var source = null;

  for (var i = 0; i < candidates.length; i++) {
    var url = candidates[i];
    try {
      if (url === 'releases') {
        console.log('Checking GitHub releases...');
        var rel = await fetchJson('https://api.github.com/repos/aseemsavio/catholicism-in-json/releases/latest');
        if (rel.assets && rel.assets.length) {
          var asset = rel.assets.find(function(a) {
            var n = a.name.toLowerCase();
            return n.includes('ccc') || n.includes('catechism');
          });
          if (asset) {
            console.log('Found release asset:', asset.name);
            source = await fetchJson(asset.browser_download_url);
            break;
          }
        }
      } else {
        console.log('Trying:', url);
        source = await fetchJson(url);
        break;
      }
    } catch (e) {
      console.log('  →', e.message);
    }
  }

  if (!source) throw new Error('Could not fetch CCC data from any known source. Check the repo at https://github.com/aseemsavio/catholicism-in-json');

  // Normalise
  var rawParagraphs = normalise(source);
  var count = Object.keys(rawParagraphs).length;
  console.log('Parsed ' + count + ' paragraphs');
  if (count < 1000) throw new Error('Only ' + count + ' paragraphs found — expected 2000+. Data format may have changed.');

  // Build forward xrefs (parse parenthetical refs in text)
  var fwdRefs = {};   // { sourceId: [targetId, ...] }
  var revRefs = {};   // { targetId: [sourceId, ...] }

  Object.keys(rawParagraphs).forEach(function(k) {
    var id = parseInt(k, 10);
    var refs = extractRefs(rawParagraphs[k]);
    // Keep only refs pointing to existing paragraphs, exclude self, deduplicate
    refs = refs.filter(function(r, idx, arr) {
      return r !== id && rawParagraphs[r] && arr.indexOf(r) === idx;
    });
    if (refs.length) {
      fwdRefs[id] = refs;
      refs.forEach(function(target) {
        if (!revRefs[target]) revRefs[target] = [];
        revRefs[target].push(id);
      });
    }
  });

  // Merge into combined xrefs: { id: { fwd: [...], rev: [...] } }
  var xrefs = {};
  var allXrefIds = {};
  Object.keys(fwdRefs).forEach(function(k) { allXrefIds[k] = true; });
  Object.keys(revRefs).forEach(function(k) { allXrefIds[k] = true; });
  Object.keys(allXrefIds).forEach(function(k) {
    var entry = {};
    if (fwdRefs[k]) entry.fwd = fwdRefs[k];
    if (revRefs[k]) entry.rev = revRefs[k];
    xrefs[k] = entry;
  });

  var totalFwd = Object.keys(fwdRefs).reduce(function(sum, k) { return sum + fwdRefs[k].length; }, 0);
  console.log('Built ' + Object.keys(xrefs).length + ' xref entries (' + totalFwd + ' forward refs)');

  // Write output
  var output = { paragraphs: rawParagraphs, xrefs: xrefs };
  var dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  var outPath = path.join(dataDir, 'catechism.json');
  fs.writeFileSync(outPath, JSON.stringify(output));
  var sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  console.log('Written:', outPath, '(' + sizeKB + 'KB)');
  console.log('Done. ' + count + ' paragraphs, ' + Object.keys(xrefs).length + ' with cross-references.');
}

main().catch(function(e) {
  console.error('Error:', e.message);
  process.exit(1);
});
