-- ============================================================
-- Newsletter Subscribers
-- Simple email subscription for weekly parish digest
-- ============================================================

CREATE TABLE IF NOT EXISTS subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  parish_ids      TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  unsub_token     UUID NOT NULL DEFAULT gen_random_uuid(),
  source          TEXT DEFAULT 'web',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on email (one subscription per email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);

-- Fast lookup for unsubscribe tokens
CREATE INDEX IF NOT EXISTS idx_subscribers_unsub_token ON subscribers (unsub_token);

-- Fast lookup for active subscribers by parish
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers (status) WHERE status = 'active';

-- Auto-update trigger
CREATE TRIGGER set_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: public can insert (subscribe), but not read others' data
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (subscribe form)
CREATE POLICY "Allow public subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Only service role can read/update (for sending emails + unsubscribe)
CREATE POLICY "Service role full access" ON subscribers
  FOR ALL USING (auth.role() = 'service_role');
