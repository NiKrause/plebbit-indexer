#!/bin/bash

NGINX_CONF_DIR="./data/nginx"
UPSTREAM_CONF="${NGINX_CONF_DIR}/upstream.conf"

# Create upstream directory if it doesn't exist
mkdir -p ${NGINX_CONF_DIR}

# Check which instance is currently active
if grep -q "plebindex01" ${UPSTREAM_CONF} && ! grep -q "#server plebindex01" ${UPSTREAM_CONF}; then
    echo "Switching from plebindex01 to plebindex02"
    cat > ${UPSTREAM_CONF} << EOF
upstream plebindex_backend {
    # server plebindex01:3000;
    server plebindex02:3000;
}
EOF
else
    echo "Switching from plebindex02 to plebindex01"
    cat > ${UPSTREAM_CONF} << EOF
upstream plebindex_backend {
    server plebindex01:3000;
    # server plebindex02:3000;
}
EOF
fi

# Reload nginx configuration
docker-compose exec nginx nginx -s reload