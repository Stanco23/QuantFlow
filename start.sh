#!/bin/bash

# QuantFlow Startup Script
# This script ensures proper port configuration and service startup

set -e

echo "🚀 Starting QuantFlow Services..."
echo ""

# Check if ports are already in use
echo "📡 Checking port availability..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 3000 is already in use. Please stop the process using port 3000:"
    lsof -Pi :3000 -sTCP:LISTEN
    exit 1
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 3001 is already in use. Please stop the process using port 3001:"
    lsof -Pi :3001 -sTCP:LISTEN
    exit 1
fi

echo "✅ Ports 3000 and 3001 are available"
echo ""

# Ensure environment files exist
echo "🔧 Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found, copying from .env.example"
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found, creating with default values"
    cat > frontend/.env.local << EOF
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
PORT=3000
EOF
fi

echo "✅ Environment configuration ready"
echo ""

# Start services
echo "🔥 Starting services..."
echo "   - Backend API: http://localhost:3001"
echo "   - Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Use npm run dev which includes shared build
npm run dev
