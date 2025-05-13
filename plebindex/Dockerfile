FROM node:20

WORKDIR /app

COPY . .
#COPY package.json package-lock.json* ./
RUN npm install

# Accept build argument
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Copy the rest of the application code

# Build the application
RUN npm run build

EXPOSE 3000

# Use an entrypoint script to handle different environments
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
