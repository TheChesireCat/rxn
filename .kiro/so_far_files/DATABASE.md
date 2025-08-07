# InstantDB Configuration

This document describes the database setup for the Live Chain Reaction game.

## Schema Overview

The database uses InstantDB with the following entities:

### Core Entities

1. **users** - Player profiles and statistics
   - `name`: Unique username
   - `wins`: Number of games won
   - `gamesPlayed`: Total games played
   - `createdAt`: Account creation timestamp

2. **rooms** - Game rooms with state and settings
   - `name`: Room display name
   - `status`: Current room status ('lobby' | 'active' | 'finished' | 'runaway')
   - `hostId`: ID of the room creator
   - `gameState`: Complete game state object (grid, players, current turn, etc.)
   - `settings`: Room configuration (max players, board size, time limits, etc.)
   - `history`: Array of previous game states for undo functionality
   - `createdAt`: Room creation timestamp

3. **chatMessages** - In-game chat messages
   - `roomId`: Associated room ID
   - `userId`: Message sender ID
   - `text`: Message content
   - `createdAt`: Message timestamp

### Ephemeral Features

- **Presence**: Real-time player/spectator status in rooms
- **Topics**: Temporary emoji reactions

## Security Model

The database uses a server-authoritative security model:

- **Game State**: Only server API endpoints can modify room game state
- **Chat**: Users can create/delete their own messages
- **Rooms**: Users can create rooms, only hosts can delete
- **Users**: Users can only modify their own profiles

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_INSTANT_APP_ID=your-app-id-from-instantdb-dashboard
```

## Files

- `instant.schema.ts` - Database schema definition
- `instant.perms.ts` - Security rules and permissions
- `src/lib/instant.ts` - Database client and utility functions
- `src/lib/db-test.ts` - Connection and schema testing utilities

## Usage

Import the database client:

```typescript
import { db } from '@/lib/instant';
```

Use queries for real-time data:

```typescript
const { data, isLoading, error } = db.useQuery({
  rooms: {
    $: { where: { id: roomId } }
  }
});
```

Use transactions for data mutations:

```typescript
await db.transact(
  db.tx.rooms[roomId].update({ status: 'active' })
);
```