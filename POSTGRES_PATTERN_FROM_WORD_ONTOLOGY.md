# PostgreSQL Pattern - Copy This Exactly

**Source:** Word-ontology plugin (the one that works perfectly)  
**Problem to Solve:** Semantic tagger and other plugins try to index entire vault → memory crash  
**Solution:** Use Word-ontology's PostgreSQL pattern + scope to current folder only

---

## ✅ What Makes Word-Ontology's PostgreSQL Perfect

### 1. Clean Schema Structure
```typescript
// Dedicated schema (not cluttering 'public')
CREATE SCHEMA IF NOT EXISTS epistemic

// Three tables with proper relationships
epistemic.statements        // The actual content
epistemic.types            // Classification categories  
epistemic.statement_types  // Many-to-many junction table
```

### 2. Connection Pooling (Not One-Off Connections)
```typescript
this.pool = new Pool({
    connectionString,
    ssl: false,
    max: 10,                      // Connection pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Handle pool errors gracefully
this.pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
    new Notice('Database connection error. Check console.');
});
```

### 3. Transaction Support
```typescript
const client = await this.pool.connect();
try {
    await client.query('BEGIN');
    
    // Do multiple operations
    await client.query('INSERT INTO ...');
    await client.query('INSERT INTO ...');
    
    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');  // Undo everything if anything fails
    throw error;
} finally {
    client.release();  // Always return connection to pool
}
```

### 4. UUID Primary Keys (Better than Auto-Increment)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 5. Proper Foreign Keys with CASCADE
```sql
statement_id UUID REFERENCES epistemic.statements(id) ON DELETE CASCADE
```
When you delete a statement, all its classifications are automatically deleted too.

### 6. Indexes for Performance
```sql
CREATE INDEX IF NOT EXISTS idx_statements_file
ON epistemic.statements(source_file)
```

### 7. Settings UI with Test Button
```typescript
// Test Connection Button
new Setting(containerEl)
    .setName('Test Database Connection')
    .addButton(button => button
        .setButtonText('Test Connection')
        .onClick(async () => {
            const isConnected = await this.plugin.db.testConnection();
            if (isConnected) {
                new Notice('✓ Database connection successful!');
            }
        })
    );

// Initialize Schema Button (safe to run multiple times)
new Setting(containerEl)
    .setName('Initialize Database Schema')
    .setDesc('Create tables and seed initial data (safe to run multiple times)')
    .addButton(button => button
        .setButtonText('Initialize Schema')
        .onClick(async () => {
            await this.plugin.db.initializeSchema();
            await this.plugin.db.seedTypes();
            new Notice('✓ Database schema initialized successfully!');
        })
    );
```

---

## 🔧 How to Apply This to Semantic Tagger

### Current Problem
```typescript
// BAD: Tries to process entire vault at once
async function scanVault() {
    const allFiles = this.app.vault.getMarkdownFiles();  // ALL FILES
    for (const file of allFiles) {
        await processFile(file);  // Memory explosion!
    }
}
```

### Solution: Scope to Current Folder Only
```typescript
// GOOD: Only process files in current folder
async function scanCurrentFolder() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice('Open a file first');
        return;
    }
    
    // Get current folder
    const currentFolder = activeFile.parent;
    
    // Get files ONLY in this folder (not subfolders)
    const filesInFolder = currentFolder.children
        .filter(f => f instanceof TFile && f.extension === 'md');
    
    new Notice(`Processing ${filesInFolder.length} files in ${currentFolder.path}`);
    
    for (const file of filesInFolder) {
        await processFile(file as TFile);
    }
}
```

### Optional: Add Depth Control
```typescript
// User settings
interface SemanticTaggerSettings {
    scanScope: 'current-file' | 'current-folder' | 'current-folder-recursive' | 'entire-vault';
    maxFilesPerScan: number;  // Safety limit (e.g., 100)
}

// Implementation
async function scanWithScope(scope: string) {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    let filesToProcess: TFile[] = [];
    
    switch (scope) {
        case 'current-file':
            filesToProcess = [activeFile];
            break;
            
        case 'current-folder':
            const folder = activeFile.parent;
            filesToProcess = folder.children
                .filter(f => f instanceof TFile && f.extension === 'md') as TFile[];
            break;
            
        case 'current-folder-recursive':
            const rootFolder = activeFile.parent;
            filesToProcess = this.getAllMarkdownFilesRecursive(rootFolder);
            break;
            
        case 'entire-vault':
            // Only if user explicitly confirms
            const confirm = await this.confirmLargeScan();
            if (!confirm) return;
            filesToProcess = this.app.vault.getMarkdownFiles();
            break;
    }
    
    // Safety check
    if (filesToProcess.length > this.settings.maxFilesPerScan) {
        new Notice(`Too many files (${filesToProcess.length}). Max is ${this.settings.maxFilesPerScan}. Use smaller scope.`);
        return;
    }
    
    // Process
    for (const file of filesToProcess) {
        await this.processFile(file);
    }
}
```

---

## 📋 Complete Schema for Semantic Tagger

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS semantic;

-- Files table (track which files have been processed)
CREATE TABLE IF NOT EXISTS semantic.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL UNIQUE,
    file_hash TEXT,  -- MD5 hash of content (detect changes)
    folder_path TEXT NOT NULL,
    last_processed TIMESTAMPTZ DEFAULT NOW(),
    tag_count INT DEFAULT 0,
    metadata JSONB
);

-- Tags table (the actual semantic tags)
CREATE TABLE IF NOT EXISTS semantic.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES semantic.files(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    tag_type TEXT,  -- 'ai-generated', 'manual', 'axiom-ref', etc.
    confidence DECIMAL(3,2) DEFAULT 1.00,
    ai_model TEXT,  -- 'gpt-4', 'claude-3', 'llama2', etc.
    ai_prompt TEXT,  -- Which prompt was used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_folder
ON semantic.files(folder_path);

CREATE INDEX IF NOT EXISTS idx_files_hash
ON semantic.files(file_hash);

CREATE INDEX IF NOT EXISTS idx_tags_file
ON semantic.tags(file_id);

CREATE INDEX IF NOT EXISTS idx_tags_tag
ON semantic.tags(tag);

CREATE INDEX IF NOT EXISTS idx_tags_type
ON semantic.tags(tag_type);
```

---

## 🎯 Database Service Pattern

```typescript
import { Pool, PoolClient } from 'pg';
import { Notice } from 'obsidian';

export class SemanticDatabaseService {
    private pool: Pool | null = null;
    
    constructor(connectionString: string) {
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
            console.error('Semantic DB error:', err);
            new Notice('Database connection error');
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
    
    async initializeSchema(): Promise<void> {
        if (!this.pool) throw new Error('Pool not initialized');
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Create schema
            await client.query('CREATE SCHEMA IF NOT EXISTS semantic');
            
            // Create files table
            await client.query(`
                CREATE TABLE IF NOT EXISTS semantic.files (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    file_path TEXT NOT NULL UNIQUE,
                    file_hash TEXT,
                    folder_path TEXT NOT NULL,
                    last_processed TIMESTAMPTZ DEFAULT NOW(),
                    tag_count INT DEFAULT 0,
                    metadata JSONB
                )
            `);
            
            // Create tags table
            await client.query(`
                CREATE TABLE IF NOT EXISTS semantic.tags (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    file_id UUID REFERENCES semantic.files(id) ON DELETE CASCADE,
                    tag TEXT NOT NULL,
                    tag_type TEXT,
                    confidence DECIMAL(3,2) DEFAULT 1.00,
                    ai_model TEXT,
                    ai_prompt TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    created_by TEXT
                )
            `);
            
            // Create indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_files_folder ON semantic.files(folder_path)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_files_hash ON semantic.files(file_hash)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_tags_file ON semantic.tags(file_id)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_tags_tag ON semantic.tags(tag)');
            
            await client.query('COMMIT');
            console.log('Semantic schema initialized');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Schema init failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveFileTags(
        filePath: string,
        folderPath: string,
        fileHash: string,
        tags: Array<{tag: string, type: string, confidence: number, model: string, prompt: string}>,
        username: string
    ): Promise<void> {
        if (!this.pool) throw new Error('Pool not initialized');
        
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // Upsert file record
            const fileResult = await client.query(`
                INSERT INTO semantic.files (file_path, file_hash, folder_path, tag_count)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (file_path) 
                DO UPDATE SET 
                    file_hash = EXCLUDED.file_hash,
                    last_processed = NOW(),
                    tag_count = EXCLUDED.tag_count
                RETURNING id
            `, [filePath, fileHash, folderPath, tags.length]);
            
            const fileId = fileResult.rows[0].id;
            
            // Delete old tags for this file
            await client.query('DELETE FROM semantic.tags WHERE file_id = $1', [fileId]);
            
            // Insert new tags
            for (const tag of tags) {
                await client.query(`
                    INSERT INTO semantic.tags 
                    (file_id, tag, tag_type, confidence, ai_model, ai_prompt, created_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [fileId, tag.tag, tag.type, tag.confidence, tag.model, tag.prompt, username]);
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Save tags failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getTagsForFile(filePath: string): Promise<any[]> {
        if (!this.pool) throw new Error('Pool not initialized');
        
        try {
            const result = await this.pool.query(`
                SELECT t.tag, t.tag_type, t.confidence, t.ai_model, t.created_at
                FROM semantic.tags t
                JOIN semantic.files f ON t.file_id = f.id
                WHERE f.file_path = $1
                ORDER BY t.created_at DESC
            `, [filePath]);
            
            return result.rows;
        } catch (error) {
            console.error('Get tags failed:', error);
            throw error;
        }
    }
    
    async getFilesInFolder(folderPath: string): Promise<any[]> {
        if (!this.pool) throw new Error('Pool not initialized');
        
        try {
            const result = await this.pool.query(`
                SELECT 
                    file_path, 
                    last_processed, 
                    tag_count,
                    ARRAY_AGG(DISTINCT t.tag) as tags
                FROM semantic.files f
                LEFT JOIN semantic.tags t ON f.id = t.file_id
                WHERE f.folder_path = $1
                GROUP BY f.file_path, f.last_processed, f.tag_count
                ORDER BY f.last_processed DESC
            `, [folderPath]);
            
            return result.rows;
        } catch (error) {
            console.error('Get folder files failed:', error);
            throw error;
        }
    }
    
    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}
```

---

## 🎨 Settings UI Pattern

```typescript
// In settings.ts

new Setting(containerEl)
    .setName('PostgreSQL Connection URL')
    .setDesc('postgresql://user:password@host:port/database')
    .addText(text => text
        .setPlaceholder('postgresql://postgres:password@192.168.1.177:2665/theophysics')
        .setValue(this.plugin.settings.postgresUrl)
        .onChange(async (value) => {
            this.plugin.settings.postgresUrl = value;
            await this.plugin.saveSettings();
            this.plugin.reconnectDatabase();
        })
    );

new Setting(containerEl)
    .setName('Test Database Connection')
    .addButton(button => button
        .setButtonText('Test Connection')
        .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText('Testing...');
            
            const isConnected = await this.plugin.db.testConnection();
            new Notice(isConnected ? '✓ Connected!' : '✗ Connection failed');
            
            setTimeout(() => {
                button.setDisabled(false);
                button.setButtonText('Test Connection');
            }, 2000);
        })
    );

new Setting(containerEl)
    .setName('Initialize Database Schema')
    .setDesc('Safe to run multiple times')
    .addButton(button => button
        .setButtonText('Initialize Schema')
        .onClick(async () => {
            try {
                await this.plugin.db.initializeSchema();
                new Notice('✓ Schema initialized!');
            } catch (error) {
                new Notice('✗ Failed: ' + error.message);
            }
        })
    );

new Setting(containerEl)
    .setName('Scan Scope')
    .setDesc('How many files to process at once')
    .addDropdown(dropdown => dropdown
        .addOption('current-file', 'Current File Only')
        .addOption('current-folder', 'Current Folder (No Subfolders)')
        .addOption('current-folder-recursive', 'Current Folder + Subfolders')
        .setValue(this.plugin.settings.scanScope)
        .onChange(async (value) => {
            this.plugin.settings.scanScope = value;
            await this.plugin.saveSettings();
        })
    );

new Setting(containerEl)
    .setName('Max Files Per Scan')
    .setDesc('Safety limit to prevent memory issues')
    .addSlider(slider => slider
        .setLimits(1, 500, 10)
        .setValue(this.plugin.settings.maxFilesPerScan)
        .setDynamicTooltip()
        .onChange(async (value) => {
            this.plugin.settings.maxFilesPerScan = value;
            await this.plugin.saveSettings();
        })
    );
```

---

## ✅ Checklist for Any Plugin Using PostgreSQL

- [ ] Use dedicated schema (not `public`)
- [ ] Use connection pooling (not single connections)
- [ ] Use transactions for multi-step operations
- [ ] Use UUID primary keys
- [ ] Use ON DELETE CASCADE for foreign keys
- [ ] Add indexes for commonly queried columns
- [ ] Add error handling for pool errors
- [ ] Always `release()` clients in `finally` blocks
- [ ] Add "Test Connection" button in settings
- [ ] Add "Initialize Schema" button (safe to run multiple times)
- [ ] Scope operations to current folder (not entire vault)
- [ ] Add max files per scan limit
- [ ] Store metadata in JSONB columns for flexibility

---

## 🚀 This Pattern Works For

- **Semantic Tagger** - AI-generated tags per file
- **Trail Weaver** - Link trails and graph data
- **Glossary Plus** - Definition cross-references
- **Sync Manager** - Bidirectional sync state

**Copy the Word-ontology database.ts file and adapt the schema to your needs. Everything else stays the same.**

---

**The Word-ontology plugin got it right. Just replicate that exact pattern.**
