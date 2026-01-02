# Expo Go Connection Troubleshooting Guide

## Common Issues & Solutions

### 1. **Connection Drops / Disconnections**

This is usually caused by:

- ❌ **Wrong IP address** in `.env`
- ❌ **Different WiFi networks** (phone vs laptop)
- ❌ **Firewall blocking** port 3000 or 8081
- ❌ **Network instability**

### 2. **Quick Fixes**

#### Option A: Auto-fix IP Address (Recommended)

```bash
./scripts/fix-expo-ip.sh
```

#### Option B: Use Expo Tunnel (Most Reliable)

```bash
# Stop current expo server
# Then start with tunnel mode:
npx expo start --tunnel
```

**Benefits**: Works across different networks, no IP changes needed

#### Option C: Manual IP Update

1. Find your IP:

```bash
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

2. Update `.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_IP:3000
```

3. Restart Expo:

```bash
bun go
```

### 3. **Ensure Same Network**

- ✅ Phone and laptop MUST be on the same WiFi
- ✅ NOT connected to VPN
- ✅ NOT using different networks (e.g., laptop on Ethernet)

### 4. **Check Firewall**

```bash
# Allow port 8081 (Metro bundler)
sudo ufw allow 8081/tcp

# Allow port 3000 (Backend server)
sudo ufw allow 3000/tcp

# Or disable firewall temporarily for testing
sudo ufw disable
```

### 5. **Restart Everything**

```bash
# 1. Stop all processes
# Kill terminals running: bun go, bun server, bun convex

# 2. Clear Expo cache
npx expo start --clear

# 3. Restart backend
bun server

# 4. Restart Expo
bun go
```

### 6. **Check if Backend is Running**

```bash
# Test from your phone's browser:
http://YOUR_IP:3000

# Or from terminal:
curl http://192.168.1.101:3000
```

### 7. **Use QR Code Scanner**

- Don't type the URL manually
- Use the QR code in the Expo Dev Tools
- Make sure you're using Expo Go app (not a browser)

## Updated Configuration

Your `app.json` now includes:

- ✅ Android/iOS package identifiers
- ✅ Asset bundle patterns
- ✅ Status bar configuration
- ✅ Proper plugin setup

This should significantly reduce disconnection issues!

## Still Having Issues?

1. **Check Metro bundler logs** for errors
2. **Check backend server logs** at http://localhost:3000
3. **Check Convex logs** for database issues
4. **Try clearing node_modules** and reinstalling:
   ```bash
   rm -rf node_modules bun.lock
   bun install
   ```
