import { Note } from '../types';

// Generate ULID-style IDs (lexicographically sortable)
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`;
}

// Create a new note with default values
export function createNote(title: string = 'Untitled Note', body: string = ''): Note {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: title.trim() || 'Untitled Note',
    body,
    tags: extractTags(body),
    links: [],
    color: '#6B7280', // Default gray color
    createdAt: now,
    updatedAt: now
  };
}

// Extract hashtags from note body
export function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = '#' + match[1].toLowerCase();
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

// Extract wikilinks from note body
export function extractWikilinks(content: string): string[] {
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const linkText = match[1].trim();
    if (!links.includes(linkText)) {
      links.push(linkText);
    }
  }
  
  return links;
}

// Resolve wikilinks to note IDs
export function resolveWikilinks(content: string, allNotes: Note[]): string[] {
  const wikilinks = extractWikilinks(content);
  const resolvedIds: string[] = [];
  
  for (const link of wikilinks) {
    // Check for direct ID reference: [[ID:xxxxx]]
    if (link.startsWith('ID:')) {
      const id = link.substring(3);
      if (allNotes.find(note => note.id === id)) {
        resolvedIds.push(id);
      }
    } else {
      // Find by title match
      const matchingNote = allNotes.find(note => 
        note.title.toLowerCase() === link.toLowerCase()
      );
      if (matchingNote) {
        resolvedIds.push(matchingNote.id);
      }
    }
  }
  
  return resolvedIds;
}

// Find backlinks (notes that link to this note)
export function findBacklinks(noteId: string, allNotes: Note[]): Note[] {
  return allNotes.filter(note => 
    note.id !== noteId && note.links.includes(noteId)
  );
}

// Update note and recompute links and tags
export function updateNote(note: Note, updates: Partial<Pick<Note, 'title' | 'body' | 'color'>>, allNotes: Note[]): Note {
  const updatedNote = {
    ...note,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Recompute tags and links if body was updated
  if (updates.body !== undefined) {
    updatedNote.tags = extractTags(updatedNote.body);
    updatedNote.links = resolveWikilinks(updatedNote.body, allNotes);
  }
  
  return updatedNote;
}

// Search notes with scoring
export function searchNotes(query: string, notes: Note[]): Array<{ note: Note; score: number; matches: { title: number; body: number; tags: number } }> {
  if (!query.trim()) return [];
  
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  const results: Array<{ note: Note; score: number; matches: { title: number; body: number; tags: number } }> = [];
  
  for (const note of notes) {
    let titleMatches = 0;
    let bodyMatches = 0;
    let tagMatches = 0;
    
    const titleLower = note.title.toLowerCase();
    const bodyLower = note.body.toLowerCase();
    const tagsLower = note.tags.join(' ').toLowerCase();
    
    for (const term of searchTerms) {
      // Title matches (weighted higher)
      if (titleLower.includes(term)) titleMatches++;
      
      // Body matches
      const bodyMatchCount = (bodyLower.match(new RegExp(term, 'g')) || []).length;
      bodyMatches += bodyMatchCount;
      
      // Tag matches
      if (tagsLower.includes(term)) tagMatches++;
    }
    
    const totalScore = (titleMatches * 3) + bodyMatches + (tagMatches * 2);
    
    if (totalScore > 0) {
      results.push({
        note,
        score: totalScore,
        matches: { title: titleMatches, body: bodyMatches, tags: tagMatches }
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}