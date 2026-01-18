import { App, TFile } from 'obsidian';
import { DefinitionLink, LinkPreferences, LinkType, TermDefinition } from './types';
import { LinkConfirmationModal } from './ui/link-confirmation-modal';

export class LinkInterceptor {
  constructor(
    private app: App,
    private preferences: LinkPreferences,
    private onPreferencesChange: (prefs: LinkPreferences) => void,
  ) {}

  async handleLinkClick(link: DefinitionLink, term: TermDefinition, currentFile: TFile): Promise<boolean> {
    if (!this.preferences.globalEnabled) {
      return false;
    }

    if (!this.isLinkTypeEnabled(link.type)) {
      return false;
    }

    if (this.preferences.disabledPages.includes(currentFile.path)) {
      return false;
    }

    if (this.preferences.disabledTerms.includes(term.id)) {
      return false;
    }

    const termDisabledTypes = this.preferences.disabledLinkTypes[term.id] || [];
    if (termDisabledTypes.includes(link.type)) {
      return false;
    }

    if (this.preferences.disabledLinks.includes(link.id)) {
      return false;
    }

    const rememberedChoice = this.preferences.rememberedChoices[link.id];
    if (rememberedChoice === 'always') {
      return true;
    }
    if (rememberedChoice === 'never') {
      return false;
    }

    if (!this.preferences.showConfirmationModal) {
      return true;
    }

    return new Promise((resolve) => {
      const modal = new LinkConfirmationModal(
        this.app,
        link,
        term.id,
        term.term,
        currentFile.path,
        { ...this.preferences },
        (result, newPreferences) => {
          if (newPreferences) {
            this.onPreferencesChange(newPreferences);
          }
          resolve(result === 'proceed');
        },
      );
      modal.open();
    });
  }

  shouldRenderLink(link: DefinitionLink, term: TermDefinition, currentPath: string): boolean {
    if (!this.preferences.globalEnabled) return false;
    if (!this.isLinkTypeEnabled(link.type)) return false;
    if (this.preferences.disabledPages.includes(currentPath)) return false;
    if (this.preferences.disabledTerms.includes(term.id)) return false;

    const termDisabledTypes = this.preferences.disabledLinkTypes[term.id] || [];
    if (termDisabledTypes.includes(link.type)) return false;

    if (this.preferences.disabledLinks.includes(link.id)) return false;

    return true;
  }

  private isLinkTypeEnabled(type: LinkType): boolean {
    if (type === 'external') return this.preferences.externalLinksEnabled;
    if (type === 'internal') return this.preferences.internalLinksEnabled;
    if (type === 'story') return this.preferences.storyLinksEnabled;
    return true;
  }
}
