#!/usr/bin/env node
// scripts/build-summa.js — Fetch Summa Theologica from Jacob-Gray/summa.json,
// curate 366 daily articles, output data/summa-daily.json
//
// Source: https://github.com/Jacob-Gray/summa.json (The Unlicense)
// Usage: node scripts/build-summa.js

var https = require('https');
var fs = require('fs');
var path = require('path');

var OUTPUT = path.join(__dirname, '..', 'data', 'summa-daily.json');

// The 4 main parts of the Summa Theologica (skip X1, X2, XP supplement)
var PARTS = [
  { code: 'FP', name: 'First Part', topic: 'God, Creation, Angels, Man', questions: 119 },
  { code: 'FS', name: 'First Part of the Second Part', topic: 'Human Acts, Virtues, Law, Grace', questions: 114 },
  { code: 'SS', name: 'Second Part of the Second Part', topic: 'Faith, Hope, Charity, Justice, Virtues', questions: 189 },
  { code: 'TP', name: 'Third Part', topic: 'Christ, Sacraments, Last Things', questions: 90 }
];

// Part display labels for the app
var PART_LABELS = {
  FP: 'Prima Pars (I)',
  FS: 'Prima Secundae (I-II)',
  SS: 'Secunda Secundae (II-II)',
  TP: 'Tertia Pars (III)'
};

// Topic tags derived from question ranges — maps part + question range to a human-readable topic
var TOPIC_MAP = [
  // FP: God, Trinity, Creation, Angels, Man, Divine Government
  { part: 'FP', min: 1, max: 13, topic: 'God' },
  { part: 'FP', min: 14, max: 26, topic: 'God' },
  { part: 'FP', min: 27, max: 43, topic: 'The Trinity' },
  { part: 'FP', min: 44, max: 49, topic: 'Creation' },
  { part: 'FP', min: 50, max: 64, topic: 'Angels' },
  { part: 'FP', min: 65, max: 74, topic: 'Creation' },
  { part: 'FP', min: 75, max: 102, topic: 'Human Nature' },
  { part: 'FP', min: 103, max: 119, topic: 'Divine Government' },
  // FS: Human Acts, Passions, Habits/Virtues, Law, Grace
  { part: 'FS', min: 1, max: 5, topic: 'Human Acts' },
  { part: 'FS', min: 6, max: 21, topic: 'Human Acts' },
  { part: 'FS', min: 22, max: 48, topic: 'The Passions' },
  { part: 'FS', min: 49, max: 54, topic: 'Habits & Virtues' },
  { part: 'FS', min: 55, max: 70, topic: 'Habits & Virtues' },
  { part: 'FS', min: 71, max: 89, topic: 'Vice & Sin' },
  { part: 'FS', min: 90, max: 108, topic: 'Law' },
  { part: 'FS', min: 109, max: 114, topic: 'Grace' },
  // SS: Theological Virtues, Cardinal Virtues, States of Life
  { part: 'SS', min: 1, max: 16, topic: 'Faith' },
  { part: 'SS', min: 17, max: 22, topic: 'Hope' },
  { part: 'SS', min: 23, max: 46, topic: 'Charity' },
  { part: 'SS', min: 47, max: 56, topic: 'Prudence' },
  { part: 'SS', min: 57, max: 79, topic: 'Justice' },
  { part: 'SS', min: 80, max: 100, topic: 'Temperance' },
  { part: 'SS', min: 101, max: 122, topic: 'Temperance' },
  { part: 'SS', min: 123, max: 140, topic: 'Fortitude' },
  { part: 'SS', min: 141, max: 170, topic: 'Temperance' },
  { part: 'SS', min: 171, max: 182, topic: 'Charisms & States' },
  { part: 'SS', min: 183, max: 189, topic: 'States of Life' },
  // TP: Christ, Sacraments
  { part: 'TP', min: 1, max: 26, topic: 'The Incarnation' },
  { part: 'TP', min: 27, max: 59, topic: 'Life of Christ' },
  { part: 'TP', min: 60, max: 65, topic: 'The Sacraments' },
  { part: 'TP', min: 66, max: 71, topic: 'Baptism' },
  { part: 'TP', min: 72, max: 78, topic: 'Confirmation & Eucharist' },
  { part: 'TP', min: 79, max: 83, topic: 'The Eucharist' },
  { part: 'TP', min: 84, max: 90, topic: 'Penance' }
];

function getTopic(part, qNum) {
  for (var i = 0; i < TOPIC_MAP.length; i++) {
    var t = TOPIC_MAP[i];
    if (t.part === part && qNum >= t.min && qNum <= t.max) return t.topic;
  }
  return 'Theology';
}

// ── HTTP fetch with redirect following ──
function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    function doGet(u, redirects) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      https.get(u, { headers: { 'User-Agent': 'MassFinder-BuildScript/1.0' } }, function(res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doGet(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error('HTTP ' + res.statusCode + ' for ' + u));
        }
        var chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (e) {
            reject(new Error('JSON parse error for ' + u + ': ' + e.message));
          }
        });
        res.on('error', reject);
      }).on('error', reject);
    }
    doGet(url, 0);
  });
}

// ── Extract articles from a part's ALL.json ──
// Structure: { title, questions: { "1": {...}, "2": {...} }, sections: { "1": { questions: {...}, sections: {...} } } }
// Questions are objects keyed by number. Sections nest more questions.
function extractArticles(allData, partCode) {
  var articles = [];

  // Collect all questions from top-level and nested sections
  function collectQuestions(obj, list) {
    if (obj.questions) {
      Object.keys(obj.questions).forEach(function(qKey) {
        list.push({ key: parseInt(qKey, 10), data: obj.questions[qKey] });
      });
    }
    if (obj.sections) {
      Object.keys(obj.sections).forEach(function(sKey) {
        collectQuestions(obj.sections[sKey], list);
      });
    }
  }

  var allQuestions = [];
  collectQuestions(allData, allQuestions);

  allQuestions.forEach(function(entry) {
    var q = entry.data;
    var qNum = entry.key;
    if (!q || !q.article) return;

    var qTitle = (typeof q.title === 'string') ? q.title : (Array.isArray(q.title) ? q.title.join(' ') : '');

    var artKeys = Object.keys(q.article);
    artKeys.forEach(function(artKey) {
      var art = q.article[artKey];
      if (!art) return;

      var artTitle = Array.isArray(art.title) ? art.title.join(' ') : (typeof art.title === 'string' ? art.title : '');
      var body = Array.isArray(art.body) ? art.body.join('\n\n') : (typeof art.body === 'string' ? art.body : '');
      var counter = Array.isArray(art.counter) ? art.counter.join(' ') : (typeof art.counter === 'string' ? art.counter : '');

      // Skip articles with empty body
      if (!body.trim()) return;

      articles.push({
        id: partCode + '.Q' + qNum + '.A' + artKey,
        part: partCode,
        partLabel: PART_LABELS[partCode],
        question: qNum,
        article: parseInt(artKey, 10),
        questionTitle: qTitle.trim(),
        articleTitle: artTitle.trim(),
        body: body.trim(),
        counter: counter.trim(),
        topic: getTopic(partCode, qNum)
      });
    });
  });

  return articles;
}

// ── Trim body to key passage ──
// Keep first ~500 chars, breaking at sentence boundary
function trimBody(text, maxLen) {
  if (text.length <= maxLen) return text;
  var cut = text.lastIndexOf('. ', maxLen);
  if (cut < maxLen * 0.5) cut = text.lastIndexOf(' ', maxLen);
  if (cut < 0) cut = maxLen;
  return text.substring(0, cut + 1).trim();
}

// ── Select the best 366 articles for daily rotation ──
// Strategy: sample evenly across parts, prefer Article 1 (the primary question),
// diversify topics, and pick articles with substantive bodies.
function selectDaily(allArticles) {
  // Allocate proportionally across parts
  var partCounts = { FP: 85, FS: 85, SS: 110, TP: 86 }; // = 366

  var byPart = {};
  PARTS.forEach(function(p) { byPart[p.code] = []; });
  allArticles.forEach(function(a) {
    if (byPart[a.part]) byPart[a.part].push(a);
  });

  var selected = [];

  Object.keys(partCounts).forEach(function(partCode) {
    var pool = byPart[partCode] || [];
    var target = partCounts[partCode];

    // Sort: prefer Article 1, then by question order
    pool.sort(function(a, b) {
      if (a.article === 1 && b.article !== 1) return -1;
      if (b.article === 1 && a.article !== 1) return 1;
      if (a.question !== b.question) return a.question - b.question;
      return a.article - b.article;
    });

    // Prefer articles with longer bodies (more substance)
    // But Article 1 always wins ties
    var picked = [];
    var usedQuestions = {};

    // First pass: one article per question (prefer Art 1)
    pool.forEach(function(a) {
      if (picked.length >= target) return;
      if (!usedQuestions[a.question]) {
        usedQuestions[a.question] = true;
        picked.push(a);
      }
    });

    // Second pass: fill remaining from unused articles
    if (picked.length < target) {
      pool.forEach(function(a) {
        if (picked.length >= target) return;
        var already = picked.some(function(p) { return p.id === a.id; });
        if (!already) picked.push(a);
      });
    }

    // Trim to target
    picked = picked.slice(0, target);
    selected = selected.concat(picked);
  });

  // Sort final selection by part order then question/article
  var partOrder = { FP: 0, FS: 1, SS: 2, TP: 3 };
  selected.sort(function(a, b) {
    if (partOrder[a.part] !== partOrder[b.part]) return partOrder[a.part] - partOrder[b.part];
    if (a.question !== b.question) return a.question - b.question;
    return a.article - b.article;
  });

  return selected;
}

// ── Main ──
async function main() {
  console.log('Fetching Summa Theologica from Jacob-Gray/summa.json...\n');

  var allArticles = [];

  for (var i = 0; i < PARTS.length; i++) {
    var part = PARTS[i];
    var url = 'https://raw.githubusercontent.com/Jacob-Gray/summa.json/master/json/'
      + part.code + '/' + part.code + '-ALL.json';

    process.stdout.write('  Fetching ' + part.code + ' (' + part.topic + ')... ');

    try {
      var data = await fetchJSON(url);
      var articles = extractArticles(data, part.code);
      allArticles = allArticles.concat(articles);
      console.log(articles.length + ' articles');
    } catch (err) {
      console.error('FAILED: ' + err.message);
      process.exit(1);
    }
  }

  console.log('\nTotal articles extracted: ' + allArticles.length);

  // Select 366 for daily rotation
  var daily = selectDaily(allArticles);
  console.log('Selected for daily rotation: ' + daily.length);

  // Build compact output
  var MAX_BODY = 600;
  var MAX_COUNTER = 300;
  var output = {
    meta: {
      source: 'Jacob-Gray/summa.json',
      license: 'The Unlicense (public domain)',
      author: 'St. Thomas Aquinas',
      translation: 'Fathers of the English Dominican Province (1920)',
      count: daily.length,
      built: new Date().toISOString().slice(0, 10)
    },
    articles: daily.map(function(a, idx) {
      var entry = {
        day: idx,
        id: a.id,
        part: a.partLabel,
        topic: a.topic,
        q: a.questionTitle,
        a: a.articleTitle,
        body: trimBody(a.body, MAX_BODY)
      };
      // Include counter (sed contra) if it adds value and is short
      if (a.counter && a.counter.length <= MAX_COUNTER) {
        entry.counter = a.counter;
      }
      return entry;
    })
  };

  // Write output
  var dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output));

  var size = fs.statSync(OUTPUT).size;
  console.log('\nWrote ' + OUTPUT);
  console.log('Size: ' + (size / 1024).toFixed(1) + ' KB');

  // Report topic distribution
  var topics = {};
  daily.forEach(function(a) {
    topics[a.topic] = (topics[a.topic] || 0) + 1;
  });
  console.log('\nTopic distribution:');
  Object.keys(topics).sort(function(a, b) { return topics[b] - topics[a]; }).forEach(function(t) {
    console.log('  ' + t + ': ' + topics[t]);
  });
}

main().catch(function(err) {
  console.error('Fatal: ' + err.message);
  process.exit(1);
});
