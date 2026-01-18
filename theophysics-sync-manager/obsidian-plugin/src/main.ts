import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
import { SyncApiClient } from './api-client';
import { SyncDashboardView, SYNC_DASHBOARD_VIEW } from './sync-dashboard';
import { SyncManagerSettings, DEFAULT_SETTINGS, SyncManagerSettingsTab } from './settings';

export default class SyncManagerPlugin extends Plugin {
  settings: SyncManagerSettings;
  private apiClient: SyncApiClient;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.apiClient = new SyncApiClient(this.settings.apiBaseUrl);

    this.registerView(SYNC_DASHBOARD_VIEW, (leaf) => new SyncDashboardView(leaf, this.apiClient));

    this.addCommand({
      id: 'sync-manager-open-dashboard',
      name: 'Open sync dashboard',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'sync-manager-trigger-sync',
      name: 'Trigger sync',
      callback: async () => {
        await this.apiClient.triggerSync();
        new Notice('Sync triggered.');
      },
    });

    this.addSettingTab(new SyncManagerSettingsTab(this.app, this));

    if (this.settings.autoSync) {
      await this.apiClient.triggerSync();
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;

    workspace.iterateAllLeaves((existingLeaf) => {
      if (existingLeaf.view.getViewType() === SYNC_DASHBOARD_VIEW) {
        leaf = existingLeaf;
      }
    });

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: SYNC_DASHBOARD_VIEW, active: true });
    }

    workspace.revealLeaf(leaf!);
  }
}
