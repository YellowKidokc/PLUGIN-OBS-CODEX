import { App, TFile } from 'obsidian';
import { parseTrailMentions, TrailMention } from './link-parser';

export class TrailManager {
  trails: Map<string, TrailMention[]> = new Map();

  constructor(private app: App) {}

  async scanVault(): Promise<void> {
    this.trails.clear();
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const mentions = parseTrailMentions(content, file);

      for (const mention of mentions) {
        if (!this.trails.has(mention.trail)) {
          this.trails.set(mention.trail, []);
        }
        this.trails.get(mention.trail)?.push(mention);
      }
    }

    for (const mentions of this.trails.values()) {
      mentions.sort((a, b) => a.sequence - b.sequence);
    }
  }

  getTrailNames(): string[] {
    return Array.from(this.trails.keys()).sort();
  }

  getTrailMentions(trailName: string): TrailMention[] {
    return this.trails.get(trailName) ?? [];
  }

  async addTrailMention(file: TFile, trail: string, sequence: number, concept: string): Promise<void> {
    const content = await this.app.vault.read(file);
    const mention = `[[${concept}]]^${trail}-${sequence}`;
    await this.app.vault.modify(file, `${content}\n${mention}`);
  }
}
