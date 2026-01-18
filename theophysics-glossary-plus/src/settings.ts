import { GlossaryPlusSettings } from './types';

export const DEFAULT_SETTINGS: GlossaryPlusSettings = {
  definitionFolder: 'Definitions/',
  trailFolder: 'Trails/',
  linkPreferences: {
    globalEnabled: true,
    externalLinksEnabled: true,
    internalLinksEnabled: true,
    storyLinksEnabled: true,
    disabledPages: [],
    disabledTerms: [],
    disabledLinkTypes: {},
    disabledLinks: [],
    showConfirmationModal: true,
    rememberedChoices: {},
    showInHover: true,
    hoverDelay: 300,
    maxExternalLinks: 3,
  },
  definitions: [],
  enableWikipedia: true,
  enableSEP: true,
  enablePhilPapers: true,
  enableScholarpedia: false,
  wikipediaLanguage: 'en',
  underlineStyle: 'dotted',
  highlightColor: '#3b82f6',
};
