import {
  MarkdownPostProcessorContext,
  Menu,
  Notice,
  Plugin,
  TFile,
} from 'obsidian';
import { DEFAULT_SETTINGS } from './settings';
import { GlossaryPlusSettings, TermDefinition } from './types';
import { LinkInterceptor } from './link-interceptor';
import { GlossaryPlusSettingTab } from './ui/settings-tab';
import { HoverPreview } from './ui/hover-preview';
import { AddDefinitionModal } from './ui/add-definition-modal';
import { LinkManager } from './link-manager';

export default class GlossaryPlusPlugin extends Plugin {
  settings: GlossaryPlusSettings;
  private linkInterceptor: LinkInterceptor;
  private linkManager: LinkManager;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.linkInterceptor = new LinkInterceptor(
      this.app,
      this.settings.linkPreferences,
      (prefs) => this.updatePreferences(prefs),
    );
    this.linkManager = new LinkManager(this.settings);

    this.addSettingTab(new GlossaryPlusSettingTab(this.app, this));

    this.addCommand({
      id: 'glossary-plus-add-definition',
      name: 'Add definition',
      callback: () =>
        new AddDefinitionModal(this.app, async (definition) => {
          this.settings.definitions.push(definition);
          await this.saveSettings();
          new Notice(`Definition added: ${definition.term}`);
        }).open(),
    });

    this.addCommand({
      id: 'glossary-plus-toggle-current-page',
      name: 'Toggle glossary on this page',
      callback: () => this.toggleCurrentPage(),
    });

    this.registerMarkdownPostProcessor((element, context) =>
      this.decorateDefinitions(element, context),
    );

    this.registerDomEvent(document, 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target?.classList.contains('glossary-link')) return;
      event.preventDefault();
      void this.handleGlossaryLinkClick(target);
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
        if (file.extension !== 'md') return;
        menu.addItem((item) =>
          item
            .setTitle('Open Glossary Plus settings')
            .setIcon('book')
            .onClick(() => this.openSettings()),
        );
      }),
    );
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async updatePreferences(newPrefs: GlossaryPlusSettings['linkPreferences']): Promise<void> {
    this.settings.linkPreferences = newPrefs;
    await this.saveSettings();
    this.linkInterceptor = new LinkInterceptor(
      this.app,
      this.settings.linkPreferences,
      (prefs) => this.updatePreferences(prefs),
    );
  }

  private async handleGlossaryLinkClick(element: HTMLElement): Promise<void> {
    const linkId = element.dataset.linkId;
    const termId = element.dataset.termId;
    if (!linkId || !termId) return;

    const term = this.settings.definitions.find((definition) => definition.id === termId);
    if (!term) return;

    const link = this.findLinkById(term, linkId);
    if (!link) return;

    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) return;

    const shouldProceed = await this.linkInterceptor.handleLinkClick(link, term, currentFile);
    if (!shouldProceed) return;

    if (link.type === 'external') {
      window.open(link.url, '_blank');
    } else {
      this.app.workspace.openLinkText(link.url, '', false);
    }
  }

  private findLinkById(term: TermDefinition, linkId: string) {
    if (term.internalLink?.id === linkId) return term.internalLink;
    if (term.storyLink?.id === linkId) return term.storyLink;
    return term.externalLinks.find((link) => link.id === linkId) ?? null;
  }

  private decorateDefinitions(element: HTMLElement, _context: MarkdownPostProcessorContext): void {
    if (!this.settings.linkPreferences.globalEnabled) return;
    const terms = this.settings.definitions;
    if (terms.length === 0) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        nodes.push(node as Text);
      }
    }

    nodes.forEach((node) => {
      const text = node.nodeValue ?? '';
      const match = terms.find((term) => this.matchTerm(text, term));
      if (!match) return;

      const span = document.createElement('span');
      span.textContent = text;
      span.classList.add('glossary-link');
      span.dataset.termId = match.id;
      span.dataset.linkId = match.internalLink?.id || match.externalLinks[0]?.id || '';
      span.style.textDecorationStyle = this.settings.underlineStyle;
      span.style.textDecorationColor = this.settings.highlightColor;

      span.addEventListener('mouseenter', async (event) => {
        if (!this.settings.linkPreferences.showInHover) return;
        const target = event.currentTarget as HTMLElement;
        const externalLinks = await this.linkManager.buildExternalLinks(match);
        const previewLinks = externalLinks.slice(0, this.settings.linkPreferences.maxExternalLinks);
        const hover = new HoverPreview(this.app, match, previewLinks);
        hover.onTargetHover(target);
      });

      node.parentNode?.replaceChild(span, node);
    });
  }

  private matchTerm(text: string, term: TermDefinition): boolean {
    const lowerText = text.toLowerCase();
    if (lowerText.includes(term.term.toLowerCase())) return true;
    return term.aliases.some((alias) => lowerText.includes(alias.toLowerCase()));
  }

  private async toggleCurrentPage(): Promise<void> {
    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) return;

    const path = currentFile.path;
    const isDisabled = this.settings.linkPreferences.disabledPages.includes(path);

    if (isDisabled) {
      this.settings.linkPreferences.disabledPages =
        this.settings.linkPreferences.disabledPages.filter((page) => page !== path);
      new Notice('Glossary enabled on this page');
    } else {
      this.settings.linkPreferences.disabledPages.push(path);
      new Notice('Glossary disabled on this page');
    }

    await this.saveSettings();
  }

  private openSettings(): void {
    // Use command palette to open settings tab
    new Notice('Open Glossary Plus settings from the settings panel.');
  }
}
