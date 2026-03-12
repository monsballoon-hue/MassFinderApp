#!/usr/bin/env node
// scripts/send-digest.js — Build and send weekly parish digest emails
//
// Usage:
//   node scripts/send-digest.js              # send to all active subscribers
//   node scripts/send-digest.js --preview    # preview HTML for first subscriber only (no send)
//   node scripts/send-digest.js --test EMAIL # send a test to a specific email
//
// Requires: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
// Uses Resend free testing sender (onboarding@resend.dev) until custom domain is set up.

var fs = require('fs');
var path = require('path');
var https = require('https');

// Load env
var envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
}

var RESEND_KEY = process.env.RESEND_API_KEY;
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var APP_URL = process.env.APP_URL || 'https://mass-finder-app.vercel.app';
var FROM_EMAIL = process.env.FROM_EMAIL || 'MassFinder <onboarding@resend.dev>';

if (!RESEND_KEY) { console.error('Missing RESEND_API_KEY'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials'); process.exit(1); }

var { createClient } = require('@supabase/supabase-js');
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Load parish data ──
var parishData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'parish_data.json'), 'utf8'));
var parishes = {};
parishData.parishes.forEach(function(p) {
  parishes[p.id] = p;
});

// ── Load Baltimore Catechism for reflection ──
var baltimoreData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'baltimore-catechism.json'), 'utf8'));

// ── Load Summa for wisdom quote ──
var summaData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'summa-daily.json'), 'utf8'));

// ── Load litcal for Sunday info ──
var now = new Date();
var year = now.getFullYear();
var litcalPath = path.join(__dirname, '..', 'data', 'litcal-' + year + '.json');
var litcalData = null;
if (fs.existsSync(litcalPath)) {
  litcalData = JSON.parse(fs.readFileSync(litcalPath, 'utf8'));
}

// ── Get today's content ──
function getDailyContent() {
  var daysSinceEpoch = Math.floor(now.getTime() / 86400000);

  // Baltimore Q&A
  var baltIdx = daysSinceEpoch % baltimoreData.questions.length;
  var qa = baltimoreData.questions[baltIdx];

  // Summa article
  var summaIdx = daysSinceEpoch % summaData.articles.length;
  var summa = summaData.articles[summaIdx];

  // Sunday liturgical info
  var sunday = _getNextSunday();
  var litInfo = null;
  if (litcalData) {
    var sundayKey = sunday.toISOString().slice(0, 10);
    // litcal data is keyed by ISO date string
    if (litcalData[sundayKey]) {
      litInfo = litcalData[sundayKey];
    }
  }

  return { qa: qa, summa: summa, litInfo: litInfo, sunday: sunday };
}

function _getNextSunday() {
  var d = new Date(now);
  var dayOfWeek = d.getDay();
  var daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSunday);
  return d;
}

// ── Get parish services for a given parish ──
function getParishServices(parishId) {
  var p = parishes[parishId];
  if (!p) return null;

  // Get Sunday masses
  var sundayMasses = [];
  var confessions = [];
  (p.services || []).forEach(function(s) {
    if (s.type === 'sunday_mass') {
      sundayMasses.push(s);
    } else if (s.type === 'confession') {
      confessions.push(s);
    }
  });

  return {
    name: p.name,
    town: p.town,
    state: p.state,
    sundayMasses: sundayMasses,
    confessions: confessions
  };
}

function fmt12(time) {
  if (!time) return '';
  var parts = time.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + m + ' ' + ampm;
}

function fmtDay(day) {
  var DAYS = { sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
  return DAYS[day] || day;
}

// ── Build email HTML ──
function buildEmailHTML(subscriber, content) {
  var parishSections = '';
  subscriber.parish_ids.forEach(function(pid) {
    var info = getParishServices(pid);
    if (!info) return;

    var massLines = '';
    info.sundayMasses.forEach(function(s) {
      var dayLabel = s.day === 'saturday' ? 'Saturday (Vigil)' : fmtDay(s.day);
      massLines += '              <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:15px;">' + dayLabel + '</td>'
        + '<td style="padding:4px 0;font-size:15px;font-weight:600;color:#2C3E5A;">' + fmt12(s.time) + '</td></tr>\n';
    });

    var confLines = '';
    info.confessions.forEach(function(s) {
      var timeStr = s.end_time ? fmt12(s.time) + ' – ' + fmt12(s.end_time) : fmt12(s.time);
      confLines += '              <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:15px;">' + fmtDay(s.day) + '</td>'
        + '<td style="padding:4px 0;font-size:15px;color:#2C3E5A;">' + timeStr + '</td></tr>\n';
    });

    parishSections += ''
      + '      <div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1px solid #E5E2DB;">\n'
      + '        <div style="font-size:18px;font-weight:700;color:#2C3E5A;margin-bottom:4px;">' + _esc(info.name) + '</div>\n'
      + '        <div style="font-size:14px;color:#888;margin-bottom:12px;">' + _esc(info.town) + ', ' + _esc(info.state) + '</div>\n'
      + (massLines ? '        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#B8963F;margin-bottom:6px;">Sunday Masses</div>\n'
        + '        <table style="border-collapse:collapse;margin-bottom:12px;">\n' + massLines + '        </table>\n' : '')
      + (confLines ? '        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#B8963F;margin-bottom:6px;">Confession</div>\n'
        + '        <table style="border-collapse:collapse;">\n' + confLines + '        </table>\n' : '')
      + '      </div>\n';
  });

  // Liturgical info
  var sundayLabel = content.litInfo ? _esc(content.litInfo.name) : 'This Sunday';
  var sundayDate = content.sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Fasting check
  var fastingNote = '';
  if (content.litInfo) {
    var name = (content.litInfo.name || '').toLowerCase();
    if (name.indexOf('ash wednesday') >= 0 || name.indexOf('good friday') >= 0) {
      fastingNote = '<div style="background:#FEF3CD;border-left:3px solid #B8963F;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:15px;color:#856404;">Today is a day of <strong>fasting and abstinence</strong>. Catholics ages 18–59 fast (one full meal, two smaller meals). All Catholics 14+ abstain from meat.</div>';
    }
  }

  var greeting = subscriber.name ? 'Good morning, ' + _esc(subscriber.name) + '!' : 'Good morning!';

  var unsubUrl = APP_URL + '/api/subscribe?unsubscribe=' + subscriber.unsub_token;

  return '<!DOCTYPE html>\n'
    + '<html lang="en">\n'
    + '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>\n'
    + '<body style="margin:0;padding:0;background:#F8F7F4;font-family:Georgia,\'Playfair Display\',serif;">\n'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 20px;">\n'
    + '\n'
    + '  <!-- Header -->\n'
    + '  <div style="text-align:center;margin-bottom:24px;">\n'
    + '    <div style="font-size:22px;font-weight:700;color:#2C3E5A;letter-spacing:-0.01em;">MassFinder</div>\n'
    + '    <div style="font-size:14px;color:#888;margin-top:4px;">Your Weekly Parish Update</div>\n'
    + '  </div>\n'
    + '\n'
    + '  <!-- Greeting -->\n'
    + '  <div style="font-size:20px;color:#2C3E5A;margin-bottom:8px;">' + greeting + '</div>\n'
    + '  <div style="font-size:16px;color:#666;line-height:1.5;margin-bottom:24px;">Here\'s what\'s happening at your parish' + (subscriber.parish_ids.length > 1 ? 'es' : '') + ' this week.</div>\n'
    + '\n'
    + fastingNote
    + '\n'
    + '  <!-- Sunday Info -->\n'
    + '  <div style="background:#2C3E5A;color:#fff;border-radius:12px;padding:16px 20px;margin-bottom:20px;">\n'
    + '    <div style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#B8963F;margin-bottom:4px;">This Sunday · ' + _esc(sundayDate) + '</div>\n'
    + '    <div style="font-size:18px;font-weight:700;">' + sundayLabel + '</div>\n'
    + '  </div>\n'
    + '\n'
    + '  <!-- Parish Schedules -->\n'
    + parishSections
    + '\n'
    + '  <!-- Reflection -->\n'
    + '  <div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;border-left:3px solid #2C3E5A;border:1px solid #E5E2DB;border-left:3px solid #2C3E5A;">\n'
    + '    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#B8963F;margin-bottom:8px;">Daily Catholic Q&amp;A</div>\n'
    + '    <div style="font-size:16px;font-weight:600;color:#2C3E5A;line-height:1.4;margin-bottom:6px;">' + _esc(content.qa.question) + '</div>\n'
    + '    <div style="font-size:15px;color:#555;line-height:1.5;font-style:italic;">' + _esc(content.qa.answer) + '</div>\n'
    + '    <div style="font-size:13px;color:#999;margin-top:8px;">Baltimore Catechism #' + content.qa.id + '</div>\n'
    + '  </div>\n'
    + '\n'
    + '  <!-- Summa Wisdom -->\n'
    + '  <div style="background:#fff;border-radius:12px;padding:20px 24px;margin-bottom:16px;border-left:3px solid #B8963F;border:1px solid #E5E2DB;border-left:3px solid #B8963F;">\n'
    + '    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#B8963F;margin-bottom:8px;">From the Summa Theologica</div>\n'
    + '    <div style="font-size:15px;font-weight:600;color:#2C3E5A;line-height:1.4;margin-bottom:4px;">' + _esc(content.summa.q) + '</div>\n'
    + '    <div style="font-size:14px;color:#666;font-style:italic;margin-bottom:8px;">' + _esc(content.summa.a) + '</div>\n'
    + '    <div style="font-size:15px;color:#444;line-height:1.6;">' + _esc(content.summa.body).substring(0, 300) + '…</div>\n'
    + '    <div style="font-size:13px;color:#999;margin-top:8px;">St. Thomas Aquinas · ' + _esc(content.summa.part) + '</div>\n'
    + '  </div>\n'
    + '\n'
    + '  <!-- CTA -->\n'
    + '  <div style="text-align:center;margin:24px 0;">\n'
    + '    <a href="' + APP_URL + '" style="display:inline-block;background:#2C3E5A;color:#fff;font-family:-apple-system,sans-serif;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">Open MassFinder</a>\n'
    + '  </div>\n'
    + '\n'
    + '  <!-- Footer -->\n'
    + '  <div style="text-align:center;border-top:1px solid #E5E2DB;padding-top:20px;margin-top:20px;">\n'
    + '    <div style="font-size:13px;color:#999;line-height:1.6;font-family:-apple-system,sans-serif;">\n'
    + '      MassFinder · Catholic services for Western New England<br>\n'
    + '      <a href="' + _esc(unsubUrl) + '" style="color:#999;text-decoration:underline;">Unsubscribe</a>\n'
    + '    </div>\n'
    + '  </div>\n'
    + '\n'
    + '</div>\n'
    + '</body>\n'
    + '</html>';
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Send via Resend ──
function sendEmail(to, subject, html) {
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html
    });

    var req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var result = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(result));
        } else {
          reject(new Error('Resend ' + res.statusCode + ': ' + result));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──
async function main() {
  var args = process.argv.slice(2);
  var preview = args.indexOf('--preview') >= 0;
  var testIdx = args.indexOf('--test');
  var testEmail = testIdx >= 0 ? args[testIdx + 1] : null;

  var content = getDailyContent();
  console.log('Sunday:', content.sunday.toISOString().slice(0, 10));
  console.log('Liturgical:', content.litInfo ? content.litInfo.name : '(no litcal data)');
  console.log('Baltimore Q&A #' + content.qa.id + ':', content.qa.question.substring(0, 60) + '...');
  console.log('Summa:', content.summa.q.substring(0, 60) + '...');
  console.log('');

  // Get subscribers
  var subscribers;
  if (testEmail) {
    // Send test to specific email, using first subscriber's parishes or defaults
    var { data } = await supabase.from('subscribers').select('*').eq('status', 'active').limit(1);
    var testSub = (data && data[0]) || { parish_ids: ['parish_079'], name: 'Test User', unsub_token: 'test-token' };
    testSub.email = testEmail;
    subscribers = [testSub];
    console.log('Test mode: sending to', testEmail, 'with parishes:', testSub.parish_ids.join(', '));
  } else {
    var { data, error } = await supabase.from('subscribers').select('*').eq('status', 'active');
    if (error) { console.error('Failed to fetch subscribers:', error.message); process.exit(1); }
    subscribers = data || [];
    console.log('Active subscribers:', subscribers.length);
  }

  if (subscribers.length === 0) { console.log('No subscribers to send to.'); return; }

  var sundayLabel = content.litInfo ? content.litInfo.name : 'This Sunday';
  var subject = sundayLabel + ' — Your Weekly Parish Update';

  for (var i = 0; i < subscribers.length; i++) {
    var sub = subscribers[i];
    var html = buildEmailHTML(sub, content);

    if (preview) {
      var previewPath = path.join(__dirname, '..', 'digest-preview.html');
      fs.writeFileSync(previewPath, html);
      console.log('Preview saved to:', previewPath);
      console.log('Open in browser to see Dorothy\'s email.');
      return;
    }

    try {
      var result = await sendEmail(sub.email, subject, html);
      console.log('  ✓ Sent to', sub.email, '(id:', result.id + ')');
    } catch (err) {
      console.error('  ✗ Failed for', sub.email + ':', err.message);
    }
  }

  console.log('\nDone. ' + subscribers.length + ' email(s) sent.');
}

main().catch(function(err) {
  console.error('Fatal:', err.message);
  process.exit(1);
});
