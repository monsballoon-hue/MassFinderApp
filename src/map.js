// src/map.js — Map tab: Leaflet map with marker clusters, filtering, save actions
var utils = require('./utils.js');
var data = require('./data.js');
var config = require('./config.js');

var displayName = utils.displayName;
var esc = utils.esc;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var getNext = utils.getNext;
var state = data.state;
var isFav = data.isFav;
var SVC_LABELS = config.SVC_LABELS;

// Marker storage: { churchId: L.marker }
var _markers = {};
var _cluster = null;
var _map = null;

// ── Pin Icons ──
var _iconCache = {};
function _getIcon(type) {
  // type: 'default' | 'saved'
  if (_iconCache[type]) return _iconCache[type];
  var colors = {
    'default': { pin: '#2C3E5A', cross: '#2C3E5A' },
    'saved':   { pin: '#B8963F', cross: '#B8963F' }
  };
  var c = colors[type] || colors['default'];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">'
    + '<path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="' + c.pin + '"/>'
    + '<circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>'
    + '<rect x="13.5" y="9" width="3" height="10" rx="1" fill="' + c.cross + '"/>'
    + '<rect x="10" y="12.5" width="10" height="3" rx="1" fill="' + c.cross + '"/>'
    + '</svg>';
  _iconCache[type] = L.divIcon({
    html: svg, className: '', iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -38]
  });
  return _iconCache[type];
}

// ── Build popup HTML ──
function _buildPopup(c) {
  var next = getNext(c, 'all');
  var dist = getDist(c, state.userLat, state.userLng);
  var fav = isFav(c.id);

  var favSvg = '<svg viewBox="0 0 24 24" fill="' + (fav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" width="18" height="18">'
    + '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  var html = '<div class="popup-card" data-church-id="' + c.id + '">'
    + '<div class="popup-top">'
    + '<div class="popup-info">'
    + '<div class="popup-name">' + esc(displayName(c.name)) + '</div>'
    + '<div class="popup-town">' + esc(c.city) + ', ' + esc(c.state) + '</div>'
    + '</div>'
    + '<button class="popup-fav' + (fav ? ' popup-fav--active' : '') + '" data-id="' + c.id + '" aria-label="' + (fav ? 'Unsave' : 'Save') + '">' + favSvg + '</button>'
    + '</div>';

  if (next) {
    html += '<div class="popup-next"><span class="popup-time">' + next.timeFormatted + '</span>'
      + '<span class="popup-label">' + esc(SVC_LABELS[next.service.type] || next.service.type) + '</span></div>'
      + '<div class="popup-day">' + next.dayLabel + '</div>';
  }
  if (dist !== null) {
    html += '<div class="popup-dist">' + fmtDist(dist) + ' away</div>';
  }
  html += '</div>';
  return html;
}

// ── Wire popup event handlers ──
function _wirePopupEvents(mkr, church) {
  var popupEl = mkr.getPopup().getElement();
  if (!popupEl) return;

  var card = popupEl.querySelector('.popup-card');
  if (card) {
    card.onclick = function(e) {
      if (e.target.closest('.popup-fav')) return;
      closeMapPopup();
      var render = require('./render.js');
      render.openDetail(church.id);
    };
  }

  var favBtn = popupEl.querySelector('.popup-fav');
  if (favBtn) {
    favBtn.onclick = function(e) {
      e.stopPropagation();
      data.toggleFav(church.id, e);
      mkr.setIcon(_getIcon(isFav(church.id) ? 'saved' : 'default'));
      mkr.getPopup().setContent(_buildPopup(church));
      setTimeout(function() { _wirePopupEvents(mkr, church); }, 50);
    };
  }
}

// ── Apply filter to map markers ──
// Uses state.filteredChurches from data.filterChurches() so map matches Find tab exactly.
function applyMapFilter() {
  if (!_cluster || !_map) return;

  _cluster.clearLayers();
  var bounds = [];

  // Build a set of church IDs that pass the current Find tab filter
  var visibleIds = {};
  for (var fi = 0; fi < state.filteredChurches.length; fi++) {
    visibleIds[state.filteredChurches[fi].church.id] = true;
  }

  var ids = Object.keys(_markers);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var marker = _markers[id];
    var church = marker._churchRef;
    if (!church) continue;

    if (visibleIds[church.id]) {
      marker.setIcon(_getIcon(isFav(church.id) ? 'saved' : 'default'));
      _cluster.addLayer(marker);
      bounds.push([church.lat, church.lng]);
    }
  }

  // Update filter pill
  _updateFilterPill();

  // Always fit bounds to show all visible markers
  if (bounds.length) {
    _map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}

// ── Update floating filter pill ──
function _updateFilterPill() {
  var pill = document.getElementById('mapFilterPill');
  if (!pill) return;

  var filter = state.currentFilter || 'all';
  var hasSearch = !!state.searchQuery;
  var adv = state.advancedFilters || { types: [], days: [], languages: [] };
  var hasAdvanced = adv.types.length || adv.days.length || adv.languages.length;

  // Build label
  var label = '';
  var labels = {
    confession: 'Confession', adoration: 'Adoration', latin: 'Latin Mass',
    spanish: 'Spanish Mass', lent: 'Lent', today: 'Today',
    weekend: 'This Weekend', yc: 'YC Events',
    advent: 'Advent', easter: 'Easter', christmas: 'Christmas'
  };

  if (hasSearch) {
    label = '\u201C' + state.searchQuery + '\u201D';
  } else if (labels[filter]) {
    label = labels[filter];
  } else if (hasAdvanced) {
    var count = adv.types.length + adv.days.length + adv.languages.length;
    label = count + ' filter' + (count !== 1 ? 's' : '') + ' active';
  }

  // Hide chip bar when search is active (pill takes over); otherwise sync chip state
  var bar = document.getElementById('mapChipBar');
  if (bar) {
    bar.style.display = hasSearch ? 'none' : '';
    if (!hasSearch) _syncChipBar();
  }

  if (!label) {
    pill.style.display = 'none';
    return;
  }

  var visibleCount = _cluster ? _cluster.getLayers().length : 0;

  pill.innerHTML = '<span class="map-filter-pill-dot"></span>'
    + '<span class="map-filter-pill-label">' + esc(label) + ' \u00b7 ' + visibleCount + ' churches</span>'
    + '<button class="map-filter-pill-clear" onclick="clearMapFilter()" aria-label="Clear filter">\u2715</button>';
  pill.style.display = 'flex';
}

// ── Clear map filter (called from pill x button) ──
function clearMapFilter() {
  // Clear search
  state.searchQuery = '';
  var si = document.getElementById('searchInput');
  if (si) si.value = '';
  var sc = document.getElementById('searchClear');
  if (sc) sc.classList.remove('visible');
  // Clear advanced filters
  state.advancedFilters = { types: [], days: [], languages: [] };
  var ui = require('./ui.js');
  ui.updateMFChip();
  // Reset to all — clear chip active states
  ui.applyQuickFilter('all');
  _syncChipBar('none');
}

// ── Sync chip bar active state ──
function _syncChipBar(filter) {
  var bar = document.getElementById('mapChipBar');
  if (!bar) return;
  var active = filter || state.currentFilter || 'all';
  bar.querySelectorAll('.map-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.filter === active);
  });
}

// ── Init chip bar click handlers ──
function initChipBar() {
  var bar = document.getElementById('mapChipBar');
  if (!bar || bar._chipInit) return;
  bar._chipInit = true;

  // Inject seasonal chip if not ordinary time
  var season = document.documentElement.getAttribute('data-season') || 'ordinary';
  var seasonLabels = { lent: 'Lent', advent: 'Advent', easter: 'Easter', christmas: 'Christmas' };
  var seasonFilters = { lent: 'lent', advent: 'advent', easter: 'easter', christmas: 'christmas' };
  if (season !== 'ordinary' && seasonLabels[season]) {
    var btn = document.createElement('button');
    btn.className = 'map-chip';
    btn.dataset.filter = seasonFilters[season];
    btn.textContent = seasonLabels[season];
    bar.appendChild(btn);
  }

  bar.addEventListener('click', function(e) {
    var chip = e.target.closest('.map-chip');
    if (!chip) return;
    var filter = chip.dataset.filter;
    var wasActive = chip.classList.contains('active');
    if (wasActive) {
      // Deselect — show all
      chip.classList.remove('active');
      var ui = require('./ui.js');
      ui.applyQuickFilter('all');
      return;
    }
    _syncChipBar(filter);
    var ui = require('./ui.js');
    ui.applyQuickFilter(filter);
  });
}

// ── Init Map ──
function initMap() {
  if (!window.L) return;
  _map = L.map('mapContainer', {
    center: config.REGION.mapCenter,
    zoom: config.REGION.mapZoom,
    zoomControl: true,
    attributionControl: true
  });
  window._map = _map;

  // Tile layer — dark mode aware
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  _setTileLayer(isDark);

  // Cluster group
  _cluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    iconCreateFunction: function(c) {
      var count = c.getChildCount();
      var size = 36;
      if (count > 10) size = 42;
      if (count > 25) size = 50;
      return L.divIcon({
        html: '<div style="width:' + size + 'px;height:' + size + 'px;">' + count + '</div>',
        className: 'map-cluster',
        iconSize: [size + 12, size + 12]
      });
    }
  });

  // Create all markers
  var bounds = [];
  for (var i = 0; i < state.allChurches.length; i++) {
    var c = state.allChurches[i];
    if (!c.lat || !c.lng) continue;

    var saved = isFav(c.id);
    var marker = L.marker([c.lat, c.lng], { icon: _getIcon(saved ? 'saved' : 'default') });
    marker._churchRef = c;

    (function(church, mkr) {
      mkr.bindPopup(_buildPopup(church), {
        className: 'map-popup', closeButton: false, minWidth: 240, maxWidth: 280
      });
      mkr.on('popupopen', function() {
        mkr.getPopup().setContent(_buildPopup(church));
        _wirePopupEvents(mkr, church);
      });
    })(c, marker);

    _markers[c.id] = marker;
    bounds.push([c.lat, c.lng]);
  }

  // Add cluster group to map, then populate with filtered markers + fit bounds
  _map.addLayer(_cluster);
  initChipBar();
  applyMapFilter();

  // User location marker
  if (state.userLat !== null) {
    L.circleMarker([state.userLat, state.userLng], {
      radius: 8, fillColor: '#3478C6', fillOpacity: 1,
      color: 'white', weight: 3, opacity: 1
    }).addTo(_map).bindPopup('Your location');
  }

  // Locate control with loading feedback
  var LocateControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      var btn = L.DomUtil.create('div', 'map-locate-btn');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/><circle cx="12" cy="12" r="8"/></svg>';
      btn.title = 'My location';
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        btn.classList.add('map-locate-loading');
        var location = require('./location.js');
        location.refreshLocation(function(ok) {
          btn.classList.remove('map-locate-loading');
          if (ok && state.userLat !== null) {
            _map.setView([state.userLat, state.userLng], 13);
          } else if (!ok) {
            var render = require('./render.js');
            if (typeof render.showToast === 'function') render.showToast('Location unavailable');
          }
        });
        if (state.userLat !== null) _map.setView([state.userLat, state.userLng], 13);
      });
      return btn;
    }
  });
  _map.addControl(new LocateControl());
}

// ── Tile layer management (light/dark) ──
var _tileLayer = null;
function _setTileLayer(isDark) {
  if (_tileLayer && _map) _map.removeLayer(_tileLayer);
  if (isDark) {
    _tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19, subdomains: 'abcd'
    });
  } else {
    _tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    });
  }
  if (_map) _tileLayer.addTo(_map);
}

// Called when theme toggles
function updateTileTheme() {
  if (!_map) return;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  _setTileLayer(isDark);
}

// ── Close Map Popup ──
function closeMapPopup() {
  if (_map) _map.closePopup();
}

module.exports = {
  initMap: initMap,
  applyMapFilter: applyMapFilter,
  clearMapFilter: clearMapFilter,
  updateTileTheme: updateTileTheme,
  closeMapPopup: closeMapPopup,
};
