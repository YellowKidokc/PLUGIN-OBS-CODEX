import os
import time

from dotenv import load_dotenv
import uvicorn

from .sync_engine import SyncEngine
from .watcher import start_watcher

load_dotenv()


def run() -> None:
    vault_path = os.getenv("VAULT_PATH", ".")
    sync_engine = SyncEngine(vault_path)

    watch_mode = os.getenv("WATCH_MODE", "true").lower() == "true"
    if watch_mode:
        start_watcher(vault_path, sync_engine)

    host = os.getenv("API_HOST", "localhost")
    port = int(os.getenv("API_PORT", "8000"))

    uvicorn.run("src.api.server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    run()
