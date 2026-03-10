// src/more.js — More tab, feedback, correction forms, devotional guides
var config = require('./config.js');
var utils = require('./utils.js');
var data = require('./data.js');

var DAY_NAMES = config.DAY_NAMES;
var REGION = config.REGION;
var SVC_LABELS = config.SVC_LABELS;
var LANGUAGES = config.LANGUAGES;
var displayName = utils.displayName;
var getNow = utils.getNow;
var esc = utils.esc;
var fmt12 = utils.fmt12;
var fmtDist = utils.fmtDist;
var getDist = utils.getDist;
var isEventActive = utils.isEventActive;
var isLentSeason = utils.isLentSeason;
var state = data.state;
var isFav = data.isFav;

// ── Module-level state ──
var _fbType = '';

// ── Constants ──
var CORR_PLACEHOLDERS = {
  'Wrong time': 'Which service, and what\'s the correct time?',
  'Mass cancelled or moved': 'Which Mass, and where did it move to?',
  'Missing a service': 'What service is missing? (e.g., Saturday 4 PM Confession)',
  'Other': 'Tell us what needs updating'
};

var DEVOTIONAL_GUIDES = [
  {icon:'\u26EA',title:'The Sunday Obligation',findLabel:'Mass',filter:'weekend',body:
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
  {icon:'\u2629',title:'How to go to Confession',body:
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
  {icon:'\uD83C\uDF3F',title:'Lent',findLabel:'Lent',filter:'lent',body:
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
  {icon:'\uD83D\uDD4A\uFE0F',title:'The Traditional Latin Mass',body:
'<p>The Traditional Latin Mass \u2014 also known as the <em>Extraordinary Form</em> or the <em>Usus Antiquior</em> \u2014 is the form of the Roman Rite that was the universal norm before the liturgical reforms of the Second Vatican Council (1962\u20131965). It is celebrated entirely in Latin, with the priest facing the altar (<em>ad orientem</em>) for much of the liturgy.</p>'
+'<p>Key differences from the Ordinary Form (the standard Mass most Catholics attend): the prayers are from the 1962 Roman Missal, the congregation participates primarily through interior prayer and sung responses, and the structure includes prayers like the <strong>Last Gospel</strong> and the <strong>Prayers at the Foot of the Altar</strong> that are not part of the newer form.</p>'
+'<p>Catholics who attend the Traditional Latin Mass do so for a variety of reasons, including its contemplative character, its continuity with centuries of Catholic worship, and its rich musical tradition of Gregorian chant and polyphony. The Mass fulfills the Sunday obligation. Missals with Latin-English translations are usually available at the church to help you follow along.</p>'
  ,findLabel:'Latin Mass',filter:'latin'},
  {icon:'\uD83D\uDCFF',title:'Devotions',isGroup:true,children:[
    {icon:'\uD83D\uDD6F\uFE0F',title:'Eucharistic Adoration',body:
'<p><strong>Eucharistic Adoration</strong> is time spent in prayer before the Blessed Sacrament \u2014 the consecrated host \u2014 which Catholics believe is truly the Body of Christ. The host is placed in a vessel called a monstrance and displayed on the altar. You simply sit, kneel, or stand in its presence.</p>'
+'<p>There\u2019s no required prayer or posture. Many people read Scripture, pray the Rosary, journal, or simply sit in silence. Adoration chapels are typically quiet spaces open for individual prayer, sometimes for extended hours.</p>'
+'<p>If a parish offers <strong>Perpetual Adoration</strong>, it means the chapel is open 24 hours a day, 7 days a week, kept continuous by volunteers who sign up for hourly slots. Many people find regular Adoration to be the most transformative spiritual practice of their week.</p>'
    ,findLabel:'Adoration',filter:'adoration'},
    {icon:'\uD83C\uDF0A',title:'Divine Mercy Chaplet',findLabel:'Adoration',filter:'adoration',body:
'<p>The Divine Mercy Chaplet is a short prayer given to St. Faustina Kowalska in the 1930s, centred on trust in God\u2019s mercy. It is prayed on ordinary Rosary beads and takes about 10\u201315 minutes.</p>'
+'<p>Begin with one <strong>Our Father</strong>, one <strong>Hail Mary</strong>, and the <strong>Apostles\u2019 Creed</strong>. On each large bead, pray: <em>\u201cEternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world.\u201d</em> On each small bead: <em>\u201cFor the sake of His sorrowful Passion, have mercy on us and on the whole world.\u201d</em> Conclude with: <em>\u201cHoly God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world\u201d</em> \u2014 said three times.</p>'
+'<p>The traditional time for this prayer is 3:00 PM \u2014 the Hour of Mercy \u2014 marking the time of Christ\u2019s death. Many parishes offer a communal chaplet at this hour during Adoration.</p>'
    },
    {icon:'\uD83D\uDE4F',title:'Novena',findLabel:'a parish near me',filter:'all',body:
'<p>A Novena is nine consecutive days of prayer for a specific intention \u2014 the name comes from the Latin <em>novem</em>, meaning nine. The practice traces back to the nine days the apostles and Mary prayed together between the Ascension and Pentecost.</p>'
+'<p>Novenas can be prayed privately at any time, or communally at a parish. Common novenas include the <strong>Novena to the Holy Spirit</strong> (before Pentecost), the <strong>Divine Mercy Novena</strong> (beginning Good Friday), and novenas to specific saints like St. Joseph, St. Anthony, or Our Lady of Guadalupe.</p>'
+'<p>To begin a novena, simply choose a prayer \u2014 many are available in prayer books or online \u2014 commit to praying it on nine consecutive days, and bring your intention before God with trust. The power of a novena is less in the number of days and more in the sustained, intentional attention you bring to prayer.</p>'
    },
    {icon:'\uD83C\uDFC5',title:'Miraculous Medal',findLabel:'Miraculous Medal devotions',filter:'all',body:
'<p>The Miraculous Medal devotion stems from apparitions of the Blessed Virgin Mary to St. Catherine Labour\u00e9 in Paris in 1830. Mary appeared standing on a globe, with rays of light streaming from her hands, and asked that a medal be struck in this image. The front bears the prayer: <em>\u201cO Mary, conceived without sin, pray for us who have recourse to thee.\u201d</em></p>'
+'<p>The medal was approved by the Church and quickly became one of the most widely worn sacramentals in Catholic life. It is not a good-luck charm \u2014 it is a sign of devotion to Mary and trust in her intercession. Those who wear it are encouraged to pray the inscription daily.</p>'
+'<p>Many parishes hold a weekly <strong>Miraculous Medal Novena</strong>, often on Mondays, consisting of prayers, hymns, and the Novena prayer to Our Lady of the Miraculous Medal. These services are typically brief \u2014 about 15 to 20 minutes.</p>'
    },
    {icon:'\u271F',title:'Gorzkie \u017bale',findLabel:'Gorzkie \u017bale',filter:'lent',body:
'<p><strong>Gorzkie \u017bale</strong> (pronounced <em>GOSH-kyeh ZAH-leh</em>, meaning \u201cBitter Lamentations\u201d) is a traditional Polish Lenten devotion dating to the early 18th century. It is a sung meditation on the Passion of Christ, structured in three parts that reflect on Christ\u2019s suffering, His trial, and His death on the cross.</p>'
+'<p>The devotion is typically held on Sunday afternoons during Lent, often followed by Benediction of the Blessed Sacrament. It combines hymns, prayers, and readings in a format unique to the Polish Catholic tradition. Gorzkie \u017bale holds a place in Polish Catholic life similar to the Stations of the Cross in other traditions.</p>'
+'<p>In Western New England, parishes with Polish heritage continue this devotion as a cherished link between faith and cultural identity. The service is usually about 30\u201340 minutes and is sung partly or entirely in Polish.</p>'
    },
    {icon:'\u271D\uFE0F',title:'Stations of the Cross',findLabel:'Stations of the Cross',filter:'lent',body:
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

// ── web3submit ──
function web3submit(payload) {
  return fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(Object.assign({ access_key: '3d503d58-e668-4ef8-81ff-70ad5ec3ecf6', from_name: 'MassFinder' }, payload))
  }).then(function(resp) {
    return resp.json();
  }).then(function(d) {
    if (!d.success) throw new Error(d.message || 'Web3Forms error');
    return d;
  });
}

// ── expressInterest ──
function expressInterest(eventId, ev) {
  if (ev) ev.stopPropagation();
  var btn = ev && ev.currentTarget;
  if (btn) btn.disabled = true;
  var e = state.eventsData.find(function(x) { return x.id === eventId; }) || state.ycEvents.find(function(x) { return x.id === eventId; });
  if (!e) { if (btn) btn.disabled = false; return; }
  var c = state.allChurches.find(function(x) { return x.id === e.church_id; }) || {};
  var showToast = require('./render.js').showToast;
  web3submit({
    subject: 'MassFinder Interest: ' + e.title,
    message: 'Event: ' + e.title + '\nChurch: ' + (c.name || '') + '\nCategory: ' + (e.category || '') + '\nDate: ' + (e.date || 'Recurring') + (e.day ? '\nDay: ' + e.day : '') + (e.time ? '\nTime: ' + e.time : '') + '\n\nA user expressed interest via MassFinder.'
  }).then(function() {
    showToast('Thanks for your interest!');
    if (btn) { btn.innerHTML = '&#10003;'; setTimeout(function() { btn.innerHTML = '&#9825;'; btn.disabled = false; }, 2000); }
  }).catch(function(err) {
    console.warn('Interest submit failed:', err);
    if (btn) btn.disabled = false;
  });
}

// ── verifyOk ──
function verifyOk(ok) {
  document.getElementById('verifyPrompt').style.display = 'none';
  var thanks = document.getElementById('verifyThanks');
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026';
  var church = document.getElementById('corrChurch') ? document.getElementById('corrChurch').value : 'Unknown Parish';
  web3submit({
    subject: 'MassFinder \u2713 Times Confirmed: ' + church,
    message: 'A visitor confirmed the schedule for ' + church + ' looks correct.\n\nAction: "Yes, these times look right!"\nParish: ' + church + '\nSubmitted: ' + new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  }).then(function() {
    thanks.textContent = 'Thank you for helping keep MassFinder accurate! God bless.';
  }).catch(function(e) {
    console.warn('Verify email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── showCorrectionForm ──
function showCorrectionForm() {
  document.getElementById('verifyPrompt').style.display = 'none';
  document.getElementById('correctionForm').style.display = 'block';
}

// ── selectCorrPill ──
function selectCorrPill(btn, val) {
  document.querySelectorAll('#corrPills .corr-pill').forEach(function(p) { p.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('corrCategory').value = val;
  document.getElementById('corrMessage').placeholder = CORR_PLACEHOLDERS[val] || 'Tell us what needs updating';
}

// ── submitCorrection ──
function submitCorrection() {
  var church = document.getElementById('corrChurch').value;
  var category = document.getElementById('corrCategory').value;
  var msg = document.getElementById('corrMessage').value.trim();
  var email = document.getElementById('corrEmail').value.trim();
  if (!category) { document.getElementById('corrPills').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('corrMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('verifyThanks');
  document.getElementById('correctionForm').style.display = 'none';
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Correction [' + category + ']: ' + church, church: church, category: category, message: msg, email: email || '(not provided)' })
  .then(function() {
    thanks.textContent = 'Thank you! We\u2019ll review your correction.';
  }).catch(function(e) {
    console.warn('Correction email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── showMoreCorrection ──
function showMoreCorrection() {
  var f = document.getElementById('moreCorrectionForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

// ── selectMoreCorrPill ──
function selectMoreCorrPill(btn, val) {
  document.querySelectorAll('#moreCorrPills .corr-pill').forEach(function(p) { p.classList.remove('selected'); });
  btn.classList.add('selected');
  document.getElementById('moreCorrCategory').value = val;
  document.getElementById('moreCorrMessage').placeholder = CORR_PLACEHOLDERS[val] || 'Tell us what needs updating';
}

// ── submitMoreCorrection ──
function submitMoreCorrection() {
  var church = document.getElementById('moreCorrChurch').value.trim();
  var category = document.getElementById('moreCorrCategory').value;
  var msg = document.getElementById('moreCorrMessage').value.trim();
  var email = document.getElementById('moreCorrEmail').value.trim();
  if (!category) { document.getElementById('moreCorrPills').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('moreCorrMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('moreCorrThanks');
  document.getElementById('moreCorrectionForm').querySelectorAll('input,textarea,button').forEach(function(el) { el.style.display = 'none'; });
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Correction [' + category + ']: ' + (church || 'General'), church: church || '(general)', category: category, message: msg, email: email || '(not provided)' })
  .then(function() {
    thanks.textContent = 'Thank you! We\u2019ll review your correction.';
  }).catch(function(e) {
    console.warn('More correction email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── selectFbType ──
function selectFbType(btn, val) {
  document.querySelectorAll('#fbTypeGrid .fb-type-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  _fbType = val;
  document.getElementById('fbType').value = val;
}

// ── submitFeedback ──
function submitFeedback() {
  var msg = document.getElementById('fbMessage').value.trim();
  var email = document.getElementById('fbEmail').value.trim();
  if (!_fbType) { document.getElementById('fbTypeGrid').style.outline = '2px solid var(--color-error)'; return; }
  if (!msg) { document.getElementById('fbMessage').style.borderColor = 'var(--color-error)'; return; }
  var thanks = document.getElementById('fbThanks');
  document.getElementById('feedbackFormWrap').style.display = 'none';
  thanks.style.display = 'block'; thanks.textContent = 'Sending\u2026'; thanks.style.color = '';
  web3submit({ subject: 'MassFinder Feedback [' + _fbType + ']', feedback_type: _fbType, message: msg, email: email || '(not provided)', from_name: 'MassFinder Feedback' })
  .then(function() {
    thanks.textContent = 'Thank you \u2014 your feedback means a lot. God bless!';
  }).catch(function(e) {
    console.warn('Feedback email failed:', e);
    thanks.textContent = 'Could not send \u2014 please check your connection and try again.';
    thanks.style.color = 'var(--color-error)';
  });
}

// ── renderGuide ──
function renderGuide(g, sub) {
  // Lazy require for switchTab
  var switchTab = require('./ui.js').switchTab;
  var cls = 'devot-card' + (sub ? ' devot-sub' : '');
  var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var findLink = g.filter
    ? '<div class="devot-find-link" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));document.querySelector(\'[data-filter=' + g.filter + ']\')&&document.querySelector(\'[data-filter=' + g.filter + ']\').click()">Find ' + (g.findLabel || g.title) + ' near me \u2192</div>'
    : '';
  return '<details class="' + cls + '"><summary><span class="devot-icon">' + g.icon + '</span><span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
    + '<div class="devot-body">' + g.body + findLink + '</div>'
    + '</details>';
}

// ── renderMore ──
function renderMore() {
  // Lazy requires
  var events = require('./events.js');
  var getUpcomingYC = events.getUpcomingYC;
  var resolveYC = events.resolveYC;
  var fmtYCDate = events.fmtYCDate;
  var downloadEventIcal = events.downloadEventIcal;
  var render = require('./render.js');
  var openDetail = render.openDetail;
  var showToast = render.showToast;
  var readings = require('./readings.js');
  var renderLiturgicalCalendar = readings.renderLiturgicalCalendar;
  var fetchReadings = readings.fetchReadings;
  var fetchLiturgicalDay = readings.fetchLiturgicalDay;
  var setLiturgicalSeason = readings.setLiturgicalSeason;
  var renderHDOBanner = readings.renderHDOBanner;
  var updateHDOBadge = readings.updateHDOBadge;
  var renderSaintCard = readings.renderSaintCard;
  var switchTab = require('./ui.js').switchTab;

  var langCount = new Set();
  state.allChurches.forEach(function(c) {
    c.services.forEach(function(s) { if (s.language) langCount.add(s.language); });
  });

  // -- PWA INSTALL CARD --
  (function() {
    var slot = document.getElementById('moreInstallCard');
    if (!slot) return;
    // Hidden if already installed or user dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;
    if (document.cookie.split('; ').some(function(c) { return c.startsWith('pf_more_install_dismissed='); })) return;

    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var shareIcon = '<svg class="ios-share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7-7 7 7"/><path d="M5 17h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1z"/></svg>';

    var bodyHtml, actionHtml = '';
    if (isIOS) {
      var isCriOS = /CriOS/.test(ua);
      if (isCriOS) bodyHtml = 'Tap <strong>\u22EF</strong> then <strong>\u201CAdd to Home Screen\u201D</strong> for the full app experience \u2014 faster loads, offline access, and no browser toolbar.';
      else bodyHtml = 'Tap ' + shareIcon + ' then <strong>\u201CAdd to Home Screen\u201D</strong> for the full app experience \u2014 faster loads, offline access, and no browser toolbar.';
    } else {
      bodyHtml = 'Get the full experience \u2014 faster loads, offline access, and no browser toolbar.';
      actionHtml = '<button class="mic-action" id="micInstallBtn">Install App</button>';
    }

    slot.innerHTML = '<div class="more-install-card" id="moreInstallCardInner">'
      + '<button class="mic-close" onclick="dismissMoreInstall()" aria-label="Dismiss">\u2715</button>'
      + '<div class="mic-title">Install MassFinder</div>'
      + '<div class="mic-body">' + bodyHtml + '</div>'
      + actionHtml
      + '</div>';

    // Android/Desktop: hook into beforeinstallprompt
    if (!isIOS) {
      var btn = document.getElementById('micInstallBtn');
      if (btn && window._deferredInstallPrompt) {
        btn.addEventListener('click', function() {
          window._deferredInstallPrompt.prompt();
          window._deferredInstallPrompt.userChoice.then(function() { window._deferredInstallPrompt = null; dismissMoreInstall(); });
        });
      } else if (btn) {
        // No prompt available — hide the button, just show instructions
        btn.style.display = 'none';
      }
    }
  })();

  // -- ABOUT STAT GRID --
  (function() {
    var grid = document.getElementById('aboutStatGrid');
    if (!grid) return;
    var svcCount = state.allChurches.reduce(function(n, c) { return n + (c.services || []).length; }, 0);
    var today = getNow();
    var totalDays = 0, checkedCount = 0, verCount = 0;
    state.allChurches.forEach(function(c) {
      var v = c.validation;
      if (v && v.last_checked) {
        var d = new Date(v.last_checked + 'T00:00:00');
        totalDays += Math.max(0, Math.floor((today - d) / (1000 * 60 * 60 * 24)));
        checkedCount++;
      }
      if (v && v.status === 'verified') verCount++;
    });
    var avgDays = checkedCount ? Math.round(totalDays / checkedCount) : null;
    var avgLabel = avgDays === null ? '-' : avgDays + ' days';
    var todayStr = today.toISOString().slice(0, 10);
    var activeEvtCount = state.eventsData.filter(function(e) {
      if (e.dates && e.dates.length) { var last = e.dates[e.dates.length - 1]; return (e.end_date || last) >= todayStr; }
      var exp = e.end_date || e.date; if (!exp) return true; return exp >= todayStr;
    }).length;
    grid.innerHTML =
      '<div class="stat-card"><div class="stat-value">' + state.allChurches.length + '</div><div class="stat-label">Churches</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + svcCount.toLocaleString() + '</div><div class="stat-label">Services</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + avgLabel + '</div><div class="stat-label">Avg. Data Age</div></div>'
      + '<div class="stat-card"><div class="stat-value">' + activeEvtCount + '</div><div class="stat-label">Active Events</div></div>';
  })();

  // -- What's Happening: unified YC + Community events --
  var upcoming = getUpcomingYC();
  var allCommunityEvents = state.eventsData.filter(function(e) { return e.category !== 'yc' && isEventActive(e); }).map(function(e) {
    var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
    return Object.assign({}, e, { churchName: ch ? ch.name : '', churchId: e.church_id });
  });
  var hasAnyEvents = upcoming.length || allCommunityEvents.length;
  var whSection = document.getElementById('whatsHappeningSection');
  if (whSection && hasAnyEvents) {
    whSection.style.display = 'block';

    // YC column — strictly chronological, one event per parish in the preview
    var favSet = new Set(state.favorites);
    var seenParishes = new Set();
    var ycShow = [];
    for (var yi = 0; yi < upcoming.length; yi++) {
      var ye = upcoming[yi];
      if (seenParishes.has(ye.church_id)) continue;
      seenParishes.add(ye.church_id);
      ycShow.push(ye);
      if (ycShow.length >= 4) break;
    }
    var ycSeeAll = document.getElementById('whYCSeeAll');
    if (ycSeeAll) ycSeeAll.style.display = upcoming.length > 4 ? 'block' : 'none';
    document.getElementById('whYCList').innerHTML = ycShow.length ? ycShow.map(function(e) {
      var r = resolveYC(e);
      var isFavE = favSet.has(e.church_id);
      var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
      var dist = ch ? getDist(ch, state.userLat, state.userLng) : null;
      var isNear = !isFavE && dist !== null && dist <= 10;
      var indicator = isFavE ? '<div class="wh-event-fav">\u2665 Saved</div>' : isNear ? '<div class="wh-event-near">\uD83D\uDCCD ' + fmtDist(dist) + '</div>' : '';
      var calSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      return '<div class="wh-event-card" onclick="openEventDetail(\'' + e.id + '\')">'
        + indicator
        + '<div class="wh-event-date">' + fmtYCDate(e.date) + (e.time ? ' \u00b7 ' + fmt12(e.time) : '') + '</div>'
        + '<div class="wh-event-title">' + esc(e.title) + '</div>'
        + '<div class="wh-event-church">' + esc(displayName(r.locName || r.churchName)) + '</div>'
        + '<div class="saved-evt-actions" style="margin-top:var(--space-2)">'
        + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + calSvg + '</button>'
        + '<button class="saved-evt-btn" onclick="expressInterest(\'' + esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
        + '</div></div>';
    }).join('') : '<p class="wh-empty">No upcoming YC events.</p>';

    // Community events column — ticker with auto-scroll
    var commShow = allCommunityEvents.slice(0, 10);
    window._moreEvents = allCommunityEvents.slice(0, 10);
    var commCards = commShow.length ? commShow.map(function(e, idx) {
      var ch = state.allChurches.find(function(x) { return x.id === e.churchId; });
      var dist = ch ? getDist(ch, state.userLat, state.userLng) : null;
      var near = dist !== null && dist <= 10 ? '<div class="wh-event-near">\uD83D\uDCCD ' + fmtDist(dist) + '</div>' : '';
      var cCalSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      return '<div class="wh-event-card" onclick="openEventDetail(\'' + esc(e.id) + '\')">'
        + near
        + (e.date ? '<div class="wh-event-date">' + esc(e.date) + '</div>' : e.day ? '<div class="wh-event-date">' + esc(DAY_NAMES[e.day] || e.day) + (e.time ? ' \u00b7 ' + fmt12(e.time) : '') + '</div>' : '')
        + '<div class="wh-event-title">' + esc(e.title) + '</div>'
        + '<div class="wh-event-church">' + esc(displayName(e.churchName)) + '</div>'
        + (e.notes ? '<div class="wh-event-time">' + esc(e.notes) + '</div>' : '')
        + '<div class="saved-evt-actions" style="margin-top:var(--space-2)">'
        + '<button class="saved-evt-btn" onclick="downloadEventIcal(\'' + esc(e.id) + '\');event.stopPropagation()" title="Add to Calendar">' + cCalSvg + '</button>'
        + '<button class="saved-evt-btn" onclick="expressInterest(\'' + esc(e.id) + '\',event)" title="I\'m interested">&#9825;</button>'
        + '</div></div>';
    }).join('') : '';
    var commEl = document.getElementById('whCommunityList');
    if (commCards && commShow.length > 3) {
      // Ticker: duplicate content for seamless scroll loop
      commEl.innerHTML = '<div class="wh-ticker">' + commCards + commCards + '</div>';
    } else {
      commEl.innerHTML = commCards || '<p class="wh-empty">No upcoming events.</p>';
    }

    // Match community column height to YC column
    setTimeout(function() {
      var ycList = document.getElementById('whYCList');
      if (ycList && commEl) {
        var h = ycList.offsetHeight;
        if (h > 100) {
          commEl.style.maxHeight = h + 'px';
          commEl.style.overflow = 'hidden';
        }
      }
    }, 100);
  }

  // Liturgical calendar — re-renders after LitCal fetch completes
  var lituEl = document.getElementById('liturgicalContent');
  if (lituEl) {
    renderLiturgicalCalendar(lituEl);
  }

  // Devotional guides
  var devotEl = document.getElementById('devotionalCards');
  if (devotEl) {
    devotEl.innerHTML = DEVOTIONAL_GUIDES.map(function(g) {
      if (g.isGroup) {
        var childrenHtml = g.children.map(function(c) { return renderGuide(c, true); }).join('');
        var chevSvg = '<svg class="devot-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
        return '<details class="devot-card"><summary><span class="devot-icon">' + g.icon + '</span><span class="devot-title">' + esc(g.title) + '</span>' + chevSvg + '</summary>'
          + '<div class="devot-group-body">' + childrenHtml + '</div>'
          + '</details>';
      }
      return renderGuide(g, false);
    }).join('');

    // Wire CCC reference taps
    devotEl.querySelectorAll('strong').forEach(function(el) {
      var m = el.textContent.trim().match(/^CCC ([\d\u2013\-]+):?$/);
      if (!m) return;
      el.classList.add('ccc-ref');
      var num = m[1];
      el.addEventListener('click', function(ev) {
        ev.stopPropagation();
        window.openCCC(num);
      });
    });
  }

  // Footer with dark mode toggle
  var footer = document.getElementById('moreFooter');
  if (footer) {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    footer.innerHTML = '<button id="theme-toggle-btn" class="theme-toggle" onclick="window.toggleTheme()">'
      + (isDark ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode')
      + '</button><div>MassFinder v2</div>';
  }

  // Trigger readings and saint card fetches independently
  fetchReadings();
  fetchLiturgicalDay().then(function(events) {
    setLiturgicalSeason(events);
    renderHDOBanner(events);
    updateHDOBadge(events);
    renderSaintCard(events);
    renderLiturgicalCalendar(); // Re-render with LitCal data now cached
    // Show Lent & Holy Week ICS export button only during Lent season
    var lentBtn = document.getElementById('icsLentBtn');
    if (lentBtn) {
      var season = document.documentElement.getAttribute('data-season');
      lentBtn.style.display = (season === 'lent') ? '' : 'none';
    }
  });

  window._moreRendered = true;
}

// ── dismissMoreInstall ──
function dismissMoreInstall() {
  var el = document.getElementById('moreInstallCardInner');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.2s'; setTimeout(function() { el.parentElement.innerHTML = ''; }, 250); }
  var d = new Date(); d.setDate(d.getDate() + 90);
  document.cookie = 'pf_more_install_dismissed=1;expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

module.exports = {
  web3submit: web3submit,
  expressInterest: expressInterest,
  verifyOk: verifyOk,
  showCorrectionForm: showCorrectionForm,
  selectCorrPill: selectCorrPill,
  submitCorrection: submitCorrection,
  showMoreCorrection: showMoreCorrection,
  selectMoreCorrPill: selectMoreCorrPill,
  submitMoreCorrection: submitMoreCorrection,
  selectFbType: selectFbType,
  submitFeedback: submitFeedback,
  renderMore: renderMore,
  renderGuide: renderGuide,
  dismissMoreInstall: dismissMoreInstall,
  DEVOTIONAL_GUIDES: DEVOTIONAL_GUIDES,
  CORR_PLACEHOLDERS: CORR_PLACEHOLDERS,
};
