import { App, Notice, TFile } from 'obsidian';
import { readFileRobust, sanitizeContent } from './encoding';

interface BatchProgress {
  processedFiles: string[];
  remainingFiles: string[];
  lastIndex: number;
  timestamp: number;
}

export interface ProcessResult {
  file: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

export class BatchProcessor {
  private chunkSize: number;
  private progressKey: string;
  private onProgress?: (current: number, total: number, file: string) => void;
  private onError?: (file: string, error: Error) => void;

  constructor(
    private app: App,
    options: {
      chunkSize?: number;
      progressKey?: string;
      onProgress?: (current: number, total: number, file: string) => void;
      onError?: (file: string, error: Error) => void;
    } = {},
  ) {
    this.chunkSize = options.chunkSize || 10;
    this.progressKey = options.progressKey || '.batch-progress.json';
    this.onProgress = options.onProgress;
    this.onError = options.onError;
  }

  async processFiles(
    files: TFile[],
    processor: (file: TFile, content: string) => Promise<unknown>,
  ): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];
    const totalFiles = files.length;
    const savedProgress = await this.loadProgress();
    let startIndex = 0;

    if (savedProgress && savedProgress.remainingFiles.length > 0) {
      const resume = await this.confirmResume(savedProgress);
      if (resume) {
        startIndex = savedProgress.lastIndex;
        new Notice(`Resuming from file ${startIndex + 1} of ${totalFiles}`);
      }
    }

    for (let i = startIndex; i < totalFiles; i += this.chunkSize) {
      const chunk = files.slice(i, Math.min(i + this.chunkSize, totalFiles));
      for (const file of chunk) {
        try {
          const rawContent = await readFileRobust(this.app, file);
          const content = sanitizeContent(rawContent);
          const data = await processor(file, content);
          results.push({ file: file.path, success: true, data });
          if (this.onProgress) {
            this.onProgress(results.length, totalFiles, file.path);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          results.push({ file: file.path, success: false, error: err.message });
          if (this.onError) {
            this.onError(file.path, err);
          }
          console.error(`Error processing ${file.path}:`, err);
        }
      }

      await this.saveProgress({
        processedFiles: results.filter((result) => result.success).map((result) => result.file),
        remainingFiles: files.slice(i + this.chunkSize).map((file) => file.path),
        lastIndex: i + this.chunkSize,
        timestamp: Date.now(),
      });

      await this.sleep(50);
    }

    await this.clearProgress();
    return results;
  }

  private async saveProgress(progress: BatchProgress): Promise<void> {
    try {
      await this.app.vault.adapter.write(this.progressKey, JSON.stringify(progress, null, 2));
    } catch (error) {
      console.warn('Failed to save batch progress:', error);
    }
  }

  private async loadProgress(): Promise<BatchProgress | null> {
    try {
      if (await this.app.vault.adapter.exists(this.progressKey)) {
        const content = await this.app.vault.adapter.read(this.progressKey);
        return JSON.parse(content) as BatchProgress;
      }
    } catch (error) {
      console.warn('Failed to load batch progress:', error);
    }
    return null;
  }

  private async clearProgress(): Promise<void> {
    try {
      if (await this.app.vault.adapter.exists(this.progressKey)) {
        await this.app.vault.adapter.remove(this.progressKey);
      }
    } catch (error) {
      console.warn('Failed to clear batch progress:', error);
    }
  }

  private async confirmResume(progress: BatchProgress): Promise<boolean> {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return progress.timestamp > hourAgo;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
