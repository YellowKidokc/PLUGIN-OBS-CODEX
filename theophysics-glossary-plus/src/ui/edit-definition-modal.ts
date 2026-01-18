import { App, Modal, Notice, TFile } from 'obsidian';
import { readFileRobust, sanitizeContent } from '../utils/encoding';

export class EditDefinitionModal extends Modal {
  constructor(app: App, private file: TFile) {
    super(app);
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Edit Definition' });

    const rawContent = await readFileRobust(this.app, this.file);
    const content = sanitizeContent(rawContent);
    const editor = contentEl.createEl('textarea');
    editor.value = content;
    editor.rows = 12;

    const saveButton = contentEl.createEl('button', { text: 'Save' });
    saveButton.addEventListener('click', async () => {
      await this.app.vault.modify(this.file, editor.value);
      new Notice('Definition updated.');
      this.close();
    });
  }
}
