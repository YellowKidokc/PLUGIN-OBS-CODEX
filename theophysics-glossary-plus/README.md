# Theophysics Glossary Plus

Enhanced glossary/definition system for Obsidian, built for Theophysics research workflows.

## Features
- Hover previews for defined terms
- Right-click edit for definition files
- Wikipedia summaries (optional)
- External source links (SEP, PhilPapers, Scholarpedia, Wikipedia)
- Template-based definition page generation

## Installation
1. Clone this folder into your Obsidian `.obsidian/plugins/` directory.
2. Run `npm install` and `npm run build`.
3. Enable **Theophysics Glossary Plus** in Obsidian settings.

## Usage
- Command palette: **Add definition** to create a new definition file.
- Hover over a known term to view internal definitions and external links.
- Adjust settings to toggle external links or customize templates.

## Template Placeholders
- `{{TERM}}`
- `{{INTERNAL_DEFINITION}}`
- `{{SOURCE}}`
- `{{WIKIPEDIA_URL}}`
- `{{SEP_URL}}`
- `{{PHILPAPERS_URL}}`
- `{{SCHOLARPEDIA_URL}}`

## Troubleshooting
- If definitions are not appearing, ensure the definition folder path matches your settings.
- Refresh definitions using the **Refresh glossary definitions** command.
