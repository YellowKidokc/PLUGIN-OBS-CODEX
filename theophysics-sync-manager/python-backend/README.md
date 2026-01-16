# Theophysics Sync Manager (Python Backend)

Python service for syncing an Obsidian vault into PostgreSQL with conflict handling.

## Setup
1. Create a virtual environment and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and update the values.
3. Initialize the database schema (see `src/db/schema.py`).

## Run
```bash
python -m src.main
```

## API Endpoints
- `GET /sync/status` – overall status
- `POST /sync/trigger` – manual sync
- `GET /sync/log` – recent sync log
- `GET /conflicts` – list unresolved conflicts
- `POST /conflicts/resolve` – resolve a conflict

## Troubleshooting
- Ensure PostgreSQL is running and credentials are correct.
- Verify `VAULT_PATH` points to your Obsidian vault.
