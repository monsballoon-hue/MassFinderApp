// src/more.js — More tab orchestrator (imports devotions.js + forms.js)
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');
var devotions = require('./devotions.js');
var forms = require('./forms.js');

var DAY_NAMES = config.DAY_NAMES;
var displayName = utils.displayName;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var isEventActive = utils.isEventActive;
var isLentSeason = utils.isLentSeason;
var state = data.state;

var DEVOTIONAL_GUIDES = devotions.DEVOTIONAL_GUIDES;
var renderGuide = devotions.renderGuide;

function _getNovenaSubtitle() {
  try {
    var all = JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
    var active = Object.keys(all);
    if (active.length === 1) {
      var novena = require('./novena.js');
      var t = all[active[0]];
      var totalDays = novena._getTotalDays(active[0]);
      var dayNum = novena._computeCurrentDay(t, totalDays) + 1;
      return 'Day ' + dayNum + ' of ' + totalDays;
    }
    if (active.length > 1) return active.length + ' novenas in progress';
  } catch (e) {}
  return 'Guided prayer tracking';
}

// Resolve card tiers: 3 sticky primary + 1 dynamic 4th slot
var STICKY_IDS = { prayerbook: true, rosary: true, examination: true };
function _resolveCardTiers(cards, promotedId, contextToday) {
  var sticky = [];
  var dynamic = [];
  cards.forEach(function(c) {
    if (STICKY_IDS[c.id]) sticky.push(c);
    else dynamic.push(c);
  });

  // Pick 4th primary card: promoted card wins, else default to chaplet
  var fourthCard = null;
  var secondary = [];
  dynamic.forEach(function(c) {
    if (!fourthCard && promotedId && c.id === promotedId) fourthCard = c;
    else secondary.push(c);
  });
  if (!fourthCard) {
    // Default: chaplet fills the 4th slot
    secondary = [];
    dynamic.forEach(function(c) {
      if (!fourthCard && c.id === 'chaplet') fourthCard = c;
      else secondary.push(c);
    });
  }

  // Sort secondary: contextual cards first
  if (contextToday && contextToday.length) {
    secondary.sort(function(a, b) {
      var aIdx = contextToday.indexOf(a.id);
      var bIdx = contextToday.indexOf(b.id);
      var aCtx = aIdx !== -1 ? aIdx : 999;
      var bCtx = bIdx !== -1 ? bIdx : 999;
      return aCtx - bCtx;
    });
  }

  var primary = sticky.concat(fourthCard ? [fourthCard] : []);
  return { primary: primary, secondary: secondary };
}

// PMD-03: Chaplet subtitle with Hour of Mercy logic
function _getChapletSubtitle() {
  var now = new Date();
  var hour = now.getHours();
  var min = now.getMinutes();
  if ((hour === 14 && min >= 30) || hour === 15) {
    return 'The Hour of Mercy';
  }
  return 'Prayed on rosary beads';
}

function _getRosarySubtitle() {
  var mysteries = { sunday: 'Glorious', monday: 'Joyful', tuesday: 'Sorrowful', wednesday: 'Glorious', thursday: 'Luminous', friday: 'Sorrowful', saturday: 'Joyful' };
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var today = days[new Date().getDay()];
  return mysteries[today] + ' Mysteries today';
}

// ── First Friday/Saturday Tracker (SOT-12) ──
function _getFirstFridayState() {
  try {
    return JSON.parse(localStorage.getItem('mf-first-friday') || '{}');
  } catch (e) { return {}; }
}

function _getNextFirstFriday() {
  var now = new Date();
  var d = new Date(now.getFullYear(), now.getMonth(), 1);
  // Find first Friday of current or next month
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  if (d < now) {
    // Already passed this month, get next month's
    d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  }
  return d;
}

function _getNextFirstSaturday() {
  var now = new Date();
  var d = new Date(now.getFullYear(), now.getMonth(), 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  if (d < now) {
    d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  }
  return d;
}

function _getFirstFridaySubtitle() {
  var st = _getFirstFridayState();
  var friCount = (st.fridays && st.fridays.length) || 0;
  var satCount = (st.saturdays && st.saturdays.length) || 0;
  if (friCount >= 9 && satCount >= 5) return { text: 'Both devotions complete', active: false };
  if (friCount > 0 || satCount > 0) {
    var parts = [];
    if (friCount > 0 && friCount < 9) parts.push(friCount + ' of 9 First Fridays');
    if (friCount >= 9) parts.push('9 First Fridays complete');
    if (satCount > 0 && satCount < 5) parts.push(satCount + ' of 5 First Saturdays');
    if (satCount >= 5) parts.push('5 First Saturdays complete');
    return { text: parts.join(' \u00b7 '), active: true };
  }
  // Show next date
  var nf = _getNextFirstFriday();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return { text: 'Next First Friday: ' + months[nf.getMonth()] + ' ' + nf.getDate(), active: false };
}

// Register with reader system
var reader = require('./reader.js');
reader.registerModule('firstfriday', {
  getTitle: function() { return 'First Friday & Saturday'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    _renderFirstFriday(bodyEl);
  },
  onClose: function() {}
});

var _ffTab = 'friday';

function _renderFirstFriday(bodyEl) {
  var st = _getFirstFridayState();
  var fridays = st.fridays || [];
  var saturdays = st.saturdays || [];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Tab bar
  var tabBar = '<div style="display:flex;gap:0;margin-bottom:var(--space-4);border-bottom:2px solid var(--color-border-light)">'
    + '<button onclick="window._ffSwitchTab(\'friday\')" style="flex:1;padding:var(--space-3);font-size:var(--text-sm);font-weight:var(--weight-semibold);border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (_ffTab === 'friday' ? 'var(--color-sacred)' : 'transparent') + ';color:' + (_ffTab === 'friday' ? 'var(--color-sacred-text)' : 'var(--color-text-tertiary)') + ';margin-bottom:-2px">First Friday</button>'
    + '<button onclick="window._ffSwitchTab(\'saturday\')" style="flex:1;padding:var(--space-3);font-size:var(--text-sm);font-weight:var(--weight-semibold);border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (_ffTab === 'saturday' ? 'var(--color-sacred)' : 'transparent') + ';color:' + (_ffTab === 'saturday' ? 'var(--color-sacred-text)' : 'var(--color-text-tertiary)') + ';margin-bottom:-2px">First Saturday</button>'
    + '</div>';

  var content = '';

  if (_ffTab === 'friday') {
    var friDots = '';
    for (var i = 0; i < 9; i++) {
      var done = i < fridays.length;
      friDots += '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;'
        + (done ? 'background:var(--color-sacred);color:white;border:2px solid var(--color-sacred)' : 'background:transparent;color:var(--color-text-tertiary);border:2px solid var(--color-border)')
        + '">' + (i + 1) + '</div>';
    }
    var nf = _getNextFirstFriday();
    content = '<div style="border-left:3px solid var(--color-sacred);padding-left:var(--space-4);margin-bottom:var(--space-4)">'
      + '<div style="font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;color:var(--color-heading);margin-bottom:var(--space-2)">Nine First Fridays</div>'
      + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-sacred-text);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-3)">Devotion to the Sacred Heart of Jesus</div>'
      + '</div>'

      // Progress
      + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);justify-content:center">' + friDots + '</div>'
      + (fridays.length >= 9
        ? '<div style="text-align:center;font-size:var(--text-sm);color:var(--color-verified);font-weight:var(--weight-semibold);margin-bottom:var(--space-4)">All nine First Fridays complete \u2714</div>'
        : '<div style="text-align:center;font-size:var(--text-xs);color:var(--color-text-tertiary);margin-bottom:var(--space-4)">Next First Friday: ' + months[nf.getMonth()] + ' ' + nf.getDate() + '</div>')

      // Description
      + '<div style="font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75;margin-bottom:var(--space-4)">'
      + '<p style="margin-bottom:var(--space-3)">Attend Mass and receive Holy Communion on nine consecutive first Fridays of the month, in reparation for offenses against the Sacred Heart of Jesus.</p>'
      + '<p style="margin-bottom:var(--space-3)">Jesus revealed to St. Margaret Mary Alacoque twelve promises for those who practice this devotion.</p>'
      + '<div style="margin:var(--space-3) 0;padding:var(--space-3) var(--space-4);border-left:2px solid var(--color-sacred);background:color-mix(in srgb, var(--color-sacred) 4%, transparent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-family:var(--font-prayer);font-style:italic;color:var(--color-text-primary);line-height:1.8">\u201cI will give them all the graces necessary for their state of life.\u201d<br>\u201cI will be their refuge during life and especially at the hour of death.\u201d<div style="font-style:normal;font-family:var(--font-body);font-size:var(--text-xs);color:var(--color-sacred-text);margin-top:var(--space-2)">\u2014 Jesus to St. Margaret Mary Alacoque</div></div>'
      + '<p><strong style="color:var(--color-text-primary)">Requirements:</strong> Attend Mass, receive Communion in a state of grace, and offer reparation to the Sacred Heart on the first Friday of nine consecutive months.</p>'
      + '</div>'

      // Prayer
      + '<details style="margin-bottom:var(--space-4)">'
      + '<summary style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);cursor:pointer;list-style:none;font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-text-primary);-webkit-tap-highlight-color:transparent">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0;color:var(--color-sacred)"><polyline points="6 9 12 15 18 9"/></svg>'
      + 'Act of Reparation to the Sacred Heart</summary>'
      + '<div style="padding:var(--space-4);border:1px solid var(--color-border-light);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)">'
      + '<div style="padding:var(--space-4);background:color-mix(in srgb, var(--color-sacred) 4%, transparent);border-left:2px solid var(--color-sacred);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.85;font-style:italic">'
      + 'Most sweet Jesus,<br>whose overflowing charity for men<br>is requited by so much forgetfulness,<br>negligence and contempt,<br>behold us prostrate before Thee,<br>eager to repair by a special act of homage<br>the cruel indifference and injuries<br>to which Thy loving Heart is everywhere subjected.<br><br>'
      + 'Mindful, alas!<br>that we ourselves have had a share<br>in such great indignities,<br>which we now deplore from the depths of our hearts,<br>we humbly ask Thy pardon<br>and declare our readiness to atone by voluntary expiation,<br>not only for our own personal offenses,<br>but also for the sins of those who,<br>straying far from the path of salvation,<br>refuse in their obstinate infidelity to follow Thee,<br>their Shepherd and Leader,<br>or, renouncing the promises of their Baptism,<br>have cast off the sweet yoke of Thy law.<br><br>'
      + 'We are now resolved to expiate<br>each and every deplorable outrage committed against Thee;<br>we are now determined to make amends<br>for the manifold offenses against Christian modesty<br>in unbecoming dress and behavior,<br>for all the foul seductions laid to ensnare the feet of the innocent,<br>for the frequent violations of Sundays and holy days,<br>and the shocking blasphemies uttered against Thee and Thy Saints.<br><br>'
      + 'We offer Thee in reparation<br>our prayers and sacrifices,<br>and unite them to those of our Blessed Mother<br>and all the Saints.<br><br><strong style="font-style:normal">Amen.</strong>'
      + '</div></div></details>'

      // Log button
      + (fridays.length < 9
        ? '<button onclick="window._logFirstFriday()" style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px;margin-bottom:var(--space-3)">Log This Month\u2019s First Friday \u2714</button>'
        : '')
      + '<button onclick="readerClose();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))" style="display:block;width:100%;padding:var(--space-3);background:none;border:1.5px solid var(--color-primary);color:var(--color-primary);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">Find Mass near you</button>';

  } else {
    var satDots = '';
    for (var j = 0; j < 5; j++) {
      var sDone = j < saturdays.length;
      satDots += '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;'
        + (sDone ? 'background:var(--color-sacred);color:white;border:2px solid var(--color-sacred)' : 'background:transparent;color:var(--color-text-tertiary);border:2px solid var(--color-border)')
        + '">' + (j + 1) + '</div>';
    }
    var ns = _getNextFirstSaturday();
    content = '<div style="border-left:3px solid var(--color-sacred);padding-left:var(--space-4);margin-bottom:var(--space-4)">'
      + '<div style="font-family:var(--font-display);font-size:var(--text-lg);font-weight:700;color:var(--color-heading);margin-bottom:var(--space-2)">Five First Saturdays</div>'
      + '<div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-sacred-text);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-3)">Devotion to the Immaculate Heart of Mary</div>'
      + '</div>'

      // Progress
      + '<div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4);justify-content:center">' + satDots + '</div>'
      + (saturdays.length >= 5
        ? '<div style="text-align:center;font-size:var(--text-sm);color:var(--color-verified);font-weight:var(--weight-semibold);margin-bottom:var(--space-4)">All five First Saturdays complete \u2714</div>'
        : '<div style="text-align:center;font-size:var(--text-xs);color:var(--color-text-tertiary);margin-bottom:var(--space-4)">Next First Saturday: ' + months[ns.getMonth()] + ' ' + ns.getDate() + '</div>')

      // Description
      + '<div style="font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75;margin-bottom:var(--space-4)">'
      + '<p style="margin-bottom:var(--space-3)">Our Lady of F\u00e1tima asked that on five consecutive first Saturdays, the faithful make reparation to her Immaculate Heart for the blasphemies and ingratitude of men.</p>'
      + '<div style="margin:var(--space-3) 0;padding:var(--space-3) var(--space-4);border-left:2px solid var(--color-sacred);background:color-mix(in srgb, var(--color-sacred) 4%, transparent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-family:var(--font-prayer);font-style:italic;color:var(--color-text-primary);line-height:1.8">\u201cI will assist at the hour of death with the graces necessary for salvation all those who, on the first Saturday of five consecutive months, go to Confession, receive Holy Communion, pray five decades of the Rosary, and keep me company for 15 minutes while meditating on the mysteries of the Rosary.\u201d<div style="font-style:normal;font-family:var(--font-body);font-size:var(--text-xs);color:var(--color-sacred-text);margin-top:var(--space-2)">\u2014 Our Lady of F\u00e1tima</div></div>'
      + '<p><strong style="color:var(--color-text-primary)">Requirements each First Saturday:</strong></p>'
      + '<ol style="padding-left:var(--space-5);margin-top:var(--space-2)">'
      + '<li style="margin-bottom:var(--space-2)">Go to Confession (within 8 days before or after)</li>'
      + '<li style="margin-bottom:var(--space-2)">Receive Holy Communion</li>'
      + '<li style="margin-bottom:var(--space-2)">Pray five decades of the Rosary</li>'
      + '<li>Meditate for 15 minutes on the mysteries of the Rosary</li>'
      + '</ol>'
      + '</div>'

      // Prayer — Fatima Prayer
      + '<details style="margin-bottom:var(--space-4)">'
      + '<summary style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);cursor:pointer;list-style:none;font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-text-primary);-webkit-tap-highlight-color:transparent">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0;color:var(--color-sacred)"><polyline points="6 9 12 15 18 9"/></svg>'
      + 'Prayer to the Immaculate Heart of Mary</summary>'
      + '<div style="padding:var(--space-4);border:1px solid var(--color-border-light);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)">'
      + '<div style="padding:var(--space-4);background:color-mix(in srgb, var(--color-sacred) 4%, transparent);border-left:2px solid var(--color-sacred);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.85;font-style:italic">'
      + 'O Most Holy Virgin Mary,<br>tender Mother of men,<br>to fulfill the desires of the Sacred Heart of Jesus<br>and the request of the Vicar of Your Son on earth,<br>we consecrate ourselves and our families<br>to your Sorrowful and Immaculate Heart,<br>O Queen of the Most Holy Rosary.<br><br>'
      + 'Please accept our consecration, dearest Mother,<br>and use us as you wish<br>to accomplish your designs in the world.<br>O Immaculate Heart of Mary,<br>Queen of Heaven and earth,<br>rule over us and teach us<br>how to make the Heart of Jesus<br>reign and triumph in us and around us,<br>as it has reigned and triumphed in you.<br><br><strong style="font-style:normal">Amen.</strong>'
      + '</div></div></details>'

      // Rosary link
      + '<details style="margin-bottom:var(--space-4)">'
      + '<summary style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-4);background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);cursor:pointer;list-style:none;font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-primary);-webkit-tap-highlight-color:transparent">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16" style="flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>'
      + 'Pray the Rosary (required)</summary>'
      + '<div style="padding:var(--space-4);border:1px solid var(--color-border-light);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md);text-align:center">'
      + '<div style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">Pray five decades of the Rosary as part of your First Saturday devotion.</div>'
      + '<button onclick="window._ffOpenRosary()" style="padding:var(--space-2) var(--space-4);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-full);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:36px">Open Guided Rosary</button>'
      + '</div></details>'

      // Log button
      + (saturdays.length < 5
        ? '<button onclick="window._logFirstSaturday()" style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px;margin-bottom:var(--space-3)">Log This Month\u2019s First Saturday \u2714</button>'
        : '')
      + '<button onclick="readerClose();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))" style="display:block;width:100%;padding:var(--space-3);background:none;border:1.5px solid var(--color-primary);color:var(--color-primary);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">Find Mass near you</button>';
  }

  bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto">'
    + tabBar
    + content
    + '<div style="text-align:center;padding:var(--space-5) 0 var(--space-2)">'
    + '<button onclick="window._resetFirstFriday()" style="font-size:var(--text-xs);color:var(--color-text-tertiary);background:none;border:none;cursor:pointer">Reset all progress</button>'
    + '</div>'
    + '</div>';
}

function openFirstFriday() {
  reader.readerOpen('firstfriday');
}

window._logFirstFriday = function() {
  var haptics = require('./haptics.js');
  var st = _getFirstFridayState();
  var fridays = st.fridays || [];
  var now = new Date();
  var key = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  if (fridays.indexOf(key) === -1) {
    // Check consecutive — last entry should be previous month
    if (fridays.length > 0) {
      var last = fridays[fridays.length - 1].split('-');
      var lastDate = new Date(parseInt(last[0]), parseInt(last[1]) - 1, 1);
      var expected = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (lastDate.getTime() !== expected.getTime()) {
        // Gap — reset gracefully
        fridays = [];
      }
    }
    fridays.push(key);
    st.fridays = fridays;
    localStorage.setItem('mf-first-friday', JSON.stringify(st));
    haptics.confirm();
    _renderFirstFriday(document.getElementById('readerBody'));
  }
};

window._logFirstSaturday = function() {
  var haptics = require('./haptics.js');
  var st = _getFirstFridayState();
  var saturdays = st.saturdays || [];
  var now = new Date();
  var key = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  if (saturdays.indexOf(key) === -1) {
    if (saturdays.length > 0) {
      var last = saturdays[saturdays.length - 1].split('-');
      var lastDate = new Date(parseInt(last[0]), parseInt(last[1]) - 1, 1);
      var expected = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (lastDate.getTime() !== expected.getTime()) {
        saturdays = [];
      }
    }
    saturdays.push(key);
    st.saturdays = saturdays;
    localStorage.setItem('mf-first-friday', JSON.stringify(st));
    haptics.confirm();
    _renderFirstFriday(document.getElementById('readerBody'));
  }
};

window._ffOpenRosary = function() {
  reader.readerOpen('rosary');
};

window._ffSwitchTab = function(tab) {
  _ffTab = tab;
  _renderFirstFriday(document.getElementById('readerBody'));
};

window._resetFirstFriday = function() {
  if (!window._ffResetConfirm) {
    window._ffResetConfirm = true;
    var btn = event.target;
    btn.textContent = 'Tap again to confirm reset';
    btn.style.color = 'var(--color-error)';
    setTimeout(function() { window._ffResetConfirm = false; if (btn) { btn.textContent = 'Reset all progress'; btn.style.color = ''; } }, 3000);
    return;
  }
  window._ffResetConfirm = false;
  localStorage.removeItem('mf-first-friday');
  var haptics = require('./haptics.js');
  haptics.confirm();
  _renderFirstFriday(document.getElementById('readerBody'));
};

// ── Holy Week Guide Data (SOT-05) ──
var HOLY_WEEK_GUIDE = {
  PalmSun: {
    title: 'Palm Sunday',
    subtitle: 'The Lord\u2019s entrance into Jerusalem',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 3c0 4-3 7-6 9m7-9c0 4 3 7 6 9M12 3v18"/></svg>',
    body: '<p>Palm Sunday opens Holy Week with the blessing and procession of palms, recalling Christ\u2019s triumphal entry into Jerusalem. The crowd spread palms and cloaks before Him, crying \u201cHosanna!\u201d Yet the same week would bring His Passion and death.</p>'
      + '<p>The liturgy includes the longest Gospel reading of the year \u2014 the full Passion narrative. It is a day of joy shadowed by sorrow, inviting us to walk with Christ through the coming days.</p>',
    action: 'Find Mass near you \u2192',
    filter: 'weekend'
  },
  MonHolyWeek: {
    title: 'Monday of Holy Week',
    subtitle: 'The days of preparation deepen',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>The early days of Holy Week are marked by intensifying preparation. The Gospel readings recount events leading to the Passion \u2014 the anointing at Bethany, the prediction of betrayal, and Jesus\u2019s final teachings.</p>'
      + '<p>Many parishes offer additional weekday Masses, Confession times, and Lenten devotions during these days. It is a time for quiet reflection and spiritual readiness.</p>',
    action: 'Find Mass near you \u2192',
    searchTerm: 'Mass'
  },
  TueHolyWeek: {
    title: 'Tuesday of Holy Week',
    subtitle: 'Christ foretells His Passion',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>As the Paschal Triduum draws near, the Church\u2019s liturgy becomes more solemn. Tuesday\u2019s Gospel recounts Jesus telling His disciples that one of them will betray Him and that Peter will deny Him three times.</p>'
      + '<p>These readings invite honest self-examination. The Sacrament of Confession is particularly encouraged during these final days of Lent.</p>',
    action: 'Find Confession near you \u2192',
    filter: 'confession'
  },
  WedHolyWeek: {
    title: 'Wednesday of Holy Week',
    subtitle: 'Judas agrees to betray Jesus',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>On this day the Gospel recounts Judas Iscariot going to the chief priests and agreeing to hand Jesus over for thirty pieces of silver. The shadow of the Cross falls heavily over the remaining hours.</p>'
      + '<p>Wednesday of Holy Week is the last day before the Sacred Paschal Triduum. If you have not yet been to Confession this Lent, today is an important day to seek out the sacrament.</p>',
    action: 'Find Confession near you \u2192',
    filter: 'confession'
  },
  HolyThurs: {
    title: 'Holy Thursday',
    subtitle: 'Mass of the Lord\u2019s Supper tonight',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 15v6M17.5 9c0-3-2.5-6-5.5-6S6.5 6 6.5 9c0 3.5 5.5 6 5.5 6s5.5-2.5 5.5-6z"/></svg>',
    body: '<p>The Sacred Paschal Triduum begins with the evening Mass of the Lord\u2019s Supper. This liturgy commemorates three gifts Christ gave on the night before He died: the Eucharist, the priesthood, and the commandment of love through the washing of the feet.</p>'
      + '<p>After Mass, the Blessed Sacrament is carried in procession to the altar of repose, where the faithful keep vigil in prayer \u2014 recalling Christ\u2019s agony in the Garden of Gethsemane. Churches remain open late for this solemn watch.</p>',
    action: 'Find evening Mass near you \u2192',
    filter: 'weekend'
  },
  GoodFri: {
    title: 'Good Friday',
    subtitle: 'The Passion and death of the Lord',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
    body: '<p>Good Friday is the most solemn day of the Church year. There is no Mass \u2014 the only day this occurs. The afternoon liturgy includes the reading of the Passion according to John, the solemn intercessions, and the veneration of the Cross.</p>'
      + '<p>It is a day of fasting and complete abstinence from meat. The faithful are invited to observe silence, pray the Stations of the Cross, and enter into the mystery of Christ\u2019s sacrifice for our salvation.</p>',
    action: 'Find Stations of the Cross \u2192',
    searchTerm: 'Stations'
  },
  EasterVigil: {
    title: 'Holy Saturday',
    subtitle: 'The Easter Vigil tonight \u2014 the greatest liturgy of the year',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2c1.5 2.5 3 5 3 7.5a3 3 0 0 1-6 0C9 7 10.5 4.5 12 2z"/><line x1="12" y1="12" x2="12" y2="20"/></svg>',
    body: '<p>Holy Saturday is a day of profound quiet. The Church waits at the Lord\u2019s tomb. There is no Mass during the day \u2014 the tabernacle stands empty, the altar bare.</p>'
      + '<p>After nightfall, the Easter Vigil begins with the blessing of the new fire and the lighting of the Paschal Candle. The Church processes from darkness into light, reads the great stories of salvation history, and welcomes new members through Baptism, Confirmation, and First Eucharist. Then the Alleluia, silent since Ash Wednesday, rings out again.</p>',
    action: 'Find the Easter Vigil near you \u2192',
    filter: 'weekend'
  },
  Easter: {
    title: 'Easter Sunday',
    subtitle: 'He is risen! Alleluia!',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    body: '<p>\u201cThis is the day the Lord has made; let us rejoice and be glad in it.\u201d The Resurrection of Jesus Christ is the central event of the Christian faith and the foundation of everything the Church believes and proclaims.</p>'
      + '<p>Easter is not just a day \u2014 it is a season of fifty days, running from today through Pentecost Sunday. The Alleluia returns, the vestments are white and gold, and the Church celebrates with overflowing joy. Attend Mass with your family and enter into the mystery of new life.</p>',
    action: 'Find Easter Mass near you \u2192',
    filter: 'weekend'
  }
};

// ── Seasonal Moment Zone (SOT-01) ──
// Priority: 1=day-specific, 2=week-specific, 3=season-specific, 4=month-specific
// Max 2 visible cards at any time
function _renderSeasonalMoment(events) {
  var el = document.getElementById('seasonalMoment');
  if (!el) return;
  var esc = require('./utils.js').esc;
  var switchTab = require('./ui.js').switchTab;

  var candidates = [];

  // SOT-05: Holy Week day-by-day guide
  if (events && events.length) {
    for (var i = 0; i < events.length; i++) {
      var key = events[i].event_key || '';
      var hw = HOLY_WEEK_GUIDE[key];
      if (hw) {
        var actionHtml = '';
        if (hw.filter) {
          actionHtml = '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=' + hw.filter + ']\');if(c)c.click()">' + hw.action + '</div>';
        } else if (hw.searchTerm) {
          actionHtml = '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var si=document.getElementById(\'searchInput\');if(si){si.value=\'' + hw.searchTerm + '\';si.dispatchEvent(new Event(\'input\'))}">' + hw.action + '</div>';
        }
        var chevSvg = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        candidates.push({
          priority: 1,
          html: '<details class="seasonal-card">'
            + '<summary>'
            + '<div class="seasonal-card-icon">' + hw.icon + '</div>'
            + '<div class="seasonal-card-body">'
            + '<div class="seasonal-card-title">' + esc(hw.title) + '</div>'
            + '<div class="seasonal-card-subtitle">' + esc(hw.subtitle) + '</div>'
            + '</div>'
            + chevSvg
            + '</summary>'
            + '<div class="seasonal-card-expanded">'
            + hw.body
            + actionHtml
            + '</div>'
            + '</details>'
        });
        break; // Only one Holy Week card per day
      }
    }
  }

  // SOT-07: Divine Mercy Sunday (2nd Sunday of Easter)
  if (events && events.length) {
    var isDMS = events.some(function(e) { return (e.event_key || '') === 'Easter2'; });
    if (isDMS) {
      var dmsChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
      var dmsNovenaNote = '';
      try {
        var novTracking = JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
        if (novTracking.divine_mercy) dmsNovenaNote = '<p><strong>Your Divine Mercy Novena concludes today.</strong></p>';
      } catch (e) {}
      candidates.push({
        priority: 1,
        html: '<details class="seasonal-card">'
          + '<summary>'
          + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>'
          + '<div class="seasonal-card-body">'
          + '<div class="seasonal-card-title">Divine Mercy Sunday</div>'
          + '<div class="seasonal-card-subtitle">Plenary indulgence available today</div>'
          + '</div>'
          + dmsChev
          + '</summary>'
          + '<div class="seasonal-card-expanded">'
          + dmsNovenaNote
          + '<p>On this day, instituted by St. John Paul II in 2000, the Church celebrates God\u2019s infinite mercy. Jesus told St. Faustina: \u201cI desire that the Feast of Mercy be a refuge and shelter for all souls, and especially for poor sinners.\u201d</p>'
          + '<p>A plenary indulgence is granted to those who, on Divine Mercy Sunday, receive Communion, go to Confession (within about 20 days), pray for the Holy Father\u2019s intentions, and make an act of trust in God\u2019s mercy before the Blessed Sacrament or in prayer.</p>'
          + '<div class="seasonal-card-action" onclick="event.stopPropagation();openChaplet()">Pray the Divine Mercy Chaplet \u2192</div>'
          + '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var si=document.getElementById(\'searchInput\');if(si){si.value=\'Mass\';si.dispatchEvent(new Event(\'input\'))}">Find Mass near you \u2192</div>'
          + '</div>'
          + '</details>'
      });
    }
  }

  // SOT-06: Easter Alleluia + Regina Caeli (Easter Sunday through Pentecost)
  var currentSeason = document.documentElement.getAttribute('data-season') || 'ordinary';
  if (currentSeason === 'easter' && events && events.length) {
    // Don't show during Holy Week (already covered by SOT-05) or on Divine Mercy Sunday (SOT-07)
    var isHolyWeek = events.some(function(e) { var k = e.event_key || ''; return HOLY_WEEK_GUIDE[k]; });
    var isDivineMercy = events.some(function(e) { return (e.event_key || '') === 'Easter2'; });
    if (!isHolyWeek && !isDivineMercy) {
      var eChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
      candidates.push({
        priority: 3,
        html: '<details class="seasonal-card">'
          + '<summary>'
          + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg></div>'
          + '<div class="seasonal-card-body">'
          + '<div class="seasonal-card-title">Alleluia! \u2014 Easter Season</div>'
          + '<div class="seasonal-card-subtitle">The Church\u2019s most joyful 50 days</div>'
          + '</div>'
          + eChev
          + '</summary>'
          + '<div class="seasonal-card-expanded">'
          + '<p>Every Sunday of Easter is a \u201clittle Easter.\u201d The Alleluia, silent throughout Lent, rings out at every liturgy. The vestments are white and gold. The Church celebrates the Resurrection with overflowing joy for fifty days, from Easter Sunday through Pentecost.</p>'
          + '<p style="margin-top:var(--space-3);padding:var(--space-3);background:color-mix(in srgb, var(--color-accent) 4%, transparent);border-radius:var(--radius-sm);border-left:2px solid var(--color-accent)">'
          + '<strong style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.04em;color:var(--color-accent)">Regina Caeli</strong><br>'
          + '<em>Queen of Heaven, rejoice, alleluia.<br>'
          + 'For He whom you did merit to bear, alleluia,<br>'
          + 'Has risen as He said, alleluia.<br>'
          + 'Pray for us to God, alleluia.</em></p>'
          + '</div>'
          + '</details>'
      });
    }
  }

  // SOT-08: Pentecost Novena (Ascension through Pentecost)
  if (events && events.length) {
    var isAscension = events.some(function(e) { return (e.event_key || '') === 'Ascension'; });
    var isPentecost = events.some(function(e) { return (e.event_key || '') === 'Pentecost'; });
    // Also show during the days between Ascension and Pentecost
    var isPentecostWindow = currentSeason === 'easter' && !isAscension && !isPentecost;
    var now3 = new Date();
    // Rough check: mid-to-late May in Easter season = Pentecost novena window
    if (isPentecostWindow) isPentecostWindow = now3.getMonth() === 4 && now3.getDate() >= 15;

    if (isAscension || isPentecost || isPentecostWindow) {
      var pnChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
      var pnPriority = isAscension ? 1 : 2;
      var pnSubtitle = isAscension ? 'The Apostles\u2019 9-day vigil begins' : isPentecost ? 'Come, Holy Spirit!' : '9 days of prayer \u2014 Ascension to Pentecost';
      candidates.push({
        priority: pnPriority,
        html: '<details class="seasonal-card">'
          + '<summary>'
          + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2c1.5 2.5 3 5 3 7.5a3 3 0 0 1-6 0C9 7 10.5 4.5 12 2z"/><line x1="12" y1="12" x2="12" y2="20"/></svg></div>'
          + '<div class="seasonal-card-body">'
          + '<div class="seasonal-card-title">The Original Novena</div>'
          + '<div class="seasonal-card-subtitle">' + esc(pnSubtitle) + '</div>'
          + '</div>'
          + pnChev
          + '</summary>'
          + '<div class="seasonal-card-expanded">'
          + '<p>After Christ ascended into heaven, the Apostles and the Blessed Virgin Mary gathered in the Upper Room and prayed together for nine days. On the tenth day \u2014 Pentecost \u2014 the Holy Spirit descended upon them in tongues of fire. This was the first novena.</p>'
          + '<p>The Church invites the faithful to pray the Novena to the Holy Spirit during these nine days, asking for a fresh outpouring of the Spirit\u2019s gifts in our own lives.</p>'
          + '<div class="seasonal-card-action" onclick="event.stopPropagation();openNovena()">Start the Holy Spirit Novena \u2192</div>'
          + '</div>'
          + '</details>'
      });
    }
  }

  // PMD-06: Angelus / Regina Caeli — daily prayer of the Church
  var angelusChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  if (currentSeason === 'easter') {
    // Regina Caeli replaces Angelus from Easter Sunday through Pentecost
    candidates.push({
      priority: 3.5,
      html: '<details class="seasonal-card">'
        + '<summary>'
        + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg></div>'
        + '<div class="seasonal-card-body">'
        + '<div class="seasonal-card-title">Regina Caeli</div>'
        + '<div class="seasonal-card-subtitle">Queen of Heaven \u2014 Easter prayer</div>'
        + '</div>'
        + angelusChev
        + '</summary>'
        + '<div class="seasonal-card-expanded">'
        + '<div style="font-family:var(--font-prayer);font-size:var(--text-sm);line-height:1.85">'
        + '<p><span class="vr-label">V.</span> Queen of Heaven, rejoice, alleluia.<br>'
        + '<span class="vr-label">R.</span> <strong>For He whom you did merit to bear, alleluia.</strong></p>'
        + '<p><span class="vr-label">V.</span> Has risen as He said, alleluia.<br>'
        + '<span class="vr-label">R.</span> <strong>Pray for us to God, alleluia.</strong></p>'
        + '<p><span class="vr-label">V.</span> Rejoice and be glad, O Virgin Mary, alleluia.<br>'
        + '<span class="vr-label">R.</span> <strong>For the Lord is truly risen, alleluia.</strong></p>'
        + '<p style="margin-top:var(--space-3)">Let us pray. O God, who gave joy to the world through the Resurrection of Thy Son, our Lord Jesus Christ; grant, we beseech Thee, that through the intercession of the Virgin Mary, His Mother, we may obtain the joys of everlasting life. Through the same Christ our Lord. Amen.</p>'
        + '</div>'
        + '<div class="seasonal-card-action" onclick="event.stopPropagation();openPrayerBook(\'regina_caeli\')">See in Prayer Book \u2192</div>'
        + '</div>'
        + '</details>'
    });
  } else {
    // Angelus — prayed year-round except Easter season
    candidates.push({
      priority: 3.5,
      html: '<details class="seasonal-card">'
        + '<summary>'
        + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg></div>'
        + '<div class="seasonal-card-body">'
        + '<div class="seasonal-card-title">The Angelus</div>'
        + '<div class="seasonal-card-subtitle">Morning, noon, and evening prayer</div>'
        + '</div>'
        + angelusChev
        + '</summary>'
        + '<div class="seasonal-card-expanded">'
        + '<div style="font-family:var(--font-prayer);font-size:var(--text-sm);line-height:1.85">'
        + '<p><span class="vr-label">V.</span> The Angel of the Lord declared unto Mary,<br>'
        + '<span class="vr-label">R.</span> <strong>And she conceived of the Holy Spirit.</strong></p>'
        + '<p style="font-style:italic;color:var(--color-text-secondary)">Hail Mary\u2026</p>'
        + '<p><span class="vr-label">V.</span> Behold the handmaid of the Lord,<br>'
        + '<span class="vr-label">R.</span> <strong>Be it done unto me according to Thy word.</strong></p>'
        + '<p style="font-style:italic;color:var(--color-text-secondary)">Hail Mary\u2026</p>'
        + '<p><span class="vr-label">V.</span> And the Word was made flesh,<br>'
        + '<span class="vr-label">R.</span> <strong>And dwelt among us.</strong></p>'
        + '<p style="font-style:italic;color:var(--color-text-secondary)">Hail Mary\u2026</p>'
        + '<p style="margin-top:var(--space-3)">Let us pray. Pour forth, we beseech Thee, O Lord, Thy grace into our hearts; that we, to whom the Incarnation of Christ, Thy Son, was made known by the message of an angel, may by His Passion and Cross be brought to the glory of His Resurrection. Through the same Christ our Lord. Amen.</p>'
        + '</div>'
        + '<div class="seasonal-card-action" onclick="event.stopPropagation();openPrayerBook(\'angelus\')">See in Prayer Book \u2192</div>'
        + '</div>'
        + '</details>'
    });
  }

  // SOT-09: Monthly Devotion Card (lowest priority — fills empty slots)
  var MONTHLY_DEVOTIONS = [
    { month: 0, title: 'January: The Holy Name of Jesus', subtitle: 'Devotion to the Sacred Name', body: '<p>January is dedicated to the Holy Name of Jesus. The feast of the Holy Name (January 3) celebrates the Name above all names, at which \u201cevery knee should bend\u201d (Philippians 2:10). The faithful are encouraged to invoke the Holy Name with reverence throughout this month.</p>' },
    { month: 1, title: 'February: The Holy Family', subtitle: 'Patron of families and home life', body: '<p>February is dedicated to the Holy Family of Jesus, Mary, and Joseph. The faithful are invited to pray for the sanctification of family life and to look to the Holy Family as a model of love, obedience, and faithfulness in the domestic church.</p>' },
    { month: 2, title: 'March: Month of St. Joseph', subtitle: 'Patron of the Universal Church', body: '<p>March is dedicated to St. Joseph, foster father of Jesus and patron of the Universal Church. His feast day falls on March 19. The faithful are encouraged to seek his intercession for workers, fathers, and those facing difficult decisions.</p>', action: 'Pray the St. Joseph Novena \u2192', actionFn: 'openNovena()' },
    { month: 3, title: 'April: Month of the Eucharist', subtitle: 'The source and summit of the Christian life', body: '<p>April is dedicated to devotion to the Blessed Sacrament. The Eucharist is \u201cthe source and summit of the Christian life\u201d (<span class="ccc-ref">CCC 1324</span>). The faithful are encouraged to attend Mass, visit the Blessed Sacrament, and deepen their understanding of this central mystery.</p>' },
    { month: 4, title: 'May: Month of Mary', subtitle: 'Queen of the Most Holy Rosary', body: '<p>May is dedicated to the Blessed Virgin Mary. The faithful are invited to pray the Rosary daily, participate in May Crowning devotions, and entrust themselves to Our Lady\u2019s intercession.</p>', action: 'Pray the Rosary \u2192', actionFn: 'openRosary()' },
    { month: 5, title: 'June: The Sacred Heart of Jesus', subtitle: 'Devotion to Christ\u2019s infinite love', body: '<p>June is dedicated to the Sacred Heart of Jesus, whose feast falls on the Friday after Corpus Christi. This devotion centers on Christ\u2019s boundless love for humanity, symbolized by His heart aflame. The faithful are encouraged to make acts of reparation and to consecrate themselves to the Sacred Heart.</p>' },
    { month: 6, title: 'July: The Precious Blood', subtitle: 'The price of our redemption', body: '<p>July is dedicated to the Precious Blood of Jesus, shed for the salvation of the world. The faithful are invited to meditate on the sacrifice of Calvary and to receive the Eucharist with renewed gratitude for the gift of redemption.</p>' },
    { month: 7, title: 'August: The Immaculate Heart of Mary', subtitle: 'A heart united perfectly to Christ', body: '<p>August is dedicated to the Immaculate Heart of Mary, whose memorial falls on the Saturday after the Sacred Heart. The faithful are invited to entrust their lives to her maternal care and to imitate her perfect union with her Son.</p>' },
    { month: 8, title: 'September: Our Lady of Sorrows', subtitle: 'The Seven Sorrows of the Blessed Mother', body: '<p>September is dedicated to Our Lady of Sorrows, whose memorial falls on September 15. The faithful are encouraged to meditate on the seven sorrows Mary endured \u2014 from Simeon\u2019s prophecy to the burial of Jesus \u2014 and to unite their own sufferings with hers.</p>' },
    { month: 9, title: 'October: Month of the Rosary', subtitle: 'The prayer that shaped history', body: '<p>October is dedicated to the Most Holy Rosary. The feast of Our Lady of the Rosary falls on October 7. The faithful are encouraged to pray the Rosary daily, either alone or with family, and to meditate on the mysteries of Christ\u2019s life.</p>', action: 'Pray the Rosary \u2192', actionFn: 'openRosary()' },
    { month: 10, title: 'November: The Holy Souls', subtitle: 'Remembering the faithful departed', body: '<p>November is dedicated to the Holy Souls in Purgatory. The month begins with All Saints\u2019 Day (November 1) and All Souls\u2019 Day (November 2). The faithful are encouraged to pray for the dead, offer Masses for their intentions, and visit cemeteries in a spirit of hope in the resurrection.</p>' },
    { month: 11, title: 'December: The Immaculate Conception', subtitle: 'Preparing for the coming of Christ', body: '<p>December is dedicated to the Immaculate Conception of the Blessed Virgin Mary, whose solemnity falls on December 8 and is a Holy Day of Obligation. As Advent unfolds, the Church looks to Mary\u2019s \u201cyes\u201d as the model of faith and readiness for the Lord\u2019s coming.</p>' }
  ];
  var nowMonth = new Date().getMonth();
  var md = MONTHLY_DEVOTIONS[nowMonth];
  if (md) {
    var mdChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    var mdAction = md.actionFn ? '<div class="seasonal-card-action" onclick="event.stopPropagation();' + md.actionFn + '">' + md.action + '</div>' : '';
    candidates.push({
      priority: 4,
      html: '<details class="seasonal-card">'
        + '<summary>'
        + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>'
        + '<div class="seasonal-card-body">'
        + '<div class="seasonal-card-title">' + esc(md.title) + '</div>'
        + '<div class="seasonal-card-subtitle">' + esc(md.subtitle) + '</div>'
        + '</div>'
        + mdChev
        + '</summary>'
        + '<div class="seasonal-card-expanded">'
        + md.body
        + mdAction
        + '</div>'
        + '</details>'
    });
  }

  // SOT-10: O Antiphons of Advent (December 17-23)
  var O_ANTIPHONS = {
    17: { latin: 'O Sapientia', english: 'O Wisdom', text: 'O Wisdom, who came from the mouth of the Most High, reaching from end to end and ordering all things mightily and sweetly: come and teach us the way of prudence.', ref: 'Isaiah 11:2\u20133' },
    18: { latin: 'O Adonai', english: 'O Lord', text: 'O Lord and Ruler of the house of Israel, who appeared to Moses in the flame of the burning bush and gave him the law on Sinai: come and redeem us with outstretched arm.', ref: 'Exodus 3:2' },
    19: { latin: 'O Radix Jesse', english: 'O Root of Jesse', text: 'O Root of Jesse, who stand as a sign for the peoples, before whom kings shall shut their mouths, whom the nations shall seek: come and deliver us, and delay not.', ref: 'Isaiah 11:10' },
    20: { latin: 'O Clavis David', english: 'O Key of David', text: 'O Key of David and Scepter of the house of Israel, who open and no one shuts, who shut and no one opens: come and lead forth the captive from prison, sitting in darkness and the shadow of death.', ref: 'Isaiah 22:22' },
    21: { latin: 'O Oriens', english: 'O Dayspring', text: 'O Dayspring, Brightness of the Light eternal and Sun of Justice: come and enlighten those who sit in darkness and the shadow of death.', ref: 'Malachi 4:2' },
    22: { latin: 'O Rex Gentium', english: 'O King of Nations', text: 'O King of Nations and their desired One, the Cornerstone that makes both one: come and save man whom you formed from the dust of the earth.', ref: 'Isaiah 28:16' },
    23: { latin: 'O Emmanuel', english: 'O God With Us', text: 'O Emmanuel, our King and Lawgiver, the Expected of the nations and their Savior: come and save us, O Lord our God.', ref: 'Isaiah 7:14' }
  };
  var nowDate = new Date();
  if (nowDate.getMonth() === 11 && O_ANTIPHONS[nowDate.getDate()]) {
    var oa = O_ANTIPHONS[nowDate.getDate()];
    var oaChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    candidates.push({
      priority: 1,
      html: '<details class="seasonal-card">'
        + '<summary>'
        + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>'
        + '<div class="seasonal-card-body">'
        + '<div class="seasonal-card-title">' + esc(oa.latin) + ' \u2014 ' + esc(oa.english) + '</div>'
        + '<div class="seasonal-card-subtitle">Dec ' + nowDate.getDate() + ' \u00b7 The O Antiphons of Advent</div>'
        + '</div>'
        + oaChev
        + '</summary>'
        + '<div class="seasonal-card-expanded">'
        + '<p style="font-style:italic">' + esc(oa.text) + '</p>'
        + '<p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-2)">' + esc(oa.ref) + '</p>'
        + '</div>'
        + '</details>'
    });
  }

  // SOT-12: First Friday/Saturday reminder card (day before and day of)
  var ffSt = _getFirstFridayState();
  var ffHasActive = (ffSt.fridays && ffSt.fridays.length > 0) || (ffSt.saturdays && ffSt.saturdays.length > 0);
  var nowD = new Date();
  var nextFri = _getNextFirstFriday();
  var nextSat = _getNextFirstSaturday();
  var dToFri = Math.ceil((nextFri - nowD) / (24 * 60 * 60 * 1000));
  var dToSat = Math.ceil((nextSat - nowD) / (24 * 60 * 60 * 1000));
  if ((dToFri <= 1 || dToSat <= 1) && ffHasActive) {
    var ffCardTitle = dToFri <= 1 ? 'First Friday' : 'First Saturday';
    var ffCardWhen = (dToFri === 0 || dToSat === 0) ? 'today' : 'tomorrow';
    var ffCardDevotion = dToFri <= 1 ? 'Sacred Heart devotion' : 'Immaculate Heart devotion';
    var ffChev = '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    candidates.push({
      priority: 1,
      html: '<details class="seasonal-card">'
        + '<summary>'
        + '<div class="seasonal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/></svg></div>'
        + '<div class="seasonal-card-body">'
        + '<div class="seasonal-card-title">' + esc(ffCardTitle) + ' is ' + ffCardWhen + '</div>'
        + '<div class="seasonal-card-subtitle">' + esc(ffCardDevotion) + ' \u2014 attend Mass</div>'
        + '</div>'
        + ffChev
        + '</summary>'
        + '<div class="seasonal-card-expanded">'
        + '<p>' + (dToFri <= 1
          ? 'Continue your Nine First Fridays devotion by attending Mass and receiving Holy Communion in reparation to the Sacred Heart of Jesus.'
          : 'Continue your Five First Saturdays devotion by going to Confession, receiving Communion, praying the Rosary, and meditating on the mysteries.')
        + '</p>'
        + '<div class="seasonal-card-action" onclick="event.stopPropagation();openFirstFriday()">Open tracker \u2192</div>'
        + '<div class="seasonal-card-action" onclick="event.stopPropagation();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Find Mass near you \u2192</div>'
        + '</div>'
        + '</details>'
    });
  }

  // Sort by priority (1 = highest), take top 2
  candidates.sort(function(a, b) { return a.priority - b.priority; });
  var top = candidates.slice(0, 2);

  el.innerHTML = top.map(function(c) { return c.html; }).join('');
}

// ── Seasonal CCC Spotlight (SOT-04) ──
var SEASONAL_CCC = {
  lent: [540, 1430, 1431, 1434, 1438, 1095, 1168, 1169, 538, 1451, 1452, 1455],
  easter: [638, 640, 641, 642, 647, 648, 651, 652, 655, 656, 729, 730],
  advent: [522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 524],
  christmas: [456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467],
  ordinary: [1691, 1692, 1693, 1694, 1695, 1696, 1697, 1698, 1699, 1700, 1701, 1702]
};

function _renderSeasonalCCC() {
  var el = document.getElementById('dailyFormation');
  if (!el) return;
  var esc = require('./utils.js').esc;
  var snippet = require('./snippet.js');

  var season = document.documentElement.getAttribute('data-season') || 'ordinary';
  var paragraphs = SEASONAL_CCC[season] || SEASONAL_CCC.ordinary;

  // Rotate weekly — deterministic based on week of year
  var now = new Date();
  var startOfYear = new Date(now.getFullYear(), 0, 1);
  var weekNum = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  var cccNum = paragraphs[weekNum % paragraphs.length];

  el.style.display = '';
  el.innerHTML = '<div class="formation-card">'
    + '<div class="formation-label">Catechism for the Season</div>'
    + '<span class="ref-tap ref-tap--ccc" role="button" tabindex="0" data-ccc="' + cccNum + '">CCC ' + cccNum + '</span>'
    + '<div style="font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75;margin-top:var(--space-3)">Loading\u2026</div>'
    + '</div>';

  // Wire the CCC pill
  var pill = el.querySelector('.ref-tap--ccc');
  if (pill) {
    pill.addEventListener('click', function(ev) {
      ev.stopPropagation();
      snippet.showSnippet('ccc', String(cccNum), pill);
    });
  }

  // Load the CCC paragraph text
  var cccData = require('./ccc-data.js');
  cccData.load().then(function(data) {
    if (!data || !data.paragraphs) return;
    var text = data.paragraphs[String(cccNum)] || '';
    if (!text) return;
    // Show first 2 sentences
    var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    var preview = sentences.slice(0, 2).join(' ').trim();
    var textEl = el.querySelector('[style*="font-prayer"]');
    if (textEl) textEl.textContent = preview;
  });
}

// ── renderMore ──
function renderMore() {
  // Lazy requires
  var events = require('./events.js');
  var getUpcomingYC = events.getUpcomingYC;
  var resolveYC = events.resolveYC;
  var fmtYCDate = events.fmtYCDate;
  var downloadEventIcal = events.downloadEventIcal;
  var render = require('./render.js');
  var openDetail = render.openDetail;
  var showToast = render.showToast;
  var readings = require('./readings.js');
  var fetchReadings = readings.fetchReadings;
  var fetchLiturgicalDay = readings.fetchLiturgicalDay;
  var setLiturgicalSeason = readings.setLiturgicalSeason;
  var renderHDOBanner = readings.renderHDOBanner;
  var renderFastingBanner = readings.renderFastingBanner;
  var updateHDOBadge = readings.updateHDOBadge;
  var renderSaintCard = readings.renderSaintCard;
  var switchTab = require('./ui.js').switchTab;

  var langCount = new Set();
  state.allChurches.forEach(function(c) {
    c.services.forEach(function(s) { if (s.language) langCount.add(s.language); });
  });

  // -- PWA INSTALL BANNER (compact) --
  (function() {
    var slot = document.getElementById('moreInstallCard');
    if (!slot) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Dismiss tracking: after 3 dismissals, suppress for 30 days
    var dismissCount = parseInt(localStorage.getItem('mf-install-dismiss-count') || '0', 10);
    var dismissUntil = localStorage.getItem('mf-install-dismiss-until');
    if (dismissUntil && new Date().toISOString().slice(0, 10) < dismissUntil) return;

    slot.innerHTML = '<div class="install-banner" id="moreInstallCardInner">'
      + '<svg class="install-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M12 18v-12"/><path d="M5 12l7 7 7-7"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg>'
      + '<span class="install-banner-text">Add to Home Screen</span>'
      + '<button class="install-banner-action" onclick="openInstallGuide()">How</button>'
      + '<button class="install-banner-close" onclick="dismissInstallCard()" aria-label="Dismiss">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button>'
      + '</div>';
  })();

  // SOT-04: Seasonal CCC Spotlight — deferred, needs UX refinement
  // _renderSeasonalCCC();

  // Prayer Tools grid
  var exam = require('./examination.js');
  var ptGrid = document.getElementById('prayerToolsGrid');
  if (ptGrid) {
    var confStatus = exam.getConfessionStatus();
    var confLabel = confStatus ? (confStatus.daysAgo === 0 ? 'Last confession: today' : confStatus.daysAgo === 1 ? 'Last confession: yesterday' : 'Last confession: ' + confStatus.daysAgo + ' days ago') : '';

    // EMT-03-A: SVG icons for prayer tools
    var ptIcons = {
      // PMB-08: Prayer Book — book with cross
      prayerbook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
      // Rosary: circle of beads with cross — simplified rosary silhouette
      rosary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="7"/><circle cx="12" cy="3" r="1.2"/><circle cx="5.5" cy="6.5" r="1.2"/><circle cx="5.5" cy="13.5" r="1.2"/><circle cx="18.5" cy="6.5" r="1.2"/><circle cx="18.5" cy="13.5" r="1.2"/><line x1="12" y1="17" x2="12" y2="20"/><line x1="10" y1="19" x2="14" y2="19"/></svg>',
      // Examination: heart with magnifying glass — self-examination
      examination: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      // Stations: Latin cross — matches existing cross SVG in stations.js
      stations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',
      // Novena: candle flame
      novena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 2.5 3 5 3 7.5a3 3 0 0 1-6 0C9 7 10.5 4.5 12 2z"/><rect x="10" y="12" width="4" height="9" rx="1"/><line x1="10" y1="15" x2="14" y2="15"/></svg>',
      // SOT-12: First Friday/Saturday — two small circles
      firstfriday: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/></svg>',
      // PMD-03: Divine Mercy Chaplet — rays radiating from center
      chaplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>'
    };
    var ptColors = {
      prayerbook: 'var(--color-sacred)',
      rosary: 'var(--color-sacred)',
      examination: 'var(--color-sacred)',
      stations: isLentSeason() ? 'var(--color-accent)' : 'var(--color-sacred)',
      novena: 'var(--color-sacred)',
      firstfriday: 'var(--color-sacred)',
      chaplet: 'var(--color-sacred)'
    };
    var ptBgColors = {
      prayerbook: 'var(--color-sacred-pale)',
      rosary: 'var(--color-sacred-pale)',
      examination: 'var(--color-sacred-pale)',
      stations: isLentSeason() ? 'var(--color-accent-pale)' : 'var(--color-sacred-pale)',
      novena: 'var(--color-sacred-pale)',
      firstfriday: 'var(--color-sacred-pale)',
      chaplet: 'var(--color-sacred-pale)'
    };

    // Contextual promotion — determines 4th primary slot from dynamic pool
    var promotedId = '';
    var novSub = _getNovenaSubtitle();
    var novenaActive = novSub.indexOf('Day') === 0 || novSub.indexOf('in progress') !== -1;
    if (novenaActive) {
      promotedId = 'novena';
    } else if (isLentSeason()) {
      promotedId = 'stations';
    }

    // 3 PM promotion for chaplet
    if (!promotedId) {
      var nowH = new Date().getHours();
      var nowM = new Date().getMinutes();
      if ((nowH === 14 && nowM >= 30) || nowH === 15) {
        promotedId = 'chaplet';
      }
    }

    // EMT-03-C: Active progress subtitle styling
    var chapletSub = _getChapletSubtitle();
    var ptSubtitleClass = {
      rosary: '',
      examination: confStatus && confStatus.daysAgo <= 7 ? 'prayer-tool-subtitle--active' : (confStatus && confStatus.daysAgo > 30 ? 'prayer-tool-subtitle--nudge' : ''),
      stations: '',
      novena: '',
      chaplet: chapletSub === 'The Hour of Mercy' ? 'prayer-tool-subtitle--active' : ''
    };
    // Enhance novena subtitle with active styling
    if (novenaActive) ptSubtitleClass.novena = 'prayer-tool-subtitle--active';

    // SOT-03: Seasonal novena auto-surfacing
    var seasonalNovenaLabel = '';
    var litEvents = (window._litcalCache && window._litcalCache.events) || [];
    var todayKeys = litEvents.map(function(e) { return e.event_key || ''; });
    // Divine Mercy Novena: Good Friday through Divine Mercy Sunday (9 days)
    var season = document.documentElement.getAttribute('data-season') || 'ordinary';
    if (season === 'easter' || todayKeys.indexOf('GoodFri') !== -1) {
      // Check if we're in the 9-day window (Good Friday to Divine Mercy Sunday)
      var now = new Date();
      var month = now.getMonth();
      var day = now.getDate();
      // Approximate: early April = Divine Mercy window
      if (todayKeys.indexOf('GoodFri') !== -1) {
        seasonalNovenaLabel = 'Divine Mercy Novena begins today';
      } else if (todayKeys.indexOf('Easter2') !== -1) {
        seasonalNovenaLabel = 'Divine Mercy Novena concludes today';
      } else if (month === 3 && day >= 3 && day <= 12) {
        // Rough window — between Good Friday and Divine Mercy Sunday
        seasonalNovenaLabel = 'Divine Mercy Novena';
      }
    }
    // Holy Spirit Novena: Ascension through Pentecost
    if (todayKeys.indexOf('Ascension') !== -1) {
      seasonalNovenaLabel = 'The original novena \u2014 Ascension to Pentecost';
    } else if (season === 'easter') {
      var now2 = new Date();
      if (now2.getMonth() === 4 && now2.getDate() >= 14 && now2.getDate() <= 24) {
        seasonalNovenaLabel = seasonalNovenaLabel || 'Holy Spirit Novena \u2014 Pentecost approaches';
      }
    }
    // St. Joseph Novena: March 10-19
    var nowM = new Date();
    if (nowM.getMonth() === 2 && nowM.getDate() >= 10 && nowM.getDate() <= 19) {
      seasonalNovenaLabel = seasonalNovenaLabel || 'Novena to St. Joseph \u2014 his feast is March 19';
    }

    if (seasonalNovenaLabel) {
      promotedId = 'novena';
      novSub = seasonalNovenaLabel;
      ptColors.novena = 'var(--color-accent)';
      ptBgColors.novena = 'var(--color-accent-pale)';
      ptSubtitleClass.novena = 'prayer-tool-subtitle--active';
    }

    // SOT-12: First Friday/Saturday subtitle + near-date promotion
    var ffSub = _getFirstFridaySubtitle();
    ptSubtitleClass.firstfriday = ffSub.active ? 'prayer-tool-subtitle--active' : '';
    var ffState = _getFirstFridayState();
    var ffHasStreak = (ffState.fridays && ffState.fridays.length > 0) || (ffState.saturdays && ffState.saturdays.length > 0);
    var nowFF = new Date();
    var nfDate = _getNextFirstFriday();
    var nsDate = _getNextFirstSaturday();
    var daysToFri = Math.ceil((nfDate - nowFF) / (24 * 60 * 60 * 1000));
    var daysToSat = Math.ceil((nsDate - nowFF) / (24 * 60 * 60 * 1000));
    var ffIsNear = daysToFri <= 1 || daysToSat <= 1;
    if (ffIsNear && ffHasStreak && !promotedId) {
      promotedId = 'firstfriday';
      if (daysToFri === 0) ffSub = { text: 'First Friday is today \u2014 attend Mass', active: true };
      else if (daysToFri === 1) ffSub = { text: 'First Friday is tomorrow', active: true };
      else if (daysToSat === 0) ffSub = { text: 'First Saturday is today', active: true };
      else if (daysToSat === 1) ffSub = { text: 'First Saturday is tomorrow', active: true };
      ptSubtitleClass.firstfriday = 'prayer-tool-subtitle--active';
    }

    // Build contextual relevance list for secondary sorting
    var contextToday = [];
    if (novenaActive || seasonalNovenaLabel) contextToday.push('novena');
    if (isLentSeason()) contextToday.push('stations');
    if (chapletSub === 'The Hour of Mercy') contextToday.push('chaplet');
    if (ffIsNear && ffHasStreak) contextToday.push('firstfriday');

    var ptCards = [
      { id: 'prayerbook', title: 'Prayer Book', subtitle: '31 essential prayers', action: 'openPrayerBook()', active: true },
      { id: 'rosary', title: 'Guided Rosary', subtitle: _getRosarySubtitle(), action: 'openRosary()', active: true },
      { id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for confession', action: 'openExamination()', active: true },
      { id: 'chaplet', title: 'Divine Mercy Chaplet', subtitle: chapletSub, action: 'openChaplet()', active: true },
      { id: 'stations', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : '14 stations of prayer', action: 'openStations()', active: true },
      { id: 'novena', title: 'Novena Tracker', subtitle: novSub, action: 'openNovena()', active: true },
      { id: 'firstfriday', title: 'First Friday & Saturday', subtitle: ffSub.text, action: 'openFirstFriday()', active: true }
    ];

    // Resolve tiers: 3 sticky + 1 dynamic 4th + contextual secondary sort
    var resolved = _resolveCardTiers(ptCards, promotedId, contextToday);

    // Render primary cards (tier 1) — vertical layout
    ptGrid.innerHTML = resolved.primary.map(function(c) {
      var isPromoted = c.id === promotedId;
      var iconHtml = ptIcons[c.id]
        ? '<div class="prayer-tool-icon" style="background:' + ptBgColors[c.id] + ';color:' + ptColors[c.id] + '">' + ptIcons[c.id] + '</div>'
        : '';
      var subClass = 'prayer-tool-subtitle' + (ptSubtitleClass[c.id] ? ' ' + ptSubtitleClass[c.id] : '');
      return '<div class="prayer-tool-card prayer-tool-card--primary' + (isPromoted ? ' prayer-tool-card--promoted' : '') + '"'
        + ' onclick="' + c.action + '" role="button" tabindex="0"'
        + (isPromoted ? ' style="border-left-color:' + ptColors[c.id] + '"' : '')
        + '>'
        + iconHtml
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
        + '<div class="' + subClass + '">' + esc(c.subtitle) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    // MTR-03: Secondary tools progressive disclosure
    var ptSecWrap = document.getElementById('prayerToolsSecondaryWrap');
    if (ptSecWrap && resolved.secondary.length > 0) {
      var hasPromotedInSec = resolved.secondary.some(function(c) { return c.id === promotedId; });

      var secHtml = resolved.secondary.map(function(c) {
        var isPromoted = c.id === promotedId;
        var iconHtml = ptIcons[c.id]
          ? '<div class="prayer-tool-icon" style="background:' + ptBgColors[c.id] + ';color:' + ptColors[c.id] + '">' + ptIcons[c.id] + '</div>'
          : '';
        var subClass = 'prayer-tool-subtitle' + (ptSubtitleClass[c.id] ? ' ' + ptSubtitleClass[c.id] : '');
        return '<div class="prayer-tool-card prayer-tool-card--secondary' + (isPromoted ? ' prayer-tool-card--promoted' : '') + '"'
          + ' onclick="' + c.action + '" role="button" tabindex="0"'
          + (isPromoted ? ' style="border-left-color:' + ptColors[c.id] + '"' : '')
          + '>'
          + iconHtml
          + '<div class="prayer-tool-body">'
          + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
          + '<div class="' + subClass + '">' + esc(c.subtitle) + '</div>'
          + '</div>'
          + '</div>';
      }).join('');

      if (hasPromotedInSec || resolved.secondary.length <= 1) {
        ptSecWrap.innerHTML = '<div class="prayer-tools-secondary">' + secHtml + '</div>';
      } else {
        ptSecWrap.innerHTML = '<details class="prayer-tools-more" id="ptMoreTools">'
          + '<summary class="prayer-tools-more-toggle">'
          + '<span>More tools</span>'
          + '<svg class="prayer-tools-more-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>'
          + '</summary>'
          + '<div class="prayer-tools-secondary" style="margin-top:var(--space-2)">' + secHtml + '</div>'
          + '</details>';
      }
    }

    // EMT-05: Library teaser — standalone card below grid
    var libTeaser = document.getElementById('libraryTeaser');
    if (libTeaser) {
      libTeaser.innerHTML = '<div class="library-teaser">'
        + '<div class="prayer-tool-icon" style="background:var(--color-surface-hover);color:var(--color-text-secondary)">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>'
        + '</div>'
        + '<div class="prayer-tool-body">'
        + '<div class="prayer-tool-title">Catholic Library</div>'
        + '<div class="prayer-tool-subtitle">Bible, Catechism & Catholic classics \u2014 coming soon</div>'
        + '</div>'
        + '</div>';
    }
  }

  // Devotional guides — pin current season's guide to top
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    var currentSeason = document.documentElement.getAttribute('data-season') || 'ordinary';
    var seasonalGuides = [];
    var otherGuides = [];
    DEVOTIONAL_GUIDES.forEach(function(g) {
      if (g.season && g.season === currentSeason) seasonalGuides.push(g);
      else if (g.season && g.season !== currentSeason) {} // hide non-current seasonal guides
      else otherGuides.push(g);
    });
    var orderedGuides = seasonalGuides.concat(otherGuides);
    var allGuideHtml = orderedGuides.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        var groupIcon = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
        return '<details class="devot-card devot-card--group">'
          + '<summary>' + groupIcon + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      var html = renderGuide(g, false);
      if (g.season === currentSeason) {
        html = html.replace('class="devot-card', 'class="devot-card devot-card--seasonal');
      }
      return html;
    });
    devotEl.innerHTML = allGuideHtml.join('');

    // Wire term definition taps (UX-07)
    devotions.initTermClicks(devotEl);

    // Wire Scripture reference taps (B-06)
    var refs = require('./refs.js');
    refs.initRefTaps(devotEl);

    // Wire inline .ccc-ref spans to use snippet system (openCCC is v1-gated)
    var snippet = require('./snippet.js');
    devotEl.querySelectorAll('.ccc-ref').forEach(function(el) {
      var numMatch = el.textContent.trim().match(/CCC\s*(\d+)/);
      if (!numMatch) return;
      var refNum = numMatch[1];
      el.removeAttribute('onclick');
      el.classList.add('ref-tap', 'ref-tap--ccc');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', refNum, el);
      });
    });

    // Wire CCC reference taps — replace <strong> with ref-tap pill spans
    devotEl.querySelectorAll('strong').forEach(function(el) {
      var m = el.textContent.trim().match(/^CCC ([\d\u2013\-]+):?$/);
      if (!m) return;
      var num = m[1];
      var span = document.createElement('span');
      span.className = 'ref-tap ref-tap--ccc';
      span.textContent = 'CCC\u00A0' + num;
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', 'Catechism paragraph ' + num);
      span.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', num, span);
      });
      el.parentNode.replaceChild(span, el);
    });
  }

  // MTR-01: Zone 3 open/close memory + count badge
  var deeperZone = document.getElementById('deeperZone');
  if (deeperZone) {
    var deeperPref = localStorage.getItem('mf-deeper-open');
    if (deeperPref === 'false') {
      deeperZone.removeAttribute('open');
    } else {
      deeperZone.setAttribute('open', '');
    }
    deeperZone.addEventListener('toggle', function() {
      localStorage.setItem('mf-deeper-open', deeperZone.open ? 'true' : 'false');
    });
    // MTR-07: Count badge
    var countEl = document.getElementById('deeperCount');
    if (countEl && devotEl) {
      var guideCount = devotEl.querySelectorAll('.devot-card:not(.devot-sub)').length;
      countEl.textContent = guideCount + ' guides';
    }
  }

  // Footer — simple link rows + version
  var footer = document.getElementById('moreFooter');
  if (footer) {
    footer.innerHTML = '<div class="more-footer-links">'
      + '<div class="more-footer-link more-footer-link--disabled"><span>Weekly Parish Bulletin</span><span class="more-footer-soon">Coming soon</span></div>'
      + '<button class="more-footer-link" onclick="openSettings()"><span>Settings</span><span class="more-footer-chevron">\u203A</span></button>'
      + '</div>'
      + '<div onclick="window._devTap && window._devTap()" style="cursor:default" class="more-version">MassFinder v2</div>';
  }

  // Trigger readings and saint card fetches
  fetchReadings();
  fetchLiturgicalDay().then(function(events) {
    setLiturgicalSeason(events);
    renderHDOBanner(events);
    renderFastingBanner(events);
    updateHDOBadge(events);
    renderSaintCard(events);
    _renderSeasonalMoment(events);
  });

  window._moreRendered = true;
}

// ── dismissInstallCard ──
function dismissInstallCard() {
  var el = document.getElementById('moreInstallCardInner');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.2s';
    setTimeout(function() { if (el.parentElement) el.parentElement.innerHTML = ''; }, 250);
  }
  var count = parseInt(localStorage.getItem('mf-install-dismiss-count') || '0', 10) + 1;
  localStorage.setItem('mf-install-dismiss-count', String(count));
  if (count >= 3) {
    var d = new Date(); d.setDate(d.getDate() + 30);
    localStorage.setItem('mf-install-dismiss-until', d.toISOString().slice(0, 10));
  }
}

module.exports = {
  // Re-export forms for app.js window bindings
  expressInterest: forms.expressInterest,
  verifyOk: forms.verifyOk,
  showCorrectionForm: forms.showCorrectionForm,
  selectCorrPill: forms.selectCorrPill,
  submitCorrection: forms.submitCorrection,
  showMoreCorrection: forms.showMoreCorrection,
  selectMoreCorrPill: forms.selectMoreCorrPill,
  submitMoreCorrection: forms.submitMoreCorrection,
  selectFbType: forms.selectFbType,
  submitFeedback: forms.submitFeedback,
  submitSettingsContact: forms.submitSettingsContact,
  web3submit: forms.web3submit,
  // More tab own exports
  renderMore: renderMore,
  dismissInstallCard: dismissInstallCard,
  openFirstFriday: openFirstFriday,
  // Re-export devotions for external consumers
  renderGuide: renderGuide,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: forms.CORR_PLACEHOLDERS,
};
