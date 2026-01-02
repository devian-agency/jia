#!/bin/bash

# JIA Development Startup Script
# This script starts all three services needed for development

echo "🚀 Starting JIA Development Environment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if tmux is available
if command -v tmux &> /dev/null; then
    echo -e "${BLUE}Starting services in tmux session...${NC}"
    
    # Create new tmux session
    tmux new-session -d -s jia
    
    # Window 1: Convex
    tmux rename-window -t jia:0 'convex'
    tmux send-keys -t jia:0 'npx convex dev' C-m
    
    # Window 2: Server
    tmux new-window -t jia:1 -n 'server'
    tmux send-keys -t jia:1 'cd server && bun run dev' C-m
    
    # Window 3: Expo
    tmux new-window -t jia:2 -n 'expo'
    tmux send-keys -t jia:2 'npm start' C-m
    
    # Attach to session
    tmux select-window -t jia:0
    tmux attach-session -t jia
    
else
    echo -e "${YELLOW}tmux not found. Please run services in separate terminals:${NC}"
    echo ""
    echo -e "${BLUE}Terminal 1 - Convex:${NC}"
    echo "  npx convex dev"
    echo ""
    echo -e "${BLUE}Terminal 2 - API Server:${NC}"
    echo "  cd server && bun run dev"
    echo ""
    echo -e "${BLUE}Terminal 3 - Expo App:${NC}"
    echo "  npm start"
    echo ""
fi
