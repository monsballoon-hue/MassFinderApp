# MassFinder — Design Tokens & Visual System

**Source of truth:** `css/app.css` lines 37-170  
**Last synced from repo: 2026-03-13 (post-implementation)

> **Freshness rule:** At the start of each session, clone the repo and run `head -170 css/app.css` to verify these tokens are current. Update this file if any values have changed.

---

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | Playfair Display, Georgia, serif | Headings, titles, liturgical day names |
| `--font-body` | Source Sans 3, system stack, sans-serif | All UI text, labels, buttons |
| `--font-prayer` | Georgia, Playfair Display, serif | Sacred text, Scripture refs, prayers |

**Scale:** `--text-xs` 13px · `--text-sm` 15px · `--text-base` 17px · `--text-lg` 18px · `--text-xl` 20px · `--text-2xl` 24px · `--text-3xl` 28px

**Weights:** `--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 700

## Colors (Light)

**Core:** `--color-primary` #2C3E5A · `--color-accent` #B8963F (shifts with season) · `--color-accent-pale` #F5EDD8  
**Surfaces:** `--color-bg` #F8F7F4 · `--color-surface` #FFF · `--color-surface-hover` #F5F3EF  
**Text:** `--color-text-primary` #1A1E26 · `--color-text-secondary` #5C6370 · `--color-text-tertiary` #8B919C  
**Semantic:** `--color-verified` #4A7C59 · `--color-warning` #D97706 · `--color-error` #B91C1C · `--color-info` #3478C6 · `--color-fav` #E11D48

## Liturgical Season Accent Override (via `data-season` on `:root`)

| Season | `--color-accent` | `--color-accent-pale` |
|--------|-----------------|----------------------|
| Lent/Advent | #7C3AED (purple) | #F3E8FF |
| Easter/Christmas | #D97706 (gold) | #FEF3C7 |
| Ordinary | #16A34A (green) | #DCFCE7 |

**Rule:** Always use `var(--color-accent)` — never hardcode hex for seasonal elements.

## Spacing

`--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-5` 20px · `--space-6` 24px · `--space-8` 32px · `--space-12` 48px

## Radii & Shadows

`--radius-sm` 8px · `--radius-md` 12px · `--radius-lg` 16px · `--radius-full` 999px  
`--shadow-card` subtle · `--shadow-elevated` prominent · `--ease-out` cubic-bezier(0.25, 0.46, 0.45, 0.94)

## Z-Index Scale

90 top-header · 100 tab-bar · 500 map pill · 700 popovers · 1000 reader/prayer · 1001 detail panel · 1002 event panel · 1099-1100 filters · 2000 modals · 3000 toasts · 10000 install guide

## Key Design Rules

1. Touch targets ≥ 44×44pt on all interactive elements
2. Every visual element needs `html[data-theme="dark"]` override
3. SVG only — no emoji, no Unicode decorative icons
4. Sacred text always uses `--font-prayer` (Georgia)
5. Max content width: 540px reader body, 680px layout (`--max-width`)
6. Progressive disclosure — reveal depth on demand, don't overwhelm
