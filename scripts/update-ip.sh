#!/bin/bash

# Get the local IP address
LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -1)

if [ -z "$LOCAL_IP" ]; then
  echo "❌ Could not detect local IP address"
  exit 1
fi

echo "✅ Detected IP: $LOCAL_IP"

# Update or create .env file
ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  # Update existing EXPO_PUBLIC_API_URL
  if grep -q "EXPO_PUBLIC_API_URL" "$ENV_FILE"; then
    sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000|" "$ENV_FILE"
    echo "✅ Updated EXPO_PUBLIC_API_URL in $ENV_FILE"
  else
    echo "EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000" >> "$ENV_FILE"
    echo "✅ Added EXPO_PUBLIC_API_URL to $ENV_FILE"
  fi
else
  echo "EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000" > "$ENV_FILE"
  echo "✅ Created $ENV_FILE with EXPO_PUBLIC_API_URL"
fi

echo ""
echo "🚀 Your API URL is now: http://${LOCAL_IP}:3000"
echo "📱 Restart your Expo app to apply changes"
