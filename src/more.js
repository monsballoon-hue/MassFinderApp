// src/more.js — More tab orchestrator (imports devotions.js + forms.js)
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');
var devotions = require('./devotions.js');
var forms = require('./forms.js');

var DAY_NAMES = config.DAY_NAMES;
var displayName = utils.displayName;
var getNow = utils.getNow;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var isEventActive = utils.isEventActive;
var isLentSeason = utils.isLentSeason;
var state = data.state;

var DEVOTIONAL_GUIDES = devotions.DEVOTIONAL_GUIDES;
var renderGuide = devotions.renderGuide;

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
  var renderLiturgicalCalendar = readings.renderLiturgicalCalendar;
  var fetchReadings = readings.fetchReadings;
  var fetchLiturgicalDay = readings.fetchLiturgicalDay;
  var setLiturgicalSeason = readings.setLiturgicalSeason;
  var renderHDOBanner = readings.renderHDOBanner;
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
    if (document.cookie.split('; ').some(function(c) { return c.startsWith('pf_more_install_dismissed='); })) return;

    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var shareIcon = '<svg class="ios-share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7-7 7 7"/><path d="M5 17h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1z"/></svg>';

    var bodyHtml, actionHtml = '';
    if (isIOS) {
      var isCriOS = /CriOS/.test(ua);
      if (isCriOS) bodyHtml = 'Tap <strong>\u22EF</strong> then <strong>\u201CAdd to Home Screen\u201D</strong> for the full app experience \u2014 faster loads, offline access, and no browser toolbar.';
      else bodyHtml = 'Tap ' + shareIcon + ' then <strong>\u201CAdd to Home Screen\u201D</strong> for the full app experience \u2014 faster loads, offline access, and no browser toolbar.';
    } else {
      bodyHtml = 'Get the full experience \u2014 faster loads, offline access, and no browser toolbar.';
      actionHtml = '<button class="mic-action" id="micInstallBtn">Install App</button>';
    }

    slot.innerHTML = '<div class="more-install-card" id="moreInstallCardInner">'
      + '<button class="mic-close" onclick="dismissMoreInstall()" aria-label="Dismiss">\u2715</button>'
      + '<div class="mic-title">Install MassFinder</div>'
      + '<div class="mic-body">' + bodyHtml + '</div>'
      + actionHtml
      + '</div>';

    if (!isIOS) {
      var btn = document.getElementById('micInstallBtn');
      if (btn && window._deferredInstallPrompt) {
        btn.addEventListener('click', function() {
          window._deferredInstallPrompt.prompt();
          window._deferredInstallPrompt.userChoice.then(function() { window._deferredInstallPrompt = null; dismissMoreInstall(); });
        });
      } else if (btn) {
        btn.style.display = 'none';
      }
    }
  })();

  // -- ABOUT STAT GRID --
  (function() {
    var grid = document.getElementById('aboutStatGrid');
    if (!grid) return;
    var svcCount = state.allChurches.reduce(function(n, c) { return n + (c.services || []).length; }, 0);
    var today = getNow();
    var totalDays = 0, checkedCount = 0, verCount = 0;
    state.allChurches.forEach(function(c) {
      var v = c.validation;
      if (v && v.last_checked) {
        var d = new Date(v.last_checked + 'T00:00:00');
        totalDays += Math.max(0, Math.floor((today - d) / (1000 * 60 * 60 * 24)));
        checkedCount++;
      }
      if (v && v.status === 'verified') verCount++;
    });
    var avgDays = checkedCount ? Math.round(totalDays / checkedCount) : null;
    var avgLabel = avgDays === null ? '-' : avgDays + ' days';
    var todayStr = today.toISOString().slice(0, 10);
    var activeEvtCount = state.eventsData.filter(function(e) {
      if (e.dates && e.dates.length) { var last = e.dates[e.dates.length - 1]; return (e.end_date || last) >= todayStr; }
      var exp = e.end_date || e.date; if (!exp) return true; return exp >= todayStr;
    }).length;
    grid.innerHTML =
      '<div class="stat-card"><div class="stat-value">' + state.allChurches.length + '</div><div class="stat-label">Churches</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + svcCount.toLocaleString() + '</div><div class="stat-label">Services</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + avgLabel + '</div><div class="stat-label">Avg. Data Age</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + activeEvtCount + '</div><div class="stat-label">Active Events</div></div>';
  })();

  // -- What's Happening: unified YC + Community events --
  var upcoming = getUpcomingYC();
  var allCommunityEvents = state.eventsData.filter(function(e) { return e.category !== 'yc' && isEventActive(e); }).map(function(e) {
    var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
    return Object.assign({}, e, { churchName: ch ? ch.name : '', churchId: e.church_id });
  });
  var hasAnyEvents = upcoming.length || allCommunityEvents.length;
  var whSection = document.getElementById('whatsHappeningSection');
  if (whSection && hasAnyEvents) {
    whSection.style.display = 'block';

    var favSet = new Set(state.favorites);
    var seenParishes = new Set();
    var ycShow = [];
    for (var yi = 0; yi < upcoming.length; yi++) {
      var ye = upcoming[yi];
      if (seenParishes.has(ye.church_id)) continue;
      seenParishes.add(ye.church_id);
      ycShow.push(ye);
      if (ycShow.length >= 4) break;
    }
    var ycSeeAll = document.getElementById('whYCSeeAll');
    if (ycSeeAll) ycSeeAll.style.display = upcoming.length > 4 ? 'block' : 'none';
    document.getElementById('whYCList').innerHTML = ycShow.length ? ycShow.map(function(e) {
      var r = resolveYC(e);
      var isFavE = favSet.has(e.church_id);
      var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
      var dist = ch ? getDist(ch, state.userLat, state.userLng) : null;
      var isNear = !isFavE && dist !== null && dist <= 10;
      var indicator = isFavE ? '<div class="wh-event-fav">\u2665 Saved</div>' : isNear ? '<div class="wh-event-near">\uD83D\uDCCD ' + fmtDist(dist) + '</div>' : '';
      var calSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      return '<div class="wh-event-card" onclick="openEventDetail(\'' + e.id + '\')">'
        + indicator
        + '<div class="wh-event-date">' + fmtYCDate(e.date) + (e.time ? ' \u00b7 ' + fmt12(e.time) : '') + '</div>'
        + '<div class="wh-event-title">' + esc(e.title) + '</div>'
        + '<div class="wh-event-church">' + esc(displayName(r.locName || r.churchName)) + '</div>'
        + '<div class="saved-evt-actions" style="margin-top:var(--space-2)">'
        + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + calSvg + '</button>'
        + '<button class="saved-evt-btn" onclick="expressInterest(\'' + esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
        + '</div></div>';
    }).join('') : '<p class="wh-empty">No upcoming YC events.</p>';

    var commShow = allCommunityEvents.slice(0, 10);
    window._moreEvents = allCommunityEvents.slice(0, 10);
    var commCards = commShow.length ? commShow.map(function(e, idx) {
      var ch = state.allChurches.find(function(x) { return x.id === e.churchId; });
      var dist = ch ? getDist(ch, state.userLat, state.userLng) : null;
      var near = dist !== null && dist <= 10 ? '<div class="wh-event-near">\uD83D\uDCCD ' + fmtDist(dist) + '</div>' : '';
      var cCalSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      return '<div class="wh-event-card" onclick="openEventDetail(\'' + esc(e.id) + '\')">'
        + near
        + (e.date ? '<div class="wh-event-date">' + esc(e.date) + '</div>' : e.day ? '<div class="wh-event-date">' + esc(DAY_NAMES[e.day] || e.day) + (e.time ? ' \u00b7 ' + fmt12(e.time) : '') + '</div>' : '')
        + '<div class="wh-event-title">' + esc(e.title) + '</div>'
        + '<div class="wh-event-church">' + esc(displayName(e.churchName)) + '</div>'
        + (e.notes ? '<div class="wh-event-time">' + esc(e.notes) + '</div>' : '')
        + '<div class="saved-evt-actions" style="margin-top:var(--space-2)">'
        + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + cCalSvg + '</button>'
        + '<button class="saved-evt-btn" onclick="expressInterest(\'' + esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
        + '</div></div>';
    }).join('') : '';
    var commEl = document.getElementById('whCommunityList');
    if (commCards && commShow.length > 3) {
      commEl.innerHTML = '<div class="wh-ticker">' + commCards + commCards + '</div>';
    } else {
      commEl.innerHTML = commCards || '<p class="wh-empty">No upcoming events.</p>';
    }

    setTimeout(function() {
      var ycList = document.getElementById('whYCList');
      if (ycList && commEl) {
        var h = ycList.offsetHeight;
        if (h > 100) {
          commEl.style.maxHeight = h + 'px';
          commEl.style.overflow = 'hidden';
        }
      }
    }, 100);
  }

  // Liturgical calendar
  var lituEl = document.getElementById('liturgicalContent');
  if (lituEl) {
    renderLiturgicalCalendar(lituEl);
  }

  // Prayer Tools grid
  var ptGrid = document.getElementById('prayerToolsGrid');
  if (ptGrid) {
    var ptCards = [
      { id: 'rosary', icon: '\u271E', title: 'Guided Rosary', desc: 'Pray the Rosary with mysteries, meditations, and bead counter', action: 'openRosary()', label: 'Begin', active: true },
      { id: 'examination', icon: '\u2696\uFE0F', title: 'Examination of Conscience', desc: 'Prepare for the Sacrament of Reconciliation', label: 'Coming Soon', active: false },
      { id: 'stations', icon: '\u271D\uFE0F', title: 'Stations of the Cross', desc: 'Walk the Via Dolorosa with guided meditations', label: isLentSeason() ? 'Lenten Devotion' : 'Coming Soon', active: false }
    ];
    ptGrid.innerHTML = ptCards.map(function(c) {
      return '<div class="prayer-tool-card' + (c.active ? '' : ' coming-soon') + '">'
        + '<div class="prayer-tool-icon">' + c.icon + '</div>'
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
        + '<div class="prayer-tool-desc">' + esc(c.desc) + '</div>'
        + '</div>'
        + (c.active
          ? '<button class="prayer-tool-btn" onclick="' + c.action + '">' + c.label + '</button>'
          : '<span class="prayer-tool-badge">' + c.label + '</span>')
        + '</div>';
    }).join('');
  }

  // Devotional guides
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    devotEl.innerHTML = DEVOTIONAL_GUIDES.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        return '<details class="devot-card"><summary><span class="devot-icon">' + g.icon + '</span><span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      return renderGuide(g, false);
    }).join('');

    // Wire CCC reference taps
    devotEl.querySelectorAll('strong').forEach(function(el) {
      var m = el.textContent.trim().match(/^CCC ([\d\u2013\-]+):?$/);
      if (!m) return;
      el.classList.add('ccc-ref');
      var num = m[1];
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        window.openCCC(num);
      });
    });
  }

  // Footer
  var footer = document.getElementById('moreFooter');
  if (footer) {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    footer.innerHTML = '<button id="theme-toggle-btn" class="theme-toggle" onclick="window.toggleTheme()">'
      + (isDark ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode')
      + '</button><div>MassFinder v2</div>';
  }

  // Trigger readings and saint card fetches
  fetchReadings();
  fetchLiturgicalDay().then(function(events) {
    setLiturgicalSeason(events);
    renderHDOBanner(events);
    updateHDOBadge(events);
    renderSaintCard(events);
    renderLiturgicalCalendar();
    var lentBtn = document.getElementById('icsLentBtn');
    if (lentBtn) {
      var season = document.documentElement.getAttribute('data-season');
      lentBtn.style.display = (season === 'lent') ? '' : 'none';
    }
  });

  window._moreRendered = true;
}

// ── dismissMoreInstall ──
function dismissMoreInstall() {
  var el = document.getElementById('moreInstallCardInner');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.2s'; setTimeout(function() { el.parentElement.innerHTML = ''; }, 250); }
  var d = new Date(); d.setDate(d.getDate() + 90);
  document.cookie = 'pf_more_install_dismissed=1;expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
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
  web3submit: forms.web3submit,
  // More tab own exports
  renderMore: renderMore,
  dismissMoreInstall: dismissMoreInstall,
  // Re-export devotions for external consumers
  renderGuide: renderGuide,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: forms.CORR_PLACEHOLDERS,
};
