# Migration 001: Add Authentication to Users

## Overview
This migration enhances the existing `users` entity to support the name-first authentication flow.

## Changes Required

### 1. Add fields to existing `users` entity:
- `authUserId` - Links to $users.id when claimed
- `email` - Stored when username is claimed
- `nameClaimedAt` - Timestamp when name was registered
- `lastPlayedAt` - Track activity
- `sessionCount` - How many times played
- `totalOrbs` - Cumulative orbs placed
- `winRate` - Calculated win percentage

### 2. Create new entities:
- `gameResults` - Track individual game results
- `reservedNames` - Prevent certain usernames

### 3. Update existing code:
- Modify user creation to support unclaimed names
- Update stats tracking to check if name is claimed
- Add claim username flow

## Backward Compatibility
- Existing users continue to work
- Stats remain intact
- Can claim their existing username with email
