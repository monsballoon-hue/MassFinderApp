// scripts/apply-changes.js
// Reads approved bulletin_changes → patches parish_data.json
// Run: node scripts/apply-changes.js [supabase | path/to/changes.json] [--dry-run]
//
// Change types handled: confirmed, modified, new_service, removed, not_found
// --dry-run: prints changelog without writing to JSON or updating Supabase

var fs = require('fs');
var path = require('path');

// Load env
var envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    var eq = line.indexOf('=');
    if (eq < 0) return;
    if (!process.env[line.slice(0, eq).trim()]) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
}

var config = require('../src/config.js');

var jsonPath = path.join(__dirname, '..', 'parish_data.json');
var DRY_RUN = process.argv.includes('--dry-run');

// ── Valid season values (from parish_data.schema.json) ──
var VALID_SEASONS = [
  'year_round', 'lent', 'advent', 'summer', 'winter',
  'academic_year', 'easter_season', 'ordinary_time', 'holy_week'
];

// ── ID Generation ──
// Type abbreviations — derived from dominant patterns in existing IDs
var TYPE_ABBR = {
  sunday_mass: 'smass', daily_mass: 'dmass', communion_service: 'comm',
  confession: 'conf', anointing_of_sick: 'anoint',
  adoration: 'ador', perpetual_adoration: 'pador', holy_hour: 'holyhour',
  rosary: 'rosary', stations_of_cross: 'stations', divine_mercy: 'divmerc',
  miraculous_medal: 'mirac', novena: 'novena', devotion: 'devot',
  vespers: 'vesp', gorzkie_zale: 'gorz', benediction: 'bene',
  prayer_group: 'pray', blessing: 'bless',
  holy_thursday_mass: 'htmass', good_friday_service: 'gfsvc',
  easter_vigil_mass: 'evmass', palm_sunday_mass: 'psmass',
  easter_sunday_mass: 'esmass',
};

// Day abbreviations — derived from dominant patterns in existing IDs
var DAY_ABBR = {
  sunday: 'sun', monday: 'mon', tuesday: 'tue', wednesday: 'wed',
  thursday: 'thu', friday: 'fri', saturday: 'sat',
  first_friday: '1fri', first_saturday: '1sat',
  holyday: 'holyday', holyday_eve: 'holyeve',
  holy_thursday: 'holythu', good_friday: 'goodfri',
  easter_vigil: 'eastervig', holy_saturday: 'holysat',
  palm_sunday: 'psun', easter_sunday: 'esun',
  civil_holiday: 'civil', lent: 'lent',
};

function locationAbbr(locationId) {
  if (!locationId) return '';
  // Take first word of location ID, truncate to 5 chars
  var first = locationId.split('-')[0];
  return first.slice(0, 5);
}

function generateServiceId(parishId, svc, existingIds) {
  var typeA = TYPE_ABBR[svc.type] || svc.type;
  var dayA = svc.day ? (DAY_ABBR[svc.day] || svc.day) : 'none';
  var timeA = svc.time ? svc.time.replace(':', '') : 'notime';
  var locA = locationAbbr(svc.location_id);

  var parts = [parishId, typeA, dayA, timeA];
  if (locA) parts.push(locA);

  // Language suffix for non-English
  if (svc.language && svc.language !== 'en') parts.push(svc.language);

  var candidate = parts.join('-');

  // Collision check — append numeric suffix if needed
  if (existingIds[candidate]) {
    var n = 2;
    while (existingIds[candidate + '-' + n]) n++;
    candidate = candidate + '-' + n;
  }
  return candidate;
}

function loadJSON() {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function saveJSON(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
}

// Match service by composite key (type + day + time + location_id), fallback to service_num index
function findService(parish, ch) {
  // Primary: match by composite key
  if (ch.service_type && ch.church_id) {
    var match = parish.services.filter(function(s) {
      return s.type === ch.service_type
        && s.location_id === ch.church_id
        && (ch.day ? s.day === ch.day : true)
        && (ch.time ? s.time === ch.time : true);
    });
    if (match.length === 1) return match[0];
    // If multiple matches, prefer exact day+time match
    if (match.length > 1 && ch.day && ch.time) {
      var exact = match.filter(function(s) { return s.day === ch.day && s.time === ch.time; });
      if (exact.length === 1) return exact[0];
    }
  }
  // Fallback: legacy service_num index (1-indexed)
  if (ch.service_num) return parish.services[ch.service_num - 1] || null;
  return null;
}

function findParishByChurchId(data, churchId) {
  for (var i = 0; i < data.parishes.length; i++) {
    var p = data.parishes[i];
    var locs = p.locations || [];
    for (var j = 0; j < locs.length; j++) {
      if (locs[j].id === churchId) return p;
    }
  }
  return null;
}

// ── Gap 3: Enum Validation ──
function validateChange(ch, context) {
  var errors = [];
  if (ch.service_type && !config.SERVICE_TYPES[ch.service_type]) {
    errors.push('invalid service_type: "' + ch.service_type + '"');
  }
  if (ch.day && !config.DAY_TYPES[ch.day]) {
    errors.push('invalid day: "' + ch.day + '"');
  }
  if (ch.language && !config.LANGUAGES[ch.language]) {
    errors.push('invalid language: "' + ch.language + '"');
  }
  if (ch.seasonal && VALID_SEASONS.indexOf(ch.seasonal) < 0) {
    errors.push('invalid seasonal: "' + ch.seasonal + '"');
  }
  if (errors.length) {
    console.error('  REJECT (' + context + '): ' + errors.join('; '));
    return false;
  }
  return true;
}

// ── Source field helper ──
function buildSource(ch) {
  // Derive bulletin date from created_at or fall back to current month
  if (ch.created_at) {
    return 'bulletin_' + ch.created_at.slice(0, 7);
  }
  return 'bulletin_' + new Date().toISOString().slice(0, 7);
}

async function fetchFromSupabase() {
  var sb = require('@supabase/supabase-js');
  var supabase = sb.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  var res = await supabase.from('bulletin_changes')
    .select('*')
    .eq('status', 'approved')
    .order('created_at');
  if (res.error) throw new Error(res.error.message);
  return res.data || [];
}

async function main() {
  // Parse source argument — skip flags like --dry-run
  var source = 'supabase';
  for (var ai = 2; ai < process.argv.length; ai++) {
    if (!process.argv[ai].startsWith('--')) { source = process.argv[ai]; break; }
  }
  var changes;

  if (source !== 'supabase' && fs.existsSync(source)) {
    changes = JSON.parse(fs.readFileSync(source, 'utf8'));
    console.log('Loaded ' + changes.length + ' changes from ' + source);
  } else {
    changes = await fetchFromSupabase();
    console.log('Loaded ' + changes.length + ' approved changes from Supabase');
  }

  if (!changes.length) {
    console.log('No changes to apply.');
    return;
  }

  var data = loadJSON();
  var changelog = [];
  var skipped = 0;

  // Build set of existing service IDs for collision detection (Gap 1)
  var existingIds = {};
  data.parishes.forEach(function(p) {
    (p.services || []).forEach(function(s) {
      if (s.id) existingIds[s.id] = true;
    });
  });

  changes.forEach(function(ch) {
    var parish = findParishByChurchId(data, ch.church_id);
    if (!parish) {
      console.warn('  SKIP: church ' + ch.church_id + ' not found in JSON');
      skipped++;
      return;
    }

    switch (ch.change_type) {
      case 'confirmed':
        // No action — service exists and matches
        break;

      case 'modified':
        // Gap 3: Validate enum fields on the change
        if (ch.field_changed === 'type' && ch.new_value && !config.SERVICE_TYPES[ch.new_value]) {
          console.error('  REJECT (' + parish.name + '): invalid new service_type "' + ch.new_value + '"');
          skipped++;
          return;
        }
        if (ch.field_changed === 'day' && ch.new_value && !config.DAY_TYPES[ch.new_value]) {
          console.error('  REJECT (' + parish.name + '): invalid new day "' + ch.new_value + '"');
          skipped++;
          return;
        }
        if (ch.field_changed === 'language' && ch.new_value && !config.LANGUAGES[ch.new_value]) {
          console.error('  REJECT (' + parish.name + '): invalid new language "' + ch.new_value + '"');
          skipped++;
          return;
        }

        if (ch.field_changed) {
          var svc = findService(parish, ch);
          if (svc) {
            var old = svc[ch.field_changed];
            svc[ch.field_changed] = ch.new_value;
            changelog.push(parish.name + ': ' + ch.field_changed + ' ' + old + ' → ' + ch.new_value);

            // Gap 7: Regenerate ID if key fields changed (type, day, time, location_id)
            var KEY_FIELDS = ['type', 'day', 'time', 'location_id'];
            if (KEY_FIELDS.indexOf(ch.field_changed) >= 0 && svc.id) {
              var oldId = svc.id;
              delete existingIds[oldId];
              var newId = generateServiceId(parish.id, svc, existingIds);
              svc.id = newId;
              existingIds[newId] = true;
              changelog.push(parish.name + ': ID regenerated ' + oldId + ' → ' + newId);
            }
          } else {
            console.warn('  SKIP: no matching service for change in ' + parish.name);
            skipped++;
          }
        }
        break;

      case 'new_service':
        // Gap 3: Validate enums before creating the service
        if (!validateChange(ch, parish.name)) {
          skipped++;
          return;
        }

        var newSvc = {
          type: ch.service_type,
          day: ch.day || null,
          time: ch.time || null,
          end_time: ch.end_time || null,
          language: ch.language || 'en',
          location_id: ch.church_id,
          notes: ch.notes || null,
        };

        // Gap 2: Correct seasonal object construction
        if (ch.seasonal) {
          newSvc.seasonal = { is_seasonal: true, season: ch.seasonal };
        } else {
          newSvc.seasonal = { is_seasonal: false, season: 'year_round' };
        }

        // Gap 4: Bounded service handling
        if (ch.effective_date) newSvc.effective_date = ch.effective_date;
        if (ch.end_date) newSvc.end_date = ch.end_date;

        // Gap 6: Source field
        newSvc.source = buildSource(ch);

        // Gap 1: Generate ID
        newSvc.id = generateServiceId(parish.id, newSvc, existingIds);
        existingIds[newSvc.id] = true;

        parish.services.push(newSvc);
        changelog.push(parish.name + ': NEW ' + ch.service_type + ' ' + (ch.day || '') + ' ' + (ch.time || '') + ' [' + newSvc.id + ']');
        break;

      // Gap 5: Service removal/archival
      case 'removed':
        var removedSvc = findService(parish, ch);
        if (removedSvc) {
          removedSvc.status = 'inactive';
          removedSvc.end_date = removedSvc.end_date || new Date().toISOString().slice(0, 10);
          changelog.push(parish.name + ': REMOVED ' + (removedSvc.type || '') + ' ' + (removedSvc.day || '') + ' ' + (removedSvc.time || ''));
        } else {
          console.warn('  SKIP: no matching service for removal in ' + parish.name);
          skipped++;
        }
        break;

      case 'not_found':
        var notFoundSvc = findService(parish, ch);
        if (notFoundSvc) {
          notFoundSvc._needs_review = true;
          changelog.push(parish.name + ': NOT FOUND IN BULLETIN — ' + (notFoundSvc.type || ''));
        }
        break;

      default:
        // event, notice, and other non-service change types — no action on parish_data.json
        break;
    }
  });

  // Update metadata
  data.metadata.last_bulletin_sync = new Date().toISOString().slice(0, 10);

  // Gap 8: Dry-run mode
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would apply ' + changelog.length + ' changes (' + skipped + ' skipped):');
    changelog.forEach(function(line) { console.log('  • ' + line); });
    console.log('\n[DRY RUN] No files written. No Supabase updates.');
    return;
  }

  saveJSON(data);
  console.log('\nApplied ' + changelog.length + ' changes (' + skipped + ' skipped):');
  changelog.forEach(function(line) { console.log('  • ' + line); });

  // Mark as applied in Supabase if we fetched from there (skip in dry-run)
  if (!DRY_RUN && source === 'supabase' && changes.length) {
    var sb = require('@supabase/supabase-js');
    var supabase = sb.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    var ids = changes.map(function(c) { return c.id; });
    await supabase.from('bulletin_changes')
      .update({ status: 'applied', updated_at: new Date().toISOString() })
      .in('id', ids);
    console.log('Marked ' + ids.length + ' changes as applied in Supabase');
  }
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
