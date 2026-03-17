import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import type { DeckState, DeckAction, SavedDeck } from "../../shared/types";
import { deckReducer, initialDeckState } from "../../shared/deck-utils";
import { encodeDeck } from "../../shared/codec";

interface DeckContextValue {
  state: DeckState;
  dispatch: React.Dispatch<DeckAction>;
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
  addRelic: (relicId: string) => void;
  removeRelic: (relicId: string) => void;
  clearDeck: () => void;
  setCharacter: (characterId: string, startingDeck: string[]) => void;
  loadDeck: (characterId: string, cardIds: string[], relicIds?: string[]) => void;
  saveDeck: (name: string) => void;
  deleteSavedDeck: (id: string) => void;
  getSavedDecks: () => SavedDeck[];
  getPermalink: () => string;
}

const STORAGE_KEY = "sts2-decks";

const DeckContext = createContext<DeckContextValue | null>(null);

const readSavedDecks = (): SavedDeck[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSavedDecks = (decks: SavedDeck[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // storage full or unavailable – silently ignore
  }
};

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(deckReducer, initialDeckState);

  const addCard = useCallback((cardId: string) => {
    dispatch({ type: "ADD_CARD", cardId });
  }, []);

  const removeCard = useCallback((cardId: string) => {
    dispatch({ type: "REMOVE_CARD", cardId });
  }, []);

  const addRelic = useCallback((relicId: string) => {
    dispatch({ type: "ADD_RELIC", relicId });
  }, []);

  const removeRelic = useCallback((relicId: string) => {
    dispatch({ type: "REMOVE_RELIC", relicId });
  }, []);

  const clearDeck = useCallback(() => {
    dispatch({ type: "CLEAR_DECK" });
  }, []);

  const setCharacter = useCallback((characterId: string, startingDeck: string[]) => {
    dispatch({ type: "SET_CHARACTER", characterId, startingDeck });
  }, []);

  const loadDeck = useCallback((characterId: string, cardIds: string[], relicIds?: string[]) => {
    dispatch({ type: "LOAD_DECK", characterId, cardIds, relicIds });
  }, []);

  const saveDeck = useCallback(
    (name: string) => {
      if (!state.characterId) return;
      const now = Date.now();
      const newDeck: SavedDeck = {
        id: crypto.randomUUID(),
        name: name.trim() || "Unnamed Deck",
        characterId: state.characterId,
        cardIds: [...state.cardIds],
        relicIds: [...state.relicIds],
        createdAt: now,
        updatedAt: now,
      };
      const existing = readSavedDecks();
      writeSavedDecks([...existing, newDeck]);
    },
    [state]
  );

  const deleteSavedDeck = useCallback((id: string) => {
    const existing = readSavedDecks();
    writeSavedDecks(existing.filter((d) => d.id !== id));
  }, []);

  const getSavedDecks = useCallback((): SavedDeck[] => {
    return readSavedDecks();
  }, []);

  const getPermalink = useCallback((): string => {
    if (!state.characterId) return window.location.href;
    const encoded = encodeDeck(state.characterId, state.cardIds);
    const url = new URL(window.location.href);
    url.searchParams.set("deck", encoded);
    return url.toString();
  }, [state]);

  const value = useMemo<DeckContextValue>(
    () => ({
      state,
      dispatch,
      addCard,
      removeCard,
      addRelic,
      removeRelic,
      clearDeck,
      setCharacter,
      loadDeck,
      saveDeck,
      deleteSavedDeck,
      getSavedDecks,
      getPermalink,
    }),
    [
      state,
      addCard,
      removeCard,
      addRelic,
      removeRelic,
      clearDeck,
      setCharacter,
      loadDeck,
      saveDeck,
      deleteSavedDeck,
      getSavedDecks,
      getPermalink,
    ]
  );

  return <DeckContext value={value}>{children}</DeckContext>;
};

export const useDeck = (): DeckContextValue => {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDeck must be used within DeckProvider");
  return ctx;
};
