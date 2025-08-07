# Chat Messaging Debug Guide

## Overview
The chat messaging system in RXN uses InstantDB for real-time synchronization. Messages are created via an API endpoint and displayed in real-time using InstantDB subscriptions.

## Architecture

### Database Schema
- **Entity**: `chatMessages`
  - `roomId`: string (links to room)
  - `userId`: string
  - `text`: string  
  - `createdAt`: number (timestamp)

- **Link**: `roomMessages`
  - Forward: `rooms` has many `messages`
  - Reverse: `chatMessages` has one `room`

### Components
1. **ChatPanel** (`/src/components/ChatPanel.tsx`): UI component that displays and sends messages
2. **Chat API** (`/src/app/api/chat/send/route.ts`): Server endpoint that creates messages in InstantDB
3. **InstantDB Client** (`/src/lib/instant.ts`): Client-side real-time subscriptions
4. **InstantDB Admin** (`/src/lib/admin.ts`): Server-side database operations

## Testing the Chat System

### 1. Verify InstantDB Setup
```bash
# Check if InstantDB is configured correctly
npm run instant:test

# Verify schema is pushed
npm run instant:verify

# Test chat functionality specifically
npm run test:chat
```

### 2. Manual Testing in Development

1. Start the development server:
```bash
npm run dev
```

2. Create a game room and join it
3. Open the browser console (F12)
4. Look for debug output:
   - "Chat Messages Query Result" - Shows what data is being received
   - "Creating chat message" - Shows when messages are sent
   - "Message created successfully" - Confirms server creation

5. Use the **Debug** button in the chat header (purple button) to send test messages

### 3. Common Issues and Solutions

#### Messages not appearing
1. **Check browser console** for errors
2. **Verify roomId** matches between API and query
3. **Check InstantDB dashboard** to see if messages exist
4. **Run verification script**: `npm run instant:verify`

#### Schema mismatch
```bash
# Push latest schema to InstantDB
npm run instant:push
```

#### Environment variables
Ensure these are set in `.env`:
```
NEXT_PUBLIC_INSTANT_APP_ID=your-app-id
INSTANT_ADMIN_TOKEN=your-admin-token
```

## Debug Information

### What's Been Fixed

1. **API Route** (`/api/chat/send/route.ts`):
   - Added `.link({ room: roomId })` to properly link messages to rooms
   - Added room existence verification
   - Added detailed logging for debugging
   - Added message verification after creation

2. **ChatPanel** (`/src/components/ChatPanel.tsx`):
   - Simplified query to use direct `chatMessages` query
   - Added explicit roomId binding in where clause
   - Added comprehensive debug logging
   - Added debug button for testing in development

3. **Test Scripts**:
   - `test-chat.mjs`: Tests message creation and querying
   - `verify-schema.mjs`: Verifies schema is properly synced

### How the System Works

1. **Message Creation Flow**:
   ```
   User types message → ChatPanel → POST /api/chat/send → 
   InstantDB transaction → Message created with room link
   ```

2. **Message Display Flow**:
   ```
   InstantDB subscription → db.useQuery in ChatPanel → 
   Real-time updates → Messages rendered in UI
   ```

3. **Key Points**:
   - Messages MUST be linked to rooms using `.link({ room: roomId })`
   - Queries use `where: { roomId }` to filter messages
   - Real-time sync happens automatically via InstantDB subscriptions

## Debugging Commands

```bash
# View all npm scripts
npm run

# Test InstantDB connection
npm run instant:test

# Verify schema
npm run instant:verify  

# Test chat specifically
npm run test:chat

# Push schema changes
npm run instant:push

# Start dev server with debug output
npm run dev
```

## Next Steps if Issues Persist

1. **Check InstantDB Dashboard**:
   - Go to https://instantdb.com
   - Check if messages are being created
   - Verify schema matches expected structure

2. **Enable Verbose Logging**:
   - Browser console will show all debug info
   - Server logs (in terminal) will show API activity

3. **Try Alternative Query**:
   If direct query doesn't work, uncomment the room-based query in ChatPanel:
   ```javascript
   const { data: roomData } = db.useQuery({
     rooms: {
       $: { where: { id: roomId } },
       messages: { $: { order: { createdAt: 'asc' } } }
     }
   });
   const messages = roomData?.rooms?.[0]?.messages || [];
   ```

4. **Clear Local State**:
   - Clear browser storage
   - Restart dev server
   - Create new room for testing

## Contact Support

If issues persist after following this guide:
1. Check InstantDB documentation: https://instantdb.com/docs
2. Review the schema and permissions files
3. Ensure all dependencies are up to date: `npm update @instantdb/react @instantdb/admin`