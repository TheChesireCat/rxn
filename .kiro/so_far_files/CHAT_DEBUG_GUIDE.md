# 💬 Chat System Debugging Guide

## Current Issue
Messages are being created in the InstantDB backend but not showing in the UI chat modal.

## Debug Steps Added

### 1. Test Component Added
A `TestChatQuery` component has been temporarily added to the game view that:
- Shows the room ID being used
- Tests 3 different query approaches
- Shows raw message data
- Allows creating test messages directly from the client

### 2. Console Logging
Added detailed logging in `GameRoom.tsx` to show:
- Room ID being queried
- Chat data returned
- Loading and error states
- Raw message array

### 3. Simplified API
Removed the `.link()` call from the chat API since we're using `roomId` as a string field.

## How to Debug

1. **Start the app**: `npm run dev`
2. **Create a room and look at the console**
3. **Check the Test Component** (top-left of game screen):
   - Does Query 2 (all messages) show ANY messages?
   - What's the exact room ID format?
   - Try creating a test message using the test input

4. **Check Console Output**:
   ```javascript
   // Look for these logs:
   'Chat Query Debug:'
   'Test Query Results:'
   ```

5. **Verify in InstantDB Dashboard**:
   - Go to your InstantDB dashboard
   - Check the chatMessages table
   - Verify the roomId format matches what's being queried

## Possible Issues to Check

### 1. Room ID Mismatch
- The room ID in the message might not match the room ID being queried
- Check if room.id is a UUID or some other format

### 2. Schema/Permissions Issue
- The schema might need permissions for reading chatMessages
- Check instant.perms.ts file

### 3. InstantDB Sync Issue
- Messages might be created but not syncing to client
- Try refreshing the page after creating a message

### 4. Data Structure Issue
- The query might be returning data in a different structure
- Check the raw data in console logs

## Quick Tests

### Test 1: Create Message from Test Component
1. Use the test input in the debug component
2. Click "Create Test Message"
3. Check if it appears in Query 2 (all messages)

### Test 2: Check Room ID Format
1. Look at the Room ID shown in the test component
2. Go to InstantDB dashboard
3. Check if the roomId in chatMessages matches exactly

### Test 3: Send via Chat Modal
1. Open the chat modal
2. Send a message
3. Check console for any errors
4. Check InstantDB dashboard for the new message
5. Check if the roomId matches

## Next Steps Based on Findings

**If Query 2 shows messages but Query 1 doesn't:**
- Issue is with the WHERE clause filtering
- Check roomId format/type

**If no queries show messages:**
- Issue is with InstantDB connection or permissions
- Check instant.perms.ts

**If test messages work but API messages don't:**
- Issue is with the API route
- Check server-side vs client-side ID formats

## To Remove Debug Code
Once the issue is fixed, remove:
1. TestChatQuery component import and usage from GameRoom.tsx
2. The TestChatQuery.tsx file
3. Console.log statements in GameRoom.tsx
