import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { TrailManager } from './trail-manager';
import { TrailGenerator } from './trail-generator';
import { GraphRenderer } from './graph-renderer';
import { SequenceManager } from './utils/sequence-manager';
import { CreateTrailModal } from './ui/create-trail-modal';
import { TagMentionModal } from './ui/tag-mention-modal';
import { TrailDashboardView, TRAIL_DASHBOARD_VIEW } from './ui/trail-dashboard';

export default class TrailWeaverPlugin extends Plugin {
  private trailManager: TrailManager;
  private trailGenerator: TrailGenerator;
  private graphRenderer: GraphRenderer;
  private sequenceManager = new SequenceManager();

  async onload(): Promise<void> {
    this.trailManager = new TrailManager(this.app);
    this.trailGenerator = new TrailGenerator(this.app);
    this.graphRenderer = new GraphRenderer(this.app);

    this.registerView(TRAIL_DASHBOARD_VIEW, (leaf) =>
      new TrailDashboardView(leaf, this.trailManager, this.trailGenerator),
    );

    this.addCommand({
      id: 'trail-weaver-create-trail',
      name: 'Create new trail',
      callback: () =>
        new CreateTrailModal(this.app, (trailName) => {
          new Notice(`Trail created: ${trailName}`);
        }).open(),
    });

    this.addCommand({
      id: 'trail-weaver-tag-mention',
      name: 'Tag trail mention',
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice('Open a markdown file first.');
          return;
        }
        new TagMentionModal(this.app, file, this.trailManager, this.sequenceManager).open();
      },
    });

    this.addCommand({
      id: 'trail-weaver-open-dashboard',
      name: 'Open trail dashboard',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'trail-weaver-render-graph',
      name: 'Render trail graph',
      callback: async () => {
        await this.trailManager.scanVault();
        for (const [trailName, mentions] of this.trailManager.trails.entries()) {
          this.graphRenderer.renderTrail(trailName, mentions);
        }
      },
    });
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;

    workspace.iterateAllLeaves((existingLeaf) => {
      if (existingLeaf.view.getViewType() === TRAIL_DASHBOARD_VIEW) {
        leaf = existingLeaf;
      }
    });

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: TRAIL_DASHBOARD_VIEW, active: true });
    }

    workspace.revealLeaf(leaf!);
  }
}
