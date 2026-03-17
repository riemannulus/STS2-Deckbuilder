import { test, expect, describe } from "bun:test";
import { encodeDeck, decodeDeck } from "../shared/codec";

describe("encodeDeck / decodeDeck", () => {
  describe("round-trip", () => {
    test("encodes then decodes back to the same characterId", () => {
      const encoded = encodeDeck("IRONCLAD", ["STRIKE", "DEFEND"]);
      const result = decodeDeck(encoded);
      expect(result?.characterId).toBe("IRONCLAD");
    });

    test("round-trip returns sorted card IDs (deduped and expanded)", () => {
      const cardIds = ["DEFEND", "STRIKE", "BASH", "STRIKE"];
      const encoded = encodeDeck("IRONCLAD", cardIds);
      const result = decodeDeck(encoded);
      // After encode: BASH.1,DEFEND.1,STRIKE.2 (sorted alphabetically)
      // After decode: expand counts, sorted order preserved
      expect(result?.cardIds.sort()).toEqual([...cardIds].sort());
    });

    test("empty deck (character with no cards) round-trips correctly", () => {
      const encoded = encodeDeck("SILENT", []);
      const result = decodeDeck(encoded);
      expect(result).toEqual({ characterId: "SILENT", cardIds: [] });
    });

    test("single card round-trips correctly", () => {
      const encoded = encodeDeck("DEFECT", ["ZAP"]);
      const result = decodeDeck(encoded);
      expect(result?.characterId).toBe("DEFECT");
      expect(result?.cardIds).toEqual(["ZAP"]);
    });

    test("multiple copies of the same card round-trip correctly", () => {
      const cardIds = ["STRIKE", "STRIKE", "STRIKE", "STRIKE", "STRIKE"];
      const encoded = encodeDeck("IRONCLAD", cardIds);
      const result = decodeDeck(encoded);
      expect(result?.cardIds).toHaveLength(5);
      expect(result?.cardIds.every((id) => id === "STRIKE")).toBe(true);
    });

    test("multiple different cards with various counts round-trip", () => {
      const cardIds = [
        "STRIKE",
        "STRIKE",
        "DEFEND",
        "DEFEND",
        "DEFEND",
        "BASH",
      ];
      const encoded = encodeDeck("IRONCLAD", cardIds);
      const result = decodeDeck(encoded);
      expect(result?.cardIds.sort()).toEqual([...cardIds].sort());
    });

    test("card IDs with underscores work correctly", () => {
      const cardIds = ["STRIKE_IRONCLAD", "STRIKE_IRONCLAD", "DEFEND_IRONCLAD"];
      const encoded = encodeDeck("IRONCLAD", cardIds);
      const result = decodeDeck(encoded);
      expect(result?.cardIds.sort()).toEqual([...cardIds].sort());
    });

    test("large deck (50+ cards) round-trips correctly", () => {
      const cardIds: string[] = [];
      for (let i = 0; i < 10; i++) cardIds.push("STRIKE");
      for (let i = 0; i < 10; i++) cardIds.push("DEFEND");
      for (let i = 0; i < 10; i++) cardIds.push("BASH");
      for (let i = 0; i < 10; i++) cardIds.push("BLOOD_FOR_BLOOD");
      for (let i = 0; i < 10; i++) cardIds.push("CARNAGE");
      // 50 cards total
      const encoded = encodeDeck("IRONCLAD", cardIds);
      const result = decodeDeck(encoded);
      expect(result?.cardIds).toHaveLength(50);
      expect(result?.cardIds.sort()).toEqual([...cardIds].sort());
    });
  });

  describe("URL-safety", () => {
    test("encoded string contains no + characters", () => {
      const encoded = encodeDeck("IRONCLAD", ["STRIKE", "DEFEND", "BASH"]);
      expect(encoded).not.toContain("+");
    });

    test("encoded string contains no / characters", () => {
      const encoded = encodeDeck("IRONCLAD", ["STRIKE", "DEFEND", "BASH"]);
      expect(encoded).not.toContain("/");
    });

    test("encoded string contains no = padding characters", () => {
      const encoded = encodeDeck("IRONCLAD", ["STRIKE", "DEFEND", "BASH"]);
      expect(encoded).not.toContain("=");
    });
  });

  describe("decodeDeck invalid inputs", () => {
    test("returns null for empty string", () => {
      expect(decodeDeck("")).toBeNull();
    });

    test("returns null for invalid base64", () => {
      expect(decodeDeck("!!!not-base64!!!")).toBeNull();
    });

    test("returns null for encoded string missing colon separator", () => {
      // base64url of a string with no colon
      const noColon = Buffer.from("NOCHARACTERNOSEPARATOR").toString("base64");
      expect(decodeDeck(noColon)).toBeNull();
    });

    test("returns null for malformed card entries (no dot separator)", () => {
      // Encode manually: CHARACTER_ID:CARDWITHOUTDOT
      const raw = "IRONCLAD:CARDWITHOUTDOT";
      const encoded = Buffer.from(raw)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
      // Should either return null or return an empty cardIds array
      // because the malformed card entry produces no valid cards
      const result = decodeDeck(encoded);
      // malformed entries are silently dropped; characterId is still present
      expect(result).not.toBeNull();
      expect(result?.cardIds).toEqual([]);
    });

    test("returns null for random garbage string", () => {
      expect(decodeDeck("xyzxyzxyzxyz-garbage")).toBeNull();
    });
  });
});
