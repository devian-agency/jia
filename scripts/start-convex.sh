#!/bin/bash

# Custom Convex dev script that prevents overwriting .env.local

echo "🚀 Starting Convex with cloud URL..."

# Temporarily backup current .env.local
if [ -f ".env.local" ]; then
    CONVEX_URL=$(grep "EXPO_PUBLIC_CONVEX_URL" .env.local 2>/dev/null)
fi

# Run convex dev
bun x convex dev &
CONVEX_PID=$!

# Wait a bit for convex to start
sleep 2

# Restore the cloud URL if it was changed
if [ ! -z "$CONVEX_URL" ]; then
    if grep -q "EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210" .env.local 2>/dev/null; then
        echo "⚠️  Convex overwrote .env.local, fixing..."
        sed -i 's|EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210|EXPO_PUBLIC_CONVEX_URL=https://vivid-giraffe-17.convex.cloud|g' .env.local
        echo "✅ Fixed .env.local to use cloud Convex URL"
    fi
fi

# Keep it running
wait $CONVEX_PID
