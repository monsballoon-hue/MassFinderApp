# Claude Code Prompt — PHF (Pastoral Handoff)

**Spec:** `docs/plans/UX_Spec_Pastoral_Handoff.md`
**Scope:** css/app.css, src/render.js, src/devotions.js, src/rosary.js, src/app.js, index.html
**Do NOT modify:** Data files, build scripts, or modules not listed above

---

## Context

Two critical user journeys identified by pastoral advisor. Kevin (42, lapsed Catholic) needs the confession guide surfaced where he's already looking — not buried on the More tab. Dorothy (78, daily Mass) needs bigger touch targets, persistent navigation cues, and larger prayer text.

**Read the full spec first:** `docs/plans/UX_Spec_Pastoral_Handoff.md`

---

## Implementation instructions

### Group 1: Critical fixes (do all)

**PHF-02a — Reader Close Button 44pt**

1. In `css/app.css`, find `.reader-close-btn` (line ~2029). Change `width:30px;height:30px` to `width:44px;height:44px`. Nothing else changes — the SVG icon stays 16×16, the border-radius stays 50%.

2. Verify the reader header still fits on iPhone SE (320px). The header is flex with `gap:var(--space-2)`. The back button, title, and close button must still fit. The title has `flex:1` so it should compress gracefully.

**PHF-01 — Confession Guide Reader Module**

3. In `src/devotions.js`, at the top of the file (after the existing requires), add a reader module registration for `'confession-guide'`. The module's `render` function should:
   - Get the confession guide body from `DEVOTIONAL_GUIDES[1].body` (the "How to go to Confession" entry — verify the index is correct by checking `DEVOTIONAL_GUIDES[1].title === 'How to go to Confession'`)
   - Render the body HTML wrapped in a max-width container with proper font sizing
   - Append a "Find Confession near you" button at the bottom that closes the reader and activates the confession filter on the Find tab
   - Wire term definitions via `initTermClicks(bodyEl)` (the function is in the same file)
   - Wire CCC refs and Scripture refs via `refs.initRefTaps(bodyEl)` and the snippet system

4. In `src/app.js`, add `window.openConfessionGuide = function() { readerOpen('confession-guide'); };` alongside the existing `window.openRosary`, `window.openStations`, etc.

**PHF-01a — Confession Guide Nudge in Detail Panel**

5. In `src/render.js`, find the `sec.k === 'conf'` branch inside the detail panel accordion rendering (~line 742-751). After `bodyInner = nextConfHtml + renderSched(...)`, append the confession guide nudge HTML:

```javascript
bodyInner = nextConfHtml + renderSched(svcs, locL, ml, sec.types, _curDay)
  + '<div class="conf-guide-nudge" onclick="openConfessionGuide()">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14" style="flex-shrink:0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  + 'First time in a while? <span class="conf-guide-nudge-link">What to expect \u203A</span>'
  + '</div>';
```

6. In `css/app.css`, add the `.conf-guide-nudge` styles from the spec. Include dark mode override. Ensure `min-height:44px` for touch target.

### Group 2: Dorothy polish (do all)

**PHF-02c — Prayer Text Size Boost**

7. In `css/app.css`, add the `[data-text-size="large"] .reader-body` scoped rules from the spec. These boost `.rosary-prayer-text`, `.chaplet-prayer-text`, `.stations-meditation-text`, `.stations-prayer-text`, `.rosary-mystery-meditation`, `.rosary-mystery-title`, and `.exam-section-body` by 2px with slightly increased line-height.

**PHF-02b — Persistent Swipe Hint**

8. In `src/rosary.js`, modify the `_navHtml` function (~line 550) to append a persistent swipe cue div after the button flex container:
```javascript
+ '<div class="rosary-nav-swipe-cue">\u2190 swipe to navigate \u2192</div>';
```

9. Remove the old one-time swipe hint block (~lines 448-456, the `if (!_swipeHintShown)` block). You can keep `_swipeHintShown` variable or remove it — it's no longer used for the hint, but check if anything else references it.

10. In `css/app.css`, add `.rosary-nav-swipe-cue` style from the spec.

### Group 3: Secondary touchpoints (do all)

**PHF-01b — Find Tab Confession Hint**

11. In `index.html`, add `<div id="confessionHint" class="confession-hint" style="display:none"></div>` after the closing `</div>` of `.results-info` and before `<div id="pullIndicator"`.

12. In `src/render.js`, inside `renderCards()`, after the `resultsCount` innerHTML update (~line 127), add the confession hint logic from the spec. Show when `state.currentFilter === 'confession'` and not dismissed via `sessionStorage`.

13. In `css/app.css`, add `.confession-hint`, `.confession-hint-inner`, `.confession-hint-link`, `.confession-hint-dismiss` styles from the spec. Include dark mode.

**PHF-02d — Reader Overlay Continuity Cue (lowest priority)**

14. In `css/app.css`, add the `.reader-overlay::after` rule from the spec (the 3px bottom-edge gradient, not the text wordmark). Include dark mode override. This is the least important item — skip if any doubts.

---

## Key gotchas

- **DEVOTIONAL_GUIDES index stability:** The confession guide is at index 1 (0-indexed). Add a defensive check: `if (devotions.DEVOTIONAL_GUIDES[1].title !== 'How to go to Confession')` with a console warning. If someone reorders the array, the fallback should search by title.

- **Reader module registration timing:** The reader module must be registered before any code calls `openConfessionGuide()`. Since `devotions.js` is required by `more.js` which is required by `app.js`, the registration will run at module load time — same pattern as rosary, stations, etc.

- **sessionStorage vs localStorage for PHF-01b:** Use `sessionStorage` (not `localStorage`) for the Find tab hint dismissal. Kevin should see it again next time he opens the app. Only suppress within a single session.

- **Rosary _swipeHintShown cleanup:** After removing the one-time hint, the `_swipeHintShown` variable (line ~18) and its reference in the decade rendering can be removed. Check that `_hasInteracted` (separate variable, used for bead hint) is NOT removed — that's a different feature.

- **Close button size on desktop:** On desktop, the reader has `max-width: min(600px, 90vw)`. The 44px close button will look proportionally larger in the compact desktop reader header. This is fine — desktop users have precise mouse cursors and the extra size doesn't hurt.

---

## Test checklist (full)

### Kevin's journey
- [ ] Tap Confession chip on Find tab → see hint "Not sure what to expect?"
- [ ] Tap hint → reader overlay opens with full confession guide
- [ ] Dismiss hint → stays hidden for rest of session
- [ ] Reopen app → hint appears again
- [ ] Open church detail → tap Sacraments accordion → see "First time in a while?" nudge
- [ ] Tap nudge → reader overlay opens with same guide
- [ ] Guide has working CCC pills, term definitions, Scripture refs
- [ ] "Find Confession near you" button in guide → closes reader, activates Confession filter

### Dorothy's journey
- [ ] Open Rosary → close button is 44px (visibly larger circle)
- [ ] Can hit close button on first try (test on actual phone)
- [ ] "← swipe to navigate →" visible persistently in rosary footer
- [ ] At "large" text size: prayer text noticeably larger inside reader
- [ ] At "default" text size: no change to prayer text
- [ ] Subtle 3px blue line at bottom of reader overlay (continuity cue)

### Regression
- [ ] All other prayer tools (Chaplet, Stations, Novena, Exam, Prayerbook) still open and close correctly
- [ ] Reader header not broken on iPhone SE
- [ ] No console errors
- [ ] Build passes: `npm run build`
- [ ] Dark mode: all new elements render correctly
