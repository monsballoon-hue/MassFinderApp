# Claude Code Implementation Prompt — SLV Series (Soul & Visual Language)

**Spec:** `docs/plans/UX_Spec_Soul_Visual_Language.md`
**Prefix:** SLV
**Branch:** `content-additions`
**Priority:** SLV-01/02/03 are P1 (ship together), SLV-04/05 are P2, SLV-06 is P3

---

## Pre-flight

```bash
git checkout content-additions && git pull
head -170 css/app.css   # verify tokens — check lines 103-104 for timing, 1854-1879 for seasonal
cat CLAUDE.md            # read conventions (CommonJS, no arrows, config.js canonical)
cat docs/plans/UX_Spec_Soul_Visual_Language.md  # read full spec
```

---

## Implementation Order

### 1. SLV-01 Part B — Header Accent Bar Hex→Token Migration

**File:** `css/app.css` lines 1870-1879

Refactor all `.top-header::after` seasonal rules from hardcoded hex to `var(--color-accent)`:

**Light mode (5 rules, lines 1870-1874):**
- Lent/Advent: `#7C3AED` → `var(--color-accent)`
- Easter/Christmas: 3-stop gradient → `transparent 0%, var(--color-accent-pale) 15%, var(--color-accent) 50%, var(--color-accent-pale) 85%, transparent 100%`
- Ordinary: `#16A34A` → `var(--color-accent)`

**Dark mode (5 rules, lines 1875-1879):**
- Replace all hardcoded `rgba(...)` with `color-mix(in srgb, var(--color-accent) 60%, transparent)`

Verify: `grep -n "7C3AED\|D4AF37\|16A34A" css/app.css` should show NO results in `.top-header::after` rules after this change. (Other rules like the `:root[data-season]` accent definitions will still have hex — that's correct.)

### 2. SLV-01 Part A — Season Accent CSS Transition

Test `@property` registration for CSS custom property animation:

```css
@property --color-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: #B8963F;
}
@property --color-accent-text {
  syntax: '<color>';
  inherits: true;
  initial-value: #7D6520;
}
@property --color-accent-light {
  syntax: '<color>';
  inherits: true;
  initial-value: #D4B05C;
}
@property --color-accent-pale {
  syntax: '<color>';
  inherits: true;
  initial-value: #F5EDD8;
}
```

Then add to `:root`:
```css
:root {
  transition: --color-accent 1.5s ease-in-out,
              --color-accent-text 1.5s ease-in-out,
              --color-accent-light 1.5s ease-in-out,
              --color-accent-pale 1.5s ease-in-out;
}
```

**If `@property` doesn't work in Safari testing**, fall back to per-element transitions:
```css
.saint-card,
.formation-card,
.top-header::after,
.reader-header::after,
.chip.active {
  transition: background 1.5s ease-in-out, border-color 1.5s ease-in-out, box-shadow 1.5s ease-in-out, color 1.5s ease-in-out;
}
```

Also add `transition: background 1.5s ease-in-out` to `body` for the seasonal body gradient shift.

### 3. SLV-01 Part C — Season Transition Interstitial

**File:** `src/readings.js` — modify `setLiturgicalSeason()` (line 35-48)

After determining `season` string (around line 46), before setting `data-season`:

```javascript
// Season transition interstitial
var lastSeason = null;
try { lastSeason = localStorage.getItem('mf-last-season'); } catch (e) {}

if (lastSeason && lastSeason !== season) {
  // Show transition overlay
  var names = {
    advent: 'The Season of Advent',
    christmas: 'The Christmas Season',
    lent: 'The Season of Lent',
    easter: 'The Easter Season',
    ordinary: 'Ordinary Time'
  };
  var messages = {
    advent: 'A time of joyful waiting and preparation.',
    christmas: 'The Word was made flesh, and dwelt among us.',
    lent: 'Return to Me with your whole heart.',
    easter: 'He is risen. Alleluia!',
    ordinary: 'Growing in grace, day by day.'
  };
  var el = document.getElementById('seasonTransition');
  if (!el) {
    el = document.createElement('div');
    el.id = 'seasonTransition';
    document.body.insertBefore(el, document.body.firstChild);
  }
  el.className = 'season-overlay';
  el.innerHTML = '<div class="season-overlay-content">'
    + '<div class="season-overlay-label">A NEW SEASON</div>'
    + '<div class="season-overlay-name">' + (names[season] || season) + '</div>'
    + '<div class="season-overlay-message">' + (messages[season] || '') + '</div>'
    + '</div>';

  var dismissed = false;
  function dismissOverlay() {
    if (dismissed) return;
    dismissed = true;
    el.classList.add('dismissing');
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
  }
  el.addEventListener('click', dismissOverlay);
  setTimeout(dismissOverlay, 4000);
}

// Always persist current season
try { localStorage.setItem('mf-last-season', season); } catch (e) {}
```

Then set `data-season` as before (existing line 47).

**File:** `src/app.js` — in `_devSetSeason()` (line 1055), add skip flag:
```javascript
window._devSkipSeasonOverlay = true;
```
And in the readings.js interstitial code, check:
```javascript
if (lastSeason && lastSeason !== season && !window._devSkipSeasonOverlay) {
```
Reset the flag after: `window._devSkipSeasonOverlay = false;`

**File:** `css/app.css` — add overlay styles (after the seasonal rules section, ~line 1880):

See spec SLV-01 Part C for full CSS. Key classes: `.season-overlay`, `.season-overlay.dismissing`, `.season-overlay-content`, `.season-overlay-label`, `.season-overlay-name`, `.season-overlay-message`. Plus seasonal background gradients for the overlay.

### 4. SLV-03 — Candlelight Halo

**File:** `css/app.css`

Add token to `:root` (near `--shadow-elevated`, ~line 100):
```css
--shadow-sacred-glow: 0 0 20px color-mix(in srgb, var(--color-sacred) 8%, transparent);
```

Add dark mode override:
```css
html[data-theme="dark"] {
  --shadow-sacred-glow: 0 0 24px color-mix(in srgb, var(--color-sacred) 12%, transparent);
}
```

Apply to 3 elements by appending glow to existing `box-shadow`:
- `.saint-card` (line ~1840): `box-shadow: var(--shadow-card), var(--shadow-sacred-glow);`
- `.formation-card` (line ~255): add `box-shadow: var(--shadow-card), var(--shadow-sacred-glow);`
- `.prayer-tool-card--promoted` (line ~1613): `box-shadow: var(--shadow-card), var(--shadow-sacred-glow);`

Also update hover state for promoted card:
```css
.prayer-tool-card--promoted:not(.coming-soon):hover {
  box-shadow: var(--shadow-card-hover), var(--shadow-sacred-glow);
}
```

Enhance reader header accent line (line ~1918):
```css
.reader-header::after {
  /* existing properties unchanged, add: */
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
```

### 5. SLV-02 — Typography Voice

**File:** `src/readings.js` — in the rendering path for daily readings, add `data-content="readings"` attribute to `.reader-body` when displaying readings content. Find where `reader-body` innerHTML is set for readings and add the attribute.

Also add LORD→small-caps regex before caching:
```javascript
html = html.replace(/\bLORD\b/g, '<span class="sc">LORD</span>');
```

**File:** `src/bible.js` — apply same LORD regex in the rendering path for DRB/CPDV text.

**File:** `css/app.css` — add these rules:

Drop cap:
```css
.reader-body[data-content="readings"] > p:first-of-type::first-letter,
.reader-body[data-content="readings"] > div:first-of-type > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 3.2em;
  float: left;
  line-height: 0.8;
  padding-right: 0.08em;
  padding-top: 0.05em;
  color: var(--color-accent);
  font-weight: var(--weight-bold);
}
```

Small-caps:
```css
.sc {
  font-variant: small-caps;
  text-transform: lowercase;
  letter-spacing: 0.05em;
}
```

Letter-spacing on `.saint-name`:
```css
.saint-name { letter-spacing: 0.015em; }
```

Dark mode warm text-shadow:
```css
html[data-theme="dark"] .reader-body {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}
html[data-theme="dark"] .ccc-body,
html[data-theme="dark"] .ccc-paragraph {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}
```

### 6. SLV-04 — Seasonal Timing

**File:** `css/app.css` — add after the seasonal accent overrides (~line 1858):

```css
:root[data-season="lent"],
:root[data-season="advent"] {
  --transition-fast: 180ms var(--ease-out);
  --transition-base: 300ms var(--ease-out);
}
:root[data-season="easter"],
:root[data-season="christmas"] {
  --transition-fast: 130ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-base: 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Test card active `scale(0.98)` with Easter spring ease — ensure no visible bounce.

### 7. SLV-05 — Warm Sacred Surfaces

**File:** `css/app.css`

Add token to `:root`:
```css
--color-surface-sacred: linear-gradient(135deg, #FFFFFF 60%, #FFFCF5 100%);
```

Dark mode:
```css
html[data-theme="dark"] {
  --color-surface-sacred: linear-gradient(135deg, var(--color-surface) 60%, color-mix(in srgb, var(--color-sacred) 4%, var(--color-surface)) 100%);
}
```

Note: CSS custom properties can store gradient values but they must be used with `background:` not `background-color:`.

Apply to `.formation-card` and `.daily-card` by setting `background: var(--color-surface-sacred)`. The saint card already has a similar gradient — keep its existing treatment (it's already warm).

Do NOT override `.daily-card` dark mode treatment (line 248) — keep existing.

### 8. SLV-06 — Saint Card Asymmetry

**File:** `css/app.css` line ~1840

Change `.saint-card` padding from `var(--space-4)` to:
```css
.saint-card { padding: var(--space-4) var(--space-4) var(--space-5) var(--space-5); }
```

---

## Post-implementation

```bash
npm run build   # verify build succeeds
# Test in dev panel: cycle through all seasons, light/dark mode
# Test interstitial: set mf-last-season to "ordinary", reload with date in Lent
# Verify on mobile viewport (375px width)
git add -A
git commit -m "feat: SLV-01 through SLV-06 — soul & visual language"
```
