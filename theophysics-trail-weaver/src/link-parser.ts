import { TFile } from 'obsidian';

export interface TrailMention {
  concept: string;
  trail: string;
  sequence: number;
  file: string;
  lineNumber: number;
  context: string;
}

export function parseTrailMentions(content: string, file: TFile): TrailMention[] {
  const regex = /\[\[([^\]]+)\]\]\^([a-z\-]+)-(\d+)/g;
  const mentions: TrailMention[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    mentions.push({
      concept: match[1],
      trail: match[2],
      sequence: parseInt(match[3], 10),
      file: file.path,
      lineNumber: getLineNumber(content, match.index),
      context: getContext(content, match.index),
    });
  }

  return mentions;
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function getContext(content: string, index: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + 80);
  return content.slice(start, end).replace(/\n/g, ' ').trim();
}
