import { Note } from '../types';

// IndexedDB-based storage using localforage for better compatibility
class NoteStorage {
  private dbName = 'MahartNotes';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getNote(id: string): Promise<Note | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.put(note);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportData(): Promise<string> {
    const notes = await this.getAllNotes();
    return JSON.stringify({
      version: 1,
      timestamp: new Date().toISOString(),
      notes: notes
    }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (data.notes && Array.isArray(data.notes)) {
        await this.clear();
        for (const note of data.notes) {
          await this.saveNote(note);
        }
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message);
    }
  }
}

export const noteStorage = new NoteStorage();