# UX Spec: Contextual Filter Hints (CLH series)

**Created:** 2026-03-15  
**Status:** Queued  
**Backlog items:** IDEA-120, IDEA-121, IDEA-122  
**Related:** PHF-01b (confession hint — existing, proven pattern), IDEA-076 (done)  
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CLH.md

---

## Overview

When a user taps a specialty filter chip on the Find tab (Adoration, Confession, Latin), the results show *where and when* — but offer no context for someone who doesn't know *what* the service is. The app has excellent explanatory content for Adoration and Confession in its devotional guides, but the only path to that content is More tab → Faith Guides → Devotions → specific card. That's 4 taps and requires knowing the content exists.

The Confession filter already has a contextual hint (PHF-01b, shipped). This spec generalizes that pattern into a data-driven system and extends it to Adoration, with infrastructure for Latin when content is written.

### Demographic walkthrough

**Dorothy (72):** Taps "Adoration" because her granddaughter mentioned it. Sees a list of times and parishes — but she doesn't know what Adoration *is*. Is she supposed to bring something? Do something? The hint "New to Adoration? What to expect ›" gives her a gentle, non-patronizing path to the guide. She taps it, reads the explanation, and now has the confidence to go. *Without the hint, she might never go.*

**Paul (25):** Filters for Adoration. He's been to Mass but never Adoration. The hint is slim, polished, doesn't feel like a tutorial popup — more like an Apple inline tip. He either taps it (learns something) or ignores it (it dismisses next tap or vanishes next filter change). No friction. He also notices the dismiss × is easy to hit — not a tiny 12px target.

**Sarah (45):** She knows what Adoration is. She's finding times for Thursday night. The hint appears above results, takes up ~36px vertical space. She either scrolls past it or taps ×. It doesn't appear again this session. Zero cognitive load.

---

## CLH-01 — Generalize Filter Hints to Data-Driven System

**Category:** refinement  
**Priority:** P1 (prerequisite for CLH-03)

### Problem

The current implementation uses two hardcoded `<div>` elements in `index.html` (`confessionHint` and `spanishHint`) with parallel rendering logic in `src/render.js` (lines 129–157). Each new filter hint requires:
- A new `<div>` in `index.html`
- A new block of nearly identical JS in `render.js`
- A new sessionStorage key

This doesn't scale. Adding Adoration and Latin means 4 parallel blocks of duplicate logic.

### Fix

Replace both hardcoded divs with a single `<div id="filterHint">` and a config map that determines content based on `state.currentFilter`.

**File: `index.html`**

Before (lines 82–83):
```html
<div id="confessionHint" class="confession-hint" style="display:none"></div>
<div id="spanishHint" class="confession-hint" style="display:none"></div>
```

After:
```html
<div id="filterHint" class="filter-hint" style="display:none"></div>
```

**File: `src/render.js`** — Replace lines 129–157 (the confession hint block + spanish hint block) with a single data-driven block:

```javascript
// CLH-01: Data-driven contextual filter hints
var filterHintEl = document.getElementById('filterHint');
if (filterHintEl) {
  var _hintConfig = {
    confession: {
      text: 'Not sure what to expect?',
      link: 'How Confession works \u203A',
      action: 'openConfessionGuide()',
      storageKey: 'mf-conf-hint-dismissed'
    },
    adoration: {
      text: 'New to Adoration?',
      link: 'What to expect \u203A',
      action: 'openAdorationGuide()',
      storageKey: 'mf-ador-hint-dismissed'
    },
    spanish: {
      text: 'Prayers available in Spanish',
      link: 'Set prayer language \u203A',
      action: 'openSettings()',
      storageKey: 'mf-spanish-hint-dismissed',
      condition: function() {
        return localStorage.getItem('mf-prayer-lang') !== 'es';
      }
    }
    // CLH-05: Add 'latin' entry here when content is ready
  };

  var _hint = _hintConfig[state.currentFilter];
  var _showHint = _hint
    && !sessionStorage.getItem(_hint.storageKey)
    && (!_hint.condition || _hint.condition());

  if (_showHint) {
    filterHintEl.style.display = '';
    filterHintEl.innerHTML = '<div class="filter-hint-inner">'
      + '<span>' + _hint.text + '</span>'
      + '<span class="filter-hint-link" onclick="' + _hint.action + '">' + _hint.link + '</span>'
      + '<button class="filter-hint-dismiss" onclick="this.closest(\'.filter-hint\').style.display=\'none\';sessionStorage.setItem(\'' + _hint.storageKey + '\',\'1\')" aria-label="Dismiss hint">'
      + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '</div>';
  } else {
    filterHintEl.style.display = 'none';
  }
}
```

**File: `css/app.css`** — Rename classes (old classes can be removed):

Before (`confession-hint` classes, lines 2105–2109):
```css
.confession-hint { padding:0 var(--space-4);max-width:var(--max-width);margin:0 auto; }
.confession-hint-inner { display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:color-mix(in srgb, var(--color-info) 4%, transparent);border-radius:var(--radius-sm);font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2); }
.confession-hint-link { color:var(--color-info);font-weight:var(--weight-semibold);cursor:pointer;white-space:nowrap; }
.confession-hint-dismiss { margin-left:auto;background:none;border:none;color:var(--color-text-tertiary);font-size:var(--text-xs);cursor:pointer;padding:var(--space-1);min-width:28px;min-height:28px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent; }
html[data-theme="dark"] .confession-hint-inner { background:color-mix(in srgb, var(--color-info) 5%, transparent); }
```

After:
```css
/* CLH-01: Contextual filter hints (generalized from PHF-01b) */
.filter-hint { padding:0 var(--space-4);max-width:var(--max-width);margin:0 auto; }
.filter-hint-inner { display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:color-mix(in srgb, var(--color-info) 4%, transparent);border-radius:var(--radius-sm);font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2); }
.filter-hint-link { color:var(--color-info);font-weight:var(--weight-semibold);cursor:pointer;white-space:nowrap; }
.filter-hint-dismiss { margin-left:auto;background:none;border:none;color:var(--color-text-tertiary);cursor:pointer;padding:var(--space-2);min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent; }
html[data-theme="dark"] .filter-hint-inner { background:color-mix(in srgb, var(--color-info) 5%, transparent); }
```

Note: Dismiss button changes from 28×28 to 44×44 (CLH-04 fix incorporated). The SVG icon stays 16×16 inside the larger touch target.

### Cascading impacts

- The `confessionHint` and `spanishHint` element IDs are referenced in `src/render.js` lines 129 and 144 — both replaced by the new block.
- The `confession-hint-inner` class is also used in `src/render.js` line 150 for the Spanish hint — that's absorbed into the new system.
- The `.conf-guide-nudge` styles in the detail panel (css/app.css ~line 2098) are UNRELATED — those stay. They use different class names for the detail panel confession nudge.
- Search the codebase for any other references to `confessionHint` or `spanishHint` IDs to ensure nothing breaks.

### Dark mode
Covered by the `html[data-theme="dark"] .filter-hint-inner` rule. Same 5% opacity tint as the existing confession hint.

### Test checklist
- [ ] Tap Confession chip → hint appears with "Not sure what to expect? How Confession works ›"
- [ ] Tap × on hint → hint hides, does not reappear during session
- [ ] Tap link → confession guide opens in reader overlay
- [ ] Switch away from Confession chip → hint hides
- [ ] Return to Confession chip same session after dismiss → hint stays hidden
- [ ] New session → hint reappears
- [ ] Tap Spanish chip (without Spanish prayer lang set) → Spanish hint appears
- [ ] All hint dismiss buttons ≥ 44×44 actual touch area
- [ ] Dark mode: hint background visible but subtle

---

## CLH-02 — Register Adoration Guide as Reader Module

**Category:** enhancement  
**Priority:** P1 (prerequisite for CLH-03)

### Problem

The Eucharistic Adoration guide exists as rich content in `src/devotions.js` (DEVOTIONAL_GUIDES → Devotions group → children[0], lines 333–337), but it is only reachable by navigating to More → Faith Guides → Devotions → Eucharistic Adoration. There is no reader module for it, so it cannot be opened from a filter hint, detail panel, or any other surface.

The Confession guide was registered as a reader module (PHF-01, `src/devotions.js` lines 8–47) and the same pattern should be followed.

### Fix

**File: `src/devotions.js`** — Add after the confession-guide reader module registration (after line ~47, before `_wrapScriptureRefs` function):

```javascript
// CLH-02: Adoration Guide reader module — accessible from any tab
reader.registerModule('adoration-guide', {
  getTitle: function() { return 'Eucharistic Adoration'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    // Find Adoration guide in Devotions group
    var guide = null;
    for (var i = 0; i < DEVOTIONAL_GUIDES.length; i++) {
      var g = DEVOTIONAL_GUIDES[i];
      if (g.isGroup && g.children) {
        for (var j = 0; j < g.children.length; j++) {
          if (g.children[j].title === 'Eucharistic Adoration') {
            guide = g.children[j];
            break;
          }
        }
      }
      if (guide) break;
    }
    if (!guide) { bodyEl.innerHTML = '<p>Guide not found.</p>'; return; }

    bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75">'
      + _wrapScriptureRefs(_wrapTerms(guide.body))
      + '<div style="margin-top:var(--space-5)">'
      + '<button onclick="readerClose();closeAllPanels();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=adoration]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Adoration near you</button>'
      + '</div></div>';

    _initTermClicks(bodyEl);
    refs.initRefTaps(bodyEl);
  },
  onClose: function() {}
});
```

**File: `src/app.js`** — Add global function (near line 259, after `openConfessionGuide`):

```javascript
window.openAdorationGuide = function() { reader.readerOpen('adoration-guide'); };
```

### Dark mode
Reader overlay already handles dark mode. No additional CSS needed.

### Test checklist
- [ ] Call `openAdorationGuide()` from console → reader overlay opens with Adoration content
- [ ] Content includes term tooltips (monstrance, Blessed Sacrament, etc.)
- [ ] "Find Adoration near you" button at bottom → closes reader, switches to Find tab, activates Adoration chip
- [ ] Dark mode: content readable, button visible
- [ ] Close button in reader header ≥ 44×44 touch target (already handled by PHF-02a)

---

## CLH-03 — Adoration Filter Hint

**Category:** enhancement  
**Priority:** P2

### Problem

When the Adoration chip is active on the Find tab, results show parishes with adoration times but no context for someone who doesn't know what Eucharistic Adoration is. Dorothy (72) or a returning Catholic sees "Adoration" times but may not understand what they're signing up for. The guide that would explain it is 4 taps away in More → Faith Guides → Devotions.

### Fix

With CLH-01 (generalized hint system) and CLH-02 (Adoration reader module) in place, the Adoration hint is already configured in the `_hintConfig` map:

```javascript
adoration: {
  text: 'New to Adoration?',
  link: 'What to expect \u203A',
  action: 'openAdorationGuide()',
  storageKey: 'mf-ador-hint-dismissed'
}
```

No additional code needed beyond CLH-01 and CLH-02.

### Copy rationale

- **"New to Adoration?"** — Warm, curious, non-patronizing. Doesn't assume ignorance ("What is Adoration?") nor expertise. The word "New" implies this is a normal, good thing.
- **"What to expect ›"** — Action-oriented, reduces anxiety. Same emotional framing as the confession hint's "How Confession works." Tells you what you'll get if you tap.

Alternative considered and rejected: *"What is Adoration?"* — Too didactic, feels like a quiz question. Dorothy doesn't want to feel tested. *"Learn about Adoration"* — "Learn" has homework connotations. *"What to expect"* frames it as practical preparation.

### Placement

Same position as the existing confession hint: between the `activeFilters` div and the `results-info` bar. This is:
- Below the chip bar (doesn't interfere with filter selection)
- Above the first result card (seen immediately without scrolling)
- Slim (~36px height with padding) — doesn't push content down meaningfully

### Behavior

- **Appears:** When `state.currentFilter === 'adoration'` and hint not dismissed this session
- **Dismisses:** Tap × button (sessionStorage persists for session) or switch to a different filter
- **Returns:** Fresh session shows it again — Dorothy might want it next week when she brings her friend
- **Link tap:** Opens Adoration guide in reader overlay (full-screen, same as confession guide)

### Dark mode
Inherited from CLH-01 `.filter-hint-inner` dark mode rule.

### Test checklist
- [ ] Tap Adoration chip → "New to Adoration? What to expect ›" appears above results
- [ ] Tap "What to expect ›" → Adoration guide opens in reader overlay
- [ ] Tap × → hint dismissed for session
- [ ] Switch to All chip → hint hides
- [ ] Return to Adoration chip after dismiss → stays hidden
- [ ] New browser session → hint reappears
- [ ] Dark mode: hint renders correctly

---

## CLH-04 — Fix Dismiss Button Touch Target

**Category:** bug  
**Priority:** P1

### Problem

The existing confession hint dismiss button has `min-width:28px;min-height:28px` (css/app.css line 2108). This is well below Apple's 44pt minimum. Dorothy with her bifocals and thick fingers will struggle to hit this target. She'll accidentally tap the link next to it or miss entirely and think "it's broken."

### Fix

Incorporated into CLH-01's CSS. The new `.filter-hint-dismiss` class uses:

```css
.filter-hint-dismiss {
  margin-left:auto;
  background:none;
  border:none;
  color:var(--color-text-tertiary);
  cursor:pointer;
  padding:var(--space-2);       /* was --space-1 (4px), now 8px */
  min-width:44px;               /* was 28px */
  min-height:44px;              /* was 28px */
  display:flex;
  align-items:center;
  justify-content:center;
  -webkit-tap-highlight-color:transparent;
}
```

The SVG × icon inside remains 16×16 (visually appropriate), but the tappable area is now 44×44. The extra padding around the icon creates a comfortable touch zone.

### Test checklist
- [ ] Dismiss button responds on first tap — no misses
- [ ] Visual icon stays small (16×16) but hit area is generous
- [ ] No layout shift — the button doesn't push adjacent text
- [ ] Inspect element confirms 44×44 minimum dimensions

---

## CLH-05 — Latin Filter Hint (Infrastructure Ready, Content Needed)

**Category:** new-feature (placeholder)  
**Priority:** P3

### Problem

When the Latin chip is active, results show parishes with Latin Mass but no context for what a Latin Mass (Extraordinary Form / Traditional Latin Mass) is or what to expect. Unlike Adoration and Confession, there is currently **no Latin Mass guide** in the devotional content — only a glossary tooltip for "Extraordinary Form" (src/devotions.js line 75).

### What's needed

1. **Content:** A "What to expect at a Latin Mass" guide — covering posture, the missal, responses in Latin, the different structure, communion on the tongue, etc. This is substantial content creation.
2. **Reader module:** Registration following the CLH-02 pattern once content exists.
3. **Hint config entry:** Already stubbed in CLH-01's `_hintConfig` with a comment.

Proposed hint copy (for when content is ready):
```javascript
latin: {
  text: 'Attending Latin Mass?',
  link: 'What to expect \u203A',
  action: 'openLatinMassGuide()',
  storageKey: 'mf-latin-hint-dismissed'
}
```

### Handoff

→ **Hand off to Content & Voice:** "Draft a 'What to expect at a Latin Mass' guide. Warm, practical, non-intimidating. Cover: the missal, Latin responses, communion posture, the different structure from Ordinary Form, dress expectations, what you do if you get lost. Same voice as the existing Confession and Adoration guides in src/devotions.js. Target length: 3–4 paragraphs plus one expandable section."

→ **Hand off to Engineering (after content):** "Register Latin Mass guide as reader module following CLH-02 pattern. Add `openLatinMassGuide` global function. Uncomment the `latin` entry in the `_hintConfig` map."

### Test checklist
- [ ] (After content + engineering) Tap Latin chip → hint appears
- [ ] Link opens Latin Mass guide in reader overlay
- [ ] Session dismissal works

---

## Implementation order

1. **CLH-02** first — register Adoration reader module (no visible change, just wiring)
2. **CLH-01** — generalize hint system (replaces existing confession/spanish hints + adds adoration + fixes touch target)
3. **CLH-03** — no additional code, just verify adoration hint works
4. **CLH-04** — already incorporated into CLH-01 CSS
5. **CLH-05** — future, after Content & Voice handoff

CLH-01 through CLH-04 can ship as one implementation pass.

---

## Filters evaluated but excluded

| Filter | Guide exists? | Hint warranted? | Decision |
|--------|--------------|-----------------|----------|
| **Confession** | Yes (PHF-01) | Already shipped | Keep as-is in generalized system |
| **Adoration** | Yes (devotions.js) | **Yes** | CLH-02 + CLH-03 |
| **Latin** | No | Yes, but needs content | CLH-05 (placeholder) |
| **Spanish** | N/A (language pref) | Already shipped | Keep as-is in generalized system |
| **Lent** | Yes (devotions.js) | Maybe, but Lent is a season not a mystery | Skip — users who tap the Lent chip generally know what Lent is |
| **Today / Weekend** | N/A | No — these are temporal filters, not concept filters | Skip |
| **YC Events** | No | No — Young Catholic Events are self-explanatory from the event cards | Skip |

---

## Summary

| ID | Title | Priority | Category |
|----|-------|----------|----------|
| CLH-01 | Generalize Filter Hints to Data-Driven System | P1 | refinement |
| CLH-02 | Register Adoration Guide as Reader Module | P1 | enhancement |
| CLH-03 | Adoration Filter Hint | P2 | enhancement |
| CLH-04 | Fix Dismiss Button Touch Target (44pt) | P1 | bug |
| CLH-05 | Latin Filter Hint (Placeholder — Needs Content) | P3 | new-feature |
