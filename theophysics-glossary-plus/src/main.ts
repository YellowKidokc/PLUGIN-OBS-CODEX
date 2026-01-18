import {
  App,
  MarkdownPostProcessorContext,
  Menu,
  Notice,
  Plugin,
  TFile,
} from 'obsidian';
import { GlossaryPlusSettings, DEFAULT_SETTINGS, GlossaryPlusSettingsTab } from './settings';
import { DefinitionManager } from './definition-manager';
import { parseDefinitionFile, DefinitionRecord } from './utils/parser';
import { HoverPreview } from './ui/hover-preview';
import { AddDefinitionModal } from './ui/add-definition-modal';
import { EditDefinitionModal } from './ui/edit-definition-modal';
import { DualLinkHandler } from './dual-link-handler';

export default class GlossaryPlusPlugin extends Plugin {
  settings: GlossaryPlusSettings;
  private definitionManager: DefinitionManager;
  private definitions = new Map<string, DefinitionRecord>();

  async onload(): Promise<void> {
    await this.loadSettings();
    this.definitionManager = new DefinitionManager(this.app, this.settings);

    this.addSettingTab(new GlossaryPlusSettingsTab(this.app, this));

    this.addCommand({
      id: 'glossary-plus-add-definition',
      name: 'Add definition',
      callback: () => new AddDefinitionModal(this.app, this.definitionManager, this.settings).open(),
    });

    this.addCommand({
      id: 'glossary-plus-refresh',
      name: 'Refresh glossary definitions',
      callback: () => this.refreshDefinitions(),
    });

    this.registerMarkdownPostProcessor((element, context) =>
      this.decorateDefinitions(element, context),
    );

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
        if (file.extension !== 'md') return;
        menu.addItem((item) =>
          item
            .setTitle('Edit definition')
            .setIcon('pencil')
            .onClick(() => new EditDefinitionModal(this.app, file).open()),
        );
      }),
    );

    await this.refreshDefinitions();
  }

  onunload(): void {
    this.definitions.clear();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async refreshDefinitions(): Promise<void> {
    this.definitions.clear();
    const folder = this.app.vault.getAbstractFileByPath(this.settings.definitionFolder);

    if (!folder) {
      new Notice('Definition folder not found.');
      return;
    }

    const files = this.app.vault.getMarkdownFiles().filter((file) =>
      file.path.startsWith(this.settings.definitionFolder + '/'),
    );

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const definition = parseDefinitionFile(content, file.path);
      if (definition) {
        this.definitions.set(definition.term.toLowerCase(), definition);
      }
    }
  }

  private decorateDefinitions(element: HTMLElement, _context: MarkdownPostProcessorContext): void {
    const terms = Array.from(this.definitions.keys());
    if (terms.length === 0) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        nodes.push(node as Text);
      }
    }

    for (const node of nodes) {
      const text = node.nodeValue ?? '';
      const lowerText = text.toLowerCase();

      const matchedTerm = terms.find((term) => lowerText.includes(term));
      if (!matchedTerm) continue;

      const definition = this.definitions.get(matchedTerm);
      if (!definition) continue;

      const span = document.createElement('span');
      span.textContent = text;
      span.classList.add('glossary-plus-term');

      span.addEventListener('mouseenter', async (event) => {
        const target = event.currentTarget as HTMLElement;
        const handler = new DualLinkHandler(this.settings.externalLinkSources);
        const externalLinks = await handler.fetchExternalLinks(definition.term);
        const hover = new HoverPreview(this.app, definition, externalLinks, this.settings.showExternalLinks);
        hover.onTargetHover(target);
      });

      node.parentNode?.replaceChild(span, node);
    }
  }
}
