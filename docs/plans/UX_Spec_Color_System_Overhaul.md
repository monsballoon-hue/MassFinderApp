# UX Spec: Color System Overhaul (Final)

**Prefix:** CSO (Color System Overhaul)
**Created:** 2026-03-14
**Status:** Ready for implementation
**Branch:** `ui-patches`
**Basis:** `COLOR_SYSTEM_ASSESSMENT_v2_FINAL.md`
**Estimated effort:** 2-3 hours
**Files modified:** `css/app.css` only — no JS changes

---

## Summary

This is the one-and-done CSS color overhaul. It reduces the seasonal accent from 60 touchpoints to ~16, introduces a fixed temporal-urgency channel (warm amber for "soon/today"), a fixed notice channel (warm tone for fasting/HDO banners), makes seasonal atmosphere ultra-subtle, and neutralizes accent-colored body text. After this, the color system is set in stone and runs with the rhythms of the liturgical year without further intervention.

---

## CSO-01 — New token definitions

Add `--color-soon`, `--color-soon-text`, `--color-soon-pale`, `--color-notice`, and `--color-notice-pale` to both `:root` and dark mode.

**Light mode (add after `--color-cat-volunteering-pale` line ~60):**
```css
/* ── Temporal urgency — fixed warm amber, never shifts ── */
--color-soon: #C8850D;
--color-soon-text: #8B5E06;
--color-soon-pale: #FEF6E7;
/* ── Notice banners — fixed warm tone for fasting/HDO ── */
--color-notice: #A16B2A;
--color-notice-pale: #FDF5E6;
```

**Dark mode (add after `--color-cat-volunteering-pale` line ~123):**
```css
--color-soon: #E5A33D;
--color-soon-text: #E5A33D;
--color-soon-pale: #2A1F0A;
--color-notice: #D4A84B;
--color-notice-pale: #2A2010;
```

---

## CSO-02 — Temporal urgency migration (27 rules)

Every "starting soon," "imminent," "today," and "happening now" element moves from the seasonal accent to the fixed `--color-soon` family.

### Find tab cards

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 513 | `.card-soon-badge` | color | `var(--color-accent-text)` | `var(--color-soon-text)` |
| 513 | `.card-soon-badge` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 514 | `.card-soon-badge .pulse-dot` | background | `var(--color-accent)` | `var(--color-soon)` |
| 521 | `.parish-card--soon` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 521 | `.parish-card--soon` | background gradient start | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 523 | `.parish-card--imminent` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 524 | `.card-imminent-badge` | color | `var(--color-accent-text)` | `var(--color-soon-text)` |
| 524 | `.card-imminent-badge` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 533 | `dark .parish-card--soon` | gradient color-mix | `var(--color-accent) 6%` | `var(--color-soon) 6%` |

### Detail panel

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 614 | `.detail-next-badge.soon` | color | `var(--color-accent-text)` | `var(--color-soon-text)` |
| 616 | `.detail-next--soon` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 616 | `.detail-next--soon` | border color-mix | `var(--color-accent) 12%` | `var(--color-soon) 12%` |
| 625 | `.detail-coming-up` | gradient start | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 625 | `.detail-coming-up` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 639 | `.detail-coming-row--soon` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 641 | `dark .detail-coming-up` | gradient color-mix | `var(--color-accent) 6%` | `var(--color-soon) 6%` |

### Schedule

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 908 | `.schedule-day--today` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |
| 918 | `dark .schedule-day--today` | background color-mix | `var(--color-accent) 6%` | `var(--color-soon) 6%` |
| 1301 | `.sched-soon` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 1303 | `.sched-soon-badge` | color | `var(--color-accent-text)` | `var(--color-soon-text)` |
| 1303 | `.sched-soon-badge` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |

### Saved tab

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 1359 | `.saved-evt-today` | border-left color | `var(--color-accent)` | `var(--color-soon)` |
| 1359 | `.saved-evt-today` | background color-mix | `var(--color-accent) 4%` | `var(--color-soon) 4%` |
| 1360 | `dark .saved-evt-today` | background color-mix | `var(--color-accent) 6%` | `var(--color-soon) 6%` |
| 1368 | `.saved-evt-today-badge` | color | `var(--color-accent)` | `var(--color-soon-text)` |

### Liturgical "soon" badge

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 1587 | `.litu-soon` | color | `var(--color-accent-text)` | `var(--color-soon-text)` |
| 1587 | `.litu-soon` | background | `var(--color-accent-pale)` | `var(--color-soon-pale)` |

---

## CSO-03 — Notice banner migration (10 rules)

Fasting and HDO banners move from seasonal accent to fixed `--color-notice` family.

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 1749 | `.hdo-banner` | background | `var(--color-accent-pale)` | `var(--color-notice-pale)` |
| 1749 | `.hdo-banner` | border | `var(--color-accent-light)` | `var(--color-notice)` |
| 1750 | `.hdo-banner-label` | color | `var(--color-accent-text)` | `var(--color-notice)` |
| 1752 | `.hdo-banner-cta` | color | `var(--color-accent-text)` | `var(--color-notice)` |
| 1755 | `.fasting-banner` | background | `var(--color-accent-pale)` | `var(--color-notice-pale)` |
| 1755 | `.fasting-banner` | border color-mix | `var(--color-accent) 25%` | `var(--color-notice) 25%` |
| 1756 | `.fasting-banner--full` | border color-mix | `var(--color-accent) 35%` | `var(--color-notice) 35%` |
| 1762 | `dark .fasting-banner` | background | `var(--color-accent-pale)` | `var(--color-notice-pale)` |
| 1762 | `dark .fasting-banner` | border color-mix | `var(--color-accent) 20%` | `var(--color-notice) 20%` |
| 1763 | `dark .fasting-banner--full` | border color-mix | `var(--color-accent) 30%` | `var(--color-notice) 30%` |

---

## CSO-04 — Daily card, return card, and text neutralization (8 rules)

These elements lose their seasonal tinting entirely — neutral surface colors and neutral text.

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 224 | `.daily-card` | background | `linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 100%)` | `var(--color-surface)` |
| 224 | `.daily-card` | (add) border-left | (none) | `3px solid var(--color-accent)` |
| 232 | `.daily-card-secondary` | color | `var(--color-accent-text)` | `var(--color-text-secondary)` |
| 238 | `dark .daily-card-secondary` | color | `var(--color-accent-light)` | `var(--color-text-secondary)` |
| 298 | `.return-card` | background | `var(--color-accent-pale)` | `var(--color-surface-hover)` |
| 299 | `.return-text` | color | `var(--color-accent-text)` | `var(--color-text-secondary)` |
| 300 | `.return-dismiss` | color | `var(--color-accent-text)` | `var(--color-text-tertiary)` |
| 508 | `.card-evt-row` | color | `var(--color-accent-text)` | `var(--color-text-secondary)` |
| 816 | `.ce-item-when .ce-countdown` | color | `var(--color-accent-text)` | `var(--color-text-secondary)` |

---

## CSO-05 — Accent-pale subtlety (season overrides, 3 rules)

Make `--color-accent-pale` ultra-subtle so remaining seasonal surfaces (liturgical icons, seasonal guide cards) use barely-perceptible tints.

| Line | Season | Current `accent-pale` | New `accent-pale` |
|------|--------|----------------------|-------------------|
| 1721 | Lent | `#F3E8FF` | `#F7F5FA` |
| 1722 | Advent | `#F3E8FF` | `#F7F5FA` |
| 1723 | Easter | `#FEF3C7` | `#FBF9F3` |
| 1724 | Christmas | `#FEF3C7` | `#FBF9F3` |
| 1725 | Ordinary | `#DCFCE7` | `#F5F8F5` |

---

## CSO-06 — Body gradient subtlety (4 light + 2 dark rules)

### Light mode body gradients

| Line | Season | Current end color | New end color |
|------|--------|------------------|---------------|
| 1728 | Lent | `#F0ECF5` | `#F5F3F7` |
| 1729 | Advent | `#F0ECF5` | `#F5F3F7` |
| 1730 | Easter | `#F9F6ED` | `#F8F7F2` |
| 1731 | Christmas | `#F9F6ED` | `#F8F7F2` |

### Dark mode body gradients

| Line | Season | Current end color | New end color |
|------|--------|------------------|---------------|
| 158 | Lent/Advent | `#1E1A28` | `#1C1A22` |
| 165 | Easter/Christmas | `#1E1C18` | `#1C1B1A` |

---

## CSO-07 — Prayer overlay subtlety (15 rules)

Reader overlay, reader body, and CCC sheet seasonal backgrounds get dialed back to approximately half their current tint intensity.

### Reader overlay (lines 1797-1801)

| Season | Current end | New end |
|--------|------------|---------|
| Lent/Advent | `#EDE8F2` | `#F2EFF5` |
| Easter/Christmas | `#F2EDDF` | `#F4F1EA` |
| Ordinary | `#ECF0EA` | `#F0F2EE` |

Same start colors stay, only the gradient end (stronger tint) gets pulled back.

### Reader body (lines 1822-1824) — same values as overlay

### CCC sheet (lines 2552-2556) — same values as overlay

---

## CSO-08 — Verification counts

After all changes, run:

```bash
# Temporal urgency on new tokens
grep -c 'var(--color-soon)' css/app.css        # Target: ~15-18
grep -c 'var(--color-soon-text)' css/app.css   # Target: ~10-12
grep -c 'var(--color-soon-pale)' css/app.css   # Target: ~12-15
grep -c 'var(--color-notice)' css/app.css      # Target: ~8-10
grep -c 'var(--color-notice-pale)' css/app.css # Target: ~5-6

# Remaining accent (should be ONLY seasonal elements)
grep 'var(--color-accent)' css/app.css | grep -v 'accent-text\|accent-pale\|accent-light\|accent-bg' | grep -v '^\s*--' | wc -l
# Target: ~14-16 (header line, season label, liturgical events, seasonal devot, tab badges, pull indicator, etc.)

grep 'var(--color-accent-text)' css/app.css | grep -v '^\s*--' | wc -l
# Target: ~3-4 (saved-evt-cat--liturgical, ce-item-icon--liturgical svg, dark lent/advent override)

grep 'var(--color-accent-pale)' css/app.css | grep -v '^\s*--' | wc -l
# Target: ~6-8 (liturgical event icons, seasonal devot-card, vigil badge dark remnant if any)
```

---

## Do NOT change

- Saint card `[data-lit-color]` rules
- `.devot-card--seasonal` and its dark variant (correctly seasonal)
- Schedule season badges (`.schedule-season-badge--lent` etc.)
- Any rule already using `var(--color-sacred)`, `var(--color-svc-*)`, or `var(--color-cat-*)`
- Liturgical event elements (`.ce-item-accent.liturgical`, etc.)
- `.saved-header-season` (correctly seasonal)
- `.saved-evt-season-*` borders (correctly seasonal)
- Header accent line rules (correctly seasonal)
- Reader/CCC/prayer overlay dark mode rules (keep current dark values)
- Any `var(--color-primary)` or `var(--color-verified)` usage
