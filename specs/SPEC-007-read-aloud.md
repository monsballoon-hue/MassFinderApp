# SPEC-007 — Web Speech API Read-Aloud for Daily Readings
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~30–45 minutes

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-007-A | IDEA-003 | Web Speech API read-aloud button on daily reading cards | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/readings.js` and `css/app.css` (tokens at lines 38–80) before beginning. Daily readings are expanded cards in the More tab. Each card shows a reading title, passage reference, and the reading text.

**Design principles:**
- Accessibility win for low-vision users and people praying while driving
- SVG only — no emoji for icons
- `--font-body` for button labels
- Dark mode parity
- CommonJS — no arrow functions
- Local-first: Web Speech API requires no network, works from cached data
- Feature detection: gracefully degrade if `SpeechSynthesis` not available

---

## SPEC-007-A — Web Speech API read-aloud for daily readings
**Origin:** IDEA-003 | **Status:** open

### Goal
Add a play/pause "Listen" button to each expanded reading card in the More tab. Uses the Web Speech API (`SpeechSynthesisUtterance`) at a slightly slower rate (`rate: 0.9`) for comfortable listening. Speech cancels when the reading card is collapsed or when the user switches tabs.

### Files affected
- `src/readings.js`
- `css/app.css`

### Implementation

**Feature detection guard (add near top of readings.js):**
```js
var SPEECH_SUPPORTED = typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;
```

**State per reading card:**
```js
// track which reading is currently being spoken
var activeSpeechCardId = null;
```

**Render the Listen button (add to expanded card markup):**
```js
// Only render if speech is supported
if (SPEECH_SUPPORTED) {
  var listenBtn = document.createElement('button');
  listenBtn.className = 'reading-listen-btn';
  listenBtn.setAttribute('aria-label', 'Listen to this reading');
  listenBtn.dataset.readingId = reading.id;
  // SVG play icon (inline — see Claude Code notes for icon)
  listenBtn.innerHTML = '<svg ...><!-- play icon --></svg>' +
    '<span class="reading-listen-label">Listen</span>';
  cardElement.appendChild(listenBtn);
}
```

**Click handler:**
```js
function handleListenBtnClick(readingId, readingText) {
  // If this card is currently speaking, pause/stop it
  if (activeSpeechCardId === readingId) {
    window.speechSynthesis.cancel();
    activeSpeechCardId = null;
    updateListenBtnState(readingId, 'idle');
    return;
  }
  // Stop any other speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (activeSpeechCardId) {
      updateListenBtnState(activeSpeechCardId, 'idle');
    }
  }
  // Start speaking this reading
  var utterance = new SpeechSynthesisUtterance(readingText);
  utterance.rate = 0.9;
  utterance.lang = 'en-US';
  utterance.onend = function() {
    activeSpeechCardId = null;
    updateListenBtnState(readingId, 'idle');
  };
  utterance.onerror = function() {
    activeSpeechCardId = null;
    updateListenBtnState(readingId, 'idle');
  };
  window.speechSynthesis.speak(utterance);
  activeSpeechCardId = readingId;
  updateListenBtnState(readingId, 'playing');
}

function updateListenBtnState(readingId, state) {
  var btn = document.querySelector(
    '.reading-listen-btn[data-reading-id="' + readingId + '"]'
  );
  if (!btn) return;
  var label = btn.querySelector('.reading-listen-label');
  // swap icon and label
  if (state === 'playing') {
    btn.classList.add('reading-listen-btn--playing');
    if (label) label.textContent = 'Pause';
    btn.setAttribute('aria-label', 'Pause reading');
    // swap to pause SVG
  } else {
    btn.classList.remove('reading-listen-btn--playing');
    if (label) label.textContent = 'Listen';
    btn.setAttribute('aria-label', 'Listen to this reading');
    // swap to play SVG
  }
}
```

**Cancel on card collapse:**
```js
// In the card collapse/close handler:
function onReadingCardCollapse(readingId) {
  if (activeSpeechCardId === readingId) {
    window.speechSynthesis.cancel();
    activeSpeechCardId = null;
  }
}
```

**Cancel on tab switch:**
```js
// In the tab-switch event handler (src/ui.js or app.js):
// Add: if (SPEECH_SUPPORTED) window.speechSynthesis.cancel();
// Look for the existing tab switch handler and add this line.
```

### CSS
```css
.reading-listen-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  min-height: 36px;
  padding: var(--space-xs) var(--space-sm);
  margin-top: var(--space-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
}

.reading-listen-btn:active,
.reading-listen-btn:hover {
  background: var(--color-surface-alt);
  color: var(--color-text-primary);
}

.reading-listen-btn--playing {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.reading-listen-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Dark mode handled by tokens — no override needed */
```

### SVG icons
Use two small SVG icons inline in the button. Both should match the app's existing SVG style (stroked, not filled, if that is the pattern — read other SVG icons in the codebase first):

**Play icon (when idle):**
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
  <polygon points="3,2 14,8 3,14" fill="currentColor" stroke="none"/>
</svg>
```

**Pause icon (when playing):**
```svg
<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" stroke="none"/>
  <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" stroke="none"/>
</svg>
```
Adjust stroke/fill approach to match the app's existing icon conventions.

### Test checklist
- [ ] "Listen" button appears on expanded reading cards and not on collapsed ones
- [ ] Tapping "Listen" begins speech at rate 0.9; button changes to "Pause"
- [ ] Tapping "Pause" stops speech; button returns to "Listen"
- [ ] Collapsing the reading card while speaking: speech stops
- [ ] Switching tabs while speaking: speech stops
- [ ] Only one reading can be spoken at a time — starting a second stops the first
- [ ] Browser without SpeechSynthesis support: button does not render
- [ ] Dark mode: button border, icon, and label all render correctly

### Claude Code notes
Read `src/readings.js` to understand how reading cards are rendered and where expanded/collapsed state is toggled. The tab-switch cancel call belongs in whatever function currently handles tab switching — find it rather than guessing its location.

Web Speech API has a known iOS Safari bug where long utterances stop after ~15 seconds. If this becomes an issue in testing, a workaround is: split the text at sentence boundaries and chain `SpeechSynthesisUtterance` instances. Do not implement this preemptively — flag it in a code comment for future reference.
