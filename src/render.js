/*
 * MassFinder
 * Copyright (C) 2026 Mike Adamski
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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

  // PHF-01b: Confession guide hint when confession filter active
  var confHint = document.getElementById('confessionHint');
  if (confHint) {
    if (state.currentFilter === 'confession' && !sessionStorage.getItem('mf-conf-hint-dismissed')) {
      confHint.style.display = '';
      confHint.innerHTML = '<div class="confession-hint-inner">'
        + '<span>Not sure what to expect?</span>'
        + '<span class="confession-hint-link" onclick="openConfessionGuide()">How Confession works \u203A</span>'
        + '<button class="confession-hint-dismiss" onclick="this.parentElement.parentElement.style.display=\'none\';sessionStorage.setItem(\'mf-conf-hint-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
        + '</div>';
    } else {
      confHint.style.display = 'none';
    }
  }

  // No-results state with guided recovery
  if (!shown) {
    var recoveryHtml = '';
    if (state.searchQuery) {
      recoveryHtml = '<button class="no-results-action" onclick="document.getElementById(\'searchInput\').value=\'\';document.getElementById(\'searchInput\').dispatchEvent(new Event(\'input\'))">Clear search</button>';
    } else if (state.currentFilter !== 'all') {
      recoveryHtml = '<button class="no-results-action" onclick="applyQuickFilter(\'all\')">Show all churches</button>';
    }
    if (data.hasAdv()) {
      recoveryHtml += '<button class="no-results-action" onclick="clearAdvancedFilters();filterChurches();renderCards()">Clear all filters</button>';
    }
    el.innerHTML = '<div class="no-results"><h3>No churches found</h3><p>Try a different search term or filter.</p><div class="no-results-actions">' + recoveryHtml + '</div></div>';
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

    // SFD-01-A: Tiered badge system — imminent / available / upcoming
    var urgencyTier = 'upcoming';
    if (next && next.isSoon && next.minutesUntil <= 20 && dist !== null && dist <= 8) {
      urgencyTier = 'imminent';
    } else if (next && (next.isLive || next.isSoon)) {
      urgencyTier = 'available';
    }

    var statusBadge = '';
    if (urgencyTier === 'imminent') {
      statusBadge = '<span class="card-imminent-badge">in ' + next.minutesUntil + ' min</span>';
    } else if (urgencyTier === 'available') {
      if (next.isLive) statusBadge = '<span class="card-live-badge card-live-badge--muted"><span class="pulse-dot"></span>Live</span>';
      else statusBadge = '<span class="card-soon-badge card-soon-badge--muted"><span class="pulse-dot"></span>Soon</span>';
    }

    // FT-08 + SFD-01: Card state class with urgency tier
    var cardCls = 'parish-card';
    if (urgencyTier === 'imminent') cardCls += ' parish-card--imminent';
    else if (next && next.isLive) cardCls += ' parish-card--live';
    else if (next && next.isSoon) cardCls += ' parish-card--soon';

    // FT-07: Next service — time, label, badge, and day inline
    var nh;
    if (next) {
      var dayPart = '';
      if (!next.isLive && !next.isSoon && next.dayLabel) {
        dayPart = '<span class="card-next-day">\u00b7 ' + next.dayLabel + '</span>';
      }
      nh = '<div class="card-next-service">'
        + '<span class="card-next-time">' + next.timeFormatted + '</span>'
        + '<span class="card-next-label">' + utils.esc(config.SVC_LABELS[next.service.type] || next.service.type) + '</span>'
        + statusBadge
        + dayPart
        + '</div>';
    } else {
      // FT-11: Bulletin link when available
      if (c.bulletin_url) {
        nh = '<div class="card-next-service"><a class="card-bulletin-link" href="' + utils.esc(c.bulletin_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">See bulletin for times \u203A</a></div>';
      } else {
        nh = '<div class="card-next-service"><span class="card-next-label" style="color:var(--color-text-tertiary)">Check bulletin for times</span></div>';
      }
    }

    // Event count row (simple count, not titles)
    var evtHtml = '';
    if (evtCounts[c.id]) {
      evtHtml = '<div class="card-evt-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' + evtCounts[c.id] + ' event' + (evtCounts[c.id] > 1 ? 's' : '') + ' this week</div>';
    }

    var searchCtx = _getSearchContext(c, state.searchQuery);
    // FT-10: Surface matching services for chip filters as structured rows
    if (!searchCtx && state.currentFilter && state.currentFilter !== 'all' && state.currentFilter !== 'today' && state.currentFilter !== 'weekend') {
      var _filterTypeMap = { confession: ['confession'], adoration: ['adoration','holy_hour'], latin: ['mass_latin','mass_traditional_latin'], spanish: ['mass_spanish'], lent: ['stations_of_the_cross','penance_service','gorzkie_zale'] };
      var _filterTypes = _filterTypeMap[state.currentFilter];
      if (_filterTypes) {
        var _fmatches = (c.services || []).filter(function(s) { return _filterTypes.indexOf(s.type) !== -1; });
        if (_fmatches.length) {
          var _fLabel = utils.esc(config.SVC_LABELS[_fmatches[0].type]);
          var _fRows = _fmatches.slice(0, 3).map(function(s) {
            var _dl = config.DAY_NAMES[s.day] || s.day || '';
            var _ts = s.time ? utils.fmt12(s.time) : 'See bulletin';
            var _endTs = s.end_time ? ' \u2013 ' + utils.fmt12(s.end_time) : '';
            return '<div class="card-match-row"><span class="card-match-time">' + utils.esc(_ts + _endTs) + '</span> <span class="card-match-day">' + utils.esc(_dl) + '</span></div>';
          }).join('');
          var _moreCount = _fmatches.length > 3 ? ' <span class="card-match-more">+' + (_fmatches.length - 3) + ' more</span>' : '';
          searchCtx = '<div class="card-search-match"><div class="card-match-label">' + _fLabel + '</div>' + _fRows + _moreCount + '</div>';
        }
      }
    }

    // FT-09: Only show state when not MA
    var townLabel = c.state && c.state !== 'MA' ? c.city + ', ' + c.state : c.city;

    return '<article class="' + cardCls + '" role="listitem" style="animation-delay:' + d + 'ms" onclick="openDetail(\'' + c.id + '\')">'
      + '<div class="card-top"><div class="card-name-row"><h3 class="card-name">' + utils.esc(utils.displayName(c.name)) + '</h3>' + (ver ? checkSvg : '') + '</div>'
      + '<div class="card-right">' + (dist !== null ? '<span class="card-distance">' + utils.fmtDist(dist) + '</span>' : '')
      + '<button class="card-fav' + (fav ? ' is-fav' : '') + '" onclick="toggleFav(\'' + c.id + "',event)\" aria-label=\"Favorite\"><svg viewBox=\"0 0 24 24\" fill=\"" + (fav ? 'currentColor' : 'none') + "\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"/></svg></button>"
      + '</div></div><div class="card-town">' + utils.esc(townLabel) + '</div>' + nh + searchCtx + evtHtml
      + '</article>';
  });

  // SFD-01-B: Smart grouping dividers — inject tier section headers
  if (state.userLat !== null) {
    var imminentCount = 0, availableCount = 0;
    var tiers = state.filteredChurches.map(function(item) {
      var n = item.next, d = item.distance;
      if (n && n.isSoon && n.minutesUntil <= 20 && d !== null && d <= 8) { imminentCount++; return 'imminent'; }
      if (n && (n.isLive || n.isSoon)) { availableCount++; return 'available'; }
      return 'upcoming';
    });
    if (imminentCount >= 1 && availableCount >= 3) {
      // Find insertion points (scan from end to avoid index shift issues)
      var firstAvailIdx = -1;
      for (var _ti = 0; _ti < tiers.length; _ti++) {
        if (tiers[_ti] === 'available') { firstAvailIdx = _ti; break; }
      }
      if (firstAvailIdx > 0) {
        cards.splice(firstAvailIdx, 0, '<div class="find-section-divider" role="separator"><span>Also happening</span></div>');
      }
      cards.splice(0, 0, '<div class="find-section-divider" role="separator"><span>Near you now</span></div>');
    }
  }

  // Inject saved/rest separator if applicable
  if (state._savedSplitIndex > 0 && state._savedSplitIndex < cards.length) {
    cards.splice(state._savedSplitIndex, 0, '<div class="card-list-separator" role="separator"><span>Nearby churches</span></div>');
  }

  // FT-05: First-use tip card — after first card for new visitors
  if (!localStorage.getItem('mf-welcome-dismissed') && cards.length >= 2) {
    var tipCard = '<div class="first-use-tip" id="firstUseTip">'
      + '<span>Tap \u2661 to favorite a church \u2014 build your own custom schedule and track Mass times, events, and happenings at your parishes.</span>'
      + '<button onclick="this.parentElement.remove();localStorage.setItem(\'mf-welcome-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
      + '</div>';
    cards.splice(1, 0, tipCard);
  }

  // FT-14: YC strip — only show on "all" filter with no active search
  if (state.currentFilter === 'all' && !state.searchQuery && cards.length >= 4 && evts && typeof evts.getUpcomingYC === 'function') {
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
      cards.splice(4, 0, strip);
    }
  }

  el.innerHTML = cards.join('');

  // FT-13: Sparse message — inline below cards when Today filter has few results
  if (state.currentFilter === 'today' && shown > 0 && shown < 10) {
    el.innerHTML += '<div class="sparse-msg-inline">Fewer services on weekdays \u2014 <button onclick="document.querySelector(\'[data-filter=weekend]\').click()">try This Weekend</button> for Sunday Mass times.</div>';
  }
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

// ── OW-23: "Coming Up" — next 3 services chronologically ──
function _locationDisplay(locId) {
  if (!locId) return '';
  return locId.split('-').map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ').replace(/ Church .*$/, ' Church');
}

function _getComingUp(church, nextSvc, mergedKeys) {
  var now = utils.getNow();
  var curDI = now.getDay();
  var curDay = config.DAY_ORDER[curDI];
  var curMin = now.getHours() * 60 + now.getMinutes();
  var isMultiLoc = (church.locations && church.locations.length > 1);
  var cands = [];

  for (var i = 0; i < church.services.length; i++) {
    var s = church.services[i];
    if (!s.time || !s.day) continue;
    if (s.seasonal && s.seasonal.is_seasonal) continue;
    var sm = utils.toMin(s.time);
    if (sm === null) continue;
    var em = s.end_time ? utils.toMin(s.end_time) : null;
    var effectiveEnd = em !== null ? em : sm + 60;

    var days = [];
    if (s.day === 'weekday') days = [1, 2, 3, 4, 5];
    else if (s.day === 'daily') days = [0, 1, 2, 3, 4, 5, 6];
    else { var di = config.DAY_ORDER.indexOf(s.day); if (di >= 0) days = [di]; }

    for (var j = 0; j < days.length; j++) {
      var dayI = days[j];
      var du = dayI - curDI;
      if (du < 0) du += 7;
      if (du === 0 && curMin > effectiveEnd) du = 7;
      if (du > 1) continue; // only today + tomorrow
      var totalMin = du * 1440 + (du === 0 ? sm - curMin : sm);
      cands.push({ service: s, daysUntil: du, dayIdx: dayI, totalMin: totalMin, startMin: sm });
    }
  }

  cands.sort(function(a, b) { return a.totalMin - b.totalMin; });
  // Dedupe same type+time+day
  var seen = {}, results = [];
  // DC-R2-06: Build key for the next service hero to skip it in Coming Up
  var nextSvcKey = nextSvc ? (nextSvc.service.type + '|' + nextSvc.service.time) : '';
  // Determine which "day slot" the hero occupies (0=today, 1=tomorrow) so we skip the right candidate
  var nextSvcDu = -1;
  if (nextSvc) {
    if (nextSvc.dayLabel === 'Today' || nextSvc.isLive || nextSvc.isSoon) nextSvcDu = 0;
    else if (nextSvc.dayLabel === 'Tomorrow') nextSvcDu = 1;
  }
  for (var k = 0; k < cands.length && results.length < 3; k++) {
    var key = cands[k].service.type + '|' + cands[k].service.time + '|' + cands[k].dayIdx;
    if (seen[key]) continue;
    seen[key] = true;
    // DC-R2-06: Skip the candidate that matches the Next Service hero (same type+time+day slot)
    if (nextSvcKey && cands[k].daysUntil === nextSvcDu && (cands[k].service.type + '|' + cands[k].service.time) === nextSvcKey) continue;
    // CD2-01: Skip services merged into the multi-row hero
    if (mergedKeys && mergedKeys.length && cands[k].daysUntil === nextSvcDu) {
      var ck = cands[k].service.type + '|' + cands[k].service.time;
      if (mergedKeys.indexOf(ck) >= 0) continue;
    }
    results.push(cands[k]);
  }

  if (!results.length) return '';

  // SFD-04-A: Partition into today vs tomorrow
  var todayResults = results.filter(function(r) { return r.daysUntil === 0; });
  var tomorrowResults = results.filter(function(r) { return r.daysUntil === 1; });
  var allTomorrow = todayResults.length === 0 && tomorrowResults.length > 0;

  var html = '<div class="detail-coming-up">';
  html += '<div class="detail-coming-label">Coming Up' + (allTomorrow ? ' \u00b7 Tomorrow' : '') + '</div>';

  // Render a single Coming Up row
  function _comingRow(r, isTomorrow) {
    var timeStr = r.service.end_time
      ? utils.fmt12(r.service.time) + ' \u2013 ' + utils.fmt12(r.service.end_time)
      : utils.fmt12(r.service.time);
    var typeLabel = config.SVC_LABELS[r.service.type] || r.service.type;
    var locLabel = isMultiLoc && r.service.location_id ? _locationDisplay(r.service.location_id) : '';
    var dayLabel = '';
    // SFD-04-C: Today row urgency classes
    var rowCls = 'detail-coming-row';
    if (!isTomorrow) {
      var minsLeft = r.startMin - curMin;
      if (minsLeft <= 0) {
        dayLabel = 'Now';
        rowCls += ' detail-coming-row--today detail-coming-row--live';
      } else if (minsLeft <= 60) {
        dayLabel = 'in ' + minsLeft + ' min';
        rowCls += ' detail-coming-row--today detail-coming-row--soon';
      } else {
        var hrsLeft = Math.floor(minsLeft / 60);
        dayLabel = 'in ' + hrsLeft + (hrsLeft === 1 ? ' hr' : ' hrs');
        rowCls += ' detail-coming-row--today';
      }
    } else {
      rowCls += ' detail-coming-row--tomorrow';
    }

    var h = '<div class="' + rowCls + '">';
    h += '<div class="detail-coming-time">' + timeStr + '</div>';
    h += '<div class="detail-coming-info">';
    h += '<span class="detail-coming-type">' + utils.esc(typeLabel) + '</span>';
    if (locLabel) h += '<span class="detail-coming-loc">at ' + utils.esc(locLabel) + '</span>';
    h += '</div>';
    if (dayLabel) h += '<span class="detail-coming-day">' + dayLabel + '</span>';
    h += '</div>';
    return h;
  }

  // Today rows first
  for (var ti = 0; ti < todayResults.length; ti++) {
    html += _comingRow(todayResults[ti], false);
  }
  // SFD-04-A: Tomorrow separator (only when both today and tomorrow rows exist)
  if (todayResults.length > 0 && tomorrowResults.length > 0) {
    html += '<div class="detail-coming-separator">Tomorrow</div>';
  }
  // Tomorrow rows
  for (var tmi = 0; tmi < tomorrowResults.length; tmi++) {
    html += _comingRow(tomorrowResults[tmi], true);
  }

  html += '</div>';
  return html;
}

// ── Detail Panel ──
function openDetail(id, trapFocus, releaseFocus) {
  var c = state.allChurches.find(function(x) { return x.id === id; });
  if (!c) return;
  var fav = data.isFav(c.id), ver = utils.isVer(c), v = c.validation || {};
  var dist = utils.getDist(c, state.userLat, state.userLng);
  var mapUrl = c.address ? getMapsUrl(c.address) : getMapsUrl(c.name);
  var domain = c.website ? c.website.replace(/^https?:\/\//, '').replace(/\/.*/, '') : '';
  var stateNames = { MA: 'Massachusetts', CT: 'Connecticut', VT: 'Vermont', NH: 'New Hampshire' };

  // D-04: Badges — only Verified + Distance (no county, no established, no "Unverified")
  var bg = '';
  if (ver) bg += '<span class="detail-badge verified"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Verified</span>';
  if (dist !== null) bg += '<span class="detail-badge county">' + utils.fmtDist(dist) + ' away</span>';
  // D-14: Accessibility badge
  if (c.is_accessible) bg += '<span class="detail-badge accessible"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="4" r="2"/><path d="M12 6v6m-4 4l4-4 4 4"/></svg>Accessible</span>';

  // D-03: Next-service highlight
  var nextSvc = utils.getNext(c, 'all');
  var nextHtml = '';
  if (nextSvc) {
    var isTomorrow = nextSvc.dayLabel === 'Tomorrow';
    var nsCls = nextSvc.isLive ? ' detail-next--live' : nextSvc.isSoon ? ' detail-next--soon' : isTomorrow ? ' detail-next--tomorrow' : '';
    var nsBadge = '';
    if (nextSvc.isLive) nsBadge = '<span class="detail-next-badge live"><span class="pulse-dot"></span>Happening now</span>';
    else if (nextSvc.isSoon) nsBadge = '<span class="detail-next-badge soon">Starting soon</span>';
    // DC-19: Relative countdown for today's services
    var nsDayLabel = nextSvc.dayLabel;
    if (nextSvc.dayLabel === 'Today' && !nextSvc.isLive && nextSvc.minutesUntil > 0) {
      if (nextSvc.minutesUntil <= 60) {
        nsDayLabel = 'in ' + nextSvc.minutesUntil + ' min';
      } else {
        var hrs = Math.floor(nextSvc.minutesUntil / 60);
        nsDayLabel = 'in ' + hrs + (hrs === 1 ? ' hour' : ' hours');
      }
    }
    nextHtml = '<div class="detail-next' + nsCls + '">'
      + '<div class="detail-next-time">' + nextSvc.timeFormatted + '</div>'
      + '<div class="detail-next-info">'
      + '<span class="detail-next-label">' + utils.esc(config.SVC_LABELS[nextSvc.service.type] || '') + '</span>'
      + nsBadge
      + '<span class="detail-next-day">' + nsDayLabel + '</span>'
      + '</div></div>';
  }

  // CD2-01: Merge same-day future services into hero
  var mergedKeys = [];
  if (nextSvc && nextSvc.dayLabel !== 'Today' && !nextSvc.isLive && !nextSvc.isSoon) {
    var heroDay = nextSvc.dayLabel;
    var heroDu = nextSvc._daysUntil;
    var now2 = utils.getNow();
    var curDI2 = now2.getDay();
    var curMin2 = now2.getHours() * 60 + now2.getMinutes();
    var sameDaySvcs = [];
    for (var mi = 0; mi < c.services.length; mi++) {
      var ms = c.services[mi];
      if (!ms.time || !ms.day) continue;
      if (ms.seasonal && ms.seasonal.is_seasonal) continue;
      if (ms.type === nextSvc.service.type && ms.time === nextSvc.service.time) continue;
      var msm = utils.toMin(ms.time);
      if (msm === null) continue;
      var mDays = [];
      if (ms.day === 'weekday') mDays = [1, 2, 3, 4, 5];
      else if (ms.day === 'daily') mDays = [0, 1, 2, 3, 4, 5, 6];
      else { var mdi = config.DAY_ORDER.indexOf(ms.day); if (mdi >= 0) mDays = [mdi]; }
      for (var mj = 0; mj < mDays.length; mj++) {
        var mDayI = mDays[mj];
        var mdu = mDayI - curDI2;
        if (mdu < 0) mdu += 7;
        if (mdu === 0 && curMin2 > msm + 60) mdu = 7;
        if (mdu === heroDu) {
          sameDaySvcs.push({ service: ms, time: msm });
        }
      }
    }
    if (sameDaySvcs.length > 0) {
      // Sort: mass types first, then confession, then by time
      var massTypes = ['sunday_mass', 'daily_mass', 'holy_day_mass'];
      sameDaySvcs.sort(function(a, b) {
        var aM = massTypes.indexOf(a.service.type) >= 0 ? 0 : a.service.type === 'confession' ? 1 : 2;
        var bM = massTypes.indexOf(b.service.type) >= 0 ? 0 : b.service.type === 'confession' ? 1 : 2;
        if (aM !== bM) return aM - bM;
        return a.time - b.time;
      });
      // Cap at 2 additional rows (3 total including hero)
      var maxExtra = 2;
      var shown = sameDaySvcs.slice(0, maxExtra);
      var overflow = sameDaySvcs.length - maxExtra;
      var multiHtml = '<div class="detail-next detail-next--tomorrow">';
      multiHtml += '<div class="detail-next-day-header">' + heroDay + '</div>';
      multiHtml += '<div class="detail-next-multi-row">';
      multiHtml += '<span class="detail-next-time">' + nextSvc.timeFormatted + '</span>';
      multiHtml += '<span class="detail-next-label">' + utils.esc(config.SVC_LABELS[nextSvc.service.type] || '') + '</span>';
      multiHtml += '</div>';
      for (var msi = 0; msi < shown.length; msi++) {
        multiHtml += '<div class="detail-next-multi-row">';
        multiHtml += '<span class="detail-next-time">' + utils.fmt12(shown[msi].service.time) + '</span>';
        multiHtml += '<span class="detail-next-label">' + utils.esc(config.SVC_LABELS[shown[msi].service.type] || '') + '</span>';
        multiHtml += '</div>';
      }
      if (overflow > 0) {
        multiHtml += '<div class="detail-next-overflow">+' + overflow + ' more ' + heroDay.toLowerCase() + '</div>';
      }
      multiHtml += '</div>';
      nextHtml = multiHtml;
      // Track ALL same-day services as merged for Coming Up dedup
      for (var mk = 0; mk < sameDaySvcs.length; mk++) {
        mergedKeys.push(sameDaySvcs[mk].service.type + '|' + sameDaySvcs[mk].service.time);
      }
    }
  }

  // Contact section
  var bulletinUrl = c.bulletin_url || '';
  var thirdActionUrl = bulletinUrl || c.website || '';
  var thirdActionLabel = bulletinUrl ? 'Bulletin' : 'Website';
  var thirdActionIcon = bulletinUrl
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  // SFD-03-B: Contact info as structured card
  var chtml = '<div class="detail-contact-card">';
  var _pastor = getPastor(c);
  if (_pastor) {
    var roleLabel = (config.CLERGY_ROLES[_pastor.role] || {}).label || _pastor.role;
    chtml += '<div class="contact-pastor"><div class="contact-pastor-name">' + utils.esc(_pastor.name) + '</div><div class="contact-pastor-role">' + utils.esc(roleLabel) + '</div></div>';
  }
  // Phone + email inline row
  var contactLinks = '';
  if (c.phone) contactLinks += '<a class="contact-link" href="tel:' + c.phone + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' + utils.esc(c.phone) + '</a>';
  if (c.emails && c.emails.length) {
    var emailAddr = c.emails[0];
    contactLinks += '<a class="contact-link" href="mailto:' + utils.esc(emailAddr) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' + utils.esc(emailAddr) + '</a>';
  }
  if (contactLinks) chtml += '<div class="contact-links-row">' + contactLinks + '</div>';
  // Website link
  if (c.website) chtml += '<div class="contact-web"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><a href="' + utils.esc(c.website) + '" target="_blank" rel="noopener">' + utils.esc(domain) + '</a></div>';
  // SFD-03-C: Office hours parsed multi-line
  if (c.office_hours) {
    var ohParts = utils.parseOfficeHours(c.office_hours);
    chtml += '<div class="detail-office-hours"><div class="detail-office-hours-label">Office Hours</div>';
    for (var ohi = 0; ohi < ohParts.length; ohi++) {
      chtml += '<div class="detail-office-hours-line">' + utils.esc(ohParts[ohi]) + '</div>';
    }
    chtml += '</div>';
  }
  // Social links — inline row
  var _socials = '';
  if (c.facebook) _socials += '<a class="contact-social-link" href="' + utils.esc(c.facebook) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</a>';
  if (c.instagram) _socials += '<a class="contact-social-link" href="' + utils.esc(c.instagram) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>Instagram</a>';
  if (_socials) chtml += '<div class="contact-social-row">' + _socials + '</div>';
  chtml += '</div>';

  // SFD-03-A: Quick actions — primary Directions + secondary pills
  var dirSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';
  var callSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  var shareSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

  var qa = '';
  // Primary: Directions (full-width)
  if (mapUrl) qa += '<div class="detail-primary-action"><a href="' + mapUrl + '" target="_blank" rel="noopener">' + dirSvg + '<span>Directions</span></a></div>';
  // Secondary row: Call, Bulletin/Website, Share
  qa += '<div class="detail-secondary-actions">';
  if (c.phone) qa += '<a class="detail-secondary-action" href="tel:' + c.phone + '">' + callSvg + '<span>Call</span></a>';
  if (thirdActionUrl) qa += '<a class="detail-secondary-action" href="' + utils.esc(thirdActionUrl) + '" target="_blank" rel="noopener">' + thirdActionIcon + '<span>' + thirdActionLabel + '</span></a>';
  qa += '<button class="detail-secondary-action" onclick="shareParish(\'' + utils.esc(utils.displayName(c.name)) + "','" + c.id + "')\">" + shareSvg + '<span>Share</span></button>';
  qa += '</div>';

  // D-07: Visitation data — CSS classes, no inline styles, no bell emoji
  var visitHtml = '';
  if (c.visitation && c.visitation.hours_note) {
    visitHtml = '<div class="detail-visitation">'
      + '<div><div class="detail-visitation-label">Open for Prayer</div>'
      + '<div class="detail-visitation-hours">' + utils.esc(c.visitation.hours_note) + '</div></div></div>';
  }

  // Accordion sections
  var locL = {};
  var ml = false;
  var secs = [
    { k: 'mass',  t: 'Mass Schedule',           ic: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', types: MASS_TYPES },
    { k: 'conf',  t: 'Sacraments',               ic: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', types: ['confession', 'anointing_of_sick'] },
    { k: 'ador',  t: 'Adoration & Holy Hour',     ic: 'M12 3v18m-6-6l6 6 6-6', types: ['adoration', 'perpetual_adoration', 'holy_hour'] },
    { k: 'devot', t: 'Prayer & Devotion',         ic: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z', types: ['rosary', 'stations_of_cross', 'divine_mercy', 'miraculous_medal', 'novena', 'devotion', 'vespers', 'gorzkie_zale', 'benediction'] },
  ];
  // DC-17: Only show Holy Week during Lent/Easter season
  var _isHolyWeekSeason = utils.isLentSeason() || (function() {
    var easter = utils.getEaster(utils.getNow().getFullYear());
    if (!easter) return false;
    var now = utils.getNow();
    var octaveEnd = new Date(easter.getTime() + 8 * 24 * 60 * 60 * 1000);
    return now <= octaveEnd;
  })();
  if (_isHolyWeekSeason) {
    secs.push({ k: 'hw', t: 'Holy Week', ic: 'M12 2v20M2 12h20', types: ['holy_thursday_mass', 'good_friday_service', 'easter_vigil_mass', 'palm_sunday_mass', 'easter_sunday_mass'] });
  }

  // D-11: Determine current day for today-dot indicator
  var _now = utils.getNow();
  var _curDI = _now.getDay();
  var _curDay = config.DAY_ORDER[_curDI];

  // DC-09: Auto-open accordion based on active filter
  var _filterSectionMap = {
    confession: 'conf',
    adoration: 'ador',
    latin: 'mass',
    spanish: 'mass',
    lent: 'devot'
  };
  var _autoOpenSection = _filterSectionMap[state.currentFilter] || 'mass';

  var secHtml = '';
  var _renderedSecs = [];
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

    // DC-15 + DC-21: Descriptive badge text
    var daySet = {};
    svcs.forEach(function(s) { if (s.day) daySet[s.day] = true; });
    var dayCount = Object.keys(daySet).length;
    var badgeText = '';
    if (timedCount === 0 && svcs.length > 0) {
      badgeText = 'By appt.';
    } else if (sec.k === 'conf') {
      // CDC-03-C: Use "X Confession times" when confession dominates (>80%)
      var confBadgeCount = svcs.filter(function(s) { return s.type === 'confession' && s.time; }).length;
      var confRatio = timedCount > 0 ? confBadgeCount / timedCount : 0;
      if (confRatio > 0.8) {
        badgeText = confBadgeCount + (confBadgeCount === 1 ? ' Confession time' : ' Confession times');
      } else {
        badgeText = timedCount + (timedCount === 1 ? ' time' : ' times');
      }
    } else if (sec.k === 'ador') {
      badgeText = timedCount + (timedCount === 1 ? ' time' : ' times');
    } else if (sec.k === 'devot') {
      // CDC-05-B: Count distinct service types for Prayer & Devotion badge
      var devTypeSet = {};
      svcs.forEach(function(s) { if (s.type) devTypeSet[s.type] = true; });
      var devTypeCount = Object.keys(devTypeSet).length;
      badgeText = devTypeCount + (devTypeCount === 1 ? ' devotion' : ' devotions');
    } else {
      badgeText = dayCount + (dayCount === 1 ? ' day' : ' days');
    }

    var isFirst = sec.k === _autoOpenSection;

    // D-11: Check if any service in this section is available today
    var hasToday = svcs.some(function(s) {
      if (!s.time || !s.day) return false;
      return s.day === _curDay || s.day === 'daily' || (s.day === 'weekday' && _curDI >= 1 && _curDI <= 5);
    });
    var todayDot = hasToday ? '<span class="accordion-today-dot"></span>' : '';

    // Split First Fri/Sat to top of devotion section
    var bodyInner = '';
    if (sec.k === 'devot') {
      var firstDevSvcs = svcs.filter(function(s) { return isFirstDevotionMass(s); });
      var regularDevSvcs = svcs.filter(function(s) { return !isFirstDevotionMass(s); });
      if (firstDevSvcs.length) {
        bodyInner += '<div class="first-devotion-highlight">' + renderSched(firstDevSvcs, locL, ml, sec.types, _curDay) + '</div>';
      }
      bodyInner += renderSched(regularDevSvcs, locL, ml, sec.types, _curDay);
      // CDC-05-A: Progressive disclosure for 8+ rows
      var devotRowCount = (bodyInner.match(/class="schedule-row/g) || []).length;
      if (devotRowCount >= 8) {
        var devotTypeSet = {};
        svcs.forEach(function(s) { if (s.type) devotTypeSet[s.type] = true; });
        var devotTypeList = Object.keys(devotTypeSet).map(function(t) {
          return '<li>' + utils.esc(config.SVC_LABELS[t] || t) + '</li>';
        }).join('');
        bodyInner = '<ul class="schedule-summary-list">' + devotTypeList + '</ul>'
          + '<details class="schedule-full"><summary class="schedule-full-toggle">Show full schedule</summary>'
          + bodyInner + '</details>';
      }
    } else if (sec.k === 'conf') {
      // CDC-03-A: "Next available" confession callout at top
      var nextConf = utils.getNext(c, 'confession');
      var nextConfHtml = '';
      if (nextConf) {
        nextConfHtml = '<div class="schedule-next-available">'
          + '<div class="schedule-next-available-time">' + utils.esc(nextConf.timeFormatted) + '</div>'
          + '<div class="schedule-next-available-day">Next: ' + utils.esc(nextConf.dayLabel) + '</div>'
          + '</div>';
      }
      bodyInner = nextConfHtml + renderSched(svcs, locL, ml, sec.types, _curDay)
        + '<div class="conf-guide-nudge" onclick="openConfessionGuide()">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14" style="flex-shrink:0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
        + 'First time in a while? <span class="conf-guide-nudge-link">What to expect \u203A</span>'
        + '</div>';
    } else if (sec.k === 'ador') {
      // DC-20: Perpetual Adoration special card
      var perpSvcs = svcs.filter(function(s) { return s.type === 'perpetual_adoration'; });
      var regularAdor = svcs.filter(function(s) { return s.type !== 'perpetual_adoration'; });
      if (perpSvcs.length) {
        var perpLoc = ml && perpSvcs[0].location_id && locL[perpSvcs[0].location_id] ? locL[perpSvcs[0].location_id] : '';
        bodyInner += '<div class="schedule-perpetual-card">'
          + '<div class="schedule-perpetual-title">Perpetual Adoration</div>'
          + '<div class="schedule-perpetual-subtitle">Available 24 hours' + (perpLoc ? ' \u00b7 ' + utils.esc(perpLoc) : '') + '</div>'
          + (perpSvcs[0].notes ? '<div class="schedule-note">' + utils.esc(perpSvcs[0].notes) + '</div>' : '')
          + '</div>';
      }
      if (regularAdor.length) {
        bodyInner += renderSched(regularAdor, locL, ml, sec.types, _curDay);
      }
    } else {
      bodyInner = renderSched(svcs, locL, ml, sec.types, _curDay);
    }

    secHtml += '<div class="detail-section" id="sec-' + sec.k + '"><button class="accordion-header" aria-expanded="' + isFirst + '" onclick="toggleAcc(this)">'
      + '<div class="accordion-header-left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + sec.ic + '"/></svg>'
      + '<span class="accordion-title">' + sec.t + '</span><span class="accordion-count">' + badgeText + '</span>' + todayDot + '</div>'
      + '<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
      + '</button><div class="accordion-body' + (isFirst ? ' open' : '') + '"><div class="accordion-body-inner">' + bodyInner + '</div></div></div>';
    _renderedSecs.push({ k: sec.k, t: sec.t });
  }

  // DC-R2-08: Jump nav strip for complex parishes (3+ accordion sections)
  var jumpNav = '';
  if (_renderedSecs.length >= 3) {
    jumpNav = '<div class="detail-jump-nav">';
    for (var ji = 0; ji < _renderedSecs.length; ji++) {
      var shortLabel = _renderedSecs[ji].t.replace(' & Holy Hour', '').replace(' & Devotion', '').replace(' Schedule', '');
      jumpNav += '<button class="detail-jump-chip" onclick="document.getElementById(\'sec-' + _renderedSecs[ji].k + '\').scrollIntoView({behavior:\'smooth\',block:\'start\'})">' + shortLabel + '</button>';
    }
    jumpNav += '</div>';
  }

  // Community events section — lazy require to avoid circular dep
  var ceHtml = '';
  try {
    var events = require('./events.js');
    if (events && typeof events.renderCommunityEvents === 'function') {
      ceHtml = events.renderCommunityEvents(c);
    }
  } catch (e) { /* events.js not yet available */ }

  // D-08: Verify prompt + correction form (submit button uses CSS class)
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
    + '<button class="corr-submit-btn" onclick="submitCorrection()">Submit Correction</button>'
    + '</div>'
    + '<div class="verify-thanks" id="verifyThanks" style="display:none">Thank you for helping keep MassFinder accurate! God bless.</div>';

  // CD2-05: Footer metadata — structured grid layout
  var footerItems = [];
  if (c.county) footerItems.push({ label: 'County', value: utils.esc(c.county) });
  if (c.established) footerItems.push({ label: 'Established', value: utils.esc(c.established) });
  if (v.last_checked) footerItems.push({ label: 'Last checked', value: utils.fmtRelDate(v.last_checked) });
  if (v.bulletin_date) footerItems.push({ label: 'Bulletin', value: utils.fmtMonth(v.bulletin_date) });
  if (v.source) footerItems.push({ label: 'Source', value: utils.esc(v.source) });
  var footer = '<div class="detail-footer-row">';
  if (footerItems.length) {
    footer += '<div class="detail-footer-meta">';
    for (var fi = 0; fi < footerItems.length; fi++) {
      footer += '<div class="detail-footer-meta-item">'
        + '<span class="detail-footer-meta-label">' + footerItems[fi].label + '</span>'
        + '<span class="detail-footer-meta-value">' + footerItems[fi].value + '</span>'
        + '</div>';
    }
    footer += '</div>';
  }
  // QR Code button disabled for v1
  footer += '</div>';

  // D-01: Address below town; D-13: State name map; CDC-01: Smart address dedup
  var addressContainsCity = c.address && c.city &&
    c.address.toLowerCase().indexOf(c.city.toLowerCase()) >= 0;
  var townHtml;
  if (addressContainsCity) {
    townHtml = '<div class="detail-address">' + utils.esc(c.address) + '</div>';
  } else if (c.address) {
    townHtml = utils.esc(c.city) + ', ' + utils.esc(stateNames[c.state] || c.state || '')
      + '<div class="detail-address">' + utils.esc(c.address) + '</div>';
  } else {
    townHtml = utils.esc(c.city) + ', ' + utils.esc(stateNames[c.state] || c.state || '');
  }

  document.getElementById('detailContent').innerHTML =
    '<div class="detail-header"><div class="detail-header-top"><h2 class="detail-name">' + utils.esc(utils.displayName(c.name)) + '</h2>'
    + '<div class="detail-actions"><button class="detail-action-btn fav-btn' + (fav ? ' fav-active' : '') + '" data-id="' + c.id + '" onclick="toggleFav(\'' + c.id + '\')" aria-label="Favorite"><svg viewBox="0 0 24 24" fill="' + (fav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>'
    + '<button class="detail-action-btn" onclick="closeDetail()" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    + '</div></div><div class="detail-town">' + townHtml + '</div>' + nextHtml + '<div class="detail-badges">' + bg + '</div></div>'
    + '<div class="detail-body">' + _getComingUp(c, nextSvc, mergedKeys) + visitHtml + qa + chtml + jumpNav + secHtml + ceHtml + vp + footer + '</div>';

  document.getElementById('detailBackdrop').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('detailPanel').scrollTop = 0;
  window._lastFocused = document.activeElement;
  history.replaceState(null, '', '#' + id);
  if (typeof trapFocus === 'function') trapFocus(document.getElementById('detailPanel'));
  setTimeout(function() { var cb = document.querySelector('.detail-action-btn[aria-label="Close"]'); if (cb) cb.focus(); }, 350);
  // DC-23: Scroll "Coming Up" into view if present
  setTimeout(function() {
    var comingUp = document.querySelector('.detail-coming-up');
    if (comingUp) {
      comingUp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 450);
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

// ── QR Code (LIB-03) — lazy-loads qr-creator from CDN ──
var _qrScriptLoaded = false;
function _loadQRCreator() {
  if (_qrScriptLoaded) return Promise.resolve();
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qr-creator@1.0.0/dist/qr-creator.min.js';
    s.onload = function() { _qrScriptLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function showQR(churchId) {
  var url = location.origin + location.pathname + '#' + churchId;
  // Show a modal with the QR code
  var existing = document.getElementById('qrModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'qrModal';
  modal.className = 'qr-modal';
  modal.innerHTML = '<div class="qr-modal-card">'
    + '<div class="qr-modal-title">Scan to open this parish</div>'
    + '<div class="qr-canvas-wrap" id="qrCanvasWrap"><div class="qr-loading">Generating\u2026</div></div>'
    + '<div class="qr-modal-url">' + utils.esc(url) + '</div>'
    + '<button class="qr-modal-close" onclick="document.getElementById(\'qrModal\').remove()">Close</button>'
    + '</div>';
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  _loadQRCreator().then(function() {
    var wrap = document.getElementById('qrCanvasWrap');
    if (!wrap || !window.QrCreator) return;
    wrap.innerHTML = '';
    var canvas = document.createElement('canvas');
    window.QrCreator.render({
      text: url,
      radius: 0.3,
      ecLevel: 'M',
      fill: document.documentElement.getAttribute('data-theme') === 'dark' ? '#E5E7EB' : '#1F2937',
      background: 'transparent',
      size: 200
    }, canvas);
    wrap.appendChild(canvas);
  }).catch(function() {
    var wrap = document.getElementById('qrCanvasWrap');
    if (wrap) wrap.innerHTML = '<div class="qr-loading">Could not generate QR code</div>';
  });
}

function showSubscribeQR(parishId) {
  var url = location.origin + '/subscribe.html' + (parishId ? '?parish=' + encodeURIComponent(parishId) : '');
  var existing = document.getElementById('qrModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'qrModal';
  modal.className = 'qr-modal';
  modal.innerHTML = '<div class="qr-modal-card">'
    + '<div class="qr-modal-title">Weekly Email Signup</div>'
    + '<div class="qr-modal-subtitle">Scan to subscribe to parish updates by email \u2014 no app needed.</div>'
    + '<div class="qr-canvas-wrap" id="qrCanvasWrap"><div class="qr-loading">Generating\u2026</div></div>'
    + '<div class="qr-modal-url">' + utils.esc(url) + '</div>'
    + '<button class="qr-modal-close" onclick="document.getElementById(\'qrModal\').remove()">Close</button>'
    + '</div>';
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  _loadQRCreator().then(function() {
    var wrap = document.getElementById('qrCanvasWrap');
    if (!wrap || !window.QrCreator) return;
    wrap.innerHTML = '';
    var canvas = document.createElement('canvas');
    window.QrCreator.render({
      text: url,
      radius: 0.3,
      ecLevel: 'M',
      fill: document.documentElement.getAttribute('data-theme') === 'dark' ? '#E5E7EB' : '#1F2937',
      background: 'transparent',
      size: 200
    }, canvas);
    wrap.appendChild(canvas);
  }).catch(function() {
    var wrap = document.getElementById('qrCanvasWrap');
    if (wrap) wrap.innerHTML = '<div class="qr-loading">Could not generate QR code</div>';
  });
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
function renderSched(svcs, locL, ml, sectionTypes, todayDay) {
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

  // SFD-02-A: Today-first dynamic reordering — collect sections, then reorder
  var tomorrowDayIdx = (config.DAY_ORDER.indexOf(todayDay) + 1) % 7;
  var tomorrowDay = config.DAY_ORDER[tomorrowDayIdx];
  var WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday'];
  var weekdayIsToday = WEEKDAYS.indexOf(todayDay) >= 0;
  var weekdayIsTomorrow = WEEKDAYS.indexOf(tomorrowDay) >= 0;

  // Build sections as {key, html} — key: 'today', 'tomorrow', 'regular', 'special'
  var sections = [];
  var _collapsedShowedToday = false;

  // Helper to determine section priority for a day
  function _dayPriority(day) {
    if (day === todayDay) return 'today';
    if (day === 'weekday' && weekdayIsToday) return 'today';
    if (day === 'daily') return 'today';
    if (day === tomorrowDay) return 'tomorrow';
    if (day === 'weekday' && weekdayIsTomorrow) return 'tomorrow';
    return 'regular';
  }

  // Collapsed weekdays
  if (collapsed.length) {
    collapsed.sort(function(a, b) { return (utils.toMin(a.svc.time) || 0) - (utils.toMin(b.svc.time) || 0); });
    _collapsedShowedToday = weekdayIsToday;
    var collapsedTodayCls = weekdayIsToday ? ' schedule-day--today' : '';
    var collapsedTag = weekdayIsToday ? '<span class="schedule-today-tag">Today</span>' : '';
    var ch = '<div class="schedule-day' + collapsedTodayCls + '"><div class="schedule-day-label">Weekdays' + collapsedTag + '</div>';
    for (var ci = 0; ci < collapsed.length; ci++) {
      ch += renderRow(collapsed[ci].svc, locL, ml, collapsed[ci].label, collapsed[ci].extraNote);
    }
    ch += '</div>';
    var collapsedPriority = weekdayIsToday ? 'today' : (weekdayIsTomorrow ? 'tomorrow' : 'regular');
    sections.push({ priority: collapsedPriority, order: 1, html: ch });
  }

  // Sunday
  if (dayGrp['sunday']) {
    sections.push({ priority: _dayPriority('sunday'), order: 0, html: renderDayGroup('sunday', 'Sunday', dayGrp['sunday'], locL, ml) });
  }

  // Individual uncollapsed weekdays (Mon-Fri that didn't collapse)
  for (var wdi = 0; wdi < week.length; wdi++) {
    var day = week[wdi];
    if (day === 'sunday' || day === 'saturday') continue;
    if (dayGrp[day]) {
      sections.push({ priority: _dayPriority(day), order: config.DAY_ORDER.indexOf(day), html: renderDayGroup(day, config.DAY_NAMES[day] || day, dayGrp[day], locL, ml, _collapsedShowedToday) });
    }
  }

  // Saturday
  if (dayGrp['saturday']) {
    sections.push({ priority: _dayPriority('saturday'), order: 6, html: renderDayGroup('saturday', 'Saturday', dayGrp['saturday'], locL, ml) });
  }

  // Special days (first_friday, holyday, etc.) — always after regular days
  var other = allKeys.filter(function(d) { return config.DAY_ORDER.indexOf(d) < 0; });
  for (var oi = 0; oi < other.length; oi++) {
    var oday = other[oi];
    var olabel = specLabels[oday] || oday.replace(/_/g, ' ').replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
    sections.push({ priority: 'special', order: 100 + oi, html: renderDayGroup(oday, olabel, dayGrp[oday], locL, ml) });
  }

  // Sort: today first, tomorrow second, regular in liturgical order, special last
  var _priorityOrder = { today: 0, tomorrow: 1, regular: 2, special: 3 };
  sections.sort(function(a, b) {
    var pa = _priorityOrder[a.priority], pb = _priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return a.order - b.order;
  });

  var html = '';
  for (var si = 0; si < sections.length; si++) {
    html += sections[si].html;
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
      var cbadges = lb + rb;
      var cbadgeHtml = cbadges ? '<div class="schedule-badges">' + cbadges + '</div>' : '';
      html += '<div class="schedule-row"><div class="schedule-time">' + utils.fmt12(trep.time) + '</div><div class="schedule-meta">' + cbadgeHtml + '</div></div>';
    }
    html += '</div>';
  }

  if (appt.length) html += '<div class="schedule-appt">By appointment \u2014 call the parish office</div>';
  return html;

  // === Nested Helper: render a day group ===
  function renderDayGroup(day, label, ss, locL, ml, suppressTodayTag) {
    if (!ss || !ss.length) return '';
    ss.sort(function(a, b) { return (utils.toMin(a.time) || 0) - (utils.toMin(b.time) || 0); });
    var merged = mergeSameTime(ss);
    var dayCls = day === 'first_friday' ? ' first-friday' : day === 'first_saturday' ? ' first-saturday' : '';
    // DC-01: Today highlighting
    var isToday = (day === todayDay) ||
      (day === 'weekday' && ['monday','tuesday','wednesday','thursday','friday'].indexOf(todayDay) >= 0) ||
      (day === 'daily');
    var todayCls = isToday ? ' schedule-day--today' : '';
    // DC-R2-01: suppress tag text if collapsed weekdays already showed TODAY, but keep highlight
    var todayTag = (isToday && !suppressTodayTag) ? '<span class="schedule-today-tag">Today</span>' : '';
    var sub = day === 'first_friday' ? '<div class="schedule-day-subtitle">Devotion to the Sacred Heart of Jesus</div>'
      : day === 'first_saturday' ? '<div class="schedule-day-subtitle">Devotion to the Immaculate Heart of Mary</div>' : '';
    var h = '<div class="schedule-day' + dayCls + todayCls + '"><div class="schedule-day-label">' + utils.esc(label) + todayTag + '</div>' + sub;

    // DC-04: Multi-location sub-grouping
    if (ml && merged.some(function(s) { return s.location_id; })) {
      var locGroups = {};
      var locOrder = [];
      for (var li = 0; li < merged.length; li++) {
        var loc = merged[li].location_id || '_none';
        if (!locGroups[loc]) { locGroups[loc] = []; locOrder.push(loc); }
        locGroups[loc].push(merged[li]);
      }
      if (locOrder.length > 1) {
        for (var gi = 0; gi < locOrder.length; gi++) {
          var locId = locOrder[gi];
          var locName = locId !== '_none' && locL[locId] ? locL[locId] : '';
          if (locName) {
            h += '<div class="schedule-loc-group"><div class="schedule-loc-header">' + utils.esc(locName) + '</div>';
          }
          h += _renderRowsWithDivider(locGroups[locId], locL, false);
          if (locName) h += '</div>';
        }
        return h + '</div>';
      }
    }

    // Default: single location — try inline, else rows with AM/PM divider
    h += _renderRowsWithDivider(merged, locL, ml);
    return h + '</div>';

    // Check if all services in a group can be rendered inline (simple times, no complex meta)
    function _canRenderInline(rows) {
      if (rows.length < 2) return false;
      var badgeCount = 0;
      for (var ci = 0; ci < rows.length; ci++) {
        var s = rows[ci];
        if (s.end_time || s.recurrence || s.times_vary) return false;
        if (utils.cleanNote(s)) return false;
        if (s._mergedNotes && s._mergedNotes.length) return false;
        // Multi-location services with visible location labels stay as rows
        if (ml && s.location_id) return false;
        // CD2-03: Count badge-producing attributes
        if ((s.language && s.language !== 'en') || s.rite === 'tridentine' || s.seasonal) {
          badgeCount++;
        }
      }
      // CD2-03: Fall back to rows if majority have badges
      if (badgeCount > rows.length / 2) return false;
      return true;
    }

    // Render inline compact times: "8:30 · 10:00 · 11:30 AM"
    function _renderInline(rows) {
      var hasAM = false, hasPM = false;
      for (var ci = 0; ci < rows.length; ci++) {
        var m = utils.toMin(rows[ci].time);
        if (m !== null) { if (m < 720) hasAM = true; else hasPM = true; }
      }
      var mixed = hasAM && hasPM;
      var out = '<div class="schedule-inline">';
      for (var ri = 0; ri < rows.length; ri++) {
        var s = rows[ri];
        if (ri > 0) out += '<span class="schedule-inline-dot">\u00b7</span>';
        // Show bare time unless AM/PM spans cross 12 hrs
        var tStr = mixed ? utils.fmt12(s.time) : utils.fmt12bare(s.time);
        out += '<span class="schedule-inline-time">' + tStr;
        // Inline badges (language, rite, vigil)
        if (s.language && s.language !== 'en') out += '<span class="schedule-lang-badge">' + (LANG_NAMES[s.language] || s.language) + '</span>';
        if (s.rite === 'tridentine') out += '<span class="schedule-lang-badge">TLM</span>';
        if (s.type === 'sunday_mass' && s.day === 'saturday') out += '<span class="schedule-vigil-badge">Vigil</span>';
        if (s.seasonal) {
          if (s.seasonal.season === 'lent') out += '<span class="schedule-season-badge schedule-season-badge--lent">Lent</span>';
          else if (s.seasonal.season === 'summer') out += '<span class="schedule-season-badge schedule-season-badge--summer">Summer</span>';
          else if (s.seasonal.season === 'academic_year') out += '<span class="schedule-season-badge schedule-season-badge--academic">Academic Year</span>';
        }
        out += '</span>';
      }
      // Shared AM/PM suffix when all times are in the same half-day
      if (!mixed && rows.length) {
        var refMin = utils.toMin(rows[0].time);
        var suffix = (refMin !== null && refMin >= 720) ? 'PM' : 'AM';
        out += '<span class="schedule-inline-suffix">' + suffix + '</span>';
      }
      out += '</div>';
      return out;
    }

    // DC-03: AM/PM divider helper
    function _renderRowsWithDivider(rows, locL, showLoc) {
      // Try compact inline rendering for simple day groups
      if (_canRenderInline(rows)) return _renderInline(rows);

      var out = '';
      var hasAM = false, hasPM = false;
      for (var chk = 0; chk < rows.length; chk++) {
        var chkMin = utils.toMin(rows[chk].time);
        if (chkMin !== null) {
          if (chkMin < 720) hasAM = true;
          else hasPM = true;
        }
      }
      var needsDivider = hasAM && hasPM;
      var dividerInserted = false;
      for (var mi = 0; mi < rows.length; mi++) {
        if (needsDivider && !dividerInserted) {
          var thisMin = utils.toMin(rows[mi].time);
          if (thisMin !== null && thisMin >= 720) {
            out += '<div class="schedule-ampm-break" aria-hidden="true"></div>';
            dividerInserted = true;
          }
        }
        out += renderRow(rows[mi], locL, showLoc);
      }
      return out;
    }
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
    // CDC-02: Two-line time rendering for ranges; duration for confession + adoration
    var tStr;
    if (s.end_time) {
      var durTypes = ['confession', 'adoration', 'perpetual_adoration', 'holy_hour'];
      var durMin = (utils.toMin(s.end_time) || 0) - (utils.toMin(s.time) || 0);
      var durStr = '';
      if (durTypes.indexOf(s.type) >= 0 && durMin > 0) {
        durStr = durMin >= 60
          ? ' (' + Math.floor(durMin / 60) + ' hr' + (durMin >= 120 ? 's' : '') + ')'
          : ' (' + durMin + ' min)';
      }
      tStr = utils.fmt12(s.time)
        + '<span class="schedule-time-end">\u2013 ' + utils.fmt12(s.end_time) + durStr + '</span>';
    } else {
      tStr = utils.fmt12(s.time);
    }

    var lb = s.language && s.language !== 'en' ? '<span class="schedule-lang-badge">' + (LANG_NAMES[s.language] || s.language) + '</span>' : '';
    var rb = s.rite === 'tridentine' ? '<span class="schedule-lang-badge">TLM</span>' : '';

    // DC-08: Seasonal badges with SVG and proper colors
    var sb = '';
    if (s.seasonal && s.seasonal.season === 'lent') {
      sb = '<span class="schedule-season-badge schedule-season-badge--lent"><svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 1c3.3 0 6 2.7 6 6 0 1.6-.6 3.1-1.8 4.2L8 15l-4.2-3.8C2.6 10.1 2 8.6 2 7c0-3.3 2.7-6 6-6z"/></svg>Lent</span>';
    } else if (s.seasonal && s.seasonal.season === 'summer') {
      sb = '<span class="schedule-season-badge schedule-season-badge--summer">Summer</span>';
    } else if (s.seasonal && s.seasonal.season === 'academic_year') {
      sb = '<span class="schedule-season-badge schedule-season-badge--academic">Academic Year</span>';
    }

    // DC-05: Vigil badge
    var viglBadge = '';
    if (s.type === 'sunday_mass' && s.day === 'saturday') {
      viglBadge = '<span class="schedule-vigil-badge">Vigil</span>';
    }

    var loc = ml && s.location_id && locL[s.location_id] ? locL[s.location_id] : '';
    var tl = config.SVC_LABELS[s.type] || s.type;
    var note = extraNote || utils.cleanNote(s) || '';
    var merged = (s._mergedNotes || []).filter(function(n) { return n; }).join('; ');

    // Suppress type label when it matches the accordion section
    var showTypeLabel = !isSingleTypeSection && ['sunday_mass', 'daily_mass'].indexOf(s.type) < 0;

    var meta = '';

    // DC-10: Recurrence badge FIRST — most critical scheduling info
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
      if (recLabel) meta += '<span class="schedule-recurrence-badge">' + utils.esc(recLabel) + '</span>';
    }

    // CDC-07-A: Suppress notes that restate start+end times (under 80 chars)
    if (note && s.end_time && note.length < 80) {
      var nLower = note.toLowerCase();
      var startFmt = utils.fmt12(s.time).toLowerCase().replace(' ', '');
      var endFmt = utils.fmt12(s.end_time).toLowerCase().replace(' ', '');
      if (nLower.indexOf(startFmt) >= 0 && nLower.indexOf(endFmt) >= 0) {
        note = '';
      }
    }

    if (dayLabel) meta += '<div class="schedule-location" style="font-weight:var(--weight-medium)">' + utils.esc(dayLabel) + '</div>';
    if (loc) meta += '<span class="schedule-loc-badge">' + utils.esc(loc) + '</span>';
    if (showTypeLabel) meta += '<div class="schedule-location">' + utils.esc(tl) + '</div>';
    if (note) meta += '<div class="schedule-note">' + utils.esc(note) + '</div>';
    if (merged) meta += '<div class="schedule-note">' + utils.esc(merged) + '</div>';
    if (s.times_vary) meta += '<div class="schedule-note">Times may vary \u2014 check bulletin</div>';

    // DC-06: Communion service row class; CDC-02: tighter padding for range rows
    var rowCls = 'schedule-row';
    if (s.end_time) rowCls += ' schedule-row--has-range';
    if (s.type === 'communion_service') rowCls += ' schedule-row--communion';

    var badges = lb + rb + sb + viglBadge;
    var badgeHtml = badges ? '<div class="schedule-badges">' + badges + '</div>' : '';
    return '<div class="' + rowCls + '"><div class="schedule-time">' + tStr + '</div><div class="schedule-meta">' + badgeHtml + meta + '</div></div>';
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
  showQR: showQR,
  showSubscribeQR: showSubscribeQR,
  showToast: showToast,
  getMapsUrl: getMapsUrl,
  getMapsUrlCoords: getMapsUrlCoords,
  toggleAcc: toggleAcc,
  renderSched: renderSched,
};
