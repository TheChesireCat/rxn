// Setup script for name-first authentication
// Run this after updating your schema: node scripts/setup-auth.js

import { adminDb } from '../src/lib/admin.js';

async function setupReservedNames() {
  console.log('Setting up reserved names...');
  
  const reservedNames = [
    // System reserved
    'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
    'support', 'help', 'info', 'contact', 'team', 'staff',
    
    // Game related
    'chainreaction', 'rxn', 'game', 'server', 'host', 'player',
    'guest', 'anonymous', 'user', 'test', 'demo',
    
    // Common test names
    'test', 'test1', 'test123', 'asdf', 'qwerty',
  ];
  
  for (const name of reservedNames) {
    try {
      await adminDb.transact([
        adminDb.tx.reservedNames[crypto.randomUUID()].update({
          name: name.toLowerCase(),
          reason: 'system',
          createdAt: Date.now(),
        })
      ]);
      console.log(`  ✓ Reserved: ${name}`);
    } catch (err) {
      console.log(`  - Skipping ${name} (may already exist)`);
    }
  }
}

async function migrateExistingUsers() {
  console.log('\nChecking for existing users to migrate...');
  
  const usersQuery = await adminDb.query({
    users: {}
  });
  
  for (const user of usersQuery.users) {
    if (!user.lastPlayedAt) {
      // Add new fields to existing users
      await adminDb.transact([
        adminDb.tx.users[user.id].update({
          lastPlayedAt: user.createdAt,
          sessionCount: 1,
          totalOrbs: 0,
          winRate: user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed * 100) : 0,
          updatedAt: Date.now(),
        })
      ]);
      console.log(`  ✓ Migrated: ${user.name}`);
    }
  }
}

async function main() {
  console.log('🚀 Setting up name-first authentication...\n');
  
  try {
    await setupReservedNames();
    await migrateExistingUsers();
    
    console.log('\n✅ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your instant.schema.ts with the new schema');
    console.log('2. Push schema changes: npm run instant:push');
    console.log('3. Implement the UsernameEntry component');
    console.log('4. Update HomePage to use name-first flow');
    console.log('5. Add ClaimUsernameModal for registration');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
