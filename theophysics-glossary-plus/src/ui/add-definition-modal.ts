import { App, Modal, Notice, Setting } from 'obsidian';
import { TermDefinition } from '../types';

export class AddDefinitionModal extends Modal {
  private term = '';
  private summary = '';
  private aliases = '';
  private internalPath = '';
  private storyPath = '';
  private externalLinks = '';

  constructor(app: App, private onSave: (definition: TermDefinition) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Add Glossary Definition' });

    new Setting(contentEl)
      .setName('Term')
      .addText((text) =>
        text.setPlaceholder('Logos').onChange((value) => {
          this.term = value.trim();
        }),
      );

    new Setting(contentEl)
      .setName('Summary')
      .setDesc('Short hover summary')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 3;
        textArea.onChange((value) => {
          this.summary = value.trim();
        });
      });

    new Setting(contentEl)
      .setName('Aliases')
      .setDesc('Comma-separated aliases')
      .addText((text) =>
        text.onChange((value) => {
          this.aliases = value;
        }),
      );

    new Setting(contentEl)
      .setName('Internal definition path')
      .setDesc('Path to your definition note')
      .addText((text) =>
        text.setPlaceholder('Definitions/Logos.md').onChange((value) => {
          this.internalPath = value.trim();
        }),
      );

    new Setting(contentEl)
      .setName('Story trail path')
      .setDesc('Path to the Trail/Story note')
      .addText((text) =>
        text.setPlaceholder('Trails/Logos-Trail.md').onChange((value) => {
          this.storyPath = value.trim();
        }),
      );

    new Setting(contentEl)
      .setName('External links')
      .setDesc('Comma-separated URLs for external sources')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 3;
        textArea.onChange((value) => {
          this.externalLinks = value;
        });
      });

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText('Add Definition')
        .setCta()
        .onClick(() => {
          if (!this.term) {
            new Notice('Term is required.');
            return;
          }

          const now = new Date().toISOString();
          const definition: TermDefinition = {
            id: crypto.randomUUID(),
            term: this.term,
            aliases: splitList(this.aliases),
            summary: this.summary || this.term,
            externalLinks: splitList(this.externalLinks).map((url) => ({
              id: crypto.randomUUID(),
              type: 'external',
              url,
              label: url,
              enabled: true,
            })),
            internalLink: this.internalPath
              ? {
                  id: crypto.randomUUID(),
                  type: 'internal',
                  url: this.internalPath,
                  label: 'Open definition',
                  enabled: true,
                }
              : undefined,
            storyLink: this.storyPath
              ? {
                  id: crypto.randomUUID(),
                  type: 'story',
                  url: this.storyPath,
                  label: `Story: ${this.term}`,
                  enabled: true,
                }
              : undefined,
            fullDefinitionPath: this.internalPath || undefined,
            allLinksEnabled: true,
            createdAt: now,
            updatedAt: now,
          };

          this.onSave(definition);
          this.close();
        }),
    );
  }
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
