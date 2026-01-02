#!/bin/bash

# Get the current local IP address
CURRENT_IP=$(ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | head -1)

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect IP address"
    exit 1
fi

echo "🔍 Detected IP: $CURRENT_IP"

# Update .env file with current IP
if [ -f ".env" ]; then
    # Backup .env
    cp .env .env.backup
    
    # Update the EXPO_PUBLIC_API_URL line
    sed -i "s|EXPO_PUBLIC_API_URL=http://[0-9.]*:3000|EXPO_PUBLIC_API_URL=http://$CURRENT_IP:3000|g" .env
    
    echo "✅ Updated .env with IP: $CURRENT_IP"
    echo "📝 Old .env backed up to .env.backup"
else
    echo "❌ .env file not found"
    exit 1
fi

# Fix .env.local to use cloud Convex instead of localhost
if [ -f ".env.local" ]; then
    sed -i 's|EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210|EXPO_PUBLIC_CONVEX_URL=https://vivid-giraffe-17.convex.cloud|g' .env.local
    echo "✅ Fixed .env.local Convex URL to use cloud"
fi

echo ""
echo "🎯 Current configuration:"
grep "EXPO_PUBLIC_API_URL" .env
grep "EXPO_PUBLIC_CONVEX_URL" .env
echo ""
if [ -f ".env.local" ]; then
    echo "From .env.local (overrides .env):"
    grep "EXPO_PUBLIC_CONVEX_URL" .env.local 2>/dev/null || echo "  (no Convex override)"
fi

echo ""
echo "📱 Next steps:"
echo "1. Make sure your phone and computer are on the same WiFi network"
echo "2. Restart Expo with: bun go (or npm run go)"
echo "3. Scan the QR code in Expo Go app"
echo ""
echo "🔥 If still having issues, use tunnel mode:"
echo "   npx expo start --tunnel"
