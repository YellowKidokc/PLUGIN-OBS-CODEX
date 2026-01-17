import { App, Modal, Setting } from 'obsidian';

export interface PromptOption {
  name: string;
  template: string;
  source: 'builtin' | 'custom';
}

export class PromptSelectorModal extends Modal {
  private selectedPrompt: PromptOption | null = null;

  constructor(
    app: App,
    private prompts: PromptOption[],
    private onSelect: (prompt: PromptOption) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Select a Prompt' });

    this.selectedPrompt = this.prompts[0] ?? null;

    new Setting(contentEl)
      .setName('Prompt')
      .addDropdown((dropdown) => {
        this.prompts.forEach((prompt) => {
          dropdown.addOption(prompt.name, `${prompt.name} (${prompt.source})`);
        });
        if (this.selectedPrompt) {
          dropdown.setValue(this.selectedPrompt.name);
        }
        dropdown.onChange((value) => {
          this.selectedPrompt = this.prompts.find((prompt) => prompt.name === value) ?? null;
        });
      });

    new Setting(contentEl).addButton((button) =>
      button.setButtonText('Run').setCta().onClick(() => {
        if (this.selectedPrompt) {
          this.onSelect(this.selectedPrompt);
          this.close();
        }
      }),
    );
  }
}
