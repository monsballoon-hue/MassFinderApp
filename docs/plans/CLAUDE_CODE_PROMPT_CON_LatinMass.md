# Claude Code Prompt — Latin Mass Guide (CON-30)

**Spec:** `docs/plans/Content_Spec_LatinMass.md`  
**Items:** 1 (CON-30)  
**Prereq:** Catholic Review approval of Content_Spec_LatinMass.md  
**Branch:** `main` (content-only addition, no structural risk)

---

## Pre-flight

1. Read `docs/plans/Content_Spec_LatinMass.md` in full.
2. Read `docs/TERMINOLOGY.md` for Catholic terminology rules.
3. Read `CLAUDE.md` for project conventions (CommonJS, no arrow functions, config.js canonical).

---

## Implementation

### CON-30 — `src/devotions.js` → `DEVOTIONAL_GUIDES` array → Devotions group children

**Location:** Find the Devotions `isGroup:true` entry. Inside its `children` array, locate the Gorzkie Żale entry (title: `'Gorzkie Żale'`). Insert the new entry **after** Gorzkie Żale and **before** Stations of the Cross.

**Insert this object:**

```js
{icon:'',title:'What to Expect at a Latin Mass',findLabel:'Latin Mass',filter:'latin',body:
'<p>The <strong>Traditional Latin Mass</strong> \u2014 also called the Extraordinary Form \u2014 is the form of the Mass celebrated in the Catholic Church for centuries before the liturgical reforms of the 1960s. The prayers are in Latin. The priest faces the altar, in the same direction as the people, a posture called <em>ad orientem</em>. The overall feel is quieter, more formal, and deeply reverent.</p>'
+'<p>If you\u2019re used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. There are no spoken responses from the congregation during most of the Mass. Much of the priest\u2019s prayer is said softly or silently. A choir or schola may sing in Latin or Gregorian chant. Communion is received kneeling, on the tongue. A hand missal \u2014 a booklet with the Latin text and English translation side by side \u2014 is your best companion. Most parishes that offer this Mass provide them in the pews.</p>'
+'<p>It\u2019s completely normal to feel a little lost. Many people do their first several times. You don\u2019t need to follow every word. You can pray along in the missal, pray the Rosary quietly, or simply be present. Let the beauty of the liturgy wash over you. No one is watching to see if you turn to the right page.</p>'
+'<details class="conf-exam">'
+'  <summary>Practical tips for your first time <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <ul>'
+'      <li><strong>Dress</strong> \u2014 Many regular attendees dress more formally \u2014 men in collared shirts, women in dresses or skirts, sometimes with a chapel veil. This isn\u2019t a rule. Come as you are.</li>'
+'      <li><strong>Missal</strong> \u2014 Look for a red booklet in the pew, often a <em>1962 Missal</em> or parish guide. Latin on one side, English on the other. Can\u2019t find one? Ask someone nearby. People are usually happy to help.</li>'
+'      <li><strong>Posture</strong> \u2014 Stand, kneel, and sit when others do. Communion is received kneeling at the altar rail, on the tongue. If you\u2019re not receiving, remain in your pew or approach with arms crossed over your chest.</li>'
+'      <li><strong>Length</strong> \u2014 A Low Mass (spoken, no singing) runs about 45 minutes to an hour. A High Mass or Solemn High Mass (sung, with incense) can run 75\u201390 minutes.</li>'
+'      <li><strong>If you get lost</strong> \u2014 Close the missal. Look up. Listen. The Mass is still the Mass \u2014 the same sacrifice, the same Real Presence, the same Lord. You belong here.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
},
```

### Structural notes

- Uses existing `filter: 'latin'` → maps to `['mass_latin','mass_traditional_latin']` in render.js
- Uses existing `conf-exam` / `conf-exam-body` CSS classes (same as all other guide expandables)
- "Extraordinary Form" and "ad orientem" are already in `TERM_DEFS` — `_wrapTerms()` will auto-link them
- No `searchTerm` needed since `filter` is provided (matches Gorzkie Żale pattern)
- No icon needed — child entries in Devotions group use empty icon string
- No CSS changes required
- No new dependencies

---

## Test checklist

- [ ] Guide appears in More → Devotions group, between Gorzkie Żale and Stations of the Cross
- [ ] Expandable "Practical tips" section opens/closes with chevron animation
- [ ] "Find Latin Mass near me →" link appears at bottom of body
- [ ] Clicking "Find Latin Mass near me →" switches to Find tab with Latin filter active
- [ ] "Extraordinary Form" text is tappable with popover definition
- [ ] "ad orientem" text is tappable with popover definition
- [ ] Dark mode: all text, expandable, and popover render correctly
- [ ] Text readable at default and large accessibility font sizes
- [ ] `npm run build` succeeds with no errors

---

## After Implementation

1. Run `npm run build`
2. Visual spot-check: More tab → Devotions → open the new guide → test expandable, test "Find" link, test term popovers
3. Mark CON-30 done in `docs/reference/COMPLETED_SPECS.md`
4. Commit: `git commit -m "content: add Latin Mass guide (CON-30)"`
