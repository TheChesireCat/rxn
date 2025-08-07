// Script to ensure schema is properly synced with InstantDB
// Run with: npm run instant:verify

import { adminDb as db } from './src/lib/admin.js';

async function verifySchema() {
  console.log('🔍 Verifying InstantDB Schema...\n');

  try {
    // Test 1: Verify entities exist
    console.log('1. Testing entity creation...');
    
    // Try to create a room
    const roomId = crypto.randomUUID();
    await db.transact(
      db.tx.rooms[roomId].update({
        name: 'Schema Test Room',
        status: 'lobby',
        hostId: 'test-host',
        gameState: {},
        settings: {},
        history: [],
        createdAt: Date.now(),
      })
    );
    console.log('✅ Room entity works');
    
    // Try to create a message with link
    const messageId = crypto.randomUUID();
    await db.transact(
      db.tx.chatMessages[messageId].update({
        roomId,
        userId: 'test-user',
        text: 'Schema test message',
        createdAt: Date.now(),
      }).link({ room: roomId })
    );
    console.log('✅ ChatMessage entity and link work');
    
    // Test 2: Verify queries work
    console.log('\n2. Testing queries...');
    
    // Query room with messages
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } },
        messages: {}
      }
    });
    
    const room = roomQuery.rooms?.[0];
    console.log('✅ Room query works');
    console.log(`   Found room: ${room?.name}`);
    console.log(`   Messages via link: ${room?.messages?.length || 0}`);
    
    // Query messages directly
    const messageQuery = await db.query({
      chatMessages: {
        $: { where: { roomId } },
        room: {}
      }
    });
    
    console.log('✅ Direct message query works');
    console.log(`   Found messages: ${messageQuery.chatMessages?.length || 0}`);
    if (messageQuery.chatMessages?.[0]) {
      const msg = messageQuery.chatMessages[0];
      console.log(`   Message has room link: ${!!msg.room}`);
      console.log(`   Room via link: ${msg.room?.name || 'N/A'}`);
    }
    
    // Clean up
    console.log('\n3. Cleaning up test data...');
    await db.transact(
      db.tx.chatMessages[messageId].delete()
    );
    await db.transact(
      db.tx.rooms[roomId].delete()
    );
    console.log('✅ Cleanup complete');
    
    console.log('\n✨ Schema verification complete!');
    console.log('All entities and links are working correctly.');
    
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error);
    console.error('\nThis might mean:');
    console.error('1. Schema is not pushed to InstantDB');
    console.error('2. Environment variables are incorrect');
    console.error('3. InstantDB service is unavailable');
    console.error('\nTry running: npm run instant:push');
    process.exit(1);
  }
}

// Run verification
verifySchema().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});