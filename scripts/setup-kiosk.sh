#!/bin/bash
# Nexus Digital Signage - Production Kiosk Setup
# Designed for Debian/Ubuntu (Raspberry Pi, Mini PCs)

URL="http://localhost:3000/display" # Replace with your production URL

echo "🚀 Nexus Kiosk Setup Initializing..."

# 1. Disable Screen Sleep & Power Management
echo "🔌 Disabling power management..."
xset s noblank
xset s off
xset -dpms

# 2. Hide mouse cursor after 1s of inactivity
echo "🖱️ Configuring unclutter..."
if ! command -v unclutter &> /dev/null; then
    sudo apt-get install unclutter -y
fi
unclutter -idle 1 -root &

# 3. Launch Chrome in resilient Kiosk Mode
echo "🌐 Launching Nexus Engine Display..."
# --kiosk: Fullscreen without UI
# --noerrdialogs: Prevents "Chrome didn't shut down correctly"
# --disable-infobars: Prevents update prompts
# --check-for-update-interval=31536000: Disables auto-update checks

chromium-browser \
    --noerrdialogs \
    --disable-infobars \
    --kiosk $URL \
    --check-for-update-interval=31536000 \
    --incognito \
    --disable-features=TranslateUI \
    --disk-cache-dir=/dev/null &

echo "✅ Deployment active. Screen locked to: $URL"
