# DoQ Production Deploy

This setup runs the public demo as four containers:

- `caddy`: HTTPS termination and reverse proxy
- `frontend`: static Vite build served by nginx
- `api`: FastAPI RAG backend
- `redis`: guest rate-limit counters

## 1. Server prerequisites

On an Oracle Ubuntu instance:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in after adding the Docker group.

Open ports `80` and `443` in both Oracle Security List / NSG and the server firewall.

## 2. Clone and configure

```bash
git clone https://github.com/Helen123/DoQ.git
cd DoQ
cp .env.production.example .env
cp backend/.env.example backend/.env
```

Edit `.env`:

```bash
DOMAIN=trydoq.com
ACME_EMAIL=you@example.com
```

Edit `backend/.env` with:

```bash
DASHSCOPE_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
QDRANT_COLLECTION=demo_kb
```

## 3. DNS

Create an `A` record for the domain pointing to the Oracle public IP.

If using Cloudflare, start with DNS-only while Caddy obtains the certificate. After HTTPS works, proxied mode is fine.

## 4. Start

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Check:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml logs -f api
```

Then open:

```text
https://trydoq.com
https://trydoq.com/api/docs
```

## 5. Update

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
