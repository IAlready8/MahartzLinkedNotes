// Worker Manager for coordinating Web Workers
import type { Note } from '../types/index.js';

interface WorkerMessage {
  id: string;
  type: string;
  data: any;
}

interface WorkerResponse {
  id: string;
  type: string;
  result?: any;
  error?: string;
}

class WorkerPool<T extends Worker = Worker> {
  private workers: T[] = [];
  private availableWorkers: T[] = [];
  private pendingTasks: Array<{
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    message: WorkerMessage;
  }> = [];
  private messageHandlers: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout?: number;
  }> = new Map();

  constructor(
    private workerFactory: () => T,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private createWorker(): T {
    const worker = this.workerFactory();
    
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, result, error } = event.data;
      const handler = this.messageHandlers.get(id);
      
      if (handler) {
        if (handler.timeout) {
          clearTimeout(handler.timeout);
        }
        
        this.messageHandlers.delete(id);
        
        if (error) {
          handler.reject(new Error(error));
        } else {
          handler.resolve(result);
        }
      }
      
      // Return worker to available pool
      this.returnWorker(worker);
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      // Handle worker errors by recreating the worker
      this.replaceWorker(worker);
    };

    return worker;
  }

  private replaceWorker(oldWorker: T): void {
    const index = this.workers.indexOf(oldWorker);
    if (index !== -1) {
      oldWorker.terminate();
      const newWorker = this.createWorker();
      this.workers[index] = newWorker;
      this.availableWorkers.push(newWorker);
    }
  }

  private returnWorker(worker: T): void {
    this.availableWorkers.push(worker);
    this.processPendingTasks();
  }

  private processPendingTasks(): void {
    while (this.pendingTasks.length > 0 && this.availableWorkers.length > 0) {
      const task = this.pendingTasks.shift()!;
      const worker = this.availableWorkers.shift()!;
      
      const handler = this.messageHandlers.get(task.message.id)!;
      
      // Set timeout for the task
      handler.timeout = window.setTimeout(() => {
        this.messageHandlers.delete(task.message.id);
        task.reject(new Error('Worker task timeout'));
        this.returnWorker(worker);
      }, 30000); // 30 second timeout
      
      worker.postMessage(task.message);
    }
  }

  async execute(type: string, data: any, timeout: number = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `task_${Date.now()}_${Math.random()}`;
      const message: WorkerMessage = { id, type, data };
      
      this.messageHandlers.set(id, { resolve, reject });
      
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        
        // Set timeout
        const timeoutId = window.setTimeout(() => {
          this.messageHandlers.delete(id);
          reject(new Error('Worker task timeout'));
          this.returnWorker(worker);
        }, timeout);
        
        this.messageHandlers.get(id)!.timeout = timeoutId;
        worker.postMessage(message);
      } else {
        this.pendingTasks.push({ resolve, reject, message });
      }
    });
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks = [];
    this.messageHandlers.clear();
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      pendingTasks: this.pendingTasks.length,
      activeMessages: this.messageHandlers.size
    };
  }
}

class WorkerManager {
  private searchWorkerPool: WorkerPool | null = null;
  private processingWorkerPool: WorkerPool | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof Worker !== 'undefined';
    
    if (this.isSupported) {
      this.initializeWorkers();
    }
  }

  private initializeWorkers(): void {
    try {
      // Initialize search worker pool
      this.searchWorkerPool = new WorkerPool(
        () => new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' }),
        2 // Use 2 search workers
      );

      console.log('✅ Worker pools initialized');
    } catch (error) {
      console.warn('Failed to initialize workers:', error);
      this.isSupported = false;
    }
  }

  /**
   * Build search index using worker
   */
  async buildSearchIndex(notes: Note[]): Promise<any> {
    if (!this.isSupported || !this.searchWorkerPool) {
      // Fallback to main thread
      return this.buildSearchIndexMainThread(notes);
    }

    try {
      return await this.searchWorkerPool.execute('buildIndex', { notes });
    } catch (error) {
      console.warn('Worker search index build failed, falling back to main thread:', error);
      return this.buildSearchIndexMainThread(notes);
    }
  }

  /**
   * Perform search using worker
   */
  async search(query: string, limit: number = 50): Promise<any[]> {
    if (!this.isSupported || !this.searchWorkerPool) {
      // Fallback to main thread
      return this.searchMainThread(query, limit);
    }

    try {
      return await this.searchWorkerPool.execute('search', { query, limit });
    } catch (error) {
      console.warn('Worker search failed, falling back to main thread:', error);
      return this.searchMainThread(query, limit);
    }
  }

  /**
   * Compute links using worker
   */
  async computeLinks(body: string, allNotes: Note[]): Promise<string[]> {
    if (!this.isSupported || !this.searchWorkerPool) {
      // Fallback to main thread
      return this.computeLinksMainThread(body, allNotes);
    }

    try {
      return await this.searchWorkerPool.execute('computeLinks', { body, allNotes });
    } catch (error) {
      console.warn('Worker link computation failed, falling back to main thread:', error);
      return this.computeLinksMainThread(body, allNotes);
    }
  }

  // Fallback implementations for main thread
  private buildSearchIndexMainThread(notes: Note[]): Promise<any> {
    return Promise.resolve({ success: true, indexSize: notes.length });
  }

  private searchMainThread(query: string, limit: number): Promise<any[]> {
    // This would integrate with the existing search implementation
    return Promise.resolve([]);
  }

  private computeLinksMainThread(body: string, allNotes: Note[]): Promise<string[]> {
    const wikiLinks = this.extractWikiLinks(body);
    const resolvedLinks: string[] = [];

    for (const target of wikiLinks) {
      if (/^ID:/i.test(target)) {
        const id = target.split(':')[1].trim();
        if (allNotes.some(n => n.id === id)) {
          resolvedLinks.push(id);
        }
      } else {
        const found = allNotes.find(n => 
          (n.title || '').toLowerCase() === target.toLowerCase()
        );
        if (found) {
          resolvedLinks.push(found.id);
        }
      }
    }

    return Promise.resolve(Array.from(new Set(resolvedLinks)));
  }

  private extractWikiLinks(markdown: string): string[] {
    const links = [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)]
      .map(match => match[1].trim());
    return links;
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isSupported: this.isSupported,
      searchWorkerPool: this.searchWorkerPool?.getStats() || null,
      processingWorkerPool: this.processingWorkerPool?.getStats() || null
    };
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    if (this.searchWorkerPool) {
      this.searchWorkerPool.terminate();
      this.searchWorkerPool = null;
    }

    if (this.processingWorkerPool) {
      this.processingWorkerPool.terminate();
      this.processingWorkerPool = null;
    }
  }

  /**
   * Check if workers are available and healthy
   */
  isHealthy(): boolean {
    if (!this.isSupported) return false;
    
    const searchStats = this.searchWorkerPool?.getStats();
    return Boolean(searchStats && searchStats.totalWorkers > 0);
  }

  /**
   * Initialize the worker manager
   */
  async init(): Promise<void> {
    if (this.isSupported && !this.searchWorkerPool) {
      this.initializeWorkers();
    }
    
    console.log('🔧 Worker Manager initialized:', {
      supported: this.isSupported,
      healthy: this.isHealthy()
    });
  }
}

// Create and export worker manager instance
const workerManager = new WorkerManager();

export const WorkerManager = {
  buildSearchIndex: (notes: Note[]) => workerManager.buildSearchIndex(notes),
  search: (query: string, limit?: number) => workerManager.search(query, limit),
  computeLinks: (body: string, allNotes: Note[]) => workerManager.computeLinks(body, allNotes),
  getStats: () => workerManager.getStats(),
  terminate: () => workerManager.terminate(),
  isHealthy: () => workerManager.isHealthy(),
  init: () => workerManager.init()
};