import { App, HoverPopover } from 'obsidian';
import { DefinitionLink, TermDefinition } from '../types';

export class HoverPreview extends HoverPopover {
  constructor(
    app: App,
    private definition: TermDefinition,
    private externalLinks: DefinitionLink[],
  ) {
    super(app);
  }

  onOpen(): void {
    const contentEl = this.contentEl;
    contentEl.empty();
    contentEl.addClass('glossary-hover-preview');

    contentEl.createEl('h3', { text: this.definition.term });
    contentEl.createEl('p', { text: this.definition.summary });

    if (this.definition.internalLink) {
      const internal = contentEl.createDiv({ cls: 'link-section' });
      internal.createEl('h4', { text: '📝 My Definition' });
      internal.createEl('a', {
        text: this.definition.internalLink.label,
        href: this.definition.internalLink.url,
      });
    }

    if (this.externalLinks.length > 0) {
      const external = contentEl.createDiv({ cls: 'link-section' });
      external.createEl('h4', { text: '🌐 External Sources' });
      const list = external.createEl('ul');
      this.externalLinks.forEach((link) => {
        list.createEl('li').createEl('a', { text: link.label, href: link.url });
      });
    }

    if (this.definition.storyLink) {
      const story = contentEl.createDiv({ cls: 'link-section' });
      story.createEl('h4', { text: '📖 Story Trail' });
      story.createEl('a', {
        text: this.definition.storyLink.label,
        href: this.definition.storyLink.url,
      });
    }
  }
}
