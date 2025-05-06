FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Accept build argument
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
