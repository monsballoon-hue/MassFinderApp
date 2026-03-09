// scripts/build-prayers.js
// Fetches prayer data from erickouassi/openPrayers, augments with CCC refs + scripture refs,
// and writes data/prayers.json (rosary mysteries, Stations, core prayer texts).
//
// Run once: node scripts/build-prayers.js
// Output:   data/prayers.json  (~30KB raw)

var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

// ── Fetch helpers (same pattern as build-catechism.js) ────────────────────

function fetchText(url, redirectCount) {
  redirectCount = redirectCount || 0;
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var mod = parsed.protocol === 'https:' ? https : http;
    var opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'MassFinder-BuildScript/1.0', 'Accept': 'application/json, */*' }
    };
    var req = mod.get(opts, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks).toString('utf8')); });
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchJson(url) {
  return fetchText(url).then(function(text) {
    try { return JSON.parse(text); }
    catch (e) { throw new Error('JSON parse error for ' + url + ': ' + e.message); }
  });
}

// Try a single file path against multiple base URLs; return first success.
function fetchAny(filePath, baseUrls) {
  var tried = [];
  function next(i) {
    if (i >= baseUrls.length) return Promise.reject(new Error('Not found: ' + filePath + ' (tried: ' + tried.join(', ') + ')'));
    var url = baseUrls[i] + filePath;
    tried.push(url);
    console.log('  Trying:', url);
    return fetchJson(url).catch(function(e) {
      console.log('    ->', e.message);
      return next(i + 1);
    });
  }
  return next(0);
}

// ── HTML stripper ──────────────────────────────────────────────────────────

function stripHtml(html) {
  return String(html || '')
    // Remove <b>...</b> title prefix that duplicates the title field
    .replace(/<b>[^<]*<\/b>/gi, '')
    // Add space at block-closing tags to avoid word-merging
    .replace(/<\/(p|div|h[1-6])>/gi, ' ')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // Clean trailing comma/period artifacts from source data quirks
    .replace(/,\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Augmentation: CCC refs, scripture refs, fruits, short titles ──────────
// Positional — must match the order returned by rosary_mysteries_txt_html.json
// (sorted by `no` within each type: Joyful 1-5, Sorrowful 1-5, etc.)

var MYSTERY_AUGMENTS = {
  Joyful: [
    { shortTitle: 'The Annunciation',             fruit: 'Humility',                   scripture: 'Luke 1:26-38',    ccc: [484, 486] },
    { shortTitle: 'The Visitation',               fruit: 'Charity',                    scripture: 'Luke 1:39-56',    ccc: [2676] },
    { shortTitle: 'The Nativity',                 fruit: 'Poverty of Spirit',           scripture: 'Luke 2:1-20',     ccc: [525, 526] },
    { shortTitle: 'The Presentation',             fruit: 'Obedience',                  scripture: 'Luke 2:22-40',    ccc: [529] },
    { shortTitle: 'Finding in the Temple',        fruit: 'Joy in Finding Jesus',        scripture: 'Luke 2:41-52',    ccc: [534] },
  ],
  Sorrowful: [
    { shortTitle: 'Agony in the Garden',          fruit: 'Contrition',                 scripture: 'Luke 22:39-46',   ccc: [612] },
    { shortTitle: 'Scourging at the Pillar',      fruit: 'Purity',                     scripture: 'Mark 15:15',      ccc: [572] },
    { shortTitle: 'Crowning with Thorns',         fruit: 'Moral Courage',              scripture: 'Mark 15:17-20',   ccc: [572] },
    { shortTitle: 'Carrying of the Cross',        fruit: 'Patience',                   scripture: 'John 19:17',      ccc: [612] },
    { shortTitle: 'The Crucifixion',              fruit: 'Perseverance',               scripture: 'John 19:25-30',   ccc: [613, 614] },
  ],
  Glorious: [
    { shortTitle: 'The Resurrection',             fruit: 'Faith',                      scripture: 'Luke 24:1-12',    ccc: [638, 640] },
    { shortTitle: 'The Ascension',                fruit: 'Hope',                       scripture: 'Acts 1:9-11',     ccc: [659, 664] },
    { shortTitle: 'Descent of the Holy Spirit',   fruit: 'Gifts of the Holy Spirit',   scripture: 'Acts 2:1-4',      ccc: [731, 732] },
    { shortTitle: 'The Assumption',               fruit: 'Grace of a Happy Death',     scripture: 'Rev 12:1',        ccc: [966] },
    { shortTitle: 'Coronation of Mary',           fruit: "Trust in Mary's Intercession", scripture: 'Rev 12:1',      ccc: [966] },
  ],
  Luminous: [
    { shortTitle: 'Baptism of Jesus',             fruit: 'Openness to the Holy Spirit', scripture: 'Mark 1:9-11',   ccc: [1223] },
    { shortTitle: 'Wedding at Cana',              fruit: 'Fidelity',                   scripture: 'John 2:1-11',     ccc: [1613] },
    { shortTitle: 'Proclamation of the Kingdom',  fruit: 'Conversion',                 scripture: 'Mark 1:14-15',    ccc: [541, 542] },
    { shortTitle: 'The Transfiguration',          fruit: 'Desire for Holiness',        scripture: 'Mark 9:2-8',      ccc: [554, 556] },
    { shortTitle: 'Institution of the Eucharist', fruit: 'Eucharistic Adoration',      scripture: 'Matt 26:26-28',   ccc: [1337, 1340] },
  ],
};

// Map openPrayers prayer names → our keys (handles known 'tilte' typo)
var PRAYER_KEY_MAP = {
  'Our Father': 'our_father',
  'Hail Mary': 'hail_mary',
  'Glory Be': 'glory_be',
  'Glory Be to the Father': 'glory_be',
  "Apostle's Creed": 'apostles_creed',
  "Apostles' Creed": 'apostles_creed',
  'Apostles Creed': 'apostles_creed',
  'Hail Holy Queen': 'hail_holy_queen',
  'Salve Regina': 'hail_holy_queen',
  'Fatima Prayer': 'o_my_jesus',
  'O My Jesus': 'o_my_jesus',
  'Act of Contrition': 'act_of_contrition',
  'Sign of the Cross': 'sign_of_cross',
};

// Authoritative fallbacks — used when a prayer is missing from the repo
var PRAYER_FALLBACKS = {
  our_father: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
  hail_mary: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
  glory_be: 'Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the beginning, is now, and ever shall be, world without end. Amen.',
  apostles_creed: 'I believe in God, the Father Almighty, Creator of heaven and earth, and in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father Almighty; from there He will come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
  hail_holy_queen: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy towards us; and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.',
  o_my_jesus: 'O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to heaven, especially those in most need of thy mercy.',
  act_of_contrition: 'O my God, I am heartily sorry for having offended thee, and I detest all my sins because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve with the help of thy grace to sin no more and to avoid the near occasions of sin. Amen.',
  sign_of_cross: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
};

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  var BASE_URLS = [
    'https://raw.githubusercontent.com/erickouassi/openPrayers/master/',
    'https://raw.githubusercontent.com/erickouassi/openPrayers/main/',
  ];

  console.log('Fetching rosary mysteries...');
  var mysteriesRaw = await fetchAny('rosary/rosary_mysteries_txt_html.json', BASE_URLS);

  console.log('Fetching rosary day mappings...');
  var dayRaw = await fetchAny('rosary/rosary_day.json', BASE_URLS);

  console.log('Fetching stations of the cross...');
  var stationsRaw = await fetchAny('stations_of_the_cross.json', BASE_URLS);

  console.log('Fetching basic prayers...');
  var prayersRaw = await fetchAny('basic_prayers.json', BASE_URLS);

  // ── Process mysteries ──
  // openPrayers uses "The Joyful Mysteries", "The Sorrowful Mysteries", etc.
  var MYSTERY_TYPE_NORM = {
    'The Joyful Mysteries': 'Joyful',
    'The Sorrowful Mysteries': 'Sorrowful',
    'The Glorious Mysteries': 'Glorious',
    'The Luminous Mysteries': 'Luminous',
    'Joyful': 'Joyful', 'Sorrowful': 'Sorrowful',
    'Glorious': 'Glorious', 'Luminous': 'Luminous',
  };
  var byType = {};
  (Array.isArray(mysteriesRaw) ? mysteriesRaw : []).forEach(function(m) {
    var t = MYSTERY_TYPE_NORM[m.mysteries] || m.mysteries;
    if (!byType[t]) byType[t] = [];
    byType[t].push(m);
  });
  Object.keys(byType).forEach(function(t) {
    byType[t].sort(function(a, b) { return parseInt(a.no, 10) - parseInt(b.no, 10); });
  });

  var mysteries = {};
  ['Joyful', 'Sorrowful', 'Glorious', 'Luminous'].forEach(function(type) {
    var augments = MYSTERY_AUGMENTS[type] || [];
    mysteries[type] = (byType[type] || []).map(function(m, idx) {
      var aug = augments[idx] || {};
      return {
        no: parseInt(m.no, 10) || (idx + 1),
        title: stripHtml(m.title || ''),
        shortTitle: aug.shortTitle || stripHtml(m.title || ''),
        meditation: stripHtml(m.textHTML || m.text || ''),
        fruit: aug.fruit || '',
        scripture: aug.scripture || '',
        ccc: aug.ccc || [],
      };
    });
  });
  var totalMysteries = Object.values(mysteries).reduce(function(s, a) { return s + a.length; }, 0);
  console.log('Processed ' + totalMysteries + ' mysteries across ' + Object.keys(mysteries).length + ' types');

  // ── Process day mappings ──
  // openPrayers uses { day: "Sunday", mystery: "Joyful" } (not mystery_type)
  var DAY_NAME_MAP = {
    Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday',
    Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday', Sunday: 'sunday',
  };
  var dayMysteries = {};
  (Array.isArray(dayRaw) ? dayRaw : []).forEach(function(d) {
    var key = DAY_NAME_MAP[d.day || d.day_name];
    var raw = (d.mystery || d.mystery_type || '').trim();
    var mystery = MYSTERY_TYPE_NORM[raw] || raw;
    if (key && mystery) dayMysteries[key] = mystery;
  });
  console.log('Day mappings:', JSON.stringify(dayMysteries));

  // ── Process stations ──
  var stationsArr = Array.isArray(stationsRaw) ? stationsRaw : [];
  stationsArr.sort(function(a, b) { return parseInt(a.id, 10) - parseInt(b.id, 10); });
  var stations = stationsArr.map(function(s) {
    return {
      id: parseInt(s.id, 10),
      title: s.title || '',
      verse: s.v || 'We adore you, Christ, and we praise you.',
      response: s.r || 'Because by your holy Cross, you have redeemed the world.',
      meditation: s.meditation || '',
      prayer: s.prayer || '',
    };
  });
  console.log('Processed ' + stations.length + ' stations');
  if (stations.length !== 14) console.warn('WARNING: expected 14 stations, got ' + stations.length);

  // ── Process core prayers ──
  var prayers = {};
  (Array.isArray(prayersRaw) ? prayersRaw : []).forEach(function(p) {
    var name = (p.title || p.tilte || '').trim();  // handle 'tilte' typo
    var key = PRAYER_KEY_MAP[name];
    if (key && p.prayerText) prayers[key] = p.prayerText.trim();
  });
  // Apply fallbacks for any missing prayers
  Object.keys(PRAYER_FALLBACKS).forEach(function(k) {
    if (!prayers[k]) {
      console.log('  Using fallback for:', k);
      prayers[k] = PRAYER_FALLBACKS[k];
    }
  });
  console.log('Prayers collected (' + Object.keys(prayers).length + '): ' + Object.keys(prayers).join(', '));

  // ── Write output ──
  var output = {
    version: '1',
    mysteries: mysteries,
    dayMysteries: dayMysteries,
    stations: stations,
    prayers: prayers,
  };

  var dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  var outPath = path.join(dataDir, 'prayers.json');
  fs.writeFileSync(outPath, JSON.stringify(output));
  var sizeKB = Math.round(fs.statSync(outPath).size / 1024);
  console.log('Written:', outPath, '(' + sizeKB + 'KB)');
  console.log('Done. ' + totalMysteries + ' mysteries | ' + stations.length + ' stations | ' + Object.keys(prayers).length + ' prayers');
}

main().catch(function(e) {
  console.error('Error:', e.message);
  process.exit(1);
});
