export interface ExternalSourceResult {
  label: string;
  url: string;
  summary?: string;
}

export async function fetchWikipediaSummary(term: string, language: string): Promise<ExternalSourceResult> {
  const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    label: data.title ?? term,
    url: data.content_urls?.desktop?.page ?? '',
    summary: data.extract ?? '',
  };
}

export function buildSepLink(term: string): ExternalSourceResult {
  return {
    label: 'Stanford Encyclopedia of Philosophy',
    url: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent(term)}`,
  };
}

export function buildPhilpapersLink(term: string): ExternalSourceResult {
  return {
    label: 'PhilPapers',
    url: `https://philpapers.org/s/${encodeURIComponent(term)}`,
  };
}

export function buildScholarpediaLink(term: string): ExternalSourceResult {
  return {
    label: 'Scholarpedia',
    url: `http://www.scholarpedia.org/w/index.php?search=${encodeURIComponent(term)}`,
  };
}
