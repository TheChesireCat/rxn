const { init } = require('@instantdb/admin');
require('dotenv').config();

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize admin client
const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

async function testConnection() {
  try {
    console.log('🔍 Testing InstantDB connection...');
    console.log('App ID:', APP_ID);
    console.log('Admin Token:', ADMIN_TOKEN.substring(0, 8) + '...\n');
    
    // Try to query rooms (even if none exist)
    const result = await adminDb.query({
      rooms: {}
    });
    
    console.log('✅ Connection successful!');
    console.log('Rooms found:', result.rooms ? result.rooms.length : 0);
    
    // Try to create a test room
    console.log('\n📝 Creating test room...');
    const testRoomId = 'test-' + Date.now();
    
    await adminDb.transact([
      adminDb.tx.rooms[testRoomId].update({
        name: 'Test Room',
        status: 'lobby',
        hostId: 'test-host',
        gameState: {},
        settings: {
          maxPlayers: 4,
          boardSize: { rows: 5, cols: 5 },
        },
        history: [],
        createdAt: Date.now(),
      })
    ]);
    
    console.log('✅ Test room created successfully!');
    console.log('Room ID:', testRoomId);
    
    // Clean up - delete the test room
    console.log('\n🧹 Cleaning up test room...');
    await adminDb.transact([
      adminDb.tx.rooms[testRoomId].delete()
    ]);
    console.log('✅ Test room deleted');
    
    console.log('\n🎉 InstantDB is working correctly!');
    console.log('Your admin token and app ID are valid.\n');
    
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error:', error.message);
    
    if (error.message && error.message.includes('Not found')) {
      console.log('\n💡 This might mean your schema hasn\'t been pushed yet.');
      console.log('Try running: npx @instantdb/cli push');
    } else if (error.message && error.message.includes('Unauthorized')) {
      console.log('\n💡 Your admin token might be invalid.');
      console.log('Get a new one from: https://instantdb.com/dash');
    }
    
    process.exit(1);
  }
}

testConnection();