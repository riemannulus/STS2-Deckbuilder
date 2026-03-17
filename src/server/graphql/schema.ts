export const typeDefs = /* GraphQL */ `
  scalar JSON

  enum Language {
    EN
    KO
  }

  type Relic {
    id: String!
    name: String!
    description: String!
    descriptionRaw: String
    flavor: String!
    rarity: String!
    pool: String!
    imageUrl: String!
  }

  type Character {
    id: String!
    name: String!
    description: String!
    startingHp: Int!
    maxEnergy: Int!
    startingDeck: [String!]!
    startingRelics: [String!]!
    startingRelicsData(lang: Language): [Relic!]!
    color: String!
    cardColor: String!
    imageUrl: String!
  }

  type Card {
    id: String!
    name: String!
    description: String!
    descriptionRaw: String
    cost: Int
    isXCost: Boolean!
    isXStarCost: Boolean!
    starCost: Int
    type: String!
    rarity: String!
    target: String
    color: String!
    damage: Int
    block: Int
    hitCount: Int
    keywords: [String!]!
    tags: [String!]!
    vars: JSON
    upgrade: JSON
    imageUrl: String!
  }

  type Keyword {
    id: String!
    name: String!
    description: String!
  }

  type DecodedDeck {
    characterId: String!
    character: Character
    cardIds: [String!]!
    cards: [Card!]!
  }

  type Query {
    characters(lang: Language): [Character!]!
    character(id: String!, lang: Language): Character
    cards(color: String!, lang: Language): [Card!]!
    cardsByIds(ids: [String!]!, lang: Language): [Card!]!
    card(id: String!, lang: Language): Card
    keywords(lang: Language): [Keyword!]!
    decodeDeck(encoded: String!, lang: Language): DecodedDeck
    relics(pool: String, lang: Language): [Relic!]!
    relic(id: String!, lang: Language): Relic
  }
`;
