# InstantDB Permissions Guide for RXN

## Overview

When you change the schema, you MUST update permissions to include the new entities. InstantDB will reject operations on entities without permission rules.

## Current Permission Files

1. **`instant.perms.ts`** - Current (development mode - all operations allowed)
2. **`instant.perms.new.ts`** - Development with new entities added
3. **`instant.perms.production.ts`** - Production-ready with proper security

## Quick Fix for Schema Changes

### Option 1: Development Mode (Recommended for now)
```bash
# Use the updated development permissions
cp instant.perms.new.ts instant.perms.ts

# Push to InstantDB
npm run instant:push
```

### Option 2: Production Mode (When ready for security)
```bash
# Use production permissions
cp instant.perms.production.ts instant.perms.ts

# Push to InstantDB
npm run instant:push
```

## Permission Rules Explained

### Development Permissions (instant.perms.new.ts)
- ✅ **All operations allowed** for easy testing
- ✅ **New entities included**: gameResults, reservedNames
- ⚠️ **Not secure** - anyone can modify anything
- 📝 **Use for**: Initial development and testing

### Production Permissions (instant.perms.production.ts)
- 🔒 **Auth fields protected**: Only owner can claim username
- 🔒 **Game stats**: Server-controlled via admin SDK
- 🔒 **Reserved names**: Read-only for everyone
- 🔒 **Room control**: Only host can delete
- ✅ **Game playable**: All gameplay operations work

## How Permissions Work

### Basic Structure
```typescript
entityName: {
  allow: {
    view: "true",        // Who can read
    create: "true",      // Who can create
    update: "true",      // Who can update
    delete: "false",     // Who can delete
  }
}
```

### Permission Expressions
- `"true"` - Anyone can do this
- `"false"` - Nobody can do this (except admin SDK)
- `"auth.id != null"` - Only authenticated users
- `"auth.id == data.ownerId"` - Only the owner
- Complex expressions with `&&` and `||`

### Field-Level Permissions
```typescript
update: {
  $default: "auth.id == data.ownerId", // Default for all fields
  publicField: "true",                  // Anyone can update
  privateField: "auth.id == data.ownerId", // Only owner
}
```

## Important Notes

### 1. Admin SDK Bypasses Permissions
```typescript
// Server-side with adminDb bypasses all permission checks
await adminDb.transact([...]) // Always works

// Client-side with db respects permissions
await db.transact([...]) // Checked against rules
```

### 2. New Entities Need Rules
If you add an entity to schema but not to perms:
```
Error: No permission rules for entity 'newEntity'
```

### 3. Auth Context
In permission expressions:
- `auth.id` - The authenticated user's ID
- `auth.email` - The authenticated user's email
- `data` - The current record being accessed
- `newData` - The proposed changes (in update)

## Migration Path

### Phase 1: Development (Current)
```typescript
// instant.perms.ts - Allow everything
users: {
  allow: {
    view: "true",
    create: "true", 
    update: "true",
    delete: "true",
  }
}
```

### Phase 2: Semi-Protected (Testing auth)
```typescript
// Protect auth fields, allow game operations
users: {
  allow: {
    view: "true",
    create: "true",
    update: {
      $default: "true",
      authUserId: "data.authUserId == null", // Can only set once
      email: "auth.id == data.authUserId",   // Only owner
    },
    delete: "false",
  }
}
```

### Phase 3: Production (Full security)
```typescript
// Full protection with ownership checks
users: {
  allow: {
    view: "true",
    create: "true",
    update: "auth.id == data.authUserId || data.authUserId == null",
    delete: "false",
  }
}
```

## Testing Permissions

### Test in Development
1. Use `instant.perms.new.ts` (everything allowed)
2. Build and test all features
3. Ensure game is fully working

### Test Production Rules
1. Switch to `instant.perms.production.ts`
2. Test these scenarios:
   - [ ] Can create username without auth
   - [ ] Can claim username with email
   - [ ] Cannot claim already claimed username
   - [ ] Can update own profile
   - [ ] Cannot update others' profiles
   - [ ] Game stats update correctly
   - [ ] Room operations work

### Debug Permission Errors
If you get permission errors:
1. Check browser console for specific rule that failed
2. Use admin SDK on server for operations that should bypass
3. Temporarily use development permissions to isolate issue

## Common Permission Patterns

### Public Read, Owner Write
```typescript
allow: {
  view: "true",
  update: "auth.id == data.ownerId",
}
```

### Create Once, Never Update
```typescript
allow: {
  create: "true",
  update: "false", // Use admin SDK if updates needed
}
```

### Conditional Field Updates
```typescript
update: {
  status: "data.status == 'draft' && auth.id == data.ownerId",
  publishedAt: "data.publishedAt == null", // Can only publish once
}
```

## Troubleshooting

### "No permission rules for entity"
- Add the entity to instant.perms.ts
- Push with `npm run instant:push`

### "Permission denied" on client
- Check if operation should use admin SDK instead
- Verify auth state with `db.auth.getAuth()`
- Check permission expression in rules

### Updates not working
- Ensure admin SDK is used on server
- Check field-level permissions
- Verify auth context is correct

## Best Practices

1. **Start permissive** - Use development mode initially
2. **Test thoroughly** - Before enabling production rules
3. **Use admin SDK** - For server operations
4. **Incremental security** - Tighten rules gradually
5. **Document rules** - Comment complex expressions

## Next Steps

1. **Now**: Use `instant.perms.new.ts` for development
2. **After auth testing**: Switch to `instant.perms.production.ts`
3. **Before launch**: Review and tighten all rules
4. **Monitor**: Check for permission errors in production

Remember: Permissions are your security layer. Start simple, test thoroughly, then lock down for production!
