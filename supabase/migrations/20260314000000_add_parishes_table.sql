-- ============================================================
-- MassFinder — Add parishes table
-- The JSON data model is parish-centric (parish → locations → services)
-- but Supabase only has churches (location-level). This migration adds
-- a proper parishes table so the pipeline can work at the parish level.
-- ============================================================

-- ── Parishes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parishes (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  town                TEXT NOT NULL,
  state               TEXT NOT NULL,
  zip                 TEXT,
  county              TEXT,
  established         TEXT,
  is_mission          BOOLEAN DEFAULT FALSE,
  mission_of          TEXT,
  status              TEXT DEFAULT 'active',
  diocese_id          TEXT,               -- nullable for now; FK added when dioceses table exists
  bulletin_url        TEXT,
  is_accessible       BOOLEAN,
  contact             JSONB,             -- { phone, emails[], website, office_hours, ... }
  clergy              JSONB,             -- array of { role, name, email, phone }
  staff               TEXT[],
  validation          JSONB,             -- { status, last_checked, bulletin_date }
  visitation          JSONB,             -- { open_daily, hours_note, source }
  data                JSONB,             -- overflow for pipeline-specific fields
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parishes_state ON parishes (state);
CREATE INDEX idx_parishes_status ON parishes (status);
CREATE INDEX idx_parishes_diocese ON parishes (diocese_id) WHERE diocese_id IS NOT NULL;
CREATE INDEX idx_parishes_town ON parishes (town);

-- ── Add parish_id to churches ────────────────────────────────
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS parish_id TEXT REFERENCES parishes(id) ON DELETE SET NULL;

CREATE INDEX idx_churches_parish_id ON churches (parish_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read parishes" ON parishes FOR SELECT USING (true);

-- ── Trigger ──────────────────────────────────────────────────
CREATE TRIGGER set_parishes_updated_at
  BEFORE UPDATE ON parishes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
