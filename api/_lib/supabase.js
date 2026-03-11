// api/_lib/supabase.js — Shared Supabase client for Vercel serverless functions
// Uses service role key for server-side operations (read/write subscribers, etc.)
// Environment variables set in Vercel project settings.

var { createClient } = require('@supabase/supabase-js');

var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase: supabase };
