import os
from typing import List

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

from ..db import queries
from ..sync_engine import SyncEngine

load_dotenv()

app = FastAPI(title="Theophysics Sync Manager")

sync_engine = SyncEngine(os.getenv("VAULT_PATH", "."))


class ConflictResolution(BaseModel):
    conflict_id: int
    choice: str


@app.get("/sync/status")
def sync_status():
    return {
        "connected": True,
        "lastSync": None,
        "pendingConflicts": len(queries.list_conflicts()),
    }


@app.post("/sync/trigger")
def trigger_sync():
    sync_engine.sync_all()
    return {"status": "ok"}


@app.get("/sync/log")
def sync_log():
    return queries.list_sync_log()


@app.get("/conflicts")
def conflicts() -> List[dict]:
    return queries.list_conflicts()


@app.post("/conflicts/resolve")
def resolve_conflict(payload: ConflictResolution):
    queries.resolve_conflict(payload.conflict_id, payload.choice)
    return {"status": "resolved"}
