import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Note, AppState, SearchResult } from '../types';
import { noteStorage } from '../utils/storage';
import { createNote, updateNote, searchNotes } from '../utils/notes';

// Actions
type NotesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_CURRENT_NOTE'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] };

// Initial state
const initialState: AppState = {
  notes: [],
  currentNoteId: null,
  searchQuery: '',
  searchResults: [],
  isLoading: true
};

// Reducer
function notesReducer(state: AppState, action: NotesAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id ? action.payload : note
        )
      };
    
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        currentNoteId: state.currentNoteId === action.payload ? null : state.currentNoteId
      };
    
    case 'SET_CURRENT_NOTE':
      return { ...state, currentNoteId: action.payload };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    default:
      return state;
  }
}

// Context
interface NotesContextType {
  state: AppState;
  actions: {
    loadNotes: () => Promise<void>;
    createNewNote: (title?: string, body?: string) => Promise<Note>;
    saveNote: (noteId: string, updates: Partial<Pick<Note, 'title' | 'body' | 'color'>>) => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
    setCurrentNote: (noteId: string | null) => void;
    searchNotes: (query: string) => void;
    clearSearch: () => void;
    exportData: () => Promise<string>;
    importData: (jsonData: string) => Promise<void>;
    clearAllData: () => Promise<void>;
  };
  currentNote: Note | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Provider component
interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Get current note
  const currentNote = state.currentNoteId 
    ? state.notes.find(note => note.id === state.currentNoteId) || null
    : null;

  // Actions
  const actions = {
    loadNotes: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const notes = await noteStorage.getAllNotes();
        dispatch({ type: 'SET_NOTES', payload: notes });
        
        // If no current note selected and there are notes, select the most recent one
        if (!state.currentNoteId && notes.length > 0) {
          const mostRecent = notes.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          dispatch({ type: 'SET_CURRENT_NOTE', payload: mostRecent.id });
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createNewNote: async (title?: string, body?: string): Promise<Note> => {
      const note = createNote(title, body);
      await noteStorage.saveNote(note);
      dispatch({ type: 'ADD_NOTE', payload: note });
      dispatch({ type: 'SET_CURRENT_NOTE', payload: note.id });
      return note;
    },

    saveNote: async (noteId: string, updates: Partial<Pick<Note, 'title' | 'body' | 'color'>>) => {
      const existingNote = state.notes.find(n => n.id === noteId);
      if (!existingNote) return;

      const updatedNote = updateNote(existingNote, updates, state.notes);
      await noteStorage.saveNote(updatedNote);
      dispatch({ type: 'UPDATE_NOTE', payload: updatedNote });

      // Update search results if we have an active search
      if (state.searchQuery) {
        const results = searchNotes(state.searchQuery, state.notes.map(n => 
          n.id === noteId ? updatedNote : n
        ));
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      }
    },

    deleteNote: async (noteId: string) => {
      await noteStorage.deleteNote(noteId);
      dispatch({ type: 'DELETE_NOTE', payload: noteId });
    },

    setCurrentNote: (noteId: string | null) => {
      dispatch({ type: 'SET_CURRENT_NOTE', payload: noteId });
    },

    searchNotes: (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
      if (query.trim()) {
        const results = searchNotes(query, state.notes);
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      } else {
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      }
    },

    clearSearch: () => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    },

    exportData: async (): Promise<string> => {
      return await noteStorage.exportData();
    },

    importData: async (jsonData: string) => {
      await noteStorage.importData(jsonData);
      await actions.loadNotes();
    },

    clearAllData: async () => {
      await noteStorage.clear();
      dispatch({ type: 'SET_NOTES', payload: [] });
      dispatch({ type: 'SET_CURRENT_NOTE', payload: null });
    }
  };

  // Load notes on mount
  useEffect(() => {
    actions.loadNotes();
  }, []);

  const value: NotesContextType = {
    state,
    actions,
    currentNote
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

// Hook to use the context
export function useNotes(): NotesContextType {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}