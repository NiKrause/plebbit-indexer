FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    git \
    fontconfig \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g corepack \
    && corepack enable \
    && corepack prepare yarn@stable --activate \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY start-plebbit.sh /app/data/start-plebbit.sh
RUN git clone https://github.com/plebbit/plebbit-cli.git && \
    cd plebbit-cli && \
    yarn install && \
    yarn build && \
    yarn oclif manifest && \
    yarn ci:download-web-uis && \
    mkdir -p /app/plebbit_db

EXPOSE 9138

CMD ["/app/plebbit-cli/bin/run", "daemon"]
