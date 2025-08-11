/* data-management.js — Advanced data management, backup, and synchronization */

const DataManagement = {
  backupProviders: new Map(),
  syncProviders: new Map(),
  encryptionKey: null,
  
  // Initialize data management system
  async init() {
    // Register built-in providers
    this.registerBackupProvider('local', {
      name: 'Local Storage',
      description: 'Backup to browser storage',
      icon: '💾',
      init: this.initLocalStorage.bind(this),
      backup: this.backupToLocalStorage.bind(this),
      restore: this.restoreFromLocalStorage.bind(this),
      list: this.listLocalBackups.bind(this)
    });
    
    this.registerBackupProvider('file', {
      name: 'File System',
      description: 'Backup to local files',
      icon: '📁',
      init: this.initFileBackup.bind(this),
      backup: this.backupToFile.bind(this),
      restore: this.restoreFromFile.bind(this),
      list: this.listFileBackups.bind(this)
    });
    
    this.registerSyncProvider('webdav', {
      name: 'WebDAV',
      description: 'Sync with WebDAV servers',
      icon: '☁️',
      init: this.initWebDAV.bind(this),
      sync: this.syncWithWebDAV.bind(this),
      configure: this.configureWebDAV.bind(this)
    });
    
    this.registerSyncProvider('git', {
      name: 'Git Repository',
      description: 'Sync with Git repositories',
      icon: '🐙',
      init: this.initGitSync.bind(this),
      sync: this.syncWithGit.bind(this),
      configure: this.configureGit.bind(this)
    });
    
    // Load saved configurations
    await this.loadConfigurations();
  },
  
  // Register backup provider
  registerBackupProvider(id, provider) {
    this.backupProviders.set(id, provider);
  },
  
  // Register sync provider
  registerSyncProvider(id, provider) {
    this.syncProviders.set(id, provider);
  },
  
  // Load configurations from storage
  async loadConfigurations() {
    try {
      const configs = await localforage.getItem('dataManagementConfigs') || {};
      this.configurations = configs;
    } catch (error) {
      console.error('Failed to load data management configurations:', error);
      this.configurations = {};
    }
  },
  
  // Save configurations to storage
  async saveConfigurations() {
    try {
      await localforage.setItem('dataManagementConfigs', this.configurations);
    } catch (error) {
      console.error('Failed to save data management configurations:', error);
    }
  },
  
  // Get all backup providers
  getBackupProviders() {
    return Array.from(this.backupProviders.entries()).map(([id, provider]) => ({
      id,
      ...provider
    }));
  },
  
  // Get all sync providers
  getSyncProviders() {
    return Array.from(this.syncProviders.entries()).map(([id, provider]) => ({
      id,
      ...provider
    }));
  },
  
  // Configure a provider
  async configureProvider(type, providerId, config) {
    if (!this.configurations[type]) {
      this.configurations[type] = {};
    }
    
    this.configurations[type][providerId] = config;
    await this.saveConfigurations();
  },
  
  // Get provider configuration
  getProviderConfig(type, providerId) {
    return this.configurations[type]?.[providerId] || {};
  },
  
  // Backup data
  async backup(providerId, options = {}) {
    const provider = this.backupProviders.get(providerId);
    if (!provider) {
      throw new Error(`Backup provider ${providerId} not found`);
    }
    
    try {
      // Initialize provider if needed
      if (provider.init) {
        await provider.init();
      }
      
      // Perform backup
      const result = await provider.backup(options);
      return result;
    } catch (error) {
      console.error(`Backup failed for provider ${providerId}:`, error);
      throw error;
    }
  },
  
  // Restore data
  async restore(providerId, backupId, options = {}) {
    const provider = this.backupProviders.get(providerId);
    if (!provider) {
      throw new Error(`Backup provider ${providerId} not found`);
    }
    
    try {
      // Initialize provider if needed
      if (provider.init) {
        await provider.init();
      }
      
      // Perform restore
      const result = await provider.restore(backupId, options);
      return result;
    } catch (error) {
      console.error(`Restore failed for provider ${providerId}:`, error);
      throw error;
    }
  },
  
  // Sync data
  async sync(providerId, options = {}) {
    const provider = this.syncProviders.get(providerId);
    if (!provider) {
      throw new Error(`Sync provider ${providerId} not found`);
    }
    
    try {
      // Initialize provider if needed
      if (provider.init) {
        await provider.init();
      }
      
      // Perform sync
      const result = await provider.sync(options);
      return result;
    } catch (error) {
      console.error(`Sync failed for provider ${providerId}:`, error);
      throw error;
    }
  },
  
  // List backups
  async listBackups(providerId) {
    const provider = this.backupProviders.get(providerId);
    if (!provider) {
      throw new Error(`Backup provider ${providerId} not found`);
    }
    
    try {
      // Initialize provider if needed
      if (provider.init) {
        await provider.init();
      }
      
      // List backups
      const backups = await provider.list();
      return backups;
    } catch (error) {
      console.error(`Failed to list backups for provider ${providerId}:`, error);
      throw error;
    }
  },
  
  // Local Storage Backup Provider
  async initLocalStorage() {
    // Local storage is always available
    console.log('Local storage backup provider initialized');
  },
  
  async backupToLocalStorage(options = {}) {
    try {
      const data = await Store.export();
      const backupId = `backup_${Date.now()}`;
      const backupData = {
        id: backupId,
        timestamp: new Date().toISOString(),
        data: data,
        metadata: {
          notesCount: data.notes.length,
          eventsCount: data.events.length,
          size: JSON.stringify(data).length
        }
      };
      
      // Store backup
      await localforage.setItem(backupId, backupData);
      
      // Update backup index
      const backupIndex = await localforage.getItem('backupIndex') || [];
      backupIndex.push({
        id: backupId,
        timestamp: backupData.timestamp,
        notesCount: backupData.metadata.notesCount,
        size: backupData.metadata.size
      });
      await localforage.setItem('backupIndex', backupIndex);
      
      return {
        success: true,
        backupId: backupId,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('Local storage backup failed:', error);
      throw error;
    }
  },
  
  async restoreFromLocalStorage(backupId, options = {}) {
    try {
      const backupData = await localforage.getItem(backupId);
      if (!backupData) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Import data
      await Store.import(backupData.data);
      
      return {
        success: true,
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('Local storage restore failed:', error);
      throw error;
    }
  },
  
  async listLocalBackups() {
    try {
      const backupIndex = await localforage.getItem('backupIndex') || [];
      return backupIndex.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Failed to list local backups:', error);
      return [];
    }
  },
  
  // File System Backup Provider
  async initFileBackup() {
    // Check if File API is available
    if (!window.showSaveFilePicker) {
      console.warn('File System Access API not available');
    }
    console.log('File backup provider initialized');
  },
  
  async backupToFile(options = {}) {
    try {
      const data = await Store.export();
      const filename = `mahart-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Create blob
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      // Save file
      if (window.showSaveFilePicker) {
        // Use File System Access API
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Mahart Backup',
            accept: {
              'application/json': ['.json']
            }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      return {
        success: true,
        filename: filename,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('File backup failed:', error);
      throw error;
    }
  },
  
  async restoreFromFile(backupId, options = {}) {
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      // Wait for file selection
      const file = await new Promise((resolve, reject) => {
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            resolve(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
        input.oncancel = () => reject(new Error('File selection cancelled'));
        input.click();
      });
      
      // Read file
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Import data
      await Store.import(data);
      
      return {
        success: true,
        filename: file.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('File restore failed:', error);
      throw error;
    }
  },
  
  async listFileBackups() {
    // File system backups are not indexable
    return [];
  },
  
  // WebDAV Sync Provider
  async initWebDAV() {
    console.log('WebDAV sync provider initialized');
  },
  
  async configureWebDAV(config) {
    // Store WebDAV configuration
    await this.configureProvider('sync', 'webdav', config);
  },
  
  async syncWithWebDAV(options = {}) {
    const config = this.getProviderConfig('sync', 'webdav');
    if (!config.url || !config.username || !config.password) {
      throw new Error('WebDAV configuration incomplete');
    }
    
    try {
      // Export current data
      const data = await Store.export();
      
      // Create sync payload
      const payload = {
        timestamp: new Date().toISOString(),
        data: data,
        hash: await this.calculateHash(JSON.stringify(data))
      };
      
      // Sync with WebDAV server
      const response = await fetch(`${config.url}/mahart-sync.json`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`WebDAV sync failed: ${response.status} ${response.statusText}`);
      }
      
      return {
        success: true,
        timestamp: payload.timestamp
      };
    } catch (error) {
      console.error('WebDAV sync failed:', error);
      throw error;
    }
  },
  
  // Git Sync Provider
  async initGitSync() {
    console.log('Git sync provider initialized');
  },
  
  async configureGit(config) {
    // Store Git configuration
    await this.configureProvider('sync', 'git', config);
  },
  
  async syncWithGit(options = {}) {
    const config = this.getProviderConfig('sync', 'git');
    if (!config.repoUrl || !config.token) {
      throw new Error('Git configuration incomplete');
    }
    
    try {
      // Export current data
      const data = await Store.export();
      
      // In a real implementation, this would use a Git library
      // to commit and push changes to the repository
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        commit: 'abc123' // Placeholder commit hash
      };
    } catch (error) {
      console.error('Git sync failed:', error);
      throw error;
    }
  },
  
  // Calculate hash for data integrity
  async calculateHash(data) {
    if (crypto.subtle) {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for older browsers
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString();
    }
  },
  
  // Encryption utilities
  async setEncryptionKey(key) {
    this.encryptionKey = key;
  },
  
  async encryptData(data) {
    if (!this.encryptionKey) {
      return data; // No encryption if no key set
    }
    
    // In a real implementation, this would use Web Crypto API
    // to encrypt the data with the provided key
    return data;
  },
  
  async decryptData(data) {
    if (!this.encryptionKey) {
      return data; // No decryption if no key set
    }
    
    // In a real implementation, this would use Web Crypto API
    // to decrypt the data with the provided key
    return data;
  },
  
  // Data compression
  async compressData(data) {
    // In a real implementation, this would use compression libraries
    // like pako or Compression Streams API
    return data;
  },
  
  async decompressData(data) {
    // In a real implementation, this would use decompression libraries
    return data;
  },
  
  // Data validation
  async validateData(data) {
    try {
      // Basic validation
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('Invalid data format: missing notes array');
      }
      
      if (!data.events || !Array.isArray(data.events)) {
        throw new Error('Invalid data format: missing events array');
      }
      
      // Validate note structure
      for (const note of data.notes) {
        if (!note.id || !note.title || !note.body) {
          throw new Error('Invalid note structure');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Data validation failed:', error);
      return false;
    }
  },
  
  // Incremental backup
  async incrementalBackup(providerId, options = {}) {
    try {
      // Get last backup timestamp
      const lastBackup = await localforage.getItem('lastBackupTimestamp');
      
      // Get changed notes since last backup
      const notes = await Store.allNotes();
      const changedNotes = lastBackup 
        ? notes.filter(note => new Date(note.updatedAt) > new Date(lastBackup))
        : notes;
      
      if (changedNotes.length === 0) {
        return {
          success: true,
          message: 'No changes since last backup',
          timestamp: new Date().toISOString()
        };
      }
      
      // Create incremental backup
      const backupData = {
        timestamp: new Date().toISOString(),
        notes: changedNotes,
        type: 'incremental'
      };
      
      // Perform backup
      const provider = this.backupProviders.get(providerId);
      if (provider && provider.backup) {
        const result = await provider.backup({
          ...options,
          data: backupData
        });
        
        // Update last backup timestamp
        await localforage.setItem('lastBackupTimestamp', backupData.timestamp);
        
        return result;
      } else {
        throw new Error(`Provider ${providerId} does not support incremental backup`);
      }
    } catch (error) {
      console.error('Incremental backup failed:', error);
      throw error;
    }
  },
  
  // Scheduled backups
  async scheduleBackup(providerId, intervalMinutes = 60) {
    // Clear existing schedule
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    // Set up new schedule
    this.backupInterval = setInterval(async () => {
      try {
        await this.incrementalBackup(providerId);
        console.log('Scheduled backup completed');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
    
    console.log(`Scheduled backup set for every ${intervalMinutes} minutes`);
  },
  
  // Cancel scheduled backups
  cancelScheduledBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('Scheduled backup cancelled');
    }
  }
};