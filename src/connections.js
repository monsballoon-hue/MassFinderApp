// src/connections.js — Shared tiered connection renderer
// Renders inline connections below CCC paragraphs and Bible chapters.
// Tiered: Tier 1 expanded (direct citations), Tier 2 collapsed (secondary),
// Tier 3 collapsed (weak matches like Summa keyword topics).
// Tapping a connection opens the target reader directly via reader.readerOpen().

var graph = require('./graph.js');
var utils = require('./utils.js');
var reader = require('./reader.js');

// ── Rendering ──

function renderConnections(sourceType, sourceId, containerEl) {
  if (!containerEl) return;

  // Loading state
  containerEl.innerHTML = '<div class="reader-conn-loading">Loading connections\u2026</div>';

  // Determine which data we need
  var needed = sourceType === 'ccc'
    ? ['ccc', 'footnotes', 'bibleXrefs', 'hierarchy', 'baltimore', 'lectionary', 'summa']
    : ['ccc', 'footnotes', 'bibleXrefs', 'hierarchy', 'lectionary'];

  graph.ensure(needed).then(function() {
    // Guard: container may have been removed if user navigated away
    if (!containerEl.parentNode) return;

    var html = '';

    if (sourceType === 'ccc') {
      html = _renderCCCConnections(sourceId);
    } else if (sourceType === 'bible') {
      html = _renderBibleConnections(sourceId);
    }

    if (html) {
      containerEl.innerHTML = '<div class="reader-conn-header">Connections</div>' + html;
    } else {
      containerEl.innerHTML = '';
    }
  }).catch(function() {
    // Connections are enhancement-only — never gate content
    if (containerEl.parentNode) containerEl.innerHTML = '';
  });
}

// ── CCC Connections ──

function _renderCCCConnections(numStr) {
  var num = parseInt(numStr, 10);
  var gCCC = graph.forCCC(num);
  var html = '';

  // Tier 1: Scripture citations (expanded)
  if (gCCC.bible.length) {
    html += '<div class="reader-conn-tier">';
    html += '<div class="reader-conn-tier-label">Scripture</div>';
    var scriptureItems = gCCC.bible.slice(0, 8);
    scriptureItems.forEach(function(ref) {
      html += _renderItem('bible', ref, ref, '', '');
    });
    if (gCCC.bible.length > 8) {
      html += '<details class="reader-conn-overflow"><summary class="reader-conn-more">'
        + (gCCC.bible.length - 8) + ' more</summary>';
      gCCC.bible.slice(8).forEach(function(ref) {
        html += _renderItem('bible', ref, ref, '', '');
      });
      html += '</details>';
    }
    html += '</div>';
  }

  // Tier 1: Related CCC paragraphs (expanded, first 5)
  if (gCCC.ccc.length) {
    var related = gCCC.ccc.filter(function(rid) { return rid !== num; });
    if (related.length) {
      html += '<div class="reader-conn-tier">';
      html += '<div class="reader-conn-tier-label">Related Teachings</div>';
      var showCount = Math.min(5, related.length);
      for (var i = 0; i < showCount; i++) {
        var rid = related[i];
        var text = graph.getCCCParagraph(rid);
        var preview = text ? utils.getPreview(text) : '';
        var ctx = graph.getHierarchyPath(rid);
        html += _renderItem('ccc', String(rid), '\u00A7' + rid, ctx, preview);
      }
      if (related.length > showCount) {
        html += '<details class="reader-conn-overflow"><summary class="reader-conn-more">'
          + (related.length - showCount) + ' more</summary>';
        for (var j = showCount; j < related.length; j++) {
          var rid2 = related[j];
          var text2 = graph.getCCCParagraph(rid2);
          var preview2 = text2 ? utils.getPreview(text2) : '';
          var ctx2 = graph.getHierarchyPath(rid2);
          html += _renderItem('ccc', String(rid2), '\u00A7' + rid2, ctx2, preview2);
        }
        html += '</details>';
      }
      html += '</div>';
    }
  }

  // Tier 2: Baltimore Catechism (collapsed)
  if (gCCC.baltimore.length) {
    var balt = graph.getBaltimore();
    if (balt && balt.questions) {
      var baltItems = [];
      gCCC.baltimore.forEach(function(qId) {
        for (var bi = 0; bi < balt.questions.length; bi++) {
          if (balt.questions[bi].id === qId) {
            baltItems.push(balt.questions[bi]);
            break;
          }
        }
      });
      if (baltItems.length) {
        html += '<details class="reader-conn-tier reader-conn-tier--collapsed">';
        html += '<summary class="reader-conn-tier-label reader-conn-tier-label--toggle">'
          + 'Baltimore Catechism'
          + '<span class="reader-conn-count">' + baltItems.length + '</span>'
          + '</summary>';
        baltItems.forEach(function(qa) {
          html += '<div class="reader-conn-baltimore">'
            + '<div class="reader-conn-baltimore-q">Q' + qa.id + '. ' + utils.esc(qa.question) + '</div>'
            + '<div class="reader-conn-baltimore-a">A. ' + utils.esc(qa.answer) + '</div>'
            + '</div>';
        });
        html += '</details>';
      }
    }
  }

  // Tier 2: Lectionary — when you'll hear this at Mass (collapsed)
  var lectResults = _gatherLectionary(gCCC.bible);
  if (lectResults.length) {
    html += '<details class="reader-conn-tier reader-conn-tier--collapsed">';
    html += '<summary class="reader-conn-tier-label reader-conn-tier-label--toggle">'
      + 'Heard at Mass'
      + '<span class="reader-conn-count">' + lectResults.length + '</span>'
      + '</summary>';
    lectResults.forEach(function(lr) {
      html += '<div class="reader-conn-item">'
        + '<div class="reader-conn-label">' + utils.esc(lr.label) + '</div>'
        + (lr.detail ? '<div class="reader-conn-context">' + utils.esc(lr.detail) + '</div>' : '')
        + '</div>';
    });
    html += '</details>';
  }

  // Tier 3: Summa Theologica (collapsed)
  if (gCCC.summa && gCCC.summa.length) {
    var summa = graph.getSumma();
    if (summa && summa.articles) {
      var summaItems = [];
      gCCC.summa.forEach(function(artId) {
        for (var si = 0; si < summa.articles.length; si++) {
          if (summa.articles[si].id === artId) {
            summaItems.push(summa.articles[si]);
            break;
          }
        }
      });
      if (summaItems.length) {
        html += '<details class="reader-conn-tier reader-conn-tier--collapsed">';
        html += '<summary class="reader-conn-tier-label reader-conn-tier-label--toggle">'
          + 'Summa Theologica'
          + '<span class="reader-conn-count">' + summaItems.length + '</span>'
          + '</summary>';
        summaItems.forEach(function(art) {
          html += '<div class="reader-conn-item">'
            + '<div class="reader-conn-label">' + utils.esc(art.a) + '</div>'
            + '<div class="reader-conn-context">' + utils.esc(art.q) + ' \u00b7 ' + utils.esc(art.part) + '</div>'
            + '</div>';
        });
        html += '</details>';
      }
    }
  }

  return html;
}

// ── Bible Connections ──

function _renderBibleConnections(refStr) {
  var gBible = graph.forBible(refStr);
  var html = '';

  // Tier 1: CCC paragraphs citing this verse (expanded)
  if (gBible.ccc.length) {
    html += '<div class="reader-conn-tier">';
    html += '<div class="reader-conn-tier-label">Catechism References</div>';
    var showCount = Math.min(5, gBible.ccc.length);
    for (var i = 0; i < showCount; i++) {
      var num = gBible.ccc[i];
      var text = graph.getCCCParagraph(num);
      var preview = text ? utils.getPreview(text) : '';
      var ctx = graph.getHierarchyPath(num);
      html += _renderItem('ccc', String(num), '\u00A7' + num, ctx, preview);
    }
    if (gBible.ccc.length > showCount) {
      html += '<details class="reader-conn-overflow"><summary class="reader-conn-more">'
        + (gBible.ccc.length - showCount) + ' more</summary>';
      for (var j = showCount; j < gBible.ccc.length; j++) {
        var num2 = gBible.ccc[j];
        var text2 = graph.getCCCParagraph(num2);
        var preview2 = text2 ? utils.getPreview(text2) : '';
        var ctx2 = graph.getHierarchyPath(num2);
        html += _renderItem('ccc', String(num2), '\u00A7' + num2, ctx2, preview2);
      }
      html += '</details>';
    }
    html += '</div>';
  }

  // Tier 2: Bible cross-references (collapsed)
  if (gBible.bible.length) {
    var xrefs = gBible.bible.slice(0, 20).map(function(r) {
      var ref = Array.isArray(r) ? r[0] : r;
      // Format "Luke:21:37" → "Luke 21:37"
      return ref.replace(/:(\d)/, ' $1');
    });
    if (xrefs.length) {
      html += '<details class="reader-conn-tier reader-conn-tier--collapsed">';
      html += '<summary class="reader-conn-tier-label reader-conn-tier-label--toggle">'
        + 'Cross-References'
        + '<span class="reader-conn-count">' + xrefs.length + '</span>'
        + '</summary>';
      xrefs.forEach(function(xref) {
        html += _renderItem('bible', xref, xref, '', '');
      });
      html += '</details>';
    }
  }

  // Tier 2: Lectionary (collapsed)
  if (gBible.lectionary.length) {
    var lectItems = gBible.lectionary.slice(0, 5).map(function(lr) {
      var label = lr.day.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      if (lr.cycle) label += ' (Year ' + lr.cycle + ')';
      return { label: label, detail: lr.type ? lr.type.replace(/_/g, ' ') : '' };
    });
    html += '<details class="reader-conn-tier reader-conn-tier--collapsed">';
    html += '<summary class="reader-conn-tier-label reader-conn-tier-label--toggle">'
      + 'Heard at Mass'
      + '<span class="reader-conn-count">' + lectItems.length + '</span>'
      + '</summary>';
    lectItems.forEach(function(lr) {
      html += '<div class="reader-conn-item">'
        + '<div class="reader-conn-label">' + utils.esc(lr.label) + '</div>'
        + (lr.detail ? '<div class="reader-conn-context">' + utils.esc(lr.detail) + '</div>' : '')
        + '</div>';
    });
    html += '</details>';
  }

  return html;
}

// ── Helpers ──

function _renderItem(type, ref, label, context, preview) {
  var onclick = '';
  if (type === 'ccc') {
    onclick = ' onclick="_connTap(\'ccc\',\'' + utils.esc(ref) + '\')"';
  } else if (type === 'bible') {
    onclick = ' onclick="_connTap(\'bible\',\'' + utils.esc(ref).replace(/'/g, '\\\'') + '\')"';
  }
  var html = '<div class="reader-conn-item' + (onclick ? ' reader-conn-item--tap' : '') + '"' + onclick + '>';
  html += '<div class="reader-conn-label">' + utils.esc(label) + '</div>';
  if (context) {
    html += '<div class="reader-conn-context">' + utils.esc(context) + '</div>';
  }
  if (preview) {
    html += '<div class="reader-conn-preview">' + utils.esc(preview) + '</div>';
  }
  html += '</div>';
  return html;
}

function _gatherLectionary(bibleRefs) {
  if (!bibleRefs || !bibleRefs.length) return [];
  var seen = {};
  var results = [];
  bibleRefs.slice(0, 5).forEach(function(ref) {
    var bResult = graph.forBible(ref);
    (bResult.lectionary || []).forEach(function(lr) {
      var key = lr.day + (lr.cycle || '');
      if (!seen[key]) {
        seen[key] = true;
        var label = lr.day.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        if (lr.cycle) label += ' (Year ' + lr.cycle + ')';
        results.push({ label: label, detail: lr.type ? lr.type.replace(/_/g, ' ') : '' });
      }
    });
  });
  return results.slice(0, 5);
}

// ── Window binding for onclick handlers ──

function _connTap(type, ref) {
  var haptics = require('./haptics.js');
  haptics.confirm();
  if (type === 'ccc') {
    reader.readerOpen('ccc', { num: ref });
  } else if (type === 'bible') {
    reader.readerOpen('bible', { ref: ref });
  }
}

window._connTap = _connTap;

module.exports = {
  renderConnections: renderConnections
};
