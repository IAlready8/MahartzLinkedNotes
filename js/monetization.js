/* monetization.js — Monetization features and business logic */

const Monetization = {
  // Subscription tiers
  tiers: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        'Basic note-taking',
        'Local storage',
        'Basic search',
        'Up to 100 notes'
      ],
      limits: {
        notes: 100,
        backups: 1,
        sync: false,
        plugins: false,
        export: ['json']
      }
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      features: [
        'Unlimited notes',
        'Cloud sync',
        'Advanced search',
        'Backup & restore',
        'Plugin system',
        'Export to PDF/HTML',
        'Priority support'
      ],
      limits: {
        notes: Infinity,
        backups: 10,
        sync: true,
        plugins: true,
        export: ['json', 'pdf', 'html', 'markdown']
      }
    },
    team: {
      id: 'team',
      name: 'Team',
      price: 29.99,
      features: [
        'All Pro features',
        'Team collaboration',
        'Shared workspaces',
        'Advanced analytics',
        'Custom branding',
        'Dedicated support'
      ],
      limits: {
        notes: Infinity,
        backups: 50,
        sync: true,
        plugins: true,
        export: ['json', 'pdf', 'html', 'markdown', 'docx'],
        teamMembers: 10
      }
    }
  },
  
  // Current user state
  user: {
    id: null,
    email: null,
    tier: 'free',
    subscription: null,
    trialEnds: null,
    lastPayment: null
  },
  
  // Initialize monetization system
  async init() {
    // Load user state
    await this.loadUserState();
    
    // Check subscription status
    await this.checkSubscriptionStatus();
    
    // Initialize UI
    this.initUI();
  },
  
  // Load user state from storage
  async loadUserState() {
    try {
      const savedState = await localforage.getItem('userState');
      if (savedState) {
        this.user = { ...this.user, ...savedState };
      } else {
        // Create new user with trial
        this.user.id = this.generateUserId();
        this.user.tier = 'free';
        this.user.trialEnds = this.addDays(new Date(), 14); // 14-day trial
        await this.saveUserState();
      }
    } catch (error) {
      console.error('Failed to load user state:', error);
    }
  },
  
  // Save user state to storage
  async saveUserState() {
    try {
      await localforage.setItem('userState', this.user);
    } catch (error) {
      console.error('Failed to save user state:', error);
    }
  },
  
  // Check subscription status
  async checkSubscriptionStatus() {
    // In a real implementation, this would check with a payment provider
    // For demo purposes, we'll check if trial has expired
    
    if (this.user.tier === 'free' && this.user.trialEnds) {
      const now = new Date();
      const trialEnd = new Date(this.user.trialEnds);
      
      if (now > trialEnd) {
        // Trial expired
        this.user.tier = 'free';
        this.user.trialEnds = null;
        await this.saveUserState();
        this.showUpgradePrompt();
      }
    }
  },
  
  // Initialize UI components
  initUI() {
    // Add subscription status to UI
    this.updateSubscriptionUI();
  },
  
  // Update subscription UI
  updateSubscriptionUI() {
    // Add subscription info to settings
    const settingsForm = document.querySelector('#settings form');
    if (settingsForm) {
      const subscriptionInfo = document.createElement('div');
      subscriptionInfo.className = 'subscription-info';
      subscriptionInfo.innerHTML = `
        <hr class="sep"/>
        <h3>Subscription</h3>
        <div class="subscription-status">
          <div class="tier-info">
            <strong>Current Plan:</strong> ${this.tiers[this.user.tier].name}
            ${this.user.trialEnds ? 
              `<div class="trial-info">Trial ends: ${new Date(this.user.trialEnds).toLocaleDateString()}</div>` : 
              ''
            }
          </div>
          <button id="upgradeBtn" class="btn">Upgrade Plan</button>
        </div>
      `;
      
      settingsForm.appendChild(subscriptionInfo);
      
      // Bind upgrade button
      const upgradeBtn = document.getElementById('upgradeBtn');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => this.showPricingModal());
      }
    }
  },
  
  // Show upgrade prompt
  showUpgradePrompt() {
    // Create upgrade prompt modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>Upgrade to Pro</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>Your free trial has expired. Upgrade to Pro to continue using advanced features.</p>
          <div class="pricing-cards">
            ${this.renderPricingCard('pro')}
          </div>
          <div class="modal-actions">
            <button id="upgradeNowBtn" class="btn">Upgrade Now</button>
            <button id="laterBtn" class="btn btn-secondary">Later</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const upgradeBtn = document.getElementById('upgradeNowBtn');
    const laterBtn = document.getElementById('laterBtn');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    upgradeBtn.addEventListener('click', () => {
      this.showPricingModal();
      close();
    });
    laterBtn.addEventListener('click', close);
  },
  
  // Show pricing modal
  showPricingModal() {
    // Create pricing modal
    let pricingModal = document.getElementById('pricingModal');
    
    if (!pricingModal) {
      pricingModal = document.createElement('div');
      pricingModal.id = 'pricingModal';
      pricingModal.className = 'modal';
      pricingModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" style="width: 800px;">
          <div class="modal-header">
            <h2>Choose Your Plan</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="pricing-cards">
              ${this.renderPricingCard('free')}
              ${this.renderPricingCard('pro')}
              ${this.renderPricingCard('team')}
            </div>
            <div class="payment-section" id="paymentSection" style="display: none;">
              <h3>Payment Details</h3>
              <form id="paymentForm">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="paymentEmail" class="form-control" value="${this.user.email || ''}" required>
                </div>
                <div class="form-group">
                  <label>Card Number</label>
                  <input type="text" id="cardNumber" class="form-control" placeholder="1234 5678 9012 3456" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Expiry</label>
                    <input type="text" id="cardExpiry" class="form-control" placeholder="MM/YY" required>
                  </div>
                  <div class="form-group">
                    <label>CVV</label>
                    <input type="text" id="cardCVV" class="form-control" placeholder="123" required>
                  </div>
                </div>
                <button type="submit" class="btn">Complete Purchase</button>
              </form>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(pricingModal);
      
      // Bind events
      const closeBtn = pricingModal.querySelector('.modal-close');
      const overlay = pricingModal.querySelector('.modal-overlay');
      
      const close = () => {
        pricingModal.style.display = 'none';
      };
      
      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', close);
    }
    
    // Show modal
    pricingModal.style.display = 'block';
    
    // Bind plan selection
    this.bindPlanSelection();
  },
  
  // Render pricing card
  renderPricingCard(tierId) {
    const tier = this.tiers[tierId];
    const isCurrent = this.user.tier === tierId;
    const isUpgrade = tierId !== 'free' && this.user.tier === 'free';
    
    return `
      <div class="pricing-card ${isCurrent ? 'current' : ''}" data-tier="${tierId}">
        <div class="pricing-header">
          <h3>${tier.name}</h3>
          <div class="price">
            ${tier.price > 0 ? `$${tier.price}/mo` : 'Free'}
          </div>
        </div>
        <div class="pricing-features">
          <ul>
            ${tier.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
        <div class="pricing-action">
          ${isCurrent ? 
            '<button class="btn btn-secondary" disabled>Current Plan</button>' :
            `<button class="btn ${isUpgrade ? 'btn-primary' : ''}" onclick="Monetization.selectPlan('${tierId}')">
              ${tier.price > 0 ? 'Upgrade' : 'Select'}
            </button>`
          }
        </div>
      </div>
    `;
  },
  
  // Bind plan selection events
  bindPlanSelection() {
    document.querySelectorAll('.pricing-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          const tierId = card.dataset.tier;
          this.selectPlan(tierId);
        }
      });
    });
  },
  
  // Select plan
  selectPlan(tierId) {
    const tier = this.tiers[tierId];
    
    if (tier.price === 0) {
      // Free plan - immediate downgrade
      this.downgradeToFree();
    } else {
      // Paid plan - show payment form
      this.showPaymentForm(tierId);
    }
  },
  
  // Show payment form
  showPaymentForm(tierId) {
    const paymentSection = document.getElementById('paymentSection');
    if (paymentSection) {
      paymentSection.style.display = 'block';
      
      // Scroll to payment section
      paymentSection.scrollIntoView({ behavior: 'smooth' });
      
      // Bind form submission
      const paymentForm = document.getElementById('paymentForm');
      if (paymentForm) {
        paymentForm.onsubmit = (e) => {
          e.preventDefault();
          this.processPayment(tierId);
        };
      }
    }
  },
  
  // Process payment
  async processPayment(tierId) {
    // In a real implementation, this would process payment with a payment provider
    // For demo, we'll simulate success
    
    try {
      // Show processing
      const submitBtn = document.querySelector('#paymentForm button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Processing...';
      submitBtn.disabled = true;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user state
      this.user.tier = tierId;
      this.user.subscription = {
        tier: tierId,
        started: new Date().toISOString(),
        renews: this.addDays(new Date(), 30).toISOString()
      };
      this.user.lastPayment = new Date().toISOString();
      this.user.trialEnds = null;
      
      await this.saveUserState();
      
      // Show success
      toast('Payment successful! Welcome to Pro!');
      
      // Close modal
      const pricingModal = document.getElementById('pricingModal');
      if (pricingModal) {
        pricingModal.style.display = 'none';
      }
      
      // Update UI
      this.updateSubscriptionUI();
      
      // Unlock features
      this.unlockFeatures(tierId);
    } catch (error) {
      console.error('Payment failed:', error);
      toast('Payment failed. Please try again.');
    } finally {
      // Restore button
      const submitBtn = document.querySelector('#paymentForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Complete Purchase';
        submitBtn.disabled = false;
      }
    }
  },
  
  // Downgrade to free plan
  async downgradeToFree() {
    if (!confirm('Are you sure you want to downgrade to the Free plan? You will lose access to Pro features.')) {
      return;
    }
    
    this.user.tier = 'free';
    this.user.subscription = null;
    await this.saveUserState();
    
    toast('Downgraded to Free plan');
    this.updateSubscriptionUI();
  },
  
  // Unlock features for tier
  unlockFeatures(tierId) {
    const tier = this.tiers[tierId];
    
    // Enable/disable features based on tier
    if (tier.limits.plugins) {
      // Enable all plugins
      if (typeof PluginSystem !== 'undefined') {
        PluginSystem.getAvailablePlugins().forEach(plugin => {
          if (!PluginSystem.plugins.has(plugin.id)) {
            PluginSystem.initPlugin(plugin.id);
          }
        });
      }
    }
    
    // Update UI to show unlocked features
    this.updateFeatureAccess();
  },
  
  // Update feature access UI
  updateFeatureAccess() {
    // Update export options
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      // Add more export options for Pro users
      if (this.tiers[this.user.tier].limits.export.length > 1) {
        exportBtn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.showAdvancedExportMenu(e);
        });
      }
    }
    
    // Update backup options
    if (typeof DataManagement !== 'undefined') {
      // Enable additional backup providers for Pro users
    }
  },
  
  // Show advanced export menu
  showAdvancedExportMenu(e) {
    // Create context menu for advanced export
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    
    const tier = this.tiers[this.user.tier];
    menu.innerHTML = `
      <div class="context-menu-item" onclick="UI.export()">Export JSON (Free)</div>
      ${tier.limits.export.includes('pdf') ? 
        '<div class="context-menu-item" onclick="AdvancedEditor.exportNote(\'pdf\')">Export PDF (Pro)</div>' : 
        '<div class="context-menu-item disabled">Export PDF (Pro Only)</div>'
      }
      ${tier.limits.export.includes('html') ? 
        '<div class="context-menu-item" onclick="AdvancedEditor.exportNote(\'html\')">Export HTML (Pro)</div>' : 
        '<div class="context-menu-item disabled">Export HTML (Pro Only)</div>'
      }
      ${tier.limits.export.includes('markdown') ? 
        '<div class="context-menu-item" onclick="AdvancedEditor.exportNote(\'markdown\')">Export Markdown (Pro)</div>' : 
        '<div class="context-menu-item disabled">Export Markdown (Pro Only)</div>'
      }
    `;
    
    document.body.appendChild(menu);
    
    // Remove menu on click outside
    const removeMenu = () => {
      document.body.removeChild(menu);
      document.removeEventListener('click', removeMenu);
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  },
  
  // Check feature limits
  checkLimit(feature) {
    const tier = this.tiers[this.user.tier];
    
    switch (feature) {
      case 'notes':
        // Check note count limit
        return async () => {
          const notes = await Store.allNotes();
          return notes.length < tier.limits.notes;
        };
        
      case 'backups':
        // Check backup limit
        return async () => {
          if (typeof DataManagement !== 'undefined') {
            const backups = await DataManagement.listBackups('local');
            return backups.length < tier.limits.backups;
          }
          return true;
        };
        
      case 'plugins':
        // Check plugin access
        return () => tier.limits.plugins;
        
      case 'sync':
        // Check sync access
        return () => tier.limits.sync;
        
      default:
        return () => true;
    }
  },
  
  // Generate user ID
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  },
  
  // Add days to date
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  // Analytics tracking
  trackEvent(event, data = {}) {
    // In a real implementation, this would send to analytics service
    console.log('Event tracked:', event, data);
    
    // Store locally for user insights
    this.storeEvent(event, data);
  },
  
  // Store event locally
  async storeEvent(event, data) {
    try {
      const events = await localforage.getItem('userEvents') || [];
      events.push({
        event,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await localforage.setItem('userEvents', events);
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  },
  
  // Get user analytics
  async getUserAnalytics() {
    try {
      const events = await localforage.getItem('userEvents') || [];
      const notes = await Store.allNotes();
      
      return {
        totalNotes: notes.length,
        totalEvents: events.length,
        featureUsage: this.analyzeFeatureUsage(events),
        engagement: this.calculateEngagement(events),
        tier: this.user.tier,
        trialDaysRemaining: this.user.trialEnds ? 
          Math.ceil((new Date(this.user.trialEnds) - new Date()) / (1000 * 60 * 60 * 24)) : 
          0
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return {};
    }
  },
  
  // Analyze feature usage
  analyzeFeatureUsage(events) {
    const usage = {};
    
    events.forEach(event => {
      const feature = event.data.feature || event.event;
      usage[feature] = (usage[feature] || 0) + 1;
    });
    
    return usage;
  },
  
  // Calculate engagement score
  calculateEngagement(events) {
    if (events.length === 0) return 0;
    
    // Simple engagement calculation based on recent activity
    const now = new Date();
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const daysAgo = (now - eventDate) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30; // Last 30 days
    });
    
    // Engagement score: 0-100
    const baseScore = Math.min(100, (recentEvents.length / events.length) * 100);
    const frequencyScore = Math.min(100, recentEvents.length);
    
    return Math.round((baseScore + frequencyScore) / 2);
  },
  
  // Show user dashboard
  async showUserDashboard() {
    const analytics = await this.getUserAnalytics();
    
    // Create dashboard modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 600px;">
        <div class="modal-header">
          <h2>User Dashboard</h2>
          <button class="modal-close">&times;</button>
        </div>
          <div class="modal-body">
            <div class="dashboard-section">
              <h3>Plan & Usage</h3>
              <div class="plan-info">
                <div class="plan-name">${this.tiers[this.user.tier].name} Plan</div>
                <div class="plan-usage">
                  <div class="usage-item">
                    <label>Notes</label>
                    <div class="usage-bar">
                      <div class="usage-fill" style="width: ${(analytics.totalNotes / this.tiers[this.user.tier].limits.notes) * 100}%"></div>
                    </div>
                    <div class="usage-text">${analytics.totalNotes} / ${this.tiers[this.user.tier].limits.notes}</div>
                  </div>
                </div>
                ${this.user.trialEnds ? 
                  `<div class="trial-info">Trial ends in ${analytics.trialDaysRemaining} days</div>` : 
                  ''
                }
              </div>
            </div>
            
            <div class="dashboard-section">
              <h3>Engagement</h3>
              <div class="engagement-score">
                <div class="score-value">${analytics.engagement}/100</div>
                <div class="score-label">Engagement Score</div>
              </div>
            </div>
            
            <div class="dashboard-section">
              <h3>Feature Usage</h3>
              <div class="feature-usage">
                ${Object.entries(analytics.featureUsage || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([feature, count]) => `
                    <div class="usage-item">
                      <label>${feature}</label>
                      <div class="usage-count">${count} uses</div>
                    </div>
                  `).join('')}
              </div>
            </div>
            
            <div class="dashboard-actions">
              <button class="btn" onclick="Monetization.showPricingModal()">Manage Subscription</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
  },
  
  // Handle feature restrictions
  async enforceLimits() {
    const tier = this.tiers[this.user.tier];
    
    // Check note limit
    if (tier.limits.notes < Infinity) {
      const notes = await Store.allNotes();
      if (notes.length >= tier.limits.notes) {
        toast(`You've reached the ${tier.limits.notes} note limit. Upgrade to create more notes.`);
        return false;
      }
    }
    
    return true;
  },
  
  // Show upsell prompt
  showUpsellPrompt(feature) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="width: 500px;">
        <div class="modal-header">
          <h2>Pro Feature</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>${feature} is available in the Pro plan.</p>
          <p>Upgrade to unlock this feature and many more.</p>
          <div class="pricing-cards">
            ${this.renderPricingCard('pro')}
          </div>
          <div class="modal-actions">
            <button id="upsellUpgradeBtn" class="btn">Upgrade Now</button>
            <button id="upsellLaterBtn" class="btn btn-secondary">Later</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Bind events
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const upgradeBtn = document.getElementById('upsellUpgradeBtn');
    const laterBtn = document.getElementById('upsellLaterBtn');
    
    const close = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    upgradeBtn.addEventListener('click', () => {
      this.showPricingModal();
      close();
    });
    laterBtn.addEventListener('click', close);
  }
};