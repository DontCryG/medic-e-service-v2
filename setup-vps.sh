#!/bin/bash
set -e

echo "=============================================="
echo "🚀 Medic E-Service V2: Automated VPS Setup"
echo "=============================================="

# 1. Update packages
echo "[1/6] Updating system packages..."
sudo apt-get update -y

# 2. Add 2GB Swap Memory (Crucial for 1GB RAM VPS)
if [ ! -f /swapfile ]; then
    echo "[2/6] Configuring 2GB Swap Memory..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "[2/6] Swapfile already exists."
fi

# 3. Install Docker & Docker Compose
echo "[3/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
fi

# 4. Setup Firewall (UFW)
echo "[4/6] Configuring Firewall (UFW)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 5. Setup environment if not present
echo "[5/6] Checking configuration..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cat <<EOT > backend/.env
SUPABASE_URL=https://phxsdgkergzxhljhnteu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_V6ZWzZMSbrnN9ZCP_bEoYA_yaXC07B-
PORT=3001
CORS_ORIGIN=*
EOT
fi

# 6. Build and launch with Docker Compose
echo "[6/6] Building and Launching Docker Containers..."
sudo docker compose up -d --build

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "The system is now live on: http://$(curl -s ifconfig.me || echo 'YOUR_IP')"
echo "=============================================="
