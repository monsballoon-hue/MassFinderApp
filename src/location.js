// src/location.js — Geolocation: cookie persistence, permission handling, data refresh
var data = require('./data.js');
var utils = require('./utils.js');

var state = data.state;
var filterChurches = data.filterChurches;
var processChurches = data.processChurches;
var parishesToChurches = data.parishesToChurches;
var getNow = utils.getNow;

// ── saveLocationCookie ──
function saveLocationCookie() {
  if (state.userLat === null) return;
  var d = new Date();
  d.setHours(d.getHours() + 24);
  document.cookie = 'pf_loc=' + state.userLat.toFixed(4) + ',' + state.userLng.toFixed(4) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

// ── loadLocationCookie ──
function loadLocationCookie() {
  try {
    var c = document.cookie.split('; ').find(function(c) { return c.startsWith('pf_loc='); });
    if (!c) return false;
    var parts = c.split('=')[1].split(',');
    if (parts.length === 2) {
      state.userLat = parseFloat(parts[0]);
      state.userLng = parseFloat(parts[1]);
      return true;
    }
  } catch (e) { /* noop */ }
  return false;
}

// ── requestLocation ──
function requestLocation() {
  var showToast = require('./render.js').showToast;
  var updateSortLabel = require('./ui.js').updateSortLabel;
  var renderCards = require('./render.js').renderCards;

  if (!navigator.geolocation) { showToast('Location not available on this device'); return; }
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      state.userLat = pos.coords.latitude;
      state.userLng = pos.coords.longitude;
      saveLocationCookie();
      state.currentSort = 'proximity';
      updateSortLabel();
      filterChurches();
      renderCards();
    },
    function(err) {
      if (err.code === 1) showToast('Location access denied \u2014 sorting by name');
      else showToast('Could not get location \u2014 sorting by name');
      state.currentSort = 'name';
      updateSortLabel();
      filterChurches();
      renderCards();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ── initLocation ──
// On load: restore from cookie, silently refresh if permission granted
function initLocation() {
  var updateSortLabel = require('./ui.js').updateSortLabel;
  var renderCards = require('./render.js').renderCards;

  var hadCookie = loadLocationCookie();
  if (hadCookie) { state.currentSort = 'proximity'; updateSortLabel(); }
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then(function(r) {
      if (r.state === 'granted') {
        // Silently refresh coordinates
        navigator.geolocation.getCurrentPosition(function(pos) {
          state.userLat = pos.coords.latitude;
          state.userLng = pos.coords.longitude;
          saveLocationCookie();
          if (state.currentSort === 'proximity') { filterChurches(); renderCards(); }
        }, function() { /* noop */ }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      }
    }).catch(function() { /* noop */ });
  }
}

// ── refreshLocation ──
function refreshLocation(cb) {
  var renderCards = require('./render.js').renderCards;

  if (!navigator.geolocation) { if (cb) cb(false); return; }
  navigator.geolocation.getCurrentPosition(function(pos) {
    state.userLat = pos.coords.latitude;
    state.userLng = pos.coords.longitude;
    saveLocationCookie();
    if (state.currentSort === 'proximity') { filterChurches(); renderCards(); }
    if (cb) cb(true);
  }, function() {
    if (cb) cb(false);
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

// ── refreshApp ──
function refreshApp() {
  var showToast = require('./render.js').showToast;
  var renderCards = require('./render.js').renderCards;

  var btn = document.getElementById('refreshBtn');
  if (btn) btn.classList.add('spinning');
  refreshLocation(function() {
    // Try API first, fall back to static JSON
    fetch('/api/churches', { cache: 'no-store', signal: AbortSignal.timeout(8000) }).then(function(r) {
      if (!r.ok) throw new Error('API failed');
      return r.json();
    }).then(function(d) {
      if (!Array.isArray(d.churches) || !d.churches.length) throw new Error('invalid response');
      state.allChurches = processChurches(d.churches);
      filterChurches();
      renderCards();
      showToast('Data refreshed');
    }).catch(function() {
      // Fallback to static JSON
      fetch('parish_data.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) }).then(function(r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      }).then(function(d) {
        state.allChurches = processChurches(parishesToChurches(d.parishes || []));
        filterChurches();
        renderCards();
        showToast('Data refreshed');
      }).catch(function() {
        showToast('Could not refresh \u2014 check connection');
      });
    }).finally(function() {
      if (btn) btn.classList.remove('spinning');
    });
  });
}

module.exports = {
  saveLocationCookie: saveLocationCookie,
  loadLocationCookie: loadLocationCookie,
  requestLocation: requestLocation,
  initLocation: initLocation,
  refreshLocation: refreshLocation,
  refreshApp: refreshApp,
};
