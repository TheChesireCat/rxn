// Simple test to verify InstantDB connection and schema
import { db } from './instant';

export const testConnection = async () => {
  try {
    // Test basic connection by attempting to query users
    const result = db.useQuery({
      users: {
        $: { limit: 1 }
      }
    });
    
    console.log('InstantDB connection test successful');
    return true;
  } catch (error) {
    console.error('InstantDB connection test failed:', error);
    return false;
  }
};

// Test schema by creating a test user (for development only)
export const testSchema = async () => {
  try {
    const testUserId = crypto.randomUUID();
    await db.transact(
      db.tx.users[testUserId].update({
        name: `test-user-${Date.now()}`,
        wins: 0,
        gamesPlayed: 0,
        createdAt: Date.now(),
      })
    );
    
    console.log('Schema test successful - user created');
    
    // Clean up test user
    await db.transact(db.tx.users[testUserId].delete());
    console.log('Schema test successful - user deleted');
    
    return true;
  } catch (error) {
    console.error('Schema test failed:', error);
    return false;
  }
};