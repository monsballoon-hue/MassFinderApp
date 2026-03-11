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

  // Daily CCC Reflection (Change 16)
  if (typeof window.renderDailyReflection === 'function') window.renderDailyReflection();

  // Daily Summa Wisdom (DAT-08)
  if (typeof window.renderDailySumma === 'function') window.renderDailySumma();

  // Prayer Tools grid
  var exam = require('./examination.js');
  var ptGrid = document.getElementById('prayerToolsGrid');
  if (ptGrid) {
    var confStatus = exam.getConfessionStatus();
    var confLabel = confStatus ? 'Last Confession: ' + confStatus.daysAgo + (confStatus.daysAgo === 1 ? ' day' : ' days') + ' ago' : '';

    var ptCards = [
      { id: 'rosary', title: 'Guided Rosary', subtitle: 'Mysteries, meditations, bead counter', action: 'openRosary()', active: true },
      { id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for Reconciliation', action: 'openExamination()', active: true },
      { id: 'stations', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Traditional Lenten devotion' : '14 stations of prayer', action: 'openStations()', active: true },
      { id: 'novena', title: 'Novena Tracker', subtitle: _getNovenaSubtitle(), action: 'openNovena()', active: true },
      { id: 'explore', title: 'Explore', subtitle: 'CCC, Scripture, and Baltimore connections', action: 'openExplore(\'ccc\',\'1\')', active: true }
    ];
    ptGrid.innerHTML = ptCards.map(function(c) {
      return '<div class="prayer-tool-card' + (c.active ? '' : ' coming-soon') + '"'
        + (c.active ? ' onclick="' + c.action + '" role="button" tabindex="0"' : '')
        + '>'
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
        + '<div class="prayer-tool-subtitle">' + esc(c.subtitle) + '</div>'
        + '</div>'
        + (c.active ? '<span class="prayer-tool-chevron" aria-hidden="true">\u203A</span>' : '')
        + '</div>';
    }).join('');

    // Prayer activity tracker lives on the Saved tab now
  }

  // Devotional guides
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    devotEl.innerHTML = DEVOTIONAL_GUIDES.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        var groupIcon = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
        return '<details class="devot-card"><summary>' + groupIcon + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      return renderGuide(g, false);
    }).join('');

    // Wire term definition taps (UX-07)
    devotions.initTermClicks(devotEl);

    // Wire Scripture reference taps (B-06)
    var refs = require('./refs.js');
    refs.initRefTaps(devotEl);

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

  // Footer — Settings card + version
  var footer = document.getElementById('moreFooter');
  if (footer) {
    footer.innerHTML = '<div class="more-settings-card" onclick="openSettings()" role="button" tabindex="0">'
      + '<div class="more-settings-body">'
      + '<div class="more-settings-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>'
      + '<div><div class="more-settings-title">Settings</div>'
      + '<div class="more-settings-sub">Theme, text size, notifications, privacy</div></div>'
      + '</div>'
      + '<span class="prayer-tool-chevron" aria-hidden="true">\u203A</span>'
      + '</div>'
      + '<div onclick="window._devTap && window._devTap()" style="cursor:default">MassFinder v2</div>';
  }

  // Trigger readings and saint card fetches
  fetchReadings();
  fetchLiturgicalDay().then(function(events) {
    setLiturgicalSeason(events);
    renderHDOBanner(events);
    renderFastingBanner(events);
    updateHDOBadge(events);
    renderSaintCard(events);
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
  web3submit: forms.web3submit,
  // More tab own exports
  renderMore: renderMore,
  dismissInstallCard: dismissInstallCard,
  // Re-export devotions for external consumers
  renderGuide: renderGuide,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: forms.CORR_PLACEHOLDERS,
};
