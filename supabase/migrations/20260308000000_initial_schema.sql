-- ============================================================
-- MassFinder V2 — Consolidated Schema
-- Combines migrations 001-008 from the original repo
-- ============================================================

-- ── Auto-update trigger function ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Churches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS churches (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  short_name          TEXT,
  type                TEXT,
  address             TEXT,
  city                TEXT NOT NULL,
  state               TEXT NOT NULL,
  zip                 TEXT,
  county              TEXT,
  lat                 FLOAT,
  lng                 FLOAT,
  phone               TEXT,
  phone_secondary     TEXT,
  website             TEXT,
  emails              TEXT[],
  office_hours        TEXT,
  office_address      TEXT,
  mailing_address     TEXT,
  instagram           TEXT,
  facebook            TEXT,
  contact_notes       TEXT,
  established         TEXT,
  status              TEXT DEFAULT 'active',
  is_accessible       BOOLEAN,
  accessibility_notes TEXT,
  bulletin_url        TEXT,
  bulletin_group      TEXT,
  bulletin_url_note   TEXT,
  clergy              JSONB,
  staff               TEXT[],
  validation          JSONB,
  visitation          JSONB,
  notes               TEXT,
  data                JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_churches_city ON churches (city);
CREATE INDEX idx_churches_state ON churches (state);
CREATE INDEX idx_churches_status ON churches (status);
CREATE INDEX idx_churches_bulletin_group ON churches (bulletin_group);

-- ── Services ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                  TEXT PRIMARY KEY,
  church_id           TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  day                 TEXT,
  time                TEXT,
  end_time            TEXT,
  language            TEXT DEFAULT 'en',
  languages           TEXT[],
  notes               TEXT,
  title               TEXT,
  category            TEXT,
  times_vary          BOOLEAN DEFAULT FALSE,
  time_is_inferred    BOOLEAN DEFAULT FALSE,
  perpetual           BOOLEAN DEFAULT FALSE,
  rite                TEXT,
  status              TEXT DEFAULT 'active',
  source              TEXT,
  date                TEXT,
  effective_date      TEXT,
  end_date            TEXT,
  note_expires        TEXT,
  location            TEXT,
  language_note       TEXT,
  recurrence          JSONB,
  seasonal            JSONB,
  data                JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_church_id ON services (church_id);
CREATE INDEX idx_services_type ON services (type);
CREATE INDEX idx_services_day ON services (day);
CREATE INDEX idx_services_church_type_day ON services (church_id, type, day);

-- ── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                  TEXT PRIMARY KEY,
  church_id           TEXT REFERENCES churches(id) ON DELETE SET NULL,
  category            TEXT NOT NULL,
  title               TEXT NOT NULL,
  type                TEXT,
  description         TEXT,
  date                TEXT,
  dates               TEXT[],
  day                 TEXT,
  time                TEXT,
  end_time            TEXT,
  end_date            TEXT,
  venue_name          TEXT,
  venue_address       TEXT,
  venue_lat           FLOAT,
  venue_lng           FLOAT,
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  image_url           TEXT,
  flyer_url           TEXT,
  registration_url    TEXT,
  tags                TEXT[],
  notes               TEXT,
  social              BOOLEAN DEFAULT FALSE,
  service_id          TEXT,
  data                JSONB,
  status              TEXT DEFAULT 'active',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_church_id ON events (church_id);
CREATE INDEX idx_events_category ON events (category);

-- ── Metadata ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metadata (
  key                 TEXT PRIMARY KEY,
  data                JSONB NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bulletins ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletins (
  id              SERIAL PRIMARY KEY,
  church_id       TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  bulletin_date   DATE NOT NULL,
  source_url      TEXT,
  source_domain   TEXT,
  page_count      INT,
  pdf_path        TEXT,
  status          TEXT DEFAULT 'pending',
  parsed_at       TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     TEXT,
  raw_extraction  JSONB,
  parse_cost_usd  FLOAT,
  parse_model     TEXT,
  notes           TEXT,
  pipeline_version INT DEFAULT 1,
  text_quality    TEXT,
  text_method     TEXT,
  services_confirmed INT,
  services_total  INT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, bulletin_date)
);

CREATE INDEX idx_bulletins_church_id ON bulletins (church_id);
CREATE INDEX idx_bulletins_status ON bulletins (status);
CREATE INDEX idx_bulletins_date ON bulletins (bulletin_date);

-- ── Bulletin Items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulletin_items (
  id              SERIAL PRIMARY KEY,
  bulletin_id     INT NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
  church_id       TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE,
  event_time      TEXT,
  end_time        TEXT,
  end_date        DATE,
  location        TEXT,
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  registration_url TEXT,
  recurring       TEXT,
  tags            TEXT[],
  source_page     INT,
  confidence      FLOAT,
  is_new          BOOLEAN DEFAULT TRUE,
  status          TEXT DEFAULT 'pending',
  data            JSONB,
  item_type       TEXT DEFAULT 'event',
  original_text   TEXT,
  seasonal        TEXT,
  language        TEXT,
  host_parish     TEXT,
  day             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulletin_items_bulletin_id ON bulletin_items (bulletin_id);
CREATE INDEX idx_bulletin_items_church_id ON bulletin_items (church_id);
CREATE INDEX idx_bulletin_items_category ON bulletin_items (category);
CREATE INDEX idx_bulletin_items_status ON bulletin_items (status);
CREATE INDEX idx_bulletin_items_event_date ON bulletin_items (event_date);
CREATE INDEX idx_bulletin_items_type ON bulletin_items (item_type);
CREATE INDEX idx_bulletin_items_seasonal ON bulletin_items (seasonal) WHERE seasonal IS NOT NULL;
CREATE INDEX idx_bulletin_items_day ON bulletin_items (day) WHERE day IS NOT NULL;
CREATE INDEX idx_bulletin_items_search ON bulletin_items
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_text, '') || ' ' || coalesce(description, '')));

-- ── Parish Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parish_profiles (
  church_id           TEXT PRIMARY KEY REFERENCES churches(id) ON DELETE CASCADE,
  bulletin_publisher  TEXT,
  typical_page_count  INT,
  page_layout_notes   TEXT,
  known_recurring     TEXT[],
  common_locations    TEXT[],
  parsing_notes       TEXT,
  last_accuracy_pct   FLOAT,
  total_parsed        INT DEFAULT 0,
  total_corrections   INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bulletin Changes (editorial pipeline) ────────────────────
CREATE TABLE IF NOT EXISTS bulletin_changes (
  id              SERIAL PRIMARY KEY,
  bulletin_id     INT NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
  church_id       TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  change_type     TEXT NOT NULL CHECK (change_type IN (
    'confirmed', 'modified', 'not_found',
    'new_service', 'event', 'notice'
  )),

  service_num     INT,
  service_id      TEXT,

  field_changed   TEXT,
  old_value       TEXT,
  new_value       TEXT,

  service_type    TEXT,
  day             TEXT,
  time            TEXT,
  end_time        TEXT,
  language        TEXT,
  seasonal        TEXT,

  title           TEXT,
  description     TEXT,
  event_date      DATE,
  event_time      TEXT,
  event_end_time  TEXT,
  location        TEXT,
  category        TEXT,
  effective_date  DATE,

  notes           TEXT,
  confidence      FLOAT,
  source_page     INT,
  venue_name      TEXT,
  venue_address   TEXT,
  recurrence_type TEXT CHECK (recurrence_type IN ('once', 'series', 'weekly')),
  dates           TEXT[],

  status          TEXT DEFAULT 'pending' CHECK (status IN (
    'auto_confirmed', 'pending', 'approved', 'rejected', 'applied'
  )),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulletin_changes_bulletin ON bulletin_changes (bulletin_id);
CREATE INDEX idx_bulletin_changes_church ON bulletin_changes (church_id);
CREATE INDEX idx_bulletin_changes_type ON bulletin_changes (change_type);
CREATE INDEX idx_bulletin_changes_status ON bulletin_changes (status);
CREATE INDEX idx_bulletin_changes_pending ON bulletin_changes (status)
  WHERE status = 'pending';

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parish_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read churches" ON churches FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read metadata" ON metadata FOR SELECT USING (true);
CREATE POLICY "Public read bulletins" ON bulletins FOR SELECT USING (true);
CREATE POLICY "Public read bulletin_items" ON bulletin_items FOR SELECT USING (true);
CREATE POLICY "Public read parish_profiles" ON parish_profiles FOR SELECT USING (true);
CREATE POLICY "Public read bulletin_changes" ON bulletin_changes FOR SELECT USING (true);

-- ── Triggers ─────────────────────────────────────────────────
CREATE TRIGGER set_churches_updated_at
  BEFORE UPDATE ON churches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_metadata_updated_at
  BEFORE UPDATE ON metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_bulletins_updated_at
  BEFORE UPDATE ON bulletins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_bulletin_items_updated_at
  BEFORE UPDATE ON bulletin_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_parish_profiles_updated_at
  BEFORE UPDATE ON parish_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_bulletin_changes_updated_at
  BEFORE UPDATE ON bulletin_changes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
