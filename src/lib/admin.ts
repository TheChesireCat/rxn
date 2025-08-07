import { init } from '@instantdb/admin';
import schema from '../../instant.schema.ts';

// Initialize InstantDB Admin SDK for server-side operations
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

if (!APP_ID) {
  throw new Error('NEXT_PUBLIC_INSTANT_APP_ID environment variable is required');
}

if (!ADMIN_TOKEN) {
  throw new Error('INSTANT_ADMIN_TOKEN environment variable is required');
}

// Admin client for server-side operations
export const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
  schema,
});

// Export types for use throughout the application
export type { AppSchema } from '../../instant.schema.ts';
