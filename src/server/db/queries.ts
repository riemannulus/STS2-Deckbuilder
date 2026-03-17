import type { Database } from "bun:sqlite";
import type { Card, Character, Keyword, Relic, Language } from "../../shared/types";

// ── Row shapes from SQLite ────────────────────────────────────────────────────

interface CharacterRow {
  id: string;
  color: string;
  card_color: string;
  starting_hp: number;
  max_energy: number;
  starting_deck: string;
  starting_relics: string;
  image_url: string;
  name: string;
  description: string;
}

interface CardRow {
  id: string;
  cost: number | null;
  is_x_cost: number;
  star_cost: number | null;
  is_x_star_cost: number;
  card_type: string;
  rarity: string;
  target: string | null;
  color: string;
  damage: number | null;
  block: number | null;
  hit_count: number | null;
  keywords: string | null;
  tags: string | null;
  vars: string | null;
  upgrade: string | null;
  image_url: string;
  name: string;
  description: string;
  description_raw: string | null;
  card_type_localized: string;
  rarity_localized: string;
}

interface KeywordRow {
  id: string;
  lang: string;
  name: string;
  description: string;
}

interface RelicRow {
  id: string;
  rarity: string;
  pool: string;
  image_url: string;
  name: string;
  description: string;
  description_raw: string | null;
  flavor: string | null;
  rarity_localized: string;
}

interface SyncMetaRow {
  key: string;
  value: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const rowToCharacter = (row: CharacterRow): Character => ({
  id: row.id,
  name: row.name,
  description: row.description,
  startingHp: row.starting_hp,
  maxEnergy: row.max_energy,
  startingDeck: parseJson<string[]>(row.starting_deck, []),
  startingRelics: parseJson<string[]>(row.starting_relics, []),
  color: row.color,
  cardColor: row.card_color,
  imageUrl: row.image_url,
});

const rowToCard = (row: CardRow): Card => ({
  id: row.id,
  name: row.name,
  description: row.description,
  descriptionRaw: row.description_raw ?? undefined,
  cost: row.cost,
  isXCost: row.is_x_cost === 1,
  isXStarCost: row.is_x_star_cost === 1,
  starCost: row.star_cost,
  type: row.card_type_localized,
  rarity: row.rarity_localized,
  target: row.target,
  color: row.color,
  damage: row.damage,
  block: row.block,
  hitCount: row.hit_count,
  keywords: parseJson<string[]>(row.keywords, []),
  tags: parseJson<string[]>(row.tags, []),
  vars: parseJson<Record<string, number> | null>(row.vars, null),
  upgrade: parseJson<Record<string, string | number> | null>(row.upgrade, null),
  imageUrl: row.image_url,
});

const rowToKeyword = (row: KeywordRow): Keyword => ({
  id: row.id,
  name: row.name,
  description: row.description,
});

const rowToRelic = (row: RelicRow): Relic => ({
  id: row.id,
  name: row.name,
  description: row.description,
  descriptionRaw: row.description_raw ?? undefined,
  flavor: row.flavor ?? "",
  rarity: row.rarity_localized,
  pool: row.pool,
  imageUrl: row.image_url,
});

// ── SQL fragments ─────────────────────────────────────────────────────────────

const CHARACTER_SELECT = `
  SELECT
    c.id, c.color, c.card_color, c.starting_hp, c.max_energy,
    c.starting_deck, c.starting_relics, c.image_url,
    ct.name, ct.description
  FROM characters c
  JOIN characters_translations ct
    ON ct.character_id = c.id AND ct.lang = $lang
`;

const CARD_SELECT = `
  SELECT
    c.id, c.cost, c.is_x_cost, c.star_cost, c.is_x_star_cost,
    c.card_type, c.rarity, c.target, c.color,
    c.damage, c.block, c.hit_count,
    c.keywords, c.tags, c.vars, c.upgrade, c.image_url,
    ct.name, ct.description, ct.description_raw,
    ct.card_type_localized, ct.rarity_localized
  FROM cards c
  JOIN cards_translations ct
    ON ct.card_id = c.id AND ct.lang = $lang
`;

const RELIC_SELECT = `
  SELECT
    r.id, r.rarity, r.pool, r.image_url,
    rt.name, rt.description, rt.description_raw, rt.flavor, rt.rarity_localized
  FROM relics r
  JOIN relics_translations rt
    ON rt.relic_id = r.id AND rt.lang = $lang
`;

// ── Query functions ───────────────────────────────────────────────────────────

export const getCharacters = (db: Database, lang: Language): Character[] => {
  const rows = db
    .prepare<CharacterRow, { $lang: string }>(CHARACTER_SELECT + " ORDER BY c.id")
    .all({ $lang: lang });
  return rows.map(rowToCharacter);
};

export const getCharacterById = (
  db: Database,
  id: string,
  lang: Language,
): Character | null => {
  const row = db
    .prepare<CharacterRow, { $lang: string; $id: string }>(
      CHARACTER_SELECT + " WHERE c.id = $id",
    )
    .get({ $lang: lang, $id: id });
  return row ? rowToCharacter(row) : null;
};

export const getCardsByColor = (
  db: Database,
  color: string,
  lang: Language,
): Card[] => {
  const rows = db
    .prepare<CardRow, { $lang: string; $color: string }>(
      CARD_SELECT + " WHERE c.color = $color ORDER BY c.rarity, c.cost, c.id",
    )
    .all({ $lang: lang, $color: color });
  return rows.map(rowToCard);
};

export const getCardsByIds = (
  db: Database,
  ids: string[],
  lang: Language,
): Card[] => {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$id${i}`).join(", ");
  const params: Record<string, string> = { $lang: lang };
  ids.forEach((id, i) => {
    params[`$id${i}`] = id;
  });
  const rows = db
    .prepare<CardRow, Record<string, string>>(
      CARD_SELECT + ` WHERE c.id IN (${placeholders})`,
    )
    .all(params);
  return rows.map(rowToCard);
};

export const getCardById = (
  db: Database,
  id: string,
  lang: Language,
): Card | null => {
  const row = db
    .prepare<CardRow, { $lang: string; $id: string }>(
      CARD_SELECT + " WHERE c.id = $id",
    )
    .get({ $lang: lang, $id: id });
  return row ? rowToCard(row) : null;
};

export const getAllCards = (db: Database, lang: Language): Card[] => {
  const rows = db
    .prepare<CardRow, { $lang: string }>(
      CARD_SELECT + " ORDER BY c.color, c.rarity, c.cost, c.id",
    )
    .all({ $lang: lang });
  return rows.map(rowToCard);
};

export const getRelics = (db: Database, lang: Language): Relic[] => {
  const rows = db
    .prepare<RelicRow, { $lang: string }>(RELIC_SELECT + " ORDER BY r.pool, r.rarity, r.id")
    .all({ $lang: lang });
  return rows.map(rowToRelic);
};

export const getRelicsByPool = (db: Database, pool: string, lang: Language): Relic[] => {
  const rows = db
    .prepare<RelicRow, { $lang: string; $pool: string }>(
      RELIC_SELECT + " WHERE r.pool = $pool OR r.pool = 'shared' ORDER BY r.rarity, r.id",
    )
    .all({ $lang: lang, $pool: pool });
  return rows.map(rowToRelic);
};

export const getRelicById = (db: Database, id: string, lang: Language): Relic | null => {
  const row = db
    .prepare<RelicRow, { $lang: string; $id: string }>(RELIC_SELECT + " WHERE r.id = $id")
    .get({ $lang: lang, $id: id });
  return row ? rowToRelic(row) : null;
};

export const getRelicsByIds = (db: Database, ids: string[], lang: Language): Relic[] => {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$id${i}`).join(", ");
  const params: Record<string, string> = { $lang: lang };
  ids.forEach((id, i) => {
    params[`$id${i}`] = id;
  });
  const rows = db
    .prepare<RelicRow, Record<string, string>>(
      RELIC_SELECT + ` WHERE r.id IN (${placeholders})`,
    )
    .all(params);
  return rows.map(rowToRelic);
};

export const getKeywords = (db: Database, lang: Language): Keyword[] => {
  const rows = db
    .prepare<KeywordRow, { $lang: string }>(
      "SELECT id, lang, name, description FROM keywords WHERE lang = $lang ORDER BY id",
    )
    .all({ $lang: lang });
  return rows.map(rowToKeyword);
};

export const getSyncMeta = (db: Database): Record<string, string> => {
  const rows = db
    .prepare<SyncMetaRow, []>("SELECT key, value FROM sync_meta")
    .all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
};
