import { App, Modal, Setting } from 'obsidian';
import { StoryScope } from '../settings';

export interface StoryOptions {
  term: string;
  scope: StoryScope;
  contextWindowWords: number;
  synonyms: string[];
}

export class StoryOptionsModal extends Modal {
  private term: string;
  private scope: StoryScope;
  private contextWindowWords: number;
  private synonyms: string[] = [];

  constructor(
    app: App,
    initialTerm: string,
    initialScope: StoryScope,
    initialContextWords: number,
    private allowSynonyms: boolean,
    private onSubmit: (options: StoryOptions) => void,
  ) {
    super(app);
    this.term = initialTerm;
    this.scope = initialScope;
    this.contextWindowWords = initialContextWords;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Create Trail Story' });

    new Setting(contentEl)
      .setName('Term')
      .addText((text) =>
        text.setValue(this.term).onChange((value) => {
          this.term = value.trim();
        }),
      );

    new Setting(contentEl)
      .setName('Scope')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('note', 'This note')
          .addOption('folder', 'This folder')
          .addOption('vault', 'Entire vault')
          .setValue(this.scope)
          .onChange((value: StoryScope) => {
            this.scope = value;
          }),
      );

    new Setting(contentEl)
      .setName('Context window (words)')
      .addSlider((slider) =>
        slider
          .setLimits(0, 200, 5)
          .setValue(this.contextWindowWords)
          .setDynamicTooltip()
          .onChange((value) => {
            this.contextWindowWords = value;
          }),
      );

    if (this.allowSynonyms) {
      new Setting(contentEl)
        .setName('Synonyms')
        .setDesc('Comma-separated synonyms to include.')
        .addText((text) =>
          text.setPlaceholder('mercy, favor').onChange((value) => {
            this.synonyms = value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
          }),
        );
    }

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText('Create story')
        .setCta()
        .onClick(() => {
          if (!this.term) {
            return;
          }
          this.onSubmit({
            term: this.term,
            scope: this.scope,
            contextWindowWords: this.contextWindowWords,
            synonyms: this.synonyms,
          });
          this.close();
        }),
    );
  }
}
