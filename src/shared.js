// src/shared.js — Shared content utilities (eliminates duplication across modules)
// CCC section data, paragraph rendering, scripture ref detection, text helpers

var utils = require('./utils.js');

// CCC section ranges — single source of truth (was duplicated in ccc.js, explore.js, app.js)
var CCC_SECTIONS = [
  [1, 25, 'Prologue'],
  [26, 49, 'Part One \u00b7 The Desire for God'],
  [50, 141, 'Part One \u00b7 God Comes to Meet Man'],
  [142, 184, 'Part One \u00b7 The Response of Faith'],
  [185, 278, 'Part One \u00b7 The Creeds'],
  [279, 421, 'Part One \u00b7 Creator of Heaven and Earth'],
  [422, 682, 'Part One \u00b7 Jesus Christ, Son of God'],
  [683, 747, 'Part One \u00b7 The Holy Spirit'],
  [748, 975, 'Part One \u00b7 The Church'],
  [976, 1065, 'Part One \u00b7 Forgiveness \u00b7 Resurrection \u00b7 Eternal Life'],
  [1066, 1209, 'Part Two \u00b7 The Sacramental Economy'],
  [1210, 1419, 'Part Two \u00b7 Baptism \u00b7 Confirmation \u00b7 Eucharist'],
  [1420, 1532, 'Part Two \u00b7 Penance \u00b7 Anointing of the Sick'],
  [1533, 1666, 'Part Two \u00b7 Holy Orders \u00b7 Matrimony'],
  [1667, 1690, 'Part Two \u00b7 Sacramentals \u00b7 Funerals'],
  [1691, 1876, 'Part Three \u00b7 The Dignity of the Human Person'],
  [1877, 2051, 'Part Three \u00b7 The Human Community \u00b7 The Law \u00b7 Grace'],
  [2052, 2557, 'Part Three \u00b7 The Ten Commandments'],
  [2558, 2758, 'Part Four \u00b7 Christian Prayer'],
  [2759, 2865, 'Part Four \u00b7 The Lord\u2019s Prayer']
];

function getSectionContext(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < CCC_SECTIONS.length; i++) {
    if (n >= CCC_SECTIONS[i][0] && n <= CCC_SECTIONS[i][1]) return CCC_SECTIONS[i][2];
  }
  return '';
}

function getSectionIndex(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < CCC_SECTIONS.length; i++) {
    if (n >= CCC_SECTIONS[i][0] && n <= CCC_SECTIONS[i][1]) return i;
  }
  return -1;
}

function mdItalic(t) { return t.replace(/\*([^*]+)\*/g, '<em>$1</em>'); }

// Scripture citation regex — matches Bible book abbreviations + chapter:verse patterns
var SCRIPTURE_REF_PATTERN = /\b((?:1\s*|2\s*|3\s*)?(?:Mt|Mk|Lk|Jn|Acts|Rom|(?:1\s*|2\s*)?Cor|Gal|Eph|Phil|Col|(?:1\s*|2\s*)?Thess|(?:1\s*|2\s*)?Tim|Tit|Phlm|Heb|Jas|(?:1\s*|2\s*)?Pet|(?:1\s*|2\s*|3\s*)?Jn|Jude|Rev|Gen|Exod?|Lev|Num|Deut?|Josh|Judg|Ruth|(?:1\s*|2\s*)?Sam|(?:1\s*|2\s*|3\s*|4\s*)?Kgs|(?:1\s*|2\s*)?Chr|Ezra|Neh|Tob|Jdt|Esth|(?:1\s*|2\s*)?Macc|Job|Ps[s]?|Prov|Eccl(?:es)?|Song|Wis|Sir|Is[a]?|Jer|Lam|Bar|Ezek?|Dan|Hos|Joel|Amos|Obad|Jon[ah]?|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt(?:hew)?|Mark|Luke|John|Romans|(?:First|Second|Third|1st|2nd|3rd)\s+\w+|Matthew|Revelation)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;

// Wrap scripture references in HTML with tappable spans
function wrapScriptureRefs(html) {
  return html.replace(SCRIPTURE_REF_PATTERN, function(ref) {
    var escaped = ref.replace(/'/g, '&#39;');
    return '<span class="ref-tap ref-tap--bible" role="button" tabindex="0" onclick="window._refTap(\'bible\',\'' + escaped + '\')" aria-label="Scripture: ' + escaped + '">' + ref + '</span>';
  });
}

// Render CCC paragraph raw text → HTML (blockquotes, italics, scripture refs)
function renderParaText(raw) {
  var clean = utils.stripCCCRefs(raw).trim();
  var lines = clean.split('\n');
  var html = '', bq = false;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.charAt(0) === '>') {
      if (!bq) { html += '<blockquote class="ccc-blockquote">'; bq = true; }
      html += '<p>' + mdItalic(utils.esc(line.slice(1).trim())) + '</p>';
    } else {
      if (bq) { html += '</blockquote>'; bq = false; }
      html += '<p class="ccc-para-text">' + mdItalic(utils.esc(line)) + '</p>';
    }
  }
  if (bq) html += '</blockquote>';
  return wrapScriptureRefs(html);
}

// Text preview/truncation for CCC paragraphs
function getPreview(raw) {
  var clean = utils.stripCCCRefs(raw).replace(/>/g, '').replace(/\*/g, '').trim();
  var m = clean.match(/^(.{10,160}[.!?]["\u201d]?)(\s|$)/);
  var preview = m ? m[1].trim() : clean.slice(0, 140).trim();
  if (preview.length < clean.length) preview += '\u2026';
  return preview;
}

module.exports = {
  CCC_SECTIONS: CCC_SECTIONS,
  getSectionContext: getSectionContext,
  getSectionIndex: getSectionIndex,
  mdItalic: mdItalic,
  SCRIPTURE_REF_PATTERN: SCRIPTURE_REF_PATTERN,
  wrapScriptureRefs: wrapScriptureRefs,
  renderParaText: renderParaText,
  getPreview: getPreview,
};
