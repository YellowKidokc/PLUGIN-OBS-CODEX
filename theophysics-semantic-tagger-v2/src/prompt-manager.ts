import { App, Notice } from 'obsidian';
import { SemanticTaggerSettings } from './settings';

export interface PromptEntry {
  name: string;
  template: string;
}

export class PromptManager {
  private promptFile = '.obsidian/plugins/theophysics-semantic-tagger-v2/prompts.json';

  constructor(private app: App, private settings: SemanticTaggerSettings) {}

  async loadCustomPrompts(): Promise<Record<string, string>> {
    try {
      const content = await this.app.vault.adapter.read(this.promptFile);
      const parsed = JSON.parse(content) as Record<string, string>;
      this.settings.customPrompts = parsed;
      return parsed;
    } catch {
      return this.settings.customPrompts;
    }
  }

  async saveCustomPrompts(prompts: Record<string, string>, notify: boolean = true): Promise<void> {
    this.settings.customPrompts = prompts;
    await this.ensurePromptFolder();
    await this.app.vault.adapter.write(this.promptFile, JSON.stringify(prompts, null, 2));
    if (notify) {
      new Notice('Custom prompts saved.');
    }
  }

  getCustomPrompts(): Record<string, string> {
    return this.settings.customPrompts;
  }

  async addPrompt(name: string, template: string): Promise<void> {
    const prompts = { ...this.settings.customPrompts, [name]: template };
    await this.saveCustomPrompts(prompts);
  }

  async removePrompt(name: string): Promise<void> {
    const prompts = { ...this.settings.customPrompts };
    delete prompts[name];
    await this.saveCustomPrompts(prompts);
  }

  private async ensurePromptFolder(): Promise<void> {
    const folderPath = '.obsidian/plugins/theophysics-semantic-tagger-v2';
    try {
      // @ts-expect-error - adapter mkdir exists in Obsidian vault adapters
      await this.app.vault.adapter.mkdir(folderPath);
    } catch {
      // Folder may already exist or adapter doesn't support mkdir; ignore.
    }
  }
}
