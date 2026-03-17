import React from "react";
import type { Character } from "../../shared/types";
import { useGraphQL } from "../hooks/use-graphql";
import { useI18n } from "../context/I18nContext";
import { RelicTooltip } from "./RelicTooltip";

interface CharacterSelectProps {
  onSelect: (characterId: string, startingDeck: string[]) => void;
}

interface CharactersQueryResult {
  characters: Character[];
}

const GET_CHARACTERS = `
  query GetCharacters($lang: Language) {
    characters(lang: $lang) {
      id name description startingHp maxEnergy startingDeck startingRelics color cardColor imageUrl
      startingRelicsData {
        id name description flavor rarity imageUrl
      }
    }
  }
`;

const COLOR_ACCENT_MAP: Record<string, string> = {
  red: "#e74c3c",
  green: "#2ecc71",
  blue: "#3498db",
  purple: "#9b59b6",
  orange: "#e67e22",
};

const CharacterCard: React.FC<{
  character: Character;
  onSelect: (characterId: string, startingDeck: string[]) => void;
}> = ({ character, onSelect }) => {
  const { t } = useI18n();
  const accent = COLOR_ACCENT_MAP[character.color] ?? "#666";

  return (
    <button
      type="button"
      onClick={() => onSelect(character.id, character.startingDeck)}
      style={{
        background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)",
        border: `2px solid ${accent}40`,
        borderTop: `3px solid ${accent}`,
        borderRadius: "12px",
        padding: "0",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px) scale(1.02)";
        el.style.boxShadow = `0 8px 32px ${accent}40`;
        el.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.boxShadow = "";
        el.style.borderColor = `${accent}40`;
        el.style.borderTopColor = accent;
      }}
    >
      {/* Image area */}
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          background: `linear-gradient(135deg, ${accent}20 0%, #0a0a1a 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontSize: "3rem",
              opacity: 0.3,
              userSelect: "none",
            }}
          >
            ⚔
          </span>
        )}
        {/* Color glow overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 100%, ${accent}30 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Info area */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#f0e6d3",
            marginBottom: "4px",
            letterSpacing: "0.02em",
          }}
        >
          {character.name}
        </div>

        <div
          style={{
            fontSize: "0.72rem",
            color: "#8a8a9a",
            marginBottom: "8px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {character.description}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#e74c3c",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span style={{ fontSize: "0.65rem" }}>❤</span>
            {t("char.hp")}: {character.startingHp}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#f39c12",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span style={{ fontSize: "0.65rem" }}>⚡</span>
            {t("char.energy")}: {character.maxEnergy}
          </span>
        </div>

        {character.startingRelicsData && character.startingRelicsData.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div
              style={{
                fontSize: "0.65rem",
                color: "#8a8a9a",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
                marginBottom: "6px",
              }}
            >
              {t("relic.startingRelic")}
            </div>
            <div
              style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
              onClick={(e) => e.stopPropagation()}
            >
              {character.startingRelicsData.map((relic) => (
                <RelicTooltip key={relic.id} relic={relic} size="small" />
              ))}
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  const { t, graphqlLang } = useI18n();

  const { data, loading, error } = useGraphQL<CharactersQueryResult>(
    GET_CHARACTERS,
    { lang: graphqlLang }
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          color: "#8a8a9a",
          fontSize: "0.9rem",
          gap: "10px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "18px",
            height: "18px",
            border: "2px solid #8a8a9a40",
            borderTopColor: "#8a8a9a",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        Loading characters...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#e74c3c",
          fontSize: "0.9rem",
        }}
      >
        Failed to load characters: {error}
      </div>
    );
  }

  const characters = data?.characters ?? [];

  return (
    <div>
      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#f0e6d3",
          marginBottom: "20px",
          textAlign: "center",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {t("char.select")}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

export default CharacterSelect;
