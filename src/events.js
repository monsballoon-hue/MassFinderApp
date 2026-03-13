// src/events.js — YC and community event functionality
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');

var LANG_NAMES = config.LANG_NAMES;

// ── Event type display names ──
var EVT_TYPES = {
  adoration: 'Adoration',
  devotion: 'Devotion',
  sunday_mass: 'Mass',
  daily_mass: 'Mass',
  retreat: 'Retreat',
  mission: 'Mission',
  concert: 'Concert',
  pilgrimage: 'Pilgrimage'
};

// ── YC helpers ──

function getUpcomingYC() {
  var today = utils.toLocalDateStr(utils.getNow());
  return data.state.ycEvents.filter(function(e) { return e.date >= today; });
}

function resolveYC(e) {
  var c = data.state.allChurches.find(function(x) { return x.id === e.church_id; }) || {};
  return {
    id: e.id, church_id: e.church_id, title: e.title, date: e.date,
    time: e.time, end_time: e.end_time, notes: e.notes, social: e.social,
    category: e.category, type: e.type, day: e.day,
    description: e.description, venue_name: e.venue_name,
    venue_address: e.venue_address, venue_lat: e.venue_lat, venue_lng: e.venue_lng,
    registration_url: e.registration_url, flyer_url: e.flyer_url, image_url: e.image_url,
    dates: e.dates,
    churchName: c.name || '',
    town: c.city || '',
    county: c.county || '',
    locName: c.short_name || c.name || ''
  };
}

function fmtYCDate(d) {
  var dt = new Date(d + 'T12:00:00');
  var today = new Date();
  today.setHours(12, 0, 0, 0);
  var diff = Math.round((dt - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  var opts = { weekday: 'short', month: 'short', day: 'numeric' };
  return dt.toLocaleDateString('en-US', opts);
}

function addYCToCalendar(idx, ev) {
  if (ev) ev.stopPropagation();
  var e = getUpcomingYC()[idx];
  if (!e) return;
  var r = resolveYC(e);
  var loc = (r.locName ? r.locName + ', ' : '') + r.churchName + (r.town ? ', ' + r.town : '');
  var desc = [e.title, r.churchName, e.notes || '', 'Added from MassFinder'].filter(Boolean).join('\n');
  utils.generateICS(e.title, e.date, e.time, e.end_time || '', loc, desc);
}

function renderYCCard(e, delay, idx) {
  var r = resolveYC(e);
  var timeStr = utils.fmt12(e.time) + (e.end_time ? ' \u2013 ' + utils.fmt12(e.end_time) : '');
  var calBtn = typeof idx === 'number'
    ? '<button class="yc-cal-btn" onclick="addYCToCalendar(' + idx + ',event)" aria-label="Add to calendar">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
      + '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>'
      + '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>'
      + '<line x1="3" y1="10" x2="21" y2="10"/>'
      + '<line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>'
      + '</svg></button>'
    : '';
  return '<article class="yc-card" role="listitem" style="animation-delay:' + (delay || 0) + 'ms" onclick="openEventDetail(\'' + e.id + '\')">'
    + '<div class="yc-card-top"><div class="yc-badge">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">'
    + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
    + '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    + '</svg>Young &amp; Catholic</div>' + calBtn + '</div>'
    + '<div class="yc-title">' + utils.esc(e.title) + '</div>'
    + '<div class="yc-church">' + utils.esc(utils.displayName(r.locName || r.churchName)) + ', ' + utils.esc(r.town) + '</div>'
    + '<div class="yc-datetime"><span class="yc-date">' + fmtYCDate(e.date) + '</span><span class="yc-time">' + timeStr + '</span></div>'
    + (e.social ? '<div class="yc-social-tag">\u2726 Social gathering included</div>' : '')
    + (e.notes ? '<div style="font-size:var(--text-xs);color:var(--color-text-tertiary);font-style:italic;margin-top:var(--space-1)">' + utils.esc(e.notes) + '</div>' : '')
    + '</article>';
}

// ── Community events (detail panel) ──

function renderCommunityEvents(c) {
  var evts = data.state.eventsData.filter(function(e) {
    return e.church_id === c.id && e.category !== 'yc' && utils.isEventActive(e);
  });
  if (!evts.length) return '';
  var today = utils.toLocalDateStr(utils.getNow());

  // Split into upcoming (dated, future) and ongoing (recurring + undated)
  var upcoming = [];
  var ongoing = [];
  for (var i = 0; i < evts.length; i++) {
    var e = evts[i];
    var nextDate = utils.getNextEventDate(e);
    if (nextDate && nextDate >= today) {
      upcoming.push(e);
    } else if (e.dates && e.dates.length) {
      // Multi-date series with all dates past
      ongoing.push(e);
    } else {
      ongoing.push(e);
    }
  }
  // Sort upcoming by next date
  upcoming.sort(function(a, b) {
    return (utils.getNextEventDate(a) || '').localeCompare(utils.getNextEventDate(b) || '');
  });
  // Sort ongoing by day of week
  var dayOrd = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  ongoing.sort(function(a, b) {
    return (dayOrd[a.day] != null ? dayOrd[a.day] : 7) - (dayOrd[b.day] != null ? dayOrd[b.day] : 7);
  });

  var total = upcoming.length + ongoing.length;
  if (!total) return '';

  // Render individual items (nested helper)
  function renderItem(e, isUpcoming) {
    var whenText = '';
    var nextDate = utils.getNextEventDate(e);
    if (e.dates && e.dates.length) {
      // Multi-date series
      var remaining = utils.getRemainingDates(e);
      if (nextDate) {
        var d = new Date(nextDate + 'T12:00:00');
        var dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        var timeStr = e.time ? (' \u00b7 ' + utils.fmt12(e.time)) : '';
        var countText = remaining.length > 1 ? ' \u00b7 <span class="ce-countdown">' + remaining.length + ' dates left</span>' : '';
        whenText = dateStr + timeStr + countText;
      } else {
        whenText = e.dates.length + ' date series (ended)';
      }
    } else if (isUpcoming && nextDate) {
      var d2 = new Date(nextDate + 'T12:00:00');
      var dateStr2 = d2.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      var timeStr2 = e.time ? (' \u00b7 ' + utils.fmt12(e.time)) : '';
      // Mini countdown
      var diffMs = new Date(nextDate + 'T' + (e.time || '12:00')).getTime() - utils.getNow().getTime();
      var cdText = '';
      if (diffMs > 0) {
        var days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days === 0) cdText = ' \u00b7 Today';
        else if (days === 1) cdText = ' \u00b7 Tomorrow';
        else if (days < 14) cdText = ' \u00b7 In ' + days + ' days';
      }
      whenText = dateStr2 + timeStr2 + (cdText ? '<span class="ce-countdown">' + cdText + '</span>' : '');
    } else {
      // Recurring: day + time
      var dayName = e.day ? (config.DAY_NAMES[e.day] || e.day.charAt(0).toUpperCase() + e.day.slice(1)) : '';
      var timeStr3 = e.time ? (e.time.indexOf(':') >= 0 ? utils.fmt12(e.time) : e.time) : '';
      whenText = [dayName ? dayName + 's' : '', timeStr3].filter(Boolean).join(' \u00b7 ');
    }
    // CDC-06-E: Category-colored accent bar (replaces upcoming/ongoing)
    var accent = e.category || 'community';
    // CDC-06-A: Category icon and label
    var catIcon = CAT_ICONS[e.category] || CAT_ICONS.community;
    var catLabel = CAT_LABELS[e.category] || '';
    // CDC-06-C: Suppress notes that duplicate the title
    var showNotes = e.notes
      && e.notes.trim() !== e.title.trim()
      && e.title.indexOf(e.notes.trim()) < 0
      && e.notes.indexOf(e.title.trim()) < 0;
    return '<div class="ce-item" onclick="openEventDetail(\'' + utils.esc(e.id) + '\')" style="cursor:pointer">'
      + '<div class="ce-item-accent ' + accent + '"></div>'
      + '<div class="ce-item-icon ce-item-icon--' + (e.category || 'community') + '">' + catIcon + '</div>'
      + '<div class="ce-item-body">'
      + '<div class="ce-item-title">' + utils.esc(e.title) + '</div>'
      + (whenText ? '<div class="ce-item-when">' + (catLabel ? '<span class="ce-item-cat-label">' + utils.esc(catLabel) + '</span> \u00b7 ' : '') + whenText + '</div>' : '')
      + (showNotes ? '<div class="ce-item-notes" onclick="event.stopPropagation(); this.classList.toggle(\'expanded\')">' + utils.esc(e.notes) + '</div>' : '')
      + '</div>'
      + '<span class="ce-item-chevron" aria-hidden="true">\u203A</span>'
      + '</div>';
  }

  var openAttr = total <= 2 ? ' open' : '';
  var html = '<details class="community-events-section community-events-collapsible"' + openAttr + '>'
    + '<summary class="community-events-header">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
    + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
    + '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    + '<span class="community-events-title">Community Life</span>'
    + '<span class="community-events-count">' + total + '</span>'
    + '<svg class="community-events-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
    + '</summary>';

  if (upcoming.length && ongoing.length) {
    html += '<div class="ce-group-label">Upcoming</div>';
    html += upcoming.map(function(e) { return renderItem(e, true); }).join('');
    html += '<div class="ce-group-label">Ongoing</div>';
    html += ongoing.map(function(e) { return renderItem(e, false); }).join('');
  } else if (upcoming.length) {
    html += upcoming.map(function(e) { return renderItem(e, true); }).join('');
  } else {
    html += ongoing.map(function(e) { return renderItem(e, false); }).join('');
  }

  html += '</details>';
  return html;
}

// ── Category display names + icons ──
var CAT_LABELS = {
  yc: 'Young & Catholic', community: 'Community', social: 'Social',
  fellowship: 'Fellowship', educational: 'Educational', liturgical: 'Liturgical',
  devotional: 'Devotional', volunteering: 'Volunteer & Service'
};
var CAT_ICONS = {
  yc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
  liturgical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
  devotional: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  educational: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  fellowship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  volunteering: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  community: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

// ── Event detail panel ──

function openEventDetail(eventId) {
  var evt = data.state.eventsData.find(function(e) { return e.id === eventId; })
         || data.state.ycEvents.find(function(e) { return e.id === eventId; });
  if (!evt) return;
  var c = data.state.allChurches.find(function(x) { return x.id === evt.church_id; }) || {};

  // Lazy requires to break circular deps
  var ui = require('./ui.js');
  var render = require('./render.js');

  // Address: venue override > church address
  var evtAddress = evt.venue_address || c.address || '';
  var evtLat = evt.venue_lat || c.lat;
  var evtLng = evt.venue_lng || c.lng;
  var mapUrl = evtLat && evtLng
    ? render.getMapsUrlCoords(evtLat, evtLng, evtAddress || '')
    : (evtAddress ? render.getMapsUrl(evtAddress) : '');
  var churchDisplayName = utils.displayName(c.name || '');
  var venueName = evt.venue_name || churchDisplayName;
  var isYC = evt.category === 'yc';

  // ── Date / time formatting ──
  var timeStr = evt.time ? utils.fmt12(evt.time) : '';
  var endStr = evt.end_time ? ' \u2013 ' + utils.fmt12(evt.end_time) : '';
  var today = utils.toLocalDateStr(utils.getNow());
  var tomorrow = new Date(utils.getNow());
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowStr = utils.toLocalDateStr(tomorrow);

  // Primary date line (prominent)
  var dateLine = '';
  var isRecurring = false;
  if (evt.dates && evt.dates.length) {
    var remaining = utils.getRemainingDates(evt);
    var nextDate = remaining.length ? remaining[0] : evt.dates[evt.dates.length - 1];
    var nd = new Date(nextDate + 'T12:00:00');
    dateLine = nd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (nextDate === today) dateLine = 'Today \u2014 ' + dateLine;
    else if (nextDate === tomorrowStr) dateLine = 'Tomorrow \u2014 ' + dateLine;
  } else if (evt.date) {
    var dd = new Date(evt.date + 'T12:00:00');
    dateLine = dd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (evt.date === today) dateLine = 'Today \u2014 ' + dateLine;
    else if (evt.date === tomorrowStr) dateLine = 'Tomorrow \u2014 ' + dateLine;
  } else if (evt.day) {
    var dayName = config.DAY_NAMES[evt.day] || evt.day.charAt(0).toUpperCase() + evt.day.slice(1);
    if (evt.frequency === 'monthly' && evt.recurrence && evt.recurrence.week) {
      var ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];
      dateLine = (ordinals[evt.recurrence.week] || '') + ' ' + dayName + ' of the month';
    } else {
      dateLine = dayName + 's';
      if (evt.frequency === 'weekly') dateLine = 'Every ' + dayName;
    }
    isRecurring = true;
  } else {
    dateLine = 'Ongoing';
    isRecurring = true;
  }
  // Append end date for recurring events
  if (isRecurring && evt.end_date) {
    var ed = new Date(evt.end_date + 'T12:00:00');
    dateLine += ' through ' + ed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Time line
  var timeLine = timeStr ? timeStr + endStr : '';
  if (timeLine && evt.time_is_inferred) timeLine += ' <span class="evt-time-approx">(approx)</span>';

  // ── Countdown ──
  var countdownHtml = '';
  if (evt.date) {
    var evtDateTime = new Date(evt.date + 'T' + (evt.time || '12:00'));
    var diffMs = evtDateTime.getTime() - utils.getNow().getTime();
    if (diffMs > 0) {
      var diffMins = Math.floor(diffMs / 60000);
      var diffHrs = Math.floor(diffMins / 60);
      var diffDays = Math.floor(diffHrs / 24);
      var countdownText = '';
      var imminent = false;
      if (diffMins < 60) { countdownText = 'In ' + diffMins + ' minute' + (diffMins !== 1 ? 's' : ''); imminent = true; }
      else if (diffHrs < 24) { countdownText = 'In ' + diffHrs + ' hour' + (diffHrs !== 1 ? 's' : ''); imminent = diffHrs <= 3; }
      else if (diffDays === 1) countdownText = 'Tomorrow';
      else if (diffDays < 30) countdownText = 'In ' + diffDays + ' days';
      else { var diffWeeks = Math.floor(diffDays / 7); countdownText = 'In ' + diffWeeks + ' week' + (diffWeeks !== 1 ? 's' : ''); }
      countdownHtml = '<div class="evt-countdown' + (imminent ? ' imminent' : '') + '">' + countdownText + '</div>';
    }
  } else if (evt.dates && evt.dates.length) {
    var rem = utils.getRemainingDates(evt);
    if (rem.length) countdownHtml = '<div class="evt-countdown">' + rem.length + ' date' + (rem.length !== 1 ? 's' : '') + ' remaining</div>';
  }

  // ── Category subtitle ──
  var catLabel = CAT_LABELS[evt.category] || '';
  var typeLabel = EVT_TYPES[evt.type] || evt.type || '';
  var subtitleParts = [];
  if (catLabel) subtitleParts.push(catLabel);
  if (typeLabel && typeLabel !== catLabel) subtitleParts.push(typeLabel);
  if (isRecurring && evt.frequency) {
    var freqLabel = evt.frequency === 'weekly' ? 'Weekly' : evt.frequency === 'monthly' ? 'Monthly' : '';
    if (freqLabel) subtitleParts.push(freqLabel);
  }
  if (evt.social) subtitleParts.push('Social');

  // ── Category icon ──
  var catIcon = CAT_ICONS[evt.category] || CAT_ICONS.community;

  // ── Seasonal tint class ──
  var seasonClass = '';
  if (evt.seasonal && evt.seasonal.is_seasonal) {
    var s = evt.seasonal.season || '';
    if (s === 'lent' || s === 'holy_week') seasonClass = ' evt-season-lent';
    else if (s === 'advent') seasonClass = ' evt-season-advent';
    else if (s === 'easter') seasonClass = ' evt-season-easter';
    else if (s === 'christmas') seasonClass = ' evt-season-christmas';
  }

  // ── When + Where info card ──
  var calSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var clockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var pinSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  var infoCard = '<div class="evt-info-card">';
  infoCard += '<div class="evt-info-row"><div class="evt-info-icon">' + calSvg + '</div><div class="evt-info-text"><div class="evt-info-primary">' + utils.esc(dateLine) + '</div></div></div>';
  if (timeLine) infoCard += '<div class="evt-info-row"><div class="evt-info-icon">' + clockSvg + '</div><div class="evt-info-text"><div class="evt-info-primary">' + timeLine + '</div></div></div>';
  // Location row — show venue if different from church
  var locPrimary = utils.esc(venueName);
  var locSecondary = '';
  if (evt.venue_name && churchDisplayName && evt.venue_name !== c.name) {
    locSecondary = utils.esc(churchDisplayName);
  }
  if (c.city) locSecondary += (locSecondary ? ' \u00b7 ' : '') + utils.esc(c.city + (c.state ? ', ' + c.state : ''));
  infoCard += '<div class="evt-info-row' + (mapUrl ? ' evt-info-clickable' : '') + '"' + (mapUrl ? ' onclick="window.open(\'' + utils.esc(mapUrl) + '\',\'_blank\')"' : '') + '>'
    + '<div class="evt-info-icon">' + pinSvg + '</div>'
    + '<div class="evt-info-text"><div class="evt-info-primary">' + locPrimary + '</div>'
    + (locSecondary ? '<div class="evt-info-secondary">' + locSecondary + '</div>' : '')
    + '</div></div>';
  infoCard += '</div>';

  // ── Multi-date series list ──
  var seriesHtml = '';
  if (evt.dates && evt.dates.length > 1) {
    var remaining2 = utils.getRemainingDates(evt);
    var pastDates = evt.dates.filter(function(ds) { return ds < today; });
    var seriesItems = evt.dates.map(function(ds) {
      var sd = new Date(ds + 'T12:00:00');
      var label = sd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      var isPast = ds < today;
      var isToday = ds === today;
      var cls = isPast ? 'evt-series-date past' : isToday ? 'evt-series-date today' : 'evt-series-date';
      return '<div class="' + cls + '">' + (isPast ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>' : isToday ? '<span class="evt-series-dot today"></span>' : '<span class="evt-series-dot"></span>') + '<span>' + label + '</span></div>';
    }).join('');
    seriesHtml = '<details class="evt-series"><summary class="evt-series-toggle">'
      + remaining2.length + ' of ' + evt.dates.length + ' dates remaining'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>'
      + '</summary><div class="evt-series-list">' + seriesItems + '</div></details>';
  }

  // ── Description or Notes (description replaces notes when available) ──
  var descHtml = '';
  if (evt.description) {
    descHtml = '<div class="evt-desc"><p>' + utils.esc(evt.description) + '</p></div>';
  } else if (evt.notes) {
    descHtml = '<div class="evt-notes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>' + utils.esc(evt.notes) + '</span></div>';
  }

  // ── Price row ──
  var priceHtml = '';
  if (evt.price) {
    priceHtml = '<div class="evt-detail-row"><svg class="evt-detail-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><div class="evt-detail-row-text"><span class="evt-detail-row-label">Price</span><span class="evt-detail-row-value">' + utils.esc(evt.price) + '</span></div></div>';
  }

  // ── Registration info row ──
  var regHtml = '';
  if (evt.registration_info) {
    regHtml = '<div class="evt-detail-row"><svg class="evt-detail-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg><div class="evt-detail-row-text"><span class="evt-detail-row-label">Registration</span><span class="evt-detail-row-value">' + utils.esc(evt.registration_info) + '</span></div></div>';
  }

  // ── Image hero ──
  var imageHtml = '';
  if (evt.image_url) {
    imageHtml = '<div class="evt-hero"><img src="' + utils.esc(evt.image_url) + '" alt="" loading="lazy"></div>';
  }

  // ── Contact info ──
  var contactHtml = '';
  if (evt.contact_name || evt.contact_email || evt.contact_phone) {
    var contactParts = [];
    if (evt.contact_name) contactParts.push('<strong>' + utils.esc(evt.contact_name) + '</strong>');
    if (evt.contact_phone) {
      var rawPhone = evt.contact_phone.replace(/[^+\d]/g, '');
      // Only make tel: link if phone has 10+ digits (full number)
      if (rawPhone.length >= 10) {
        contactParts.push('<a href="tel:' + utils.esc(rawPhone) + '">' + utils.esc(evt.contact_phone) + '</a>');
      } else {
        contactParts.push(utils.esc(evt.contact_phone));
      }
    }
    if (evt.contact_email) contactParts.push('<a href="mailto:' + utils.esc(evt.contact_email) + '">' + utils.esc(evt.contact_email) + '</a>');
    contactHtml = '<div class="evt-detail-row"><svg class="evt-detail-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><div class="evt-detail-row-text"><span class="evt-detail-row-label">Contact</span><span class="evt-detail-row-value">' + contactParts.join(' &middot; ') + '</span></div></div>';
  }

  // ── YC banner (replaces tags for YC events) ──
  var ycBannerHtml = '';
  if (isYC) {
    ycBannerHtml = '<div class="evt-yc-banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Young &amp; Catholic Event</span></div>';
  }

  // ── Actions (2-col grid) ──
  var actions = '<div class="evt-actions">';
  if (mapUrl) actions += '<a class="evt-action-btn" href="' + mapUrl + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg><span>Directions</span></a>';
  actions += '<button class="evt-action-btn" onclick="downloadEventIcal(\'' + utils.esc(evt.id) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Add to Calendar</span></button>';
  if (evt.registration_url) actions += '<a class="evt-action-btn evt-action-primary" href="' + utils.esc(evt.registration_url) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg><span>Register</span></a>';
  if (evt.flyer_url) actions += '<a class="evt-action-btn" href="' + utils.esc(evt.flyer_url) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>View Flyer</span></a>';
  actions += '</div>';

  // ── Footer: parish link ──
  var footerLink = c.id
    ? '<div class="evt-footer-link" onclick="navEventToParish(\'' + c.id + '\')">'
      + '<div class="evt-footer-link-inner">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      + '<span>View ' + utils.esc(churchDisplayName) + '</span>'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>'
      + '</div></div>'
    : '';

  // ── Assemble ──
  var headerHtml = '<div class="evt-header' + seasonClass + '">'
    + '<div class="evt-handle"><div class="evt-handle-bar"></div></div>'
    + '<div class="evt-header-top">'
    + '<div class="evt-cat-icon">' + catIcon + '</div>'
    + '<div class="evt-header-text">'
    + '<h2 class="evt-title">' + utils.esc(evt.title) + '</h2>'
    + '<div class="evt-subtitle">' + utils.esc(subtitleParts.join(' \u00b7 ')) + '</div>'
    + '</div>'
    + (document.getElementById('detailPanel').classList.contains('open')
      ? '<button class="evt-back" onclick="closeEventDetail()" aria-label="Back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>'
      : '<button class="evt-close" onclick="closeEventDetail()" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>')
    + '</div>'
    + countdownHtml
    + '</div>';

  document.getElementById('eventDetailContent').innerHTML = headerHtml
    + '<div class="evt-body">'
    + imageHtml
    + infoCard
    + seriesHtml
    + descHtml
    + ycBannerHtml
    + priceHtml
    + regHtml
    + contactHtml
    + actions
    + footerLink
    + '</div>';

  document.getElementById('detailBackdrop').classList.add('open');
  document.getElementById('eventDetailPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('eventDetailPanel').scrollTop = 0;
  window._lastFocused = window._lastFocused || document.activeElement;
  ui.trapFocus(document.getElementById('eventDetailPanel'));
}

function closeEventDetail() {
  var ui = require('./ui.js');

  document.getElementById('eventDetailPanel').classList.remove('open');
  // If parish panel is open underneath, keep backdrop and body lock
  if (!document.getElementById('detailPanel').classList.contains('open')) {
    document.getElementById('detailBackdrop').classList.remove('open');
    document.body.style.overflow = '';
    ui.releaseFocus();
    if (window._lastFocused) window._lastFocused.focus();
    history.replaceState(null, '', location.pathname + location.search);
  } else {
    ui.trapFocus(document.getElementById('detailPanel'));
  }
}

// ── iCal download for events ──

function downloadEventIcal(eventId) {
  var render = require('./render.js');

  var evt = data.state.eventsData.find(function(e) { return e.id === eventId; })
         || data.state.ycEvents.find(function(e) { return e.id === eventId; });
  if (!evt) return;
  var c = data.state.allChurches.find(function(x) { return x.id === evt.church_id; }) || {};
  var loc = evt.venue_name || c.name || '';
  var addr = evt.venue_address || c.address || '';
  if (c.city) loc += (loc ? ', ' : '') + c.city;
  var evtLat2 = evt.venue_lat || c.lat;
  var evtLng2 = evt.venue_lng || c.lng;
  var mapsUrl = evtLat2 && evtLng2
    ? render.getMapsUrlCoords(evtLat2, evtLng2, addr || loc)
    : (addr ? render.getMapsUrl(addr) : (loc ? render.getMapsUrl(loc) : ''));
  var desc = [evt.description || '', evt.notes || '', mapsUrl ? 'Directions: ' + mapsUrl : '', 'From MassFinder'].filter(Boolean).join('\n');
  var icsDate = utils.getNextEventDate(evt) || utils.getNextDateForDay(evt.day);
  if (!icsDate) return;
  utils.generateICS(evt.title, icsDate, evt.time || '', evt.end_time || '', loc, desc, mapsUrl);
}

// ── Navigate from event detail to parish detail ──

function navEventToParish(churchId) {
  var render = require('./render.js');

  // Close event panel, then open church detail
  document.getElementById('eventDetailPanel').classList.remove('open');
  setTimeout(function() { render.openDetail(churchId); }, 100);
}

// ── Add recurring/more-events to calendar ──

function addMoreEventToCal(idx) {
  var e = (window._moreEvents || [])[idx];
  if (!e) return;
  // Build a synthetic date -- use next occurrence of the day
  var dayIdx = config.DAY_ORDER.indexOf(e.day);
  var dateStr = '';
  if (dayIdx >= 0) {
    var now = utils.getNow();
    var todayDow = now.getDay();
    var diff = dayIdx - todayDow;
    if (diff < 0) diff += 7;
    if (diff === 0) diff = 7;
    var target = new Date(now);
    target.setDate(target.getDate() + diff);
    dateStr = utils.toLocalDateStr(target);
  } else {
    dateStr = utils.toLocalDateStr(utils.getNow());
  }
  if (!e.time) return;
  utils.generateICS(e.title, dateStr, e.time, e.end_time || '', e.churchName || '', (e.notes || '') + '\n' + (e.churchName || '') + '\nAdded from MassFinder');
}

// ── Compact YC card (used in saved tab) ──

function renderCompactYC(e) {
  var r = resolveYC(e);
  var timeStr = utils.fmt12(e.time) + (e.end_time ? ' \u2013 ' + utils.fmt12(e.end_time) : '');
  var calSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14">'
    + '<rect x="3" y="4" width="18" height="18" rx="2"/>'
    + '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>'
    + '<line x1="3" y1="10" x2="21" y2="10"/></svg>';
  return '<div class="saved-compact-yc" onclick="openEventDetail(\'' + e.id + '\')">'
    + '<div class="ce-item-body">'
    + '<div class="ce-item-title">' + utils.esc(e.title) + '</div>'
    + '<div class="ce-item-when">' + fmtYCDate(e.date) + ' \u00b7 ' + timeStr + ' \u00b7 ' + utils.esc(utils.displayName(r.locName || r.churchName)) + '</div>'
    + '</div>'
    + '<div class="saved-evt-actions">'
    + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + utils.esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + calSvg + '</button>'
    + '<button class="saved-evt-btn" onclick="expressInterest(\'' + utils.esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
    + '</div></div>';
}

// ── Events widget (Find tab -- scoped YC events) ──

function renderEventsWidget() {
  var el = document.getElementById('eventsWidget');
  if (!el) return;
  // Only show on all/today filters
  if (['all', 'today'].indexOf(data.state.currentFilter) === -1) { el.innerHTML = ''; return; }
  var upcoming = getUpcomingYC();
  if (!upcoming.length) { el.innerHTML = ''; return; }

  // Show in date order (getUpcomingYC already returns date-sorted)
  var ordered = upcoming.slice(0, 6);
  if (!ordered.length) { el.innerHTML = ''; return; }

  var cards = ordered.map(function(e) {
    var r = resolveYC(e);
    var dt = new Date(e.date + 'T12:00:00');
    var mon = dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    var day = dt.getDate();
    var timeStr = e.time ? utils.fmt12(e.time) : '';
    return '<div class="event-mini-card" onclick="openEventDetail(\'' + e.id + '\')">'
      + '<div class="event-mini-date-badge"><div class="event-mini-date-month">' + mon + '</div><div class="event-mini-date-day">' + day + '</div></div>'
      + '<div class="event-mini-info"><div class="event-mini-title">' + utils.esc(e.title) + '</div>'
      + (timeStr ? '<div class="event-mini-time">' + timeStr + '</div>' : '')
      + '<div class="event-mini-church">' + utils.esc(utils.displayName(r.locName || r.churchName)) + (r.town ? ' \u00b7 ' + utils.esc(r.town) : '') + '</div></div>'
      + '</div>';
  }).join('');

  var seeAll = upcoming.length > 6
    ? '<button class="events-widget-seeall" onclick="document.querySelector(\'[data-filter=yc]\').click()">See all ' + upcoming.length + ' \u2192</button>'
    : '';
  el.innerHTML = '<div class="events-widget-header"><span class="events-widget-label">Upcoming Young &amp; Catholic Events</span>' + seeAll + '</div>'
    + '<div class="events-widget-strip">' + cards + '</div>';
}

// ── Exports ──
module.exports = {
  EVT_TYPES: EVT_TYPES,
  LANG_NAMES: LANG_NAMES,
  getUpcomingYC: getUpcomingYC,
  resolveYC: resolveYC,
  fmtYCDate: fmtYCDate,
  addYCToCalendar: addYCToCalendar,
  renderYCCard: renderYCCard,
  renderCommunityEvents: renderCommunityEvents,
  openEventDetail: openEventDetail,
  closeEventDetail: closeEventDetail,
  downloadEventIcal: downloadEventIcal,
  navEventToParish: navEventToParish,
  addMoreEventToCal: addMoreEventToCal,
  renderCompactYC: renderCompactYC,
  renderEventsWidget: renderEventsWidget,
  CAT_ICONS: CAT_ICONS,
  CAT_LABELS: CAT_LABELS,
};
