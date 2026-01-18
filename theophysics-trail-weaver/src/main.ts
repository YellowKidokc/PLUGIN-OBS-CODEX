import { Editor, MarkdownView, Menu, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { TrailManager } from './trail-manager';
import { TrailGenerator } from './trail-generator';
import { GraphRenderer } from './graph-renderer';
import { SequenceManager } from './utils/sequence-manager';
import { CreateTrailModal } from './ui/create-trail-modal';
import { TagMentionModal } from './ui/tag-mention-modal';
import { TrailDashboardView, TRAIL_DASHBOARD_VIEW } from './ui/trail-dashboard';
import { StoryGenerator, StoryIndex } from './story-generator';
import {
  DEFAULT_SETTINGS,
  TrailWeaverSettings,
  TrailWeaverSettingsTab,
} from './settings';
import { StoryOptionsModal } from './ui/story-options-modal';
import { readFileRobust, sanitizeContent } from './utils/encoding';

export default class TrailWeaverPlugin extends Plugin {
  private trailManager: TrailManager;
  private trailGenerator: TrailGenerator;
  private graphRenderer: GraphRenderer;
  private sequenceManager = new SequenceManager();
  private storyGenerator: StoryGenerator;
  settings: TrailWeaverSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.trailManager = new TrailManager(this.app);
    this.trailGenerator = new TrailGenerator(this.app);
    this.graphRenderer = new GraphRenderer(this.app);
    this.storyGenerator = new StoryGenerator(this.app);

    this.addSettingTab(new TrailWeaverSettingsTab(this.app, this));

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

    this.addCommand({
      id: 'trail-weaver-create-story',
      name: 'Create story from selection',
      callback: async () => {
        const selection = this.getEditorSelection();
        if (!selection) {
          new Notice('Select a term first.');
          return;
        }
        await this.openStoryOptions(selection);
      },
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
        const selection = editor.getSelection().trim();
        if (!selection) {
          return;
        }
        menu.addItem((item) =>
          item
            .setTitle('Trail Weaver: Create story')
            .setIcon('map')
            .onClick(async () => {
              await this.openStoryOptions(selection);
            }),
        );
      }),
    );
  }

  private getEditorSelection(): string {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if (!editor) {
      return '';
    }
    return editor.getSelection().trim();
  }

  private async openStoryOptions(term: string): Promise<void> {
    new StoryOptionsModal(
      this.app,
      term,
      this.settings.defaultScope,
      this.settings.contextWindowWords,
      this.settings.includeSynonyms,
      async (options) => {
        await this.createStory(options.term, options.scope, options.contextWindowWords, options.synonyms);
      },
    ).open();
  }

  private async createStory(
    term: string,
    scope: typeof this.settings.defaultScope,
    contextWindowWords: number,
    synonyms: string[],
  ): Promise<void> {
    const scenes = await this.storyGenerator.collectScenes(
      term,
      scope,
      contextWindowWords,
      this.settings.orderBy,
      synonyms,
    );

    const storyMarkdown = this.storyGenerator.buildStoryMarkdown(term, scope, scenes);
    const storyFolder = this.settings.storyFolder;
    await this.ensureFolder(storyFolder);

    const filePath = `${storyFolder}/${term}.md`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);

    if (existing instanceof TFile) {
      const rawContent = await readFileRobust(this.app, existing);
      const existingContent = sanitizeContent(rawContent);
      const merged = this.storyGenerator.mergeStoryContent(existingContent, storyMarkdown);
      await this.app.vault.modify(existing, merged);
    } else {
      await this.app.vault.create(filePath, storyMarkdown);
    }

    const index = this.storyGenerator.buildStoryIndex(term, scope, scenes, synonyms);
    await this.writeStoryIndex(storyFolder, index);
    new Notice(`Story updated: ${filePath}`);
  }

  private async writeStoryIndex(folder: string, index: StoryIndex): Promise<void> {
    const indexPath = `${folder}/story-index.json`;
    const existing = this.app.vault.getAbstractFileByPath(indexPath);
    let payload: Record<string, unknown> = { terms: {} };

    if (existing instanceof TFile) {
      const rawContent = await readFileRobust(this.app, existing);
      const existingContent = sanitizeContent(rawContent);
      try {
        payload = JSON.parse(existingContent) as Record<string, unknown>;
      } catch {
        payload = { terms: {} };
      }
    }

    const terms = (payload.terms as Record<string, unknown>) ?? {};
    terms[index.term] = index;
    payload.terms = terms;

    const content = JSON.stringify(payload, null, 2);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(indexPath, content);
    }
  }

  private async ensureFolder(path: string): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (!existing) {
      await this.app.vault.createFolder(path);
    }
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

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
