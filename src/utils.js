// src/utils.js — Pure utility functions (no DOM, no state)
var config = require('./config.js');

function displayName(name) { return name.replace(/ (Church|Parish)$/, ''); }
function getNow() { return new Date(); }

// Return YYYY-MM-DD in local timezone (not UTC — avoids date shift after ~8 PM EST)
function toLocalDateStr(d) {
  var y = d.getFullYear();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

function isEventActive(e) {
  var t = toLocalDateStr(getNow());
  if (e.dates && e.dates.length) { var exp = e.end_date || e.dates[e.dates.length - 1]; return exp >= t; }
  var exp2 = e.end_date || e.date;
  if (!exp2) return true;
  return exp2 >= t;
}

function getNextEventDate(e) {
  var t = toLocalDateStr(getNow());
  if (e.dates && e.dates.length) { for (var i = 0; i < e.dates.length; i++) { if (e.dates[i] >= t) return e.dates[i]; } return e.dates[e.dates.length - 1]; }
  return e.date || null;
}

function getRemainingDates(e) {
  if (!e.dates || !e.dates.length) return [];
  var t = toLocalDateStr(getNow());
  return e.dates.filter(function(d) { return d >= t; });
}

function getNextDateForDay(dayName) {
  if (!dayName) return null;
  var dayIdx = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }[dayName];
  if (dayIdx === undefined) return null;
  var d = getNow(); var cur = d.getDay();
  var diff = (dayIdx - cur + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return toLocalDateStr(d);
}

function fmt12(t) {
  if (!t) return '';
  var parts = t.split(':').map(Number), h = parts[0], m = parts[1];
  var ap = h >= 12 ? 'PM' : 'AM', h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? h12 + ' ' + ap : h12 + ':' + String(m).padStart(2, '0') + ' ' + ap;
}

function toMin(t) {
  if (!t) return null;
  var parts = t.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function isLentSeason() {
  if (window._litcalCache && window._litcalCache.events) {
    var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
    var today = window._litcalCache.events.filter(function(e) { return e.month === m && e.day === d; });
    if (today.length) return today[0].liturgical_season === 'LENT';
  }
  var now2 = getNow(), year = now2.getFullYear();
  var a = year % 19, b = Math.floor(year / 100), c = year % 100;
  var dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30;
  var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  var mn = Math.floor((a + 11 * h + 22 * l) / 451);
  var eMonth = Math.floor((h + l - 7 * mn + 114) / 31), eDay = ((h + l - 7 * mn + 114) % 31) + 1;
  var easter = new Date(year, eMonth - 1, eDay);
  var ashWed = new Date(easter); ashWed.setDate(easter.getDate() - 46);
  var holySat = new Date(easter); holySat.setDate(easter.getDate() - 1);
  var td = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate());
  return td >= ashWed && td <= holySat;
}

// ── Easter date (Anonymous Gregorian algorithm) ──
function getEaster(year) {
  var a = year % 19, b = Math.floor(year / 100), c = year % 100;
  var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  var mn = Math.floor((a + 11 * h + 22 * l) / 451);
  var eMonth = Math.floor((h + l - 7 * mn + 114) / 31);
  var eDay = ((h + l - 7 * mn + 114) % 31) + 1;
  return new Date(year, eMonth - 1, eDay);
}

// ── Liturgical Season Progress (Lent, Easter, Advent) ──
function getSeasonProgress() {
  var now = getNow();
  var year = now.getFullYear();
  var easter = getEaster(year);
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Ash Wednesday = Easter - 46 days
  var ashWed = new Date(easter); ashWed.setDate(easter.getDate() - 46);
  // Holy Saturday = Easter - 1
  var holySat = new Date(easter); holySat.setDate(easter.getDate() - 1);
  // Pentecost = Easter + 49
  var pentecost = new Date(easter); pentecost.setDate(easter.getDate() + 49);

  // Advent: 4th Sunday before Christmas
  var christmas = new Date(year, 11, 25);
  var christmasDay = christmas.getDay();
  var advent1 = new Date(christmas);
  advent1.setDate(christmas.getDate() - (christmasDay === 0 ? 21 : (christmasDay + 21)));

  if (today >= ashWed && today <= holySat) {
    var elapsed = Math.floor((today - ashWed) / 86400000) + 1;
    var total = Math.floor((holySat - ashWed) / 86400000) + 1;
    return { season: 'Lent', day: elapsed, total: total, pct: Math.round((elapsed / total) * 100) };
  }
  if (today >= easter && today <= pentecost) {
    var elapsed2 = Math.floor((today - easter) / 86400000) + 1;
    return { season: 'Easter Season', day: elapsed2, total: 50, pct: Math.round((elapsed2 / 50) * 100) };
  }
  if (today >= advent1 && today < christmas) {
    var elapsed3 = Math.floor((today - advent1) / 86400000) + 1;
    var total3 = Math.floor((christmas - advent1) / 86400000);
    return { season: 'Advent', day: elapsed3, total: total3, pct: Math.round((elapsed3 / total3) * 100) };
  }
  return null;
}

function getNext(parish, filter) {
  var now = getNow(), curMin = now.getHours() * 60 + now.getMinutes(), curDI = now.getDay();
  var svcs = parish.services.filter(function(s) {
    if (!s.time || !s.day) return false;
    if (filter === 'lent') return s.seasonal && s.seasonal.season === 'lent';
    if (s.seasonal && s.seasonal.is_seasonal) return false;
    if (!config.DAY_ORDER.includes(s.day) && s.day !== 'weekday' && s.day !== 'daily') return false;
    if (filter === 'confession') return s.type === 'confession';
    if (filter === 'adoration') return ['adoration', 'perpetual_adoration', 'holy_hour'].includes(s.type);
    if (filter === 'latin') return s.language === 'la' || s.rite === 'tridentine';
    if (filter === 'spanish') return s.language === 'es';
    return true;
  });
  if (!svcs.length) return null;
  var cands = [];
  for (var idx = 0; idx < svcs.length; idx++) {
    var s = svcs[idx];
    var days = [];
    if (s.day === 'weekday') days = [1, 2, 3, 4, 5];
    else if (s.day === 'daily') days = [0, 1, 2, 3, 4, 5, 6];
    else { var di = config.DAY_ORDER.indexOf(s.day); if (di >= 0) days = [di]; }
    var sm = toMin(s.time); if (sm === null) continue;
    var svcEnd = s.end_time ? toMin(s.end_time) : null;
    var svcEffEnd = svcEnd !== null ? svcEnd : sm + 60;
    for (var j = 0; j < days.length; j++) {
      var dayI = days[j];
      var du = dayI - curDI; if (du < 0) du += 7;
      if (du === 0 && curMin > svcEffEnd) du = 7;
      if (filter === 'today' && du !== 0) continue;
      if (filter === 'weekend' && ![0, 6].includes(dayI)) continue;
      cands.push({ service: s, daysUntil: du, dayIdx: dayI, totalMin: du * 1440 + (du === 0 ? sm - curMin : sm) });
    }
  }
  if (!cands.length) return null;
  cands.sort(function(a, b) { return a.totalMin - b.totalMin; });
  var best = cands[0];
  return {
    service: best.service,
    dayLabel: best.daysUntil === 0 ? 'Today' : best.daysUntil === 1 ? 'Tomorrow' : config.DAY_NAMES[config.DAY_ORDER[best.dayIdx]] || '',
    minutesUntil: best.totalMin,
    isLive: best.daysUntil === 0 && toMin(best.service.time) <= curMin && curMin <= (best.service.end_time ? toMin(best.service.end_time) : toMin(best.service.time) + 60),
    isSoon: best.totalMin > 0 && best.totalMin <= 60,
    timeFormatted: fmt12(best.service.time)
  };
}

// Distance (haversine)
function hav(a1, o1, a2, o2) {
  var R = 3959, dA = (a2 - a1) * Math.PI / 180, dO = (o2 - o1) * Math.PI / 180;
  var a = Math.sin(dA / 2) ** 2 + Math.cos(a1 * Math.PI / 180) * Math.cos(a2 * Math.PI / 180) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function getDist(c, userLat, userLng) {
  if (userLat === null) return null;
  if (!c.lat || !c.lng) return null;
  return hav(userLat, userLng, c.lat, c.lng);
}
function fmtDist(mi) {
  if (mi === null) return '';
  if (mi < 0.1) return 'Nearby';
  return mi < 10 ? mi.toFixed(1) + ' mi' : Math.round(mi) + ' mi';
}

function isVer(c) { var v = c.validation; return v && v.status === 'verified'; }

// ICS generation
function generateICS(title, date, time, endTime, location, description, url) {
  function pad(n) { return String(n).padStart(2, '0'); }
  function toICSDate(dateStr, timeStr) {
    var d = new Date(dateStr + 'T' + timeStr);
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }
  var dtStart = toICSDate(date, time);
  var dtEnd = endTime ? toICSDate(date, endTime) : toICSDate(date, time.replace(/(\d{2}):(\d{2})/, function(m, h, mi) { return pad((+h + 1) % 24) + ':' + mi; }));
  var uid = Date.now() + '@massfinder.app';
  var fields = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MassFinder//EN', 'BEGIN:VEVENT',
    'DTSTART:' + dtStart, 'DTEND:' + dtEnd, 'SUMMARY:' + title.replace(/[,;]/g, ' '),
    'LOCATION:' + (location || '').replace(/[,;]/g, ' '),
    'DESCRIPTION:' + (description || '').replace(/\n/g, '\\n').replace(/[,;]/g, ' ')];
  if (url) fields.push('URL:' + url);
  fields.push('UID:' + uid, 'END:VEVENT', 'END:VCALENDAR');
  var ics = fields.join('\r\n');
  var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  var blobUrl = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = blobUrl; a.download = (title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') || 'event') + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
}

// Schedule helpers (used by render.js renderSched)
function svcKey(s) {
  var rite = s.rite === 'tridentine' ? 'tridentine' : '';
  return s.time + '|' + (s.end_time || '') + '|' + (s.location_id || '') + '|' + (s.language || 'en') + '|' + s.type + '|' + rite;
}

function escRe(str) { return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function cleanNote(s) {
  var n = (s.notes || '').trim();
  if (!n) return '';
  var nl = n.toLowerCase();
  var season = (s.seasonal || {}).season || '';
  var typeName = (config.SVC_LABELS[s.type] || '').toLowerCase();

  if (s.day === 'saturday' && s.type === 'sunday_mass' && /^vigil(\s*mass)?$/i.test(n)) return '';
  if (typeName && nl === typeName) return '';

  var TYPE_SYNONYMS = {
    adoration: ['eucharistic adoration', 'exposition of the blessed sacrament', 'eucharistic exposition', 'adoration of the blessed sacrament'],
    divine_mercy: ['chaplet of divine mercy', 'divine mercy chaplet', 'the divine mercy chaplet'],
    rosary: ['daily rosary', 'the rosary', 'holy rosary'],
    stations_of_cross: ['the stations of the cross', 'way of the cross'],
    miraculous_medal: ['miraculous medal novena', 'miraculous medal devotion'],
    vespers: ['sunday vespers', 'evening prayer'],
    holy_hour: ['eucharistic holy hour'],
  };
  var synonyms = TYPE_SYNONYMS[s.type] || [];
  if (synonyms.includes(nl)) return '';

  if (s.language === 'la' && /^traditional\s+latin\s+mass\s*(\(tlm\))?$/i.test(n)) return '';
  if (s.language === 'pl' && /^polish\s+mass/i.test(n)) return '';
  if (s.type === 'communion_service' && /^communion\s+service$/i.test(n)) return '';
  n = n.replace(/\s*\(language:\s*\w+\)\s*/gi, '').trim();
  if (s.language === 'en' && /^last\s+sunday\s+of\s+month:\s*mass\s+in\s+polish/i.test(n)) return '';
  n = n.replace(/\s*[—–-]\s*English\s*$/i, '').trim();

  var LANG_NAMES = {};
  Object.keys(config.LANGUAGES).forEach(function(k) { LANG_NAMES[k] = config.LANGUAGES[k].label; });

  if (s.language && s.language !== 'en' && LANG_NAMES[s.language]) {
    var langName = LANG_NAMES[s.language];
    var lw = langName.toLowerCase();
    var langTypePat = new RegExp('^' + escRe(lw) + '\\s+(' + escRe(typeName) + '|mass|confession|rosary|adoration|stations of the cross)$', 'i');
    if (langTypePat.test(nl)) return '';
    if (new RegExp('available\\s+in\\s+' + escRe(lw) + '$', 'i').test(nl)) return '';
    n = n.replace(new RegExp('^' + escRe(langName) + '\\s+mass\\s*[—–-]\\s*', 'i'), '').trim();
    n = n.replace(new RegExp('^' + escRe(langName) + '\\s+', 'i'), '').trim();
  }

  if (season === 'lent') {
    if (/^lenten\s+season$/i.test(n)) return '';
    n = n.replace(/^Lenten\s+/i, '').trim();
    n = n.replace(/\s*[—–-]\s*(Fridays|Wednesdays|Mondays)\s+(of|during)\s+Lent/gi, '').trim();
    n = n.replace(/\s*during\s+Lent$/i, '').trim();
    if (/^(fridays?|wednesdays?|mondays?)\s+(of|during)\s+lent$/i.test(nl)) return '';
  }
  if (season === 'academic_year') {
    n = n.replace(/\s*[—–-]?\s*Academic\s+year\s+only\.?$/i, '').trim();
    n = n.replace(/\s*[—–-]?\s*Academic\s+year\.?$/i, '').trim();
    if (/^academic\s+year(\s+only)?\.?$/i.test(n)) return '';
    if (/^school\s+year\s+schedule$/i.test(n)) return '';
  }
  if (s.day === 'first_friday') {
    if (/^(1st|first)\s+friday\s+(adoration|holy hour|mass|only|of the month)$/i.test(n)) return '';
    n = n.replace(/^(1st|first)\s+friday[s]?:?\s*/i, '').trim();
  }
  if (s.day === 'first_saturday') {
    if (/^(1st|first)\s+saturday\s+(monthly|mass|only|of (the|every) month|devotional mass)$/i.test(n)) return '';
    n = n.replace(/^(1st|first)\s+saturday:?\s*/i, '').trim();
  }
  if (['holyday', 'holyday_eve'].includes(s.day)) {
    if (/^holy\s+day(\s+of\s+obligation)?(\s+mass)?$/i.test(n)) return '';
    if (/^holyday\s+mass$/i.test(n)) return '';
    if (/^(holy\s+day\s+)?vigil(\s+mass)?$/i.test(n)) return '';
    if (/^eve\s+of\s+holy\s+day(\s+mass)?$/i.test(n)) return '';
    n = n.replace(/^holy\s+day\s+of\s+obligation\s*[—–-]\s*/i, '').trim();
  }
  if (s.type === 'holy_thursday_mass' && /^mass\s+of\s+the\s+lord'?s?\s+supper$/i.test(n)) return '';
  if (s.type === 'good_friday_service' && /^(passion\s+of\s+the\s+lord|good\s+friday\s+service|celebration\s+of\s+the\s+passion)$/i.test(n)) return '';
  if (s.type === 'easter_vigil_mass' && /^easter\s+vigil(\s+mass)?$/i.test(n)) return '';
  if (season === 'holy_week' && /^easter\s+sunday(\s+mass)?$/i.test(n)) return '';
  if (s.time && /^(evening|morning|noontime)\s+(mass|confessions?)$/i.test(n)) return '';
  if (s.time && /^(before|extended)\s+(evening\s+)?(confessions?|adoration|mass)$/i.test(n)) return '';

  var typeVariants = [typeName].concat(synonyms).filter(Boolean);
  if (season === 'lent') typeVariants = typeVariants.concat([typeName].concat(synonyms).filter(Boolean).map(function(v) { return 'lenten ' + v; }));
  for (var vi = 0; vi < typeVariants.length; vi++) {
    var re = new RegExp('^' + escRe(typeVariants[vi]) + '\\s*[—–\\-]\\s*', 'i');
    if (re.test(n)) { n = n.replace(re, '').trim(); break; }
  }

  n = n.replace(/^[—–-]\s*/, '').trim();
  if (!n || n === '—') return '';
  return n;
}

function makeRangeLabel(days) {
  var WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  var abbr = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri' };
  if (days.length === 5) return 'Mon \u2013 Fri';
  var indices = days.map(function(d) { return WEEKDAYS.indexOf(d); }).sort(function(a, b) { return a - b; });
  var consecutive = true;
  for (var i = 1; i < indices.length; i++) { if (indices[i] !== indices[i - 1] + 1) { consecutive = false; break; } }
  if (consecutive && days.length >= 3) return abbr[WEEKDAYS[indices[0]]] + ' \u2013 ' + abbr[WEEKDAYS[indices[indices.length - 1]]];
  return days.map(function(d) { return abbr[d] || d; }).join(', ');
}

function smartDefault() {
  var n = getNow(), d = n.getDay(), h = n.getHours();
  if (d === 6 && h >= 14) return 'weekend';
  if (d === 0 && h < 14) return 'today';
  return 'all';
}

function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

// Human-friendly relative date: "2026-03-04" → "1 week ago", "today", "3 months ago"
function fmtRelDate(iso) {
  if (!iso) return '';
  var parts = iso.split('-').map(Number);
  var then = new Date(parts[0], parts[1] - 1, parts[2] || 1);
  var now = getNow();
  var diffMs = now - then;
  var days = Math.floor(diffMs / 86400000);
  if (days < 0) return 'upcoming';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 14) return '1 week ago';
  if (days < 30) return Math.floor(days / 7) + ' weeks ago';
  if (days < 60) return '1 month ago';
  if (days < 365) return Math.floor(days / 30) + ' months ago';
  return Math.floor(days / 365) + '+ years ago';
}

// Human-friendly month label: "2026-03" → "March 2026"
var _MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtMonth(iso) {
  if (!iso) return '';
  var parts = iso.split('-').map(Number);
  return (_MONTH_NAMES[parts[1] - 1] || '') + ' ' + parts[0];
}

// fmt12 without AM/PM suffix — used for inline time display
function fmt12bare(t) {
  if (!t) return '';
  var parts = t.split(':').map(Number), h = parts[0], m = parts[1];
  var h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? String(h12) : h12 + ':' + String(m).padStart(2, '0');
}

// TD-03: Shared CCC reference-stripping (used by ccc.js, examination.js, rosary.js)
function stripCCCRefs(t) { return t.replace(/\s*\(\d[\d,\s\-\u2013]*\)\s*/g, ' ').trim(); }

module.exports = {
  displayName: displayName, getNow: getNow, toLocalDateStr: toLocalDateStr,
  isEventActive: isEventActive, getNextEventDate: getNextEventDate,
  getRemainingDates: getRemainingDates, getNextDateForDay: getNextDateForDay,
  fmt12: fmt12, toMin: toMin, isLentSeason: isLentSeason,
  getNext: getNext, hav: hav, getDist: getDist, fmtDist: fmtDist,
  isVer: isVer, generateICS: generateICS,
  svcKey: svcKey, cleanNote: cleanNote, escRe: escRe, makeRangeLabel: makeRangeLabel,
  smartDefault: smartDefault, esc: esc, stripCCCRefs: stripCCCRefs,
  getEaster: getEaster, getSeasonProgress: getSeasonProgress,
  fmtRelDate: fmtRelDate, fmtMonth: fmtMonth, fmt12bare: fmt12bare,
};
