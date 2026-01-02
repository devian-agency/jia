# 🔥 URGENT FIX - Expo Go Remote Update Error

## ❌ Error You're Getting:

```
Uncaught Error: java.io.IOException: Failed to download remote update
```

## 🔍 Root Causes Found:

1. **Convex keeps overwriting `.env.local`**
   - Every time you run `bun convex`, it sets `EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210`
   - Your phone can't connect to `127.0.0.1` (localhost)

2. **Expo trying to download OTA updates**
   - `app.json` didn't have `updates.enabled: false`
   - Expo Go was attempting to fetch remote updates unnecessarily

## ✅ What I Fixed:

1. ✅ **Fixed `.env.local`** → Cloud Convex URL
2. ✅ **Added to `app.json`:**
   ```json
   "updates": {
     "enabled": false,
     "fallbackToCacheTimeout": 0
   }
   ```
3. ✅ **Updated `metro.config.js`** → Reset cache, prevent cached errors
4. ✅ **Cleared Expo cache** → Removed stale cached bundles
5. ✅ **Created `scripts/start-convex.sh`** → Prevents Convex from breaking config

## 🚀 HOW TO RESTART (Follow Exactly):

### Step 1: Stop Everything

```bash
# Press Ctrl+C in ALL terminals running:
# - bun go
# - bun convex
# - bun server
```

### Step 2: Clear Phone Cache

**On your Android phone:**

1. Open **Settings** → **Apps** → **Expo Go**
2. Tap **Storage** → **Clear Cache** (NOT Clear Data)
3. Or just uninstall and reinstall Expo Go app

### Step 3: Restart Services

```bash
# Terminal 1: Start Convex
bun convex

# Wait 3 seconds, then check if .env.local was overwritten:
cat .env.local | grep EXPO_PUBLIC_CONVEX_URL
# Should show: https://vivid-giraffe-17.convex.cloud
# If it shows 127.0.0.1:3210, run:
sed -i 's|EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210|EXPO_PUBLIC_CONVEX_URL=https://vivid-giraffe-17.convex.cloud|g' .env.local

# Terminal 2: Start Backend
bun server

# Terminal 3: Start Expo with CACHE CLEARED
npx expo start --clear
```

### Step 4: Connect from Phone

1. Open **Expo Go** app
2. Scan the **QR code**
3. Wait for bundle to download

## ✅ Expected Result:

**Before:**

```
❌ LOG WebSocket closed with code 1006: Failed to connect to /127.0.0.1:3210
❌ Uncaught Error: java.io.IOException: Failed to download remote update
```

**After:**

```
✅ App loads successfully
✅ No WebSocket errors
✅ No download errors
```

## 🔄 Permanent Fix for Convex Issue:

**Option 1: Manual check after `bun convex`**
Every time you start Convex, run:

```bash
bun convex
# Then immediately:
sed -i 's|EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210|EXPO_PUBLIC_CONVEX_URL=https://vivid-giraffe-17.convex.cloud|g' .env.local
```

**Option 2: Use the wrapper script**
Instead of `bun convex`, use:

```bash
./scripts/start-convex.sh
```

This automatically fixes the URL after Convex starts.

## 🌐 Nuclear Option: Tunnel Mode

If you STILL get errors after all this, use tunnel mode:

```bash
npx expo start --tunnel --clear
```

This bypasses ALL local network issues but is slower.

## 📝 Current Configuration:

```
EXPO_PUBLIC_API_URL=http://192.168.1.103:3000
EXPO_PUBLIC_CONVEX_URL=https://vivid-giraffe-17.convex.cloud
```

## 🎯 Summary:

The error happens because:

1. Expo Go tries to download updates from your dev server
2. The manifest URL or bundle is unreachable
3. Convex URL keeps pointing to localhost

I've disabled OTA updates, cleared caches, and fixed the Convex URL.

**Now restart everything with `--clear` flag!**
