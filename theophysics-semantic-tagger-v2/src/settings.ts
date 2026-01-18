import { App, PluginSettingTab, Setting } from 'obsidian';
import SemanticTaggerV2 from './main';

export interface SemanticTaggerSettings {
  aiProvider: 'openai' | 'anthropic' | 'ollama';
  apiKey: string;
  model: string;
  ollamaUrl: string;
  outputFormat: 'frontmatter' | 'append' | 'separate';
  customPrompts: Record<string, string>;
}

export const DEFAULT_SETTINGS: SemanticTaggerSettings = {
  aiProvider: 'ollama',
  apiKey: '',
  model: 'llama2',
  ollamaUrl: 'http://localhost:11434',
  outputFormat: 'frontmatter',
  customPrompts: {},
};

export class SemanticTaggerSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: SemanticTaggerV2) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Semantic Tagger V2 Settings' });

    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Choose your AI provider.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('ollama', 'Ollama (Local)')
          .addOption('openai', 'OpenAI')
          .addOption('anthropic', 'Anthropic')
          .setValue(this.plugin.settings.aiProvider)
          .onChange(async (value: 'openai' | 'anthropic' | 'ollama') => {
            this.plugin.settings.aiProvider = value;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    if (this.plugin.settings.aiProvider === 'ollama') {
      new Setting(containerEl)
        .setName('Ollama URL')
        .setDesc('Local Ollama server URL.')
        .addText((text) =>
          text
            .setPlaceholder('http://localhost:11434')
            .setValue(this.plugin.settings.ollamaUrl)
            .onChange(async (value) => {
              this.plugin.settings.ollamaUrl = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    if (this.plugin.settings.aiProvider !== 'ollama') {
      new Setting(containerEl)
        .setName('API Key')
        .setDesc('Your API key for the selected provider.')
        .addText((text) =>
          text
            .setPlaceholder('sk-...')
            .setValue(this.plugin.settings.apiKey)
            .onChange(async (value) => {
              this.plugin.settings.apiKey = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    new Setting(containerEl)
      .setName('Model')
      .setDesc('AI model to use for prompts.')
      .addText((text) =>
        text
          .setPlaceholder('llama2, gpt-4, claude-3-opus')
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Output Format')
      .setDesc('Where to place AI-generated output.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('frontmatter', 'YAML Frontmatter (tags)')
          .addOption('append', 'Append to note')
          .addOption('separate', 'Separate file')
          .setValue(this.plugin.settings.outputFormat)
          .onChange(async (value: 'frontmatter' | 'append' | 'separate') => {
            this.plugin.settings.outputFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl('h3', { text: 'Custom Prompts' });

    Object.entries(this.plugin.settings.customPrompts).forEach(([name, template]) => {
      const promptContainer = containerEl.createDiv({ cls: 'semantic-tagger-prompt' });
      promptContainer.createEl('h4', { text: name });

      new Setting(promptContainer)
        .setName('Template')
        .addTextArea((textArea) => {
          textArea.inputEl.rows = 5;
          textArea.setValue(template).onChange(async (value) => {
            this.plugin.settings.customPrompts[name] = value;
            await this.plugin.saveSettings();
          });
        })
        .addButton((button) =>
          button.setButtonText('Delete').onClick(async () => {
            delete this.plugin.settings.customPrompts[name];
            await this.plugin.saveSettings();
            this.display();
          }),
        );
    });

    const newPromptContainer = containerEl.createDiv({ cls: 'semantic-tagger-prompt-new' });
    let newName = '';
    let newTemplate = '';

    new Setting(newPromptContainer)
      .setName('New Prompt Name')
      .addText((text) =>
        text.setPlaceholder('prompt-name').onChange((value) => {
          newName = value.trim();
        }),
      );

    new Setting(newPromptContainer)
      .setName('New Prompt Template')
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 5;
        textArea.onChange((value) => {
          newTemplate = value;
        });
      });

    new Setting(newPromptContainer).addButton((button) =>
      button.setButtonText('Add Prompt').setCta().onClick(async () => {
        if (!newName || !newTemplate) {
          return;
        }
        this.plugin.settings.customPrompts[newName] = newTemplate;
        await this.plugin.saveSettings();
        this.display();
      }),
    );
  }
}
