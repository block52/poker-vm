# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Test Docker installation
echo "Testing Docker installation..."
docker --version

# Build and start the services
echo "Building Docker images..."
docker compose build --no-cache

echo "Starting Docker services..."
docker compose up -d --remove-orphans

# Wait for services to be healthy
echo "Waiting for services to start (60 seconds)..."
sleep 60

# Test the PVM backend on port 8545
echo "Testing PVM backend health endpoint..."
curl -f http://localhost:8545/health || echo "Warning: Health check failed"

echo "Docker setup complete!"