# Copy Room Information - Feature Update

## What's New
Added "Copy Room URL" and "Copy Room Name" buttons alongside the existing "Copy Room ID" button in both the lobby and game views.

## Where to Find Them

### 1. **In the Lobby** (`LobbyView.tsx`)
Located at the top of the lobby screen under the room name:
- **Copy ID** (Blue button) - Copies the UUID: `f7f9c509-xxxx-xxxx...`
- **Copy URL** (Purple button) - Copies full URL: `http://localhost:3000/room/f7f9c509-xxxx...`
- **Copy Name** (Green button) - Copies room name: `My Awesome Game`

Each button shows a checkmark "✓ Copied!" when successful.

### 2. **During Gameplay** (`MinimalTopBar.tsx`)
Located in the top-right corner of the game screen:
- **Name** button (Green) - Shows room name on desktop, "Name" on mobile
- **URL** button (Purple) - Always shows "URL" 
- **ID** button (Blue) - Shows first 6 chars of ID on desktop, "ID" on mobile

## Features

### Visual Design
- **Color Coding**: 
  - Blue for Room ID (technical identifier)
  - Purple for Room URL (shareable link)
  - Green for Room Name (human-friendly)
- **Responsive**: Buttons adapt for mobile screens
- **Feedback**: Shows checkmark when copied successfully
- **Tooltips**: Hover to see what will be copied

### Technical Implementation
- **Clipboard API**: Uses modern clipboard API with fallback for older browsers
- **Error Handling**: Gracefully handles copy failures
- **State Management**: Individual success states for each button
- **Auto-reset**: Success message disappears after 2 seconds

## Usage Scenarios

1. **Quick Sharing via Chat/Discord**:
   - Copy Room Name for human-friendly sharing
   - Copy Room URL for clickable links
   - Copy Room ID for manual join

2. **Different Sharing Methods**:
   - **Room Name**: "Join 'Epic Battle Room'"
   - **Room URL**: Direct link they can click
   - **Room ID**: For the Join Game form

3. **Mobile-Friendly**:
   - All buttons work on mobile devices
   - Compact labels on small screens
   - Touch-friendly button sizes

## Testing

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Create a new room

3. In the lobby, test all three copy buttons:
   - Click "Copy ID" → Paste somewhere to verify
   - Click "Copy URL" → Paste and verify it's the full URL
   - Click "Copy Name" → Paste and verify it's the room name

4. Start the game and test the buttons in the top bar

5. Test on mobile (or resize browser) to see responsive behavior

## Code Changes

### Files Modified:
1. **`/src/components/LobbyView.tsx`**:
   - Added `handleCopyRoomUrl()` and `handleCopyRoomName()` functions
   - Enhanced state to track which button was clicked
   - Redesigned the room sharing section with all three buttons

2. **`/src/components/MinimalTopBar.tsx`**:
   - Added `handleCopyRoomUrl()` function
   - Added URL copy button between Name and ID
   - Color-coded all three buttons for consistency
   - Made labels responsive (full text on desktop, abbreviated on mobile)

## Browser Compatibility
- **Modern Browsers**: Uses `navigator.clipboard.writeText()`
- **Older Browsers**: Falls back to `document.execCommand('copy')`
- **Mobile**: Fully supported on iOS and Android

## Future Enhancements (Optional)
- Add a "Share" dropdown with all options
- QR code generation for room URL
- Social media sharing buttons
- Copy all info as formatted text
