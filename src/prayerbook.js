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

// PLR-02: Category filters
var _activeFilters = [];

// PLR-04: Favorites
var _favorites = [];
function _loadFavorites() {
  try { _favorites = JSON.parse(localStorage.getItem('mf-prayerbook-favs') || '[]'); } catch (e) { _favorites = []; }
}
function _saveFavorites() {
  try { localStorage.setItem('mf-prayerbook-favs', JSON.stringify(_favorites)); } catch (e) {}
}

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
  if (_searchQuery) _activeFilters = [];
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
  _litanyStep = -1;
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

  // PLR-02: Category filter chips (non-search only)
  if (!_searchQuery) {
    html += '<div class="prayerbook-intro">Your companion for daily prayer</div>';
    var _chipDefs = [
      { id: 'essential', label: 'Essential' },
      { id: 'morning_evening', label: 'Daily' },
      { id: 'marian', label: 'Marian' },
      { id: 'saints', label: 'Saints' },
      { id: 'sacramental', label: 'Sacrament' },
      { id: 'guided', label: 'Guided' }
    ];
    html += '<div class="prayerbook-quick">';
    _chipDefs.forEach(function(c) {
      var isActive = _activeFilters.indexOf(c.id) >= 0;
      html += '<button class="prayerbook-quick-pill' + (isActive ? ' prayerbook-quick-pill--active' : '') + '" onclick="prayerbookToggleFilter(\'' + c.id + '\')">'
        + c.label + '</button>';
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
    var _showAll = _activeFilters.length === 0;
    var _showGuided = _showAll || _activeFilters.indexOf('guided') >= 0;
    var _showCat = function(catId) { return _showAll || _activeFilters.indexOf(catId) >= 0; };

    // PLR-04: Favorites strip (above everything when favorites exist)
    _loadFavorites();
    if (_favorites.length && !_openPrayerId && _showAll) {
      var favPrayers = [];
      _favorites.forEach(function(fid) {
        _data.categories.forEach(function(cat) {
          cat.prayers.forEach(function(p) { if (p.id === fid) favPrayers.push(p); });
        });
      });
      if (favPrayers.length) {
        html += '<div class="prayerbook-category">';
        html += '<h3 class="prayerbook-category-title">\u2605 Favorites</h3>';
        favPrayers.forEach(function(p) { html += _renderPrayerRow(p); });
        html += '</div>';
      }
    }

    // PLR-03: Guided section elevated to top
    var hasGuided = (_data.litanies && _data.litanies.length) || _data.lectio;
    if (hasGuided && _showGuided) {
      html += '<div class="prayerbook-guided-section">';
      html += '<h3 class="prayerbook-category-title">Guided Experiences</h3>';
      if (_data.litanies && _data.litanies.length) {
        _data.litanies.forEach(function(lit) {
          html += '<div class="prayerbook-guided-card" onclick="prayerbookOpenLitany(\'' + utils.esc(lit.id) + '\')">'
            + '<div class="prayerbook-guided-card-body">'
            + '<div class="prayerbook-row-title">' + utils.esc(_t(lit, 'title')) + '</div>'
            + '<div class="prayerbook-guided-card-sub">Guided \u00b7 Swipe through</div>'
            + '</div>'
            + '<span class="prayerbook-guided-badge">Guided</span>'
            + '</div>';
        });
      }
      if (_data.lectio) {
        html += '<div class="prayerbook-guided-card" onclick="prayerbookOpenLectio()">'
          + '<div class="prayerbook-guided-card-body">'
          + '<div class="prayerbook-row-title">' + utils.esc(_data.lectio.title) + '</div>'
          + '<div class="prayerbook-guided-card-sub">Guided \u00b7 Sacred reading</div>'
          + '</div>'
          + '<span class="prayerbook-guided-badge">Guided</span>'
          + '</div>';
      }
      html += '</div>';
    }

    // PBR-05: Recently opened prayers (skip when a prayer is expanded)
    var recentIds = [];
    try { recentIds = JSON.parse(localStorage.getItem('mf-prayerbook-recent') || '[]'); } catch (e) {}
    if (recentIds.length && !_openPrayerId && _showAll) {
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

    // Category view (respects active filters)
    _data.categories.forEach(function(cat) {
      if (!_showCat(cat.id)) return;
      html += '<div class="prayerbook-category">';
      html += '<h3 class="prayerbook-category-title">' + utils.esc(_t(cat, 'title')) + '</h3>';
      cat.prayers.forEach(function(p) {
        html += _renderPrayerRow(p);
      });
      html += '</div>';
    });
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
  var isFav = _favorites.indexOf(prayer.id) >= 0;
  html += '<button class="prayerbook-fav-btn" onclick="event.stopPropagation();prayerbookToggleFav(\'' + utils.esc(prayer.id) + '\')" aria-label="' + (isFav ? 'Remove from favorites' : 'Add to favorites') + '">'
    + '<svg class="prayerbook-fav-icon' + (isFav ? ' prayerbook-fav-icon--active' : '') + '" viewBox="0 0 24 24" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    + '</button>';
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

  // IPV-07: Intro screen
  if (_litanyStep === -1) {
    body.innerHTML = '<div class="prayer-splash">'
      + '<div class="prayer-splash-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>'
      + '<h2 class="prayer-splash-title">' + utils.esc(_t(_litany, 'title')) + '</h2>'
      + '<p class="prayer-splash-subtitle">' + total + ' petitions</p>'
      + '<p class="prayer-splash-desc">' + utils.esc(_litany.description || 'A guided litany') + '</p>'
      + '<p class="prayer-splash-hint">Swipe or tap to advance. Respond aloud when prompted.</p>'
      + '<button class="prayer-splash-begin" onclick="prayerbookLitanyBegin()">Begin</button>'
      + '</div>';
    footer.style.display = 'none';
    return;
  }

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
    body.innerHTML = '<div class="prayer-splash">'
      + '<div class="prayer-splash-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>'
      + '<h2 class="prayer-splash-title">Lectio Divina</h2>'
      + '<p class="prayer-splash-subtitle">Sacred Reading</p>'
      + '<p class="prayer-splash-desc">' + utils.esc(_data.lectio.description) + '</p>'
      + (gospelRef ? '<p class="prayer-splash-hint">' + utils.esc(gospelRef) + '</p>' : '')
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

function prayerbookLitanyBegin() {
  _litanyStep = 0;
  _haptic();
  _render();
}

// PLR-02: Toggle category filter
function prayerbookToggleFilter(filterId) {
  var idx = _activeFilters.indexOf(filterId);
  if (idx >= 0) _activeFilters.splice(idx, 1);
  else _activeFilters = [filterId]; // single-select for simplicity
  _render();
}

// PLR-04: Toggle favorite
function prayerbookToggleFav(prayerId) {
  var idx = _favorites.indexOf(prayerId);
  if (idx >= 0) _favorites.splice(idx, 1);
  else { _favorites.unshift(prayerId); if (_favorites.length > 5) _favorites = _favorites.slice(0, 5); }
  _saveFavorites();
  _render();
}

module.exports = {
  openPrayerBook: openPrayerBook,
  prayerbookLitanyBegin: prayerbookLitanyBegin,
  prayerbookToggleFilter: prayerbookToggleFilter,
  prayerbookToggleFav: prayerbookToggleFav,
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
