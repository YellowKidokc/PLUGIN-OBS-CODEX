# Theophysics Semantic Tagger v2

Streaming semantic tagging workflow with robust encoding handling, AI prompt support, and resumable batches.

## Features
- Stream processing (10 files at a time)
- Encoding fallbacks (UTF-8 with BOM, Windows-1252)
- Progress saved between chunks with resume support
- Built-in AI prompts and custom prompt selection
- Folder tagging via context menu
- Output formats: frontmatter tags, append, or separate file
Streaming semantic tagging workflow with robust encoding handling and resumable batches.

## Fixes Included
- Stream processing (10 files at a time)
- Encoding fallbacks (UTF-8 with BOM, Windows-1252)
- Progress saved between chunks with resume support

## Installation
1. Copy this plugin folder into `.obsidian/plugins/`.
2. Run `npm install` and `npm run build`.
3. Enable the plugin in Obsidian.

## Usage
- Command palette → **Run semantic tagger (streamed)**
- Command palette → **Resume semantic tagging** to continue after an interruption.

## Progress Files
- `.theophysics-batch-progress.json` – saved state between chunks
- `.theophysics-batch-errors.log` – error log
