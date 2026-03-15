# Claude Code Prompt — CON-32 through CON-38: At a Glance Cards + TLM Restructure

**Content spec:** `docs/plans/Content_Spec_AtAGlance.md`
**UX spec:** `docs/plans/UX_Spec_AtAGlance_Card.md`
**UX code prompt:** `docs/plans/CLAUDE_CODE_PROMPT_AGC.md`
**Status:** Ready for implementation (Catholic Review + UX Design complete)

---

## What This Is

Five guides in DEVOTIONAL_GUIDES get a small "At a Glance" summary prepended to their `body` string. One guide (TLM) also gets its second paragraph split into two. No new modules. No new data properties. No render function changes.

**Dependency:** The AGC series (CLAUDE_CODE_PROMPT_AGC.md) must land BEFORE or WITH this spec. AGC-01 defines the `.devot-glance` CSS class; AGC-02 fixes the `p:first-child` → `p:first-of-type` selector. Without AGC-02, the reader overlay's first paragraph loses its enlarged styling.

---

## Implementation Steps

### Step 1: Implement AGC series first

Follow `docs/plans/CLAUDE_CODE_PROMPT_AGC.md` in full. This adds the `.devot-glance` CSS class and fixes the reader overlay selector. Verify before proceeding.

### Step 2: Prepend At a Glance HTML to five guide `body` strings

**File:** `src/devotions.js`

Each glance element uses this exact pattern:
```html
<div class="devot-glance"><strong>At a glance:</strong> [summary]</div>
```

The `<strong>At a glance:</strong>` label is required (UX spec Q4 — gives all three demographics a semantic anchor).

Because both `renderGuide()` and the reader-guide overlays read from `g.body`, the glance appears in both contexts automatically. No render function changes needed.

**CON-34 — Sunday Obligation** (DEVOTIONAL_GUIDES[0], title: "The Sunday Obligation"):
Prepend to start of `body`:
```
'<div class="devot-glance"><strong>At a glance:</strong> Catholics attend Mass every Sunday or Saturday evening (4 PM or later), and on Holy Days of Obligation. If you\u2019ve been away, you\u2019re welcome back anytime.</div>'
```

**CON-32 — Confession** (DEVOTIONAL_GUIDES[1], title: "How to go to Confession"):
Prepend to start of `body`:
```
'<div class="devot-glance"><strong>At a glance:</strong> Tell the priest your sins. Receive God\u2019s forgiveness. The priest will help you through it \u2014 even if it\u2019s been years.</div>'
```

**CON-33 — TLM** (Devotions group → child "What to Expect at a Latin Mass"):
Prepend to start of `body`:
```
'<div class="devot-glance"><strong>At a glance:</strong> The older form of the Mass \u2014 in Latin, quieter, deeply reverent. You don\u2019t need to know anything special to attend. Just show up.</div>'
```

**CON-35 — Divine Mercy Chaplet** (Devotions group → child "Divine Mercy Chaplet"):
Prepend to start of `body`:
```
'<div class="devot-glance"><strong>At a glance:</strong> A 10-minute prayer on Rosary beads asking for God\u2019s mercy. Given to St. Faustina in the 1930s. Simple to learn, deeply powerful.</div>'
```

**CON-36 — Stations of the Cross** (Devotions group → child "Stations of the Cross"):
Prepend to start of `body`:
```
'<div class="devot-glance"><strong>At a glance:</strong> Fourteen stations through Christ\u2019s Passion and death. Prayed especially on Fridays in Lent. About 20\u201330 minutes.</div>'
```

### Step 3: TLM paragraph restructure (CON-37)

**File:** `src/devotions.js`
**Location:** "What to Expect at a Latin Mass" → second `<p>` in `body` (after the glance div and the first `<p>`)

Replace the existing second `<p>`:
```
'<p>If you\u2019re used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. At a Low Mass (the most common weekday form), you may hear no spoken responses from the congregation \u2014 only the altar server responds to the priest. At a Dialogue Mass or Sung Mass, however, the congregation joins in the responses and may sing parts of the liturgy in Latin. Much of the priest\u2019s prayer is said softly or silently. A choir or schola may sing in Latin or Gregorian chant. Communion is received kneeling, on the tongue. A hand missal \u2014 a booklet with the Latin text and English translation side by side \u2014 is your best companion. Most parishes that offer this Mass provide them in the pews.</p>'
```

With these two `<p>` tags:
```
'<p>If you\u2019re used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. Much of the priest\u2019s prayer is said quietly. At a Low Mass, the congregation may not speak at all \u2014 only the altar server responds. At a Sung Mass, the congregation joins in, and a choir may sing in Latin or Gregorian chant.</p>'
+'<p>Communion is received kneeling at the altar rail, on the tongue. A hand missal \u2014 a booklet with Latin and English side by side \u2014 is your best companion. Most parishes that offer this Mass provide them in the pews.</p>'
```

---

## Test Checklist

### Glance cards — accordion view (More tab → Faith Guides)
- [ ] Open each of the 5 guides → glance card visible at top with left-border accent
- [ ] Glance card uses Source Sans (not Georgia) — compare against a blockquote in the same guide
- [ ] Glance card text is upright (not italic)
- [ ] `<strong>At a glance:</strong>` label renders bold
- [ ] Toggle dark mode → cards render correctly (subtle background, readable text)
- [ ] Guides WITHOUT glance cards (Lent, Easter, Advent, Christmas, Ordinary Time, Adoration, Novena, Miraculous Medal, Gorzkie Żale) are unchanged

### Glance cards — reader overlay
- [ ] Tap Confession filter hint → reader overlay shows glance card at top
- [ ] Tap Latin Mass filter hint → reader overlay shows glance card at top
- [ ] Tap Adoration filter hint → reader overlay does NOT show glance (no glance card on that guide)
- [ ] Reader overlay first `<p>` after glance card renders at `--text-base` (17px) with `--color-text-primary` (AGC-02 fix working)
- [ ] Toggle dark mode in reader overlay → same check

### TLM restructure
- [ ] "What to Expect at a Latin Mass" → second paragraph is now two shorter paragraphs
- [ ] Content matches spec (no "Dialogue Mass," no "schola," includes "at the altar rail")

### Build
- [ ] `npm run build` passes
