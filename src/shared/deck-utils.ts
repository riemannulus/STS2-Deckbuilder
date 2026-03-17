import type { Card, CardFilter, DeckState, DeckAction } from './types';

export interface DeckStats {
  total: number;
  byType: Record<string, number>;
  costCurve: Record<number, number>; // cost -> count, -1 for X
  averageCost: number;
}

// ---------------------------------------------------------------------------
// countCards
// ---------------------------------------------------------------------------

/**
 * Count the occurrences of each card ID in the given list.
 */
export const countCards = (cardIds: string[]): Map<string, number> =>
  cardIds.reduce((acc, id) => {
    acc.set(id, (acc.get(id) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

// ---------------------------------------------------------------------------
// filterCards
// ---------------------------------------------------------------------------

const matchesSearch = (card: Card, search: string): boolean => {
  const q = search.toLowerCase();
  return (
    card.name.toLowerCase().includes(q) ||
    card.description.toLowerCase().includes(q)
  );
};

/**
 * Apply a CardFilter to an array of cards and return the matching subset.
 * Pure function – does not mutate the input array.
 */
export const filterCards = (cards: Card[], filter: CardFilter): Card[] =>
  cards.filter((card) => {
    if (filter.type && card.type !== filter.type) return false;
    if (filter.rarity && card.rarity !== filter.rarity) return false;
    if (filter.cost !== undefined) {
      if (filter.cost === 'X') {
        if (!card.isXCost) return false;
      } else {
        if (card.cost !== filter.cost) return false;
      }
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      if (!card.keywords.some((k) => k.toLowerCase() === kw)) return false;
    }
    if (filter.search && !matchesSearch(card, filter.search)) return false;
    return true;
  });

// ---------------------------------------------------------------------------
// getDeckStats
// ---------------------------------------------------------------------------

const TYPE_ORDER = ['Attack', 'Skill', 'Power'];

/**
 * Compute aggregate statistics for a deck.
 *
 * @param cards       - Full card catalogue (used to look up card details)
 * @param deckCardIds - The IDs of the cards in the deck (may contain duplicates)
 */
export const getDeckStats = (cards: Card[], deckCardIds: string[]): DeckStats => {
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const initial: {
    byType: Record<string, number>;
    costCurve: Record<number, number>;
    totalCost: number;
    costableCount: number;
  } = {
    byType: {},
    costCurve: {},
    totalCost: 0,
    costableCount: 0,
  };

  const agg = deckCardIds.reduce((acc, id) => {
    const card = cardMap.get(id);
    if (!card) return acc;

    // byType
    const type = card.type;
    const updatedByType = {
      ...acc.byType,
      [type]: (acc.byType[type] ?? 0) + 1,
    };

    // costCurve: X-cost cards use key -1
    const costKey = card.isXCost ? -1 : (card.cost ?? 0);
    const updatedCostCurve = {
      ...acc.costCurve,
      [costKey]: (acc.costCurve[costKey] ?? 0) + 1,
    };

    // average cost excludes X-cost cards
    const addedCost = !card.isXCost && card.cost !== null ? card.cost : 0;
    const isCostable = !card.isXCost && card.cost !== null;

    return {
      byType: updatedByType,
      costCurve: updatedCostCurve,
      totalCost: acc.totalCost + addedCost,
      costableCount: acc.costableCount + (isCostable ? 1 : 0),
    };
  }, initial);

  const averageCost =
    agg.costableCount > 0
      ? Math.round((agg.totalCost / agg.costableCount) * 100) / 100
      : 0;

  return {
    total: deckCardIds.length,
    byType: agg.byType,
    costCurve: agg.costCurve,
    averageCost,
  };
};

// ---------------------------------------------------------------------------
// sortCards
// ---------------------------------------------------------------------------

const TYPE_SORT_ORDER: Record<string, number> = {
  Attack: 0,
  Skill: 1,
  Power: 2,
  Status: 3,
  Curse: 4,
};

/**
 * Sort cards by cost (ascending, X last), then by type order, then by name.
 * Pure function – returns a new array.
 */
export const sortCards = (cards: Card[]): Card[] =>
  [...cards].sort((a, b) => {
    // X-cost cards sort after numbered costs
    const aCost = a.isXCost ? Infinity : (a.cost ?? 0);
    const bCost = b.isXCost ? Infinity : (b.cost ?? 0);
    if (aCost !== bCost) return aCost - bCost;

    // Type order
    const aType = TYPE_SORT_ORDER[a.type] ?? 99;
    const bType = TYPE_SORT_ORDER[b.type] ?? 99;
    if (aType !== bType) return aType - bType;

    // Alphabetical name
    return a.name.localeCompare(b.name);
  });

// ---------------------------------------------------------------------------
// Deck reducer
// ---------------------------------------------------------------------------

export const initialDeckState: DeckState = {
  characterId: null,
  cardIds: [],
  relicIds: [],
};

/**
 * Pure reducer for deck state. Never mutates the incoming state.
 */
export const deckReducer = (state: DeckState, action: DeckAction): DeckState => {
  switch (action.type) {
    case 'SET_CHARACTER':
      return {
        characterId: action.characterId,
        cardIds: [...action.startingDeck],
        relicIds: [],
      };

    case 'ADD_CARD':
      return {
        ...state,
        cardIds: [...state.cardIds, action.cardId],
      };

    case 'REMOVE_CARD': {
      const idx = state.cardIds.lastIndexOf(action.cardId);
      if (idx === -1) return state;
      return {
        ...state,
        cardIds: [
          ...state.cardIds.slice(0, idx),
          ...state.cardIds.slice(idx + 1),
        ],
      };
    }

    case 'ADD_RELIC':
      // Prevent duplicate relics
      if (state.relicIds.includes(action.relicId)) return state;
      return {
        ...state,
        relicIds: [...state.relicIds, action.relicId],
      };

    case 'REMOVE_RELIC':
      return {
        ...state,
        relicIds: state.relicIds.filter((id) => id !== action.relicId),
      };

    case 'LOAD_DECK':
      return {
        characterId: action.characterId,
        cardIds: [...action.cardIds],
        relicIds: [...(action.relicIds ?? [])],
      };

    case 'CLEAR_DECK':
      return {
        ...state,
        cardIds: [],
        relicIds: [],
      };

    default:
      return state;
  }
};
