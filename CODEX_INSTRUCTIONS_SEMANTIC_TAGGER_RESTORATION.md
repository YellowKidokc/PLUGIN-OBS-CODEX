# CODEX: Restore Full Features to Semantic Tagger V2

## 🎯 Objective
Restore all semantic AI features from the original plugin, including built-in prompts, custom prompts, folder processing, and AI integration.

---

## 📁 Files to Modify

**Base Directory:** `D:\Synology\PLUGIN-OBS-CODEX\theophysics-semantic-tagger-v2\`

1. `src/main.ts` - Add AI integration and prompt system
2. `src/settings.ts` - NEW FILE - Settings panel
3. `src/ai-client.ts` - NEW FILE - AI provider integration
4. `src/prompt-manager.ts` - NEW FILE - Custom prompt CRUD
5. `src/ui/prompt-selector-modal.ts` - NEW FILE - Prompt selection UI
6. `manifest.json` - Update description

---

## 🔧 Implementation Steps

### STEP 1: Create Settings Interface

**File:** `src/settings.ts`

```typescript
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

    // AI Provider
    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Choose your AI provider')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('ollama', 'Ollama (Local)')
          .addOption('openai', 'OpenAI')
          .addOption('anthropic', 'Anthropic')
          .setValue(this.plugin.settings.aiProvider)
          .onChange(async (value: any) => {
            this.plugin.settings.aiProvider = value;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    // Ollama URL (if ollama selected)
    if (this.plugin.settings.aiProvider === 'ollama') {
      new Setting(containerEl)
        .setName('Ollama URL')
        .setDesc('Local Ollama server URL')
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

    // API Key (if OpenAI/Anthropic)
    if (this.plugin.settings.aiProvider !== 'ollama') {
      new Setting(containerEl)
        .setName('API Key')
        .setDesc('Your API key')
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

    // Model
    new Setting(containerEl)
      .setName('Model')
      .setDesc('AI model to use')
      .addText((text) =>
        text
          .setPlaceholder('llama2, gpt-4, claude-3-opus')
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value;
            await this.plugin.saveSettings();
          }),
      );

    // Output Format
    new Setting(containerEl)
      .setName('Output Format')
      .setDesc('Where to put AI-generated content')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('frontmatter', 'YAML Frontmatter (tags)')
          .addOption('append', 'Append to note')
          .addOption('separate', 'Separate file')
          .setValue(this.plugin.settings.outputFormat)
          .onChange(async (value: any) => {
            this.plugin.settings.outputFormat = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
```

---

### STEP 2: Built-in Prompts

**File:** `src/prompts.ts` (NEW FILE)

```typescript
export const BUILTIN_PROMPTS: Record<string, string> = {
  'extract-concepts': `Analyze this note and extract 3-5 key concepts or themes. 
Return only a comma-separated list of concepts (e.g., "grace, redemption, coherence").

Note content:
{{content}}`,

  'generate-tags': `Generate 5-10 semantic tags for this note. Focus on:
- Main topics
- Disciplines (theology, physics, psychology)
- Key figures or concepts mentioned
- Methodologies used

Return only comma-separated tags.

Note: {{title}}
Content: {{content}}`,

  'axiom-refs': `Identify any references to Theophysics axioms in this note.
Axioms use format like P0.1, O1.2, D2.1, C3.1, etc.

Extract axiom IDs mentioned and briefly explain how they're used.

Content:
{{content}}`,

  'summarize': `Provide a concise 1-2 sentence summary of the main argument or purpose of this note.

Title: {{title}}
Content: {{content}}`,

  'math-extract': `Extract all mathematical formulas, equations, and formal expressions from this note.
List them clearly, one per line.

Content:
{{content}}`,

  'theological-links': `Identify any theological concepts, biblical references, or spiritual themes in this note.
List them with brief explanations.

Content:
{{content}}`,
};

export function fillPromptTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
```

---

### STEP 3: AI Client

**File:** `src/ai-client.ts` (NEW FILE)

```typescript
import { SemanticTaggerSettings } from './settings';
import { Notice } from 'obsidian';

export class AIClient {
  constructor(private settings: SemanticTaggerSettings) {}

  async runPrompt(prompt: string): Promise<string> {
    switch (this.settings.aiProvider) {
      case 'ollama':
        return this.runOllama(prompt);
      case 'openai':
        return this.runOpenAI(prompt);
      case 'anthropic':
        return this.runAnthropic(prompt);
      default:
        throw new Error(`Unknown AI provider: ${this.settings.aiProvider}`);
    }
  }

  private async runOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.settings.model,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      new Notice(`Ollama connection failed. Is it running at ${this.settings.ollamaUrl}?`);
      throw error;
    }
  }

  private async runOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async runAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  }
}
```

---

### STEP 4: Update Main Plugin

**File:** `src/main.ts`

**ADD at top:**
```typescript
import { SemanticTaggerSettings, SemanticTaggerSettingsTab, DEFAULT_SETTINGS } from './settings';
import { AIClient } from './ai-client';
import { BUILTIN_PROMPTS, fillPromptTemplate } from './prompts';
import { Menu } from 'obsidian';
```

**ADD to class:**
```typescript
export default class SemanticTaggerV2 extends Plugin {
  private batchProcessor: BatchProcessor;
  settings: SemanticTaggerSettings;
  private aiClient: AIClient;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.aiClient = new AIClient(this.settings);
    this.batchProcessor = new BatchProcessor(this.app, this.aiClient, this.settings);

    // Add settings tab
    this.addSettingTab(new SemanticTaggerSettingsTab(this.app, this));

    // Command: Run built-in prompts
    for (const [key, promptTemplate] of Object.entries(BUILTIN_PROMPTS)) {
      this.addCommand({
        id: `run-prompt-${key}`,
        name: `Run Prompt: ${key}`,
        callback: async () => {
          const activeFile = this.app.workspace.getActiveFile();
          if (!activeFile) {
            new Notice('No active file');
            return;
          }
          await this.runPromptOnFile(activeFile, promptTemplate);
        },
      });
    }

    // Context menu: Right-click folder
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, folder: TAbstractFile) => {
        if (folder instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Semantic Tag Folder...')
              .setIcon('tag')
              .onClick(async () => {
                await this.tagFolder(folder);
              });
          });
        }
      }),
    );

    // Existing commands...
  }

  async runPromptOnFile(file: TFile, promptTemplate: string): Promise<void> {
    const content = await this.app.vault.read(file);
    const filled = fillPromptTemplate(promptTemplate, {
      title: file.basename,
      content: content,
      folder: file.parent?.path || '',
    });

    new Notice('Running AI prompt...');
    const result = await this.aiClient.runPrompt(filled);

    // Insert result based on output format
    if (this.settings.outputFormat === 'frontmatter') {
      await this.insertTagsInFrontmatter(file, result);
    } else if (this.settings.outputFormat === 'append') {
      await this.app.vault.append(file, `\n\n## AI Insights\n${result}`);
    }

    new Notice('✅ Done!');
  }

  async tagFolder(folder: TFolder): Promise<void> {
    // Show prompt selector modal
    const files = folder.children.filter((f): f is TFile => f instanceof TFile);
    new Notice(`Tagging ${files.length} files in ${folder.name}...`);
    
    for (const file of files) {
      await this.runPromptOnFile(file, BUILTIN_PROMPTS['generate-tags']);
    }
  }

  async insertTagsInFrontmatter(file: TFile, tags: string): Promise<void> {
    const content = await this.app.vault.read(file);
    const tagArray = tags.split(',').map((t) => t.trim());
    
    // Parse frontmatter and add tags (simplified)
    const newContent = this.addTagsToContent(content, tagArray);
    await this.app.vault.modify(file, newContent);
  }

  addTagsToContent(content: string, tags: string[]): string {
    // Simple implementation: add tags to frontmatter
    // Full implementation would parse YAML properly
    if (content.startsWith('---')) {
      const endIndex = content.indexOf('---', 3);
      const frontmatter = content.slice(0, endIndex);
      const body = content.slice(endIndex);
      
      return `${frontmatter}\ntags: [${tags.join(', ')}]\n${body}`;
    } else {
      return `---\ntags: [${tags.join(', ')}]\n---\n\n${content}`;
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.aiClient = new AIClient(this.settings);
  }
}
```

---

## 📦 Rebuild Instructions

**After making changes:**

```bash
cd "D:\Synology\PLUGIN-OBS-CODEX\theophysics-semantic-tagger-v2"
npm run build
```

**Then copy to vault:**
```bash
copy main.js "O:\Theophysics_Master\TMSUB\.obsidian\plugins\theophysics-semantic-tagger-v2\"
```

---

## ✅ Testing Checklist

1. [ ] Settings panel shows AI provider options
2. [ ] Command palette shows 6 built-in prompts
3. [ ] Right-click folder shows "Semantic Tag Folder..."
4. [ ] Ollama connection works (test with local LLM)
5. [ ] Tags appear in frontmatter after running prompt
6. [ ] Batch processing completes without errors

---

**This restores all major features from the original semantic AI plugin!**
