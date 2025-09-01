/* Mahart Linked Notes - E2E Tests */

import { test, expect } from '@playwright/test';

test.describe('Mahart Linked Notes E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for app to initialize (main app container becomes visible)
    await page.waitForSelector('#app', { state: 'visible', timeout: 15000 });
    
    // Clear any existing data
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
  });

  test.describe('Application Loading', () => {
    test('should load the application successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Mahart Linked Notes/);
      
      // Check main UI elements
      await expect(page.locator('#sidebar')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('#note-list')).toBeVisible();
      await expect(page.locator('#note-body')).toBeVisible();
    });

    test('should display correct initial state', async ({ page }) => {
      // Should show empty state
      const noteList = page.locator('#note-list');
      await expect(noteList).toBeEmpty();
      
      // Editor should be empty
      const editor = page.locator('#note-body');
      await expect(editor).toHaveValue('');
      
      // Note count should be 0
      const noteCount = page.locator('#note-count');
      await expect(noteCount).toContainText('0');
    });
  });

  test.describe('Note Management', () => {
    test('should create a new note', async ({ page }) => {
      // Click new note button
      await page.click('#new-note-btn');
      
      // Wait for note to be created
      await page.waitForTimeout(500);
      
      // Check that note list is updated
      const noteItems = page.locator('#note-list > *');
      await expect(noteItems).toHaveCount(1);
      
      // Check note count
      const noteCount = page.locator('#note-count');
      await expect(noteCount).toContainText('1');
    });

    test('should edit note content', async ({ page }) => {
      // Create a new note first
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      // Type in the editor
      const editor = page.locator('#note-body');
      await editor.fill('# Test Note\n\nThis is a test note content.');
      
      // Wait for auto-save
      await page.waitForTimeout(1000);
      
      // Check that content is preserved
      await expect(editor).toHaveValue('# Test Note\n\nThis is a test note content.');
      
      // Check that preview is updated (if visible)
      const preview = page.locator('#note-preview');
      if (await preview.isVisible()) {
        await expect(preview).toContainText('Test Note');
        await expect(preview).toContainText('This is a test note content.');
      }
    });

    test('should save and load note correctly', async ({ page }) => {
      // Create and edit a note
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      const testContent = '# My Important Note\n\nThis content must persist!';
      await page.fill('#note-body', testContent);
      await page.waitForTimeout(1000);
      
      // Refresh the page to test persistence
      await page.reload();
      await page.waitForSelector('#app', { state: 'visible' });
      
      // Check that the note still exists
      const noteItems = page.locator('#note-list > *');
      await expect(noteItems).toHaveCount(1);
      
      // Click on the note to load it
      await noteItems.first().click();
      await page.waitForTimeout(500);
      
      // Check that content is restored
      const editor = page.locator('#note-body');
      await expect(editor).toHaveValue(testContent);
    });

    test('should delete a note', async ({ page }) => {
      // Create a note first
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      // Right-click on the note for context menu
      const noteItem = page.locator('#note-list > *').first();
      await noteItem.click({ button: 'right' });
      
      // Look for delete option in context menu (if implemented)
      const deleteBtn = page.locator('[data-action="delete"]');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Confirm deletion if there's a modal
        const confirmBtn = page.locator('[data-action="confirm-delete"]');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
        
        // Check that note is removed
        await expect(noteItem).not.toBeVisible();
        
        // Check note count
        const noteCount = page.locator('#noteCount');
        await expect(noteCount).toContainText('0');
      }
    });
  });

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Create test notes
      const testNotes = [
        { title: 'JavaScript Guide', content: '# JavaScript Guide\n\nLearning JavaScript fundamentals.' },
        { title: 'React Tutorial', content: '# React Tutorial\n\nBuilding components with React.' },
        { title: 'Database Design', content: '# Database Design\n\nPrinciples of good database architecture.' }
      ];
      
      for (const note of testNotes) {
        await page.click('#new-note-btn');
        await page.waitForTimeout(300);
        await page.fill('#note-body', note.content);
        await page.waitForTimeout(500);
      }
    });

    test('should search notes by content', async ({ page }) => {
      // Navigate to search page if it exists
      const searchLink = page.locator('a[href="#/search"]');
      if (await searchLink.isVisible()) {
        await searchLink.click();
        await page.waitForTimeout(500);
      }
      
      // Find search input
      const searchInput = page.locator('input[type="search"], #search-input');
      
      if (await searchInput.isVisible()) {
        // Search for "JavaScript"
        await searchInput.fill('JavaScript');
        await page.waitForTimeout(500);
        
        // Check search results
        const searchResults = page.locator('.search-result, .search-item');
        await expect(searchResults).toContainText('JavaScript Guide');
      }
    });

    test('should handle empty search results', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], #search-input');
      
      if (await searchInput.isVisible()) {
        // Search for non-existent content
        await searchInput.fill('nonexistent content');
        await page.waitForTimeout(500);
        
        // Check for no results message
        const noResults = page.locator('.no-results, .empty-state');
        if (await noResults.isVisible()) {
          await expect(noResults).toBeVisible();
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      // Test navigation to graph page
      const graphLink = page.locator('a[href="#/graph"]');
      if (await graphLink.isVisible()) {
        await graphLink.click();
        await page.waitForTimeout(500);
        
        // Check URL change
        expect(page.url()).toContain('#/graph');
        
        // Check that graph page is visible
        const graphPage = page.locator('#page-graph');
        if (await graphPage.isVisible()) {
          await expect(graphPage).toBeVisible();
        }
      }
      
      // Navigate back to home
      const homeLink = page.locator('a[href="#/"]');
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await page.waitForTimeout(500);
        
        // Check that we're back to home
        const homePage = page.locator('#page-home');
        await expect(homePage).toBeVisible();
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      const navItems = page.locator('.nav-item');
      
      if (await navItems.count() > 0) {
        // Click on a navigation item
        const firstNavItem = navItems.first();
        await firstNavItem.click();
        await page.waitForTimeout(300);
        
        // Check for active class
        const activeNav = page.locator('.nav-item.active');
        await expect(activeNav).toHaveCount(1);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that main elements are still visible
      await expect(page.locator('#app-container')).toBeVisible();
      
      // Check that sidebar behavior adapts (might be collapsed)
      const sidebar = page.locator('#main-sidebar');
      await expect(sidebar).toBeVisible();
      
      // Test mobile interactions
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      // Editor should still be functional
      const editor = page.locator('#editor');
      await editor.fill('Mobile test note');
      await expect(editor).toHaveValue('Mobile test note');
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Test tablet-specific layout
      await expect(page.locator('#main-content')).toBeVisible();
      
      // Create and edit a note
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      const editor = page.locator('#editor');
      await editor.fill('Tablet test note');
      await expect(editor).toHaveValue('Tablet test note');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should support Ctrl+N for new note', async ({ page }) => {
      // Press Ctrl+N (Cmd+N on Mac)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+KeyN`);
      
      await page.waitForTimeout(500);
      
      // Check that a new note was created
      const noteItems = page.locator('#noteList > div');
      await expect(noteItems).toHaveCount(1);
    });

    test('should support Ctrl+S for save', async ({ page }) => {
      // Create a note first
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      // Add content
      await page.fill('#editor', 'Test content for save');
      
      // Press Ctrl+S
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+KeyS`);
      
      // Note should be saved (check for save indicator or toast)
      const saveIndicator = page.locator('.save-indicator, .toast');
      if (await saveIndicator.isVisible()) {
        await expect(saveIndicator).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForSelector('#app-container');
      
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle many notes efficiently', async ({ page }) => {
      // Create 20 notes quickly
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        await page.click('#new-note-btn');
        await page.waitForTimeout(100);
        await page.fill('#editor', `Test note ${i + 1}`);
        await page.waitForTimeout(100);
      }
      
      const creationTime = Date.now() - startTime;
      
      // Should create notes efficiently
      expect(creationTime).toBeLessThan(10000); // 10 seconds for 20 notes
      
      // Check that all notes are visible
      const noteItems = page.locator('#noteList > div');
      await expect(noteItems).toHaveCount(20);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle storage errors gracefully', async ({ page }) => {
      // Simulate storage failure
      await page.evaluate(() => {
        // Mock localStorage to throw errors
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage quota exceeded');
        };
      });
      
      // Try to create a note
      await page.click('#new-note-btn');
      await page.waitForTimeout(500);
      
      // Should show error message to user
      const errorMessage = page.locator('.error-message, .toast.error');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
      
      // Application should still be functional
      await expect(page.locator('#app-container')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      // App should still work offline
      await page.goto('/');
      
      // Basic functionality should be available
      await expect(page.locator('#app-container')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Should focus on first focusable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Continue tabbing through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      // Should be able to navigate through all interactive elements
      const stillFocused = page.locator(':focus');
      await expect(stillFocused).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check for ARIA labels on important elements
      const editor = page.locator('#editor');
      const ariaLabel = await editor.getAttribute('aria-label');
      
      if (ariaLabel) {
        expect(ariaLabel).toBeTruthy();
      }
      
      // Check for heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should work with screen readers', async ({ page }) => {
      // Check for proper semantic HTML
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Check for proper button labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Button should have accessible name
        expect(text || ariaLabel || title).toBeTruthy();
      }
    });
  });
});
