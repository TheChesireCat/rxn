#!/bin/bash

# Install dependencies script for RXN project

echo "Installing dependencies for RXN project..."
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running npm install..."
    npm install
else
    echo "node_modules found. Checking for missing dependencies..."
    
    # Check if lucide-react is installed
    if [ ! -d "node_modules/lucide-react" ]; then
        echo "lucide-react not found. Installing..."
        npm install lucide-react@^0.454.0
    else
        echo "lucide-react is already installed."
    fi
fi

echo ""
echo "Dependencies installed successfully!"
echo "=================================="
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "If you still see errors, try:"
echo "  1. Delete node_modules and package-lock.json"
echo "  2. Run: npm install"
echo "  3. Run: npm run dev"
