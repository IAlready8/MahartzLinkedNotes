// 🤖 Review: This file was created by refactoring legacy/ai-knowledge-discovery.js into an ES6 module.

import { Store } from './store.js';
import { toast } from './util.js';

export const AIKnowledgeDiscovery = {
  // Discovery modes
  modes: {
    'connections': {
      name: 'Knowledge Connections',
      description: 'Discover unexpected connections between your notes'
    },
    'gaps': {
      name: 'Knowledge Gaps',
      description: 'Identify areas where you lack information'
    },
    'trends': {
      name: 'Emerging Trends',
      description: 'Find patterns and trends in your knowledge base'
    },
    'insights': {
      name: 'Deep Insights',
      description: 'Generate insights from your knowledge base'
    }
  },
  
  // Initialize AI knowledge discovery
  init() {
    // Add discovery button to the UI
    this.addDiscoveryButton();
  },
  
  // Add discovery button to the UI
  addDiscoveryButton() {
    // Check if button already exists
    if (document.getElementById('discoveryBtn')) return;
    
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const discoveryBtn = document.createElement('button');
      discoveryBtn.id = 'discoveryBtn';
      discoveryBtn.className = 'btn';
      discoveryBtn.textContent = 'AI Discovery';
      discoveryBtn.onclick = () => this.showDiscoveryOptions();
      
      // Insert before the settings button
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn && settingsBtn.parentNode) {
        settingsBtn.parentNode.insertBefore(discoveryBtn, settingsBtn);
      } else {
        topbar.appendChild(discoveryBtn);
      }
    }
  },
  
  // Show discovery options
  showDiscoveryOptions() {
    // Create modal for discovery options
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h2>AI Knowledge Discovery</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Choose a discovery mode:</p>
          <div class="discovery-modes">
            ${Object.entries(this.modes).map(([id, mode]) => `
              <div class="mode-option" data-mode="${id}">
                <div class="mode-name">${mode.name}</div>
                <div class="mode-description">${mode.description}</div>
              </div>
            `).join('')}
          </div>
          <div class="form-actions" style="margin-top: 20px;">
            <button id="cancelDiscovery" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const cancelBtn = document.getElementById('cancelDiscovery');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    
    // Bind mode selection
    const modeOptions = modal.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.startDiscovery(mode);
        close();
      });
    });
  },
  
  // Start discovery process
  async startDiscovery(modeId) {
    const mode = this.modes[modeId];
    if (!mode) {
      toast('Discovery mode not found');
      return;
    }
    
    // Create discovery results modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 90%; max-width: 1000px; height: 90vh;">
        <div class="modal-header">
          <h2>${mode.name}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="height: calc(100% - 60px); overflow: auto;">
          <div id="discoveryContainer" style="height: 100%;">
            <div class="loading">Analyzing your knowledge base...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind close event
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    
    // Perform discovery
    try {
      const results = await this.performDiscovery(modeId);
      this.displayResults(mode, results);
    } catch (error) {
      console.error('Discovery failed:', error);
      const container = document.getElementById('discoveryContainer');
      if (container) {
        container.innerHTML = `<div class="error">Discovery failed: ${error.message}</div>`;
      }
    }
  },
  
  // Perform discovery based on mode
  async performDiscovery(modeId) {
    // Get all notes
    const notes = await Store.allNotes();
    
    // Simulate AI analysis (in a real implementation, this would use actual AI)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    switch (modeId) {
      case 'connections':
        return this.discoverConnections(notes);
      case 'gaps':
        return this.discoverGaps(notes);
      case 'trends':
        return this.discoverTrends(notes);
      case 'insights':
        return this.discoverInsights(notes);
      default:
        throw new Error('Unknown discovery mode');
    }
  },
  
  // Discover connections between notes
  discoverConnections(notes) {
    // Find notes with similar tags
    const tagGroups = {};
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (!tagGroups[tag]) tagGroups[tag] = [];
          tagGroups[tag].push(note);
        });
      }
    });
    
    // Find connections
    const connections = [];
    Object.entries(tagGroups).forEach(([tag, tagNotes]) => {
      if (tagNotes.length > 1) {
        connections.push({
          type: 'Tag Connection',
          description: `Notes connected by tag ${tag}`,
          notes: tagNotes.slice(0, 3).map(note => note.title),
          strength: tagNotes.length
        });
      }
    });
    
    // Find content similarities (simplified)
    for (let i = 0; i < Math.min(notes.length, 5); i++) {
      for (let j = i + 1; j < Math.length, 5); j++) {
        const note1 = notes[i];
        const note2 = notes[j];
        
        // Simple similarity check (in reality, this would use NLP)
        const similarity = this.calculateSimilarity(note1.body, note2.body);
        if (similarity > 0.3) {
          connections.push({
            type: 'Content Similarity',
            description: `Similar content between notes`,
            notes: [note1.title, note2.title],
            strength: Math.round(similarity * 100)
          });
        }
      }
    }
    
    return {n      title: 'Knowledge Connections',
      description: 'Unexpected connections found in your knowledge base',
      items: connections.slice(0, 10)
    };
  },
  
  // Simple similarity calculation (in reality, this would use NLP)
  calculateSimilarity(text1, text2) {
    // This is a very simplified implementation
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  },
  
  // Discover knowledge gaps
  discoverGaps(notes) {
    // Identify underrepresented topics
    const tagCounts = {};
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Find tags with few notes
    const gaps = Object.entries(tagCounts)
      .filter(([tag, count]) => count === 1)
      .map(([tag, count]) => ({
        type: 'Single Note Tag',
        description: `Tag ${tag} only appears in one note`,
        tag: tag,
        count: count
      }));
    
    // Suggest new topics based on existing tags
    const existingTags = Object.keys(tagCounts);
    const suggestions = existingTags.slice(0, 5).map(tag => ({
      type: 'Topic Suggestion',
      description: `Consider exploring related topics to ${tag}`,
      tag: tag
    }));
    
    return {
      title: 'Knowledge Gaps',
      description: 'Areas where your knowledge could be expanded',
      items: [...gaps, ...suggestions]
    };
  },
  
  // Discover trends
  discoverTrends(notes) {
    // Sort notes by date
    const sortedNotes = [...notes].sort((a, b) => 
      (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    );
    
    // Get recent notes
    const recentNotes = sortedNotes.slice(0, 10);
    
    // Find common tags in recent notes
    const recentTagCounts = {};
    recentNotes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          recentTagCounts[tag] = (recentTagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Find trending tags
    const trends = Object.entries(recentTagCounts)
      .filter(([tag, count]) => count > 1)
      .map(([tag, count]) => ({
        type: 'Trending Tag',
        description: `Tag ${tag} appears frequently in recent notes`,
        tag: tag,
        count: count
      }));
    
    // Find recently updated notes
    const recentUpdates = recentNotes.slice(0, 5).map(note => ({
      type: 'Recent Activity',
      description: `Recently updated note`,
      note: note.title,
      date: new Date(note.updatedAt || note.createdAt).toLocaleDateString()
    }));
    
    return {
      title: 'Emerging Trends',
      description: 'Patterns and trends in your recent knowledge work',
      items: [...trends, ...recentUpdates]
    };
  },
  
  // Discover insights
  discoverInsights(notes) {
    // Find most linked notes
    const linkCounts = {};
    notes.forEach(note => {
      if (note.links) {
        note.links.forEach(link => {
          linkCounts[link] = (linkCounts[link] || 0) + 1;
        });
      }
    });
    
    // Find most referenced notes
    const mostReferenced = Object.entries(linkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([noteId, count]) => {
        const note = notes.find(n => n.id === noteId);
        return {
          type: 'Highly Referenced',
          description: `Note referenced ${count} times`,
          note: note ? note.title : 'Unknown Note',
          count: count
        };
      });
    
    // Find notes with many links
    const mostConnected = notes
      .filter(note => note.links && note.links.length > 5)
      .slice(0, 3)
      .map(note => ({
        type: 'Highly Connected',
        description: `Note with ${note.links.length} outgoing links`,
        note: note.title,
        count: note.links.length
      }));
    
    // Find isolated notes
    const isolatedNotes = notes
      .filter(note => (!note.links || note.links.length === 0) && 
                     (!linkCounts[note.id] || linkCounts[note.id] === 0))
      .slice(0, 3)
      .map(note => ({
        type: 'Isolated Note',
        description: `Note with no connections`,
        note: note.title
      }));
    
    return {
      title: 'Deep Insights',
      description: 'Valuable insights from analyzing your knowledge base',
      items: [...mostReferenced, ...mostConnected, ...isolatedNotes]
    };
  },
  
  // Display discovery results
  displayResults(mode, results) {
    const container = document.getElementById('discoveryContainer');
    if (!container) return;
    
    let html = `
      <div class="discovery-results">
        <div class="results-header">
          <h1>${results.title}</h1>
          <p>${results.description}</p>
        </div>
        <div class="results-list">
    `;
    
    results.items.forEach((item, index) => {
      html += `
        <div class="result-item">
          <div class="result-header">
            <h3>${item.type}</h3>
            <div class="result-strength">${item.count || ''}</div>
          </div>
          <div class="result-description">${item.description}</div>
          <div class="result-details">
            ${item.notes ? `<div>Notes: ${item.notes.join(', ')}</div>` : ''}
            ${item.tag ? `<div>Tag: ${item.tag}</div>` : ''}
            ${item.note ? `<div>Note: ${item.note}</div>` : ''}
            ${item.date ? `<div>Date: ${item.date}</div>` : ''}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
};
