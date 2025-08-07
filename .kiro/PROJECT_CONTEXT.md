# RXN Project Quick Start Guide

## What is this?
Live Chain Reaction (RXN) - A real-time multiplayer strategy game where players trigger chain reactions to capture the board. Built with Next.js 15, React 19, and InstantDB.

## Essential Files to Read First

### 1. Understand the Project (~93% complete)
- `.kiro/specs/live-chain-reaction/PROJECT_STATUS.md` - Current implementation status
- `.kiro/specs/live-chain-reaction/requirements.md` - What the game should do
- `.kiro/specs/live-chain-reaction/design.md` - How it's architected

### 2. Core Game Logic
- `src/lib/gameLogic.ts` - Chain reaction mechanics, explosions, win conditions
- `src/types/game.ts` - TypeScript types for game state

### 3. Database Setup
- `instant.schema.ts` - Database schema (rooms, users, messages)
- `src/lib/instant.ts` - Client-side DB connection (used in React components)
- `src/lib/admin.ts` - Server-side DB connection (used in API routes)

### 4. Key Components
- `src/components/GameRoom.tsx` - Main game view for players
- `src/components/SpectatorView.tsx` - View for spectators
- `src/contexts/GameContext.tsx` - Game state management

## Directory Structure

```
/projects/rxn/
├── .kiro/specs/              # PROJECT DOCUMENTATION - START HERE
│   └── live-chain-reaction/  # Requirements, design, tasks, status
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx         # Home page (create/join game)
│   │   ├── room/[id]/       # Dynamic game room pages
│   │   └── api/             # SERVER-SIDE endpoints (use adminDb)
│   │       ├── game/        # Game actions (move, undo, start, timeout)
│   │       ├── room/        # Room management (create, join)
│   │       ├── chat/        # Chat messaging
│   │       └── user/        # User sessions
│   │
│   ├── components/          # React UI components (use db)
│   │   ├── GameBoard.tsx   # Main game grid
│   │   ├── ChatModalFixed.tsx  # Chat for players (modal)
│   │   ├── ChatPanel.tsx   # Chat for spectators (sidebar)
│   │   └── [30+ more]      # Modals, timers, controls, etc.
│   │
│   ├── lib/                 # Core utilities
│   │   ├── gameLogic.ts    # CRITICAL: Game mechanics
│   │   ├── instant.ts      # Client DB (React components)
│   │   ├── admin.ts        # Server DB (API routes)
│   │   └── hooks/          # Custom React hooks
│   │
│   └── types/              # TypeScript definitions
│       └── game.ts         # Game state types
│
├── instant.schema.ts       # Database schema definition
└── package.json           # Dependencies
```

## Key Architecture Decisions

1. **Server-Authoritative**: All game logic runs in API routes to prevent cheating
2. **Real-time Sync**: InstantDB handles all state synchronization automatically
3. **Client/Server Separation**: 
   - Components import from `@/lib/instant` (client)
   - API routes import from `@/lib/admin` (server)
4. **Dual Chat System**: ChatModal for players, ChatPanel for spectators

## Current Issues

1. **Emoji Reactions** - UI built but not syncing (waiting for InstantDB topics API)
2. **Player Stats** - Not implemented (no profile page or tracking)
3. **Error Boundaries** - Missing (app can crash on component errors)
4. **E2E Tests** - Not written yet

## How to Navigate

1. **Start with specs**: Read `.kiro/specs/live-chain-reaction/` docs
2. **Understand game flow**: Follow `GameRoom.tsx` → `gameLogic.ts` → API routes
3. **Check implementation status**: See `tasks.md` for what's done (✅) vs pending (❌)

## Quick Commands

```bash
# Install and run
npm install
npm run dev

# The game runs on http://localhost:3000
```

## Database Notes
- InstantDB provides real-time sync out of the box
- Schema is in `instant.schema.ts`
- Permissions in `instant.perms.ts`
- Room state stored in `rooms` table with embedded `gameState` object

## Testing
- Unit tests in `src/components/__tests__/`
- Run with: `npm test`
- Good coverage on game logic, missing E2E tests

---
*This guide is designed to get you productive quickly. For deep dives, see the full specs in `.kiro/specs/`*
