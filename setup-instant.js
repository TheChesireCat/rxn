#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if InstantDB CLI is installed
function checkInstantCLI() {
  try {
    execSync('npx @instantdb/cli --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Main setup function
async function setupInstant() {
  console.log('🔧 Setting up InstantDB...\n');
  
  // Check environment variables
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasAppId = envContent.includes('NEXT_PUBLIC_INSTANT_APP_ID=');
  const hasAdminToken = envContent.includes('INSTANT_ADMIN_TOKEN=');
  
  if (!hasAppId || !hasAdminToken) {
    console.error('❌ Missing required environment variables in .env:');
    if (!hasAppId) console.error('  - NEXT_PUBLIC_INSTANT_APP_ID');
    if (!hasAdminToken) console.error('  - INSTANT_ADMIN_TOKEN');
    console.log('\n💡 Get these from https://instantdb.com/dash');
    process.exit(1);
  }
  
  // Check if CLI is available
  if (!checkInstantCLI()) {
    console.log('📦 Installing InstantDB CLI...');
    try {
      execSync('npm install --save-dev @instantdb/cli', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to install InstantDB CLI');
      process.exit(1);
    }
  }
  
  try {
    // Push schema using the CLI
    console.log('📤 Pushing schema to InstantDB...');
    console.log('   Using App ID from .env');
    console.log('   Using Admin Token from .env\n');
    
    execSync('npx @instantdb/cli push', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('\n✅ Schema pushed successfully!');
    console.log('🎮 Your app is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Create a room and start playing!\n');
    
  } catch (error) {
    console.error('\n❌ Failed to push schema');
    console.log('\n💡 Try running manually:');
    console.log('   npx @instantdb/cli push\n');
    console.log('Or if that fails, try:');
    console.log('1. npx @instantdb/cli login');
    console.log('2. npx @instantdb/cli init');
    console.log('3. npx @instantdb/cli push\n');
    process.exit(1);
  }
}

// Run the setup
setupInstant();