FROM node:20

WORKDIR /app

# Install netcat for the wait script
RUN apt-get update

COPY package.json ./
RUN npm install

# Accept build argument
ARG PLEBBIT_WS_URL
ENV PLEBBIT_WS_URL=$PLEBBIT_WS_URL

COPY . .

# Make the wait script executable
COPY wait-for-plebbit.sh /app/
RUN chmod +x /app/wait-for-plebbit.sh

# Use the wait script as entrypoint
ENTRYPOINT ["/app/wait-for-plebbit.sh"]
