import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../context/NotesContext';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const { state, actions } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    actions.searchNotes(query);
  };

  const handleResultClick = (noteId: string) => {
    actions.setCurrentNote(noteId);
    actions.clearSearch();
    setIsExpanded(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      actions.clearSearch();
      setIsExpanded(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Only close if clicking outside the search container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setTimeout(() => {
        setIsExpanded(false);
        actions.clearSearch();
      }, 150); // Small delay to allow result clicks
    }
  };

  // Handle global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className={`search-container ${className}`} onBlur={handleBlur} tabIndex={-1}>
      <div className="search-input-wrapper">
        <i className="search-icon fas fa-search"></i>
        <input 
          ref={inputRef}
          type="text" 
          id="search-input" 
          data-testid="search-input"
          className="search-input" 
          placeholder="Search notes... (⌘K)"
          value={state.searchQuery}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        {state.searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              actions.clearSearch();
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            title="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div 
        id="search-results" 
        data-testid="search-results" 
        className={`search-results ${isExpanded && state.searchResults.length > 0 ? '' : 'hidden'}`}
      >
        {state.searchResults.map(({ note, score, matches }) => (
          <div
            key={note.id}
            className="search-result-item"
            onClick={() => handleResultClick(note.id)}
          >
            <div className="search-result-header">
              <h4 
                className="search-result-title"
                dangerouslySetInnerHTML={{ 
                  __html: highlightMatch(note.title, state.searchQuery) 
                }}
              />
              <div className="search-result-score">
                <div 
                  className="note-color-indicator"
                  style={{ backgroundColor: note.color }}
                />
                <span className="score-badge">{score}</span>
              </div>
            </div>
            
            <div 
              className="search-result-preview"
              dangerouslySetInnerHTML={{ 
                __html: highlightMatch(
                  note.body.substring(0, 100) + (note.body.length > 100 ? '...' : ''),
                  state.searchQuery
                )
              }}
            />
            
            <div className="search-result-meta">
              <div className="search-result-matches">
                {matches.title > 0 && <span className="match-type">Title: {matches.title}</span>}
                {matches.body > 0 && <span className="match-type">Content: {matches.body}</span>}
                {matches.tags > 0 && <span className="match-type">Tags: {matches.tags}</span>}
              </div>
              
              {note.tags.length > 0 && (
                <div className="search-result-tags">
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag-small">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {state.searchQuery && state.searchResults.length === 0 && (
          <div className="search-result-empty">
            <i className="fas fa-search"></i>
            <p>No notes found for "{state.searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}