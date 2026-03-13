# SPEC-010 — "Pray for Me" Anonymous Intentions Counter
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Opus (backend decision) → Claude Code / Sonnet (implementation)
**Estimated total effort:** ~2 hours (after research gate cleared)

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-010-R | IDEA-019 | Research gate: backend selection | open |
| SPEC-010-A | IDEA-006 | Pray for Me counter — frontend + backend integration | blocked (on SPEC-010-R) |

---

## ⛔ BLOCKED — Research gate must be resolved before any code is written

---

## SPEC-010-R — Research gate: backend selection
**Origin:** IDEA-019 | **Status:** open

### Question to answer (Claude Opus task)

Evaluate three backend options for a simple anonymous "Pray for Me" counter that increments when a user taps a button and displays a count like "142 people praying today."

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| Vercel KV | Redis-based KV store, already in the deploy stack | Already integrated with Vercel; minimal setup; low latency | Requires Vercel KV provisioning; costs at scale |
| Supabase counter table | Postgres row counter, separate service | Flexible; free tier; good dashboard | Adds a second external service to maintain |
| GA event | Fire a Google Analytics event on tap, no persistence | Zero backend setup | No real-time display; count not queryable for display; not truly anonymous |

**Key criteria:**
1. **Anonymity guarantee:** Can the backend be configured with no user identification whatsoever? No IP logging, no session tracking?
2. **Cost at scale:** What does this cost at 1,000 taps/day? 10,000/day?
3. **Operational simplicity:** Solo dev, limited evening hours — can this be set and forgotten?
4. **Daily reset:** Counter resets to 0 at midnight (or a rolling 24h window) — which backend makes this easiest?
5. **Rate limiting:** How to prevent a single user from inflating the count by tapping repeatedly? (Simple client-side debounce? Token bucket in KV?)

**Produce:** A recommended backend option with rationale and a brief implementation sketch (what the API endpoint looks like, how the daily reset works, how rate limiting is handled).

### Decision record (fill in after Opus research)
```
Backend selected: ___________
Rationale: ___________
Daily reset strategy: ___________
Rate limiting strategy: ___________
Anonymity approach: ___________
Estimated cost at 1K taps/day: ___________
API endpoint sketch: ___________
```

---

## SPEC-010-A — Pray for Me counter: frontend + backend integration
**Origin:** IDEA-006 | **Status:** blocked (on SPEC-010-R)

### Goal
A single-tap anonymous "Pray for Me" button increments a counter that displays as "N people praying today." No accounts, no text input, no moderation. Fully anonymous.

### Files affected (anticipated)
- `src/more.js` — card placement (or `src/saved.js` — TBD by SPEC-010-R)
- `css/app.css`
- Backend: TBD by SPEC-010-R (likely a Vercel serverless function at `api/intentions.js`)

### Frontend design

**Card:**
```
[Hands-in-prayer SVG icon]
142 people praying today        ← large number, --font-display
                                  "people praying today" in --font-body
[Pray for Me]                   ← full-width CTA button, --color-accent background
```

**Placement:** [TBD by SPEC-010-R decision — likely saint card area or a standalone card in More tab]

**Tap behavior:**
```js
function handlePrayForMeTap() {
  // Debounce: only allow once per session (or once per hour)
  if (sessionStorage.getItem('prayed-today')) return;
  sessionStorage.setItem('prayed-today', '1');

  // Fire haptic
  haptics.medium();

  // Optimistic UI update — increment displayed count immediately
  var currentCount = parseInt(countEl.textContent, 10) || 0;
  countEl.textContent = currentCount + 1;

  // Disable button
  btn.disabled = true;
  btn.textContent = '🙏 Praying with you'; // use text + SVG, not emoji — replace before impl.

  // Call backend
  fetch('/api/intentions', { method: 'POST' })
    .catch(function() {
      // Silently fail — optimistic update stands, don't alarm the user
    });
}
```

**Counter display on load:**
```js
function loadIntentionsCount() {
  fetch('/api/intentions')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      countEl.textContent = data.count;
    })
    .catch(function() {
      // Graceful degradation — hide the count if unavailable
      countEl.textContent = '';
    });
}
```

### Backend sketch (fill in after SPEC-010-R)
- `api/intentions.js` — Vercel serverless function
- GET: return `{ count: N }` for today's window
- POST: increment counter, apply rate limit, return `{ count: N }`
- Daily reset logic: [fill in from SPEC-010-R]
- Rate limiting: [fill in from SPEC-010-R]

### CSS / dark mode
```css
.intentions-card {
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.intentions-count {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.intentions-label {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.intentions-btn {
  width: 100%;
  min-height: 44px;
  background: var(--color-accent);
  color: #fff;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
}

.intentions-btn:disabled {
  background: var(--color-text-secondary);
  cursor: default;
}
```

### Test checklist (fill in after SPEC-010-R)
- [ ] Counter loads and displays the current day's count on More tab open
- [ ] Tapping "Pray for Me" increments the displayed count optimistically
- [ ] Button disabled after first tap within session — cannot inflate count
- [ ] Haptic fires on tap
- [ ] Counter unavailable (network error): card degrades gracefully — no error shown to user
- [ ] Anonymous: no user ID, no IP in logs (verify in backend logs)
- [ ] Dark mode: all card elements render correctly
- [ ] Daily reset: counter shows 0 (or a small number) at start of a new day

### Claude Code notes
Do not implement until SPEC-010-R is resolved. When backend is chosen, read the existing Vercel configuration (`vercel.json` if present) before creating any new serverless functions. Check if `src/haptics.js` exports a named function or a default — use the correct import pattern (CommonJS require). Never use emoji characters in the button — use an SVG icon consistent with the app's existing icon set.
