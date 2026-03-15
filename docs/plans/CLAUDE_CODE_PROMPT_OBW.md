# Claude Code Prompt — OBW (Onboarding Walkthrough)

Implement a 3-or-4-step first-launch walkthrough overlay for MassFinder.
Steps 1–3 orient to Find/Save/Pray. Step 4 (conditional — browser only, not standalone) pushes PWA installation via existing install-guide.js.
Spec: `docs/plans/UX_Spec_Onboarding_Walkthrough.md`

---

## Pre-flight

```
cat docs/plans/UX_Spec_Onboarding_Walkthrough.md
head -80 css/app.css                    # design tokens
head -100 src/install-guide.js          # install guide pattern
grep -n "function init" src/app.js      # init insertion point
grep -n "standalone" src/more.js        # standalone detection pattern
grep -n "_devState" src/app.js          # dev panel location
```

---

## Implementation Steps

### 1. HTML — Add overlay to index.html

Insert before `</body>`, after the `<div id="toast">` block and before the Leaflet `<script>` tags:

```html
<!-- Onboarding Walkthrough (OBW) -->
<div id="onboardOverlay" class="ob-overlay" role="dialog" aria-modal="true" aria-label="Welcome to MassFinder" style="display:none">
  <div class="ob-container">
    <button class="ob-skip" id="obSkip" aria-label="Skip introduction">Skip</button>
    <div class="ob-content" id="obContent"></div>
    <div class="ob-footer">
      <div class="ob-dots" id="obDots" role="tablist" aria-label="Walkthrough progress"></div>
      <button class="ob-btn ob-btn-primary" id="obNext">Next</button>
      <button class="ob-btn ob-btn-ghost" id="obSecondary" style="display:none">Maybe Later</button>
    </div>
  </div>
</div>
```

### 2. CSS — Add styles to css/app.css

Insert after the Sacred Pause section (~line 2040). Full CSS from the spec:

**Light mode classes to add:**
- `.ob-overlay` — fixed, inset 0, z-index 9999, `--color-bg`, opacity transition 0.4s
- `.ob-overlay.open` — opacity 1
- `.ob-overlay.dismissing` — opacity 0, transition 0.5s, pointer-events none
- `.ob-container` — max-width 400px, padding includes tab-bar-height + safe-bottom
- `.ob-skip` — absolute top-right, tertiary color, 44×44 min tap target
- `.ob-content` — flex column centered, min-height 280px, opacity/transform transitions
- `.ob-content.exiting` — opacity 0, translateY(-8px), 200ms
- `.ob-content.entering` — opacity 0, translateY(8px) (no transition — set as initial state)
- `.ob-illustration` — 120×120 circle, `--color-sacred-pale` bg
- `.ob-illustration svg` — 52×52, stroke `--color-sacred`, 1.8 width, no fill
- `.ob-illustration.ob-install` — `--color-verified-bg` bg
- `.ob-illustration.ob-install svg` — stroke `--color-verified`
- `.ob-headline` — `--font-prayer`, `--text-xl`, weight 700, max-width 300px
- `.ob-subtitle` — `--font-body`, `--text-base`, `--color-text-secondary`, max-width 280px
- `.ob-footer` — flex column, gap `--space-4`, margin-top `--space-8`
- `.ob-dots` / `.ob-dot` / `.ob-dot.active` — same pattern as ig-dots (8px circles, active = 24px pill navy)
- `.ob-btn` — full width, max-width 320px, no border
- `.ob-btn-primary` — min-height 52px, `--color-primary` bg, `--radius-md`
- `.ob-btn-primary.ob-btn-accent` — `--color-sacred` bg (gold)
- `.ob-btn-ghost` — min-height 44px, transparent bg, `--color-text-secondary`

**Dark mode** — inside `html[data-theme="dark"]` block, safety-net overrides for:
`.ob-overlay`, `.ob-illustration`, `.ob-illustration.ob-install`, `.ob-dot.active`, `.ob-btn-primary`, `.ob-btn-primary.ob-btn-accent`

**Reduced motion** — inside existing `@media (prefers-reduced-motion: reduce)` block:
`.ob-overlay`, `.ob-content`, `.ob-dot` — all `transition: none !important`

**Desktop** — new `@media (min-width: 769px)` block:
- `.ob-overlay` — scrim bg `rgba(26,30,38,0.35)` + backdrop blur 8px
- `.ob-container` — `--color-surface` bg, `--radius-lg`, `--shadow-elevated`, max-width 440px, no tab-bar padding
- `.ob-skip` — repositioned to `top: var(--space-2)`
- Dark mode desktop: darker scrim

### 3. JS — Add onboarding logic to src/app.js

Add after the `require()` block and `var state = data.state;` line, BEFORE `DAILY_PROMPTS`:

```javascript
// ── OBW: First-Launch Onboarding Walkthrough ──
var OB_CONTENT_STEPS = [
  {
    icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    headline: 'Find Mass, Confession, and Adoration near you',
    subtitle: 'Search by name, filter by service type, and see what\u2019s happening today.'
  },
  {
    icon: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    headline: 'Save your parishes',
    subtitle: 'Tap the heart on any church to build your personal dashboard.'
  },
  {
    icon: '<svg viewBox="0 0 24 24"><rect x="6.5" y="1" width="3" height="14" rx="1"/><rect x="1" y="5.5" width="14" height="3" rx="1"/><path d="M17 4h4v4M21 4l-6 6" stroke-width="1.5"/></svg>',
    headline: 'Pray, learn, and grow',
    subtitle: 'Guided Rosary, daily readings, the Catechism, and more\u2009\u2014\u2009all in your pocket.'
  }
];

var OB_INSTALL_STEP = {
  icon: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2.5"/><path d="M9 2v1.5a1 1 0 001 1h4a1 1 0 001-1V2"/></svg>',
  headline: 'Add MassFinder to your home screen',
  subtitle: 'Opens instantly, works offline, and feels like a native app. No app store needed.',
  installStep: true
};

var _obSteps = [];
var _obStep = 0;

function _renderObStep(idx) {
  var step = _obSteps[idx];
  if (!step) return;
  var content = document.getElementById('obContent');
  var dots = document.getElementById('obDots');
  var btn = document.getElementById('obNext');
  var ghost = document.getElementById('obSecondary');
  var skip = document.getElementById('obSkip');
  if (!content || !dots || !btn) return;

  var illClass = step.installStep ? 'ob-illustration ob-install' : 'ob-illustration';
  content.innerHTML =
    '<div class="' + illClass + '">' + step.icon + '</div>' +
    '<div class="ob-headline">' + step.headline + '</div>' +
    '<div class="ob-subtitle">' + step.subtitle + '</div>';

  // Dots
  var dotsHtml = '';
  for (var i = 0; i < _obSteps.length; i++) {
    dotsHtml += '<div class="ob-dot' + (i === idx ? ' active' : '') + '" role="tab" aria-selected="' + (i === idx) + '"></div>';
  }
  dots.innerHTML = dotsHtml;

  var isLast = idx === _obSteps.length - 1;
  var isInstall = !!step.installStep;

  // Button text + style
  if (isInstall) {
    btn.textContent = 'Show Me How';
    btn.classList.add('ob-btn-accent');
    btn.onclick = _obShowInstallGuide;
    if (ghost) { ghost.style.display = ''; ghost.onclick = _dismissOb; }
  } else if (isLast) {
    btn.textContent = 'Get Started';
    btn.classList.add('ob-btn-accent');
    btn.onclick = _dismissOb;
    if (ghost) ghost.style.display = 'none';
  } else {
    btn.textContent = 'Next';
    btn.classList.remove('ob-btn-accent');
    btn.onclick = _advanceOb;
    if (ghost) ghost.style.display = 'none';
  }

  // Hide skip on last step (and install step — "Maybe Later" serves same purpose)
  if (skip) skip.style.display = (isLast || isInstall) ? 'none' : '';
}

function _advanceOb() {
  _obStep++;
  if (_obStep >= _obSteps.length) {
    _dismissOb();
    return;
  }
  var content = document.getElementById('obContent');
  if (!content) return;
  content.classList.add('exiting');
  setTimeout(function() {
    _renderObStep(_obStep);
    content.classList.remove('exiting');
    content.classList.add('entering');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        content.classList.remove('entering');
      });
    });
  }, 200);
}

function _dismissOb() {
  var overlay = document.getElementById('onboardOverlay');
  if (!overlay) return;
  try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
  if (typeof haptics !== 'undefined' && haptics.light) haptics.light();
  overlay.classList.remove('open');
  overlay.classList.add('dismissing');
  setTimeout(function() {
    overlay.style.display = 'none';
    overlay.classList.remove('dismissing');
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.focus();
  }, 500);
}

function _obShowInstallGuide() {
  // Monkey-patch closeInstallGuide so closing it also dismisses onboarding
  var _origClose = window.closeInstallGuide;
  window.closeInstallGuide = function() {
    _origClose();
    window.closeInstallGuide = _origClose; // restore original
    _dismissOb();
  };
  openInstallGuide();
}

function _showOnboarding() {
  var overlay = document.getElementById('onboardOverlay');
  if (!overlay) return;

  // Build step array: add install step only if NOT in standalone mode
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  _obSteps = isStandalone
    ? OB_CONTENT_STEPS.slice()
    : OB_CONTENT_STEPS.concat([OB_INSTALL_STEP]);
  _obStep = 0;

  overlay.style.display = '';
  _renderObStep(0);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      overlay.classList.add('open');
    });
  });

  // Event listeners for skip
  var skip = document.getElementById('obSkip');
  if (skip) skip.onclick = _dismissOb;

  // Swipe support on content area
  var startX = 0, startY = 0;
  var contentEl = document.getElementById('obContent');
  if (contentEl) {
    contentEl.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    contentEl.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
        if (dx < 0) {
          // Swipe left → advance
          _advanceOb();
        } else if (_obStep > 0) {
          // Swipe right → go back
          _obStep--;
          var c = document.getElementById('obContent');
          if (c) c.classList.add('exiting');
          setTimeout(function() {
            _renderObStep(_obStep);
            var c2 = document.getElementById('obContent');
            if (c2) { c2.classList.remove('exiting'); c2.classList.add('entering'); }
            requestAnimationFrame(function() {
              requestAnimationFrame(function() {
                var c3 = document.getElementById('obContent');
                if (c3) c3.classList.remove('entering');
              });
            });
          }, 200);
        }
      }
    }, { passive: true });
  }
}

// Expose for dev panel
window._showOnboarding = _showOnboarding;
```

### 4. Gate in init()

In `src/app.js`, inside `async function init()`, after `data.loadFav(); data.migrateFavorites();` and BEFORE the `try { fetch('/parish_data.json'...` block:

```javascript
// OBW: Show onboarding for genuinely new users only
var _isNewUser = !localStorage.getItem('mf-onboarding-complete');
if (_isNewUser) {
  // Skip if any existing MassFinder data exists (returning user who updated)
  var _hasExistingData = localStorage.getItem('mf-favorites') ||
    localStorage.getItem('mf-theme') ||
    localStorage.getItem('mf-last-visit');
  if (_hasExistingData) {
    try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
  } else {
    _showOnboarding();
  }
}
```

### 5. Dev panel toggle

In `src/app.js`, find the `_devState` object (~line 865). Add property:
```javascript
onboarding: false,
```

In the dev panel buttons rendering, add:
```javascript
{ key: 'onboarding', label: 'Onboarding', active: _devState.onboarding },
```

In the dev panel toggle handler, add case:
```javascript
if (key === 'onboarding') {
  if (val) {
    localStorage.removeItem('mf-onboarding-complete');
    _showOnboarding();
  } else {
    localStorage.setItem('mf-onboarding-complete', '1');
  }
}
```

### 6. Build and test

```bash
npm run build
```

---

## Test Checklist

### First launch (no localStorage)
- [ ] Onboarding overlay appears immediately on load
- [ ] Step 1: search icon + "Find Mass..." headline + 4 dots (browser) or 3 dots (standalone)
- [ ] "Next" advances to step 2 with fade transition
- [ ] Step 2: heart icon + "Save your parishes"
- [ ] "Next" advances to step 3
- [ ] Step 3: cross icon + "Pray, learn, and grow"
- [ ] In browser: step 3 button says "Next" (navy), skip visible
- [ ] In standalone: step 3 button says "Get Started" (gold), skip hidden

### Step 4 — Install (browser only)
- [ ] Step 4: green circle, phone icon, "Add MassFinder to your home screen"
- [ ] "Show Me How" button (gold)
- [ ] "Maybe Later" ghost button visible below
- [ ] Skip hidden
- [ ] "Show Me How" → install guide overlay opens ON TOP
- [ ] Closing install guide → onboarding also dismisses
- [ ] "Maybe Later" → onboarding dismisses

### Standalone mode
- [ ] Only 3 steps, 3 dots
- [ ] No install step
- [ ] Step 3 is final: gold "Get Started" button

### Skip behavior
- [ ] "Skip" on steps 1–2 (or 1–3 in browser mode) dismisses and sets flag

### Returning user protection
- [ ] User with existing `mf-favorites` → no onboarding
- [ ] User with existing `mf-theme` → no onboarding

### Swipe gestures
- [ ] Swipe left on any step → advance
- [ ] Swipe right on step 2+ → go back
- [ ] Swipe left on final step → dismiss

### Dark mode
- [ ] All colors from CSS variables
- [ ] Sacred-pale circle visible against dark bg
- [ ] Green install circle visible against dark bg
- [ ] Gold button readable

### Desktop (≥769px)
- [ ] Centered card with scrim
- [ ] Blur backdrop
- [ ] No tab bar padding offset

### Reduced motion
- [ ] No transitions
- [ ] Steps swap instantly

### Dev panel
- [ ] Toggle clears flag and re-shows overlay

### Accessibility
- [ ] VoiceOver announces dialog
- [ ] Tab cycles through interactive elements only
- [ ] Focus moves to search input after dismiss

---

## Files Modified

| File | Change |
|------|--------|
| `index.html` | Add `#onboardOverlay` div before `</body>` |
| `css/app.css` | Add `.ob-*` styles (~100 lines), dark mode, reduced motion, desktop query |
| `src/app.js` | Add OB steps, render/advance/dismiss/show/installGuide functions, gate in init(), dev panel toggle |
