// scripts/apply-changes.js
// Reads approved bulletin_changes → patches parish_data.json
// Run: node scripts/apply-changes.js [supabase | path/to/changes.json]

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

var jsonPath = path.join(__dirname, '..', 'parish_data.json');

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
  var source = process.argv[2] || 'supabase';
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

  changes.forEach(function(ch) {
    var parish = findParishByChurchId(data, ch.church_id);
    if (!parish) {
      console.warn('  SKIP: church ' + ch.church_id + ' not found in JSON');
      return;
    }

    switch (ch.change_type) {
      case 'confirmed':
        // No action — service exists and matches
        break;

      case 'modified':
        if (ch.field_changed) {
          var svc = findService(parish, ch);
          if (svc) {
            var old = svc[ch.field_changed];
            svc[ch.field_changed] = ch.new_value;
            changelog.push(parish.name + ': ' + ch.field_changed + ' ' + old + ' → ' + ch.new_value);
          } else {
            console.warn('  SKIP: no matching service for change in ' + parish.name);
          }
        }
        break;

      case 'new_service':
        var newSvc = {
          type: ch.service_type,
          day: ch.day || null,
          time: ch.time || null,
          end_time: ch.end_time || null,
          language: ch.language || 'en',
          location_id: ch.church_id,
          notes: ch.notes || null,
        };
        if (ch.seasonal) newSvc.seasonal = { season: ch.seasonal };
        parish.services.push(newSvc);
        changelog.push(parish.name + ': NEW ' + ch.service_type + ' ' + (ch.day || '') + ' ' + (ch.time || ''));
        break;

      case 'not_found':
        var notFoundSvc = findService(parish, ch);
        if (notFoundSvc) {
          notFoundSvc._needs_review = true;
          changelog.push(parish.name + ': NOT FOUND IN BULLETIN — ' + (notFoundSvc.type || ''));
        }
        break;
    }
  });

  // Update metadata
  data.metadata.last_bulletin_sync = new Date().toISOString().slice(0, 10);

  saveJSON(data);
  console.log('\nApplied ' + changelog.length + ' changes:');
  changelog.forEach(function(line) { console.log('  • ' + line); });

  // Mark as applied in Supabase if we fetched from there
  if (source === 'supabase' && changes.length) {
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
