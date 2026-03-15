# Claude Code Implementation Prompt — CFR1: Q31 Pastoral Note

**BACKLOG ref:** IDEA-081
**Source:** Catholic Fidelity Review 2026-03-15, item C1
**Prefix:** CFR1
**Priority:** High — pastoral safety concern

---

## Instructions

Implement a compassionate pastoral note that appears below Q31 ("Have I contemplated or attempted suicide?") in the examination of conscience when the question is checked. This is a pastoral safety concern — someone in crisis who encounters this question without framing may experience it as condemnation.

**Rules:**
- Use only CSS custom properties (tokens) from `:root` — never hardcode colors
- `--font-prayer` (Georgia) for the CCC quote, `--font-body` (Source Sans) for the support message
- Dark mode parity required
- CommonJS everywhere, no arrow functions
- No data persisted about Q31 interaction (privacy-first)
- No haptic feedback on this element
- No emoji or decorative icons

---

## CFR1-01 — Pastoral Note HTML (P1)

**File:** `src/examination.js`

**Where:** There are two checkbox change handlers — one in `_renderExamination()` (line ~331) and one in `_wireCheckboxes()` (line ~485). Both follow the same pattern. The note injection must work in both code paths.

**After** the `qEl.classList.add('checked')` line in each handler, add a Q31-specific check:

```js
// Pastoral note for Q31 (suicide) — CFR1-01
if (qid === 31 && !qEl.querySelector('.exam-pastoral-note')) {
  var note = document.createElement('div');
  note.className = 'exam-pastoral-note';
  note.innerHTML = '<p class="exam-pastoral-support">If you are struggling with thoughts of self-harm, please know that God loves you and that help is available. Call or text <a href="tel:988" class="exam-pastoral-link">988</a> (Suicide &amp; Crisis Lifeline) anytime.</p>'
    + '<p class="exam-pastoral-quote">\u201CWe should not despair of the eternal salvation of persons who have taken their own lives. By ways known to him alone, God can provide the opportunity for salutary repentance.\u201D<span class="exam-pastoral-cite"> — CCC \u00A72283</span></p>';
  qEl.after(note);
}
```

**On uncheck** (the `else` branch where `delete _checked[qid]`), remove the note if present:

```js
if (qid === 31) {
  var existingNote = qEl.parentElement && qEl.parentElement.querySelector('.exam-pastoral-note');
  if (existingNote) existingNote.remove();
}
```

**Key details:**
- Q31 is identified by `id: 31` in `data/examination.json` (currently at `commandments[4].questions[7]` — 5th Commandment). Use the `qid === 31` check, not position.
- The 988 number must be a tappable `tel:` link.
- The note appears directly after the `<label class="exam-q">` element for Q31, not inside it.
- If Q31 is already checked when the section renders (user returns to a section), the note should also render. Check the question rendering loop in `_renderSection()` (line ~93) and in `_renderCurrentSection()` (line ~445): after the `</label>` for Q31, inject the note HTML if `_checked[31]` exists.

---

## CFR1-02 — Pastoral Note CSS (P1)

**File:** `css/app.css`

Add styles near the existing `.exam-q` styles:

```css
/* CFR1: Pastoral note for Q31 */
.exam-pastoral-note {
  margin: var(--space-2) 0 var(--space-3) calc(28px + var(--space-3));
  padding: var(--space-3);
  border-left: 3px solid var(--color-accent);
  background: var(--color-accent-pale, color-mix(in srgb, var(--color-accent) 6%, transparent));
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.exam-pastoral-support {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 var(--space-2) 0;
}

.exam-pastoral-link {
  color: var(--color-accent);
  font-weight: var(--weight-semibold);
  text-decoration: underline;
}

.exam-pastoral-quote {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.exam-pastoral-cite {
  font-style: normal;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
```

**Dark mode override** (inside `html[data-theme="dark"]` block):

```css
html[data-theme="dark"] .exam-pastoral-note {
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}
```

**Note on left margin:** `calc(28px + var(--space-3))` aligns the note with the question text, indented past the checkbox. Verify this matches the actual `.exam-checkmark` width + gap. Adjust if needed.

---

## CFR1-03 — Static Note in Section Render (P1)

**File:** `src/examination.js`

**Where:** In `_renderSection()` (line ~93) inside the `section.questions.forEach` loop, after the closing `</label>`:

```js
html += '</div></label>';
// CFR1-03: Pastoral note for Q31 (renders if already checked)
if (q.id === 31 && _checked[31]) {
  html += '<div class="exam-pastoral-note">'
    + '<p class="exam-pastoral-support">If you are struggling with thoughts of self-harm, please know that God loves you and that help is available. Call or text <a href="tel:988" class="exam-pastoral-link">988</a> (Suicide &amp; Crisis Lifeline) anytime.</p>'
    + '<p class="exam-pastoral-quote">\u201CWe should not despair of the eternal salvation of persons who have taken their own lives. By ways known to him alone, God can provide the opportunity for salutary repentance.\u201D<span class="exam-pastoral-cite"> — CCC \u00A72283</span></p>'
    + '</div>';
}
```

**Also apply** the same pattern in `_renderCurrentSection()` (line ~445) where questions are rendered in the section-by-section flow. Same logic: after the `</label>` close, check `if (q.id === 31 && _checked[31])` and inject the note.

**DRY option:** Extract the note HTML into a module-level function `_pastoralNoteHTML()` and call it from all three locations (two renders + the change handler).

---

## Test Checklist

- [ ] Q31 unchecked: no pastoral note visible
- [ ] Q31 checked: pastoral note appears directly below the question
- [ ] Q31 unchecked again: pastoral note disappears
- [ ] 988 is a tappable `tel:` link on mobile
- [ ] Note renders correctly in light mode
- [ ] Note renders correctly in dark mode
- [ ] CCC quote uses Georgia (`--font-prayer`)
- [ ] Support text uses Source Sans (`--font-body`)
- [ ] Left border uses seasonal accent color
- [ ] Return to 5th Commandment section with Q31 already checked: note is present
- [ ] Note does not affect numbering or layout of other questions
- [ ] No haptic feedback when note appears
- [ ] No data persisted (no localStorage, no sessionStorage for Q31 state)
- [ ] Other examination questions are unaffected
- [ ] Note aligns with question text (indented past checkbox)
