// E2E tests for basic functionality
import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Wait for main app container to be visible
    await page.waitForSelector('#app', { state: 'visible', timeout: 15000 });
    
    // Clear any existing data for clean tests
    await page.evaluate(() => {
      localStorage.clear();
      return indexedDB.databases().then(databases => {
        return Promise.all(
          databases.map(db => {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve(undefined);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          })
        );
      });
    });
    
    // Reload to ensure clean state
    await page.reload();
    await page.waitForSelector('#app', { state: 'visible' });
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that the main UI elements are present
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="note-body"]')).toBeVisible();
    await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
    
    // Check that the title is correct
    await expect(page).toHaveTitle(/Mahart Linked Notes/);
  });

  test('should create a new note', async ({ page }) => {
    // Click new note button
    await page.click('[data-testid="new-note-btn"]');
    
    // Fill in note details
    await page.fill('[data-testid="note-title"]', 'Test Note');
    await page.fill('[data-testid="note-body"]', 'This is a test note with some content.');
    
    // Save the note
    await page.keyboard.press('Control+s');
    
    // Verify note appears in sidebar
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Test Note');
    
    // Verify note count
    await expect(page.locator('[data-testid="note-count"]')).toContainText('1');
  });

  test('should edit an existing note', async ({ page }) => {
    // Create a note first
    await page.click('[data-testid="new-note-btn"]');
    await page.fill('[data-testid="note-title"]', 'Original Title');
    await page.fill('[data-testid="note-body"]', 'Original content');
    await page.keyboard.press('Control+s');
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Edit the note
    await page.fill('[data-testid="note-title"]', 'Updated Title');
    await page.fill('[data-testid="note-body"]', 'Updated content with more text');
    await page.keyboard.press('Control+s');
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Verify changes
    await expect(page.locator('[data-testid="note-title"]')).toHaveValue('Updated Title');
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Updated Title');
  });

  test('should handle wikilinks', async ({ page }) => {
    // Create first note
    await page.click('[data-testid="new-note-btn"]');
    await page.fill('[data-testid="note-title"]', 'Target Note');
    await page.fill('[data-testid="note-body"]', 'This is the target of the link.');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);
    
    // Create second note with wikilink
    await page.click('[data-testid="new-note-btn"]');
    await page.fill('[data-testid="note-title"]', 'Source Note');
    await page.fill('[data-testid="note-body"]', 'This links to [[Target Note]] in the content.');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);
    
    // Check that wikilink is rendered correctly in preview
    await expect(page.locator('[data-testid="note-preview"] a[data-wikilink]')).toBeVisible();
    
    // Click the wikilink
    await page.click('[data-testid="note-preview"] a[data-wikilink]');
    
    // Verify navigation to target note
    await expect(page.locator('[data-testid="note-title"]')).toHaveValue('Target Note');
  });

  test('should handle tags', async ({ page }) => {
    // Create note with tags
    await page.click('[data-testid="new-note-btn"]');
    await page.fill('[data-testid="note-title"]', 'Tagged Note');
    await page.fill('[data-testid="note-body"]', 'This note has #test and #example tags.');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);
    
    // Check that tags appear in preview
    await expect(page.locator('[data-testid="note-preview"] .tag')).toHaveCount(2);
    
    // Navigate to tags page
    await page.click('[data-route="#/tags"]');
    
    // Verify tags appear in tag list
    await expect(page.locator('[data-testid="tag-list"]')).toContainText('#test');
    await expect(page.locator('[data-testid="tag-list"]')).toContainText('#example');
  });

  test('should search notes', async ({ page }) => {
    // Create multiple notes
    const notes = [
      { title: 'First Note', body: 'This is about JavaScript programming' },
      { title: 'Second Note', body: 'This covers Python development' },
      { title: 'Third Note', body: 'JavaScript and Python comparison' }
    ];
    
    for (const note of notes) {
      await page.click('[data-testid="new-note-btn"]');
      await page.fill('[data-testid="note-title"]', note.title);
      await page.fill('[data-testid="note-body"]', note.body);
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(500);
    }
    
    // Search for 'JavaScript'
    await page.fill('[data-testid="search-input"]', 'JavaScript');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Should show results containing the matching notes
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
    await expect(searchResults).toContainText('First Note');
    await expect(searchResults).toContainText('Third Note');
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await page.waitForTimeout(500);
    
    // Should show all notes in the list
    await expect(page.locator('[data-testid="note-list"]')).toContainText('First Note');
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Second Note');
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Third Note');
  });

  test('should navigate between pages', async ({ page }) => {
    // Test navigation to graph page
    await page.click('[data-route="#/graph"]');
    await expect(page.locator('[data-testid="graph-container"]')).toBeVisible();
    
    // Test navigation to tags page
    await page.click('[data-route="#/tags"]');
    await expect(page.locator('[data-testid="tags-container"]')).toBeVisible();
    
    // Test navigation back to editor
    await page.click('[data-route="#/"]');
    await expect(page.locator('[data-testid="note-body"]')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+N for new note
    await page.keyboard.press('Control+n');
    await expect(page.locator('[data-testid="note-title"]')).toHaveValue('');
    
    // Fill in note
    await page.fill('[data-testid="note-title"]', 'Shortcut Note');
    await page.fill('[data-testid="note-body"]', 'Created with keyboard shortcut');
    
    // Test Ctrl+S for save
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);
    
    // Verify note was saved
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Shortcut Note');
    
    // Test Ctrl+K for search
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
  });

  test('should export and import data', async ({ page }) => {
    // Create a note
    await page.click('[data-testid="new-note-btn"]');
    await page.fill('[data-testid="note-title"]', 'Export Test');
    await page.fill('[data-testid="note-body"]', 'This will be exported');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1000);
    
    // Navigate to settings
    await page.click('[data-route="#/settings"]');
    
    // Export data
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-btn"]')
    ]);
    expect(download.suggestedFilename()).toMatch(/mahart-notes-export-.*\.json/);
    
    // Clear data
    await page.click('[data-testid="clear-data-btn"]');
    
    // Handle confirmation dialog if it appears
    const confirm = page.locator('[data-testid="confirm-clear"]');
    try {
      await confirm.waitFor({ timeout: 2000 });
      await confirm.click();
    } catch (error) {
      // No confirmation dialog - data may clear immediately
    }
    
    // Verify data is cleared
    await page.click('[data-route="#/"]');
    await expect(page.locator('[data-testid="note-count"]')).toContainText('0 notes');
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile');
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');
    
    // Check that mobile UI elements are present
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test that editor is responsive
    await expect(page.locator('[data-testid="note-body"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should handle large amounts of data', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-ready"]');
    
    // Create many notes quickly
    await page.evaluate(async () => {
      const { Store, Note } = window as any;
      
      const notes = [];
      for (let i = 0; i < 100; i++) {
        const note = Note.create({
          title: `Performance Test Note ${i}`,
          body: `This is note number ${i} for performance testing. It contains some content to make it realistic.`,
          tags: [`#test${i % 10}`, '#performance']
        });
        notes.push(note);
      }
      
      // Save all notes
      for (const note of notes) {
        await Store.upsert(note);
      }
      
      return notes.length;
    });
    
    // Refresh to load all data
    await page.reload();
    await page.waitForSelector('[data-testid="app-ready"]');
    
    // Verify all notes loaded
    const noteCount = await page.locator('[data-testid="note-count"]').textContent();
    expect(noteCount).toBe('100 notes');
    
    // Test search performance with large dataset
    const searchStart = Date.now();
    await page.fill('[data-testid="search-input"]', 'performance');
    await page.waitForTimeout(1000);
    const searchTime = Date.now() - searchStart;
    
    // Search should complete quickly
    expect(searchTime).toBeLessThan(1000);
  });
});
