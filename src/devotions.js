// src/devotions.js — Devotional guide content and rendering
var utils = require('./utils.js');
var esc = utils.esc;
var refs = require('./refs.js');

// PHF-01: Confession Guide reader module — accessible from any tab
var reader = require('./reader.js');
reader.registerModule('confession-guide', {
  getTitle: function() { return 'How to Go to Confession'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    var guide = DEVOTIONAL_GUIDES[1];
    if (!guide || guide.title !== 'How to go to Confession') {
      // Defensive: search by title if index changed
      for (var i = 0; i < DEVOTIONAL_GUIDES.length; i++) {
        if (DEVOTIONAL_GUIDES[i].title === 'How to go to Confession') { guide = DEVOTIONAL_GUIDES[i]; break; }
      }
      if (!guide) { bodyEl.innerHTML = '<p>Guide not found.</p>'; return; }
    }

    bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75">'
      + _wrapScriptureRefs(_wrapTerms(guide.body))
      + '<div style="margin-top:var(--space-5)">'
      + '<button onclick="readerClose();closeAllPanels();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=confession]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Confession near you</button>'
      + '</div></div>';

    _initTermClicks(bodyEl);
    refs.initRefTaps(bodyEl);
    var snippet = require('./snippet.js');
    bodyEl.querySelectorAll('.ccc-ref').forEach(function(el) {
      var numMatch = el.textContent.trim().match(/CCC\s*(\d+)/);
      if (!numMatch) return;
      el.classList.add('ref-tap', 'ref-tap--ccc');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        snippet.showSnippet('ccc', numMatch[1], el);
      });
    });
  },
  onClose: function() {}
});

// Wrap Scripture citations in devotional guide HTML with tappable ref spans.
// Applied after esc() so the text is already safe. Scripture refs contain no HTML chars.
function _wrapScriptureRefs(html) {
  // Matches full book names and common abbreviations with chapter:verse
  var pattern = /\b((?:1\s*|2\s*|3\s*)?(?:Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Revelation|Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Tobit|Judith|Esther|Maccabees|Job|Psalms?|Proverbs|Ecclesiastes|Song\s+of\s+Solomon|Song\s+of\s+Songs|Wisdom|Sirach|Isaiah|Jeremiah|Lamentations|Baruch|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matt|Mk|Lk|Jn|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Heb|Jas|Pet|Rev|Gen|Exod?|Lev|Num|Deut?|Isa|Jer|Ezek?|Dan|Ps)\s+\d+:\d+(?:\s*[-\u2013]\s*\d+)?)\b/g;

  return html.replace(pattern, function(ref) {
    var escaped = ref.replace(/'/g, '&#39;');
    return refs.renderRef('bible', ref);
  });
}

// ── UX-07: Theological Term Definitions (Popover API) ──
var TERM_DEFS = {
  'mortal sin': 'A grave violation of God\u2019s law that destroys charity in the heart. Requires grave matter, full knowledge, and deliberate consent (CCC 1857).',
  'grave sin': 'Another name for mortal sin \u2014 a serious offense against God that severs the soul\u2019s relationship with Him.',
  'venial sin': 'A lesser offense that weakens but does not destroy one\u2019s relationship with God (CCC 1862).',
  'absolution': 'The prayer by which a priest, in the Sacrament of Penance, forgives sins in the name of Christ and the Church (CCC 1449).',
  'contrition': 'Sincere sorrow of the soul for having offended God, with a firm resolve not to sin again (CCC 1451).',
  'Blessed Sacrament': 'The Eucharist, especially the consecrated host reserved in the tabernacle for adoration and worship.',
  'Eucharist': 'The sacrament in which bread and wine become the Body and Blood of Christ, the source and summit of Christian life (CCC 1324).',
  'consecrated': 'Made sacred; in Eucharistic context, the bread and wine transformed into the Body and Blood of Christ through the words of the priest.',
  'Host': 'The consecrated bread of the Eucharist, which Catholics believe is truly the Body of Christ.',
  'monstrance': 'An ornamental vessel in which the consecrated Host is displayed for Eucharistic Adoration.',
  'Perpetual Adoration': 'The practice of continuous, around-the-clock prayer before the exposed Blessed Sacrament, maintained by volunteers in shifts.',
  'intercession': 'Prayer offered to God on behalf of another person. Saints and the Blessed Virgin Mary intercede for the faithful.',
  'sacramental': 'A sacred sign (object, prayer, or blessing) instituted by the Church to prepare the faithful to receive grace (CCC 1667).',
  'Extraordinary Form': 'The Traditional Latin Mass, celebrated according to the 1962 Roman Missal, also called the \u201cUsus Antiquior.\u201d',
  'ad orientem': 'Latin for \u201ctoward the east\u201d \u2014 the priest faces the altar (same direction as the people), the traditional posture for offering the Mass.',
  'Passion': 'The suffering and death of Jesus Christ, from the agony in the garden through His crucifixion on Calvary.',
  'veneration': 'An act of reverent honor given to saints, relics, or sacred images \u2014 distinct from the worship (latria) due to God alone.',
  'Resurrection': 'Christ\u2019s rising from the dead on the third day, the central truth of the Christian faith (CCC 638).',
  'Sacrament of Reconciliation': 'The sacrament by which sins committed after Baptism are forgiven through confession to a priest and absolution. Also called Confession or Penance.',
  'Via Dolorosa': 'Latin for \u201cWay of Sorrows\u201d \u2014 the route in Jerusalem that Christ walked carrying His cross to Calvary.'
};

// UX-07: Wrap known theological terms with tappable definitions (click-based, no Popover API needed)
function _wrapTerms(html) {
  var keys = Object.keys(TERM_DEFS);
  // Sort by length descending so longer terms match first
  keys.sort(function(a, b) { return b.length - a.length; });

  // Split HTML into tags and text segments to avoid matching inside HTML tags
  var parts = html.split(/(<[^>]+>)/);

  for (var p = 0; p < parts.length; p++) {
    // Skip HTML tags
    if (parts[p].charAt(0) === '<') continue;
    // Skip empty text
    if (!parts[p].trim()) continue;

    var text = parts[p];
    keys.forEach(function(term) {
      var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Word boundary match (case-insensitive)
      var re = new RegExp('\\b(' + escaped + ')\\b', 'gi');
      text = text.replace(re, function(match) {
        return '<span class="term-trigger" data-term="' + esc(term) + '">' + match + '</span>';
      });
    });
    parts[p] = text;
  }
  return parts.join('');
}

// Show term definition tooltip on click — delegated handler attached once
function _initTermClicks(container) {
  if (!container || container._termInit) return;
  container._termInit = true;
  container.addEventListener('click', function(e) {
    var trigger = e.target.closest('.term-trigger');
    if (!trigger) return;
    e.stopPropagation();
    var term = trigger.getAttribute('data-term');
    var def = TERM_DEFS[term] || TERM_DEFS[term.toLowerCase()];
    if (!def) return;

    // Remove any existing tooltip
    var old = document.getElementById('termTooltip');
    if (old) old.remove();

    // Create tooltip
    var tip = document.createElement('div');
    tip.id = 'termTooltip';
    tip.className = 'term-popover';
    tip.innerHTML = '<span class="term-popover-word">' + esc(trigger.textContent) + '</span>'
      + '<span class="term-popover-def">' + esc(def) + '</span>';
    document.body.appendChild(tip);

    // Position near the trigger
    var rect = trigger.getBoundingClientRect();
    var tipW = Math.min(320, window.innerWidth - 32);
    tip.style.width = tipW + 'px';
    var left = Math.max(16, Math.min(rect.left, window.innerWidth - tipW - 16));
    tip.style.left = left + 'px';
    // Show above if room, otherwise below
    if (rect.top > 200) {
      tip.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    } else {
      tip.style.top = (rect.bottom + 8) + 'px';
    }

    // Dismiss on next tap anywhere
    function dismiss(ev) {
      if (ev.target.closest('.term-popover')) return;
      var t = document.getElementById('termTooltip');
      if (t) t.remove();
      document.removeEventListener('click', dismiss, true);
    }
    setTimeout(function() {
      document.addEventListener('click', dismiss, true);
    }, 10);
  });
}

var DEVOTIONAL_GUIDES = [
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="10.5" y1="10.5" x2="13.5" y2="10.5"/></svg>',title:'The Sunday Obligation',findLabel:'Mass',filter:'weekend',body:
'<p>Sunday Mass is the heartbeat of Catholic life. It\u2019s the one hour each week where the whole community gathers around the altar to worship God, hear His word, and receive the Eucharist. If you\u2019ve been away for a while, you\u2019re welcome back \u2014 no questions asked.</p>'
+'<p>The Church teaches that attending Mass on Sundays and Holy Days of Obligation is a serious responsibility for every baptized Catholic. This flows from the Third Commandment \u2014 \u201cRemember to keep holy the Lord\u2019s Day\u201d \u2014 and from the Church\u2019s own precepts (CCC 2180). Sunday is the day of the Resurrection, and the Eucharist is the foundation of the Church\u2019s week.</p>'
+'<p>The obligation is fulfilled by attending any valid Catholic Mass \u2014 either on Sunday itself or the Saturday evening vigil (typically 4:00 PM or later).</p>'
+'<details class="conf-exam">'
+'  <summary>What counts as a serious reason to miss <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>Legitimate reasons for missing Sunday Mass include:</p>'
+'    <ul>'
+'      <li>Illness or physical inability to attend</li>'
+'      <li>Caring for the sick, infants, or those who cannot be left alone</li>'
+'      <li>Severe weather or dangerous travel conditions</li>'
+'      <li>Required work that cannot be rescheduled (e.g., healthcare, emergency services)</li>'
+'      <li>Dispensation granted by your pastor or bishop</li>'
+'    </ul>'
+'    <p>When in doubt, speak with your priest. The Church trusts your honest judgment about your ability to attend.</p>'
+'  </div>'
+'</details>'
+'<details class="conf-exam">'
+'  <summary>Holy Days of Obligation (U.S.) <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>In the United States, you are also required to attend Mass on these six Holy Days (USCCB):</p>'
+'    <ul>'
+'      <li><strong>January 1</strong> \u2014 Solemnity of Mary, Mother of God</li>'
+'      <li><strong>40 days after Easter</strong> \u2014 Ascension of the Lord (in some dioceses transferred to the following Sunday)</li>'
+'      <li><strong>August 15</strong> \u2014 Assumption of the Blessed Virgin Mary</li>'
+'      <li><strong>November 1</strong> \u2014 All Saints\u2019 Day</li>'
+'      <li><strong>December 8</strong> \u2014 Immaculate Conception of the Blessed Virgin Mary</li>'
+'      <li><strong>December 25</strong> \u2014 Nativity of the Lord (Christmas)</li>'
+'    </ul>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',title:'How to go to Confession',body:
'<p>Confession \u2014 also called the Sacrament of Reconciliation \u2014 is how Catholics receive God\u2019s forgiveness for sins committed after Baptism. It is required for mortal sins and strongly recommended for all sins. If you\u2019ve been away for a long time, a gentle priest will be happy to help you through it.</p>'
+'<p>The basic steps:</p>'
+'<ol>'
+'<li><strong>Examination of conscience</strong> \u2014 Quietly reflect on your actions since your last Confession.</li>'
+'<li><strong>Enter the confessional</strong> \u2014 You can kneel behind a screen or sit face to face with the priest. Begin: \u201cBless me, Father, for I have sinned. It has been [length of time] since my last Confession.\u201d</li>'
+'<li><strong>Confess your sins</strong> \u2014 Speak honestly. You don\u2019t need to be eloquent. The priest may offer gentle guidance.</li>'
+'<li><strong>Act of Contrition</strong> \u2014 Express sorrow for your sins. See the traditional prayer below.</li>'
+'<li><strong>Absolution</strong> \u2014 The priest pronounces absolution. Your sins are forgiven.</li>'
+'<li><strong>Penance</strong> \u2014 Complete the prayer or act the priest assigns, usually shortly after leaving.</li>'
+'</ol>'
+'<p>If you\u2019re nervous, that\u2019s normal. The confessional is one of the most merciful places in the world.</p>'
+'<details class="conf-exam">'
+'  <summary>Examination of Conscience <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>Toward God</p>'
+'    <ul>'
+'      <li>Have I neglected prayer, Sunday Mass, or my relationship with God?</li>'
+'      <li>Have I taken God\u2019s name in vain or treated sacred things carelessly?</li>'
+'      <li>Have I placed other things \u2014 money, status, approval \u2014 above God?</li>'
+'    </ul>'
+'    <p>Toward others</p>'
+'    <ul>'
+'      <li>Have I been dishonest, deceptive, or unkind in word or deed?</li>'
+'      <li>Have I harbored resentment, anger, or refused to forgive someone?</li>'
+'      <li>Have I gossiped, slandered, or damaged someone\u2019s reputation?</li>'
+'      <li>Have I taken what isn\u2019t mine, or failed to return what I owe?</li>'
+'      <li>Have I failed to help someone in genuine need when I could?</li>'
+'    </ul>'
+'    <p>Toward myself</p>'
+'    <ul>'
+'      <li>Have I acted against the dignity of my own body or soul?</li>'
+'      <li>Have I been ruled by pride, envy, greed, or self-pity?</li>'
+'      <li>Have I neglected my duties to my family, work, or community?</li>'
+'    </ul>'
+'  </div>'
+'</details>'
+'<div class="conf-act">'
+'  <div class="conf-act-label">Act of Contrition</div>'
+'  <div class="conf-act-text">O my God, I am heartily sorry for having offended Thee, and I detest all my sins because I dread the loss of heaven and the pains of hell; but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to confess my sins, to do penance, and to amend my life. Amen.</div>'
+'</div>'
  ,findLabel:'Confession',filter:'confession'},
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/></svg>',title:'Lent',findLabel:'Lent',filter:'lent',season:'lent',body:
'<p><strong>Lent</strong> is the 40-day season of prayer, fasting, and almsgiving that prepares you for Easter \u2014 the celebration of Christ\u2019s Resurrection. It begins on Ash Wednesday and ends on the evening of Holy Thursday. The 40 days recall Christ\u2019s fasting in the desert before His public ministry (Matthew 4:1\u201311).</p>'
+'<p>Lent is a time to slow down, turn toward God, and prepare your heart. Sundays are not counted among the 40 days of penance \u2014 every Sunday is a celebration of the Resurrection.</p>'
+'<details class="conf-exam">'
+'  <summary>The Three Pillars of Lent <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>The Church calls you to three practices during Lent, rooted in Christ\u2019s teaching in the Sermon on the Mount (Matthew 6:1\u201318):</p>'
+'    <ul>'
+'      <li><strong>Prayer</strong> \u2014 Deepening your relationship with God through daily prayer, Scripture, Adoration, the Rosary, Stations of the Cross, or other devotions.</li>'
+'      <li><strong>Fasting</strong> \u2014 A discipline of self-denial that sharpens spiritual awareness. Fasting is required on Ash Wednesday and Good Friday (one full meal and two smaller meals) for ages 18\u201359. Abstinence from meat is required on all Fridays of Lent for ages 14 and older.</li>'
+'      <li><strong>Almsgiving</strong> \u2014 Giving to those in need as a concrete expression of charity.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
+'<details class="conf-exam">'
+'  <summary>Key Lenten Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <ul>'
+'      <li><strong>Ash Wednesday</strong> \u2014 Ashes are placed on your forehead with the words \u201cRemember that you are dust, and to dust you shall return.\u201d A day of fasting and abstinence.</li>'
+'      <li><strong>Fridays of Lent</strong> \u2014 All Catholics aged 14+ abstain from meat. Many parishes hold Stations of the Cross or fish fries on Friday evenings.</li>'
+'      <li><strong>Confession</strong> \u2014 Strongly emphasized during Lent. Many parishes offer extended hours and penance services.</li>'
+'      <li><strong>Laetare Sunday</strong> \u2014 The Fourth Sunday of Lent. A brief respite \u2014 the priest may wear rose vestments as Easter draws nearer.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
+'<details class="conf-exam">'
+'  <summary>Holy Week <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>The final week of Lent intensifies the focus on Christ\u2019s Passion. During Holy Week, MassFinder shows a day-by-day guide on the More tab with details for each day from Palm Sunday through Easter.</p>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',title:'Easter',season:'easter',body:
'<p><strong>Easter</strong> is the greatest season of the liturgical year \u2014 50 days celebrating Christ\u2019s Resurrection, from Easter Sunday through Pentecost. The vestments are white and gold. The Alleluia, silent throughout Lent, rings out again.</p>'
+'<p>The Resurrection is the central event of the Christian faith. As St. Paul writes: \u201cIf Christ has not been raised, then our preaching is in vain and your faith is in vain\u201d (1 Corinthians 15:14). Every Sunday Mass is a \u201clittle Easter\u201d \u2014 a weekly celebration of this mystery.</p>'
+'<details class="conf-exam">'
+'  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <ul>'
+'      <li><strong>The Easter Octave</strong> \u2014 The eight days from Easter Sunday through Divine Mercy Sunday are celebrated as one continuous feast.</li>'
+'      <li><strong>Divine Mercy Sunday</strong> \u2014 The Second Sunday of Easter. A plenary indulgence is available for those who go to Confession, receive Communion, and pray for the Pope\u2019s intentions.</li>'
+'      <li><strong>Ascension</strong> \u2014 40 days after Easter. Commemorates Christ\u2019s ascent into heaven. A Holy Day of Obligation.</li>'
+'      <li><strong>Pentecost</strong> \u2014 The 50th day. Celebrates the descent of the Holy Spirit and the birth of the Church. Vestments are red.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',title:'Advent',season:'advent',body:
'<p><strong>Advent</strong> is the four-week season of preparation for Christmas. It begins on the Sunday nearest November 30 and ends on Christmas Eve. The liturgical color is purple, with rose on Gaudete Sunday (the Third Sunday).</p>'
+'<p>Advent has a dual focus: preparing to celebrate the birth of Jesus at Christmas, and preparing for Christ\u2019s second coming. It\u2019s a season of joyful anticipation \u2014 not penitential in the same way as Lent.</p>'
+'<details class="conf-exam">'
+'  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <ul>'
+'      <li><strong>Advent Wreath</strong> \u2014 Four candles (three purple, one rose) lit progressively each Sunday, representing Hope, Peace, Joy, and Love.</li>'
+'      <li><strong>Gaudete Sunday</strong> \u2014 The Third Sunday. Rose vestments, a lighter tone. \u201cGaudete\u201d means \u201cRejoice.\u201d</li>'
+'      <li><strong>Immaculate Conception</strong> \u2014 December 8, a Holy Day of Obligation. Celebrates Mary\u2019s conception without original sin.</li>'
+'      <li><strong>O Antiphons</strong> \u2014 December 17\u201323. Ancient prayers addressing Christ by Messianic titles. They form the basis of \u201cO Come, O Come, Emmanuel.\u201d</li>'
+'    </ul>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',title:'Christmas',season:'christmas',body:
'<p><strong>Christmas</strong> is the season celebrating the Incarnation \u2014 God becoming man in Jesus Christ. It begins with the Christmas Vigil on December 24 and extends through the Baptism of the Lord in early January. The liturgical color is white or gold.</p>'
+'<p>Christmas is not just one day but an entire season. The Church invites you to contemplate the mystery that \u201cthe Word became flesh and dwelt among us\u201d (John 1:14).</p>'
+'<details class="conf-exam">'
+'  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <ul>'
+'      <li><strong>Christmas Day</strong> \u2014 December 25, a Holy Day of Obligation. Many parishes celebrate Vigil, Midnight, and daytime Masses.</li>'
+'      <li><strong>The Holy Family</strong> \u2014 The Sunday within the Octave celebrates the family life of Jesus, Mary, and Joseph.</li>'
+'      <li><strong>Mary, Mother of God</strong> \u2014 January 1, a Holy Day of Obligation.</li>'
+'      <li><strong>Epiphany</strong> \u2014 Celebrates the manifestation of Christ to the nations, represented by the Magi.</li>'
+'      <li><strong>Baptism of the Lord</strong> \u2014 The Sunday after Epiphany, ending the Christmas season.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',title:'Ordinary Time',season:'ordinary',body:
'<p><strong>Ordinary Time</strong> isn\u2019t \u201cordinary\u201d in the everyday sense. The name comes from the Latin <em>ordinalis</em> \u2014 meaning \u201ccounted\u201d or \u201cordered.\u201d These are the numbered weeks of the liturgical year, and they make up the longest season: roughly 34 weeks total, split between winter (after Epiphany) and summer\u2013fall (after Pentecost).</p>'
+'<p>During Ordinary Time, the Church walks through Christ\u2019s public ministry week by week. The Sunday readings move sequentially through one of the Gospels (Matthew, Mark, or Luke, depending on the year\u2019s cycle). The liturgical color is green \u2014 symbolizing hope and growth.</p>'
+'<details class="conf-exam">'
+'  <summary>Living Ordinary Time well <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>The great seasons \u2014 Lent, Easter, Advent, Christmas \u2014 have built-in intensity. Ordinary Time asks something quieter: faithfulness in the day-to-day. Some ways to enter more deeply:</p>'
+'    <ul>'
+'      <li>Follow the daily readings. They\u2019re available on the More tab.</li>'
+'      <li>Learn about the saint of the day. The Church celebrates a saint nearly every day of the year.</li>'
+'      <li>Pick one prayer practice \u2014 the Rosary, the Angelus, a daily examination of conscience \u2014 and stick with it through the season.</li>'
+'    </ul>'
+'  </div>'
+'</details>'
  },
  {icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',title:'Devotions',isGroup:true,children:[
    {icon:'',title:'Eucharistic Adoration',body:
'<p><strong>Eucharistic Adoration</strong> is time spent in prayer before the Blessed Sacrament \u2014 the consecrated host \u2014 which Catholics believe is truly the Body of Christ. The host is placed in a vessel called a monstrance and displayed on the altar. You simply sit, kneel, or stand in its presence.</p>'
+'<p>There\u2019s no required prayer or posture. Many people read Scripture, pray the Rosary, journal, or simply sit in silence. Adoration chapels are typically quiet spaces open for individual prayer, sometimes for extended hours.</p>'
+'<p>If a parish offers <strong>Perpetual Adoration</strong>, it means the chapel is open 24 hours a day, 7 days a week, kept continuous by volunteers who sign up for hourly slots. Many people find regular Adoration to be the most transformative spiritual practice of their week.</p>'
    ,findLabel:'Adoration',filter:'adoration'},
    {icon:'',title:'Divine Mercy Chaplet',findLabel:'Divine Mercy Chaplet',searchTerm:'divine mercy',body:
'<p>The Divine Mercy Chaplet is a short prayer given to St. Faustina Kowalska in the 1930s, centered on trust in God\u2019s mercy. It is prayed on ordinary Rosary beads and takes about 10\u201315 minutes.</p>'
+'<p>Begin with one <strong>Our Father</strong>, one <strong>Hail Mary</strong>, and the <strong>Apostles\u2019 Creed</strong>. On each large bead, pray: <em>\u201cEternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world.\u201d</em> On each small bead: <em>\u201cFor the sake of His sorrowful Passion, have mercy on us and on the whole world.\u201d</em> Conclude with: <em>\u201cHoly God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world\u201d</em> \u2014 said three times.</p>'
+'<p>The traditional time for this prayer is 3:00 PM \u2014 the Hour of Mercy \u2014 marking the time of Christ\u2019s death. Many parishes offer a communal chaplet at this hour during Adoration.</p>'
    },
    {icon:'',title:'Novena',findLabel:'Novena',searchTerm:'novena',body:
'<p>A Novena is nine consecutive days of prayer for a specific intention \u2014 the name comes from the Latin <em>novem</em>, meaning nine. The practice traces back to the nine days the apostles and Mary prayed together between the Ascension and Pentecost.</p>'
+'<p>Novenas can be prayed privately at any time, or communally at a parish. Common novenas include the <strong>Novena to the Holy Spirit</strong> (before Pentecost), the <strong>Divine Mercy Novena</strong> (beginning Good Friday), and novenas to specific saints like St. Joseph, St. Anthony, or Our Lady of Guadalupe.</p>'
+'<p>To begin a novena, simply choose a prayer \u2014 many are available in prayer books or online \u2014 commit to praying it on nine consecutive days, and bring your intention before God with trust. The power of a novena is less in the number of days and more in the sustained, intentional attention you bring to prayer.</p>'
    },
    {icon:'',title:'Miraculous Medal',findLabel:'Miraculous Medal',searchTerm:'miraculous medal',body:
'<p>The Miraculous Medal devotion stems from apparitions of the Blessed Virgin Mary to St. Catherine Labour\u00e9 in Paris in 1830. Mary appeared standing on a globe, with rays of light streaming from her hands, and asked that a medal be struck in this image. The front bears the prayer: <em>\u201cO Mary, conceived without sin, pray for us who have recourse to thee.\u201d</em></p>'
+'<p>The medal was approved by the Church and quickly became one of the most widely worn sacramentals in Catholic life. It is not a good-luck charm \u2014 it is a sign of devotion to Mary and trust in her intercession. Those who wear it are encouraged to pray the inscription daily.</p>'
+'<p>Many parishes hold a weekly <strong>Miraculous Medal Novena</strong>, often on Mondays, consisting of prayers, hymns, and the Novena prayer to Our Lady of the Miraculous Medal. These services are typically brief \u2014 about 15 to 20 minutes.</p>'
    },
    {icon:'',title:'Gorzkie \u017bale',findLabel:'Gorzkie \u017bale',filter:'lent',body:
'<p><strong>Gorzkie \u017bale</strong> (pronounced <em>GOSH-kyeh ZAH-leh</em>, meaning \u201cBitter Lamentations\u201d) is a traditional Polish Lenten devotion dating to the early 18th century. It is a sung meditation on the Passion of Christ, structured in three parts that reflect on Christ\u2019s suffering, His trial, and His death on the cross.</p>'
+'<p>The devotion is typically held on Sunday afternoons during Lent, often followed by Benediction of the Blessed Sacrament. It combines hymns, prayers, and readings in a format unique to the Polish Catholic tradition. Gorzkie \u017bale holds a place in Polish Catholic life similar to the Stations of the Cross in other traditions.</p>'
+'<p>In Western New England, parishes with Polish heritage continue this devotion as a cherished link between faith and cultural identity. The service is usually about 30\u201340 minutes and is sung partly or entirely in Polish.</p>'
    },
    {icon:'',title:'Stations of the Cross',findLabel:'Stations of the Cross',filter:'lent',body:
'<p>The Stations of the Cross are 14 moments from Christ\u2019s Passion and death, traditionally prayed by moving through a series of images or carvings placed around the walls of a church. The practice originated as a way for people who could not travel to Jerusalem to walk the Via Dolorosa spiritually.</p>'
+'<ol class="stations-list">'
+'<li>Jesus is condemned to death</li>'
+'<li>Jesus takes up His cross</li>'
+'<li>He falls the first time</li>'
+'<li>He meets His Mother</li>'
+'<li>Simon of Cyrene helps carry the cross</li>'
+'<li>Veronica wipes His face</li>'
+'<li>He falls a second time</li>'
+'<li>He meets the women of Jerusalem</li>'
+'<li>He falls a third time</li>'
+'<li>He is stripped of His garments</li>'
+'<li>He is nailed to the cross</li>'
+'<li>He dies on the cross</li>'
+'<li>He is taken down</li>'
+'<li>He is laid in the tomb</li>'
+'</ol>'
+'<p>Stations are prayed most often on Fridays during Lent, either privately or as a parish group. They typically take 20\u201330 minutes. Many parishes hold them at noon or in the early evening.</p>'
    },
  ]},
];

// ── renderGuide ──
function renderGuide(g, sub) {
  var switchTab = require('./ui.js').switchTab;
  var cls = 'devot-card' + (sub ? ' devot-sub' : '');
  var findLink = '';
  if (g.searchTerm) {
    findLink = '<div class="devot-find-link" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var si=document.getElementById(\'searchInput\');if(si){si.value=\'' + g.searchTerm + '\';si.dispatchEvent(new Event(\'input\'));}">Find ' + (g.findLabel || g.title) + ' near me \u2192</div>';
  } else if (g.filter) {
    findLink = '<div class="devot-find-link" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));document.querySelector(\'[data-filter=' + g.filter + ']\')&&document.querySelector(\'[data-filter=' + g.filter + ']\').click()">Find ' + (g.findLabel || g.title) + ' near me \u2192</div>';
  }
  var iconHtml = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
  var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var body = _wrapScriptureRefs(_wrapTerms(g.body));
  return '<details class="' + cls + '">'
    + '<summary>' + iconHtml + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
    + '<div class="devot-body">' + body + findLink + '</div>'
    + '</details>';
}

module.exports = {
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  renderGuide: renderGuide,
  initTermClicks: _initTermClicks,
};
