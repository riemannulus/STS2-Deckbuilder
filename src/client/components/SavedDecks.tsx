import React from "react";
import type { SavedDeck } from "../../shared/types";
import { useI18n } from "../context/I18nContext";

interface SavedDecksProps {
  savedDecks: SavedDeck[];
  onLoad: (deck: SavedDeck) => void;
  onDelete: (id: string) => void;
}

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const SavedDecks: React.FC<SavedDecksProps> = ({ savedDecks, onLoad, onDelete }) => {
  const { t } = useI18n();

  return (
    <div className="saved-decks">
      <div className="saved-decks__title">Saved Decks</div>

      {savedDecks.length === 0 ? (
        <div className="saved-decks__empty">No saved decks yet.</div>
      ) : (
        <div className="saved-decks__list">
          {savedDecks.map((deck) => (
            <div key={deck.id} className="saved-decks__item">
              <div className="saved-decks__item-name" title={deck.name}>
                {deck.name}
              </div>
              <div className="saved-decks__item-meta">
                <span>{deck.cardIds.length} cards</span>
                <span>{formatDate(deck.updatedAt)}</span>
              </div>
              <div className="saved-decks__item-actions">
                <button
                  className="btn btn--secondary"
                  style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  onClick={() => onLoad(deck)}
                >
                  {t("deck.load")}
                </button>
                <button
                  className="btn btn--danger"
                  style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  onClick={() => onDelete(deck.id)}
                >
                  {t("deck.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
