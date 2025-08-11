/* templates.js — Advanced note templates system */

const Templates = {
  // Predefined templates
  predefined: {
    'meeting': {
      title: 'Meeting Notes',
      body: `# {{title}}

## Attendees
- 

## Agenda
1. 

## Notes
- 

## Action Items
- [ ] 

## Next Meeting
{{date:7d}}`,
      tags: ['#meeting', '#todo']
    },
    'research': {
      title: 'Research: {{title}}',
      body: `# {{title}}

## Source
- 

## Key Points
- 

## Questions
- 

## Summary
- 

## Related Notes
[[ ]]`,
      tags: ['#research', '#source']
    },
    'project': {
      title: '{{title}} Project',
      body: `# {{title}} Project

## Goal
- 

## Tasks
- [ ] 

## Resources
- 

## Timeline
- Start: {{date}}
- Due: {{date:14d}}

## Progress
- `,
      tags: ['#project', '#planning']
    },
    'decision': {
      title: 'Decision: {{title}}',
      body: `# {{title}}

## Context
- 

## Options
1. 

## Analysis
- 

## Decision
- 

## Consequences
- `,
      tags: ['#decision', '#analysis']
    },
    'daily': {
      title: 'Daily Log - {{date:format:YYYY-MM-DD}}',
      body: `# Daily Log - {{date:format:YYYY-MM-DD}}

## What I did today
- 

## What I learned
- 

## What to improve
- 

## Tomorrow's priorities
1. `,
      tags: ['#daily', '#reflection']
    }
  },

  // Get all available templates
  getAll() {
    return Object.keys(this.predefined);
  },

  // Get a template by name
  get(name) {
    return this.predefined[name] || null;
  },

  // Apply a template to create a new note
  apply(name, variables = {}) {
    const template = this.get(name);
    if (!template) return null;

    // Process title with variables
    const title = this.processTemplate(template.title, variables);
    
    // Process body with variables
    const body = this.processTemplate(template.body, variables);
    
    // Process tags
    const tags = [...(template.tags || [])];
    
    return {
      title,
      body,
      tags
    };
  },

  // Process template with variables
  processTemplate(template, variables) {
    let result = template;
    
    // Replace {{title}} with provided title or default
    if (variables.title) {
      result = result.replace(/{{title}}/g, variables.title);
    } else {
      result = result.replace(/{{title}}/g, 'Untitled');
    }
    
    // Replace {{date}} with today's date
    const today = new Date();
    result = result.replace(/{{date}}/g, today.toISOString().split('T')[0]);
    
    // Replace {{date:Xd}} with date X days from now
    result = result.replace(/{{date:(\d+)d}}/g, (match, days) => {
      const future = new Date(today);
      future.setDate(future.getDate() + parseInt(days));
      return future.toISOString().split('T')[0];
    });
    
    // Replace {{date:format:FORMAT}} with formatted date
    result = result.replace(/{{date:format:([^}]+)}}/g, (match, format) => {
      return this.formatDate(today, format);
    });
    
    return result;
  },

  // Simple date formatting
  formatDate(date, format) {
    const pad = (n) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    
    // Simple format replacement
    return format
      .replace(/YYYY/g, year)
      .replace(/MM/g, month)
      .replace(/DD/g, day);
  },

  // Save custom template
  async saveCustom(name, template) {
    const custom = await this.getCustomTemplates();
    custom[name] = template;
    await localforage.setItem('customTemplates', custom);
    return true;
  },

  // Get custom templates
  async getCustomTemplates() {
    return (await localforage.getItem('customTemplates')) || {};
  },

  // Delete custom template
  async deleteCustom(name) {
    const custom = await this.getCustomTemplates();
    delete custom[name];
    await localforage.setItem('customTemplates', custom);
    return true;
  }
};