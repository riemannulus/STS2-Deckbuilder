import { SPIRE_CODEX_API_URL, LANG_MAP } from "../../shared/constants";
import type { Language } from "../../shared/types";

// Raw API response types

export interface RawCard {
  id: string;
  name: string;
  description: string;
  description_raw: string | null;
  cost: number | null;
  is_x_cost: boolean | null;
  is_x_star_cost: boolean | null;
  star_cost: number | null;
  type: string;
  rarity: string;
  target: string | null;
  color: string;
  damage: number | null;
  block: number | null;
  hit_count: number | null;
  powers_applied: Array<{ power: string; amount: number }> | null;
  cards_draw: number | null;
  energy_gain: number | null;
  hp_loss: number | null;
  keywords: string[] | null;
  tags: string[] | null;
  spawns_cards: string[] | null;
  vars: Record<string, number> | null;
  upgrade: Record<string, string | number> | null;
  image_url: string;
  beta_image_url: string | null;
}

export interface RawCharacter {
  id: string;
  name: string;
  description: string;
  starting_hp: number;
  starting_gold: number;
  max_energy: number;
  orb_slots: number | null;
  starting_deck: string[];
  starting_relics: string[];
  unlocks_after: string | null;
  gender: string;
  color: string;
  dialogue_color: string;
  image_url: string;
}

export interface RawKeyword {
  id: string;
  name: string;
  description: string;
}

export interface RawRelic {
  id: string;
  name: string;
  description: string;
  description_raw: string | null;
  flavor: string | null;
  rarity: string;
  pool: string;
  image_url: string;
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json() as Promise<T>;
};

export const fetchCharacters = async (lang: Language): Promise<RawCharacter[]> =>
  fetchJson<RawCharacter[]>(`${SPIRE_CODEX_API_URL}/characters?lang=${LANG_MAP[lang]}`);

export const fetchCards = async (lang: Language, color?: string): Promise<RawCard[]> => {
  const params = new URLSearchParams({ lang: LANG_MAP[lang] });
  if (color) params.set("color", color);
  return fetchJson<RawCard[]>(`${SPIRE_CODEX_API_URL}/cards?${params}`);
};

export const fetchKeywords = async (lang: Language): Promise<RawKeyword[]> =>
  fetchJson<RawKeyword[]>(`${SPIRE_CODEX_API_URL}/keywords?lang=${LANG_MAP[lang]}`);

export const fetchRelics = async (lang: Language): Promise<RawRelic[]> =>
  fetchJson<RawRelic[]>(`${SPIRE_CODEX_API_URL}/relics?lang=${LANG_MAP[lang]}`);
