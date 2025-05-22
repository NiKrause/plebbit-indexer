#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Check which docker compose command is available
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo -e "${YELLOW}Neither docker compose nor docker-compose commands found. Please install Docker Compose.${NC}"
  exit 1
fi

# 1. Pull the latest changes from GitHub
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
git pull

# Check which directories were changed
CHANGED_FILES=$(git diff --name-only HEAD@{1} HEAD)
REBUILD_CRAWLER=false
REBUILD_PLEBINDEX=false

# 2. Determine which containers need rebuilding
echo -e "${YELLOW}Checking for changes in services...${NC}"
if echo "$CHANGED_FILES" | grep -q "^crawler/"; then
  echo -e "${GREEN}Changes detected in crawler/ - Will rebuild crawler container${NC}"
  REBUILD_CRAWLER=true
fi

if echo "$CHANGED_FILES" | grep -q "^plebindex/"; then
  echo -e "${GREEN}Changes detected in plebindex/ - Will rebuild plebindex container${NC}"
  REBUILD_PLEBINDEX=true
fi

# 3. Rebuild and restart containers as needed
if [ "$REBUILD_CRAWLER" = true ]; then
  echo -e "${YELLOW}Rebuilding and restarting crawler with zero-downtime...${NC}"
  
  # Check which crawler instance is currently active
  if grep -q "crawler01" ./data/nginx/002-crawler_upstream.conf && ! grep -q "#server crawler01" ./data/nginx/002-crawler_upstream.conf; then
    echo "crawler01 is active, updating crawler02..."
    $DOCKER_COMPOSE build crawler02
    $DOCKER_COMPOSE up -d crawler02
    sleep 5 # Wait for service to be fully up
    
    # Update the upstream configuration
    cat > ./data/nginx/002-crawler_upstream.conf << EOF
upstream crawler_backend {
    # server crawler01:3001;
    server crawler02:3001;
}
EOF
    # Reload nginx to apply the new configuration
    $DOCKER_COMPOSE exec nginx nginx -s reload
  else
    echo "crawler02 is active, updating crawler01..."
    $DOCKER_COMPOSE build crawler01
    $DOCKER_COMPOSE up -d crawler01
    sleep 5 # Wait for service to be fully up
    
    # Update the upstream configuration
    cat > ./data/nginx/002-crawler_upstream.conf << EOF
upstream crawler_backend {
    server crawler01:3001;
    # server crawler02:3001;
}
EOF
    # Reload nginx to apply the new configuration
    $DOCKER_COMPOSE exec nginx nginx -s reload
  fi
fi

if [ "$REBUILD_PLEBINDEX" = true ]; then
  echo -e "${YELLOW}Rebuilding and restarting plebindex with zero-downtime...${NC}"
  
  # Check which plebindex instance is currently active
  if grep -q "plebindex01" ./data/nginx/001-upstream.conf && ! grep -q "#server plebindex01" ./data/nginx/001-upstream.conf; then
    echo "plebindex01 is active, updating plebindex02..."
    $DOCKER_COMPOSE build plebindex02
    $DOCKER_COMPOSE up -d plebindex02
    sleep 5 # Wait for service to be fully up
    
    # Update the upstream configuration
    cat > ./data/nginx/001-upstream.conf << EOF
upstream plebindex_backend {
    # server plebindex01:3000;
    server plebindex02:3000;
}
EOF
    # Reload nginx to apply the new configuration
    $DOCKER_COMPOSE exec nginx nginx -s reload
  else
    echo "plebindex02 is active, updating plebindex01..."
    $DOCKER_COMPOSE build plebindex01
    $DOCKER_COMPOSE up -d plebindex01
    sleep 5 # Wait for service to be fully up
    
    # Update the upstream configuration
    cat > ./data/nginx/001-upstream.conf << EOF
upstream plebindex_backend {
    server plebindex01:3000;
    # server plebindex02:3000;
}
EOF
    # Reload nginx to apply the new configuration
    $DOCKER_COMPOSE exec nginx nginx -s reload
  fi
fi

# If no specific changes were detected, offer to rebuild everything
if [ "$REBUILD_CRAWLER" = false ] && [ "$REBUILD_PLEBINDEX" = false ]; then
  echo -e "${YELLOW}No specific service changes detected. Do you want to rebuild all containers? (y/n)${NC}"
  read -r answer
  if [ "$answer" = "y" ]; then
    echo -e "${GREEN}Rebuilding and restarting all containers...${NC}"
    $DOCKER_COMPOSE build
    $DOCKER_COMPOSE up -d
  else
    echo -e "${GREEN}No containers will be rebuilt.${NC}"
  fi
fi

echo -e "${GREEN}Deployment process completed!${NC}" 