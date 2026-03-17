import React, { useState, useMemo } from "react";
import type { Relic } from "../../shared/types";
import { useI18n } from "../context/I18nContext";
import { RelicTooltip } from "./RelicTooltip";
import {
  buildRelicSynergyMap,
  getSynergyDef,
} from "../../shared/synergy-utils";
import { SYNERGY_DEFINITIONS } from "../../shared/constants";

interface RelicBrowserProps {
  relics: Relic[];
  selectedRelicIds: string[];
  startingRelicIds: string[];
  onAddRelic: (relicId: string) => void;
  onRemoveRelic: (relicId: string) => void;
  characterColor: string;
}

const RARITY_ORDER: Record<string, number> = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  boss: 4,
  event: 5,
};

const RARITY_COLORS: Record<string, string> = {
  starter: "#8a8a9a",
  common: "#c0c0d8",
  uncommon: "#2ecc71",
  rare: "#f39c12",
  boss: "#9b59b6",
  event: "#3498db",
};

const rarityColor = (rarity: string): string =>
  RARITY_COLORS[rarity.toLowerCase()] ?? "#8a8a9a";

// ── RelicCard ────────────────────────────────────────────────────────────────

interface RelicCardProps {
  relic: Relic;
  isSelected: boolean;
  isStarting: boolean;
  onToggle: () => void;
  synergies: string[];
}

const RelicCard: React.FC<RelicCardProps> = ({
  relic,
  isSelected,
  isStarting,
  onToggle,
  synergies,
}) => {
  const { t } = useI18n();
  const color = rarityColor(relic.rarity);

  return (
    <div
      className={`relic-card${isSelected ? " relic-card--selected" : ""}${isStarting ? " relic-card--starting" : ""}`}
      style={{ borderColor: isSelected ? color : undefined }}
      onClick={isStarting ? undefined : onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isStarting && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
      title={isStarting ? t("relic.startingRelic") : isSelected ? t("relic.remove") : t("relic.add")}
    >
      <div className="relic-card__icon">
        {relic.imageUrl ? (
          <img src={relic.imageUrl} alt={relic.name} width={36} height={36} loading="lazy" />
        ) : (
          <div className="relic-card__icon-placeholder" style={{ color }}>
            &#9670;
          </div>
        )}
        {isStarting && <div className="relic-card__starting-badge">S</div>}
        {isSelected && !isStarting && <div className="relic-card__check-badge">&#10003;</div>}
      </div>
      <div className="relic-card__info">
        <div className="relic-card__name">{relic.name}</div>
        <div className="relic-card__rarity" style={{ color }}>{relic.rarity}</div>
        {synergies.length > 0 && (
          <div className="relic-card__synergies">
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
                  title={t(def.labelKey)}
                >
                  {t(def.labelKey)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── RelicBrowser ─────────────────────────────────────────────────────────────

export const RelicBrowser: React.FC<RelicBrowserProps> = ({
  relics,
  selectedRelicIds,
  startingRelicIds,
  onAddRelic,
  onRemoveRelic,
  characterColor,
}) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSynergy, setActiveSynergy] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedRelicIds), [selectedRelicIds]);
  const startingSet = useMemo(() => new Set(startingRelicIds), [startingRelicIds]);

  // Build synergy map for all relics
  const relicSynergyMap = useMemo(() => buildRelicSynergyMap(relics), [relics]);

  // Compute which synergies exist across available relics
  const availableSynergies = useMemo(() => {
    const present = new Set<string>();
    for (const tags of relicSynergyMap.values()) {
      for (const tag of tags) present.add(tag);
    }
    // Return in SYNERGY_DEFINITIONS order
    return SYNERGY_DEFINITIONS.filter((def) => present.has(def.id));
  }, [relicSynergyMap]);

  // Selected relics (non-starting) for display in collapsed summary
  const addedRelics = useMemo(
    () => relics.filter((r) => selectedSet.has(r.id) && !startingSet.has(r.id)),
    [relics, selectedSet, startingSet],
  );

  // Filter and group relics (text + synergy, AND logic)
  const filteredRelics = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = relics;

    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }

    if (activeSynergy) {
      filtered = filtered.filter((r) => {
        const synergies = relicSynergyMap.get(r.id);
        return synergies ? synergies.includes(activeSynergy) : false;
      });
    }

    // Sort by rarity order, then name
    return [...filtered].sort((a, b) => {
      const aOrder = RARITY_ORDER[a.rarity.toLowerCase()] ?? 99;
      const bOrder = RARITY_ORDER[b.rarity.toLowerCase()] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
  }, [relics, search, activeSynergy, relicSynergyMap]);

  // Group by pool
  const characterRelics = useMemo(
    () => filteredRelics.filter((r) => r.pool !== "shared"),
    [filteredRelics],
  );
  const sharedRelics = useMemo(
    () => filteredRelics.filter((r) => r.pool === "shared"),
    [filteredRelics],
  );

  const handleToggle = (relicId: string) => {
    if (selectedSet.has(relicId)) {
      onRemoveRelic(relicId);
    } else {
      onAddRelic(relicId);
    }
  };

  const handleSynergyClick = (synId: string) => {
    setActiveSynergy((prev) => (prev === synId ? null : synId));
  };

  return (
    <div className="relic-browser">
      {/* Header / toggle */}
      <button
        className="relic-browser__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="relic-browser__header-title">{t("relic.relics")}</span>
        <span className="relic-browser__header-count">
          {selectedRelicIds.length + startingRelicIds.length}
        </span>
        <span className={`relic-browser__header-chevron${expanded ? " relic-browser__header-chevron--open" : ""}`}>
          &#9660;
        </span>
      </button>

      {/* Collapsed: show added relic icons */}
      {!expanded && addedRelics.length > 0 && (
        <div className="relic-browser__summary">
          {addedRelics.map((relic) => (
            <RelicTooltip key={relic.id} relic={relic} size="small" />
          ))}
        </div>
      )}

      {/* Expanded: full browser */}
      {expanded && (
        <div className="relic-browser__body">
          {/* Search */}
          <input
            className="relic-browser__search"
            type="text"
            placeholder={t("relic.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Synergy filter row */}
          {availableSynergies.length > 0 && (
            <div className="relic-browser__synergy-filter">
              {availableSynergies.map((def) => {
                const isActive = activeSynergy === def.id;
                return (
                  <button
                    key={def.id}
                    className={`filter-bar__btn filter-bar__btn--synergy${isActive ? " filter-bar__btn--synergy-active" : ""}`}
                    style={
                      isActive
                        ? {
                            color: def.color,
                            background: def.bgColor,
                            borderColor: def.borderColor,
                            ["--synergy-color" as string]: def.color,
                            ["--synergy-bg" as string]: def.bgColor,
                            ["--synergy-border" as string]: def.borderColor,
                          }
                        : {
                            ["--synergy-color" as string]: def.color,
                            ["--synergy-bg" as string]: def.bgColor,
                            ["--synergy-border" as string]: def.borderColor,
                          }
                    }
                    onClick={() => handleSynergyClick(def.id)}
                    title={t(def.labelKey)}
                  >
                    {t(def.labelKey)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Character relics */}
          {characterRelics.length > 0 && (
            <div className="relic-browser__section">
              <div className="relic-browser__section-title">{t("relic.characterPool")}</div>
              <div className="relic-browser__grid">
                {characterRelics.map((relic) => (
                  <RelicCard
                    key={relic.id}
                    relic={relic}
                    isSelected={selectedSet.has(relic.id)}
                    isStarting={startingSet.has(relic.id)}
                    onToggle={() => handleToggle(relic.id)}
                    synergies={relicSynergyMap.get(relic.id) ?? []}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shared relics */}
          {sharedRelics.length > 0 && (
            <div className="relic-browser__section">
              <div className="relic-browser__section-title">{t("relic.sharedPool")}</div>
              <div className="relic-browser__grid">
                {sharedRelics.map((relic) => (
                  <RelicCard
                    key={relic.id}
                    relic={relic}
                    isSelected={selectedSet.has(relic.id)}
                    isStarting={startingSet.has(relic.id)}
                    onToggle={() => handleToggle(relic.id)}
                    synergies={relicSynergyMap.get(relic.id) ?? []}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredRelics.length === 0 && (
            <div className="relic-browser__empty">{t("relic.empty")}</div>
          )}
        </div>
      )}
    </div>
  );
};
