import React from 'react';
import { useNotes } from '../context/NotesContext';
import { Note } from '../types';

interface NoteListProps {
  className?: string;
}

export function NoteList({ className = '' }: NoteListProps) {
  const { state, actions, currentNote } = useNotes();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleNoteSelect = (noteId: string) => {
    actions.setCurrentNote(noteId);
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      await actions.deleteNote(noteId);
    }
  };

  const getPreview = (note: Note) => {
    const preview = note.body.replace(/[#*\[\]]/g, '').substring(0, 100);
    return preview || 'No content';
  };

  const sortedNotes = [...state.notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className={className}>
      <div className="note-list-header">
        <h3 className="note-list-title">Notes</h3>
        <span id="note-count" data-testid="note-count" className="note-count">
          {state.notes.length} note{state.notes.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div id="note-list" data-testid="note-list" className="note-list">
        {state.isLoading ? (
          <div className="note-list-item loading">
            <div className="spinner-sm"></div>
            <span>Loading notes...</span>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="note-list-empty">
            <i className="fas fa-sticky-note" style={{ fontSize: '2rem', color: 'var(--color-text-muted)' }}></i>
            <p>No notes yet</p>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => actions.createNewNote()}
            >
              Create your first note
            </button>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`note-list-item ${currentNote?.id === note.id ? 'active' : ''}`}
              onClick={() => handleNoteSelect(note.id)}
            >
              <div className="note-item-header">
                <h4 className="note-item-title">{note.title}</h4>
                <div className="note-item-actions">
                  <div 
                    className="note-color-indicator"
                    style={{ backgroundColor: note.color }}
                    title="Note color"
                  ></div>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    title="Delete note"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div className="note-item-preview">
                {getPreview(note)}
              </div>
              
              <div className="note-item-meta">
                <div className="note-item-tags">
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag-small">{tag}</span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="tag-small">+{note.tags.length - 3}</span>
                  )}
                </div>
                <div className="note-item-date">
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}