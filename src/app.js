// src/app.js — Entry point
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');
var render = require('./render.js');
var events = require('./events.js');
var map = require('./map.js');
var readings = require('./readings.js');
var ui = require('./ui.js');
var saved = require('./saved.js');
var more = require('./more.js');
var location_ = require('./location.js');
var ccc = require('./ccc.js');
var refs = require('./refs.js');
var rosary = require('./rosary.js');
var examination = require('./examination.js');
var installGuide = require('./install-guide.js');

var state = data.state;

// ── Daily Micro-Prompts (Layer 1 — inline, no API) ──
var DAILY_PROMPTS = {
  lent: [
    'What one thing can you offer God today?',
    'Is there someone you need to forgive?',
    'How has prayer shaped your Lent so far?',
    'What attachment is God asking you to release?',
    'Have you checked in with someone who is struggling?',
    'Where did you see God at work yesterday?',
    'What scripture passage has stayed with you this week?',
    'How can you serve someone in your parish today?',
    'What small sacrifice can you make before dinner tonight?',
    'Are you making time for silence in your day?',
    'What grace are you asking for this Lent?',
    'Is there a habit you need to bring to Confession?',
    'How is fasting changing your perspective?',
    'What does the Cross mean to you today?',
    'Have you prayed for your parish priest this week?',
    'What fruit of the Spirit do you most need right now?',
    'How can you practice patience today?',
    'What would it look like to give more generously this week?',
    'Where is God inviting you to grow?',
    'Take a moment to thank God for three specific things.',
    'What prayer are you returning to again and again this Lent?',
    'How can you be more present to your family today?',
    'Is there a comfort you\u2019re clinging to instead of God?',
    'Who in your life needs your prayers most right now?',
    'What would it mean to truly trust God with your worries?',
    'How has God surprised you recently?',
    'What does dying to self look like in your daily routine?',
    'Have you read the Gospel for today? What stood out?',
    'Is there an act of mercy you can perform before the day ends?',
    'What would your Lent look like if you started fresh today?',
    'How can you bring the peace of Christ to a difficult situation?',
    'What fear is keeping you from deeper conversion?',
    'Have you thanked someone who has helped you grow in faith?',
    'What does humility ask of you today?',
    'How can you honor the Sabbath more intentionally this week?',
    'What wound are you asking Jesus to heal?',
    'Is there a grudge weighing on your heart? Can you release it?',
    'How is God speaking to you through the people around you?',
    'What does it mean to pick up your cross today?',
    'Spend one minute in silence. What does God place on your heart?'
  ],
  advent: [
    'What are you waiting for this Advent?',
    'How can you make room for Christ today?',
    'Is there a relationship that needs reconciliation before Christmas?',
    'What does hope look like in your life right now?',
    'How can you bring joy to someone today?',
    'What is God preparing you for?',
    'Have you spent time in quiet prayer this week?',
    'How can you simplify your preparations and focus on what matters?',
    'What gift of yourself can you offer someone?',
    'Where do you need God\u2019s peace most?',
    'How can you slow down and savor this season?',
    'What does it mean to watch and wait with expectation?',
    'Is there someone lonely who could use your company?',
    'What would Mary\u2019s trust look like in your life today?',
    'How can you make your home a place of peace this week?',
    'What are you most hopeful for this Christmas?',
    'Have you told someone what their friendship means to you?',
    'What darkness in the world can you bring light to?',
    'How is God asking you to say yes today?',
    'Take a moment to pray for those who are grieving this season.'
  ],
  ordinary: [
    'What are you grateful for today?',
    'How can you live your faith more fully this week?',
    'Is there someone who needs your encouragement today?',
    'What virtue is God calling you to practice?',
    'Take a moment to offer your day to God.',
    'How can you be a better listener today?',
    'What beauty in creation has caught your eye recently?',
    'Is there a saint whose example speaks to your life right now?',
    'How can you bring more joy to ordinary moments?',
    'What one thing can you do today to love your neighbor better?'
  ]
};

function _getDailyPrompt() {
  var season = document.documentElement.getAttribute('data-season');
  var pool = DAILY_PROMPTS[season] || DAILY_PROMPTS.ordinary;
  var dayOfYear = Math.floor((utils.getNow().getTime() - new Date(utils.getNow().getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
}

// Check if any events today (now → midnight) at favorited churches
function _hasTodayEventsAtFavs() {
  if (!state.eventsData || !state.favorites.length) return false;
  var today = utils.getNow().toISOString().slice(0, 10);
  var favSet = {};
  state.favorites.forEach(function(id) { favSet[id] = true; });
  return state.eventsData.some(function(e) {
    if (!favSet[e.church_id]) return false;
    // Single-date event
    if (e.date) return e.date === today;
    // Multi-date event
    if (e.dates && e.dates.length) return e.dates.indexOf(today) !== -1;
    return false;
  });
}

// Wire cross-module callback for favorite toggle
state._onFavToggle = function(id) {
  render.renderCards();
  var db = document.querySelector('.detail-action-btn.fav-btn');
  if (db && db.dataset.id === id) {
    db.classList.toggle('fav-active', data.isFav(id));
    db.querySelector('svg').setAttribute('fill', data.isFav(id) ? 'currentColor' : 'none');
  }
  // Update saved badges — dot if any events today at favorited churches
  var hasToday = _hasTodayEventsAtFavs();
  var tabBadge = document.getElementById('savedTabBadge');
  if (tabBadge) { tabBadge.textContent = ''; tabBadge.classList.toggle('visible', hasToday); }
  var countBadge = document.getElementById('savedCountBadge');
  if (countBadge) { countBadge.textContent = ''; countBadge.classList.toggle('visible', hasToday); }
};

// ── Expose functions for HTML onclick attributes ──
window._getDailyPrompt = _getDailyPrompt;
window._renderWelcomeBanner = _renderWelcomeBanner;
window._renderConfessionPrompt = _renderConfessionPrompt;
window.openDetail = render.openDetail;
window.closeDetail = render.closeDetail;
window.switchTab = ui.switchTab;
window.toggleFav = data.toggleFav;
window.refreshApp = location_.refreshApp;
window.openMoreFilters = ui.openMoreFilters;
window.closeMoreFilters = ui.closeMoreFilters;
window.clearAdvancedFilters = ui.clearAdvancedFilters;
window.applyAdvancedFilters = ui.applyAdvancedFilters;
window.toggleSort = ui.toggleSort;
window.closeAllPanels = ui.closeAllPanels;
window.shareParish = render.shareParish;
window.toggleAcc = render.toggleAcc;
window.closeEventDetail = events.closeEventDetail;
window.openEventDetail = events.openEventDetail;
window.downloadEventIcal = events.downloadEventIcal;
window.navEventToParish = events.navEventToParish;
window.addYCToCalendar = events.addYCToCalendar;
window.addMoreEventToCal = events.addMoreEventToCal;
window.selectFbType = more.selectFbType;
window.submitFeedback = more.submitFeedback;
window.showCorrectionForm = more.showCorrectionForm;
window.selectCorrPill = more.selectCorrPill;
window.submitCorrection = more.submitCorrection;
window.showMoreCorrection = more.showMoreCorrection;
window.selectMoreCorrPill = more.selectMoreCorrPill;
window.submitMoreCorrection = more.submitMoreCorrection;
window.expressInterest = more.expressInterest;
window.dismissInstallCard = more.dismissInstallCard;
window.openInstallGuide = installGuide.openInstallGuide;
window.closeInstallGuide = installGuide.closeInstallGuide;
// installGuideNav is set dynamically inside openInstallGuide()
window.toggleReading = readings.toggleReading;
window.exportLitCalICS = readings.exportLitCalICS;
window.removeAdv = ui.removeAdv;
window.updateMFChip = ui.updateMFChip;
window.toggleTemp = ui.toggleTemp;
window.applyQuickFilter = ui.applyQuickFilter;
window.verifyOk = more.verifyOk;
window.renderSaved = saved.renderSaved;
window.clearMapFilter = function() { require('./map.js').clearMapFilter(); };
window.closeMapPopup = map.closeMapPopup;
window.openCCC = ccc.openCCC;
window.closeCCC = ccc.closeCCC;
window.cccNavigate = ccc.cccNavigate;
window.cccGoBack = ccc.cccGoBack;
window._refTap = refs.handleRefTap;
window.openRosary = rosary.openRosary;
window.closeRosary = rosary.closeRosary;
window.rosarySelectSet = rosary.rosarySelectSet;
window.rosaryNext = rosary.rosaryNext;
window.rosaryPrev = rosary.rosaryPrev;
window.rosaryBeadTap = rosary.rosaryBeadTap;
window.rosaryGoTo = rosary.rosaryGoTo;
window.openExamination = examination.openExamination;
window.closeExamination = examination.closeExamination;
window.examToggleSection = examination.examToggleSection;
window.examMarkConfession = examination.examMarkConfession;
window.examFindConfession = examination.examFindConfession;
window.examScrollToSummary = examination.examScrollToSummary;
window.toggleTheme = function() {
  var html = document.documentElement;
  var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mf-theme', next);
  var btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
  var meta = document.getElementById('metaThemeColor');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#1A1C22' : '#F8F7F4');
  // Update map tiles if map is initialized
  if (state.mapInitialized) {
    var mapMod = require('./map.js');
    mapMod.updateTileTheme();
  }
};
// Light mode is default regardless of system preference.
// Dark mode only activates when user explicitly toggles via theme button.

window.init = init;
window.renderDailyReflection = _renderDailyReflection;
window.setTextSize = function(size) {
  document.documentElement.setAttribute('data-text-size', size === 'default' ? '' : size);
  if (size === 'default') document.documentElement.removeAttribute('data-text-size');
  else document.documentElement.setAttribute('data-text-size', size);
  localStorage.setItem('mf-text-size', size);
  document.querySelectorAll('.text-size-btn').forEach(function(b) { b.classList.remove('active'); });
  var active = document.querySelector('.text-size-btn[onclick*="' + size + '"]');
  if (active) active.classList.add('active');
};

// ── Chip clicks ──
document.querySelectorAll('.chip[data-filter]').forEach(function(chip) {
  chip.addEventListener('click', function() {
    document.querySelectorAll('.chip[data-filter]').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    state.currentFilter = chip.dataset.filter;
    if (['today', 'weekend'].includes(state.currentFilter)) { state.currentSort = 'next_service'; ui.updateSortLabel(); }
    data.filterChurches(); render.renderCards();
    if (state.mapInitialized) { map.applyMapFilter(); }
  });
});

// Chip bar scroll affordance
(function() {
  var bar = document.querySelector('.chip-bar');
  if (bar) bar.addEventListener('scroll', function() { bar.classList.toggle('scrolled', bar.scrollLeft > 8); }, { passive: true });
})();

// ── Search ──
var sI = document.getElementById('searchInput'), sC = document.getElementById('searchClear'), sT;
if (sI) {
  sI.addEventListener('input', function() {
    clearTimeout(sT);
    state.searchQuery = sI.value.trim();
    sC.classList.toggle('visible', state.searchQuery.length > 0);
    sT = setTimeout(function() { data.filterChurches(); render.renderCards(); }, 200);
  });
}
if (sC) {
  sC.addEventListener('click', function() {
    sI.value = ''; state.searchQuery = ''; sC.classList.remove('visible');
    data.filterChurches(); render.renderCards(); sI.focus();
  });
}

// ── Keyboard ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('rosaryOverlay').classList.contains('open')) rosary.closeRosary();
    else if (document.getElementById('examOverlay').classList.contains('open')) examination.closeExamination();
    else if (document.getElementById('cccSheet').classList.contains('open')) ccc.closeCCC();
    else if (document.getElementById('eventDetailPanel').classList.contains('open')) events.closeEventDetail();
    else if (document.getElementById('filtersOverlay').classList.contains('open')) ui.closeMoreFilters();
    else if (document.getElementById('detailPanel').classList.contains('open')) render.closeDetail();
  }
});

// ── Header tap → scroll to top ──
var topHeader = document.querySelector('.top-header');
if (topHeader) {
  topHeader.addEventListener('click', function(e) {
    if (e.target.closest('button,a,input')) return;
    var evtPanel = document.getElementById('eventDetailPanel');
    if (evtPanel.classList.contains('open')) { evtPanel.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var detail = document.getElementById('detailPanel');
    if (detail.classList.contains('open')) { detail.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var activePanel = document.querySelector('.tab-panel.active');
    if (activePanel && activePanel.id === 'panelFind') { document.getElementById('panelFind').scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (activePanel) { activePanel.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
}

// ── Chip bar keyboard nav ──
(function() {
  var bar = document.querySelector('.chip-bar');
  if (!bar) return;
  var chips = function() { return Array.from(bar.querySelectorAll('button.chip')); };
  bar.addEventListener('keydown', function(e) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    var btns = chips(), idx = btns.indexOf(document.activeElement);
    if (idx < 0) return;
    e.preventDefault();
    var next;
    if (e.key === 'ArrowRight') next = btns[(idx + 1) % btns.length];
    else if (e.key === 'ArrowLeft') next = btns[(idx - 1 + btns.length) % btns.length];
    else if (e.key === 'Home') next = btns[0];
    else if (e.key === 'End') next = btns[btns.length - 1];
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
  });
  function updateTabIndex() {
    var btns = chips(), act = bar.querySelector('.chip.active');
    btns.forEach(function(b) { b.setAttribute('tabindex', b === act ? '0' : '-1'); });
  }
  updateTabIndex();
  var obs = new MutationObserver(updateTabIndex);
  chips().forEach(function(c) { obs.observe(c, { attributes: true, attributeFilter: ['class'] }); });
})();

// ── PWA install prompt capture ──
window._deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) { e.preventDefault(); window._deferredInstallPrompt = e; });
window.addEventListener('appinstalled', function() { window._deferredInstallPrompt = null; more.dismissInstallCard(); });

// ── Pull-to-refresh gesture ──
(function() {
  var panel = document.getElementById('panelFind');
  if (!panel) return;
  var pull = document.getElementById('pullIndicator');
  if (!pull) return;
  var startY = 0, pulling = false, threshold = 60;
  panel.addEventListener('touchstart', function(e) {
    if (window.scrollY > 5) return;
    startY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });
  panel.addEventListener('touchmove', function(e) {
    if (!pulling) return;
    var dy = e.touches[0].clientY - startY;
    if (dy < 0) { pulling = false; return; }
    var h = Math.min(dy * 0.4, 50);
    pull.style.height = h + 'px';
    if (dy > threshold) {
      pull.className = 'pull-indicator ready';
      document.getElementById('pullText').textContent = 'Release to refresh';
    } else {
      pull.className = 'pull-indicator';
      document.getElementById('pullText').textContent = 'Pull to refresh';
    }
  }, { passive: true });
  panel.addEventListener('touchend', function() {
    if (!pulling) return;
    pulling = false;
    if (pull.classList.contains('ready')) {
      location_.refreshApp();
    } else {
      pull.style.height = '0';
    }
  }, { passive: true });
})();

// ── Swipe-to-dismiss for detail panels ──
(function() {
  function initPanelSwipe(panelId, closeFn) {
    var panel = document.getElementById(panelId);
    if (!panel || panel._swipeInit) return;
    panel._swipeInit = true;
    var startY = 0;
    panel.addEventListener('touchstart', function(e) {
      startY = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', function(e) {
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > 72 && panel.scrollTop <= 5) closeFn();
    }, { passive: true });
  }
  initPanelSwipe('detailPanel', function() { render.closeDetail(); });
  initPanelSwipe('eventDetailPanel', function() { events.closeEventDetail(); });
})();

// ── Daily Card on Find tab (liturgical day teaser) ──
function _renderDailyStrip(events) {
  var el = document.getElementById('liturgicalTeaser');
  if (!el) return;
  var now = utils.getNow(), m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d && !e.is_vigil_mass; });
  if (!today.length) return;

  var pick = today.sort(function(a, b) { return (b.grade || 0) - (a.grade || 0); })[0];
  var color = (pick.color && pick.color[0]) || 'green';
  var colorMap = { purple: '#6B21A8', red: '#DC2626', white: '#94A3B8', green: '#16A34A', rose: '#DB2777' };
  var colorHex = colorMap[color] || '#16A34A';

  var progress = utils.getSeasonProgress();
  var progressText = progress ? 'Day ' + progress.day + ' of ' + progress.total + ' \u00b7 ' + progress.season : '';

  // Secondary line
  var secondary = '';
  var dow = now.getDay();
  var season = document.documentElement.getAttribute('data-season');
  if (dow === 5 && season === 'lent') secondary = 'Abstinence from meat today';
  var tomorrow = new Date(now.getTime() + 86400000);
  var tomorrowHDO = events.filter(function(e) {
    return e.month === (tomorrow.getMonth() + 1) && e.day === tomorrow.getDate() && e.holy_day_of_obligation;
  });
  if (tomorrowHDO.length) secondary = 'Tomorrow: ' + tomorrowHDO[0].name + ' (Holy Day)';

  el.innerHTML = '<div class="daily-card" onclick="switchTab(\'panelMore\',document.querySelector(\'[data-tab=panelMore]\'))">'
    + '<div class="daily-card-row">'
    + '<span class="daily-card-dot" style="background:' + colorHex + '"></span>'
    + '<div class="daily-card-text">'
    + '<div class="daily-card-name">' + utils.esc(pick.name) + '</div>'
    + (progressText ? '<div class="daily-card-progress">' + utils.esc(progressText) + '</div>' : '')
    + (secondary ? '<div class="daily-card-secondary">' + utils.esc(secondary) + '</div>' : '')
    + '</div>'
    + '<span class="daily-card-arrow">\u203a</span>'
    + '</div>'
    + '</div>';
  el.style.display = '';
}

// ── Contextual confession prompt ──
function _renderConfessionPrompt() {
  var dismissed = localStorage.getItem('mf-conf-prompt-' + new Date().toISOString().slice(0, 10));
  if (dismissed) return;
  var welcome = document.getElementById('welcomeBanner');
  var returnC = document.getElementById('returnCard');
  if ((welcome && welcome.style.display !== 'none') || (returnC && returnC.style.display !== 'none')) return;

  var day = new Date().getDay();
  var season = document.documentElement.getAttribute('data-season');
  if (day !== 6 && season !== 'lent') return;

  var el = document.getElementById('confessionPrompt');
  if (!el) return;
  var confMsg = '';
  try {
    var lastConf = localStorage.getItem('mf-last-confession');
    if (lastConf) {
      var daysSince = Math.floor((Date.now() - Number(lastConf)) / 86400000);
      if (daysSince >= 14) confMsg = daysSince + ' days since your last confession \u2014 ';
    }
  } catch (e) {}
  el.innerHTML = '<div class="conf-nudge" onclick="applyQuickFilter(\'confession\');this.parentElement.style.display=\'none\';localStorage.setItem(\'mf-conf-prompt-\'+new Date().toISOString().slice(0,10),\'1\')">'
    + confMsg + 'Find a confessional nearby \u2192'
    + '</div>';
  el.style.display = '';
}

// ── Daily CCC Reflection (Change 16) ──
function _getDailyCCCNumber() {
  var now = utils.getNow();
  var daysSinceEpoch = Math.floor(now.getTime() / 86400000);
  // Pool: paragraphs 27-2865 (skip introductory/meta paragraphs)
  var poolSize = 2865 - 27 + 1;
  return 27 + (daysSinceEpoch % poolSize);
}

function _renderDailyReflection() {
  var el = document.getElementById('dailyReflection');
  if (!el) return;
  var num = _getDailyCCCNumber();
  fetch('data/catechism.json').then(function(r) { return r.json(); }).then(function(d) {
    var text = d.paragraphs[String(num)];
    if (!text) { el.style.display = 'none'; return; }
    // Truncate to ~120 chars at a sentence boundary
    var preview = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '');
    if (preview.length > 140) {
      var cut = preview.lastIndexOf('.', 120);
      if (cut > 50) preview = preview.slice(0, cut + 1);
      else preview = preview.slice(0, 120).trim() + '\u2026';
    }
    el.innerHTML = '<div class="reflection-card" onclick="openCCC(\'' + num + '\')" role="button" tabindex="0">'
      + '<div class="reflection-label">Daily Reflection</div>'
      + '<div class="reflection-text">\u201C' + utils.esc(preview) + '\u201D</div>'
      + '<div class="reflection-cite">Catechism \u00A7' + num + ' \u2014 Tap to read more</div>'
      + '</div>';
    el.style.display = '';
  }).catch(function() { el.style.display = 'none'; });
}

// ── First-visit welcome banner (Change 4) ──
function _renderWelcomeBanner() {
  if (state._lastVisit) return; // not first visit
  if (localStorage.getItem('mf-welcome-dismissed')) return;
  var el = document.getElementById('welcomeBanner');
  if (!el) return;
  el.innerHTML = '<div class="welcome-banner">'
    + '<div class="welcome-text">'
    + '<div class="welcome-title">Welcome to MassFinder</div>'
    + '<div class="welcome-desc">Mass times, Confession, Adoration, daily readings, prayer tools, and community events across Western New England. Save your parishes to build a personalized dashboard.</div>'
    + '</div>'
    + '<button class="welcome-dismiss" onclick="this.closest(\'.welcome-wrap\').style.display=\'none\';localStorage.setItem(\'mf-welcome-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
    + '</div>';
  el.style.display = '';
}

// ── Return-visit context card (Change 18) ──
function _renderReturnCard(daysMissed) {
  var el = document.getElementById('returnCard');
  if (!el) return;

  var missed = [];
  if (window._litcalCache && window._litcalCache.events) {
    var lastDate = new Date(state._lastVisit + 'T00:00:00');
    var today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
    window._litcalCache.events.forEach(function(e) {
      var evtDate = new Date(e.year + '-' + String(e.month).padStart(2, '0') + '-' + String(e.day).padStart(2, '0') + 'T00:00:00');
      if (evtDate > lastDate && evtDate < today && e.grade >= 3 && !e.is_vigil_mass) {
        missed.push(e.name);
      }
    });
  }

  var missedText = missed.length
    ? missed.slice(0, 3).join(', ') + (missed.length > 3 ? ' +' + (missed.length - 3) + ' more' : '')
    : '';

  el.innerHTML = '<div class="return-card">'
    + '<div class="return-text">Welcome back' + (missedText ? ' \u2014 ' + utils.esc(missedText) + ' since your last visit' : '') + '</div>'
    + '<button class="return-dismiss" onclick="this.closest(\'.return-card-wrap\').style.display=\'none\'" aria-label="Dismiss">\u2715</button>'
    + '</div>';
  el.style.display = '';
}



// ── Init ──
async function init() {
  // ── Last-visit tracking (Change 11) ──
  var todayStr = new Date().toISOString().slice(0, 10);
  state._lastVisit = localStorage.getItem('mf-last-visit') || null;
  state._isReturning = !!state._lastVisit && state._lastVisit < todayStr;
  localStorage.setItem('mf-last-visit', todayStr);

  data.loadFav();
  data.migrateFavorites();
  try {
    // Load parish data from static JSON
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 8000);
    var r = await fetch('parish_data.json', { signal: controller.signal });
    clearTimeout(timeout);
    var jsonData = await r.json();
    var churches = data.parishesToChurches(jsonData.parishes || []);
    var churchData = { churches: churches };
    state.ycEvents = (jsonData.yc_events || []).sort(function(a, b) { return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''); });
    // Map church_id for YC events from parish_data.json
    state.ycEvents.forEach(function(e) {
      if (!e.church_id) {
        e.church_id = e.location_id || data.PARISH_CHURCH_MAP[e.parish_id] || e.parish_id;
      }
    });

    state.allChurches = data.processChurches(churchData.churches || []);

    // Load events from static JSON
    try {
      var evtResp = await fetch('events.json', { signal: AbortSignal.timeout(5000) });
      if (evtResp.ok) {
        var evtData = await evtResp.json();
        state.eventsData = (evtData.events || []).sort(function(a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '').localeCompare(b.time || ''); });
        // Map church_id from location_id or parish_id for event↔church lookups
        state.eventsData.forEach(function(e) {
          if (!e.church_id) {
            e.church_id = e.location_id || data.PARISH_CHURCH_MAP[e.parish_id] || e.parish_id;
          }
        });
        var ycFromEvents = state.eventsData.filter(function(e) { return e.category === 'yc'; });
        if (ycFromEvents.length) state.ycEvents = ycFromEvents;
        console.log('[MassFinder] Loaded events:', state.eventsData.length, ', YC:', ycFromEvents.length);
        data.rebuildEvtSearchCache();
      }
    } catch (e) { console.warn('[MassFinder] events not available:', e.message); }
    console.log('[MassFinder] churches:', state.allChurches.length, ', ycEvents:', state.ycEvents.length);

    // Show seasonal chip (Lent, Easter, Advent) if in season
    var seasonChip = document.getElementById('seasonChip');
    if (seasonChip) {
      var sp = utils.getSeasonProgress();
      if (sp) {
        var seasonLabels = { Lent: 'Lent', 'Easter Season': 'Easter', Advent: 'Advent' };
        seasonChip.textContent = seasonLabels[sp.season] || sp.season;
        seasonChip.dataset.filter = sp.season === 'Lent' ? 'lent' : sp.season === 'Advent' ? 'advent' : 'easter';
        seasonChip.style.display = '';
      }
    }
    var sm = utils.smartDefault(); state.currentFilter = sm;
    document.querySelectorAll('.chip[data-filter]').forEach(function(ch) { ch.classList.toggle('active', ch.dataset.filter === sm); });
    if (['today', 'weekend'].includes(sm)) state.currentSort = 'next_service';
    ui.updateSortLabel(); location_.initLocation(); data.filterChurches(); render.renderCards();
    _renderWelcomeBanner();

    // More tab badge — show dot when daily content hasn't been seen today (Change 12)
    var moreLastSeen = localStorage.getItem('mf-more-seen');
    var moreBadge = document.getElementById('moreTabBadge');
    if (moreBadge && moreLastSeen !== todayStr) {
      moreBadge.classList.add('visible');
    }

    // Deep link
    if (location.hash) {
      var id = location.hash.slice(1);
      if (state.allChurches.find(function(c) { return c.id === id; })) setTimeout(function() { render.openDetail(id); }, 400);
    }

    // Fetch liturgical season early so accent bar + wash render on first tab
    readings.fetchLiturgicalDay().then(function() {
      if (window._litcalCache) {
        readings.setLiturgicalSeason(window._litcalCache.events);
        _renderDailyStrip(window._litcalCache.events);
      }
      _renderConfessionPrompt();
      // Return-visit context card (Change 18) — needs litcal for missed feasts
      if (state._isReturning && state._lastVisit) {
        var daysMissed = Math.floor((Date.now() - new Date(state._lastVisit + 'T00:00:00').getTime()) / 86400000);
        if (daysMissed >= 2 && daysMissed <= 14) _renderReturnCard(daysMissed);
      }
    }).catch(function() {});

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
      navigator.serviceWorker.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'CACHE_UPDATED') location_.refreshApp();
      });
    }
  } catch (err) {
    var isTimeout = err.name === 'AbortError';
    document.getElementById('cardList').innerHTML = '<div class="no-results"><h3>' + (isTimeout ? 'Connection timed out' : 'Unable to load churches') + '</h3><p>' + (isTimeout ? 'Check your signal and try again.' : 'Please check your connection and try refreshing.') + '</p><button onclick="init()" style="margin-top:var(--space-4);padding:var(--space-3) var(--space-6);border-radius:var(--radius-md);background:var(--color-primary);color:white;font-size:var(--text-sm);font-weight:var(--weight-semibold);min-height:44px">Try Again</button></div>';
    console.error(err);
  }
}

// ── Dev Panel ──
var _devTaps = 0;
var _devTimer = null;
window._devTap = function() {
  _devTaps++;
  clearTimeout(_devTimer);
  _devTimer = setTimeout(function() { _devTaps = 0; }, 2000);
  if (_devTaps >= 5) {
    _devTaps = 0;
    _toggleDevPanel();
  }
};

var _devState = {
  welcome: false,
  returnCard: false,
  confession: false,
  moreBadge: false,
  season: null
};

function _toggleDevPanel() {
  var existing = document.getElementById('devPanel');
  if (existing) { _closeDevPanel(); return; }

  var overlay = document.createElement('div');
  overlay.id = 'devPanelOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.3);';
  overlay.onclick = function() { _closeDevPanel(); };
  document.body.appendChild(overlay);

  var panel = document.createElement('div');
  panel.id = 'devPanel';
  panel.style.cssText = 'position:fixed;bottom:calc(var(--tab-bar-height,56px) + var(--safe-bottom,0px) + 8px);left:8px;right:8px;z-index:9999;background:var(--color-surface);border:2px solid var(--color-primary);border-radius:var(--radius-md);padding:var(--space-4);box-shadow:var(--shadow-elevated,0 8px 32px rgba(0,0,0,0.3));max-height:50vh;overflow-y:auto;';

  var features = [
    { key: 'welcome', label: 'Welcome Banner', active: _devState.welcome },
    { key: 'returnCard', label: 'Return Card', active: _devState.returnCard },
    { key: 'confession', label: 'Confession Prompt', active: _devState.confession },
    { key: 'moreBadge', label: 'More Tab Badge', active: _devState.moreBadge },
  ];

  var seasons = ['lent', 'advent', 'easter', 'ordinary'];
  var currentSeason = _devState.season || document.documentElement.getAttribute('data-season') || 'none';

  var featureHtml = features.map(function(f) {
    return '<label style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light);cursor:pointer;-webkit-tap-highlight-color:transparent">'
      + '<input type="checkbox" ' + (f.active ? 'checked' : '') + ' onchange="window._devToggle(\'' + f.key + '\',this.checked)" style="width:20px;height:20px;accent-color:var(--color-primary);flex-shrink:0">'
      + '<span style="font-size:var(--text-sm);color:var(--color-text-primary)">' + f.label + '</span>'
      + '</label>';
  }).join('');

  var seasonHtml = '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light)">'
    + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-2)">Season Override</div>'
    + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap">'
    + seasons.map(function(s) {
      var isActive = currentSeason === s;
      return '<button onclick="window._devSetSeason(\'' + s + '\')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid ' + (isActive ? 'var(--color-primary)' : 'var(--color-border)') + ';background:' + (isActive ? 'var(--color-primary)' : 'var(--color-surface)') + ';color:' + (isActive ? 'white' : 'var(--color-text-secondary)') + ';cursor:pointer;min-height:32px">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>';
    }).join('')
    + '</div></div>';

  var resetHtml = '<button onclick="localStorage.clear();location.reload()" style="display:block;width:100%;padding:var(--space-3);margin-top:var(--space-3);background:#DC2626;color:white;font-size:var(--text-sm);font-weight:var(--weight-semibold);border-radius:var(--radius-md);cursor:pointer;min-height:44px">Clear All localStorage &amp; Reload</button>';

  panel.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">'
    + '<span style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-primary)">Dev Panel</span>'
    + '<button onclick="window._closeDevPanel()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:var(--color-text-tertiary);font-size:var(--text-sm);cursor:pointer">\u2715</button>'
    + '</div>'
    + featureHtml
    + seasonHtml
    + resetHtml;

  document.body.appendChild(panel);
}

function _closeDevPanel() {
  var panel = document.getElementById('devPanel');
  var overlay = document.getElementById('devPanelOverlay');
  if (panel) panel.remove();
  if (overlay) overlay.remove();
}
window._closeDevPanel = _closeDevPanel;

window._devToggle = function(key, checked) {
  _devState[key] = checked;

  if (key === 'welcome') {
    var wb = document.getElementById('welcomeBanner');
    if (checked) {
      localStorage.removeItem('mf-welcome-dismissed');
      var oldVisit = state._lastVisit;
      state._lastVisit = null;
      _renderWelcomeBanner();
      state._lastVisit = oldVisit;
    } else {
      if (wb) wb.style.display = 'none';
    }
  }

  if (key === 'returnCard') {
    var rc = document.getElementById('returnCard');
    if (checked) {
      _renderReturnCard(3);
    } else {
      if (rc) rc.style.display = 'none';
    }
  }

  if (key === 'confession') {
    var cp = document.getElementById('confessionPrompt');
    if (checked) {
      localStorage.removeItem('mf-conf-prompt-' + new Date().toISOString().slice(0, 10));
      if (cp) {
        cp.innerHTML = '<div class="conf-nudge" onclick="applyQuickFilter(\'confession\');this.parentElement.style.display=\'none\'">Find confession times nearby \u2192</div>';
        cp.style.display = '';
      }
    } else {
      if (cp) cp.style.display = 'none';
    }
  }

  if (key === 'moreBadge') {
    var mb = document.getElementById('moreTabBadge');
    if (mb) mb.classList.toggle('visible', checked);
  }
};

window._devSetSeason = function(season) {
  _devState.season = season;
  document.documentElement.setAttribute('data-season', season);
  _closeDevPanel();
  _toggleDevPanel();
};

init();
