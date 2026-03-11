// src/saved.js — Saved tab rendering (dashboard redesign)
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');

var DAY_ORDER = config.DAY_ORDER;
var DAY_NAMES = config.DAY_NAMES;
var SVC_LABELS = config.SVC_LABELS;
var displayName = utils.displayName;
var getNow = utils.getNow;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var toMin = utils.toMin;
var isEventActive = utils.isEventActive;
var getNextEventDate = utils.getNextEventDate;
var getRemainingDates = utils.getRemainingDates;
var isVer = utils.isVer;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var getNext = utils.getNext;
var state = data.state;
var isFav = data.isFav;

// ── getTodayServices — all services at saved churches happening today ──
function getTodayServices(favChurches) {
  var now = getNow();
  var curDI = now.getDay();
  var curDay = DAY_ORDER[curDI];
  var curMin = now.getHours() * 60 + now.getMinutes();
  var results = [];

  for (var i = 0; i < favChurches.length; i++) {
    var c = favChurches[i];
    if (!c.services) continue;
    for (var j = 0; j < c.services.length; j++) {
      var s = c.services[j];
      if (!s.time || !s.day) continue;
      // Skip seasonal services
      if (s.seasonal && s.seasonal.is_seasonal) continue;
      // Match today's day
      var matchDay = s.day === curDay || s.day === 'daily' || (s.day === 'weekday' && curDI >= 1 && curDI <= 5);
      if (!matchDay) continue;
      var sm = toMin(s.time);
      if (sm === null) continue;
      var isPast = sm < curMin - 30; // Past if ended 30+ min ago
      results.push({
        church: c,
        service: s,
        minutes: sm,
        isPast: isPast,
        isLive: !isPast && sm <= curMin,
        isSoon: !isPast && sm > curMin && sm <= curMin + 60
      });
    }
  }

  results.sort(function(a, b) { return a.minutes - b.minutes; });
  return results;
}

// ── _renderSchedRow — single schedule timeline row ──
function _renderSchedRow(item) {
  var svcLabel = SVC_LABELS[item.service.type] || item.service.type;
  var timeStr = fmt12(item.service.time);
  var cName = displayName(item.church.name);
  var statusCls = '';
  var statusBadge = '';
  if (item.isPast) statusCls = ' sched-past';
  else if (item.isLive) {
    statusCls = ' sched-live';
    statusBadge = '<span class="sched-live-badge"><span class="pulse-dot"></span>Now</span>';
  } else if (item.isSoon) {
    statusCls = ' sched-soon';
    statusBadge = '<span class="sched-soon-badge">Soon</span>';
  }
  return '<div class="sched-row' + statusCls + '" onclick="openDetail(\'' + item.church.id + '\')">'
    + '<div class="sched-time">' + timeStr + '</div>'
    + '<div class="sched-info">'
    + '<span class="sched-type">' + esc(svcLabel) + '</span>' + statusBadge
    + '<span class="sched-church">' + esc(cName) + '</span>'
    + '</div>'
    + '</div>';
}

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

  // Determine if this event is happening today
  var todayCheck = getNow().toISOString().slice(0, 10);
  var isToday = false;
  if (e.date) isToday = e.date === todayCheck;
  else if (e.dates && e.dates.length) isToday = e.dates.indexOf(todayCheck) !== -1;

  var rowClass = 'saved-evt-unified';
  if (isYC) rowClass += ' evt-yc-row';
  if (isToday) rowClass += ' saved-evt-today';
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

  // Update badges — dot if any events today at favorited churches
  var now = getNow();
  var todayStr = now.toISOString().slice(0, 10);
  var hasToday = (state.eventsData || []).some(function(e) {
    if (!favIds.has(e.church_id)) return false;
    if (e.date) return e.date === todayStr;
    if (e.dates && e.dates.length) return e.dates.indexOf(todayStr) !== -1;
    return false;
  });
  // Also show dot if any services today
  if (!hasToday && favChurches.length) {
    var todaySvcs = getTodayServices(favChurches);
    hasToday = todaySvcs.some(function(s) { return !s.isPast; });
  }
  var countBadge = document.getElementById('savedCountBadge');
  if (countBadge) {
    countBadge.textContent = '';
    countBadge.classList.toggle('visible', hasToday);
  }
  var tabBadge = document.getElementById('savedTabBadge');
  if (tabBadge) {
    tabBadge.textContent = '';
    tabBadge.classList.toggle('visible', hasToday);
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

  // ── 1. TODAY'S SCHEDULE — Mass times + services across all saved churches ──
  var todaySvcs = getTodayServices(favChurches);
  if (todaySvcs.length) {
    html += '<div class="saved-section-label">TODAY\'S SCHEDULE</div>';
    html += '<div class="saved-schedule">';

    // Split into past vs upcoming
    var pastSvcs = todaySvcs.filter(function(s) { return s.isPast; });
    var upSvcs = todaySvcs.filter(function(s) { return !s.isPast; });

    // If all past, show compact summary
    if (!upSvcs.length) {
      html += '<div class="sched-done">Today\'s schedule complete</div>';
    } else {
      // Show last 1 past service for context, then all upcoming
      var showPast = pastSvcs.length ? [pastSvcs[pastSvcs.length - 1]] : [];
      var visibleSvcs = showPast.concat(upSvcs);
      for (var si = 0; si < visibleSvcs.length; si++) {
        var item = visibleSvcs[si];
        html += _renderSchedRow(item);
      }
    }
    html += '</div>';
  }

  // ── 2. TODAY'S EVENTS — events happening today with accent bar ──
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
  // Sort chronologically
  allEvents.sort(function(a, b) {
    var dateA = getNextEventDate(a.evt) || a.evt.date || '9999';
    var dateB = getNextEventDate(b.evt) || b.evt.date || '9999';
    var cmp = dateA.localeCompare(dateB);
    if (cmp !== 0) return cmp;
    return (a.evt.time || '').localeCompare(b.evt.time || '');
  });

  // Split into today vs upcoming
  var todayEvents = [];
  var upcomingEvents = [];
  for (var ei = 0; ei < allEvents.length; ei++) {
    var evt = allEvents[ei].evt;
    var evtIsToday = false;
    if (evt.date) evtIsToday = evt.date === todayStr;
    else if (evt.dates && evt.dates.length) evtIsToday = evt.dates.indexOf(todayStr) !== -1;
    if (evtIsToday) todayEvents.push(allEvents[ei]);
    else upcomingEvents.push(allEvents[ei]);
  }

  if (todayEvents.length) {
    html += '<div class="saved-section-label">HAPPENING TODAY</div>';
    for (var ti = 0; ti < todayEvents.length; ti++) {
      html += renderUnifiedEvt(todayEvents[ti].evt, todayEvents[ti].isYC);
    }
  }

  // ── 3. COMING UP — future events ──
  if (upcomingEvents.length) {
    html += '<div class="saved-section-label">COMING UP</div>';
    var showCount = Math.min(3, upcomingEvents.length);
    for (var ui = 0; ui < showCount; ui++) {
      html += renderUnifiedEvt(upcomingEvents[ui].evt, upcomingEvents[ui].isYC);
    }
    if (upcomingEvents.length > 3) {
      var moreCount = upcomingEvents.length - 3;
      html += '<details class="saved-more-details"><summary class="saved-more-toggle">' + moreCount + ' more</summary>';
      for (var mi = 3; mi < upcomingEvents.length; mi++) {
        html += renderUnifiedEvt(upcomingEvents[mi].evt, upcomingEvents[mi].isYC);
      }
      html += '</details>';
    }
  }

  // ── 4. YOUR ACTIVITY — prayer stats + confession reminder ──
  var activityParts = [];
  try {
    var prayerLog = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
    var thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    var recentEntries = prayerLog.filter(function(e) { return e.date >= thirtyDaysAgo; });
    var rosaryCount = recentEntries.filter(function(e) { return e.type === 'rosary'; }).length;
    var examCount = recentEntries.filter(function(e) { return e.type === 'examination'; }).length;
    var maxCount = Math.max(rosaryCount, examCount, 1);
    if (rosaryCount) activityParts.push('<div class="activity-bar-row"><span class="activity-bar-label">Rosary</span><div class="activity-bar-track"><div class="activity-bar-fill" style="width:' + Math.round(rosaryCount / maxCount * 100) + '%"></div></div><span class="activity-bar-val">' + rosaryCount + '</span></div>');
    if (examCount) activityParts.push('<div class="activity-bar-row"><span class="activity-bar-label">Examen</span><div class="activity-bar-track"><div class="activity-bar-fill activity-bar-fill--alt" style="width:' + Math.round(examCount / maxCount * 100) + '%"></div></div><span class="activity-bar-val">' + examCount + '</span></div>');
  } catch (e) {}

  // Confession reminder
  var confessionNote = '';
  try {
    var lastConf = localStorage.getItem('mf-last-confession');
    if (lastConf) {
      var daysSince = Math.floor((now.getTime() - Number(lastConf)) / 86400000);
      if (daysSince >= 30) {
        confessionNote = '<div class="activity-confession-nudge" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));setTimeout(function(){document.querySelector(\'[data-filter=confession]\').click()},100)">'
          + '<span>It\'s been ' + daysSince + ' days since your last confession</span>'
          + '<span class="activity-confession-link">Find times \u203A</span>'
          + '</div>';
      }
    }
  } catch (e) {}

  if (activityParts.length || confessionNote) {
    html += '<div class="saved-section-label">YOUR ACTIVITY</div>';
    html += '<div class="saved-activity">';
    if (activityParts.length) {
      html += '<div class="activity-stats">'
        + '<div class="activity-stats-header">Last 30 days</div>'
        + activityParts.join('')
        + '</div>';
    }
    if (confessionNote) html += confessionNote;
    html += '</div>';
  }

  // ── 5. YOUR CHURCHES — compact cards ──
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

  html += '<div class="saved-section-label">YOUR CHURCHES</div>';
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

  // ── Quick action ──
  html += '<div class="saved-quick-action">'
    + '<button class="saved-find-mass-btn" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + ' Find Mass now'
    + '</button>'
    + '</div>';

  el.innerHTML = html;
}

module.exports = {
  renderUnifiedEvt: renderUnifiedEvt,
  renderSaved: renderSaved,
};
