// src/render.js — Rendering functions (pills, cards, detail panel, schedule)
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');

var state = data.state;

// Build LANG_NAMES from config.LANGUAGES at module top
var LANG_NAMES = {};
Object.keys(config.LANGUAGES).forEach(function(k) { LANG_NAMES[k] = config.LANGUAGES[k].label; });

// ── Filter Pills ──
function renderPills() {
  var el = document.getElementById('activeFilters');
  if (!data.hasAdv()) { el.innerHTML = ''; return; }
  var pills = [];
  state.advancedFilters.types.forEach(function(t) { pills.push({ l: config.SVC_LABELS[t] || t, k: 'types', v: t }); });
  state.advancedFilters.days.forEach(function(d) { pills.push({ l: config.DAY_NAMES[d] || d, k: 'days', v: d }); });
  state.advancedFilters.languages.forEach(function(l) { pills.push({ l: LANG_NAMES[l] || l, k: 'languages', v: l }); });
  el.innerHTML = pills.map(function(p) {
    return '<span class="filter-pill">' + utils.esc(p.l) + '<button onclick="removeAdv(\'' + p.k + "','" + p.v + "')\" aria-label=\"Remove\">\u00d7</button></span>";
  }).join('');
}

// ── Search Context — surface why a card matched the query ──
function _getSearchContext(c, q) {
  if (!q) return '';
  var ql = q.toLowerCase();
  var words = ql.split(/\s+/);

  // 1. Check if query matches a service type label
  var svcKeys = Object.keys(config.SVC_LABELS);
  for (var i = 0; i < svcKeys.length; i++) {
    var label = config.SVC_LABELS[svcKeys[i]].toLowerCase();
    if (words.every(function(w) { return label.includes(w); })) {
      // Find matching services on this church
      var matches = (c.services || []).filter(function(s) { return s.type === svcKeys[i]; });
      if (matches.length) {
        var parts = matches.slice(0, 3).map(function(s) {
          var dayLabel = config.DAY_NAMES[s.day] || s.day || '';
          var timeStr = s.time ? utils.fmt12(s.time) : 'See bulletin';
          return dayLabel + (s.time ? ' ' + timeStr : ' \u00b7 ' + timeStr);
        });
        return '<div class="card-search-match"><span class="card-match-label">' + utils.esc(config.SVC_LABELS[svcKeys[i]]) + '</span> ' + utils.esc(parts.join(' \u00b7 ')) + '</div>';
      }
    }
  }

  // 2. Check if query matches service notes
  var svcs = c.services || [];
  for (var j = 0; j < svcs.length; j++) {
    var notes = (svcs[j].notes || '').toLowerCase();
    if (notes && words.every(function(w) { return notes.includes(w); })) {
      var svcLabel = config.SVC_LABELS[svcs[j].type] || svcs[j].type;
      return '<div class="card-search-match"><span class="card-match-label">' + utils.esc(svcLabel) + '</span> ' + utils.esc(svcs[j].notes.length > 50 ? svcs[j].notes.slice(0, 50) + '\u2026' : svcs[j].notes) + '</div>';
    }
  }

  // 3. Check language match
  for (var k = 0; k < svcs.length; k++) {
    var langName = (config.LANG_NAMES[svcs[k].language] || '').toLowerCase();
    if (langName && words.every(function(w) { return langName.includes(w); })) {
      var dayL = config.DAY_NAMES[svcs[k].day] || svcs[k].day || '';
      var tStr = svcs[k].time ? utils.fmt12(svcs[k].time) : '';
      var sLabel = config.SVC_LABELS[svcs[k].type] || '';
      return '<div class="card-search-match"><span class="card-match-label">' + utils.esc(config.LANG_NAMES[svcs[k].language]) + '</span> ' + utils.esc(sLabel + (dayL ? ' \u00b7 ' + dayL : '') + (tStr ? ' ' + tStr : '')) + '</div>';
    }
  }

  // 4. Check staff match
  var staff = c.staff || [];
  for (var s = 0; s < staff.length; s++) {
    if (words.every(function(w) { return staff[s].toLowerCase().includes(w); })) {
      return '<div class="card-search-match"><span class="card-match-label">Staff</span> ' + utils.esc(staff[s]) + '</div>';
    }
  }

  return '';
}

// ── Card List ──
function renderCards() {
  var el = document.getElementById('cardList');
  var total = state.allChurches.length;
  var shown = state.filteredChurches.length;

  // Sparse message — show when Today filter returns few results
  var sparseEl = document.getElementById('sparseMsg');
  if (sparseEl) sparseEl.style.display = (state.currentFilter === 'today' && shown < 10) ? 'block' : 'none';

  var evts = require('./events.js');

  // YC filter — show full YC event cards instead of church cards
  if (state.currentFilter === 'yc') {
    var upcoming = evts.getUpcomingYC();
    document.getElementById('resultsCount').textContent = upcoming.length + ' upcoming YC events';
    if (!upcoming.length) {
      el.innerHTML = '<div class="no-results"><h3>No upcoming YC events</h3><p>Check back soon for Young &amp; Catholic events.</p></div>';
      return;
    }
    el.innerHTML = '<div class="yc-list-header"><h2 class="yc-list-title">Young &amp; Catholic</h2><span class="saved-week-count">' + upcoming.length + ' upcoming</span></div>'
      + upcoming.map(function(e, i) { return evts.renderYCCard(e, i * 50, i); }).join('');
    return;
  }

  // Normal mode — show count + clear button when a quick filter is active
  var _quickFilterLabels = { confession:'Confession', adoration:'Adoration', latin:'Latin Mass', spanish:'Spanish Mass', lent:'Lent', today:'Today', weekend:'This Weekend', yc:'YC' };
  var _filterLabel = _quickFilterLabels[state.currentFilter];
  var _countText = shown === total ? '' : shown + ' of ' + total;
  var _clearHtml = (state.currentFilter !== 'all' && _filterLabel)
    ? '<button class="quick-filter-clear" onclick="applyQuickFilter(\'all\')">' + utils.esc(_filterLabel) + ' \u00d7</button>' : '';
  document.getElementById('resultsCount').innerHTML = _countText + (_clearHtml && _countText ? ' ' : '') + _clearHtml;
  if (!shown) {
    el.innerHTML = '<div class="no-results"><h3>No churches found</h3><p>Try adjusting your search or filters.</p></div>';
    return;
  }

  // Compute event counts per church for badges
  var evtCounts = {};
  if (state.eventsData && state.eventsData.length) {
    state.eventsData.filter(function(e) { return e.category !== 'yc' && utils.isEventActive(e); }).forEach(function(e) {
      evtCounts[e.church_id] = (evtCounts[e.church_id] || 0) + 1;
    });
  }

  var checkSvg = '<svg class="card-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>';
  var cards = state.filteredChurches.map(function(item, i) {
    var c = item.church, next = item.next, dist = item.distance;
    var ver = utils.isVer(c), fav = data.isFav(c.id), d = Math.min(i * 25, 250);
    var statusBadge = '';
    if (next && next.isLive) statusBadge = '<span class="card-live-badge"><span class="pulse-dot"></span>Live</span>';
    else if (next && next.isSoon) statusBadge = '<span class="card-soon-badge"><span class="pulse-dot"></span>Soon</span>';
    var nh;
    if (next) {
      nh = '<div class="card-next-service"><span class="card-next-time">' + next.timeFormatted + '</span><span class="card-next-label">' + utils.esc(config.SVC_LABELS[next.service.type] || next.service.type) + '</span>' + statusBadge + '</div><div class="card-next-day">' + next.dayLabel + '</div>';
    } else {
      nh = '<div class="card-next-service"><span class="card-next-label" style="color:var(--color-text-tertiary)">Check bulletin for times</span></div>';
    }
    var evtHtml = '';
    if (evtCounts[c.id]) {
      evtHtml = '<div class="card-evt-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + evtCounts[c.id] + ' event' + (evtCounts[c.id] > 1 ? 's' : '') + ' this week</div>';
    }
    var searchCtx = _getSearchContext(c, state.searchQuery);
    // Surface matching services for chip filters (same as search context but filter-driven)
    if (!searchCtx && state.currentFilter && state.currentFilter !== 'all' && state.currentFilter !== 'today' && state.currentFilter !== 'weekend') {
      var _filterTypeMap = { confession: ['confession'], adoration: ['adoration','holy_hour'], latin: ['mass_latin','mass_traditional_latin'], spanish: ['mass_spanish'], lent: ['stations_of_the_cross','penance_service','gorzkie_zale'] };
      var _filterTypes = _filterTypeMap[state.currentFilter];
      if (_filterTypes) {
        var _fmatches = (c.services || []).filter(function(s) { return _filterTypes.indexOf(s.type) !== -1; });
        if (_fmatches.length) {
          var _fparts = _fmatches.slice(0, 4).map(function(s) {
            var _dl = config.DAY_NAMES[s.day] || s.day || '';
            var _ts = s.time ? utils.fmt12(s.time) : 'See bulletin';
            return _dl + (s.time ? ' ' + _ts : ' \u00b7 ' + _ts);
          });
          searchCtx = '<div class="card-search-match"><span class="card-match-label">' + utils.esc(config.SVC_LABELS[_fmatches[0].type]) + '</span> ' + utils.esc(_fparts.join(' \u00b7 ')) + '</div>';
        }
      }
    }
    return '<article class="parish-card" role="listitem" style="animation-delay:' + d + 'ms" onclick="openDetail(\'' + c.id + '\')">'
      + '<div class="card-top"><div class="card-name-row"><h3 class="card-name">' + utils.esc(utils.displayName(c.name)) + '</h3>' + (ver ? checkSvg : '') + '</div>'
      + '<div class="card-right">' + (dist !== null ? '<span class="card-distance">' + utils.fmtDist(dist) + '</span>' : '')
      + '<button class="card-fav' + (fav ? ' is-fav' : '') + '" onclick="toggleFav(\'' + c.id + "',event)\" aria-label=\"Favorite\"><svg viewBox=\"0 0 24 24\" fill=\"" + (fav ? 'currentColor' : 'none') + "\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"/></svg></button>"
      + '<span class="card-chevron" aria-hidden="true">\u203A</span>'
      + '</div></div><div class="card-town">' + utils.esc(c.city) + ', ' + utils.esc(c.state) + '</div>' + nh + searchCtx + evtHtml
      + '</article>';
  });

  // Inject saved/rest separator if applicable
  if (state._savedSplitIndex > 0 && state._savedSplitIndex < cards.length) {
    cards.splice(state._savedSplitIndex, 0, '<div class="card-list-separator" role="separator"><span>Nearby churches</span></div>');
  }

  // Inline YC discovery strip — after 3rd card
  if (['all', 'today'].indexOf(state.currentFilter) !== -1 && cards.length >= 3 && evts && typeof evts.getUpcomingYC === 'function') {
    var upcoming = evts.getUpcomingYC().slice(0, 3);
    if (upcoming.length) {
      var ycCards = upcoming.map(function(e) {
        var dt = new Date(e.date + 'T12:00:00');
        var mon = dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        var day = dt.getDate();
        var timeStr = e.time ? utils.fmt12(e.time) : '';
        var locName = e.location || e.church_name || '';
        return '<div class="inline-yc-card" onclick="openEventDetail(\'' + e.id + '\')">'
          + '<div class="inline-yc-date"><span class="inline-yc-mon">' + mon + '</span><span class="inline-yc-day">' + day + '</span></div>'
          + '<div class="inline-yc-info"><div class="inline-yc-title">' + utils.esc(e.title) + '</div>'
          + '<div class="inline-yc-meta">' + (timeStr ? timeStr + ' \u00b7 ' : '') + utils.esc(utils.displayName(locName)) + '</div>'
          + '</div></div>';
      }).join('');

      var seeAllCount = evts.getUpcomingYC().length;
      var strip = '<div class="inline-yc-strip" role="listitem">'
        + '<div class="inline-yc-header"><span class="inline-yc-label">Young &amp; Catholic</span>'
        + '<button class="inline-yc-seeall" onclick="document.querySelector(\'[data-filter=yc]\').click()">See all ' + seeAllCount + ' \u203a</button>'
        + '</div>'
        + '<div class="inline-yc-scroll">' + ycCards + '</div>'
        + '</div>';
      cards.splice(3, 0, strip);
    }
  }

  el.innerHTML = cards.join('');
}

// ── Pastor lookup ──
function getPastor(p) {
  if (!p.clergy || !p.clergy.length) return null;
  return p.clergy.slice().sort(function(a, b) {
    var ra = (config.CLERGY_ROLES[a.role] || { rank: 99 }).rank;
    var rb = (config.CLERGY_ROLES[b.role] || { rank: 99 }).rank;
    return ra - rb;
  })[0];
}

// ── First-devotion Mass check ──
var FIRST_DEVOTION_DAYS = ['first_friday', 'first_saturday'];
var MASS_TYPES = ['sunday_mass', 'daily_mass', 'communion_service'];
function isFirstDevotionMass(s) {
  return FIRST_DEVOTION_DAYS.indexOf(s.day) >= 0 && MASS_TYPES.indexOf(s.type) >= 0;
}

// ── Detail Panel ──
function openDetail(id, trapFocus, releaseFocus) {
  var c = state.allChurches.find(function(x) { return x.id === id; });
  if (!c) return;
  var fav = data.isFav(c.id), ver = utils.isVer(c), v = c.validation || {};
  var dist = utils.getDist(c, state.userLat, state.userLng);
  var mapUrl = c.address ? getMapsUrl(c.address) : getMapsUrl(c.name);
  var domain = c.website ? c.website.replace(/^https?:\/\//, '').replace(/\/.*/, '') : '';

  // Badges
  var bg = '';
  bg += ver ? '<span class="detail-badge verified"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Verified</span>' : '<span class="detail-badge unverified">Unverified</span>';
  bg += '<span class="detail-badge county">' + utils.esc(c.county) + ' County</span>';
  if (c.established) bg += '<span class="detail-badge county">Est. ' + utils.esc(c.established) + '</span>';
  if (dist !== null) bg += '<span class="detail-badge county">' + utils.fmtDist(dist) + ' away</span>';

  // Contact section
  var bulletinUrl = c.bulletin_url || '';
  var thirdActionUrl = bulletinUrl || c.website || '';
  var thirdActionLabel = bulletinUrl ? 'Bulletin' : 'Website';
  var thirdActionIcon = bulletinUrl
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  var chtml = '<div class="detail-contact">';
  var _pastor = getPastor(c);
  if (_pastor) {
    var roleLabel = (config.CLERGY_ROLES[_pastor.role] || {}).label || _pastor.role;
    chtml += '<div class="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><div><span>' + utils.esc(_pastor.name) + '</span><div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">' + utils.esc(roleLabel) + '</div></div></div>';
  }
  if (bulletinUrl && c.website) chtml += '<div class="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><a href="' + utils.esc(c.website) + '" target="_blank" rel="noopener">' + utils.esc(domain) + '</a></div>';
  if (c.office_hours) chtml += '<div class="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>' + utils.esc(c.office_hours) + '</span></div>';
  chtml += '</div>';

  // Quick actions: Call, Directions, Bulletin (or Website), Share
  var qa = '<div class="detail-quick-actions">';
  if (c.phone) qa += '<a class="quick-action" href="tel:' + c.phone + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Call</span></a>';
  if (mapUrl) qa += '<a class="quick-action" href="' + mapUrl + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg><span>Directions</span></a>';
  if (thirdActionUrl) qa += '<a class="quick-action" href="' + utils.esc(thirdActionUrl) + '" target="_blank" rel="noopener">' + thirdActionIcon + '<span>' + thirdActionLabel + '</span></a>';
  qa += '<button class="quick-action" onclick="shareParish(\'' + utils.esc(utils.displayName(c.name)) + "','" + c.id + "')\">" + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span>Share</span></button>';
  qa += '</div>';

  // Visitation data
  var visitHtml = '';
  if (c.visitation && c.visitation.hours_note) {
    visitHtml = '<div style="margin:var(--space-3) 0;padding:var(--space-3) var(--space-4);background:var(--color-verified-bg);border-radius:var(--radius-md);display:flex;align-items:flex-start;gap:var(--space-3)">'
      + '<span style="font-size:1.1em;line-height:1">\ud83d\udd4a</span>'
      + '<div><div style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-verified)">Open for Prayer</div>'
      + '<div style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-top:2px">' + utils.esc(c.visitation.hours_note) + '</div></div></div>';
  }

  // Accordion sections
  var locL = {};
  var ml = false;
  var secs = [
    { k: 'mass',  t: 'Mass Schedule',           ic: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', types: MASS_TYPES },
    { k: 'conf',  t: 'Sacraments',               ic: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', types: ['confession', 'anointing_of_sick'] },
    { k: 'ador',  t: 'Adoration & Holy Hour',     ic: 'M12 3v18m-6-6l6 6 6-6', types: ['adoration', 'perpetual_adoration', 'holy_hour'] },
    { k: 'devot', t: 'Prayer & Devotion',         ic: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z', types: ['rosary', 'stations_of_cross', 'divine_mercy', 'miraculous_medal', 'novena', 'devotion', 'vespers', 'gorzkie_zale', 'benediction'] },
    { k: 'hw',    t: 'Holy Week',                 ic: 'M12 2v20M2 12h20', types: ['holy_thursday_mass', 'good_friday_service', 'easter_vigil_mass', 'palm_sunday_mass', 'easter_sunday_mass'] },
  ];

  var secHtml = '';
  for (var si = 0; si < secs.length; si++) {
    var sec = secs[si];
    var svcs;
    if (sec.k === 'devot') {
      svcs = c.services.filter(function(s) { return sec.types.indexOf(s.type) >= 0 || isFirstDevotionMass(s); });
    } else {
      svcs = c.services.filter(function(s) { return sec.types.indexOf(s.type) >= 0 && !isFirstDevotionMass(s); });
    }
    if (!svcs.length) continue;
    var timedCount = svcs.filter(function(s) { return s.time; }).length;
    var badgeCount = timedCount > 0 ? timedCount : svcs.length;
    var isFirst = sec.k === 'mass';

    // Split First Fri/Sat to top of devotion section
    var bodyInner = '';
    if (sec.k === 'devot') {
      var firstDevSvcs = svcs.filter(function(s) { return isFirstDevotionMass(s); });
      var regularDevSvcs = svcs.filter(function(s) { return !isFirstDevotionMass(s); });
      if (firstDevSvcs.length) {
        bodyInner += '<div class="first-devotion-highlight">' + renderSched(firstDevSvcs, locL, ml, sec.types) + '</div>';
      }
      bodyInner += renderSched(regularDevSvcs, locL, ml, sec.types);
    } else {
      bodyInner = renderSched(svcs, locL, ml, sec.types);
    }

    secHtml += '<div class="detail-section"><button class="accordion-header" aria-expanded="' + isFirst + '" onclick="toggleAcc(this)">'
      + '<div class="accordion-header-left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + sec.ic + '"/></svg>'
      + '<span class="accordion-title">' + sec.t + '</span><span class="accordion-count">' + badgeCount + '</span></div>'
      + '<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
      + '</button><div class="accordion-body' + (isFirst ? ' open' : '') + '"><div class="accordion-body-inner">' + bodyInner + '</div></div></div>';
  }

  // Community events section — lazy require to avoid circular dep
  var ceHtml = '';
  try {
    var events = require('./events.js');
    if (events && typeof events.renderCommunityEvents === 'function') {
      ceHtml = events.renderCommunityEvents(c);
    }
  } catch (e) { /* events.js not yet available */ }

  // Verify prompt + correction form + footer
  var vp = '<div class="verify-prompt" id="verifyPrompt"><p>Were these times accurate when you last visited?</p><div class="verify-prompt-btns"><button class="verify-btn yes" onclick="verifyOk(true)">\u2713 Yes, looks right</button><button class="verify-btn no" onclick="showCorrectionForm()">Not quite</button></div></div>'
    + '<div class="correction-form" id="correctionForm" style="display:none">'
    + '<label class="corr-form-label">What\'s wrong?</label>'
    + '<div class="corr-pills" id="corrPills">'
    + '<button class="corr-pill" onclick="selectCorrPill(this,\'Wrong time\')">Wrong time</button>'
    + '<button class="corr-pill" onclick="selectCorrPill(this,\'Mass cancelled or moved\')">Mass cancelled or moved</button>'
    + '<button class="corr-pill" onclick="selectCorrPill(this,\'Missing a service\')">Missing a service</button>'
    + '<button class="corr-pill" onclick="selectCorrPill(this,\'Other\')">Other</button>'
    + '</div>'
    + '<input type="hidden" id="corrCategory" value="">'
    + '<input type="hidden" id="corrChurch" value="' + utils.esc(c.name) + '">'
    + '<label for="corrMessage" class="corr-form-label">Details</label>'
    + '<textarea id="corrMessage" class="corr-input" rows="2" placeholder="Select a category above first\u2026"></textarea>'
    + '<label for="corrEmail" class="corr-form-label sr-only">Email (optional)</label>'
    + '<input id="corrEmail" type="email" class="corr-input" placeholder="Your email (optional, for follow-up)" style="resize:none;margin-top:var(--space-2)">'
    + '<button onclick="submitCorrection()" style="margin-top:var(--space-3);width:100%;padding:var(--space-3);border-radius:var(--radius-md);background:var(--color-primary);color:white;font-size:var(--text-sm);font-weight:var(--weight-semibold);min-height:44px">Submit Correction</button>'
    + '</div>'
    + '<div class="verify-thanks" id="verifyThanks" style="display:none">Thank you for helping keep MassFinder accurate! God bless.</div>';
  var footer = '';
  if (v.last_checked) footer = '<div class="detail-verified-footer">Last checked: ' + utils.esc(v.last_checked) + (v.bulletin_date ? ' \u00b7 Bulletin: ' + utils.esc(v.bulletin_date) : '') + (v.source ? '<br>Source: ' + utils.esc(v.source) : '') + '</div>';

  document.getElementById('detailContent').innerHTML =
    '<div class="detail-header"><div class="detail-header-top"><h2 class="detail-name">' + utils.esc(utils.displayName(c.name)) + '</h2>'
    + '<div class="detail-actions"><button class="detail-action-btn fav-btn' + (fav ? ' fav-active' : '') + '" data-id="' + c.id + '" onclick="toggleFav(\'' + c.id + '\')" aria-label="Favorite"><svg viewBox="0 0 24 24" fill="' + (fav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>'
    + '<button class="detail-action-btn" onclick="closeDetail()" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    + '</div></div><div class="detail-town">' + utils.esc(c.city) + ', ' + utils.esc({ MA: 'Massachusetts', CT: 'Connecticut', VT: 'Vermont', NH: 'New Hampshire' }[c.state] || c.state || 'Massachusetts') + '</div><div class="detail-badges">' + bg + '</div></div>'
    + '<div class="detail-body">' + chtml + qa + visitHtml + secHtml + ceHtml + vp + footer + '</div>';

  document.getElementById('detailBackdrop').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('detailPanel').scrollTop = 0;
  window._lastFocused = document.activeElement;
  history.replaceState(null, '', '#' + id);
  if (typeof trapFocus === 'function') trapFocus(document.getElementById('detailPanel'));
  setTimeout(function() { var cb = document.querySelector('.detail-action-btn[aria-label="Close"]'); if (cb) cb.focus(); }, 350);
}

// ── Close Detail ──
function closeDetail(releaseFocus) {
  // If event panel is open on top, close that first
  var evPanel = document.getElementById('eventDetailPanel');
  if (evPanel && evPanel.classList.contains('open')) {
    var evts = require('./events.js');
    if (evts && typeof evts.closeEventDetail === 'function') evts.closeEventDetail();
    return;
  }
  document.getElementById('detailBackdrop').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.body.style.overflow = '';
  if (typeof releaseFocus === 'function') releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
  history.replaceState(null, '', location.pathname + location.search);
}

// ── Share / Toast / Maps ──
function shareParish(name, id) {
  var url = location.origin + location.pathname + '#' + id;
  if (navigator.share) {
    navigator.share({ title: name + ' \u2014 MassFinder', url: url }).catch(function() {});
  } else {
    navigator.clipboard.writeText(url).then(function() { showToast('Link copied!'); }).catch(function() {});
  }
}

function showToast(msg) {
  var t = document.getElementById('mf-toast');
  if (!t) { t = document.createElement('div'); t.id = 'mf-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'mf-toast show';
  clearTimeout(t._tid); t._tid = setTimeout(function() { t.className = 'mf-toast'; }, 2200);
}

function getMapsUrl(query) {
  var q = encodeURIComponent(query);
  var isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  return isApple ? 'https://maps.apple.com/?q=' + q : 'https://maps.google.com/?q=' + q;
}

function getMapsUrlCoords(lat, lng, label) {
  var isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  return isApple ? 'https://maps.apple.com/?ll=' + lat + ',' + lng + '&q=' + encodeURIComponent(label || '')
    : 'https://maps.google.com/?q=' + lat + ',' + lng;
}

// ── Accordion Toggle ──
function toggleAcc(btn) {
  var exp = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !exp);
  btn.nextElementSibling.classList.toggle('open', !exp);
}

// ── Schedule Rendering ──
function renderSched(svcs, locL, ml, sectionTypes) {
  var dayGrp = {}, appt = [];
  var WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  var specLabels = {
    weekday: 'Weekdays', daily: 'Daily',
    first_friday: 'First Friday', first_saturday: 'First Saturday',
    first_sunday: 'First Sunday', first_thursday: 'First Thursday',
    holyday: 'Holy Days', holyday_eve: 'Holy Day Eve',
    Holy_Thursday: 'Holy Thursday', Good_Friday: 'Good Friday',
    Easter_Vigil: 'Easter Vigil', Palm_Sunday: 'Palm Sunday',
    Easter_Sunday: 'Easter Sunday', civil_holiday: 'Civil Holidays'
  };
  // Determine if we should suppress type labels (when section has only 1 type)
  var secTypes = sectionTypes || [];
  var isSingleTypeSection = secTypes.length === 1;

  // Separate seasonal/Easter services from regular
  var seasonal = [], regular = [];
  for (var ri = 0; ri < svcs.length; ri++) {
    var rs = svcs[ri];
    if (!rs.day || rs.day === 'null' || !rs.time) { appt.push(rs); continue; }
    var rn = (rs.notes || '').toLowerCase();
    var isEaster = rn.indexOf('easter sunday') >= 0 || rn.indexOf('easter vigil') >= 0;
    if (isEaster && ['sunday_mass', 'daily_mass'].indexOf(rs.type) >= 0) seasonal.push(rs);
    else regular.push(rs);
  }

  // Group regular weekday services by fingerprint to detect Mon-Fri patterns
  var wkMap = {};
  var nonWeekday = [];
  for (var wi = 0; wi < regular.length; wi++) {
    var ws = regular[wi];
    if (WEEKDAYS.indexOf(ws.day) >= 0) {
      var wk = utils.svcKey(ws);
      if (!wkMap[wk]) wkMap[wk] = { svcs: [] };
      wkMap[wk].svcs.push(ws);
    } else {
      nonWeekday.push(ws);
    }
  }

  // For each weekday group, decide if it should be collapsed
  var collapsed = [];
  var uncollapsed = [];
  var wkKeys = Object.keys(wkMap);
  for (var ki = 0; ki < wkKeys.length; ki++) {
    var grp = wkMap[wkKeys[ki]];
    var days = grp.svcs.map(function(s) { return s.day; });
    var uniqSet = {};
    days.forEach(function(d) { uniqSet[d] = true; });
    var uniq = Object.keys(uniqSet).sort(function(a, b) { return WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b); });
    var meaningfulNotes = grp.svcs.filter(function(s) { var n = utils.cleanNote(s); return n && n.length > 0; });
    var uniqueNoteSet = {};
    meaningfulNotes.forEach(function(s) { var n = utils.cleanNote(s); if (n) uniqueNoteSet[n] = true; });
    var uniqueNoteTexts = Object.keys(uniqueNoteSet);
    // Collapse if 3+ weekdays with 0-1 meaningful notes, OR all notes are identical
    var shouldCollapse = uniq.length >= 3 && (meaningfulNotes.length <= 1 || uniqueNoteTexts.length === 1);
    if (shouldCollapse) {
      var label = utils.makeRangeLabel(uniq);
      var rep = grp.svcs[0];
      var sharedNote = uniqueNoteTexts.length === 1 ? uniqueNoteTexts[0] : (meaningfulNotes[0] ? utils.cleanNote(meaningfulNotes[0]) : '');
      collapsed.push({ label: label, svc: rep, extraNote: sharedNote });
    } else {
      for (var ui = 0; ui < grp.svcs.length; ui++) uncollapsed.push(grp.svcs[ui]);
    }
  }

  // Build day groups for uncollapsed + non-weekday
  for (var di = 0; di < uncollapsed.length; di++) {
    var ds = uncollapsed[di];
    if (!dayGrp[ds.day]) dayGrp[ds.day] = [];
    dayGrp[ds.day].push(ds);
  }
  for (var ni = 0; ni < nonWeekday.length; ni++) {
    var ns = nonWeekday[ni];
    if (!dayGrp[ns.day]) dayGrp[ns.day] = [];
    dayGrp[ns.day].push(ns);
  }

  var allKeys = Object.keys(dayGrp);
  var week = allKeys.filter(function(d) { return config.DAY_ORDER.indexOf(d) >= 0; }).sort(function(a, b) { return config.DAY_ORDER.indexOf(a) - config.DAY_ORDER.indexOf(b); });
  var html = '';

  // Render order: Sunday, then Weekdays collapsed, then individual weekdays, then Saturday, then special days
  if (dayGrp['sunday']) {
    html += renderDayGroup('sunday', 'Sunday', dayGrp['sunday'], locL, ml);
  }

  // Collapsed weekday rows right after Sunday
  if (collapsed.length) {
    collapsed.sort(function(a, b) { return (utils.toMin(a.svc.time) || 0) - (utils.toMin(b.svc.time) || 0); });
    html += '<div class="schedule-day"><div class="schedule-day-label">Weekdays</div>';
    for (var ci = 0; ci < collapsed.length; ci++) {
      html += renderRow(collapsed[ci].svc, locL, ml, collapsed[ci].label, collapsed[ci].extraNote);
    }
    html += '</div>';
  }

  // Individual uncollapsed weekdays (Mon-Fri that didn't collapse), in day order
  for (var wdi = 0; wdi < week.length; wdi++) {
    var day = week[wdi];
    if (day === 'sunday' || day === 'saturday') continue;
    if (dayGrp[day]) html += renderDayGroup(day, config.DAY_NAMES[day] || day, dayGrp[day], locL, ml);
  }

  // Saturday
  if (dayGrp['saturday']) {
    html += renderDayGroup('saturday', 'Saturday', dayGrp['saturday'], locL, ml);
  }

  // Special days (first_friday, holyday, etc.)
  var other = allKeys.filter(function(d) { return config.DAY_ORDER.indexOf(d) < 0; });
  for (var oi = 0; oi < other.length; oi++) {
    var oday = other[oi];
    var olabel = specLabels[oday] || oday.replace(/_/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
    html += renderDayGroup(oday, olabel, dayGrp[oday], locL, ml);
  }

  // Easter seasonal section
  if (seasonal.length) {
    html += '<div class="schedule-day"><div class="schedule-day-label" style="color:var(--color-accent-text)">Easter Sunday</div>';
    var byTime = {};
    for (var ei = 0; ei < seasonal.length; ei++) {
      var es = seasonal[ei];
      var ek = es.time;
      if (!byTime[ek]) byTime[ek] = [];
      byTime[ek].push(es);
    }
    var timeKeys = Object.keys(byTime).sort(function(a, b) { return (utils.toMin(a) || 0) - (utils.toMin(b) || 0); });
    for (var ti = 0; ti < timeKeys.length; ti++) {
      var ss = byTime[timeKeys[ti]];
      var trep = ss[0];
      var langs = ss.filter(function(s) { return s.language && s.language !== 'en'; }).map(function(s) { return s.language; });
      var lb = langs.map(function(l) { return '<span class="schedule-lang-badge">' + (LANG_NAMES[l] || l) + '</span>'; }).join('');
      var rb = ss.some(function(s) { return s.rite === 'tridentine'; }) ? '<span class="schedule-lang-badge">TLM</span>' : '';
      html += '<div class="schedule-row"><div class="schedule-time">' + utils.fmt12(trep.time) + lb + rb + '</div><div class="schedule-meta"></div></div>';
    }
    html += '</div>';
  }

  if (appt.length) html += '<div class="schedule-appt">By appointment \u2014 call the parish office</div>';
  return html;

  // === Nested Helper: render a day group ===
  function renderDayGroup(day, label, ss, locL, ml) {
    if (!ss || !ss.length) return '';
    ss.sort(function(a, b) { return (utils.toMin(a.time) || 0) - (utils.toMin(b.time) || 0); });
    var merged = mergeSameTime(ss);
    var dayCls = day === 'first_friday' ? ' first-friday' : day === 'first_saturday' ? ' first-saturday' : '';
    var sub = day === 'first_friday' ? '<div class="schedule-day-subtitle">Devotion to the Sacred Heart of Jesus</div>'
      : day === 'first_saturday' ? '<div class="schedule-day-subtitle">Devotion to the Immaculate Heart of Mary</div>' : '';
    var h = '<div class="schedule-day' + dayCls + '"><div class="schedule-day-label">' + utils.esc(label) + '</div>' + sub;
    for (var mi = 0; mi < merged.length; mi++) {
      h += renderRow(merged[mi], locL, ml);
    }
    return h + '</div>';
  }

  // === Nested Helper: merge same-time services within a day ===
  function mergeSameTime(ss) {
    var out = [];
    var seen = {};
    for (var i = 0; i < ss.length; i++) {
      var s = ss[i];
      var rite = s.rite === 'tridentine' ? 'tridentine' : '';
      var k = s.time + '|' + (s.location_id || '') + '|' + (s.language || 'en') + '|' + rite;
      if (seen[k]) {
        var existing = seen[k];
        var newNote = utils.cleanNote(s);
        var existingNote = utils.cleanNote(existing);
        if (newNote && newNote !== existingNote) {
          existing._mergedNotes = (existing._mergedNotes || []);
          existing._mergedNotes.push(newNote);
        }
      } else {
        seen[k] = s;
        out.push(s);
      }
    }
    return out;
  }

  // === Nested Helper: render a single schedule row ===
  function renderRow(s, locL, ml, dayLabel, extraNote) {
    var tStr = s.end_time ? utils.fmt12(s.time) + ' \u2013 ' + utils.fmt12(s.end_time) : utils.fmt12(s.time);
    var lb = s.language && s.language !== 'en' ? '<span class="schedule-lang-badge">' + (LANG_NAMES[s.language] || s.language) + '</span>' : '';
    var rb = s.rite === 'tridentine' ? '<span class="schedule-lang-badge">TLM</span>' : '';
    var sb = s.seasonal && s.seasonal.season === 'lent' ? '<span class="schedule-season-badge">\ud83c\udf3f Lent</span>' : '';
    var loc = ml && s.location_id && locL[s.location_id] ? locL[s.location_id] : '';
    var tl = config.SVC_LABELS[s.type] || s.type;
    var note = extraNote || utils.cleanNote(s) || '';
    var merged = (s._mergedNotes || []).filter(function(n) { return n; }).join('; ');

    // Suppress type label when it matches the accordion section
    var showTypeLabel = !isSingleTypeSection && ['sunday_mass', 'daily_mass'].indexOf(s.type) < 0;

    var meta = '';
    if (dayLabel) meta += '<div class="schedule-location" style="font-weight:var(--weight-medium)">' + utils.esc(dayLabel) + '</div>';
    if (loc) meta += '<span class="schedule-loc-badge">' + utils.esc(loc) + '</span>';
    if (showTypeLabel) meta += '<div class="schedule-location">' + utils.esc(tl) + '</div>';
    if (s.type === 'communion_service') meta += '<div class="schedule-note" style="font-style:italic;color:var(--color-text-tertiary)">(Communion Service \u2014 not a Mass)</div>';
    if (note) meta += '<div class="schedule-note">' + utils.esc(note) + '</div>';
    if (merged) meta += '<div class="schedule-note">' + utils.esc(merged) + '</div>';
    if (s.times_vary) meta += '<div class="schedule-note">Times may vary \u2014 check bulletin</div>';

    // Show recurrence info if present
    if (s.recurrence) {
      var r = s.recurrence;
      var ordinal = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 'last': 'Last' };
      var recLabel = '';
      if (r.type === 'nth' && r.week) {
        recLabel = (ordinal[r.week] || r.week) + ' ' + (config.DAY_NAMES[s.day] || s.day) + ' of the month';
      } else if (r.type === 'nth' && r.weeks) {
        recLabel = r.weeks.map(function(w) { return ordinal[w] || w; }).join(' & ') + ' ' + (config.DAY_NAMES[s.day] || s.day);
      } else if (r.type === 'last_sunday_of_month') {
        recLabel = 'Last Sunday of the month';
      }
      if (recLabel) meta += '<div class="schedule-note" style="font-weight:var(--weight-medium);color:var(--color-accent-text)">' + utils.esc(recLabel) + '</div>';
    }

    return '<div class="schedule-row"><div class="schedule-time">' + tStr + lb + rb + sb + '</div><div class="schedule-meta">' + meta + '</div></div>';
  }
}

module.exports = {
  renderPills: renderPills,
  renderCards: renderCards,
  getPastor: getPastor,
  isFirstDevotionMass: isFirstDevotionMass,
  openDetail: openDetail,
  closeDetail: closeDetail,
  shareParish: shareParish,
  showToast: showToast,
  getMapsUrl: getMapsUrl,
  getMapsUrlCoords: getMapsUrlCoords,
  toggleAcc: toggleAcc,
  renderSched: renderSched,
};
