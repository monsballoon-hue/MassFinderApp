# SPEC-011 — Small Enhancements: Stations V/R Labels & Phone Link
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~45 minutes

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-011-A | IDEA-039 | Stations of the Cross: replace V/R label divs with inline styled text | open |
| SPEC-011-B | IDEA-056 | Event detail card: phone number as tappable call link | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/stations.js`, `src/render.js`, and `css/app.css` (tokens at lines 38–80) before beginning.

**Design principles:**
- `--font-prayer` (Georgia) for prayer text
- Dark mode parity
- SVG only (not applicable to these items)
- CommonJS — no arrow functions
- Touch targets ≥ 44×44pt

---

## SPEC-011-A — Stations: replace V/R label divs with inline styled text
**Origin:** IDEA-039 | **Status:** open

### Goal
The Versicle (V) / Response (R) label elements in Stations of the Cross are rendered as separate block-level divs, consuming enough vertical space to prevent a no-scroll experience on a single station. Replace them with inline styled text so each station fits in one viewport.

### Files affected
- `src/stations.js` — station content rendering
- `css/app.css` — V/R label selectors

### Before (description)
Current station rendering (approximate):
```html
<div class="station-label-v">V.</div>
<div class="station-text">We adore you, O Christ, and we bless you...</div>
<div class="station-label-r">R.</div>
<div class="station-text">Because by your holy cross...</div>
```
Each label div sits on its own line with default block spacing above and below, adding ~2–3 lines of wasted vertical space per exchange.

### After
Inline approach: V/R markers become colored `<span>` elements prepended to the text:
```html
<p class="station-versicle">
  <span class="station-vr-label">V.</span>
  We adore you, O Christ, and we bless you...
</p>
<p class="station-response">
  <span class="station-vr-label station-vr-label--response">R.</span>
  Because by your holy cross...
</p>
```

**CSS:**
```css
.station-versicle,
.station-response {
  font-family: var(--font-prayer);
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 0 var(--space-xs) 0;   /* tight margin between V and R */
  color: var(--color-text-primary);
}

.station-vr-label {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-accent);       /* season-aware — purple in Lent, etc. */
  margin-right: var(--space-xs);
  vertical-align: baseline;
}

.station-vr-label--response {
  color: var(--color-text-secondary);
}
```

The color distinction (accent for V, secondary for R) replaces the div-based visual separation — keeping the exchange readable without consuming extra lines.

### CSS / dark mode
`--color-accent` and `--color-text-secondary` resolve correctly in dark mode via tokens.

### Test checklist
- [ ] Each station renders V and R on a single paragraph line each (no standalone label divs)
- [ ] V label uses `--color-accent`, R label uses `--color-text-secondary`
- [ ] A typical station (opening prayer + V/R + closing) fits in one 667px viewport without scrolling
- [ ] Prayer text uses `--font-prayer` (Georgia)
- [ ] Dark mode: labels and prayer text all visible and correctly colored
- [ ] Removing V/R divs does not break any other station module logic (e.g., progress tracking)

### Claude Code notes
Read `src/stations.js` to understand how station content is built (likely object-driven with `text`, `versicle`, `response` fields). The change is in the render function that constructs the station HTML. Remove the old label-div CSS selectors after confirming they are not used elsewhere.

---

## SPEC-011-B — Event detail card: phone number as tappable call link
**Origin:** IDEA-056 | **Status:** open

### Goal
The contact phone number displayed in the event detail card is static text. Make it a tappable `tel:` link so users can call directly from the card.

### Files affected
- `src/render.js` — event detail card / parish detail rendering

### Before
```js
// approximate current state
var phone = parish.phone;
detailEl.innerHTML += '<span class="detail-phone">' + phone + '</span>';
```

### After
```js
function renderPhoneLink(phone) {
  if (!phone) return '';
  // Strip formatting to get dialable digits
  var dialable = phone.replace(/[^\d+]/g, '');
  // Only render as link if it looks like a valid number
  if (dialable.length < 7) {
    return '<span class="detail-phone">' + phone + '</span>';
  }
  return '<a href="tel:' + dialable + '" class="detail-phone detail-phone--link">' +
    phone + '</a>';
}
```

**CSS for the link:**
```css
.detail-phone--link {
  color: var(--color-accent);
  text-decoration: none;
  font-family: var(--font-body);
}

.detail-phone--link:active {
  opacity: 0.7;
}
```

### CSS / dark mode
`--color-accent` resolves correctly in dark mode.

### Test checklist
- [ ] Valid phone numbers render as tappable `tel:` links in the event detail card
- [ ] Tapping a phone link on mobile triggers the native dialer with the number pre-filled
- [ ] Phone number formatting is preserved in display text (e.g., "(413) 555-1234" not "4135551234")
- [ ] Invalid or missing phone (blank, too short): renders as plain text or is omitted — no broken link
- [ ] Dark mode: link color correct, no underline
- [ ] Desktop: clicking a tel: link behaves as expected (may open Facetime, Skype, or do nothing — acceptable)

### Claude Code notes
Read `src/render.js` to find where phone numbers are currently rendered. Look at both the parish detail panel and the event detail card — both may display phone numbers. Apply the `renderPhoneLink()` utility to all locations that render a phone number, not just one.
