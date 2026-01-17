export interface DefinitionRecord {
  term: string;
  definition: string;
  filePath: string;
}

export function parseDefinitionFile(content: string, filePath: string): DefinitionRecord | null {
  const lines = content.split('\n');
  const termLine = lines.find((line) => line.toLowerCase().startsWith('term:'));
  if (!termLine) {
    return null;
  }

  const term = termLine.split(':').slice(1).join(':').trim().replace(/^"|"$/g, '');
  const definitionIndex = lines.findIndex((line) => line.toLowerCase().includes('internal definition'));
  const definition = definitionIndex >= 0 ? lines.slice(definitionIndex + 1).join('\n').trim() : content.trim();

  return { term, definition, filePath };
}
