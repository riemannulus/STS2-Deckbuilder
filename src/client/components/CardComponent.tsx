import React, { useState, useRef, useEffect } from "react";
import type { Card } from "../../shared/types";

export interface CardComponentProps {
  card: Card;
  count?: number;
  isDragging?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// BBCode stripper
// ---------------------------------------------------------------------------

/**
 * Remove BBCode tags used in STS card descriptions.
 * Handles: [gold], [red], [blue], [green], [sine], [energy:N], [star:N]
 * and their closing counterparts [/gold], [/red], etc.
 */
export const stripBBCode = (text: string): string =>
  text
    .replace(/\[\/?(gold|red|blue|green|sine|energy|star)(:\d+)?\]/gi, "")
    .replace(/\[energy\]/gi, "⚡")
    .replace(/\[star\]/gi, "★")
    .trim();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABEL_MAP: Record<string, string> = {
  Attack: "ATK",
  Skill: "SKL",
  Power: "PWR",
  Status: "STS",
  Curse: "CRS",
};

const RARITY_ORDER: string[] = ["Basic", "Common", "Uncommon", "Rare", "Ancient"];

const costDisplay = (card: Card): string => {
  if (card.isXCost) return "X";
  if (card.isXStarCost) return "X★";
  if (card.starCost !== null) return `${card.starCost}★`;
  if (card.cost !== null) return String(card.cost);
  return "?";
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CostBadge: React.FC<{ card: Card; compact: boolean }> = ({ card, compact }) => (
  <div
    className="card__cost"
    style={{
      position: "absolute",
      top: compact ? "6px" : "8px",
      left: compact ? "6px" : "8px",
      width: compact ? "22px" : "28px",
      height: compact ? "22px" : "28px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%)",
      border: "2px solid #f39c1280",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: compact ? "0.65rem" : "0.8rem",
      fontWeight: 800,
      color: "#f39c12",
      zIndex: 2,
      boxShadow: "0 2px 6px #00000060",
      letterSpacing: "-0.02em",
      flexShrink: 0,
    }}
  >
    {costDisplay(card)}
  </div>
);

const CountBadge: React.FC<{ count: number; compact: boolean }> = ({ count, compact }) => (
  <div
    className="card__count"
    style={{
      position: "absolute",
      top: compact ? "6px" : "8px",
      right: compact ? "6px" : "8px",
      minWidth: compact ? "18px" : "22px",
      height: compact ? "18px" : "22px",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
      border: "1.5px solid #ff6b6b60",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: compact ? "0.6rem" : "0.7rem",
      fontWeight: 800,
      color: "#fff",
      zIndex: 2,
      padding: "0 4px",
      boxShadow: "0 2px 6px #00000060",
    }}
  >
    ×{count}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hover preview (portal-style floating card)
// ---------------------------------------------------------------------------

const CardPreview: React.FC<{ card: Card; anchorRect: DOMRect }> = ({ card, anchorRect }) => {
  const description = stripBBCode(card.description);
  const typeKey = card.type as string;
  const rarityKey = card.rarity as string;

  // Position to the right of the card; flip left if near viewport edge
  const previewWidth = 240;
  const previewHeight = 360;
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = anchorRect.right + gap;
  if (left + previewWidth > vw) left = anchorRect.left - previewWidth - gap;
  let top = anchorRect.top + (anchorRect.height - previewHeight) / 2;
  top = Math.max(8, Math.min(top, vh - previewHeight - 8));

  return (
    <div
      className="card-preview-overlay"
      style={{
        position: "fixed",
        left,
        top,
        width: previewWidth,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        className={`card card--${typeKey.toLowerCase()} card--${rarityKey.toLowerCase()}`}
        style={{ width: "100%" }}
      >
        <CostBadge card={card} compact={false} />
        <div className="card__image" style={{ height: 140 }}>
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} loading="lazy" />
          ) : (
            <div className="card__image-placeholder" />
          )}
        </div>
        <div className="card__body">
          <div className="card__name" style={{ fontSize: "0.9rem" }}>{card.name}</div>
          <div className={`card__type card__type--${typeKey.toLowerCase()}`}>
            {TYPE_LABEL_MAP[typeKey] ?? typeKey}
            <span className="card__rarity-dot" />
            <span className="card__rarity-label">{rarityKey}</span>
          </div>
          <div className="card__description">{description}</div>
          {(card.damage !== null || card.block !== null) && (
            <div className="card__stats">
              {card.damage !== null && (
                <span className="card__stat card__stat--damage">
                  ⚔ {card.damage}{card.hitCount && card.hitCount > 1 ? ` ×${card.hitCount}` : ""}
                </span>
              )}
              {card.block !== null && (
                <span className="card__stat card__stat--block">🛡 {card.block}</span>
              )}
            </div>
          )}
          {card.keywords.length > 0 && (
            <div className="card__keywords">
              {card.keywords.map((kw) => (
                <span key={kw} className="card__keyword">{kw}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  count,
  isDragging = false,
  onClick,
  compact = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const typeKey = card.type as string;
  const rarityKey = card.rarity as string;

  const typeClass = `card--${typeKey.toLowerCase()}`;
  const rarityClass = `card--${rarityKey.toLowerCase()}`;
  const draggingClass = isDragging ? "card--dragging" : "";
  const compactClass = compact ? "card--compact" : "";

  const classes = ["card", typeClass, rarityClass, draggingClass, compactClass]
    .filter(Boolean)
    .join(" ");

  const description = stripBBCode(card.description);

  const handleMouseEnter = () => {
    if (ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect());
      setHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setAnchorRect(null);
  };

  return (
    <>
      <div
        ref={ref}
        className={classes}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {/* Cost badge */}
        <CostBadge card={card} compact={compact} />

        {/* Count badge */}
        {count !== undefined && count > 1 && <CountBadge count={count} compact={compact} />}

        {/* Card image / art area */}
        {!compact && (
          <div className="card__image">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} loading="lazy" />
            ) : (
              <div className="card__image-placeholder" />
            )}
          </div>
        )}

        {/* Card body */}
        <div className="card__body">
          <div className="card__name">{card.name}</div>
          <div className={`card__type card__type--${typeKey.toLowerCase()}`}>
            {TYPE_LABEL_MAP[typeKey] ?? typeKey}
            <span className="card__rarity-dot" />
            <span className="card__rarity-label">{rarityKey}</span>
          </div>
          {!compact && <div className="card__description">{description}</div>}
          {!compact && (card.damage !== null || card.block !== null) && (
            <div className="card__stats">
              {card.damage !== null && (
                <span className="card__stat card__stat--damage">
                  ⚔ {card.damage}
                  {card.hitCount && card.hitCount > 1 ? ` ×${card.hitCount}` : ""}
                </span>
              )}
              {card.block !== null && (
                <span className="card__stat card__stat--block">🛡 {card.block}</span>
              )}
            </div>
          )}
          {!compact && card.keywords.length > 0 && (
            <div className="card__keywords">
              {card.keywords.map((kw) => (
                <span key={kw} className="card__keyword">{kw}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover preview - shows full card with image when hovering compact cards */}
      {hovered && !isDragging && anchorRect && (
        <CardPreview card={card} anchorRect={anchorRect} />
      )}
    </>
  );
};

export default CardComponent;
