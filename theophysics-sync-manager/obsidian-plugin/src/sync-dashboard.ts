import { ItemView, WorkspaceLeaf } from 'obsidian';
import { SyncApiClient, SyncStatus, SyncLogEntry, ConflictRecord } from './api-client';
import { ConflictResolverModal } from './conflict-resolver';

export const SYNC_DASHBOARD_VIEW = 'theophysics-sync-dashboard';

export class SyncDashboardView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private apiClient: SyncApiClient) {
    super(leaf);
  }

  getViewType(): string {
    return SYNC_DASHBOARD_VIEW;
  }

  getDisplayText(): string {
    return 'Sync Status';
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async render(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    container.createEl('h2', { text: 'PostgreSQL Sync Status' });
    const status = await this.apiClient.getStatus();
    this.renderStatus(container, status);

    container.createEl('h3', { text: 'Sync Log' });
    const log = await this.apiClient.getLog();
    this.renderLog(container, log);

    const conflicts = await this.apiClient.getConflicts();
    if (conflicts.length > 0) {
      container.createEl('h3', { text: 'Conflicts' });
      this.renderConflicts(container, conflicts);
    }
  }

  private renderStatus(container: Element, status: SyncStatus): void {
    const statusEl = container.createDiv({ cls: 'sync-status' });
    statusEl.createEl('p', { text: `Connected: ${status.connected ? 'Yes' : 'No'}` });
    statusEl.createEl('p', { text: `Last Sync: ${status.lastSync ?? 'Never'}` });
    statusEl.createEl('p', { text: `Conflicts: ${status.pendingConflicts}` });
  }

  private renderLog(container: Element, log: SyncLogEntry[]): void {
    const list = container.createEl('ul');
    log.forEach((entry) => {
      list.createEl('li', {
        text: `${entry.timestamp} - ${entry.operation} ${entry.conflict ? '(conflict)' : ''}`,
      });
    });
  }

  private renderConflicts(container: Element, conflicts: ConflictRecord[]): void {
    const list = container.createEl('ul');
    conflicts.forEach((conflict) => {
      const item = list.createEl('li');
      item.createEl('span', { text: `Conflict ${conflict.id}` });
      const button = item.createEl('button', { text: 'Resolve' });
      button.addEventListener('click', () => {
        new ConflictResolverModal(this.app, conflict, this.apiClient).open();
      });
    });
  }
}
