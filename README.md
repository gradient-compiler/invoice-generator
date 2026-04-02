# Invoice Generator

A full-stack invoice and business management system for service-based businesses. Built with a focus on tuition providers and Singapore-based billing workflows (SGD currency, PayNow QR codes, GST support).

## Features

- **Client management** — store client details, contact info, grade levels, and parent names
- **Session tracking** — log individual service sessions with duration, rates, and status
- **Invoice generation** — convert sessions to invoices with line items, discounts, and GST
- **Multiple PDF templates** — Classic, Clean Professional, and Modern Minimal layouts
- **Receipts** — generate payment receipts with PayNow QR codes
- **Credit notes** — issue and track credit notes with expiration dates
- **Dashboard** — overview of business activity and financials
- **Flexible rate tiers** — hourly, fixed, per-session, and per-unit pricing

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Radix UI, Tailwind CSS 4 |
| Database | SQLite via Drizzle ORM |
| PDF | @react-pdf/renderer |
| Forms | React Hook Form + Zod |

## Prerequisites

- Node.js (LTS version recommended)
- npm

## Installation & Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd invoice-generator

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The SQLite database is created automatically at `data/invoice-generator.db` on first run — no additional database setup is required.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes (clients, invoices, receipts, sessions, …)
│   ├── clients/      # Client management pages
│   ├── invoices/     # Invoice pages
│   ├── receipts/     # Receipt pages
│   ├── sessions/     # Session tracking pages
│   └── settings/     # App settings page
├── components/
│   ├── layout/       # Header, sidebar, page container
│   └── ui/           # Radix UI wrapper components
├── db/               # Drizzle ORM schema, migrations, seed
├── lib/              # Utility helpers (GST, currency, PDF rendering, …)
├── pdf/
│   ├── templates/    # Invoice PDF templates
│   └── receipt-templates/
└── types/            # Shared TypeScript types
data/                 # SQLite database (gitignored, auto-created)
```
