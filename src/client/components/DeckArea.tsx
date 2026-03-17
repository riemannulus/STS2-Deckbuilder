import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Card } from "../../shared/types";
import { countCards } from "../../shared/deck-utils";

interface DeckAreaProps {
  cards: Card[];
  deckCardIds: string[];
  onRemoveCard: (cardId: string) => void;
}

const TYPE_ORDER = ["Attack", "Skill", "Power"] as const;

const TYPE_COLORS: Record<string, string> = {
  Attack: "var(--color-attack, #e74c3c)",
  Skill:  "var(--color-skill, #3498db)",
  Power:  "var(--color-power, #f1c40f)",
};

const TYPE_LABEL_CLASS: Record<string, string> = {
  Attack: "deck-area__group-title--attack",
  Skill:  "deck-area__group-title--skill",
  Power:  "deck-area__group-title--power",
};

const RARITY_BORDER: Record<string, string> = {
  Basic:    "#3a3a5a",
  Common:   "#4a4a6a",
  Uncommon: "#2ecc71",
  Rare:     "#f39c12",
  Ancient:  "#9b59b6",
};

interface GroupedCard {
  card: Card;
  count: number;
}

interface CardGroup {
  type: string;
  cards: GroupedCard[];
  total: number;
}

const costDisplay = (card: Card): string => {
  if (card.isXCost) return "X";
  if (card.isXStarCost) return "X★";
  if (card.starCost !== null && card.starCost !== undefined) return `${card.starCost}★`;
  if (card.cost !== null && card.cost !== undefined) return String(card.cost);
  return "?";
};

// ── DeckCard ──────────────────────────────────────────────────────────────────

interface DeckCardProps {
  card: Card;
  count: number;
  onRemove: (cardId: string) => void;
}

const DeckCard: React.FC<DeckCardProps> = ({ card, count, onRemove }) => {
  const typeColor = TYPE_COLORS[card.type] ?? "#95a5a6";
  const rarityBorder = RARITY_BORDER[card.rarity] ?? "#3a3a5a";

  return (
    <div
      className="deck-card"
      style={{ borderColor: rarityBorder }}
      onClick={() => onRemove(card.id)}
      title={`${card.name}\nClick to remove one copy`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRemove(card.id);
        }
      }}
    >
      {/* Count badge — only when >1 */}
      {count > 1 && (
        <div className="deck-card__count-badge">×{count}</div>
      )}

      {/* Cost badge */}
      <div className="deck-card__cost">{costDisplay(card)}</div>

      {/* Card image */}
      <div className="deck-card__image">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className="deck-card__image-placeholder" />
        )}
        {/* Type color stripe */}
        <div className="deck-card__type-stripe" style={{ background: typeColor }} />
        {/* Remove overlay on hover */}
        <div className="deck-card__remove-overlay">
          <span className="deck-card__remove-icon">−</span>
        </div>
      </div>

      {/* Name */}
      <div className="deck-card__info">
        <div className="deck-card__name">{card.name}</div>
      </div>
    </div>
  );
};

// ── DeckArea ──────────────────────────────────────────────────────────────────

export const DeckArea: React.FC<DeckAreaProps> = ({ cards, deckCardIds, onRemoveCard }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "deck-area" });

  const cardMap = useMemo(
    () => new Map(cards.map((c) => [c.id, c])),
    [cards]
  );

  const deckCounts = useMemo(() => countCards(deckCardIds), [deckCardIds]);

  const groups = useMemo<CardGroup[]>(() => {
    const seen = new Set<string>();
    const uniqueIds: string[] = [];
    for (const id of deckCardIds) {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }

    const byType: Record<string, GroupedCard[]> = {};
    for (const id of uniqueIds) {
      const card = cardMap.get(id);
      if (!card) continue;
      const type = card.type;
      if (!byType[type]) byType[type] = [];
      byType[type].push({ card, count: deckCounts.get(id) ?? 1 });
    }

    for (const type of Object.keys(byType)) {
      byType[type]!.sort((a, b) => {
        const aCost = a.card.isXCost ? Infinity : (a.card.cost ?? 0);
        const bCost = b.card.isXCost ? Infinity : (b.card.cost ?? 0);
        if (aCost !== bCost) return aCost - bCost;
        return a.card.name.localeCompare(b.card.name);
      });
    }

    const toGroup = (t: string): CardGroup => {
      const groupCards = byType[t] ?? [];
      return {
        type: t,
        cards: groupCards,
        total: groupCards.reduce((s, c) => s + c.count, 0),
      };
    };

    const standardGroups = TYPE_ORDER
      .filter((t) => (byType[t]?.length ?? 0) > 0)
      .map(toGroup);

    const otherGroups = Object.keys(byType)
      .filter((t) => !TYPE_ORDER.includes(t as (typeof TYPE_ORDER)[number]))
      .sort()
      .map(toGroup);

    return [...standardGroups, ...otherGroups];
  }, [deckCardIds, cardMap, deckCounts]);

  const isEmpty = deckCardIds.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={`deck-area${isOver ? " deck-area--over" : ""}`}
    >
      <div className="deck-area__header">
        <span className="deck-area__title">Deck</span>
        <span className="deck-area__count">{deckCardIds.length} cards</span>
      </div>

      {isEmpty ? (
        <div className="deck-area__empty-state">
          <div className="deck-area__drop-zone">
            <div className="deck-area__drop-zone-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="4" width="22" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                <rect x="12" y="8" width="22" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5" />
                <path d="M17 19h6M20 16v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="deck-area__drop-zone-text">Drop cards here</p>
            <p className="deck-area__drop-zone-hint">or double-click cards to add</p>
          </div>
        </div>
      ) : (
        <div className="deck-area__body">
          {isOver && (
            <div className="deck-area__drop-indicator">
              <span>Drop to add</span>
            </div>
          )}
          {groups.map((group) => (
            <div key={group.type} className="deck-area__group">
              <div className="deck-area__group-header">
                <span
                  className={`deck-area__group-title ${
                    TYPE_LABEL_CLASS[group.type] ?? "deck-area__group-title--other"
                  }`}
                >
                  {group.type}s
                </span>
                <span className="deck-area__group-count">{group.total}</span>
              </div>
              <div className="deck-area__card-grid">
                {group.cards.map(({ card, count }) => (
                  <DeckCard
                    key={card.id}
                    card={card}
                    count={count}
                    onRemove={onRemoveCard}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
