// UI Enhancements for Professional Dark Mode Interface

const UIEnhancements = {
  // Initialize all UI enhancements
  init() {
    this.setupThemeSystem();
    this.setupAnimations();
    this.setupInteractions();
    this.setupResponsiveHandlers();
    this.setupAccessibility();
    this.setupToasts();
    this.setupModals();
    this.setupMobileHandlers();
    console.log('UI Enhancements initialized');
  },

  // Theme System
  setupThemeSystem() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeSelect = document.getElementById('theme-select');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.cycleTheme();
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
  },

  cycleTheme() {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const themes = ['dark', 'light', 'system'];
    const currentIndex = themes.indexOf(current);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    this.setTheme(nextTheme);
  },

  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = theme;
    }

    // Update theme icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 
                        theme === 'light' ? 'fas fa-sun' : 
                        'fas fa-desktop';
      }
    }
  },

  // Animation System
  setupAnimations() {
    // Add entrance animations to elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        }
      });
    });

    // Observe cards and major elements
    document.querySelectorAll('.card, .note-item, .tag').forEach(el => {
      observer.observe(el);
    });

    // Add CSS animations
    this.injectAnimationStyles();
  },

  injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      .animate-fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
      }

      .animate-slide-in {
        animation: slideInLeft 0.4s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  },

  // Interactive Elements
  setupInteractions() {
    // Enhanced button interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn')) {
        const btn = e.target.closest('.btn');
        this.createRippleEffect(btn, e);
      }
    });

    // Enhanced form interactions
    this.setupFormEnhancements();

    // Enhanced navigation interactions
    this.setupNavigationEnhancements();
  },

  createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    if (!document.querySelector('#ripple-styles')) {
      const rippleStyles = document.createElement('style');
      rippleStyles.id = 'ripple-styles';
      rippleStyles.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .btn {
          position: relative;
          overflow: hidden;
        }
      `;
      document.head.appendChild(rippleStyles);
    }

    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  },

  setupFormEnhancements() {
    // Enhanced input focus effects
    document.querySelectorAll('.form-input, .form-textarea, .search-input').forEach(input => {
      input.addEventListener('focus', (e) => {
        e.target.parentElement.classList.add('focused');
      });

      input.addEventListener('blur', (e) => {
        e.target.parentElement.classList.remove('focused');
      });

      // Floating labels effect
      input.addEventListener('input', (e) => {
        if (e.target.value) {
          e.target.classList.add('has-content');
        } else {
          e.target.classList.remove('has-content');
        }
      });
    });
  },

  setupNavigationEnhancements() {
    // Enhanced sidebar navigation
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const rect = e.target.getBoundingClientRect();
        const indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        indicator.style.cssText = `
          position: absolute;
          left: 0;
          top: ${rect.top - document.querySelector('#sidebar').getBoundingClientRect().top}px;
          width: 3px;
          height: ${rect.height}px;
          background: var(--color-accent-primary);
          transition: all 0.3s ease;
          border-radius: 0 2px 2px 0;
        `;
        
        const existingIndicator = document.querySelector('.nav-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }
        
        document.querySelector('#sidebar').appendChild(indicator);
      });
    });

    // Remove indicator when leaving sidebar
    document.querySelector('#sidebar').addEventListener('mouseleave', () => {
      const indicator = document.querySelector('.nav-indicator');
      if (indicator) {
        indicator.remove();
      }
    });
  },

  // Responsive Handlers
  setupResponsiveHandlers() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Handle resize events
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
    });
  },

  setupMobileHandlers() {
    // Touch gestures for mobile
    let startX, startY, currentX, currentY;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;
      
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
      
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      // Swipe left to open sidebar
      if (Math.abs(diffX) > Math.abs(diffY) && diffX < -50 && startX < 50) {
        this.openMobileMenu();
      }
      
      // Swipe right to close sidebar
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
        this.closeMobileMenu();
      }
    });

    document.addEventListener('touchend', () => {
      startX = null;
      startY = null;
    });
  },

  toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    if (sidebar.classList.contains('show')) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.add('show');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  },

  // Accessibility Enhancements
  setupAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });

    // ARIA enhancements
    this.enhanceARIA();

    // Focus management
    this.setupFocusManagement();
  },

  handleKeyboardNavigation(e) {
    // Global shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          this.focusSearch();
          break;
        case 'n':
          e.preventDefault();
          this.createNewNote();
          break;
        case 's':
          e.preventDefault();
          this.saveCurrentNote();
          break;
        case '/':
          e.preventDefault();
          this.focusSearch();
          break;
      }
    }

    // Escape key
    if (e.key === 'Escape') {
      this.handleEscape();
    }
  },

  focusSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  },

  createNewNote() {
    const newNoteBtn = document.getElementById('new-note-btn');
    if (newNoteBtn) {
      newNoteBtn.click();
    }
  },

  saveCurrentNote() {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn && !saveBtn.disabled) {
      saveBtn.click();
    }
  },

  handleEscape() {
    // Close modals
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      this.closeModal();
    }
    
    // Close mobile menu
    this.closeMobileMenu();
    
    // Blur active element
    if (document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  },

  enhanceARIA() {
    // Add ARIA labels and roles
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.setAttribute('role', 'navigation');
      sidebar.setAttribute('aria-label', 'Main navigation');
    }

    // Enhance search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.setAttribute('role', 'searchbox');
      searchInput.setAttribute('aria-label', 'Search notes');
    }

    // Enhance buttons
    document.querySelectorAll('.btn').forEach(btn => {
      if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
        const icon = btn.querySelector('i');
        if (icon) {
          btn.setAttribute('aria-label', this.getIconLabel(icon.className));
        }
      }
    });
  },

  getIconLabel(iconClass) {
    const iconMap = {
      'fa-plus': 'Add new',
      'fa-search': 'Search',
      'fa-save': 'Save',
      'fa-edit': 'Edit',
      'fa-trash': 'Delete',
      'fa-cog': 'Settings',
      'fa-bars': 'Menu',
      'fa-times': 'Close',
      'fa-eye': 'Preview',
      'fa-palette': 'Theme'
    };

    for (const [icon, label] of Object.entries(iconMap)) {
      if (iconClass.includes(icon)) {
        return label;
      }
    }
    return 'Button';
  },

  setupFocusManagement() {
    // Focus trap for modals
    document.addEventListener('keydown', (e) => {
      const modal = document.querySelector('.modal-overlay');
      if (modal && e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  },

  // Toast System
  setupToasts() {
    this.toastContainer = document.getElementById('toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      this.toastContainer.id = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  },

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = this.getToastIcon(type);
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-sm);">
        <i class="${icon}" style="font-size: var(--font-size-lg);"></i>
        <span>${message}</span>
      </div>
    `;

    this.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  },

  getToastIcon(type) {
    const iconMap = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return iconMap[type] || iconMap.info;
  },

  // Modal System
  setupModals() {
    this.modalContainer = document.getElementById('modal-container');
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'modal-container';
      this.modalContainer.className = 'hidden';
      document.body.appendChild(this.modalContainer);
    }
  },

  showModal(title, content, actions = []) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.minWidth = '400px';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
      <h3 class="modal-title">${title}</h3>
      <button class="btn btn-ghost btn-icon modal-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = `btn ${action.class || 'btn-secondary'}`;
      btn.textContent = action.text;
      btn.onclick = () => {
        if (action.onclick) action.onclick();
        this.closeModal();
      };
      modalFooter.appendChild(btn);
    });
    
    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);
    if (actions.length > 0) {
      modal.appendChild(modalFooter);
    }
    
    modalOverlay.appendChild(modal);
    this.modalContainer.appendChild(modalOverlay);
    this.modalContainer.classList.remove('hidden');
    
    // Event listeners
    modalHeader.querySelector('.modal-close').onclick = () => this.closeModal();
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) this.closeModal();
    });
    
    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
    
    return modalOverlay;
  },

  closeModal() {
    const modalOverlay = this.modalContainer.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.remove();
      this.modalContainer.classList.add('hidden');
    }
  },

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UIEnhancements.init());
} else {
  UIEnhancements.init();
}