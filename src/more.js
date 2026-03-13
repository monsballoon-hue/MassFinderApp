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
    var confLabel = confStatus ? 'Last Confession: ' + confStatus.daysAgo + (confStatus.daysAgo === 1 ? ' day' : ' days') + ' ago' : '';

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
      rosary: 'var(--color-accent)',
      examination: '#6B21A8',
      stations: isLentSeason() ? '#6B21A8' : 'var(--color-text-secondary)',
      novena: 'var(--color-accent)'
    };
    var ptBgColors = {
      rosary: 'var(--color-accent-pale)',
      examination: 'rgba(107,33,168,0.08)',
      stations: isLentSeason() ? 'rgba(107,33,168,0.08)' : 'var(--color-surface-hover)',
      novena: 'var(--color-accent-pale)'
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
      { id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for Reconciliation', action: 'openExamination()', active: true },
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

  // Devotional guides
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    var allGuideHtml = DEVOTIONAL_GUIDES.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        var groupIcon = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
        return '<details class="devot-card"><summary>' + groupIcon + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      return renderGuide(g, false);
    });
    // FGP-02: Progressive disclosure — show top 3, hide rest
    var visibleCount = 3;
    var visibleHtml = allGuideHtml.slice(0, visibleCount).join('');
    var hiddenHtml = allGuideHtml.slice(visibleCount).join('');
    devotEl.innerHTML = visibleHtml;
    if (hiddenHtml) {
      devotEl.innerHTML += '<div class="devot-overflow" id="devotOverflow" style="display:none">'
        + hiddenHtml + '</div>'
        + '<button class="devot-show-all" id="devotShowAll" onclick="toggleDevotOverflow()">'
        + 'Show all guides <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>'
        + '</button>';
    }

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

// FGP-02: Toggle devotional guides overflow
function toggleDevotOverflow() {
  var overflow = document.getElementById('devotOverflow');
  var btn = document.getElementById('devotShowAll');
  if (!overflow || !btn) return;
  var isHidden = overflow.style.display === 'none';
  overflow.style.display = isHidden ? '' : 'none';
  btn.innerHTML = isHidden
    ? 'Show fewer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="18 15 12 9 6 15"/></svg>'
    : 'Show all guides <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>';
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
  toggleDevotOverflow: toggleDevotOverflow,
  // Re-export devotions for external consumers
  renderGuide: renderGuide,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: forms.CORR_PLACEHOLDERS,
};
