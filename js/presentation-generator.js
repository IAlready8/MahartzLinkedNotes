/* presentation-generator.js - AI Project Presentation Generator */

const PresentationGenerator = {
  // Initialize presentation generator
  init() {
    // Add presentation mode button to the UI
    this.addPresentationButton();
  },
  
  // Add presentation mode button to the UI
  addPresentationButton() {
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const presentationBtn = document.createElement('button');
      presentationBtn.id = 'presentationBtn';
      presentationBtn.className = 'btn';
      presentationBtn.textContent = 'Presentation';
      presentationBtn.onclick = () => this.startPresentation();
      
      // Insert before the settings button
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn && settingsBtn.parentNode) {
        settingsBtn.parentNode.insertBefore(presentationBtn, settingsBtn);
      } else {
        topbar.appendChild(presentationBtn);
      }
    }
  },
  
  // Start presentation mode
  async startPresentation() {
    // Get current note
    const currentId = UI.state.currentId;
    if (!currentId) {
      toast('Please open a note first');
      return;
    }
    
    const note = await Store.get(currentId);
    if (!note) {
      toast('Note not found');
      return;
    }
    
    // Check if it's an AI project note
    const isAIProject = note.tags && note.tags.some(tag => 
      tag.includes('#ai') || tag.includes('#artificial') ||
      tag.includes('#neural') || tag.includes('#machine') ||
      tag.includes('#deep') || tag.includes('#learning') ||
      tag.includes('#generative') || tag.includes('#automation') ||
      tag.includes('#coding') || tag.includes('#development') ||
      tag.includes('#visualization')
    );
    
    if (!isAIProject) {
      toast('This note is not an AI project');
      return;
    }
    
    // Create presentation modal
    this.createPresentationModal(note);
  },
  
  // Create presentation modal
  createPresentationModal(note) {
    // Remove existing modal if present
    const existingModal = document.getElementById('presentationModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'presentationModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 90%; max-width: 1000px; height: 90vh;">
        <div class="modal-header">
          <h2>Presentation: ${note.title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="height: calc(100% - 60px); overflow: auto;">
          <div id="presentationContainer" style="height: 100%;">
            <div class="loading">Generating presentation...</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind close event
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const closePresentation = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closePresentation);
    overlay.addEventListener('click', closePresentation);
    
    // Generate presentation content
    this.generatePresentationContent(note);
  },
  
  // Generate presentation content
  async generatePresentationContent(note) {
    const container = document.getElementById('presentationContainer');
    if (!container) return;
    
    try {
      // Parse note content to extract sections
      const sections = this.parseNoteContent(note.body);
      
      // Generate presentation HTML
      let presentationHTML = `
        <div class="presentation-view">
          <div class="presentation-header">
            <h1>${note.title}</h1>
            <div class="presentation-meta">
              ${note.tags ? note.tags.map(tag => `<span class="tag ai-tag">${tag}</span>`).join(' ') : ''}
            </div>
          </div>
          <div class="presentation-content">
      `;
      
      // Add sections
      sections.forEach((section, index) => {
        presentationHTML += `
          <div class="presentation-slide" id="slide-${index}">
            <h2>${section.title}</h2>
            <div class="slide-content">${section.content}</div>
          </div>
        `;
      });
      
      presentationHTML += `
          </div>
          <div class="presentation-controls">
            <button id="prevSlide" class="btn">Previous</button>
            <span id="slideCounter">1 / ${sections.length}</span>
            <button id="nextSlide" class="btn">Next</button>
            <button id="exportPresentation" class="btn">Export</button>
          </div>
        </div>
      `;
      
      container.innerHTML = presentationHTML;
      
      // Add slide navigation
      this.setupSlideNavigation(sections.length);
      
      // Add export functionality
      const exportBtn = document.getElementById('exportPresentation');
      if (exportBtn) {
        exportBtn.onclick = () => this.exportPresentation(note, sections);
      }
      
      // Render markdown content
      this.renderPresentationMarkdown();
    } catch (error) {
      console.error('Failed to generate presentation:', error);
      container.innerHTML = `<div class="error">Failed to generate presentation: ${error.message}</div>`;
    }
  },
  
  // Parse note content into sections
  parseNoteContent(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Introduction', content: '' };
    
    lines.forEach(line => {
      // Check for headers (## or ###)
      const headerMatch = line.match(/^(##|###)\s+(.+)$/);
      if (headerMatch) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = { 
          title: headerMatch[2], 
          content: '' 
        };
      } else {
        // Add line to current section
        currentSection.content += line + '\n';
      }
    });
    
    // Add last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  },
  
  // Setup slide navigation
  setupSlideNavigation(totalSlides) {
    let currentSlide = 0;
    const total = totalSlides;
    
    const updateSlide = () => {
      // Hide all slides
      document.querySelectorAll('.presentation-slide').forEach(slide => {
        slide.style.display = 'none';
      });
      
      // Show current slide
      const current = document.getElementById(`slide-${currentSlide}`);
      if (current) {
        current.style.display = 'block';
      }
      
      // Update counter
      const counter = document.getElementById('slideCounter');
      if (counter) {
        counter.textContent = `${currentSlide + 1} / ${total}`;
      }
    };
    
    // Previous button
    const prevBtn = document.getElementById('prevSlide');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentSlide > 0) {
          currentSlide--;
          updateSlide();
        }
      };
    }
    
    // Next button
    const nextBtn = document.getElementById('nextSlide');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentSlide < total - 1) {
          currentSlide++;
          updateSlide();
        }
      };
    }
    
    // Initial update
    updateSlide();
  },
  
  // Render markdown content in presentation
  renderPresentationMarkdown() {
    const slides = document.querySelectorAll('.slide-content');
    slides.forEach(slide => {
      if (typeof renderMD !== 'undefined') {
        slide.innerHTML = renderMD(slide.textContent);
      }
    });
  },
  
  // Export presentation
  exportPresentation(note, sections) {
    // Create a simple HTML presentation
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${note.title} - Presentation</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #0f1115;
            color: #e7ecf5;
          }
          .slide {
            max-width: 800px;
            margin: 0 auto 40px;
            padding: 20px;
            background: #151922;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          h1 { color: #6ee7ff; }
          h2 { color: #9a7cff; border-bottom: 1px solid #1f2434; padding-bottom: 10px; }
          .tags { margin: 10px 0; }
          .tag { 
            background: #111624; 
            border: 1px solid #232c44; 
            color: #6ee7ff; 
            padding: 4px 8px; 
            border-radius: 12px; 
            margin: 2px; 
            font-size: 12px; 
            display: inline-block;
          }
        </style>
      </head>
      <body>
    `;
    
    // Add title slide
    html += `
      <div class="slide">
        <h1>${note.title}</h1>
        <div class="tags">
          ${note.tags ? note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : ''}
        </div>
      </div>
    `;
    
    // Add content slides
    sections.forEach(section => {
      html += `
        <div class="slide">
          <h2>${section.title}</h2>
          <div>${section.content}</div>
        </div>
      `;
    });
    
    html += `
      </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}_presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('Presentation exported');
  }
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PresentationGenerator.init());
} else {
  PresentationGenerator.init();
}