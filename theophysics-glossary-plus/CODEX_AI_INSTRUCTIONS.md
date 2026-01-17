# Codex AI Instructions - Theophysics Glossary Plus

**Plugin Name:** Theophysics Glossary Plus  
**Purpose:** Dual-link glossary system with Wikipedia integration, custom templates, and hover previews  
**AI Assistant:** Cursor/Codex

---

## What This Plugin Does

A sophisticated glossary management system for Obsidian that:
- Creates bidirectional links between definitions and notes
- Fetches definitions from Wikipedia automatically
- Provides custom templates for different definition types
- Shows hover previews for quick reference
- Validates definition structure and completeness

**Use Case:** Managing technical terminology, theological concepts, and research definitions with consistent formatting and automatic linking.

---

## Core Architecture

```
theophysics-glossary-plus/
├── src/
│   ├── main.ts                  (plugin entry, event handlers)
│   ├── definition-manager.ts    (CRUD operations, storage)
│   ├── dual-link-handler.ts     (bidirectional linking engine)
│   ├── wikipedia-api.ts         (external API fetching)
│   ├── template-engine.ts       (definition templates)
│   ├── settings.ts              (plugin configuration)
│   ├── ui/
│   │   ├── add-definition-modal.ts
│   │   ├── edit-definition-modal.ts
│   │   ├── hover-preview.ts
│   │   └── template-editor.ts
│   └── utils/
│       ├── parser.ts            (markdown parsing)
│       └── validator.ts         (definition validation)
├── manifest.json
├── package.json
└── styles.css
```

---

## Key Components Explained

### 1. Definition Manager (`definition-manager.ts`)
Handles all definition storage and retrieval.

**Core Interface:**
```typescript
interface Definition {
  term: string;
  aliases: string[];
  content: string;
  template: string;
  source: 'manual' | 'wikipedia' | 'custom';
  created: string;
  modified: string;
  tags: string[];
  relatedTerms: string[];
}
```

**Key Methods:**
- `createDefinition(term, content, template)` - Create new definition file
- `updateDefinition(term, updates)` - Modify existing definition
- `getDefinition(term)` - Retrieve definition by term or alias
- `searchDefinitions(query)` - Search across all definitions
- `validateDefinition(content)` - Check structure and completeness

**Storage Format:**
Definitions are stored as markdown files in `_Definitions/` folder:

```markdown
---
term: "Coherence"
aliases: ["χ", "chi", "structural-coherence"]
template: "scientific"
source: "manual"
tags: ["physics", "theophysics", "metrics"]
relatedTerms: ["entropy", "grace", "drift"]
---

# Coherence (χ)

**Definition:** A measure of structural integrity...

**Mathematical Form:**
$$\chi = \frac{1}{9}\sum_{i=1}^{9} f_i$$

**Related Concepts:**
- [[Entropy]]
- [[Grace]]
- [[Drift]]

**Sources:**
- Theophysics Framework v2.0
```

### 2. Dual Link Handler (`dual-link-handler.ts`)
Creates bidirectional links automatically.

**How It Works:**
1. When a note mentions a defined term, plugin suggests creating a link
2. When link is created, plugin adds backlink in definition file
3. When definition is updated, all referring notes are notified

**Example:**
```typescript
// In your note "Moral Decline Analysis.md"
The decrease in coherence (χ) indicates...

// Plugin detects "coherence" matches definition
// Offers to convert to: [[Coherence|coherence]]

// In "_Definitions/Coherence.md", plugin adds:
## Referenced In
- [[Moral Decline Analysis]] (2 mentions)
- [[USA Framework Analysis]] (5 mentions)
```

**Key Methods:**
- `scanNoteForTerms(note)` - Find all matchable terms
- `createBidirectionalLink(source, target, term)` - Link and backlink
- `updateBacklinks(term)` - Refresh all backlinks for a term
- `suggestLinks(note)` - AI-powered link suggestions

### 3. Wikipedia Integration (`wikipedia-api.ts`)
Fetches and formats Wikipedia definitions.

**API Call:**
```typescript
async fetchWikipediaDefinition(term: string): Promise<WikiResult> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    title: data.title,
    extract: data.extract,
    url: data.content_urls.desktop.page,
    thumbnail: data.thumbnail?.source
  };
}
```

**Formatting:**
Plugin converts Wikipedia HTML to clean markdown:
- Removes citation markers `[1]`, `[2]`
- Converts HTML entities
- Extracts first paragraph as summary
- Adds original URL as source

### 4. Template Engine (`template-engine.ts`)
Provides structured templates for different definition types.

**Built-in Templates:**

**Scientific:**
```markdown
# {{term}}

**Definition:** {{summary}}

**Mathematical Form:**
{{formula}}

**Properties:**
- {{property1}}
- {{property2}}

**Related Concepts:**
{{related}}

**Sources:**
{{sources}}
```

**Theological:**
```markdown
# {{term}}

**Greek/Hebrew:** {{original}}

**Definition:** {{summary}}

**Biblical References:**
{{references}}

**Theological Significance:**
{{significance}}

**Related Concepts:**
{{related}}
```

**Custom:**
Users can create their own templates with variables.

**Usage:**
```typescript
const template = TemplateEngine.getTemplate('scientific');
const filled = template.fill({
  term: 'Coherence',
  summary: 'A measure of...',
  formula: '$$\\chi = ...$$',
  // ...
});
```

### 5. Hover Preview (`ui/hover-preview.ts`)
Shows definition preview on hover without opening file.

**Implementation:**
```typescript
this.registerEvent(
  this.app.workspace.on('hover-link', (event) => {
    const linkText = event.linktext;
    const definition = this.definitionManager.getDefinition(linkText);
    
    if (definition) {
      const preview = this.createPreviewPopover(definition);
      preview.show(event.source, event.targetEl);
    }
  })
);
```

**Preview Content:**
- Term and aliases
- First 2-3 sentences of definition
- Tags
- Link to full definition

---

## Plugin Settings

Located in `settings.ts`:

```typescript
interface GlossarySettings {
  // Storage
  definitionsFolder: string;           // Default: "_Definitions/"
  autoCreateFolder: boolean;           // Create folder if missing
  
  // Linking
  autoSuggestLinks: boolean;           // Suggest links while typing
  bidirectionalLinks: boolean;         // Create backlinks automatically
  linkFormat: 'wiki' | 'markdown';     // [[term]] or [term](link)
  
  // Wikipedia
  enableWikipedia: boolean;            // Allow Wikipedia fetching
  wikiLanguage: string;                // Default: "en"
  includeWikiThumbnail: boolean;       // Add images to definitions
  
  // Templates
  defaultTemplate: string;             // Default: "basic"
  customTemplates: Template[];         // User-defined templates
  
  // Validation
  requireTags: boolean;                // Enforce tags on definitions
  requireSources: boolean;             // Enforce source attribution
  warnIncomplete: boolean;             // Show warnings for missing fields
}
```

---

## Common Operations

### Creating a New Definition

**Manual:**
```typescript
// Command palette: "Create Definition"
// Opens modal with fields:
// - Term
// - Aliases (comma-separated)
// - Template selection
// - Content editor

const definition = await this.definitionManager.createDefinition({
  term: "Grace",
  aliases: ["G", "divine-grace"],
  template: "theological",
  content: "...",
  tags: ["theology", "theophysics"]
});
```

**From Wikipedia:**
```typescript
// Command palette: "Import from Wikipedia"
// Enters term, fetches, formats, and creates definition

const wikiData = await this.wikipedia.fetch("Grace (theology)");
const definition = this.templateEngine.fillTemplate(
  'theological',
  wikiData
);
await this.definitionManager.createDefinition(definition);
```

### Scanning Notes for Missing Definitions

```typescript
// Command palette: "Scan Vault for Undefined Terms"
// Finds frequently used terms without definitions

const undefinedTerms = await this.scanner.findUndefinedTerms({
  minFrequency: 3,           // Used at least 3 times
  excludeCommonWords: true,  // Skip "the", "and", etc.
  excludeTags: ['#exclude']  // Skip notes with this tag
});

// Returns:
// [
//   { term: "Logos", frequency: 15, notes: [...] },
//   { term: "Polis", frequency: 8, notes: [...] },
//   ...
// ]
```

### Updating Backlinks

```typescript
// When definition is renamed or content changes
await this.dualLinkHandler.updateAllBacklinks("old-term", "new-term");

// Scans entire vault
// Updates all [[old-term]] to [[new-term]]
// Preserves display text: [[new-term|old display]]
```

---

## AI Integration Points

### 1. Term Extraction
**Prompt:**
```
Given this note content, identify technical terms, proper nouns, 
and concepts that should have glossary definitions.

Content:
{note_content}

Return JSON:
{
  "terms": [
    {"term": "...", "type": "technical|proper|concept", "context": "..."},
    ...
  ]
}
```

### 2. Definition Generation
**Prompt:**
```
Create a glossary definition for the term "{term}" in the context 
of theophysics research.

Context from notes:
{surrounding_paragraphs}

Template: {template_structure}

Generate a clear, concise definition following the template.
```

### 3. Related Terms Suggestions
**Prompt:**
```
Given this definition of "{term}":
{definition_content}

And these existing glossary terms:
{all_terms}

Suggest 5-10 related terms that should be cross-referenced.
Return as JSON array of term names.
```

---

## Troubleshooting

### Links Not Being Created
**Check:**
- Settings → "Auto Suggest Links" is enabled
- Term exists in `_Definitions/` folder
- File name matches term exactly (case-sensitive)

**Fix:**
```typescript
// Rebuild term index
await this.definitionManager.rebuildIndex();
```

### Wikipedia Fetch Fails
**Common Issues:**
- Term not found on Wikipedia (try alternative spelling)
- Rate limiting (wait 1 minute)
- Network error

**Debug:**
```typescript
// Test Wikipedia API directly
const result = await this.wikipedia.fetch("Test Term");
console.log(result);
```

### Backlinks Not Updating
**Fix:**
```typescript
// Force update all backlinks
for (const def of this.definitionManager.getAllDefinitions()) {
  await this.dualLinkHandler.updateBacklinks(def.term);
}
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch for changes (dev mode)
npm run dev

# Test in Obsidian
# 1. Build plugin
# 2. Copy main.js, manifest.json, styles.css to vault/.obsidian/plugins/theophysics-glossary-plus/
# 3. Reload Obsidian
```

---

## Extension Ideas

### 1. Export Glossary
Generate a single markdown file with all definitions:
```typescript
async exportGlossary(format: 'markdown' | 'html' | 'pdf'): Promise<string> {
  const defs = await this.definitionManager.getAllDefinitions();
  // Sort alphabetically
  // Format according to template
  // Return compiled document
}
```

### 2. Glossary Graph View
Show relationships between terms:
```typescript
// Use Obsidian Graph API
this.app.workspace.registerViewType(
  'glossary-graph',
  (leaf) => new GlossaryGraphView(leaf, this.definitionManager)
);
```

### 3. AI-Powered Definition Suggestions
When user creates a new note, suggest definitions for technical terms:
```typescript
this.registerEvent(
  this.app.workspace.on('file-open', async (file) => {
    if (!file) return;
    
    const content = await this.app.vault.read(file);
    const terms = await this.aiExtractor.extractTerms(content);
    
    // Show notification
    new Notice(`Found ${terms.length} terms needing definitions`);
  })
);
```

---

## Complete Example: Creating a Scientific Definition

```typescript
// User runs command: "Create Definition from Selection"
// Selected text: "Coherence is a measure of structural integrity..."

async createDefinitionFromSelection() {
  const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
  if (!editor) return;
  
  const selection = editor.getSelection();
  
  // Extract term (first capitalized word)
  const term = selection.match(/\b[A-Z][a-z]+\b/)?.[0] || 
               await this.promptForTerm();
  
  // Choose template
  const template = await this.showTemplateSelector();
  
  // Fill template with AI
  const aiContent = await this.ai.generateDefinition(term, selection);
  
  // Create definition file
  const definition = {
    term,
    aliases: await this.ai.suggestAliases(term),
    content: aiContent,
    template,
    source: 'manual',
    tags: await this.ai.suggestTags(selection)
  };
  
  await this.definitionManager.createDefinition(definition);
  
  // Replace selection with link
  editor.replaceSelection(`[[${term}]]`);
  
  new Notice(`Definition created for ${term}`);
}
```

---

**This plugin is production-ready. Use these instructions when making modifications or extending functionality.**
