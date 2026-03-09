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

var state = data.state;

// Wire cross-module callback for favorite toggle
state._onFavToggle = function(id) {
  render.renderCards();
  var db = document.querySelector('.detail-action-btn.fav-btn');
  if (db && db.dataset.id === id) {
    db.classList.toggle('fav-active', data.isFav(id));
    db.querySelector('svg').setAttribute('fill', data.isFav(id) ? 'currentColor' : 'none');
  }
};

// ── Expose functions for HTML onclick attributes ──
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
window.dismissMoreInstall = more.dismissMoreInstall;
window.toggleReading = readings.toggleReading;
window.exportLitCalICS = readings.exportLitCalICS;
window.removeAdv = ui.removeAdv;
window.updateMFChip = ui.updateMFChip;
window.toggleTemp = ui.toggleTemp;
window.applyQuickFilter = ui.applyQuickFilter;
window.verifyOk = more.verifyOk;
window.renderSaved = saved.renderSaved;
window.closeCCC = ccc.closeCCC;
window.cccNavigate = ccc.cccNavigate;
window.cccGoBack = ccc.cccGoBack;
window.init = init;

// ── Chip clicks ──
document.querySelectorAll('.chip[data-filter]').forEach(function(chip) {
  chip.addEventListener('click', function() {
    document.querySelectorAll('.chip[data-filter]').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    state.currentFilter = chip.dataset.filter;
    if (['today', 'weekend'].includes(state.currentFilter)) { state.currentSort = 'next_service'; ui.updateSortLabel(); }
    data.filterChurches(); render.renderCards();
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
    if (document.getElementById('cccSheet').classList.contains('open')) ccc.closeCCC();
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
window.addEventListener('appinstalled', function() { window._deferredInstallPrompt = null; more.dismissMoreInstall(); });

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

// ── Init ──
async function init() {
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

    state.allChurches = data.processChurches(churchData.churches || []);

    // Load events from static JSON
    try {
      var evtResp = await fetch('events.json', { signal: AbortSignal.timeout(5000) });
      if (evtResp.ok) {
        var evtData = await evtResp.json();
        state.eventsData = (evtData.events || []).sort(function(a, b) { return (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '').localeCompare(b.time || ''); });
        var ycFromEvents = state.eventsData.filter(function(e) { return e.category === 'yc'; });
        if (ycFromEvents.length) state.ycEvents = ycFromEvents;
        console.log('[MassFinder] Loaded events:', state.eventsData.length, ', YC:', ycFromEvents.length);
      }
    } catch (e) { console.warn('[MassFinder] events not available:', e.message); }
    console.log('[MassFinder] churches:', state.allChurches.length, ', ycEvents:', state.ycEvents.length);

    // Show Lent chip if in season
    var lentChip = document.getElementById('lentChip');
    if (lentChip && utils.isLentSeason()) lentChip.style.display = '';
    var sm = utils.smartDefault(); state.currentFilter = sm;
    document.querySelectorAll('.chip[data-filter]').forEach(function(ch) { ch.classList.toggle('active', ch.dataset.filter === sm); });
    if (['today', 'weekend'].includes(sm)) state.currentSort = 'next_service';
    ui.updateSortLabel(); location_.initLocation(); data.filterChurches(); render.renderCards();

    // Deep link
    if (location.hash) {
      var id = location.hash.slice(1);
      if (state.allChurches.find(function(c) { return c.id === id; })) setTimeout(function() { render.openDetail(id); }, 400);
    }

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

init();
