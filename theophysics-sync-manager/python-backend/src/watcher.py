from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class VaultWatcher(FileSystemEventHandler):
    def __init__(self, sync_engine):
        self.sync_engine = sync_engine

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(".md"):
            self.sync_engine.sync_file(event.src_path)

    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(".md"):
            self.sync_engine.sync_file(event.src_path)

    def on_deleted(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(".md"):
            self.sync_engine.mark_deleted(event.src_path)


def start_watcher(path: str, sync_engine) -> Observer:
    observer = Observer()
    handler = VaultWatcher(sync_engine)
    observer.schedule(handler, path, recursive=True)
    observer.start()
    return observer
