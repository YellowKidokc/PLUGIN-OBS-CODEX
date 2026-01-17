import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TrailManager } from '../trail-manager';
import { TrailGenerator } from '../trail-generator';

export const TRAIL_DASHBOARD_VIEW = 'theophysics-trail-dashboard';

export class TrailDashboardView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private manager: TrailManager, private generator: TrailGenerator) {
    super(leaf);
  }

  getViewType(): string {
    return TRAIL_DASHBOARD_VIEW;
  }

  getDisplayText(): string {
    return 'Trail Dashboard';
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async render(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h2', { text: 'Theophysics Trail Weaver' });

    await this.manager.scanVault();
    const trailNames = this.manager.getTrailNames();

    if (trailNames.length === 0) {
      container.createEl('p', { text: 'No trails found.' });
      return;
    }

    const list = container.createEl('ul');
    trailNames.forEach((trailName) => {
      const item = list.createEl('li');
      item.createEl('span', { text: trailName });
      const button = item.createEl('button', { text: 'Generate Trail Page' });
      button.addEventListener('click', async () => {
        const mentions = this.manager.getTrailMentions(trailName);
        await this.generator.generateTrailPage(trailName, mentions);
      });
    });
  }
}
