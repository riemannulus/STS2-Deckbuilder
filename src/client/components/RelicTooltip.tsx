import React, { useState, useRef } from "react";
import type { Relic } from "../../shared/types";
import { stripBBCode } from "./CardComponent";

export interface RelicTooltipProps {
  relic: Relic;
  size?: "small" | "medium";
}

const RARITY_COLORS: Record<string, string> = {
  starter:  "#8a8a9a",
  common:   "#c0c0d8",
  uncommon: "#2ecc71",
  rare:     "#f39c12",
  boss:     "#9b59b6",
  event:    "#3498db",
};

const rarityColor = (rarity: string): string =>
  RARITY_COLORS[rarity.toLowerCase()] ?? "#8a8a9a";

export const RelicTooltip: React.FC<RelicTooltipProps> = ({ relic, size = "small" }) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; flipBelow: boolean }>({ top: 0, left: 0, flipBelow: false });
  const iconRef = useRef<HTMLDivElement>(null);
  const px = size === "small" ? 32 : 48;
  const color = rarityColor(relic.rarity);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const tooltipWidth = 260;
      const tooltipHeight = 200; // estimated max height
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

      // If tooltip would go above viewport, show it below the icon instead
      const flipBelow = rect.top - tooltipHeight - 8 < 0;
      const top = flipBelow
        ? rect.bottom + 8
        : rect.top - 8;

      setTooltipPos({ top, left, flipBelow });
    }
    setVisible(true);
  };

  return (
    <div
      ref={iconRef}
      className={`relic relic--${size}`}
      style={{ position: "relative", display: "inline-block", width: px, height: px }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
      onFocus={handleMouseEnter}
      onBlur={() => setVisible(false)}
    >
      {/* Relic icon */}
      {relic.imageUrl ? (
        <img
          src={relic.imageUrl}
          alt={relic.name}
          width={px}
          height={px}
          style={{
            width: px,
            height: px,
            objectFit: "contain",
            borderRadius: 4,
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: px,
            height: px,
            borderRadius: 4,
            background: "#1a1a2e",
            border: `1px solid ${color}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: px * 0.5,
            color,
          }}
        >
          ◆
        </div>
      )}

      {/* Tooltip - rendered with fixed positioning to avoid overflow issues */}
      {visible && (
        <div
          className="relic-tooltip"
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: tooltipPos.flipBelow ? "none" : "translateY(-100%)",
            borderColor: color,
            width: 260,
            zIndex: 9999,
          }}
          role="tooltip"
        >
          {/* Relic image in tooltip */}
          {relic.imageUrl && (
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <img
                src={relic.imageUrl}
                alt={relic.name}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.3)",
                  padding: 4,
                }}
              />
            </div>
          )}
          <div className="relic-tooltip__name" style={{ color }}>
            {relic.name}
          </div>
          <div className="relic-tooltip__rarity" style={{ color, opacity: 0.8 }}>
            {relic.rarity}
          </div>
          <div className="relic-tooltip__description">
            {stripBBCode(relic.description)}
          </div>
          {relic.flavor && (
            <div className="relic-tooltip__flavor">
              {stripBBCode(relic.flavor)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelicTooltip;
