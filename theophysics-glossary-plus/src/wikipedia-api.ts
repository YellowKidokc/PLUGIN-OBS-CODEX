export interface WikipediaResult {
  extract: string;
  url: string;
  title: string;
}

export async function fetchWikipediaDefinition(
  term: string,
  language: string,
): Promise<WikipediaResult> {
  const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    extract: data.extract ?? '',
    url: data.content_urls?.desktop?.page ?? '',
    title: data.title ?? term,
  };
}
