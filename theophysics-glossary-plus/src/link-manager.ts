import { DefinitionLink, GlossaryPlusSettings, LinkType, TermDefinition } from './types';
import {
  buildPhilpapersLink,
  buildScholarpediaLink,
  buildSepLink,
  fetchWikipediaSummary,
} from './utils/external-apis';

export class LinkManager {
  constructor(private settings: GlossaryPlusSettings) {}

  async buildExternalLinks(term: TermDefinition): Promise<DefinitionLink[]> {
    const links: DefinitionLink[] = [];

    if (this.settings.enableWikipedia) {
      const wiki = await fetchWikipediaSummary(term.term, this.settings.wikipediaLanguage);
      links.push({
        id: crypto.randomUUID(),
        type: 'external',
        url: wiki.url,
        label: `Wikipedia: ${wiki.label}`,
        source: 'Wikipedia',
        enabled: true,
      });
    }

    if (this.settings.enableSEP) {
      const sep = buildSepLink(term.term);
      links.push({
        id: crypto.randomUUID(),
        type: 'external',
        url: sep.url,
        label: sep.label,
        source: 'SEP',
        enabled: true,
      });
    }

    if (this.settings.enablePhilPapers) {
      const philpapers = buildPhilpapersLink(term.term);
      links.push({
        id: crypto.randomUUID(),
        type: 'external',
        url: philpapers.url,
        label: philpapers.label,
        source: 'PhilPapers',
        enabled: true,
      });
    }

    if (this.settings.enableScholarpedia) {
      const scholarpedia = buildScholarpediaLink(term.term);
      links.push({
        id: crypto.randomUUID(),
        type: 'external',
        url: scholarpedia.url,
        label: scholarpedia.label,
        source: 'Scholarpedia',
        enabled: true,
      });
    }

    return links;
  }

  buildInternalLink(term: TermDefinition): DefinitionLink | undefined {
    if (!term.fullDefinitionPath) {
      return undefined;
    }
    return {
      id: crypto.randomUUID(),
      type: 'internal',
      url: term.fullDefinitionPath,
      label: 'Open definition',
      source: 'Vault',
      enabled: true,
    };
  }

  buildStoryLink(term: TermDefinition): DefinitionLink | undefined {
    if (!this.settings.trailFolder) {
      return undefined;
    }
    return {
      id: crypto.randomUUID(),
      type: 'story',
      url: `${this.settings.trailFolder}/${term.term}-Trail.md`,
      label: `Story: ${term.term}`,
      source: 'Trail Weaver',
      enabled: true,
    };
  }

  shouldIncludeLink(link: DefinitionLink): boolean {
    if (link.type === 'external') return this.settings.linkPreferences.externalLinksEnabled;
    if (link.type === 'internal') return this.settings.linkPreferences.internalLinksEnabled;
    if (link.type === 'story') return this.settings.linkPreferences.storyLinksEnabled;
    return true;
  }

  getLinkTypeLabel(type: LinkType): string {
    if (type === 'external') return 'External Definition';
    if (type === 'internal') return 'Internal Definition';
    return 'Story/Trail';
  }
}
