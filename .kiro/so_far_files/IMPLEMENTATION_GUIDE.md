# RXN Name-First Authentication Implementation Guide

## 🎯 Goal
Allow players to play immediately with just a username, then optionally claim it with email to save stats.

## 📋 Implementation Checklist

### Phase 1: Schema Update (30 minutes)
- [ ] Backup current schema: `cp instant.schema.ts instant.schema.backup.ts`
- [ ] Replace with new schema: `cp instant.schema.ts.new instant.schema.ts`
- [ ] Push schema to InstantDB: `npm run instant:push`
- [ ] Run setup script: `node scripts/setup-auth.js`

### Phase 2: Core Components (2 hours)
- [ ] Create `/src/components/auth/UsernameEntry.tsx`
- [ ] Create `/src/components/auth/ClaimUsernameModal.tsx`
- [ ] Create API routes:
  - [ ] `/src/app/api/username/check/route.ts`
  - [ ] `/src/app/api/username/claim/route.ts`
  - [ ] `/src/app/api/player/create/route.ts`

### Phase 3: Update Existing Code (1 hour)
- [ ] Update `HomePage.tsx` to show username entry first
- [ ] Modify `SessionManager.ts` to handle claimed vs unclaimed
- [ ] Update game completion to only save stats for claimed names
- [ ] Add "Claim Username" prompt after first win

### Phase 4: Testing (30 minutes)
- [ ] Test playing as guest (unclaimed name)
- [ ] Test claiming a username with email
- [ ] Test that claimed names can't be taken
- [ ] Test stats only save for claimed names
- [ ] Test signing in with existing claimed name

### Phase 5: Polish (1 hour)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style the components to match your theme
- [ ] Add success animations

## 🚀 Quick Start Commands

```bash
# 1. Update schema
cp instant.schema.ts.new instant.schema.ts

# 2. Push to InstantDB
npm run instant:push

# 3. Run setup script
node scripts/setup-auth.js

# 4. Start dev server
npm run dev
```

## 🔑 Key Files to Create/Modify

### New Files:
1. `/src/components/auth/UsernameEntry.tsx` - Username input component
2. `/src/components/auth/ClaimUsernameModal.tsx` - Email verification modal
3. `/src/app/api/username/check/route.ts` - Check username availability
4. `/src/app/api/username/claim/route.ts` - Claim username with email
5. `/src/app/api/player/create/route.ts` - Create unclaimed player

### Modified Files:
1. `instant.schema.ts` - Enhanced schema
2. `/src/components/HomePage.tsx` - Add username entry flow
3. `/src/lib/sessionManager.ts` - Handle claimed vs unclaimed
4. Game completion logic - Only save stats for claimed names

## 💡 Implementation Tips

### Username Validation Rules:
- 3-20 characters
- Alphanumeric, underscore, hyphen only
- Case insensitive for uniqueness
- No spaces or special characters

### Session Management:
```typescript
// For unclaimed names (guests)
SessionManager.storeSession({
  id: `player_${uuid}`,
  name: username,
  isGuest: true,
  tempStats: { wins: 0, gamesPlayed: 0 }
});

// For claimed names (registered)
// Use InstantDB auth session
const { user } = db.useAuth();
```

### Stats Tracking Logic:
```typescript
// Only save to database if claimed
if (player.authUserId) {
  // Save to InstantDB
  await adminDb.transact([...]);
} else {
  // Only update session (temporary)
  SessionManager.updateTempStats();
}
```

## 🎨 UI Flow

```
1. New Player:
   HomePage → UsernameEntry → Enter Name → Start Playing

2. After First Win:
   Victory Screen → "Claim your username!" → ClaimUsernameModal

3. Returning Player (Claimed):
   HomePage → "Sign In" → Email → Magic Code → Welcome Back!

4. Returning Player (Unclaimed):
   HomePage → Enter Same Username → "This name is in use"
   → "Claim it if it's yours" → ClaimUsernameModal
```

## ⚠️ Important Notes

1. **Backward Compatibility**: Existing users in database will continue to work
2. **Reserved Names**: System names are blocked (admin, system, etc.)
3. **Name Expiry**: Consider adding 30-day expiry for unclaimed names
4. **Rate Limiting**: Add rate limiting to username checks to prevent abuse

## 🐛 Troubleshooting

### "Username already exists" error:
- Check if name is in `reservedNames` table
- Check if name exists in `users` table
- Check case sensitivity

### Stats not saving:
- Verify username is claimed (has authUserId)
- Check game completion logic
- Verify InstantDB transaction success

### Magic code not received:
- Check InstantDB email settings
- Verify email is valid
- Check spam folder

## 📊 Success Metrics

- **Conversion Rate**: % of players who claim their username
- **Retention**: Players with claimed names play more games
- **Virality**: Claimed users invite more friends
- **Engagement**: Higher stats = more competitive play

## 🎯 Next Steps After Implementation

1. **Leaderboard**: Show only claimed usernames
2. **Profile Pages**: `/profile/[username]` for claimed users
3. **Achievements**: Unlock badges for claimed users
4. **Friend System**: Follow other claimed users
5. **Tournaments**: Require claimed names for entry
