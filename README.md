# Planning Poker

Real-time sprint estimation tool for agile teams.

## Prerequisites

- Node.js >= 18.0.0
- pnpm (`npm install -g pnpm`)

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Create server environment file:**
   ```bash
   # Windows (PowerShell)
   Copy-Item packages/server/env.example packages/server/.env

   # Linux/Mac
   cp packages/server/env.example packages/server/.env
   ```

3. **Generate Prisma client and create database:**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. **Start development servers:**
   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
packages/
├── client/     # React frontend
├── server/     # Express backend
└── shared/     # Shared types and constants
```

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, TypeScript, Prisma, Socket.IO
- **Database:** SQLite (dev) / PostgreSQL (prod)

