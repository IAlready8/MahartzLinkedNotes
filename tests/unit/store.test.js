/* Mahart Linked Notes - Store Module Tests */

import { mockLocalForage, createMockNote, flushPromises } from '../setup.js';

// Import the store module (assuming it's available in the global scope after loading)
// This test file will be loaded after the main application files

describe('Store Module', () => {
  let originalLocalForage;
  
  beforeEach(() => {
    // Mock LocalForage
    originalLocalForage = global.localforage;
    global.localforage = mockLocalForage;
    
    // Clear the mock storage
    mockLocalForage.storage.clear();
    
    // Reset Store if it exists
    if (typeof Store !== 'undefined' && Store.reset) {
      Store.reset();
    }
  });
  
  afterEach(() => {
    // Restore original LocalForage
    if (originalLocalForage) {
      global.localforage = originalLocalForage;
    }
  });

  describe('Store Initialization', () => {
    test('Store should be available in global scope', () => {
      expect(typeof Store).toBeDefined();
      expect(Store).toBeTruthy();
    });

    test('Store should have required methods', () => {
      const requiredMethods = [
        'init',
        'allNotes',
        'getNote', 
        'upsert',
        'deleteNote',
        'search',
        'exportData',
        'importData'
      ];
      
      requiredMethods.forEach(method => {
        expect(typeof Store[method]).toBe('function');
      });
    });

    test('Store should initialize successfully', async () => {
      const result = await Store.init();
      expect(result).toBeTruthy();
    });
  });

  describe('Note Operations', () => {
    beforeEach(async () => {
      await Store.init();
    });

    test('should create and store a new note', async () => {
      const mockNote = createMockNote({
        title: 'Test Note Creation',
        body: 'This is a test note body'
      });

      const result = await Store.upsert(mockNote);
      expect(result).toBeTruthy();

      const retrievedNote = await Store.getNote(mockNote.id);
      expect(retrievedNote).toEqual(mockNote);
    });

    test('should update an existing note', async () => {
      const mockNote = createMockNote({
        title: 'Original Title',
        body: 'Original body'
      });

      // Create the note
      await Store.upsert(mockNote);

      // Update the note
      const updatedNote = {
        ...mockNote,
        title: 'Updated Title',
        body: 'Updated body',
        updatedAt: new Date().toISOString()
      };

      await Store.upsert(updatedNote);

      const retrievedNote = await Store.getNote(mockNote.id);
      expect(retrievedNote.title).toBe('Updated Title');
      expect(retrievedNote.body).toBe('Updated body');
      expect(retrievedNote.updatedAt).toBe(updatedNote.updatedAt);
    });

    test('should delete a note', async () => {
      const mockNote = createMockNote();

      // Create the note
      await Store.upsert(mockNote);
      expect(await Store.getNote(mockNote.id)).toBeTruthy();

      // Delete the note
      await Store.deleteNote(mockNote.id);
      expect(await Store.getNote(mockNote.id)).toBeFalsy();
    });

    test('should retrieve all notes', async () => {
      const notes = [
        createMockNote({ id: '1', title: 'Note 1' }),
        createMockNote({ id: '2', title: 'Note 2' }),
        createMockNote({ id: '3', title: 'Note 3' })
      ];

      // Store all notes
      for (const note of notes) {
        await Store.upsert(note);
      }

      const allNotes = await Store.allNotes();
      expect(allNotes).toHaveLength(3);
      expect(allNotes.map(n => n.title)).toEqual(['Note 1', 'Note 2', 'Note 3']);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await Store.init();

      // Set up test notes
      const testNotes = [
        createMockNote({
          id: '1',
          title: 'JavaScript Programming',
          body: 'Learning about JavaScript functions and closures',
          tags: ['#programming', '#javascript']
        }),
        createMockNote({
          id: '2', 
          title: 'React Components',
          body: 'Building reusable React components with hooks',
          tags: ['#react', '#programming']
        }),
        createMockNote({
          id: '3',
          title: 'Database Design',
          body: 'Principles of good database design and normalization',
          tags: ['#database', '#design']
        })
      ];

      for (const note of testNotes) {
        await Store.upsert(note);
      }
    });

    test('should search by title', async () => {
      const results = await Store.search('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Programming');
    });

    test('should search by body content', async () => {
      const results = await Store.search('components');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('React Components');
    });

    test('should search by tags', async () => {
      const results = await Store.search('#programming');
      expect(results).toHaveLength(2);
      expect(results.map(r => r.title)).toContain('JavaScript Programming');
      expect(results.map(r => r.title)).toContain('React Components');
    });

    test('should return empty results for non-matching search', async () => {
      const results = await Store.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('Data Import/Export', () => {
    beforeEach(async () => {
      await Store.init();
    });

    test('should export all data', async () => {
      const testNotes = [
        createMockNote({ id: '1', title: 'Note 1' }),
        createMockNote({ id: '2', title: 'Note 2' })
      ];

      for (const note of testNotes) {
        await Store.upsert(note);
      }

      const exportData = await Store.exportData();
      
      expect(exportData).toHaveProperty('notes');
      expect(exportData.notes).toHaveLength(2);
      expect(exportData).toHaveProperty('timestamp');
      expect(exportData).toHaveProperty('version');
    });

    test('should import data successfully', async () => {
      const importData = {
        notes: [
          createMockNote({ id: '1', title: 'Imported Note 1' }),
          createMockNote({ id: '2', title: 'Imported Note 2' })
        ],
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const result = await Store.importData(importData);
      expect(result).toBeTruthy();

      const allNotes = await Store.allNotes();
      expect(allNotes).toHaveLength(2);
      expect(allNotes[0].title).toBe('Imported Note 1');
      expect(allNotes[1].title).toBe('Imported Note 2');
    });

    test('should handle invalid import data', async () => {
      const invalidData = { invalid: true };
      
      await expect(Store.importData(invalidData)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      // Mock LocalForage to throw an error
      mockLocalForage.getItem = jest.fn().mockRejectedValue(new Error('Storage error'));

      const result = await Store.getNote('nonexistent');
      expect(result).toBeFalsy();
    });

    test('should validate note data before storing', async () => {
      const invalidNote = {
        // Missing required fields
        body: 'Test body'
      };

      await expect(Store.upsert(invalidNote)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large number of notes efficiently', async () => {
      await Store.init();

      const startTime = performance.now();

      // Create 100 test notes
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const note = createMockNote({
          id: `note-${i}`,
          title: `Performance Test Note ${i}`,
          body: `Body content for note ${i}`
        });
        promises.push(Store.upsert(note));
      }

      await Promise.all(promises);

      const allNotes = await Store.allNotes();
      const endTime = performance.now();

      expect(allNotes).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should search large datasets efficiently', async () => {
      await Store.init();

      // Create notes with searchable content
      for (let i = 0; i < 50; i++) {
        await Store.upsert(createMockNote({
          id: `search-${i}`,
          title: `Search Test ${i}`,
          body: i % 10 === 0 ? 'Special search term here' : `Regular content ${i}`
        }));
      }

      const startTime = performance.now();
      const results = await Store.search('Special search term');
      const endTime = performance.now();

      expect(results).toHaveLength(5); // Should find 5 notes (every 10th note)
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty note titles', async () => {
      await Store.init();
      
      const noteWithEmptyTitle = createMockNote({
        title: '',
        body: 'Note with empty title'
      });

      await Store.upsert(noteWithEmptyTitle);
      const retrieved = await Store.getNote(noteWithEmptyTitle.id);
      
      expect(retrieved).toBeTruthy();
      expect(retrieved.title).toBe('');
    });

    test('should handle notes with special characters', async () => {
      await Store.init();
      
      const specialNote = createMockNote({
        title: '特殊文字 émojis 🚀 symbols !@#$%',
        body: 'Content with special chars: àáâãäåæçèéêë'
      });

      await Store.upsert(specialNote);
      const retrieved = await Store.getNote(specialNote.id);
      
      expect(retrieved.title).toBe(specialNote.title);
      expect(retrieved.body).toBe(specialNote.body);
    });

    test('should handle very long note content', async () => {
      await Store.init();
      
      const longContent = 'A'.repeat(100000); // 100KB of content
      const longNote = createMockNote({
        title: 'Very Long Note',
        body: longContent
      });

      await Store.upsert(longNote);
      const retrieved = await Store.getNote(longNote.id);
      
      expect(retrieved.body).toBe(longContent);
    });
  });
});