#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

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
  echo -e "${YELLOW}Rebuilding and restarting crawler...${NC}"
  docker-compose build crawler
  docker-compose up -d crawler
fi

if [ "$REBUILD_PLEBINDEX" = true ]; then
  echo -e "${YELLOW}Rebuilding and restarting plebindex...${NC}"
  
  # For zero-downtime deployment (after configuration updates):
  # Uncomment these lines after implementing blue-green deployment
  #if docker-compose ps | grep -q "plebindex01.*Up"; then
  #  echo "plebindex01 is active, updating plebindex02..."
  #  docker-compose build plebindex02
  #  docker-compose up -d plebindex02
  #  sleep 5 # Wait for service to be fully up
  #  docker-compose exec nginx nginx -s reload # Switch traffic
  #else
  #  echo "plebindex02 is active, updating plebindex01..."
  #  docker-compose build plebindex01
  #  docker-compose up -d plebindex01
  #  sleep 5 # Wait for service to be fully up
  #  docker-compose exec nginx nginx -s reload # Switch traffic
  #fi
  
  # Current implementation (before zero-downtime setup)
  docker-compose build plebindex
  docker-compose up -d plebindex
fi

# If no specific changes were detected, offer to rebuild everything
if [ "$REBUILD_CRAWLER" = false ] && [ "$REBUILD_PLEBINDEX" = false ]; then
  echo -e "${YELLOW}No specific service changes detected. Do you want to rebuild all containers? (y/n)${NC}"
  read -r answer
  if [ "$answer" = "y" ]; then
    echo -e "${GREEN}Rebuilding and restarting all containers...${NC}"
    docker-compose build
    docker-compose up -d
  else
    echo -e "${GREEN}No containers will be rebuilt.${NC}"
  fi
fi

echo -e "${GREEN}Deployment process completed!${NC}" 