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

var state = data.state;

// Count events this week at favorited churches
function _weeklyEventsAtFavs() {
  if (!state.eventsData || !state.favorites.length) return 0;
  var now = new Date();
  var today = now.toISOString().slice(0, 10);
  var end = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  var favSet = {};
  state.favorites.forEach(function(id) { favSet[id] = true; });
  return state.eventsData.filter(function(e) {
    if (!favSet[e.church_id]) return false;
    var d = e.date || '';
    return d >= today && d <= end;
  }).length;
}

// Wire cross-module callback for favorite toggle
state._onFavToggle = function(id) {
  render.renderCards();
  var db = document.querySelector('.detail-action-btn.fav-btn');
  if (db && db.dataset.id === id) {
    db.classList.toggle('fav-active', data.isFav(id));
    db.querySelector('svg').setAttribute('fill', data.isFav(id) ? 'currentColor' : 'none');
  }
  // Update saved count badges — show weekly event count at favorited churches
  var evtCount = _weeklyEventsAtFavs();
  var tabBadge = document.getElementById('savedTabBadge');
  if (tabBadge) { tabBadge.textContent = evtCount || ''; tabBadge.classList.toggle('visible', evtCount > 0); }
  var countBadge = document.getElementById('savedCountBadge');
  if (countBadge) { countBadge.textContent = evtCount || ''; countBadge.classList.toggle('visible', evtCount > 0); }
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
  if (btn) btn.textContent = next === 'dark' ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode';
  var meta = document.getElementById('metaThemeColor');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#1A1C22' : '#F8F7F4');
};
window.init = init;
window.renderDailyReflection = _renderDailyReflection;

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

// ── Liturgical Teaser on Find tab (Change 1 + 17 + 22) ──
function _renderLiturgicalTeaser(events) {
  var el = document.getElementById('liturgicalTeaser');
  if (!el) return;
  var now = utils.getNow(), m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d && !e.is_vigil_mass; });
  if (!today.length) return;

  // Pick highest-grade celebration
  var pick = today.sort(function(a, b) { return (b.grade || 0) - (a.grade || 0); })[0];
  var color = (pick.color && pick.color[0]) || 'green';
  var colorMap = { purple: '#6B21A8', red: '#DC2626', white: '#94A3B8', green: '#16A34A', rose: '#DB2777' };
  var colorHex = colorMap[color] || '#16A34A';
  var gradeLabels = { 0: '', 1: 'Commemoration', 2: 'Optional Memorial', 3: 'Memorial', 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
  var rank = gradeLabels[pick.grade] || '';
  if (pick.holy_day_of_obligation) rank = (rank ? rank + ' \u2014 ' : '') + 'Holy Day of Obligation';

  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var dateLabel = months[now.getMonth()] + ' ' + now.getDate();

  el.innerHTML = '<div class="teaser-card" style="--teaser-color:' + colorHex + '">'
    + '<div class="teaser-color-bar"></div>'
    + '<div class="teaser-content">'
    + '<div class="teaser-date">' + utils.esc(dateLabel) + (rank ? ' \u00b7 ' + utils.esc(rank) : '') + '</div>'
    + '<div class="teaser-name">' + utils.esc(pick.name) + '</div>'
    + '</div></div>';
  el.style.display = '';

  // ── Season progress bar (Change 17) ──
  var progress = utils.getSeasonProgress();
  if (progress) {
    el.innerHTML += '<div class="season-progress">'
      + '<div class="season-progress-bar" style="width:' + progress.pct + '%"></div>'
      + '<span class="season-progress-label">Day ' + progress.day + ' of ' + progress.total + ' \u00b7 ' + progress.season + '</span>'
      + '</div>';
  }

  // ── Time-aware notes (Change 22) ──
  var dow = now.getDay();
  var season = document.documentElement.getAttribute('data-season');
  // Friday abstinence during Lent
  if (dow === 5 && season === 'lent') {
    var note = document.createElement('div');
    note.className = 'teaser-note';
    note.textContent = 'Abstinence from meat today (Lenten Friday)';
    el.appendChild(note);
  }
  // HDO tomorrow
  var tomorrow = new Date(now.getTime() + 86400000);
  var tm = tomorrow.getMonth() + 1, td = tomorrow.getDate();
  var tomorrowHDO = events.filter(function(e) {
    return e.month === tm && e.day === td && e.holy_day_of_obligation && !e.is_vigil_mass;
  });
  if (tomorrowHDO.length) {
    var hdoNote = document.createElement('div');
    hdoNote.className = 'teaser-note teaser-note--hdo';
    hdoNote.textContent = 'Tomorrow: Holy Day of Obligation \u2014 ' + tomorrowHDO[0].name;
    el.appendChild(hdoNote);
  }
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
    // Truncate to ~200 chars at a sentence boundary
    var preview = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/>/g, '');
    if (preview.length > 220) {
      var cut = preview.lastIndexOf('.', 200);
      if (cut > 80) preview = preview.slice(0, cut + 1);
      else preview = preview.slice(0, 200).trim() + '\u2026';
    }
    el.innerHTML = '<div class="reflection-card" onclick="openCCC(\'' + num + '\')" role="button" tabindex="0">'
      + '<div class="reflection-label">Daily Reflection</div>'
      + '<div class="reflection-text">\u201C' + utils.esc(preview) + '\u201D</div>'
      + '<div class="reflection-cite">Catechism \u00A7' + num + ' \u2014 Tap to read more</div>'
      + '</div>';
    el.style.display = '';
  }).catch(function() { el.style.display = 'none'; });
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

    // Fetch liturgical season early so accent bar + wash render on first tab
    readings.fetchLiturgicalDay().then(function() {
      if (window._litcalCache) {
        readings.setLiturgicalSeason(window._litcalCache.events);
        _renderLiturgicalTeaser(window._litcalCache.events);
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

init();
