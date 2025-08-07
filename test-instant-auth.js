// Quick test script for InstantDB authentication capabilities
// Run with: node test-instant-auth.js

const { init } = require('@instantdb/admin');

const APP_ID = 'b77288d8-9085-41f6-927e-79e8a8ac5c45';
const ADMIN_TOKEN = '01d2214a-336b-4169-9cf2-ec5b5d15f9c9';

async function testInstantAuth() {
  console.log('🔍 Testing InstantDB Authentication Setup...\n');

  try {
    // Initialize admin client
    const db = init({
      appId: APP_ID,
      adminToken: ADMIN_TOKEN,
    });

    console.log('✅ Admin client initialized successfully');
    console.log(`📱 App ID: ${APP_ID}`);
    console.log(`🔑 Admin Token: ${ADMIN_TOKEN.substring(0, 10)}...`);

    // Try to query something to verify connection
    const query = await db.query({
      users: {},
    });

    console.log(`\n📊 Database Stats:`);
    console.log(`   - Users in database: ${query.users?.length || 0}`);

    // Check if magic code auth is properly configured
    console.log('\n🎯 Magic Code Auth Status:');
    console.log('   - Feature should be enabled by default');
    console.log('   - Check dashboard for email provider settings');
    console.log('   - Dashboard URL: https://instantdb.com/dash');

    console.log('\n✨ Configuration appears to be correct!');
    console.log('\n📝 Next Steps:');
    console.log('1. Navigate to http://localhost:3000/test-magic-auth');
    console.log('2. Try the authentication flow there');
    console.log('3. Check the debug panel for detailed info');

  } catch (error) {
    console.error('❌ Error testing InstantDB:', error.message || error);
    
    if (error.message?.includes('Invalid admin token')) {
      console.log('\n⚠️  Invalid admin token!');
      console.log('   1. Go to https://instantdb.com/dash');
      console.log('   2. Select your app');
      console.log('   3. Go to Settings → Admin tokens');
      console.log('   4. Create a new token or copy existing one');
      console.log('   5. Update INSTANT_ADMIN_TOKEN in .env');
    } else if (error.message?.includes('App not found')) {
      console.log('\n⚠️  App ID not found!');
      console.log('   Verify NEXT_PUBLIC_INSTANT_APP_ID in .env');
    } else {
      console.log('\n⚠️  Unknown error - check your internet connection');
    }
  }
}

// Run the test
console.log('========================================');
console.log('InstantDB Authentication Test');
console.log('========================================\n');

testInstantAuth().catch(console.error);
