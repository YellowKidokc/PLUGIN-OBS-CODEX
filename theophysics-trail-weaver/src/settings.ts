import { App, PluginSettingTab, Setting } from 'obsidian';
import TrailWeaverPlugin from './main';

export type StoryScope = 'note' | 'folder' | 'vault';
export type StoryOrder = 'first-mention' | 'mention-count';

export interface TrailWeaverSettings {
  storyFolder: string;
  defaultScope: StoryScope;
  contextWindowWords: number;
  orderBy: StoryOrder;
  includeSynonyms: boolean;
}

export const DEFAULT_SETTINGS: TrailWeaverSettings = {
  storyFolder: 'Stories',
  defaultScope: 'folder',
  contextWindowWords: 40,
  orderBy: 'first-mention',
  includeSynonyms: false,
};

export class TrailWeaverSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: TrailWeaverPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Theophysics Trail Weaver Settings' });

    new Setting(containerEl)
      .setName('Story folder')
      .setDesc('Folder where story notes are created.')
      .addText((text) =>
        text
          .setPlaceholder('Stories')
          .setValue(this.plugin.settings.storyFolder)
          .onChange(async (value) => {
            this.plugin.settings.storyFolder = value.trim() || 'Stories';
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Default scope')
      .setDesc('Scope to scan when building a story.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('note', 'This note')
          .addOption('folder', 'This folder')
          .addOption('vault', 'Entire vault')
          .setValue(this.plugin.settings.defaultScope)
          .onChange(async (value: StoryScope) => {
            this.plugin.settings.defaultScope = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Context window (words)')
      .setDesc('How many words before/after a mention to capture in story snippets.')
      .addSlider((slider) =>
        slider
          .setLimits(0, 200, 5)
          .setValue(this.plugin.settings.contextWindowWords)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.contextWindowWords = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Order scenes by')
      .setDesc('Determine how scenes are ordered in the story.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('first-mention', 'First mention')
          .addOption('mention-count', 'Mention count')
          .setValue(this.plugin.settings.orderBy)
          .onChange(async (value: StoryOrder) => {
            this.plugin.settings.orderBy = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Include synonyms')
      .setDesc('Include custom synonyms when scanning for mentions.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeSynonyms).onChange(async (value) => {
          this.plugin.settings.includeSynonyms = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
