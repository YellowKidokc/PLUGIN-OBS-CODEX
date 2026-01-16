import { App, PluginSettingTab, Setting } from 'obsidian';
import GlossaryPlusPlugin from './main';

export type ExternalSource = 'wikipedia' | 'sep' | 'philpapers' | 'scholarpedia';

export interface GlossaryPlusSettings {
  definitionFolder: string;
  showExternalLinks: boolean;
  externalLinkSources: ExternalSource[];
  defaultTemplate: string;
  customTemplates: { name: string; template: string }[];
  enableWikipediaAPI: boolean;
  wikipediaLanguage: string;
}

export const DEFAULT_SETTINGS: GlossaryPlusSettings = {
  definitionFolder: 'Definitions',
  showExternalLinks: true,
  externalLinkSources: ['sep', 'philpapers', 'scholarpedia', 'wikipedia'],
  defaultTemplate: 'Default',
  customTemplates: [
    {
      name: 'Default',
      template:
        '---\nterm: "{{TERM}}"\nsource: "{{SOURCE}}"\ndef-type: consolidated\n---\n\n# {{TERM}}\n\n## Internal Definition\n{{INTERNAL_DEFINITION}}\n\n## External Sources\n- [Wikipedia]({{WIKIPEDIA_URL}})\n- [SEP]({{SEP_URL}})\n- [PhilPapers]({{PHILPAPERS_URL}})\n- [Scholarpedia]({{SCHOLARPEDIA_URL}})\n',
    },
  ],
  enableWikipediaAPI: true,
  wikipediaLanguage: 'en',
};

export class GlossaryPlusSettingsTab extends PluginSettingTab {
  private plugin: GlossaryPlusPlugin;

  constructor(app: App, plugin: GlossaryPlusPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Theophysics Glossary Plus Settings' });

    new Setting(containerEl)
      .setName('Definition folder')
      .setDesc('Folder where definition files are stored.')
      .addText((text) =>
        text
          .setPlaceholder('Definitions')
          .setValue(this.plugin.settings.definitionFolder)
          .onChange(async (value) => {
            this.plugin.settings.definitionFolder = value.trim() || 'Definitions';
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Show external links')
      .setDesc('Include external links in hover previews and definition rendering.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showExternalLinks)
          .onChange(async (value) => {
            this.plugin.settings.showExternalLinks = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Enable Wikipedia integration')
      .setDesc('Allow pulling definition excerpts from Wikipedia.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableWikipediaAPI)
          .onChange(async (value) => {
            this.plugin.settings.enableWikipediaAPI = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Wikipedia language')
      .setDesc('Language code for Wikipedia API requests.')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.wikipediaLanguage)
          .onChange(async (value) => {
            this.plugin.settings.wikipediaLanguage = value.trim() || 'en';
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl('h3', { text: 'Templates' });

    this.plugin.settings.customTemplates.forEach((template, index) => {
      const templateSetting = new Setting(containerEl)
        .setName(`Template: ${template.name}`)
        .setDesc('Edit the template content.');

      templateSetting.addTextArea((textArea) => {
        textArea
          .setValue(template.template)
          .onChange(async (value) => {
            this.plugin.settings.customTemplates[index].template = value;
            await this.plugin.saveSettings();
          });
        textArea.inputEl.rows = 6;
        textArea.inputEl.cols = 60;
      });
    });
  }
}
