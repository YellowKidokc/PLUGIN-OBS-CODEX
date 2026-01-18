import { App, TFile, TFolder } from 'obsidian';
import { StoryOrder, StoryScope } from './settings';
import { readFileRobust, sanitizeContent } from './utils/encoding';

export interface StoryMention {
  filePath: string;
  line: number;
  excerpt: string;
}

export interface StoryScene {
  filePath: string;
  count: number;
  mentions: StoryMention[];
  firstLine: number;
  fileMtime: number;
}

export interface StoryIndex {
  term: string;
  scope: StoryScope;
  generatedAt: string;
  synonyms: string[];
  scenes: StoryScene[];
}

export class StoryGenerator {
  constructor(private app: App) {}

  async collectScenes(
    term: string,
    scope: StoryScope,
    contextWindowWords: number,
    orderBy: StoryOrder,
    synonyms: string[],
  ): Promise<StoryScene[]> {
    const files = await this.getFilesForScope(scope);
    const terms = [term, ...synonyms].filter(Boolean);
    const scenes: StoryScene[] = [];

    for (const file of files) {
      const rawContent = await readFileRobust(this.app, file);
      const content = sanitizeContent(rawContent);
      const mentions = this.findMentions(content, file, terms, contextWindowWords);
      if (mentions.length > 0) {
        scenes.push({
          filePath: file.path,
          count: mentions.length,
          mentions,
          firstLine: mentions[0].line,
          fileMtime: file.stat.mtime,
        });
      }
    }

    if (orderBy === 'mention-count') {
      scenes.sort((a, b) => b.count - a.count);
    } else {
      scenes.sort((a, b) => a.fileMtime - b.fileMtime);
    }

    return scenes;
  }

  buildStoryMarkdown(term: string, scope: StoryScope, scenes: StoryScene[]): string {
    const title = `Story of "${term}" — ${this.formatScope(scope)}`;
    let content = `# ${title}\n\n`;
    content += '<!-- TW-AUTO-START -->\n';
    content += '## Scenes\n\n';

    scenes.forEach((scene, index) => {
      content += `${index + 1}. [[${scene.filePath}]] — ${scene.count} mentions\n`;
      scene.mentions.forEach((mention) => {
        content += `   - line ${mention.line}: ${mention.excerpt}\n`;
      });
      content += '\n';
      content += `   _Bridge: Add narrative text between scenes here._\n\n`;
    });

    content += '<!-- TW-AUTO-END -->\n\n';
    content += '## Narrative Notes\n\n';
    content += '<!-- TW-NARRATIVE-START -->\n';
    content += '_Write your curated narrative here. This section is preserved._\n';
    content += '<!-- TW-NARRATIVE-END -->\n';

    return content;
  }

  mergeStoryContent(existing: string, generated: string): string {
    const autoStart = '<!-- TW-AUTO-START -->';
    const autoEnd = '<!-- TW-AUTO-END -->';
    const narrativeStart = '<!-- TW-NARRATIVE-START -->';
    const narrativeEnd = '<!-- TW-NARRATIVE-END -->';

    const newAuto = this.extractSection(generated, autoStart, autoEnd);
    const existingNarrative = this.extractSection(existing, narrativeStart, narrativeEnd);

    let result = generated;

    if (existingNarrative) {
      result = this.replaceSection(result, narrativeStart, narrativeEnd, existingNarrative);
    }

    if (newAuto) {
      result = this.replaceSection(result, autoStart, autoEnd, newAuto);
    }

    return result;
  }

  buildStoryIndex(term: string, scope: StoryScope, scenes: StoryScene[], synonyms: string[]): StoryIndex {
    return {
      term,
      scope,
      generatedAt: new Date().toISOString(),
      synonyms,
      scenes,
    };
  }

  private async getFilesForScope(scope: StoryScope): Promise<TFile[]> {
    const activeFile = this.app.workspace.getActiveFile();
    if (scope === 'note' && activeFile) {
      return [activeFile];
    }

    if (scope === 'folder' && activeFile?.parent instanceof TFolder) {
      return this.collectFilesInFolder(activeFile.parent);
    }

    return this.app.vault.getMarkdownFiles();
  }

  private collectFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    folder.children.forEach((child) => {
      if (child instanceof TFolder) {
        files.push(...this.collectFilesInFolder(child));
      } else if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      }
    });
    return files;
  }

  private findMentions(
    content: string,
    file: TFile,
    terms: string[],
    contextWindowWords: number,
  ): StoryMention[] {
    const mentions: StoryMention[] = [];
    const lines = content.split('\n');
    const normalizedTerms = terms.map((term) => term.toLowerCase());

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      normalizedTerms.forEach((term) => {
        const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'gi');
        if (regex.test(lineLower)) {
          mentions.push({
            filePath: file.path,
            line: index + 1,
            excerpt: this.extractContext(line, term, contextWindowWords),
          });
        }
      });
    });

    return mentions;
  }

  private extractContext(line: string, term: string, windowWords: number): string {
    if (windowWords === 0) {
      return line.trim();
    }
    const words = line.split(/\s+/);
    const termIndex = words.findIndex((word) => word.toLowerCase().includes(term.toLowerCase()));
    if (termIndex === -1) {
      return line.trim();
    }
    const start = Math.max(0, termIndex - windowWords);
    const end = Math.min(words.length, termIndex + windowWords + 1);
    return words.slice(start, end).join(' ');
  }

  private extractSection(content: string, start: string, end: string): string | null {
    const startIndex = content.indexOf(start);
    const endIndex = content.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return null;
    }
    return content.slice(startIndex + start.length, endIndex).trim();
  }

  private replaceSection(content: string, start: string, end: string, replacement: string): string {
    const startIndex = content.indexOf(start);
    const endIndex = content.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return content;
    }
    return `${content.slice(0, startIndex + start.length)}\n${replacement}\n${content.slice(endIndex)}`;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  }

  private formatScope(scope: StoryScope): string {
    if (scope === 'note') return 'Note';
    if (scope === 'folder') return 'Folder';
    return 'Vault';
  }

}
