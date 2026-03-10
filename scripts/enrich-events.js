#!/usr/bin/env node
// scripts/enrich-events.js — Parse event notes into structured fields using Claude
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node scripts/enrich-events.js [--dry-run] [--limit N]
//
// Reads events.json, sends each community event's notes to Claude Haiku,
// and writes enriched data back to events.json.
//
// Fields extracted from notes:
//   - description: Clean prose summary of the event
//   - contact_name, contact_email: Contact info if mentioned
//   - price: Cost/ticket info (new field)
//   - registration_info: How to register/get tickets (new field)
//
// Cost estimate: ~$0.50-1.00 for all 175 events using Haiku

var fs = require('fs');
var path = require('path');

var EVENTS_PATH = path.join(__dirname, '..', 'events.json');
var DRY_RUN = process.argv.includes('--dry-run');
var LIMIT = (function() {
  var idx = process.argv.indexOf('--limit');
  return idx >= 0 && process.argv[idx + 1] ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

var API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('Error: Set ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

// Rate limiting: 500ms between requests
var DELAY_MS = 500;

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function callClaude(prompt) {
  // Use fetch directly against the Anthropic API — no SDK dependency needed
  var resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) {
    var errText = await resp.text();
    throw new Error('API error ' + resp.status + ': ' + errText);
  }
  var data = await resp.json();
  return data.content[0].text;
}

function buildPrompt(event) {
  return 'You are parsing a Catholic community event listing. Extract structured information from the notes field.\n\n'
    + 'Event title: ' + event.title + '\n'
    + 'Category: ' + (event.category || 'unknown') + '\n'
    + 'Notes: ' + event.notes + '\n\n'
    + 'Return ONLY a JSON object (no markdown, no explanation) with these fields:\n'
    + '- "description": A clean 1-2 sentence summary of what the event is and what attendees can expect. Do NOT repeat the title. If the notes are just logistical details with no real description, set to null.\n'
    + '- "contact_name": Name of a contact person if mentioned, otherwise null.\n'
    + '- "contact_email": Email address if mentioned, otherwise null.\n'
    + '- "contact_phone": Phone number if mentioned, otherwise null.\n'
    + '- "price": Ticket/entry cost information as a brief string (e.g., "Adults $20, Children $10"), or null if free/not mentioned.\n'
    + '- "registration_info": How to register, buy tickets, or RSVP — brief string, or null if just show up.\n\n'
    + 'Rules:\n'
    + '- Only extract what is explicitly stated in the notes. Do not invent information.\n'
    + '- For description, write in third person present tense ("Features live music and dancing").\n'
    + '- Keep price as a compact string, not a paragraph.\n'
    + '- If notes only contain a date/time or very minimal info, set description to null.\n';
}

async function main() {
  var raw = fs.readFileSync(EVENTS_PATH, 'utf8');
  var data = JSON.parse(raw);
  var events = data.events;

  // Filter: community events with notes, no description yet
  var targets = events.filter(function(e) {
    return e.category !== 'yc' && e.notes && e.notes.length > 20 && !e.description;
  });

  console.log('Total events:', events.length);
  console.log('Community events with notes (>20 chars):', targets.length);
  console.log('Limit:', LIMIT === Infinity ? 'all' : LIMIT);
  console.log('Dry run:', DRY_RUN);
  console.log('');

  if (DRY_RUN) {
    targets.slice(0, Math.min(LIMIT, 5)).forEach(function(e) {
      console.log('[' + e.category + '] ' + e.title);
      console.log('  notes: ' + e.notes.slice(0, 120) + (e.notes.length > 120 ? '...' : ''));
      console.log('');
    });
    console.log('Would process', Math.min(targets.length, LIMIT), 'events.');
    return;
  }

  var processed = 0, errors = 0, enriched = 0;

  for (var i = 0; i < Math.min(targets.length, LIMIT); i++) {
    var evt = targets[i];
    processed++;
    process.stdout.write('[' + processed + '/' + Math.min(targets.length, LIMIT) + '] ' + evt.title + '... ');

    try {
      var result = await callClaude(buildPrompt(evt));
      // Parse JSON from response — handle potential markdown wrapping
      var jsonStr = result.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      var parsed = JSON.parse(jsonStr);

      // Apply enrichments to the original event object
      var changed = false;
      if (parsed.description && parsed.description !== 'null') {
        evt.description = parsed.description;
        changed = true;
      }
      if (parsed.contact_name && !evt.contact_name) {
        evt.contact_name = parsed.contact_name;
        changed = true;
      }
      if (parsed.contact_email && !evt.contact_email) {
        evt.contact_email = parsed.contact_email;
        changed = true;
      }
      if (parsed.contact_phone && !evt.contact_phone) {
        evt.contact_phone = parsed.contact_phone;
        changed = true;
      }
      if (parsed.price) {
        evt.price = parsed.price;
        changed = true;
      }
      if (parsed.registration_info) {
        evt.registration_info = parsed.registration_info;
        changed = true;
      }

      if (changed) {
        enriched++;
        console.log('enriched');
      } else {
        console.log('no new data');
      }
    } catch (e) {
      errors++;
      console.log('ERROR: ' + e.message);
    }

    if (i < Math.min(targets.length, LIMIT) - 1) await sleep(DELAY_MS);
  }

  // Write back
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log('');
  console.log('Done! Processed:', processed, '| Enriched:', enriched, '| Errors:', errors);
  console.log('Written to:', EVENTS_PATH);
}

main().catch(function(e) { console.error(e); process.exit(1); });
