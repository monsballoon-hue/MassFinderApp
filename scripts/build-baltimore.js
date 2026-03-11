#!/usr/bin/env node
// scripts/build-baltimore.js — Validate Baltimore Catechism data
// The data file (data/baltimore-catechism.json) is maintained directly.
// This script validates structure and reports stats.
//
// Usage: node scripts/build-baltimore.js

var fs = require('fs');
var path = require('path');

var filePath = path.join(__dirname, '..', 'data', 'baltimore-catechism.json');
if (!fs.existsSync(filePath)) {
  console.error('ERROR: data/baltimore-catechism.json not found');
  process.exit(1);
}

var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
var questions = data.questions || [];
var errors = [];

questions.forEach(function(q, i) {
  if (!q.id) errors.push('Entry ' + i + ': missing id');
  if (!q.question) errors.push('Entry ' + i + ' (id=' + q.id + '): missing question');
  if (!q.answer) errors.push('Entry ' + i + ' (id=' + q.id + '): missing answer');
});

if (errors.length) {
  console.error('Validation errors:');
  errors.forEach(function(e) { console.error('  ' + e); });
  process.exit(1);
}

var withCCC = questions.filter(function(q) { return q.ccc; }).length;
console.log('✓ Baltimore Catechism validated: ' + questions.length + ' Q&A pairs, ' + withCCC + ' with CCC cross-refs');
