export function validateFrontmatter(content: string): boolean {
  return content.trimStart().startsWith('---');
}
