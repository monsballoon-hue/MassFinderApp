// src/install-guide.js — Visual PWA install walkthrough
// CSS-drawn phone mockups with highlighted tap targets for iOS and Android.

function detectPlatform() {
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isCriOS = /CriOS/.test(ua);
  if (isIOS && isCriOS) return 'ios-chrome';
  if (isIOS) return 'ios-safari';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

// iOS share icon — arrow up from open box
var SHARE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">'
  + '<path d="M8 8l4-4 4 4"/><path d="M12 4v12"/>'
  + '<path d="M20 14v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5"/></svg>';

// "Add to Home Screen" icon — rounded square with +
var ATHS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right:8px;flex-shrink:0">'
  + '<rect x="3" y="3" width="18" height="18" rx="4"/>'
  + '<line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

// Bookmarks icon (open book)
var BOOK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">'
  + '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>'
  + '<path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>';

// Tabs icon (overlapping squares)
var TABS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">'
  + '<rect x="4" y="4" width="12" height="12" rx="2"/>'
  + '<path d="M8 2h10a2 2 0 012 2v10"/></svg>';

// Lock icon (padlock for URL bar)
var LOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14">'
  + '<rect x="3" y="11" width="18" height="11" rx="2"/>'
  + '<path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

// Position tap-ring centered on .highlight inside each .ig-phone
function _positionRings() {
  var phones = document.querySelectorAll('#installGuideOverlay .ig-phone');
  for (var i = 0; i < phones.length; i++) {
    var phone = phones[i];
    var hl = phone.querySelector('.highlight');
    var ring = phone.querySelector('.ig-tap-ring');
    if (!hl || !ring) continue;
    var pr = phone.getBoundingClientRect();
    var hr = hl.getBoundingClientRect();
    ring.style.left = (hr.left + hr.width / 2 - pr.left - 22) + 'px';
    ring.style.top = (hr.top + hr.height / 2 - pr.top - 22) + 'px';
  }
}

// ── iOS share sheet visual (shared by Safari step 2 and Chrome step 3) ──
function _iosShareSheetVisual() {
  return '<div class="ig-phone">'
    + '<div class="ig-phone-screen">'
    + '<div class="ig-share-sheet">'
    + '<div class="ig-sheet-ios">'
    + '<div class="ig-sheet-handle"></div>'
    + '<div class="ig-sheet-hdr">'
    + '<div class="ig-sheet-app-icon">\u271A</div>'
    + '<div class="ig-sheet-hdr-text">'
    + '<div class="ig-sheet-hdr-title">Catholic Services Dir\u2026</div>'
    + '<div class="ig-sheet-hdr-domain">massfinder.vercel.app</div>'
    + '</div></div>'
    + '<div class="ig-sheet-targets">'
    + '<div class="ig-sheet-target"><div class="ig-target-circle"></div>AirDrop</div>'
    + '<div class="ig-sheet-target"><div class="ig-target-circle"></div>Messages</div>'
    + '<div class="ig-sheet-target"><div class="ig-target-circle"></div>Mail</div>'
    + '</div>'
    + '<div class="ig-sheet-actions">'
    + '<div class="ig-sheet-action"><div class="ig-action-circle"></div>Copy</div>'
    + '<div class="ig-sheet-action"><div class="ig-action-circle"></div>Add to<br>Bookmarks</div>'
    + '<div class="ig-sheet-action"><div class="ig-action-circle"></div>View<br>More</div>'
    + '</div>'
    + '<div class="ig-sheet-group">'
    + '<div class="ig-sheet-row dim">Find in Page</div>'
    + '<div class="ig-sheet-row dim">Print</div>'
    + '</div>'
    + '<div class="ig-sheet-group">'
    + '<div class="ig-sheet-row highlight">' + ATHS_ICON + 'Add to Home Screen</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '<div class="ig-tap-ring"></div>'
    + '</div>';
}

// ── iOS Safari Steps (iOS 15+ bottom bar layout) ──
var IOS_SAFARI_STEPS = [
  {
    caption: 'Tap the <strong>Share</strong> \u2191 button next to the address bar',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-status-bar"><span>9:41</span></div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-safari-bottom">'
        + '<div class="ig-safari-urlbar">'
        + '<span class="ig-safari-lock">' + LOCK_ICON + '</span>'
        + '<span class="ig-safari-domain">massfinder.vercel.app</span>'
        + '<span class="ig-tb-btn highlight" style="width:28px;height:28px;font-size:14px">' + SHARE_ICON + '</span>'
        + '</div>'
        + '<div class="ig-safari-toolbar">'
        + '<span class="ig-tb-btn dim">\u2039</span>'
        + '<span class="ig-tb-btn dim">\u203A</span>'
        + '<span class="ig-tb-btn dim">' + BOOK_ICON + '</span>'
        + '<span class="ig-tb-btn dim">' + TABS_ICON + '</span>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Scroll down past the icons and tap <strong>Add to Home Screen</strong>',
    visual: _iosShareSheetVisual
  },
  {
    caption: 'Tap <strong>Add</strong> in the top right to finish',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-confirm-dialog">'
        + '<div class="ig-confirm-bar">'
        + '<span class="ig-confirm-cancel">Cancel</span>'
        + '<span class="ig-confirm-title">Add to Home Screen</span>'
        + '<span class="ig-confirm-add highlight">Add</span>'
        + '</div>'
        + '<div class="ig-confirm-preview">'
        + '<div class="ig-confirm-icon">MF</div>'
        + '<div class="ig-confirm-name">MassFinder</div>'
        + '<div class="ig-confirm-url">massfinder.com</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  }
];

// ── iOS Chrome Steps (bottom toolbar, ⋯ at right — 4-step flow) ──
var IOS_CHROME_STEPS = [
  {
    caption: 'Tap the <strong>\u22EF</strong> button at the bottom right',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-status-bar"><span>9:41</span></div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-chrome-bottom">'
        + '<div class="ig-chrome-bar">'
        + '<div class="ig-chrome-circle dim">\u2039</div>'
        + '<div class="ig-chrome-url">massfinder.vercel.app</div>'
        + '<div class="ig-chrome-circle highlight">\u22EF</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Share</strong> at the top of the menu',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-status-bar"><span>9:41</span></div>'
        + '<div class="ig-screen-content ig-dimmed">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-chrome-menu">'
        + '<div class="ig-chrome-menu-item highlight">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M8 8l4-4 4 4"/><path d="M12 4v12"/><path d="M20 14v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5"/></svg>'
        + ' Share</div>'
        + '<div class="ig-chrome-menu-item dim">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>'
        + ' Add to Bookmarks</div>'
        + '<div class="ig-chrome-menu-item dim">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>'
        + ' Add Bookmark to\u2026</div>'
        + '<div class="ig-chrome-menu-sep"></div>'
        + '<div class="ig-chrome-menu-item dim">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
        + ' New Tab</div>'
        + '<div class="ig-chrome-menu-item dim">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        + ' New Private Tab</div>'
        + '<div class="ig-chrome-menu-footer">'
        + '<span class="ig-chrome-footer-btn">Bookmarks</span>'
        + '<span class="ig-chrome-footer-btn">All Tabs</span>'
        + '</div>'
        + '</div>'
        + '<div class="ig-chrome-bottom" style="position:relative;z-index:1">'
        + '<div class="ig-chrome-bar">'
        + '<div class="ig-chrome-circle dim">\u2039</div>'
        + '<div class="ig-chrome-url">massfinder.vercel.app</div>'
        + '<div class="ig-chrome-circle">\u22EF</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Scroll down and tap <strong>Add to Home Screen</strong>',
    visual: _iosShareSheetVisual
  },
  IOS_SAFARI_STEPS[2] // Same "Tap Add" confirmation
];

// ── Android Steps (top URL bar, ⋮ at right, nav bar at bottom) ──
var ANDROID_STEPS = [
  {
    caption: 'Tap the <strong>\u22EE</strong> menu in the top right corner',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-android-topbar">'
        + '<div class="ig-android-pill">massfinder.com</div>'
        + '<span class="ig-android-dots highlight">\u22EE</span>'
        + '</div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-android-navbar">'
        + '<span>\u25C1</span><span>\u25CB</span><span>\u25A0</span>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-android-topbar">'
        + '<div class="ig-android-pill">massfinder.com</div>'
        + '<span class="ig-android-dots">\u22EE</span>'
        + '</div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview ig-dimmed"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-android-navbar">'
        + '<span>\u25C1</span><span>\u25CB</span><span>\u25A0</span>'
        + '</div>'
        + '<div class="ig-android-dropdown">'
        + '<div class="ig-sheet-row dim">New tab</div>'
        + '<div class="ig-sheet-row dim">New incognito tab</div>'
        + '<div class="ig-sheet-row dim">Bookmarks</div>'
        + '<div class="ig-sheet-row highlight">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right:8px;flex-shrink:0"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
        + 'Install app</div>'
        + '<div class="ig-sheet-row dim">Translate</div>'
        + '<div class="ig-sheet-row dim">Settings</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Install</strong> to add MassFinder to your home screen',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-screen-content ig-scrim">'
        + '<div class="ig-android-dialog">'
        + '<div class="ig-dialog-title">Install app?</div>'
        + '<div class="ig-dialog-preview">'
        + '<div class="ig-confirm-icon">MF</div>'
        + '<div class="ig-confirm-name">MassFinder</div>'
        + '<div class="ig-confirm-url">massfinder.com</div>'
        + '</div>'
        + '<div class="ig-dialog-actions">'
        + '<span class="ig-dialog-btn dim">Cancel</span>'
        + '<span class="ig-dialog-btn highlight">Install</span>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring"></div>'
        + '</div>';
    }
  }
];

var PLATFORM_STEPS = {
  'ios-safari': IOS_SAFARI_STEPS,
  'ios-chrome': IOS_CHROME_STEPS,
  'android': ANDROID_STEPS,
  'desktop': []
};

// ── Open Guide ──
function openInstallGuide(forcePlatform) {
  var platform = forcePlatform || detectPlatform();
  var steps = PLATFORM_STEPS[platform];

  var overlay = document.createElement('div');
  overlay.id = 'installGuideOverlay';
  overlay.className = 'ig-overlay';

  // Desktop or unknown: show platform picker
  if (!steps || !steps.length) {
    overlay.innerHTML = '<div class="ig-container">'
      + '<button class="ig-close" onclick="closeInstallGuide()" aria-label="Close">\u2715</button>'
      + '<div class="ig-picker-title">What kind of phone do you have?</div>'
      + '<div class="ig-picker">'
      + '<button class="ig-picker-btn" onclick="closeInstallGuide();openInstallGuide(\'ios-safari\')">'
      + '<span class="ig-picker-icon">\uF8FF</span>'
      + '<span class="ig-picker-label">iPhone / iPad</span>'
      + '</button>'
      + '<button class="ig-picker-btn" onclick="closeInstallGuide();openInstallGuide(\'android\')">'
      + '<span class="ig-picker-icon">\u25B6</span>'
      + '<span class="ig-picker-label">Android</span>'
      + '</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    return;
  }

  var currentStep = 0;

  function render() {
    var step = steps[currentStep];
    var isLast = currentStep === steps.length - 1;
    var isFirst = currentStep === 0;

    var dots = steps.map(function(_, i) {
      return '<span class="ig-dot' + (i === currentStep ? ' active' : '') + '"></span>';
    }).join('');

    overlay.innerHTML = '<div class="ig-container">'
      + '<button class="ig-close" onclick="closeInstallGuide()" aria-label="Close">\u2715</button>'
      + '<div class="ig-step-label">Step ' + (currentStep + 1) + ' of ' + steps.length + '</div>'
      + '<div class="ig-visual">' + step.visual() + '</div>'
      + '<div class="ig-caption">' + step.caption + '</div>'
      + '<div class="ig-dots">' + dots + '</div>'
      + '<div class="ig-nav">'
      + (isFirst ? '<div></div>' : '<button class="ig-nav-btn ig-nav-back" onclick="installGuideNav(-1)">Back</button>')
      + (isLast
        ? '<button class="ig-nav-btn ig-nav-next" onclick="closeInstallGuide()">Got it</button>'
        : '<button class="ig-nav-btn ig-nav-next" onclick="installGuideNav(1)">Next</button>')
      + '</div>'
      + '</div>';

    requestAnimationFrame(_positionRings);
  }

  window.installGuideNav = function(dir) {
    currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + dir));
    render();
  };

  render();
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  // Position rings after DOM insertion + paint
  requestAnimationFrame(function() { requestAnimationFrame(_positionRings); });
}

function closeInstallGuide() {
  var overlay = document.getElementById('installGuideOverlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
}

module.exports = {
  openInstallGuide: openInstallGuide,
  closeInstallGuide: closeInstallGuide,
  detectPlatform: detectPlatform
};
