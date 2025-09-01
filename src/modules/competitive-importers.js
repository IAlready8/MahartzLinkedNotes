// 🤖 Review: This file was created by refactoring legacy/competitive-importers.js into an ES6 module.

import localforage from 'localforage';
import { Store, Note } from './store.js';
import { UI } from './ui.js';
import { toast } from './util.js';

export const CompetitiveImporters = {
  // Supported platforms
  platforms: {
    'roam': {
      name: 'Roam Research',
      description: 'Import from Roam Research exports',
      fileExtension: '.json'
    },
    'obsidian': {
      name: 'Obsidian',
      description: 'Import from Obsidian markdown files',
      fileExtension: '.md'
    },
    'notion': {
      name: 'Notion',
      description: 'Import from Notion exports',
      fileExtension: '.csv'
    },
    'bear': {
      name: 'Bear',
      description: 'Import from Bear notes',
      fileExtension: '.bear'
    }
  },
  
  // Initialize competitive importers
  init() {
    // Add import options to the import button
    this.enhanceImportButton();
  },
  
  // Enhance import button with platform options
  enhanceImportButton() {
    // Modify the existing import button behavior
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      // Store original click handler
      const originalClick = importBtn.onclick;
      
      // Replace with enhanced handler
      importBtn.onclick = (e) => {
        e.preventDefault();
        this.showImportOptions();
      };
    }
  },
  
  // Show import options
  showImportOptions() {
    // Create modal for import options
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>Import from Competitor Platforms</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Select a platform to import from:</p>
          <div class="import-platforms">
            ${Object.entries(this.platforms).map(([id, platform]) => `
              <div class="platform-option" data-platform="${id}">
                <div class="platform-name">${platform.name}</div>
                <div class="platform-description">${platform.description}</div>
                <div class="platform-extension">Supports ${platform.fileExtension} files</div>
              </div>
            `).join('')}
          </div>
          <div class="form-actions" style="margin-top: 20px;">
            <button id="cancelImport" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const cancelBtn = document.getElementById('cancelImport');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    
    // Bind platform selection
    const platformOptions = modal.querySelectorAll('.platform-option');
    platformOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const platform = e.currentTarget.dataset.platform;
        this.importFromPlatform(platform);
        close();
      });
    });
  },
  
  // Import from specific platform
  importFromPlatform(platformId) {
    const platform = this.platforms[platformId];
    if (!platform) {
      toast('Platform not supported');
      return;
    }
    
    // Create file input for the specific platform
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = platform.fileExtension;
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        await this.processImport(file, platformId);
        toast(`Successfully imported from ${platform.name}`);
      } catch (error) {
        console.error('Import failed:', error);
        toast('Import failed');
      }
    };
    
    input.click();
  },
  
  // Process import based on platform
  async processImport(file, platformId) {
    switch (platformId) {
      case 'roam':
        return this.importFromRoam(file);
      case 'obsidian':
        return this.importFromObsidian(file);
      case 'notion':
        return this.importFromNotion(file);
      case 'bear':
        return this.importFromBear(file);
      default:
        throw new Error('Unsupported platform');
    }
  },
  
  // Import from Roam Research
  async importFromRoam(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Convert Roam structure to our format
    const notes = [];
    
    const processRoamNode = (node, parentId = null) => {
      if (!node.title && !node.string) return;
      
      const note = Note.create({
        title: node.title || 'Untitled',
        body: node.string || '',
        tags: ['#imported', '#roam']
      });
      
      notes.push(note);
      
      // Process children
      if (node.children) {
        node.children.forEach(child => processRoamNode(child, note.id));
      }
    };
    
    // Process all pages
    if (data.pages) {
      data.pages.forEach(page => processRoamNode(page));
    }
    
    // Save notes
    await Store.saveNotes(notes);
    await UI.refresh();
  },
  
  // Import from Obsidian
  async importFromObsidian(file) {
    const text = await file.text();
    
    // Simple conversion - in reality, this would be more complex
    const note = Note.create({
      title: file.name.replace('.md', ''),
      body: text,
      tags: ['#imported', '#obsidian']
    });
    
    await Store.upsert(note);
    await UI.refresh();
  },
  
  // Import from Notion
  async importFromNotion(file) {
    const text = await file.text();
    
    // Parse CSV - simple implementation
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    // Create notes from rows
    const notes = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const data = {};
      headers.forEach((header, index) => {
        data[header] = values[index] || '';
      });
      
      const note = Note.create({
        title: data.Title || data.title || 'Untitled',
        body: data.Content || data.content || '',
        tags: ['#imported', '#notion']
      });
      
      notes.push(note);
    }
    
    await Store.saveNotes(notes);
    await UI.refresh();
  },
  
  // Import from Bear
  async importFromBear(file) {
    const text = await file.text();
    
    // Simple conversion - in reality, this would be more complex
    const note = Note.create({
      title: file.name.replace('.bear', ''),
      body: text,
      tags: ['#imported', '#bear']
    });
    
    await Store.upsert(note);
    await UI.refresh();
  }
};
