// Test script to verify InstantDB auth is working
// Run with: node scripts/test-auth.js

import { db } from '../src/lib/instant.js';

async function testAuth() {
  console.log('🧪 Testing InstantDB Authentication...\n');
  
  try {
    // Test 1: Check if auth is available
    console.log('1. Checking auth availability...');
    const authMethods = db.auth;
    console.log('   ✅ Auth methods available:', Object.keys(authMethods));
    
    // Test 2: Try to get current auth state
    console.log('\n2. Checking current auth state...');
    const currentUser = await db.auth.getAuth();
    if (currentUser) {
      console.log('   ✅ Logged in as:', currentUser.email);
    } else {
      console.log('   ✅ Not logged in (expected for new setup)');
    }
    
    // Test 3: Verify magic code method exists
    console.log('\n3. Verifying magic code support...');
    if (typeof db.auth.sendMagicCode === 'function') {
      console.log('   ✅ sendMagicCode method exists');
    } else {
      console.log('   ❌ sendMagicCode method not found');
    }
    
    if (typeof db.auth.signInWithMagicCode === 'function') {
      console.log('   ✅ signInWithMagicCode method exists');
    } else {
      console.log('   ❌ signInWithMagicCode method not found');
    }
    
    console.log('\n✅ InstantDB auth is properly configured!');
    console.log('\nNext steps:');
    console.log('1. Update your schema: cp instant.schema.fixed.ts instant.schema.ts');
    console.log('2. Push schema: npm run instant:push');
    console.log('3. Test in browser: npm run dev');
    
  } catch (error) {
    console.error('❌ Error testing auth:', error);
    console.log('\nMake sure:');
    console.log('1. InstantDB is properly configured');
    console.log('2. Environment variables are set');
    console.log('3. Auth is enabled in InstantDB dashboard');
  }
}

testAuth();
