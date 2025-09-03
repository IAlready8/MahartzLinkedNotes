/* store.js — Enhanced data model + persistence optimized for macOS */
// Enhanced configuration for better performance on macOS
localforage.config({ 
  name: 'mahart-linked-notes-d3-macbook', 
  storeName: 'kv',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  description: 'Mahart Linked Notes - Personal Knowledge Management System'
});

// Performance monitoring and optimization
const dbPerformance = {
  operations: [],
  logOperation(operation, duration, size = 0) {
    this.operations.push({
      operation,
      duration,
      size,
      timestamp: Date.now()
    });
    
    // Keep only last 100 operations for memory efficiency
    if (this.operations.length > 100) {
      this.operations.shift();
    }
  },
  
  getStats() {
    const recent = this.operations.slice(-20);
    const avgDuration = recent.reduce((sum, op) => sum + op.duration, 0) / recent.length;
    const totalSize = recent.reduce((sum, op) => sum + op.size, 0);
    
    return {
      averageDuration: Math.round(avgDuration),
      totalRecentSize: totalSize,
      operationCount: this.operations.length
    };
  }
};

const Store = {
  // Enhanced notes operations with performance tracking
  async allNotes(){
    const start = performance.now();
    try {
      const notes = (await localforage.getItem('notes')) || [];
      const duration = performance.now() - start;
      dbPerformance.logOperation('allNotes', duration, JSON.stringify(notes).length);
      return notes;
    } catch (error) {
      console.error('Failed to load notes:', error);
      return [];
    }
  },
  
  async saveNotes(arr){
    const start = performance.now();
    try {
      const size = JSON.stringify(arr).length;
      await localforage.setItem('notes', arr);
      const duration = performance.now() - start;
      dbPerformance.logOperation('saveNotes', duration, size);
      
      // Auto-backup for large datasets
      if (arr.length > 500) {
        this.autoBackup(arr);
      }
      
      return arr;
    } catch (error) {
      console.error('Failed to save notes:', error);
      throw error;
    }
  },
  
  // Auto-backup system for important data
  async autoBackup(notes) {
    try {
      const backupData = {
        notes,
        timestamp: nowISO(),
        hostname: 'D3-macbook',
        noteCount: notes.length
      };
      
      const backupKey = `backup_${Date.now()}`;
      await localforage.setItem(backupKey, backupData);
      
      // Keep only last 5 auto-backups
      const allKeys = await localforage.keys();
      const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort();
      
      if (backupKeys.length > 5) {
        const toDelete = backupKeys.slice(0, backupKeys.length - 5);
        for (const key of toDelete) {
          await localforage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Auto-backup failed:', error);
    }
  },
  
  // Enhanced export with metadata
  async exportEnhanced() {
    const notes = await this.allNotes();
    const events = await this.events();
    const stats = dbPerformance.getStats();
    
    return {
      metadata: {
        exportedAt: nowISO(),
        hostname: 'D3-macbook',
        version: '2.0.0',
        noteCount: notes.length,
        eventCount: events.length,
        performance: stats
      },
      notes,
      events,
      settings: await this.getSettings(),
      tags: this.extractAllTags(notes)
    };
  },
  
  // Extract unique tags for better organization
  extractAllTags(notes) {
    const tagMap = new Map();
    
    for (const note of notes) {
      if (note.tags) {
        for (const tag of note.tags) {
          if (tagMap.has(tag)) {
            tagMap.set(tag, tagMap.get(tag) + 1);
          } else {
            tagMap.set(tag, 1);
          }
        }
      }
    }
    
    return Object.fromEntries(
      Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1])
    );
  },
  async upsert(note){
    // Save version history before updating
    if(note.id) {
      const existing = await this.get(note.id);
      if(existing) {
        await this.saveVersion(note.id, existing);
      }
    }
    
    const ns = await this.allNotes();
    const i = ns.findIndex(n=>n.id===note.id);
    if(i>=0) ns[i]=note; else ns.push(note);
    await this.saveNotes(ns);
    return note;
  },
  async get(id){ return (await this.allNotes()).find(n=>n.id===id) },
  async byTitle(t){ return (await this.allNotes()).find(n=>n.title===t) },
  async wipe(){ await localforage.setItem('notes', []); },
  // analytics log
  async events(){ return (await localforage.getItem('events')) || []; },
  async log(ev){ const e=await this.events(); e.push(ev); await localforage.setItem('events', e); },
  async export(){ return { notes: await this.allNotes(), events: await this.events(), exportedAt: nowISO() } },
  async import(json){
    const start = performance.now();
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      
      if(Array.isArray(data.notes)) {
        await localforage.setItem('notes', data.notes);
        console.log(`Imported ${data.notes.length} notes`);
      }
      
      if(Array.isArray(data.events)) {
        await localforage.setItem('events', data.events);
        console.log(`Imported ${data.events.length} events`);
      }
      
      if(data.settings) {
        await this.saveSettings(data.settings);
        console.log('Imported settings');
      }
      
      const duration = performance.now() - start;
      dbPerformance.logOperation('import', duration, JSON.stringify(data).length);
      
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  },
  
  // Settings management
  async getSettings() {
    try {
      return (await localforage.getItem('settings')) || {
        theme: 'dark',
        autoSave: true,
        autoBackup: true,
        maxBackups: 5,
        performanceMode: false,
        syncEnabled: false
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  },
  
  async saveSettings(settings) {
    try {
      await localforage.setItem('settings', settings);
      return settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },
  
  // Database health and optimization
  async getDbHealth() {
    try {
      const notes = await this.allNotes();
      const events = await this.events();
      const allKeys = await localforage.keys();
      const performance = dbPerformance.getStats();
      
      // Calculate storage usage
      let totalSize = 0;
      for (const key of allKeys) {
        const item = await localforage.getItem(key);
        totalSize += JSON.stringify(item).length;
      }
      
      return {
        noteCount: notes.length,
        eventCount: events.length,
        totalKeys: allKeys.length,
        estimatedSize: Math.round(totalSize / 1024), // KB
        performance,
        backupCount: allKeys.filter(k => k.startsWith('backup_')).length,
        versionCount: allKeys.filter(k => k.startsWith('version_')).length,
        lastOperation: new Date(Math.max(...dbPerformance.operations.map(op => op.timestamp))).toISOString()
      };
    } catch (error) {
      console.error('Failed to get DB health:', error);
      return null;
    }
  },
  
  // Optimization methods for large datasets
  async optimizeDb() {
    try {
      console.log('Starting database optimization...');
      
      // Clean up old versions
      const allKeys = await localforage.keys();
      const versionKeys = allKeys.filter(key => key.startsWith('version_'));
      
      // Group by note ID and keep only recent versions
      const versionsByNote = {};
      for (const key of versionKeys) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const noteId = parts.slice(1, -1).join('_');
          if (!versionsByNote[noteId]) versionsByNote[noteId] = [];
          versionsByNote[noteId].push(key);
        }
      }
      
      let deletedVersions = 0;
      for (const [noteId, versions] of Object.entries(versionsByNote)) {
        if (versions.length > 10) {
          const sortedVersions = versions.sort();
          const toDelete = sortedVersions.slice(0, -10);
          
          for (const key of toDelete) {
            await localforage.removeItem(key);
            deletedVersions++;
          }
        }
      }
      
      // Clean up old backups
      const backupKeys = allKeys.filter(key => key.startsWith('backup_')).sort();
      if (backupKeys.length > 3) {
        const toDelete = backupKeys.slice(0, -3);
        for (const key of toDelete) {
          await localforage.removeItem(key);
        }
      }
      
      console.log(`Optimization complete. Deleted ${deletedVersions} old versions and ${backupKeys.length - 3} old backups.`);
      
      return {
        deletedVersions,
        deletedBackups: Math.max(0, backupKeys.length - 3),
        success: true
      };
      
    } catch (error) {
      console.error('Database optimization failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Version history management
  async saveVersion(noteId, note){
    // Don't save version if content hasn't changed significantly
    const versions = await this.getVersions(noteId);
    const lastVersion = versions.length > 0 ? versions[versions.length - 1] : null;
    
    if (lastVersion) {
      // Simple content comparison (title, body, tags)
      const contentChanged = 
        lastVersion.title !== note.title ||
        lastVersion.body !== note.body ||
        JSON.stringify(lastVersion.tags || []) !== JSON.stringify(note.tags || []);
      
      // Only save version if content changed and at least 5 minutes have passed
      const timeSinceLast = Date.now() - new Date(lastVersion.updatedAt || lastVersion.createdAt).getTime();
      if (!contentChanged || timeSinceLast < 5 * 60 * 1000) {
        return; // Skip saving version
      }
    }
    
    // Save version with timestamp
    const versionKey = `version_${noteId}_${Date.now()}`;
    await localforage.setItem(versionKey, {
      ...note,
      versionId: versionKey,
      versionedAt: nowISO()
    });
    
    // Keep only last 20 versions to prevent storage bloat
    await this.cleanupVersions(noteId);
  },
  
  async getVersions(noteId){
    const allKeys = await localforage.keys();
    const versionKeys = allKeys.filter(key => key.startsWith(`version_${noteId}_`));
    
    // Sort by timestamp (newest first)
    versionKeys.sort((a, b) => {
      const aTime = parseInt(a.split('_')[2]);
      const bTime = parseInt(b.split('_')[2]);
      return bTime - aTime;
    });
    
    // Load version data
    const versions = [];
    for(const key of versionKeys) {
      try {
        const version = await localforage.getItem(key);
        if (version) versions.push(version);
      } catch (e) {
        console.warn('Failed to load version:', key, e);
      }
    }
    
    return versions;
  },
  
  async getVersion(noteId, versionId){
    return await localforage.getItem(versionId);
  },
  
  async restoreVersion(noteId, versionId){
    const version = await this.getVersion(noteId, versionId);
    if (!version) return null;
    
    // Get current note
    const current = await this.get(noteId);
    if (!current) return null;
    
    // Save current version before restoring
    await this.saveVersion(noteId, current);
    
    // Restore the version (but keep the same ID)
    const restored = {
      ...version,
      id: noteId, // Keep original note ID
      restoredAt: nowISO(),
      updatedAt: nowISO()
    };
    
    await this.upsert(restored);
    return restored;
  },
  
  async cleanupVersions(noteId){
    const versions = await this.getVersions(noteId);
    
    // Keep only last 20 versions
    if (versions.length > 20) {
      const versionsToDelete = versions.slice(20);
      for(const version of versionsToDelete) {
        try {
          await localforage.removeItem(version.versionId);
        } catch (e) {
          console.warn('Failed to delete version:', version.versionId, e);
        }
      }
    }
  },
  
  async deleteAllVersions(noteId){
    const versions = await this.getVersions(noteId);
    for(const version of versions) {
      try {
        await localforage.removeItem(version.versionId);
      } catch (e) {
        console.warn('Failed to delete version:', version.versionId, e);
      }
    }
  }
};

// Model helpers
const Note = {
  create({title='', body='', tags=[], color='#6B7280'}={}){
    const id = ULID();
    return { id, title, body, tags: uniq(tags.map(t=>t.toLowerCase())), links:[], color, createdAt: nowISO(), updatedAt: nowISO() };
  },
  computeLinks(note, all){
    const w = extractWikiLinks(note.body||'');
    // resolve each w to id via exact title or ID:xxxx
    const out=[];
    for(const target of w){
      if(/^ID:/i.test(target)){
        const id = target.split(':')[1].trim();
        if(all.some(n=>n.id===id)) out.push(id);
      }else{
        const found = all.find(n=>(n.title||'').toLowerCase()===target.toLowerCase());
        if(found) out.push(found.id);
      }
    }
    note.links = uniq(out);
    return note;
  },
  backlinks(id, all){ return all.filter(n=> (n.links||[]).includes(id)); }
};
