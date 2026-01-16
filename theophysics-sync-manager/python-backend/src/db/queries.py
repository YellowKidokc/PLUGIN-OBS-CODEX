from typing import Optional, List, Dict
from .connection import fetch_one, fetch_all, execute


def get_note_by_path(path: str) -> Optional[Dict]:
    return fetch_one("SELECT * FROM notes WHERE vault_path = %s", (path,))


def insert_note(path: str, filename: str, content: str, checksum: str) -> None:
    execute(
        "INSERT INTO notes (vault_path, filename, content, checksum) VALUES (%s, %s, %s, %s)",
        (path, filename, content, checksum),
    )


def update_note(path: str, content: str, checksum: str) -> None:
    execute(
        "UPDATE notes SET content = %s, checksum = %s, modified_at = NOW() WHERE vault_path = %s",
        (content, checksum, path),
    )


def log_sync(note_uuid: str, operation: str, conflict: bool = False, resolution: str = "") -> None:
    execute(
        "INSERT INTO sync_log (note_uuid, operation, conflict, resolution) VALUES (%s, %s, %s, %s)",
        (note_uuid, operation, conflict, resolution),
    )


def create_conflict(note_uuid: str, vault_content: str, db_content: str) -> None:
    execute(
        "INSERT INTO conflicts (note_uuid, vault_content, db_content, vault_modified_at, db_modified_at) "
        "VALUES (%s, %s, %s, NOW(), NOW())",
        (note_uuid, vault_content, db_content),
    )


def list_conflicts() -> List[Dict]:
    return fetch_all("SELECT * FROM conflicts WHERE resolved = FALSE ORDER BY id DESC")


def resolve_conflict(conflict_id: int, choice: str) -> None:
    execute(
        "UPDATE conflicts SET resolved = TRUE, resolution_choice = %s WHERE id = %s",
        (choice, conflict_id),
    )


def list_sync_log() -> List[Dict]:
    return fetch_all("SELECT * FROM sync_log ORDER BY timestamp DESC LIMIT 50")
