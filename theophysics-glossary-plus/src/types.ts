export type LinkType = 'external' | 'internal' | 'story';

export interface DefinitionLink {
  id: string;
  type: LinkType;
  url: string;
  label: string;
  source?: string;
  enabled: boolean;
}

export interface TermDefinition {
  id: string;
  term: string;
  aliases: string[];
  internalLink?: DefinitionLink;
  externalLinks: DefinitionLink[];
  storyLink?: DefinitionLink;
  summary: string;
  fullDefinitionPath?: string;
  allLinksEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkPreferences {
  globalEnabled: boolean;
  externalLinksEnabled: boolean;
  internalLinksEnabled: boolean;
  storyLinksEnabled: boolean;
  disabledPages: string[];
  disabledTerms: string[];
  disabledLinkTypes: Record<string, LinkType[]>;
  disabledLinks: string[];
  showConfirmationModal: boolean;
  rememberedChoices: Record<string, 'always' | 'never' | 'ask'>;
  showInHover: boolean;
  hoverDelay: number;
  maxExternalLinks: number;
}

export interface GlossaryPlusSettings {
  definitionFolder: string;
  trailFolder: string;
  linkPreferences: LinkPreferences;
  definitions: TermDefinition[];
  enableWikipedia: boolean;
  enableSEP: boolean;
  enablePhilPapers: boolean;
  enableScholarpedia: boolean;
  wikipediaLanguage: string;
  underlineStyle: 'solid' | 'dotted' | 'dashed' | 'none';
  highlightColor: string;
}
