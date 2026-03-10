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

// ── iOS Safari Steps ──
var IOS_SAFARI_STEPS = [
  {
    caption: 'Tap the <strong>Share</strong> button at the bottom of your screen',
    visual: function() {
      // Safari bottom bar with share button highlighted
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '<div class="ig-safari-bar">'
        + '<div class="ig-safari-url">massfinder.com</div>'
        + '<div class="ig-safari-actions">'
        + '<span class="ig-safari-btn dim">\u25C1</span>'
        + '<span class="ig-safari-btn dim">\u25B7</span>'
        + '<span class="ig-safari-btn highlight" id="ig-share-btn">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><path d="M12 3v12M5 10l7-7 7 7"/><path d="M5 17h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1z"/></svg>'
        + '</span>'
        + '<span class="ig-safari-btn dim">\u2261</span>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="bottom:28px;right:30%"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Scroll down and tap <strong>Add to Home Screen</strong>',
    visual: function() {
      // Share sheet with "Add to Home Screen" highlighted
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-share-sheet">'
        + '<div class="ig-sheet-handle"></div>'
        + '<div class="ig-sheet-row dim">Copy</div>'
        + '<div class="ig-sheet-row dim">Add Bookmark</div>'
        + '<div class="ig-sheet-row dim">Add to Favorites</div>'
        + '<div class="ig-sheet-row highlight">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right:8px;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
        + 'Add to Home Screen'
        + '</div>'
        + '<div class="ig-sheet-row dim">Find on Page</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="bottom:42%;right:30%"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Add</strong> in the top right to finish',
    visual: function() {
      // Confirmation dialog with "Add" highlighted
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
        + '<div class="ig-tap-ring" style="top:22%;right:12%"></div>'
        + '</div>';
    }
  }
];

// ── iOS Chrome Steps ──
var IOS_CHROME_STEPS = [
  {
    caption: 'Tap the <strong>\u22EF</strong> menu button in the top right',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-chrome-bar">'
        + '<div class="ig-chrome-url">massfinder.com</div>'
        + '<span class="ig-chrome-dots highlight">\u22EF</span>'
        + '</div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="top:12%;right:10%"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Add to Home Screen</strong>',
    visual: function() {
      return '<div class="ig-phone">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-chrome-menu">'
        + '<div class="ig-sheet-row dim">New Tab</div>'
        + '<div class="ig-sheet-row dim">Bookmarks</div>'
        + '<div class="ig-sheet-row dim">Reading List</div>'
        + '<div class="ig-sheet-row highlight">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right:8px;flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
        + 'Add to Home Screen'
        + '</div>'
        + '<div class="ig-sheet-row dim">Settings</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="top:52%;right:30%"></div>'
        + '</div>';
    }
  },
  IOS_SAFARI_STEPS[2] // Same "Tap Add" confirmation
];

// ── Android Steps ──
var ANDROID_STEPS = [
  {
    caption: 'Tap the <strong>\u22EE</strong> menu in the top right corner',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-android-bar">'
        + '<div class="ig-android-url">massfinder.com</div>'
        + '<span class="ig-android-dots highlight">\u22EE</span>'
        + '</div>'
        + '<div class="ig-screen-content">'
        + '<div class="ig-app-preview"><div class="ig-app-icon">MF</div><div class="ig-app-label">MassFinder</div></div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="top:10%;right:8%"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
        + '<div class="ig-android-menu">'
        + '<div class="ig-sheet-row dim">New tab</div>'
        + '<div class="ig-sheet-row dim">New incognito tab</div>'
        + '<div class="ig-sheet-row dim">Bookmarks</div>'
        + '<div class="ig-sheet-row highlight">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="margin-right:8px;flex-shrink:0"><path d="M12 18v-12"/><path d="M5 12l7 7 7-7"/></svg>'
        + 'Install app'
        + '</div>'
        + '<div class="ig-sheet-row dim">Translate</div>'
        + '</div>'
        + '</div>'
        + '<div class="ig-tap-ring" style="top:52%;right:30%"></div>'
        + '</div>';
    }
  },
  {
    caption: 'Tap <strong>Install</strong> to add MassFinder to your home screen',
    visual: function() {
      return '<div class="ig-phone ig-phone--android">'
        + '<div class="ig-phone-screen">'
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
        + '<div class="ig-tap-ring" style="bottom:38%;right:18%"></div>'
        + '</div>';
    }
  }
];

var PLATFORM_STEPS = {
  'ios-safari': IOS_SAFARI_STEPS,
  'ios-chrome': IOS_CHROME_STEPS,
  'android': ANDROID_STEPS,
  'desktop': [] // desktop doesn't get the visual guide
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
  }

  window.installGuideNav = function(dir) {
    currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + dir));
    render();
  };

  render();
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
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
