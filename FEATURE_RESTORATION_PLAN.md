# Feature Restoration Plan for Theophysics Plugins

## 🎯 Goal
Restore full functionality from original plugins with improved features.

---

## 📦 Plugin Status Summary

### ✅ Already Installed (4 plugins)

1. **theophysics-glossary-plus** ✅ COMPLETE
   - Wikipedia API integration
   - Custom templates
   - Dual linking

2. **theophysics-trail-weaver** ✅ COMPLETE
   - Concept linking
   - Grace trails
   - Trail visualization

3. **theophysics-sync-manager** ✅ COMPLETE (This is the "Ontology Plugin")
   - PostgreSQL sync
   - Connection string configured
   - See: `D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\QUICK_START.md`

4. **theophysics-semantic-tagger-v2** ⚠️ NEEDS FEATURES RESTORED
   - Current: Has batch processing infrastructure
   - Missing: AI prompts and semantic tagging logic

---

## 🔧 SEMANTIC TAGGER V2 - Missing Features

### What It Currently Has:
- ✅ Batch processing (10 files at a time)
- ✅ Resume functionality (if interrupted)
- ✅ Error logging
- ✅ Memory-safe file reading (handles encoding issues)

### What It's Missing (FROM ORIGINAL):

#### 1. **Built-in Prompts** (5-6 standard prompts)
The original had prompts like:
- "Extract key concepts"
- "Generate semantic tags"
- "Identify axiom references"
- "Summarize main argument"
- "Extract mathematical formulas"
- "Find theological connections"

#### 2. **Custom Prompt System**
- User can add their own prompts
- Save prompts to vault/plugin settings
- Select from dropdown when running
- Apply different prompts to different folders

#### 3. **Folder-Based Processing**
- Right-click folder → "Tag this folder with prompt X"
- Process all notes in folder with selected prompt
- Batch process entire folder trees

#### 4. **AI Integration**
- Connection to OpenAI/Anthropic/Ollama
- Local LLM support (Ollama)
- API key management
- Model selection (GPT-4, Claude, Llama, etc.)

#### 5. **Tag/Frontmatter Insertion**
- Automatically insert tags into frontmatter
- Append results to note
- Create "AI Insights" section
- Update existing tags without duplication

---

## 📋 Implementation Checklist

### Phase 1: Settings Panel
- [ ] Create settings tab with:
  - API provider dropdown (OpenAI, Anthropic, Ollama)
  - API key field (encrypted storage)
  - Model selection
  - Default chunk size
  - Output format preferences

### Phase 2: Built-in Prompts
- [ ] Add 6 default prompts:
  ```typescript
  const BUILTIN_PROMPTS = {
    "extract-concepts": "Extract 3-5 key concepts from this note...",
    "generate-tags": "Generate semantic tags (keywords) for this note...",
    "axiom-refs": "Identify references to Theophysics axioms (P0, O1, etc.)...",
    "summarize": "Provide a 1-2 sentence summary of the main argument...",
    "math-extract": "Extract all mathematical formulas and equations...",
    "theological-links": "Identify theological/biblical connections..."
  };
  ```

### Phase 3: Custom Prompts
- [ ] Custom prompt manager UI
- [ ] Save custom prompts to `.obsidian/plugins/semantic-tagger-v2/prompts.json`
- [ ] CRUD operations (Create, Read, Update, Delete)
- [ ] Prompt templates with variables like `{{note_title}}`, `{{folder}}`, etc.

### Phase 4: Folder Processing
- [ ] Add ribbon icon for "Tag Current Folder"
- [ ] Context menu: Right-click folder → "Semantic Tag..."
- [ ] Prompt selection modal before processing
- [ ] Progress indicator with folder stats

### Phase 5: AI Integration
- [ ] OpenAI API client
- [ ] Anthropic API client
- [ ] Ollama local client (http://localhost:11434)
- [ ] Streaming responses (for real-time feedback)
- [ ] Rate limiting and retry logic
- [ ] Token counting

### Phase 6: Output Formatting
- [ ] Insert tags in YAML frontmatter
- [ ] Create "## AI Insights" section
- [ ] Append to existing content
- [ ] Create separate `.ai-notes.md` files

---

## 🔗 "Ontology Plugin" = Sync Manager

**The "ontology plug" you mentioned IS the `theophysics-sync-manager`!**

**It already:**
- ✅ Connects to PostgreSQL
- ✅ Shows sync status
- ✅ Works with your database (192.168.1.177:2665/theophysics)

**Quick Start:**
```
D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\QUICK_START.md
```

---

## 📝 Next Steps

### Option 1: Full Restoration (Recommended)
Give Codex these instructions to restore all features to `semantic-tagger-v2`:

**File to modify:**
```
D:\Synology\PLUGIN-OBS-CODEX\theophysics-semantic-tagger-v2\src\main.ts
```

**Add:**
1. Settings interface with API configuration
2. 6 built-in prompts
3. Custom prompt manager
4. Folder context menu
5. AI provider integration (OpenAI, Anthropic, Ollama)
6. Frontmatter tag insertion

### Option 2: Keep It Simple
Just add the 6 built-in prompts with Ollama support (local LLM, no API keys needed).

---

## 🎓 Reference: Original Plugin Features

### What the Original Semantic AI Plugin Did:
1. **Command Palette:**
   - "Run Prompt: Extract Concepts"
   - "Run Prompt: Generate Tags"
   - "Run Prompt: (custom prompt name)"

2. **Folder Processing:**
   - Right-click folder
   - "Semantic Tag with..."
   - Select prompt
   - Process all notes

3. **Custom Prompts:**
   - Settings → "Add Custom Prompt"
   - Name, prompt text, output location
   - Save to vault

4. **Output Options:**
   - Inline (append to note)
   - Frontmatter (YAML tags)
   - Separate file (create `.ai-insights.md`)

---

## 💡 Recommendations

1. **Restore semantic-tagger-v2 first** (most used)
2. **Use Ollama** for local LLM (no API costs)
3. **Keep sync-manager running** in background (ontology plugin)
4. **Test on small folder first** (10-20 notes)

---

**Ready to restore features? I can create the full implementation instructions for Codex.**
