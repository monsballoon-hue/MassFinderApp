// src/snippet.js — Inline reference snippet (Tier 1)
// Expands a compact card below any tapped CCC/Bible reference.
// Dead-end by design: shows content, user reads it, dismisses it.
// Never navigates, never opens an overlay.
//
// Usage: snippet.showSnippet('ccc', '484', tappedElement)

var cccData = require('./ccc-data.js');
var bible = require('./bible.js');

var _currentSnippet = null; // { el, anchorEl, type, val, expanded }
var _CONTEXT_RADIUS = 5;    // verses before/after shown on expand

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var _closeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
var _bookSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';

// ── Show inline snippet ──

function showSnippet(type, val, anchorEl) {
  if (!anchorEl) return;

  // Toggle off if tapping the same ref again
  if (_currentSnippet && _currentSnippet.type === type && _currentSnippet.val === String(val)) {
    dismissSnippet();
    return;
  }

  dismissSnippet();

  var card = document.createElement('div');
  card.className = 'ref-snippet ref-snippet--' + type;
  card.innerHTML = '<div class="ref-snippet-loading">Loading\u2026</div>';

  // Insert after the nearest meaningful block parent of the anchor
  var insertAfter = anchorEl.closest('.exam-q')
    || anchorEl.closest('.exam-section-ccc')
    || anchorEl.closest('.rosary-mystery-meta')
    || anchorEl.closest('.rosary-mystery')
    || anchorEl.closest('.stations-scripture')
    || anchorEl.closest('p')
    || anchorEl.parentNode;

  if (!document.body.contains(insertAfter)) return;
  insertAfter.parentNode.insertBefore(card, insertAfter.nextSibling);

  _currentSnippet = { el: card, anchorEl: anchorEl, type: type, val: String(val), expanded: false };

  var haptics = require('./haptics.js');
  haptics.confirm();

  if (type === 'ccc') {
    _loadCCCSnippet(card, val);
  } else if (type === 'bible') {
    _loadBibleSnippet(card, val);
  } else {
    card.innerHTML = '<div class="ref-snippet-body"><div class="ref-snippet-text">' + _esc(type) + ' ' + _esc(val) + '</div></div>';
  }

  setTimeout(function() { card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);

  setTimeout(function() {
    document.addEventListener('click', _outsideClickHandler, true);
    document.addEventListener('keydown', _escapeHandler);
  }, 500);
}

// ── CCC Snippet ──

function _loadCCCSnippet(card, numStr) {
  cccData.load(function(d) {
    if (!_currentSnippet || _currentSnippet.el !== card) return;

    var num = parseInt(numStr, 10);
    var paragraphs = d && d.paragraphs;
    var text = paragraphs && paragraphs[num];

    var html = '<div class="ref-snippet-header">';
    html += '<span class="ref-snippet-source ref-snippet-source--ccc">\u00A7</span>';
    html += '<span class="ref-snippet-addr">Catechism \u00A7' + _esc(numStr) + '</span>';
    html += '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">' + _closeSvg + '</button>';
    html += '</div>';

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

function _loadBibleSnippet(card, refStr) {
  var parsed = bible.parseRef(refStr);

  if (!parsed) {
    card.innerHTML = '<div class="ref-snippet-header">'
      + '<span class="ref-snippet-source ref-snippet-source--bible">' + _bookSvg + '</span>'
      + '<span class="ref-snippet-addr">' + _esc(refStr) + '</span>'
      + '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">' + _closeSvg + '</button>'
      + '</div>'
      + '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--bible">' + _esc(refStr) + '</div></div>';
    return;
  }

  bible.loadBook(parsed.book.file).then(function(bookData) {
    if (!_currentSnippet || _currentSnippet.el !== card) return;

    var addrText = parsed.book.name + ' ' + parsed.chapter + ':' + parsed.startVerse
      + (parsed.endVerse > parsed.startVerse ? '\u2013' + parsed.endVerse : '');

    var html = '<div class="ref-snippet-header">';
    html += '<span class="ref-snippet-source ref-snippet-source--bible">' + _bookSvg + '</span>';
    html += '<span class="ref-snippet-addr">' + _esc(addrText) + '</span>';
    html += '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">' + _closeSvg + '</button>';
    html += '</div>';

    if (bookData && bookData.verses) {
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--bible">';
      for (var v = parsed.startVerse; v <= parsed.endVerse; v++) {
        var verseText = bookData.verses[parsed.chapter + ':' + v];
        if (verseText) {
          html += '<span class="ref-snippet-verse-num">' + v + '</span> ' + _esc(verseText) + ' ';
        }
      }
      html += '</div></div>';

      // "Show more context" only for short passages (≤4 verses)
      var verseCount = parsed.endVerse - parsed.startVerse + 1;
      if (verseCount <= 4) {
        html += '<div class="ref-snippet-actions">'
          + '<button class="ref-snippet-btn ref-snippet-btn--expand" onclick="_snippetExpandBible(\''
          + _esc(parsed.book.file) + '\',' + parsed.chapter + ',' + parsed.startVerse + ',' + parsed.endVerse
          + ')">Show more context</button>'
          + '</div>';
      }
    } else {
      html += '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--empty">Verse not found.</div></div>';
    }

    card.innerHTML = html;
  }).catch(function() {
    if (!_currentSnippet || _currentSnippet.el !== card) return;
    card.innerHTML = '<div class="ref-snippet-header">'
      + '<span class="ref-snippet-source ref-snippet-source--bible">' + _bookSvg + '</span>'
      + '<span class="ref-snippet-addr">' + _esc(refStr) + '</span>'
      + '<button class="ref-snippet-close" onclick="_snippetDismiss()" aria-label="Dismiss">' + _closeSvg + '</button>'
      + '</div>'
      + '<div class="ref-snippet-body"><div class="ref-snippet-text ref-snippet-text--empty">Not available offline.</div></div>';
  });
}

// ── Expand: show ±5 verses of context ──

function _expandBible(bookFile, chapter, startVerse, endVerse) {
  if (!_currentSnippet) return;
  var card = _currentSnippet.el;
  var bookData = bible.getBookCached(bookFile);
  if (!bookData || !bookData.verses) return;

  var body = card.querySelector('.ref-snippet-body');
  if (!body) return;

  // Gather chapter verses sorted
  var chapterVerses = [];
  Object.keys(bookData.verses).forEach(function(key) {
    var parts = key.split(':');
    if (parseInt(parts[0], 10) === chapter) {
      chapterVerses.push({ num: parseInt(parts[1], 10), text: bookData.verses[key] });
    }
  });
  chapterVerses.sort(function(a, b) { return a.num - b.num; });

  var lo = Math.max(1, startVerse - _CONTEXT_RADIUS);
  var hi = endVerse + _CONTEXT_RADIUS;
  if (chapterVerses.length) hi = Math.min(hi, chapterVerses[chapterVerses.length - 1].num);

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

  var expandBtn = card.querySelector('.ref-snippet-btn--expand');
  if (expandBtn) {
    expandBtn.textContent = 'Show less';
    expandBtn.className = 'ref-snippet-btn ref-snippet-btn--collapse';
    expandBtn.onclick = function() { _collapseBible(bookFile, chapter, startVerse, endVerse); };
  }

  card.classList.add('ref-snippet--expanded');
  _currentSnippet.expanded = true;

  setTimeout(function() {
    var target = card.querySelector('.ref-snippet-verse--target');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function _collapseBible(bookFile, chapter, startVerse, endVerse) {
  if (!_currentSnippet) return;
  var card = _currentSnippet.el;
  var bookData = bible.getBookCached(bookFile);
  if (!bookData || !bookData.verses) return;

  var body = card.querySelector('.ref-snippet-body');
  if (!body) return;

  var html = '<div class="ref-snippet-text ref-snippet-text--bible">';
  for (var v = startVerse; v <= endVerse; v++) {
    var verseText = bookData.verses[chapter + ':' + v];
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
  if (e.target.closest && e.target.closest('.ref-tap')) return;
  if (e.target.closest && (e.target.closest('.exam-q') || e.target.closest('.exam-checkbox'))) return;
  if (e.target.closest && (e.target.closest('.rosary-beads') || e.target.closest('.rosary-bead'))) return;
  if (e.target.closest && (e.target.closest('.exam-nav') || e.target.closest('.rosary-nav-btn'))) return;
  dismissSnippet();
}

function _escapeHandler(e) {
  if (e.key === 'Escape') dismissSnippet();
}

// Window bindings used in generated HTML
window._snippetDismiss = dismissSnippet;
window._snippetExpandBible = _expandBible;

module.exports = {
  showSnippet: showSnippet,
  dismissSnippet: dismissSnippet,
};
