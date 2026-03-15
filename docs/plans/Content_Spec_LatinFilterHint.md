# Content Spec: Latin Filter Hint (CLH-05 Content)

**Spec series:** CON-31  
**Author:** Content & Voice  
**Status:** Approved by Catholic Review (2026-03-15) — ships with CON-30  
**Date:** 2026-03-15  
**Dependency:** CON-30 (Latin Mass guide content) must be approved first  
**Engineering dependency:** CLH-01 (generalized hint system) must be implemented first  
**Target locations:** `src/render.js` (hint config entry), `src/devotions.js` (reader module), `src/app.js` (global function)

---

## CON-31a: Filter Hint Copy

**Content type:** Contextual UI hint (inline, dismissable)  
**Display location:** Find tab, between filter chips and result cards, when Latin chip is active  
**Visual format:** Single-line bar — ~36px height, matches confession/adoration hint pattern

### Recommended Copy (updated 2026-03-15)

**Hint text:** `New to Latin Mass?`
**Link text:** `What to expect ›`

### Full config entry (for `_hintConfig` map in render.js):

```javascript
latin: {
  text: 'New to Latin Mass?',
  link: 'What to expect \u203A',
  action: 'openLatinMassGuide()',
  storageKey: 'mf-latin-hint-dismissed'
}
```

### Copy rationale

The hints now form a consistent family:

| Filter | Text | Link | Pattern |
|--------|------|------|---------|
| Confession | Not sure what to expect? | How Confession works › | *(original, pre-CLH-01)* |
| Adoration | New to Adoration? | What to expect › | "New to X?" / "What to expect ›" |
| **Latin** | **New to Latin Mass?** | **What to expect ›** | "New to X?" / "What to expect ›" |

**Why "New to Latin Mass?" (revised from "Attending Latin Mass?"):**

The Adoration and Latin hints are the same *kind* of hint — they help someone understand a service type they may not have experienced. Using the identical structure ("New to X?" / "What to expect ›") makes the system feel like a system. Users subconsciously recognize the pattern: *"This little bar tells me about things I haven't tried."*

"New" is warm and non-patronizing. It frames the reader as a curious newcomer, not someone who needs instruction. And the word "New" doesn't presume — a returning Catholic who attended Latin Mass decades ago will still feel "new" to it.

**Alternatives evaluated:**

- ~~*Attending Latin Mass?*~~ — Previous draft. More action-oriented but breaks the "New to X?" pattern. Also slightly formal — "Attending" reads like an RSVP.
- ~~*First time at Latin Mass?*~~ — Presumptive. Someone returning after 20 years isn't there for the "first time."
- ~~*Curious about Latin Mass?*~~ — Too soft. The user already tapped the Latin chip — they're past curiosity.
- ~~*Not sure what to expect?*~~ — Mirrors Confession hint, but better to consolidate around the newer "New to X?" pattern for specialty service filters.

**Why "What to expect ›"** — Identical to the Adoration hint link. Consistency across hints. The phrase reduces anxiety (you'll know what you're walking into) without being didactic.

---

## CON-31b: Reader Module Title

**Content type:** Reader overlay header  
**Display location:** Top of reader overlay when guide is opened via hint link

### Draft Text

**Reader title:** `What to Expect at a Latin Mass`

Matches the guide title in the Devotions group (CON-30) exactly. No abbreviation.

---

## CON-31c: CTA Button Text

**Content type:** Button label  
**Display location:** Bottom of the Latin Mass guide when opened in reader overlay

### Draft Text

**Button text:** `Find Latin Mass near you`

Follows the established pattern: "Find Confession near you" (confession guide) and "Find Adoration near you" (CLH-02 adoration guide). The button closes the reader and switches to Find tab with the Latin filter active.

---

## Review Notes for Catholic Review

1. **Verify:** "New to Latin Mass?" — Is this phrasing warm and neutral? Does "New" risk patronizing regular TLM attendees? (Content team believes "New" is fine — Dorothy and Kevin are the target, and regulars will dismiss the hint on first tap.)
2. **Verify:** "Latin Mass" is the right user-facing term (vs. "Traditional Latin Mass" or "Extraordinary Form"). The TERMINOLOGY.md file uses "Latin Mass" for the filter chip label. The guide title uses "Latin Mass" in the expanded form "What to Expect at a Latin Mass."
3. **Note:** This is UI-level microcopy only. The full guide text is in CON-30 (Content_Spec_LatinMass.md), reviewed separately.

---

## Engineering Handoff

This content fills the CLH-05 placeholder in `docs/plans/UX_Spec_Contextual_Filter_Hints.md`. Implementation requires three pieces:

### 1. Reader module registration (`src/devotions.js`)

Add after the adoration-guide reader module (CLH-02), following the same pattern:

```javascript
// CLH-05 / CON-31: Latin Mass Guide reader module
reader.registerModule('latin-mass-guide', {
  getTitle: function() { return 'What to Expect at a Latin Mass'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    // Find Latin Mass guide in Devotions group
    var guide = null;
    for (var i = 0; i < DEVOTIONAL_GUIDES.length; i++) {
      var g = DEVOTIONAL_GUIDES[i];
      if (g.isGroup && g.children) {
        for (var j = 0; j < g.children.length; j++) {
          if (g.children[j].title === 'What to Expect at a Latin Mass') {
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
      + '<button onclick="readerClose();closeAllPanels();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=latin]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Latin Mass near you</button>'
      + '</div></div>';

    _initTermClicks(bodyEl);
    refs.initRefTaps(bodyEl);
  },
  onClose: function() {}
});
```

### 2. Global function (`src/app.js`)

Add near line 259, after `openConfessionGuide` (and `openAdorationGuide` if CLH-02 is done):

```javascript
window.openLatinMassGuide = function() { reader.readerOpen('latin-mass-guide'); };
```

### 3. Hint config entry (`src/render.js`)

In the `_hintConfig` map (created by CLH-01), replace the `// CLH-05: Add 'latin' entry here when content is ready` comment with:

```javascript
latin: {
  text: 'New to Latin Mass?',
  link: 'What to expect \u203A',
  action: 'openLatinMassGuide()',
  storageKey: 'mf-latin-hint-dismissed'
}
```

### Implementation order

This requires CLH-01 (generalized hint system) to be implemented first. If CLH-01 is not yet done, the hint entry above should be included in the CLH-01 implementation pass rather than added separately.

### Test checklist

- [ ] Tap Latin chip on Find tab → "New to Latin Mass? What to expect ›" appears above results
- [ ] Tap "What to expect ›" → reader overlay opens with full Latin Mass guide (CON-30 content)
- [ ] Term tooltips work inside reader (Extraordinary Form, ad orientem)
- [ ] "Find Latin Mass near you" button → closes reader, activates Latin filter on Find tab
- [ ] Tap × → hint dismissed, does not return this session
- [ ] New session → hint reappears
- [ ] Dark mode: hint bar and reader overlay render correctly
