# DoQ — Document Q&A Demo

A RAG (Retrieval-Augmented Generation) demo built with FastAPI + React. Ask questions about pre-loaded documents, get answers with source citations.

## Live Links

| Link | URL |
|------|-----|
| Live demo | [https://trydoq.com](https://trydoq.com) |
| API docs | [https://trydoq.com/api/docs](https://trydoq.com/api/docs) |
| Production branch | [`main`](https://github.com/Helen123/DoQ/tree/main) |
| Staging branch | [`staging`](https://github.com/Helen123/DoQ/tree/staging) |

**No account required.** Guest mode with daily rate limiting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | FastAPI (Python 3.11) |
| Vector Search | Qdrant Cloud |
| LLM & Embeddings | Alibaba DashScope (Qwen / text-embedding-v3) |
| Rate Limiting | Redis |
| Container | Docker Compose |

---

## Local Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11 (for indexing documents)

### 1. Configure environment variables

Copy and fill in your API keys:

```bash
cd backend
cp .env.example .env
# Edit .env: fill in DASHSCOPE_API_KEY, QDRANT_URL, QDRANT_API_KEY
```

### 2. Index documents into Qdrant

Put your documents in `backend/docs/`, then run:

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r app/requirements.txt
python index_documents.py
```

Supported formats: PDF, DOCX, TXT, XLSX, Markdown

### 3. Start backend

```bash
cd backend
docker compose up --build
```

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API docs | http://localhost:8000/docs |

---

## How It Works

```
User question
    → FastAPI checks Redis rate limit (20 msg/day per guest)
    → Stream an interactive RAG trace to the UI
    → Generate embedding (DashScope text-embedding-v3)
    → Search Qdrant for top-5 relevant chunks
    → Show matches, scores, and ranking details
    → Feed ranked chunks + question to Qwen-72B
    → Stream answer back with source citations
```

The demo shows each query as an inspectable flow: query preparation, embedding, vector search, ranking, prompt context, and final LLM answer.

---

## Deployment

- **Live site**: [https://trydoq.com](https://trydoq.com)
- **Server**: Oracle Cloud Always Free (4 OCPU, 24GB RAM)
- **Vector DB**: Qdrant Cloud free tier
- **Domain + CDN**: Cloudflare

Production deployment files are included:

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Runs API, Redis, frontend, and Caddy |
| `.env.production.example` | Domain and frontend build variables |
| `backend/.env.example` | Backend secrets and service variables |
| `deploy/Caddyfile` | HTTPS + `/api` reverse proxy |
| `frontend/Dockerfile` | Builds and serves the Vite app |

Quick start on the server:

```bash
cp .env.production.example .env
cp backend/.env.example backend/.env
# Edit .env and backend/.env
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Full instructions: `deploy/README.md`
