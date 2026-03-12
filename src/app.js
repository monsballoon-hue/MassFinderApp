/*
 * MassFinder
 * Copyright (C) 2026 Mike Adamski
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
var stations = require('./stations.js');
var novena = require('./novena.js');
var installGuide = require('./install-guide.js');
var bible = require('./bible.js');
var explore = require('./explore.js');
var settings = require('./settings.js');

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
  var today = utils.toLocalDateStr(utils.getNow());
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
window.showQR = render.showQR;
window.showSubscribeQR = render.showSubscribeQR;
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
window._readingReadAloud = readings.readingReadAloud;
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
window.openCCCAboveExam = ccc.openCCCAboveExam;
window.cccNavigate = ccc.cccNavigate;
window.cccGoBack = ccc.cccGoBack;
window.cccSearchSelect = ccc.cccSearchSelect;
window.openBible = bible.openBible;
window.closeBible = bible.closeBible;
window.bibleNavigate = bible.bibleNavigate;
window.bibleGoBack = bible.bibleGoBack;
window.bibleReadAloud = bible.bibleReadAloud;
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
window.examGracefulClose = examination.examGracefulClose;
window.examScrollToSummary = examination.examScrollToSummary;
window.openStations = stations.openStations;
window.closeStations = stations.closeStations;
window.stationsNext = stations.stationsNext;
window.stationsPrev = stations.stationsPrev;
window.stationsGoTo = stations.stationsGoTo;
window.openNovena = novena.openNovena;
window.closeNovena = novena.closeNovena;
window.novenaSelect = novena.novenaSelect;
window.novenaResume = novena.novenaResume;
window.novenaMarkDay = novena.novenaMarkDay;
window.novenaGoToDay = novena.novenaGoToDay;
window.novenaBack = novena.novenaBack;
window.novenaStartNew = novena.novenaStartNew;
window.openExplore = explore.openExplore;
window.closeExplore = explore.closeExplore;
window.explorePivot = explore.explorePivot;
window.explorePop = explore.explorePop;
window.exploreBack = explore.exploreBack;
window.exploreTopic = explore.exploreTopic;
window.openSettings = settings.openSettings;
window.closeSettings = settings.closeSettings;
window.setSettingTheme = settings.setSettingTheme;
window.setSettingSize = settings.setSettingSize;
window.toggleSettingNotif = settings.toggleSettingNotif;
window.setSettingRosary = settings.setSettingRosary;
window.toggleSettingConf = settings.toggleSettingConf;
window.settingsClearPrayer = settings.settingsClearPrayer;
window.settingsClearSaved = settings.settingsClearSaved;
window.settingsClearAll = settings.settingsClearAll;
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
window.renderDailyFormation = _renderDailyFormation;
window.setTextSize = function(size) {
  document.documentElement.setAttribute('data-text-size', size === 'default' ? '' : size);
  if (size === 'default') document.documentElement.removeAttribute('data-text-size');
  else document.documentElement.setAttribute('data-text-size', size);
  localStorage.setItem('mf-text-size', size);
  document.querySelectorAll('.text-size-btn').forEach(function(b) { b.classList.remove('active'); });
  var active = document.querySelector('.text-size-btn[onclick*="' + size + '"]');
  if (active) active.classList.add('active');
};

// ── UX-08: Daily Reading Reminder ──
window.toggleNotifications = function() {
  var current = localStorage.getItem('mf-notifications');
  if (current === 'enabled') {
    // Disable
    localStorage.setItem('mf-notifications', 'disabled');
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_REMINDER' });
    }
    var btn = document.getElementById('notif-toggle-btn');
    if (btn) btn.textContent = 'Daily Reminder: Off';
    return;
  }
  // Request permission first
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      localStorage.setItem('mf-notifications', 'enabled');
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', hour: 8 });
      }
      var btn = document.getElementById('notif-toggle-btn');
      if (btn) btn.textContent = 'Daily Reminder: On';
    }
  });
};

function _initNotifications() {
  if (localStorage.getItem('mf-notifications') === 'enabled' && navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', hour: 8 });
  }
}

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
    if (document.getElementById('settingsOverlay').classList.contains('active')) settings.closeSettings();
    else if (document.getElementById('exploreOverlay').classList.contains('open')) explore.closeExplore();
    else if (document.getElementById('stationsOverlay').classList.contains('open')) stations.closeStations();
    else if (document.getElementById('novenaOverlay').classList.contains('open')) novena.closeNovena();
    else if (document.getElementById('rosaryOverlay').classList.contains('open')) rosary.closeRosary();
    else if (document.getElementById('examOverlay').classList.contains('open')) examination.closeExamination();
    else if (document.getElementById('bibleSheet').classList.contains('open')) bible.closeBible();
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
}

// FT-20: Contextual confession chip nudge — highlight chip on Saturdays and during Lent
function _renderConfessionPrompt() {
  var day = new Date().getDay();
  var season = document.documentElement.getAttribute('data-season');
  if (day !== 6 && season !== 'lent') return;

  var confChip = document.querySelector('[data-filter="confession"]');
  if (confChip && !confChip.classList.contains('active')) {
    confChip.classList.add('chip--nudge');
  }
}

// ── Daily Formation (MT-02: combined Baltimore Q&A + Summa "Go Deeper") ──
// Baltimore Q&A always visible. Summa collapsed behind a <details> toggle.
var _baltimoreCache = null;
var _summaCache = null;

// MR-03: CCC section -> Summa topic mapping for topical "Go Deeper"
var _CCC_SUMMA_MAP = {
  'Jesus Christ, Son of God': ['Life of Christ', 'The Incarnation'],
  'The Trinity': ['The Trinity'],
  'Creator of Heaven and Earth': ['Creation', 'Angels'],
  'The Dignity of the Human Person': ['Human Acts', 'Habits & Virtues', 'Human Nature'],
  'The Human Community, The Law, Grace': ['Justice', 'Habits & Virtues'],
  'The Ten Commandments': ['Justice', 'Temperance', 'Prudence', 'Charity'],
  'The Desire for God': ['God'],
  'God Comes to Meet Man': ['God', 'Faith'],
  'The Response of Faith': ['Faith'],
  'The Creeds': ['The Trinity', 'Creation', 'God'],
  'The Holy Spirit': ['God', 'The Trinity'],
  'The Church': ['Faith', 'Charity'],
  'Forgiveness, Resurrection, Eternal Life': ['Life of Christ', 'Hope'],
  'The Sacramental Economy': ['The Sacraments'],
  'Baptism, Confirmation, Eucharist': ['Baptism', 'Confirmation & Eucharist', 'The Eucharist'],
  'Penance, Anointing of the Sick': ['Penance'],
  'Holy Orders, Matrimony': ['Justice', 'Charity'],
  'Christian Prayer': ['Charity', 'Hope', 'Faith'],
  'The Lord\u2019s Prayer': ['Charity', 'Hope']
};
var _CCC_SECTIONS_F = [
  [1, 25, 'Prologue'], [26, 49, 'The Desire for God'], [50, 141, 'God Comes to Meet Man'],
  [142, 184, 'The Response of Faith'], [185, 278, 'The Creeds'],
  [279, 421, 'Creator of Heaven and Earth'], [422, 682, 'Jesus Christ, Son of God'],
  [683, 747, 'The Holy Spirit'], [748, 975, 'The Church'],
  [976, 1065, 'Forgiveness, Resurrection, Eternal Life'],
  [1066, 1209, 'The Sacramental Economy'], [1210, 1419, 'Baptism, Confirmation, Eucharist'],
  [1420, 1532, 'Penance, Anointing of the Sick'], [1533, 1666, 'Holy Orders, Matrimony'],
  [1667, 1690, 'Sacramentals, Funerals'],
  [1691, 1876, 'The Dignity of the Human Person'],
  [1877, 2051, 'The Human Community, The Law, Grace'],
  [2052, 2557, 'The Ten Commandments'], [2558, 2758, 'Christian Prayer'],
  [2759, 2865, 'The Lord\u2019s Prayer']
];
function _getCCCSection(num) {
  var n = parseInt(num, 10);
  for (var i = 0; i < _CCC_SECTIONS_F.length; i++) {
    if (n >= _CCC_SECTIONS_F[i][0] && n <= _CCC_SECTIONS_F[i][1]) return _CCC_SECTIONS_F[i][2];
  }
  return '';
}

function _renderDailyFormation() {
  var el = document.getElementById('dailyFormation');
  if (!el) return;

  var baltimoreReady = _baltimoreCache
    ? Promise.resolve(_baltimoreCache)
    : fetch('/data/baltimore-catechism.json').then(function(r) { return r.json(); })
        .then(function(d) { _baltimoreCache = d; return d; });

  var summaReady = _summaCache
    ? Promise.resolve(_summaCache)
    : fetch('/data/summa-daily.json').then(function(r) { return r.json(); })
        .then(function(d) { _summaCache = d; return d; });

  Promise.all([baltimoreReady, summaReady]).then(function(results) {
    var balt = results[0], summa = results[1];
    var now = utils.getNow();
    var daysSinceEpoch = Math.floor(now.getTime() / 86400000);

    var html = '<div class="formation-card">';

    // Baltimore Q&A — always visible
    var questions = balt.questions;
    if (questions && questions.length) {
      var bIdx = daysSinceEpoch % questions.length;
      var qa = questions[bIdx];
      var cccLink = qa.ccc
        ? '<span class="reflection-ccc-link" onclick="event.stopPropagation();openCCC(\'' + qa.ccc + '\')">CCC \u00A7' + qa.ccc + '</span>'
        : '';
      html += '<div class="formation-label">Daily Catholic Q&amp;A</div>'
        + '<div class="reflection-question">' + utils.esc(qa.question) + '</div>'
        + '<div class="reflection-answer">' + utils.esc(qa.answer) + '</div>'
        + '<div class="reflection-cite">Baltimore Catechism #' + qa.id + (cccLink ? ' \u00b7 ' + cccLink : '') + '</div>';
    }

    // Summa — topically linked "Go Deeper" (MR-03)
    var articles = summa.articles;
    if (articles && articles.length && qa && qa.ccc) {
      var section = _getCCCSection(qa.ccc);
      var matchingTopics = _CCC_SUMMA_MAP[section] || [];
      var matchingArticles = articles.filter(function(a) {
        return matchingTopics.indexOf(a.topic) >= 0;
      });

      if (matchingArticles.length) {
        var art = matchingArticles[daysSinceEpoch % matchingArticles.length];
        html += '<details class="formation-deeper">'
          + '<summary class="formation-deeper-toggle">Go Deeper<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg></summary>'
          + '<div class="formation-deeper-body">'
          + '<div class="summa-question">' + utils.esc(art.q) + '</div>'
          + '<div class="summa-article">' + utils.esc(art.a) + '</div>'
          + '<div class="summa-body">' + utils.esc(art.body) + '</div>'
          + '<div class="summa-cite">St. Thomas Aquinas \u00b7 ' + utils.esc(art.part) + '</div>'
          + '</div></details>';
      }
    }

    html += '</div>';
    el.innerHTML = html;
    el.style.display = '';
  }).catch(function() { el.style.display = 'none'; });
}

// ── First-visit welcome banner (Change 4) ──
// FT-06: Welcome banner removed — first-use tip card is injected inline by renderCards()
function _renderWelcomeBanner() {
  // No-op: welcome experience is now a contextual tip card after the first church card
}

// ── Return-visit context card ──
function _renderReturnCard(daysMissed) {
  var el = document.getElementById('returnCard');
  if (!el) return;

  var missed = [];
  if (window._litcalCache && window._litcalCache.events) {
    var lastDate = new Date(state._lastVisit + 'T00:00:00');
    var today = new Date(utils.toLocalDateStr(new Date()) + 'T00:00:00');
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
  var todayStr = utils.toLocalDateStr(new Date());
  state._lastVisit = localStorage.getItem('mf-last-visit') || null;
  state._isReturning = !!state._lastVisit && state._lastVisit < todayStr;
  localStorage.setItem('mf-last-visit', todayStr);

  data.loadFav();
  data.migrateFavorites();
  try {
    // Load parish data from static JSON
    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); }, 8000);
    var r = await fetch('/parish_data.json', { signal: controller.signal });
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
      var evtResp = await fetch('/events.json', { signal: AbortSignal.timeout(5000) });
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
      // UX-08: Init daily reminder if previously enabled
      navigator.serviceWorker.ready.then(function() { _initNotifications(); });
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
  season: null,
  fastingMode: null,
  hdoBanner: false,
  qaOffset: 0
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
    { key: 'hdoBanner', label: 'HDO Banner (fake)', active: _devState.hdoBanner },
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

  // Fasting banner override
  var fastingModes = [
    { key: null, label: 'Off' },
    { key: 'ashwed', label: 'Ash Wed' },
    { key: 'goodfri', label: 'Good Fri' },
    { key: 'lentfri', label: 'Lent Fri' }
  ];
  var fastingHtml = '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light)">'
    + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-2)">Fasting Banner</div>'
    + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap">'
    + fastingModes.map(function(fm) {
      var isActive = _devState.fastingMode === fm.key;
      return '<button onclick="window._devSetFasting(' + (fm.key ? '\'' + fm.key + '\'' : 'null') + ')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid ' + (isActive ? 'var(--color-primary)' : 'var(--color-border)') + ';background:' + (isActive ? 'var(--color-primary)' : 'var(--color-surface)') + ';color:' + (isActive ? 'white' : 'var(--color-text-secondary)') + ';cursor:pointer;min-height:32px">' + fm.label + '</button>';
    }).join('')
    + '</div></div>';

  // Daily Q&A navigation
  var qaHtml = '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light)">'
    + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-2)">Daily Q&A Override</div>'
    + '<div style="display:flex;gap:var(--space-2);align-items:center">'
    + '<button onclick="window._devQANav(-1)" style="padding:4px 16px;border-radius:var(--radius-full);font-size:var(--text-sm);font-weight:var(--weight-semibold);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">\u2190 Prev</button>'
    + '<span style="font-size:var(--text-xs);color:var(--color-text-tertiary)">' + (_devState.qaOffset ? 'offset: ' + _devState.qaOffset : 'today') + '</span>'
    + '<button onclick="window._devQANav(1)" style="padding:4px 16px;border-radius:var(--radius-full);font-size:var(--text-sm);font-weight:var(--weight-semibold);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">Next \u2192</button>'
    + '<button onclick="window._devQANav(0)" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-tertiary);cursor:pointer;min-height:32px">Reset</button>'
    + '</div></div>';

  // Seed data buttons
  var seedHtml = '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light)">'
    + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-2)">Seed Test Data</div>'
    + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap">'
    + '<button onclick="window._devSeed(\'streak\')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">7-Day Streak</button>'
    + '<button onclick="window._devSeed(\'confession30\')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">Confession 45d Ago</button>'
    + '<button onclick="window._devSeed(\'novena\')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">Active Novena (Day 4)</button>'
    + '<button onclick="window._devSeed(\'clear-prayer\')" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-tertiary);cursor:pointer;min-height:32px">Clear Prayer Data</button>'
    + '</div></div>';

  // Notification testing
  var notifPerm = ('Notification' in window) ? Notification.permission : 'unsupported';
  var notifEnabled = localStorage.getItem('mf-notifications') === 'enabled';
  var notifHtml = '<div style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light)">'
    + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-2)">Notifications</div>'
    + '<div style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Permission: <strong>' + notifPerm + '</strong> &middot; Reminder: <strong>' + (notifEnabled ? 'ON' : 'OFF') + '</strong></div>'
    + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap">'
    + '<button onclick="window._devTestNotif()" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid var(--color-border);background:var(--color-surface);color:var(--color-text-secondary);cursor:pointer;min-height:32px">Fire Test Notification</button>'
    + '<button onclick="window._devToggleNotif()" style="padding:4px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-medium);border:1.5px solid ' + (notifEnabled ? 'var(--color-primary)' : 'var(--color-border)') + ';background:' + (notifEnabled ? 'var(--color-primary)' : 'var(--color-surface)') + ';color:' + (notifEnabled ? 'white' : 'var(--color-text-secondary)') + ';cursor:pointer;min-height:32px">' + (notifEnabled ? 'Disable' : 'Enable') + ' Reminder</button>'
    + '</div></div>';

  var resetHtml = '<button onclick="localStorage.clear();location.reload()" style="display:block;width:100%;padding:var(--space-3);margin-top:var(--space-3);background:#DC2626;color:white;font-size:var(--text-sm);font-weight:var(--weight-semibold);border-radius:var(--radius-md);cursor:pointer;min-height:44px">Clear All localStorage &amp; Reload</button>';

  panel.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">'
    + '<span style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-primary)">Dev Panel</span>'
    + '<button onclick="window._closeDevPanel()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:var(--color-text-tertiary);font-size:var(--text-sm);cursor:pointer">\u2715</button>'
    + '</div>'
    + featureHtml
    + seasonHtml
    + fastingHtml
    + qaHtml
    + notifHtml
    + seedHtml
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
    if (checked) {
      localStorage.removeItem('mf-welcome-dismissed');
      render.renderCards();
    } else {
      localStorage.setItem('mf-welcome-dismissed', '1');
      var tip = document.getElementById('firstUseTip');
      if (tip) tip.remove();
    }
  }

  if (key === 'returnCard') {
    var rcEl = document.getElementById('returnCard');
    if (checked) {
      if (rcEl) {
        rcEl.innerHTML = '<div class="return-card"><div class="return-text">Welcome back \u2014 Test feast since last visit</div><button class="return-dismiss" onclick="this.closest(\'.return-card-wrap\').style.display=\'none\'" aria-label="Dismiss">\u2715</button></div>';
        rcEl.style.display = '';
      }
    } else {
      if (rcEl) rcEl.style.display = 'none';
    }
  }

  if (key === 'confession') {
    var confChip = document.querySelector('[data-filter="confession"]');
    if (checked) {
      if (confChip) confChip.classList.add('chip--nudge');
    } else {
      if (confChip) confChip.classList.remove('chip--nudge');
    }
  }

  if (key === 'moreBadge') {
    var mb = document.getElementById('moreTabBadge');
    if (mb) mb.classList.toggle('visible', checked);
  }

  if (key === 'hdoBanner') {
    var hb = document.getElementById('hdoBanner');
    if (hb) {
      if (checked) {
        hb.innerHTML = '<div class="hdo-banner">'
          + '<div class="hdo-banner-label">Holy Day of Obligation \u2014 Dev Test</div>'
          + '<div class="hdo-banner-title">The Immaculate Conception</div>'
          + '<button class="hdo-banner-cta" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Find a Mass near you \u2192</button>'
          + '</div>';
      } else {
        hb.innerHTML = '';
      }
    }
  }
};

window._devSetSeason = function(season) {
  _devState.season = season;
  document.documentElement.setAttribute('data-season', season);
  _closeDevPanel();
  _toggleDevPanel();
};

window._devSetFasting = function(mode) {
  _devState.fastingMode = mode;
  var el = document.getElementById('fastingBanner');
  if (!el) { _closeDevPanel(); _toggleDevPanel(); return; }
  if (mode === 'ashwed' || mode === 'goodfri') {
    el.innerHTML = '<div class="fasting-banner fasting-banner--full">'
      + '<div class="fasting-banner-icon">\u271D</div>'
      + '<div class="fasting-banner-text">'
      + '<div class="fasting-banner-title">Day of Fasting &amp; Abstinence</div>'
      + '<div class="fasting-banner-desc">Ages 18\u201359 fast (one full meal). Ages 14+ abstain from meat.</div>'
      + '</div></div>';
  } else if (mode === 'lentfri') {
    el.innerHTML = '<div class="fasting-banner">'
      + '<div class="fasting-banner-icon">\u271D</div>'
      + '<div class="fasting-banner-text">'
      + '<div class="fasting-banner-title">Day of Abstinence</div>'
      + '<div class="fasting-banner-desc">Ages 14+ abstain from meat today.</div>'
      + '</div></div>';
  } else {
    el.innerHTML = '';
  }
  _closeDevPanel();
  _toggleDevPanel();
};

window._devQANav = function(dir) {
  if (dir === 0) { _devState.qaOffset = 0; }
  else { _devState.qaOffset += dir; }
  // Re-render the daily reflection with offset
  if (!_baltimoreCache) {
    fetch('/data/baltimore-catechism.json').then(function(r) { return r.json(); })
      .then(function(d) { _baltimoreCache = d; _devRenderQA(); });
  } else {
    _devRenderQA();
  }
  _closeDevPanel();
  _toggleDevPanel();
};

function _devRenderQA() {
  var el = document.getElementById('dailyFormation');
  if (!el || !_baltimoreCache) return;
  var questions = _baltimoreCache.questions;
  if (!questions || !questions.length) return;
  var daysSinceEpoch = Math.floor(utils.getNow().getTime() / 86400000);
  var idx = ((daysSinceEpoch + _devState.qaOffset) % questions.length + questions.length) % questions.length;
  var qa = questions[idx];
  var cccLink = qa.ccc
    ? '<span class="reflection-ccc-link" onclick="event.stopPropagation();openCCC(\'' + qa.ccc + '\')">CCC \u00A7' + qa.ccc + '</span>'
    : '';
  el.innerHTML = '<div class="reflection-card" role="article">'
    + '<div class="reflection-label">Daily Catholic Q&amp;A</div>'
    + '<div class="reflection-question">' + utils.esc(qa.question) + '</div>'
    + '<div class="reflection-answer">' + utils.esc(qa.answer) + '</div>'
    + '<div class="reflection-cite">Baltimore Catechism #' + qa.id + (cccLink ? ' \u00b7 ' + cccLink : '') + '</div>'
    + '</div>';
  el.style.display = '';
}

window._devSeed = function(type) {
  var now = new Date();
  if (type === 'streak') {
    var log = [];
    var types = ['rosary', 'examination', 'stations', 'novena'];
    for (var i = 0; i < 7; i++) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      log.push({ type: types[i % types.length], date: d.toISOString().slice(0, 10) });
    }
    // Add a few extra rosary entries for variety
    for (var j = 0; j < 3; j++) {
      var d2 = new Date(now);
      d2.setDate(d2.getDate() - j);
      log.push({ type: 'rosary', date: d2.toISOString().slice(0, 10) });
    }
    localStorage.setItem('mf-prayer-log', JSON.stringify(log));
    alert('Seeded 7-day streak with mixed prayer types. Switch to Saved tab to see it.');
  }
  if (type === 'confession30') {
    var ts = now.getTime() - 45 * 86400000;
    localStorage.setItem('mf-last-confession', String(ts));
    alert('Set last confession to 45 days ago. Switch to Saved tab to see the nudge.');
  }
  if (type === 'novena') {
    var startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 3);
    var novenaData = {
      id: 'divine_mercy',
      startDate: startDate.toISOString().slice(0, 10),
      completedDays: [1, 2, 3]
    };
    localStorage.setItem('mf-novena-active', JSON.stringify(novenaData));
    alert('Seeded active Divine Mercy Novena (Day 4 of 9). Check More tab or open Novena.');
  }
  if (type === 'clear-prayer') {
    localStorage.removeItem('mf-prayer-log');
    localStorage.removeItem('mf-last-confession');
    localStorage.removeItem('mf-novena-active');
    alert('Cleared prayer log, confession tracker, and active novena.');
  }
  _closeDevPanel();
  _toggleDevPanel();
};

window._devTestNotif = function() {
  if (!('Notification' in window)) { alert('Notifications not supported in this browser.'); return; }
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') window._devTestNotif();
      else alert('Notification permission denied.');
    });
    return;
  }
  new Notification('MassFinder \u2014 Daily Reading', {
    body: 'Today\u2019s readings and reflections are ready. (Dev test)',
    icon: '/assets/icon-192.png',
    tag: 'dev-test'
  });
};

window._devToggleNotif = function() {
  window.toggleNotifications();
  _closeDevPanel();
  _toggleDevPanel();
};

init();
