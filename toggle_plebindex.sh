#!/bin/bash

NGINX_CONF_DIR="./data/nginx"
PLEBINDEX_UPSTREAM_CONF="${NGINX_CONF_DIR}/001-upstream.conf"
CRAWLER_UPSTREAM_CONF="${NGINX_CONF_DIR}/002-crawler_upstream.conf"

# Create upstream directory if it doesn't exist
mkdir -p ${NGINX_CONF_DIR}

# Function to print help
print_help() {
    echo "Usage: $0 [plebindex] [crawler]"
    echo ""
    echo "Parameters:"
    echo "  plebindex    Toggle between plebindex01 and plebindex02"
    echo "  crawler      Toggle between crawler01 and crawler02"
    echo ""
    echo "Examples:"
    echo "  $0 plebindex           # Toggle only plebindex"
    echo "  $0 crawler             # Toggle only crawler"
    echo "  $0 plebindex crawler   # Toggle both services"
    echo "  $0 crawler plebindex   # Toggle both services (order doesn't matter)"
}

# Function to check if a service is running
check_service_running() {
    local service=$1
    if ! docker-compose ps $service | grep -q "Up"; then
        echo "Error: $service is not running. Please start it first."
        return 1
    fi
    return 0
}

# Function to toggle plebindex
toggle_plebindex() {
    echo "Toggling plebindex..."
    
    # Check which instance is currently running
    if docker-compose ps plebindex01 | grep -q "Up"; then
        echo "Switching from plebindex01 to plebindex02"
        
        # Check if plebindex02 is running
        if ! check_service_running "plebindex02"; then
            exit 1
        fi
        
        # Update nginx config
        cat > ${PLEBINDEX_UPSTREAM_CONF} << EOF
upstream plebindex_backend {
    # server plebindex01:3000;
    server plebindex02:3000;
}
EOF
        
        # Stop plebindex01
        echo "Stopping plebindex01..."
        docker-compose stop plebindex01
    elif docker-compose ps plebindex02 | grep -q "Up"; then
        echo "Switching from plebindex02 to plebindex01"
        
        # Check if plebindex01 is running
        if ! check_service_running "plebindex01"; then
            exit 1
        fi
        
        # Update nginx config
        cat > ${PLEBINDEX_UPSTREAM_CONF} << EOF
upstream plebindex_backend {
    server plebindex01:3000;
    # server plebindex02:3000;
}
EOF
        
        # Stop plebindex02
        echo "Stopping plebindex02..."
        docker-compose stop plebindex02
    else
        echo "Error: Neither plebindex01 nor plebindex02 is running"
        exit 1
    fi
}

# Function to toggle crawler
toggle_crawler() {
    echo "Toggling crawler..."
    
    # Check which instance is currently active
    if grep -q "crawler01" ${CRAWLER_UPSTREAM_CONF} && ! grep -q "#server crawler01" ${CRAWLER_UPSTREAM_CONF}; then
        echo "Switching from crawler01 to crawler02"
        
        # Check if crawler02 is running
        if ! check_service_running "crawler02"; then
            exit 1
        fi
        
        # Update nginx config
        cat > ${CRAWLER_UPSTREAM_CONF} << EOF
upstream crawler_backend {
    # server crawler01:3001;
    server crawler02:3001;
}
EOF
        
        # Stop crawler01
        echo "Stopping crawler01..."
        docker-compose stop crawler01
    else
        echo "Switching from crawler02 to crawler01"
        
        # Check if crawler01 is running
        if ! check_service_running "crawler01"; then
            exit 1
        fi
        
        # Update nginx config
        cat > ${CRAWLER_UPSTREAM_CONF} << EOF
upstream crawler_backend {
    server crawler01:3001;
    # server crawler02:3001;
}
EOF
        
        # Stop crawler02
        echo "Stopping crawler02..."
        docker-compose stop crawler02
    fi
}

# Parse command line arguments
TOGGLE_PLEBINDEX=false
TOGGLE_CRAWLER=false

# If no arguments provided, show help
if [ $# -eq 0 ]; then
    print_help
    exit 0
fi

# Process all arguments
for arg in "$@"; do
    case $arg in
        plebindex)
            TOGGLE_PLEBINDEX=true
            ;;
        crawler)
            TOGGLE_CRAWLER=true
            ;;
        *)
            echo "Error: Unknown parameter '$arg'"
            echo ""
            print_help
            exit 1
            ;;
    esac
done

# Execute toggles based on parameters
if [ "$TOGGLE_PLEBINDEX" = true ]; then
    toggle_plebindex
fi

if [ "$TOGGLE_CRAWLER" = true ]; then
    toggle_crawler
fi

# Reload nginx configuration
echo "Reloading nginx configuration..."
docker-compose exec nginx nginx -s reload

echo "Toggle operation completed!"