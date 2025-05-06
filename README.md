# plebbit-indexer

A full-stack indexer and frontend for the Plebbit protocol.

- **Crawler**: Indexes posts from all known subplebbits and exposes them via a REST API.
- **Plebindex**: Next.js frontend to search and view indexed posts.

---

## Features

- Crawls all known subplebbit addresses and indexes their posts into a local SQLite database.
- Exposes a REST API (`/api/posts`) to fetch indexed posts.
- Next.js frontend to search and display posts.
- Dockerized for easy deployment.

---

## Project Structure

```
.
├── crawler/      # Node.js backend: indexer and REST API
├── plebindex/    # Next.js frontend
├── docker-compose.yml
```

---

## Quickstart (with Docker Compose)

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

### 1. Clone the repository

```bash
git clone https://github.com/NiKrause/plebbit-indexer.git
cd plebbit-indexer
```

### 2. Start all services

```bash
docker-compose up --build
```

This will:
- Build and start the **crawler** (backend/indexer) on port `3001`
- Build and start the **plebindex** (frontend) on port `3000`
- Use a shared Docker volume for the SQLite database

### 3. Access the app

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3001/api/posts](http://localhost:3001/api/posts)

---

## How it Works

### Crawler (Backend)

- Fetches a list of subplebbit addresses from a public JSON file.
- For each subplebbit:
  - Fetches all posts and stores them in a local SQLite database.
  - Listens for updates and re-indexes as needed.
- Exposes a REST API at `/api/posts` to retrieve all indexed posts.

### Plebindex (Frontend)

- Next.js app that fetches posts from the backend API.
- Displays posts with links to their original subplebbit and author.

---

## Configuration

- The crawler expects a Plebbit node to be running and accessible via WebSocket (`PLEBBIT_WS_URL`).
- By default, the backend API runs on port `3001` and the frontend on port `3000`.
- Environment variables can be set in the `docker-compose.yml` or via `.env` files.

---

## Development

### Run Crawler Locally

```bash
cd crawler
npm install
PLEBBIT_WS_URL=ws://localhost:9138 npm run crawler
```

### Run Frontend Locally

```bash
cd plebindex
npm install
npm run dev
```

---

## API

- `GET /api/posts`  
  Returns all indexed posts as JSON.

---

## Notes

- The crawler will automatically re-index if restarted but skips each already indexed post
- The database is persisted in a Docker volume (`plebbit_db`).
- Make sure a Plebbit node is running and accessible to the crawler.

---

## License

MIT
