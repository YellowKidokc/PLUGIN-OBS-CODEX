from .db import queries


def resolve_conflict(conflict_id: int, choice: str) -> None:
    queries.resolve_conflict(conflict_id, choice)
