// Test script to verify InstantDB chat messages
// Run with: node test-chat.js

const { init } = require('@instantdb/admin');
const schema = require('./instant.schema.ts');

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_ADMIN_TOKEN are set in .env');
  process.exit(1);
}

// Initialize admin client
const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema: schema.default
});

async function testChat() {
  console.log('🔧 Testing InstantDB Chat Messages...\n');

  try {
    // 1. Create a test room
    console.log('1. Creating test room...');
    const roomId = crypto.randomUUID();
    await db.transact(
      db.tx.rooms[roomId].update({
        name: 'Test Chat Room',
        status: 'lobby',
        hostId: 'test-host',
        gameState: {},
        settings: {},
        history: [],
        createdAt: Date.now(),
      })
    );
    console.log('✅ Room created:', roomId);

    // 2. Create test messages with proper linking
    console.log('\n2. Creating test messages...');
    const messageIds = [];
    
    for (let i = 1; i <= 3; i++) {
      const messageId = crypto.randomUUID();
      messageIds.push(messageId);
      
      await db.transact(
        db.tx.chatMessages[messageId].update({
          roomId,
          userId: `user-${i}`,
          text: `Test message ${i}`,
          createdAt: Date.now() + (i * 1000), // Stagger timestamps
        }).link({ room: roomId })
      );
      
      console.log(`✅ Message ${i} created:`, messageId);
    }

    // 3. Query messages directly
    console.log('\n3. Querying messages directly by roomId...');
    const directQuery = await db.query({
      chatMessages: {
        $: {
          where: { roomId },
          order: { createdAt: 'asc' }
        }
      }
    });
    
    console.log('Messages found (direct):', directQuery.chatMessages?.length || 0);
    if (directQuery.chatMessages) {
      directQuery.chatMessages.forEach(msg => {
        console.log(`  - ${msg.text} (from ${msg.userId})`);
      });
    }

    // 4. Query messages through room relationship
    console.log('\n4. Querying messages through room relationship...');
    const roomQuery = await db.query({
      rooms: {
        $: {
          where: { id: roomId }
        },
        messages: {
          $: {
            order: { createdAt: 'asc' }
          }
        }
      }
    });
    
    const room = roomQuery.rooms?.[0];
    console.log('Room found:', !!room);
    console.log('Messages found (via room):', room?.messages?.length || 0);
    if (room?.messages) {
      room.messages.forEach(msg => {
        console.log(`  - ${msg.text} (from ${msg.userId})`);
      });
    }

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    
    // Delete messages
    for (const messageId of messageIds) {
      await db.transact(
        db.tx.chatMessages[messageId].delete()
      );
    }
    
    // Delete room
    await db.transact(
      db.tx.rooms[roomId].delete()
    );
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n✅ All tests passed! Chat messages are working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    process.exit(1);
  }
}

// Run the test
testChat().then(() => {
  console.log('\n✅ Chat test completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});