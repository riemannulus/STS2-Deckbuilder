import React from "react";
import type { DeckStats as DeckStatsData } from "../../shared/deck-utils";
import type { SynergyBreakdown } from "../../shared/synergy-utils";
import { getSynergyDef } from "../../shared/synergy-utils";
import { useI18n } from "../context/I18nContext";

interface DeckStatsProps {
  stats: DeckStatsData;
  synergyBreakdown?: SynergyBreakdown[];
}

const TYPE_CONFIG: Array<{ key: string; labelKey: string; barClass: string }> = [
  { key: "Attack", labelKey: "deck.stats.attacks", barClass: "deck-stats__bar-fill--attack" },
  { key: "Skill",  labelKey: "deck.stats.skills",  barClass: "deck-stats__bar-fill--skill"  },
  { key: "Power",  labelKey: "deck.stats.powers",  barClass: "deck-stats__bar-fill--power"  },
];

// Build the cost labels we want to show in order: X, 0, 1, 2, 3, 4, 5+
// In costCurve, X-cost cards use key -1
const COST_DISPLAY: Array<{ key: number; label: string }> = [
  { key: -1, label: "X" },
  { key: 0,  label: "0" },
  { key: 1,  label: "1" },
  { key: 2,  label: "2" },
  { key: 3,  label: "3" },
  { key: 4,  label: "4" },
  { key: 5,  label: "5+" },
];

export const DeckStats: React.FC<DeckStatsProps> = ({ stats, synergyBreakdown }) => {
  const { t } = useI18n();
  const total = stats.total;

  // For 5+, aggregate all costs >= 5 (excluding X / -1)
  const costCounts: Record<number, number> = {};
  for (const [rawKey, count] of Object.entries(stats.costCurve)) {
    const k = Number(rawKey);
    if (k === -1) {
      costCounts[-1] = (costCounts[-1] ?? 0) + count;
    } else if (k >= 5) {
      costCounts[5] = (costCounts[5] ?? 0) + count;
    } else {
      costCounts[k] = (costCounts[k] ?? 0) + count;
    }
  }

  const maxCostCount = Math.max(1, ...Object.values(costCounts));

  return (
    <div className="deck-stats">
      <div className="deck-stats__title">Statistics</div>

      {/* Total */}
      <div className="deck-stats__row">
        <span className="deck-stats__row-label">{t("deck.stats.total")}</span>
        <span className="deck-stats__row-value">{total}</span>
      </div>

      <div className="deck-stats__row">
        <span className="deck-stats__row-label">Avg. Cost</span>
        <span className="deck-stats__row-value">{stats.averageCost.toFixed(1)}</span>
      </div>

      <div className="deck-stats__divider" />

      {/* By type */}
      <div className="deck-stats__type-row">
        {TYPE_CONFIG.map(({ key, labelKey, barClass }) => {
          const count = stats.byType[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="deck-stats__type-item">
              <div className="deck-stats__type-label-row">
                <span className="deck-stats__type-label">{t(labelKey)}</span>
                <span className="deck-stats__type-count">{count} ({pct}%)</span>
              </div>
              <div className="deck-stats__bar-track">
                <div
                  className={`deck-stats__bar-fill ${barClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="deck-stats__divider" />

      {/* Cost curve */}
      <div>
        <div className="deck-stats__cost-section-title">{t("deck.stats.costCurve")}</div>
        <div className="deck-stats__cost-curve">
          {COST_DISPLAY.map(({ key, label }) => {
            const count = costCounts[key] ?? 0;
            const heightPct = Math.round((count / maxCostCount) * 100);
            return (
              <div key={key} className="deck-stats__cost-col">
                <div
                  className="deck-stats__cost-bar"
                  style={{ height: count > 0 ? `${heightPct}%` : "2px" }}
                  title={`${label}: ${count}`}
                />
                <span className="deck-stats__cost-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synergy breakdown */}
      {synergyBreakdown && synergyBreakdown.length > 0 && (
        <>
          <div className="deck-stats__divider" />
          <div>
            <div className="deck-stats__cost-section-title">{t("synergy.breakdown")}</div>
            <div className="deck-stats__synergy-list">
              {synergyBreakdown.map(({ synergyId, count }) => {
                const def = getSynergyDef(synergyId);
                if (!def) return null;
                const maxCount = synergyBreakdown[0]?.count ?? 1;
                const pct = Math.round((count / Math.max(maxCount, 1)) * 100);
                return (
                  <div key={synergyId} className="deck-stats__synergy-item">
                    <div className="deck-stats__synergy-label-row">
                      <span
                        className="deck-stats__synergy-pill"
                        style={{
                          color: def.color,
                          background: def.bgColor,
                          borderColor: def.borderColor,
                        }}
                      >
                        {t(def.labelKey)}
                      </span>
                      <span className="deck-stats__synergy-count">{count}</span>
                    </div>
                    <div className="deck-stats__bar-track">
                      <div
                        className="deck-stats__bar-fill"
                        style={{ width: `${pct}%`, background: def.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
