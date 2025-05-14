#!/bin/sh

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

echo 'running nginx now and reload every 6 hours'
while :; do sleep 6h & wait ${!}; nginx -s reload; done & nginx -g "daemon off;"

exec "$@"