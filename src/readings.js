// src/readings.js — Liturgical calendar, daily readings, BibleGet integration
var utils = require('./utils.js');
var config = require('./config.js');

var getNow = utils.getNow;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var REGION = config.REGION;

// ── BibleGet cache cleanup IIFE ──
// localStorage cache with daily expiry — readings change each day.
// Prevents re-fetching across tab closes/browser restarts.
(function() {
  try {
    var d = new Date();
    var today = String(d.getFullYear()) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    // TD-15: migrate old bg_date → mf-bg-date
    if (localStorage.getItem('bg_date')) { localStorage.removeItem('bg_date'); }
    if (localStorage.getItem('mf-bg-date') !== today) {
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('mf-bg-') === 0 && k !== 'mf-bg-date') toRemove.push(k);
        // Clean up any legacy bg_ keys too
        if (k && k.slice(0, 3) === 'bg_') toRemove.push(k);
      }
      toRemove.forEach(function(k) { localStorage.removeItem(k); });
      localStorage.setItem('mf-bg-date', today);
    }
  } catch (e) { /* noop */ }
})();

// ── Liturgical Season ──
function setLiturgicalSeason(events) {
  var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d; });
  var season = 'ordinary';
  if (today.length) {
    var s = today[0].liturgical_season || '';
    if (s === 'LENT' || s === 'HOLY_WEEK' || s === 'EASTER_TRIDUUM') season = 'lent';
    else if (s === 'ADVENT') season = 'advent';
    else if (s === 'EASTER' || s === 'EASTER_SEASON') season = 'easter';
    else if (s === 'CHRISTMAS') season = 'christmas';
  }
  // SLV-07: Season transition via sacred pause system
  var sacredPause = require('./sacred-pause.js');
  var lastSeason = null;
  try { lastSeason = localStorage.getItem('mf-last-season'); } catch (e) {}

  if (lastSeason && lastSeason !== season && !window._devSkipSeasonOverlay) {
    var seasonNames = {
      advent: 'The Season of Advent',
      christmas: 'The Christmas Season',
      lent: 'The Season of Lent',
      easter: 'The Easter Season',
      ordinary: 'Ordinary Time'
    };
    var seasonMessages = {
      advent: 'A time of joyful waiting and preparation.',
      christmas: 'The Word was made flesh, and dwelt among us.',
      lent: 'Return to Me with your whole heart.',
      easter: 'He is risen. Alleluia!',
      ordinary: 'Growing in grace, day by day.'
    };
    sacredPause.show({
      label: 'A NEW SEASON',
      title: seasonNames[season] || season,
      message: seasonMessages[season] || '',
      timeout: 4000,
      storageKey: 'mf-last-season',
      storageVal: season
    });
  } else {
    try { localStorage.setItem('mf-last-season', season); } catch (e) {}
  }
  window._devSkipSeasonOverlay = false;

  document.documentElement.setAttribute('data-season', season);
  var morePanel = document.getElementById('panelMore');
  if (morePanel) morePanel.setAttribute('data-season', season);
}

// SLV-09: Holy day & solemnity recognition
function checkSolemnityPause(events) {
  var sacredPause = require('./sacred-pause.js');
  var now = getNow();
  var m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d; });
  if (!today.length) return;
  var e = today[0];

  var majorDays = {
    'Easter':       { msg: 'He is risen. Alleluia, alleluia!' },
    'Christmas':    { msg: 'For unto us a Child is born, unto us a Son is given.' },
    'Pentecost':    { msg: 'Come, Holy Spirit, fill the hearts of your faithful.' },
    'AshWednesday': { msg: 'Remember that you are dust, and to dust you shall return.' },
    'GoodFri':      { msg: 'By your holy Cross, you have redeemed the world.' },
    'EasterVigil':  { msg: 'Lumen Christi. The Light of Christ.' },
    'PalmSun':      { msg: 'Blessed is he who comes in the name of the Lord.' },
    'AllSaints':    { msg: 'After this I had a vision of a great multitude, which no one could count.' },
    'Ascension':    { msg: 'He was lifted up, and a cloud took him from their sight.' },
    'HolyThurs':    { msg: 'Do this in remembrance of Me.' }
  };

  // Dedup: if season also changed today, the season pause covers these
  var SEASON_COVERS = { 'Easter': 1, 'Christmas': 1, 'AshWednesday': 1 };
  var key = e.event_key || '';
  if (SEASON_COVERS[key] && sacredPause.isActive()) {
    try { localStorage.setItem('mf-pause-solemn', new Date().toISOString().slice(0, 10)); } catch (ex) {}
    return;
  }

  var major = majorDays[key];
  if (major) {
    sacredPause.showAfter({
      title: e.name || key,
      message: major.msg,
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
    return;
  }

  if (e.holy_day_of_obligation) {
    sacredPause.showAfter({
      label: 'HOLY DAY OF OBLIGATION',
      title: e.name || '',
      message: 'The faithful are obliged to attend Mass today.',
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
  }
}

// ── Holy Day of Obligation Banner ──
function renderHDOBanner(events) {
  var el = document.getElementById('hdoBanner');
  if (!el || !config.FEATURES.hdo_banner) return;
  var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
  var tom = new Date(now); tom.setDate(tom.getDate() + 1);
  var tm = tom.getMonth() + 1, td = tom.getDate();
  var todayHDO = events.filter(function(e) { return e.month === m && e.day === d && e.holy_day_of_obligation; });
  var tomHDO = events.filter(function(e) { return e.month === tm && e.day === td && e.holy_day_of_obligation; });
  var hdo = todayHDO.length ? todayHDO[0] : (tomHDO.length ? tomHDO[0] : null);
  if (!hdo) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="hdo-banner">'
    + '<div class="hdo-banner-label">Holy Day of Obligation' + (tomHDO.length ? ' \u2014 Tomorrow' : '') + '</div>'
    + '<div class="hdo-banner-title">' + esc(hdo.name) + '</div>'
    + '<button class="hdo-banner-cta" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Find a Mass near you \u2192</button>'
    + '</div>';
}

// ── Holy Day Badge (Badging API) ──
function updateHDOBadge(events) {
  if (!navigator.setAppBadge) return;
  var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
  var tom = new Date(now); tom.setDate(tom.getDate() + 1);
  var tm = tom.getMonth() + 1, td = tom.getDate();
  var hasHDO = events.some(function(e) {
    return e.holy_day_of_obligation && (
      (e.month === m && e.day === d) || (e.month === tm && e.day === td)
    );
  });
  if (hasHDO) navigator.setAppBadge(1).catch(function() {});
  else navigator.clearAppBadge().catch(function() {});
}

// ── Fasting & Abstinence Banner (PAT-03) ──
var _fastingDismissBtn = '<button class="fasting-banner-dismiss" onclick="dismissFastingBanner()" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

function renderFastingBanner(events) {
  var el = document.getElementById('fastingBanner');
  if (!el) return;
  if (sessionStorage.getItem('fastingBannerDismissed')) return;
  var now = getNow(), m = now.getMonth() + 1, d = now.getDate(), dow = now.getDay();
  var today = events.filter(function(e) { return e.month === m && e.day === d; });

  // Check for Ash Wednesday or Good Friday by event_key
  var isAshWed = today.some(function(e) { return e.event_key === 'AshWednesday'; });
  var isGoodFri = today.some(function(e) { return e.event_key === 'GoodFri'; });
  // Check if it's a Friday during Lent
  var season = (today[0] && today[0].liturgical_season) || '';
  var isLentFriday = dow === 5 && (season === 'LENT' || season === 'HOLY_WEEK');

  if (isAshWed || isGoodFri) {
    el.innerHTML = '<div class="fasting-banner fasting-banner--full">'
      + '<div class="fasting-banner-text">'
      + '<div class="fasting-banner-title">Day of Fasting &amp; Abstinence</div>'
      + '<div class="fasting-banner-desc">Ages 18\u201359 fast (one full meal). Ages 14+ abstain from meat.</div>'
      + '</div>'
      + _fastingDismissBtn
      + '</div>';
  } else if (isLentFriday) {
    el.innerHTML = '<div class="fasting-banner">'
      + '<div class="fasting-banner-text">'
      + '<div class="fasting-banner-title">Day of Abstinence</div>'
      + '<div class="fasting-banner-desc">Ages 14+ abstain from meat today.</div>'
      + '</div>'
      + _fastingDismissBtn
      + '</div>';
  } else {
    el.innerHTML = '';
  }
}

// ── Liturgical Events ──
function getLiturgicalEvents() {
  if (window._litcalCache && window._litcalCache.events) {
    return getLiturgicalEventsFromLitCal(window._litcalCache.events);
  }
  return [];
}

function getLiturgicalEventsFromLitCal(events) {
  var now = getNow();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var cutoff = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  var gradeLabels = { 3: 'Memorial', 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
  var colorMap = { purple: '#6B21A8', red: '#DC2626', white: '#94A3B8', green: '#16A34A', rose: '#DB2777' };

  var upcoming = events.filter(function(e) {
    // Use event's own month/day fields to avoid UTC→local timezone shift
    var d = new Date(e.year || now.getFullYear(), (e.month || 1) - 1, e.day || 1);
    if (d < today || d > cutoff) return false;
    if (e.is_vigil_mass) return false;
    if (e.grade >= 4 && e.grade < 7) return true;
    if (e.holy_day_of_obligation) return true;
    if (e.grade === 7) {
      var notableKeys = {
        'AshWednesday': 1, 'PalmSun': 1, 'HolyThurs': 1, 'GoodFri': 1,
        'HolySat': 1, 'EasterVigil': 1, 'Easter': 1, 'Easter2': 1,
        'Pentecost': 1, 'ChristmasDay': 1, 'Christmas': 1
      };
      var k = e.event_key || '';
      if (notableKeys[k]) return true;
    }
    return false;
  });

  // Deduplicate by date — keep highest grade per day
  var byDate = {};
  upcoming.forEach(function(e) {
    var key = e.year + '-' + e.month + '-' + e.day;
    if (!byDate[key] || e.grade > byDate[key].grade) byDate[key] = e;
  });

  return Object.keys(byDate).map(function(key) {
    var e = byDate[key];
    // Use event's own month/day fields to avoid UTC→local timezone shift
    var d = new Date(e.year || now.getFullYear(), (e.month || 1) - 1, e.day || 1);
    var diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    var typeLabel = e.holy_day_of_obligation ? 'Holy Day of Obligation' : (gradeLabels[e.grade] || '');
    if (e.grade_display) typeLabel = e.grade_display;
    var color = (e.color && e.color[0]) || 'green';
    return {
      date: d, name: e.name, type: typeLabel, daysAway: diff,
      color: color, colorHex: colorMap[color] || '#16A34A',
      hdo: !!e.holy_day_of_obligation
    };
  }).sort(function(a, b) { return a.date - b.date; }).slice(0, 3);
}

// ── Render Liturgical Calendar ──
function renderLiturgicalCalendar(el) {
  if (!el) el = document.getElementById('liturgicalContent');
  if (!el) return;
  var evts = getLiturgicalEvents();
  if (!evts.length) {
    var msg = window._litcalCache ? 'No upcoming observances.' : 'Loading\u2026';
    el.innerHTML = '<p style="font-size:var(--text-sm);color:var(--color-text-tertiary)">' + msg + '</p>';
    return;
  }
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var allSameType = evts.length > 1 && evts.every(function(e) { return e.type === evts[0].type; });
  el.innerHTML = evts.map(function(e) {
    var soon = e.daysAway <= 7 ? '<span class="litu-soon">' + (e.daysAway === 0 ? 'Today' : e.daysAway === 1 ? 'Tomorrow' : 'In ' + e.daysAway + ' days') + '</span>' : '';
    var hdoBadge = e.hdo ? '<span class="litu-hdo">Obligation</span>' : '';
    var typeText = allSameType ? '' : esc(e.type);
    var showType = typeText || hdoBadge;
    return '<div class="litu-event">'
      + '<div class="litu-date-badge" style="background:' + e.colorHex + '"><div class="litu-month">' + months[e.date.getMonth()] + '</div><div class="litu-day">' + e.date.getDate() + '</div></div>'
      + '<div><div class="litu-name">' + esc(e.name) + '</div>' + (showType ? '<div class="litu-type">' + typeText + hdoBadge + '</div>' : '') + soon + '</div>'
      + '</div>';
  }).join('');
}

// ── Fetch Daily Readings ──
function fetchReadings() {
  var el = document.getElementById('readingsContent');
  if (!el || !config.FEATURES.readings_api) return Promise.resolve();
  var now = getNow();
  var yyyymmdd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  var usccbUrl = 'https://bible.usccb.org/bible/readings/' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + now.getFullYear().toString().slice(2) + '.cfm';
  var usccbLink = '<a class="reading-usccb" href="' + usccbUrl + '" target="_blank" rel="noopener">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
    + 'Read full readings at USCCB</a>';

  var apiUrl = REGION.readingsApiUrl || 'https://massfinder-readings-api.vercel.app/api/readings';

  return fetch(apiUrl + '?date=' + yyyymmdd, { signal: AbortSignal.timeout(12000) })
    .then(function(resp) {
      if (!resp.ok) throw new Error('API ' + resp.status);
      return resp.json();
    })
    .then(function(data) {
      if (!data.sections || !data.sections.length) throw new Error('no sections');

      // Filter out Verse Before the Gospel / Alleluia / Sequence
      var sections = data.sections.filter(function(s) {
        var h = s.heading.toLowerCase();
        return h.indexOf('verse before') === -1 && h.indexOf('alleluia') === -1 && h.indexOf('sequence') === -1;
      });

      var chevron = '<svg class="reading-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>';

      var html = '';
      html += sections.map(function(s, i) {
        var id = 'reading-entry-' + i;
        var hasText = s.text && s.text.length > 0;
        var listenHtml = '';
        if (hasText && typeof speechSynthesis !== 'undefined') {
          // Strip any embedded markup from text for TTS (plain text only)
          var plainText = s.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          listenHtml = '<button class="reading-listen-btn" onclick="event.stopPropagation();_readingReadAloud(this)" data-text="' + esc(plainText) + '">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">'
            + '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>'
            + '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
            + '</svg>'
            + ' Listen</button>';
        }
        var entryClass = 'reading-entry';
        return '<div class="' + entryClass + '" id="' + id + '" ' + (hasText ? 'onclick="toggleReading(\'' + id + '\')"' : '') + '>'
          + '<div class="reading-entry-header">'
          + '<div>'
          + '<div class="reading-heading">' + esc(s.heading) + '</div>'
          + (s.ref ? '<div class="reading-ref">' + esc(s.ref) + '</div>' : '')
          + '</div>'
          + (hasText ? chevron : '')
          + '</div>'
          + (hasText ? '<div class="reading-text" id="reading-text-' + i + '">' + formatReadingText(s.text, s.heading) + listenHtml + '</div>' : '')
          + '</div>';
      }).join('');

      // SLV-10: Liturgical day header above readings
      var litDay = '';
      var litColor = '';
      try {
        if (window._litcalCache && window._litcalCache.events) {
          var now2 = getNow();
          var m2 = now2.getMonth() + 1, d2 = now2.getDate();
          var entry = window._litcalCache.events;
          if (Array.isArray(entry)) {
            var td = entry.filter(function(ev) { return ev.month === m2 && ev.day === d2; });
            if (td.length) {
              litDay = td[0].name || '';
              litColor = (td[0].color && td[0].color[0]) || '';
            }
          }
        }
      } catch (ex) {}
      if (litDay) {
        html = '<div class="readings-lit-header" data-lit-color="' + esc(litColor) + '">'
          + '<div class="readings-lit-day">' + esc(litDay) + '</div>'
          + '</div>' + html;
      }

      el.innerHTML = html;

      // Enhance with BibleGet — staggered 2500ms apart to stay under rate limits
      if (!config.FEATURES.bibleget) return;
      var bgDelay = 0;
      sections.forEach(function(s, i) {
        if (!s.ref || !s.text) return;
        var textEl = document.getElementById('reading-text-' + i);
        if (!textEl) return;
        var isPsalm = s.heading.toLowerCase().indexOf('psalm') !== -1 || s.heading.toLowerCase().indexOf('responsorial') !== -1;
        setTimeout(enhanceWithBibleGet.bind(null, textEl, s.ref, s.text, s.heading, isPsalm), bgDelay);
        bgDelay += 2500;
      });
    })
    .catch(function() {
      // Fallback: lectionary index references (MOD-06)
      _renderLectionaryFallback(el, usccbLink);
    });
}

// ── Lectionary Fallback (MOD-06) ──
// When readings API fails, show references from local lectionary-index.json
var _lectionaryCache = null;

function _loadLectionary() {
  if (_lectionaryCache) return Promise.resolve(_lectionaryCache);
  return fetch('/data/lectionary-index.json').then(function(r) { return r.json(); })
    .then(function(d) { _lectionaryCache = d; return d; })
    .catch(function() { return null; });
}

function _getLiturgicalCycleYear() {
  var year = getNow().getFullYear();
  // Liturgical year starts on Advent 1 of prior calendar year
  // Cycle: A = year%3===1, B = year%3===2, C = year%3===0
  var mod = year % 3;
  if (mod === 1) return 'A';
  if (mod === 2) return 'B';
  return 'C';
}

function _matchLectionaryKey(litcalEvents) {
  if (!litcalEvents || !litcalEvents.length) return null;
  var pick = litcalEvents.sort(function(a, b) { return (b.grade || 0) - (a.grade || 0); })[0];
  var key = pick.event_key || '';

  // Map known LitCal event keys to lectionary keys
  var keyMap = {
    'AshWednesday': 'ash_wednesday',
    'PalmSun': 'palm_sunday',
    'HolyThurs': 'holy_thursday',
    'GoodFri': 'good_friday',
    'EasterVigil': 'easter_vigil',
    'Easter': 'easter',
    'Easter2': 'easter_2',
    'Pentecost': 'pentecost',
    'Ascension': 'ascension',
    'ImmaculateConception': 'immaculate_conception',
    'ChristmasDay': 'christmas',
    'Christmas': 'christmas',
    'MaryMotherOfGod': 'mary_mother_of_god',
    'Epiphany': 'epiphany',
    'Assumption': 'assumption',
    'AllSaints': 'all_saints'
  };
  if (keyMap[key]) return { type: 'feast', key: keyMap[key] };

  // Try to match Sunday by season + week
  var season = (pick.liturgical_season || '').toLowerCase();
  var seasonMap = { 'advent': 'advent', 'lent': 'lent', 'easter': 'easter', 'easter_season': 'easter', 'ordinary_time': 'ordinary' };
  var mappedSeason = seasonMap[season];
  if (mappedSeason && pick.liturgical_week) {
    var sundayKey = mappedSeason + '_' + pick.liturgical_week;
    return { type: 'sunday', key: sundayKey };
  }

  // Christ the King
  if (key === 'ChristTheKing' || (pick.name && pick.name.indexOf('Christ the King') !== -1)) {
    return { type: 'sunday', key: 'christ_the_king' };
  }

  return null;
}

function _renderLectionaryFallback(el, usccbLink) {
  _loadLectionary().then(function(lect) {
    if (!lect) { el.innerHTML = usccbLink; return; }

    var litEvents = (window._litcalCache && window._litcalCache.events) || [];
    var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
    var todayEvents = litEvents.filter(function(e) { return e.month === m && e.day === d; });
    var match = _matchLectionaryKey(todayEvents);

    if (!match) { el.innerHTML = usccbLink; return; }

    var readings = null;
    if (match.type === 'feast') {
      readings = lect.feasts[match.key];
    } else if (match.type === 'sunday') {
      var cycle = _getLiturgicalCycleYear();
      readings = lect.sundays[cycle] && lect.sundays[cycle][match.key];
    }

    if (!readings) { el.innerHTML = usccbLink; return; }

    var html = '<div class="reading-fallback-note">Readings API unavailable \u2014 showing references from the lectionary</div>';
    var labels = [
      { key: 'first_reading', label: 'First Reading' },
      { key: 'psalm', label: 'Responsorial Psalm' },
      { key: 'second_reading', label: 'Second Reading' },
      { key: 'gospel', label: 'Gospel' }
    ];
    labels.forEach(function(item) {
      var ref = readings[item.key];
      if (!ref || ref === 'varies by cycle' || ref === 'varies') return;
      html += '<div class="reading-entry">'
        + '<div class="reading-entry-header"><div>'
        + '<div class="reading-heading">' + esc(item.label) + '</div>'
        + '<div class="reading-ref">' + esc(ref) + '</div>'
        + '</div></div></div>';
    });
    html += usccbLink;
    el.innerHTML = html;
  });
}

// ── Fetch Liturgical Day (local-first + API upgrade) ──
function fetchLiturgicalDay() {
  if (!config.FEATURES.litcal) return Promise.resolve(null);
  var now = getNow();
  var year = now.getFullYear();
  // In-memory cache — one fetch per session per year
  if (window._litcalCache && window._litcalCache.year === year) {
    return Promise.resolve(filterToday(window._litcalCache.events, now));
  }

  // Load local fallback first (instant from SW cache or disk)
  var localPromise = fetch('/data/litcal-' + year + '.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (d && d.litcal && !window._litcalCache) {
        window._litcalCache = { year: year, events: d.litcal, source: 'local' };
      }
      return d;
    })
    .catch(function() { return null; });

  // API upgrade (parallel, non-blocking — silently replaces local data)
  fetch(
    'https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + year,
    { signal: AbortSignal.timeout(10000) }
  )
  .then(function(resp) {
    if (!resp.ok) throw new Error('LitCal ' + resp.status);
    return resp.json();
  })
  .then(function(data) {
    if (data && data.litcal) {
      window._litcalCache = { year: year, events: data.litcal, source: 'api' };
    }
  })
  .catch(function() { /* API failure is non-fatal when local data exists */ });

  return localPromise.then(function() {
    if (window._litcalCache) {
      return filterToday(window._litcalCache.events, now);
    }
    // Neither local nor API worked yet — wait for API
    return fetch(
      'https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + year,
      { signal: AbortSignal.timeout(10000) }
    )
    .then(function(resp) {
      if (!resp.ok) throw new Error('LitCal ' + resp.status);
      return resp.json();
    })
    .then(function(data) {
      window._litcalCache = { year: year, events: data.litcal || [], source: 'api' };
      return filterToday(window._litcalCache.events, now);
    })
    .catch(function(e) {
      console.warn('[MassFinder] LitCal fetch failed:', e.message);
      return null;
    });
  });
}

// ── Filter Today ──
function filterToday(events, now) {
  var month = now.getMonth() + 1, day = now.getDate();
  return events.filter(function(evt) { return evt.month === month && evt.day === day; });
}

// ── Render Saint Card ──
function renderSaintCard(events) {
  var el = document.getElementById('saintOfDayCard');
  if (!el) return;
  var now = getNow();
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var dateLabel = months[now.getMonth()] + ' ' + now.getDate();

  // No LitCal data — fallback
  if (!events || !events.length) {
    el.innerHTML = '<div class="saint-card">'
      + '<div class="saint-feast">' + esc(dateLabel) + '</div>'
      + '<div class="saint-name" style="font-size:var(--text-base);font-family:var(--font-body);font-weight:var(--weight-regular);color:var(--color-text-secondary)">Could not load today\'s celebration</div>'
      + '</div>';
    return;
  }

  // Filter out vigil masses and plain weekdays if a saint/feast exists
  var meaningful = events.filter(function(e) { return !e.is_vigil_mass; });
  var saints = meaningful.filter(function(e) { return e.grade >= 1; });
  var pick = saints.length ? saints.sort(function(a, b) { return b.grade - a.grade; })[0] : meaningful[0];
  if (!pick) pick = events[0];

  // Grade label
  var gradeLabels = { 0: '', 1: 'Commemoration', 2: 'Optional Memorial', 3: 'Memorial', 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
  var rank = gradeLabels[pick.grade] || '';
  if (pick.holy_day_of_obligation) rank = (rank ? rank + ' \u00b7 ' : '') + 'Holy Day of Obligation';
  var feastLabel = rank ? (rank + ' \u00b7 ' + dateLabel) : dateLabel;

  // Liturgical color for card accent
  var color = (pick.color && pick.color[0]) || 'green';

  // Secondary celebrations (optional memorials alongside the weekday)
  var alsoToday = '';
  if (pick.grade === 0 && saints.length) {
    var others = saints.slice(0, 2).map(function(s) { return esc(s.name); });
    if (others.length) alsoToday = '<div class="saint-also">Also today: ' + others.join(', ') + '</div>';
  } else if (saints.length > 1) {
    var otherSaints = saints.filter(function(s) { return s !== pick; }).slice(0, 2).map(function(s) { return esc(s.name); });
    if (otherSaints.length) alsoToday = '<div class="saint-also">Also: ' + otherSaints.join(', ') + '</div>';
  }

  // SOT-02: Liturgical color indicator
  var colorMap = {
    purple: { hex: '#6B21A8', dark: '#A855F7', name: 'Purple', meaning: 'Penance & preparation' },
    red: { hex: '#DC2626', dark: '#EF4444', name: 'Red', meaning: 'Martyrs & the Holy Spirit' },
    white: { hex: '#94A3B8', dark: '#94A3B8', name: 'White', meaning: 'Joy & purity' },
    green: { hex: '#16A34A', dark: '#22C55E', name: 'Green', meaning: 'Growth & hope' },
    rose: { hex: '#DB2777', dark: '#EC4899', name: 'Rose', meaning: 'A brief respite in the penitential season' }
  };
  var colorInfo = colorMap[color] || colorMap.green;
  var colorLine = '<div class="saint-color">'
    + '<span class="saint-color-dot" style="background:' + colorInfo.hex + '"></span>'
    + esc(colorInfo.name) + ' \u2014 ' + esc(colorInfo.meaning)
    + '</div>';

  el.innerHTML = '<div class="saint-card" data-lit-color="' + esc(color) + '">'
    + '<div class="saint-feast">' + esc(feastLabel) + '</div>'
    + '<div class="saint-name">' + esc(pick.name) + '</div>'
    + colorLine
    + alsoToday
    + '<div id="saintVerse"></div>'
    + (typeof window._getDailyPrompt === 'function' ? '<div class="saint-prompt">' + esc(window._getDailyPrompt()) + '</div>' : '')
    + '</div>';

  // Fetch gospel acclamation verse async (non-blocking)
  var accRef = pick.readings && pick.readings.gospel_acclamation;
  if (accRef) fetchAcclamationVerse(accRef);
}

// ── BibleGet Book Map ──
var BIBLE_BOOK_MAP = {
  'Genesis': 'Gen', 'Exodus': 'Ex', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deut',
  'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1Sam', '2 Samuel': '2Sam',
  '1 Kings': '1Kgs', '2 Kings': '2Kgs', '1 Chronicles': '1Chr', '2 Chronicles': '2Chr',
  'Ezra': 'Ezra', 'Nehemiah': 'Neh', 'Tobit': 'Tob', 'Judith': 'Jdt', 'Esther': 'Est',
  '1 Maccabees': '1Macc', '2 Maccabees': '2Macc', 'Job': 'Job', 'Psalm': 'Ps', 'Proverbs': 'Prov',
  'Ecclesiastes': 'Eccl', 'Song of Songs': 'Song', 'Wisdom': 'Wis', 'Sirach': 'Sir',
  'Isaiah': 'Isa', 'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Baruch': 'Bar', 'Ezekiel': 'Ezek',
  'Daniel': 'Dan', 'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Am', 'Obadiah': 'Ob', 'Jonah': 'Jon',
  'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zep', 'Haggai': 'Hag',
  'Zechariah': 'Zech', 'Malachi': 'Mal', 'Matthew': 'Mt', 'Mark': 'Mk', 'Marc': 'Mk',
  'Luke': 'Lk', 'John': 'Jn', 'Acts': 'Acts', 'Romans': 'Rom',
  '1 Corinthians': '1Cor', '2 Corinthians': '2Cor', 'Galatians': 'Gal', 'Ephesians': 'Eph',
  'Philippians': 'Phil', 'Colossians': 'Col', '1 Thessalonians': '1Thess', '2 Thessalonians': '2Thess',
  '1 Timothy': '1Tim', '2 Timothy': '2Tim', 'Titus': 'Titus', 'Philemon': 'Phlm',
  'Hebrews': 'Heb', 'Hewbrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pet', '2 Peter': '2Pet',
  '1 John': '1Jn', '2 John': '2Jn', '3 John': '3Jn', 'Jude': 'Jude', 'Revelation': 'Rev'
};

// ── Convert Reference to BibleGet format ──
function convertRefToBibleGet(ref) {
  if (!ref) return null;
  ref = ref.replace(/^Cf\.\s+/i, '');
  if (ref.indexOf('|') !== -1) ref = ref.split('|')[0];
  ref = ref.replace(/(\d+)[a-d]/g, '$1');
  ref = ref.replace(/\(\d+\)/g, '');
  var m = ref.match(/^(\d?\s*[A-Za-z]+)\s+/);
  if (!m) return ref;
  var book = m[1].trim();
  var rest = ref.slice(m[0].length).replace(/\s+/g, '');
  return (BIBLE_BOOK_MAP[book] || book) + rest;
}

// ── Clean BibleGet text ──
function cleanBibleGetText(text) {
  return text.replace(/<\/?(?:pof|poi|poil|po|sm)>/g, '').replace(/\n/g, ' ').trim();
}

// ── Fetch Acclamation Verse ──
function fetchAcclamationVerse(ref) {
  var el = document.getElementById('saintVerse');
  if (!el) return Promise.resolve();
  var query = convertRefToBibleGet(ref);
  if (!query) return Promise.resolve();
  return fetch(
    'https://query.bibleget.io/v3/?query=' + encodeURIComponent(query) + '&version=NABRE',
    { signal: AbortSignal.timeout(8000) }
  )
  .then(function(resp) {
    if (!resp.ok) return;
    return resp.json();
  })
  .then(function(data) {
    if (!data || !data.results || !data.results.length) return;
    var text = data.results.map(function(v) { return cleanBibleGetText(v.text); }).join(' ');
    if (!text) return;
    el.innerHTML = '<div class="saint-verse">'
      + '"' + esc(text) + '"'
      + '<span class="saint-verse-ref"> \u2014 ' + esc(ref) + '</span>'
      + '</div>';
  })
  .catch(function(e) { /* silent — verse is optional */ });
}

// ── Enhance with BibleGet ──
function enhanceWithBibleGet(textEl, ref, fallbackText, heading, isPsalm) {
  var query = convertRefToBibleGet(ref);
  if (!query) return Promise.resolve();
  var cacheKey = 'mf-bg-' + query;
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) { textEl.innerHTML = cached; return Promise.resolve(); }
  } catch (e) { /* noop */ }
  var url = 'https://query.bibleget.io/v3/?query=' + encodeURIComponent(query) + '&version=NABRE';
  return fetch(url, { signal: AbortSignal.timeout(8000) })
  .then(function(resp) {
    if (!resp.ok) return;
    return resp.json();
  })
  .then(function(data) {
    if (!data) return;
    if (data.errors && data.errors.length) { console.warn('[BibleGet] API errors for:', ref, data.errors.map(function(e) { return e.errMessage || e; })); }
    if (!data.results || !data.results.length) {
      console.warn('[BibleGet] No results for:', ref, '(likely rate-limited)');
      if (isPsalm && fallbackText) { textEl.innerHTML = formatPsalmFallback(fallbackText); }
      return;
    }

    var html = '';
    if (isPsalm) {
      var refrain = extractPsalmRefrain(fallbackText);
      if (refrain) html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
      var stanzaBreaks = parseStanzaBreaks(ref);
      html += renderPsalmVerses(data.results, stanzaBreaks);
    } else {
      var intro = extractIntroLine(fallbackText);
      var conclusion = extractConclusionLine(fallbackText);
      if (intro) html += '<span class="reading-intro">' + esc(intro) + '</span>';
      html += renderProseVerses(data.results);
      if (conclusion) html += '<span class="reading-conclusion">' + esc(conclusion) + '</span>';
    }
    // SLV-02: LORD → small-caps (typographic convention)
    html = html.replace(/\bLORD\b/g, '<span class="sc">LORD</span>');
    textEl.innerHTML = html;
    try { localStorage.setItem(cacheKey, html); } catch (e) { /* noop */ }
  })
  .catch(function(e) {
    console.error('[BibleGet] Error for:', ref, e.message || e);
    if (isPsalm && fallbackText) { textEl.innerHTML = formatPsalmFallback(fallbackText); }
  });
}

// ── Render Prose Verses ──
function renderProseVerses(verses) {
  var html = '';
  verses.forEach(function(v) {
    var text = v.text || '';
    text = text.replace(/<\/?(?:pof|poi|poil|po|sm)>/g, '').replace(/\n/g, ' ').trim();
    if (!text) return;
    html += '<p class="reading-verse"><span class="verse-num">' + v.chapter + ':' + v.verse + '</span> ' + esc(text) + '</p>';
  });
  return html;
}

// ── Parse Stanza Breaks ──
function parseStanzaBreaks(ref) {
  if (!ref) return {};
  var breaks = {};
  var m = ref.match(/[\d][\d\s,\-]+$/);
  if (!m) return breaks;
  var ranges = m[0].split(',');
  for (var i = 0; i < ranges.length - 1; i++) {
    var range = ranges[i].trim();
    var dash = range.indexOf('-');
    var endVerse = dash !== -1 ? range.substring(dash + 1).trim() : range.trim();
    breaks[parseInt(endVerse)] = true;
  }
  return breaks;
}

// ── Render Psalm Verses ──
function renderPsalmVerses(verses, stanzaBreaks) {
  var html = '';
  var stanza = [];
  verses.forEach(function(v) {
    var text = v.text || '';
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    lines.forEach(function(line) {
      var cleaned = line.replace(/<\/?(?:sm)>/g, '').trim();
      if (!cleaned) return;
      var isIndent = cleaned.indexOf('<poi>') !== -1 || cleaned.indexOf('<poil>') !== -1;
      cleaned = cleaned.replace(/<\/?(?:pof|poi|poil|po)>/g, '').trim();
      if (!cleaned) return;
      var cls = 'psalm-verse-line';
      if (isIndent) cls += ' psalm-indent';
      stanza.push('<span class="' + cls + '">' + esc(cleaned) + '</span>');
    });
    var vNum = parseInt(v.verse);
    if (stanzaBreaks[vNum] && stanza.length) {
      html += '<span class="psalm-verse">' + stanza.join('') + '</span>';
      html += '<span class="psalm-r-marker">R.</span>';
      stanza = [];
    }
  });
  if (stanza.length) html += '<span class="psalm-verse">' + stanza.join('') + '</span>';
  return html;
}

// ── Extract Psalm Refrain ──
function extractPsalmRefrain(raw) {
  if (!raw) return '';
  var m = raw.match(/R[\.\:]\s*(?:\([^)]+\)\s*)?([^\.!]+[\.!]?)/i);
  return m ? m[1].trim() : '';
}

// ── Extract Intro Line ──
function extractIntroLine(raw) {
  if (!raw) return '';
  var lines = raw.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  for (var i = 0; i < Math.min(3, lines.length); i++) {
    if (/^A reading from\b/i.test(lines[i]) || /^A letter of\b/i.test(lines[i]) || /^The beginning of\b/i.test(lines[i]))
      return lines[i];
  }
  return '';
}

// ── Extract Conclusion Line ──
function extractConclusionLine(raw) {
  if (!raw) return '';
  var lines = raw.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  for (var i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
    if (/^The (word|Gospel) of the Lord\.?\s*$/i.test(lines[i])) return lines[i];
  }
  return '';
}

// ── Format Psalm Fallback (when BibleGet fails/rate-limits) ──
function formatPsalmFallback(raw) {
  if (!raw) return '';
  var refrain = extractPsalmRefrain(raw);
  var html = '';
  if (refrain) html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
  var body = raw;
  if (refrain) {
    body = body.replace(refrain, '').trim();
    body = body.replace(/^R[\.\:]\s*/i, '').trim();
  }
  var stanzas = body.split(/\n\s*\n/).filter(function(s) { return s.trim().length > 0; });
  for (var i = 0; i < stanzas.length; i++) {
    var lines = stanzas[i].trim().split(/\n/).filter(function(l) { return l.trim().length > 0; });
    var stanzaHtml = '';
    for (var j = 0; j < lines.length; j++) {
      stanzaHtml += '<span class="psalm-verse-line">' + esc(lines[j].trim()) + '</span>';
    }
    html += '<span class="psalm-verse">' + stanzaHtml + '</span>';
    if (i < stanzas.length - 1) {
      html += '<span class="psalm-r-marker">R.</span>';
    }
  }
  return html;
}

// ── Toggle Reading ──
function toggleReading(id) {
  var el = document.getElementById(id);
  if (el) el.classList.toggle('expanded');
}

// ── Format Reading Text ──
function formatReadingText(raw, heading) {
  if (!raw) return '';
  var h = (heading || '').toLowerCase();
  var isPsalm = h.indexOf('psalm') !== -1 || h.indexOf('responsorial') !== -1;
  if (isPsalm) return formatPsalm(raw);
  return formatReading(raw);
}

// ── Format Psalm ──
function formatPsalm(raw) {
  var lines = raw.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  if (!lines.length) return '';
  var refrain = '', startIdx = 0;
  var rMatch = lines[0].match(/^R[\.\:\s]+\s*(.+)$/i);
  if (rMatch) { refrain = rMatch[1].trim(); startIdx = 1; }
  else { refrain = lines[0]; startIdx = 1; }
  var html = '';
  if (refrain) html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
  var stanza = [];
  for (var i = startIdx; i < lines.length; i++) {
    var line = lines[i];
    var isRef = /^R[\.\:\s]/i.test(line) || (refrain && line.replace(/^R[\.\:\s]+\s*/i, '').trim() === refrain);
    if (isRef) {
      if (stanza.length) {
        html += '<span class="psalm-verse">' + stanza.map(function(l) { return '<span class="psalm-verse-line">' + esc(l) + '</span>'; }).join('') + '</span>';
        stanza = [];
      }
      html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
      continue;
    }
    if (!line) {
      if (stanza.length) {
        html += '<span class="psalm-verse">' + stanza.map(function(l) { return '<span class="psalm-verse-line">' + esc(l) + '</span>'; }).join('') + '</span>';
        stanza = [];
      }
      continue;
    }
    stanza.push(line);
  }
  if (stanza.length) html += '<span class="psalm-verse">' + stanza.map(function(l) { return '<span class="psalm-verse-line">' + esc(l) + '</span>'; }).join('') + '</span>';
  return html;
}

// ── Format Reading ──
function formatReading(raw) {
  var paragraphs = raw.split(/\n\s*\n/).filter(Boolean);
  return paragraphs.map(function(para) {
    var lines = para.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    var formatted = lines.map(function(line) {
      if (/^A reading from\b/i.test(line) || /^A letter of\b/i.test(line) || /^The beginning of\b/i.test(line))
        return '<span class="reading-intro">' + esc(line) + '</span>';
      if (/^The (word|Gospel) of the Lord\.?\s*$/i.test(line))
        return '<span class="reading-conclusion">' + esc(line) + '</span>';
      if (/^(Praise to you|Thanks be to God)[\.,]?\s*/i.test(line))
        return '<span class="reading-conclusion">' + esc(line) + '</span>';
      var vm = line.match(/^(\d{1,3})\s+(.+)$/);
      if (vm) return '<span class="verse-num">' + vm[1] + '</span>' + esc(vm[2]);
      var processed = esc(line);
      processed = processed.replace(/(\.\s+)(\d{1,3})\s+/g, '$1<span class="verse-num">$2</span> ');
      return processed;
    });
    return '<p class="reading-para">' + formatted.join('<br>') + '</p>';
  }).join('');
}

// ── Export Liturgical Calendar ICS ──
function exportLitCalICS(preset) {
  preset = preset || 'feasts';
  var filterLabels = {
    hdo: 'Holy Days of Obligation',
    feasts: 'Solemnities\\, Feasts\\, and Holy Days of Obligation',
    lent: 'Lent and Holy Week',
    all: 'All Liturgical Observances'
  };
  var fileSuffixes = { hdo: '-holy-days', feasts: '-feasts', lent: '-lent', all: '-all' };

  var doExport = function() {
    var events = (window._litcalCache && window._litcalCache.events) || [];
    var year = new Date().getFullYear();
    var gradeLabels = { 3: 'Memorial', 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
    var items = events.filter(function(e) {
      if (e.is_vigil_mass) return false;
      if (preset === 'hdo') return !!e.holy_day_of_obligation;
      if (preset === 'lent') {
        var s = (e.liturgical_season || '').toUpperCase();
        return s === 'LENT' || s === 'HOLY_WEEK' || s === 'EASTER_TRIDUUM';
      }
      if (preset === 'all') return e.grade >= 3;
      // default: feasts
      return e.grade >= 4 || e.holy_day_of_obligation;
    });
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//MassFinder//Catholic Liturgical Calendar//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:Catholic Liturgical Calendar ' + year,
      'X-WR-CALDESC:' + (filterLabels[preset] || filterLabels.feasts)
    ];
    function icsDate(y, m, d) {
      return String(y) + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    }
    function nextDay(y, m, d) {
      var dt = new Date(y, m - 1, d + 1);
      return icsDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    }
    items.forEach(function(e) {
      var typeStr = e.holy_day_of_obligation ? 'Holy Day of Obligation' : (gradeLabels[e.grade] || '');
      var y = e.year || year;
      var m = e.month || 1;
      var d = e.day || 1;
      lines.push('BEGIN:VEVENT');
      lines.push('DTSTART;VALUE=DATE:' + icsDate(y, m, d));
      lines.push('DTEND;VALUE=DATE:' + nextDay(y, m, d));
      lines.push('SUMMARY:' + (e.name || '').replace(/,/g, '\\,'));
      if (typeStr) lines.push('DESCRIPTION:' + typeStr.replace(/,/g, '\\,'));
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'liturgical-calendar-' + year + (fileSuffixes[preset] || '') + '.ics';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (!window._litcalCache) {
    return fetchLiturgicalDay().then(doExport);
  }
  doExport();
  return Promise.resolve();
}

// ── C-04: Read Aloud for daily readings ──
var _readingSpeaking = false;

function _readingReadAloud(btn) {
  if (_readingSpeaking) {
    speechSynthesis.cancel();
    _readingSpeaking = false;
    document.querySelectorAll('.reading-listen-btn.speaking').forEach(function(b) {
      b.classList.remove('speaking');
    });
    return;
  }
  var text = btn.getAttribute('data-text');
  if (!text) return;
  var utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.lang = 'en-US';
  utt.onend = function() {
    _readingSpeaking = false;
    btn.classList.remove('speaking');
  };
  speechSynthesis.speak(utt);
  _readingSpeaking = true;
  btn.classList.add('speaking');
}

module.exports = {
  getLiturgicalEvents: getLiturgicalEvents,
  getLiturgicalEventsFromLitCal: getLiturgicalEventsFromLitCal,
  fetchReadings: fetchReadings,
  fetchLiturgicalDay: fetchLiturgicalDay,
  filterToday: filterToday,
  renderSaintCard: renderSaintCard,
  renderLiturgicalCalendar: renderLiturgicalCalendar,
  toggleReading: toggleReading,
  formatReadingText: formatReadingText,
  formatPsalm: formatPsalm,
  formatReading: formatReading,
  BIBLE_BOOK_MAP: BIBLE_BOOK_MAP,
  convertRefToBibleGet: convertRefToBibleGet,
  cleanBibleGetText: cleanBibleGetText,
  fetchAcclamationVerse: fetchAcclamationVerse,
  enhanceWithBibleGet: enhanceWithBibleGet,
  renderProseVerses: renderProseVerses,
  parseStanzaBreaks: parseStanzaBreaks,
  renderPsalmVerses: renderPsalmVerses,
  extractPsalmRefrain: extractPsalmRefrain,
  extractIntroLine: extractIntroLine,
  extractConclusionLine: extractConclusionLine,
  exportLitCalICS: exportLitCalICS,
  setLiturgicalSeason: setLiturgicalSeason,
  checkSolemnityPause: checkSolemnityPause,
  renderHDOBanner: renderHDOBanner,
  updateHDOBadge: updateHDOBadge,
  renderFastingBanner: renderFastingBanner,
  readingReadAloud: _readingReadAloud,
};
