// Street Style Enhancements for Mahart Linked Notes
// Adds interactive urban elements and visual effects

document.addEventListener('DOMContentLoaded', function() {
  // Add street-style effects to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', function() {
      this.classList.add('pulse-street');
    });
    
    button.addEventListener('mouseup', function() {
      this.classList.remove('pulse-street');
    });
    
    button.addEventListener('mouseleave', function() {
      this.classList.remove('pulse-street');
    });
  });

  // Add street-style effects to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.classList.add('bounce-street');
    });
    
    card.addEventListener('animationend', function() {
      this.classList.remove('bounce-street');
    });
  });

  // Add street-style effects to navigation items
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      navItems.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');
    });
  });

  // Add street-style effects to note list items
  const noteItems = document.querySelectorAll('#note-list > div');
  noteItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      noteItems.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');
    });
  });

  // Add dynamic graffiti-style text effects
  function applyGraffitiEffects() {
    const graffitiTitles = document.querySelectorAll('.graffiti-title');
    graffitiTitles.forEach((title, index) => {
      // Add slight rotation for graffiti effect
      const rotation = (Math.random() * 4) - 2; // -2 to 2 degrees
      title.style.transform = `rotate(${rotation}deg)`;
      
      // Add subtle text shadow variations
      const shadows = [
        '0 0 5px #ff0055, 0 0 10px #ff0055',
        '0 0 5px #00f0ff, 0 0 10px #00f0ff',
        '0 0 5px #ffcc00, 0 0 10px #ffcc00',
        '0 0 5px #bd00ff, 0 0 10px #bd00ff'
      ];
      const randomShadow = shadows[Math.floor(Math.random() * shadows.length)];
      title.style.textShadow = randomShadow;
    });
  }

  // Apply graffiti effects on load and periodically
  applyGraffitiEffects();
  setInterval(applyGraffitiEffects, 5000);

  // Add spray paint effect on button clicks
  function createSprayEffect(element) {
    const rect = element.getBoundingClientRect();
    const spray = document.createElement('div');
    spray.className = 'spray-effect';
    spray.style.position = 'absolute';
    spray.style.left = (rect.left + rect.width / 2) + 'px';
    spray.style.top = (rect.top + rect.height / 2) + 'px';
    spray.style.width = '10px';
    spray.style.height = '10px';
    spray.style.borderRadius = '50%';
    spray.style.background = 'radial-gradient(circle, rgba(255,0,85,0.8) 0%, rgba(255,0,85,0) 70%)';
    spray.style.pointerEvents = 'none';
    spray.style.zIndex = '9999';
    document.body.appendChild(spray);
    
    // Animate the spray effect
    let size = 10;
    const grow = setInterval(() => {
      size += 5;
      spray.style.width = size + 'px';
      spray.style.height = size + 'px';
      spray.style.left = (rect.left + rect.width / 2 - size / 2) + 'px';
      spray.style.top = (rect.top + rect.height / 2 - size / 2) + 'px';
      spray.style.opacity = 1 - (size / 100);
      
      if (size > 100) {
        clearInterval(grow);
        document.body.removeChild(spray);
      }
    }, 50);
  }

  // Add spray effect to primary buttons
  const primaryButtons = document.querySelectorAll('.btn-primary');
  primaryButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      createSprayEffect(this);
    });
  });

  // Add dynamic background elements
  function addBackgroundElements() {
    const background = document.createElement('div');
    background.className = 'street-background-elements';
    background.style.position = 'fixed';
    background.style.top = '0';
    background.style.left = '0';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.pointerEvents = 'none';
    background.style.zIndex = '-1';
    background.style.overflow = 'hidden';
    
    // Add some graffiti-style shapes
    for (let i = 0; i < 5; i++) {
      const shape = document.createElement('div');
      shape.style.position = 'absolute';
      shape.style.width = (Math.random() * 100 + 50) + 'px';
      shape.style.height = (Math.random() * 100 + 50) + 'px';
      shape.style.left = (Math.random() * 100) + '%';
      shape.style.top = (Math.random() * 100) + '%';
      shape.style.opacity = '0.05';
      shape.style.background = 'var(--graffiti-gradient)';
      shape.style.transform = `rotate(${Math.random() * 360}deg)`;
      shape.style.borderRadius = (Math.random() > 0.5) ? '50%' : '0';
      background.appendChild(shape);
    }
    
    document.body.appendChild(background);
  }

  // Add background elements on load
  addBackgroundElements();

  // Add keyboard shortcuts for street-style effects
  document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+S for spray effect toggle
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      document.body.classList.toggle('spray-effects-enabled');
    }
    
    // Ctrl+Shift+G for graffiti mode
    if (e.ctrlKey && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      document.body.classList.toggle('graffiti-mode');
    }
  });

  // Add street-style loading effects
  const loadingScreen = document.getElementById('app-loading');
  if (loadingScreen) {
    // Add pulsing effect to spinner
    const spinner = loadingScreen.querySelector('.spinner');
    if (spinner) {
      setInterval(() => {
        spinner.style.boxShadow = spinner.style.boxShadow ? '' : '0 0 10px var(--street-primary)';
      }, 1000);
    }
  }

  // Add street-style transitions to page changes
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.addEventListener('transitionstart', function() {
      this.style.opacity = '0.5';
    });
    
    page.addEventListener('transitionend', function() {
      this.style.opacity = '1';
    });
  });

  console.log('Street Style Enhancements loaded successfully!');
});

// Add CSS for dynamic effects
const style = document.createElement('style');
style.textContent = `
  .spray-effect {
    animation: spray-pulse 0.5s ease-out forwards;
  }
  
  @keyframes spray-pulse {
    0% {
      transform: scale(0);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
  
  .street-background-elements {
    display: none;
  }
  
  .spray-effects-enabled .street-background-elements {
    display: block;
  }
  
  .graffiti-mode h1, .graffiti-mode h2, .graffiti-mode h3 {
    font-family: var(--font-graffiti) !important;
    transform: rotate(-2deg) !important;
  }
  
  .page {
    transition: opacity 0.3s ease;
  }
`;
document.head.appendChild(style);