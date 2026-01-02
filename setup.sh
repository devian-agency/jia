#!/bin/bash

echo "🚀 Setting up JIA - Next-Gen AI Girlfriend App"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

# Step 2: Install server dependencies
echo -e "${BLUE}📦 Installing server dependencies...${NC}"
cd server && bun install && cd ..

# Step 3: Setup Convex
echo -e "${BLUE}🔧 Setting up Convex...${NC}"
echo -e "${YELLOW}Note: Convex is already initialized. Run 'npx convex dev' separately.${NC}"

# Step 4: Environment setup reminder
echo ""
echo -e "${YELLOW}⚠️  Important: Update your environment variables!${NC}"
echo ""
echo "1. Edit .env file:"
echo "   - EXPO_PUBLIC_API_URL (your local IP address)"
echo "   - CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET"
echo ""
echo "2. Edit server/.env file:"
echo "   - CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET"
echo "   - OPENROUTER_API_KEY (if you want to change it)"
echo ""

# Step 5: Success message
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${BLUE}To start the app:${NC}"
echo ""
echo "Terminal 1 - Convex Backend:"
echo "  npx convex dev"
echo ""
echo "Terminal 2 - API Server:"
echo "  cd server && bun run dev"
echo ""
echo "Terminal 3 - Expo App:"
echo "  npm start"
echo ""
echo -e "${GREEN}Happy coding! 💕${NC}"
