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

// src/data.js — App state + data operations
var config = require('./config.js');
var utils = require('./utils.js');

// ── Shared mutable state ──
var state = {
  allChurches: [],
  filteredChurches: [],
  favorites: [],
  userLat: null,
  userLng: null,
  currentFilter: 'all',
  currentSort: 'name',
  searchQuery: '',
  ycEvents: [],
  eventsData: [],
  advancedFilters: { types: [], days: [], languages: [] },
  tempAdvanced: { types: [], days: [], languages: [] },
  mapInitialized: false,
};

// ── Favorites (TD-15: migrated mf_fav → mf-fav) ──
function loadFav() {
  try {
    var raw = localStorage.getItem('mf-fav');
    if (!raw) { raw = localStorage.getItem('mf_fav'); if (raw) { localStorage.setItem('mf-fav', raw); localStorage.removeItem('mf_fav'); } }
    state.favorites = JSON.parse(raw || '[]');
  } catch (e) { state.favorites = []; }
}
function saveFav() { try { localStorage.setItem('mf-fav', JSON.stringify(state.favorites)); } catch (e) { /* noop */ } }
function isFav(id) { return state.favorites.includes(id); }
function toggleFav(id, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }
  if (isFav(id)) state.favorites = state.favorites.filter(function(f) { return f !== id; });
  else state.favorites.push(id);
  saveFav();
  // Re-render cards (circular dep — caller in app.js wires this)
  if (state._onFavToggle) state._onFavToggle(id);
}

// ── Search ──
// Build a per-church event text cache for search (rebuilt when events change)
var _evtSearchCache = {};
function rebuildEvtSearchCache() {
  _evtSearchCache = {};
  (state.eventsData || []).forEach(function(e) {
    var id = e.church_id;
    if (!id) return;
    var text = [e.title || '', e.notes || '', e.description || ''].join(' ');
    _evtSearchCache[id] = (_evtSearchCache[id] || '') + ' ' + text;
  });
  (state.ycEvents || []).forEach(function(e) {
    var id = e.church_id;
    if (!id) return;
    _evtSearchCache[id] = (_evtSearchCache[id] || '') + ' ' + (e.title || '');
  });
}

function matchSearch(c, q) {
  if (!q) return true;
  var f = [c.name, c.city, c.county, c.address].concat(
    (c.services || []).map(function(s) { return s.notes || ''; }),
    (c.services || []).map(function(s) { return config.LANG_NAMES[s.language] || ''; }),
    (c.services || []).map(function(s) { return config.SVC_LABELS[s.type] || ''; }),
    c.staff || [],
    [_evtSearchCache[c.id] || '']
  ).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every(function(w) { return f.includes(w); });
}

// ── Advanced Filters ──
function hasAdv() { return state.advancedFilters.types.length || state.advancedFilters.days.length || state.advancedFilters.languages.length; }
function matchAdv(c) {
  if (!hasAdv()) return true;
  var af = state.advancedFilters;
  if (af.types.length) { var ct = new Set(c.services.map(function(s) { return s.type; })); if (!af.types.some(function(t) { return ct.has(t); })) return false; }
  if (af.days.length) { var cd = new Set(c.services.map(function(s) { return s.day; })); if (!af.days.some(function(d) { return cd.has(d); })) return false; }
  if (af.languages.length) { var cl = new Set(c.services.map(function(s) { return s.language; })); if (!af.languages.some(function(l) { return cl.has(l); })) return false; }
  return true;
}

// ── Filter + Sort ──
function filterChurches() {
  state.filteredChurches = state.allChurches.map(function(c) {
    return { church: c, next: utils.getNext(c, state.currentFilter), distance: utils.getDist(c, state.userLat, state.userLng) };
  }).filter(function(item) {
    if (!matchSearch(item.church, state.searchQuery)) return false;
    if (!matchAdv(item.church)) return false;
    if (['confession', 'adoration', 'latin', 'spanish', 'today', 'weekend', 'lent'].includes(state.currentFilter)) return item.next !== null;
    if (['advent', 'easter'].includes(state.currentFilter)) return true; // seasonal badge, no service filter
    return true;
  });
  sortChurches();
}

function sortChurches() {
  if (state.currentSort === 'proximity' && state.userLat !== null) {
    state.filteredChurches.sort(function(a, b) { return (a.distance != null ? a.distance : 9999) - (b.distance != null ? b.distance : 9999); });
  } else if (state.currentSort === 'next_service') {
    state.filteredChurches.sort(function(a, b) {
      if (state.userLat !== null) {
        var aClose = (a.distance != null ? a.distance : 9999) <= 15;
        var bClose = (b.distance != null ? b.distance : 9999) <= 15;
        if (aClose !== bClose) return aClose ? -1 : 1;
      }
      return (a.next ? a.next.minutesUntil : 99999) - (b.next ? b.next.minutesUntil : 99999);
    });
  } else {
    state.filteredChurches.sort(function(a, b) { return a.church.name.localeCompare(b.church.name); });
  }

  // Float saved churches to top (after primary sort is applied)
  if (state.favorites && state.favorites.length) {
    var favSet = {};
    state.favorites.forEach(function(id) { favSet[id] = true; });
    var saved = [];
    var rest = [];
    state.filteredChurches.forEach(function(item) {
      if (favSet[item.church.id]) saved.push(item);
      else rest.push(item);
    });
    if (saved.length && rest.length) {
      state.filteredChurches = saved.concat(rest);
      state._savedSplitIndex = saved.length;
    } else {
      state._savedSplitIndex = 0;
    }
  } else {
    state._savedSplitIndex = 0;
  }
}

// ── Parish→Church migration map ──
var PARISH_CHURCH_MAP = {"parish_001":"st-marys-church-adams","parish_003":"st-john-the-evangelist-church-agawam","parish_004":"newman-catholic-center-amherst","parish_005":"st-brigid-church-amherst","parish_006":"st-francis-church-belchertown","parish_007":"st-christopher-church-brimfield","parish_010":"st-anne-church-chicopee","parish_011":"st-anthony-of-padua-church-chicopee","parish_012":"st-rose-de-lima-church-chicopee","parish_013":"ststans-basilica-chicopee","parish_016":"st-agnes-church-dalton","parish_017":"our-lady-of-the-valley-church-easthampton","parish_018":"st-michael-church-east-longmeadow","parish_019":"sacredheart-church-feedinghills","parish_021":"st-peter-church-great-barrington","parish_022":"blessed-sacrament-church-greenfield","parish_023":"most-holy-redeemer-church-hadley","parish_024":"st-mary-church-hampden","parish_025":"our-lady-of-grace-church-hatfield","parish_026":"our-lady-of-the-hills-church-haydenville","parish_027":"blessed-sacrament-church-holyoke","parish_028":"our-lady-of-the-cross-church-holyoke","parish_029":"st-jerome-church-holyoke","parish_030":"st-theresa-church-south-hadley","parish_031":"immaculate-conception-church-indian-orchard","parish_032":"st-mary-mother-of-the-church-church-lee","parish_033":"st-ann-church-lenox","parish_035":"st-mary-s-church-longmeadow","parish_036":"christ-the-king-church-ludlow","parish_037":"our-lady-of-fatima-church-ludlow","parish_038":"st-elizabeth-church-ludlow","parish_039":"st-patrick-church-monson","parish_041":"st-elizabeth-of-hungary-church-north-adams","parish_042":"seas-church-northampton","parish_043":"st-patrick-church-northfield","parish_044":"st-mary-church-orange","parish_046":"st-thomas-the-apostle-church-palmer","parish_047":"sacred-heart-church-pittsfield","parish_048":"st-charles-chapel-pittsfield","parish_049":"st-joseph-church-pittsfield","parish_050":"st-mark-church-pittsfield","parish_051":"holy-family-church-russell","parish_052":"our-lady-of-the-valley-sheffield","parish_053":"st-joseph-church-shelburne-falls","parish_054":"holy-family-south-deerfield","parish_055":"st-patrick-church-south-hadley","parish_057":"our-lady-of-the-lake-church-southwick","parish_058":"all-souls-church-springfield","parish_059":"blessed-sacrament-church-springfield","parish_060":"holy-cross-church-springfield","parish_061":"holy-name-church-springfield","parish_062":"mary-mother-of-hope-church-springfield","parish_064":"our-lady-of-the-sacred-heart-church-springfield","parish_065":"sacred-heart-church-springfield","parish_066":"st-catherine-of-siena-church-springfield","parish_067":"st-michael-s-cathedral-church-springfield","parish_068":"st-patrick-church-springfield","parish_069":"st-paul-the-apostle-church-springfield","parish_071":"divine-mercy-church-three-rivers","parish_072":"our-lady-of-czestochowa-church-turners-falls","parish_073":"our-lady-of-peace-church-turners-falls","parish_074":"st-marys-church-ware","parish_075":"st-mary-church-ware","parish_076":"st-thomas-the-apostle-church-west-springfield","parish_077":"holy-trinity-church-westfield","parish_078":"our-lady-of-the-blessed-sacrament-church-westfield","parish_079":"st-mary-church-westfield","parish_080":"st-peter-and-st-casimir-church-westfield","parish_082":"st-cecilia-church-wilbraham","parish_083":"sts-patrick-and-raphael-church-williamstown","shrine_001":"divine-mercy-shrine-stockbridge","parish_104":"ihm-church-granby","parish_106":"olmc-church-springfield","parish_107":"sacred-heart-church-milford","parish_084":"holy-family-church-enfield","parish_085":"st-bernard-church-enfield","parish_086":"st-patrick-church-enfield","parish_087":"st-martha-church-enfield","parish_088":"sacred-heart-church-suffield","parish_089":"church-of-the-annunciation-ludlow","parish_090":"st-marys-church-springfield","parish_091":"st-catherine-church-charlestown","parish_092":"st-charles-church-bellows-falls","parish_093":"st-michael-church-brattleboro","parish_094":"st-joseph-church-winsted","parish_095":"immaculate-conception-new-hartford","parish_096":"st-marys-church-simsbury","parish_097":"st-gabriel-church-windsor","parish_098":"st-mary-church-windsor-locks","parish_099":"ihm-chapel-harvard","parish_100":"st-augustine-church-north-branford","parish_101":"st-stanislaus-kostka-winchester","parish_102":"st-patrick-oratory-waterbury"};

function migrateFavorites() {
  var changed = false;
  state.favorites = state.favorites.map(function(id) {
    if (PARISH_CHURCH_MAP[id]) { changed = true; return PARISH_CHURCH_MAP[id]; }
    return id;
  });
  state.favorites = Array.from(new Set(state.favorites));
  if (changed) { saveFav(); console.log('[MassFinder] Migrated favorites to church IDs'); }
}

// ── Parish data transform ──
var WORSHIP_TYPES = ['church', 'chapel', 'mission', 'shrine', 'cathedral'];
function isWorship(loc) {
  if (!loc.type) return /church|chapel|basilica|cathedral|shrine|oratory/i.test(loc.name || '');
  return WORSHIP_TYPES.indexOf(loc.type) >= 0;
}

function parishesToChurches(parishes) {
  var churches = [];
  for (var i = 0; i < parishes.length; i++) {
    var p = parishes[i];
    var locs = p.locations || [];
    var ct = p.contact || {};
    if (!locs.length) continue;
    var wLocs = locs.filter(isWorship);
    if (!wLocs.length) wLocs = [locs[0]];
    var wIds = {};
    for (var k = 0; k < wLocs.length; k++) wIds[wLocs[k].id] = true;
    for (var j = 0; j < wLocs.length; j++) {
      var loc = wLocs[j];
      churches.push({
        id: loc.id, name: loc.name || p.name, short_name: loc.short_name || null,
        type: loc.type || 'church', address: loc.address || null,
        city: loc.city || p.town, state: loc.state || p.state,
        zip: loc.zip || p.zip || null, county: p.county || null,
        lat: loc.lat || null, lng: loc.lng || null,
        phone: ct.phone || null, website: ct.website || null,
        office_hours: ct.office_hours || null,
        established: p.established || null, status: p.status || 'active',
        is_accessible: loc.is_accessible != null ? loc.is_accessible : p.is_accessible,
        bulletin_url: p.bulletin_url || ct.bulletin_url || null,
        bulletin_group: wLocs.length > 1 ? p.id : null,
        clergy: p.clergy || null, staff: p.staff || [],
        validation: p.validation || null, visitation: p.visitation || null,
        services: (p.services || []).filter(function(s) {
          if (wLocs.length <= 1) return true;
          if (!s.location_id) return j === 0;
          if (s.location_id === loc.id) return true;
          if (!wIds[s.location_id]) return j === 0;
          return false;
        })
      });
    }
  }
  return churches;
}

function processChurches(churches) {
  var today = new Date().toISOString().slice(0, 10);
  return churches.filter(function(c) {
    return c.status === 'active' && (!c.validation || c.validation.status !== 'excluded');
  }).map(function(c) {
    c.services = (c.services || []).filter(function(s) {
      if (s.status === 'inactive' && s.end_date && s.end_date <= today) return false;
      if (s.effective_date && s.effective_date > today) return false;
      return true;
    });
    return c;
  });
}

module.exports = {
  state: state,
  loadFav: loadFav, saveFav: saveFav, isFav: isFav, toggleFav: toggleFav,
  matchSearch: matchSearch, hasAdv: hasAdv, matchAdv: matchAdv, rebuildEvtSearchCache: rebuildEvtSearchCache,
  filterChurches: filterChurches, sortChurches: sortChurches,
  migrateFavorites: migrateFavorites,
  parishesToChurches: parishesToChurches, processChurches: processChurches,
  PARISH_CHURCH_MAP: PARISH_CHURCH_MAP,
};
