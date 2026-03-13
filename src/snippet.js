// src/snippet.js — Inline reference snippet (Tier 1)
// Expands a compact card below any tapped CCC/Bible reference.
// Dead-end by design: shows content, user reads it, dismisses it.
// Never navigates, never opens an overlay, never links out.
//
// Usage: snippet.showSnippet('ccc', '484', tappedElement)

var graph = require('./graph.js');
var bible = require('./bible.js');

var _currentSnippet = null; // { el: DOM, anchorEl: DOM, type, val }

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Show inline snippet ──

function showSnippet(type, val, anchorEl) {
  if (!anchorEl) return;

  // If tapping the same ref, toggle off
  if (_currentSnippet && _currentSnippet.type === type && _currentSnippet.val === String(val)) {
    dismissSnippet();
    return;
  }

  dismissSnippet(); // close any existing

  var card = document.createElement('div');
  card.className = 'ref-snippet ref-snippet--' + type;
  card.setAttribute('data-snippet-type', type);
  card.setAttribute('data-snippet-id', String(val));
  card.innerHTML = '<div class="ref-snippet-loading">Loading\u2026</div>';

  // Find insertion point — after the nearest block-level parent of the anchor.
  // Order matters: most specific first. For exam, .exam-q (the label) inserts
  // the snippet right after that question. .exam-ccc-ref for section-level refs.
  var insertAfter = anchorEl.closest('.exam-q')
    || anchorEl.closest('.exam-ccc-ref')
    || anchorEl.closest('.rosary-mystery-meta')
    || anchorEl.closest('.rosary-mystery')
    || anchorEl.closest('.stations-scripture')
    || anchorEl.closest('.devotion-detail-body')
    || anchorEl.closest('p')
    || anchorEl.parentNode;

  insertAfter.parentNode.insertBefore(card, insertAfter.nextSibling);

  _currentSnippet = { el: card, anchorEl: anchorEl, type: type, val: String(val), expanded: false };

  // Haptic feedback
  var haptics = require('./haptics.js');
  haptics.confirm();

  // Load data and render
  if (type === 'ccc') {
    _loadCCCSnippet(card, val);
  } else if (type === 'bible') {
    _loadBibleSnippet(card, val);
  } else {
    card.innerHTML = '<div class="ref-snippet-body"><div class="ref-snippet-text">Reference: ' + _esc(type) + ' ' + _esc(val) + '</div></div>';
  }

  // Scroll into view
  setTimeout(function() {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);

  // Wire dismiss on outside click (delayed to avoid catching the current tap)
  setTimeout(function() {
    document.addEventListener('click', _outsideClickHandler, true);
    document.addEventListener('keydown', _escapeHandler);
  }, 100);
}

// ── CCC Snippet ──
// Shows: header + full paragraph text + close button. Nothing else.

function _loadCCCSnippet(card, numStr) {
  graph.ensure(['ccc', 'hierarchy']).then(function() {
    if (!_currentSnippet || _currentSnippet.el !== card) return; // dismissed

    var num = parseInt(numStr, 10);
    var text = graph.getCCCParagraph(num);
    var hierarchy = graph.getCCCHierarchy();

    var html = '<div class="ref-snippet-header">';
    html += '<span class="ref-snippet-source ref-snippet-source--ccc">\u00A7</span>';
    html += '<span class="ref-snippet-addr">Catechism \u00A7' + _esc(numStr) + '</span>';

    // Hierarchy context
    if (hierarchy && hierarchy.lookup && hierarchy.lookup[num]) {
      var idx = hierarchy.lookup[num];
      var h = hierarchy.hierarchy;
      var ctx = [];
      if (idx[0] >= 0 && h[idx[0]]) ctx.push(h[idx[0]].title);
      if (idx[2] >= 0 && h[idx[0]] && h[idx[0]].sections && h[idx[0]].sections[idx[1]] &&
          h[idx[0]].sections[idx[1]].chapters && h[idx[0]].sections[idx[1]].chapters[idx[2]]) {
        ctx.push(h[idx[0]].sections[idx[1]].chapters[idx[2]].title);
      }
      if (ctx.length) {
        html += '<span class="ref-snippet-context">' + _esc(ctx.join(' \u203A ')) + '</span>';
      }
    }

    html += '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>';
    html += '</div>';

    // Paragraph text — the whole thing, no truncation
    if (text) {
      var clean = text.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/^>/gm, '').trim();
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text">' + clean + '</div></div>';
    } else {
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--empty">Paragraph not found.</div></div>';
    }

    card.innerHTML = html;
  });
}

// ── Bible Snippet ──
// Shows: header + verse text + "Show full chapter" toggle + close button. Nothing else.

function _loadBibleSnippet(card, refStr) {
  var parsed = bible.parseRef ? bible.parseRef(refStr) : null;
  if (!parsed) {
    // Unparseable reference — show the reference text and close button
    card.innerHTML = '<div class="ref-snippet-header">'
      + '<span class="ref-snippet-source ref-snippet-source--bible">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>'
      + '</span>'
      + '<span class="ref-snippet-addr">' + _esc(refStr) + '</span>'
      + '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button></div>'
      + '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--bible">' + _esc(refStr) + '</div></div>';
    return;
  }

  // Load the book
  graph.loadBibleBook(parsed.book.file).then(function(bookData) {
    if (!_currentSnippet || _currentSnippet.el !== card) return;

    var html = '<div class="ref-snippet-header">';
    html += '<span class="ref-snippet-source ref-snippet-source--bible">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>'
      + '</span>';
    html += '<span class="ref-snippet-addr">' + _esc(parsed.book.name + ' ' + parsed.chapter + ':' + parsed.startVerse
      + (parsed.endVerse > parsed.startVerse ? '\u2013' + parsed.endVerse : '')) + '</span>';
    html += '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>';
    html += '</div>';

    // Render verse(s)
    if (bookData && bookData.verses) {
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--bible">';
      for (var v = parsed.startVerse; v <= parsed.endVerse; v++) {
        var key = parsed.chapter + ':' + v;
        var verseText = bookData.verses[key];
        if (verseText) {
          html += '<span class="ref-snippet-verse-num">' + v + '</span> ' + _esc(verseText) + ' ';
        }
      }
      html += '</div></div>';

      // "Show more context" only when the snippet is short (4 or fewer verses).
      // Long passages (5+) already give enough context — no need to expand.
      var verseCount = parsed.endVerse - parsed.startVerse + 1;
      if (verseCount <= 4) {
        html += '<div class="ref-snippet-actions">';
        html += '<button class="ref-snippet-btn ref-snippet-btn--expand" onclick="_snippetExpandBible(\''
          + _esc(parsed.book.file) + '\',' + parsed.chapter + ',' + parsed.startVerse + ',' + parsed.endVerse
          + ')">Show more context</button>';
        html += '</div>';
      }
    } else {
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--empty">Verse not found.</div></div>';
    }

    card.innerHTML = html;
  }).catch(function() {
    if (!_currentSnippet || _currentSnippet.el !== card) return;
    card.innerHTML = '<div class="ref-snippet-header">'
      + '<span class="ref-snippet-source ref-snippet-source--bible">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>'
      + '</span>'
      + '<span class="ref-snippet-addr">' + _esc(refStr) + '</span>'
      + '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button></div>'
      + '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--empty">Not available offline.</div></div>';
  });
}

// ── Expand: show surrounding context ──
// Adds ~5 verses before and after the original range for context,
// with the original verses highlighted. Not the full chapter.

var _CONTEXT_RADIUS = 5; // verses before/after to show

function _expandBible(bookFile, chapter, startVerse, endVerse) {
  if (!_currentSnippet) return;
  var card = _currentSnippet.el;
  var bookData = graph.getBibleBookCached(bookFile);
  if (!bookData || !bookData.verses) return;

  var body = card.querySelector('.ref-snippet-body');
  if (!body) return;

  // Gather all verses in this chapter
  var chapterVerses = [];
  Object.keys(bookData.verses).forEach(function(key) {
    var parts = key.split(':');
    if (parseInt(parts[0], 10) === chapter) {
      chapterVerses.push({ num: parseInt(parts[1], 10), text: bookData.verses[key] });
    }
  });
  chapterVerses.sort(function(a, b) { return a.num - b.num; });

  // Determine the window: startVerse - RADIUS to endVerse + RADIUS
  var lo = Math.max(1, startVerse - _CONTEXT_RADIUS);
  var hi = endVerse + _CONTEXT_RADIUS;
  // Cap at actual chapter length
  if (chapterVerses.length) {
    hi = Math.min(hi, chapterVerses[chapterVerses.length - 1].num);
  }

  var html = '<div class="ref-snippet-text ref-snippet-text--bible ref-snippet-text--expanded">';
  chapterVerses.forEach(function(v) {
    if (v.num < lo || v.num > hi) return;
    var isTarget = v.num >= startVerse && v.num <= endVerse;
    var cls = isTarget ? ' ref-snippet-verse--target' : '';
    html += '<span class="ref-snippet-verse' + cls + '">'
      + '<span class="ref-snippet-verse-num">' + v.num + '</span> '
      + _esc(v.text) + '</span> ';
  });
  html += '</div>';
  body.innerHTML = html;

  // Replace expand button with collapse
  var expandBtn = card.querySelector('.ref-snippet-btn--expand');
  if (expandBtn) {
    expandBtn.textContent = 'Show less';
    expandBtn.className = 'ref-snippet-btn ref-snippet-btn--collapse';
    expandBtn.onclick = function() { _collapseBible(bookFile, chapter, startVerse, endVerse); };
  }

  card.classList.add('ref-snippet--expanded');
  _currentSnippet.expanded = true;

  // Scroll first target verse into view
  setTimeout(function() {
    var target = card.querySelector('.ref-snippet-verse--target');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function _collapseBible(bookFile, chapter, startVerse, endVerse) {
  if (!_currentSnippet) return;
  var card = _currentSnippet.el;
  var bookData = graph.getBibleBookCached(bookFile);
  if (!bookData || !bookData.verses) return;

  var body = card.querySelector('.ref-snippet-body');
  if (!body) return;

  // Restore just the original verse range
  var html = '<div class="ref-snippet-text ref-snippet-text--bible">';
  for (var v = startVerse; v <= endVerse; v++) {
    var key = chapter + ':' + v;
    var verseText = bookData.verses[key];
    if (verseText) {
      html += '<span class="ref-snippet-verse-num">' + v + '</span> ' + _esc(verseText) + ' ';
    }
  }
  html += '</div>';
  body.innerHTML = html;

  var collapseBtn = card.querySelector('.ref-snippet-btn--collapse');
  if (collapseBtn) {
    collapseBtn.textContent = 'Show more context';
    collapseBtn.className = 'ref-snippet-btn ref-snippet-btn--expand';
    collapseBtn.onclick = function() { _expandBible(bookFile, chapter, startVerse, endVerse); };
  }

  card.classList.remove('ref-snippet--expanded');
  _currentSnippet.expanded = false;
}

// ── Dismiss ──

function dismissSnippet() {
  if (_currentSnippet) {
    if (_currentSnippet.el && _currentSnippet.el.parentNode) {
      _currentSnippet.el.parentNode.removeChild(_currentSnippet.el);
    }
    _currentSnippet = null;
  }
  document.removeEventListener('click', _outsideClickHandler, true);
  document.removeEventListener('keydown', _escapeHandler);
}

function _outsideClickHandler(e) {
  if (!_currentSnippet) return;
  if (_currentSnippet.el && _currentSnippet.el.contains(e.target)) return;
  if (_currentSnippet.anchorEl && _currentSnippet.anchorEl.contains(e.target)) return;
  if (e.target.closest('.ref-tap')) return;
  dismissSnippet();
}

function _escapeHandler(e) {
  if (e.key === 'Escape') dismissSnippet();
}

// ── Window bindings ──
window._snippetDismiss = dismissSnippet;
window._snippetExpandBible = _expandBible;

module.exports = {
  showSnippet: showSnippet,
  dismissSnippet: dismissSnippet
};
