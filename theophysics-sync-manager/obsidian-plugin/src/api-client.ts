export interface SyncStatus {
  connected: boolean;
  lastSync?: string;
  pendingConflicts: number;
}

export interface SyncLogEntry {
  id: number;
  operation: string;
  timestamp: string;
  conflict: boolean;
}

export interface ConflictRecord {
  id: number;
  note_uuid: string;
  vault_content: string;
  db_content: string;
}

export class SyncApiClient {
  constructor(private baseUrl: string) {}

  async getStatus(): Promise<SyncStatus> {
    const response = await fetch(`${this.baseUrl}/sync/status`);
    return response.json();
  }

  async getLog(): Promise<SyncLogEntry[]> {
    const response = await fetch(`${this.baseUrl}/sync/log`);
    return response.json();
  }

  async getConflicts(): Promise<ConflictRecord[]> {
    const response = await fetch(`${this.baseUrl}/conflicts`);
    return response.json();
  }

  async triggerSync(): Promise<void> {
    await fetch(`${this.baseUrl}/sync/trigger`, { method: 'POST' });
  }

  async resolveConflict(conflictId: number, choice: 'vault' | 'db' | 'merge'): Promise<void> {
    await fetch(`${this.baseUrl}/conflicts/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conflict_id: conflictId, choice }),
    });
  }
}
