// Tests for Store module
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store, Note } from '@/modules/store';
import type { Note as NoteType } from '@/types';

describe('Store Module', () => {
  beforeEach(async () => {
    await Store.wipe();
    vi.clearAllMocks();
  });

  describe('Note CRUD Operations', () => {
    it('should create and retrieve notes', async () => {
      const testNote = createMockNote({
        title: 'Test Note',
        body: 'Test content',
        tags: ['#test']
      });

      await Store.upsert(testNote);
      const retrieved = await Store.get(testNote.id);

      expect(retrieved).toEqual(testNote);
    });

    it('should update existing notes', async () => {
      const testNote = createMockNote();
      await Store.upsert(testNote);

      const updatedNote = {
        ...testNote,
        title: 'Updated Title',
        body: 'Updated content'
      };
      
      await Store.upsert(updatedNote);
      const retrieved = await Store.get(testNote.id);

      expect(retrieved.title).toBe('Updated Title');
      expect(retrieved.body).toBe('Updated content');
    });

    it('should delete notes', async () => {
      const testNote = createMockNote();
      await Store.upsert(testNote);

      expect(await Store.get(testNote.id)).toBeTruthy();
      
      await Store.delete(testNote.id);
      
      expect(await Store.get(testNote.id)).toBe(null);
    });

    it('should handle multiple notes', async () => {
      const notes = [
        createMockNote({ title: 'Note 1' }),
        createMockNote({ title: 'Note 2' }),
        createMockNote({ title: 'Note 3' })
      ];

      for (const note of notes) {
        await Store.upsert(note);
      }

      const allNotes = await Store.allNotes();
      expect(allNotes).toHaveLength(3);
      
      const titles = allNotes.map(n => n.title).sort();
      expect(titles).toEqual(['Note 1', 'Note 2', 'Note 3']);
    });
  });

  describe('Search and Retrieval', () => {
    it('should find notes by title', async () => {
      const testNote = createMockNote({ title: 'Unique Title' });
      await Store.upsert(testNote);

      const found = await Store.byTitle('Unique Title');
      expect(found).toEqual(testNote);

      const notFound = await Store.byTitle('Non-existent');
      expect(notFound).toBe(null);
    });

    it('should handle case-insensitive title search', async () => {
      const testNote = createMockNote({ title: 'CamelCase Title' });
      await Store.upsert(testNote);

      const found = await Store.byTitle('camelcase title');
      expect(found).toEqual(testNote);
    });
  });

  describe('Export and Import', () => {
    it('should export data correctly', async () => {
      const notes = [
        createMockNote({ title: 'Note 1' }),
        createMockNote({ title: 'Note 2' })
      ];

      for (const note of notes) {
        await Store.upsert(note);
      }

      const exportData = await Store.export();

      expect(exportData.notes).toHaveLength(2);
      expect(exportData.metadata.noteCount).toBe(2);
      expect(exportData.metadata.version).toBe('2.0.0');
    });

    it('should import data correctly', async () => {
      const importData = {
        notes: [
          createMockNote({ title: 'Imported 1' }),
          createMockNote({ title: 'Imported 2' })
        ],
        events: [],
        settings: { theme: 'dark' }
      };

      await Store.import(importData);
      const allNotes = await Store.allNotes();

      expect(allNotes).toHaveLength(2);
      expect(allNotes.map(n => n.title).sort()).toEqual(['Imported 1', 'Imported 2']);
    });
  });

  describe('Settings Management', () => {
    it('should save and retrieve settings', async () => {
      const settings = {
        theme: 'light',
        autoSave: false,
        performanceMode: true
      };

      await Store.saveSettings(settings);
      const retrieved = await Store.getSettings();

      expect(retrieved.theme).toBe('light');
      expect(retrieved.autoSave).toBe(false);
      expect(retrieved.performanceMode).toBe(true);
    });

    it('should provide default settings', async () => {
      const settings = await Store.getSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.autoSave).toBe(true);
      expect(settings.syncEnabled).toBe(false);
    });
  });

  describe('Performance and Health', () => {
    it('should track performance stats', () => {
      const stats = Store.getPerformanceStats();

      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('totalRecentSize');
      expect(stats).toHaveProperty('operationCount');
    });

    it('should provide database health info', async () => {
      const testNote = createMockNote();
      await Store.upsert(testNote);

      const health = await Store.getDbHealth();

      expect(health).toHaveProperty('noteCount');
      expect(health).toHaveProperty('performance');
      expect(health.noteCount).toBe(1);
    });
  });
});

describe('Note Model', () => {
  describe('create', () => {
    it('should create note with defaults', () => {
      const note = Note.create();

      expect(note.id).toBeTruthy();
      expect(note.title).toBe('');
      expect(note.body).toBe('');
      expect(note.tags).toEqual([]);
      expect(note.color).toBe('#6B7280');
      expect(note.links).toEqual([]);
      expect(note.createdAt).toBeTruthy();
      expect(note.updatedAt).toBeTruthy();
    });

    it('should create note with provided data', () => {
      const data = {
        title: 'Test Note',
        body: 'Test content',
        tags: ['#test', '#note'],
        color: '#ff0000'
      };

      const note = Note.create(data);

      expect(note.title).toBe('Test Note');
      expect(note.body).toBe('Test content');
      expect(note.tags).toEqual(['#test', '#note']);
      expect(note.color).toBe('#ff0000');
    });

    it('should normalize tags to lowercase', () => {
      const note = Note.create({
        tags: ['#Test', '#NOTE', '#MixedCase']
      });

      expect(note.tags).toEqual(['#test', '#note', '#mixedcase']);
    });
  });

  describe('computeLinks', () => {
    it('should compute wikilinks correctly', () => {
      const allNotes: NoteType[] = [
        createMockNote({ id: 'note1', title: 'Target Note' }),
        createMockNote({ id: 'note2', title: 'Another Note' })
      ];

      const note = createMockNote({
        body: 'This links to [[Target Note]] and [[ID:note2]]'
      });

      Note.computeLinks(note, allNotes);

      expect(note.links).toContain('note1'); // Found by title
      expect(note.links).toContain('note2'); // Found by ID
      expect(note.links).toHaveLength(2);
    });

    it('should handle non-existent links', () => {
      const allNotes: NoteType[] = [];
      const note = createMockNote({
        body: 'This links to [[Non-existent]] and [[ID:missing]]'
      });

      Note.computeLinks(note, allNotes);

      expect(note.links).toEqual([]);
    });
  });

  describe('backlinks', () => {
    it('should find notes that link to a target note', () => {
      const allNotes: NoteType[] = [
        createMockNote({ id: 'note1', links: ['target'] }),
        createMockNote({ id: 'note2', links: ['target', 'other'] }),
        createMockNote({ id: 'note3', links: ['other'] })
      ];

      const backlinks = Note.backlinks('target', allNotes);

      expect(backlinks).toHaveLength(2);
      expect(backlinks.map(n => n.id)).toEqual(['note1', 'note2']);
    });

    it('should return empty array when no backlinks exist', () => {
      const allNotes: NoteType[] = [
        createMockNote({ id: 'note1', links: [] }),
        createMockNote({ id: 'note2', links: ['other'] })
      ];

      const backlinks = Note.backlinks('target', allNotes);

      expect(backlinks).toEqual([]);
    });
  });
});