import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Card, CardFilter, Character, Relic, SavedDeck } from "../../shared/types";
import { getDeckStats, filterCards } from "../../shared/deck-utils";
import { encodeDeck, decodeDeck } from "../../shared/codec";
import { buildSynergyMap, getDeckSynergyBreakdown } from "../../shared/synergy-utils";
import { useGraphQL } from "../hooks/use-graphql";
import { useDeck } from "../context/DeckContext";
import { useI18n } from "../context/I18nContext";
import { FilterBar } from "./FilterBar";
import { CardPool } from "./CardPool";
import { DeckArea } from "./DeckArea";
import { DeckStats } from "./DeckStats";
import { RelicTooltip } from "./RelicTooltip";
import { RelicBrowser } from "./RelicBrowser";

// ── GraphQL queries ───────────────────────────────────────────────────────────

const CHARACTERS_QUERY = `
  query GetCharacters($lang: Language!) {
    characters(lang: $lang) {
      id
      name
      description
      startingHp
      maxEnergy
      startingDeck
      color
      cardColor
      startingRelicsData(lang: $lang) {
        id name description flavor rarity imageUrl
      }
    }
  }
`;

const CARDS_QUERY = `
  query GetCards($lang: Language!, $color: String!) {
    cards(lang: $lang, color: $color) {
      id
      name
      description
      cost
      isXCost
      isXStarCost
      starCost
      type
      rarity
      target
      color
      damage
      block
      hitCount
      keywords
      tags
      vars
      upgrade
      imageUrl
    }
  }
`;

const CARDS_BY_IDS_QUERY = `
  query GetCardsByIds($lang: Language!, $ids: [String!]!) {
    cardsByIds(lang: $lang, ids: $ids) {
      id
      name
      description
      cost
      isXCost
      isXStarCost
      starCost
      type
      rarity
      target
      color
      damage
      block
      hitCount
      keywords
      tags
      vars
      upgrade
      imageUrl
    }
  }
`;

const RELICS_QUERY = `
  query GetRelics($lang: Language!, $pool: String!) {
    relics(pool: $pool, lang: $lang) {
      id
      name
      description
      flavor
      rarity
      pool
      imageUrl
    }
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeckBuilderProps {
  searchParams: URLSearchParams;
  navigate: (path: string) => void;
}

// ── Character Select screen ───────────────────────────────────────────────────

interface CharSelectProps {
  characters: Character[];
  onSelect: (char: Character) => void;
}

const CHARACTER_COLOR_CSS: Record<string, string> = {
  ironclad:   "var(--color-ironclad)",
  silent:     "var(--color-silent)",
  defect:     "var(--color-defect)",
  necrobinder:"var(--color-necrobinder)",
  regent:     "var(--color-regent)",
};

const CharacterSelect: React.FC<CharSelectProps> = ({ characters, onSelect }) => (
  <div className="char-select">
    <div className="char-select__title">Select a Character</div>
    <div className="char-select__grid">
      {characters.map((char) => (
        <button
          key={char.id}
          className="char-select__card"
          style={{ borderColor: CHARACTER_COLOR_CSS[char.cardColor] ?? "var(--border-color)" }}
          onClick={() => onSelect(char)}
        >
          <span
            className="char-select__card-name"
            style={{ color: CHARACTER_COLOR_CSS[char.cardColor] ?? "var(--text-primary)" }}
          >
            {char.name}
          </span>
          <span className="char-select__card-meta">
            {char.startingHp} HP · {char.maxEnergy} Energy
          </span>
        </button>
      ))}
    </div>
  </div>
);

// ── Save dialog ───────────────────────────────────────────────────────────────

interface SaveDialogProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const SaveDialog: React.FC<SaveDialogProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState("");
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name);
  };

  return (
    <div className="save-dialog-overlay" onClick={onCancel}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="save-dialog__title">{t("deck.save")}</div>
        <form onSubmit={handleSubmit}>
          <input
            className="save-dialog__input"
            type="text"
            placeholder={t("deck.unnamed")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="save-dialog__actions" style={{ marginTop: "var(--space-md)" }}>
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn--primary">
              {t("common.confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Load deck dialog ──────────────────────────────────────────────────────────

interface LoadDeckDialogProps {
  savedDecks: SavedDeck[];
  onLoad: (deck: SavedDeck) => void;
  onDelete: (id: string) => void;
  onImportCode: (code: string) => void;
  onClose: () => void;
}

const LoadDeckDialog: React.FC<LoadDeckDialogProps> = ({
  savedDecks,
  onLoad,
  onDelete,
  onImportCode,
  onClose,
}) => {
  const { t } = useI18n();
  const [importCode, setImportCode] = useState("");

  return (
    <div className="load-deck-overlay" onClick={onClose}>
      <div className="load-deck-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="load-deck-dialog__header">
          <div className="load-deck-dialog__title">{t("deck.loadDeck")}</div>
          <button className="btn btn--ghost" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        {/* Import deck code section */}
        <div className="load-deck-import">
          <div className="load-deck-import__label">{t("deck.importCode")}</div>
          <div className="load-deck-import__row">
            <input
              className="load-deck-import__input"
              type="text"
              placeholder={t("deck.importCodePlaceholder")}
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && importCode.trim()) {
                  onImportCode(importCode);
                }
              }}
            />
            <button
              className="btn btn--primary"
              onClick={() => onImportCode(importCode)}
              disabled={!importCode.trim()}
            >
              {t("deck.import")}
            </button>
          </div>
        </div>

        {/* Saved decks section */}
        <div className="load-deck-saved">
          <div className="load-deck-saved__label">{t("deck.savedDecks")}</div>
          {savedDecks.length === 0 ? (
            <div className="load-deck-dialog__empty">{t("deck.noSavedDecks")}</div>
          ) : (
            <div className="load-deck-list">
              {savedDecks.map((deck) => (
                <div key={deck.id} className="load-deck-item">
                  <div className="load-deck-item__info">
                    <div className="load-deck-item__name">{deck.name}</div>
                    <div className="load-deck-item__meta">
                      <span>{deck.characterId}</span>
                      <span>{deck.cardIds.length} {t("deck.cardCount")}</span>
                      <span>
                        {new Date(deck.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="load-deck-item__actions">
                    <button className="btn btn--primary" onClick={() => onLoad(deck)}>
                      {t("deck.load")}
                    </button>
                    <button className="btn btn--danger" onClick={() => onDelete(deck.id)}>
                      {t("deck.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── DeckBuilder ───────────────────────────────────────────────────────────────

export const DeckBuilder: React.FC<DeckBuilderProps> = ({ searchParams, navigate }) => {
  const { t, graphqlLang } = useI18n();
  const { state, dispatch, addCard, removeCard, addRelic, removeRelic, clearDeck, setCharacter,
          loadDeck, saveDeck, deleteSavedDeck, getSavedDecks, getPermalink } = useDeck();

  const [filter, setFilter] = useState<CardFilter>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);

  // ── Fetch characters ──────────────────────────────────────────────────────

  const { data: charsData, loading: charsLoading, error: charsError } = useGraphQL<{
    characters: Character[];
  }>(CHARACTERS_QUERY, { lang: graphqlLang });

  const characters = charsData?.characters ?? [];

  // ── Fetch cards for selected character ───────────────────────────────────

  const selectedChar = useMemo(
    () => characters.find((c) => c.id === state.characterId) ?? null,
    [characters, state.characterId]
  );

  const { data: cardsData, loading: cardsLoading, error: cardsError } = useGraphQL<{
    cards: Card[];
  }>(
    CARDS_QUERY,
    { lang: graphqlLang, color: selectedChar?.cardColor ?? "" },
    !selectedChar  // skip if no character selected
  );

  // Fetch starting deck cards by ID — they may have a different color (e.g. colorless basics)
  // and won't appear in the color-filtered card pool query above.
  const startingDeckIds = selectedChar?.startingDeck ?? [];
  const { data: startingCardsData } = useGraphQL<{
    cardsByIds: Card[];
  }>(
    CARDS_BY_IDS_QUERY,
    { lang: graphqlLang, ids: startingDeckIds },
    !selectedChar || startingDeckIds.length === 0
  );

  // Also fetch current deck cards by ID (needed for permalink loading,
  // where deck card IDs may not be in the color-filtered pool yet)
  const deckUniqueIds = useMemo(
    () => [...new Set(state.cardIds)],
    [state.cardIds]
  );
  const { data: deckCardsData } = useGraphQL<{
    cardsByIds: Card[];
  }>(
    CARDS_BY_IDS_QUERY,
    { lang: graphqlLang, ids: deckUniqueIds },
    deckUniqueIds.length === 0
  );

  // Merge: pool cards + starting cards + deck cards (for permalink)
  const allCards: Card[] = useMemo(() => {
    const poolCards = cardsData?.cards ?? [];
    const startingCards = startingCardsData?.cardsByIds ?? [];
    const deckCards = deckCardsData?.cardsByIds ?? [];
    const map = new Map<string, Card>();
    for (const c of poolCards) map.set(c.id, c);
    for (const c of startingCards) if (!map.has(c.id)) map.set(c.id, c);
    for (const c of deckCards) if (!map.has(c.id)) map.set(c.id, c);
    return Array.from(map.values());
  }, [cardsData, startingCardsData, deckCardsData]);

  // ── Fetch relics for selected character ──────────────────────────────────

  const { data: relicsData } = useGraphQL<{
    relics: Relic[];
  }>(
    RELICS_QUERY,
    { lang: graphqlLang, pool: selectedChar?.cardColor ?? "" },
    !selectedChar  // skip if no character selected
  );

  const availableRelics: Relic[] = relicsData?.relics ?? [];

  // Starting relic IDs
  const startingRelicIds = useMemo(
    () => (selectedChar?.startingRelicsData ?? []).map((r) => r.id),
    [selectedChar],
  );

  // ── Synergy map (memoized for entire card pool) ────────────────────────

  const synergyMap = useMemo(() => buildSynergyMap(allCards), [allCards]);

  // Set of all synergy IDs present in the card pool (for filter visibility)
  const availableSynergies = useMemo(() => {
    const set = new Set<string>();
    for (const synergies of synergyMap.values()) {
      for (const s of synergies) set.add(s);
    }
    return set;
  }, [synergyMap]);

  // Synergy breakdown for the current deck
  const synergyBreakdown = useMemo(
    () => getDeckSynergyBreakdown(state.cardIds, synergyMap),
    [state.cardIds, synergyMap],
  );

  // ── On mount: check ?deck= param (legacy permalink support) ─────────────

  useEffect(() => {
    const encoded = searchParams.get("deck");
    if (!encoded) return;
    const decoded = decodeDeck(encoded);
    if (decoded) {
      loadDeck(decoded.characterId, decoded.cardIds);
      // Clean up URL
      navigate("/deck-building");
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refresh saved decks list whenever visibility changes ─────────────────

  useEffect(() => {
    setSavedDecks(getSavedDecks());
  }, [getSavedDecks, showSaveDialog, showLoadDialog]);

  const refreshSaved = useCallback(() => setSavedDecks(getSavedDecks()), [getSavedDecks]);

  // ── Character selection ───────────────────────────────────────────────────

  const handleSelectCharacter = useCallback(
    (char: Character) => {
      setCharacter(char.id, char.startingDeck);
      setFilter({});
    },
    [setCharacter]
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as { source: string; cardId: string } | undefined;
      if (!activeData) return;

      const overId = String(over.id);

      // Dragged from pool → dropped on deck area
      if (activeData.source === "pool" && overId === "deck-area") {
        addCard(activeData.cardId);
      }
    },
    [addCard]
  );

  // ── Active drag card (for DragOverlay) ───────────────────────────────────

  const activeDragCard = useMemo(() => {
    if (!activeDragId) return null;
    // format: "pool::cardId"
    const cardId = activeDragId.startsWith("pool::")
      ? activeDragId.slice(6)
      : null;
    return cardId ? allCards.find((c) => c.id === cardId) ?? null : null;
  }, [activeDragId, allCards]);

  // ── Save deck ─────────────────────────────────────────────────────────────

  const handleSaveConfirm = useCallback(
    (name: string) => {
      saveDeck(name);
      setShowSaveDialog(false);
      refreshSaved();
    },
    [saveDeck, refreshSaved]
  );

  const handleLoadDeck = useCallback(
    (deck: SavedDeck) => {
      loadDeck(deck.characterId, deck.cardIds, deck.relicIds);
      setShowLoadDialog(false);
    },
    [loadDeck]
  );

  const handleDeleteDeck = useCallback(
    (id: string) => {
      if (!confirm(t("deck.deleteConfirm"))) return;
      deleteSavedDeck(id);
      refreshSaved();
    },
    [deleteSavedDeck, refreshSaved, t]
  );

  const handleShare = useCallback(async () => {
    if (!state.characterId || state.cardIds.length === 0) return;
    const code = encodeDeck(state.characterId, state.cardIds);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [state.characterId, state.cardIds]);

  const handleImportCode = useCallback(
    (code: string) => {
      const decoded = decodeDeck(code.trim());
      if (decoded) {
        loadDeck(decoded.characterId, decoded.cardIds);
        setShowLoadDialog(false);
      } else {
        alert(t("deck.invalidCode"));
      }
    },
    [loadDeck, t]
  );

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => getDeckStats(allCards, state.cardIds),
    [allCards, state.cardIds]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (charsLoading) {
    return (
      <div className="deck-builder">
        <div className="deck-builder__loading">Loading characters...</div>
      </div>
    );
  }

  if (charsError) {
    return (
      <div className="deck-builder">
        <div className="deck-builder__error">Error: {charsError}</div>
      </div>
    );
  }

  // Character not yet selected
  if (!state.characterId) {
    return (
      <div className="deck-builder">
        <CharacterSelect characters={characters} onSelect={handleSelectCharacter} />
        {showSaveDialog && (
          <SaveDialog
            onConfirm={handleSaveConfirm}
            onCancel={() => setShowSaveDialog(false)}
          />
        )}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="deck-builder">
        {/* Header */}
        <header className="deck-builder__header">
          <button
            className="deck-builder__header-back btn btn--ghost"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>

          <span className="deck-builder__header-title">
            {selectedChar?.name ?? "Deck Builder"}
          </span>

          {/* Starting relics + selected relics in one row */}
          {(selectedChar?.startingRelicsData?.length || state.relicIds.length > 0) && (
            <div className="deck-builder__header-relics">
              {/* Starting relics */}
              {(selectedChar?.startingRelicsData ?? []).map((relic) => (
                <div key={relic.id} className="deck-builder__header-relic-wrap" title={`${relic.name} (${t("relic.startingRelic")})`}>
                  <RelicTooltip relic={relic} size="small" />
                  <span className="deck-builder__header-relic-badge deck-builder__header-relic-badge--starting">S</span>
                </div>
              ))}
              {/* User-selected relics */}
              {state.relicIds
                .filter((id) => !startingRelicIds.includes(id))
                .map((relicId) => {
                  const relic = availableRelics.find((r) => r.id === relicId);
                  if (!relic) return null;
                  return (
                    <div key={relic.id} className="deck-builder__header-relic-wrap">
                      <RelicTooltip relic={relic} size="small" />
                      <button
                        className="deck-builder__header-relic-badge deck-builder__header-relic-badge--remove"
                        onClick={(e) => { e.stopPropagation(); removeRelic(relic.id); }}
                        title={t("relic.remove")}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="deck-builder__header-actions">
            <button
              className="btn btn--ghost"
              onClick={clearDeck}
              title={t("deck.clear")}
            >
              {t("deck.clear")}
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => dispatch({ type: "LOAD_DECK", characterId: "", cardIds: [] })}
              title={t("char.select")}
            >
              {t("char.select")}
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => setShowSaveDialog(true)}
              disabled={!state.characterId || state.cardIds.length === 0}
            >
              {t("deck.save")}
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => setShowLoadDialog(true)}
            >
              {t("deck.loadDeck")}
            </button>
            <button
              className={`btn btn--secondary${shareCopied ? " btn--copied" : ""}`}
              onClick={handleShare}
              disabled={!state.characterId || state.cardIds.length === 0}
            >
              {shareCopied ? `✓ ${t("deck.codeCopied")}` : t("deck.share")}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="deck-builder__content">
          {/* Left: Filter + Card Pool */}
          <div className="deck-builder__pool">
            <FilterBar filter={filter} onFilterChange={setFilter} availableSynergies={availableSynergies} />
            {cardsLoading ? (
              <div className="deck-builder__loading" style={{ flex: 1 }}>
                Loading cards...
              </div>
            ) : cardsError ? (
              <div className="deck-builder__error" style={{ flex: 1 }}>
                {cardsError}
              </div>
            ) : (
              <CardPool
                cards={allCards}
                deckCardIds={state.cardIds}
                filter={filter}
                onAddCard={addCard}
                synergyMap={synergyMap}
              />
            )}
          </div>

          {/* Center: Deck Area */}
          <div className="deck-builder__deck">
            <DeckArea
              cards={allCards}
              deckCardIds={state.cardIds}
              onRemoveCard={removeCard}
            />
          </div>

          {/* Right: Relics + Stats */}
          <aside className="deck-builder__sidebar">
            <RelicBrowser
              relics={availableRelics}
              selectedRelicIds={state.relicIds}
              startingRelicIds={startingRelicIds}
              onAddRelic={addRelic}
              onRemoveRelic={removeRelic}
              characterColor={selectedChar?.cardColor ?? "ironclad"}
            />
            <DeckStats stats={stats} synergyBreakdown={synergyBreakdown} />
          </aside>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeDragCard ? (
            <div className="drag-overlay" style={{ width: 160 }}>
              <div className="pool-card" style={{ pointerEvents: "none" }}>
                <div className="pool-card__cost">
                  {activeDragCard.isXCost
                    ? "X"
                    : activeDragCard.cost !== null
                    ? String(activeDragCard.cost)
                    : "?"}
                </div>
                <div className="pool-card__image">
                  {activeDragCard.imageUrl ? (
                    <img src={activeDragCard.imageUrl} alt={activeDragCard.name} />
                  ) : (
                    <div className="pool-card__image-placeholder" />
                  )}
                </div>
                <div className="pool-card__info">
                  <div className="pool-card__name">{activeDragCard.name}</div>
                  <div className="pool-card__meta">
                    <span style={{ fontWeight: 700 }}>{activeDragCard.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {showSaveDialog && (
          <SaveDialog
            onConfirm={handleSaveConfirm}
            onCancel={() => setShowSaveDialog(false)}
          />
        )}

        {showLoadDialog && (
          <LoadDeckDialog
            savedDecks={savedDecks}
            onLoad={handleLoadDeck}
            onDelete={handleDeleteDeck}
            onImportCode={handleImportCode}
            onClose={() => setShowLoadDialog(false)}
          />
        )}
      </div>
    </DndContext>
  );
};
