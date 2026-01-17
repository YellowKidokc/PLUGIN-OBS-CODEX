export const BUILTIN_PROMPTS: Record<string, string> = {
  'extract-concepts': `Analyze this note and extract 3-5 key concepts or themes.
Return only a comma-separated list of concepts (e.g., "grace, redemption, coherence").

Note content:
{{content}}`,
  'generate-tags': `Generate 5-10 semantic tags for this note. Focus on:
- Main topics
- Disciplines (theology, physics, psychology)
- Key figures or concepts mentioned
- Methodologies used

Return only comma-separated tags.

Note: {{title}}
Content: {{content}}`,
  'axiom-refs': `Identify any references to Theophysics axioms in this note.
Axioms use format like P0.1, O1.2, D2.1, C3.1, etc.

Extract axiom IDs mentioned and briefly explain how they're used.

Content:
{{content}}`,
  summarize: `Provide a concise 1-2 sentence summary of the main argument or purpose of this note.

Title: {{title}}
Content: {{content}}`,
  'math-extract': `Extract all mathematical formulas, equations, and formal expressions from this note.
List them clearly, one per line.

Content:
{{content}}`,
  'theological-links': `Identify any theological concepts, biblical references, or spiritual themes in this note.
List them with brief explanations.

Content:
{{content}}`,
};

export function fillPromptTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
