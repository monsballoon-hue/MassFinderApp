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

// src/config.js — THE canonical type definitions
// To add a new service type: add ONE entry to SERVICE_TYPES. Everything derives.

// ── Service Types ──
var SERVICE_TYPES = {
  sunday_mass:        { label: 'Sunday Mass',              group: 'Mass',                icon: 'church' },
  daily_mass:         { label: 'Daily Mass',               group: 'Mass',                icon: 'church' },
  communion_service:  { label: 'Communion Service (no priest)', group: 'Mass',            icon: 'church' },
  confession:         { label: 'Confession',               group: 'Sacraments',          icon: 'shield' },
  anointing_of_sick:  { label: 'Anointing of the Sick',    group: 'Sacraments',          icon: 'shield' },
  adoration:          { label: 'Adoration',                group: 'Adoration',           icon: 'sun' },
  perpetual_adoration:{ label: 'Perpetual Adoration',      group: 'Adoration',           icon: 'sun', perpetual: true },
  holy_hour:          { label: 'Holy Hour',                group: 'Adoration',           icon: 'sun' },
  rosary:             { label: 'Rosary',                   group: 'Prayer & Devotion',   icon: 'book' },
  stations_of_cross:  { label: 'Stations of the Cross',    group: 'Prayer & Devotion',   icon: 'book' },
  divine_mercy:       { label: 'Divine Mercy Chaplet',     group: 'Prayer & Devotion',   icon: 'book' },
  miraculous_medal:   { label: 'Miraculous Medal',         group: 'Prayer & Devotion',   icon: 'book' },
  novena:             { label: 'Novena',                   group: 'Prayer & Devotion',   icon: 'book' },
  devotion:           { label: 'Devotion',                 group: 'Prayer & Devotion',   icon: 'book' },
  vespers:            { label: 'Vespers',                  group: 'Prayer & Devotion',   icon: 'book' },
  gorzkie_zale:       { label: 'Gorzkie \u017bale',       group: 'Prayer & Devotion',   icon: 'book' },
  benediction:        { label: 'Benediction',              group: 'Prayer & Devotion',   icon: 'book' },
  prayer_group:       { label: 'Prayer Group',             group: 'Prayer & Devotion',   icon: 'book' },
  blessing:           { label: 'Blessing',                 group: 'Prayer & Devotion',   icon: 'book' },
  holy_thursday_mass: { label: "Mass of the Lord's Supper",group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  good_friday_service:{ label: 'Celebration of the Passion',group:'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  easter_vigil_mass:  { label: 'Easter Vigil',             group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  palm_sunday_mass:   { label: 'Palm Sunday Mass',         group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  easter_sunday_mass: { label: 'Easter Sunday Mass',       group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
};

// ── Day Types ──
var DAY_TYPES = {
  sunday:         { label: 'Sunday',              short: 'Sun', order: 0 },
  monday:         { label: 'Monday',              short: 'Mon', order: 1 },
  tuesday:        { label: 'Tuesday',             short: 'Tue', order: 2 },
  wednesday:      { label: 'Wednesday',           short: 'Wed', order: 3 },
  thursday:       { label: 'Thursday',            short: 'Thu', order: 4 },
  friday:         { label: 'Friday',              short: 'Fri', order: 5 },
  saturday:       { label: 'Saturday',            short: 'Sat', order: 6 },
  weekday:        { label: 'Weekday (Mon\u2013Fri)', short: 'M-F', order: 7,
                    expandsTo: ['monday','tuesday','wednesday','thursday','friday'] },
  daily:          { label: 'Daily',               short: 'Daily', order: 8,
                    expandsTo: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  first_friday:   { label: 'First Friday',        short: '1st Fri', order: 9 },
  first_saturday: { label: 'First Saturday',      short: '1st Sat', order: 10 },
  holyday:        { label: 'Holy Day',            short: 'HD', order: 11 },
  holyday_eve:    { label: 'Holy Day Eve',        short: 'HD Eve', order: 12 },
  lent:           { label: 'Lent',                short: 'Lent', order: 13, seasonal: true },
  good_friday:    { label: 'Good Friday',         short: 'GF', order: 14, seasonal: true },
  holy_thursday:  { label: 'Holy Thursday',       short: 'HT', order: 15, seasonal: true },
  holy_saturday:  { label: 'Holy Saturday',       short: 'HS', order: 16, seasonal: true },
  easter_vigil:   { label: 'Easter Vigil',        short: 'EV', order: 17, seasonal: true },
  palm_sunday:    { label: 'Palm Sunday',         short: 'PS', order: 18, seasonal: true },
  easter_sunday:  { label: 'Easter Sunday',       short: 'ES', order: 19, seasonal: true },
  civil_holiday:  { label: 'Civil Holiday',       short: 'Hol', order: 20 },
};

// ── Languages ──
var LANGUAGES = {
  en:  { label: 'English' },
  es:  { label: 'Spanish' },
  pl:  { label: 'Polish' },
  pt:  { label: 'Portuguese' },
  la:  { label: 'Latin' },
  fr:  { label: 'French' },
  vi:  { label: 'Vietnamese' },
  asl: { label: 'ASL' },
};

// ── Region (forkers change this) ──
var REGION = {
  name: 'Western New England',
  tagline: 'Catholic Services Directory',
  mapCenter: [42.38, -72.78],
  mapZoom: 9,
  gaId: 'G-0XWS7YKHED',
  web3FormsKey: '4f21ef78-9dc3-4f10-b1ad-3cdfad78d55b',
  readingsApiUrl: 'https://massfinder-readings-api.vercel.app/api/readings',
  dioceseUrl: 'https://diospringfield.org',
  dioceseName: 'Diocese of Springfield',
  states: ['MA', 'CT', 'VT', 'NH'],
  bounds: { minLat: 40.5, maxLat: 46.0, minLng: -74.5, maxLng: -70.5 },
};

// ── Clergy Roles ──
var CLERGY_ROLES = {
  pastor:              { label: 'Pastor',              rank: 1 },
  administrator:       { label: 'Administrator',       rank: 2 },
  provisional_priest:  { label: 'Provisional Priest',  rank: 3 },
  parochial_vicar:     { label: 'Parochial Vicar',     rank: 4 },
  in_residence:        { label: 'In Residence',        rank: 5 },
  senior_priest:       { label: 'Senior Priest',       rank: 6 },
  priest:              { label: 'Priest',              rank: 7 },
  deacon:              { label: 'Deacon',              rank: 8 },
  deacon_emeritus:     { label: 'Deacon Emeritus',     rank: 9 },
  deacon_retired:      { label: 'Deacon (Retired)',    rank: 10 },
  transitional_deacon: { label: 'Transitional Deacon', rank: 11 },
  bishop:              { label: 'Bishop',              rank: 0 },
  bishop_emeritus:     { label: 'Bishop Emeritus',     rank: 12 },
};

// ── Feature Flags ──
// Forkers can disable individual external API integrations without editing module code.
var FEATURES = {
  litcal: true,       // LitCal API — liturgical calendar, saint card, HDO banner
  bibleget: true,     // BibleGet API — verse-level Scripture text enhancement
  readings_api: true, // MassFinder Readings API — daily readings
  hdo_banner: true,   // Holy Day of Obligation banner on Find tab
};

// ── Derived Values (computed, never maintained separately) ──

// Service label map: { sunday_mass: 'Sunday Mass', ... }
var SVC_LABELS = {};
Object.keys(SERVICE_TYPES).forEach(function(k) { SVC_LABELS[k] = SERVICE_TYPES[k].label; });

// Service categories grouped: { 'Mass': ['sunday_mass','daily_mass','communion_service'], ... }
var SERVICE_GROUPS = {};
Object.keys(SERVICE_TYPES).forEach(function(k) {
  var g = SERVICE_TYPES[k].group;
  if (!SERVICE_GROUPS[g]) SERVICE_GROUPS[g] = [];
  SERVICE_GROUPS[g].push(k);
});

// Language display names: { en: 'English', es: 'Spanish', ... }
var LANG_NAMES = {};
Object.keys(LANGUAGES).forEach(function(k) { LANG_NAMES[k] = LANGUAGES[k].label; });

// Day display order
var DAY_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
var DAY_NAMES = {};
Object.keys(DAY_TYPES).forEach(function(k) { DAY_NAMES[k] = DAY_TYPES[k].label; });

// Enum arrays (for schema generation)
var SERVICE_TYPE_ENUM = Object.keys(SERVICE_TYPES);
var DAY_ENUM = Object.keys(DAY_TYPES);
var LANGUAGE_ENUM = Object.keys(LANGUAGES);

// ── Exports ──
// In the esbuild bundle these become accessible via the module system.
// For Node.js scripts (generate-schema.js), use: var config = require('../src/config.js');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SERVICE_TYPES: SERVICE_TYPES, DAY_TYPES: DAY_TYPES, LANGUAGES: LANGUAGES,
    REGION: REGION, CLERGY_ROLES: CLERGY_ROLES, FEATURES: FEATURES,
    SVC_LABELS: SVC_LABELS, SERVICE_GROUPS: SERVICE_GROUPS,
    DAY_ORDER: DAY_ORDER, DAY_NAMES: DAY_NAMES, LANG_NAMES: LANG_NAMES,
    SERVICE_TYPE_ENUM: SERVICE_TYPE_ENUM, DAY_ENUM: DAY_ENUM, LANGUAGE_ENUM: LANGUAGE_ENUM,
  };
}
