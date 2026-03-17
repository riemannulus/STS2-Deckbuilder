import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { createDb } from "../server/db/connection";
import * as Q from "../server/db/queries";

// ---------------------------------------------------------------------------
// In-memory DB setup
// ---------------------------------------------------------------------------

let db: Database;

beforeAll(() => {
  db = createDb(":memory:");

  // ── Characters ────────────────────────────────────────────────────────────
  db.exec(`
    INSERT INTO characters
      (id, color, card_color, starting_hp, max_energy, starting_deck, starting_relics, image_url)
    VALUES
      ('IRONCLAD', 'red', 'ironclad', 80, 3,
       '["STRIKE_IRONCLAD","STRIKE_IRONCLAD","DEFEND_IRONCLAD","DEFEND_IRONCLAD","BASH"]',
       '["BURNING_BLOOD"]', '/ironclad.png'),
      ('SILENT', 'green', 'silent', 70, 3,
       '["STRIKE_SILENT","STRIKE_SILENT","DEFEND_SILENT","DEFEND_SILENT","SURVIVOR"]',
       '["RING_OF_THE_SNAKE"]', '/silent.png')
  `);

  db.exec(`
    INSERT INTO characters_translations (character_id, lang, name, description)
    VALUES
      ('IRONCLAD', 'en', 'The Ironclad', 'A powerful warrior.'),
      ('IRONCLAD', 'ko', '아이언클래드', '강력한 전사.'),
      ('SILENT', 'en', 'The Silent', 'A deadly rogue.'),
      ('SILENT', 'ko', '사일런트', '치명적인 도적.')
  `);

  // ── Cards ─────────────────────────────────────────────────────────────────
  db.exec(`
    INSERT INTO cards
      (id, cost, is_x_cost, star_cost, is_x_star_cost, card_type, rarity,
       target, color, damage, block, hit_count, keywords, tags, vars, upgrade, image_url)
    VALUES
      ('STRIKE_IRONCLAD', 1, 0, NULL, 0, 'Attack', 'Basic',
       'AnyEnemy', 'ironclad', 6, NULL, 1,
       '[]', '[]', NULL, '{"damage":9}', '/strike.png'),
      ('DEFEND_IRONCLAD', 1, 0, NULL, 0, 'Skill', 'Basic',
       NULL, 'ironclad', NULL, 5, NULL,
       '[]', '[]', NULL, '{"block":8}', '/defend.png'),
      ('BASH', 2, 0, NULL, 0, 'Attack', 'Basic',
       'AnyEnemy', 'ironclad', 8, NULL, 1,
       '["Vulnerable"]', '[]', NULL, '{"damage":10,"vulnerable":3}', '/bash.png'),
      ('INFLAME', 1, 0, NULL, 0, 'Power', 'Common',
       NULL, 'ironclad', NULL, NULL, NULL,
       '[]', '[]', '{"amount":2}', '{"amount":3}', '/inflame.png'),
      ('WHIRLWIND', -1, 1, NULL, 0, 'Attack', 'Rare',
       'AllEnemies', 'ironclad', 5, NULL, NULL,
       '[]', '[]', NULL, NULL, '/whirlwind.png'),
      ('SHIV', 0, 0, NULL, 0, 'Attack', 'Common',
       'AnyEnemy', 'silent', 4, NULL, 1,
       '["Exhaust"]', '[]', NULL, '{"damage":6}', '/shiv.png'),
      ('NEUTRALIZE', 0, 0, NULL, 0, 'Attack', 'Basic',
       'AnyEnemy', 'silent', 3, NULL, 1,
       '["Weak"]', '[]', NULL, '{"damage":4,"weak":2}', '/neutralize.png')
  `);

  db.exec(`
    INSERT INTO cards_translations
      (card_id, lang, name, description, description_raw, card_type_localized, rarity_localized)
    VALUES
      ('STRIKE_IRONCLAD', 'en', 'Strike', 'Deal 6 damage.', 'Deal !D! damage.', 'Attack', 'Basic'),
      ('STRIKE_IRONCLAD', 'ko', '강타', '6의 피해를 입힙니다.', NULL, '공격', '기본'),
      ('DEFEND_IRONCLAD', 'en', 'Defend', 'Gain 5 block.', 'Gain !B! block.', 'Skill', 'Basic'),
      ('DEFEND_IRONCLAD', 'ko', '방어', '5의 방어도를 얻습니다.', NULL, '기술', '기본'),
      ('BASH', 'en', 'Bash', 'Deal 8 damage. Apply 2 Vulnerable.', NULL, 'Attack', 'Basic'),
      ('BASH', 'ko', '강타', '8의 피해를 입힙니다. 취약 2 적용.', NULL, '공격', '기본'),
      ('INFLAME', 'en', 'Inflame', 'Gain 2 Strength.', NULL, 'Power', 'Common'),
      ('INFLAME', 'ko', '불타오르기', '힘 2를 얻습니다.', NULL, '파워', '일반'),
      ('WHIRLWIND', 'en', 'Whirlwind', 'Deal 5 damage to ALL enemies X times.', NULL, 'Attack', 'Rare'),
      ('WHIRLWIND', 'ko', '회오리바람', 'ALL 적에게 5의 피해를 X번 입힙니다.', NULL, '공격', '희귀'),
      ('SHIV', 'en', 'Shiv', 'Deal 4 damage. Exhaust.', NULL, 'Attack', 'Common'),
      ('SHIV', 'ko', '단검', '4의 피해. 소진.', NULL, '공격', '일반'),
      ('NEUTRALIZE', 'en', 'Neutralize', 'Deal 3 damage. Apply 1 Weak.', NULL, 'Attack', 'Basic'),
      ('NEUTRALIZE', 'ko', '무력화', '3의 피해. 약화 1 적용.', NULL, '공격', '기본')
  `);

  // ── Keywords ──────────────────────────────────────────────────────────────
  db.exec(`
    INSERT INTO keywords (id, lang, name, description)
    VALUES
      ('EXHAUST', 'en', 'Exhaust', 'When played, this card is removed from your deck for the rest of combat.'),
      ('EXHAUST', 'ko', '소진', '이 카드를 플레이하면 전투가 끝날 때까지 덱에서 제거됩니다.'),
      ('VULNERABLE', 'en', 'Vulnerable', 'Target takes 50% more damage from attacks.'),
      ('VULNERABLE', 'ko', '취약', '대상이 공격으로 50% 더 많은 피해를 받습니다.')
  `);
});

afterAll(() => {
  db.close();
});

// ---------------------------------------------------------------------------
// getCharacters
// ---------------------------------------------------------------------------

describe("getCharacters", () => {
  test("returns all characters in English", () => {
    const chars = Q.getCharacters(db, "en");
    expect(chars).toHaveLength(2);
  });

  test("en characters have correct English names", () => {
    const chars = Q.getCharacters(db, "en");
    const names = chars.map((c) => c.name);
    expect(names).toContain("The Ironclad");
    expect(names).toContain("The Silent");
  });

  test("ko language returns Korean character names", () => {
    const chars = Q.getCharacters(db, "ko");
    const names = chars.map((c) => c.name);
    expect(names).toContain("아이언클래드");
    expect(names).toContain("사일런트");
  });

  test("character objects have required fields", () => {
    const [char] = Q.getCharacters(db, "en").filter((c) => c.id === "IRONCLAD");
    expect(char.id).toBe("IRONCLAD");
    expect(char.color).toBe("red");
    expect(char.cardColor).toBe("ironclad");
    expect(char.startingHp).toBe(80);
    expect(char.maxEnergy).toBe(3);
    expect(char.imageUrl).toBe("/ironclad.png");
  });

  test("startingDeck JSON field is parsed to an array", () => {
    const [char] = Q.getCharacters(db, "en").filter((c) => c.id === "IRONCLAD");
    expect(Array.isArray(char.startingDeck)).toBe(true);
    expect(char.startingDeck).toContain("BASH");
  });

  test("startingRelics JSON field is parsed to an array", () => {
    const [char] = Q.getCharacters(db, "en").filter((c) => c.id === "IRONCLAD");
    expect(Array.isArray(char.startingRelics)).toBe(true);
    expect(char.startingRelics).toContain("BURNING_BLOOD");
  });
});

// ---------------------------------------------------------------------------
// getCharacterById
// ---------------------------------------------------------------------------

describe("getCharacterById", () => {
  test("returns the correct character by ID", () => {
    const char = Q.getCharacterById(db, "IRONCLAD", "en");
    expect(char).not.toBeNull();
    expect(char?.id).toBe("IRONCLAD");
    expect(char?.name).toBe("The Ironclad");
  });

  test("returns Korean name when lang is ko", () => {
    const char = Q.getCharacterById(db, "IRONCLAD", "ko");
    expect(char?.name).toBe("아이언클래드");
  });

  test("returns null for non-existent character ID", () => {
    const char = Q.getCharacterById(db, "NONEXISTENT", "en");
    expect(char).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getCardsByColor
// ---------------------------------------------------------------------------

describe("getCardsByColor", () => {
  test("returns cards filtered by color", () => {
    const cards = Q.getCardsByColor(db, "ironclad", "en");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((c) => expect(c.color).toBe("ironclad"));
  });

  test("does not return cards of another color", () => {
    const cards = Q.getCardsByColor(db, "ironclad", "en");
    cards.forEach((c) => expect(c.color).not.toBe("silent"));
  });

  test("ko language returns Korean card names", () => {
    const cards = Q.getCardsByColor(db, "ironclad", "ko");
    const strike = cards.find((c) => c.id === "STRIKE_IRONCLAD");
    expect(strike?.name).toBe("강타");
  });

  test("ko language returns Korean type/rarity labels", () => {
    const cards = Q.getCardsByColor(db, "ironclad", "ko");
    const strike = cards.find((c) => c.id === "STRIKE_IRONCLAD");
    expect(strike?.type).toBe("공격");
    expect(strike?.rarity).toBe("기본");
  });

  test("silent color returns silent cards only", () => {
    const cards = Q.getCardsByColor(db, "silent", "en");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((c) => expect(c.color).toBe("silent"));
  });

  test("unknown color returns empty array", () => {
    const cards = Q.getCardsByColor(db, "colorless", "en");
    expect(cards).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getCardsByIds
// ---------------------------------------------------------------------------

describe("getCardsByIds", () => {
  test("returns requested cards by IDs", () => {
    const cards = Q.getCardsByIds(db, ["STRIKE_IRONCLAD", "BASH"], "en");
    expect(cards).toHaveLength(2);
    const ids = cards.map((c) => c.id);
    expect(ids).toContain("STRIKE_IRONCLAD");
    expect(ids).toContain("BASH");
  });

  test("handles empty array and returns empty array", () => {
    const cards = Q.getCardsByIds(db, [], "en");
    expect(cards).toHaveLength(0);
  });

  test("ignores IDs that do not exist", () => {
    const cards = Q.getCardsByIds(db, ["STRIKE_IRONCLAD", "NONEXISTENT_CARD"], "en");
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("STRIKE_IRONCLAD");
  });

  test("returns single-card array for one ID", () => {
    const cards = Q.getCardsByIds(db, ["BASH"], "en");
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("BASH");
  });
});

// ---------------------------------------------------------------------------
// getCardById
// ---------------------------------------------------------------------------

describe("getCardById", () => {
  test("returns the correct card by ID", () => {
    const card = Q.getCardById(db, "BASH", "en");
    expect(card).not.toBeNull();
    expect(card?.id).toBe("BASH");
    expect(card?.name).toBe("Bash");
  });

  test("returns Korean name when lang is ko", () => {
    const card = Q.getCardById(db, "BASH", "ko");
    expect(card?.name).toBe("강타");
  });

  test("returns null for non-existent card ID", () => {
    const card = Q.getCardById(db, "NONEXISTENT", "en");
    expect(card).toBeNull();
  });

  test("boolean fields are properly mapped from integers", () => {
    const strike = Q.getCardById(db, "STRIKE_IRONCLAD", "en");
    expect(strike?.isXCost).toBe(false);
    const whirlwind = Q.getCardById(db, "WHIRLWIND", "en");
    expect(whirlwind?.isXCost).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAllCards
// ---------------------------------------------------------------------------

describe("getAllCards", () => {
  test("returns all cards", () => {
    const cards = Q.getAllCards(db, "en");
    expect(cards).toHaveLength(7);
  });

  test("returns cards with correct language translations", () => {
    const cards = Q.getAllCards(db, "ko");
    const strike = cards.find((c) => c.id === "STRIKE_IRONCLAD");
    expect(strike?.name).toBe("강타");
  });
});

// ---------------------------------------------------------------------------
// getKeywords
// ---------------------------------------------------------------------------

describe("getKeywords", () => {
  test("returns all keywords for English", () => {
    const kws = Q.getKeywords(db, "en");
    expect(kws).toHaveLength(2);
  });

  test("returns keywords with correct fields", () => {
    const kws = Q.getKeywords(db, "en");
    const exhaust = kws.find((k) => k.id === "EXHAUST");
    expect(exhaust?.name).toBe("Exhaust");
    expect(exhaust?.description).toBeTruthy();
  });

  test("returns Korean keyword names when lang is ko", () => {
    const kws = Q.getKeywords(db, "ko");
    const exhaust = kws.find((k) => k.id === "EXHAUST");
    expect(exhaust?.name).toBe("소진");
  });
});

// ---------------------------------------------------------------------------
// JSON field parsing
// ---------------------------------------------------------------------------

describe("JSON field parsing", () => {
  test("keywords JSON is parsed to an array", () => {
    const card = Q.getCardById(db, "BASH", "en");
    expect(Array.isArray(card?.keywords)).toBe(true);
    expect(card?.keywords).toContain("Vulnerable");
  });

  test("tags JSON is parsed to an array", () => {
    const card = Q.getCardById(db, "BASH", "en");
    expect(Array.isArray(card?.tags)).toBe(true);
  });

  test("vars JSON is parsed to an object or null", () => {
    const card = Q.getCardById(db, "INFLAME", "en");
    expect(card?.vars).toEqual({ amount: 2 });
  });

  test("upgrade JSON is parsed to an object or null", () => {
    const card = Q.getCardById(db, "STRIKE_IRONCLAD", "en");
    expect(card?.upgrade).toEqual({ damage: 9 });
  });

  test("null JSON fields return null", () => {
    const card = Q.getCardById(db, "WHIRLWIND", "en");
    expect(card?.vars).toBeNull();
    expect(card?.upgrade).toBeNull();
  });

  test("descriptionRaw is set when present", () => {
    const card = Q.getCardById(db, "STRIKE_IRONCLAD", "en");
    expect(card?.descriptionRaw).toBe("Deal !D! damage.");
  });

  test("descriptionRaw is undefined when absent", () => {
    const card = Q.getCardById(db, "BASH", "en");
    expect(card?.descriptionRaw).toBeUndefined();
  });
});
