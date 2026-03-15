# UX Spec: Pastoral Handoff — Kevin & Dorothy (PHF series)

**Created:** 2026-03-15
**Status:** Queued
**Source:** Pastoral Advisor (Fr. Mike) handoff, 2026-03-15
**Backlog items:** IDEA-074 through IDEA-079
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PHF.md
**Depends on:** Reader system (implemented), devotions.js (implemented), render.js detail panel (implemented)

---

## Context

Two personas, two critical journeys, one principle: **the people who need this app most are the ones least equipped to navigate unintuitive interfaces.** Both items come from a pastoral advisor who has witnessed these exact failures in parish life.

---

## ITEM 1: Kevin's Confession Journey

### Problem

Kevin, 42, lapsed 15 years, comes back because his wife insisted. He taps the **Confession filter chip** on the Find tab. He sees churches with times. He opens a church detail panel. The Sacraments accordion auto-opens, showing "Next: Saturday 3:30 PM." He has the place and the time.

But Kevin doesn't know the routine. He doesn't remember how Confession works. The guide that would give him confidence ("How to go to Confession" — warm, non-judgmental, step-by-step) lives in the Faith Guides section on the More tab. Kevin will never find it. He doesn't know "Faith Guides" exists. He doesn't know to switch tabs.

**Current code path:** Confession chip → `renderCards()` with confession filter → `openDetail()` → Sacraments accordion with `sec.k === 'conf'` auto-opens → schedule + "Next available" callout → **dead end.**

The confession guide content exists at `devotions.js` line ~157 (`DEVOTIONAL_GUIDES[1]`). It is rendered **exclusively** inside the More tab's "Grow in Faith" section. Zero cross-links exist anywhere in the Find tab or detail panel.

---

### PHF-01: Confession Guide — Reader Module Registration

**Priority:** P1 (prerequisite for 01a and 01b)
**Files:** `src/more.js` (or new `src/confession-guide.js`, or inline in `src/devotions.js`)

#### What

Register the "How to go to Confession" content as a reader module so it can be opened from anywhere in the app via `readerOpen('confession-guide')`.

#### Implementation

In `src/devotions.js` (or `src/more.js`), add a reader module registration. The content body already exists as `DEVOTIONAL_GUIDES[1].body`. The registration should look like:

```javascript
// PHF-01: Confession Guide reader module — accessible from any tab
var reader = require('./reader.js');
reader.registerModule('confession-guide', {
  getTitle: function() { return 'How to Go to Confession'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    var devotions = require('./devotions.js');
    var guide = devotions.DEVOTIONAL_GUIDES[1]; // "How to go to Confession"
    var body = guide.body;

    // Wire term definitions and Scripture refs
    bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75">'
      + body
      + '<div style="margin-top:var(--space-5)">'
      + '<button onclick="readerClose();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=confession]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Confession near you</button>'
      + '</div></div>';

    // Wire term and CCC taps
    devotions.initTermClicks(bodyEl);
    var refs = require('./refs.js');
    refs.initRefTaps(bodyEl);
    var snippet = require('./snippet.js');
    bodyEl.querySelectorAll('.ccc-ref').forEach(function(el) {
      var numMatch = el.textContent.trim().match(/CCC\s*(\d+)/);
      if (!numMatch) return;
      el.classList.add('ref-tap', 'ref-tap--ccc');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', numMatch[1], el);
      });
    });
  },
  onClose: function() {}
});
```

Also expose a global window binding in `src/app.js`:
```javascript
window.openConfessionGuide = function() { readerOpen('confession-guide'); };
```

#### Test checklist
- [ ] `openConfessionGuide()` opens reader overlay with full confession guide
- [ ] CCC pills inside the guide work (snippet popover)
- [ ] Term definitions work (tap popover)
- [ ] "Find Confession near you" button at bottom closes reader and activates confession filter on Find tab
- [ ] Guide content matches `DEVOTIONAL_GUIDES[1].body` exactly

---

### PHF-01a: Confession Guide Nudge in Detail Panel

**Priority:** P1 — **Highest pastoral impact**
**Files:** `src/render.js`, `css/app.css`

#### User story
- **Kevin (42, lapsed):** Opens church detail, sees confession times, doesn't know the procedure. The nudge says "First time in a while?" — he taps it, reads the guide, and goes to Confession with confidence.
- **Dorothy (78, daily Mass):** Sees the nudge, ignores it. It's small and non-intrusive. She's been going to Confession for 60 years.
- **Parent (45, in a hurry):** Sees it, may or may not tap. It's below the schedule, not in the way.

#### Before
In `src/render.js`, the `sec.k === 'conf'` branch (line ~742) assembles `bodyInner`:
```javascript
bodyInner = nextConfHtml + renderSched(svcs, locL, ml, sec.types, _curDay);
```
Nothing else. Schedule ends, accordion ends.

#### After
Append a contextual link after the schedule:
```javascript
bodyInner = nextConfHtml + renderSched(svcs, locL, ml, sec.types, _curDay)
  + '<div class="conf-guide-nudge" onclick="openConfessionGuide()">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14" style="flex-shrink:0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  + 'First time in a while? <span class="conf-guide-nudge-link">What to expect \u203A</span>'
  + '</div>';
```

#### CSS
```css
/* PHF-01a: Confession guide nudge inside Sacraments accordion */
.conf-guide-nudge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--color-info) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-info) 12%, transparent);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 44px;
  transition: background 0.15s;
}
.conf-guide-nudge:active { background: color-mix(in srgb, var(--color-info) 10%, transparent); }
.conf-guide-nudge svg { color: var(--color-info); }
.conf-guide-nudge-link { color: var(--color-info); font-weight: var(--weight-semibold); }

html[data-theme="dark"] .conf-guide-nudge {
  background: color-mix(in srgb, var(--color-info) 6%, transparent);
  border-color: color-mix(in srgb, var(--color-info) 10%, transparent);
}
```

#### Design rationale
- **Not a banner, not a popup** — a quiet card at the bottom of the schedule. Kevin will see it when he's done looking at times. He's already engaged.
- **Human language, not Catholic vocabulary** — "First time in a while?" not "Returning penitent?" or "How to receive the Sacrament of Reconciliation." Kevin doesn't know those words.
- **Info color, not sacred color** — this is navigational, not devotional. Uses `--color-info` (blue) not `--color-sacred`.
- **44pt touch target** — `min-height: 44px`. Dorothy-proof.
- **Always present** — not dismissible, not session-gated. It's small enough to ignore; Kevin only needs it once.

#### Test checklist
- [ ] Nudge appears at bottom of Sacraments accordion when confession services exist
- [ ] Tap opens reader overlay with confession guide
- [ ] Text is legible in light and dark mode
- [ ] Nudge does NOT appear in Mass, Adoration, or other accordions
- [ ] Touch target ≥ 44pt
- [ ] Info blue color for icon and link text, not sacred red

---

### PHF-01b: Confession Guide Hint Below Find Tab Filter

**Priority:** P2 — secondary Kevin touchpoint
**Files:** `src/render.js`, `index.html`, `css/app.css`

#### User story
Kevin taps the Confession chip. Before he even opens a church, he sees a gentle line: "Not sure what to expect?" with a link to the guide. This is the *earliest* possible intervention — before he's committed to a specific church.

#### HTML addition (index.html)
Add a slot between `.results-info` and `#cardList`:
```html
<div id="confessionHint" class="confession-hint" style="display:none"></div>
```

Place it after the closing `</div>` of `.results-info` (line ~78) and before `<div id="pullIndicator"` (line ~80).

#### JS (`src/render.js`)
Inside `renderCards()`, after the `resultsCount` update (line ~127), add:

```javascript
// PHF-01b: Confession guide hint when confession filter active
var confHint = document.getElementById('confessionHint');
if (confHint) {
  if (state.currentFilter === 'confession' && !sessionStorage.getItem('mf-conf-hint-dismissed')) {
    confHint.style.display = '';
    confHint.innerHTML = '<div class="confession-hint-inner">'
      + '<span>Not sure what to expect?</span>'
      + '<span class="confession-hint-link" onclick="openConfessionGuide()">How Confession works \u203A</span>'
      + '<button class="confession-hint-dismiss" onclick="this.parentElement.parentElement.style.display=\'none\';sessionStorage.setItem(\'mf-conf-hint-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
      + '</div>';
  } else {
    confHint.style.display = 'none';
  }
}
```

#### CSS
```css
/* PHF-01b: Confession guide hint on Find tab */
.confession-hint { padding: 0 var(--space-4); }
.confession-hint-inner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--color-info) 4%, transparent);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}
.confession-hint-link {
  color: var(--color-info);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  white-space: nowrap;
}
.confession-hint-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: var(--space-1);
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
html[data-theme="dark"] .confession-hint-inner {
  background: color-mix(in srgb, var(--color-info) 5%, transparent);
}
```

#### Design rationale
- **Session-scoped dismissal** — shows once per session via `sessionStorage`. Kevin sees it the first time he filters; if he dismisses, it stays gone until he reopens the app. A lifelong Catholic sees it once, taps ✕, and never again.
- **Minimal visual weight** — 4% background tint, `--text-xs`, inline row. It doesn't compete with the church cards.
- **Not shown for other filters** — only fires when `state.currentFilter === 'confession'`.

#### Test checklist
- [ ] Hint appears below chip bar only when Confession filter is active
- [ ] Hint does NOT appear for any other filter
- [ ] Tapping "How Confession works" opens reader overlay with guide
- [ ] Tapping ✕ hides hint and persists via sessionStorage
- [ ] Hint reappears on next app session (sessionStorage, not localStorage)
- [ ] Dark mode: subtle background visible
- [ ] Hint does not shift card list layout noticeably

---

## ITEM 2: Dorothy's Prayer Tool Navigation

### PHF-02a: Reader Close Button — 44pt Touch Target

**Priority:** P1 — **Critical accessibility fix**
**Files:** `css/app.css`

#### Problem
`.reader-close-btn` is `width:30px; height:30px` (line ~2029). This is the **only way** to exit any prayer tool. Apple HIG minimum is 44×44pt. Dorothy cannot reliably hit a 30px target.

#### Before (css/app.css line ~2029)
```css
.reader-close-btn { width:30px;height:30px;border-radius:50%;background:rgba(142,142,147,0.12);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);flex-shrink:0;transition:background 0.15s;-webkit-tap-highlight-color:transparent; }
```

#### After
```css
.reader-close-btn { width:44px;height:44px;border-radius:50%;background:rgba(142,142,147,0.12);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);flex-shrink:0;transition:background 0.15s;-webkit-tap-highlight-color:transparent; }
```

The SVG icon inside remains 16×16. The visual circle grows from 30px to 44px. The tap target goes from dangerously small to HIG-compliant.

#### Cascading impact
The reader header uses `display:flex` with `gap:var(--space-2)`. The close button is the last element. Growing it by 14px will slightly compress the title. Verify that long titles ("Examination of Conscience") don't truncate unacceptably — the title already has `flex:1; text-align:center` so it should just shrink gracefully.

#### Test checklist
- [ ] Close button visually larger (44px circle)
- [ ] SVG X icon remains centered within larger circle
- [ ] Reader title not unacceptably truncated on small screens (iPhone SE)
- [ ] Back button + title + close button still fit in header
- [ ] Dark mode: same change, same appearance
- [ ] Dorothy test: can she hit the button on first try?

---

### PHF-02b: Persistent Swipe Hint in Rosary Footer

**Priority:** P2
**Files:** `src/rosary.js`, `css/app.css`

#### Problem
The rosary swipe hint is created once in the decade screen, then removed after 3 seconds (`setTimeout → remove`). If Dorothy accidentally swipes past a decade, she has no persistent reminder that swiping exists or how to go back. The Previous/Next buttons exist in the footer, but swipe is the primary gesture for the bead-counting decade screen.

#### Before (`src/rosary.js` ~448-456)
```javascript
// Swipe hint (show once)
if (!_swipeHintShown) {
  _swipeHintShown = true;
  var hintEl = document.createElement('div');
  hintEl.className = 'rosary-swipe-hint';
  hintEl.textContent = 'Swipe left or right to navigate';
  body.appendChild(hintEl);
  setTimeout(function() { if (hintEl.parentNode) hintEl.remove(); }, 3000);
}
```

#### After
Replace the temporary hint with a persistent subtle cue in the footer:

```javascript
// PHF-02b: Persistent swipe hint in footer (replaces one-time hint)
```

In `_navHtml()` (line ~550), add a swipe cue below the buttons:

```javascript
function _navHtml(prevLabel, nextLabel) {
  return '<div style="display:flex;gap:var(--space-3)">'
    + '<button class="rosary-nav-btn rosary-nav-secondary" onclick="rosaryPrev()">' + prevLabel + '</button>'
    + '<button class="rosary-nav-btn rosary-nav-primary" onclick="rosaryNext()">' + nextLabel + '</button>'
    + '</div>'
    + '<div class="rosary-nav-swipe-cue">\u2190 swipe to navigate \u2192</div>';
}
```

Remove the old `_swipeHintShown` temporary-hint block entirely (lines ~448-456).

#### CSS
```css
/* PHF-02b: Persistent swipe cue in rosary/stations footer */
.rosary-nav-swipe-cue {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding-top: var(--space-2);
  opacity: 0.5;
  letter-spacing: 0.02em;
}
```

#### Test checklist
- [ ] "← swipe to navigate →" appears persistently below Previous/Next buttons
- [ ] Cue visible in all decade screens, opening screen, closing screen
- [ ] Cue is subtle (tertiary color, 50% opacity, xs text)
- [ ] Old temporary hint no longer appears and is removed
- [ ] Dark mode: cue visible but quiet
- [ ] Dorothy test: after accidentally swiping, she can see how to get back

---

### PHF-02c: Prayer Text Size Boost at Large Setting

**Priority:** P2
**Files:** `css/app.css`

#### Problem
At `[data-text-size="large"]`, the root font-size is 19px. Prayer text inside the reader uses `--text-base` (17px base → ~19px scaled) and `--text-sm` (15px → ~17px). For Dorothy reading at arm's length on a 6.1" iPhone, 17-19px Georgia may not be enough.

#### CSS additions
```css
/* PHF-02c: Prayer text boost at large text size inside reader */
[data-text-size="large"] .reader-body .rosary-prayer-text,
[data-text-size="large"] .reader-body .chaplet-prayer-text,
[data-text-size="large"] .reader-body .stations-meditation-text,
[data-text-size="large"] .reader-body .stations-prayer-text {
  font-size: calc(var(--text-base) + 2px);
  line-height: 1.9;
}

[data-text-size="large"] .reader-body .rosary-mystery-meditation {
  font-size: calc(var(--text-sm) + 2px);
}

[data-text-size="large"] .reader-body .rosary-mystery-title {
  font-size: calc(var(--text-2xl) + 2px);
}

/* Also boost Examination of Conscience text */
[data-text-size="large"] .reader-body .exam-section-body {
  font-size: calc(var(--text-base) + 2px);
  line-height: 1.9;
}
```

This gives Dorothy ~21px Georgia for prayer text at "large" — genuinely readable at arm's length. The boost ONLY applies when the user has explicitly chosen "large" AND is inside the reader overlay. No impact on the rest of the app.

#### Test checklist
- [ ] At "large" text size, rosary prayer text noticeably larger than at "default"
- [ ] Chaplet, Stations, Examination all get the same boost
- [ ] At "default" and "small" text sizes, no change
- [ ] Boost only applies inside `.reader-body` — no impact on Find/Saved/More tabs
- [ ] Mystery titles remain proportionally larger
- [ ] Line height increase prevents cramped feeling
- [ ] Dark mode: no regression

---

### PHF-02d: Reader Overlay Continuity Cue

**Priority:** P3 — lowest confidence, evaluate after PHF-02a
**Files:** `css/app.css`

#### Problem
When the reader overlay opens, the bottom tab bar disappears. Dorothy's mental model is "tabs = how I move around." Without tabs, she may feel lost.

#### Proposed fix
Add a very subtle app identity line to the reader header using a CSS pseudo-element. This says "you're still in MassFinder" without adding a DOM element or JS change.

```css
/* PHF-02d: Subtle continuity cue in reader header */
.reader-header::before {
  content: 'MassFinder';
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-body);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0.35;
  pointer-events: none;
  letter-spacing: 0.02em;
}
```

**However:** This conflicts with the back button which sits in the same left position. The wordmark would overlap when back-navigation is active. A safer alternative:

```css
/* Alternative: subtle top-edge gradient matching tab bar color */
.reader-overlay::after {
  content: '';
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-primary);
  opacity: 0.15;
  pointer-events: none;
  z-index: 1;
}
html[data-theme="dark"] .reader-overlay::after { opacity: 0.1; }
```

This puts a whisper of the primary blue at the bottom edge — where the tab bar used to be. Not a bar, just a 3px colored line at 15% opacity. Subconscious continuity. No layout impact, no text overlap, no JS.

#### Test checklist
- [ ] Subtle colored line visible at bottom of reader overlay
- [ ] Does not interfere with reader footer when visible
- [ ] Dark mode: reduced opacity
- [ ] Does not appear as a button or interactive element
- [ ] Optional: skip this item entirely if PHF-02a (bigger close button) resolves Dorothy's confusion

---

## Cascading Impact Analysis

| Area | Impact | Notes |
|------|--------|-------|
| Reader header layout | PHF-02a grows close button 30→44px | Verify title truncation on iPhone SE |
| `devotions.js` exports | PHF-01 reads `DEVOTIONAL_GUIDES[1]` | Index must stay stable; add a comment |
| `app.js` window bindings | PHF-01 adds `window.openConfessionGuide` | Standard pattern, same as `openRosary` etc. |
| `_navHtml` in rosary.js | PHF-02b adds persistent swipe cue | Affects all rosary screens with nav buttons |
| Stations swipe hint | PHF-02b removes one-time pattern from rosary only | Stations still has its own hint — can harmonize later |
| Detail panel accordion | PHF-01a adds HTML after confession schedule | Only inside `sec.k === 'conf'` branch |
| Find tab card list | PHF-01b adds a hint div above cards | `display:none` by default, shown only for confession filter |

---

## Implementation Order

1. **PHF-02a** — Reader close button 44pt (CSS-only, 2 minutes, prevents Dorothy from being trapped)
2. **PHF-01** — Confession guide reader module registration (prerequisite for 01a/01b)
3. **PHF-01a** — Detail panel confession nudge (highest pastoral impact)
4. **PHF-02c** — Prayer text size boost (CSS-only, no JS)
5. **PHF-01b** — Find tab confession hint (secondary Kevin touchpoint)
6. **PHF-02b** — Persistent swipe hint (rosary JS change)
7. **PHF-02d** — Continuity cue (CSS-only, may be unnecessary — implement last, evaluate)

Items 1–4 should be done as a group. Items 5–7 can be cherry-picked.

---

## Summary Table

| ID | Title | Priority | Persona | Files |
|----|-------|----------|---------|-------|
| PHF-01 | Confession Guide — Reader Module Registration | P1 | Kevin | src/devotions.js, src/app.js |
| PHF-01a | Confession Guide Nudge in Detail Panel | P1 | Kevin | src/render.js, css/app.css |
| PHF-01b | Confession Guide Hint on Find Tab Filter | P2 | Kevin | src/render.js, index.html, css/app.css |
| PHF-02a | Reader Close Button — 44pt Touch Target | P1 | Dorothy | css/app.css |
| PHF-02b | Persistent Swipe Hint in Rosary Footer | P2 | Dorothy | src/rosary.js, css/app.css |
| PHF-02c | Prayer Text Size Boost at Large Setting | P2 | Dorothy | css/app.css |
| PHF-02d | Reader Overlay Continuity Cue | P3 | Dorothy | css/app.css |

---

## The Usher Principle

> "The best parish experiences work the same way — the usher who hands you a hymnal open to the right page, the sign outside the confessional that says what to expect. Nobody has to ask. The help is just *there*."

Every item in this spec follows that principle. The confession guide appears where Kevin is already looking. The close button is big enough for Dorothy's fingers. The swipe hint stays visible. The text is large enough to read at arm's length. Nobody has to ask for help. The help is just there.
