// Enhanced Store module with per-note storage architecture and ES modules
import localforage from 'localforage';
import { ulid as ULID } from 'ulid';
import { nowISO, uniq, extractWikiLinks } from './util.js';

// Configure storage with per-note architecture
const notesDB = localforage.createInstance({
  name: 'mahart-linked-notes-v2',
  storeName: 'notes',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  description: 'Individual note storage for better performance'
});

const metaDB = localforage.createInstance({
  name: 'mahart-linked-notes-v2',
  storeName: 'metadata',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  description: 'Application metadata and indexes'
});

const eventsDB = localforage.createInstance({
  name: 'mahart-linked-notes-v2', 
  storeName: 'events',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  description: 'Analytics and event tracking'
});

// Performance monitoring
class PerformanceTracker {
  constructor() {
    this.operations = [];
    this.maxOperations = 100;
  }

  logOperation(operation, duration, size = 0, noteCount = 0) {
    this.operations.push({
      operation,
      duration,
      size,
      noteCount,
      timestamp: Date.now()
    });
    
    if (this.operations.length > this.maxOperations) {
      this.operations.shift();
    }
  }
  
  getStats() {
    const recent = this.operations.slice(-20);
    if (recent.length === 0) return { averageDuration: 0, totalRecentSize: 0, operationCount: 0 };
    
    const avgDuration = recent.reduce((sum, op) => sum + op.duration, 0) / recent.length;
    const totalSize = recent.reduce((sum, op) => sum + op.size, 0);
    
    return {
      averageDuration: Math.round(avgDuration),
      totalRecentSize: totalSize,
      operationCount: this.operations.length,
      recentOperations: recent.map(op => ({
        operation: op.operation,
        duration: Math.round(op.duration),
        timestamp: new Date(op.timestamp).toISOString()
      }))
    };
  }
}

const perfTracker = new PerformanceTracker();

// Enhanced Store with per-note architecture
export const Store = {
  // Cache for frequently accessed data
  _cache: new Map(),
  _noteIndex: null,
  _cacheTimeout: 5 * 60 * 1000, // 5 minutes

  async init() {
    console.log('Initializing Store with per-note architecture...');
    await this.buildIndex();
  },

  // Build and maintain note index for fast lookups
  async buildIndex() {
    const start = performance.now();
    
    try {
      // Get all note keys
      const keys = await notesDB.keys();
      const noteKeys = keys.filter(key => key.startsWith('note:'));
      
      const index = {
        byId: new Map(),
        byTitle: new Map(), 
        byTag: new Map(),
        totalCount: noteKeys.length,
        lastUpdated: nowISO()
      };

      // Build index from note keys and metadata
      for (const key of noteKeys) {
        const noteId = key.replace('note:', '');
        const meta = await this.getNoteMetadata(noteId);
        
        if (meta) {
          index.byId.set(noteId, {
            title: meta.title,
            tags: meta.tags || [],
            color: meta.color || '#6B7280',
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt
          });

          // Title index (case-insensitive)
          if (meta.title) {
            index.byTitle.set(meta.title.toLowerCase(), noteId);
          }

          // Tag index
          if (meta.tags) {
            for (const tag of meta.tags) {
              if (!index.byTag.has(tag)) {
                index.byTag.set(tag, new Set());
              }
              index.byTag.get(tag).add(noteId);
            }
          }
        }
      }

      this._noteIndex = index;
      await metaDB.setItem('note_index', {
        count: index.totalCount,
        lastUpdated: index.lastUpdated
      });

      const duration = performance.now() - start;
      perfTracker.logOperation('buildIndex', duration, 0, index.totalCount);
      
      console.log(`Built note index: ${index.totalCount} notes in ${Math.round(duration)}ms`);
      
    } catch (error) {
      console.error('Failed to build note index:', error);
      this._noteIndex = { byId: new Map(), byTitle: new Map(), byTag: new Map(), totalCount: 0 };
    }
  },

  // Get note metadata without loading full content
  async getNoteMetadata(id) {
    const key = `meta:${id}`;
    try {
      return await metaDB.getItem(key);
    } catch (error) {
      console.warn('Failed to get note metadata:', id, error);
      return null;
    }
  },

  // Save note metadata separately for fast access
  async saveNoteMetadata(note) {
    const key = `meta:${note.id}`;
    const metadata = {
      id: note.id,
      title: note.title,
      tags: note.tags || [],
      color: note.color || '#6B7280',
      links: note.links || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
    
    await metaDB.setItem(key, metadata);
    return metadata;
  },

  // Enhanced note operations with per-note storage
  async allNotes() {
    const start = performance.now();
    
    try {
      if (!this._noteIndex) {
        await this.buildIndex();
      }

      const notes = [];
      for (const [id, meta] of this._noteIndex.byId) {
        const fullNote = await this.get(id);
        if (fullNote) {
          notes.push(fullNote);
        }
      }

      const duration = performance.now() - start;
      perfTracker.logOperation('allNotes', duration, JSON.stringify(notes).length, notes.length);
      
      return notes;
      
    } catch (error) {
      console.error('Failed to load all notes:', error);
      return [];
    }
  },

  async get(id) {
    if (!id) return null;
    
    // Check cache first
    const cacheKey = `note:${id}`;
    if (this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this._cacheTimeout) {
        return cached.data;
      }
      this._cache.delete(cacheKey);
    }

    const start = performance.now();
    
    try {
      const noteKey = `note:${id}`;
      const note = await notesDB.getItem(noteKey);
      
      if (note) {
        // Cache the note
        this._cache.set(cacheKey, {
          data: note,
          timestamp: Date.now()
        });
        
        const duration = performance.now() - start;
        perfTracker.logOperation('get', duration, JSON.stringify(note).length);
        
        return note;
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to get note:', id, error);
      return null;
    }
  },

  async byTitle(title) {
    if (!this._noteIndex) {
      await this.buildIndex();
    }
    
    const noteId = this._noteIndex.byTitle.get(title.toLowerCase());
    return noteId ? await this.get(noteId) : null;
  },

  async upsert(note) {
    if (!note || !note.id) {
      throw new Error('Invalid note: missing ID');
    }

    const start = performance.now();
    
    try {
      // Save version history if note exists
      const existing = await this.get(note.id);
      if (existing) {
        await this.saveVersion(note.id, existing);
      }

      // Update timestamps
      if (!existing) {
        note.createdAt = note.createdAt || nowISO();
      }
      note.updatedAt = nowISO();

      // Save full note
      const noteKey = `note:${note.id}`;
      await notesDB.setItem(noteKey, note);

      // Update metadata
      await this.saveNoteMetadata(note);

      // Update cache
      this._cache.set(`note:${note.id}`, {
        data: note,
        timestamp: Date.now()
      });

      // Update index
      if (this._noteIndex) {
        this._noteIndex.byId.set(note.id, {
          title: note.title,
          tags: note.tags || [],
          color: note.color || '#6B7280',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        });

        if (note.title) {
          this._noteIndex.byTitle.set(note.title.toLowerCase(), note.id);
        }

        // Update tag index
        if (note.tags) {
          for (const tag of note.tags) {
            if (!this._noteIndex.byTag.has(tag)) {
              this._noteIndex.byTag.set(tag, new Set());
            }
            this._noteIndex.byTag.get(tag).add(note.id);
          }
        }
      }

      const duration = performance.now() - start;
      perfTracker.logOperation('upsert', duration, JSON.stringify(note).length);

      return note;
      
    } catch (error) {
      console.error('Failed to upsert note:', error);
      throw error;
    }
  },

  async delete(id) {
    if (!id) return false;

    const start = performance.now();
    
    try {
      // Remove from storage
      const noteKey = `note:${id}`;
      const metaKey = `meta:${id}`;
      
      await notesDB.removeItem(noteKey);
      await metaDB.removeItem(metaKey);

      // Remove from cache
      this._cache.delete(`note:${id}`);

      // Remove from index
      if (this._noteIndex) {
        const meta = this._noteIndex.byId.get(id);
        this._noteIndex.byId.delete(id);
        
        if (meta && meta.title) {
          this._noteIndex.byTitle.delete(meta.title.toLowerCase());
        }

        // Remove from tag index
        if (meta && meta.tags) {
          for (const tag of meta.tags) {
            if (this._noteIndex.byTag.has(tag)) {
              this._noteIndex.byTag.get(tag).delete(id);
              if (this._noteIndex.byTag.get(tag).size === 0) {
                this._noteIndex.byTag.delete(tag);
              }
            }
          }
        }
      }

      // Clean up versions
      await this.deleteAllVersions(id);

      const duration = performance.now() - start;
      perfTracker.logOperation('delete', duration);

      return true;
      
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  },

  // Analytics and events
  async events() {
    try {
      return (await eventsDB.getItem('events')) || [];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  },

  async log(event) {
    try {
      const events = await this.events();
      events.push({
        ...event,
        timestamp: nowISO(),
        id: ULID()
      });
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      await eventsDB.setItem('events', events);
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  },

  // Export/Import with better error handling
  async export() {
    const start = performance.now();
    
    try {
      const notes = await this.allNotes();
      const events = await this.events();
      const settings = await this.getSettings();
      const stats = perfTracker.getStats();

      const exportData = {
        metadata: {
          version: '2.0.0',
          exportedAt: nowISO(),
          noteCount: notes.length,
          eventCount: events.length,
          performance: stats
        },
        notes,
        events,
        settings,
        tags: this.extractAllTags(notes)
      };

      const duration = performance.now() - start;
      perfTracker.logOperation('export', duration, JSON.stringify(exportData).length, notes.length);

      return exportData;
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  },

  async import(jsonData) {
    const start = performance.now();
    
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('Invalid import data: missing notes array');
      }

      // Clear existing data
      await this.wipe();
      
      // Import notes
      for (const note of data.notes) {
        await this.upsert(note);
      }

      // Import events
      if (data.events && Array.isArray(data.events)) {
        await eventsDB.setItem('events', data.events);
      }

      // Import settings
      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      // Rebuild index
      await this.buildIndex();

      const duration = performance.now() - start;
      perfTracker.logOperation('import', duration, JSON.stringify(data).length, data.notes.length);

      console.log(`Successfully imported ${data.notes.length} notes`);
      return true;
      
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  },

  // Clear all data
  async wipe() {
    try {
      await notesDB.clear();
      await metaDB.clear();
      await eventsDB.clear();
      
      this._cache.clear();
      this._noteIndex = null;
      
      console.log('Database wiped successfully');
    } catch (error) {
      console.error('Failed to wipe database:', error);
      throw error;
    }
  },

  // Settings management
  async getSettings() {
    try {
      return (await metaDB.getItem('settings')) || {
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
      await metaDB.setItem('settings', settings);
      return settings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },

  // Version history management
  async saveVersion(noteId, note) {
    try {
      const versionKey = `version:${noteId}:${Date.now()}`;
      await metaDB.setItem(versionKey, {
        ...note,
        versionId: versionKey,
        versionedAt: nowISO()
      });

      await this.cleanupVersions(noteId);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  },

  async getVersions(noteId) {
    try {
      const keys = await metaDB.keys();
      const versionKeys = keys.filter(key => key.startsWith(`version:${noteId}:`));
      
      const versions = [];
      for (const key of versionKeys) {
        const version = await metaDB.getItem(key);
        if (version) versions.push(version);
      }
      
      return versions.sort((a, b) => new Date(b.versionedAt) - new Date(a.versionedAt));
    } catch (error) {
      console.error('Failed to get versions:', error);
      return [];
    }
  },

  async cleanupVersions(noteId) {
    try {
      const versions = await this.getVersions(noteId);
      if (versions.length > 20) {
        const toDelete = versions.slice(20);
        for (const version of toDelete) {
          await metaDB.removeItem(version.versionId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup versions:', error);
    }
  },

  async deleteAllVersions(noteId) {
    try {
      const keys = await metaDB.keys();
      const versionKeys = keys.filter(key => key.startsWith(`version:${noteId}:`));
      
      for (const key of versionKeys) {
        await metaDB.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to delete all versions:', error);
    }
  },

  // Utility methods
  extractAllTags(notes) {
    const tagMap = new Map();
    
    for (const note of notes) {
      if (note.tags) {
        for (const tag of note.tags) {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        }
      }
    }
    
    return Object.fromEntries(
      Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1])
    );
  },

  // Performance and health monitoring
  getPerformanceStats() {
    return perfTracker.getStats();
  },

  async getDbHealth() {
    try {
      if (!this._noteIndex) {
        await this.buildIndex();
      }
      const noteKeys = await notesDB.keys();
      const metaKeys = await metaDB.keys();
      const eventKeys = await eventsDB.keys();
      
      return {
        noteCount: this._noteIndex ? this._noteIndex.totalCount : 0,
        metadataCount: metaKeys.length,
        eventCount: (await this.events()).length,
        cacheSize: this._cache.size,
        performance: perfTracker.getStats(),
        lastIndexUpdate: this._noteIndex ? this._noteIndex.lastUpdated : null
      };
    } catch (error) {
      console.error('Failed to get DB health:', error);
      return null;
    }
  }
};

// Note model with enhanced functionality
export const Note = {
  create({ title = '', body = '', tags = [], color = '#6B7280' } = {}) {
    const id = ULID();
    return {
      id,
      title,
      body,
      tags: uniq(tags.map(t => t.toLowerCase())),
      links: [],
      color,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
  },

  computeLinks(note, allNotes) {
    const wikiLinks = extractWikiLinks(note.body || '');
    const resolvedLinks = [];

    for (const target of wikiLinks) {
      if (/^ID:/i.test(target)) {
        // Direct ID reference
        const id = target.split(':')[1].trim();
        if (allNotes.some(n => n.id === id)) {
          resolvedLinks.push(id);
        }
      } else {
        // Title reference
        const found = allNotes.find(n => 
          (n.title || '').toLowerCase() === target.toLowerCase()
        );
        if (found) {
          resolvedLinks.push(found.id);
        }
      }
    }

    note.links = uniq(resolvedLinks);
    return note;
  },

  backlinks(noteId, allNotes) {
    return allNotes.filter(n => (n.links || []).includes(noteId));
  }
};
