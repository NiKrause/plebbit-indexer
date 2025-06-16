# plebbit-indexer

A Plebbit crawler, indexer and UI.

- **Crawler**: Indexes posts from all known subplebbits and exposes them via a REST API.
- **Plebindex**: Next.js frontend to search and view indexed posts.

---

## Table of Contents
- [Features](#features)
- [Recent Updates](#recent-updates)
- [Project Structure](#project-structure)
- [Quickstart (with Docker Compose)](#quickstart-with-docker-compose)
- [How it Works](#how-it-works)
  - [Crawler (Backend)](#crawler-backend)
  - [Plebindex (Frontend)](#plebindex-frontend)
- [Configuration](#configuration)
- [SSL Certificate Configuration](#ssl-certificate-configuration)
- [Development](#development)
  - [Run Crawler Locally](#run-crawler-locally)
  - [Run Frontend Locally](#run-frontend-locally)
  - [Zero Downtime Deployment](#zero-downtime-deployment)
- [API](#api)
  - [Public Endpoints](#public-endpoints)
  - [Protected Endpoints](#protected-endpoints)
- [Notes](#notes)
- [License](#license)

---

## Features

- **Comprehensive Reply System**: Full reply threading with parent-child relationships and nested reply support
- **Advanced Search**: Full-text search across posts, replies, authors, and subplebbit addresses with filtering
- **Multiple Sort Options**: Sort by new, top (score), replies count, or old for both posts and replies
- **Reply Control**: Toggle to include or exclude replies from search and browse results
- **Time-based Filtering**: Filter content by hour, day, week, month, year, or all time
- **Pagination**: Efficient pagination for both posts and replies with customizable limits
- **Queue Management**: Intelligent subplebbit processing queue with retry logic and error tracking
- **Parent Context**: Replies show context from their parent posts with author information
- **Modern Frontend**: Built with Next.js 15 and React 19 for optimal performance
- **Comprehensive Testing**: Full test suite covering reply threading, search, and API functionality
- Crawls all known subplebbit addresses and indexes their posts into a local SQLite database
- Exposes a REST API (`/api/posts`) to fetch indexed posts
- Dockerized for easy deployment

---

## Project Structure

```
.
├── crawler/      # Node.js backend: indexer and REST API
├── plebindex/    # Next.js frontend
├── plebbit-cli/  # Plebbit node daemon and configuration
├── nginx/        # Nginx configuration and SSL setup
├── certbot/      # Let's Encrypt certificate management
├── data/         # Persistent data storage (certificates, nginx config, plebbit-cli db)
├── .env          # Environment config (API URLs, server names, node settings)
├── init-letsencrypt.sh  # SSL certificate initialization script
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
- Build and start the **plebbit-cli** node (Plebbit daemon) on port `9138`, which the crawler connects to via WebSocket

### 3. Access the app

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3001/api/posts](http://localhost:3001/api/posts)

---

## How it Works

### Crawler (Backend)

- Fetches subplebbit addresses from multiple sources:
  - A public JSON file on GitHub
  - Dune Analytics query results (executed weekly)
- For each subplebbit:
  - Fetches all posts and stores them in a local SQLite database
  - Listens for updates and re-indexes as needed
- Maintains a `known_subplebbits` table to track all discovered subplebbits and their sources
- Exposes a REST API at `/api/posts` to retrieve all indexed posts
- Includes content moderation capabilities (optional)
- Features a queue system for processing subplebbits with retry logic and error tracking

#### Dune Analytics Integration

The crawler integrates with Dune Analytics to discover new subplebbit communities:

- **Weekly Query Execution**: Executes a Dune query once a week to refresh the list of `.eth` and `.sol` plebbit communities
- **Daily Results Processing**: Fetches and processes the query results once a day to check for new communities
- **Duplicate Prevention**: Maintains a record of all known subplebbits to avoid processing duplicates
- **Configuration**: 
  - `DUNE_API_KEY`: Your Dune Analytics API key
  - `DUNE_QUERY_EXECUTE_INTERVAL_HOURS`: Interval for query execution (default: 168 hours/1 week)
  - `DUNE_QUERY_FETCH_INTERVAL_HOURS`: Interval for fetching results (default: 24 hours/1 day)

### Plebindex (Frontend)

- Next.js app that fetches posts from the backend API.
- Displays posts with links to their original subplebbit and author.

---

## Configuration
- The crawler requires a running `plebbit-cli` node reachable via WebSocket (`PLEBBIT_WS_URL`). When you launch the stack with Docker Compose this service is started automatically and shares its auth-key through the mounted `data/plebbit/auth-key` volume, so no manual setup is needed.
- By default, the crawler/indexing API runs on port `3001` and the frontend on port `3000`.
- Environment variables can be set in the `docker-compose.yml` or via `.env` files.
- When running on a public node nginx is automatically configured by the domain names (comma separated) in the .env file and a ssl-certificate is generated by letsenrypt after running ./init-letsencrypt 

## SSL Certificate Configuration

To enable HTTPS with Let's Encrypt certificates:

1. Configure your domain(s) in the `.env` file:
```bash
SERVER_NAME=example.com,www.example.com  # Comma-separated list of domains
```

2. Initialize Let's Encrypt certificates:
```bash
./init-letsencrypt.sh
```

The initialization process:
1. Creates dummy certificates and a nginx.conf for each domain to start nginx
2. Deletes dummy certificates
3. Requests real certificates from Let's Encrypt
4. Creates symbolic links for all domains
5. Reloads nginx with the new certificates

The setup uses:
- `nginx/nginx.conf.template`: Template for nginx configuration
- `nginx/docker-entrypoint.d/001-parse-template.sh`: Script to generate nginx configs
- Docker containers:
  - `nginx`: Serves the application and handles SSL
  - `certbot`: Manages Let's Encrypt certificates
- Required volume mounts:
  - `./data/certbot/conf:/etc/letsencrypt`: Stores certificates
  - `./data/certbot/www:/var/www/certbot`: Webroot for Let's Encrypt validation
  - `./nginx/nginx.conf.template:/etc/nginx/nginx.conf.template`: Nginx template
  - `./nginx/docker-entrypoint.d/:/docker-entrypoint.d/`: Entrypoint scripts

Certificates will auto-renew every 12 days controlled by certbot container.

---

## Development

### Run Crawler Locally

```bash
cd crawler
npm install
PLEBBIT_WS_URL=ws://localhost:9138/AUTH-KEY_FROM_DATA_PLEBBIT_DIRECTORY npm run crawler
```

### Run Frontend Locally

```bash
cd plebindex
npm install
npm run dev
```

### Zero Downtime Deployment

The project includes a zero downtime deployment system using dual-instance architecture:
- Each service (crawler and plebindex) runs two separate instances (01 and 02)
- The included `deploy.sh` script intelligently detects which components need updating
- When deploying changes, it builds and starts the inactive instance
- Once the new instance is running, it updates the Nginx configuration to route traffic to the new instance
- This blue/green deployment approach ensures continuous service availability during updates
- To deploy, simply run `./deploy.sh` which will pull the latest changes and handle the upgrade process

---

## API

### Public Endpoints

- `GET /api/posts`  
  Returns all indexed posts as JSON.
  
  Supports sorting and time filtering:
  - `?sort=<sort_type>` - Sort by: `new` (default), `top`, `replies`, or `old`
  - `?t=<time_filter>` - Filter by time: `all` (default), `hour`, `day`, `week`, `month`, `year`
  - `?page=<page_number>` - For pagination (default: 1)
  - `?limit=<count>` - Number of results per page (default: 20, set to 0 for all posts)

- `GET /api/posts/search?q=<search_term>`  
  Search posts by title, content, author name, or subplebbit address.
  Returns matching posts as JSON.
  
  Also supports the same sorting and filtering options:
  - `?sort=<sort_type>` - Sort by: `new` (default), `top`, `replies`, or `old`
  - `?t=<time_filter>` - Filter by time: `all` (default), `hour`, `day`, `week`, `month`, `year`
  - `?page=<page_number>` - For pagination (default: 1)
  - `?limit=<count>` - Number of results per page (default: 20, set to 0 for all posts)

  The response includes pagination metadata:
  ```json
  {
    "posts": [...],
    "pagination": {
      "total": 123,       // Total number of matching posts
      "page": 1,          // Current page number
      "limit": 20,        // Posts per page
      "pages": 7          // Total number of pages
    },
    "filters": {
      "sort": "new",      // Current sort method
      "timeFilter": "all" // Current time filter
    }
  }
  ```

- `GET /api/posts/:id`  
  Returns a specific post by its ID.
  
  Response format:
  ```json
  {
    "post": {
      "id": "QmAbC123...",
      "title": "Post title",
      "content": "Post content",
      "subplebbitAddress": "example.eth",
      "authorAddress": "12D3KooW...",
      "authorDisplayName": "Username",
      "timestamp": 1234567890,
      "upvoteCount": 10,
      "downvoteCount": 2,
      "replyCount": 5
    }
  }
  ```
  
  Returns 404 if the post with the given ID doesn't exist.

- `GET /api/replies/:parentCid`  
  Returns replies to a specific post or comment.
  
  Supports pagination and sorting:
  - `?sort=<sort_type>` - Sort by: `new` (default), `top`, or `old`
  - `?page=<page_number>` - For pagination (default: 1)
  - `?limit=<count>` - Number of results per page (default: 20)
  
  The response includes pagination metadata:
  ```json
  {
    "replies": [...],
    "pagination": {
      "total": 123,       // Total number of replies
      "page": 1,          // Current page number
      "limit": 20,        // Replies per page
      "pages": 7          // Total number of pages
    },
    "filters": {
      "sort": "new"       // Current sort method
    }
  }
  ```

### Protected Endpoints
The following endpoints require authentication using either:
- Bearer token in the Authorization header: `Authorization: Bearer <token>`
- Auth key as a query parameter: `?auth=<auth_key>`

- `GET /api/queue`  
  Returns the current subplebbit queue status.
  Optional query parameter: `?status=<status>` to filter by status.

- `GET /api/queue/stats`  
  Returns statistics about the queue including counts by status.

- `GET /api/queue/errors`  
  Returns detailed error information for failed subplebbit processing attempts.

- `POST /api/queue/add`  
  Add a new subplebbit address to the queue.
  Body: `{ "address": "<subplebbit_address>" }`

- `POST /api/queue/retry`  
  Retry processing a failed subplebbit.
  Body: `{ "address": "<subplebbit_address>" }`
  Example: ```curl -X POST "https://plebscan.org/api/queue/retry?auth=xyz" \
  -H "Content-Type: application/json" \
  -d '{"address": "leblore.eth"}'```

- `POST /api/queue/refresh`  
  Refresh the subplebbit queue with new addresses.

- `POST /api/queue/process`  
  Process items from the queue.
  Optional body: `{ "limit": <number> }` to specify batch size (default: 5)

---

## Notes

- The crawler will automatically re-index if restarted but skips each already indexed post
- The index database is persisted inside crawler container under /app/data which is mounted to the host computer under /crawler/data 
- Make sure a plebbit-cli node is running and accessible to the crawler with respected auth-key

---

## License

MIT
