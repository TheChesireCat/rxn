const { init, i } = require('@instantdb/admin');
require('dotenv').config();

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables:');
  if (!APP_ID) console.error('- NEXT_PUBLIC_INSTANT_APP_ID');
  if (!ADMIN_TOKEN) console.error('- INSTANT_ADMIN_TOKEN');
  process.exit(1);
}

// Define the schema using admin's i.schema
const schema = i.schema({
  entities: {
    users: i.entity({
      name: i.string(),
      wins: i.number(),
      gamesPlayed: i.number(),
      createdAt: i.number(),
    }),
    
    rooms: i.entity({
      name: i.string(),
      status: i.string(),
      hostId: i.string(),
      gameState: i.json(),
      settings: i.json(),
      history: i.json(),
      createdAt: i.number(),
    }),
    
    chatMessages: i.entity({
      roomId: i.string(),
      userId: i.string(),
      text: i.string(),
      createdAt: i.number(),
    }),
  },
});

const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

async function pushSchema() {
  try {
    console.log('🚀 Pushing schema to InstantDB...');
    console.log('App ID:', APP_ID);
    console.log('Admin Token:', ADMIN_TOKEN.substring(0, 8) + '...');
    
    // Use the correct push method
    const result = await adminDb.pushSchema();
    
    console.log('✅ Schema pushed successfully!');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error pushing schema:');
    console.error('Message:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    if (error.body) {
      console.error('Body:', error.body);
    }
    
    // Provide helpful debugging info
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Verify your admin token is correct');
    console.log('2. Check that your app ID matches your InstantDB dashboard');
    console.log('3. Ensure you have internet connection');
    console.log('4. Try visiting: https://instantdb.com/dash');
    
    process.exit(1);
  }
}

pushSchema();