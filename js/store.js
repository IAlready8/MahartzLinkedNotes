/* store.js — data model + persistence (localforage/IndexedDB) */
localforage.config({ name: 'mahart-linked-notes', storeName: 'kv' });

const Store = {
  async allNotes(){ return (await localforage.getItem('notes')) || []; },
  async saveNotes(arr){ await localforage.setItem('notes', arr); return arr; },
  async upsert(note){
    // Save version history before updating
    if(note.id) {
      const existing = await this.get(note.id);
      if(existing) {
        await this.saveVersion(note.id, existing);
      }
    }
    
    const ns = await this.allNotes();
    const i = ns.findIndex(n=>n.id===note.id);
    if(i>=0) ns[i]=note; else ns.push(note);
    await this.saveNotes(ns);
    return note;
  },
  async get(id){ return (await this.allNotes()).find(n=>n.id===id) },
  async byTitle(t){ return (await this.allNotes()).find(n=>n.title===t) },
  async wipe(){ await localforage.setItem('notes', []); },
  // analytics log
  async events(){ return (await localforage.getItem('events')) || []; },
  async log(ev){ const e=await this.events(); e.push(ev); await localforage.setItem('events', e); },
  async export(){ return { notes: await this.allNotes(), events: await this.events(), exportedAt: nowISO() } },
  async import(json){
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if(Array.isArray(data.notes)) await localforage.setItem('notes', data.notes);
    if(Array.isArray(data.events)) await localforage.setItem('events', data.events);
    return true;
  },
  
  // Version history management
  async saveVersion(noteId, note){
    // Don't save version if content hasn't changed significantly
    const versions = await this.getVersions(noteId);
    const lastVersion = versions.length > 0 ? versions[versions.length - 1] : null;
    
    if (lastVersion) {
      // Simple content comparison (title, body, tags)
      const contentChanged = 
        lastVersion.title !== note.title ||
        lastVersion.body !== note.body ||
        JSON.stringify(lastVersion.tags || []) !== JSON.stringify(note.tags || []);
      
      // Only save version if content changed and at least 5 minutes have passed
      const timeSinceLast = Date.now() - new Date(lastVersion.updatedAt || lastVersion.createdAt).getTime();
      if (!contentChanged || timeSinceLast < 5 * 60 * 1000) {
        return; // Skip saving version
      }
    }
    
    // Save version with timestamp
    const versionKey = `version_${noteId}_${Date.now()}`;
    await localforage.setItem(versionKey, {
      ...note,
      versionId: versionKey,
      versionedAt: nowISO()
    });
    
    // Keep only last 20 versions to prevent storage bloat
    await this.cleanupVersions(noteId);
  },
  
  async getVersions(noteId){
    const allKeys = await localforage.keys();
    const versionKeys = allKeys.filter(key => key.startsWith(`version_${noteId}_`));
    
    // Sort by timestamp (newest first)
    versionKeys.sort((a, b) => {
      const aTime = parseInt(a.split('_')[2]);
      const bTime = parseInt(b.split('_')[2]);
      return bTime - aTime;
    });
    
    // Load version data
    const versions = [];
    for(const key of versionKeys) {
      try {
        const version = await localforage.getItem(key);
        if (version) versions.push(version);
      } catch (e) {
        console.warn('Failed to load version:', key, e);
      }
    }
    
    return versions;
  },
  
  async getVersion(noteId, versionId){
    return await localforage.getItem(versionId);
  },
  
  async restoreVersion(noteId, versionId){
    const version = await this.getVersion(noteId, versionId);
    if (!version) return null;
    
    // Get current note
    const current = await this.get(noteId);
    if (!current) return null;
    
    // Save current version before restoring
    await this.saveVersion(noteId, current);
    
    // Restore the version (but keep the same ID)
    const restored = {
      ...version,
      id: noteId, // Keep original note ID
      restoredAt: nowISO(),
      updatedAt: nowISO()
    };
    
    await this.upsert(restored);
    return restored;
  },
  
  async cleanupVersions(noteId){
    const versions = await this.getVersions(noteId);
    
    // Keep only last 20 versions
    if (versions.length > 20) {
      const versionsToDelete = versions.slice(20);
      for(const version of versionsToDelete) {
        try {
          await localforage.removeItem(version.versionId);
        } catch (e) {
          console.warn('Failed to delete version:', version.versionId, e);
        }
      }
    }
  },
  
  async deleteAllVersions(noteId){
    const versions = await this.getVersions(noteId);
    for(const version of versions) {
      try {
        await localforage.removeItem(version.versionId);
      } catch (e) {
        console.warn('Failed to delete version:', version.versionId, e);
      }
    }
  }
};

// Model helpers
const Note = {
  create({title='', body='', tags=[]}={}){
    const id = ULID();
    return { id, title, body, tags: uniq(tags.map(t=>t.toLowerCase())), links:[], createdAt: nowISO(), updatedAt: nowISO() };
  },
  computeLinks(note, all){
    const w = extractWikiLinks(note.body||'');
    // resolve each w to id via exact title or ID:xxxx
    const out=[];
    for(const target of w){
      if(/^ID:/i.test(target)){
        const id = target.split(':')[1].trim();
        if(all.some(n=>n.id===id)) out.push(id);
      }else{
        const found = all.find(n=>n.title.toLowerCase()===target.toLowerCase());
        if(found) out.push(found.id);
      }
    }
    note.links = uniq(out);
    return note;
  },
  backlinks(id, all){ return all.filter(n=> (n.links||[]).includes(id)); }
};
