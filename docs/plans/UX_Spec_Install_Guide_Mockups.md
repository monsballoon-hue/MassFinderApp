# UX Spec — Install Guide Mockup Fidelity (IGM series)

**Created:** 2026-03-15 · **Status:** Queued  
**Area:** `src/install-guide.js` (lines 1–195), `css/app.css` (lines 447–530)  
**Priority:** P1 — the guide actively misleads users with incorrect UI depictions  
**BACKLOG refs:** IDEA-137

---

## Context

The install guide renders CSS-drawn phone mockups to walk users through adding MassFinder to their home screen. Real-device screenshots (iOS Safari dark, iOS Safari light, iOS Chrome) reveal that **every iOS mockup has significant fidelity problems** — wrong toolbar layouts, wrong menu contents, wrong step counts, and a share sheet that bears no resemblance to what iOS actually shows.

Dorothy (72) follows these steps literally. If the mockup shows a button where no button exists, she's stuck. Paul (25) sees a mockup that looks nothing like his phone and instantly distrusts the whole guide. Sarah (45) just needs the right tap target named in the right order.

**Reference screenshots (project files):**
- `IMG_0517.png` — Safari, onboarding, full toolbar visible
- `IMG_0518.png` — Safari dark, share sheet collapsed (share targets + action circles)
- `IMG_0519.png` — Safari dark, share sheet expanded (Add to Home Screen visible)
- `IMG_0520.PNG` — Chrome iOS, onboarding, Chrome bottom bar visible
- `IMG_0521.PNG` — Chrome iOS, ⋯ menu (no Add to Home Screen!)
- `IMG_0522.PNG` — Chrome iOS, after tapping Share → iOS system share sheet
- `IMG_0523.PNG` — Chrome iOS, share sheet expanded (Add to Home Screen visible)

---

## Findings Summary

| ID | Problem | Severity |
|----|---------|----------|
| IGM-01 | Safari toolbar layout wrong — share icon position incorrect | High |
| IGM-02 | Safari share sheet is flat list; real is multi-section with icon rows | Critical |
| IGM-03 | Chrome bottom bar layout is wrong | High |
| IGM-04 | Chrome ⋯ menu shows "Add to Home Screen" — doesn't exist there | Critical |
| IGM-05 | Chrome needs 4 steps not 3 — missing "tap Share" step | Critical |
| IGM-06 | Caption text doesn't match real UI labels | Medium |
| IGM-07 | Share sheet header missing app icon + title | Medium |

---

## IGM-01 — Safari Toolbar Layout

**Problem:** The mockup toolbar shows 5 equal buttons: `‹ › [share] [book] [tabs]`. Real Safari (iOS 15+, see IMG_0517) has TWO distinct rows:
- **URL bar row:** lock/key icon · "massfinder.vercel.app" · share↑ icon (right side)
- **Toolbar row:** ← → + ▢ ⋯ (back, forward, new tab, tabs, more)

The share icon is in the URL bar row, not among the toolbar buttons. Dorothy looks for the share icon among the bottom buttons and can't find it.

**Fix — `src/install-guide.js`, Safari Step 1 visual function:**

Replace the entire `ig-safari-bottom` block. The new layout needs two rows: a URL bar with the share icon at right, and a toolbar row with back/forward/+/tabs/more.

```
BEFORE (current):
  <div class="ig-safari-bottom">
    <div class="ig-safari-pill">massfinder.com</div>
    <div class="ig-safari-toolbar">
      <span class="ig-tb-btn dim">‹</span>
      <span class="ig-tb-btn dim">›</span>
      <span class="ig-tb-btn highlight">{SHARE_ICON}</span>
      <span class="ig-tb-btn dim">{BOOK_ICON}</span>
      <span class="ig-tb-btn dim">{TABS_ICON}</span>
    </div>
  </div>

AFTER:
  <div class="ig-safari-bottom">
    <div class="ig-safari-urlbar">
      <span class="ig-safari-lock">🔒</span>
      <span class="ig-safari-domain">massfinder.vercel.app</span>
      <span class="ig-tb-btn highlight">{SHARE_ICON}</span>
    </div>
    <div class="ig-safari-toolbar">
      <span class="ig-tb-btn dim">‹</span>
      <span class="ig-tb-btn dim">›</span>
      <span class="ig-tb-btn dim">+</span>
      <span class="ig-tb-btn dim">{TABS_ICON}</span>
      <span class="ig-tb-btn dim">⋯</span>
    </div>
  </div>
```

Note: the 🔒 should be an SVG lock icon, not an emoji. Use an inline SVG.

**New CSS (`css/app.css`):**
```css
.ig-safari-urlbar { display:flex;align-items:center;gap:6px;background:white;border-radius:10px;padding:6px 10px;margin-bottom:6px;font-size:11px;color:#666; }
.ig-safari-domain { flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.ig-safari-lock { font-size:10px;flex-shrink:0;opacity:0.5; }
```

**Caption update:** Change from "Tap the **Share** button at the bottom of Safari" to "Tap the **Share** button ↑ next to the address bar"

**Dark mode:** The URL bar pill should use `background:#2c2c2e` in dark mode (matching iOS dark Safari). Toolbar buttons remain system blue.

**Test checklist:**
- [ ] URL bar shows domain centered with share icon at right
- [ ] Share icon has highlight ring
- [ ] Toolbar row shows ← → + ▢ ⋯ (all dimmed)
- [ ] Tap ring animates on the share icon, not a toolbar button
- [ ] Dark mode: URL bar pill is dark, text is light

---

## IGM-02 — Safari Share Sheet Layout (Complete Rebuild)

**Problem:** The current share sheet mockup is a flat list: Copy → Add to Reading List → Add Bookmark → Add to Favorites → **Add to Home Screen** → Find on Page. The real iOS share sheet (IMG_0519) is a completely different multi-section layout:

1. **Header section:** App icon (rounded rect) + page title + domain + ✕ close
2. **Share targets row:** Horizontal scrollable circles — AirDrop, Messages, Mail, Outlook
3. **Action buttons row:** Horizontal circles — Copy, Add to Reading List, Add to Bookmarks, View Less
4. **Grouped list section 1:** Create a QR Code, Find in Page, Request Desktop Site, Print
5. **Grouped list section 2:** **Add to Home Screen**, Add to Quick Note, NordPass, etc.

Add to Home Screen is buried in the FIFTH visual section. This is why Dorothy can't find it — the flat list mockup suggests it's immediately visible, but in reality she needs to scroll past two rows of icons and a full list section.

**Fix — `src/install-guide.js`, Safari Step 2 visual function:**

Complete rewrite of the share sheet visual. The new mockup must show the multi-section structure. Inside the 220×400 phone frame, the share sheet rises from the bottom. We can't fit every item, but we must show the structural sections so users recognize the real UI:

```
AFTER:
  <div class="ig-phone">
    <div class="ig-phone-screen">
      <div class="ig-share-sheet">
        <div class="ig-sheet-ios">
          <!-- Header -->
          <div class="ig-sheet-hdr">
            <div class="ig-sheet-app-icon">✚</div>
            <div class="ig-sheet-hdr-text">
              <div class="ig-sheet-hdr-title">Catholic Services Directory</div>
              <div class="ig-sheet-hdr-domain">massfinder.vercel.app</div>
            </div>
          </div>
          <!-- Share targets row -->
          <div class="ig-sheet-targets">
            <div class="ig-sheet-target dim"><div class="ig-target-circle"></div><span>AirDrop</span></div>
            <div class="ig-sheet-target dim"><div class="ig-target-circle"></div><span>Messages</span></div>
            <div class="ig-sheet-target dim"><div class="ig-target-circle"></div><span>Mail</span></div>
          </div>
          <!-- Action circles row -->
          <div class="ig-sheet-actions">
            <div class="ig-sheet-action dim"><div class="ig-action-circle"></div><span>Copy</span></div>
            <div class="ig-sheet-action dim"><div class="ig-action-circle"></div><span>Add to<br>Bookmarks</span></div>
            <div class="ig-sheet-action dim"><div class="ig-action-circle"></div><span>View<br>More</span></div>
          </div>
          <!-- Grouped list with ATHS -->
          <div class="ig-sheet-group">
            <div class="ig-sheet-row dim">Find in Page</div>
            <div class="ig-sheet-row dim">Print</div>
          </div>
          <div class="ig-sheet-group">
            <div class="ig-sheet-row highlight">{ATHS_ICON} Add to Home Screen</div>
          </div>
        </div>
      </div>
    </div>
    <div class="ig-tap-ring"></div>
  </div>
```

**New CSS classes (`css/app.css`):**
```css
/* iOS share sheet — multi-section layout matching real iOS */
.ig-sheet-ios { background:#f2f2f7;border-radius:12px 12px 0 0;overflow:hidden; }
.ig-sheet-hdr { display:flex;align-items:center;gap:8px;padding:12px 12px 8px; }
.ig-sheet-app-icon { width:32px;height:32px;background:var(--color-primary);color:var(--color-accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0; }
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

**Caption update:** Change from "Scroll down and tap **Add to Home Screen**" to "Scroll down past the icons and tap **Add to Home Screen**"

**Dark mode notes:**
- `.ig-sheet-ios` background → `#1c1c1e`
- `.ig-sheet-group` background → `#2c2c2e`
- `.ig-target-circle`, `.ig-action-circle` → `#3a3a3c`
- Text colors: title `#fff`, domain `#8e8e93`, row text `#ddd`
- Header border → `#38383a`

**Test checklist:**
- [ ] Share sheet shows header with app icon + title + domain
- [ ] Share targets row visible with 3 dimmed circles
- [ ] Action buttons row visible with 3 dimmed circles
- [ ] Grouped list sections render with rounded corners
- [ ] "Add to Home Screen" row is highlighted and visible
- [ ] Tap ring centers on the ATHS row
- [ ] Overall structure recognizably matches real iOS share sheet

---

## IGM-03 — Chrome Bottom Bar Layout

**Problem:** The Chrome mockup toolbar shows: `‹ › + [tabs] [⋯]` with a separate URL pill above — identical to the Safari layout. Real Chrome iOS (IMG_0520) has a completely different single-row bottom bar:

`[← circle] [💬 icon] massfinder.vercel.app [↻] [⋯ circle]`

- Back button is a filled circle with ← arrow
- URL is inline (not a separate pill row)
- No forward, no +, no tabs icon visible
- Three dots ⋯ is at the far right in a circle

**Fix — `src/install-guide.js`, Chrome Step 1 visual function:**

Replace the `ig-chrome-bottom` block:

```
BEFORE:
  <div class="ig-chrome-bottom">
    <div class="ig-chrome-pill">massfinder.com</div>
    <div class="ig-chrome-toolbar">
      <span class="ig-tb-btn dim">‹</span>
      <span class="ig-tb-btn dim">›</span>
      <span class="ig-tb-btn dim">+</span>
      <span class="ig-tb-btn dim">{TABS_ICON}</span>
      <span class="ig-tb-btn highlight">⋯</span>
    </div>
  </div>

AFTER:
  <div class="ig-chrome-bottom">
    <div class="ig-chrome-bar">
      <span class="ig-chrome-circle dim">‹</span>
      <span class="ig-chrome-url">massfinder.vercel.app</span>
      <span class="ig-chrome-circle highlight">⋯</span>
    </div>
  </div>
```

**New CSS:**
```css
.ig-chrome-bar { display:flex;align-items:center;gap:6px;padding:4px 6px; }
.ig-chrome-circle { width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#666;background:#e0e0e0;border-radius:50%;flex-shrink:0; }
.ig-chrome-circle.highlight { background:rgba(0,122,255,0.15);color:#007AFF; }
.ig-chrome-circle.dim { opacity:0.5; }
.ig-chrome-url { flex:1;background:#e8e8ed;border-radius:16px;padding:6px 10px;font-size:10px;color:#666;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
```

**Caption update:** Change from "Tap the **⋯** menu at the bottom right of Chrome" to "Tap the **⋯** button at the bottom right"

**Dark mode:** `.ig-chrome-circle` bg → `#3a3a3c`, `.ig-chrome-url` bg → `#2c2c2e`, text → `#aaa`

**Test checklist:**
- [ ] Chrome bar shows: [← circle] [URL pill] [⋯ circle]
- [ ] ⋯ circle has highlight treatment
- [ ] Tap ring centers on ⋯
- [ ] Layout visually matches IMG_0520

---

## IGM-04 — Chrome ⋯ Menu Content (Wrong Items)

**Problem:** The Chrome Step 2 mockup shows: New Tab → Bookmarks → Reading List → **Add to Home Screen** → Settings. The real Chrome ⋯ menu (IMG_0521) shows:

- Share (with share icon)
- Add to Bookmarks
- Add Bookmark to...
- *(separator)*
- New Tab
- New Private Tab
- *(bottom bar)* Bookmarks | All Tabs

**"Add to Home Screen" does not exist in Chrome's ⋯ menu.** The user must tap **Share** first to open the iOS system share sheet, then find ATHS there. This is the single most critical fidelity failure — the guide tells users to find something that doesn't exist.

**Fix:** This step becomes "Tap **Share**" — see IGM-05 for the full step restructuring.

---

## IGM-05 — Chrome Needs 4 Steps (Currently 3)

**Problem:** The current Chrome flow is:
1. Tap ⋯ → 2. Tap "Add to Home Screen" in menu → 3. Tap "Add" to confirm

The real flow (from screenshots) is:
1. Tap ⋯ at bottom right
2. Tap **Share** from the popup menu
3. In the iOS system share sheet, scroll down and tap **Add to Home Screen**
4. Tap **Add** to confirm

The Chrome flow needs **4 steps**, not 3. Step 2 is the Chrome menu (showing Share highlighted), Step 3 is the iOS system share sheet (same structure as Safari's share sheet), Step 4 is the Add confirmation.

**Fix — `src/install-guide.js`, complete replacement of `IOS_CHROME_STEPS` array:**

```javascript
var IOS_CHROME_STEPS = [
  {
    // Step 1: Tap ⋯ in Chrome toolbar
    caption: 'Tap the <strong>⋯</strong> button at the bottom right',
    visual: function() {
      // Phone with Chrome bottom bar, ⋯ highlighted
      // (Same as current Step 1 but with new ig-chrome-bar layout from IGM-03)
    }
  },
  {
    // Step 2: Tap "Share" in the Chrome menu
    caption: 'Tap <strong>Share</strong> at the top of the menu',
    visual: function() {
      // Phone showing Chrome popup menu:
      // [Share icon] Share          ← highlighted
      // [bookmark]  Add to Bookmarks
      // [book]      Add Bookmark to...
      // ─────────────────
      // [+]         New Tab
      // [hand]      New Private Tab
      // ─────────── bottom bar ────
      // Bookmarks    All Tabs
    }
  },
  {
    // Step 3: iOS share sheet with Add to Home Screen
    caption: 'Scroll down and tap <strong>Add to Home Screen</strong>',
    visual: function() {
      // REUSE the same iOS share sheet layout from IGM-02
      // (Safari Step 2), but the header shows "Catholic Services Directory"
    }
  },
  {
    // Step 4: Tap Add to confirm
    caption: 'Tap <strong>Add</strong> in the top right to finish',
    visual: IOS_SAFARI_STEPS[2].visual
    // Reuse Safari's confirmation step (unchanged)
  }
];
```

**New Chrome menu visual for Step 2:**

The Chrome ⋯ menu (IMG_0521) appears as a dark floating popover anchored at the bottom. Structure:

```html
<div class="ig-chrome-menu">
  <div class="ig-chrome-menu-item highlight">{SHARE_ICON} Share</div>
  <div class="ig-chrome-menu-item dim">{BOOKMARK_ICON} Add to Bookmarks</div>
  <div class="ig-chrome-menu-item dim">{BOOK_ICON} Add Bookmark to…</div>
  <div class="ig-chrome-menu-sep"></div>
  <div class="ig-chrome-menu-item dim">+ New Tab</div>
  <div class="ig-chrome-menu-item dim">🫣 New Private Tab</div>
  <div class="ig-chrome-menu-footer">
    <span class="ig-chrome-footer-btn dim">Bookmarks</span>
    <span class="ig-chrome-footer-btn dim">All Tabs</span>
  </div>
</div>
```

**New CSS:**
```css
.ig-chrome-menu { position:absolute;bottom:48px;left:12px;right:12px;background:#2c2c2e;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:2; }
.ig-chrome-menu-item { display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#fff;border-bottom:1px solid #3a3a3c; }
.ig-chrome-menu-item.dim { opacity:0.4; }
.ig-chrome-menu-item.highlight { opacity:1;background:rgba(0,122,255,0.15);color:#64ACFF; }
.ig-chrome-menu-sep { height:6px;background:#1c1c1e; }
.ig-chrome-menu-footer { display:flex;border-top:1px solid #3a3a3c; }
.ig-chrome-footer-btn { flex:1;text-align:center;padding:10px 0;font-size:11px;font-weight:600;color:#fff; }
.ig-chrome-footer-btn + .ig-chrome-footer-btn { border-left:1px solid #3a3a3c; }
```

Note: The Chrome menu appears dark/translucent regardless of system theme (see IMG_0521). No light mode variant needed for the menu itself.

**Step 3 share sheet:** Reuse the rebuilt iOS share sheet from IGM-02. This is the same iOS system share sheet — when Chrome calls "Share," iOS presents its standard sheet. The only difference: the Chrome-invoked sheet shows slightly different quick-action circles (Add to Bookmarks, Add to Reading List, Add Bookmark to…, View More — see IMG_0522).

**Test checklist:**
- [ ] Chrome flow now has 4 steps (dot indicators show 4 dots)
- [ ] Step 1: Chrome bar with ⋯ highlighted
- [ ] Step 2: Dark floating menu with "Share" highlighted at top
- [ ] Step 3: iOS share sheet (multi-section) with ATHS highlighted
- [ ] Step 4: Add confirmation dialog
- [ ] Back/Next navigation works across all 4 steps
- [ ] Tap ring positions correctly on each step's highlight element

---

## IGM-06 — Caption Text Updates

**Problem:** Several caption strings don't match the real UI or are imprecise.

**Fix — `src/install-guide.js` caption strings:**

| Step | Current | New |
|------|---------|-----|
| Safari 1 | "Tap the **Share** button at the bottom of Safari" | "Tap the **Share** ↑ button next to the address bar" |
| Safari 2 | "Scroll down and tap **Add to Home Screen**" | "Scroll down past the icons and tap **Add to Home Screen**" |
| Chrome 1 | "Tap the **⋯** menu at the bottom right of Chrome" | "Tap the **⋯** button at the bottom right" |
| Chrome 2 | "Tap **Add to Home Screen**" | "Tap **Share** at the top of the menu" |
| Chrome 3 (new) | *(n/a — new step)* | "Scroll down and tap **Add to Home Screen**" |
| Chrome 4 | *(was step 3)* | "Tap **Add** in the top right to finish" |

**Test checklist:**
- [ ] All captions match the visual being shown
- [ ] Bold terms match the actual UI labels users will see
- [ ] No reference to buttons that don't exist on that screen

---

## IGM-07 — Share Sheet Header Missing App Icon + Title

**Problem:** The current share sheet shows only `massfinder.com` as a centered text header. The real iOS share sheet (IMG_0519, IMG_0523) prominently displays the MassFinder app icon (gold cross on navy), the page title ("Catholic Services Directory" or "MassFinder — Catholic Services D…"), and the domain — with a close button at top right.

This header is important for recognition — it confirms to the user they're sharing the right thing.

**Fix:** Included in IGM-02's rebuilt share sheet layout (the `.ig-sheet-hdr` section). The app icon should use the actual MassFinder icon colors: `background: var(--color-primary)` with the gold cross symbol.

---

## Cascading Impacts

1. **Step count change:** Chrome going from 3→4 steps means the dots indicator, step label ("Step N of M"), and navigation all adjust automatically (they're data-driven from the array length). No additional code needed.

2. **Shared confirmation step:** Safari Step 3 and Chrome Step 4 both reuse the same "Tap Add" confirmation visual. Currently Chrome Step 3 references `IOS_SAFARI_STEPS[2]` — this index remains valid since Safari is still 3 steps.

3. **Phone frame height:** The multi-section share sheet requires more vertical space than the current flat list. The phone frame is 400px tall. The share sheet should use `overflow:hidden` to clip naturally — showing the top sections and the ATHS row is sufficient. The user doesn't need to see every item; they need to recognize the structure.

4. **CSS class namespace:** New classes all use the `ig-` prefix. No conflicts with existing styles. All new classes should be added in the install-guide section of `css/app.css` (after line 530).

5. **Dark mode:** The iOS share sheet itself is dark-mode-aware (it follows system theme). The phone frame is already dark (`#1a1a1a`). For the share sheet internals, add dark mode overrides using `.dark .ig-sheet-ios` etc., matching the real dark-mode share sheet colors (IMG_0519 shows the dark variant).

6. **`_positionRings` function:** Still works — it finds `.highlight` inside `.ig-phone` and positions the `.ig-tap-ring`. No changes needed as long as each step has exactly one `.highlight` element.

---

## Implementation Order

1. **IGM-02** first (Safari share sheet rebuild) — largest change, establishes the reusable share sheet pattern
2. **IGM-01** (Safari toolbar) — quick fix to Step 1
3. **IGM-03** (Chrome toolbar) — quick fix, parallel to IGM-01
4. **IGM-04 + IGM-05** together (Chrome menu + 4-step flow) — depends on IGM-02 for the shared share sheet
5. **IGM-06** (captions) — do alongside each visual change
6. **IGM-07** — already included in IGM-02

---

## What NOT To Change

- **Android steps:** Not evaluated in this pass (no Android screenshots provided). Leave as-is.
- **Step 3 "Add" confirmation (Safari):** The current mockup is a reasonable approximation. Leave as-is.
- **Desktop picker:** Leave as-is.
- **Overlay/container/navigation UI:** Working correctly. Leave as-is.
- **Tap ring animation:** Working correctly. Leave as-is.
