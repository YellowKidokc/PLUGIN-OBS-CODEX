# Theophysics Sync Manager - Setup Instructions

## What This Plugin Does

Syncs your Obsidian vault (`O:\Theophysics_Master\TMSUB`) with PostgreSQL database (`192.168.1.177:2665/theophysics`).

---

## Installation Complete ✅

The Obsidian plugin is already installed at:
```
O:\Theophysics_Master\TMSUB\.obsidian\plugins\theophysics-sync-manager\
```

---

## How to Use

### Step 1: Start the Python Backend

**Double-click:**
```
D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\python-backend\START_SYNC_BACKEND.bat
```

**OR run in PowerShell:**
```powershell
cd "D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\python-backend"
python -m src.main
```

**You should see:**
```
INFO:     Uvicorn running on http://localhost:8000
```

**Keep this window open while using Obsidian!**

---

### Step 2: Enable Plugin in Obsidian

1. Open Obsidian
2. Settings → Community plugins
3. Turn OFF "Safe mode" (if not already)
4. Find **"Theophysics Sync Manager"**
5. Toggle it **ON**

---

### Step 3: Configure Plugin Settings

1. Click the gear icon next to "Theophysics Sync Manager"
2. Set **API Base URL** to: `http://localhost:8000`
3. Toggle **Auto-sync** to **ON** (if you want auto-sync on launch)
4. Close settings

---

### Step 4: Start Syncing

**In Obsidian, use Command Palette (Ctrl+P):**
- **"Sync: Manual Sync"** - Sync all notes now
- **"Sync: Dashboard"** - View sync status

---

## Connection Details

**PostgreSQL Database:**
```
Host:     192.168.1.177
Port:     2665
Database: theophysics
User:     Yellowkid
Password: Moss9pep28$
```

**Obsidian Vault:**
```
O:\Theophysics_Master\TMSUB
```

**Python Backend API:**
```
http://localhost:8000
```

---

## Troubleshooting

### Backend Won't Start

**Check Python dependencies:**
```bash
pip install psycopg2-binary python-dotenv uvicorn fastapi watchdog
```

### Obsidian Can't Connect

1. Make sure Python backend is running (Step 1)
2. Check API URL in plugin settings: `http://localhost:8000`
3. Check Windows Firewall isn't blocking port 8000

### Database Connection Failed

Test connection manually:
```bash
python -c "import psycopg2; conn = psycopg2.connect(host='192.168.1.177', port=2665, dbname='theophysics', user='Yellowkid', password='Moss9pep28$'); print('SUCCESS'); conn.close()"
```

---

## What Gets Synced

- **All markdown files** in your vault
- **YAML frontmatter** (parsed to JSON)
- **Tags** (extracted from frontmatter and content)
- **Links** (internal wikilinks)
- **Timestamps** (created, modified, synced)

---

## Database Schema

The plugin uses these tables (should already exist):
- `public.notes` - All your notes
- `public.vault_sources` - Vault metadata
- `sync_log` - Sync history
- `conflicts` - Conflict resolution (if enabled)

---

## Auto-Sync Workflow

1. You edit a note in Obsidian
2. Python backend detects change (WATCH_MODE=true)
3. Automatically syncs to PostgreSQL
4. No manual sync needed!

---

**Ready to test? Start the backend (Step 1) and enable the plugin (Step 2)!**
