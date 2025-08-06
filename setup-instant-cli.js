#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupInstant() {
  try {
    console.log('📦 Installing InstantDB CLI...');
    await execAsync('npm install -g @instantdb/cli');
    
    console.log('🔧 Initializing InstantDB...');
    // This will use your existing .env variables
    await execAsync('npx instant init --skip');
    
    console.log('📤 Pushing schema...');
    await execAsync('npx instant push schema');
    
    console.log('✅ InstantDB setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Try running these commands manually:');
    console.log('1. npx instant init');
    console.log('2. npx instant push schema');
  }
}

setupInstant();