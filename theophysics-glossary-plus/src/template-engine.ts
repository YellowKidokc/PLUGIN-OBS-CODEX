import { GlossaryPlusSettings } from './settings';
import { ExternalLinks } from './dual-link-handler';

export interface TemplateContext {
  term: string;
  internalDefinition: string;
  source: string;
  externalLinks: ExternalLinks;
}

export class TemplateEngine {
  constructor(private settings: GlossaryPlusSettings) {}

  getTemplateByName(name: string): string {
    const template = this.settings.customTemplates.find((item) => item.name === name);
    return template?.template ?? this.settings.customTemplates[0]?.template ?? '';
  }

  render(template: string, context: TemplateContext): string {
    return template
      .replace(/\{\{TERM\}\}/g, context.term)
      .replace(/\{\{INTERNAL_DEFINITION\}\}/g, context.internalDefinition)
      .replace(/\{\{SOURCE\}\}/g, context.source)
      .replace(/\{\{WIKIPEDIA_URL\}\}/g, context.externalLinks.wikipedia ?? '')
      .replace(/\{\{SEP_URL\}\}/g, context.externalLinks.sep ?? '')
      .replace(/\{\{PHILPAPERS_URL\}\}/g, context.externalLinks.philpapers ?? '')
      .replace(/\{\{SCHOLARPEDIA_URL\}\}/g, context.externalLinks.scholarpedia ?? '');
  }
}
