# DoQ — Document Q&A Demo

A RAG (Retrieval-Augmented Generation) demo built with FastAPI + React. Ask questions about pre-loaded documents, get answers with source citations.

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
    → Generate embedding (DashScope text-embedding-v3)
    → Search Qdrant for top-5 relevant chunks
    → Feed chunks + question to Qwen-72B
    → Stream answer back with source citations
```

---

## Deployment

- **Server**: Oracle Cloud Always Free (4 OCPU, 24GB RAM)
- **Vector DB**: Qdrant Cloud free tier
- **Domain + CDN**: Cloudflare
