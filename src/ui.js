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

// src/ui.js — UI controls: filters, tabs, sorting, focus management
var config = require('./config.js');
var data = require('./data.js');
var utils = require('./utils.js');

var SVC_LABELS = config.SVC_LABELS;
var DAY_ORDER = config.DAY_ORDER;
var DAY_NAMES = config.DAY_NAMES;
var LANGUAGES = config.LANGUAGES;
var SERVICE_GROUPS = config.SERVICE_GROUPS;
var state = data.state;
var filterChurches = data.filterChurches;
var hasAdv = data.hasAdv;
var esc = utils.esc;

var LANG_NAMES = config.LANG_NAMES;

// ── Focus trap state ──
var _focusTrapHandler = null;
var _focusTrapEl = null;

// ── Remove Advanced Filter ──
function removeAdv(k, v) {
  state.advancedFilters[k] = state.advancedFilters[k].filter(function(x) { return x !== v; });
  var render = require('./render.js');
  render.renderPills();
  updateMFChip();
  filterChurches();
  render.renderCards();
}

// ── Update More Filters Chip ──
function updateMFChip() {
  var btn = document.getElementById('moreFiltersBtn');
  if (!btn) return;
  var c = state.advancedFilters.types.length + state.advancedFilters.days.length + state.advancedFilters.languages.length;
  btn.innerHTML = c > 0 ? 'Filters <span class="chip-count">' + c + '</span>' : 'More';
  btn.classList.toggle('active', c > 0);
}

// ── Open More Filters ──
function openMoreFilters() {
  state.tempAdvanced = JSON.parse(JSON.stringify(state.advancedFilters));
  renderFiltersBody();
  document.getElementById('filtersBackdrop').classList.add('open');
  document.getElementById('filtersOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  trapFocus(document.getElementById('filtersOverlay'));
}

// ── Close More Filters ──
function closeMoreFilters() {
  document.getElementById('filtersBackdrop').classList.remove('open');
  document.getElementById('filtersOverlay').classList.remove('open');
  document.body.style.overflow = '';
  releaseFocus();
}

// ── Clear Advanced Filters ──
function clearAdvancedFilters() {
  state.tempAdvanced = { types: [], days: [], languages: [] };
  state.currentFilter = 'all';
  document.querySelectorAll('.chip[data-filter]').forEach(function(ch) { ch.classList.toggle('active', ch.dataset.filter === 'all'); });
  renderFiltersBody();
}

// ── Apply Advanced Filters ──
function applyAdvancedFilters() {
  state.advancedFilters = JSON.parse(JSON.stringify(state.tempAdvanced));
  closeMoreFilters();
  var render = require('./render.js');
  render.renderPills();
  updateMFChip();
  filterChurches();
  render.renderCards();
}

// ── Toggle Temp Filter ──
function toggleTemp(k, v) {
  if (state.tempAdvanced[k].includes(v)) {
    state.tempAdvanced[k] = state.tempAdvanced[k].filter(function(x) { return x !== v; });
  } else {
    state.tempAdvanced[k].push(v);
  }
  renderFiltersBody();
}

// ── Apply Quick Filter (from More drawer) ──
function applyQuickFilter(filter) {
  state.currentFilter = filter;
  document.querySelectorAll('.chip[data-filter]').forEach(function(ch) { ch.classList.toggle('active', ch.dataset.filter === filter); });
  if (['today', 'weekend'].includes(filter)) { state.currentSort = 'next_service'; updateSortLabel(); }
  closeMoreFilters();
  filterChurches();
  var render = require('./render.js');
  render.renderCards();
  // Sync filter to map if initialized
  if (state.mapInitialized) {
    var mapMod = require('./map.js');
    mapMod.applyMapFilter();
  }
}

// ── Render Filters Body ──
function renderFiltersBody() {
  var body = document.getElementById('filtersBody');
  if (!body) return;
  var html = '';

  // Quick filters — shortcuts for chip-bar filters hidden on mobile
  var quickFilters = [
    { label: 'Confession', filter: 'confession' },
    { label: 'Adoration', filter: 'adoration' },
    { label: 'Latin Mass', filter: 'latin' },
    { label: 'Spanish Mass', filter: 'spanish' }
  ];
  if (utils.isLentSeason()) quickFilters.push({ label: 'Lent', filter: 'lent' });
  quickFilters.push({ label: 'YC Events', filter: 'yc' });
  html += '<div class="filter-group"><div class="filter-group-title">Quick Filters</div><div class="filter-group-grid">';
  for (var qi = 0; qi < quickFilters.length; qi++) {
    var qf = quickFilters[qi];
    var qActive = state.currentFilter === qf.filter;
    html += '<button class="filter-checkbox' + (qActive ? ' checked' : '') + '" onclick="applyQuickFilter(\'' + qf.filter + '\')">' + esc(qf.label) + '</button>';
  }
  html += '</div></div>';

  // Service type groups (from config.SERVICE_GROUPS)
  var groups = Object.keys(SERVICE_GROUPS);
  for (var gi = 0; gi < groups.length; gi++) {
    var cat = groups[gi];
    var types = SERVICE_GROUPS[cat];
    html += '<div class="filter-group"><div class="filter-group-title">' + esc(cat) + '</div><div class="filter-group-grid">';
    for (var ti = 0; ti < types.length; ti++) {
      var t = types[ti];
      var ch = state.tempAdvanced.types.includes(t);
      html += '<button class="filter-checkbox' + (ch ? ' checked' : '') + '" onclick="toggleTemp(\'types\',\'' + t + '\')">' + esc(SVC_LABELS[t] || t) + '</button>';
    }
    html += '</div></div>';
  }

  // Day filters
  html += '<div class="filter-group"><div class="filter-group-title">Day</div><div class="filter-group-grid">';
  for (var di = 0; di < DAY_ORDER.length; di++) {
    var d = DAY_ORDER[di];
    var dch = state.tempAdvanced.days.includes(d);
    html += '<button class="filter-checkbox' + (dch ? ' checked' : '') + '" onclick="toggleTemp(\'days\',\'' + d + '\')">' + DAY_NAMES[d] + '</button>';
  }
  html += '</div></div>';

  // Language filters — only languages found in allChurches (excluding English)
  var langs = {};
  state.allChurches.forEach(function(c) {
    c.services.forEach(function(s) {
      if (s.language && s.language !== 'en') langs[s.language] = true;
    });
  });
  var langKeys = Object.keys(langs);
  if (langKeys.length) {
    html += '<div class="filter-group"><div class="filter-group-title">Language</div><div class="filter-group-grid">';
    for (var li = 0; li < langKeys.length; li++) {
      var l = langKeys[li];
      var lch = state.tempAdvanced.languages.includes(l);
      html += '<button class="filter-checkbox' + (lch ? ' checked' : '') + '" onclick="toggleTemp(\'languages\',\'' + l + '\')">' + (LANG_NAMES[l] || l) + '</button>';
    }
    html += '</div></div>';
  }

  body.innerHTML = html;
}

// ── Toggle Sort ──
function toggleSort() {
  var modes = ['name', 'proximity', 'next_service'];
  state.currentSort = modes[(modes.indexOf(state.currentSort) + 1) % modes.length];
  if (state.currentSort === 'proximity') {
    if (state.userLat === null) {
      var location = require('./location.js');
      location.requestLocation();
      return;
    }
    var location2 = require('./location.js');
    location2.refreshLocation();
  }
  updateSortLabel();
  filterChurches();
  var render = require('./render.js');
  render.renderCards();
}

// ── Update Sort Label ──
function updateSortLabel() {
  var el = document.getElementById('sortLabel');
  if (!el) return;
  var labels = { name: 'By name', proximity: 'By distance', next_service: 'By next service' };
  el.textContent = labels[state.currentSort] || 'By name';
}

// ── Close All Panels ──
function closeAllPanels() {
  document.getElementById('eventDetailPanel').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailBackdrop').classList.remove('open');
  document.body.style.overflow = '';
  releaseFocus();
  if (window._lastFocused) window._lastFocused.focus();
  history.replaceState(null, '', location.pathname + location.search);
}

// ── Switch Tab ──
function switchTab(id, btn) {
  function doSwitch() {
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-item').forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    var panel = document.getElementById(id);
    panel.classList.add('active');
    panel.scrollTop = 0;
    window.scrollTo(0, 0);
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.body.classList.toggle('map-active', id === 'panelMap');

    if (id === 'panelMap' && !state.mapInitialized) {
      var map = require('./map.js');
      map.initMap();
      state.mapInitialized = true;
    } else if (id === 'panelMap' && state.mapInitialized) {
      // Re-apply filter and fit bounds to visible markers
      if (window._map) setTimeout(function() { window._map.invalidateSize(); }, 50);
      setTimeout(function() {
        var map2 = require('./map.js');
        map2.applyMapFilter();
      }, 100);
    }
    // ST-09: Stop saved refresh when switching away
    var savedMod = require('./saved.js');
    if (id === 'panelSaved') {
      savedMod.renderSaved();
      savedMod.startSavedRefresh();
    } else {
      savedMod.stopSavedRefresh();
    }
    if (id === 'panelMore') {
      if (!window._moreRendered) {
        var more = require('./more.js');
        more.renderMore();
        window._moreRendered = true;
      }
      // Clear daily content badge (Change 12)
      var moreBadge = document.getElementById('moreTabBadge');
      if (moreBadge) moreBadge.classList.remove('visible');
      localStorage.setItem('mf-more-seen', new Date().toISOString().slice(0, 10));
    }
  }
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(doSwitch);
  } else {
    doSwitch();
  }
}

// ── Trap Focus ──
function trapFocus(el) {
  _focusTrapEl = el;
  _focusTrapHandler = function(e) {
    if (e.key !== 'Tab') return;
    var focusable = _focusTrapEl.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', _focusTrapHandler);
}

// ── Release Focus ──
function releaseFocus() {
  if (_focusTrapHandler) {
    document.removeEventListener('keydown', _focusTrapHandler);
    _focusTrapHandler = null;
    _focusTrapEl = null;
  }
}

// ── Update Tab Index (roving tabindex for chip bar) ──
function updateTabIndex() {
  var bar = document.querySelector('.chip-bar');
  if (!bar) return;
  var btns = Array.from(bar.querySelectorAll('button.chip'));
  var act = bar.querySelector('.chip.active');
  btns.forEach(function(b) {
    b.setAttribute('tabindex', b === act ? '0' : '-1');
  });
}

module.exports = {
  removeAdv: removeAdv,
  updateMFChip: updateMFChip,
  openMoreFilters: openMoreFilters,
  closeMoreFilters: closeMoreFilters,
  clearAdvancedFilters: clearAdvancedFilters,
  applyAdvancedFilters: applyAdvancedFilters,
  toggleTemp: toggleTemp,
  renderFiltersBody: renderFiltersBody,
  toggleSort: toggleSort,
  updateSortLabel: updateSortLabel,
  closeAllPanels: closeAllPanels,
  switchTab: switchTab,
  trapFocus: trapFocus,
  releaseFocus: releaseFocus,
  updateTabIndex: updateTabIndex,
  applyQuickFilter: applyQuickFilter,
};
