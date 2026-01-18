# Theophysics Glossary Plus

Enhanced glossary/definition system for Obsidian, built for Theophysics research workflows.

## Features
- Hover previews for defined terms
- Right-click edit for definition files
- Wikipedia summaries (optional)
- Wordnik etymology/examples (optional)
- External source links (SEP, PhilPapers, Scholarpedia, Wikipedia)
- Template-based definition page generation
- UUID-first Theophysics schema support

## Installation
1. Clone this folder into your Obsidian `.obsidian/plugins/` directory.
2. Run `npm install` and `npm run build`.
3. Enable **Theophysics Glossary Plus** in Obsidian settings.

## Usage
- Command palette: **Add definition** to create a new definition file.
- Hover over a known term to view internal definitions and external links.
- Adjust settings to toggle external links or customize templates.

## Template Placeholders
The default template supports the Theophysics term schema. Notable placeholders include:
- `{{UUID}}`, `{{TERM}}`, `{{ALIASES}}`, `{{NEAR_TERMS}}`
- `{{THEOPHYSICS_FORMAL}}`, `{{THEOPHYSICS_PLAIN}}`, `{{THEOPHYSICS_ONE_LINE}}`
- `{{STANDARD_PHYSICS}}`, `{{STANDARD_PHILOSOPHY}}`, `{{STANDARD_THEOLOGY}}`, `{{STANDARD_MATHEMATICS}}`
- `{{WIKIPEDIA_URL}}`, `{{WIKIPEDIA_SUMMARY}}`, `{{SEP_URL}}`, `{{PHILPAPERS_URL}}`
- `{{ETYMOLOGY}}`, `{{ORIGIN}}`, `{{STATUS}}`, `{{CONFIDENCE}}`

## Settings
- **Definition folder**: where to store definition files.
- **Use UUID filenames**: optionally store definitions as `{UUID}.md`.
- **Enable Wordnik integration**: provide a Wordnik API key to fetch etymology/examples.

## Troubleshooting
- If definitions are not appearing, ensure the definition folder path matches your settings.
- Refresh definitions using the **Refresh glossary definitions** command.
