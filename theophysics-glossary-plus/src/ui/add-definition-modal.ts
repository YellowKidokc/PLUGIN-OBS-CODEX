import { App, Modal, Notice, Setting } from 'obsidian';
import { DefinitionManager } from '../definition-manager';
import { fetchWikipediaDefinition } from '../wikipedia-api';
import { GlossaryPlusSettings } from '../settings';

export class AddDefinitionModal extends Modal {
  private term = '';
  private definition = '';
  private templateName = '';
  private externalLinksFetched = false;

  constructor(
    app: App,
    private manager: DefinitionManager,
    private settings: GlossaryPlusSettings,
    term?: string,
  ) {
    super(app);
    this.term = term ?? '';
    this.templateName = settings.defaultTemplate;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Add Definition' });

    new Setting(contentEl)
      .setName('Term')
      .addText((text) =>
        text.setValue(this.term).onChange((value) => {
          this.term = value;
        }),
      );

    new Setting(contentEl)
      .setName('Definition')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 6;
        textArea.setValue(this.definition).onChange((value) => {
          this.definition = value;
        });
      });

    new Setting(contentEl)
      .setName('Template')
      .addDropdown((dropdown) => {
        this.settings.customTemplates.forEach((template) => {
          dropdown.addOption(template.name, template.name);
        });
        dropdown.setValue(this.templateName);
        dropdown.onChange((value) => {
          this.templateName = value;
        });
      });

    if (this.settings.enableWikipediaAPI) {
      new Setting(contentEl)
        .setName('Wikipedia')
        .setDesc('Pull a summary from Wikipedia and use it as the definition.')
        .addButton((button) =>
          button.setButtonText('Pull from Wikipedia').onClick(async () => {
            if (!this.term.trim()) {
              new Notice('Enter a term first.');
              return;
            }
            try {
              const result = await fetchWikipediaDefinition(this.term, this.settings.wikipediaLanguage);
              this.definition = result.extract;
              new Notice(`Loaded Wikipedia summary for ${result.title}`);
              this.renderExternalLinks(result.url);
            } catch (error) {
              console.error(error);
              new Notice('Failed to fetch Wikipedia summary.');
            }
          }),
        );
    }

    new Setting(contentEl)
      .setName('External links')
      .setDesc('Fetch external sources for this term.')
      .addButton((button) =>
        button.setButtonText('Fetch External Links').onClick(async () => {
          if (!this.term.trim()) {
            new Notice('Enter a term first.');
            return;
          }
          await this.manager.fetchExternalLinks(this.term);
          this.externalLinksFetched = true;
          new Notice('External links fetched.');
        }),
      );

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText('Add Definition').setCta().onClick(async () => {
          if (!this.term.trim()) {
            new Notice('Term is required.');
            return;
          }

          const externalLinks = this.externalLinksFetched
            ? await this.manager.fetchExternalLinks(this.term)
            : undefined;

          await this.manager.createDefinition({
            term: this.term,
            definition: this.definition,
            source: 'internal',
            externalLinks,
            templateName: this.templateName,
          });
          this.close();
        }),
      );
  }

  private renderExternalLinks(url: string): void {
    const { contentEl } = this;
    const preview = contentEl.createDiv({ cls: 'glossary-plus-wikipedia-preview' });
    preview.createEl('strong', { text: 'Wikipedia:' });
    preview.createEl('a', { text: url, href: url });
  }
}
