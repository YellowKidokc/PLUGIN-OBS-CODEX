import { App, Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { AIClient } from './ai-client';
import { BUILTIN_PROMPTS, fillPromptTemplate } from './prompts';
import { PromptManager } from './prompt-manager';
import { SemanticTaggerSettings, SemanticTaggerSettingsTab, DEFAULT_SETTINGS } from './settings';
import { PromptSelectorModal, PromptOption } from './ui/prompt-selector-modal';
import { BatchProcessor } from './utils/batch-processor';
import { readFileRobust, sanitizeContent } from './utils/encoding';

export default class SemanticTaggerV2 extends Plugin {
  settings: SemanticTaggerSettings;
  private aiClient: AIClient;
  private promptManager: PromptManager;
  private batchProcessor: BatchProcessor;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.aiClient = new AIClient(this.settings);
    this.promptManager = new PromptManager(this.app, this.settings);
    await this.promptManager.loadCustomPrompts();
    this.batchProcessor = new BatchProcessor(this.app, {
      chunkSize: this.settings.chunkSize,
      progressKey: '.semantic-tagger-progress.json',
      onProgress: (current, total, file) => {
        new Notice(`Processing ${current}/${total}: ${file}`);
      },
      onError: (file, error) => {
        new Notice(`Error in ${file}: ${error.message}`);
      },
    });

    this.addSettingTab(new SemanticTaggerSettingsTab(this.app, this));

    Object.entries(BUILTIN_PROMPTS).forEach(([key, promptTemplate]) => {
      this.addCommand({
        id: `semantic-tagger-run-${key}`,
        name: `Run Prompt: ${key}`,
        callback: async () => {
          const activeFile = this.app.workspace.getActiveFile();
          if (!activeFile) {
            new Notice('No active file.');
            return;
          }
          await this.runPromptOnFile(activeFile, promptTemplate);
        },
      });
    });

    this.addCommand({
      id: 'semantic-tagger-run-custom',
      name: 'Run Custom Prompt',
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice('No active file.');
          return;
        }
        await this.openPromptSelector(async (prompt) => {
          await this.runPromptOnFile(activeFile, prompt.template);
        });
      },
    });

    this.addCommand({
      id: 'semantic-tagger-resume',
      name: 'Resume semantic tagging',
      callback: async () => {
        const files = this.app.vault.getMarkdownFiles();
        await this.batchProcessor.processFiles(files, async (file, content) => {
          await this.runPromptOnContent(file, content, BUILTIN_PROMPTS['generate-tags']);
        });
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
        if (file instanceof TFolder) {
          menu.addItem((item) =>
            item
              .setTitle('Semantic Tag Folder...')
              .setIcon('tag')
              .onClick(async () => {
                await this.openPromptSelector(async (prompt) => {
                  await this.tagFolder(file, prompt.template);
                });
              }),
          );
        }
      }),
    );
  }

  async runPromptOnFile(file: TFile, promptTemplate: string): Promise<void> {
    const rawContent = await readFileRobust(this.app, file);
    const content = sanitizeContent(rawContent);
    await this.runPromptOnContent(file, content, promptTemplate);
  }

  private async runPromptOnContent(
    file: TFile,
    content: string,
    promptTemplate: string,
  ): Promise<void> {
    const filled = fillPromptTemplate(promptTemplate, {
      title: file.basename,
      content,
      folder: file.parent?.path ?? '',
    });

    new Notice('Running AI prompt...');
    const result = await this.aiClient.runPrompt(filled);

    await this.applyResult(file, result);

    new Notice('AI prompt completed.');
  }

  async tagFolder(folder: TFolder, promptTemplate: string): Promise<void> {
    const files = folder.children.filter((file): file is TFile => file instanceof TFile);
    new Notice(`Tagging ${files.length} files in ${folder.path}...`);
    await this.batchProcessor.processFiles(files, async (file, content) => {
      await this.runPromptOnContent(file, content, promptTemplate);
    });
  }

  async insertTagsInFrontmatter(file: TFile, tags: string): Promise<void> {
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      const existing = frontmatter.tags ?? [];
      const existingArray = Array.isArray(existing) ? existing : [existing];
      const merged = new Set([...existingArray, ...tagArray]);
      frontmatter.tags = Array.from(merged);
    });
  }

  private async applyResult(file: TFile, result: string): Promise<void> {
    if (this.settings.outputFormat === 'frontmatter') {
      await this.insertTagsInFrontmatter(file, result);
    } else if (this.settings.outputFormat === 'append') {
      await this.app.vault.append(file, `\n\n## AI Insights\n${result}`);
    } else {
      await this.writeToSeparateFile(file, result);
    }
  }

  private async writeToSeparateFile(file: TFile, result: string): Promise<void> {
    const folderPath = `${file.parent?.path ?? ''}/AI`;
    const filePath = `${folderPath}/${file.basename}.ai.md`;
    await this.ensureFolder(folderPath);

    const content = `# AI Insights for ${file.basename}\n\n${result}\n`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      return;
    }

    await this.app.vault.create(filePath, content);
  }

  private async ensureFolder(path: string): Promise<void> {
    if (!path || path === '/') {
      return;
    }
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (!existing) {
      await this.app.vault.createFolder(path);
    }
  }

  private async openPromptSelector(onSelect: (prompt: PromptOption) => Promise<void>): Promise<void> {
    const prompts: PromptOption[] = [
      ...Object.entries(BUILTIN_PROMPTS).map(([name, template]) => ({
        name,
        template,
        source: 'builtin' as const,
      })),
      ...Object.entries(this.promptManager.getCustomPrompts()).map(([name, template]) => ({
        name,
        template,
        source: 'custom' as const,
      })),
    ];

    new PromptSelectorModal(this.app, prompts, (prompt) => {
      void onSelect(prompt);
    }).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.aiClient) {
      this.aiClient.updateSettings(this.settings);
    }
    if (this.batchProcessor) {
      this.batchProcessor = new BatchProcessor(this.app, {
        chunkSize: this.settings.chunkSize,
        progressKey: '.semantic-tagger-progress.json',
        onProgress: (current, total, file) => {
          new Notice(`Processing ${current}/${total}: ${file}`);
        },
        onError: (file, error) => {
          new Notice(`Error in ${file}: ${error.message}`);
        },
      });
    }
    if (this.promptManager) {
      await this.promptManager.saveCustomPrompts(this.settings.customPrompts, false);
    }
  }
}
