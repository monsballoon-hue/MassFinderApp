// src/map.js — Map tab: Leaflet map with marker clusters
var utils = require('./utils.js');
var data = require('./data.js');
var config = require('./config.js');

var displayName = utils.displayName;
var esc = utils.esc;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var getNext = utils.getNext;
var state = data.state;
var SVC_LABELS = config.SVC_LABELS;

// ── Pin Icon ──
function createPinIcon(isHighlighted) {
  var color = isHighlighted ? '#B8963F' : '#2C3E5A';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">'
    + '<path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="' + color + '"/>'
    + '<circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>'
    + '<rect x="13.5" y="9" width="3" height="10" rx="1" fill="' + color + '"/>'
    + '<rect x="10" y="12.5" width="10" height="3" rx="1" fill="' + color + '"/>'
    + '</svg>';
  return L.divIcon({
    html: svg, className: '', iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -38]
  });
}

// ── Init Map ──
function initMap() {
  if (!window.L) return;
  var map = L.map('mapContainer', {
    center: config.REGION.mapCenter,
    zoom: config.REGION.mapZoom,
    zoomControl: true,
    attributionControl: true
  });
  window._map = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  // Custom cluster icons
  var cluster = L.markerClusterGroup({
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

  var defaultIcon = createPinIcon(false);
  var bounds = [];

  for (var i = 0; i < state.allChurches.length; i++) {
    var c = state.allChurches[i];
    if (!c.lat || !c.lng) continue;
    var marker = L.marker([c.lat, c.lng], { icon: defaultIcon });
    var next = getNext(c, 'all');
    var dist = getDist(c, state.userLat, state.userLng);

    // Build popup with inline onclick that uses lazy require
    popupHtml = '<div class="popup-card" data-church-id="' + c.id + '">';
    popupHtml += '<div class="popup-name">' + esc(displayName(c.name)) + '</div>';
    popupHtml += '<div class="popup-town">' + esc(c.city) + ', ' + esc(c.state) + '</div>';
    if (next) {
      popupHtml += '<div class="popup-next"><span class="popup-time">' + next.timeFormatted + '</span>';
      popupHtml += '<span class="popup-label">' + (SVC_LABELS[next.service.type] || next.service.type) + '</span></div>';
      popupHtml += '<div class="popup-day">' + next.dayLabel + '</div>';
    }
    if (dist !== null) {
      popupHtml += '<div class="popup-dist">' + fmtDist(dist) + ' away</div>';
    }
    popupHtml += '</div>';

    // Bind popup with click handler that uses lazy require for openDetail
    (function(churchId, html) {
      marker.bindPopup(html, { className: 'map-popup', closeButton: false, minWidth: 240, maxWidth: 280 });
      marker.on('popupopen', function() {
        var popupEl = marker.getPopup().getElement();
        if (popupEl) {
          var card = popupEl.querySelector('.popup-card');
          if (card) {
            card.onclick = function() {
              closeMapPopup();
              var render = require('./render.js');
              render.openDetail(churchId);
            };
          }
        }
      });
    })(c.id, popupHtml);

    cluster.addLayer(marker);
    bounds.push([c.lat, c.lng]);
  }

  map.addLayer(cluster);
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });

  // User location marker
  if (state.userLat !== null) {
    L.circleMarker([state.userLat, state.userLng], {
      radius: 8, fillColor: '#3478C6', fillOpacity: 1,
      color: 'white', weight: 3, opacity: 1
    }).addTo(map).bindPopup('Your location');
  }

  // Locate control
  var LocateControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      var btn = L.DomUtil.create('div', 'map-locate-btn');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/><circle cx="12" cy="12" r="8"/></svg>';
      btn.title = 'My location';
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        var location = require('./location.js');
        location.refreshLocation(function(ok) {
          if (ok && state.userLat !== null) map.setView([state.userLat, state.userLng], 13);
        });
        if (state.userLat !== null) map.setView([state.userLat, state.userLng], 13);
      });
      return btn;
    }
  });
  map.addControl(new LocateControl());
}

// ── Close Map Popup ──
function closeMapPopup() {
  if (window._map) window._map.closePopup();
}

module.exports = {
  createPinIcon: createPinIcon,
  initMap: initMap,
  closeMapPopup: closeMapPopup,
};
