export interface WordnikResult {
  etymology?: string;
  pronunciations: string[];
  examples: string[];
}

export async function fetchWordnikData(term: string, apiKey: string): Promise<WordnikResult> {
  if (!apiKey) {
    throw new Error('Wordnik API key is required.');
  }

  const base = `https://api.wordnik.com/v4/word.json/${encodeURIComponent(term)}`;
  const [etymology, pronunciations, examples] = await Promise.all([
    fetch(`${base}/etymologies?api_key=${apiKey}`).then((res) => (res.ok ? res.json() : [])),
    fetch(`${base}/pronunciations?api_key=${apiKey}`).then((res) => (res.ok ? res.json() : [])),
    fetch(`${base}/examples?api_key=${apiKey}`).then((res) => (res.ok ? res.json() : [])),
  ]);

  return {
    etymology: Array.isArray(etymology) ? etymology[0] : undefined,
    pronunciations: Array.isArray(pronunciations)
      ? pronunciations.map((item) => item.raw ?? item.pronunciation).filter(Boolean)
      : [],
    examples: examples?.examples ? examples.examples.map((item: any) => item.text).filter(Boolean) : [],
  };
}
