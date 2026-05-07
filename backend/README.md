# DoQ Backend

FastAPI backend for the DoQ document Q&A demo.

The production backend is intentionally small:

- FastAPI API on port `8000`
- Redis for guest daily rate limits
- Qdrant Cloud for vector search
- DashScope for embeddings and Qwen chat completion

## Local

```bash
cp .env.example .env
docker compose up --build
```

API docs:

```text
http://localhost:8000/docs
```

## Index Documents

Put documents in `backend/docs/`, configure Qdrant and DashScope in `backend/.env`, then run:

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r app/requirements.txt
python index_documents.py
```

## Production

Use the root-level production Compose file:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

See `deploy/README.md` for the full Oracle + domain flow.
