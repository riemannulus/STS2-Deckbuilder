# STS2 Deck Builder

A deck building helper web app for **Slay the Spire 2** — create, optimize, and share decks with instant synergy analysis and cost curve visualization.

## Overview

STS2 Deck Builder streamlines the deck-building experience in Slay the Spire 2 with a fast, bilingual interface featuring 576 cards, 288 relics, and 5 playable characters. Drag and drop cards into your deck, watch synergies auto-detect in real-time, and share decks instantly via encoded deck codes.

**Key Features:**
- **5 Characters**: Ironclad, Silent, Defect, Necrobinder, Regent
- **576 Cards** with image-based browser and smart filtering
- **288 Relics** with synergy filtering and pool separation
- **24 Synergy Tags** with intelligent auto-detection (Poison, Strength, Block, Orbs, Doom, Stars, and more)
- **Drag & Drop Deck Building** with real-time statistics
- **Cost Curve Visualization** and synergy breakdown
- **Deck Persistence** — save locally or share via encoded deck codes
- **Bilingual** — English and Korean UI
- **Dark Theme** inspired by Slay the Spire's aesthetic

## Screenshots

See the `screenshots/` directory for visual walkthroughs of the interface.

## Features in Detail

### Character Selection
Choose from 5 characters, each with unique starting HP, energy budget, starting deck, and available card/relic pools.

### Image-Based Card Browser
Browse all 576 cards with gorgeous card artwork. Filter by:
- **Type**: Attack, Skill, Power
- **Rarity**: Basic, Common, Uncommon, Rare, Ancient
- **Cost**: 0, 1, 2, 3, X (Energy cost)
- **Synergy**: 24 synergy tags
- **Search**: Full-text card name search

### Drag & Drop Deck Building
Intuitive drag-and-drop interface. Add cards to your deck and watch the deck stats update in real-time.

### Relic Browser & Management
Browse 288 relics, filtered by:
- **Character Pool** vs **Shared Pool** separation
- **Synergy Tags** for easy discovery
- **Full-text search**

Add relics to your deck above your starting relic (automatically included).

### 24 Synergy Tags
Auto-detects card synergies:

**Core Synergies:** Poison, Strength, Block, Draw, Exhaust, Retain, Innate, Ethereal, Energy, AoE, Scry, Healing

**Additional Synergies:** Vulnerable, Weak, Dexterity, Intangible, Focus, Orbs, Summon, Doom, Stars, Sly, Discard, Plating, Vigor

Each synergy has a color-coded pill shown on compatible cards. Filter the card browser or view the synergy breakdown in your deck stats.

### Deck Statistics
Real-time deck analysis showing:
- **Total Cards**, Attack count, Skill count, Power count
- **Cost Curve** — distribution of card costs
- **Synergy Breakdown** — which synergies are present and their frequency

### Save & Load Decks
- **Save** decks to browser localStorage with custom names
- **Load** previously saved decks instantly
- **Delete** decks when no longer needed

### Share Decks via Deck Codes
Generate an encoded deck code that captures your character choice, cards, and relics. Share the code with friends — they can paste it to instantly load your exact deck.

### Internationalization (i18n)
Full English and Korean support. Switch languages with a single click; UI and all card data update instantly.

### Dark Theme
Hand-crafted dark theme with colors inspired by Slay the Spire, optimized for long deck-building sessions.

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Runtime** | [Bun](https://bun.sh) | Fast, all-in-one JavaScript runtime |
| **Backend** | GraphQL + Yoga | `graphql-yoga` for a simple, production-ready GraphQL server |
| **Database** | SQLite | `bun:sqlite` for lightweight, serverless persistence |
| **Frontend** | React 19 | Modern UI with hooks and context API |
| **Styling** | CSS Custom Properties | No build tool required; Bun's native bundler handles it |
| **Drag & Drop** | @dnd-kit | Headless, accessible drag-and-drop |
| **Data Source** | spire-codex.com | Official Slay the Spire 2 data, synced to local SQLite |
| **Testing** | bun test | 120+ tests covering codecs, resolvers, and utilities |
| **Deployment** | Docker | Multi-stage build with persistent data volumes |

## Quick Start

### Prerequisites
- [Bun 1.0+](https://bun.sh)
- (Optional) Docker & Docker Compose

### Installation & First Run

```bash
# Clone the repository
git clone <repo-url>
cd sts2-deckbuilder

# Setup: installs deps, seeds database, runs tests
bun run setup

# This installs ~60 npm dependencies, fetches 576 cards + 288 relics from spire-codex.com,
# downloads all card images, and runs 120+ tests.
# On first run, expect 2-3 minutes.
```

### Development Server

```bash
# Start with hot-reload enabled
bun --hot index.ts

# Open http://localhost:3000 in your browser
```

The development server watches for file changes and reloads automatically. HMR is enabled for smooth iteration.

### Production Build & Run

```bash
# Build and run for production
bun run start

# Runs at http://localhost:3000
```

### Running Tests

```bash
bun test
```

Runs 120+ tests covering:
- Deck code codec (encode/decode)
- GraphQL resolvers
- Database queries
- Synergy detection utilities

## Docker Deployment

### One-Command Startup

```bash
docker compose up --build -d

# First run automatically:
# 1. Installs dependencies
# 2. Seeds SQLite database
# 3. Downloads all card images
# 4. Starts the server

# App is available at http://localhost:3000
```

### Persistent Data

Data is stored in a Docker volume (`sts2-data`), so:
- Database persists across container restarts
- Card images persist (no re-download on restart)
- Remove volume if you want to clear everything: `docker volume rm sts2-data`

### Force Re-Seed

To clear data and re-download everything:

```bash
docker compose run app --reseed
```

### Logs

```bash
docker compose logs -f app
```

### Shutdown

```bash
docker compose down
```

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **dev** | `bun --hot index.ts` | Development server with HMR |
| **start** | `bun run index.ts` | Production server |
| **setup** | `bash scripts/setup.sh` | Install, seed, and test |
| **seed** | `bun run src/server/db/seed.ts` | Fetch card data and download images |
| **reseed** | `bash scripts/reseed.sh` | Clear database and images; start fresh |
| **test** | `bun test` | Run 120+ tests |
| **docker:build** | `docker compose build` | Build Docker image |
| **docker:up** | `docker compose up -d` | Start Docker containers |
| **docker:down** | `docker compose down` | Stop Docker containers |

## Project Structure

```
sts2-deckbuilder/
├── src/
│   ├── client/                    # Frontend (React 19)
│   │   ├── app.tsx               # Root app component
│   │   ├── index.html            # HTML entry point
│   │   ├── components/           # UI components (CharacterSelect, DeckBuilder, etc.)
│   │   ├── context/              # React Context (DeckContext, I18nContext)
│   │   ├── hooks/                # Custom hooks (useRouter, useGraphQL)
│   │   └── styles/               # CSS (global, cards, deck-builder)
│   ├── server/                    # Backend (Bun + GraphQL)
│   │   ├── db/
│   │   │   ├── connection.ts      # SQLite connection pool
│   │   │   ├── queries.ts         # Database queries
│   │   │   ├── schema.sql         # SQLite schema (cards, relics, characters, etc.)
│   │   │   └── seed.ts            # Fetch data from spire-codex.com API
│   │   ├── services/
│   │   │   └── spire-codex.ts     # API client for spire-codex.com
│   │   └── graphql/
│   │       ├── schema.ts          # GraphQL schema definition
│   │       └── resolvers.ts       # GraphQL resolver functions
│   ├── shared/
│   │   ├── types.ts               # Shared TypeScript interfaces
│   │   ├── constants.ts           # 24 synergy definitions, UI strings (en/ko)
│   │   ├── codec.ts               # Deck code encode/decode logic
│   │   ├── synergy-utils.ts       # Synergy detection utilities
│   │   └── deck-utils.ts          # Deck manipulation utilities
│   └── __tests__/                 # Test files
│       ├── codec.test.ts
│       ├── resolvers.test.ts
│       ├── db-queries.test.ts
│       └── deck-utils.test.ts
├── scripts/
│   ├── setup.sh                   # Full setup (install, seed, test)
│   ├── reseed.sh                  # Clear DB and images
│   └── entrypoint.sh              # Docker entrypoint
├── index.ts                       # Bun server entry point
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── README.md                      # This file
```

## Data Source & Credits

All card, relic, character, and keyword data is sourced from **[spire-codex.com](https://spire-codex.com)**, the official comprehensive database for Slay the Spire 2.

**Fetching Data:**
- The seed script (`src/server/db/seed.ts`) periodically fetches fresh data from spire-codex.com's API
- To support Korean translations, the seed script queries `?lang=kor` to retrieve Korean card names and descriptions
- Card artwork is automatically downloaded from spire-codex.com's image CDN

**Attribution:**
- Game data and artwork: Spire Codex and Mega Crit Games
- Translations: Community contributors to Spire Codex

## Development Workflow

### Adding a New Card Filter

1. Update the `CardFilter` interface in `src/shared/types.ts`
2. Add filter UI in `src/client/components/FilterBar.tsx`
3. Update the GraphQL query in `src/server/graphql/schema.ts` and `resolvers.ts`
4. Add tests in `src/__tests__/`

### Adding a New Synergy

1. Add a new entry to `SYNERGY_DEFINITIONS` in `src/shared/constants.ts`
2. Add i18n strings to `UI_STRINGS` (both `en` and `ko`)
3. Update the synergy detection logic if needed in `src/shared/synergy-utils.ts`
4. Test with `bun test`

### Updating Card Data

```bash
bun run seed
```

This fetches the latest data from spire-codex.com and updates the local SQLite database.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
PORT=3001 bun --hot index.ts
```

### Database Corruption
Clear the database and reseed:
```bash
bun run reseed
```

Or with Docker:
```bash
docker volume rm sts2-data
docker compose up --build
```

### Image Download Issues
If card images fail to download during seeding:
1. Check internet connectivity
2. Verify spire-codex.com is accessible
3. Manually clear the images directory and reseed:
   ```bash
   rm -rf public/images
   bun run seed
   ```

### Tests Failing
Ensure all dependencies are installed:
```bash
bun install
bun test
```

If tests still fail, check for SQLite locking issues — close any other processes accessing `sts2.db`.

## License

MIT

---

**Built with Bun, React, GraphQL, and a passion for deck building.**
