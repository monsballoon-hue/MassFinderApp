#!/usr/bin/env node
// scripts/modernize-baltimore.js — Baltimore Catechism language modernization (OW-20)
//
// Applies conservative vocabulary substitutions to make the Baltimore Catechism
// more accessible to modern readers while preserving:
//   - Direct Scripture quotations (Commandments, Beatitudes)
//   - Prayer texts (Our Father, Hail Mary, Act of Contrition, Apostles' Creed)
//   - Liturgical formulas (Baptism, etc.)
//   - Doctrinal terms (transubstantiation, concupiscence, sanctifying grace, etc.)
//
// Usage: node scripts/modernize-baltimore.js
//   Reads:  data/baltimore-catechism.json
//   Writes: data/baltimore-catechism.json (modernized, with flag)
//   Saves:  data/baltimore-catechism-original.json (backup)

var fs = require('fs');
var path = require('path');

var srcPath = path.join(__dirname, '..', 'data', 'baltimore-catechism.json');
var backupPath = path.join(__dirname, '..', 'data', 'baltimore-catechism-original.json');

if (!fs.existsSync(srcPath)) {
  console.error('ERROR: data/baltimore-catechism.json not found');
  process.exit(1);
}

var raw = fs.readFileSync(srcPath, 'utf8');
var data = JSON.parse(raw);

// Save backup of original if not already backed up
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, raw, 'utf8');
  console.log('Saved original to data/baltimore-catechism-original.json');
}

// ── Protected Q&A IDs — these contain prayer/Scripture text that must not be altered ──
var PROTECTED_IDS = {
  7: true,    // Apostles' Creed ("sitteth", "from thence")
  95: true,   // Baptism formula ("I baptize thee")
  132: true,  // Full Ten Commandments listing
  133: true,  // 1st Commandment text
  140: true,  // 2nd Commandment text
  142: true,  // 3rd Commandment text
  146: true,  // 4th Commandment text
  150: true,  // 5th Commandment text
  155: true,  // 6th Commandment text
  158: true,  // 7th Commandment text
  162: true,  // 8th Commandment text
  165: true,  // 9th Commandment text
  167: true,  // 10th Commandment text
  186: true,  // Our Father
  190: true,  // Hail Mary
  215: true,  // Beatitudes (Scripture)
  218: true   // Fruits of the Holy Ghost (traditional list from Galatians)
};

// ── Substitution rules ──
// Each rule: [pattern, replacement]
// Patterns are applied only to answer text of non-protected questions.
var RULES = [
  // unto → to
  [/\bunto\b/gi, 'to'],
  // thereof → of it / of this (context-dependent, but "of it" is safest generic)
  [/\bthereof\b/gi, 'of it'],
  // wherefore → for this reason (when at start of clause) or why
  [/\bWherefore\b/g, 'For this reason'],
  [/\bwherefore\b/g, 'for this reason'],
  // hitherto → until now
  [/\bhitherto\b/gi, 'until now'],
  // whence → from where
  [/\bwhence\b/gi, 'from where'],
];

var changes = 0;
var changedIds = [];

data.questions.forEach(function(q) {
  if (PROTECTED_IDS[q.id]) return;

  var original = q.answer;
  var modernized = original;

  RULES.forEach(function(rule) {
    modernized = modernized.replace(rule[0], rule[1]);
  });

  if (modernized !== original) {
    q.answer = modernized;
    changes++;
    changedIds.push(q.id);
    console.log('  Q' + q.id + ': ' + original.slice(0, 80) + (original.length > 80 ? '...' : ''));
    console.log('     → ' + modernized.slice(0, 80) + (modernized.length > 80 ? '...' : ''));
  }
});

// Mark as modernized
data._meta.modernized = true;
data._meta.modernizedDate = new Date().toISOString().slice(0, 10);
data._meta.protectedIds = Object.keys(PROTECTED_IDS).map(Number).sort(function(a, b) { return a - b; });

// Write modernized version
fs.writeFileSync(srcPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log('\n✓ Modernized ' + changes + ' answer' + (changes !== 1 ? 's' : '')
  + ' (IDs: ' + changedIds.join(', ') + ')');
console.log('  Protected ' + Object.keys(PROTECTED_IDS).length + ' prayer/Scripture entries');
console.log('  Original preserved at data/baltimore-catechism-original.json');
