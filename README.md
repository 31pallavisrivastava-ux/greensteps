# GreenSteps

**GreenSteps** is a GHG Protocol–aligned personal carbon footprint PWA built for everyday life in India — commute, electricity, quick-commerce deliveries (Blinkit, Zepto, Swiggy, Zomato), plastic waste, and context-aware sustainability checklists.

Emission factors use **CEA Grid V21** (0.7117 kg CO₂/kWh), IPCC fuel factors, and India-specific delivery benchmarks, aligned with [NCMA India GHG Protocol](https://ghg.ncmaindia.org/) guidance.

## Stack

| Layer | Tech |
|-------|------|
| **Client** | React 19, Vite, Tailwind CSS 4, Recharts, PWA (Workbox) |
| **Server** | Express 5, Prisma, SQLite (dev) |
| **Shared** | TypeScript types, enums, merchant packaging defaults |

## Quick start

```bash
cd carbon-footprint-pwa
npm install
cp server/.env.example server/.env
npm run db:push
npm run db:seed
npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/health |

**Demo login:** `demo@carbon.local` / `demo1234`

## App navigation

Four bottom tabs keep the UI focused:

| Tab | Purpose |
|-----|---------|
| **Home** | Weekly footprint hero, budget ring, top challenge, quick actions |
| **Log** | Add trips, fuel, electricity, deliveries, or plastic |
| **Guide** | Context checklists (beach, school, home, travel, market) + tips |
| **Impact** | Charts, collapsible breakdown, challenges, budget, share |

Additional routes: `/class` (school leaderboard), `/trips`, `/fuel`, etc. (reachable from Log).

## Features

### Footprint tracking (GHG scopes)

| Area | Scope | What you log |
|------|-------|--------------|
| Trips | 3 | GPS + mode confirmation (bus, metro, car, walk, cycle…) |
| Fuel | 1 | Petrol / diesel / CNG fill-ups |
| Energy | 1+2 | kWh, LPG, optional solar offset |
| Deliveries | 3 | Blinkit, Zepto, Swiggy Instamart, Swiggy Food, Zomato |
| Plastic | 3 | Purchase-linked + household disposal / recycling |

### Engagement & motivation

- **Weekly challenges** — e.g. 3 delivery-free days, 5 bus/metro trips, school/beach checklist
- **Streaks** — delivery-free, public transport, walk/cycle
- **Science-based budget** — ~44 kg/week fair share (~2.3 t/person/year IPCC equity path) with progress ring
- **Community comparison** — percentile rank vs benchmark users
- **Class leaderboard** — create/join with a code; ranked by CO₂ saved
- **AQI nudges** — local air quality (Open-Meteo) with transport tips
- **Share milestones** — text share + WhatsApp-ready PNG image cards
- **Rewards** — celebrations, badges, weekly wins after logging

### Context checklists (Guide)

Interactive checklists for where you are today:

- 🏖️ **Beach** — reusable bottle, carry trash, public transport, reef-safe sunscreen
- 🏫 **School** — tiffin box, bus/metro, lights off, recycle
- 🏠 **Home** — AC at 26°C, segregate waste, skip extra deliveries
- ✈️ **Travel** — train over taxi, refill bottle
- 🛒 **Market** — cloth bag, local produce, bulk packs

Each context has a colorful gradient banner and SVG illustration.

## API overview

```
GET  /api/health
POST /api/auth/login | /register
GET  /api/users/me
GET  /api/trips
POST /api/trips/draft | /:id/confirm
GET  /api/insights/weekly
GET  /api/engage/dashboard      # challenges, streaks, budget, AQI
GET  /api/guide/contexts | /comparison | /milestones/share
POST /api/groups                # create class
POST /api/groups/join
GET  /api/groups/:id/leaderboard
```

Phase 2 stubs: OCR (`/api/fuel/ocr`, `/api/energy/ocr`, `/api/purchases/ocr`), email ingest, offline sync queue.

## Project structure

```
carbon-footprint-pwa/
├── client/                 # React PWA
│   ├── src/pages/          # Home, Log, Guide, Impact, Class, …
│   ├── src/components/     # UI, engage, visuals (SVG illustrations)
│   └── src/lib/            # API, auth, share cards
├── server/
│   ├── src/modules/        # emissions, rewards, guide, engage, groups
│   ├── src/routes/         # Express routers
│   ├── data/               # factors, checklists, challenges, cities
│   └── prisma/             # schema + seed
└── shared/                 # @carbon/shared types & enums
```

## Scripts

```bash
npm run dev          # client :5173 + server :3001
npm run build        # shared → server → client
npm run db:push      # apply Prisma schema (required after model changes)
npm run db:seed      # emission factors, merchants, demo user
```

## Configuration

`server/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
PORT=3001
```

Set your city via `PATCH /api/users/me` with `{ "city": "Mumbai" }` for AQI (supports Delhi, Mumbai, Bengaluru, and 9 other Indian cities).

## Differentiation

Compared to generic carbon calculators and offset-first apps:

- **India-native** — quick-commerce merchants, CEA grid, urban commute patterns
- **Reduce first** — budget, challenges, and checklists before offsets
- **Context-aware** — beach / school / home nudges, not one static survey
- **Plastic + delivery together** — upstream orders and downstream disposal
- **Social** — class leaderboard + shareable image milestones

## License

Private / local development. Adjust licensing as needed for your deployment.
