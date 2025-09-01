// Street Style Enhancements for Mahart Linked Notes

export function initStreetStyle() {
  console.log('Initializing Street Style enhancements...');
  
  // Apply street style to existing elements
  applyStreetStyleToElements();
  
  // Add street style animations
  addStreetAnimations();
  
  // Enhance note cards with street style
  enhanceNoteCards();
  
  // Add graffiti-inspired elements
  addGraffitiElements();
  
  // Set up event listeners for dynamic enhancements
  setupEventListeners();
}

function applyStreetStyleToElements() {
  // Apply street style classes to key elements
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.add('street-sidebar');
  }
  
  // Apply street style to buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    if (button.classList.contains('btn-primary')) {
      button.classList.add('street-btn-primary');
    } else if (button.classList.contains('btn-secondary')) {
      button.classList.add('street-btn-secondary');
    }
  });
  
  // Apply street style to inputs
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.classList.add('street-input');
  });
  
  // Apply street style to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.add('street-card');
  });
}

function addStreetAnimations() {
  // Add pulse animation to key elements
  const primaryButtons = document.querySelectorAll('.btn-primary');
  primaryButtons.forEach(button => {
    button.classList.add('pulse-street');
  });
  
  // Add hover effects to navigation items
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateX(5px)';
      item.style.boxShadow = '0 0 10px rgba(255, 0, 85, 0.5)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateX(0)';
      item.style.boxShadow = 'none';
    });
  });
}

function enhanceNoteCards() {
  // Add street style enhancements to note cards
  const noteItems = document.querySelectorAll('#note-list > div');
  noteItems.forEach((item, index) => {
    // Add a delay to the animation based on index for a staggered effect
    item.style.animationDelay = `${index * 0.1}s`;
    
    // Add hover effect
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateX(10px)';
      item.style.boxShadow = '0 0 15px rgba(255, 0, 85, 0.5)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateX(0)';
      item.style.boxShadow = 'none';
    });
  });
}

function addGraffitiElements() {
  // Add graffiti-inspired decorative elements
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    // Add a graffiti-style accent element
    const graffitiElement = document.createElement('div');
    graffitiElement.className = 'graffiti-accent';
    graffitiElement.innerHTML = `
      <svg viewBox="0 0 100 100" class="graffiti-svg">
        <path d="M20,20 Q40,5 60,20 T100,20" stroke="#ff0055" fill="none" stroke-width="2"/>
        <path d="M10,50 Q30,30 50,50 T90,50" stroke="#00f0ff" fill="none" stroke-width="2"/>
        <path d="M15,80 Q35,60 55,80 T95,80" stroke="#ffcc00" fill="none" stroke-width="2"/>
      </svg>
    `;
    sidebar.appendChild(graffitiElement);
  }
  
  // Add graffiti-style corner elements to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const cornerElement = document.createElement('div');
    cornerElement.className = 'graffiti-corner';
    cornerElement.innerHTML = `
      <svg viewBox="0 0 20 20" class="corner-svg">
        <path d="M0,0 L20,0 L20,20" stroke="url(#graffitiGradient)" fill="none" stroke-width="2"/>
        <defs>
          <linearGradient id="graffitiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff0055"/>
            <stop offset="50%" stop-color="#ffcc00"/>
            <stop offset="100%" stop-color="#00f0ff"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    card.appendChild(cornerElement);
  });
}

function setupEventListeners() {
  // Add street style enhancements when new elements are created
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          // Apply street style to dynamically added buttons
          if (node.tagName === 'BUTTON') {
            if (node.classList.contains('btn-primary')) {
              node.classList.add('street-btn-primary');
              node.classList.add('pulse-street');
            } else if (node.classList.contains('btn-secondary')) {
              node.classList.add('street-btn-secondary');
            }
          }
          
          // Apply street style to dynamically added inputs
          if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
            node.classList.add('street-input');
          }
          
          // Apply street style to dynamically added cards
          if (node.classList.contains('card')) {
            node.classList.add('street-card');
            addGraffitiElementsToCard(node);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function addGraffitiElementsToCard(card) {
  // Add graffiti-style corner element to a card
  const cornerElement = document.createElement('div');
  cornerElement.className = 'graffiti-corner';
  cornerElement.innerHTML = `
    <svg viewBox="0 0 20 20" class="corner-svg">
      <path d="M0,0 L20,0 L20,20" stroke="url(#graffitiGradient)" fill="none" stroke-width="2"/>
      <defs>
        <linearGradient id="graffitiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0055"/>
          <stop offset="50%" stop-color="#ffcc00"/>
          <stop offset="100%" stop-color="#00f0ff"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  card.appendChild(cornerElement);
}