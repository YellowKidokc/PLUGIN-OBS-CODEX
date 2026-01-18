import { GlossaryPlusSettings, LinkPreferences, TermDefinition } from '../types';

export function mergeLinkPreferences(
  base: LinkPreferences,
  update: Partial<LinkPreferences>,
): LinkPreferences {
  return {
    ...base,
    ...update,
    disabledPages: update.disabledPages ?? base.disabledPages,
    disabledTerms: update.disabledTerms ?? base.disabledTerms,
    disabledLinkTypes: update.disabledLinkTypes ?? base.disabledLinkTypes,
    disabledLinks: update.disabledLinks ?? base.disabledLinks,
    rememberedChoices: update.rememberedChoices ?? base.rememberedChoices,
  };
}

export function updateTerm(definitions: TermDefinition[], updated: TermDefinition): TermDefinition[] {
  return definitions.map((term) => (term.id === updated.id ? updated : term));
}

export function ensureSettingsDefaults(settings: GlossaryPlusSettings): GlossaryPlusSettings {
  return settings;
}
