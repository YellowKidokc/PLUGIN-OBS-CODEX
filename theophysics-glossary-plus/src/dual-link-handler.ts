import { ExternalSource } from './settings';

export interface ExternalLinks {
  wikipedia?: string;
  sep?: string;
  philpapers?: string;
  scholarpedia?: string;
}

export class DualLinkHandler {
  constructor(private sources: ExternalSource[]) {}

  async fetchExternalLinks(term: string): Promise<ExternalLinks> {
    const links: ExternalLinks = {};

    for (const source of this.sources) {
      if (source === 'wikipedia') {
        links.wikipedia = `https://en.wikipedia.org/wiki/${encodeURIComponent(term)}`;
      }
      if (source === 'sep') {
        links.sep = `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent(term)}`;
      }
      if (source === 'philpapers') {
        links.philpapers = `https://philpapers.org/s/${encodeURIComponent(term)}`;
      }
      if (source === 'scholarpedia') {
        links.scholarpedia = `http://www.scholarpedia.org/w/index.php?search=${encodeURIComponent(term)}`;
      }
    }

    return links;
  }
}
