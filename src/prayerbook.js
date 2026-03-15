// src/prayerbook.js — Prayer Book Module (PMB-02 through PMB-09)
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');
function _t(item, field) { return utils.getPrayerText(item, field); }

// ── State ──
var _data = null;        // full prayerbook.json
var _screen = 'list';    // 'list' | 'litany' | 'lectio'
var _searchQuery = '';
var _openPrayerId = null; // currently expanded prayer
var _wakeLock = null;

// Litany step-through state
var _litany = null;       // current litany object
var _litanyStep = 0;      // current invocation index
var _touchStartX = 0;
var _touchStartY = 0;

// Lectio Divina state
var _lectioStep = 0;      // 0=intro, 1-4 = four movements
var _lectioGospel = null;  // today's gospel text

// ── Reader module registration ──
reader.registerModule('prayerbook', {
  getTitle: function() { return 'Prayer Book'; },
  render: function(params, bodyEl, footerEl) {
    bodyEl.innerHTML = '<div class="prayerbook-loading"><div class="rosary-loading-spinner"></div><p>Loading prayers\u2026</p></div>';
    footerEl.style.display = 'none';
    footerEl.innerHTML = '';

    _load().then(function() {
      _screen = 'list';
      _searchQuery = '';
      _openPrayerId = null;

      // PMB-08: Deep-link to specific prayer
      if (params && params.prayerId) {
        _openPrayerId = params.prayerId;
      }

      _render();
    });
  },
  onClose: function() {
    _releaseWakeLock();
    _teardownSwipe();
  }
});

// ── Load prayer data (lazy) ──
function _load() {
  if (_data) return Promise.resolve(_data);
  return fetch('/data/prayerbook.json').then(function(r) { return r.json(); })
    .then(function(d) { _data = d; return d; });
}

// ── Wake Lock (for litany/lectio) ──
function _acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock.request('screen').then(function(lock) {
    _wakeLock = lock;
    lock.addEventListener('release', function() { _wakeLock = null; });
  }).catch(function() {});
}

function _releaseWakeLock() {
  if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
}

// ── Open / Close ──
function openPrayerBook(prayerId) {
  reader.readerOpen('prayerbook', { prayerId: prayerId || null });
}

function closePrayerBook() {
  reader.readerClose();
}

// ── PMB-05: V/R Formatting ──
function _formatPrayerText(text) {
  if (!text) return '';
  var escaped = utils.esc(text).replace(/\r\n/g, '\n');
  var lines = escaped.split('\n');
  var html = '';
  var inParagraph = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line === '') {
      if (inParagraph) { html += '</p><p>'; inParagraph = false; }
      continue;
    }
    if (!inParagraph) { inParagraph = true; }

    // V/R formatting
    if (line.match(/^V\.\s/)) {
      html += '<span class="vr-line vr-versicle"><span class="vr-label">V.</span> ' + line.slice(3) + '</span><br>';
    } else if (line.match(/^R\.\s/)) {
      html += '<span class="vr-line vr-response"><span class="vr-label">R.</span> <strong>' + line.slice(3) + '</strong></span><br>';
    } else {
      html += line + '<br>';
    }
  }

  return '<p>' + html + '</p>';
}

// ── Search/Filter ──
function prayerbookSearch(query) {
  _searchQuery = (query || '').toLowerCase().trim();
  _openPrayerId = null;
  _renderList();
  _haptic();
}

function _matchesSearch(prayer) {
  if (!_searchQuery) return true;
  var q = _searchQuery;
  if (prayer.title.toLowerCase().indexOf(q) >= 0) return true;
  if (prayer.aka && prayer.aka.toLowerCase().indexOf(q) >= 0) return true;
  if (prayer.tags) {
    for (var t = 0; t < prayer.tags.length; t++) {
      if (prayer.tags[t].toLowerCase().indexOf(q) >= 0) return true;
    }
  }
  if (prayer.text && prayer.text.substring(0, 80).toLowerCase().indexOf(q) >= 0) return true;
  return false;
}

// PBR-05: Track recently opened prayers
function _trackRecent(prayerId) {
  try {
    var recent = JSON.parse(localStorage.getItem('mf-prayerbook-recent') || '[]');
    recent = recent.filter(function(id) { return id !== prayerId; });
    recent.unshift(prayerId);
    if (recent.length > 3) recent = recent.slice(0, 3);
    localStorage.setItem('mf-prayerbook-recent', JSON.stringify(recent));
  } catch (e) {}
}

// ── Toggle expand/collapse ──
function prayerbookToggle(prayerId) {
  if (_openPrayerId === prayerId) {
    _openPrayerId = null;
  } else {
    _openPrayerId = prayerId;
    _trackRecent(prayerId);
  }
  _renderList();
  _haptic();
}

// ── Open litany step-through ──
function prayerbookOpenLitany(litanyId) {
  var litanies = _data.litanies || [];
  _litany = null;
  for (var i = 0; i < litanies.length; i++) {
    if (litanies[i].id === litanyId) { _litany = litanies[i]; break; }
  }
  if (!_litany) return;
  _litanyStep = 0;
  _screen = 'litany';
  _acquireWakeLock();
  _initSwipe();
  _render();
  _haptic();
}

// ── Open Lectio Divina ──
function prayerbookOpenLectio() {
  _lectioStep = 0;
  _lectioGospel = null;
  _screen = 'lectio';
  _acquireWakeLock();
  _initSwipe();

  // Try to get today's Gospel from readings module
  try {
    var readingsCache = window._readingsCache;
    if (readingsCache && readingsCache.gospel) {
      _lectioGospel = readingsCache.gospel;
    }
  } catch (e) {}

  _render();
  _haptic();
}

// ── Swipe gesture ──
function _initSwipe() {
  var body = document.getElementById('readerBody');
  if (!body) return;
  body.addEventListener('touchstart', _onTouchStart, { passive: true });
  body.addEventListener('touchend', _onTouchEnd, { passive: true });
}

function _teardownSwipe() {
  var body = document.getElementById('readerBody');
  if (!body) return;
  body.removeEventListener('touchstart', _onTouchStart);
  body.removeEventListener('touchend', _onTouchEnd);
}

function _onTouchStart(e) {
  _touchStartX = e.changedTouches[0].clientX;
  _touchStartY = e.changedTouches[0].clientY;
}

function _onTouchEnd(e) {
  var dx = e.changedTouches[0].clientX - _touchStartX;
  var dy = e.changedTouches[0].clientY - _touchStartY;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  if (_screen === 'litany') {
    if (dx < 0) prayerbookLitanyNext();
    else prayerbookLitanyPrev();
  } else if (_screen === 'lectio') {
    if (dx < 0) prayerbookLectioNext();
    else prayerbookLectioPrev();
  }
}

// ── Litany navigation ──
function prayerbookLitanyNext() {
  if (!_litany) return;
  if (_litanyStep < _litany.invocations.length - 1) {
    _litanyStep++;
  } else {
    // Show closing
    _litanyStep = _litany.invocations.length; // past last = closing
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

function prayerbookLitanyPrev() {
  if (_litanyStep > 0) {
    _litanyStep--;
  } else {
    // Back to list
    _screen = 'list';
    _releaseWakeLock();
    _teardownSwipe();
  }
  _haptic();
  _transitionTo(function() { _render(); });
}

function prayerbookLitanyClose() {
  _screen = 'list';
  _releaseWakeLock();
  _teardownSwipe();
  _render();
  _haptic();
}

// ── Lectio Divina navigation ──
function prayerbookLectioNext() {
  if (_lectioStep < 4) {
    _lectioStep++;
    _haptic();
    _transitionTo(function() { _render(); });
  } else {
    // Complete — log and close
    try {
      var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
      log.push({ type: 'lectio', date: new Date().toISOString().slice(0, 10) });
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      log = log.filter(function(e) { return e.date >= cutoff; });
      localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    } catch (e) {}
    _screen = 'list';
    _releaseWakeLock();
    _teardownSwipe();
    _haptic.confirm();
    _render();
  }
}

function prayerbookLectioPrev() {
  if (_lectioStep > 0) {
    _lectioStep--;
    _haptic();
    _transitionTo(function() { _render(); });
  } else {
    _screen = 'list';
    _releaseWakeLock();
    _teardownSwipe();
    _haptic();
    _render();
  }
}

// ── Crossfade transition ──
function _transitionTo(renderFn) {
  var body = document.getElementById('readerBody');
  if (!body) { renderFn(); return; }
  body.style.transition = 'opacity 150ms ease';
  body.style.opacity = '0';
  setTimeout(function() {
    renderFn();
    if (body) body.scrollTop = 0;
    body.style.transition = 'opacity 200ms ease';
    body.style.opacity = '1';
  }, 150);
}

// ── Render dispatcher ──
function _render() {
  var title = document.getElementById('readerTitle');
  var body = document.getElementById('readerBody');
  var footer = document.getElementById('readerFooter');

  if (_screen === 'list') {
    title.textContent = 'Prayer Book';
    footer.innerHTML = '';
    footer.style.display = 'none';
    _renderList();
  } else if (_screen === 'litany') {
    title.textContent = _litany ? _litany.title : 'Litany';
    _renderLitany(body, footer);
  } else if (_screen === 'lectio') {
    title.textContent = 'Lectio Divina';
    _renderLectio(body, footer);
  }
}

// ── Render: Prayer list ──
function _renderList() {
  var body = document.getElementById('readerBody');
  if (!body) return;

  var html = '<div class="prayerbook-list">';

  // PBR-02: Quick access pills (non-search only)
  if (!_searchQuery) {
    var quickIds = ['sign_of_cross', 'our_father', 'hail_mary', 'glory_be', 'act_of_contrition_traditional'];
    html += '<div class="prayerbook-quick">';
    quickIds.forEach(function(id) {
      var prayer = null;
      _data.categories.forEach(function(cat) {
        cat.prayers.forEach(function(p) { if (p.id === id) prayer = p; });
      });
      if (prayer) {
        html += '<button class="prayerbook-quick-pill" onclick="prayerbookToggle(\'' + utils.esc(prayer.id) + '\')">'
          + utils.esc(_t(prayer, 'title')) + '</button>';
      }
    });
    html += '</div>';
  }

  // Search input
  html += '<div class="prayerbook-search">'
    + '<input type="search" class="prayerbook-search-input" placeholder="Search prayers\u2026"'
    + ' value="' + utils.esc(_searchQuery) + '"'
    + ' oninput="prayerbookSearch(this.value)"'
    + ' autocomplete="off" autocorrect="off" spellcheck="false">'
    + '</div>';

  if (_searchQuery) {
    // Flat search results
    var results = [];
    _data.categories.forEach(function(cat) {
      cat.prayers.forEach(function(p) {
        if (_matchesSearch(p)) results.push(p);
      });
    });
    // Also search litanies
    (_data.litanies || []).forEach(function(lit) {
      if (lit.title.toLowerCase().indexOf(_searchQuery) >= 0) {
        results.push({ id: lit.id, title: lit.title, type: 'litany', tags: lit.tags });
      }
    });
    // Also search lectio
    if (_data.lectio && _data.lectio.title.toLowerCase().indexOf(_searchQuery) >= 0) {
      results.push({ id: _data.lectio.id, title: _data.lectio.title, type: 'lectio', tags: _data.lectio.tags });
    }

    if (results.length === 0) {
      html += '<p class="prayerbook-empty">No prayers found for \u201C' + utils.esc(_searchQuery) + '\u201D</p>';
    } else {
      results.forEach(function(p) {
        html += _renderPrayerRow(p);
      });
    }
  } else {
    // PBR-05: Recently opened prayers (skip when a prayer is expanded to avoid duplicate render)
    var recentIds = [];
    try { recentIds = JSON.parse(localStorage.getItem('mf-prayerbook-recent') || '[]'); } catch (e) {}
    if (recentIds.length && !_openPrayerId) {
      var recentPrayers = [];
      recentIds.forEach(function(rid) {
        _data.categories.forEach(function(cat) {
          cat.prayers.forEach(function(p) { if (p.id === rid) recentPrayers.push(p); });
        });
      });
      if (recentPrayers.length) {
        html += '<div class="prayerbook-category">';
        html += '<h3 class="prayerbook-category-title">Recent</h3>';
        recentPrayers.forEach(function(p) { html += _renderPrayerRow(p); });
        html += '</div>';
      }
    }

    // Category view
    _data.categories.forEach(function(cat) {
      html += '<div class="prayerbook-category">';
      html += '<h3 class="prayerbook-category-title">' + utils.esc(_t(cat, 'title')) + '</h3>';
      cat.prayers.forEach(function(p) {
        html += _renderPrayerRow(p);
      });
      html += '</div>';
    });

    // PBR-03: Guided section divider
    var hasGuided = (_data.litanies && _data.litanies.length) || _data.lectio;
    if (hasGuided) {
      html += '<div class="prayerbook-guided-section">';

      // Litanies section
      if (_data.litanies && _data.litanies.length) {
        html += '<div class="prayerbook-category">';
        html += '<h3 class="prayerbook-category-title">Guided Litanies</h3>';
        _data.litanies.forEach(function(lit) {
          html += '<button class="prayerbook-row prayerbook-row--guided" onclick="prayerbookOpenLitany(\'' + utils.esc(lit.id) + '\')">'
            + '<span class="prayerbook-row-title">' + utils.esc(_t(lit, 'title')) + '</span>'
            + '<span class="prayerbook-guided-badge">Guided</span>'
            + '</button>';
        });
        html += '</div>';
      }

      // Lectio Divina
      if (_data.lectio) {
        html += '<div class="prayerbook-category">';
        html += '<h3 class="prayerbook-category-title">Contemplative</h3>';
        html += '<button class="prayerbook-row prayerbook-row--guided" onclick="prayerbookOpenLectio()">'
          + '<span class="prayerbook-row-title">' + utils.esc(_data.lectio.title) + '</span>'
          + '<span class="prayerbook-guided-badge">Guided</span>'
          + '</button>';
        html += '</div>';
      }

      html += '</div>';
    }
  }

  html += '</div>';
  body.innerHTML = html;

  // Scroll to expanded prayer if one is open
  if (_openPrayerId) {
    var openEl = document.getElementById('prayer-' + _openPrayerId);
    if (openEl) {
      setTimeout(function() { openEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
    }
  }
}

// ── Render a single prayer row ──
function _renderPrayerRow(prayer) {
  if (prayer.type === 'litany') {
    return '<button class="prayerbook-row prayerbook-row--guided" onclick="prayerbookOpenLitany(\'' + utils.esc(prayer.id) + '\')">'
      + '<span class="prayerbook-row-title">' + utils.esc(_t(prayer, 'title')) + '</span>'
      + '<span class="prayerbook-guided-badge">Guided</span>'
      + '</button>';
  }
  if (prayer.type === 'lectio') {
    return '<button class="prayerbook-row prayerbook-row--guided" onclick="prayerbookOpenLectio()">'
      + '<span class="prayerbook-row-title">' + utils.esc(_t(prayer, 'title')) + '</span>'
      + '<span class="prayerbook-guided-badge">Guided</span>'
      + '</button>';
  }

  var isOpen = _openPrayerId === prayer.id;
  // PBR-04: Length indicator
  var lengthLabel = '';
  if (!isOpen && prayer.text) {
    var wc = _t(prayer, 'text').split(/\s+/).length;
    if (wc <= 40) lengthLabel = '<span class="prayerbook-length">brief</span>';
    else if (wc > 100) lengthLabel = '<span class="prayerbook-length">long</span>';
  }
  var html = '<div class="prayerbook-row' + (isOpen ? ' prayerbook-row--open' : '') + '" id="prayer-' + utils.esc(prayer.id) + '">';
  html += '<button class="prayerbook-row-header" onclick="prayerbookToggle(\'' + utils.esc(prayer.id) + '\')">';
  html += '<span class="prayerbook-row-title">' + utils.esc(_t(prayer, 'title')) + '</span>';
  html += lengthLabel;
  html += '<svg class="prayerbook-chevron' + (isOpen ? ' open' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  html += '</button>';

  if (isOpen && prayer.text) {
    html += '<div class="prayerbook-text">' + _formatPrayerText(_t(prayer, 'text')) + '</div>';
  }

  html += '</div>';
  return html;
}

// ── Render: Litany step-through (PMB-06) ──
function _renderLitany(body, footer) {
  if (!_litany) return;
  var total = _litany.invocations.length;
  var isClosing = _litanyStep >= total;

  if (isClosing) {
    // Closing screen
    body.innerHTML = '<div class="litany-step">'
      + '<div class="litany-counter">' + utils.esc(_litany.title) + '</div>'
      + '<div class="litany-invocation">' + utils.esc(_litany.closing || 'Amen.') + '</div>'
      + '</div>';
    footer.style.display = '';
    footer.innerHTML = '<div style="display:flex"><button class="rosary-nav-btn rosary-nav-primary" onclick="prayerbookLitanyClose()">Amen</button></div>';
  } else {
    var inv = _litany.invocations[_litanyStep];
    var pct = Math.round(((_litanyStep + 1) / total) * 100);

    body.innerHTML = '<div class="litany-step">'
      + '<div class="litany-counter">' + (_litanyStep + 1) + ' of ' + total + '</div>'
      + '<div class="litany-progress"><div class="litany-progress-fill" style="width:' + pct + '%"></div></div>'
      + '<div class="litany-invocation">' + utils.esc(_t(inv, 'petition')) + '</div>'
      + '<div class="litany-response">' + utils.esc(_t(inv, 'response')) + '</div>'
      + '</div>';
    footer.style.display = '';
    footer.innerHTML = '<div style="display:flex;gap:var(--space-3)">'
      + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="prayerbookLitanyPrev()">' + (_litanyStep === 0 ? '\u2190 Back' : '\u2190 Prev') + '</button>'
      + '<button class="rosary-nav-btn rosary-nav-primary" onclick="prayerbookLitanyNext()">' + (_litanyStep < total - 1 ? 'Continue \u2192' : 'Closing \u2192') + '</button>'
      + '</div>';
  }
}

// ── Render: Lectio Divina (PMB-07) ──
function _renderLectio(body, footer) {
  var steps = _data.lectio.steps;

  if (_lectioStep === 0) {
    // Intro screen
    var gospelRef = _lectioGospel ? _lectioGospel.ref || 'Today\u2019s Gospel' : '';
    body.innerHTML = '<div class="lectio-step lectio-intro">'
      + '<h2 class="lectio-title">Lectio Divina</h2>'
      + '<p class="lectio-subtitle">Sacred Reading</p>'
      + '<p class="lectio-desc">' + utils.esc(_data.lectio.description) + '</p>'
      + (gospelRef ? '<p class="lectio-gospel-ref">' + utils.esc(gospelRef) + '</p>' : '')
      + '</div>';
    footer.style.display = '';
    footer.innerHTML = '<div style="display:flex;gap:var(--space-3)">'
      + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="prayerbookLectioPrev()">\u2190 Back</button>'
      + '<button class="rosary-nav-btn rosary-nav-primary" onclick="prayerbookLectioNext()">Begin \u2192</button>'
      + '</div>';
  } else {
    var step = steps[_lectioStep - 1];
    var dotsHtml = '<div class="lectio-dots">';
    for (var i = 0; i < 4; i++) {
      dotsHtml += '<div class="lectio-dot' + (i < _lectioStep ? ' done' : '') + (i === _lectioStep - 1 ? ' active' : '') + '"></div>';
    }
    dotsHtml += '</div>';

    var contentHtml = '';
    if (_lectioStep === 1) {
      // Read — show Gospel text
      var gospelText = _lectioGospel && _lectioGospel.text
        ? '<div class="lectio-gospel">' + _formatPrayerText(_lectioGospel.text) + '</div>'
        : '<p class="lectio-gospel-placeholder">The Gospel reading will appear here when readings are available. For now, open your Bible to today\u2019s Gospel.</p>';
      contentHtml = gospelText;
    } else if (_lectioStep === 2) {
      // Meditate — faded Gospel
      var gospelFaded = _lectioGospel && _lectioGospel.text
        ? '<div class="lectio-gospel lectio-gospel--faded">' + _formatPrayerText(_lectioGospel.text) + '</div>'
        : '';
      contentHtml = gospelFaded;
    } else if (_lectioStep === 3) {
      // Pray — cross icon
      contentHtml = '<div class="lectio-pray-icon">'
        + '<svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="64"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>'
        + '</div>';
    } else if (_lectioStep === 4) {
      // Rest — vast whitespace, minimal
      contentHtml = '<div class="lectio-rest"></div>';
    }

    body.innerHTML = '<div class="lectio-step">'
      + dotsHtml
      + '<div class="lectio-label">' + utils.esc(step.latin) + '</div>'
      + '<h3 class="lectio-english">' + utils.esc(_t(step, 'english')) + '</h3>'
      + '<p class="lectio-instruction">' + utils.esc(_t(step, 'instruction')) + '</p>'
      + contentHtml
      + '</div>';

    var isLast = _lectioStep === 4;
    footer.style.display = '';
    footer.innerHTML = '<div style="display:flex;gap:var(--space-3)">'
      + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="prayerbookLectioPrev()">\u2190 Back</button>'
      + '<button class="rosary-nav-btn rosary-nav-primary" onclick="prayerbookLectioNext()">' + (isLast ? 'Amen' : 'Continue \u2192') + '</button>'
      + '</div>';
  }
}

module.exports = {
  openPrayerBook: openPrayerBook,
  closePrayerBook: closePrayerBook,
  prayerbookSearch: prayerbookSearch,
  prayerbookToggle: prayerbookToggle,
  prayerbookOpenLitany: prayerbookOpenLitany,
  prayerbookOpenLectio: prayerbookOpenLectio,
  prayerbookLitanyNext: prayerbookLitanyNext,
  prayerbookLitanyPrev: prayerbookLitanyPrev,
  prayerbookLitanyClose: prayerbookLitanyClose,
  prayerbookLectioNext: prayerbookLectioNext,
  prayerbookLectioPrev: prayerbookLectioPrev,
};
