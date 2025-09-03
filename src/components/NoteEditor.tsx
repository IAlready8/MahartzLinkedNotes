import React, { useState, useEffect, useCallback } from 'react';
import { useNotes } from '../context/NotesContext';

interface NoteEditorProps {
  className?: string;
}

export function NoteEditor({ className = '' }: NoteEditorProps) {
  const { state, actions, currentNote } = useNotes();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (noteId: string, updates: { title: string; body: string }) => {
      setSaveStatus('saving');
      try {
        await actions.saveNote(noteId, updates);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save note:', error);
        setSaveStatus('unsaved');
      }
    }, 1000),
    [actions]
  );

  // Update local state when current note changes
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setBody(currentNote.body);
      setSaveStatus('saved');
    } else {
      setTitle('');
      setBody('');
      setSaveStatus('saved');
    }
  }, [currentNote]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('unsaved');
    
    if (currentNote) {
      debouncedSave(currentNote.id, { title: newTitle, body });
    }
  };

  // Handle body change
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    setBody(newBody);
    setSaveStatus('unsaved');
    
    if (currentNote) {
      debouncedSave(currentNote.id, { title, body: newBody });
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!currentNote) return;
    
    setSaveStatus('saving');
    try {
      await actions.saveNote(currentNote.id, { title, body });
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save note:', error);
      setSaveStatus('unsaved');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'n':
          e.preventDefault();
          actions.createNewNote();
          break;
      }
    }
  };

  // Get save status text and color
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return { text: 'Saving...', color: 'var(--color-text-muted)' };
      case 'saved':
        return { text: 'Saved', color: 'var(--color-accent-success)' };
      case 'unsaved':
        return { text: 'Unsaved changes', color: 'var(--color-accent-warning)' };
    }
  };

  const statusDisplay = getSaveStatusDisplay();

  if (!currentNote) {
    return (
      <div className={`editor-content ${className}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          color: 'var(--color-text-muted)'
        }}>
          <h2>No note selected</h2>
          <p>Create a new note or select one from the sidebar to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => actions.createNewNote()}
          >
            <i className="fas fa-plus"></i>
            <span>Create New Note</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} onKeyDown={handleKeyDown}>
      {/* Editor Header */}
      <div className="editor-header">
        <div className="editor-title-section">
          <input 
            type="text" 
            id="note-title" 
            data-testid="note-title"
            className="note-title-input" 
            placeholder="Untitled Note"
            value={title}
            onChange={handleTitleChange}
          />
        </div>
        <div className="editor-actions">
          <span 
            id="save-status" 
            className="save-status" 
            style={{ color: statusDisplay.color }}
            aria-live="polite" 
            aria-atomic="true"
          >
            {statusDisplay.text}
          </span>
          <button 
            id="save-btn" 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            <i className="fas fa-save"></i>
            <span>Save</span>
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="editor-content">
        {/* Editor Panel */}
        <div className="editor-pane">
          <textarea 
            id="note-body" 
            data-testid="note-body"
            className="editor-textarea" 
            placeholder="Start writing your note..."
            value={body}
            onChange={handleBodyChange}
          ></textarea>
        </div>
        
        {/* Preview Panel */}
        <div id="preview-panel" className="preview-pane">
          <div className="preview-content">
            <div id="note-preview" data-testid="note-preview" className="preview">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Basic markdown rendering (we'll enhance this later)
function renderMarkdown(content: string): string {
  if (!content) return '<p class="text-muted">Start writing to see preview...</p>';
  
  // Basic markdown parsing
  let html = content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Wikilinks
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="wikilink" data-link="$1">$1</span>')
    // Tags
    .replace(/#(\w+)/g, '<span class="tag">#$1</span>')
    // Line breaks
    .replace(/\n/g, '<br>');

  return `<div>${html}</div>`;
}