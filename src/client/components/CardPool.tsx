import React, { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card, CardFilter, SynergyTag } from "../../shared/types";
import { filterCards, sortCards, countCards } from "../../shared/deck-utils";
import { stripBBCode } from "./CardComponent";
import { getSynergyDef } from "../../shared/synergy-utils";
import { useI18n } from "../context/I18nContext";

interface CardPoolProps {
  cards: Card[];
  deckCardIds: string[];
  filter: CardFilter;
  onAddCard: (cardId: string) => void;
  /** Pre-computed synergy map: cardId -> synergy tag IDs */
  synergyMap?: Map<string, SynergyTag[]>;
}

// ── DraggableCard ────────────────────────────────────────────────────────────

interface DraggableCardProps {
  card: Card;
  deckCount: number;
  synergies: SynergyTag[];
  onDoubleClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Attack: "var(--color-attack, #e74c3c)",
  Skill: "var(--color-skill, #3498db)",
  Power: "var(--color-power, #f1c40f)",
  Status: "#95a5a6",
  Curse: "#8e44ad",
};

const RARITY_BORDER: Record<string, string> = {
  Basic: "#3a3a5a",
  Common: "#4a4a6a",
  Uncommon: "#2ecc71",
  Rare: "#f39c12",
  Ancient: "#9b59b6",
};

const costDisplay = (card: Card): string => {
  if (card.isXCost) return "X";
  if (card.isXStarCost) return "X★";
  if (card.starCost !== null && card.starCost !== undefined) return `${card.starCost}★`;
  if (card.cost !== null && card.cost !== undefined) return String(card.cost);
  return "?";
};

const SynergyPills: React.FC<{ synergies: SynergyTag[] }> = ({ synergies }) => {
  const { t } = useI18n();
  if (synergies.length === 0) return null;

  return (
    <div className="pool-card__synergies">
      {synergies.map((synId) => {
        const def = getSynergyDef(synId);
        if (!def) return null;
        return (
          <span
            key={synId}
            className="synergy-pill"
            style={{
              color: def.color,
              background: def.bgColor,
              borderColor: def.borderColor,
            }}
          >
            {t(def.labelKey)}
          </span>
        );
      })}
    </div>
  );
};

const DraggableCard: React.FC<DraggableCardProps> = ({ card, deckCount, synergies, onDoubleClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool::${card.id}`,
    data: { source: "pool", cardId: card.id },
  });

  const typeColor = TYPE_COLORS[card.type] ?? "#95a5a6";
  const rarityBorder = RARITY_BORDER[card.rarity] ?? "#3a3a5a";

  return (
    <div
      ref={setNodeRef}
      className="pool-card"
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderColor: rarityBorder,
      }}
      {...listeners}
      {...attributes}
      onDoubleClick={onDoubleClick}
    >
      {/* Deck count badge */}
      {deckCount > 0 && (
        <div className="pool-card__deck-badge">
          {deckCount}
        </div>
      )}

      {/* Cost badge */}
      <div className="pool-card__cost">
        {costDisplay(card)}
      </div>

      {/* Card image */}
      <div className="pool-card__image">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className="pool-card__image-placeholder" />
        )}
        {/* Type color stripe at bottom of image */}
        <div
          className="pool-card__type-stripe"
          style={{ background: typeColor }}
        />
      </div>

      {/* Card info */}
      <div className="pool-card__info">
        <div className="pool-card__name">{card.name}</div>
        <div className="pool-card__meta">
          <span style={{ color: typeColor, fontWeight: 700 }}>{card.type}</span>
          {(card.damage !== null || card.block !== null) && (
            <span className="pool-card__stats">
              {card.damage !== null && <span style={{ color: "#e74c3c" }}>⚔{card.damage}</span>}
              {card.block !== null && <span style={{ color: "#3498db" }}>🛡{card.block}</span>}
            </span>
          )}
        </div>
        <SynergyPills synergies={synergies} />
        <div className="pool-card__desc">{stripBBCode(card.description)}</div>
      </div>
    </div>
  );
};

// ── CardPool ─────────────────────────────────────────────────────────────────

export const CardPool: React.FC<CardPoolProps> = ({
  cards,
  deckCardIds,
  filter,
  onAddCard,
  synergyMap,
}) => {
  const deckCounts = useMemo(() => countCards(deckCardIds), [deckCardIds]);

  const filtered = useMemo(() => {
    let result = sortCards(filterCards(cards, filter));

    // Apply synergy filter if set
    if (filter.synergy && synergyMap) {
      result = result.filter((card) => {
        const cardSynergies = synergyMap.get(card.id);
        return cardSynergies ? cardSynergies.includes(filter.synergy!) : false;
      });
    }

    return result;
  }, [cards, filter, synergyMap]);

  return (
    <div className="card-pool">
      {filtered.length === 0 ? (
        <div className="card-pool__empty">No cards match the current filters.</div>
      ) : (
        <div className="card-pool__grid">
          {filtered.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              deckCount={deckCounts.get(card.id) ?? 0}
              synergies={synergyMap?.get(card.id) ?? []}
              onDoubleClick={() => onAddCard(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
