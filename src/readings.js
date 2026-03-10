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
    if (localStorage.getItem('bg_date') !== today) {
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.slice(0, 3) === 'bg_' && k !== 'bg_date') toRemove.push(k);
      }
      toRemove.forEach(function(k) { localStorage.removeItem(k); });
      localStorage.setItem('bg_date', today);
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
  document.documentElement.setAttribute('data-season', season);
  var morePanel = document.getElementById('panelMore');
  if (morePanel) morePanel.setAttribute('data-season', season);
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
  }).sort(function(a, b) { return a.date - b.date; }).slice(0, 2);
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
      if (data.title) html += '<div class="reading-day-name">' + esc(data.title) + '</div>';
      html += sections.map(function(s, i) {
        var id = 'reading-entry-' + i;
        var hasText = s.text && s.text.length > 0;
        return '<div class="reading-entry" id="' + id + '" ' + (hasText ? 'onclick="toggleReading(\'' + id + '\')"' : '') + '>'
          + '<div class="reading-entry-header">'
          + '<div>'
          + '<div class="reading-heading">' + esc(s.heading) + '</div>'
          + (s.ref ? '<div class="reading-ref">' + esc(s.ref) + '</div>' : '')
          + '</div>'
          + (hasText ? chevron : '')
          + '</div>'
          + (hasText ? '<div class="reading-text" id="reading-text-' + i + '">' + formatReadingText(s.text, s.heading) + '</div>' : '')
          + '</div>';
      }).join('');
      html += '<div class="reading-copyright">Scripture texts from the New American Bible, Revised Edition \u00a9 2010, 1991, 1986, 1970 Confraternity of Christian Doctrine, Washington, D.C.</div>';
      html += usccbLink;
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
    .catch(function(e) {
      el.innerHTML = usccbLink;
    });
}

// ── Fetch Liturgical Day (LitCal API) ──
function fetchLiturgicalDay() {
  if (!config.FEATURES.litcal) return Promise.resolve(null);
  var now = getNow();
  var year = now.getFullYear();
  // In-memory cache — one fetch per session per year
  if (window._litcalCache && window._litcalCache.year === year) {
    return Promise.resolve(filterToday(window._litcalCache.events, now));
  }
  return fetch(
    'https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + year,
    { signal: AbortSignal.timeout(10000) }
  )
  .then(function(resp) {
    if (!resp.ok) throw new Error('LitCal ' + resp.status);
    return resp.json();
  })
  .then(function(data) {
    window._litcalCache = { year: year, events: data.litcal || [] };
    return filterToday(window._litcalCache.events, now);
  })
  .catch(function(e) {
    console.warn('[MassFinder] LitCal fetch failed:', e.message);
    return null;
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

  // Season subtitle for ordinary weekdays
  var subtitle = '';
  if (pick.grade === 0 && pick.liturgical_season_lcl) {
    subtitle = pick.liturgical_season_lcl;
  }

  // Secondary celebrations (optional memorials alongside the weekday)
  var alsoToday = '';
  if (pick.grade === 0 && saints.length) {
    var others = saints.slice(0, 2).map(function(s) { return esc(s.name); });
    if (others.length) alsoToday = '<div class="saint-also">Also today: ' + others.join(', ') + '</div>';
  } else if (saints.length > 1) {
    var otherSaints = saints.filter(function(s) { return s !== pick; }).slice(0, 2).map(function(s) { return esc(s.name); });
    if (otherSaints.length) alsoToday = '<div class="saint-also">Also: ' + otherSaints.join(', ') + '</div>';
  }

  el.innerHTML = '<div class="saint-card" data-lit-color="' + esc(color) + '">'
    + '<div class="saint-feast">' + esc(feastLabel) + '</div>'
    + '<div class="saint-name">' + esc(pick.name) + '</div>'
    + (subtitle ? '<div class="saint-subtitle">' + esc(subtitle) + '</div>' : '')
    + alsoToday
    + '<div id="saintVerse"></div>'
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
  var cacheKey = 'bg_' + query;
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) { console.log('[BibleGet] Cache HIT:', ref, '->', query); textEl.innerHTML = cached; return Promise.resolve(); }
  } catch (e) { /* noop */ }
  var url = 'https://query.bibleget.io/v3/?query=' + encodeURIComponent(query) + '&version=NABRE';
  console.log('[BibleGet] Fetching:', ref, '->', url);
  return fetch(url, { signal: AbortSignal.timeout(8000) })
  .then(function(resp) {
    console.log('[BibleGet] Response:', ref, 'status=' + resp.status);
    if (!resp.ok) return;
    return resp.json();
  })
  .then(function(data) {
    if (!data) return;
    if (data.errors && data.errors.length) { console.warn('[BibleGet] API errors for:', ref, data.errors.map(function(e) { return e.errMessage || e; })); }
    if (!data.results || !data.results.length) { console.warn('[BibleGet] No results for:', ref, '(likely rate-limited)'); return; }
    console.log('[BibleGet] Got', data.results.length, 'verses for:', ref);

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
    textEl.innerHTML = html;
    try { localStorage.setItem(cacheKey, html); } catch (e) { /* noop */ }
  })
  .catch(function(e) { console.error('[BibleGet] Error for:', ref, e.message || e); });
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
  renderHDOBanner: renderHDOBanner,
  updateHDOBadge: updateHDOBadge,
};
