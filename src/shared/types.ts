// Card data from spire-codex API / SQLite
export interface Card {
  id: string;
  name: string;
  description: string;
  descriptionRaw?: string;
  cost: number | null;
  isXCost: boolean;
  isXStarCost: boolean;
  starCost: number | null;
  type: string;           // 'Attack' | 'Skill' | 'Power' | 'Status' | 'Curse' (or localized)
  rarity: string;         // 'Basic' | 'Common' | 'Uncommon' | 'Rare' | 'Ancient' (or localized)
  target: string | null;
  color: string;          // 'ironclad' | 'silent' | 'defect' | 'necrobinder' | 'regent' | 'colorless'
  damage: number | null;
  block: number | null;
  hitCount: number | null;
  keywords: string[];
  tags: string[];
  vars: Record<string, number> | null;
  upgrade: Record<string, string | number> | null;
  imageUrl: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  startingHp: number;
  maxEnergy: number;
  startingDeck: string[];    // card IDs
  startingRelics: string[];
  startingRelicsData?: Relic[];
  color: string;             // 'red', 'green', 'blue', 'purple', 'orange'
  cardColor: string;         // 'ironclad', 'silent', 'defect', 'necrobinder', 'regent'
  imageUrl: string;
}

export interface Keyword {
  id: string;
  name: string;
  description: string;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  descriptionRaw?: string;
  flavor: string;
  rarity: string;
  pool: string;       // 'shared' | 'ironclad' | 'silent' | 'defect' | 'necrobinder' | 'regent'
  imageUrl: string;
}

// Synergy system types
export interface SynergyDefinition {
  id: string;
  labelKey: string;        // i18n key for the display name
  color: string;           // CSS color for the pill
  bgColor: string;         // CSS background for the pill
  borderColor: string;     // CSS border for the pill
  keywords: string[];      // card keywords that match this synergy
  descriptionPatterns: RegExp[];  // patterns to match in card description
  varKeys: string[];       // keys in card.vars that indicate this synergy
  tagPatterns: string[];   // patterns in card.tags
}

export type SynergyTag = string; // synergy definition id

// Deck building types
export interface SavedDeck {
  id: string;
  name: string;
  characterId: string;
  cardIds: string[];
  relicIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DeckState {
  characterId: string | null;
  cardIds: string[];
  relicIds: string[];
}

export type DeckAction =
  | { type: 'SET_CHARACTER'; characterId: string; startingDeck: string[] }
  | { type: 'ADD_CARD'; cardId: string }
  | { type: 'REMOVE_CARD'; cardId: string }
  | { type: 'ADD_RELIC'; relicId: string }
  | { type: 'REMOVE_RELIC'; relicId: string }
  | { type: 'LOAD_DECK'; characterId: string; cardIds: string[]; relicIds?: string[] }
  | { type: 'CLEAR_DECK' };

export type Language = 'en' | 'ko';

// Card filter types
export interface CardFilter {
  type?: string;
  rarity?: string;
  cost?: number | 'X';
  keyword?: string;
  synergy?: string;
  search?: string;
}
