// Core types for the note management system
export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  links: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  note: Note;
  score: number;
  matches: {
    title: number;
    body: number;
    tags: number;
  };
}

export interface AppState {
  notes: Note[];
  currentNoteId: string | null;
  searchQuery: string;
  searchResults: SearchResult[];
  isLoading: boolean;
}