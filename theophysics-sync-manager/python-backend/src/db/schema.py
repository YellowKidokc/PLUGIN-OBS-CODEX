from .connection import execute

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS notes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_path TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    content TEXT,
    frontmatter JSONB,
    tags TEXT[],
    links TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    synced_at TIMESTAMP DEFAULT NOW(),
    checksum TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    note_uuid UUID REFERENCES notes(uuid),
    operation TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    conflict BOOLEAN DEFAULT FALSE,
    resolution TEXT
);

CREATE TABLE IF NOT EXISTS conflicts (
    id SERIAL PRIMARY KEY,
    note_uuid UUID REFERENCES notes(uuid),
    vault_content TEXT,
    db_content TEXT,
    vault_modified_at TIMESTAMP,
    db_modified_at TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_choice TEXT
);
"""


def init_schema() -> None:
    for statement in SCHEMA_SQL.strip().split(";\n"):
        if statement.strip():
            execute(statement + ";")
