/* tags.js — Enhanced tag management system with performance optimizations */

const TagManager = {
  // Cache for performance optimization
  cache: {
    suggestions: new Map(),
    relationships: new Map(),
    statistics: null,
    lastCacheTime: 0
  },
  
  // Cache expiration time (5 minutes)
  CACHE_EXPIRY: 5 * 60 * 1000,
  
  // Predefined tag categories with colors and descriptions
  categories: {
    content: {
      color: '#3B82F6', // blue
      tags: ['idea', 'concept', 'theory', 'principle', 'definition', 'fact', 'insight', 'observation']
    },
    method: {
      color: '#10B981', // green
      tags: ['zettel', 'workflow', 'technique', 'process', 'system', 'framework', 'methodology', 'practice']
    },
    project: {
      color: '#F59E0B', // amber
      tags: ['project', 'task', 'todo', 'goal', 'milestone', 'deadline', 'planning', 'roadmap']
    },
    meta: {
      color: '#8B5CF6', // violet
      tags: ['meta', 'reflection', 'review', 'analysis', 'synthesis', 'evaluation', 'critique', 'feedback']
    },
    domain: {
      color: '#EF4444', // red
      tags: ['tech', 'science', 'business', 'philosophy', 'art', 'history', 'politics', 'economics']
    },
    status: {
      color: '#6B7280', // gray
      tags: ['draft', 'wip', 'complete', 'archived', 'reference', 'template', 'example', 'obsolete']
    },
    priority: {
      color: '#DC2626', // red-600
      tags: ['urgent', 'important', 'normal', 'low', 'someday', 'maybe', 'critical', 'nice-to-have']
    },
    source: {
      color: '#059669', // emerald-600
      tags: ['book', 'article', 'paper', 'video', 'podcast', 'course', 'conversation', 'experience']
    }
  },

  // Cached predefined tags list
  _allPredefinedCache: null,
  
  // Get all predefined tags as flat array (cached)
  getAllPredefined() {
    if (!this._allPredefinedCache) {
      this._allPredefinedCache = Object.values(this.categories)
        .flatMap(cat => cat.tags)
        .sort();
    }
    return this._allPredefinedCache;
  },

  // Cached tag-to-color mapping for performance
  _tagColorMap: null,
  
  // Get color for a tag (optimized with caching)
  getTagColor(tag) {
    if (!this._tagColorMap) {
      this._tagColorMap = new Map();
      for (const [catName, category] of Object.entries(this.categories)) {
        category.tags.forEach(t => this._tagColorMap.set(t, category.color));
      }
    }
    
    const cleanTag = tag.toLowerCase().replace('#', '');
    return this._tagColorMap.get(cleanTag) || '#6B7280';
  },

  // Cached tag-to-category mapping
  _tagCategoryMap: null,
  
  // Get category for a tag (optimized with caching)
  getTagCategory(tag) {
    if (!this._tagCategoryMap) {
      this._tagCategoryMap = new Map();
      for (const [catName, category] of Object.entries(this.categories)) {
        category.tags.forEach(t => this._tagCategoryMap.set(t, catName));
      }
    }
    
    const cleanTag = tag.toLowerCase().replace('#', '');
    return this._tagCategoryMap.get(cleanTag) || 'custom';
  },
  
  // Clear caches when categories change
  clearCache() {
    this._allPredefinedCache = null;
    this._tagColorMap = null;
    this._tagCategoryMap = null;
    this.cache.suggestions.clear();
    this.cache.relationships.clear();
    this.cache.statistics = null;
    this.cache.lastCacheTime = 0;
  },

  // Performance-optimized content suggestion with caching
  async suggestFromContent(content = '', title = '') {
    const fullContent = (title + ' ' + content).toLowerCase();
    const cacheKey = fullContent.substring(0, 100); // Use first 100 chars as cache key
    
    // Check cache first
    if (this.cache.suggestions.has(cacheKey)) {
      const cached = this.cache.suggestions.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
        return cached.suggestions;
      }
    }
    
    const suggestions = new Set();
    
    // Enhanced content-based suggestions with optimized patterns
    const contentPatterns = new Map([
      ['idea', /\b(idea|concept|notion|thought|insight|observation)\b/i],
      ['question', /\b(question|why|how|what|when|where|who|which)\b/i],
      ['todo', /\b(todo|task|need to|should|must|action|next step)\b/i],
      ['important', /\b(important|critical|key|vital|essential|crucial|priority)\b/i],
      ['research', /\b(research|study|investigate|explore|examine|analyze|investigation)\b/i],
      ['draft', /\b(draft|rough|initial|preliminary|working|in progress)\b/i],
      ['review', /\b(review|revisit|check|verify|validate|audit|evaluate)\b/i],
      ['reference', /\b(reference|resource|source|citation|quote)\b/i],
      ['meeting', /\b(meeting|discussion|conversation|call|sync)\b/i],
      ['decision', /\b(decision|choice|selected|chosen|determined)\b/i]
    ]);

    // Fast pattern matching
    for (const [tag, pattern] of contentPatterns) {
      if (pattern.test(fullContent)) {
        suggestions.add(tag);
      }
    }

    // Cached tag statistics for better performance
    let tagStats = this.cache.statistics;
    if (!tagStats || Date.now() - this.cache.lastCacheTime > this.CACHE_EXPIRY) {
      const notes = await Store.allNotes();
      tagStats = this.calculateTagStatistics(notes);
      this.cache.statistics = tagStats;
      this.cache.lastCacheTime = Date.now();
    }

    // Return mix of content suggestions and popular existing tags
    const popularTags = Array.from(tagStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([tag]) => tag);
    
    // Combine content suggestions with popular tags
    const result = [...suggestions, ...popularTags.slice(0, 5)];
    
    // Cache the result
    this.cache.suggestions.set(cacheKey, {
      suggestions: result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.suggestions.size > 100) {
      const firstKey = this.cache.suggestions.keys().next().value;
      this.cache.suggestions.delete(firstKey);
    }
    
    return result;
  },
  
  // Calculate tag statistics efficiently
  calculateTagStatistics(notes) {
    const tagStats = new Map();
    
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        const cleanTag = tag.replace('#', '');
        if (!tagStats.has(cleanTag)) {
          tagStats.set(cleanTag, { count: 0, notes: [] });
        }
        const stats = tagStats.get(cleanTag);
        stats.count++;
        stats.notes.push(note.id);
      });
    });
    
    return tagStats;
  },

  // Enhanced tag parsing with normalization
  parseTags(input) {
    if (!input) return [];
    
    const tags = input
      .split(/[,\s]+/)
      .map(t => t.trim())
      .filter(t => t)
      .map(t => {
        // Normalize: ensure # prefix, lowercase, remove duplicates
        const clean = t.toLowerCase().replace(/^#+/, '');
        return clean ? `#${clean}` : null;
      })
      .filter(Boolean);

    return [...new Set(tags)]; // Remove duplicates
  },

  // Search/filter tags with fuzzy matching
  searchTags(query, existingTags = []) {
    if (!query) return this.getAllPredefined().slice(0, 10);
    
    const q = query.toLowerCase().replace('#', '');
    const allTags = [...this.getAllPredefined(), ...existingTags.map(t => t.replace('#', ''))];
    const unique = [...new Set(allTags)];
    
    return unique
      .filter(tag => {
        const tagLower = tag.toLowerCase();
        return tagLower.includes(q) || 
               tagLower.startsWith(q) ||
               this.fuzzyMatch(tagLower, q);
      })
      .sort((a, b) => {
        // Prioritize exact matches, then starts with, then fuzzy
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        if (aLower === q) return -1;
        if (bLower === q) return 1;
        if (aLower.startsWith(q) && !bLower.startsWith(q)) return -1;
        if (bLower.startsWith(q) && !aLower.startsWith(q)) return 1;
        
        return a.localeCompare(b);
      })
      .slice(0, 15);
  },

  // Simple fuzzy matching
  fuzzyMatch(str, pattern) {
    let patternIdx = 0;
    for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
      if (str[i] === pattern[patternIdx]) patternIdx++;
    }
    return patternIdx === pattern.length;
  },

  // Get tag statistics
  async getTagStats() {
    const notes = await Store.allNotes();
    const stats = {};
    
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        const cleanTag = tag.replace('#', '');
        stats[cleanTag] = (stats[cleanTag] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [tag, count]) => {
        acc[tag] = {
          count,
          category: this.getTagCategory(tag),
          color: this.getTagColor(tag),
          percentage: Math.round((count / notes.length) * 100)
        };
        return acc;
      }, {});
  },

  // Bulk tag operations
  async bulkAddTags(noteIds, tags) {
    const notes = await Store.allNotes();
    const updatedNotes = notes.map(note => {
      if (noteIds.includes(note.id)) {
        const currentTags = new Set(note.tags || []);
        tags.forEach(tag => currentTags.add(tag));
        note.tags = Array.from(currentTags);
        note.updatedAt = nowISO();
      }
      return note;
    });
    
    await Store.saveNotes(updatedNotes);
    return updatedNotes.filter(n => noteIds.includes(n.id));
  },

  async bulkRemoveTags(noteIds, tags) {
    const notes = await Store.allNotes();
    const tagsToRemove = new Set(tags);
    
    const updatedNotes = notes.map(note => {
      if (noteIds.includes(note.id)) {
        note.tags = (note.tags || []).filter(tag => !tagsToRemove.has(tag));
        note.updatedAt = nowISO();
      }
      return note;
    });
    
    await Store.saveNotes(updatedNotes);
    return updatedNotes.filter(n => noteIds.includes(n.id));
  },

  // Smart tag suggestions based on note relationships and AI-like analysis
  async getRelatedTags(noteId) {
    const notes = await Store.allNotes();
    const currentNote = notes.find(n => n.id === noteId);
    if (!currentNote) return [];

    const relatedNotes = new Set();
    const currentTags = new Set((currentNote.tags || []).map(t => t.replace('#', '')));
    
    // 1. Find notes linked to/from current note (strongest relationship)
    notes.forEach(note => {
      if (note.links && note.links.includes(noteId)) relatedNotes.add(note);
      if (currentNote.links && currentNote.links.includes(note.id)) relatedNotes.add(note);
    });

    // 2. Find notes with similar tags (semantic relationship)
    notes.forEach(note => {
      const noteTags = new Set((note.tags || []).map(t => t.replace('#', '')));
      const intersection = new Set([...currentTags].filter(x => noteTags.has(x)));
      if (intersection.size > 0 && note.id !== noteId) {
        relatedNotes.add(note);
      }
    });

    // 3. Find notes with similar content (content-based relationship)
    const currentTokens = this.tokenizeContent(currentNote.body || '');
    notes.forEach(note => {
      if (note.id === noteId) return;
      const noteTokens = this.tokenizeContent(note.body || '');
      const similarity = this.calculateContentSimilarity(currentTokens, noteTokens);
      if (similarity > 0.3) { // 30% similarity threshold
        relatedNotes.add(note);
      }
    });

    // Collect and score tags from related notes
    const relatedTags = {};
    Array.from(relatedNotes).forEach(note => {
      const weight = this.calculateNoteWeight(note, currentNote, notes);
      (note.tags || []).forEach(tag => {
        const cleanTag = tag.replace('#', '');
        if (!currentTags.has(cleanTag)) {
          relatedTags[cleanTag] = (relatedTags[cleanTag] || 0) + weight;
        }
      });
    });

    return Object.entries(relatedTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([tag, score]) => ({ tag, score, category: this.getTagCategory(tag) }));
  },

  // Calculate content similarity between notes
  calculateContentSimilarity(tokens1, tokens2) {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  },

  // Calculate relationship weight between notes
  calculateNoteWeight(relatedNote, currentNote, allNotes) {
    let weight = 1;
    
    // Boost weight for direct links
    if (relatedNote.links && relatedNote.links.includes(currentNote.id)) weight += 2;
    if (currentNote.links && currentNote.links.includes(relatedNote.id)) weight += 2;
    
    // Boost weight for recent notes
    const daysSinceUpdate = (Date.now() - new Date(relatedNote.updatedAt || relatedNote.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) weight += 1; // Recent notes are more relevant
    
    // Boost weight for well-connected notes
    const linkCount = relatedNote.links ? relatedNote.links.length : 0;
    if (linkCount > 3) weight += 0.5;
    
    return weight;
  },

  // Tokenize content for similarity analysis
  tokenizeContent(content) {
    return content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 3 && !this.isStopWord(token));
  },

  // Simple stop word filter
  isStopWord(word) {
    const stopWords = new Set(['that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'what', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'many', 'some', 'time', 'very', 'when', 'much', 'new', 'also', 'than', 'only', 'its', 'two', 'may', 'way', 'more', 'these', 'come', 'made', 'over', 'such', 'take', 'any', 'see', 'him', 'how', 'now', 'find', 'between', 'should', 'never', 'does', 'another', 'even', 'most', 'used', 'want', 'say', 'where', 'way', 'before', 'right', 'too', 'means', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'farm', 'three', 'small', 'set', 'put', 'end', 'why', 'again', 'turn', 'here', 'off', 'went', 'old', 'number', 'great', 'tell', 'men', 'say', 'small', 'every', 'found', 'still', 'name', 'should', 'home', 'give', 'water', 'room', 'mother', 'back', 'most', 'good', 'through', 'just', 'form', 'much', 'think', 'say', 'great', 'where', 'help', 'through', 'line', 'right', 'too', 'means', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want', 'show']);
    return stopWords.has(word.toLowerCase());
  },

  // Advanced tag suggestions with context awareness
  async getSuggestionsWithContext(noteContent, noteTitle = '', existingTags = [], noteId = null) {
    const suggestions = new Map();

    // 1. Content-based suggestions (enhanced with title)
    const contentSuggestions = await this.suggestFromContent(noteContent, noteTitle);
    contentSuggestions.forEach(tag => {
      suggestions.set(tag, { score: 5, source: 'content', category: this.getTagCategory(tag) });
    });

    // 2. Relationship-based suggestions (if noteId provided)
    if (noteId) {
      const relatedSuggestions = await this.getRelatedTags(noteId);
      relatedSuggestions.forEach(({ tag, score }) => {
        const existing = suggestions.get(tag) || { score: 0 };
        suggestions.set(tag, {
          score: existing.score + score * 2, // Relationship suggestions are weighted higher
          source: 'relationship',
          category: this.getTagCategory(tag)
        });
      });
    }

    // 3. Category completion suggestions
    const categorySuggestions = this.getCategoryCompletions(existingTags);
    categorySuggestions.forEach(tag => {
      const existing = suggestions.get(tag) || { score: 0 };
      suggestions.set(tag, {
        score: existing.score + 3,
        source: 'category',
        category: this.getTagCategory(tag)
      });
    });

    // 4. Trending tags (recently used tags across all notes)
    const trendingSuggestions = await this.getTrendingTags();
    trendingSuggestions.forEach(tag => {
      const existing = suggestions.get(tag) || { score: 0 };
      suggestions.set(tag, {
        score: existing.score + 1,
        source: 'trending',
        category: this.getTagCategory(tag)
      });
    });

    // 5. Smart context suggestions based on note structure
    const structureSuggestions = this.getStructureSuggestions(noteContent);
    structureSuggestions.forEach(tag => {
      const existing = suggestions.get(tag) || { score: 0 };
      suggestions.set(tag, {
        score: existing.score + 2,
        source: 'structure',
        category: this.getTagCategory(tag)
      });
    });

    // Filter out existing tags and sort by score
    const existingSet = new Set(existingTags.map(t => t.replace('#', '')));
    return Array.from(suggestions.entries())
      .filter(([tag]) => !existingSet.has(tag))
      .sort(([,a], [,b]) => b.score - a.score)
      .slice(0, 15)
      .map(([tag, data]) => ({
        tag,
        ...data
      }));
  },

  // Get structure-based suggestions from note content
  getStructureSuggestions(content) {
    const suggestions = new Set();
    
    // Check for common markdown patterns
    if (/#\s+\w/.test(content)) suggestions.add('heading');
    if (/\*\*.*?\*\*/.test(content)) suggestions.add('emphasis');
    if (/\*\*\*.*?\*\*\*/.test(content)) suggestions.add('important');
    if (/^[-*+]\s+\[.*?\]/.test(content)) suggestions.add('task');
    if (/^[-*+]\s+\[x\]/.test(content)) suggestions.add('completed');
    if (/^[-*+]\s+(?!\[)/.test(content)) suggestions.add('list');
    if (/^\d+\.\s/.test(content)) suggestions.add('ordered');
    if (/^>\s/.test(content)) suggestions.add('quote');
    if (/```[\s\S]*?```/.test(content)) suggestions.add('code');
    if (/\[.*?\]\(.*?\)/.test(content)) suggestions.add('link');
    if (/\[\[.*?\]\]/.test(content)) suggestions.add('wikilink');
    if (/!\[.*?\]\(.*?\)/.test(content)) suggestions.add('image');
    if (/^#{1,6}\s/.test(content)) suggestions.add('section');
    
    return Array.from(suggestions);
  },

  // Get suggestions to complete tag categories
  getCategoryCompletions(existingTags) {
    const existingCategories = new Set();
    existingTags.forEach(tag => {
      const category = this.getTagCategory(tag.replace('#', ''));
      existingCategories.add(category);
    });

    const suggestions = [];
    
    // Suggest essential tags for incomplete categories
    Object.entries(this.categories).forEach(([catName, category]) => {
      if (!existingCategories.has(catName)) {
        // Suggest the most common tag from each missing category
        suggestions.push(category.tags[0]);
      }
    });

    return suggestions;
  },

  // Get recently trending tags
  async getTrendingTags(days = 7) {
    const notes = await Store.allNotes();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentTags = {};
    notes.forEach(note => {
      const noteDate = new Date(note.updatedAt || note.createdAt);
      if (noteDate > cutoffDate) {
        (note.tags || []).forEach(tag => {
          const cleanTag = tag.replace('#', '');
          recentTags[cleanTag] = (recentTags[cleanTag] || 0) + 1;
        });
      }
    });

    return Object.entries(recentTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  },

  // Tag Templates and Presets
  templates: {
    'research': {
      name: 'Research Note',
      description: 'For academic or professional research',
      tags: ['#research', '#draft', '#source', '#important'],
      icon: '🔬'
    },
    'meeting': {
      name: 'Meeting Notes', 
      description: 'For meeting summaries and action items',
      tags: ['#meeting', '#work', '#todo', '#important'],
      icon: '📝'
    },
    'idea': {
      name: 'Creative Idea',
      description: 'For brainstorming and creative thoughts',
      tags: ['#idea', '#creative', '#draft', '#inspiration'],
      icon: '💡'
    },
    'project': {
      name: 'Project Planning',
      description: 'For project management and planning',
      tags: ['#project', '#planning', '#todo', '#milestone'],
      icon: '📋'
    },
    'learning': {
      name: 'Learning Notes',
      description: 'For educational content and study notes',
      tags: ['#learning', '#concept', '#education', '#reference'],
      icon: '📚'
    },
    'review': {
      name: 'Review & Analysis',
      description: 'For analyzing and reviewing content',
      tags: ['#review', '#analysis', '#critique', '#meta'],
      icon: '🔍'
    },
    'personal': {
      name: 'Personal Reflection',
      description: 'For journal entries and personal thoughts', 
      tags: ['#personal', '#reflection', '#journal', '#private'],
      icon: '📔'
    },
    'quick': {
      name: 'Quick Note',
      description: 'For rapid capture of thoughts',
      tags: ['#quick', '#draft', '#capture'],
      icon: '⚡'
    }
  },

  // Apply tag template to a note
  applyTemplate(templateKey, existingTags = []) {
    const template = this.templates[templateKey];
    if (!template) return existingTags;

    const newTags = [...existingTags];
    template.tags.forEach(tag => {
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
    });

    return newTags;
  },

  // Get template suggestions based on content
  suggestTemplates(content = '', existingTags = []) {
    const suggestions = [];
    const lowerContent = content.toLowerCase();
    const tagSet = new Set(existingTags.map(t => t.replace('#', '').toLowerCase()));

    Object.entries(this.templates).forEach(([key, template]) => {
      let score = 0;
      
      // Score based on content keywords
      const keywords = {
        research: ['research', 'study', 'paper', 'analysis', 'hypothesis', 'methodology'],
        meeting: ['meeting', 'discussion', 'action', 'agenda', 'attendees', 'decisions'],
        idea: ['idea', 'brainstorm', 'concept', 'creative', 'innovation', 'inspiration'],
        project: ['project', 'plan', 'milestone', 'deadline', 'task', 'goal'],
        learning: ['learn', 'understand', 'concept', 'theory', 'principle', 'knowledge'],
        review: ['review', 'analyze', 'evaluate', 'critique', 'assessment', 'feedback'],
        personal: ['feel', 'think', 'reflect', 'personal', 'journal', 'mood'],
        quick: ['quick', 'note', 'remember', 'capture', 'brief', 'short']
      };

      if (keywords[key]) {
        keywords[key].forEach(keyword => {
          if (lowerContent.includes(keyword)) score += 2;
        });
      }

      // Score based on existing tags
      template.tags.forEach(tag => {
        const cleanTag = tag.replace('#', '').toLowerCase();
        if (tagSet.has(cleanTag)) score += 1;
      });

      if (score > 0) {
        suggestions.push({
          key,
          ...template,
          score,
          relevance: score > 3 ? 'high' : score > 1 ? 'medium' : 'low'
        });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  },

  // Hierarchical Tag Support
  hierarchicalTags: {
    'work': {
      children: ['meetings', 'projects', 'deadlines', 'clients'],
      parent: null,
      description: 'Work-related content'
    },
    'work/meetings': {
      children: ['standup', 'planning', 'review', 'oneonone'],
      parent: 'work',
      description: 'Meeting-related content'
    },
    'work/projects': {
      children: ['planning', 'development', 'testing', 'deployment'],
      parent: 'work',
      description: 'Project-related content'
    },
    'personal': {
      children: ['health', 'finance', 'relationships', 'hobbies'],
      parent: null,
      description: 'Personal life content'
    },
    'learning': {
      children: ['tech', 'business', 'skills', 'languages'],
      parent: null,
      description: 'Learning and education content'
    },
    'learning/tech': {
      children: ['programming', 'tools', 'frameworks', 'architecture'],
      parent: 'learning',
      description: 'Technology learning'
    }
  },

  // Get hierarchical suggestions
  getHierarchicalSuggestions(currentTags = []) {
    const suggestions = [];
    const currentHierarchy = new Set();

    // Build current hierarchy
    currentTags.forEach(tag => {
      const cleanTag = tag.replace('#', '');
      const hierarchyKey = this.findHierarchyKey(cleanTag);
      if (hierarchyKey) {
        currentHierarchy.add(hierarchyKey);
        // Add parent hierarchy
        let parent = this.hierarchicalTags[hierarchyKey]?.parent;
        while (parent) {
          currentHierarchy.add(parent);
          parent = this.hierarchicalTags[parent]?.parent;
        }
      }
    });

    // Suggest children of current hierarchy
    Array.from(currentHierarchy).forEach(hierarchyKey => {
      const hierarchy = this.hierarchicalTags[hierarchyKey];
      if (hierarchy?.children) {
        hierarchy.children.forEach(child => {
          const childKey = `${hierarchyKey}/${child}`;
          const fullTag = `#${child}`;
          if (!currentTags.includes(fullTag)) {
            suggestions.push({
              tag: child,
              parent: hierarchyKey,
              level: hierarchyKey.split('/').length,
              description: this.hierarchicalTags[childKey]?.description || `${child} under ${hierarchyKey}`
            });
          }
        });
      }
    });

    // Suggest root categories if no hierarchy present
    if (currentHierarchy.size === 0) {
      Object.entries(this.hierarchicalTags).forEach(([key, hierarchy]) => {
        if (!hierarchy.parent) {
          suggestions.push({
            tag: key,
            parent: null,
            level: 0,
            description: hierarchy.description
          });
        }
      });
    }

    return suggestions.slice(0, 8);
  },

  // Find hierarchy key for a tag
  findHierarchyKey(tag) {
    const normalizedTag = tag.toLowerCase().replace('#', '');
    
    // Direct match
    if (this.hierarchicalTags[normalizedTag]) {
      return normalizedTag;
    }

    // Search in hierarchy paths
    for (const [key] of Object.entries(this.hierarchicalTags)) {
      const parts = key.split('/');
      if (parts.includes(normalizedTag) || parts[parts.length - 1] === normalizedTag) {
        return key;
      }
    }

    return null;
  },

  // Expand hierarchical tag (get all parent tags)
  expandHierarchicalTag(tag) {
    const cleanTag = tag.replace('#', '');
    const hierarchyKey = this.findHierarchyKey(cleanTag);
    if (!hierarchyKey) return [tag];

    const expanded = [tag];
    let parent = this.hierarchicalTags[hierarchyKey]?.parent;
    
    while (parent) {
      expanded.unshift(`#${parent}`);
      parent = this.hierarchicalTags[parent]?.parent;
    }

    return expanded;
  },

  // Advanced filtering and combinations
  createTagQuery(tags = [], operator = 'AND') {
    return {
      tags: tags.map(t => t.replace('#', '')),
      operator, // 'AND', 'OR', 'NOT'
      timestamp: Date.now()
    };
  },

  // Filter notes by complex tag queries
  async filterNotesByQuery(query) {
    const notes = await Store.allNotes();
    
    return notes.filter(note => {
      const noteTags = new Set((note.tags || []).map(t => t.replace('#', '')));
      
      switch (query.operator) {
        case 'AND':
          return query.tags.every(tag => noteTags.has(tag));
        case 'OR':
          return query.tags.some(tag => noteTags.has(tag));
        case 'NOT':
          return !query.tags.some(tag => noteTags.has(tag));
        default:
          return query.tags.every(tag => noteTags.has(tag));
      }
    });
  },

  // Advanced analytics and insights
  async generateTagInsights() {
    const notes = await Store.allNotes();
    const stats = await this.getTagStats();
    
    const insights = {
      summary: {
        totalTags: Object.keys(stats).length,
        totalNotes: notes.length,
        avgTagsPerNote: notes.length > 0 ? Object.values(stats).reduce((a, b) => a + b.count, 0) / notes.length : 0,
        mostUsedCategory: this.getMostUsedCategory(stats)
      },
      recommendations: [],
      patterns: [],
      gaps: []
    };

    // Analyze tag distribution
    const categoryDistribution = {};
    Object.entries(stats).forEach(([tag, data]) => {
      const category = data.category;
      categoryDistribution[category] = (categoryDistribution[category] || 0) + data.count;
    });

    // Find underused categories
    Object.entries(this.categories).forEach(([catName]) => {
      if (!categoryDistribution[catName] || categoryDistribution[catName] < 5) {
        insights.gaps.push({
          type: 'underused_category',
          category: catName,
          suggestion: `Consider adding more ${catName} tags to better organize your notes`
        });
      }
    });

    // Find notes without sufficient tags
    const undertaggedNotes = notes.filter(note => (note.tags || []).length < 2);
    if (undertaggedNotes.length > 0) {
      insights.recommendations.push({
        type: 'insufficient_tagging',
        count: undertaggedNotes.length,
        suggestion: `${undertaggedNotes.length} notes have fewer than 2 tags. Consider adding more tags for better organization.`
      });
    }

    // Find tag patterns
    const coOccurrences = this.calculateTagCoOccurrences(notes);
    const strongPatterns = Object.entries(coOccurrences)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    strongPatterns.forEach(([pattern, count]) => {
      insights.patterns.push({
        type: 'co_occurrence',
        pattern,
        count,
        suggestion: `Tags "${pattern}" often appear together (${count} times)`
      });
    });

    return insights;
  },

  // Calculate tag co-occurrences  
  calculateTagCoOccurrences(notes) {
    const coOccurrences = {};
    
    notes.forEach(note => {
      const tags = (note.tags || []).map(t => t.replace('#', ''));
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const pair = [tags[i], tags[j]].sort().join(' + ');
          coOccurrences[pair] = (coOccurrences[pair] || 0) + 1;
        }
      }
    });

    return coOccurrences;
  },

  // Get most used category
  getMostUsedCategory(stats) {
    const categoryTotals = {};
    Object.values(stats).forEach(data => {
      const category = data.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + data.count;
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
  }
};

// Enhanced UI components for tag management
const TagUI = {
  // Create enhanced tag input with autocomplete
  createTagInput(containerId, options = {}) {
    const container = el(containerId);
    if (!container) return;

    const {
      placeholder = "Add tags...",
      onTagsChange = () => {},
      initialTags = []
    } = options;

    container.innerHTML = `
      <div class="tag-input-container">
        <div class="tags-display" id="${containerId}-tags"></div>
        <input type="text" 
               id="${containerId}-input" 
               placeholder="${placeholder}"
               class="tag-input-field" />
        <div class="tag-suggestions" id="${containerId}-suggestions"></div>
      </div>
    `;

    const input = el(`${containerId}-input`);
    const tagsDisplay = el(`${containerId}-tags`);
    const suggestions = el(`${containerId}-suggestions`);
    
    let currentTags = [...initialTags];
    let selectedSuggestionIndex = -1;

    const renderTags = () => {
      tagsDisplay.innerHTML = currentTags.map((tag, index) => {
        const color = TagManager.getTagColor(tag);
        const category = TagManager.getTagCategory(tag);
        return `
          <span class="tag-pill" style="background-color: ${color}15; border-color: ${color}; color: ${color}">
            ${tag}
            <button class="tag-remove" data-index="${index}" style="color: ${color}">×</button>
          </span>
        `;
      }).join('');
      
      // Bind remove buttons
      tagsDisplay.querySelectorAll('.tag-remove').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const index = parseInt(btn.dataset.index);
          currentTags.splice(index, 1);
          renderTags();
          onTagsChange(currentTags);
        };
      });
    };

    const renderSuggestions = async (query) => {
      if (!query.trim()) {
        // Show smart suggestions when input is empty
        if (query === '') {
          const titleInput = el('#title');
          const title = titleInput ? titleInput.value : '';
          const content = input.value;
          
          // Get context-aware suggestions
          const contextSuggestions = await TagManager.getSuggestionsWithContext(
            content, 
            title, 
            currentTags, 
            UI.state.currentId
          );
          
          suggestions.innerHTML = contextSuggestions.map((suggestion, index) => {
            const color = TagManager.getTagColor(suggestion.tag);
            const isSelected = index === selectedSuggestionIndex;
            
            return `
              <div class="tag-suggestion ${isSelected ? 'selected' : ''}" 
                   data-tag="${suggestion.tag}" 
                   data-index="${index}"
                   style="border-left-color: ${color}">
                <span class="tag-name">#${suggestion.tag}</span>
                <span class="tag-count" style="background: ${color}20; color: ${color}">${suggestion.source}</span>
              </div>
            `;
          }).join('');
          
          suggestions.style.display = contextSuggestions.length ? 'block' : 'none';
          selectedSuggestionIndex = -1;
          
          // Bind suggestion clicks
          suggestions.querySelectorAll('.tag-suggestion').forEach(item => {
            item.onclick = () => {
              const tag = '#' + item.dataset.tag;
              if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                renderTags();
                onTagsChange(currentTags);
              }
              input.value = '';
              suggestions.style.display = 'none';
            };
          });
          
          return;
        }
        
        suggestions.style.display = 'none';
        return;
      }

      const existingTags = await TagManager.getTagStats();
      const suggested = TagManager.searchTags(query, Object.keys(existingTags));
      
      suggestions.innerHTML = suggested.map((tag, index) => {
        const color = TagManager.getTagColor(tag);
        const stats = existingTags[tag];
        const isSelected = index === selectedSuggestionIndex;
        
        return `
          <div class="tag-suggestion ${isSelected ? 'selected' : ''}" 
               data-tag="${tag}" 
               data-index="${index}"
               style="border-left-color: ${color}">
            <span class="tag-name">#${tag}</span>
            ${stats ? `<span class="tag-count">${stats.count}</span>` : ''}
          </div>
        `;
      }).join('');
      
      suggestions.style.display = suggested.length ? 'block' : 'none';
      selectedSuggestionIndex = -1;

      // Bind suggestion clicks
      suggestions.querySelectorAll('.tag-suggestion').forEach(item => {
        item.onclick = () => {
          const tag = '#' + item.dataset.tag;
          if (!currentTags.includes(tag)) {
            currentTags.push(tag);
            renderTags();
            onTagsChange(currentTags);
          }
          input.value = '';
          suggestions.style.display = 'none';
        };
      });
    };

    // Input event handlers
    input.addEventListener('input', debounce(async (e) => {
      await renderSuggestions(e.target.value);
    }, 150));
    
    input.addEventListener('focus', async () => {
      // Show smart suggestions when input is focused and empty
      if (!input.value.trim()) {
        await renderSuggestions('');
      }
    });

    input.addEventListener('keydown', (e) => {
      const suggestionItems = suggestions.querySelectorAll('.tag-suggestion');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestionItems.length - 1);
        renderSuggestions(input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        renderSuggestions(input.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        
        if (selectedSuggestionIndex >= 0 && suggestionItems[selectedSuggestionIndex]) {
          suggestionItems[selectedSuggestionIndex].click();
        } else if (input.value.trim()) {
          const newTags = TagManager.parseTags(input.value);
          newTags.forEach(tag => {
            if (!currentTags.includes(tag)) {
              currentTags.push(tag);
            }
          });
          renderTags();
          onTagsChange(currentTags);
          input.value = '';
          suggestions.style.display = 'none';
        }
      } else if (e.key === 'Escape') {
        suggestions.style.display = 'none';
        selectedSuggestionIndex = -1;
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        suggestions.style.display = 'none';
      }
    });

    renderTags();
    
    return {
      getTags: () => currentTags,
      setTags: (tags) => {
        currentTags = [...tags];
        renderTags();
      },
      addTag: (tag) => {
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
          renderTags();
          onTagsChange(currentTags);
        }
      }
    };
  }
};