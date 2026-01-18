# Dual Schema PostgreSQL Pattern
## Full Vault Sync + Semantic Layer (Both to Same Database)

**Goal:** Two independent but complementary systems sharing one PostgreSQL database

---

## 🎯 The Setup

```
PostgreSQL Database: theophysics
├── vault schema          ← Full note sync (sync-manager)
│   ├── notes             ← Complete note content
│   ├── folders           ← Folder structure
│   └── sync_log          ← Sync history
│
└── semantic schema       ← Semantic layer (semantic-tagger)
    ├── files             ← Which files have been tagged
    └── tags              ← AI-generated tags
```

**Why this works:**
- Same database, different schemas = no conflicts
- Vault sync handles file content
- Semantic tagger handles AI metadata
- Each can be enabled/disabled independently

---

## 📋 Schema 1: Vault Sync (Full Notes)

```sql
-- Vault schema for complete note sync
CREATE SCHEMA IF NOT EXISTS vault;

-- Notes table (full content)
CREATE TABLE IF NOT EXISTS vault.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL UNIQUE,
    folder_path TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    content_hash TEXT,
    word_count INT,
    frontmatter JSONB,
    tags TEXT[],
    links TEXT[],
    created_at TIMESTAMPTZ,
    modified_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table (structure tracking)
CREATE TABLE IF NOT EXISTS vault.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL UNIQUE,
    parent_path TEXT,
    note_count INT DEFAULT 0,
    last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- Sync log (track what was synced when)
CREATE TABLE IF NOT EXISTS vault.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,  -- 'create', 'update', 'delete'
    note_path TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_folder ON vault.notes(folder_path);
CREATE INDEX IF NOT EXISTS idx_notes_hash ON vault.notes(content_hash);
CREATE INDEX IF NOT EXISTS idx_notes_modified ON vault.notes(modified_at);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON vault.folders(parent_path);
CREATE INDEX IF NOT EXISTS idx_sync_log_note ON vault.sync_log(note_path);
```

---

## 📋 Schema 2: Semantic Layer (AI Tags Only)

```sql
-- Semantic schema for AI-generated metadata
CREATE SCHEMA IF NOT EXISTS semantic;

-- Files table (which files have been semantically tagged)
CREATE TABLE IF NOT EXISTS semantic.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL UNIQUE,
    file_hash TEXT,
    folder_path TEXT NOT NULL,
    last_processed TIMESTAMPTZ DEFAULT NOW(),
    tag_count INT DEFAULT 0,
    metadata JSONB
);

-- Tags table (AI-generated tags)
CREATE TABLE IF NOT EXISTS semantic.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES semantic.files(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    tag_type TEXT,  -- 'ai-generated', 'axiom-ref', 'concept', etc.
    confidence DECIMAL(3,2) DEFAULT 1.00,
    ai_model TEXT,
    ai_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_folder ON semantic.files(folder_path);
CREATE INDEX IF NOT EXISTS idx_files_hash ON semantic.files(file_hash);
CREATE INDEX IF NOT EXISTS idx_tags_file ON semantic.tags(file_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON semantic.tags(tag);
CREATE INDEX IF NOT EXISTS idx_tags_type ON semantic.tags(tag_type);
```

---

## 🔧 Plugin 1: Sync Manager (Full Vault Sync)

### Purpose
Sync complete notes (content + metadata) to PostgreSQL for:
- Remote access
- Multi-device sync
- Backup
- Advanced querying

### Key Features
- **Folder selection** - Choose which folders to sync
- **Bidirectional sync** - Obsidian ↔ PostgreSQL
- **Conflict resolution** - Handle simultaneous edits
- **Selective sync** - Don't sync everything at once

### Settings
```typescript
interface SyncManagerSettings {
    postgresUrl: string;
    syncFolders: string[];        // Which folders to sync
    syncMode: 'manual' | 'auto';  // Manual or automatic
    conflictResolution: 'newest' | 'obsidian-wins' | 'postgres-wins' | 'manual';
    syncInterval: number;         // Minutes between auto-syncs
}
```

### Commands
```typescript
// Select folder to sync
this.addCommand({
    id: 'sync-folder',
    name: 'Sync Folder to PostgreSQL',
    callback: async () => {
        // Show folder picker
        const folder = await this.selectFolder();
        
        // Sync all notes in folder
        await this.syncFolderToPostgres(folder);
    }
});

// Sync current note
this.addCommand({
    id: 'sync-current-note',
    name: 'Sync Current Note to PostgreSQL',
    callback: async () => {
        const file = this.app.workspace.getActiveFile();
        await this.syncNoteToPostgres(file);
    }
});

// Pull from PostgreSQL
this.addCommand({
    id: 'pull-from-postgres',
    name: 'Pull Notes from PostgreSQL',
    callback: async () => {
        await this.pullNotesFromPostgres();
    }
});
```

---

## 🔧 Plugin 2: Semantic Tagger (AI Layer)

### Purpose
Add AI-generated semantic metadata without cluttering vault:
- AI-generated tags
- Concept extraction
- Axiom references
- Theme identification

### Key Features
- **Scope control** - Current file/folder only
- **AI integration** - OpenAI, Anthropic, Ollama
- **PostgreSQL storage** - Tags stored in `semantic` schema
- **Non-invasive** - Doesn't modify note files

### Settings
```typescript
interface SemanticTaggerSettings {
    postgresUrl: string;  // Same database, different schema
    aiProvider: 'openai' | 'anthropic' | 'ollama';
    apiKey: string;
    scanScope: 'current-file' | 'current-folder' | 'current-folder-recursive';
    maxFilesPerScan: number;
    addTagsToFrontmatter: boolean;  // Optional: also write to file
}
```

### Commands
```typescript
// Tag current file
this.addCommand({
    id: 'tag-current-file',
    name: 'AI Tag Current File',
    callback: async () => {
        const file = this.app.workspace.getActiveFile();
        const tags = await this.generateTagsWithAI(file);
        await this.db.saveFileTags(file.path, tags);
    }
});

// Tag current folder
this.addCommand({
    id: 'tag-folder',
    name: 'AI Tag Current Folder',
    callback: async () => {
        const folder = this.getCurrentFolder();
        await this.tagFolderFiles(folder);
    }
});
```

---

## 🎨 Unified Settings UI

Both plugins can share the same PostgreSQL connection but use different schemas:

```typescript
// In sync-manager settings
new Setting(containerEl)
    .setName('PostgreSQL Connection URL')
    .setDesc('postgresql://user:password@host:port/database')
    .addText(text => text
        .setValue(this.plugin.settings.postgresUrl)
        .onChange(async (value) => {
            this.plugin.settings.postgresUrl = value;
            await this.plugin.saveSettings();
        })
    );

new Setting(containerEl)
    .setName('Folders to Sync')
    .setDesc('Select which folders sync to PostgreSQL')
    .addButton(button => button
        .setButtonText('Select Folders')
        .onClick(() => {
            new FolderSelectorModal(this.app, this.plugin).open();
        })
    );

// Show currently synced folders
const folderList = containerEl.createEl('div', { cls: 'folder-list' });
this.plugin.settings.syncFolders.forEach(folder => {
    const item = folderList.createEl('div', { cls: 'folder-item' });
    item.createEl('span', { text: folder });
    
    const removeBtn = item.createEl('button', { text: '✕' });
    removeBtn.addEventListener('click', async () => {
        await this.plugin.removeSyncFolder(folder);
        this.display();
    });
});
```

---

## 🔄 How They Work Together

### Example Workflow

**User opens: "GO FOLDER/Foundational_Papers/Axiom_Analysis.md"**

1. **Sync Manager**:
   - Checks if "GO FOLDER" is in sync list
   - If yes: Syncs full note content to `vault.notes`
   - Stores: title, content, frontmatter, links, word count

2. **Semantic Tagger**:
   - User right-clicks → "AI Tag Current File"
   - Extracts concepts with AI: `axiom-theory`, `foundational-logic`, `p0-seed`
   - Stores tags in `semantic.tags` (linked to file via UUID)

3. **PostgreSQL State**:
   ```sql
   -- vault.notes table
   path: "GO FOLDER/Foundational_Papers/Axiom_Analysis.md"
   content: "full markdown content..."
   word_count: 2483
   
   -- semantic.files table
   file_path: "GO FOLDER/Foundational_Papers/Axiom_Analysis.md"
   tag_count: 3
   
   -- semantic.tags table
   tag: "axiom-theory", type: "ai-generated", model: "gpt-4"
   tag: "foundational-logic", type: "concept", model: "gpt-4"
   tag: "p0-seed", type: "axiom-ref", model: "gpt-4"
   ```

---

## 💡 Advanced Queries (Combining Both Schemas)

```sql
-- Find all notes in a folder with specific AI tags
SELECT 
    v.path,
    v.title,
    v.word_count,
    ARRAY_AGG(s.tag) as ai_tags
FROM vault.notes v
JOIN semantic.files sf ON v.path = sf.file_path
JOIN semantic.tags s ON sf.id = s.file_id
WHERE v.folder_path = 'GO FOLDER/Foundational_Papers'
    AND s.tag = 'axiom-theory'
GROUP BY v.path, v.title, v.word_count;

-- Find notes synced but not yet AI-tagged
SELECT v.path, v.modified_at
FROM vault.notes v
LEFT JOIN semantic.files sf ON v.path = sf.file_path
WHERE sf.id IS NULL
ORDER BY v.modified_at DESC;

-- Get semantic tag distribution across synced vault
SELECT 
    v.folder_path,
    s.tag,
    COUNT(*) as count
FROM vault.notes v
JOIN semantic.files sf ON v.path = sf.file_path
JOIN semantic.tags s ON sf.id = s.file_id
GROUP BY v.folder_path, s.tag
ORDER BY count DESC;
```

---

## 🛠️ Database Service (Shared Pattern)

Both plugins can use the same `DatabaseService` base class:

```typescript
// shared/database-service.ts
export class DatabaseService {
    protected pool: Pool | null = null;
    protected schema: string;
    
    constructor(connectionString: string, schema: string) {
        this.schema = schema;
        this.updateConnection(connectionString);
    }
    
    updateConnection(connectionString: string) {
        if (this.pool) {
            this.pool.end();
        }
        
        this.pool = new Pool({
            connectionString,
            ssl: false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        
        this.pool.on('error', (err) => {
            console.error(`${this.schema} DB error:`, err);
        });
    }
    
    async testConnection(): Promise<boolean> {
        if (!this.pool) return false;
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    
    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

// sync-manager uses it
export class VaultDatabaseService extends DatabaseService {
    constructor(connectionString: string) {
        super(connectionString, 'vault');
    }
    
    async initializeSchema() {
        // Create vault schema
    }
    
    async syncNote(note: Note) {
        // Sync to vault.notes
    }
}

// semantic-tagger uses it
export class SemanticDatabaseService extends DatabaseService {
    constructor(connectionString: string) {
        super(connectionString, 'semantic');
    }
    
    async initializeSchema() {
        // Create semantic schema
    }
    
    async saveFileTags(path: string, tags: Tag[]) {
        // Save to semantic.tags
    }
}
```

---

## ✅ Implementation Checklist

### Sync Manager
- [ ] Folder selector UI
- [ ] Bidirectional sync logic
- [ ] Conflict resolution
- [ ] vault schema initialization
- [ ] Manual sync command
- [ ] Auto-sync option
- [ ] Sync status indicator

### Semantic Tagger  
- [ ] AI provider integration (OpenAI/Anthropic/Ollama)
- [ ] Scope control (file/folder/recursive)
- [ ] semantic schema initialization
- [ ] Tag generation logic
- [ ] PostgreSQL storage
- [ ] Optional frontmatter injection
- [ ] Max files per scan safety

### Shared
- [ ] Same PostgreSQL connection string
- [ ] Different schemas (vault vs semantic)
- [ ] Test connection button
- [ ] Initialize schema button
- [ ] Connection pooling
- [ ] Transaction support
- [ ] UUID primary keys
- [ ] Proper indexes

---

## 🎯 User Experience

**User enables both plugins:**

1. **Initial Setup (One Time)**
   ```
   Settings → Sync Manager
   - PostgreSQL URL: postgresql://...@192.168.1.177:2665/theophysics
   - Test Connection ✓
   - Initialize Schema ✓
   - Select Folders: ☑ GO FOLDER, ☑ Canonical
   
   Settings → Semantic Tagger
   - PostgreSQL URL: (same as above)
   - Test Connection ✓
   - Initialize Schema ✓
   - AI Provider: OpenAI
   - Scan Scope: Current Folder
   ```

2. **Daily Use**
   ```
   User opens note in "GO FOLDER/Foundational_Papers/"
   
   - Sync happens automatically (or click "Sync Note")
   - Right-click → "AI Tag Current Folder"
   - Tags generated and stored to PostgreSQL
   - No frontmatter pollution (unless opted in)
   ```

3. **Querying**
   ```sql
   -- From any PostgreSQL client
   SELECT * FROM vault.notes WHERE folder_path = 'GO FOLDER';
   SELECT * FROM semantic.tags WHERE tag = 'axiom-theory';
   ```

---

## 🚀 This Gives You

1. **Full vault backup in PostgreSQL** (vault schema)
2. **AI semantic layer** (semantic schema)
3. **No vault pollution** (tags only in DB if you want)
4. **Advanced queries** (join both schemas)
5. **Independent operation** (enable one or both)
6. **Scalable** (add more schemas as needed)

---

**Both plugins share the database, use their own schemas, and don't interfere with each other.**

**The Word-ontology pattern works perfectly for both!**
