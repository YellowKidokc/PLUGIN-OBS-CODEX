import { App } from 'obsidian';
import { TrailMention } from './link-parser';

export class TrailGenerator {
  constructor(private app: App) {}

  async generateTrailPage(trailName: string, mentions: TrailMention[]): Promise<void> {
    const formattedName = this.formatTrailName(trailName);
    let content = `# ${formattedName}\n\n`;
    content += `**Created:** ${new Date().toLocaleString()}\n`;
    content += `**Mentions:** ${mentions.length}\n\n`;
    content += `## Trail Map\n\n`;

    for (const mention of mentions) {
      content += `${mention.sequence}. [[${mention.file}#^${trailName}-${mention.sequence}]] - ${mention.concept}\n`;
      content += `   > ${mention.context}\n\n`;
    }

    const fileName = `Trails/${formattedName}.md`;
    const existing = this.app.vault.getAbstractFileByPath(fileName);
    if (existing) {
      await this.app.vault.modify(existing, content);
      return;
    }

    await this.app.vault.create(fileName, content);
  }

  private formatTrailName(name: string): string {
    return name
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
