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
var toLocalDateStr = utils.toLocalDateStr;
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
      var em = s.end_time ? toMin(s.end_time) : null;
      var effectiveEnd = em !== null ? em : sm + 60;
      var isPast = curMin > effectiveEnd;
      var isLive = !isPast && sm <= curMin;
      var isSoon = !isPast && !isLive && sm > curMin && sm <= curMin + 60;
      results.push({
        church: c,
        service: s,
        minutes: sm,
        isPast: isPast,
        isLive: isLive,
        isSoon: isSoon
      });
    }
  }

  results.sort(function(a, b) { return a.minutes - b.minutes; });
  return results;
}

// ── getTomorrowServices — services at saved churches for the next day ──
function getTomorrowServices(favChurches) {
  var now = getNow();
  var tmrwDI = (now.getDay() + 1) % 7;
  var tmrwDay = DAY_ORDER[tmrwDI];
  var results = [];

  for (var i = 0; i < favChurches.length; i++) {
    var c = favChurches[i];
    if (!c.services) continue;
    for (var j = 0; j < c.services.length; j++) {
      var s = c.services[j];
      if (!s.time || !s.day) continue;
      if (s.seasonal && s.seasonal.is_seasonal) continue;
      var matchDay = s.day === tmrwDay || s.day === 'daily' || (s.day === 'weekday' && tmrwDI >= 1 && tmrwDI <= 5);
      if (!matchDay) continue;
      var sm = toMin(s.time);
      if (sm === null) continue;
      results.push({ church: c, service: s, minutes: sm, isPast: false, isLive: false, isSoon: false });
    }
  }

  results.sort(function(a, b) { return a.minutes - b.minutes; });
  return results;
}

// ── _getTypeGroup — service type color group for dot indicator ──
function _getTypeGroup(type) {
  if (['sunday_mass', 'daily_mass', 'communion_service'].indexOf(type) >= 0) return 'mass';
  if (['confession', 'anointing_of_sick'].indexOf(type) >= 0) return 'sacr';
  if (['adoration', 'perpetual_adoration', 'holy_hour'].indexOf(type) >= 0) return 'ador';
  return 'devot';
}

// ── _renderSchedRow — single schedule timeline row ──
function _renderSchedRow(item, isHero) {
  var svcLabel = SVC_LABELS[item.service.type] || item.service.type;
  var timeStr = item.service.end_time
    ? fmt12(item.service.time) + ' \u2013 ' + fmt12(item.service.end_time)
    : fmt12(item.service.time);
  var cName = displayName(item.church.name);
  var statusCls = '';
  var statusBadge = '';
  if (item.isPast) statusCls = ' sched-past';
  else if (item.isLive) {
    statusCls = ' sched-live';
    statusBadge = '<span class="sched-live-badge"><span class="pulse-dot"></span>Now</span>';
  } else if (item.isSoon) {
    statusCls = ' sched-soon';
    var minsAway = item.minutes - (getNow().getHours() * 60 + getNow().getMinutes());
    statusBadge = '<span class="sched-soon-badge">in ' + Math.max(1, minsAway) + ' min</span>';
  }

  // Type dot indicator (ST-04)
  var typeDot = '<span class="sched-type-dot sched-type-dot--' + _getTypeGroup(item.service.type) + '"></span>';

  // Inline Directions for hero row (ST-01)
  var directionsHtml = '';
  if (isHero && (item.isLive || item.isSoon) && item.church.lat) {
    var mapsUrl = 'https://maps.google.com/maps?daddr=' + item.church.lat + ',' + item.church.lng;
    directionsHtml = '<a class="sched-row-directions" href="' + mapsUrl + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Directions</a>';
  }

  return '<div class="sched-row' + statusCls + (isHero ? ' sched-row--hero' : '') + '" onclick="openDetail(\'' + item.church.id + '\')">'
    + '<div class="sched-time">' + timeStr + '</div>'
    + '<div class="sched-info">'
    + '<span class="sched-type">' + typeDot + esc(svcLabel) + statusBadge + '</span>'
    + '<span class="sched-church">' + esc(cName) + '</span>'
    + directionsHtml
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
      var todayStr = toLocalDateStr(getNow());
      var tmrw = new Date(getNow()); tmrw.setDate(tmrw.getDate() + 1);
      if (next === todayStr) whenParts.push('Today');
      else if (next === toLocalDateStr(tmrw)) whenParts.push('Tomorrow');
      else {
        var d = new Date(next + 'T12:00:00');
        whenParts.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    }
    if (rem.length > 1) whenParts.push(rem.length + ' dates left');
  } else if (e.date) {
    var d2 = new Date(e.date + 'T12:00:00');
    var todayStr2 = toLocalDateStr(getNow());
    var tmrw2 = new Date(getNow()); tmrw2.setDate(tmrw2.getDate() + 1);
    if (e.date === todayStr2) whenParts.push('Today');
    else if (e.date === toLocalDateStr(tmrw2)) whenParts.push('Tomorrow');
    else whenParts.push(d2.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  } else if (e.day) {
    whenParts.push((DAY_NAMES[e.day] || e.day) + 's');
  }
  if (e.time) whenParts.push(fmt12(e.time));
  whenParts.push(pName);

  // Determine if this event is happening today
  var todayCheck = toLocalDateStr(getNow());
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

  var el = document.getElementById('savedList');
  var favChurches = state.allChurches.filter(function(c) { return isFav(c.id); });
  var favIds = new Set(favChurches.map(function(c) { return c.id; }));

  // Update badges — dot only for live services or today events (ST-14)
  var now = getNow();
  var todayStr = toLocalDateStr(now);
  var hasLive = false;
  if (favChurches.length) {
    var todaySvcsCheck = getTodayServices(favChurches);
    hasLive = todaySvcsCheck.some(function(s) { return s.isLive; });
  }
  if (!hasLive) {
    hasLive = (state.eventsData || []).some(function(e) {
      if (!favIds.has(e.church_id)) return false;
      if (e.date) return e.date === todayStr;
      if (e.dates && e.dates.length) return e.dates.indexOf(todayStr) !== -1;
      return false;
    });
  }
  var countBadge = document.getElementById('savedCountBadge');
  if (countBadge) {
    countBadge.textContent = '';
    countBadge.classList.toggle('visible', hasLive);
  }
  var tabBadge = document.getElementById('savedTabBadge');
  if (tabBadge) {
    tabBadge.textContent = '';
    tabBadge.classList.toggle('visible', hasLive);
  }

  // ── Empty state ──
  if (!favChurches.length) {
    el.innerHTML = '<div class="saved-empty">'
      + '<div class="saved-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>'
      + '<h3>Your parish dashboard</h3>'
      + '<p>Save your churches to see today\u2019s Mass times, upcoming events, and community happenings \u2014 all in one place.</p>'
      + '<p class="saved-empty-hint">Tap the \u2661 on any church to save it here.</p>'
      + '<button class="saved-empty-btn" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Browse churches</button>'
      + '</div>';
    return;
  }

  var checkSvg = '<svg class="card-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>';

  var html = '';

  // ── 1. TODAY CARD — schedule + today events in one surface ──
  var todaySvcs = getTodayServices(favChurches);

  // Gather today's events
  var allEvents = [];
  state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  }).forEach(function(e) {
    allEvents.push({ evt: e, isYC: false });
  });
  var upcomingYC = getUpcomingYC().filter(function(e) { return favIds.has(e.church_id); });
  upcomingYC.forEach(function(e) {
    allEvents.push({ evt: e, isYC: true });
  });
  allEvents.sort(function(a, b) {
    var dateA = getNextEventDate(a.evt) || a.evt.date || '9999';
    var dateB = getNextEventDate(b.evt) || b.evt.date || '9999';
    var cmp = dateA.localeCompare(dateB);
    if (cmp !== 0) return cmp;
    return (a.evt.time || '').localeCompare(b.evt.time || '');
  });

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

  var hasTodayContent = todaySvcs.length || todayEvents.length;
  if (hasTodayContent) {
    html += '<div class="saved-today-card">';
    var todayLongLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    html += '<div class="saved-today-label">Today<span class="saved-today-date"> \u00b7 ' + todayLongLabel + '</span></div>';

    // Schedule rows (ST-01: no hero card — inline hero treatment for first live/soon)
    if (todaySvcs.length) {
      var pastSvcs = todaySvcs.filter(function(s) { return s.isPast; });
      var upSvcs = todaySvcs.filter(function(s) { return !s.isPast; });

      var tmrwShownInline = false;
      if (!upSvcs.length) {
        // ST-05: Today done — show tomorrow preview inline
        var tmrwPreview = getTomorrowServices(favChurches).slice(0, 2);
        if (tmrwPreview.length) {
          tmrwShownInline = true;
          html += '<div class="sched-done-tomorrow">';
          html += '<div class="sched-done-label">Today\u2019s schedule is complete</div>';
          html += '<div class="sched-done-next-label">Tomorrow</div>';
          for (var pi = 0; pi < tmrwPreview.length; pi++) {
            html += _renderSchedRow(tmrwPreview[pi], false);
          }
          html += '</div>';
        } else {
          html += '<div class="sched-done">Today\u2019s schedule is complete</div>';
        }
      } else {
        // ST-06: Past services removed — clean timeline
        // Upcoming services with inline hero
        var maxShow = 6;
        var overflow = upSvcs.length > maxShow ? upSvcs.length - maxShow : 0;
        var showSvcs = overflow ? upSvcs.slice(0, maxShow) : upSvcs;
        var heroAssigned = false;
        for (var si = 0; si < showSvcs.length; si++) {
          var isHero = !heroAssigned && (showSvcs[si].isLive || showSvcs[si].isSoon);
          if (isHero) heroAssigned = true;
          html += _renderSchedRow(showSvcs[si], isHero);
        }
        if (overflow) {
          html += '<details class="sched-overflow-details"><summary class="sched-overflow">+' + overflow + ' more today</summary>';
          for (var oi = maxShow; oi < upSvcs.length; oi++) {
            html += _renderSchedRow(upSvcs[oi], false);
          }
          html += '</details>';
        }
      }
    }

    // Today events (below schedule, separated by divider)
    if (todayEvents.length && todaySvcs.length) {
      html += '<div class="saved-today-divider"></div>';
    }
    for (var ti = 0; ti < todayEvents.length; ti++) {
      html += renderUnifiedEvt(todayEvents[ti].evt, todayEvents[ti].isYC);
    }

    html += '</div>'; // close .saved-today-card
  }

  // ── 1.5. TOMORROW — preview of next day's first services (ST-03) ──
  // Skip if already shown inline inside the "today done" card
  var tmrwSvcs = getTomorrowServices(favChurches);
  if (tmrwSvcs.length && !tmrwShownInline) {
    var tmrwDate = new Date(now);
    tmrwDate.setDate(tmrwDate.getDate() + 1);
    var tmrwLabel = tmrwDate.toLocaleDateString('en-US', { weekday: 'long' });

    html += '<div class="saved-divider"><span>Tomorrow \u00b7 ' + tmrwLabel + '</span></div>';
    html += '<div class="saved-tomorrow-card">';

    var tmrwShow = Math.min(2, tmrwSvcs.length);
    for (var tmi = 0; tmi < tmrwShow; tmi++) {
      html += _renderSchedRow(tmrwSvcs[tmi], false);
    }
    html += '</div>';
  }

  // ── 2. THIS WEEK — upcoming events, grouped by date (ST-07) ──
  if (upcomingEvents.length) {
    html += '<div class="saved-divider"><span>This week</span></div>';

    var dateGroups = {};
    var dateOrder = [];
    var tmrwStr = (function() { var d2 = new Date(now); d2.setDate(d2.getDate() + 1); return toLocalDateStr(d2); })();

    for (var ui = 0; ui < upcomingEvents.length; ui++) {
      var uEvt = upcomingEvents[ui].evt;
      var evtDate = getNextEventDate(uEvt) || uEvt.date || '9999-99-99';
      if (!dateGroups[evtDate]) { dateGroups[evtDate] = []; dateOrder.push(evtDate); }
      dateGroups[evtDate].push(upcomingEvents[ui]);
    }

    var shownCount = 0;
    var maxVisible = 4;
    var overflowHtml = '';

    for (var dgi = 0; dgi < dateOrder.length; dgi++) {
      var dateKey = dateOrder[dgi];
      var dateLabel = '';
      if (dateKey === tmrwStr) {
        dateLabel = 'Tomorrow';
      } else {
        var dgd = new Date(dateKey + 'T12:00:00');
        dateLabel = dgd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }

      var groupItems = dateGroups[dateKey];
      for (var gi = 0; gi < groupItems.length; gi++) {
        var rowHtml = '';
        if (gi === 0) {
          rowHtml += '<div class="saved-week-date-header">' + dateLabel + '</div>';
        }
        rowHtml += renderUnifiedEvt(groupItems[gi].evt, groupItems[gi].isYC);

        if (shownCount < maxVisible) {
          html += rowHtml;
        } else {
          overflowHtml += rowHtml;
        }
        shownCount++;
      }
    }

    if (overflowHtml) {
      html += '<details class="saved-more-details"><summary class="saved-more-toggle">' + (shownCount - maxVisible) + ' more</summary>' + overflowHtml + '</details>';
    }
  }

  // ── 3. YOUR CHURCHES — compact rows in a single card ──
  var evtCounts = {};
  state.eventsData.filter(function(e) {
    return favIds.has(e.church_id) && e.category !== 'yc' && isEventActive(e);
  }).forEach(function(e) {
    evtCounts[e.church_id] = (evtCounts[e.church_id] || 0) + 1;
  });

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

  html += '<div class="saved-divider saved-divider--editable"><span>Your churches \u00b7 ' + favChurches.length + '</span><button class="saved-edit-btn" id="savedEditBtn" onclick="toggleSavedEdit()">Edit</button></div>';
  html += '<div class="saved-churches-card">';
  html += sortedFav.map(function(item) {
    var c = item.c, next = item.next, dist = item.dist;
    var ver = isVer(c);
    var statusBadge = '';
    if (next && next.isLive) statusBadge = '<span class="card-live-badge"><span class="pulse-dot"></span>Live</span>';
    else if (next && next.isSoon) statusBadge = '<span class="card-soon-badge"><span class="pulse-dot"></span>Soon</span>';
    var metaParts = [esc(c.city)];
    if (dist !== null) metaParts.push(fmtDist(dist));
    var ec = evtCounts[c.id];
    if (ec) metaParts.push('<span class="saved-evt-count">' + ec + ' event' + (ec !== 1 ? 's' : '') + '</span>');

    // ST-02: Next service line
    var nextLine = '';
    if (next) {
      var nextLabel = SVC_LABELS[next.service.type] || '';
      nextLine = '<div class="saved-church-next">'
        + '<span class="saved-church-next-time">' + next.timeFormatted + '</span>'
        + '<span class="saved-church-next-label">' + esc(nextLabel) + '</span>'
        + '<span class="saved-church-next-day">' + next.dayLabel + '</span>'
        + '</div>';
    } else {
      nextLine = '<div class="saved-church-next"><span class="saved-church-next-label" style="color:var(--color-text-tertiary)">Check bulletin</span></div>';
    }

    return '<div class="saved-church-row" onclick="openDetail(\'' + c.id + '\')">'
      + '<div class="saved-church-info">'
      + '<div class="saved-church-name">' + esc(displayName(c.name)) + (ver ? checkSvg : '') + '</div>'
      + '<div class="saved-church-meta">' + metaParts.join(' \u00b7 ') + '</div>'
      + nextLine
      + '</div>'
      + '<div class="saved-church-status">' + statusBadge + '</div>'
      + '<button class="saved-church-remove" onclick="event.stopPropagation();toggleFav(\'' + c.id + '\');renderSaved()" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></button>'
      + '<svg class="saved-church-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</div>';
  }).join('');
  html += '</div>'; // close .saved-churches-card

  // ── ST-20: Confession nudge — promoted to its own card between churches and prayer ──
  var confessionNote = '';
  try {
    var lastConf = localStorage.getItem('mf-last-confession');
    if (lastConf) {
      var daysSince = Math.floor((now.getTime() - Number(lastConf)) / 86400000);
      if (daysSince >= 30) {
        confessionNote = '<div class="saved-confession-card">'
          + '<div class="saved-confession-body">'
          + '<div class="saved-confession-text">It\u2019s been a while since your last confession</div>'
          + '<button class="saved-confession-action" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));setTimeout(function(){document.querySelector(\'[data-filter=confession]\').click()},100)">Find confession times \u203A</button>'
          + '</div>'
          + '</div>';
      }
    }
  } catch (e) {}
  if (confessionNote) html += confessionNote;

  // ── 4. PRAYER LIFE — warm recency text + 2x2 launcher grid ──
  var prayerStatusHtml = '';
  var totalPrayers = 0;
  try {
    var prayerLog = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
    var thirtyDaysAgo = toLocalDateStr(new Date(now.getTime() - 30 * 86400000));
    var recentEntries = prayerLog.filter(function(e) { return e.date >= thirtyDaysAgo; });
    totalPrayers = recentEntries.length;

    if (totalPrayers > 0) {
      // Find last prayer date for warm recency text
      var lastPrayerDate = '';
      for (var lpi = recentEntries.length - 1; lpi >= 0; lpi--) {
        if (recentEntries[lpi].date) { lastPrayerDate = recentEntries[lpi].date; break; }
      }
      var todayKey = toLocalDateStr(now);
      var yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      var yesterdayKey = toLocalDateStr(yesterdayDate);

      var recencyText = '';
      if (lastPrayerDate === todayKey) {
        recencyText = 'You prayed today';
      } else if (lastPrayerDate === yesterdayKey) {
        recencyText = 'You prayed yesterday';
      } else if (lastPrayerDate) {
        var lpd = new Date(lastPrayerDate + 'T12:00:00');
        var dayName = lpd.toLocaleDateString('en-US', { weekday: 'long' });
        recencyText = 'Last prayed ' + dayName;
      }

      if (recencyText) {
        var checkMark = lastPrayerDate === todayKey ? '\u2713 ' : '';
        prayerStatusHtml = '<div class="activity-recency"><span>' + checkMark + recencyText + '</span></div>';
      }
    }
  } catch (e) {}

  // Prayer launcher — contemplative text-only cards
  var prayerBtns = '<div class="activity-pray-list">'
    + '<button class="activity-pray-item" onclick="openRosary()">'
    + '<span class="activity-pray-name">Rosary</span>'
    + '<span class="activity-pray-desc">Meditate on the mysteries of Christ</span>'
    + '</button>'
    + '<button class="activity-pray-item" onclick="openExamination()">'
    + '<span class="activity-pray-name">Examen</span>'
    + '<span class="activity-pray-desc">Review your day in God\u2019s presence</span>'
    + '</button>'
    + '<button class="activity-pray-item" onclick="openStations()">'
    + '<span class="activity-pray-name">Stations of the Cross</span>'
    + '<span class="activity-pray-desc">Walk with Christ to Calvary</span>'
    + '</button>'
    + '<button class="activity-pray-item" onclick="openNovena()">'
    + '<span class="activity-pray-name">Novena</span>'
    + '<span class="activity-pray-desc">Nine days of faithful prayer</span>'
    + '</button>'
    + '</div>';

  // Always show prayer life section
  html += '<div class="saved-divider"><span>Prayer life</span></div>';
  html += '<div class="saved-activity-card">';

  if (prayerStatusHtml) {
    html += prayerStatusHtml;
  } else {
    html += '<div class="activity-invite">\u201CThe Lord is near to all who call on Him.\u201D</div>';
  }
  html += prayerBtns;

  html += '</div>';

  // ── ST-22: Context-aware greeting header ──
  var headerEl = document.getElementById('savedHeaderContent');
  if (headerEl) {
    var hour = now.getHours();
    var greeting = '';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    var isLent = utils.isLentSeason ? utils.isLentSeason() : false;
    var seasonNote = isLent ? '<div class="saved-header-season">Lenten Season</div>' : '';

    headerEl.innerHTML = '<h2>' + greeting + '</h2>' + seasonNote;
  }

  el.innerHTML = html;
}

// ── ST-09: Auto-refresh timer ──
var _savedRefreshTimer = null;

function startSavedRefresh() {
  stopSavedRefresh();
  _savedRefreshTimer = setInterval(function() {
    var panel = document.getElementById('panelSaved');
    if (panel && panel.classList.contains('active')) {
      renderSaved();
    }
  }, 60000);
}

function stopSavedRefresh() {
  if (_savedRefreshTimer) {
    clearInterval(_savedRefreshTimer);
    _savedRefreshTimer = null;
  }
}

// ── ST-10: Edit mode toggle for church rows ──
function toggleSavedEdit() {
  var card = document.querySelector('.saved-churches-card');
  if (!card) return;
  var editing = card.classList.toggle('editing');
  var btn = document.getElementById('savedEditBtn');
  if (btn) btn.textContent = editing ? 'Done' : 'Edit';
}
window.toggleSavedEdit = toggleSavedEdit;
window.renderSaved = renderSaved;

module.exports = {
  renderUnifiedEvt: renderUnifiedEvt,
  renderSaved: renderSaved,
  startSavedRefresh: startSavedRefresh,
  stopSavedRefresh: stopSavedRefresh,
};
