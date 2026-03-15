// src/settings.js — Settings overlay (OW-25)
var utils = require('./utils.js');
var reader = require('./reader.js');
var esc = utils.esc;

// ── Reader module registration ──
reader.registerModule('settings', {
  getTitle: function() { return 'Settings'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    _render();
  },
  onClose: function() {}
});

// ── Open / Close ──
function openSettings() {
  reader.readerOpen('settings', {});
}

function closeSettings() {
  reader.readerClose();
}

// ── Render ──
function _render() {
  var body = document.getElementById('readerBody');
  if (!body) return;

  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var curSize = localStorage.getItem('mf-text-size') || 'default';
  var notifEnabled = localStorage.getItem('mf-notifications') === 'enabled';
  var notifSupported = 'Notification' in window;
  var rosaryPref = localStorage.getItem('mf-pref-rosary-mystery') || 'auto';
  var confTracking = localStorage.getItem('mf-pref-conf-tracking') !== 'off';
  var prayerLang = localStorage.getItem('mf-prayer-lang') || 'en';

  var html = '';

  // ── Notifications — disabled for v1, re-enable when ready ──

  // ── Display ──
  html += '<div class="settings-group">'
    + '<div class="settings-group-title">Display</div>'
    + '<div class="settings-row">'
    + '<span class="settings-label">Theme</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn' + (!isDark ? ' active' : '') + '" onclick="setSettingTheme(\'light\')">Light</button>'
    + '<button class="settings-seg-btn' + (isDark ? ' active' : '') + '" onclick="setSettingTheme(\'dark\')">Dark</button>'
    + '</div></div>'
    + '<div class="settings-row">'
    + '<span class="settings-label">Text Size</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn settings-seg-sm' + (curSize === 'small' ? ' active' : '') + '" onclick="setSettingSize(\'small\')">A</button>'
    + '<button class="settings-seg-btn' + (curSize === 'default' ? ' active' : '') + '" onclick="setSettingSize(\'default\')">A</button>'
    + '<button class="settings-seg-btn settings-seg-lg' + (curSize === 'large' ? ' active' : '') + '" onclick="setSettingSize(\'large\')">A</button>'
    + '<button class="settings-seg-btn settings-seg-xl' + (curSize === 'x-large' ? ' active' : '') + '" onclick="setSettingSize(\'x-large\')">A</button>'
    + '</div></div>'
    + '</div>';

  // ── Prayer ──
  html += '<div class="settings-group">'
    + '<div class="settings-group-title">Prayer</div>'
    + '<div class="settings-row">'
    + '<span class="settings-label">Prayer Language</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn' + (prayerLang === 'en' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'en\')">English</button>'
    + '<button class="settings-seg-btn' + (prayerLang === 'es' ? ' active' : '') + '" onclick="setSettingPrayerLang(\'es\')">Español</button>'
    + '</div></div>'
    + '<div class="settings-row">'
    + '<span class="settings-label">Rosary Mystery</span>'
    + '<div class="settings-seg">'
    + '<button class="settings-seg-btn' + (rosaryPref === 'auto' ? ' active' : '') + '" onclick="setSettingRosary(\'auto\')">Auto</button>'
    + '<button class="settings-seg-btn' + (rosaryPref === 'manual' ? ' active' : '') + '" onclick="setSettingRosary(\'manual\')">Manual</button>'
    + '</div></div>'
    + _toggleRow('Confession Date Tracking', 'settingsConfToggle', confTracking, 'toggleSettingConf()')
    + '</div>';

  // ── Privacy ──
  html += '<div class="settings-group">'
    + '<div class="settings-group-title">Privacy</div>'
    + '<button class="settings-action-btn" onclick="settingsClearPrayer()">Clear Prayer Activity</button>'
    + '<button class="settings-action-btn" onclick="settingsClearSaved()">Clear Saved Churches</button>'
    + '<button class="settings-action-btn settings-action-danger" onclick="settingsClearAll()">Clear All Data</button>'
    + '</div>';

  // ── About ──
  var lastUpdated = '';
  try {
    var raw = localStorage.getItem('mf-data-date');
    if (raw) lastUpdated = raw;
  } catch (e) {}

  html += '<div class="settings-group settings-about">'
    + '<div class="settings-group-title">About</div>'
    + '<div class="settings-about-block">'
    + '<p class="settings-about-text">Open source. <a href="https://github.com/monsballoon-hue/MassFinderApp" target="_blank" rel="noopener" style="color:var(--color-primary);text-decoration:none;font-weight:var(--weight-semibold)">View on GitHub \u2192</a></p>'
    + '</div>'
    + (lastUpdated ? '<div class="settings-about-row" style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--color-text-tertiary)">Parish data updated ' + esc(lastUpdated) + '</div>' : '')
    + '</div>';

  body.innerHTML = html;
}

function _toggleRow(label, id, checked, onclick) {
  return '<div class="settings-row">'
    + '<span class="settings-label">' + esc(label) + '</span>'
    + '<button class="settings-toggle' + (checked ? ' on' : '') + '" id="' + id + '" onclick="' + onclick + '" role="switch" aria-checked="' + checked + '">'
    + '<span class="settings-toggle-knob"></span>'
    + '</button></div>';
}

// ── Setting actions ──
function setSettingTheme(theme) {
  var html = document.documentElement;
  html.setAttribute('data-theme', theme);
  localStorage.setItem('mf-theme', theme);
  var meta = document.getElementById('metaThemeColor');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#1A1C22' : '#F8F7F4');
  var state = require('./data.js').state;
  if (state.mapInitialized) {
    var mapMod = require('./map.js');
    mapMod.updateTileTheme();
  }
  var btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  _render();
}

function setSettingSize(size) {
  if (size === 'default') document.documentElement.removeAttribute('data-text-size');
  else document.documentElement.setAttribute('data-text-size', size);
  localStorage.setItem('mf-text-size', size);
  document.querySelectorAll('.text-size-btn').forEach(function(b) { b.classList.remove('active'); });
  var active = document.querySelector('.text-size-btn[onclick*="' + size + '"]');
  if (active) active.classList.add('active');
  _render();
}

function toggleSettingNotif() {
  var current = localStorage.getItem('mf-notifications');
  if (current === 'enabled') {
    localStorage.setItem('mf-notifications', 'disabled');
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_REMINDER' });
    }
    _render();
    return;
  }
  if (!('Notification' in window)) return;
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      localStorage.setItem('mf-notifications', 'enabled');
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDER', hour: 8 });
      }
    }
    _render();
  });
}

function setSettingRosary(mode) {
  localStorage.setItem('mf-pref-rosary-mystery', mode);
  _render();
}

function setSettingPrayerLang(lang) {
  localStorage.setItem('mf-prayer-lang', lang);
  _render();
}

function toggleSettingConf() {
  var cur = localStorage.getItem('mf-pref-conf-tracking') !== 'off';
  localStorage.setItem('mf-pref-conf-tracking', cur ? 'off' : 'on');
  _render();
}

function settingsClearPrayer() {
  if (!confirm('Clear all prayer activity data? This includes rosary history, novena progress, and examination records.')) return;
  localStorage.removeItem('mf-prayer-log');
  localStorage.removeItem('mf-novena-tracking');
  localStorage.removeItem('mf-novena-active');
  localStorage.removeItem('mf-last-confession');
  var render = require('./render.js');
  if (render.showToast) render.showToast('Prayer data cleared');
  _render();
}

function settingsClearSaved() {
  if (!confirm('Remove all saved churches?')) return;
  localStorage.removeItem('mf-fav');
  var render = require('./render.js');
  if (render.showToast) render.showToast('Saved churches cleared');
  _render();
}

function settingsClearAll() {
  if (!confirm('Clear ALL MassFinder data? This will reset the app to its initial state.')) return;
  var keys = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf('mf-') === 0) keys.push(k);
  }
  keys.forEach(function(k) { localStorage.removeItem(k); });
  var render = require('./render.js');
  if (render.showToast) render.showToast('All data cleared');
  setTimeout(function() { location.reload(); }, 800);
}

module.exports = {
  openSettings: openSettings,
  closeSettings: closeSettings,
  setSettingTheme: setSettingTheme,
  setSettingSize: setSettingSize,
  toggleSettingNotif: toggleSettingNotif,
  setSettingRosary: setSettingRosary,
  setSettingPrayerLang: setSettingPrayerLang,
  toggleSettingConf: toggleSettingConf,
  settingsClearPrayer: settingsClearPrayer,
  settingsClearSaved: settingsClearSaved,
  settingsClearAll: settingsClearAll
};
