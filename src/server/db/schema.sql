CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  color TEXT NOT NULL,
  card_color TEXT NOT NULL,
  starting_hp INTEGER NOT NULL,
  max_energy INTEGER NOT NULL,
  starting_deck TEXT NOT NULL,
  starting_relics TEXT NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters_translations (
  character_id TEXT NOT NULL REFERENCES characters(id),
  lang TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (character_id, lang)
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  cost INTEGER,
  is_x_cost INTEGER DEFAULT 0,
  star_cost INTEGER,
  is_x_star_cost INTEGER DEFAULT 0,
  card_type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  target TEXT,
  color TEXT NOT NULL,
  damage INTEGER,
  block INTEGER,
  hit_count INTEGER,
  keywords TEXT,
  tags TEXT,
  vars TEXT,
  upgrade TEXT,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards_translations (
  card_id TEXT NOT NULL REFERENCES cards(id),
  lang TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  description_raw TEXT,
  card_type_localized TEXT NOT NULL,
  rarity_localized TEXT NOT NULL,
  PRIMARY KEY (card_id, lang)
);

CREATE TABLE IF NOT EXISTS keywords (
  id TEXT NOT NULL,
  lang TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
