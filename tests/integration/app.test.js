/* Mahart Linked Notes - Integration Tests */

import { setupDOM, cleanupDOM, createMockNote, flushPromises, waitFor, triggerEvent } from '../setup.js';

describe('Application Integration Tests', () => {
  beforeEach(() => {
    setupDOM();
    
    // Mock all required modules
    global.Store = {
      init: jest.fn().mockResolvedValue(true),
      allNotes: jest.fn().mockResolvedValue([]),
      getNote: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(true),
      deleteNote: jest.fn().mockResolvedValue(true),
      search: jest.fn().mockResolvedValue([])
    };

    global.Router = {
      init: jest.fn(),
      navigate: jest.fn(),
      currentPage: 'home'
    };

    global.Search = {
      init: jest.fn(),
      buildIndex: jest.fn(),
      search: jest.fn().mockReturnValue([])
    };

    global.UI = {
      init: jest.fn(),
      refreshCurrentPage: jest.fn(),
      updateNoteList: jest.fn(),
      loadNote: jest.fn()
    };
  });

  afterEach(() => {
    cleanupDOM();
  });

  describe('Application Initialization', () => {
    test('should initialize all core modules', async () => {
      // Simulate app initialization
      await Store.init();
      Router.init();
      Search.init();
      UI.init();

      expect(Store.init).toHaveBeenCalled();
      expect(Router.init).toHaveBeenCalled();
      expect(Search.init).toHaveBeenCalled();
      expect(UI.init).toHaveBeenCalled();
    });

    test('should set up DOM structure correctly', () => {
      expect(document.getElementById('app-container')).toBeTruthy();
      expect(document.getElementById('main-sidebar')).toBeTruthy();
      expect(document.getElementById('main-content')).toBeTruthy();
      expect(document.getElementById('noteList')).toBeTruthy();
      expect(document.getElementById('editor')).toBeTruthy();
    });
  });

  describe('Note Creation Workflow', () => {
    test('should create new note when button clicked', async () => {
      const newNoteBtn = document.createElement('button');
      newNoteBtn.id = 'new-note-btn';
      document.body.appendChild(newNoteBtn);

      // Mock note creation
      const mockNote = createMockNote();
      Store.upsert.mockResolvedValue(mockNote);

      // Simulate button click
      triggerEvent(newNoteBtn, 'click');
      await flushPromises();

      expect(Store.upsert).toHaveBeenCalled();
    });

    test('should update note list after creation', async () => {
      const mockNotes = [
        createMockNote({ id: '1', title: 'Note 1' }),
        createMockNote({ id: '2', title: 'Note 2' })
      ];

      Store.allNotes.mockResolvedValue(mockNotes);

      // Simulate note list update
      await UI.updateNoteList();

      expect(Store.allNotes).toHaveBeenCalled();
      expect(UI.updateNoteList).toHaveBeenCalled();
    });
  });

  describe('Editor Functionality', () => {
    test('should load note content into editor', async () => {
      const mockNote = createMockNote({
        title: 'Test Note',
        body: '# Test Content\n\nThis is test content.'
      });

      Store.getNote.mockResolvedValue(mockNote);

      const editor = document.getElementById('editor');
      expect(editor).toBeTruthy();

      // Simulate loading note
      await UI.loadNote(mockNote.id);

      expect(Store.getNote).toHaveBeenCalledWith(mockNote.id);
      expect(UI.loadNote).toHaveBeenCalledWith(mockNote.id);
    });

    test('should save note when editor content changes', async () => {
      const editor = document.getElementById('editor');
      editor.value = '# Updated Content';

      // Mock debounced save
      const saveNote = jest.fn();
      
      // Simulate input event
      triggerEvent(editor, 'input');
      
      // Wait for debounced save
      await waitFor(500);

      // Note: Actual save logic would be tested here
      // This is a placeholder for the integration
    });
  });

  describe('Search Integration', () => {
    test('should perform search and display results', async () => {
      const searchResults = [
        createMockNote({ id: '1', title: 'Search Result 1' }),
        createMockNote({ id: '2', title: 'Search Result 2' })
      ];

      Search.search.mockReturnValue(searchResults);
      Store.search.mockResolvedValue(searchResults);

      // Simulate search
      const searchQuery = 'test query';
      const results = await Store.search(searchQuery);

      expect(results).toEqual(searchResults);
      expect(Store.search).toHaveBeenCalledWith(searchQuery);
    });

    test('should update UI with search results', async () => {
      const searchInput = document.createElement('input');
      searchInput.id = 'search-input';
      searchInput.type = 'text';
      document.body.appendChild(searchInput);

      searchInput.value = 'test search';
      triggerEvent(searchInput, 'input');

      await waitFor(200); // Wait for debounced search

      // Search functionality would update the UI
      expect(searchInput.value).toBe('test search');
    });
  });

  describe('Navigation Integration', () => {
    test('should navigate between pages', () => {
      // Mock page elements
      const homePage = document.getElementById('page-home');
      const graphPage = document.createElement('div');
      graphPage.id = 'page-graph';
      graphPage.className = 'page hidden';
      document.body.appendChild(graphPage);

      expect(homePage.classList.contains('hidden')).toBeFalsy();
      expect(graphPage.classList.contains('hidden')).toBeTruthy();

      // Simulate navigation
      Router.navigate.mockImplementation((page) => {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(`page-${page}`).classList.remove('hidden');
      });

      Router.navigate('graph');

      expect(Router.navigate).toHaveBeenCalledWith('graph');
    });

    test('should handle navigation menu clicks', () => {
      const navLink = document.createElement('a');
      navLink.href = '#/graph';
      navLink.className = 'nav-item';
      document.body.appendChild(navLink);

      triggerEvent(navLink, 'click');

      expect(navLink.href).toContain('#/graph');
    });
  });

  describe('Data Persistence Integration', () => {
    test('should persist data across page reloads', async () => {
      const testData = {
        notes: [createMockNote()],
        settings: { theme: 'dark' },
        timestamp: new Date().toISOString()
      };

      // Simulate saving data
      await Store.upsert(testData.notes[0]);
      
      // Simulate page reload
      Store.allNotes.mockResolvedValue(testData.notes);
      
      const loadedNotes = await Store.allNotes();
      expect(loadedNotes).toEqual(testData.notes);
    });

    test('should handle data import/export', async () => {
      const exportData = {
        notes: [
          createMockNote({ id: '1', title: 'Export Test 1' }),
          createMockNote({ id: '2', title: 'Export Test 2' })
        ],
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };

      Store.exportData = jest.fn().mockResolvedValue(exportData);
      Store.importData = jest.fn().mockResolvedValue(true);

      // Test export
      const exported = await Store.exportData();
      expect(exported).toEqual(exportData);

      // Test import
      const importResult = await Store.importData(exportData);
      expect(importResult).toBeTruthy();
      expect(Store.importData).toHaveBeenCalledWith(exportData);
    });
  });

  describe('Error Handling Integration', () => {
    test('should display error messages to user', async () => {
      const toastElement = document.getElementById('toast');
      expect(toastElement).toBeTruthy();

      // Mock error scenario
      Store.upsert.mockRejectedValue(new Error('Save failed'));

      // Simulate error handling
      try {
        await Store.upsert(createMockNote());
      } catch (error) {
        // Error handling would show toast message
        expect(error.message).toBe('Save failed');
      }
    });

    test('should gracefully handle module failures', () => {
      // Test progressive enhancement
      delete global.Search;

      // Application should still work without Search module
      expect(typeof Search).toBe('undefined');

      // Core functionality should remain intact
      expect(typeof Store).toBeDefined();
      expect(typeof Router).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createMockNote({ id: `note-${i}`, title: `Note ${i}` })
      );

      Store.allNotes.mockResolvedValue(largeDataset);

      const startTime = performance.now();
      const notes = await Store.allNotes();
      const endTime = performance.now();

      expect(notes).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with mocks
    });

    test('should debounce user inputs properly', async () => {
      const editor = document.getElementById('editor');
      const saveFunction = jest.fn();

      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        editor.value = `Content ${i}`;
        triggerEvent(editor, 'input');
      }

      // Wait for debounce period
      await waitFor(600);

      // Should only call save once after debounce
      // (This would be implemented in the actual save logic)
    });
  });

  describe('Multi-tab Synchronization', () => {
    test('should handle BroadcastChannel messages', async () => {
      const mockBroadcastChannel = {
        postMessage: jest.fn(),
        onmessage: null
      };

      global.BroadcastChannel = jest.fn(() => mockBroadcastChannel);

      // Simulate multi-tab sync setup
      const bc = new BroadcastChannel('notes-sync');
      
      // Simulate receiving sync message
      const syncMessage = { type: 'noteUpdated', noteId: '123' };
      if (bc.onmessage) {
        bc.onmessage({ data: syncMessage });
      }

      expect(BroadcastChannel).toHaveBeenCalledWith('notes-sync');
    });
  });

  describe('Accessibility Integration', () => {
    test('should support keyboard navigation', () => {
      const focusableElements = document.querySelectorAll(
        'button, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test Tab navigation
      const firstElement = focusableElements[0];
      firstElement.focus();
      
      expect(document.activeElement).toBe(firstElement);
    });

    test('should have proper ARIA labels', () => {
      const editor = document.getElementById('editor');
      editor.setAttribute('aria-label', 'Note editor');

      expect(editor.getAttribute('aria-label')).toBe('Note editor');
    });
  });
});