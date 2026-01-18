import { App, TFile } from 'obsidian';

export async function readFileRobust(app: App, file: TFile): Promise<string> {
  try {
    const content = await app.vault.read(file);
    if (!content.includes('\uFFFD')) {
      return content;
    }
    throw new Error('UTF-8 decode failed');
  } catch (error) {
    try {
      const buffer = await app.vault.adapter.readBinary(file.path);
      const uint8 = new Uint8Array(buffer);
      let startIndex = 0;
      if (uint8[0] === 0xef && uint8[1] === 0xbb && uint8[2] === 0xbf) {
        startIndex = 3;
      }
      const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
      const utf8Content = utf8Decoder.decode(uint8.slice(startIndex));
      if (!utf8Content.includes('\uFFFD')) {
        return utf8Content;
      }
      const win1252Decoder = new TextDecoder('windows-1252', { fatal: false });
      return win1252Decoder.decode(uint8);
    } catch (binaryError) {
      console.error(`Failed to read ${file.path}:`, binaryError);
      throw new Error(`Cannot read file: ${file.path}`);
    }
  }
}

export function sanitizeContent(content: string): string {
  return content.normalize('NFC').replace(/\0/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
