// TypeScript type definitions for Mahart Linked Notes
export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  links: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
  restoredAt?: string;
}

export interface NoteMetadata {
  id: string;
  title: string;
  tags: string[];
  color: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteVersion {
  id: string;
  title: string;
  body: string;
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
  versionId: string;
  versionedAt: string;
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

export interface TagInfo {
  name: string;
  count: number;
  color: string;
  category: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoBackup: boolean;
  maxBackups: number;
  performanceMode: boolean;
  syncEnabled: boolean;
  editorMode: 'standard' | 'monaco';
  fontSize: number;
  fontFamily: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  size: number;
  noteCount: number;
  timestamp: number;
}

export interface DatabaseHealth {
  noteCount: number;
  metadataCount: number;
  eventCount: number;
  cacheSize: number;
  performance: {
    averageDuration: number;
    totalRecentSize: number;
    operationCount: number;
    recentOperations: Array<{
      operation: string;
      duration: number;
      timestamp: string;
    }>;
  };
  lastIndexUpdate: string | null;
}

export interface ExportData {
  metadata: {
    version: string;
    exportedAt: string;
    noteCount: number;
    eventCount: number;
    performance: any;
  };
  notes: Note[];
  events: AnalyticsEvent[];
  settings: AppSettings;
  tags: Record<string, number>;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface RouteConfig {
  pageId: string;
  title?: string;
  onLoad?: () => Promise<void> | void;
  loaded?: boolean;
  loadTime?: number;
  loadCount?: number;
  path?: string;
}

export interface NavigationHistoryItem {
  path: string;
  timestamp: number;
  title: string;
}

export interface GraphNode {
  id: string;
  title: string;
  color: string;
  tags: string[];
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'wikilink' | 'tag' | 'color';
}

export interface AIFeature {
  name: string;
  description: string;
  enabled: boolean;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  settings: Partial<AppSettings>;
  layout: {
    sidebar: boolean;
    preview: boolean;
    graph: boolean;
  };
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  settings: Record<string, any>;
  hooks: {
    beforeNoteSave?: (note: Note) => Note | Promise<Note>;
    afterNoteSave?: (note: Note) => void | Promise<void>;
    beforeNoteRender?: (content: string) => string | Promise<string>;
    afterNoteRender?: (html: string) => string | Promise<string>;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export type FilterFunction<T> = (item: T) => boolean;

export type SortFunction<T> = (a: T, b: T) => number;

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Graph visualization types
export interface ForceSimulationNode extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// Component props types
export interface EditorProps {
  note: Note;
  onSave: (note: Note) => Promise<void>;
  onUpdate: (note: Partial<Note>) => void;
  readonly?: boolean;
  autofocus?: boolean;
}

export interface GraphProps {
  notes: Note[];
  selectedNoteId?: string;
  linkMode: 'tags' | 'colors';
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Constants
export const APP_VERSION = '2.0.0';
export const DB_VERSION = 1;
export const MAX_NOTE_SIZE = 1024 * 1024; // 1MB
export const MAX_NOTES_COUNT = 10000;
export const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
export const BACKUP_INTERVAL = 30 * 60 * 1000; // 30 minutes