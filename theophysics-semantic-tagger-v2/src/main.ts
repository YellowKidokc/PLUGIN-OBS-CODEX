import { App, Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { AIClient } from './ai-client';
import { BUILTIN_PROMPTS, fillPromptTemplate } from './prompts';
import { PromptManager } from './prompt-manager';
import { SemanticTaggerSettings, SemanticTaggerSettingsTab, DEFAULT_SETTINGS } from './settings';
import { PromptSelectorModal, PromptOption } from './ui/prompt-selector-modal';

interface BatchProgress {
  filesProcessed: string[];
  filesRemaining: string[];
  lastProcessedIndex: number;
  timestamp: string;
}

class BatchProcessor {
  private progressFile = '.theophysics-batch-progress.json';

  constructor(
    private app: App,
    private aiClient: AIClient,
    private resultHandler: (file: TFile, result: string) => Promise<void>,
  ) {}

  async processFilesInChunks(
    files: TFile[],
    promptTemplate: string,
    chunkSize: number = 10,
  ): Promise<void> {
    const filesRemaining = files.map((file) => file.path);
    const filesProcessed: string[] = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);

      for (const file of chunk) {
        try {
          await this.processFile(file, promptTemplate);
          filesProcessed.push(file.path);
          filesRemaining.shift();
          await this.saveProgress(filesProcessed, filesRemaining);
        } catch (error) {
          console.error(`Error processing ${file.path}:`, error);
          await this.logError(file.path, error as Error);
        }
      }

      new Notice(`Processed ${Math.min(i + chunk.length, files.length)} of ${files.length} files.`);
      await this.sleep(100);
    }
  }

  async resumeBatch(promptTemplate: string): Promise<void> {
    const progress = await this.loadProgress();
    if (!progress) {
      return;
    }

    const files = progress.filesRemaining
      .map((path) => this.app.vault.getAbstractFileByPath(path))
      .filter((file): file is TFile => file instanceof TFile);

    new Notice(`Resuming from ${progress.lastProcessedIndex} files processed.`);
    await this.processFilesInChunks(files, promptTemplate);
  }

  private async processFile(file: TFile, promptTemplate: string): Promise<void> {
    const content = await readFileRobust(this.app, file);
    if (!content.trim()) {
      return;
    }

    const prompt = fillPromptTemplate(promptTemplate, {
      title: file.basename,
      content,
      folder: file.parent?.path ?? '',
    });

    const result = await this.aiClient.runPrompt(prompt);
    await this.resultHandler(file, result);
  }

  private async saveProgress(filesProcessed: string[], filesRemaining: string[]): Promise<void> {
    const progress: BatchProgress = {
      filesProcessed,
      filesRemaining,
      lastProcessedIndex: filesProcessed.length,
      timestamp: new Date().toISOString(),
    };

    await this.app.vault.adapter.write(this.progressFile, JSON.stringify(progress, null, 2));
  }

  private async loadProgress(): Promise<BatchProgress | null> {
    try {
      const content = await this.app.vault.adapter.read(this.progressFile);
      return JSON.parse(content) as BatchProgress;
    } catch {
      return null;
    }
  }

  private async logError(filePath: string, error: Error): Promise<void> {
    await this.app.vault.adapter.append(
      '.theophysics-batch-errors.log',
      `${new Date().toISOString()} ${filePath}: ${error.message}\n`,
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function readFileRobust(app: App, file: TFile): Promise<string> {
  try {
    return await app.vault.read(file);
  } catch (error) {
    const buffer = await app.vault.adapter.readBinary(file.path);
    const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    if (utf8 && utf8.includes(' ')) {
      return stripBom(utf8);
    }

    const win1252 = new TextDecoder('windows-1252', { fatal: false }).decode(buffer);
    return stripBom(win1252);
  }
}

function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, '');
}

export default class SemanticTaggerV2 extends Plugin {
  private batchProcessor: BatchProcessor;
  settings: SemanticTaggerSettings;
  private aiClient: AIClient;
  private promptManager: PromptManager;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.aiClient = new AIClient(this.settings);
    this.promptManager = new PromptManager(this.app, this.settings);
    await this.promptManager.loadCustomPrompts();
    this.batchProcessor = new BatchProcessor(this.app, this.aiClient, this.applyResult.bind(this));

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
        await this.batchProcessor.resumeBatch(BUILTIN_PROMPTS['generate-tags']);
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
    const content = await this.app.vault.read(file);
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
    await this.batchProcessor.processFilesInChunks(files, promptTemplate, 10);
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
    if (this.promptManager) {
      await this.promptManager.saveCustomPrompts(this.settings.customPrompts, false);
    }
  }
}
