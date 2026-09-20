# GV Wohnungen

Bezahlbare Mietwohnungen in der Schweiz — eine Plattform, die Inserate von verschiedenen Anbietern bündelt und durchsuchbar macht.

## Features

- 🔍 **Wohnungssuche** mit Filtern (Kanton, Preis, Zimmeranzahl)
- 🏠 **Echte Inserate** von Homegate, Comparis und Flatfox
- 💳 **Stripe Abo** (CHF 5.90/Woche) für Inserat-Links
- 📋 **Genossenschaftsliste** (CHF 29.90 einmalig) mit Kontaktdaten
- 🎥 **Video-Hero** mit Pexels-Hintergrund
- 📜 **AGB, Impressum, Datenschutz** nach Schweizer Recht
- 🍪 **Cookie-Banner** mit Einwilligung
- 🗄️ **Neon PostgreSQL** für persistente Daten
- 🔐 **NextAuth.js** für Authentifizierung

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Sprache**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Datenbank**: Prisma ORM + Neon PostgreSQL
- **Auth**: NextAuth.js v4
- **Payments**: Stripe (Abo + Einmalkauf)
- **State**: Zustand + TanStack Query
- **Animationen**: Framer Motion
- **Deployment**: Vercel

## Setup

```bash
# Dependencies installieren
bun install

# Datenbank-Schema pushen
bun run db:push

# Inserate importieren
bun run prisma/import-csv.ts
bun run prisma/import-cooperatives.ts

# Dev-Server starten
bun run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://www.gv-wohnungen.online
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...
APIFY_API_TOKEN=...
```

## Demo-Zugänge

- Ohne Abo: demo@gv-wohnungen.ch / demo1234
- Mit Abo: abo@gv-wohnungen.ch / abo1234

## Live

- **Website**: https://www.gv-wohnungen.online
- **GitHub**: https://github.com/mfiereder-wq/gv-wohnungen

## Lizenz

© 2025 GV Wohnungen. Alle Rechte vorbehalten.
