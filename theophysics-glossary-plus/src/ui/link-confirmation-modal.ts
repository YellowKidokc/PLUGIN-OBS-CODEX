import { App, Modal, Setting, ButtonComponent, Notice } from 'obsidian';
import { DefinitionLink, LinkPreferences, LinkType } from '../types';

export class LinkConfirmationModal extends Modal {
  private result: 'proceed' | 'cancel' | null = null;

  constructor(
    app: App,
    private link: DefinitionLink,
    private termId: string,
    private termName: string,
    private currentPage: string,
    private preferences: LinkPreferences,
    private onSubmit: (result: 'proceed' | 'cancel', preferences?: LinkPreferences) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('glossary-confirmation-modal');

    contentEl.createEl('h2', { text: 'Before You Go...' });

    const infoDiv = contentEl.createDiv({ cls: 'link-info' });
    infoDiv.createEl('p', {
      text: `You're about to open a ${this.getLinkTypeLabel(this.link.type)} link for "${this.termName}"`,
    });

    if (this.link.type === 'external') {
      infoDiv.createEl('p', {
        text: `Destination: ${this.link.url}`,
        cls: 'link-url',
      });
    }

    const buttonRow = contentEl.createDiv({ cls: 'button-row primary-buttons' });

    new ButtonComponent(buttonRow)
      .setButtonText('Go to Link')
      .setCta()
      .onClick(() => {
        this.result = 'proceed';
        this.close();
      });

    new ButtonComponent(buttonRow).setButtonText('Cancel').onClick(() => {
      this.result = 'cancel';
      this.close();
    });

    contentEl.createEl('hr');

    contentEl.createEl('h3', { text: 'Link Preferences', cls: 'preferences-header' });
    const prefsDiv = contentEl.createDiv({ cls: 'link-preferences' });

    new Setting(prefsDiv)
      .setName('Remember my choice for this link')
      .setDesc('Always allow or always block this specific link')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('ask', 'Always ask')
          .addOption('always', 'Always allow')
          .addOption('never', 'Always block')
          .setValue(this.preferences.rememberedChoices[this.link.id] || 'ask')
          .onChange((value) => {
            this.preferences.rememberedChoices[this.link.id] = value as 'always' | 'never' | 'ask';
          }),
      );

    const moreOptionsHeader = contentEl.createEl('details', { cls: 'more-options' });
    moreOptionsHeader.createEl('summary', { text: '⚙️ More Options (Turn off links)' });

    const moreOptionsDiv = moreOptionsHeader.createDiv({ cls: 'more-options-content' });

    new Setting(moreOptionsDiv)
      .setName(`Turn off ${this.getLinkTypeLabel(this.link.type)} links for "${this.termName}"`)
      .setDesc(`Disable all ${this.link.type} links for this term only`)
      .addToggle((toggle) =>
        toggle.setValue(false).onChange((value) => {
          if (value) {
            if (!this.preferences.disabledLinkTypes[this.termId]) {
              this.preferences.disabledLinkTypes[this.termId] = [];
            }
            this.preferences.disabledLinkTypes[this.termId].push(this.link.type);
          }
        }),
      );

    new Setting(moreOptionsDiv)
      .setName(`Turn off ALL links for "${this.termName}"`)
      .setDesc('Disable every link type for this definition')
      .addToggle((toggle) =>
        toggle
          .setValue(this.preferences.disabledTerms.includes(this.termId))
          .onChange((value) => {
            if (value && !this.preferences.disabledTerms.includes(this.termId)) {
              this.preferences.disabledTerms.push(this.termId);
            } else if (!value) {
              this.preferences.disabledTerms = this.preferences.disabledTerms.filter(
                (term) => term !== this.termId,
              );
            }
          }),
      );

    new Setting(moreOptionsDiv)
      .setName(`Turn off ALL ${this.getLinkTypeLabel(this.link.type)} links everywhere`)
      .setDesc(`Disable ${this.link.type} links across your entire vault`)
      .addToggle((toggle) =>
        toggle.setValue(!this.getLinkTypeEnabled(this.link.type)).onChange((value) => {
          this.setLinkTypeEnabled(this.link.type, !value);
        }),
      );

    new Setting(moreOptionsDiv)
      .setName('Turn off glossary on this page')
      .setDesc(`Disable all glossary links in "${this.currentPage}"`)
      .addToggle((toggle) =>
        toggle
          .setValue(this.preferences.disabledPages.includes(this.currentPage))
          .onChange((value) => {
            if (value && !this.preferences.disabledPages.includes(this.currentPage)) {
              this.preferences.disabledPages.push(this.currentPage);
            } else if (!value) {
              this.preferences.disabledPages = this.preferences.disabledPages.filter(
                (page) => page !== this.currentPage,
              );
            }
          }),
      );

    new Setting(moreOptionsDiv)
      .setName('Turn off Glossary Plus entirely')
      .setDesc('Disable the entire glossary system (can re-enable in settings)')
      .addToggle((toggle) =>
        toggle.setValue(!this.preferences.globalEnabled).onChange((value) => {
          this.preferences.globalEnabled = !value;
        }),
      );

    const settingsLink = contentEl.createDiv({ cls: 'settings-link' });
    settingsLink
      .createEl('a', {
        text: '⚙️ Open full settings panel',
        href: '#',
      })
      .addEventListener('click', (event) => {
        event.preventDefault();
        this.close();
        new Notice('Open settings from the command palette: Glossary Plus settings');
      });

    const dontShowDiv = contentEl.createDiv({ cls: 'dont-show-again' });
    new Setting(dontShowDiv)
      .setName("Don't show this confirmation again")
      .setDesc('You can re-enable in settings')
      .addToggle((toggle) =>
        toggle.setValue(!this.preferences.showConfirmationModal).onChange((value) => {
          this.preferences.showConfirmationModal = !value;
        }),
      );
  }

  onClose(): void {
    this.onSubmit(this.result || 'cancel', this.preferences);
  }

  private getLinkTypeLabel(type: LinkType): string {
    if (type === 'external') return 'External Definition';
    if (type === 'internal') return 'Internal Definition';
    return 'Story/Trail';
  }

  private getLinkTypeEnabled(type: LinkType): boolean {
    if (type === 'external') return this.preferences.externalLinksEnabled;
    if (type === 'internal') return this.preferences.internalLinksEnabled;
    return this.preferences.storyLinksEnabled;
  }

  private setLinkTypeEnabled(type: LinkType, enabled: boolean): void {
    if (type === 'external') this.preferences.externalLinksEnabled = enabled;
    if (type === 'internal') this.preferences.internalLinksEnabled = enabled;
    if (type === 'story') this.preferences.storyLinksEnabled = enabled;
  }
}
