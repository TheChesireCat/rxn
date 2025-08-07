#!/bin/bash

# Script to update InstantDB permissions for new schema

echo "🔐 InstantDB Permissions Updater for RXN"
echo "========================================"
echo ""
echo "Choose your permission mode:"
echo "1) Development (Allow all - for testing)"
echo "2) Production (Secure - for deployment)"
echo "3) View current permissions"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "📝 Setting DEVELOPMENT permissions..."
    cp instant.perms.new.ts instant.perms.ts
    echo "✅ Development permissions set!"
    echo ""
    echo "Next step: Push to InstantDB"
    echo "  npm run instant:push"
    ;;
    
  2)
    echo "🔒 Setting PRODUCTION permissions..."
    cp instant.perms.production.ts instant.perms.ts
    echo "✅ Production permissions set!"
    echo ""
    echo "⚠️  WARNING: Production permissions are strict!"
    echo "Make sure to test:"
    echo "  - Username creation still works"
    echo "  - Email claiming works"
    echo "  - Game operations work"
    echo ""
    echo "Next step: Push to InstantDB"
    echo "  npm run instant:push"
    ;;
    
  3)
    echo "📋 Current permissions file (first 50 lines):"
    echo "----------------------------------------"
    head -n 50 instant.perms.ts
    echo "..."
    echo "----------------------------------------"
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📚 For more info, see PERMISSIONS_GUIDE.md"
