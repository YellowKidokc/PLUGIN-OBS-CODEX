#!/usr/bin/env python3
"""Initialize the PostgreSQL database schema for Theophysics Sync Manager."""

import os
import sys

# Set environment variables for this session
os.environ["POSTGRES_HOST"] = "192.168.1.177"
os.environ["POSTGRES_PORT"] = "2665"
os.environ["POSTGRES_DB"] = "theophysics"
os.environ["POSTGRES_USER"] = "Yellowkid"
os.environ["POSTGRES_PASSWORD"] = "Moss9pep28$"

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from db.schema import init_schema

if __name__ == "__main__":
    print("Initializing Theophysics database schema...")
    try:
        init_schema()
        print("SUCCESS: Database schema initialized!")
        print("   - notes table")
        print("   - sync_log table")
        print("   - conflicts table")
    except Exception as e:
        print(f"ERROR: Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
