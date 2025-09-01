// Enhanced Search module with TypeScript and advanced indexing
import type { Note, SearchResult } from '../types/index.js';
import { tokenize } from './util.js';

interface SearchIndex {
  id: string;
  title: string;
  titleTokens: string[];
  bodyTokens: string[];
  tags: string[];
  color: string;
  links: string[];
  backlinks: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchFilters {
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  minLinks: number | null;
  hasBacklinks: boolean;
  colors: string[];
}

class SearchEngine {
  private index: SearchIndex[] = [];
  private tagIndex: Map<string, Set<string>> = new Map();
  private titleIndex: Map<string, string> = new Map();
  private linkIndex: Map<string, Set<string>> = new Map();
  private colorIndex: Map<string, Set<string>> = new Map();
  private lastNotesHash: string = '';
  
  public filters: SearchFilters = {
    tags: [],
    dateFrom: null,
    dateTo: null,
    minLinks: null,
    hasBacklinks: false,
    colors: []
  };

  /**
   * Calculate hash of notes for change detection
   */
  private calculateNotesHash(notes: Note[]): string {
    const hashData = notes.map(n => `${n.id}:${n.updatedAt}`).join('|');
    let hash = 0;
    for (let i = 0; i < hashData.length; i++) {
      const char = hashData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Build optimized search index
   */
  buildIndex(notes: Note[]): void {
    const startTime = performance.now();
    
    // Skip rebuild if notes haven't changed
    const notesHash = this.calculateNotesHash(notes);
    if (this.lastNotesHash === notesHash && this.index.length === notes.length) {
      console.log('Search index rebuild skipped - no changes detected');
      return;
    }
    this.lastNotesHash = notesHash;

    // Clear existing indexes
    this.tagIndex.clear();
    this.titleIndex.clear();
    this.linkIndex.clear();
    this.colorIndex.clear();

    // Build backlink map
    const backlinkMap = new Map<string, number>();
    notes.forEach(note => {
      note.links?.forEach(linkId => {
        backlinkMap.set(linkId, (backlinkMap.get(linkId) || 0) + 1);
      });
    });

    // Process notes in batches for better performance
    const batchSize = 100;
    this.index = [];

    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      const batchIndex = batch.map(note => this.createSearchIndex(note, backlinkMap));
      this.index.push(...batchIndex);
    }

    // Build secondary indexes
    this.buildSecondaryIndexes();

    const duration = performance.now() - startTime;
    console.log(`Search index built: ${notes.length} notes in ${Math.round(duration)}ms`);
  }

  /**
   * Create search index entry for a note
   */
  private createSearchIndex(note: Note, backlinkMap: Map<string, number>): SearchIndex {
    return {
      id: note.id,
      title: note.title || '',
      titleTokens: tokenize(note.title || ''),
      bodyTokens: tokenize(note.body || ''),
      tags: note.tags || [],
      color: note.color || '#6B7280',
      links: note.links || [],
      backlinks: backlinkMap.get(note.id) || 0,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt)
    };
  }

  /**
   * Build secondary indexes for fast filtering
   */
  private buildSecondaryIndexes(): void {
    this.index.forEach(item => {
      // Tag index
      item.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(item.id);
      });

      // Title index (case-insensitive)
      if (item.title) {
        this.titleIndex.set(item.title.toLowerCase(), item.id);
      }

      // Link index
      item.links.forEach(linkId => {
        if (!this.linkIndex.has(linkId)) {
          this.linkIndex.set(linkId, new Set());
        }
        this.linkIndex.get(linkId)!.add(item.id);
      });

      // Color index
      if (!this.colorIndex.has(item.color)) {
        this.colorIndex.set(item.color, new Set());
      }
      this.colorIndex.get(item.color)!.add(item.id);
    });
  }

  /**
   * Perform high-performance search with advanced scoring
   */
  search(query: string, limit: number = 50): SearchResult[] {
    if (!query.trim()) return [];

    const startTime = performance.now();
    const queryTokens = tokenize(query);
    
    if (queryTokens.length === 0) return [];

    // Pre-filter by active filters
    let candidates = this.index;
    
    if (this.filters.tags.length > 0) {
      const taggedIds = this.getNotesWithTags(this.filters.tags);
      candidates = candidates.filter(item => taggedIds.has(item.id));
    }

    if (this.filters.colors.length > 0) {
      candidates = candidates.filter(item => 
        this.filters.colors.includes(item.color)
      );
    }

    if (this.filters.dateFrom) {
      candidates = candidates.filter(item => 
        item.updatedAt >= this.filters.dateFrom!
      );
    }

    if (this.filters.dateTo) {
      candidates = candidates.filter(item => 
        item.updatedAt <= this.filters.dateTo!
      );
    }

    if (this.filters.minLinks !== null) {
      candidates = candidates.filter(item => 
        item.links.length >= this.filters.minLinks!
      );
    }

    if (this.filters.hasBacklinks) {
      candidates = candidates.filter(item => item.backlinks > 0);
    }

    // Score and sort results
    const results = candidates
      .map(item => this.scoreSearchResult(item, queryTokens))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const duration = performance.now() - startTime;
    
    // Log performance for monitoring
    if (duration > 100) {
      console.warn(`Slow search: ${Math.round(duration)}ms for "${query}"`);
    }

    return results.map(result => ({
      note: this.indexToNote(result.item),
      score: result.score,
      matches: result.matches
    }));
  }

  /**
   * Score a search result with advanced algorithms
   */
  private scoreSearchResult(item: SearchIndex, queryTokens: string[]): {
    item: SearchIndex;
    score: number;
    matches: { title: number; body: number; tags: number };
  } {
    let titleMatches = 0;
    let bodyMatches = 0;
    let tagMatches = 0;
    let score = 0;

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
    const daysSinceUpdate = (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      score *= 1.2; // 20% boost for notes updated in last week
    }

    // Boost for notes with more connections
    if (item.links.length > 0) {
      score *= (1 + item.links.length * 0.1); // Boost based on outgoing links
    }

    if (item.backlinks > 0) {
      score *= (1 + item.backlinks * 0.15); // Higher boost for incoming links
    }

    return {
      item,
      score,
      matches: { title: titleMatches, body: bodyMatches, tags: tagMatches }
    };
  }

  /**
   * Get notes that have all specified tags
   */
  private getNotesWithTags(tags: string[]): Set<string> {
    if (tags.length === 0) return new Set();
    
    const [firstTag, ...restTags] = tags;
    let result = new Set(this.tagIndex.get(firstTag) || []);
    
    for (const tag of restTags) {
      const tagNotes = this.tagIndex.get(tag) || new Set();
      result = new Set([...result].filter(id => tagNotes.has(id)));
    }
    
    return result;
  }

  /**
   * Convert search index back to note
   */
  private indexToNote(item: SearchIndex): Note {
    return {
      id: item.id,
      title: item.title,
      body: '', // Not stored in index for performance
      tags: item.tags,
      links: item.links,
      color: item.color,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    };
  }

  /**
   * Search by tag with fuzzy matching
   */
  searchByTag(tagQuery: string, limit: number = 20): string[] {
    if (!tagQuery.trim()) return [];

    const query = tagQuery.toLowerCase().replace('#', '');
    const matchingTags = Array.from(this.tagIndex.keys())
      .filter(tag => tag.toLowerCase().includes(query))
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.toLowerCase() === query;
        const bExact = b.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by tag usage frequency
        const aCount = this.tagIndex.get(a)?.size || 0;
        const bCount = this.tagIndex.get(b)?.size || 0;
        return bCount - aCount;
      })
      .slice(0, limit);

    return matchingTags;
  }

  /**
   * Get related notes based on shared tags and links
   */
  getRelatedNotes(noteId: string, limit: number = 10): Note[] {
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

    // Add notes that link to this note
    const backlinks = this.linkIndex.get(noteId) || new Set();
    backlinks.forEach(id => relatedIds.add(id));

    // Score and sort related notes
    const relatedNotes = Array.from(relatedIds)
      .map(id => this.index.find(item => item.id === id))
      .filter((item): item is SearchIndex => item !== undefined)
      .map(item => ({
        note: this.indexToNote(item),
        score: this.calculateRelatednessScore(note, item)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.note);

    return relatedNotes;
  }

  /**
   * Calculate how related two notes are
   */
  private calculateRelatednessScore(note1: SearchIndex, note2: SearchIndex): number {
    let score = 0;

    // Shared tags
    const sharedTags = note1.tags.filter(tag => note2.tags.includes(tag)).length;
    score += sharedTags * 3;

    // Direct links
    if (note1.links.includes(note2.id) || note2.links.includes(note1.id)) {
      score += 10;
    }

    // Same color
    if (note1.color === note2.color && note1.color !== '#6B7280') {
      score += 2;
    }

    // Recent activity
    const daysDiff = Math.abs(note1.updatedAt.getTime() - note2.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 7) {
      score += 1;
    }

    return score;
  }

  /**
   * Set search filters
   */
  setFilters(filters: Partial<SearchFilters>): void {
    this.filters = { ...this.filters, ...filters };
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      tags: [],
      dateFrom: null,
      dateTo: null,
      minLinks: null,
      hasBacklinks: false,
      colors: []
    };
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      totalNotes: this.index.length,
      uniqueTags: this.tagIndex.size,
      uniqueColors: this.colorIndex.size,
      totalLinks: Array.from(this.linkIndex.values()).reduce((sum, set) => sum + set.size, 0),
      averageTagsPerNote: this.index.reduce((sum, item) => sum + item.tags.length, 0) / this.index.length,
      averageLinksPerNote: this.index.reduce((sum, item) => sum + item.links.length, 0) / this.index.length,
      lastIndexUpdate: new Date().toISOString()
    };
  }

  /**
   * Initialize the search engine
   */
  async init(): Promise<void> {
    console.log('🔍 Initializing Search Engine...');
    // Additional initialization if needed
  }
}

// Create and export search instance
const searchEngine = new SearchEngine();

export const Search = {
  buildIndex: (notes: Note[]) => searchEngine.buildIndex(notes),
  search: (query: string, limit?: number) => searchEngine.search(query, limit),
  searchByTag: (tagQuery: string, limit?: number) => searchEngine.searchByTag(tagQuery, limit),
  getRelatedNotes: (noteId: string, limit?: number) => searchEngine.getRelatedNotes(noteId, limit),
  setFilters: (filters: Partial<SearchFilters>) => searchEngine.setFilters(filters),
  clearFilters: () => searchEngine.clearFilters(),
  getStats: () => searchEngine.getStats(),
  init: () => searchEngine.init(),
  get filters() { return searchEngine.filters; }
};