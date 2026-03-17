import React from "react";
import { useI18n } from "../context/I18nContext";

interface CharacterPreview {
  id: string;
  nameEn: string;
  nameKo: string;
  colorVar: string;
  bgColor: string;
  icon: string;
  tagline: string;
}

const CHARACTERS: CharacterPreview[] = [
  {
    id: "ironclad",
    nameEn: "Ironclad",
    nameKo: "아이언클래드",
    colorVar: "var(--color-ironclad)",
    bgColor: "rgba(192,57,43,0.15)",
    icon: "⚔️",
    tagline: "Strength & Fury",
  },
  {
    id: "silent",
    nameEn: "Silent",
    nameKo: "사일런트",
    colorVar: "var(--color-silent)",
    bgColor: "rgba(39,174,96,0.15)",
    icon: "🗡️",
    tagline: "Poison & Shivs",
  },
  {
    id: "defect",
    nameEn: "Defect",
    nameKo: "디펙트",
    colorVar: "var(--color-defect)",
    bgColor: "rgba(41,128,185,0.15)",
    icon: "⚡",
    tagline: "Orbs & Lightning",
  },
  {
    id: "necrobinder",
    nameEn: "Necrobinder",
    nameKo: "네크로바인더",
    colorVar: "var(--color-necrobinder)",
    bgColor: "rgba(142,68,173,0.15)",
    icon: "💀",
    tagline: "Death & Curses",
  },
  {
    id: "regent",
    nameEn: "Regent",
    nameKo: "리전트",
    colorVar: "var(--color-regent)",
    bgColor: "rgba(230,126,34,0.15)",
    icon: "👑",
    tagline: "Gold & Authority",
  },
];

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { t, lang } = useI18n();

  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--nav-height))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-2xl) var(--space-md)",
          paddingTop: "calc(var(--space-2xl) * 1.5)",
          background: `radial-gradient(ellipse at 50% 0%, rgba(233,69,96,0.12) 0%, transparent 60%),
                       radial-gradient(ellipse at 80% 50%, rgba(41,128,185,0.08) 0%, transparent 50%)`,
          textAlign: "center",
        }}
      >
        {/* Decorative top accent */}
        <div
          style={{
            width: 60,
            height: 3,
            background: "var(--text-accent)",
            borderRadius: 2,
            marginBottom: "var(--space-lg)",
          }}
        />

        <h1
          style={{
            fontSize: "clamp(2rem, 6vw, var(--font-size-3xl))",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
            marginBottom: "var(--space-md)",
            lineHeight: 1.2,
          }}
        >
          {t("landing.hero.title")}
        </h1>

        <p
          style={{
            fontSize: "var(--font-size-lg)",
            color: "var(--text-secondary)",
            maxWidth: 520,
            marginBottom: "var(--space-xl)",
            lineHeight: 1.6,
          }}
        >
          {t("landing.hero.subtitle")}
        </p>

        <button
          onClick={() => navigate("/deck-building")}
          style={{
            padding: "14px 36px",
            fontSize: "var(--font-size-lg)",
            fontWeight: 700,
            color: "#fff",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--border-radius)",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(233,69,96,0.4)",
            transition: "all var(--transition-fast)",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(233,69,96,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-primary)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(233,69,96,0.4)";
          }}
        >
          {t("landing.hero.cta")}
        </button>
      </section>

      {/* Character Preview Section */}
      <section
        style={{
          width: "100%",
          maxWidth: "var(--max-width)",
          padding: "var(--space-2xl) var(--space-md)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: 700,
            color: "var(--text-secondary)",
            marginBottom: "var(--space-xl)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {t("char.select")}
        </h2>

        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              char={char}
              lang={lang}
              onClick={() => navigate("/deck-building")}
            />
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section
        style={{
          width: "100%",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-color)",
          borderBottom: "1px solid var(--border-color)",
          padding: "var(--space-xl) var(--space-md)",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-width)",
            margin: "0 auto",
            display: "flex",
            gap: "var(--space-xl)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "🃏", label: lang === "ko" ? "전체 카드 데이터베이스" : "Full Card Database" },
            { icon: "💾", label: lang === "ko" ? "덱 저장 & 공유" : "Save & Share Decks" },
            { icon: "📊", label: lang === "ko" ? "덱 통계 분석" : "Deck Statistics" },
            { icon: "🌐", label: lang === "ko" ? "한국어 지원" : "Korean Support" },
          ].map((feature) => (
            <div
              key={feature.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                color: "var(--text-secondary)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

interface CharacterCardProps {
  char: CharacterPreview;
  lang: string;
  onClick: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ char, lang, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "var(--card-width)",
        height: "var(--card-height)",
        background: hovered ? char.bgColor : "var(--bg-surface)",
        border: `2px solid ${hovered ? char.colorVar : "var(--border-color)"}`,
        borderRadius: "var(--border-radius-lg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-sm)",
        cursor: "pointer",
        transition: "all var(--transition-normal)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 12px 32px rgba(0,0,0,0.5), 0 0 20px ${char.colorVar}40`
          : "var(--shadow-sm)",
        padding: "var(--space-md)",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "2.5rem" }}>{char.icon}</span>

      <div
        style={{
          width: 40,
          height: 3,
          background: char.colorVar,
          borderRadius: 2,
          opacity: hovered ? 1 : 0.5,
          transition: "opacity var(--transition-normal)",
        }}
      />

      <span
        style={{
          fontWeight: 700,
          fontSize: "var(--font-size-md)",
          color: hovered ? char.colorVar : "var(--text-primary)",
          transition: "color var(--transition-normal)",
        }}
      >
        {lang === "ko" ? char.nameKo : char.nameEn}
      </span>

      <span
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--text-secondary)",
          opacity: hovered ? 1 : 0.6,
          transition: "opacity var(--transition-normal)",
        }}
      >
        {char.tagline}
      </span>
    </div>
  );
};
