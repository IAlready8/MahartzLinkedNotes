/* ai-assistant.js — AI-powered knowledge assistant */

const AIAssistant = {
  // Knowledge base for the assistant
  knowledgeBase: {
    noteTaking: [
      "Use atomic notes - each note should contain one idea or concept",
      "Link notes liberally to create a web of knowledge",
      "Use the [[wikilink]] syntax to connect related ideas",
      "Add #tags to categorize and filter notes",
      "Write for your future self - be clear and concise"
    ],
    
    productivity: [
      "Review your notes regularly to reinforce learning",
      "Create index notes to organize related concepts",
      "Use templates for recurring note types",
      "Set up daily review routines",
      "Focus on building connections between ideas"
    ],
    
    zettelkasten: [
      "The Zettelkasten method emphasizes creating a network of interconnected ideas",
      "Each note should be self-contained and understandable on its own",
      "Use bidirectional links to create a web of knowledge",
      "Write in your own words to ensure understanding",
      "Let the structure emerge organically from the connections"
    ]
  },
  
  // Generate smart suggestions based on current context
  async generateSuggestions(notes, currentNote = null) {
    const suggestions = [];
    
    // Get recent notes
    const recentNotes = this.getRecentNotes(notes, 7); // Last 7 days
    
    // Suggestion: Create connections
    const connectionSuggestions = await this.suggestConnections(notes, currentNote);
    suggestions.push(...connectionSuggestions);
    
    // Suggestion: Add missing tags
    const tagSuggestions = this.suggestTags(notes, currentNote);
    suggestions.push(...tagSuggestions);
    
    // Suggestion: Create index notes
    const indexSuggestions = this.suggestIndexNotes(notes);
    suggestions.push(...indexSuggestions);
    
    // Suggestion: Review older notes
    const reviewSuggestions = this.suggestReviews(recentNotes);
    suggestions.push(...reviewSuggestions);
    
    // Suggestion: Knowledge gaps
    const gapSuggestions = this.suggestKnowledgeGaps(notes);
    suggestions.push(...gapSuggestions);
    
    return suggestions;
  },
  
  getRecentNotes(notes, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return notes.filter(note => {
      const noteDate = new Date(note.updatedAt || note.createdAt);
      return noteDate > cutoff;
    });
  },
  
  async suggestConnections(notes, currentNote) {
    const suggestions = [];
    
    if (!currentNote) return suggestions;
    
    // Find notes that might be related based on content similarity
    const currentContent = `${currentNote.title} ${currentNote.body}`.toLowerCase();
    const currentTags = new Set(currentNote.tags || []);
    
    for (const note of notes) {
      if (note.id === currentNote.id) continue;
      
      // Skip if already linked
      if ((currentNote.links || []).includes(note.id)) continue;
      
      const noteContent = `${note.title} ${note.body}`.toLowerCase();
      const noteTags = new Set(note.tags || []);
      
      // Calculate similarity score
      let score = 0;
      
      // Title similarity
      if (currentNote.title && note.title) {
        const titleMatch = this.calculateStringSimilarity(
          currentNote.title.toLowerCase(), 
          note.title.toLowerCase()
        );
        score += titleMatch * 3;
      }
      
      // Tag overlap
      const tagOverlap = [...currentTags].filter(tag => noteTags.has(tag)).length;
      score += tagOverlap * 2;
      
      // Content similarity
      const contentSimilarity = this.calculateStringSimilarity(currentContent, noteContent);
      score += contentSimilarity * 2;
      
      // Shared links context
      const sharedLinks = [...(currentNote.links || [])].filter(linkId => 
        (note.links || []).includes(linkId)
      ).length;
      score += sharedLinks;
      
      if (score > 2) {
        suggestions.push({
          type: 'connection',
          priority: score > 5 ? 'high' : 'medium',
          title: 'Create Connection',
          message: `Consider linking to "${note.title || note.id}" - these notes seem related.`,
          action: () => {
            if (typeof UI !== 'undefined' && typeof UI.openNote === 'function') {
              UI.openNote(note.id);
            }
          },
          score
        });
      }
    }
    
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
  },
  
  suggestTags(notes, currentNote) {
    const suggestions = [];
    
    if (!currentNote) return suggestions;
    
    const currentTags = new Set(currentNote.tags || []);
    const content = `${currentNote.title} ${currentNote.body}`.toLowerCase();
    
    // Common tag patterns
    const tagPatterns = {
      'question': /\b(what|how|why|when|where|who|which|explain|define)\b/,
      'todo': /\b(todo|task|need to|should|must|action|next step)\b/,
      'important': /\b(important|critical|key|vital|essential|crucial|priority)\b/,
      'research': /\b(research|study|investigate|explore|examine|analyze|investigation)\b/,
      'idea': /\b(idea|concept|thought|insight|observation|notion)\b/,
      'reference': /\b(reference|source|citation|quote)\b/,
      'meeting': /\b(meeting|discussion|conversation|call|sync)\b/
    };
    
    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (!currentTags.has(`#${tag}`) && pattern.test(content)) {
        suggestions.push({
          type: 'tag',
          priority: 'medium',
          title: 'Add Tag',
          message: `Consider adding #${tag} tag based on note content.`,
          action: () => {
            if (typeof UI !== 'undefined' && typeof UI.tagInput !== 'undefined') {
              UI.tagInput.addTag(`#${tag}`);
            }
          }
        });
      }
    }
    
    return suggestions;
  },
  
  suggestIndexNotes(notes) {
    const suggestions = [];
    
    // Group notes by tags
    const tagGroups = {};
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(note);
      });
    });
    
    // Suggest index notes for large tag groups
    for (const [tag, group] of Object.entries(tagGroups)) {
      if (group.length > 5 && !notes.some(note => 
        note.title && note.title.toLowerCase().includes(tag.replace('#', ''))
      )) {
        suggestions.push({
          type: 'index',
          priority: 'medium',
          title: 'Create Index Note',
          message: `Create an index note for ${tag} (${group.length} notes)`,
          action: async () => {
            if (typeof UI !== 'undefined' && typeof UI.createTemplatedNote === 'function') {
              // This would create a new index note
              toast(`Consider creating an index for ${tag}`);
            }
          }
        });
      }
    }
    
    return suggestions;
  },
  
  suggestReviews(recentNotes) {
    const suggestions = [];
    
    // Suggest reviewing notes with many connections but not recently updated
    const wellConnected = recentNotes
      .filter(note => (note.links || []).length > 3)
      .sort((a, b) => (b.links || []).length - (a.links || []).length)
      .slice(0, 3);
    
    wellConnected.forEach(note => {
      suggestions.push({
        type: 'review',
        priority: 'medium',
        title: 'Review Connected Note',
        message: `Review "${note.title || note.id}" - it has ${(note.links || []).length} connections`,
        action: () => {
          if (typeof UI !== 'undefined' && typeof UI.openNote === 'function') {
            UI.openNote(note.id);
          }
        }
      });
    });
    
    return suggestions;
  },
  
  suggestKnowledgeGaps(notes) {
    const suggestions = [];
    
    // Find isolated notes (no links in or out)
    const isolated = notes.filter(note => 
      (note.links || []).length === 0 && 
      !notes.some(n => (n.links || []).includes(note.id))
    );
    
    if (isolated.length > 0) {
      suggestions.push({
        type: 'gap',
        priority: 'high',
        title: 'Knowledge Gap',
        message: `${isolated.length} isolated notes found - consider connecting them`,
        action: () => {
          toast(`${isolated.length} isolated notes found`);
        }
      });
    }
    
    // Find notes with many links but few tags
    const poorlyTagged = notes.filter(note => 
      (note.links || []).length > 5 && 
      (note.tags || []).length < 2
    );
    
    if (poorlyTagged.length > 0) {
      suggestions.push({
        type: 'tagging',
        priority: 'medium',
        title: 'Improve Tagging',
        message: `${poorlyTagged.length} well-connected notes need better tagging`,
        action: () => {
          toast(`${poorlyTagged.length} notes need better tagging`);
        }
      });
    }
    
    return suggestions;
  },
  
  // Simple string similarity calculation
  calculateStringSimilarity(str1, str2) {
    // Convert to sets of words
    const words1 = new Set(str1.toLowerCase().match(/\w+/g) || []);
    const words2 = new Set(str2.toLowerCase().match(/\w+/g) || []);
    
    // Calculate Jaccard similarity
    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  },
  
  // Generate smart summaries
  async generateSummary(note) {
    if (!note) return '';
    
    const content = `${note.title || ''} ${note.body || ''}`;
    
    // Simple extractive summarization
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (sentences.length <= 3) {
      return content;
    }
    
    // Score sentences based on position and keyword density
    const keywords = this.extractKeywords(content);
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position bonus (first and last sentences are often important)
      if (index === 0) score += 3;
      if (index === sentences.length - 1) score += 2;
      
      // Keyword density
      const sentenceKeywords = this.extractKeywords(sentence);
      const keywordMatches = sentenceKeywords.filter(kw => keywords.includes(kw)).length;
      score += keywordMatches * 2;
      
      // Length penalty (very short sentences are less informative)
      if (sentence.split(' ').length < 5) score -= 1;
      
      return { sentence, score };
    });
    
    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, sentences.length));
    
    // Reorder by original position
    topSentences.sort((a, b) => 
      sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)
    );
    
    return topSentences.map(s => s.sentence).join('. ') + '.';
  },
  
  extractKeywords(text) {
    // Simple keyword extraction
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const stopWords = new Set(['that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'what', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'many', 'some', 'time', 'very', 'when', 'much', 'new', 'also', 'than', 'only', 'its', 'two', 'may', 'way', 'more', 'these', 'come', 'made', 'over', 'such', 'take', 'any', 'see', 'him', 'how', 'now', 'find', 'between', 'should', 'never', 'does', 'another', 'even', 'most', 'used', 'want', 'say', 'where', 'way', 'before', 'right', 'too', 'means', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'farm', 'three', 'small', 'set', 'put', 'end', 'why', 'again', 'turn', 'here', 'off', 'went', 'old', 'number', 'great', 'tell', 'men', 'say', 'small', 'every', 'found', 'still', 'name', 'should', 'home', 'give', 'water', 'room', 'mother', 'back', 'most', 'good', 'through', 'just', 'form', 'much', 'think', 'say', 'great', 'where', 'help', 'through', 'line', 'right', 'too', 'means', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want', 'show']);
    
    const keywords = words
      .filter(word => !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Unique
    
    return keywords.slice(0, 10);
  },
  
  // Answer questions based on knowledge base
  async answerQuestion(question, notes) {
    // Simple rule-based responses
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('how') && lowerQuestion.includes('connect')) {
      return "To create connections between notes, use the [[Note Title]] syntax in your note content. You can also link to a note by its ID using [[ID:note-id]]. The system will automatically create bidirectional links.";
    }
    
    if (lowerQuestion.includes('tag') || lowerQuestion.includes('#')) {
      return "Tags help categorize and filter your notes. Add tags using #tag-name anywhere in your note. You can filter notes by tags in the sidebar or use advanced search with tag:tag-name.";
    }
    
    if (lowerQuestion.includes('search') || lowerQuestion.includes('find')) {
      return "Use the search bar to find notes by title, content, or tags. For advanced search, try: tag:tag-name, after:2023-01-01, before:2023-12-31, links:>3, or has:backlinks.";
    }
    
    if (lowerQuestion.includes('template')) {
      return "Create notes from templates using the Templates button next to New Note. Templates provide structured starting points for common note types like meetings, research, projects, and decisions.";
    }
    
    if (lowerQuestion.includes('collaborat')) {
      return "The app supports real-time collaboration. Changes made in other tabs or browsers are automatically synchronized. Conflict resolution ensures data consistency.";
    }
    
    if (lowerQuestion.includes('version') || lowerQuestion.includes('history')) {
      return "Access note history through the History button in the editor. View previous versions and restore them if needed. The system automatically saves versions when content changes significantly.";
    }
    
    // If no rule matches, provide a general tip
    const tips = [
      "Try creating links between related ideas using [[wikilink]] syntax",
      "Use #tags to organize your notes by category or topic",
      "Regularly review your knowledge graph to discover new connections",
      "Create index notes to organize related concepts",
      "Use templates for recurring note types to save time"
    ];
    
    return `I don't have a specific answer for that question. Here's a tip: ${tips[Math.floor(Math.random() * tips.length)]}`;
  },
  
  // Generate daily insights
  async generateDailyInsights(notes) {
    const insights = [];
    
    // Today's activity
    const today = new Date();
    const todayNotes = notes.filter(note => {
      const noteDate = new Date(note.updatedAt || note.createdAt);
      return noteDate.toDateString() === today.toDateString();
    });
    
    if (todayNotes.length > 0) {
      insights.push({
        type: 'activity',
        title: 'Today\'s Activity',
        message: `You've worked on ${todayNotes.length} notes today. Keep building your knowledge graph!`
      });
    }
    
    // Weekly trends
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekNotes = notes.filter(note => {
      const noteDate = new Date(note.updatedAt || note.createdAt);
      return noteDate > weekAgo;
    });
    
    if (weekNotes.length > 0) {
      const linkCount = weekNotes.reduce((sum, note) => sum + (note.links || []).length, 0);
      const avgLinks = linkCount / weekNotes.length;
      
      insights.push({
        type: 'trend',
        title: 'Weekly Trend',
        message: `This week you've created ${weekNotes.length} notes with an average of ${avgLinks.toFixed(1)} links each.`
      });
    }
    
    // Knowledge base growth
    if (notes.length > 10) {
      const totalLinks = notes.reduce((sum, note) => sum + (note.links || []).length, 0);
      const avgLinks = totalLinks / notes.length;
      
      if (avgLinks > 2) {
        insights.push({
          type: 'growth',
          title: 'Knowledge Network',
          message: `Your knowledge graph is growing strong with ${notes.length} notes and ${totalLinks} connections.`
        });
      }
    }
    
    return insights;
  }
};