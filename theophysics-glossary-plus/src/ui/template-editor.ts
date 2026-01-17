import { App, Modal, Notice, Setting } from 'obsidian';
import { GlossaryPlusSettings } from '../settings';

export class TemplateEditorModal extends Modal {
  private name = '';
  private template = '';

  constructor(app: App, private settings: GlossaryPlusSettings) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Add Template' });

    new Setting(contentEl)
      .setName('Template name')
      .addText((text) =>
        text.onChange((value) => {
          this.name = value;
        }),
      );

    new Setting(contentEl)
      .setName('Template')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 8;
        textArea.onChange((value) => {
          this.template = value;
        });
      });

    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Save').setCta().onClick(() => {
        if (!this.name.trim()) {
          new Notice('Template name is required.');
          return;
        }
        this.settings.customTemplates.push({ name: this.name, template: this.template });
        new Notice('Template added.');
        this.close();
      }),
    );
  }
}
