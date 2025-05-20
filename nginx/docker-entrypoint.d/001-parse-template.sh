#!/bin/sh
set -e

# Create a directory for the config files
mkdir -p /etc/nginx/conf.d

# Split SERVER_NAME into an array by comma and process each domain
IFS=','
for domain in $SERVER_NAME; do
    echo "Processing domain: $domain"
    # Create a temporary config file for each domain
    export domain && envsubst '${domain}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/${domain}.conf
done

# Set up SSL parameters
data_path=/etc/letsencrypt
mkdir -p "$data_path/conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"

# Include the upstream configuration if it exists
if [ -f "/etc/nginx/conf.d/upstream.conf" ]; then
    cp /etc/nginx/conf.d/upstream.conf /etc/nginx/conf.d/upstream.conf.bak
else
    # Create default upstream configuration
    mkdir -p /etc/nginx/conf.d
    cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream plebindex_backend {
    server plebindex01:3000;
    # server plebindex02:3000;
}
EOF
fi

# Include the crawler upstream configuration
if [ -f "/etc/nginx/conf.d/crawler_upstream.conf" ]; then
    cp /etc/nginx/conf.d/crawler_upstream.conf /etc/nginx/conf.d/crawler_upstream.conf.bak
else
    # Create default crawler upstream configuration
    mkdir -p /etc/nginx/conf.d
    cat > /etc/nginx/conf.d/crawler_upstream.conf << EOF
upstream crawler_backend {
    server crawler01:3001;
    # server crawler02:3001;
}
EOF
fi

# Process the nginx configuration template
# envsubst '${domain}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo 'running nginx now and reload every 6 hours'
while :; do sleep 6h & wait ${!}; nginx -s reload; done & nginx -g "daemon off;"

exec "$@"