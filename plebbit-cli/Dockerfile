FROM node:22-alpine

RUN apk add --no-cache git curl && \
    corepack enable && \
    corepack prepare yarn@stable --activate

WORKDIR /app

RUN git clone https://github.com/plebbit/plebbit-cli.git .

RUN npm install && \
    npm run build && \
    npm run oclif manifest && \
    npm run ci:download-web-uis && \
    mkdir -p /app/plebbit_db

EXPOSE 9138

CMD ["./bin/run", "daemon"]
