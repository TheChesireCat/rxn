import { init } from '@instantdb/admin';
import schema from './instant.schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID || !ADMIN_TOKEN) {
  console.error('Missing required environment variables:');
  if (!APP_ID) console.error('- NEXT_PUBLIC_INSTANT_APP_ID');
  if (!ADMIN_TOKEN) console.error('- INSTANT_ADMIN_TOKEN');
  process.exit(1);
}

const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

async function pushSchema() {
  try {
    console.log('Pushing schema to InstantDB...');
    const result = await adminDb.pushSchema();
    console.log('Schema pushed successfully!', result);
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchema();