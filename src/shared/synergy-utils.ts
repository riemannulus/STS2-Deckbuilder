/**
 * Synergy extraction and analysis utilities.
 *
 * Extracts synergy tags from card data (keywords, description, vars, tags)
 * and computes synergy breakdowns for decks.
 */

import type { Card, Relic, SynergyTag } from './types';
import { SYNERGY_DEFINITIONS } from './constants';

// ── Strip BBCode from description for pattern matching ──────────────────────

const BBCODE_RE = /\[[^\]]*\]/g;

const stripBB = (text: string): string => text.replace(BBCODE_RE, '');

// ── Extract synergies for a single card ─────────────────────────────────────

/**
 * Determine which synergy tags apply to a given card.
 * Returns a deduplicated array of synergy definition IDs.
 */
export const extractCardSynergies = (card: Card): SynergyTag[] => {
  const matched: SynergyTag[] = [];
  const cleanDesc = stripBB(card.description);

  for (const def of SYNERGY_DEFINITIONS) {
    let hit = false;

    // Check keywords
    if (!hit && def.keywords.length > 0) {
      const cardKwLower = card.keywords.map((k) => k.toLowerCase());
      hit = def.keywords.some((kw) => cardKwLower.includes(kw.toLowerCase()));
    }

    // Check description patterns
    if (!hit && def.descriptionPatterns.length > 0) {
      hit = def.descriptionPatterns.some((re) => re.test(cleanDesc));
    }

    // Check vars keys
    if (!hit && def.varKeys.length > 0 && card.vars) {
      hit = def.varKeys.some((key) => key in card.vars!);
    }

    // Check tags
    if (!hit && def.tagPatterns.length > 0) {
      const cardTagsLower = card.tags.map((t) => t.toLowerCase());
      hit = def.tagPatterns.some((tp) => cardTagsLower.includes(tp.toLowerCase()));
    }

    if (hit) {
      matched.push(def.id);
    }
  }

  return matched;
};

// ── Build a lookup map for all cards ────────────────────────────────────────

/**
 * Build a Map from card ID to its synergy tags.
 * Useful for memoizing the entire card pool's synergies at once.
 */
export const buildSynergyMap = (cards: Card[]): Map<string, SynergyTag[]> => {
  const map = new Map<string, SynergyTag[]>();
  for (const card of cards) {
    map.set(card.id, extractCardSynergies(card));
  }
  return map;
};

// ── Synergy breakdown for a deck ────────────────────────────────────────────

export interface SynergyBreakdown {
  synergyId: string;
  count: number;
}

/**
 * Compute synergy counts for a deck given its card IDs and a pre-built synergy map.
 * Returns an array sorted by count descending, then alphabetically.
 */
export const getDeckSynergyBreakdown = (
  deckCardIds: string[],
  synergyMap: Map<string, SynergyTag[]>,
): SynergyBreakdown[] => {
  const counts: Record<string, number> = {};

  for (const cardId of deckCardIds) {
    const synergies = synergyMap.get(cardId);
    if (!synergies) continue;
    for (const syn of synergies) {
      counts[syn] = (counts[syn] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([synergyId, count]) => ({ synergyId, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.synergyId.localeCompare(b.synergyId);
    });
};

// ── Filter cards by synergy ─────────────────────────────────────────────────

/**
 * Filter an array of cards to only those matching a given synergy ID.
 */
export const filterCardsBySynergy = (
  cards: Card[],
  synergyId: string,
  synergyMap: Map<string, SynergyTag[]>,
): Card[] =>
  cards.filter((card) => {
    const synergies = synergyMap.get(card.id);
    return synergies ? synergies.includes(synergyId) : false;
  });

// ── Get synergy definition by ID ────────────────────────────────────────────

export const getSynergyDef = (id: string) =>
  SYNERGY_DEFINITIONS.find((d) => d.id === id) ?? null;

// ── Extract synergies for a single relic ────────────────────────────────────

/**
 * Determine which synergy tags apply to a given relic.
 * Only uses descriptionPatterns (relics have no keywords/vars/tags).
 */
export const extractRelicSynergies = (relic: Relic): SynergyTag[] => {
  const matched: SynergyTag[] = [];
  const cleanDesc = stripBB(relic.description);

  for (const def of SYNERGY_DEFINITIONS) {
    let hit = false;

    if (!hit && def.descriptionPatterns.length > 0) {
      hit = def.descriptionPatterns.some((re) => re.test(cleanDesc));
    }

    if (hit) matched.push(def.id);
  }

  return matched;
};

/**
 * Build a Map from relic ID to its synergy tags.
 */
export const buildRelicSynergyMap = (relics: Relic[]): Map<string, SynergyTag[]> => {
  const map = new Map<string, SynergyTag[]>();
  for (const relic of relics) {
    map.set(relic.id, extractRelicSynergies(relic));
  }
  return map;
};
