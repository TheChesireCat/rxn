// Test script to verify InstantDB chat messages
// Run with: npm run test:chat

import { adminDb as db } from './src/lib/admin.js';

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
    console.log('\n2. Creating test messages with room link...');
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

    // Wait a moment for data to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    if (directQuery.chatMessages && directQuery.chatMessages.length > 0) {
      directQuery.chatMessages.forEach(msg => {
        console.log(`  - "${msg.text}" (from ${msg.userId})`);
      });
    } else {
      console.log('  ⚠️ No messages found with direct query');
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
    if (room?.messages && room.messages.length > 0) {
      room.messages.forEach(msg => {
        console.log(`  - "${msg.text}" (from ${msg.userId})`);
      });
    } else {
      console.log('  ⚠️ No messages found through room relationship');
    }

    // 5. Test without link (how it was before)
    console.log('\n5. Testing message creation WITHOUT link (old way)...');
    const testMessageId = crypto.randomUUID();
    await db.transact(
      db.tx.chatMessages[testMessageId].update({
        roomId,
        userId: 'test-user',
        text: 'Message without link',
        createdAt: Date.now(),
      })
    );
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const testQuery = await db.query({
      chatMessages: {
        $: {
          where: { roomId }
        }
      }
    });
    
    console.log('Messages found after creating without link:', testQuery.chatMessages?.length || 0);
    const foundTestMessage = testQuery.chatMessages?.find(m => m.id === testMessageId);
    console.log('Test message found:', !!foundTestMessage);
    if (foundTestMessage) {
      console.log('  Test message details:', {
        text: foundTestMessage.text,
        roomId: foundTestMessage.roomId,
        hasRoomLink: !!foundTestMessage.room
      });
    }

    // 6. Clean up test data
    console.log('\n6. Cleaning up test data...');
    
    // Delete all messages for this room
    const allMessages = await db.query({
      chatMessages: {
        $: {
          where: { roomId }
        }
      }
    });
    
    if (allMessages.chatMessages) {
      for (const msg of allMessages.chatMessages) {
        await db.transact(
          db.tx.chatMessages[msg.id].delete()
        );
      }
    }
    
    // Delete room
    await db.transact(
      db.tx.rooms[roomId].delete()
    );
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n✨ All tests completed!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('- Room creation: ✅');
    console.log('- Message creation with link: ✅');
    console.log('- Direct query by roomId:', directQuery.chatMessages?.length > 0 ? '✅' : '❌');
    console.log('- Query through room link:', room?.messages?.length > 0 ? '✅' : '❌');
    console.log('- Message without link query:', !!foundTestMessage ? '✅' : '❌');

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