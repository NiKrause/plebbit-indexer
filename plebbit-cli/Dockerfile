# Use Node.js 22
FROM node:22-alpine

# Install Git and Yarn
RUN apk add --no-cache git && \
    corepack enable && \
    corepack prepare yarn@stable --activate

# Create app directory
WORKDIR /app

# Clone the repository
RUN git clone https://github.com/plebbit/plebbit-cli.git .

# Install dependencies
RUN yarn install

# Build the project
RUN yarn build

# Create data directory
RUN mkdir -p /app/plebbit_db

# Expose the WebSocket port
EXPOSE 9138

# Set the default command
CMD ["yarn", "start", "daemon"]
