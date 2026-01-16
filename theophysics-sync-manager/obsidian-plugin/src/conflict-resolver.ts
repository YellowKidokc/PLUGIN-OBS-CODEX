import { App, Modal, Notice } from 'obsidian';
import { ConflictRecord, SyncApiClient } from './api-client';

export class ConflictResolverModal extends Modal {
  constructor(app: App, private conflict: ConflictRecord, private apiClient: SyncApiClient) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Sync Conflict' });

    const diffView = contentEl.createDiv({ cls: 'conflict-diff' });
    const vaultPanel = diffView.createDiv({ cls: 'diff-panel' });
    vaultPanel.createEl('h3', { text: 'Vault Version' });
    vaultPanel.createEl('pre', { text: this.conflict.vault_content });

    const dbPanel = diffView.createDiv({ cls: 'diff-panel' });
    dbPanel.createEl('h3', { text: 'Database Version' });
    dbPanel.createEl('pre', { text: this.conflict.db_content });

    const buttonBar = contentEl.createDiv({ cls: 'button-bar' });
    const options: Array<['vault' | 'db' | 'merge', string]> = [
      ['vault', 'Use Vault Version'],
      ['db', 'Use Database Version'],
      ['merge', 'Merge'],
    ];

    options.forEach(([choice, label]) => {
      const button = buttonBar.createEl('button', { text: label });
      button.addEventListener('click', async () => {
        await this.apiClient.resolveConflict(this.conflict.id, choice);
        new Notice('Conflict resolved.');
        this.close();
      });
    });
  }
}
