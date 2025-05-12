FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Accept build argument
ARG PLEBBIT_WS_URL
ENV PLEBBIT_WS_URL=$PLEBBIT_WS_URL

COPY . .

CMD ["npm", "start"]
