/* recommendations.js — Smart note recommendation engine */

const Recommendations = {
  // Get recommended notes based on current note
  async getRecommendations(noteId, limit = 5) {
    const notes = await Store.allNotes();
    const currentNote = notes.find(n => n.id === noteId);
    
    if (!currentNote) return [];
    
    // Calculate recommendation scores for all other notes
    const scores = notes
      .filter(note => note.id !== noteId) // Exclude current note
      .map(note => ({
        note,
        score: this.calculateRecommendationScore(currentNote, note, notes)
      }))
      .filter(item => item.score > 0) // Only positive scores
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit); // Limit results
    
    return scores.map(item => item.note);
  },
  
  // Calculate recommendation score between two notes
  calculateRecommendationScore(sourceNote, targetNote, allNotes) {
    let score = 0;
    
    // 1. Shared tags bonus
    const sourceTags = new Set(sourceNote.tags || []);
    const targetTags = new Set(targetNote.tags || []);
    const sharedTags = [...sourceTags].filter(tag => targetTags.has(tag));
    score += sharedTags.length * 3; // 3 points per shared tag
    
    // 2. Link relationship bonus
    const sourceLinks = new Set(sourceNote.links || []);
    const targetLinks = new Set(targetNote.links || []);
    
    // Direct link bonus
    if (sourceLinks.has(targetNote.id)) score += 5;
    if (targetLinks.has(sourceNote.id)) score += 5;
    
    // 3. Backlink bonus (mutual references are stronger)
    if (sourceLinks.has(targetNote.id) && targetLinks.has(sourceNote.id)) {
      score += 3; // Additional bonus for mutual references
    }
    
    // 4. Shared link context bonus
    const sharedLinks = [...sourceLinks].filter(linkId => targetLinks.has(linkId));
    score += sharedLinks.length * 2; // 2 points per shared link reference
    
    // 5. Content similarity bonus
    const contentSimilarity = this.calculateContentSimilarity(
      sourceNote.title + ' ' + sourceNote.body,
      targetNote.title + ' ' + targetNote.body
    );
    score += contentSimilarity * 10; // Up to 10 points for high similarity
    
    // 6. Recency bonus (recent notes are more relevant)
    const sourceDate = new Date(sourceNote.updatedAt || sourceNote.createdAt);
    const targetDate = new Date(targetNote.updatedAt || targetNote.createdAt);
    const avgDate = new Date((sourceDate.getTime() + targetDate.getTime()) / 2);
    const daysSinceUpdate = (Date.now() - avgDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Bonus for recent notes (up to 5 points for notes updated in last 7 days)
    if (daysSinceUpdate < 7) {
      score += (7 - daysSinceUpdate) / 7 * 5;
    }
    
    // 7. Hub node bonus (well-connected notes are more likely to be relevant)
    const targetLinkCount = targetNote.links ? targetNote.links.length : 0;
    if (targetLinkCount > 5) score += 2; // Bonus for well-connected notes
    if (targetLinkCount > 10) score += 3; // Extra bonus for hub notes
    
    return score;
  },
  
  // Calculate content similarity using token overlap
  calculateContentSimilarity(text1, text2) {
    const tokens1 = this.tokenizeText(text1);
    const tokens2 = this.tokenizeText(text2);
    
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity coefficient
    return intersection.size / union.size;
  },
  
  // Tokenize text for similarity calculation
  tokenizeText(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .filter(token => !this.isStopWord(token));
  },
  
  // Common stop words to filter out
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 
      'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 
      'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'too', 'use', 'any', 'big', 'end', 
      'far', 'got', 'let', 'lot', 'run', 'say', 'set', 'sit', 'way', 'win', 'yes', 'yet', 'zoo',
      'will', 'with', 'have', 'they', 'this', 'that', 'from', 'what', 'were', 'been', 'when',
      'make', 'like', 'time', 'just', 'know', 'take', 'into', 'year', 'good', 'some', 'them',
      'want', 'very', 'work', 'life', 'down', 'each', 'only', 'then', 'than', 'look', 'come',
      'over', 'think', 'also', 'back', 'after', 'well', 'where', 'much', 'even', 'first', 'many'
    ]);
    return stopWords.has(word.toLowerCase());
  },
  
  // Get general recommendations (not based on current note)
  async getGeneralRecommendations(limit = 5) {
    const notes = await Store.allNotes();
    
    // Score notes based on various factors
    const scoredNotes = notes.map(note => ({
      note,
      score: this.calculateGeneralScore(note, notes)
    }));
    
    // Sort by score and return top recommendations
    return scoredNotes
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.note);
  },
  
  // Calculate general score for a note
  calculateGeneralScore(note, allNotes) {
    let score = 0;
    
    // Connection hub bonus (well-connected notes are more important)
    const linkCount = note.links ? note.links.length : 0;
    score += linkCount * 2;
    
    // Tag diversity bonus
    const tagCount = note.tags ? note.tags.length : 0;
    score += tagCount;
    
    // Recency bonus
    const noteDate = new Date(note.updatedAt || note.createdAt);
    const daysSinceUpdate = (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += (30 - daysSinceUpdate) / 30 * 5; // Up to 5 points for very recent notes
    }
    
    // Backlink bonus (number of notes that link to this note)
    const backlinkCount = allNotes.filter(n => 
      n.links && n.links.includes(note.id)
    ).length;
    score += backlinkCount * 3;
    
    return score;
  }
};