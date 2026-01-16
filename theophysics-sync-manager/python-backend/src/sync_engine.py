import hashlib
import os
from typing import Optional

from .db import queries


def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def compute_checksum(content: str) -> str:
    return hashlib.md5(content.encode("utf-8")).hexdigest()


class SyncEngine:
    def __init__(self, vault_path: str):
        self.vault_path = vault_path

    def sync_file(self, file_path: str) -> None:
        content = read_file(file_path)
        checksum = compute_checksum(content)
        existing = queries.get_note_by_path(file_path)

        if existing:
            if existing["checksum"] != checksum:
                if self.is_conflict(existing):
                    self.handle_conflict(file_path, content, existing)
                else:
                    queries.update_note(file_path, content, checksum)
                    queries.log_sync(existing["uuid"], "UPDATE")
        else:
            filename = os.path.basename(file_path)
            queries.insert_note(file_path, filename, content, checksum)

    def mark_deleted(self, file_path: str) -> None:
        existing = queries.get_note_by_path(file_path)
        if existing:
            queries.log_sync(existing["uuid"], "DELETE")

    def is_conflict(self, db_note: dict) -> bool:
        return db_note["modified_at"] > db_note["synced_at"]

    def handle_conflict(self, path: str, vault_content: str, db_note: dict) -> None:
        queries.create_conflict(db_note["uuid"], vault_content, db_note["content"])
        queries.log_sync(db_note["uuid"], "UPDATE", conflict=True)

    def sync_all(self) -> None:
        for root, _, files in os.walk(self.vault_path):
            for filename in files:
                if filename.endswith(".md"):
                    self.sync_file(os.path.join(root, filename))
