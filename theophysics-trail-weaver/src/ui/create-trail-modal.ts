import { App, Modal, Notice } from 'obsidian';

export class CreateTrailModal extends Modal {
  private trailName = '';

  constructor(app: App, private onCreate: (trailName: string) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Create New Trail' });

    const input = contentEl.createEl('input', { type: 'text' });
    input.addEventListener('input', () => {
      this.trailName = input.value.trim();
    });

    const button = contentEl.createEl('button', { text: 'Create' });
    button.addEventListener('click', () => {
      if (!this.trailName) {
        new Notice('Trail name is required.');
        return;
      }
      this.onCreate(this.trailName);
      this.close();
    });
  }
}
