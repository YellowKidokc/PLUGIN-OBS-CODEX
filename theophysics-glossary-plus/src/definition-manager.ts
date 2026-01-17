import { App, Notice, TFile } from 'obsidian';
import { GlossaryPlusSettings } from './settings';
import { TemplateEngine } from './template-engine';
import { DualLinkHandler, ExternalLinks } from './dual-link-handler';

export interface DefinitionPayload {
  term: string;
  definition: string;
  source: string;
  externalLinks?: ExternalLinks;
  templateName?: string;
}

export class DefinitionManager {
  private templateEngine: TemplateEngine;
  private linkHandler: DualLinkHandler;

  constructor(private app: App, private settings: GlossaryPlusSettings) {
    this.templateEngine = new TemplateEngine(settings);
    this.linkHandler = new DualLinkHandler(settings.externalLinkSources);
  }

  async fetchExternalLinks(term: string): Promise<ExternalLinks> {
    return this.linkHandler.fetchExternalLinks(term);
  }

  async createDefinition(payload: DefinitionPayload): Promise<TFile | null> {
    const folder = this.settings.definitionFolder;
    await this.ensureFolder(folder);

    const externalLinks = payload.externalLinks ?? (await this.fetchExternalLinks(payload.term));
    const templateName = payload.templateName ?? this.settings.defaultTemplate;
    const template = this.templateEngine.getTemplateByName(templateName);

    const content = this.templateEngine.render(template, {
      term: payload.term,
      internalDefinition: payload.definition,
      source: payload.source,
      externalLinks,
    });

    const filePath = `${folder}/${payload.term}.md`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);

    if (existing) {
      new Notice(`Definition already exists: ${filePath}`);
      return null;
    }

    return this.app.vault.create(filePath, content);
  }

  private async ensureFolder(path: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.createFolder(path);
    }
  }
}
