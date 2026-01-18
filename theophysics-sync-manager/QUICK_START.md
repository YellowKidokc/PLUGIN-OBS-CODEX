# Theophysics Sync Manager - QUICK START

## 🎯 Goal
Sync your Obsidian vault to PostgreSQL database automatically.

---

## ✅ Installation Status

**Obsidian Plugin:** INSTALLED  
Location: `O:\Theophysics_Master\TMSUB\.obsidian\plugins\theophysics-sync-manager\`

**Python Backend:** READY  
Location: `D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\python-backend\`

**PostgreSQL Connection:** CONFIGURED  
```
192.168.1.177:2665/theophysics
User: Yellowkid
Database: theophysics
```

---

## 🚀 START HERE (3 Steps)

### **Step 1: Start Python Backend**

**Double-click this file:**
```
D:\Synology\PLUGIN-OBS-CODEX\theophysics-sync-manager\python-backend\START_SYNC_BACKEND.bat
```

**You should see:**
```
========================================
  Theophysics Sync Manager Backend
========================================

PostgreSQL: 192.168.1.177:2665/theophysics
Vault Path: O:\Theophysics_Master\TMSUB
API: http://localhost:8000

Starting Python backend...
INFO: Uvicorn running on http://localhost:8000
```

**✅ KEEP THIS WINDOW OPEN!**

---

### **Step 2: Enable Plugin in Obsidian**

1. Open Obsidian (vault: `O:\Theophysics_Master\TMSUB`)
2. **Settings** (gear icon bottom-left)
3. **Community plugins** (left sidebar)
4. **Turn OFF "Safe mode"** (if not already)
5. Find **"Theophysics Sync Manager"** in the list
6. **Toggle it ON**

---

### **Step 3: Test the Sync**

1. Press **Ctrl+P** (Command Palette)
2. Type: **"Sync"**
3. Select: **"Sync: Manual Sync"**

**You should see a success notification!**

---

## 📊 Plugin Settings (Optional)

**Settings → Theophysics Sync Manager:**

- **API Base URL:** `http://localhost:8000` ✅ (already set)
- **Auto-sync:** Toggle ON if you want automatic sync on launch

---

## 🔧 What Each Part Does

### **Python Backend** (Must run first!)
- Watches your vault for file changes
- Connects to PostgreSQL database
- Provides API for Obsidian plugin
- **Port:** 8000

### **Obsidian Plugin**
- Sends vault changes to Python backend
- Shows sync status dashboard
- Handles conflicts (if any)

### **PostgreSQL Database**
- Stores all notes, tags, links
- Enables querying your vault with SQL
- Backs up content automatically

---

## 💡 Usage Tips

### **Auto-Sync Workflow**
1. Edit a note in Obsidian
2. Backend detects change automatically
3. Syncs to PostgreSQL
4. No manual sync needed!

### **Manual Sync**
- **Ctrl+P** → "Sync: Manual Sync"
- Use when backend was offline

### **View Sync Status**
- **Ctrl+P** → "Sync: Dashboard"
- Shows last sync time, conflicts, etc.

---

## ⚠️ Troubleshooting

### **"Backend not responding"**
→ Make sure Step 1 (Python backend) is running!

### **"Connection refused"**
→ Check Windows Firewall isn't blocking port 8000

### **"Database error"**
→ Test PostgreSQL connection:
```bash
python -c "import psycopg2; conn = psycopg2.connect(host='192.168.1.177', port=2665, dbname='theophysics', user='Yellowkid', password='Moss9pep28$'); print('✅ SUCCESS'); conn.close()"
```

---

## 📁 Connection String (for reference)

**Full PostgreSQL URL:**
```
postgresql://Yellowkid:Moss9pep28$@192.168.1.177:2665/theophysics
```

**Env variables (already in `.env`):**
```
POSTGRES_HOST=192.168.1.177
POSTGRES_PORT=2665
POSTGRES_DB=theophysics
POSTGRES_USER=Yellowkid
POSTGRES_PASSWORD=Moss9pep28$
VAULT_PATH=O:\Theophysics_Master\TMSUB
```

---

## 🎓 Next Steps

After syncing works:
1. Query your vault with SQL in PostgreSQL
2. Build dashboards with your note data
3. Create cross-vault analytics
4. Export to Excel/CSV for analysis

---

**Ready? Start with Step 1! Double-click `START_SYNC_BACKEND.bat`**
