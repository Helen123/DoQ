# DoQ Branching TODO

## Branch roles

- `main`: production branch. The public demo at `trydoq.com` should deploy from this branch only.
- `staging`: testing branch for demo-ready work before it is promoted to production.
- `feature/*`: optional short-lived branches for larger changes before merging into `staging`.

## Release flow

1. Build and test changes locally.
2. Merge feature work into `staging`.
3. Verify the staging branch with the same Docker Compose build used in production.
4. Merge `staging` into `main` when the change is ready for the public demo.
5. Deploy production from `main`:

```bash
git pull --ff-only
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## GitHub setup TODO

- Keep `main` as the default branch.
- Add a branch protection rule for `main` so production updates happen through reviewed merges.
- Optional: add a GitHub Action later to build both frontend and backend on pull requests.
- Optional: add a real staging server that follows the `staging` branch.
