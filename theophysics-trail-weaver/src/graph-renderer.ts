import { App } from 'obsidian';
import { TrailMention } from './link-parser';

export class GraphRenderer {
  constructor(private app: App) {}

  renderTrail(trailName: string, mentions: TrailMention[]): void {
    console.log(`Rendering trail ${trailName} with ${mentions.length} mentions.`);
  }
}
