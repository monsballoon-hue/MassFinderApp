#!/usr/bin/env node
// scripts/build-litcal.js
// Fetches liturgical calendar from the LitCal API and writes per-year JSON.
// API: litcal.johnromanodorazio.com/api/v5/calendar/nation/US/{YEAR}
// Output: data/litcal-{year}.json for current year + next year
//
// The output files contain civil-calendar dates (Jan–Dec of the given year).
// Each date maps to the highest-ranked liturgical celebration for that day.
//
// Usage: node scripts/build-litcal.js

var fs = require('fs');
var path = require('path');
var https = require('https');

var OUT_DIR = path.join(__dirname, '..', 'data');

// Map LitCal grade numbers to human-readable rank strings
var GRADE_RANKS = {
  0: 'weekday',
  1: 'optional_memorial',
  2: 'memorial',
  3: 'feast',
  4: 'feast_of_the_lord',
  5: 'solemnity',
  6: 'triduum',
  7: 'solemnity'
};

// Compute Sunday cycle letter for a given liturgical year number
// Liturgical year 2026 (starts Advent 2025) = Year A
// Formula: ['A','B','C'][(year % 3 + 2) % 3]
function sundayCycle(year) {
  return ['A', 'B', 'C'][(year % 3 + 2) % 3];
}

// Weekday cycle: even liturgical year = II, odd = I
function weekdayCycle(year) {
  return year % 2 === 0 ? 'II' : 'I';
}

function fetchJSON(url, callback) {
  console.log('  GET ' + url);
  https.get(url, { headers: { 'User-Agent': 'MassFinder-Build' } }, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return fetchJSON(res.headers.location, callback);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('HTTP ' + res.statusCode + ' from ' + url));
    }
    var chunks = [];
    res.on('data', function(chunk) { chunks.push(chunk); });
    res.on('end', function() {
      var body = Buffer.concat(chunks).toString('utf8');
      try {
        callback(null, JSON.parse(body));
      } catch (e) {
        callback(new Error('JSON parse failed: ' + e.message));
      }
    });
    res.on('error', callback);
  }).on('error', callback);
}

// Fetch raw liturgical year data and return processed entries grouped by civil date
function fetchLitYear(litYear, callback) {
  var url = 'https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + litYear;
  fetchJSON(url, function(err, data) {
    if (err) return callback(err);
    var entries = data.litcal;
    if (!Array.isArray(entries)) {
      return callback(new Error('Unexpected API format — litcal not array'));
    }
    var sundayCyc = sundayCycle(litYear);
    var weekdayCyc = weekdayCycle(litYear);

    // Group non-vigil entries by civil date
    var byDate = {};
    entries.forEach(function(e) {
      if (e.is_vigil_mass) return;
      if (!e.date) return;
      var d = e.date.slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({ entry: e, sundayCyc: sundayCyc, weekdayCyc: weekdayCyc });
    });
    callback(null, byDate);
  });
}

function buildCivilYear(civilYear, callback) {
  // Civil year 2026 needs:
  //   - Liturgical year 2026 (Advent 2025 – ~Nov 28, 2026): Jan 1 – Nov 28
  //   - Liturgical year 2027 (Advent 2026 – ~Nov 27, 2027): Nov 29 – Dec 31
  // So we fetch two liturgical years and merge, keeping only the civil year dates.
  console.log('\nGenerating litcal-' + civilYear + '.json...');
  console.log('  Fetching liturgical year ' + civilYear + '...');

  fetchLitYear(civilYear, function(err, byDateA) {
    if (err) return callback(err);
    console.log('  Fetching liturgical year ' + (civilYear + 1) + ' (for Advent/Dec overlap)...');

    fetchLitYear(civilYear + 1, function(err2, byDateB) {
      if (err2) return callback(err2);

      // Merge: B fills in dates not present in A (the Advent/December period)
      Object.keys(byDateB).forEach(function(d) {
        if (!byDateA[d]) byDateA[d] = byDateB[d];
      });

      // Build output for civil year only
      var output = {};
      Object.keys(byDateA).sort().forEach(function(d) {
        var year = parseInt(d.slice(0, 4), 10);
        if (year !== civilYear) return;

        var dayEntries = byDateA[d];
        // Sort by grade descending, pick highest
        dayEntries.sort(function(a, b) { return b.entry.grade - a.entry.grade; });
        var top = dayEntries[0];
        var e = top.entry;

        output[d] = {
          key: e.event_key || '',
          name: e.name || '',
          season: e.liturgical_season || '',
          color: (e.color && e.color[0]) || '',
          rank: GRADE_RANKS[e.grade] || 'weekday',
          cycles: {
            sunday: top.sundayCyc,
            weekday: top.weekdayCyc,
            psalter: e.psalter_week !== undefined ? String(e.psalter_week) : ''
          }
        };
      });

      var outPath = path.join(OUT_DIR, 'litcal-' + civilYear + '.json');
      fs.writeFileSync(outPath, JSON.stringify(output), 'utf8');
      var days = Object.keys(output).length;
      var sizeKB = Math.round(fs.statSync(outPath).size / 1024);
      console.log('  -> ' + days + ' days, ' + sizeKB + 'KB — litcal-' + civilYear + '.json');
      callback(null);
    });
  });
}

function run() {
  var currentYear = new Date().getFullYear();
  var years = [currentYear, currentYear + 1];

  console.log('Building liturgical calendars for civil years ' + years.join(', ') + '...');

  // Sequential fetch
  var idx = 0;
  function next() {
    if (idx >= years.length) {
      console.log('\nDone.');
      return;
    }
    var yr = years[idx++];
    buildCivilYear(yr, function(err) {
      if (err) {
        console.error('ERROR for ' + yr + ': ' + err.message);
        process.exit(1);
      }
      next();
    });
  }
  next();
}

run();
