import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import GlossaryPlusPlugin from '../main';

export class GlossaryPlusSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: GlossaryPlusPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'Glossary Plus Settings' });
    containerEl.createEl('h2', { text: '🎛️ Global Controls' });

    new Setting(containerEl)
      .setName('Enable Glossary Plus')
      .setDesc('Master switch for the entire glossary system')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.linkPreferences.globalEnabled).onChange(async (value) => {
          this.plugin.settings.linkPreferences.globalEnabled = value;
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl('h2', { text: '🔗 Link Types' });

    new Setting(containerEl)
      .setName('🌐 External Definition Links')
      .setDesc('Links to Wikipedia, Stanford Encyclopedia, PhilPapers, etc.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.linkPreferences.externalLinksEnabled)
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.externalLinksEnabled = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('📝 Internal Definition Links')
      .setDesc('Links to your personal definitions in the vault')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.linkPreferences.internalLinksEnabled)
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.internalLinksEnabled = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('📖 Story/Trail Links')
      .setDesc('Links to narrative journeys through concepts')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.linkPreferences.storyLinksEnabled)
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.storyLinksEnabled = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl('h2', { text: '❓ Link Confirmation' });

    new Setting(containerEl)
      .setName('Show confirmation before opening links')
      .setDesc('Ask "Before you go..." when clicking glossary links')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.linkPreferences.showConfirmationModal)
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.showConfirmationModal = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Reset remembered link choices')
      .setDesc('Clear all "always allow" and "always block" choices')
      .addButton((button) =>
        button
          .setButtonText('Reset All')
          .setWarning()
          .onClick(async () => {
            this.plugin.settings.linkPreferences.rememberedChoices = {};
            await this.plugin.saveSettings();
            new Notice('Remembered choices cleared');
          }),
      );

    containerEl.createEl('h2', { text: '🚫 Disabled Items' });
    const disabledPagesDiv = containerEl.createDiv({ cls: 'disabled-list' });
    disabledPagesDiv.createEl('h3', { text: 'Disabled Pages' });

    if (this.plugin.settings.linkPreferences.disabledPages.length === 0) {
      disabledPagesDiv.createEl('p', { text: 'No pages disabled', cls: 'muted' });
    } else {
      const pageList = disabledPagesDiv.createEl('ul');
      for (const page of this.plugin.settings.linkPreferences.disabledPages) {
        const li = pageList.createEl('li');
        li.createEl('span', { text: page });
        li
          .createEl('button', { text: '✕', cls: 'remove-btn' })
          .addEventListener('click', async () => {
            this.plugin.settings.linkPreferences.disabledPages =
              this.plugin.settings.linkPreferences.disabledPages.filter((p) => p !== page);
            await this.plugin.saveSettings();
            this.display();
          });
      }
    }

    const disabledTermsDiv = containerEl.createDiv({ cls: 'disabled-list' });
    disabledTermsDiv.createEl('h3', { text: 'Disabled Terms' });

    if (this.plugin.settings.linkPreferences.disabledTerms.length === 0) {
      disabledTermsDiv.createEl('p', { text: 'No terms disabled', cls: 'muted' });
    } else {
      const termList = disabledTermsDiv.createEl('ul');
      for (const termId of this.plugin.settings.linkPreferences.disabledTerms) {
        const term = this.plugin.settings.definitions.find((def) => def.id === termId);
        const li = termList.createEl('li');
        li.createEl('span', { text: term?.term || termId });
        li
          .createEl('button', { text: '✕', cls: 'remove-btn' })
          .addEventListener('click', async () => {
            this.plugin.settings.linkPreferences.disabledTerms =
              this.plugin.settings.linkPreferences.disabledTerms.filter((termValue) => termValue !== termId);
            await this.plugin.saveSettings();
            this.display();
          });
      }
    }

    new Setting(containerEl)
      .setName('Re-enable all disabled items')
      .setDesc('Clear all disabled pages, terms, and individual links')
      .addButton((button) =>
        button.setButtonText('Re-enable All').onClick(async () => {
          this.plugin.settings.linkPreferences.disabledPages = [];
          this.plugin.settings.linkPreferences.disabledTerms = [];
          this.plugin.settings.linkPreferences.disabledLinkTypes = {};
          this.plugin.settings.linkPreferences.disabledLinks = [];
          await this.plugin.saveSettings();
          this.display();
          new Notice('All items re-enabled');
        }),
      );

    containerEl.createEl('h2', { text: '🌐 External Sources' });

    new Setting(containerEl)
      .setName('Wikipedia')
      .setDesc('Enable Wikipedia as external source')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableWikipedia).onChange(async (value) => {
          this.plugin.settings.enableWikipedia = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Stanford Encyclopedia of Philosophy')
      .setDesc('Enable SEP as external source (academic philosophy)')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableSEP).onChange(async (value) => {
          this.plugin.settings.enableSEP = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('PhilPapers')
      .setDesc('Enable PhilPapers as external source')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enablePhilPapers).onChange(async (value) => {
          this.plugin.settings.enablePhilPapers = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Scholarpedia')
      .setDesc('Enable Scholarpedia as external source (peer-reviewed)')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableScholarpedia).onChange(async (value) => {
          this.plugin.settings.enableScholarpedia = value;
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl('h2', { text: '🎨 Appearance' });

    new Setting(containerEl)
      .setName('Definition folder')
      .setDesc('Where internal definitions are stored')
      .addText((text) =>
        text
          .setPlaceholder('Definitions/')
          .setValue(this.plugin.settings.definitionFolder)
          .onChange(async (value) => {
            this.plugin.settings.definitionFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Trail folder')
      .setDesc('Where story/trail files are stored')
      .addText((text) =>
        text
          .setPlaceholder('Trails/')
          .setValue(this.plugin.settings.trailFolder)
          .onChange(async (value) => {
            this.plugin.settings.trailFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Underline style')
      .setDesc('How to underline defined terms')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('solid', 'Solid')
          .addOption('dotted', 'Dotted')
          .addOption('dashed', 'Dashed')
          .addOption('none', 'None (no underline)')
          .setValue(this.plugin.settings.underlineStyle)
          .onChange(async (value) => {
            this.plugin.settings.underlineStyle = value as 'solid' | 'dotted' | 'dashed' | 'none';
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Hover delay (ms)')
      .setDesc('How long to wait before showing hover preview')
      .addSlider((slider) =>
        slider
          .setLimits(0, 1000, 50)
          .setValue(this.plugin.settings.linkPreferences.hoverDelay)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.hoverDelay = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Max external links in hover')
      .setDesc('Maximum number of external sources to show')
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.linkPreferences.maxExternalLinks)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.linkPreferences.maxExternalLinks = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
