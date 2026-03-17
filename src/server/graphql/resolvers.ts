import { getDb } from "../db/connection";
import * as Q from "../db/queries";
import { decodeDeck } from "../../shared/codec";
import type { Character, Language } from "../../shared/types";

const toLang = (lang?: string): Language => (lang === "KO" ? "ko" : "en");

export const resolvers = {
  Query: {
    characters: (_: unknown, args: { lang?: string }) =>
      Q.getCharacters(getDb(), toLang(args.lang)),

    character: (_: unknown, args: { id: string; lang?: string }) =>
      Q.getCharacterById(getDb(), args.id, toLang(args.lang)),

    cards: (_: unknown, args: { color: string; lang?: string }) =>
      Q.getCardsByColor(getDb(), args.color, toLang(args.lang)),

    cardsByIds: (_: unknown, args: { ids: string[]; lang?: string }) =>
      Q.getCardsByIds(getDb(), args.ids, toLang(args.lang)),

    card: (_: unknown, args: { id: string; lang?: string }) =>
      Q.getCardById(getDb(), args.id, toLang(args.lang)),

    keywords: (_: unknown, args: { lang?: string }) =>
      Q.getKeywords(getDb(), toLang(args.lang)),

    relics: (_: unknown, args: { pool?: string; lang?: string }) => {
      const lang = toLang(args.lang);
      const db = getDb();
      return args.pool
        ? Q.getRelicsByPool(db, args.pool, lang)
        : Q.getRelics(db, lang);
    },

    relic: (_: unknown, args: { id: string; lang?: string }) =>
      Q.getRelicById(getDb(), args.id, toLang(args.lang)),

    decodeDeck: (_: unknown, args: { encoded: string; lang?: string }) => {
      const decoded = decodeDeck(args.encoded);
      if (!decoded) return null;
      const lang = toLang(args.lang);
      const db = getDb();
      return {
        characterId: decoded.characterId,
        character: Q.getCharacterById(db, decoded.characterId, lang),
        cardIds: decoded.cardIds,
        cards: Q.getCardsByIds(db, decoded.cardIds, lang),
      };
    },
  },

  Character: {
    startingRelicsData: (parent: Character, args: { lang?: string }) =>
      Q.getRelicsByIds(getDb(), parent.startingRelics, toLang(args.lang)),
  },
};
