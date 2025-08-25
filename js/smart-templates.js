/* smart-templates.js - Smart Templates for AI Projects */

const SmartTemplates = {
  // Available AI project templates
  templates: {
    'ai-research': {
      name: 'AI Research Paper',
      description: 'Template for AI research papers with sections for abstract, methodology, results, and conclusion',
      tags: ['#ai', '#research', '#paper'],
      body: `# [Project Title]

## Abstract
Brief summary of the research problem, methodology, and key findings.

## Introduction
- Problem statement
- Motivation
- Related work
- Contributions

## Methodology
- Dataset description
- Model architecture
- Training procedure
- Evaluation metrics

## Results
- Quantitative results
- Qualitative examples
- Ablation studies
- Comparison with baselines

## Discussion
- Interpretation of results
- Limitations
- Ethical considerations

## Conclusion
- Summary of findings
- Future work

## References
- [1] Relevant paper 1
- [2] Relevant paper 2

See [[AI Project Showcase]]`
    },
    
    'ai-product': {
      name: 'AI Product Specification',
      description: 'Template for AI product specifications with features, requirements, and technical details',
      tags: ['#ai', '#product', '#specification'],
      body: `# [Product Name]

## Overview
Brief description of the AI product and its value proposition.

## Key Features
- Feature 1: Description and benefits
- Feature 2: Description and benefits
- Feature 3: Description and benefits

## Technical Requirements
### Data Requirements
- Data sources
- Data preprocessing
- Data privacy considerations

### Model Requirements
- Model type (e.g., neural network, decision tree)
- Performance requirements
- Scalability requirements

### Infrastructure Requirements
- Compute resources
- Storage requirements
- Deployment environment

## User Experience
### User Interface
- Wireframes or mockups
- User flows
- Accessibility considerations

### User Interaction
- Input methods
- Output formats
- Error handling

## Implementation Plan
### Phase 1: MVP
- Core features
- Timeline
- Success metrics

### Phase 2: Enhancements
- Additional features
- Timeline
- Success metrics

## Success Metrics
- Key performance indicators
- User engagement metrics
- Business impact metrics

See [[AI Project Showcase]]`
    },
    
    'ai-ethics': {
      name: 'AI Ethics Review',
      description: 'Template for AI ethics reviews with bias analysis, fairness considerations, and mitigation strategies',
      tags: ['#ai', '#ethics', '#review'],
      body: `# Ethics Review: [Project Name]

## Overview
Brief description of the AI system and its intended use.

## Stakeholder Analysis
### Primary Users
- User group 1: Description and needs
- User group 2: Description and needs

### Affected Parties
- Group 1: Potential impact
- Group 2: Potential impact

## Bias Analysis
### Data Bias
- Sources of bias in training data
- Impact on model performance
- Mitigation strategies

### Algorithmic Bias
- Types of bias in algorithm design
- Impact on different user groups
- Mitigation strategies

### Deployment Bias
- Context of use considerations
- Feedback loop effects
- Mitigation strategies

## Fairness Considerations
### Individual Fairness
- Consistent treatment of similar individuals
- Transparency in decision-making

### Group Fairness
- Equal treatment across demographic groups
- Representation in training data

## Privacy and Security
### Data Privacy
- Data collection practices
- User consent mechanisms
- Data retention policies

### Model Security
- Adversarial attack vulnerabilities
- Model inversion risks
- Membership inference risks

## Transparency and Explainability
### Model Interpretability
- Techniques for explaining model decisions
- User-facing explanations
- Expert-level explanations

### Auditability
- Logging and monitoring
- Third-party audits
- Regulatory compliance

## Mitigation Strategies
### Technical Approaches
- Debiasing techniques
- Fairness constraints
- Privacy-preserving methods

### Organizational Approaches
- Ethics review processes
- Ongoing monitoring
- Incident response procedures

## Recommendations
### Immediate Actions
- Action 1: Priority and timeline
- Action 2: Priority and timeline

### Long-term Considerations
- Strategy 1: Implementation plan
- Strategy 2: Implementation plan

See [[AI Project Showcase]]`
    }
  },
  
  // Initialize smart templates
  init() {
    // Add template button to the UI
    this.addTemplateButton();
  },
  
  // Add template button to the UI
  addTemplateButton() {
    // Add to the topbar
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      // Check if template button already exists
      if (!document.getElementById('templateBtn')) {
        const templateBtn = document.createElement('button');
        templateBtn.id = 'templateBtn';
        templateBtn.className = 'btn';
        templateBtn.textContent = 'Templates';
        templateBtn.onclick = (e) => {
          e.stopPropagation();
          this.showTemplateMenu();
        };
        
        // Insert before the new note button
        const newNoteBtn = document.getElementById('newNote');
        if (newNoteBtn && newNoteBtn.parentNode) {
          newNoteBtn.parentNode.insertBefore(templateBtn, newNoteBtn.nextSibling);
        } else {
          topbar.appendChild(templateBtn);
        }
        
        // Create template menu
        this.createTemplateMenu();
      }
    }
  },
  
  // Create template menu
  createTemplateMenu() {
    // Remove existing menu if present
    const existingMenu = document.getElementById('templateMenu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Create menu
    const menu = document.createElement('div');
    menu.id = 'templateMenu';
    menu.className = 'dropdown-menu';
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.zIndex = '1000';
    
    // Add AI-specific templates
    Object.entries(this.templates).forEach(([id, template]) => {
      const item = document.createElement('div');
      item.className = 'menu-item';
      item.innerHTML = `
        <div>
          <div>${template.name}</div>
          <div class="small" style="color: var(--muted);">${template.description}</div>
        </div>
      `;
      item.onclick = () => {
        this.applyTemplate(id);
        menu.style.display = 'none';
      };
      menu.appendChild(item);
    });
    
    // Add separator
    const separator = document.createElement('hr');
    separator.style.border = '0';
    separator.style.borderTop = '1px solid #1a2133';
    separator.style.margin = '4px 0';
    menu.appendChild(separator);
    
    // Add "Blank Note" option
    const blankItem = document.createElement('div');
    blankItem.className = 'menu-item';
    blankItem.textContent = 'Blank Note';
    blankItem.onclick = () => {
      UI.newNote();
      menu.style.display = 'none';
    };
    menu.appendChild(blankItem);
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (menu && !menu.contains(e.target) && e.target.id !== 'templateBtn') {
        menu.style.display = 'none';
      }
    });
  },
  
  // Show template menu
  showTemplateMenu() {
    const menu = document.getElementById('templateMenu');
    const btn = document.getElementById('templateBtn');
    if (!menu || !btn) return;
    
    // Toggle visibility
    const isVisible = menu.style.display !== 'none';
    if (isVisible) {
      menu.style.display = 'none';
      return;
    }
    
    // Position menu below button
    const rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.left = (rect.left + window.scrollX) + 'px';
    
    menu.style.display = 'block';
  },
  
  // Apply template
  async applyTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) {
      toast('Template not found');
      return;
    }
    
    // Get title from user
    const title = prompt('Enter note title:', template.name);
    if (!title) return;
    
    // Create note with template data
    const n = Note.create({
      title: title,
      body: template.body,
      tags: template.tags
    });
    
    await Store.upsert(n);
    await UI.openNote(n.id);
    await UI.refresh();
    
    if(typeof Analytics !== 'undefined') Analytics.log('create_template', {id:n.id, template: templateId});
  },
  
  // Get all templates
  getAll() {
    return Object.keys(this.templates);
  },
  
  // Apply template to content
  apply(templateName, data = {}) {
    const template = this.templates[templateName];
    if (!template) return null;
    
    return {
      title: data.title || template.name,
      body: template.body,
      tags: template.tags
    };
  }
};

