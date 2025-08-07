#!/bin/bash

# Quick start script for RXN with Unified UI

echo "🎮 RXN Quick Start - Unified UI"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Make sure you have your InstantDB credentials configured."
    echo ""
fi

echo "✅ Starting development server..."
echo ""
echo "🌐 The game will be available at: http://localhost:3000"
echo ""
echo "📱 Unified UI Features:"
echo "  • Floating action buttons at the bottom"
echo "  • All panels in modals (Players, Chat, Settings)"
echo "  • 70%+ game board visibility"
echo "  • Single layout for all devices"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"
echo ""

# Start the dev server
npm run dev
