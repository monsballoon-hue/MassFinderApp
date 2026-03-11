// api/subscribe.js — Newsletter subscription endpoint
// POST /api/subscribe — { email, name?, parish_ids[], source? }
// GET  /api/subscribe?unsubscribe=TOKEN — one-click unsubscribe

var { supabase } = require('./_lib/supabase.js');

// Simple email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize string input
function clean(str, maxLen) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen || 200);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: Unsubscribe ──
  if (req.method === 'GET') {
    var token = req.query.unsubscribe;
    if (!token) return res.status(400).json({ error: 'Missing unsubscribe token' });

    var { data, error } = await supabase
      .from('subscribers')
      .update({ status: 'unsubscribed' })
      .eq('unsub_token', token)
      .select('email');

    if (error) return res.status(500).json({ error: 'Failed to unsubscribe' });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Subscription not found' });

    // Redirect to a friendly confirmation page
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>Unsubscribed — MassFinder</title>'
      + '<style>body{font-family:Georgia,serif;max-width:480px;margin:60px auto;padding:0 24px;text-align:center;color:#2C3E5A}'
      + 'h1{font-size:24px;margin-bottom:8px}p{font-size:18px;color:#666;line-height:1.6}'
      + 'a{color:#2C3E5A;text-decoration:underline}</style></head>'
      + '<body><h1>You\'ve been unsubscribed</h1>'
      + '<p>You won\'t receive any more emails from MassFinder.</p>'
      + '<p style="margin-top:32px"><a href="/">Back to MassFinder</a></p>'
      + '</body></html>'
    );
  }

  // ── POST: Subscribe ──
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body || {};
  var email = clean(body.email, 254).toLowerCase();
  var name = clean(body.name, 100);
  var parishIds = body.parish_ids;
  var source = clean(body.source, 50) || 'web';

  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Validate parish_ids
  if (!Array.isArray(parishIds) || parishIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one parish.' });
  }

  // Sanitize parish IDs (max 10, must be strings)
  parishIds = parishIds.slice(0, 10).map(function(id) {
    return clean(String(id), 100);
  }).filter(Boolean);

  if (parishIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one parish.' });
  }

  // Upsert: if email exists, update parishes + reactivate
  var { data, error } = await supabase
    .from('subscribers')
    .upsert({
      email: email,
      name: name || null,
      parish_ids: parishIds,
      status: 'active',
      source: source
    }, {
      onConflict: 'email',
      ignoreDuplicates: false
    })
    .select('id');

  if (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  return res.status(200).json({ ok: true, message: 'You\'re subscribed!' });
};
