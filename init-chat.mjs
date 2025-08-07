// Initialize and test chat messages in InstantDB
// Run with: npm run chat:init

import { adminDb as db } from './src/lib/admin.js';

async function initializeChat() {
  console.log('🚀 Initializing Chat System...\n');
  
  try {
    // Step 1: Create a test room
    console.log('Step 1: Creating test room...');
    const roomId = 'test-chat-room-' + Date.now();
    
    await db.transact(
      db.tx.rooms[roomId].update({
        name: 'Chat Test Room',
        status: 'lobby',
        hostId: 'system',
        gameState: {
          players: [],
          board: [],
          currentPlayerIndex: 0,
          isGameOver: false,
        },
        settings: {
          maxPlayers: 4,
          gridSize: 8,
          isPublic: true,
        },
        history: [],
        createdAt: Date.now(),
      })
    );
    
    console.log('✅ Test room created:', roomId);
    
    // Step 2: Create sample messages
    console.log('\nStep 2: Creating sample messages...');
    const users = [
      { id: 'user1', name: 'Alice' },
      { id: 'user2', name: 'Bob' },
      { id: 'user3', name: 'Charlie' }
    ];
    
    const messages = [
      'Hello everyone!',
      'Ready to play?',
      'Let\'s start the game!',
      'Good luck!',
      'This chat system is working great!'
    ];
    
    for (let i = 0; i < messages.length; i++) {
      const user = users[i % users.length];
      const messageId = crypto.randomUUID();
      
      await db.transact(
        db.tx.chatMessages[messageId].update({
          roomId,
          userId: user.id,
          text: `${user.name}: ${messages[i]}`,
          createdAt: Date.now() + (i * 1000),
        }).link({ room: roomId })
      );
      
      console.log(`✅ Message ${i + 1} created from ${user.name}`);
    }
    
    // Step 3: Query and verify
    console.log('\nStep 3: Verifying messages...');
    
    // Query directly
    const directQuery = await db.query({
      chatMessages: {
        $: {
          where: { roomId },
          order: { createdAt: 'asc' }
        }
      }
    });
    
    console.log(`\n📊 Direct query found ${directQuery.chatMessages?.length || 0} messages`);
    
    // Query through room
    const roomQuery = await db.query({
      rooms: {
        $: { where: { id: roomId } },
        messages: {
          $: { order: { createdAt: 'asc' } }
        }
      }
    });
    
    const room = roomQuery.rooms?.[0];
    console.log(`📊 Room query found ${room?.messages?.length || 0} messages`);
    
    // Display messages
    if (directQuery.chatMessages && directQuery.chatMessages.length > 0) {
      console.log('\n📬 Messages in database:');
      directQuery.chatMessages.forEach((msg, idx) => {
        console.log(`  ${idx + 1}. ${msg.text}`);
      });
    }
    
    // Step 4: Instructions for testing
    console.log('\n' + '='.repeat(60));
    console.log('✨ CHAT SYSTEM INITIALIZED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Create a new room or join an existing one');
    console.log('3. Open the chat panel and send messages');
    console.log('4. Messages should appear in real-time');
    console.log('\n🔍 Debug Tips:');
    console.log('- Open browser console to see debug logs');
    console.log('- Use the Debug button in chat header to send test messages');
    console.log('- Check CHAT_DEBUG.md for troubleshooting guide');
    
    console.log('\n🧪 Test Room ID for debugging:');
    console.log(`Room ID: ${roomId}`);
    console.log('(This room has sample messages you can query)');
    
    // Optional: Clean up after delay
    const CLEANUP_DELAY = 60000; // 1 minute
    console.log(`\n⏱️ Test data will be cleaned up in ${CLEANUP_DELAY / 1000} seconds...`);
    
    setTimeout(async () => {
      try {
        // Delete all test messages
        const allMessages = await db.query({
          chatMessages: { $: { where: { roomId } } }
        });
        
        if (allMessages.chatMessages) {
          for (const msg of allMessages.chatMessages) {
            await db.transact(db.tx.chatMessages[msg.id].delete());
          }
        }
        
        // Delete test room
        await db.transact(db.tx.rooms[roomId].delete());
        console.log('\n🧹 Test data cleaned up');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }, CLEANUP_DELAY);
    
  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    console.error('\nPossible causes:');
    console.error('1. InstantDB credentials not configured');
    console.error('2. Schema not pushed to InstantDB');
    console.error('3. Network connectivity issues');
    console.error('\nRun these commands:');
    console.error('- npm run instant:push (to push schema)');
    console.error('- npm run instant:test (to test connection)');
    process.exit(1);
  }
}

// Run initialization
initializeChat().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});