#!/bin/bash

echo "🔄 Pushing InstantDB Schema and Permissions"
echo "==========================================="
echo ""

# Check if InstantDB CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

echo "📋 Current Permissions: Open for development"
echo "  - All entities: view/create/update/delete = true"
echo "  - No authentication required"
echo ""

echo "⚠️  WARNING: These are development permissions!"
echo "  Remember to restore strict permissions for production."
echo ""

echo "📤 Pushing to InstantDB..."
npx @instantdb/cli push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed schema and permissions!"
    echo ""
    echo "🧪 To test chat messages:"
    echo "  1. Restart your dev server: npm run dev"
    echo "  2. Create a room and join with 2 browsers"
    echo "  3. Open chat and send messages"
    echo "  4. Check the debug panel (top-left)"
else
    echo ""
    echo "❌ Failed to push to InstantDB"
    echo ""
    echo "Try running manually:"
    echo "  npx @instantdb/cli push"
fi
