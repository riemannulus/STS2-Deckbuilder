import { test, expect, describe } from "bun:test";
import {
  countCards,
  filterCards,
  getDeckStats,
  sortCards,
  deckReducer,
  initialDeckState,
} from "../shared/deck-utils";
import type { Card, CardFilter } from "../shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockCard = (overrides: Partial<Card> = {}): Card => ({
  id: "TEST_CARD",
  name: "Test Card",
  description: "Test",
  cost: 1,
  isXCost: false,
  isXStarCost: false,
  starCost: null,
  type: "Attack",
  rarity: "Common",
  target: "AnyEnemy",
  color: "ironclad",
  damage: 6,
  block: null,
  hitCount: 1,
  keywords: [],
  tags: [],
  vars: null,
  upgrade: null,
  imageUrl: "/test.png",
  ...overrides,
});

// ---------------------------------------------------------------------------
// countCards
// ---------------------------------------------------------------------------

describe("countCards", () => {
  test("empty array returns empty map", () => {
    const result = countCards([]);
    expect(result.size).toBe(0);
  });

  test("counts single occurrences", () => {
    const result = countCards(["STRIKE", "DEFEND", "BASH"]);
    expect(result.get("STRIKE")).toBe(1);
    expect(result.get("DEFEND")).toBe(1);
    expect(result.get("BASH")).toBe(1);
  });

  test("counts multiple occurrences of the same card", () => {
    const result = countCards(["STRIKE", "STRIKE", "STRIKE", "DEFEND"]);
    expect(result.get("STRIKE")).toBe(3);
    expect(result.get("DEFEND")).toBe(1);
  });

  test("returns undefined for card not in the list", () => {
    const result = countCards(["STRIKE"]);
    expect(result.get("NOTPRESENT")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// filterCards
// ---------------------------------------------------------------------------

describe("filterCards", () => {
  const cards: Card[] = [
    mockCard({ id: "A", name: "Anger", description: "Deal 6 damage.", type: "Attack", rarity: "Common", cost: 0, keywords: [] }),
    mockCard({ id: "B", name: "Bash", description: "Deal 8 damage. Apply 2 Vulnerable.", type: "Attack", rarity: "Basic", cost: 2, keywords: ["Vulnerable"] }),
    mockCard({ id: "C", name: "Defend", description: "Gain 5 block.", type: "Skill", rarity: "Basic", cost: 1, keywords: [] }),
    mockCard({ id: "D", name: "Flex", description: "Gain 2 Strength.", type: "Skill", rarity: "Common", cost: 0, keywords: [] }),
    mockCard({ id: "E", name: "Inflame", description: "Gain 2 Strength.", type: "Power", rarity: "Uncommon", cost: 1, keywords: [] }),
    mockCard({ id: "F", name: "Whirlwind", description: "Deal 5 damage to ALL enemies X times.", type: "Attack", rarity: "Rare", cost: -1, isXCost: true, keywords: ["Multi-Hit"] }),
  ];

  test("no filter returns all cards", () => {
    expect(filterCards(cards, {})).toHaveLength(cards.length);
  });

  test("filter by type returns only matching cards", () => {
    const result = filterCards(cards, { type: "Attack" });
    expect(result).toHaveLength(3);
    result.forEach((c) => expect(c.type).toBe("Attack"));
  });

  test("filter by rarity returns only matching cards", () => {
    const result = filterCards(cards, { rarity: "Common" });
    expect(result).toHaveLength(2);
    result.forEach((c) => expect(c.rarity).toBe("Common"));
  });

  test("filter by exact numeric cost", () => {
    const result = filterCards(cards, { cost: 1 });
    expect(result).toHaveLength(2);
    result.forEach((c) => expect(c.cost).toBe(1));
  });

  test("filter by cost 0", () => {
    const result = filterCards(cards, { cost: 0 });
    expect(result).toHaveLength(2);
    result.forEach((c) => expect(c.cost).toBe(0));
  });

  test("filter by cost X returns X-cost cards only", () => {
    const result = filterCards(cards, { cost: "X" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("F");
    expect(result[0].isXCost).toBe(true);
  });

  test("filter by keyword matches case-insensitively", () => {
    const result = filterCards(cards, { keyword: "vulnerable" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("B");
  });

  test("filter by search matches card name case-insensitively", () => {
    const result = filterCards(cards, { search: "anger" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("A");
  });

  test("filter by search matches card description", () => {
    const result = filterCards(cards, { search: "ALL enemies" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("F");
  });

  test("multiple filters combined with AND logic", () => {
    // Only Attack cards that cost 0
    const result = filterCards(cards, { type: "Attack", cost: 0 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("A");
  });

  test("filter with no matches returns empty array", () => {
    const result = filterCards(cards, { type: "Curse" });
    expect(result).toHaveLength(0);
  });

  test("does not mutate the input array", () => {
    const original = [...cards];
    filterCards(cards, { type: "Attack" });
    expect(cards).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// getDeckStats
// ---------------------------------------------------------------------------

describe("getDeckStats", () => {
  const catalogue: Card[] = [
    mockCard({ id: "STRIKE", type: "Attack", cost: 1 }),
    mockCard({ id: "DEFEND", type: "Skill", cost: 1 }),
    mockCard({ id: "BASH", type: "Attack", cost: 2 }),
    mockCard({ id: "INFLAME", type: "Power", cost: 1 }),
    mockCard({ id: "WHIRLWIND", type: "Attack", cost: -1, isXCost: true }),
  ];

  test("empty deck returns all-zero stats", () => {
    const stats = getDeckStats(catalogue, []);
    expect(stats.total).toBe(0);
    expect(stats.byType).toEqual({});
    expect(stats.costCurve).toEqual({});
    expect(stats.averageCost).toBe(0);
  });

  test("counts total correctly", () => {
    const stats = getDeckStats(catalogue, ["STRIKE", "DEFEND", "BASH"]);
    expect(stats.total).toBe(3);
  });

  test("counts by type correctly", () => {
    const stats = getDeckStats(catalogue, [
      "STRIKE",
      "STRIKE",
      "DEFEND",
      "INFLAME",
    ]);
    expect(stats.byType["Attack"]).toBe(2);
    expect(stats.byType["Skill"]).toBe(1);
    expect(stats.byType["Power"]).toBe(1);
  });

  test("cost curve buckets are accurate", () => {
    const stats = getDeckStats(catalogue, ["STRIKE", "DEFEND", "BASH"]);
    expect(stats.costCurve[1]).toBe(2); // STRIKE + DEFEND
    expect(stats.costCurve[2]).toBe(1); // BASH
  });

  test("X-cost cards are bucketed under -1 in cost curve", () => {
    const stats = getDeckStats(catalogue, ["WHIRLWIND", "STRIKE"]);
    expect(stats.costCurve[-1]).toBe(1);
    expect(stats.costCurve[1]).toBe(1);
  });

  test("average cost excludes X-cost cards", () => {
    // STRIKE(1) + DEFEND(1) + BASH(2) + WHIRLWIND(X) → avg of 1+1+2 / 3 = 1.33
    const stats = getDeckStats(catalogue, [
      "STRIKE",
      "DEFEND",
      "BASH",
      "WHIRLWIND",
    ]);
    expect(stats.averageCost).toBeCloseTo(1.33, 2);
  });

  test("average cost with only X-cost cards is 0", () => {
    const stats = getDeckStats(catalogue, ["WHIRLWIND"]);
    expect(stats.averageCost).toBe(0);
  });

  test("unknown card IDs are ignored", () => {
    const stats = getDeckStats(catalogue, ["STRIKE", "UNKNOWN_CARD"]);
    expect(stats.total).toBe(2); // total counts IDs, not matched cards
    expect(stats.byType["Attack"]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// sortCards
// ---------------------------------------------------------------------------

describe("sortCards", () => {
  test("sorts by cost ascending", () => {
    const cards = [
      mockCard({ id: "C", cost: 3 }),
      mockCard({ id: "A", cost: 1 }),
      mockCard({ id: "B", cost: 2 }),
    ];
    const sorted = sortCards(cards);
    expect(sorted.map((c) => c.cost)).toEqual([1, 2, 3]);
  });

  test("X-cost cards sort after numbered costs", () => {
    const cards = [
      mockCard({ id: "X", cost: -1, isXCost: true }),
      mockCard({ id: "A", cost: 0 }),
      mockCard({ id: "B", cost: 3 }),
    ];
    const sorted = sortCards(cards);
    expect(sorted[0].id).toBe("A");
    expect(sorted[1].id).toBe("B");
    expect(sorted[2].id).toBe("X");
  });

  test("same cost cards are sorted by type order (Attack < Skill < Power)", () => {
    const cards = [
      mockCard({ id: "P", cost: 1, type: "Power" }),
      mockCard({ id: "S", cost: 1, type: "Skill" }),
      mockCard({ id: "A", cost: 1, type: "Attack" }),
    ];
    const sorted = sortCards(cards);
    expect(sorted.map((c) => c.type)).toEqual(["Attack", "Skill", "Power"]);
  });

  test("same cost and type sorted alphabetically by name", () => {
    const cards = [
      mockCard({ id: "C", cost: 1, type: "Attack", name: "Zap" }),
      mockCard({ id: "A", cost: 1, type: "Attack", name: "Anger" }),
      mockCard({ id: "B", cost: 1, type: "Attack", name: "Bash" }),
    ];
    const sorted = sortCards(cards);
    expect(sorted.map((c) => c.name)).toEqual(["Anger", "Bash", "Zap"]);
  });

  test("does not mutate the original array", () => {
    const cards = [
      mockCard({ id: "B", cost: 2 }),
      mockCard({ id: "A", cost: 1 }),
    ];
    const original = [...cards];
    sortCards(cards);
    expect(cards).toEqual(original);
  });

  test("empty array returns empty array", () => {
    expect(sortCards([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deckReducer
// ---------------------------------------------------------------------------

describe("deckReducer", () => {
  test("initialDeckState has null characterId and empty cardIds", () => {
    expect(initialDeckState.characterId).toBeNull();
    expect(initialDeckState.cardIds).toEqual([]);
  });

  test("SET_CHARACTER sets characterId and loads startingDeck", () => {
    const next = deckReducer(initialDeckState, {
      type: "SET_CHARACTER",
      characterId: "IRONCLAD",
      startingDeck: ["STRIKE", "STRIKE", "DEFEND"],
    });
    expect(next.characterId).toBe("IRONCLAD");
    expect(next.cardIds).toEqual(["STRIKE", "STRIKE", "DEFEND"]);
  });

  test("SET_CHARACTER replaces existing state", () => {
    const state = { characterId: "SILENT", cardIds: ["SHIV", "SHIV"], relicIds: [] as string[] };
    const next = deckReducer(state, {
      type: "SET_CHARACTER",
      characterId: "IRONCLAD",
      startingDeck: ["STRIKE"],
    });
    expect(next.characterId).toBe("IRONCLAD");
    expect(next.cardIds).toEqual(["STRIKE"]);
  });

  test("ADD_CARD appends card to end of deck", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE"], relicIds: [] as string[] };
    const next = deckReducer(state, { type: "ADD_CARD", cardId: "BASH" });
    expect(next.cardIds).toEqual(["STRIKE", "BASH"]);
  });

  test("ADD_CARD allows duplicates", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE"], relicIds: [] as string[] };
    const next = deckReducer(state, { type: "ADD_CARD", cardId: "STRIKE" });
    expect(next.cardIds).toEqual(["STRIKE", "STRIKE"]);
  });

  test("REMOVE_CARD removes the last copy of the card", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE", "STRIKE", "DEFEND"], relicIds: [] as string[] };
    const next = deckReducer(state, { type: "REMOVE_CARD", cardId: "STRIKE" });
    expect(next.cardIds).toEqual(["STRIKE", "DEFEND"]);
  });

  test("REMOVE_CARD does nothing when card is not in deck", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE", "DEFEND"], relicIds: [] as string[] };
    const next = deckReducer(state, { type: "REMOVE_CARD", cardId: "BASH" });
    expect(next).toBe(state); // same reference – no change
  });

  test("LOAD_DECK replaces entire state", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE"], relicIds: [] as string[] };
    const next = deckReducer(state, {
      type: "LOAD_DECK",
      characterId: "SILENT",
      cardIds: ["SHIV", "SHIV", "NEUTRALIZE"],
    });
    expect(next.characterId).toBe("SILENT");
    expect(next.cardIds).toEqual(["SHIV", "SHIV", "NEUTRALIZE"]);
  });

  test("CLEAR_DECK empties cardIds but preserves characterId", () => {
    const state = { characterId: "IRONCLAD", cardIds: ["STRIKE", "DEFEND", "BASH"], relicIds: [] as string[] };
    const next = deckReducer(state, { type: "CLEAR_DECK" });
    expect(next.characterId).toBe("IRONCLAD");
    expect(next.cardIds).toEqual([]);
  });

  test("state is immutable – SET_CHARACTER does not modify original", () => {
    const startingDeck = ["STRIKE"];
    const original = { characterId: null, cardIds: [] as string[], relicIds: [] as string[] };
    deckReducer(original, {
      type: "SET_CHARACTER",
      characterId: "IRONCLAD",
      startingDeck,
    });
    expect(original.characterId).toBeNull();
    expect(original.cardIds).toEqual([]);
  });

  test("state is immutable – ADD_CARD does not modify original cardIds", () => {
    const cardIds = ["STRIKE"];
    const state = { characterId: "IRONCLAD", cardIds, relicIds: [] as string[] };
    deckReducer(state, { type: "ADD_CARD", cardId: "BASH" });
    expect(cardIds).toEqual(["STRIKE"]);
  });

  test("state is immutable – LOAD_DECK does not modify source array", () => {
    const source = ["SHIV", "SHIV"];
    deckReducer(initialDeckState, {
      type: "LOAD_DECK",
      characterId: "SILENT",
      cardIds: source,
    });
    expect(source).toEqual(["SHIV", "SHIV"]);
  });
});
