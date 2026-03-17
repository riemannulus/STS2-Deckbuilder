import React from "react";
import { useI18n } from "../context/I18nContext";

interface NavBarProps {
  navigate: (path: string) => void;
  currentPath: string;
}

export const NavBar: React.FC<NavBarProps> = ({ navigate, currentPath }) => {
  const { t, lang, setLang } = useI18n();

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const linkStyle = (path: string): React.CSSProperties => ({
    padding: "var(--space-xs) var(--space-md)",
    borderRadius: "var(--border-radius)",
    fontSize: "var(--font-size-md)",
    fontWeight: isActive(path) ? 600 : 400,
    color: isActive(path) ? "var(--text-accent)" : "var(--text-secondary)",
    background: isActive(path) ? "rgba(226,183,20,0.1)" : "transparent",
    transition: "all var(--transition-fast)",
    cursor: "pointer",
    border: "none",
  });

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-xl)",
        zIndex: 100,
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Logo / Title */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 700,
            color: "var(--text-accent)",
            letterSpacing: "0.5px",
          }}
        >
          {t("nav.title")}
        </span>
      </button>

      {/* Center nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <button
          onClick={() => navigate("/deck-building")}
          style={linkStyle("/deck-building")}
          onMouseEnter={(e) => {
            if (!isActive("/deck-building")) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive("/deck-building")) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }
          }}
        >
          {t("nav.deckBuilder")}
        </button>
      </div>

      {/* Language toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--border-radius)",
          padding: "2px",
        }}
      >
        {(["en", "ko"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "var(--font-size-sm)",
              fontWeight: lang === l ? 600 : 400,
              color: lang === l ? "var(--bg-primary)" : "var(--text-secondary)",
              background: lang === l ? "var(--text-accent)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            {l === "en" ? "EN" : "KO"}
          </button>
        ))}
      </div>
    </nav>
  );
};
