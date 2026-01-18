# Codex AI Instructions - Theophysics Semantic Tagger v2

**Plugin Name:** Theophysics Semantic Tagger v2  
**Purpose:** AI-powered semantic tagging with streaming, built-in prompts, and folder-batch processing  
**AI Assistant:** Cursor/Codex

---

## What This Plugin Does

An intelligent tagging system that uses AI to:
- Generate semantic tags from note content
- Extract key concepts and themes
- Identify axiom references automatically
- Process entire folders in batch
- Support custom AI prompts
- Stream results in real-time

**Use Case:** Automatically organizing large research vaults with consistent, meaningful tags using AI analysis.

---

## Core Architecture

```
theophysics-semantic-tagger-v2/
├── src/
│   ├── main.ts              (plugin entry, commands)
│   ├── settings.ts          (AI config, prompts)
│   ├── ai-client.ts         (Ollama/OpenAI/Anthropic)
│   ├── prompts.ts           (built-in prompt library)
│   ├── batch-processor.ts   (folder processing)
│   └── tag-writer.ts        (frontmatter injection)
├── manifest.json
├── package.json
└── README.md
```

---

## Key Components Explained

### 1. AI Client (`ai-client.ts`)
Unified interface for multiple AI providers.

**Supported Providers:**
- **Ollama** (local, free): `llama2`, `mistral`, `codellama`
- **OpenAI** (cloud): `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Anthropic** (cloud): `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`

**Core Interface:**
```typescript
class AIClient {
  constructor(private settings: SemanticTaggerSettings) {}
  
  async runPrompt(prompt: string): Promise<string> {
    switch (this.settings.aiProvider) {
      case 'ollama':
        return await this.runOllama(prompt);
      case 'openai':
        return await this.runOpenAI(prompt);
      case 'anthropic':
        return await this.runAnthropic(prompt);
    }
  }
  
  async *streamPrompt(prompt: string): AsyncGenerator<string> {
    // Streaming implementation for real-time feedback
    // Yields chunks as they arrive
  }
}
```

**Ollama Implementation:**
```typescript
private async runOllama(prompt: string): Promise<string> {
  const url = `${this.settings.ollamaUrl}/api/generate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: this.settings.model,
      prompt: prompt,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

**OpenAI Implementation:**
```typescript
private async runOpenAI(prompt: string): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: this.settings.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3  // Lower = more consistent tags
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 2. Built-in Prompts (`prompts.ts`)
Six specialized prompts for different tagging needs.

**Prompt Library:**
```typescript
export const BUILTIN_PROMPTS: Record<string, string> = {
  // 1. Concept Extraction
  'extract-concepts': `Analyze this note and extract 3-5 key concepts or themes.
Return ONLY the concepts as comma-separated tags (lowercase, hyphen-separated).
Example: coherence-theory, moral-decline, grace-dynamics

Note:
{{content}}

Tags:`,

  // 2. General Semantic Tagging
  'generate-tags': `Generate 5-10 semantic tags for this note.
Tags should capture the main topics, themes, and subject matter.
Format: lowercase, hyphen-separated, comma-delimited.

Note:
{{content}}

Tags:`,

  // 3. Axiom Reference Detection
  'axiom-refs': `Identify any references to Theophysics axioms (P0-P7 tiers) in this note.
If axioms are mentioned, return tags like: axiom-p3-grace, axiom-p5-coherence
If no axioms found, return: no-axiom-refs

Note:
{{content}}

Tags:`,

  // 4. Summarization
  'summarize': `Provide a concise 1-2 sentence summary of this note's main point.

Note:
{{content}}

Summary:`,

  // 5. Mathematical Formula Extraction
  'math-extract': `Extract all mathematical formulas, equations, and symbols from this note.
Return them in LaTeX format, one per line.

Note:
{{content}}

Formulas:`,

  // 6. Theological Concept Linking
  'theological-links': `Identify any theological concepts, biblical references, or spiritual themes.
Return as tags: theology-grace, biblical-romans, spiritual-fruit

Note:
{{content}}

Tags:`
};
```

**Template Variable Substitution:**
```typescript
export function fillPromptTemplate(
  template: string, 
  vars: Record<string, string>
): string {
  let filled = template;
  for (const [key, value] of Object.entries(vars)) {
    filled = filled.replace(`{{${key}}}`, value);
  }
  return filled;
}
```

**Usage:**
```typescript
const prompt = BUILTIN_PROMPTS['generate-tags'];
const filled = fillPromptTemplate(prompt, { 
  content: noteContent 
});
const tags = await aiClient.runPrompt(filled);
```

### 3. Batch Processor (`batch-processor.ts`)
Process entire folders efficiently.

**Core Method:**
```typescript
async processFolderBatch(
  folder: TFolder,
  promptKey: string,
  onProgress: (current: number, total: number) => void
): Promise<BatchResult> {
  const files = folder.children.filter(
    f => f instanceof TFile && f.extension === 'md'
  );
  
  const results: FileResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as TFile;
    onProgress(i + 1, files.length);
    
    try {
      const content = await this.app.vault.read(file);
      const tags = await this.processFile(content, promptKey);
      
      await this.tagWriter.addTags(file, tags);
      results.push({ file: file.path, success: true, tags });
      
    } catch (error) {
      results.push({ 
        file: file.path, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return {
    total: files.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}
```

**Progress UI:**
```typescript
// Shows modal with progress bar
class BatchProgressModal extends Modal {
  constructor(
    app: App,
    private totalFiles: number,
    private onCancel: () => void
  ) {
    super(app);
  }
  
  updateProgress(current: number, total: number) {
    const percent = (current / total) * 100;
    this.progressBar.setValue(percent);
    this.statusText.setText(`Processing ${current}/${total} files...`);
  }
}
```

### 4. Tag Writer (`tag-writer.ts`)
Safely inject tags into frontmatter without corrupting file.

**Frontmatter Handling:**
```typescript
async addTags(file: TFile, newTags: string[]): Promise<void> {
  const content = await this.app.vault.read(file);
  
  // Parse existing frontmatter
  const frontmatter = this.parseFrontmatter(content);
  
  // Get existing tags
  const existingTags = frontmatter.tags || [];
  
  // Merge (deduplicate)
  const allTags = [...new Set([...existingTags, ...newTags])];
  
  // Update frontmatter
  frontmatter.tags = allTags;
  
  // Rewrite file
  const newContent = this.rebuildFile(frontmatter, content);
  await this.app.vault.modify(file, newContent);
}
```

**Frontmatter Format:**
```yaml
---
tags:
  - coherence-theory
  - moral-decline
  - usa-analysis
  - axiom-p3-grace
ai_generated: true
ai_model: llama2
ai_date: 2026-01-15
---
```

**Append vs. Separate Modes:**
```typescript
// Setting: outputFormat
// Options:
// 1. 'frontmatter' - Add to existing tags in YAML
// 2. 'append' - Add to end of document as inline tags
// 3. 'separate' - Create companion file (note.tags.md)

async writeTags(file: TFile, tags: string[], mode: OutputFormat) {
  switch (mode) {
    case 'frontmatter':
      await this.addToFrontmatter(file, tags);
      break;
    case 'append':
      await this.appendToContent(file, tags);
      break;
    case 'separate':
      await this.createTagsFile(file, tags);
      break;
  }
}
```

### 5. Settings (`settings.ts`)
Configuration for AI providers and behavior.

**Settings Interface:**
```typescript
export interface SemanticTaggerSettings {
  // AI Provider
  aiProvider: 'openai' | 'anthropic' | 'ollama';
  apiKey: string;                    // For OpenAI/Anthropic
  model: string;                     // Model name
  ollamaUrl: string;                 // For local Ollama
  
  // Output
  outputFormat: 'frontmatter' | 'append' | 'separate';
  addMetadata: boolean;              // Include AI model, date
  
  // Custom Prompts
  customPrompts: Record<string, string>;  // User-defined
  
  // Batch Processing
  batchSize: number;                 // Process N files at a time
  delayBetweenRequests: number;      // Rate limiting (ms)
  skipFilesWithTags: boolean;        // Don't reprocess tagged files
}

export const DEFAULT_SETTINGS: SemanticTaggerSettings = {
  aiProvider: 'ollama',
  apiKey: '',
  model: 'llama2',
  ollamaUrl: 'http://localhost:11434',
  outputFormat: 'frontmatter',
  addMetadata: true,
  customPrompts: {},
  batchSize: 5,
  delayBetweenRequests: 1000,
  skipFilesWithTags: false
};
```

---

## Commands Available

### 1. Tag Current File
```typescript
this.addCommand({
  id: 'tag-current-file',
  name: 'Tag Current File with AI',
  editorCallback: async (editor: Editor, view: MarkdownView) => {
    const file = view.file;
    const content = editor.getValue();
    
    // Show prompt selector
    const promptKey = await this.selectPrompt();
    
    // Generate tags
    const tags = await this.processSingleFile(content, promptKey);
    
    // Write to file
    await this.tagWriter.addTags(file, tags);
    
    new Notice(`Added ${tags.length} tags`);
  }
});
```

### 2. Tag Folder
```typescript
this.addCommand({
  id: 'tag-folder',
  name: 'Tag Folder with AI',
  callback: async () => {
    // Show folder picker
    const folder = await this.selectFolder();
    
    // Show prompt selector
    const promptKey = await this.selectPrompt();
    
    // Show progress modal
    const modal = new BatchProgressModal(this.app, folder.children.length);
    modal.open();
    
    // Process
    const results = await this.batchProcessor.processFolderBatch(
      folder,
      promptKey,
      (current, total) => modal.updateProgress(current, total)
    );
    
    modal.close();
    
    // Show results
    new Notice(
      `Tagged ${results.succeeded}/${results.total} files`
    );
  }
});
```

### 3. Built-in Prompts (×6)
Each built-in prompt gets its own command:

```typescript
for (const [key, prompt] of Object.entries(BUILTIN_PROMPTS)) {
  this.addCommand({
    id: `builtin-${key}`,
    name: `AI: ${this.formatPromptName(key)}`,
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const content = editor.getValue();
      const result = await this.runBuiltinPrompt(key, content);
      
      if (key.includes('tag')) {
        await this.tagWriter.addTags(view.file, result.split(','));
      } else {
        // For summarize, math-extract: show in notice
        new Notice(result, 10000);
      }
    }
  });
}
```

### 4. Custom Prompt
```typescript
this.addCommand({
  id: 'run-custom-prompt',
  name: 'Run Custom Prompt',
  callback: async () => {
    const customPrompts = this.settings.customPrompts;
    
    // Show list of custom prompts
    const promptKey = await this.selectCustomPrompt();
    
    // Run on current file
    const file = this.app.workspace.getActiveFile();
    const content = await this.app.vault.read(file);
    
    const result = await this.runCustomPrompt(promptKey, content);
    
    // Handle result based on prompt type
    await this.handlePromptResult(file, result);
  }
});
```

---

## Right-Click Context Menus

### File Menu
```typescript
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    if (file instanceof TFile && file.extension === 'md') {
      menu.addItem((item) => {
        item.setTitle('AI Tag This File')
           .setIcon('tag')
           .onClick(async () => {
             // Process single file
             await this.tagSingleFile(file);
           });
      });
    }
  })
);
```

### Folder Menu
```typescript
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    if (file instanceof TFolder) {
      menu.addItem((item) => {
        item.setTitle('AI Tag All Files in Folder')
           .setIcon('folder-tag')
           .onClick(async () => {
             // Show prompt selector
             const promptKey = await this.selectPrompt();
             
             // Process folder
             await this.tagFolder(file, promptKey);
           });
      });
    }
  })
);
```

---

## Custom Prompt Creation

**UI Flow:**
1. Settings → "Custom Prompts" section
2. Click "Add New Prompt"
3. Fill in:
   - Name (e.g., "Extract Research Questions")
   - Prompt template with variables
   - Expected output format
4. Save

**Example Custom Prompt:**
```typescript
// Name: "Extract Research Questions"
// Prompt:
`Read this research note and extract all explicit and implicit 
research questions.

Note:
{{content}}

Return as numbered list:
1. [question]
2. [question]
...`

// Usage:
const customPrompts = {
  'extract-research-questions': {
    name: 'Extract Research Questions',
    prompt: '...',
    outputType: 'list'
  }
};
```

---

## Streaming Implementation

**Why Streaming:**
- Large notes take time to process
- User sees progress in real-time
- Can cancel if AI goes off-track

**Implementation:**
```typescript
async *streamTagGeneration(content: string): AsyncGenerator<string> {
  const prompt = fillPromptTemplate(
    BUILTIN_PROMPTS['generate-tags'],
    { content }
  );
  
  for await (const chunk of this.aiClient.streamPrompt(prompt)) {
    yield chunk;
  }
}

// Usage in UI:
const modal = new StreamingResultModal(this.app);
modal.open();

for await (const chunk of this.streamTagGeneration(content)) {
  modal.appendText(chunk);
}

modal.showDoneButton();
```

---

## Error Handling

### AI Provider Errors
```typescript
try {
  const tags = await this.aiClient.runPrompt(prompt);
} catch (error) {
  if (error.message.includes('rate limit')) {
    new Notice('Rate limit hit. Waiting 60 seconds...');
    await this.sleep(60000);
    return await this.aiClient.runPrompt(prompt);
    
  } else if (error.message.includes('API key')) {
    new Notice('Invalid API key. Check settings.');
    return [];
    
  } else if (error.message.includes('timeout')) {
    new Notice('Request timed out. Try a smaller note or simpler prompt.');
    return [];
    
  } else {
    console.error('AI error:', error);
    new Notice(`AI error: ${error.message}`);
    return [];
  }
}
```

### Invalid Tag Format
```typescript
function parseTagsFromAIResponse(response: string): string[] {
  // AI might return:
  // "tags: concept-1, concept-2"
  // or: "concept-1\nconcept-2"
  // or: "Tags:\n- concept-1\n- concept-2"
  
  // Normalize
  let cleaned = response
    .replace(/^tags:\s*/i, '')
    .replace(/^-\s*/gm, '')
    .replace(/\n/g, ',')
    .toLowerCase();
  
  // Split and clean
  const tags = cleaned
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .filter(t => /^[a-z0-9-]+$/.test(t));  // Valid format
  
  return tags;
}
```

---

## Performance Optimization

### Batch Processing with Rate Limits
```typescript
async processBatch(
  files: TFile[],
  batchSize: number,
  delayMs: number
): Promise<void> {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    // Process batch in parallel
    await Promise.all(
      batch.map(f => this.processFile(f))
    );
    
    // Wait before next batch (rate limiting)
    if (i + batchSize < files.length) {
      await this.sleep(delayMs);
    }
  }
}
```

### Caching
```typescript
// Cache AI results to avoid reprocessing
class TagCache {
  private cache = new Map<string, CacheEntry>();
  
  async get(fileHash: string): Promise<string[] | null> {
    const entry = this.cache.get(fileHash);
    if (!entry) return null;
    
    // Check if still valid (24 hours)
    if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
      this.cache.delete(fileHash);
      return null;
    }
    
    return entry.tags;
  }
  
  set(fileHash: string, tags: string[]): void {
    this.cache.set(fileHash, {
      tags,
      timestamp: Date.now()
    });
  }
}
```

---

## Development & Testing

```bash
# Build
npm run build

# Watch mode
npm run dev

# Test with sample note
node test_tagger.js sample_note.md

# Install to Obsidian vault
cp main.js manifest.json /path/to/vault/.obsidian/plugins/theophysics-semantic-tagger-v2/
```

**Test Cases:**
1. Single file tagging
2. Folder batch processing (10 files)
3. Streaming UI responsiveness
4. Error handling (invalid API key, network failure)
5. Custom prompt execution
6. Tag deduplication

---

**This plugin is production-ready with full AI integration. Use these instructions for modifications and extensions.**
