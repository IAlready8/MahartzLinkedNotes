// 🤖 Review: This file was created by refactoring legacy/data-sync.js into an ES6 module.

import { Store } from './store.js';
import { Performance } from './performance.js';
import { Search } from './search.js';

export const DataSync = {
  subscribers: new Map(),
  lastSyncTime: 0,
  syncInProgress: false,
  
  // Event types for subscriptions
  EVENTS: {
    NOTE_CREATED: 'note:created',
    NOTE_UPDATED: 'note:updated', 
    NOTE_DELETED: 'note:deleted',
    TAG_CREATED: 'tag:created',
    TAG_UPDATED: 'tag:updated',
    ANALYTICS_UPDATED: 'analytics:updated',
    SEARCH_INDEX_UPDATED: 'search:updated',
    BULK_OPERATION: 'bulk:operation'
  },

  // Initialize the data sync system
  init() {
    console.log('Initializing DataSync system...');
    
    // Set up cross-tab synchronization via BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('mahart-notes-sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    }
    
    // Set up periodic sync for data consistency
    this.startPeriodicSync();
    
    // Listen for storage events (fallback for older browsers)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('mahart-')) {
        this.handleStorageEvent(e);
      }
    });
    
    return this;
  },

  // Subscribe to data change events
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);
    
    return () => {
      // Return unsubscribe function
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  },

  // Emit events to subscribers
  emit(eventType, data) {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in DataSync callback:', error);
        }
      });
    }
    
    // Also broadcast to other tabs
    this.broadcast(eventType, data);
  },

  // Broadcast message to other tabs
  broadcast(eventType, data) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: eventType,
        data: data,
        timestamp: Date.now(),
        source: 'mahart-notes'
      });
    }
  },

  // Handle broadcast messages from other tabs
  handleBroadcastMessage(message) {
    if (message.source !== 'mahart-notes') return;
    
    console.log('Received broadcast:', message.type);
    
    // Emit to local subscribers
    const callbacks = this.subscribers.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data, { fromBroadcast: true });
        } catch (error) {
          console.error('Error handling broadcast:', error);
        }
      });
    }
  },

  // Handle storage events (fallback)
  handleStorageEvent(event) {
    // Simple fallback for browsers without BroadcastChannel
    if (event.key === 'mahart-sync-signal') {
      this.handleSyncSignal(event.newValue);
    }
  },

  // Start periodic sync to maintain consistency
  startPeriodicSync() {
    // Sync every 30 seconds
    setInterval(() => {
      this.performPeriodicSync();
    }, 30000);
  },

  async performPeriodicSync() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      const notes = await Store.allNotes();
      
      // Check for data consistency issues
      const issues = await this.checkDataConsistency(notes);
      
      if (issues.length > 0) {
        console.warn('Data consistency issues found:', issues);
        await this.repairDataConsistency(issues);
      }
      
      this.lastSyncTime = Date.now();
      this.emit(this.EVENTS.BULK_OPERATION, { 
        type: 'periodic_sync', 
        timestamp: this.lastSyncTime 
      });
      
    } catch (error) {
      console.error('Periodic sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  },

  // Check for data consistency issues
  async checkDataConsistency(notes) {
    const issues = [];
    
    // Check for broken wikilinks
    const allNoteIds = new Set(notes.map(n => n.id));
    const allNoteTitles = new Map(notes.map(n => [n.title.toLowerCase(), n.id]));
    
    for (const note of notes) {
      if (note.links) {
        for (const linkId of note.links) {
          if (!allNoteIds.has(linkId)) {
            issues.push({
              type: 'broken_link',
              noteId: note.id,
              brokenLinkId: linkId
            });
          }
        }
      }
      
      // Check for duplicate titles
      const similarTitles = notes.filter(n => 
        n.id !== note.id && 
        n.title.toLowerCase() === note.title.toLowerCase()
      );
      
      if (similarTitles.length > 0) {
        issues.push({
          type: 'duplicate_title',
          noteId: note.id,
          duplicates: similarTitles.map(n => n.id)
        });
      }
    }
    
    return issues;
  },

  // Repair data consistency issues
  async repairDataConsistency(issues) {
    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'broken_link':
            await this.repairBrokenLink(issue);
            break;
          case 'duplicate_title':
            // Just log for now, don't auto-fix duplicates
            console.warn('Duplicate title found:', issue);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to repair issue:', issue, error);
    }
  },    }
  },

  // Repair broken links
  async repairBrokenLink(issue) {
    const note = await Store.get(issue.noteId);
    if (!note) return;
    
    // Remove broken link
    note.links = note.links.filter(linkId => linkId !== issue.brokenLinkId);
    await Store.upsert(note);
    
    console.log(`Repaired broken link in note ${issue.noteId}`);
    this.emit(this.EVENTS.NOTE_UPDATED, { 
      noteId: issue.noteId, 
      type: 'link_repair' 
    });
  },

  // Export data with cross-page compatibility
  async exportData(options = {}) {
    const {
      includeAnalytics = true,
      includeSearchIndex = false,
      format = 'json',
      compress = false
    } = options;
    
    try {
      const notes = await Store.allNotes();
      
      const exportData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        notes: notes,
        metadata: {
          totalNotes: notes.length,
          totalWords: notes.reduce((sum, note) => sum + (note.body?.split(/\s+/).length || 0), 0),
          exportSource: 'mahart-linked-notes'
        }
      };
      
      // Include analytics if requested
      if (includeAnalytics && typeof Performance !== 'undefined') {
        exportData.analytics = await Performance.computeAnalytics(notes);
      }
      
      // Include search index if requested
      if (includeSearchIndex && typeof Performance !== 'undefined') {
        const searchIndex = await Performance.buildSearchIndex(notes);
        exportData.searchIndex = {
          termCount: searchIndex.terms.size,
          titleTermCount: searchIndex.titles.size,
          tagCount: searchIndex.tags.size
        };
      }
      
      // Add tag frequency data
      if (typeof Performance !== 'undefined') {
        exportData.tagFrequency = await Performance.getTagFrequency(notes);
      }
      
      let finalData = JSON.stringify(exportData, null, 2);
      
      // Compress if requested
      if (compress && typeof CompressionStream !== 'undefined') {
        finalData = await this.compressData(finalData);
      }
      
      this.emit(this.EVENTS.BULK_OPERATION, {
        type: 'export',
        count: notes.length,
        format: format
      });
      
      return {
        data: finalData,
        filename: `mahart-notes-${new Date().toISOString().split('T')[0]}.${format}`,
        size: finalData.length
      };
      
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data: ' + error.message);
    }
  },

  // Import data with validation and merging
  async importData(jsonData, options = {}) {
    const {
      mergeStrategy = 'replace', // 'replace', 'merge', 'skip'
      validateData = true,
      createBackup = true
    } = options;
    
    try {
      // Create backup before import
      if (createBackup) {
        const backup = await this.exportData();
        localStorage.setItem('mahart-import-backup', backup.data);
      }
      
      const importData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // Validate import data
      if (validateData) {
        const validation = this.validateImportData(importData);
        if (!validation.valid) {
          throw new Error('Invalid import data: ' + validation.errors.join(', '));
        }
      }
      
      const existingNotes = await Store.allNotes();
      const existingIds = new Set(existingNotes.map(n => n.id));
      const existingTitles = new Map(existingNotes.map(n => [n.title.toLowerCase(), n.id]));
      
      let imported = 0;
      let skipped = 0;
      let merged = 0;
      
      for (const note of importData.notes || []) {
        try {
          if (existingIds.has(note.id)) {
            switch (mergeStrategy) {
              case 'skip':
                skipped++;
                continue;
              case 'merge':
                // Merge with existing note
                const existing = await Store.get(note.id);
                const mergedNote = this.mergeNotes(existing, note);
                await Store.upsert(mergedNote);
                merged++;
                break;
              case 'replace':
              default:
                await Store.upsert(note);
                imported++;
                break;
            }
          } else {
            // Check for title conflicts
            const titleConflict = existingTitles.get(note.title.toLowerCase());
            if (titleConflict && mergeStrategy !== 'replace') {
              // Modify title to avoid conflict
              note.title = note.title + ' (imported)';
            }
            
            await Store.upsert(note);
            imported++;
          }
        } catch (error) {
          console.error('Failed to import note:', note.id, error);
          skipped++;
        }
      }
      
      // Refresh search index and analytics
      if (typeof Search !== 'undefined') {
        const allNotes = await Store.allNotes();
        Search.buildIndex(allNotes);
      }
      
      // Clear performance cache to ensure fresh data
      if (typeof Performance !== 'undefined') {
        Performance.clearCache();
      }
      
      const result = {
        imported,
        merged,
        skipped,
        total: (importData.notes || []).length
      };
      
      this.emit(this.EVENTS.BULK_OPERATION, {
        type: 'import',
        ...result
      });
      
      return result;
      
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data: ' + error.message);
    }
  },

  // Validate import data structure
  validateImportData(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { valid: false, errors };
    }
    
    if (!Array.isArray(data.notes)) {
      errors.push('Notes must be an array');
    } else {
      // Validate note structure
      for (let i = 0; i < Math.min(data.notes.length, 10); i++) {
        const note = data.notes[i];
        if (!note.id) errors.push(`Note ${i}: Missing ID`);
        if (!note.title) errors.push(`Note ${i}: Missing title`);
        if (!note.createdAt) errors.push(`Note ${i}: Missing createdAt`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Merge two notes intelligently
  mergeNotes(existing, imported) {
    return {
      ...existing,
      // Take the most recent content
      body: imported.updatedAt > existing.updatedAt ? imported.body : existing.body,
      title: imported.updatedAt > existing.updatedAt ? imported.title : existing.title,
      // Merge tags
      tags: [...new Set([...(existing.tags || []), ...(imported.tags || [])])],
      // Keep most recent timestamps
      updatedAt: imported.updatedAt > existing.updatedAt ? imported.updatedAt : existing.updatedAt,
      // Merge links
      links: [...new Set([...(existing.links || []), ...(imported.links || [])])]
    };
  },

  // Compress data for efficient transfer
  async compressData(data) {
    if (typeof CompressionStream === 'undefined') {
      console.warn('Compression not supported, returning uncompressed data');
      return data;
    }
    
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(new TextEncoder().encode(data));
    writer.close();
    
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
  },

  // Sync specific data types across pages
  async syncAnalytics() {
    if (typeof Performance !== 'undefined') {
      const notes = await Store.allNotes();
      const analytics = await Performance.computeAnalytics(notes);
      
      this.emit(this.EVENTS.ANALYTICS_UPDATED, analytics);
      return analytics;
    }
  },

  async syncSearchIndex() {
    if (typeof Performance !== 'undefined') {
      const notes = await Store.allNotes();
      await Performance.buildSearchIndex(notes);
      
      this.emit(this.EVENTS.SEARCH_INDEX_UPDATED, { timestamp: Date.now() });
    }
  },

  async syncTagFrequency() {
    if (typeof Performance !== 'undefined') {
      const notes = await Store.allNotes();
      const tagFreq = await Performance.getTagFrequency(notes);
      
      this.emit(this.EVENTS.TAG_UPDATED, { frequency: tagFreq });
      return tagFreq;
    }
  },

  // Get sync status
  getSyncStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      broadcastSupported: !!this.broadcastChannel
    };
  },

  // Manual sync trigger
  async forceSync() {
    console.log('Force sync requested');
    await this.performPeriodicSync();
    await this.syncAnalytics();
    await this.syncSearchIndex();
    await this.syncTagFrequency();
  },

  // Cleanup resources
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.subscribers.clear();
  }
};

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure other modules are loaded
  setTimeout(() => {
    DataSync.init();
  }, 100);
}
