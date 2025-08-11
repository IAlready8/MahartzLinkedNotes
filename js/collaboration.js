/* collaboration.js — Real-time collaboration with conflict resolution */

const Collaboration = {
  channel: null,
  peers: new Map(),
  pendingChanges: new Map(),
  conflictResolver: null,
  
  async init() {
    if (!window.BroadcastChannel) return;
    
    this.channel = new BroadcastChannel('mahart-notes-collab');
    this.channel.onmessage = (e) => this.handleMessage(e.data);
    
    // Send presence message
    this.sendPresence();
    
    // Periodic presence updates
    setInterval(() => this.sendPresence(), 30000);
  },
  
  sendPresence() {
    if (!this.channel) return;
    
    this.channel.postMessage({
      type: 'presence',
      userId: this.getUserId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  },
  
  handleMessage(data) {
    switch (data.type) {
      case 'presence':
        this.handlePresence(data);
        break;
      case 'note-change':
        this.handleNoteChange(data);
        break;
      case 'sync-request':
        this.handleSyncRequest(data);
        break;
      case 'sync-response':
        this.handleSyncResponse(data);
        break;
      case 'conflict-detected':
        this.handleConflict(data);
        break;
    }
  },
  
  handlePresence(data) {
    this.peers.set(data.userId, {
      ...data,
      lastSeen: Date.now()
    });
    
    // Clean up old peers
    const now = Date.now();
    for (const [userId, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > 300000) { // 5 minutes
        this.peers.delete(userId);
      }
    }
  },
  
  async handleNoteChange(data) {
    // Check for conflicts
    const localNote = await Store.get(data.noteId);
    if (localNote) {
      const localTimestamp = new Date(localNote.updatedAt).getTime();
      const remoteTimestamp = new Date(data.timestamp).getTime();
      
      if (Math.abs(localTimestamp - remoteTimestamp) > 5000) { // 5 second difference
        // Potential conflict - request sync
        this.requestSync(data.noteId);
        return;
      }
    }
    
    // Apply change
    await Store.upsert(data.note);
    UI.refresh();
  },
  
  handleSyncRequest(data) {
    // Send current state of requested note
    Store.get(data.noteId).then(note => {
      if (note) {
        this.channel.postMessage({
          type: 'sync-response',
          requestId: data.requestId,
          note: note,
          userId: this.getUserId()
        });
      }
    });
  },
  
  async handleSyncResponse(data) {
    if (data.requestId !== this.pendingSyncId) return;
    
    const localNote = await Store.get(data.note.id);
    if (!localNote) {
      await Store.upsert(data.note);
      UI.refresh();
      return;
    }
    
    // Compare versions
    const localTime = new Date(localNote.updatedAt).getTime();
    const remoteTime = new Date(data.note.updatedAt).getTime();
    
    if (remoteTime > localTime) {
      // Remote is newer - update local
      await Store.upsert(data.note);
      UI.refresh();
    } else if (localTime > remoteTime) {
      // Local is newer - send to remote
      this.sendNoteChange(localNote);
    }
    // If equal, no action needed
  },
  
  async handleConflict(data) {
    // Resolve conflict using CRDT-like approach
    const localNote = await Store.get(data.noteId);
    const remoteNote = data.remoteNote;
    
    if (!localNote) {
      await Store.upsert(remoteNote);
      UI.refresh();
      return;
    }
    
    // Merge using last-write-wins for simple fields
    const mergedNote = {
      ...localNote,
      ...remoteNote,
      title: this.resolveFieldConflict(localNote.title, remoteNote.title, localNote.updatedAt, remoteNote.updatedAt),
      body: this.resolveContentConflict(localNote.body, remoteNote.body, localNote.updatedAt, remoteNote.updatedAt),
      tags: this.mergeTags(localNote.tags, remoteNote.tags),
      updatedAt: new Date(Math.max(
        new Date(localNote.updatedAt).getTime(),
        new Date(remoteNote.updatedAt).getTime()
      )).toISOString()
    };
    
    await Store.upsert(mergedNote);
    UI.refresh();
  },
  
  resolveFieldConflict(localValue, remoteValue, localTime, remoteTime) {
    const localTimestamp = new Date(localTime).getTime();
    const remoteTimestamp = new Date(remoteTime).getTime();
    
    return localTimestamp >= remoteTimestamp ? localValue : remoteValue;
  },
  
  resolveContentConflict(localBody, remoteBody, localTime, remoteTime) {
    // For content, we could implement more sophisticated merging
    // For now, use last-write-wins
    return this.resolveFieldConflict(localBody, remoteBody, localTime, remoteTime);
  },
  
  mergeTags(localTags, remoteTags) {
    const merged = new Set();
    
    if (localTags) localTags.forEach(tag => merged.add(tag));
    if (remoteTags) remoteTags.forEach(tag => merged.add(tag));
    
    return Array.from(merged);
  },
  
  sendNoteChange(note) {
    if (!this.channel) return;
    
    this.channel.postMessage({
      type: 'note-change',
      note: note,
      noteId: note.id,
      timestamp: note.updatedAt,
      userId: this.getUserId()
    });
  },
  
  requestSync(noteId) {
    if (!this.channel) return;
    
    const requestId = ULID();
    this.pendingSyncId = requestId;
    
    this.channel.postMessage({
      type: 'sync-request',
      noteId: noteId,
      requestId: requestId,
      userId: this.getUserId()
    });
  },
  
  detectConflict(noteId, remoteNote) {
    if (!this.channel) return;
    
    this.channel.postMessage({
      type: 'conflict-detected',
      noteId: noteId,
      remoteNote: remoteNote,
      userId: this.getUserId()
    });
  },
  
  getUserId() {
    // In a real app, this would be a proper user ID
    // For now, generate based on session
    if (!this.userId) {
      this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    }
    return this.userId;
  },
  
  getPeerCount() {
    return this.peers.size;
  },
  
  getPeers() {
    return Array.from(this.peers.values());
  }
};