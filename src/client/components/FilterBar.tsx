import React from "react";
import type { CardFilter } from "../../shared/types";
import { CARD_TYPES, CARD_RARITIES, SYNERGY_DEFINITIONS } from "../../shared/constants";
import { useI18n } from "../context/I18nContext";

interface FilterBarProps {
  filter: CardFilter;
  onFilterChange: (filter: CardFilter) => void;
  /** Set of synergy IDs present in the current card pool (to show only relevant synergies) */
  availableSynergies?: Set<string>;
}

const COST_OPTIONS: Array<{ label: string; value: CardFilter["cost"] | undefined }> = [
  { label: "All", value: undefined },
  { label: "0",   value: 0 },
  { label: "1",   value: 1 },
  { label: "2",   value: 2 },
  { label: "3",   value: 3 },
  { label: "4",   value: 4 },
  { label: "5+",  value: 5 },
  { label: "X",   value: "X" },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange, availableSynergies }) => {
  const { t } = useI18n();

  const setType = (type: string | undefined) =>
    onFilterChange({ ...filter, type });

  const setRarity = (rarity: string | undefined) =>
    onFilterChange({ ...filter, rarity });

  const setCost = (cost: CardFilter["cost"] | undefined) =>
    onFilterChange({ ...filter, cost });

  const setSynergy = (synergy: string | undefined) =>
    onFilterChange({ ...filter, synergy });

  const setSearch = (search: string) =>
    onFilterChange({ ...filter, search: search || undefined });

  // Only show synergies that exist in the card pool
  const visibleSynergies = availableSynergies
    ? SYNERGY_DEFINITIONS.filter((s) => availableSynergies.has(s.id))
    : SYNERGY_DEFINITIONS;

  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="filter-bar__row">
        <input
          className="filter-bar__search"
          type="text"
          placeholder={t("filter.search")}
          value={filter.search ?? ""}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Type */}
      <div className="filter-bar__row">
        <span className="filter-bar__label">{t("filter.type")}</span>
        <div className="filter-bar__group">
          <button
            className={`filter-bar__btn${!filter.type ? " filter-bar__btn--active" : ""}`}
            onClick={() => setType(undefined)}
          >
            {t("filter.all")}
          </button>
          {CARD_TYPES.map((type) => (
            <button
              key={type}
              className={`filter-bar__btn${filter.type === type ? " filter-bar__btn--active" : ""}`}
              onClick={() => setType(filter.type === type ? undefined : type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rarity */}
      <div className="filter-bar__row">
        <span className="filter-bar__label">{t("filter.rarity")}</span>
        <div className="filter-bar__group">
          <button
            className={`filter-bar__btn${!filter.rarity ? " filter-bar__btn--active" : ""}`}
            onClick={() => setRarity(undefined)}
          >
            {t("filter.all")}
          </button>
          {CARD_RARITIES.map((rarity) => (
            <button
              key={rarity}
              className={`filter-bar__btn${filter.rarity === rarity ? " filter-bar__btn--active" : ""}`}
              onClick={() => setRarity(filter.rarity === rarity ? undefined : rarity)}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Cost */}
      <div className="filter-bar__row">
        <span className="filter-bar__label">{t("filter.cost")}</span>
        <div className="filter-bar__group">
          {COST_OPTIONS.map(({ label, value }) => {
            const isActive =
              value === undefined
                ? filter.cost === undefined
                : filter.cost === value;
            return (
              <button
                key={label}
                className={`filter-bar__btn${isActive ? " filter-bar__btn--active" : ""}`}
                onClick={() => setCost(isActive && value !== undefined ? undefined : value)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Synergy */}
      {visibleSynergies.length > 0 && (
        <div className="filter-bar__row">
          <span className="filter-bar__label">{t("synergy.filter")}</span>
          <div className="filter-bar__group">
            <button
              className={`filter-bar__btn${!filter.synergy ? " filter-bar__btn--active" : ""}`}
              onClick={() => setSynergy(undefined)}
            >
              {t("filter.all")}
            </button>
            {visibleSynergies.map((syn) => (
              <button
                key={syn.id}
                className={`filter-bar__btn filter-bar__btn--synergy${filter.synergy === syn.id ? " filter-bar__btn--synergy-active" : ""}`}
                style={{
                  ...(filter.synergy === syn.id
                    ? { background: syn.bgColor, color: syn.color, borderColor: syn.borderColor }
                    : { "--synergy-color": syn.color, "--synergy-bg": syn.bgColor, "--synergy-border": syn.borderColor } as React.CSSProperties),
                }}
                onClick={() => setSynergy(filter.synergy === syn.id ? undefined : syn.id)}
              >
                {t(syn.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
