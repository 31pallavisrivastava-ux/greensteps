# Carbon Footprint Tracker

GHG Protocol-aligned personal carbon footprint PWA for tracking commute, fuel, energy, delivery orders (Blinkit, Zepto, Swiggy, Zomato), and plastic waste.

## Stack

- **Client:** React 19 + Vite + Tailwind 4 + Recharts + PWA
- **Server:** Express + Prisma + SQLite (dev)
- **Shared:** TypeScript types and merchant config

Emission factors seeded from **CEA Grid V21** (0.7117 kg CO₂/kWh), IPCC fuel factors, and TERI delivery benchmarks — aligned with [NCMA India GHG Protocol](https://ghg.ncmaindia.org/).

## Quick start

```bash
cd carbon-footprint-pwa
npm install
cp server/.env.example server/.env
npm run db:push
npm run db:seed
npm run dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:3001
- **Demo login:** `demo@carbon.local` / `demo1234`

## Features

| Screen | Scope | Description |
|--------|-------|-------------|
| Today | — | Weekly summary, pending trips, quick links |
| Trips | 3 | GPS foreground tracking + mode confirmation (public/private/active) |
| Fuel | 1 | Petrol/diesel fill logging |
| Energy | 1+2 | kWh + LPG with CEA grid factor |
| Orders | 3 | Multi-merchant delivery + plastic estimates |
| Plastic | 3 | Purchase auto-log + household disposal |
| Insights | — | Scope 1/2/3 chart, what-if sliders, tips |

## Phase 2 stubs

- `POST /api/fuel/ocr` — fuel receipt OCR
- `POST /api/energy/ocr` — utility bill OCR
- `POST /api/purchases/ocr` — order screenshot OCR
- `POST /api/purchases/email-ingest` — email forward webhook
- `POST /api/offline/sync` — offline trip queue sync

## Project structure

```
carbon-footprint-pwa/
  client/     # Vite PWA
  server/     # Express API + Prisma
  shared/     # Shared types
```
