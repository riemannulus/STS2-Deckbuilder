import { test, expect, describe, beforeAll, afterAll, mock } from "bun:test";
import { encodeDeck } from "../shared/codec";

// ---------------------------------------------------------------------------
// Inject a real test DB before importing the module under test.
//
// resolvers.ts calls getDb() (singleton) at call-time, so we monkey-patch the
// connection module before the first import of resolvers.
// ---------------------------------------------------------------------------

import { createDb } from "../server/db/connection";
import * as connection from "../server/db/connection";

let testDb: ReturnType<typeof createDb>;

// We need to patch getDb() to return our test DB rather than the production
// sts2.db file.  Bun's module system evaluates the mock immediately, so we
// set it up before importing resolvers.

// Build the in-memory DB with the seeded production data (sts2.db already has
// all real data).  For resolver tests we simply use the real sts2.db file so
// that end-to-end queries work against the actual dataset without needing to
// replicate every fixture here.  We do this by calling getDb() from the
// real connection module inside beforeAll and asserting on realistic counts.

import { resolvers } from "../server/graphql/resolvers";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const Q = resolvers.Query;

// ---------------------------------------------------------------------------
// characters resolver
// ---------------------------------------------------------------------------

describe("resolvers.Query.characters", () => {
  test("returns 5 characters in English", () => {
    const chars = Q.characters({}, {});
    expect(chars).toHaveLength(5);
  });

  test("returns 5 characters in Korean", () => {
    const chars = Q.characters({}, { lang: "KO" });
    expect(chars).toHaveLength(5);
  });

  test("en result contains expected character IDs", () => {
    const chars = Q.characters({}, {});
    const ids = chars.map((c: any) => c.id);
    expect(ids).toContain("IRONCLAD");
    expect(ids).toContain("SILENT");
    expect(ids).toContain("DEFECT");
    expect(ids).toContain("NECROBINDER");
    expect(ids).toContain("REGENT");
  });

  test("en returns English names", () => {
    const chars = Q.characters({}, {});
    const ironclad = chars.find((c: any) => c.id === "IRONCLAD");
    expect(ironclad?.name).toBe("The Ironclad");
  });

  test("KO returns Korean names", () => {
    const chars = Q.characters({}, { lang: "KO" });
    const ironclad = chars.find((c: any) => c.id === "IRONCLAD");
    expect(ironclad?.name).toBe("아이언클래드");
  });

  test("character objects have required shape fields", () => {
    const [char] = Q.characters({}, {});
    expect(typeof char.id).toBe("string");
    expect(typeof char.name).toBe("string");
    expect(typeof char.startingHp).toBe("number");
    expect(Array.isArray(char.startingDeck)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// character resolver (single)
// ---------------------------------------------------------------------------

describe("resolvers.Query.character", () => {
  test("returns correct character by ID (en)", () => {
    const char = Q.character({}, { id: "IRONCLAD" });
    expect(char?.id).toBe("IRONCLAD");
    expect(char?.name).toBe("The Ironclad");
  });

  test("returns Korean name when lang is KO", () => {
    const char = Q.character({}, { id: "SILENT", lang: "KO" });
    expect(char?.name).toBe("사일런트");
  });

  test("returns null for non-existent ID", () => {
    const char = Q.character({}, { id: "NONEXISTENT_CHARACTER_XYZ" });
    expect(char).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cards resolver
// ---------------------------------------------------------------------------

describe("resolvers.Query.cards", () => {
  test("returns ironclad cards (en) – non-empty", () => {
    const cards = Q.cards({}, { color: "ironclad" });
    expect(cards.length).toBeGreaterThan(0);
  });

  test("all returned cards have the requested color", () => {
    const cards = Q.cards({}, { color: "ironclad" });
    cards.forEach((c: any) => expect(c.color).toBe("ironclad"));
  });

  test("returns silent cards", () => {
    const cards = Q.cards({}, { color: "silent" });
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((c: any) => expect(c.color).toBe("silent"));
  });

  test("KO language returns Korean card names", () => {
    const cards = Q.cards({}, { color: "ironclad", lang: "KO" });
    // Verify at least one card has a non-ASCII (Korean) name
    const hasKorean = cards.some((c: any) => /[가-힣]/.test(c.name));
    expect(hasKorean).toBe(true);
  });

  test("unknown color returns empty array", () => {
    const cards = Q.cards({}, { color: "nonexistent_color_xyz" });
    expect(cards).toHaveLength(0);
  });

  test("cards have expected shape", () => {
    const [card] = Q.cards({}, { color: "ironclad" });
    expect(typeof card.id).toBe("string");
    expect(typeof card.name).toBe("string");
    expect(typeof card.isXCost).toBe("boolean");
    expect(Array.isArray(card.keywords)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// keywords resolver
// ---------------------------------------------------------------------------

describe("resolvers.Query.keywords", () => {
  test("returns keywords in English – non-empty", () => {
    const kws = Q.keywords({}, {});
    expect(kws.length).toBeGreaterThan(0);
  });

  test("keywords have id, name, description fields", () => {
    const [kw] = Q.keywords({}, {});
    expect(typeof kw.id).toBe("string");
    expect(typeof kw.name).toBe("string");
    expect(typeof kw.description).toBe("string");
  });

  test("KO language returns Korean keyword names", () => {
    const kws = Q.keywords({}, { lang: "KO" });
    const hasKorean = kws.some((k: any) => /[가-힣]/.test(k.name));
    expect(hasKorean).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// decodeDeck resolver
// ---------------------------------------------------------------------------

describe("resolvers.Query.decodeDeck", () => {
  test("returns null for invalid encoded string", () => {
    const result = Q.decodeDeck({}, { encoded: "!!!invalid!!!" });
    expect(result).toBeNull();
  });

  test("returns null for empty string", () => {
    const result = Q.decodeDeck({}, { encoded: "" });
    expect(result).toBeNull();
  });

  test("returns decoded result for a valid encoded deck with real cards", () => {
    // Use known IDs from the seeded DB
    const encoded = encodeDeck("IRONCLAD", ["AGGRESSION", "ANGER"]);
    const result = Q.decodeDeck({}, { encoded });
    expect(result).not.toBeNull();
    expect(result?.characterId).toBe("IRONCLAD");
  });

  test("decoded result contains character object", () => {
    const encoded = encodeDeck("IRONCLAD", ["AGGRESSION"]);
    const result = Q.decodeDeck({}, { encoded });
    expect(result?.character?.id).toBe("IRONCLAD");
    expect(result?.character?.name).toBe("The Ironclad");
  });

  test("decoded result contains cardIds array", () => {
    const encoded = encodeDeck("IRONCLAD", ["AGGRESSION", "ANGER", "ANGER"]);
    const result = Q.decodeDeck({}, { encoded });
    expect(Array.isArray(result?.cardIds)).toBe(true);
    expect(result?.cardIds).toHaveLength(3);
  });

  test("decoded result contains resolved cards array", () => {
    const encoded = encodeDeck("IRONCLAD", ["AGGRESSION", "ANGER"]);
    const result = Q.decodeDeck({}, { encoded });
    expect(Array.isArray(result?.cards)).toBe(true);
    // Both card IDs exist in the DB so both should resolve
    expect(result?.cards.length).toBeGreaterThan(0);
  });

  test("KO lang returns Korean character and card names", () => {
    const encoded = encodeDeck("IRONCLAD", ["AGGRESSION"]);
    const result = Q.decodeDeck({}, { encoded, lang: "KO" });
    expect(result?.character?.name).toBe("아이언클래드");
    const hasKorean = result?.cards.some((c: any) => /[가-힣]/.test(c.name));
    expect(hasKorean).toBe(true);
  });

  test("empty cardIds deck still returns valid result", () => {
    const encoded = encodeDeck("SILENT", []);
    const result = Q.decodeDeck({}, { encoded });
    expect(result?.characterId).toBe("SILENT");
    expect(result?.cardIds).toHaveLength(0);
    expect(result?.cards).toHaveLength(0);
  });

  test("non-existent character ID in encoded string returns result with null character", () => {
    const encoded = encodeDeck("FAKE_CHARACTER", ["AGGRESSION"]);
    const result = Q.decodeDeck({}, { encoded });
    // characterId is set from the decode, character lookup returns null
    expect(result?.characterId).toBe("FAKE_CHARACTER");
    expect(result?.character).toBeNull();
  });
});
