// src/more.js — More tab orchestrator (imports devotions.js + forms.js)
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');
var devotions = require('./devotions.js');
var forms = require('./forms.js');

var DAY_NAMES = config.DAY_NAMES;
var displayName = utils.displayName;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var isEventActive = utils.isEventActive;
var isLentSeason = utils.isLentSeason;
var state = data.state;

var DEVOTIONAL_GUIDES = devotions.DEVOTIONAL_GUIDES;
var renderGuide = devotions.renderGuide;

function _getNovenaSubtitle() {
  try {
    var all = JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
    var active = Object.keys(all);
    if (active.length === 1) {
      var novena = require('./novena.js');
      var t = all[active[0]];
      var dayNum = novena._computeCurrentDay(t) + 1;
      return 'Day ' + dayNum + ' of 9';
    }
    if (active.length > 1) return active.length + ' novenas in progress';
  } catch (e) {}
  return '9-day guided prayer';
}

function _getRosarySubtitle() {
  var mysteries = { sunday: 'Glorious', monday: 'Joyful', tuesday: 'Sorrowful', wednesday: 'Glorious', thursday: 'Luminous', friday: 'Sorrowful', saturday: 'Joyful' };
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var today = days[new Date().getDay()];
  return mysteries[today] + ' Mysteries today';
}

// ── Holy Week Guide Data (SOT-05) ──
var HOLY_WEEK_GUIDE = {
  PalmSun: {
    title: 'Palm Sunday',
    subtitle: 'The Lord\u2019s entrance into Jerusalem',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 3c0 4-3 7-6 9m7-9c0 4 3 7 6 9M12 3v18"/></svg>',
    body: '<p>Palm Sunday opens Holy Week with the blessing and procession of palms, recalling Christ\u2019s triumphal entry into Jerusalem. The crowd spread palms and cloaks before Him, crying \u201cHosanna!\u201d Yet the same week would bring His Passion and death.</p>'
      + '<p>The liturgy includes the longest Gospel reading of the year \u2014 the full Passion narrative. It is a day of joy shadowed by sorrow, inviting us to walk with Christ through the coming days.</p>',
    action: 'Find Mass near you \u2192',
    filter: 'weekend'
  },
  MonHolyWeek: {
    title: 'Monday of Holy Week',
    subtitle: 'The days of preparation deepen',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>The early days of Holy Week are marked by intensifying preparation. The Gospel readings recount events leading to the Passion \u2014 the anointing at Bethany, the prediction of betrayal, and Jesus\u2019s final teachings.</p>'
      + '<p>Many parishes offer additional weekday Masses, Confession times, and Lenten devotions during these days. It is a time for quiet reflection and spiritual readiness.</p>',
    action: 'Find Mass near you \u2192',
    searchTerm: 'Mass'
  },
  TueHolyWeek: {
    title: 'Tuesday of Holy Week',
    subtitle: 'Christ foretells His Passion',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>As the Paschal Triduum draws near, the Church\u2019s liturgy becomes more solemn. Tuesday\u2019s Gospel recounts Jesus telling His disciples that one of them will betray Him and that Peter will deny Him three times.</p>'
      + '<p>These readings invite honest self-examination. The Sacrament of Confession is particularly encouraged during these final days of Lent.</p>',
    action: 'Find Confession near you \u2192',
    filter: 'confession'
  },
  WedHolyWeek: {
    title: 'Wednesday of Holy Week',
    subtitle: 'Judas agrees to betray Jesus',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>On this day the Gospel recounts Judas Iscariot going to the chief priests and agreeing to hand Jesus over for thirty pieces of silver. The shadow of the Cross falls heavily over the remaining hours.</p>'
      + '<p>Wednesday of Holy Week is the last day before the Sacred Paschal Triduum. If you have not yet been to Confession this Lent, today is an important day to seek out the sacrament.</p>',
    action: 'Find Confession near you \u2192',
    filter: 'confession'
  },
  HolyThurs: {
    title: 'Holy Thursday',
    subtitle: 'Mass of the Lord\u2019s Supper tonight',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 15v6M17.5 9c0-3-2.5-6-5.5-6S6.5 6 6.5 9c0 3.5 5.5 6 5.5 6s5.5-2.5 5.5-6z"/></svg>',
    body: '<p>The Sacred Paschal Triduum begins with the evening Mass of the Lord\u2019s Supper. This liturgy commemorates three gifts Christ gave on the night before He died: the Eucharist, the priesthood, and the commandment of love through the washing of the feet.</p>'
      + '<p>After Mass, the Blessed Sacrament is carried in procession to the altar of repose, where the faithful keep vigil in prayer \u2014 recalling Christ\u2019s agony in the Garden of Gethsemane. Churches remain open late for this solemn watch.</p>',
    action: 'Find evening Mass near you \u2192',
    filter: 'weekend'
  },
  GoodFri: {
    title: 'Good Friday',
    subtitle: 'The Passion and death of the Lord',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>Good Friday is the most solemn day of the Church year. There is no Mass \u2014 the only day this occurs. The afternoon liturgy includes the reading of the Passion according to John, the solemn intercessions, and the veneration of the Cross.</p>'
      + '<p>It is a day of fasting and complete abstinence from meat. The faithful are invited to observe silence, pray the Stations of the Cross, and enter into the mystery of Christ\u2019s sacrifice for our salvation.</p>',
    action: 'Find Stations of the Cross \u2192',
    searchTerm: 'Stations'
  },
  EasterVigil: {
    title: 'Holy Saturday',
    subtitle: 'The Easter Vigil tonight \u2014 the greatest liturgy of the year',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2c1.5 2.5 3 5 3 7.5a3 3 0 0 1-6 0C9 7 10.5 4.5 12 2z"/><line x1="12" y1="12" x2="12" y2="20"/></svg>',
    body: '<p>Holy Saturday is a day of profound quiet. The Church waits at the Lord\u2019s tomb. There is no Mass during the day \u2014 the tabernacle stands empty, the altar bare.</p>'
      + '<p>After nightfall, the Easter Vigil begins with the blessing of the new fire and the lighting of the Paschal Candle. The Church processes from darkness into light, reads the great stories of salvation history, and welcomes new members through Baptism, Confirmation, and First Eucharist. Then the Alleluia, silent since Ash Wednesday, rings out again.</p>',
    action: 'Find the Easter Vigil near you \u2192',
    filter: 'weekend'
  },
  Easter: {
    title: 'Easter Sunday',
    subtitle: 'He is risen! Alleluia!',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    body: '<p>\u201cThis is the day the Lord has made; let us rejoice and be glad in it.\u201d The Resurrection of Jesus Christ is the central event of the Christian faith and the foundation of everything the Church believes and proclaims.</p>'
      + '<p>Easter is not just a day \u2014 it is a season of fifty days, running from today through Pentecost Sunday. The Alleluia returns, the vestments are white and gold, and the Church celebrates with overflowing joy. Attend Mass with your family and enter into the mystery of new life.</p>',
    action: 'Find Easter Mass near you \u2192',
    filter: 'weekend'
  }
};

// ── Seasonal Moment Zone (SOT-01) ──
// Priority: 1=day-specific, 2=week-specific, 3=season-specific, 4=month-specific
// Max 2 visible cards at any time
function _renderSeasonalMoment(events) {
  var el = document.getElementById('seasonalMoment');
  if (!el) return;
  var esc = require('./utils.js').esc;
  var switchTab = require('./ui.js').switchTab;

  var candidates = [];

  // SOT-05: Holy Week day-by-day guide
  if (events && events.length) {
    for (var i = 0; i < events.length; i++) {
      var key = events[i].event_key || '';
      var hw = HOLY_WEEK_GUIDE[key];
      if (hw) {
        var actionHtml = '';
        if (hw.filter) {
          actionHtml = '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=' + hw.filter + ']\');if(c)c.click()">' + hw.action + '</div>';
        } else if (hw.searchTerm) {
          actionHtml = '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var si=document.getElementById(\'searchInput\');if(si){si.value=\'' + hw.searchTerm + '\';si.dispatchEvent(new Event(\'input\'))}">' + hw.action + '</div>';
        }
        var chevSvg = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        candidates.push({
          priority: 1,
          html: '<details class="seasonal-card">'
            + '<summary>'
            + '<div class="seasonal-card-icon">' + hw.icon + '</div>'
            + '<div class="seasonal-card-body">'
            + '<div class="seasonal-card-title">' + esc(hw.title) + '</div>'
            + '<div class="seasonal-card-subtitle">' + esc(hw.subtitle) + '</div>'
            + '</div>'
            + chevSvg
            + '</summary>'
            + '<div class="seasonal-card-expanded">'
            + hw.body
            + actionHtml
            + '</div>'
            + '</details>'
        });
        break; // Only one Holy Week card per day
      }
    }
  }

  // Future: SOT-06 (Easter Alleluia), SOT-07 (Divine Mercy), SOT-08 (Pentecost),
  // SOT-09 (Monthly Devotion), SOT-10 (O Antiphons) will push candidates here

  // Sort by priority (1 = highest), take top 2
  candidates.sort(function(a, b) { return a.priority - b.priority; });
  var top = candidates.slice(0, 2);

  el.innerHTML = top.map(function(c) { return c.html; }).join('');
}

// ── renderMore ──
function renderMore() {
  // Lazy requires
  var events = require('./events.js');
  var getUpcomingYC = events.getUpcomingYC;
  var resolveYC = events.resolveYC;
  var fmtYCDate = events.fmtYCDate;
  var downloadEventIcal = events.downloadEventIcal;
  var render = require('./render.js');
  var openDetail = render.openDetail;
  var showToast = render.showToast;
  var readings = require('./readings.js');
  var fetchReadings = readings.fetchReadings;
  var fetchLiturgicalDay = readings.fetchLiturgicalDay;
  var setLiturgicalSeason = readings.setLiturgicalSeason;
  var renderHDOBanner = readings.renderHDOBanner;
  var renderFastingBanner = readings.renderFastingBanner;
  var updateHDOBadge = readings.updateHDOBadge;
  var renderSaintCard = readings.renderSaintCard;
  var switchTab = require('./ui.js').switchTab;

  var langCount = new Set();
  state.allChurches.forEach(function(c) {
    c.services.forEach(function(s) { if (s.language) langCount.add(s.language); });
  });

  // -- PWA INSTALL CARD --
  (function() {
    var slot = document.getElementById('moreInstallCard');
    if (!slot) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Dismiss tracking: after 3 dismissals, suppress for 30 days
    var dismissCount = parseInt(localStorage.getItem('mf-install-dismiss-count') || '0', 10);
    var dismissUntil = localStorage.getItem('mf-install-dismiss-until');
    if (dismissUntil && new Date().toISOString().slice(0, 10) < dismissUntil) return;

    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isCriOS = /CriOS/.test(ua);
    var isAndroid = /Android/.test(ua);

    var stepsHtml = '';
    if (isIOS && !isCriOS) {
      stepsHtml = '<div class="install-steps">'
        + '<div class="install-step"><div class="install-step-num">1</div><div class="install-step-text">Tap the <strong>Share</strong> button <svg class="install-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7-7 7 7"/><path d="M5 17h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1z"/></svg> at the bottom of your screen</div></div>'
        + '<div class="install-step"><div class="install-step-num">2</div><div class="install-step-text">Scroll down and tap <strong>Add to Home Screen</strong></div></div>'
        + '<div class="install-step"><div class="install-step-num">3</div><div class="install-step-text">Tap <strong>Add</strong> in the top right</div></div>'
        + '</div>';
    } else if (isIOS && isCriOS) {
      stepsHtml = '<div class="install-steps">'
        + '<div class="install-step"><div class="install-step-num">1</div><div class="install-step-text">Tap the <strong>\u22EF</strong> menu in the top right</div></div>'
        + '<div class="install-step"><div class="install-step-num">2</div><div class="install-step-text">Tap <strong>Add to Home Screen</strong></div></div>'
        + '<div class="install-step"><div class="install-step-num">3</div><div class="install-step-text">Tap <strong>Add</strong> to confirm</div></div>'
        + '</div>';
    } else if (isAndroid) {
      stepsHtml = '<div class="install-steps">'
        + '<div class="install-step"><div class="install-step-num">1</div><div class="install-step-text">Tap <strong>Install</strong> below, or tap the <strong>\u22EE</strong> menu at the top right</div></div>'
        + '<div class="install-step"><div class="install-step-num">2</div><div class="install-step-text">Tap <strong>Add to Home Screen</strong> or <strong>Install App</strong></div></div>'
        + '</div>';
    } else {
      stepsHtml = '<div class="install-steps">'
        + '<div class="install-step"><div class="install-step-num">1</div><div class="install-step-text">Look for the install icon <strong>\u2B07</strong> in your browser\'s address bar</div></div>'
        + '<div class="install-step"><div class="install-step-num">2</div><div class="install-step-text">Click <strong>Install</strong> when prompted</div></div>'
        + '</div>';
    }

    var androidBtn = (isAndroid && window._deferredInstallPrompt)
      ? '<button class="install-btn" id="micInstallBtn">Install MassFinder</button>'
      : '';

    slot.innerHTML = '<div class="install-card" id="moreInstallCardInner">'
      + '<button class="install-close" onclick="dismissInstallCard()" aria-label="Dismiss">\u2715</button>'
      + '<div class="install-header">'
      + '<div class="install-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="24" height="24"><path d="M12 18v-12"/><path d="M5 12l7 7 7-7"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg></div>'
      + '<div>'
      + '<div class="install-title">Add MassFinder to your home screen</div>'
      + '<div class="install-subtitle">Open it like any app \u2014 instant access, no browser needed</div>'
      + '</div>'
      + '</div>'
      + stepsHtml
      + '<div class="install-guide-link" onclick="openInstallGuide()">Show me how \u2192</div>'
      + androidBtn
      + '</div>';

    if (isAndroid && window._deferredInstallPrompt) {
      var btn = document.getElementById('micInstallBtn');
      if (btn) {
        btn.addEventListener('click', function() {
          window._deferredInstallPrompt.prompt();
          window._deferredInstallPrompt.userChoice.then(function() {
            window._deferredInstallPrompt = null;
            dismissInstallCard();
          });
        });
      }
    }
  })();

  // Daily Formation (MT-02: combined Baltimore Q&A + Summa) — disabled for v1, re-enable when ready
  // if (typeof window.renderDailyFormation === 'function') window.renderDailyFormation();

  // Prayer Tools grid
  var exam = require('./examination.js');
  var ptGrid = document.getElementById('prayerToolsGrid');
  if (ptGrid) {
    var confStatus = exam.getConfessionStatus();
    var confLabel = confStatus ? (confStatus.daysAgo === 0 ? 'Last confession: today' : confStatus.daysAgo === 1 ? 'Last confession: yesterday' : 'Last confession: ' + confStatus.daysAgo + ' days ago') : '';

    // EMT-03-A: SVG icons for prayer tools
    var ptIcons = {
      // Rosary: circle of beads with cross — simplified rosary silhouette
      rosary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="7"/><circle cx="12" cy="3" r="1.2"/><circle cx="5.5" cy="6.5" r="1.2"/><circle cx="5.5" cy="13.5" r="1.2"/><circle cx="18.5" cy="6.5" r="1.2"/><circle cx="18.5" cy="13.5" r="1.2"/><line x1="12" y1="17" x2="12" y2="20"/><line x1="10" y1="19" x2="14" y2="19"/></svg>',
      // Examination: heart with magnifying glass — self-examination
      examination: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      // Stations: Latin cross — matches existing cross SVG in stations.js
      stations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
      // Novena: candle flame
      novena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 2.5 3 5 3 7.5a3 3 0 0 1-6 0C9 7 10.5 4.5 12 2z"/><rect x="10" y="12" width="4" height="9" rx="1"/><line x1="10" y1="15" x2="14" y2="15"/></svg>'
    };
    var ptColors = {
      rosary: 'var(--color-sacred)',
      examination: 'var(--color-sacred)',
      stations: isLentSeason() ? 'var(--color-accent)' : 'var(--color-sacred)',
      novena: 'var(--color-sacred)'
    };
    var ptBgColors = {
      rosary: 'var(--color-sacred-pale)',
      examination: 'var(--color-sacred-pale)',
      stations: isLentSeason() ? 'var(--color-accent-pale)' : 'var(--color-sacred-pale)',
      novena: 'var(--color-sacred-pale)'
    };

    // EMT-03-B: Contextual "today" highlight
    var promotedId = '';
    if (isLentSeason()) {
      promotedId = 'stations';
    } else if (new Date().getDay() === 5) {
      promotedId = 'rosary';
    } else if (confStatus && confStatus.daysAgo > 30) {
      promotedId = 'examination';
    }

    // EMT-03-C: Active progress subtitle styling
    var ptSubtitleClass = {
      rosary: '',
      examination: confStatus && confStatus.daysAgo <= 7 ? 'prayer-tool-subtitle--active' : (confStatus && confStatus.daysAgo > 30 ? 'prayer-tool-subtitle--nudge' : ''),
      stations: '',
      novena: ''
    };
    // Enhance novena subtitle with day fractions
    var novSub = _getNovenaSubtitle();
    if (novSub.indexOf('in progress') !== -1) ptSubtitleClass.novena = 'prayer-tool-subtitle--active';

    var ptCards = [
      { id: 'rosary', title: 'Guided Rosary', subtitle: _getRosarySubtitle(), action: 'openRosary()', active: true },
      { id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for confession', action: 'openExamination()', active: true },
      { id: 'stations', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : '14 stations of prayer', action: 'openStations()', active: true },
      { id: 'novena', title: 'Novena Tracker', subtitle: novSub, action: 'openNovena()', active: true }
    ];
    ptGrid.innerHTML = ptCards.map(function(c) {
      var isPromoted = c.id === promotedId;
      var iconHtml = ptIcons[c.id]
        ? '<div class="prayer-tool-icon" style="background:' + ptBgColors[c.id] + ';color:' + ptColors[c.id] + '">' + ptIcons[c.id] + '</div>'
        : '';
      var subClass = 'prayer-tool-subtitle' + (ptSubtitleClass[c.id] ? ' ' + ptSubtitleClass[c.id] : '');
      return '<div class="prayer-tool-card' + (isPromoted ? ' prayer-tool-card--promoted' : '') + '"'
        + ' onclick="' + c.action + '" role="button" tabindex="0"'
        + (isPromoted ? ' style="border-left-color:' + ptColors[c.id] + '"' : '')
        + '>'
        + iconHtml
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
        + '<div class="' + subClass + '">' + esc(c.subtitle) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    // EMT-05: Library teaser — standalone card below grid
    var libTeaser = document.getElementById('libraryTeaser');
    if (libTeaser) {
      libTeaser.innerHTML = '<div class="library-teaser">'
        + '<div class="prayer-tool-icon" style="background:var(--color-surface-hover);color:var(--color-text-secondary)">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>'
        + '</div>'
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">Catholic Library</div>'
        + '<div class="prayer-tool-subtitle">Bible, Catechism & Catholic classics \u2014 coming soon</div>'
        + '</div>'
        + '</div>';
    }
  }

  // Devotional guides — pin current season's guide to top
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    var currentSeason = document.documentElement.getAttribute('data-season') || 'ordinary';
    var seasonalGuides = [];
    var otherGuides = [];
    DEVOTIONAL_GUIDES.forEach(function(g) {
      if (g.season && g.season === currentSeason) seasonalGuides.push(g);
      else if (g.season && g.season !== currentSeason) {} // hide non-current seasonal guides
      else otherGuides.push(g);
    });
    var orderedGuides = seasonalGuides.concat(otherGuides);
    var allGuideHtml = orderedGuides.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        var groupIcon = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
        return '<details class="devot-card devot-card--group">'
          + '<summary>' + groupIcon + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      var html = renderGuide(g, false);
      if (g.season === currentSeason) {
        html = html.replace('class="devot-card', 'class="devot-card devot-card--seasonal');
      }
      return html;
    });
    devotEl.innerHTML = allGuideHtml.join('');

    // Wire term definition taps (UX-07)
    devotions.initTermClicks(devotEl);

    // Wire Scripture reference taps (B-06)
    var refs = require('./refs.js');
    refs.initRefTaps(devotEl);

    // Wire inline .ccc-ref spans to use snippet system (openCCC is v1-gated)
    var snippet = require('./snippet.js');
    devotEl.querySelectorAll('.ccc-ref').forEach(function(el) {
      var numMatch = el.textContent.trim().match(/CCC\s*(\d+)/);
      if (!numMatch) return;
      var refNum = numMatch[1];
      el.removeAttribute('onclick');
      el.classList.add('ref-tap', 'ref-tap--ccc');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', refNum, el);
      });
    });

    // Wire CCC reference taps — replace <strong> with ref-tap pill spans
    devotEl.querySelectorAll('strong').forEach(function(el) {
      var m = el.textContent.trim().match(/^CCC ([\d\u2013\-]+):?$/);
      if (!m) return;
      var num = m[1];
      var span = document.createElement('span');
      span.className = 'ref-tap ref-tap--ccc';
      span.textContent = 'CCC\u00A0' + num;
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', 'Catechism paragraph ' + num);
      span.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', num, span);
      });
      el.parentNode.replaceChild(span, el);
    });
  }

  // Footer — simple link rows + version
  var footer = document.getElementById('moreFooter');
  if (footer) {
    footer.innerHTML = '<div class="more-footer-links">'
      + '<div class="more-footer-link more-footer-link--disabled"><span>Weekly Email</span><span class="more-footer-soon">Coming soon</span></div>'
      + '<button class="more-footer-link" onclick="openSettings()"><span>Settings</span><span class="more-footer-chevron">\u203A</span></button>'
      + '</div>'
      + '<div onclick="window._devTap && window._devTap()" style="cursor:default" class="more-version">MassFinder v2</div>';
  }

  // Trigger readings and saint card fetches
  fetchReadings();
  fetchLiturgicalDay().then(function(events) {
    setLiturgicalSeason(events);
    renderHDOBanner(events);
    renderFastingBanner(events);
    updateHDOBadge(events);
    renderSaintCard(events);
    _renderSeasonalMoment(events);
  });

  window._moreRendered = true;
}

// ── dismissInstallCard ──
function dismissInstallCard() {
  var el = document.getElementById('moreInstallCardInner');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(function() { if (el.parentElement) el.parentElement.innerHTML = ''; }, 250);
  }
  var count = parseInt(localStorage.getItem('mf-install-dismiss-count') || '0', 10) + 1;
  localStorage.setItem('mf-install-dismiss-count', String(count));
  if (count >= 3) {
    var d = new Date(); d.setDate(d.getDate() + 30);
    localStorage.setItem('mf-install-dismiss-until', d.toISOString().slice(0, 10));
  }
}

module.exports = {
  // Re-export forms for app.js window bindings
  expressInterest: forms.expressInterest,
  verifyOk: forms.verifyOk,
  showCorrectionForm: forms.showCorrectionForm,
  selectCorrPill: forms.selectCorrPill,
  submitCorrection: forms.submitCorrection,
  showMoreCorrection: forms.showMoreCorrection,
  selectMoreCorrPill: forms.selectMoreCorrPill,
  submitMoreCorrection: forms.submitMoreCorrection,
  selectFbType: forms.selectFbType,
  submitFeedback: forms.submitFeedback,
  submitSettingsContact: forms.submitSettingsContact,
  web3submit: forms.web3submit,
  // More tab own exports
  renderMore: renderMore,
  dismissInstallCard: dismissInstallCard,
  // Re-export devotions for external consumers
  renderGuide: renderGuide,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: forms.CORR_PLACEHOLDERS,
};
