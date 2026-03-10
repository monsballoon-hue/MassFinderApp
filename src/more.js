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

  // -- What's Happening: unified chronological event list --
  var upcoming = getUpcomingYC();
  var allCommunityEvents = state.eventsData.filter(function(e) { return e.category !== 'yc' && isEventActive(e); }).map(function(e) {
    var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
    return Object.assign({}, e, { churchName: ch ? ch.name : '', churchId: e.church_id, isYC: false });
  });
  var ycMapped = upcoming.map(function(e) {
    var r = resolveYC(e);
    return Object.assign({}, e, { churchName: r.locName || r.churchName, isYC: true });
  });
  var allEvents = ycMapped.concat(allCommunityEvents).sort(function(a, b) {
    return (a.date || '9999').localeCompare(b.date || '9999');
  }).slice(0, 8);

  var whSection = document.getElementById('whatsHappeningSection');
  var whList = document.getElementById('whEventsList');
  if (whSection && whList && allEvents.length) {
    whSection.style.display = 'block';
    whList.innerHTML = allEvents.map(function(e) {
      var dateStr = e.date ? fmtYCDate(e.date) : (e.day ? (DAY_NAMES[e.day] || e.day) : '');
      var timeStr = e.time ? ' \u00b7 ' + fmt12(e.time) : '';
      var ycBadge = e.isYC ? ' <span class="evt-yc-badge">YC</span>' : '';
      return '<div class="wh-event-card" onclick="openEventDetail(\'' + esc(e.id) + '\')">'
        + '<div class="wh-event-date">' + esc(dateStr) + timeStr + '</div>'
        + '<div class="wh-event-title">' + esc(e.title) + ycBadge + '</div>'
        + '<div class="wh-event-church">' + esc(displayName(e.churchName)) + '</div>'
        + '</div>';
    }).join('');
  }

  // Daily CCC Reflection (Change 16)
  if (typeof window.renderDailyReflection === 'function') window.renderDailyReflection();

  // Liturgical calendar
  var lituEl = document.getElementById('liturgicalContent');
  if (lituEl) {
    renderLiturgicalCalendar(lituEl);
  }

  // Prayer Tools grid
  var exam = require('./examination.js');
  var ptGrid = document.getElementById('prayerToolsGrid');
  if (ptGrid) {
    var confStatus = exam.getConfessionStatus();
    var confLabel = confStatus ? 'Last Confession: ' + confStatus.daysAgo + (confStatus.daysAgo === 1 ? ' day' : ' days') + ' ago' : '';

    var ptCards = [
      { id: 'rosary', icon: '\u271E', title: 'Guided Rosary', subtitle: 'Mysteries, meditations, bead counter', action: 'openRosary()', active: true },
      { id: 'examination', icon: '\u2696\uFE0F', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for Reconciliation', action: 'openExamination()', active: true },
      { id: 'stations', icon: '\u271D\uFE0F', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : 'Coming soon', action: '', active: false }
    ];
    ptGrid.innerHTML = ptCards.map(function(c) {
      return '<div class="prayer-tool-card' + (c.active ? '' : ' coming-soon') + '"'
        + (c.active ? ' onclick="' + c.action + '" role="button" tabindex="0"' : '')
        + '>'
        + '<div class="prayer-tool-icon">' + c.icon + '</div>'
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
        + '<div class="prayer-tool-subtitle">' + esc(c.subtitle) + '</div>'
        + '</div>'
        + (c.active ? '<span class="prayer-tool-chevron" aria-hidden="true">\u203A</span>' : '')
        + '</div>';
    }).join('');

    // Seasonal nudge above prayer tools (Change 13)
    var season = document.documentElement.getAttribute('data-season');
    var ptSection = document.getElementById('prayerToolsSection');
    if (ptSection && (season === 'lent' || season === 'advent')) {
      var existingNudge = ptSection.querySelector('.seasonal-nudge');
      if (!existingNudge) {
        var nudge = document.createElement('div');
        nudge.className = 'seasonal-nudge';
        nudge.textContent = season === 'lent'
          ? 'It\u2019s Lent \u2014 a season of prayer, fasting, and almsgiving. These tools can help.'
          : 'It\u2019s Advent \u2014 a season of preparation and joyful expectation. These tools can help.';
        ptSection.insertBefore(nudge, ptGrid);
      }
    }

    // Prayer activity summary (Change 19)
    try {
      var prayerLog = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
      var thisMonth = getNow().toISOString().slice(0, 7);
      var monthEntries = prayerLog.filter(function(e) { return e.date.startsWith(thisMonth); });
      if (monthEntries.length > 0) {
        var rosaryCount = monthEntries.filter(function(e) { return e.type === 'rosary'; }).length;
        var examCount = monthEntries.filter(function(e) { return e.type === 'examination'; }).length;
        var parts = [];
        if (rosaryCount) parts.push('Rosary \u00d7' + rosaryCount);
        if (examCount) parts.push('Examination \u00d7' + examCount);
        if (parts.length) {
          var summaryEl = document.createElement('div');
          summaryEl.className = 'prayer-activity';
          summaryEl.innerHTML = '<span class="prayer-activity-label">This month:</span> ' + parts.join(' \u00b7 ');
          ptGrid.parentNode.insertBefore(summaryEl, ptGrid.nextSibling);
        }
      }
    } catch (e) {}
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
    var curSize = localStorage.getItem('mf-text-size') || 'default';
    footer.innerHTML = '<div class="footer-controls">'
      + '<button id="theme-toggle-btn" class="theme-toggle" onclick="window.toggleTheme()">'
      + (isDark ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode')
      + '</button>'
      + '<div class="text-size-control">'
      + '<span class="text-size-label">Text size</span>'
      + '<div class="text-size-btns">'
      + '<button class="text-size-btn' + (curSize === 'small' ? ' active' : '') + '" onclick="window.setTextSize(\'small\')" aria-label="Small text">A</button>'
      + '<button class="text-size-btn text-size-btn--md' + (curSize === 'default' ? ' active' : '') + '" onclick="window.setTextSize(\'default\')" aria-label="Default text">A</button>'
      + '<button class="text-size-btn text-size-btn--lg' + (curSize === 'large' ? ' active' : '') + '" onclick="window.setTextSize(\'large\')" aria-label="Large text">A</button>'
      + '</div></div></div>'
      + '<div>MassFinder v2</div>';
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
