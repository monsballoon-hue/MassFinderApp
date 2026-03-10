// src/saved.js — Saved tab rendering
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');

var DAY_NAMES = config.DAY_NAMES;
var SVC_LABELS = config.SVC_LABELS;
var displayName = utils.displayName;
var getNow = utils.getNow;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var isEventActive = utils.isEventActive;
var getNextEventDate = utils.getNextEventDate;
var getRemainingDates = utils.getRemainingDates;
var isVer = utils.isVer;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var getNext = utils.getNext;
var state = data.state;
var isFav = data.isFav;

// ── renderUnifiedEvt — single event row for the unified list ──
function renderUnifiedEvt(e, isYC) {
  var c = state.allChurches.find(function(x) { return x.id === e.church_id; }) || {};
  var pName = displayName(c.name || '');

  // When text
  var whenParts = [];
  if (e.dates && e.dates.length) {
    var next = getNextEventDate(e);
    var rem = getRemainingDates(e);
    if (next) {
      var todayStr = getNow().toISOString().slice(0, 10);
      var tmrw = new Date(getNow()); tmrw.setDate(tmrw.getDate() + 1);
      if (next === todayStr) whenParts.push('Today');
      else if (next === tmrw.toISOString().slice(0, 10)) whenParts.push('Tomorrow');
      else {
        var d = new Date(next + 'T12:00:00');
        whenParts.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    }
    if (rem.length > 1) whenParts.push(rem.length + ' dates left');
  } else if (e.date) {
    var d2 = new Date(e.date + 'T12:00:00');
    var todayStr2 = getNow().toISOString().slice(0, 10);
    var tmrw2 = new Date(getNow()); tmrw2.setDate(tmrw2.getDate() + 1);
    if (e.date === todayStr2) whenParts.push('Today');
    else if (e.date === tmrw2.toISOString().slice(0, 10)) whenParts.push('Tomorrow');
    else whenParts.push(d2.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  } else if (e.day) {
    whenParts.push((DAY_NAMES[e.day] || e.day) + 's');
  }
  if (e.time) whenParts.push(fmt12(e.time));
  whenParts.push(pName);

  var rowClass = isYC ? 'saved-evt-unified evt-yc-row' : 'saved-evt-unified';
  var ycBadge = isYC ? ' <span class="evt-yc-badge">YC</span>' : '';
  var onclick = 'openEventDetail(\'' + e.id + '\')';

  return '<div class="' + rowClass + '" onclick="' + onclick + '">'
    + '<div class="saved-evt-unified-body">'
    + '<div class="saved-evt-unified-title">' + esc(e.title) + ycBadge + '</div>'
    + '<div class="saved-evt-unified-when">' + whenParts.join(' \u00b7 ') + '</div>'
    + '</div>'
    + '<svg class="saved-evt-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</div>';
}

// ── renderSaved ──
function renderSaved() {
  var events = require('./events.js');
  var getUpcomingYC = events.getUpcomingYC;
  var toggleFav = data.toggleFav;

  var el = document.getElementById('savedList');
  var favChurches = state.allChurches.filter(function(c) { return isFav(c.id); });
  var favIds = new Set(favChurches.map(function(c) { return c.id; }));
  var count = favChurches.length;

  // Update count badges — weekly event count at favorited churches
  var now = getNow();
  var todayStr = now.toISOString().slice(0, 10);
  var endStr = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  var weeklyEvtCount = (state.eventsData || []).filter(function(e) {
    if (!favIds.has(e.church_id)) return false;
    var d = e.date || '';
    return d >= todayStr && d <= endStr;
  }).length;
  var countBadge = document.getElementById('savedCountBadge');
  if (countBadge) {
    countBadge.textContent = weeklyEvtCount || '';
    countBadge.classList.toggle('visible', weeklyEvtCount > 0);
  }
  var tabBadge = document.getElementById('savedTabBadge');
  if (tabBadge) {
    tabBadge.textContent = weeklyEvtCount || '';
    tabBadge.classList.toggle('visible', weeklyEvtCount > 0);
  }

  if (!favChurches.length) {
    el.innerHTML = '<div class="saved-empty">'
      + '<div class="saved-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>'
      + '<h3>Save your parish for quick access</h3>'
      + '<p>Your saved churches appear here with their upcoming schedules and events at a glance.</p>'
      + '<button class="saved-empty-btn" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Find churches near me</button>'
      + '</div>';
    return;
  }

  var checkSvg = '<svg class="card-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>';

  var html = '';

  // ── UPCOMING EVENTS — unified chronological list ──
  var allEvents = [];

  // Community events at saved churches
  state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  }).forEach(function(e) {
    allEvents.push({ evt: e, isYC: false });
  });

  // YC events at saved churches
  var upcomingYC = getUpcomingYC().filter(function(e) { return favIds.has(e.church_id); });
  upcomingYC.forEach(function(e) {
    allEvents.push({ evt: e, isYC: true });
  });

  // Sort chronologically: by next date, then time
  allEvents.sort(function(a, b) {
    var dateA = getNextEventDate(a.evt) || a.evt.date || '9999';
    var dateB = getNextEventDate(b.evt) || b.evt.date || '9999';
    var cmp = dateA.localeCompare(dateB);
    if (cmp !== 0) return cmp;
    return (a.evt.time || '').localeCompare(b.evt.time || '');
  });

  if (allEvents.length) {
    html += '<div class="saved-section-label">UPCOMING EVENTS</div>';

    // Show first 3
    var showCount = Math.min(3, allEvents.length);
    for (var i = 0; i < showCount; i++) {
      html += renderUnifiedEvt(allEvents[i].evt, allEvents[i].isYC);
    }

    // "N more" expandable
    if (allEvents.length > 3) {
      var moreCount = allEvents.length - 3;
      html += '<details class="saved-more-details"><summary class="saved-more-toggle">' + moreCount + ' more</summary>';
      for (var j = 3; j < allEvents.length; j++) {
        html += renderUnifiedEvt(allEvents[j].evt, allEvents[j].isYC);
      }
      html += '</details>';
    }
  }

  // ── Church cards ──
  // Count active events per church for badges
  var evtCounts = {};
  state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  }).forEach(function(e) {
    evtCounts[e.church_id] = (evtCounts[e.church_id] || 0) + 1;
  });

  // Sort: within 10mi by next service, then beyond 10mi by next service
  var sortedFav = favChurches.map(function(c) {
    return { c: c, next: getNext(c, 'all'), dist: getDist(c, state.userLat, state.userLng) };
  }).sort(function(a, b) {
    var aC = a.dist !== null && a.dist <= 10;
    var bC = b.dist !== null && b.dist <= 10;
    if (aC !== bC) return aC ? -1 : 1;
    var aMin = a.next ? a.next.minutesUntil : 99999;
    var bMin = b.next ? b.next.minutesUntil : 99999;
    return aMin - bMin;
  });

  html += sortedFav.map(function(item) {
    var c = item.c, next = item.next, dist = item.dist;
    var ver = isVer(c);
    var statusBadge = '';
    if (next && next.isLive) statusBadge = '<span class="card-live-badge"><span class="pulse-dot"></span>Live</span>';
    else if (next && next.isSoon) statusBadge = '<span class="card-soon-badge"><span class="pulse-dot"></span>Soon</span>';
    var nh;
    if (next) {
      nh = '<div class="card-next-service"><span class="card-next-time">' + next.timeFormatted + '</span><span class="card-next-label">' + esc(SVC_LABELS[next.service.type] || next.service.type) + '</span>' + statusBadge + '</div><div class="card-next-day">' + next.dayLabel + '</div>';
    } else {
      nh = '<div class="card-next-service"><span class="card-next-label" style="color:var(--color-text-tertiary)">Check bulletin for times</span></div>';
    }
    var ec = evtCounts[c.id];
    var evtBadge = ec ? '<span class="saved-evt-count">' + ec + ' event' + (ec !== 1 ? 's' : '') + '</span>' : '';
    return '<article class="parish-card" role="listitem" onclick="openDetail(\'' + c.id + '\')">'
      + '<div class="card-top"><div class="card-name-row"><h3 class="card-name">' + esc(displayName(c.name)) + '</h3>' + (ver ? checkSvg : '') + '</div>'
      + '<div class="card-right">' + (dist !== null ? '<span class="card-distance">' + fmtDist(dist) + '</span>' : '')
      + '<button class="card-fav is-fav" onclick="toggleFav(\'' + c.id + '\',event);renderSaved()" aria-label="Remove from favorites"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>'
      + '</div></div><div class="card-town">' + esc(c.city) + ', ' + esc(c.state) + evtBadge + '</div>' + nh
      + '</article>';
  }).join('');

  el.innerHTML = html;
}

module.exports = {
  renderUnifiedEvt: renderUnifiedEvt,
  renderSaved: renderSaved,
};
