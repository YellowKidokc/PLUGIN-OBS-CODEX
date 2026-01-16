import { App, Modal, Notice, TFile } from 'obsidian';
import { SequenceManager } from '../utils/sequence-manager';
import { TrailManager } from '../trail-manager';

export class TagMentionModal extends Modal {
  private trail = '';
  private concept = '';
  private manualSequence = '';

  constructor(
    app: App,
    private file: TFile,
    private manager: TrailManager,
    private sequenceManager: SequenceManager,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Tag Trail Mention' });

    const trailInput = contentEl.createEl('input', { type: 'text', placeholder: 'trail-name' });
    trailInput.addEventListener('input', () => {
      this.trail = trailInput.value.trim();
    });

    const conceptInput = contentEl.createEl('input', { type: 'text', placeholder: 'Concept' });
    conceptInput.addEventListener('input', () => {
      this.concept = conceptInput.value.trim();
    });

    const sequenceInput = contentEl.createEl('input', { type: 'number', placeholder: 'Sequence (optional)' });
    sequenceInput.addEventListener('input', () => {
      this.manualSequence = sequenceInput.value.trim();
    });

    const button = contentEl.createEl('button', { text: 'Tag mention' });
    button.addEventListener('click', async () => {
      if (!this.trail || !this.concept) {
        new Notice('Trail name and concept are required.');
        return;
      }

      const sequence = this.manualSequence ? parseInt(this.manualSequence, 10) : this.sequenceManager.next(this.trail);
      await this.manager.addTrailMention(this.file, this.trail, sequence, this.concept);
      this.close();
    });
  }
}
