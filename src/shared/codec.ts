/**
 * Permalink encode/decode for deck sharing.
 * Format before encoding: `CHARACTER_ID:CARD_ID.count,CARD_ID.count,...`
 * Cards are sorted and duplicates are counted.
 * The resulting string is base64url encoded.
 */

const toBase64Url = (str: string): string =>
  btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const fromBase64Url = (encoded: string): string => {
  const padded = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');
  return decodeURIComponent(escape(atob(padded)));
};

/**
 * Count occurrences of each card ID in the list.
 * Returns a sorted array of [cardId, count] pairs sorted by cardId for
 * deterministic output.
 */
const countAndSort = (cardIds: string[]): Array<[string, number]> => {
  const counts = cardIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
};

/**
 * Encode a deck into a base64url permalink string.
 *
 * @param characterId - The character's ID
 * @param cardIds     - Array of card IDs (may contain duplicates)
 * @returns           - base64url encoded string
 */
export const encodeDeck = (characterId: string, cardIds: string[]): string => {
  const pairs = countAndSort(cardIds);
  const cardsSegment = pairs.map(([id, count]) => `${id}.${count}`).join(',');
  const raw = `${characterId}:${cardsSegment}`;
  return toBase64Url(raw);
};

/**
 * Decode a base64url permalink string back into a deck.
 *
 * @param encoded - base64url encoded string produced by encodeDeck
 * @returns       - { characterId, cardIds } or null if the input is invalid
 */
export const decodeDeck = (
  encoded: string
): { characterId: string; cardIds: string[] } | null => {
  try {
    const raw = fromBase64Url(encoded);
    const colonIndex = raw.indexOf(':');
    if (colonIndex === -1) return null;

    const characterId = raw.slice(0, colonIndex);
    const cardsSegment = raw.slice(colonIndex + 1);

    if (!characterId) return null;

    // Empty deck is valid (no cards after the colon)
    if (!cardsSegment) return { characterId, cardIds: [] };

    const cardIds = cardsSegment
      .split(',')
      .flatMap((pair) => {
        const dotIndex = pair.lastIndexOf('.');
        if (dotIndex === -1) return [];

        const id = pair.slice(0, dotIndex);
        const count = Number(pair.slice(dotIndex + 1));

        if (!id || !Number.isInteger(count) || count < 1) return [];

        return Array<string>(count).fill(id);
      });

    return { characterId, cardIds };
  } catch {
    return null;
  }
};
