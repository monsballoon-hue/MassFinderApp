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
var isLentSeason = utils.isLentSeason;
var state = data.state;
var isFav = data.isFav;

// ── getSavedChurchEvents ──
function getSavedChurchEvents(favIds) {
  var today = getNow();
  var todayStr = today.toISOString().slice(0, 10);
  var todayDow = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][today.getDay()];
  // End of week = next Sunday
  var endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  var endOfWeekStr = endOfWeek.toISOString().slice(0, 10);
  // Remaining days this week (after today)
  var remainingDays = [];
  for (var i = today.getDay() + 1; i < 7; i++) {
    remainingDays.push(['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][i]);
  }

  var buckets = { today: [], coming: [], ongoing: [] };
  var dayOrd = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  var evts = state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  });

  for (var j = 0; j < evts.length; j++) {
    var e = evts[j];
    if (e.dates && e.dates.length) {
      var next = getNextEventDate(e);
      if (next === todayStr) buckets.today.push(e);
      else if (next && next > todayStr && next <= endOfWeekStr) buckets.coming.push(e);
      else buckets.ongoing.push(e);
    } else if (e.date) {
      if (e.date === todayStr) buckets.today.push(e);
      else if (e.date > todayStr && e.date <= endOfWeekStr) buckets.coming.push(e);
      else buckets.ongoing.push(e);
    } else if (e.day) {
      if (e.day === todayDow) buckets.today.push(e);
      else if (remainingDays.includes(e.day)) buckets.coming.push(e);
      else buckets.ongoing.push(e);
    } else {
      buckets.ongoing.push(e);
    }
  }

  // Sort: dated by date, recurring by day-of-week
  buckets.today.sort(function(a, b) { return (a.time || '').localeCompare(b.time || ''); });
  buckets.coming.sort(function(a, b) {
    var dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    return (dayOrd[a.day] != null ? dayOrd[a.day] : 7) - (dayOrd[b.day] != null ? dayOrd[b.day] : 7);
  });
  buckets.ongoing.sort(function(a, b) {
    return (dayOrd[a.day] != null ? dayOrd[a.day] : 7) - (dayOrd[b.day] != null ? dayOrd[b.day] : 7);
  });
  return buckets;
}

// ── renderSavedEvt ──
function renderSavedEvt(e) {
  var c = state.allChurches.find(function(x) { return x.id === e.church_id; }) || {};
  var pName = displayName(c.name || '');
  var isLent = isLentSeason() && (e.category === 'liturgical' || e.category === 'devotional');

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

  var calSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  return '<div class="saved-evt" onclick="openDetail(\'' + e.church_id + '\')">'
    + '<div class="ce-item-accent' + (isLent ? ' saved-lent-accent' : ' upcoming') + '"></div>'
    + '<div class="ce-item-body">'
    + '<div class="ce-item-title">' + esc(e.title) + '</div>'
    + '<div class="ce-item-when">' + whenParts.join(' \u00b7 ') + '</div>'
    + '</div>'
    + '<div class="saved-evt-actions">'
    + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + calSvg + '</button>'
    + '<button class="saved-evt-btn" onclick="expressInterest(\'' + esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
    + '</div></div>';
}

// ── renderSaved ──
function renderSaved() {
  // Lazy requires to break circular deps
  var events = require('./events.js');
  var getUpcomingYC = events.getUpcomingYC;
  var resolveYC = events.resolveYC;
  var fmtYCDate = events.fmtYCDate;
  var renderCompactYC = events.renderCompactYC;
  var toggleFav = data.toggleFav;

  var el = document.getElementById('savedList');
  var sub = document.getElementById('savedSubtitle');
  var favChurches = state.allChurches.filter(function(c) { return isFav(c.id); });
  var favIds = new Set(favChurches.map(function(c) { return c.id; }));

  sub.textContent = favChurches.length
    ? favChurches.length + ' saved church' + (favChurches.length !== 1 ? 'es' : '')
    : 'Tap the heart on any church to save it';

  if (!favChurches.length) {
    el.innerHTML = '<div class="saved-empty">'
      + '<div class="saved-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>'
      + '<h3>No saved churches yet</h3>'
      + '<p>Tap the heart icon on any church card<br>to save it for quick access here.</p></div>';
    return;
  }

  var checkSvg = '<svg class="card-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>';

  var html = '';

  // -- This Week at Your Churches --
  var buckets = getSavedChurchEvents(favIds);
  var totalEvts = buckets.today.length + buckets.coming.length + buckets.ongoing.length;
  if (totalEvts) {
    html += '<div class="saved-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>This Week at Your Churches</div>';

    if (buckets.today.length) {
      html += '<div class="saved-week-section"><details open><summary>Today <span class="saved-week-count">' + buckets.today.length + '</span></summary>';
      html += buckets.today.map(function(e) { return renderSavedEvt(e); }).join('');
      html += '</details></div>';
    }
    if (buckets.coming.length) {
      html += '<div class="saved-week-section"><details open><summary>Coming Up <span class="saved-week-count">' + buckets.coming.length + '</span></summary>';
      html += buckets.coming.map(function(e) { return renderSavedEvt(e); }).join('');
      html += '</details></div>';
    }
    if (buckets.ongoing.length) {
      html += '<div class="saved-week-section"><details><summary>Ongoing <span class="saved-week-count">' + buckets.ongoing.length + '</span></summary>';
      html += buckets.ongoing.map(function(e) { return renderSavedEvt(e); }).join('');
      html += '</details></div>';
    }
    html += '<div class="saved-section-divider"></div>';
  }

  // -- YC Events (compact) --
  var upcoming = getUpcomingYC().filter(function(e) { return favIds.has(e.church_id); });
  if (upcoming.length) {
    html += '<div class="saved-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Young &amp; Catholic <span class="saved-week-count">' + upcoming.length + '</span></div>';
    html += upcoming.slice(0, 4).map(function(e) { return renderCompactYC(e); }).join('');
    if (upcoming.length > 4) {
      html += '<div style="text-align:center;padding:var(--space-2) 0"><button style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-accent-text);padding:var(--space-2) var(--space-4)" onclick="document.querySelector(\'[data-filter=yc]\').click();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">See all YC events \u2192</button></div>';
    }
    html += '<div class="saved-section-divider"></div>';
  }

  // -- Your Churches --
  // Count active events per parish for badges
  var evtCounts = {};
  state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  }).forEach(function(e) {
    evtCounts[e.church_id] = (evtCounts[e.church_id] || 0) + 1;
  });

  html += '<div class="saved-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>Your Churches</div>';

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
  getSavedChurchEvents: getSavedChurchEvents,
  renderSavedEvt: renderSavedEvt,
  renderSaved: renderSaved,
};
