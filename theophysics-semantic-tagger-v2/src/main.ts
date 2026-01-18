import { App, Notice, Plugin, TFile } from 'obsidian';

interface BatchProgress {
  filesProcessed: string[];
  filesRemaining: string[];
  lastProcessedIndex: number;
  timestamp: string;
}

class BatchProcessor {
  private progressFile = '.theophysics-batch-progress.json';

  constructor(private app: App) {}

  async processFilesInChunks(files: TFile[], chunkSize: number = 10): Promise<void> {
    const filesRemaining = files.map((file) => file.path);
    const filesProcessed: string[] = [];

    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);

      for (const file of chunk) {
        try {
          await this.processFile(file);
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

  async resumeBatch(): Promise<void> {
    const progress = await this.loadProgress();
    if (!progress) {
      return;
    }

    const files = progress.filesRemaining
      .map((path) => this.app.vault.getAbstractFileByPath(path))
      .filter((file): file is TFile => file instanceof TFile);

    new Notice(`Resuming from ${progress.lastProcessedIndex} files processed.`);
    await this.processFilesInChunks(files);
  }

  private async processFile(file: TFile): Promise<void> {
    const content = await readFileRobust(this.app, file);
    if (!content.trim()) {
      return;
    }

    // Placeholder for semantic tagging logic
    console.log(`Processed ${file.path} (${content.length} chars)`);
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

  async onload(): Promise<void> {
    this.batchProcessor = new BatchProcessor(this.app);

    this.addCommand({
      id: 'semantic-tagger-v2-run',
      name: 'Run semantic tagger (streamed)',
      callback: async () => {
        const files = this.app.vault.getMarkdownFiles();
        await this.batchProcessor.processFilesInChunks(files, 10);
      },
    });

    this.addCommand({
      id: 'semantic-tagger-v2-resume',
      name: 'Resume semantic tagging',
      callback: async () => {
        await this.batchProcessor.resumeBatch();
      },
    });
  }
}
