// Search Worker for offloading heavy search operations
import type { Note } from '../types/index.js';

interface SearchMessage {
  id: string;
  type: 'buildIndex' | 'search' | 'computeLinks';
  data: any;
}

interface SearchResponse {
  id: string;
  type: string;
  result?: any;
  error?: string;
}

// Search index structure for the worker
interface SearchIndex {
  id: string;
  title: string;
  titleTokens: string[];
  bodyTokens: string[];
  tags: string[];
  color: string;
  links: string[];
  createdAt: number;
  updatedAt: number;
}

class SearchWorker {
  private index: SearchIndex[] = [];
  private tagIndex: Map<string, Set<string>> = new Map();
  private titleIndex: Map<string, string> = new Map();

  /**
   * Tokenize text into searchable tokens
   */
  private tokenize(text: string): string[] {
    return (text || '').toLowerCase().match(/[a-z0-9#_]+/g) || [];
  }

  /**
   * Extract wikilinks from markdown content
   */
  private extractWikiLinks(markdown: string): string[] {
    const links = [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)]
      .map(match => match[1].trim());
    return links;
  }

  /**
   * Build search index from notes
   */
  buildIndex(notes: Note[]): void {
    const startTime = performance.now();
    
    // Clear existing indexes
    this.index = [];
    this.tagIndex.clear();
    this.titleIndex.clear();

    // Build backlink count map
    const backlinkMap = new Map<string, number>();
    notes.forEach(note => {
      note.links?.forEach(linkId => {
        backlinkMap.set(linkId, (backlinkMap.get(linkId) || 0) + 1);
      });
    });

    // Build search index
    this.index = notes.map(note => ({
      id: note.id,
      title: note.title || '',
      titleTokens: this.tokenize(note.title || ''),
      bodyTokens: this.tokenize(note.body || ''),
      tags: note.tags || [],
      color: note.color || '#6B7280',
      links: note.links || [],
      createdAt: new Date(note.createdAt).getTime(),
      updatedAt: new Date(note.updatedAt).getTime()
    }));

    // Build secondary indexes
    this.index.forEach(item => {
      // Tag index
      item.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(item.id);
      });

      // Title index
      if (item.title) {
        this.titleIndex.set(item.title.toLowerCase(), item.id);
      }
    });

    const duration = performance.now() - startTime;
    console.log(`Search index built: ${notes.length} notes in ${Math.round(duration)}ms`);
  }

  /**
   * Perform search with scoring
   */
  search(query: string, limit: number = 50): any[] {
    if (!query.trim()) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const results = this.index
      .map(item => {
        let score = 0;
        let titleMatches = 0;
        let bodyMatches = 0;
        let tagMatches = 0;

        for (const token of queryTokens) {
          // Exact title match (highest weight)
          if (item.title.toLowerCase().includes(token)) {
            titleMatches++;
            score += 10;
            
            // Bonus for exact title match
            if (item.title.toLowerCase() === token) {
              score += 20;
            }
          }

          // Title token matches
          const titleTokenMatches = item.titleTokens.filter(t => t.includes(token)).length;
          titleMatches += titleTokenMatches;
          score += titleTokenMatches * 5;

          // Body token matches
          const bodyTokenMatches = item.bodyTokens.filter(t => t.includes(token)).length;
          bodyMatches += bodyTokenMatches;
          score += bodyTokenMatches;

          // Tag matches
          const tagTokenMatches = item.tags.filter(tag => 
            tag.toLowerCase().includes(token)
          ).length;
          tagMatches += tagTokenMatches;
          score += tagTokenMatches * 3;
        }

        // Boost for recent notes
        const daysSinceUpdate = (Date.now() - item.updatedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          score *= 1.2;
        }

        // Boost for connected notes
        if (item.links.length > 0) {
          score *= (1 + item.links.length * 0.1);
        }

        return {
          id: item.id,
          title: item.title,
          tags: item.tags,
          color: item.color,
          score,
          matches: { title: titleMatches, body: bodyMatches, tags: tagMatches }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Compute links for a note based on wikilinks in content
   */
  computeLinks(noteBody: string, allNotes: Note[]): string[] {
    const wikiLinks = this.extractWikiLinks(noteBody);
    const resolvedLinks: string[] = [];

    for (const target of wikiLinks) {
      if (/^ID:/i.test(target)) {
        // Direct ID reference
        const id = target.split(':')[1].trim();
        if (allNotes.some(n => n.id === id)) {
          resolvedLinks.push(id);
        }
      } else {
        // Title reference
        const found = allNotes.find(n => 
          (n.title || '').toLowerCase() === target.toLowerCase()
        );
        if (found) {
          resolvedLinks.push(found.id);
        }
      }
    }

    // Remove duplicates
    return Array.from(new Set(resolvedLinks));
  }

  /**
   * Get related notes for a given note
   */
  getRelatedNotes(noteId: string, limit: number = 10): any[] {
    const note = this.index.find(item => item.id === noteId);
    if (!note) return [];

    const relatedIds = new Set<string>();
    
    // Add notes with shared tags
    note.tags.forEach(tag => {
      const taggedNotes = this.tagIndex.get(tag) || new Set();
      taggedNotes.forEach(id => {
        if (id !== noteId) relatedIds.add(id);
      });
    });

    // Add linked notes
    note.links.forEach(linkId => relatedIds.add(linkId));

    // Score and sort related notes
    const relatedNotes = Array.from(relatedIds)
      .map(id => this.index.find(item => item.id === id))
      .filter((item): item is SearchIndex => item !== undefined)
      .map(item => {
        let score = 0;

        // Shared tags
        const sharedTags = note.tags.filter(tag => item.tags.includes(tag)).length;
        score += sharedTags * 3;

        // Direct links
        if (note.links.includes(item.id) || item.links.includes(note.id)) {
          score += 10;
        }

        // Same color
        if (note.color === item.color && note.color !== '#6B7280') {
          score += 2;
        }

        return {
          id: item.id,
          title: item.title,
          tags: item.tags,
          color: item.color,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return relatedNotes;
  }
}

const searchWorker = new SearchWorker();

// Handle messages from main thread
self.onmessage = function(e: MessageEvent<SearchMessage>) {
  const { id, type, data } = e.data;
  
  try {
    let result: any;

    switch (type) {
      case 'buildIndex':
        searchWorker.buildIndex(data.notes);
        result = { success: true, indexSize: data.notes.length };
        break;
        
      case 'search':
        result = searchWorker.search(data.query, data.limit);
        break;
        
      case 'computeLinks':
        result = searchWorker.computeLinks(data.body, data.allNotes);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: SearchResponse = { id, type, result };
    self.postMessage(response);
    
  } catch (error) {
    const response: SearchResponse = { 
      id, 
      type, 
      error: error instanceof Error ? error.message : String(error)
    };
    self.postMessage(response);
  }
};