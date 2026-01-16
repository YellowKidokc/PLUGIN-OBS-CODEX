import { App, PluginSettingTab, Setting } from 'obsidian';
import SyncManagerPlugin from './main';

export interface SyncManagerSettings {
  apiBaseUrl: string;
  autoSync: boolean;
}

export const DEFAULT_SETTINGS: SyncManagerSettings = {
  apiBaseUrl: 'http://localhost:8000',
  autoSync: false,
};

export class SyncManagerSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: SyncManagerPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Theophysics Sync Manager' });

    new Setting(containerEl)
      .setName('API Base URL')
      .setDesc('URL for the Python sync backend.')
      .addText((text) =>
        text.setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
          this.plugin.settings.apiBaseUrl = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Auto-sync')
      .setDesc('Automatically trigger sync on launch.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoSync).onChange(async (value) => {
          this.plugin.settings.autoSync = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
