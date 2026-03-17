import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createDb } from "./connection";
import {
  fetchCharacters,
  fetchCards,
  fetchKeywords,
  fetchRelics,
  type RawCharacter,
  type RawCard,
  type RawKeyword,
  type RawRelic,
} from "../services/spire-codex";
import { CHARACTER_COLOR_MAP, SPIRE_CODEX_BASE_URL } from "../../shared/constants";
import type { Database } from "bun:sqlite";

const downloadImage = async (url: string, destPath: string): Promise<boolean> => {
  if (!url || existsSync(destPath)) return true;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    await Bun.write(destPath, res);
    return true;
  } catch {
    return false;
  }
};

const downloadAllImages = async (db: Database): Promise<void> => {
  await mkdir("public/images/cards", { recursive: true });
  await mkdir("public/images/characters", { recursive: true });
  await mkdir("public/images/relics", { recursive: true });

  const cards = db.prepare("SELECT id, image_url FROM cards WHERE image_url LIKE 'http%'").all() as any[];
  const chars = db.prepare("SELECT id, image_url FROM characters WHERE image_url LIKE 'http%'").all() as any[];
  const relics = db.prepare("SELECT id, image_url FROM relics WHERE image_url LIKE 'http%'").all() as any[];

  const updateCardUrl = db.prepare("UPDATE cards SET image_url = $local WHERE id = $id");
  const updateCharUrl = db.prepare("UPDATE characters SET image_url = $local WHERE id = $id");
  const updateRelicUrl = db.prepare("UPDATE relics SET image_url = $local WHERE id = $id");

  const batchSize = 10;
  let downloaded = 0;
  let failed = 0;

  // Process cards
  console.log(`Downloading ${cards.length} card images...`);
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (card: any) => {
        const filename = card.image_url.split("/").pop();
        const localPath = `public/images/cards/${filename}`;
        const ok = await downloadImage(card.image_url, localPath);
        if (ok) {
          updateCardUrl.run({ $local: `/images/cards/${filename}`, $id: card.id });
        }
        return ok;
      })
    );
    downloaded += results.filter(Boolean).length;
    failed += results.filter((r) => !r).length;
    if ((i + batchSize) % 50 === 0 || i + batchSize >= cards.length) {
      console.log(`  Cards: ${Math.min(i + batchSize, cards.length)}/${cards.length}`);
    }
  }

  // Process characters
  console.log(`Downloading ${chars.length} character images...`);
  for (const char of chars) {
    const filename = char.image_url.split("/").pop();
    const localPath = `public/images/characters/${filename}`;
    const ok = await downloadImage(char.image_url, localPath);
    if (ok) {
      updateCharUrl.run({ $local: `/images/characters/${filename}`, $id: char.id });
    }
  }

  // Process relics
  console.log(`Downloading ${relics.length} relic images...`);
  for (let i = 0; i < relics.length; i += batchSize) {
    const batch = relics.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (relic: any) => {
        const filename = relic.image_url.split("/").pop();
        const localPath = `public/images/relics/${filename}`;
        const ok = await downloadImage(relic.image_url, localPath);
        if (ok) {
          updateRelicUrl.run({ $local: `/images/relics/${filename}`, $id: relic.id });
        }
      })
    );
    if ((i + batchSize) % 50 === 0 || i + batchSize >= relics.length) {
      console.log(`  Relics: ${Math.min(i + batchSize, relics.length)}/${relics.length}`);
    }
  }

  console.log(`Images downloaded: ${downloaded} cards, ${chars.length} characters, ${relics.length} relics. Failed: ${failed}`);
};

const resolveImageUrl = (url: string | null | undefined): string =>
  !url ? "" : url.startsWith("http") ? url : `${SPIRE_CODEX_BASE_URL}${url}`;

const toJson = (value: unknown): string | null =>
  value != null ? JSON.stringify(value) : null;

/** Convert camelCase ID (e.g. "StrikeIronclad") to UPPER_SNAKE_CASE ("STRIKE_IRONCLAD") */
const toSnakeUpperCase = (id: string): string =>
  id.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();

/** Convert an array of camelCase IDs to UPPER_SNAKE_CASE */
const convertIds = (ids: string[]): string[] => ids.map(toSnakeUpperCase);

const seed = async (): Promise<void> => {
  const db = createDb();

  console.log("Clearing existing data...");
  db.exec("DELETE FROM sync_meta");
  db.exec("DELETE FROM keywords");
  db.exec("DELETE FROM relics_translations");
  db.exec("DELETE FROM relics");
  db.exec("DELETE FROM cards_translations");
  db.exec("DELETE FROM cards");
  db.exec("DELETE FROM characters_translations");
  db.exec("DELETE FROM characters");

  // ── Characters ───────────────────────────────────────────────────────────

  console.log("Fetching characters (en)...");
  const charsEn: RawCharacter[] = await fetchCharacters("en");

  console.log("Fetching characters (ko)...");
  const charsKo: RawCharacter[] = await fetchCharacters("ko");

  const charsKoById = new Map(charsKo.map((c) => [c.id, c]));

  const insertCharacter = db.prepare(`
    INSERT OR REPLACE INTO characters
      (id, color, card_color, starting_hp, max_energy, starting_deck, starting_relics, image_url)
    VALUES ($id, $color, $card_color, $starting_hp, $max_energy, $starting_deck, $starting_relics, $image_url)
  `);

  const insertCharacterTranslation = db.prepare(`
    INSERT OR REPLACE INTO characters_translations
      (character_id, lang, name, description)
    VALUES ($character_id, $lang, $name, $description)
  `);

  const insertCharactersAll = db.transaction((chars: RawCharacter[]) => {
    for (const c of chars) {
      const cardColor = CHARACTER_COLOR_MAP[c.color] ?? c.color;
      insertCharacter.run({
        $id: c.id,
        $color: c.color,
        $card_color: cardColor,
        $starting_hp: c.starting_hp,
        $max_energy: c.max_energy,
        $starting_deck: JSON.stringify(convertIds(c.starting_deck)),
        $starting_relics: JSON.stringify(convertIds(c.starting_relics)),
        $image_url: resolveImageUrl(c.image_url),
      });

      insertCharacterTranslation.run({
        $character_id: c.id,
        $lang: "en",
        $name: c.name,
        $description: c.description,
      });

      const ko = charsKoById.get(c.id);
      if (ko) {
        insertCharacterTranslation.run({
          $character_id: c.id,
          $lang: "ko",
          $name: ko.name,
          $description: ko.description,
        });
      }
    }
  });

  insertCharactersAll(charsEn);
  console.log(`Inserted ${charsEn.length} characters`);

  // ── Cards ─────────────────────────────────────────────────────────────────

  console.log("Fetching cards (en)...");
  const cardsEn: RawCard[] = await fetchCards("en");

  console.log("Fetching cards (ko)...");
  const cardsKo: RawCard[] = await fetchCards("ko");

  const cardsKoById = new Map(cardsKo.map((c) => [c.id, c]));

  const insertCard = db.prepare(`
    INSERT OR REPLACE INTO cards
      (id, cost, is_x_cost, star_cost, is_x_star_cost, card_type, rarity, target, color,
       damage, block, hit_count, keywords, tags, vars, upgrade, image_url)
    VALUES
      ($id, $cost, $is_x_cost, $star_cost, $is_x_star_cost, $card_type, $rarity, $target, $color,
       $damage, $block, $hit_count, $keywords, $tags, $vars, $upgrade, $image_url)
  `);

  const insertCardTranslation = db.prepare(`
    INSERT OR REPLACE INTO cards_translations
      (card_id, lang, name, description, description_raw, card_type_localized, rarity_localized)
    VALUES
      ($card_id, $lang, $name, $description, $description_raw, $card_type_localized, $rarity_localized)
  `);

  const insertCardsAll = db.transaction((cards: RawCard[]) => {
    for (const c of cards) {
      insertCard.run({
        $id: c.id,
        $cost: c.cost ?? null,
        $is_x_cost: c.is_x_cost ? 1 : 0,
        $star_cost: c.star_cost ?? null,
        $is_x_star_cost: c.is_x_star_cost ? 1 : 0,
        $card_type: c.type,
        $rarity: c.rarity,
        $target: c.target ?? null,
        $color: c.color,
        $damage: c.damage ?? null,
        $block: c.block ?? null,
        $hit_count: c.hit_count ?? null,
        $keywords: toJson(c.keywords),
        $tags: toJson(c.tags),
        $vars: toJson(c.vars),
        $upgrade: toJson(c.upgrade),
        $image_url: resolveImageUrl(c.image_url),
      });

      insertCardTranslation.run({
        $card_id: c.id,
        $lang: "en",
        $name: c.name,
        $description: c.description,
        $description_raw: c.description_raw ?? null,
        $card_type_localized: c.type,
        $rarity_localized: c.rarity,
      });

      const ko = cardsKoById.get(c.id);
      if (ko) {
        insertCardTranslation.run({
          $card_id: c.id,
          $lang: "ko",
          $name: ko.name,
          $description: ko.description,
          $description_raw: ko.description_raw ?? null,
          $card_type_localized: ko.type,
          $rarity_localized: ko.rarity,
        });
      }
    }
  });

  insertCardsAll(cardsEn);
  console.log(`Inserted ${cardsEn.length} cards`);

  // ── Keywords ──────────────────────────────────────────────────────────────

  console.log("Fetching keywords (en)...");
  const keywordsEn: RawKeyword[] = await fetchKeywords("en");

  console.log("Fetching keywords (ko)...");
  const keywordsKo: RawKeyword[] = await fetchKeywords("ko");

  const insertKeyword = db.prepare(`
    INSERT OR REPLACE INTO keywords (id, lang, name, description)
    VALUES ($id, $lang, $name, $description)
  `);

  const insertKeywordsAll = db.transaction(
    (rows: Array<RawKeyword & { lang: string }>) => {
      for (const k of rows) {
        insertKeyword.run({
          $id: k.id,
          $lang: k.lang,
          $name: k.name,
          $description: k.description,
        });
      }
    },
  );

  const allKeywordRows = [
    ...keywordsEn.map((k) => ({ ...k, lang: "en" })),
    ...keywordsKo.map((k) => ({ ...k, lang: "ko" })),
  ];
  insertKeywordsAll(allKeywordRows);
  console.log(`Inserted ${keywordsEn.length} keywords (en) + ${keywordsKo.length} keywords (ko)`);

  // ── Relics ────────────────────────────────────────────────────────────────

  console.log("Fetching relics (en)...");
  const relicsEn: RawRelic[] = await fetchRelics("en");

  console.log("Fetching relics (ko)...");
  const relicsKo: RawRelic[] = await fetchRelics("ko");

  const relicsKoById = new Map(relicsKo.map((r) => [r.id, r]));

  const insertRelic = db.prepare(`
    INSERT OR REPLACE INTO relics
      (id, rarity, pool, image_url)
    VALUES ($id, $rarity, $pool, $image_url)
  `);

  const insertRelicTranslation = db.prepare(`
    INSERT OR REPLACE INTO relics_translations
      (relic_id, lang, name, description, description_raw, flavor, rarity_localized)
    VALUES ($relic_id, $lang, $name, $description, $description_raw, $flavor, $rarity_localized)
  `);

  const insertRelicsAll = db.transaction((relics: RawRelic[]) => {
    for (const r of relics) {
      insertRelic.run({
        $id: r.id,
        $rarity: r.rarity,
        $pool: r.pool,
        $image_url: resolveImageUrl(r.image_url),
      });

      insertRelicTranslation.run({
        $relic_id: r.id,
        $lang: "en",
        $name: r.name,
        $description: r.description,
        $description_raw: r.description_raw ?? null,
        $flavor: r.flavor ?? null,
        $rarity_localized: r.rarity,
      });

      const ko = relicsKoById.get(r.id);
      if (ko) {
        insertRelicTranslation.run({
          $relic_id: r.id,
          $lang: "ko",
          $name: ko.name,
          $description: ko.description,
          $description_raw: ko.description_raw ?? null,
          $flavor: ko.flavor ?? null,
          $rarity_localized: ko.rarity,
        });
      }
    }
  });

  insertRelicsAll(relicsEn);
  console.log(`Inserted ${relicsEn.length} relics`);

  // ── Sync meta ─────────────────────────────────────────────────────────────

  const insertMeta = db.prepare(`
    INSERT OR REPLACE INTO sync_meta (key, value, updated_at)
    VALUES ($key, $value, datetime('now'))
  `);

  insertMeta.run({ $key: "last_sync", $value: new Date().toISOString() });
  insertMeta.run({ $key: "cards_count", $value: String(cardsEn.length) });
  insertMeta.run({ $key: "characters_count", $value: String(charsEn.length) });
  insertMeta.run({ $key: "keywords_count", $value: String(keywordsEn.length) });
  insertMeta.run({ $key: "relics_count", $value: String(relicsEn.length) });

  await downloadAllImages(db);
  db.close();
  console.log("Seed complete.");
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
