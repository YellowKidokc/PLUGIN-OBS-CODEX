# Theophysics Trail Weaver

Create numbered trails and concept stories across papers and notes to follow narrative threads.

## Features
- Custom trail link syntax: `[[Concept]]^trail-name-1`
- Trail dashboard with trail page generation
- Tag trail mentions via modal
- Story generator for keyword-centric narratives
- Context window slider to capture nearby words
- Scope controls (note, folder, vault)
- Dedicated story folder + story index JSON

## Installation
1. Copy this plugin folder into `.obsidian/plugins/`.
2. Run `npm install` and `npm run build`.
3. Enable the plugin in Obsidian settings.

## Usage
- **Create new trail**: Command palette → Create new trail.
- **Tag trail mention**: Command palette → Tag trail mention.
- **Open trail dashboard**: Generate trail pages for each trail.
- **Create story**: Select a term, right-click → Trail Weaver: Create story.

## Story Notes
Story notes are generated in the configured story folder. Each story includes:
- A numbered scene list with mention counts
- Context snippets with a configurable word window
- Preserved narrative sections for your curated bridges

## Settings
- Story folder path
- Default scope (note/folder/vault)
- Context window size (0-200 words)
- Scene order (first mention or mention count)
- Optional synonym inclusion
