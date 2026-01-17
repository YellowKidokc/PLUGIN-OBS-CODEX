import { App, HoverPopover, TFile } from 'obsidian';
import { DefinitionRecord } from '../utils/parser';
import { ExternalLinks } from '../dual-link-handler';

export class HoverPreview extends HoverPopover {
  constructor(
    app: App,
    private definition: DefinitionRecord,
    private externalLinks: ExternalLinks,
    private showExternalLinks: boolean,
  ) {
    super(app);
  }

  onOpen(): void {
    const contentEl = this.contentEl;
    contentEl.empty();

    contentEl.createEl('h4', { text: this.definition.term });
    contentEl.createEl('p', { text: this.definition.definition });

    if (this.showExternalLinks) {
      const list = contentEl.createEl('ul');
      if (this.externalLinks.wikipedia) {
        list.createEl('li').createEl('a', { href: this.externalLinks.wikipedia, text: 'Wikipedia' });
      }
      if (this.externalLinks.sep) {
        list.createEl('li').createEl('a', { href: this.externalLinks.sep, text: 'SEP' });
      }
      if (this.externalLinks.philpapers) {
        list.createEl('li').createEl('a', { href: this.externalLinks.philpapers, text: 'PhilPapers' });
      }
      if (this.externalLinks.scholarpedia) {
        list.createEl('li').createEl('a', { href: this.externalLinks.scholarpedia, text: 'Scholarpedia' });
      }
    }
  }
}
