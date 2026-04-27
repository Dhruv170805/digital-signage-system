#!/bin/bash

echo "🚀 Nexus Digital Signage: One-Click Production Setup"
echo "----------------------------------------------------"

# 1. Install Dependencies
echo "📦 Installing backend dependencies..."
npm install --prefix server --silent
echo "📦 Installing frontend dependencies..."
npm install --prefix client --silent

# 2. Build Frontend
echo "🏗️  Building frontend assets..."
cd client && npm run build
cd ..

# 3. Directory Setup
echo "📁 Creating storage directories..."
mkdir -p server/uploads
mkdir -p server/test_codes

# 4. Process Management
if command -v pm2 &> /dev/null
then
    echo "⚙️  Starting services with PM2..."
    pm2 delete nexus-api nexus-worker nexus-client 2>/dev/null
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo "✅ System is running! View status with 'pm2 status'"
else
    echo "⚠️  PM2 not found. Please install it globally: npm install -g pm2"
    echo "Alternatively, you can start manually:"
    echo "Server: npm run dev:server"
    echo "Client: npm run dev:client"
fi

echo "----------------------------------------------------"
echo "🌐 API running on port 5000"
echo "🖥️  Display Dashboard running on port 5173"
echo "----------------------------------------------------"
