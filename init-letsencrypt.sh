#!/bin/bash

if [ -f .env ]; then
    set -a  # automatically export all variables
    source .env
    set +a
else
    echo "Error: .env file not found" >&2
    exit 1
fi

domains=($(echo ${SERVER_NAME} | tr ',' ' '))

rsa_key_size=4096
data_path="./data/certbot"
email="plebbit@le-space.de" # Adding a valid address is strongly recommended
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi


if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

for domain in "${domains[@]}"; do
  path="/etc/letsencrypt/live/$domain"
  echo "### Creating dummy certificates for $domain into $path"
  mkdir -p "$path/conf/live/$domain"
  docker compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
      -keyout '$path/privkey.pem' \
      -out '$path/fullchain.pem' \
      -subj '/CN=$domain'" certbot
  docker compose exec certbot ls -l /etc/letsencrypt/live
done
echo "### Starting nginx ..."
docker compose up --force-recreate -d nginx
echo
# Create symbolic links for all domains
echo "### Creating symbolic links for all domains ..."
first_domain="${domains[0]}"
# Create link for the first domain (without -0001)
docker compose run --rm --entrypoint "\
  ln -sf /etc/letsencrypt/live/$first_domain-0001 /etc/letsencrypt/live/$first_domain" certbot

# Create links for additional domains
for domain in "${domains[@]:1}"; do
  docker compose run --rm --entrypoint "\
    ln -sf /etc/letsencrypt/live/$first_domain-0001 /etc/letsencrypt/live/$domain" certbot
done

# when enabled 
#exit

for domain in "${domains[@]}"; do
echo "### Deleting dummy certificates for $domain ..."
  docker compose run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/$domain && \
    rm -Rf /etc/letsencrypt/archive/$domain && \
    rm -Rf /etc/letsencrypt/renewal/$domain.conf" certbot
done
echo

echo "### Requesting Let's Encrypt certificate for $domains ..."

domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi
echo "### Requesting Let's Encrypt certificate for $domains with $staging_arg $email_arg $domain_args"

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

# Create symbolic links for all domains
echo "### Creating symbolic links for all domains ..."
first_domain="${domains[0]}"
# Create link for the first domain (without -0001)
docker compose run --rm --entrypoint "\
  ln -sf /etc/letsencrypt/live/$first_domain-0001 /etc/letsencrypt/live/$first_domain" certbot

# Create links for additional domains
for domain in "${domains[@]:1}"; do
  docker compose run --rm --entrypoint "\
    ln -sf /etc/letsencrypt/live/$first_domain-0001 /etc/letsencrypt/live/$domain" certbot
done

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload