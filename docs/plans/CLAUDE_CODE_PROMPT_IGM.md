# Claude Code Prompt — IGM (Install Guide Mockup Fidelity)

**Spec:** `docs/plans/UX_Spec_Install_Guide_Mockups.md`
**Files:** `src/install-guide.js`, `css/app.css` (lines 447–530)
**Priority:** P1

---

## Summary

The install guide's CSS phone mockups don't match real iOS Safari or Chrome. 7 items, 2 files. All changes are to the phone mockup visuals and caption text inside `src/install-guide.js` and the `.ig-*` CSS block in `css/app.css`.

---

## Implementation Order

### 1. IGM-02 — Rebuild Safari share sheet (largest change)

**`src/install-guide.js`** — Replace `IOS_SAFARI_STEPS[1].visual` function entirely.

Current: flat list (Copy → Add to Reading List → Add Bookmark → Add to Favorites → ATHS → Find on Page) inside `.ig-share-sheet > .ig-sheet-content`.

New: multi-section iOS share sheet with:
- **Header:** App icon (navy bg, gold cross char) + title "Catholic Services Dir…" + domain "massfinder.vercel.app"
- **Share targets row:** 3 dimmed circles (AirDrop, Messages, Mail)
- **Action circles row:** 3 dimmed circles (Copy, Add to Bookmarks, View More)
- **Grouped list section 1:** dimmed rows (Find in Page, Print)
- **Grouped list section 2:** highlighted row (⊕ Add to Home Screen)

Use new wrapper class `.ig-sheet-ios` instead of `.ig-sheet-content`. Keep parent `.ig-share-sheet` unchanged.

**`css/app.css`** — Add after line 530:
```css
.ig-sheet-ios { background:#f2f2f7;border-radius:12px 12px 0 0;overflow:hidden; }
.ig-sheet-hdr { display:flex;align-items:center;gap:8px;padding:12px 12px 8px; }
.ig-sheet-app-icon { width:32px;height:32px;background:var(--color-primary);color:var(--color-accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0; }
.ig-sheet-hdr-text { min-width:0; }
.ig-sheet-hdr-title { font-size:11px;font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.ig-sheet-hdr-domain { font-size:10px;color:#888; }
.ig-sheet-targets { display:flex;gap:10px;padding:8px 12px;border-top:1px solid #ddd;border-bottom:1px solid #ddd; }
.ig-sheet-target { display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8px;color:#666; }
.ig-target-circle { width:36px;height:36px;background:#e0e0e0;border-radius:50%; }
.ig-sheet-actions { display:flex;gap:10px;padding:8px 12px;border-bottom:1px solid #ddd; }
.ig-sheet-action { display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8px;color:#666;text-align:center;line-height:1.2; }
.ig-action-circle { width:36px;height:36px;background:#e0e0e0;border-radius:50%; }
.ig-sheet-group { background:white;border-radius:10px;margin:6px 8px;overflow:hidden; }
.ig-sheet-group .ig-sheet-row { border-bottom:1px solid #f0f0f0; }
.ig-sheet-group .ig-sheet-row:last-child { border-bottom:none; }
```

Dark mode additions (add in the existing `.dark` block):
```css
.dark .ig-sheet-ios { background:#1c1c1e; }
.dark .ig-sheet-hdr-title { color:#fff; }
.dark .ig-sheet-hdr-domain { color:#8e8e93; }
.dark .ig-sheet-targets,.dark .ig-sheet-actions { border-color:#38383a; }
.dark .ig-target-circle,.dark .ig-action-circle { background:#3a3a3c; }
.dark .ig-sheet-target,.dark .ig-sheet-action { color:#aaa; }
.dark .ig-sheet-group { background:#2c2c2e; }
.dark .ig-sheet-group .ig-sheet-row { color:#ddd;border-color:#38383a; }
```

Update caption: "Scroll down past the icons and tap **Add to Home Screen**"

### 2. IGM-01 — Safari toolbar layout

**`src/install-guide.js`** — Replace `IOS_SAFARI_STEPS[0].visual` function's `.ig-safari-bottom` block.

Current: pill URL bar + 5-button toolbar (‹ › share book tabs).

New: two-row layout:
- **Row 1 (`.ig-safari-urlbar`):** SVG lock icon + centered domain "massfinder.vercel.app" + share↑ button (highlighted)
- **Row 2 (`.ig-safari-toolbar`):** ← → + ▢ ⋯ (all dimmed)

Add SVG lock icon constant at top of file (small padlock, 14×14).

**`css/app.css`** — Add:
```css
.ig-safari-urlbar { display:flex;align-items:center;gap:6px;background:white;border-radius:10px;padding:6px 10px;margin-bottom:6px;font-size:11px;color:#666; }
.ig-safari-domain { flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.ig-safari-lock { flex-shrink:0;opacity:0.5; }
.dark .ig-safari-urlbar { background:#2c2c2e;color:#aaa; }
```

Update caption: "Tap the **Share** ↑ button next to the address bar"

### 3. IGM-03 — Chrome toolbar layout

**`src/install-guide.js`** — Replace `IOS_CHROME_STEPS[0].visual` function's `.ig-chrome-bottom` block.

Current: pill URL + 5-button toolbar (identical to Safari layout).

New: single-row bar (`.ig-chrome-bar`):
- Dimmed ← circle
- URL pill "massfinder.vercel.app"
- Highlighted ⋯ circle

**`css/app.css`** — Add:
```css
.ig-chrome-bar { display:flex;align-items:center;gap:6px;padding:4px 6px; }
.ig-chrome-circle { width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#666;background:#e0e0e0;border-radius:50%;flex-shrink:0; }
.ig-chrome-circle.highlight { background:rgba(0,122,255,0.15);color:#007AFF; }
.ig-chrome-circle.dim { opacity:0.5; }
.ig-chrome-url { flex:1;background:#e8e8ed;border-radius:16px;padding:6px 10px;font-size:10px;color:#666;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.dark .ig-chrome-circle { background:#3a3a3c; }
.dark .ig-chrome-url { background:#2c2c2e;color:#aaa; }
```

Update caption: "Tap the **⋯** button at the bottom right"

### 4. IGM-04 + IGM-05 — Chrome 4-step flow

**`src/install-guide.js`** — Replace entire `IOS_CHROME_STEPS` array with 4 steps:

**Step 1:** Chrome bar with ⋯ highlighted (from IGM-03 above).

**Step 2 (NEW):** Phone showing Chrome's ⋯ popup menu. Dark floating popover (`.ig-chrome-menu`) anchored bottom, containing:
- [share icon] Share ← **highlighted**
- [bookmark icon] Add to Bookmarks ← dim
- [book icon] Add Bookmark to… ← dim
- separator
- [+] New Tab ← dim
- [hand] New Private Tab ← dim
- Bottom bar: Bookmarks | All Tabs ← dim

Caption: "Tap **Share** at the top of the menu"

**Step 3:** iOS system share sheet (reuse the rebuilt share sheet from IGM-02). Same multi-section layout. The header shows "Catholic Services Directory" + "massfinder.vercel.app".

Caption: "Scroll down and tap **Add to Home Screen**"

**Step 4:** Reuse `IOS_SAFARI_STEPS[2]` (the "Tap Add" confirmation). Reference as `IOS_SAFARI_STEPS[2]` — same pattern as current code.

**`css/app.css`** — Add Chrome menu styles:
```css
.ig-chrome-menu { position:absolute;bottom:48px;left:12px;right:12px;background:#2c2c2e;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:2; }
.ig-chrome-menu-item { display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#fff;border-bottom:1px solid #3a3a3c; }
.ig-chrome-menu-item.dim { opacity:0.4; }
.ig-chrome-menu-item.highlight { opacity:1;background:rgba(0,122,255,0.15);color:#64ACFF; }
.ig-chrome-menu-sep { height:6px;background:#1c1c1e; }
.ig-chrome-menu-footer { display:flex;border-top:1px solid #3a3a3c; }
.ig-chrome-footer-btn { flex:1;text-align:center;padding:10px 0;font-size:11px;font-weight:600;color:#fff;opacity:0.5; }
.ig-chrome-footer-btn + .ig-chrome-footer-btn { border-left:1px solid #3a3a3c; }
```

Note: Chrome menu is ALWAYS dark (see reference screenshots). No light-mode variant needed for the menu itself.

### 5. IGM-06 — Caption updates

Done inline with each step above. Full mapping:

| Flow | Step | Caption |
|------|------|---------|
| Safari | 1 | "Tap the **Share** ↑ button next to the address bar" |
| Safari | 2 | "Scroll down past the icons and tap **Add to Home Screen**" |
| Safari | 3 | (unchanged) |
| Chrome | 1 | "Tap the **⋯** button at the bottom right" |
| Chrome | 2 | "Tap **Share** at the top of the menu" |
| Chrome | 3 | "Scroll down and tap **Add to Home Screen**" |
| Chrome | 4 | (unchanged — reuses Safari step 3) |

### 6. IGM-07 — Share sheet header with app icon

Already included in IGM-02 (the `.ig-sheet-hdr` section).

---

## Testing

After implementation, verify each flow on actual iOS Safari and iOS Chrome by comparing side-by-side with the reference screenshots in the project files:
- `IMG_0517.png` through `IMG_0523.PNG`

Check:
- [ ] Safari Step 1: URL bar layout matches IMG_0517 toolbar
- [ ] Safari Step 2: Multi-section share sheet matches IMG_0519 structure
- [ ] Chrome Step 1: Bottom bar matches IMG_0520 toolbar
- [ ] Chrome Step 2: Dark menu matches IMG_0521
- [ ] Chrome Step 3: iOS share sheet matches IMG_0522/IMG_0523
- [ ] All tap rings position correctly on `.highlight` elements
- [ ] Dots indicator shows 3 for Safari, 4 for Chrome
- [ ] Dark mode: all new elements have dark variants
- [ ] `_positionRings()` still works (each step has exactly one `.highlight`)

## Constraints

- CommonJS, no arrow functions
- SVG icons only (no emoji) — replace any emoji with inline SVG
- All colors use CSS tokens where available; hardcoded values only for iOS-native UI simulation
- Do not modify Android steps (not evaluated in this pass)
