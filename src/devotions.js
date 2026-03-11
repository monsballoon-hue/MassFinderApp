// src/devotions.js — Devotional guide content and rendering
var utils = require('./utils.js');
var esc = utils.esc;

// SVG icons for top-level guides only (consistent cross-platform rendering)
var _svg = function(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">' + d + '</svg>'; };
var ICONS = {
  // Chalice — Sunday Mass obligation
  chalice: _svg('<path d="M8 2h8v6a4 4 0 01-8 0V2z"/><path d="M4 2h16"/><path d="M12 12v4"/><path d="M8 20h8"/><path d="M7 22h10"/>'),
  // Two keys crossed — Confession / keys of absolution
  keys: _svg('<circle cx="8" cy="6" r="3"/><path d="M10.5 8.5L20 18"/><path d="M17 15l3 3"/><circle cx="16" cy="6" r="3"/><path d="M13.5 8.5L4 18"/><path d="M7 15l-3 3"/>'),
  // Ashes / palm — Lent
  palm: _svg('<path d="M12 22V8"/><path d="M8 12c-3-2-5-5-4-8 3 1 5 4 6 7"/><path d="M16 12c3-2 5-5 4-8-3 1-5 4-6 7"/><path d="M9 18c-2-1-4-3-3-6 2 1 4 3 4 5"/><path d="M15 18c2-1 4-3 3-6-2 1-4 3-4 5"/>'),
  // Book — Traditional Latin Mass / missal
  book: _svg('<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M12 6v8"/><path d="M9 10h6"/>'),
  // Folded hands — Devotions group
  pray: _svg('<path d="M12 2C10 7 6 10 6 14a6 6 0 0012 0c0-4-4-7-6-12z"/><path d="M12 10v8"/>'),
};

var DEVOTIONAL_GUIDES = [
  {icon:ICONS.church,title:'The Sunday Obligation',findLabel:'Mass',filter:'weekend',body:
'<p>The Catholic Church teaches that attending Mass on Sundays and Holy Days of Obligation is a serious duty for every baptized Catholic. This obligation flows from the Third Commandment \u2014 \u201cRemember to keep holy the Lord\u2019s Day\u201d \u2014 and from the Church\u2019s own precepts.</p>'
+'<p><strong>CCC 2180:</strong> \u201cOn Sundays and other holy days of obligation, the faithful are bound to participate in the Mass.\u201d The Sunday Eucharist is the foundation of Christian life and the heart of the Church\u2019s week.</p>'
+'<p><strong>CCC 2181:</strong> \u201cThose who deliberately fail in this obligation commit a grave sin.\u201d Missing Mass without a serious reason is considered a mortal sin requiring Confession before receiving Communion again.</p>'
+'<p><strong>CCC 1166\u20131167:</strong> Sunday is the pre-eminent day for the celebration of the Eucharist because it is the day of the Resurrection. \u201cThe Sunday celebration of the Lord\u2019s Day and his Eucharist is at the heart of the Church\u2019s life.\u201d</p>'
+'<p>The obligation is fulfilled by attending any valid Catholic Mass \u2014 either on Sunday itself or the Saturday evening vigil (typically 4:00 PM or later).</p>'
+'<details class="conf-exam">'
+'  <summary>What Counts as a Serious Reason to Miss <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>Legitimate reasons for missing Sunday Mass include:</p>'
+'    <ul>'
+'      <li>Illness or physical inability to attend</li>'
+'      <li>Caring for the sick, infants, or those who cannot be left alone</li>'
+'      <li>Severe weather or dangerous travel conditions</li>'
+'      <li>Required work that cannot be rescheduled (e.g., healthcare, emergency services)</li>'
+'      <li>Dispensation granted by your pastor or bishop</li>'
+'    </ul>'
+'    <p>When in doubt, speak with your priest. A general rule: if you are well enough to go to a restaurant or a social event, you are well enough for Mass.</p>'
+'  </div>'
+'</details>'
+'<details class="conf-exam">'
+'  <summary>Holy Days of Obligation (U.S.) <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
+'  <div class="conf-exam-body">'
+'    <p>In the United States, Catholics are also required to attend Mass on these six Holy Days (USCCB):</p>'
+'    <ul>'
+'      <li><strong>January 1</strong> \u2014 Solemnity of Mary, Mother of God</li>'
+'      <li><strong>40 days after Easter</strong> \u2014 Ascension of the Lord (in some dioceses transferred to the following Sunday)</li>'
+'      <li><strong>August 15</strong> \u2014 Assumption of the Blessed Virgin Mary</li>'
+'      <li><strong>November 1</strong> \u2014 All Saints\u2019 Day</li>'
+'      <li><strong>December 8</strong> \u2014 Immaculate Conception of the Blessed Virgin Mary</li>'
+'      <li><strong>December 25</strong> \u2014 Nativity of the Lord (Christmas)</li>'
+'    </ul>'
+'    <p>When January 1, August 15, or November 1 falls on a Saturday or Monday, the obligation is typically dispensed by the U.S. bishops. A vigil Mass the evening before fulfills the obligation for any Holy Day.</p>'
+'  </div>'
+'</details>'
  },
  {icon:ICONS.keys,title:'How to go to Confession',body:
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
  {icon:ICONS.palm,title:'Lent',findLabel:'Lent',filter:'lent',body:
'<p><strong>Lent</strong> is the 40-day liturgical season of prayer, fasting, and almsgiving that prepares Catholics for Easter \u2014 the celebration of Christ\u2019s Resurrection. It begins on <strong>Ash Wednesday</strong> and ends on the evening of <strong>Holy Thursday</strong>, the start of the Sacred Paschal Triduum.</p>'
+'<p>The 40 days recall Christ\u2019s 40 days of fasting in the desert before beginning His public ministry (Matthew 4:1\u201311). Sundays are not counted among the 40 days of penance, as every Sunday is a celebration of the Resurrection.</p>'
+'<h4>The Three Pillars of Lent</h4>'
+'<p>The Church calls the faithful to three practices during Lent, rooted in Christ\u2019s teaching in the Sermon on the Mount (Matthew 6:1\u201318):</p>'
+'<ul>'
+'<li><strong>Prayer</strong> \u2014 Deepening one\u2019s relationship with God through daily prayer, Scripture, Adoration, the Rosary, Stations of the Cross, or other devotions. Many parishes add weekday Masses, evening prayer services, and Lenten missions during this season.</li>'
+'<li><strong>Fasting</strong> \u2014 A discipline of self-denial that sharpens spiritual awareness. The Church requires fasting on Ash Wednesday and Good Friday (one full meal and two smaller meals that together do not equal the full meal) for those aged 18\u201359. Abstinence from meat is required on all Fridays of Lent for those aged 14 and older (<span class="ccc-ref" onclick="window.openCCC(\'1438\');event.stopPropagation()">CCC 1438</span>; USCCB).</li>'
+'<li><strong>Almsgiving</strong> \u2014 Giving to those in need as a concrete expression of charity. Many parishes participate in Catholic Relief Services\u2019 Rice Bowl or organize local drives for food, clothing, or financial support.</li>'
+'</ul>'
+'<h4>Key Lenten Observances</h4>'
+'<ul>'
+'<li><strong>Ash Wednesday</strong> \u2014 Ashes are placed on the forehead with the words \u201cRemember that you are dust, and to dust you shall return\u201d or \u201cRepent, and believe in the Gospel.\u201d It is a day of fasting and abstinence. Ash Wednesday is not a Holy Day of Obligation, yet it is one of the most widely attended liturgies of the year.</li>'
+'<li><strong>Fridays of Lent</strong> \u2014 All Catholics aged 14+ are required to abstain from meat. Many parishes hold Stations of the Cross, fish fries, or other communal gatherings on Friday evenings.</li>'
+'<li><strong>Sacrament of Reconciliation</strong> \u2014 Confession is strongly emphasized during Lent. Many parishes offer extended confession hours, penance services, and communal reconciliation events. The Church requires Catholics to confess mortal sins at least once a year, and Lent is the traditional season for this (<span class="ccc-ref" onclick="window.openCCC(\'1457\');event.stopPropagation()">CCC 1457</span>).</li>'
+'<li><strong>Laetare Sunday</strong> \u2014 The Fourth Sunday of Lent, a brief respite in the penitential season. The priest may wear rose-colored vestments, and the mood lightens slightly as Easter draws nearer.</li>'
+'</ul>'
+'<h4>Holy Week</h4>'
+'<p>The final week of Lent intensifies the Church\u2019s focus on Christ\u2019s Passion:</p>'
+'<ul>'
+'<li><strong>Palm Sunday</strong> \u2014 Commemorates Christ\u2019s triumphant entry into Jerusalem. Palms are blessed and distributed. The Passion narrative is read in full.</li>'
+'<li><strong>Holy Thursday</strong> \u2014 The Mass of the Lord\u2019s Supper commemorates the institution of the Eucharist and the priesthood, and includes the washing of feet. Lent ends on this evening as the Sacred Triduum begins.</li>'
+'<li><strong>Good Friday</strong> \u2014 The Passion of the Lord. There is no Mass on this day. The liturgy includes the reading of the Passion, veneration of the Cross, and Holy Communion from hosts consecrated the day before. It is a day of fasting and abstinence.</li>'
+'<li><strong>Holy Saturday</strong> \u2014 A day of quiet vigil at the Lord\u2019s tomb. The Easter Vigil, celebrated after nightfall, is the most important liturgy of the entire year \u2014 the Church welcomes new members through Baptism, Confirmation, and First Eucharist, and proclaims the Resurrection.</li>'
+'</ul>'
+'<h4>From the Catechism</h4>'
+'<p><strong>CCC 540:</strong> \u201cBy the solemn forty days of Lent the Church unites herself each year to the mystery of Jesus in the desert.\u201d</p>'
+'<p><strong>CCC 1438:</strong> \u201cThe seasons and days of penance in the course of the liturgical year (Lent, and each Friday in memory of the death of the Lord) are intense moments of the Church\u2019s penitential practice.\u201d</p>'
+'<p><strong>CCC 1095:</strong> Lent is a time when the Church \u201cre-reads and re-lives the great events of salvation history\u201d as a preparation for the Easter sacraments.</p>'
  },
  {icon:ICONS.book,title:'The Traditional Latin Mass',body:
'<p>The Traditional Latin Mass \u2014 also known as the <em>Extraordinary Form</em> or the <em>Usus Antiquior</em> \u2014 is the form of the Roman Rite that was the universal norm before the liturgical reforms of the Second Vatican Council (1962\u20131965). It is celebrated entirely in Latin, with the priest facing the altar (<em>ad orientem</em>) for much of the liturgy.</p>'
+'<p>Key differences from the Ordinary Form (the standard Mass most Catholics attend): the prayers are from the 1962 Roman Missal, the congregation participates primarily through interior prayer and sung responses, and the structure includes prayers like the <strong>Last Gospel</strong> and the <strong>Prayers at the Foot of the Altar</strong> that are not part of the newer form.</p>'
+'<p>Catholics who attend the Traditional Latin Mass do so for a variety of reasons, including its contemplative character, its continuity with centuries of Catholic worship, and its rich musical tradition of Gregorian chant and polyphony. The Mass fulfills the Sunday obligation. Missals with Latin-English translations are usually available at the church to help you follow along.</p>'
  ,findLabel:'Latin Mass',filter:'latin'},
  {icon:ICONS.pray,title:'Devotions',isGroup:true,children:[
    {icon:'',title:'Eucharistic Adoration',body:
'<p><strong>Eucharistic Adoration</strong> is time spent in prayer before the Blessed Sacrament \u2014 the consecrated host \u2014 which Catholics believe is truly the Body of Christ. The host is placed in a vessel called a monstrance and displayed on the altar. You simply sit, kneel, or stand in its presence.</p>'
+'<p>There\u2019s no required prayer or posture. Many people read Scripture, pray the Rosary, journal, or simply sit in silence. Adoration chapels are typically quiet spaces open for individual prayer, sometimes for extended hours.</p>'
+'<p>If a parish offers <strong>Perpetual Adoration</strong>, it means the chapel is open 24 hours a day, 7 days a week, kept continuous by volunteers who sign up for hourly slots. Many people find regular Adoration to be the most transformative spiritual practice of their week.</p>'
    ,findLabel:'Adoration',filter:'adoration'},
    {icon:'',title:'Divine Mercy Chaplet',findLabel:'Adoration',filter:'adoration',body:
'<p>The Divine Mercy Chaplet is a short prayer given to St. Faustina Kowalska in the 1930s, centred on trust in God\u2019s mercy. It is prayed on ordinary Rosary beads and takes about 10\u201315 minutes.</p>'
+'<p>Begin with one <strong>Our Father</strong>, one <strong>Hail Mary</strong>, and the <strong>Apostles\u2019 Creed</strong>. On each large bead, pray: <em>\u201cEternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world.\u201d</em> On each small bead: <em>\u201cFor the sake of His sorrowful Passion, have mercy on us and on the whole world.\u201d</em> Conclude with: <em>\u201cHoly God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world\u201d</em> \u2014 said three times.</p>'
+'<p>The traditional time for this prayer is 3:00 PM \u2014 the Hour of Mercy \u2014 marking the time of Christ\u2019s death. Many parishes offer a communal chaplet at this hour during Adoration.</p>'
    },
    {icon:'',title:'Novena',findLabel:'a parish near me',filter:'all',body:
'<p>A Novena is nine consecutive days of prayer for a specific intention \u2014 the name comes from the Latin <em>novem</em>, meaning nine. The practice traces back to the nine days the apostles and Mary prayed together between the Ascension and Pentecost.</p>'
+'<p>Novenas can be prayed privately at any time, or communally at a parish. Common novenas include the <strong>Novena to the Holy Spirit</strong> (before Pentecost), the <strong>Divine Mercy Novena</strong> (beginning Good Friday), and novenas to specific saints like St. Joseph, St. Anthony, or Our Lady of Guadalupe.</p>'
+'<p>To begin a novena, simply choose a prayer \u2014 many are available in prayer books or online \u2014 commit to praying it on nine consecutive days, and bring your intention before God with trust. The power of a novena is less in the number of days and more in the sustained, intentional attention you bring to prayer.</p>'
    },
    {icon:'',title:'Miraculous Medal',findLabel:'Miraculous Medal devotions',filter:'all',body:
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
  var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var findLink = g.filter
    ? '<div class="devot-find-link" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));document.querySelector(\'[data-filter=' + g.filter + ']\')&&document.querySelector(\'[data-filter=' + g.filter + ']\').click()">Find ' + (g.findLabel || g.title) + ' near me \u2192</div>'
    : '';
  var iconHtml = g.icon ? '<span class="devot-icon">' + g.icon + '</span>' : '';
  return '<details class="' + cls + '"><summary>' + iconHtml + '<span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
    + '<div class="devot-body">' + g.body + findLink + '</div>'
    + '</details>';
}

module.exports = {
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  renderGuide: renderGuide,
};
