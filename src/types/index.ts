// Type definitions for Mahart Linked Notes

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  links: string[]
  backlinks?: string[]
  color: string
  createdAt: string
  updatedAt: string
  version?: number
  metadata?: Record<string, unknown>
}

export interface NoteVersion {
  id: string
  noteId: string
  version: number
  title: string
  body: string
  tags: string[]
  timestamp: string
  changeType: 'create' | 'update' | 'delete'
}

export interface Tag {
  name: string
  count: number
  category?: string
  color?: string
  description?: string
}

export interface TagCategory {
  name: string
  color: string
  description: string
}

export interface SearchResult {
  note: Note
  score: number
  matches: {
    field: 'title' | 'body' | 'tags'
    text: string
    start: number
    end: number
  }[]
}

export interface SearchOptions {
  fuzzy?: boolean
  includeContent?: boolean
  includeTitle?: boolean
  includeTags?: boolean
  limit?: number
  threshold?: number
}

export interface GraphNode {
  id: string
  title: string
  color: string
  size: number
  group?: string
  x?: number
  y?: number
  z?: number
  connections: number
}

export interface GraphLink {
  source: string
  target: string
  type: 'wikilink' | 'tag' | 'color'
  strength: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphOptions {
  linkMode: 'tags' | 'colors' | 'all'
  showLabels: boolean
  showOrphans: boolean
  maxNodes: number
  physics: boolean
}

export interface Theme {
  id: string
  name: string
  type: 'light' | 'dark' | 'high-contrast'
  colors: Record<string, string>
}

export interface Workspace {
  id: string
  name: string
  description?: string
  settings: WorkspaceSettings
  createdAt: string
  updatedAt: string
}

export interface WorkspaceSettings {
  autoSave: boolean
  autoLink: boolean
  enableAnalytics: boolean
  enableSync: boolean
  theme: string
  defaultNoteColor: string
  editorFont: string
  editorFontSize: number
  previewMode: 'split' | 'preview' | 'editor'
}

export interface AppSettings {
  currentWorkspace: string
  recentWorkspaces: string[]
  shortcuts: Record<string, string>
  ui: {
    sidebarWidth: number
    sidebarCollapsed: boolean
    showMinimap: boolean
    showLineNumbers: boolean
    wordWrap: boolean
  }
}

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  config?: Record<string, unknown>
  permissions: string[]
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: TemplateVariable[]
  createdAt: string
  updatedAt: string
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'date' | 'select' | 'number'
  label: string
  description?: string
  required: boolean
  default?: string | number
  options?: string[]
}

export interface AiSuggestion {
  id: string
  type: 'link' | 'tag' | 'content' | 'restructure'
  confidence: number
  title: string
  description: string
  data: Record<string, unknown>
  applied: boolean
  dismissed: boolean
  createdAt: string
}

export interface AnalyticsEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: string
  sessionId: string
}

export interface AnalyticsMetrics {
  totalNotes: number
  totalWords: number
  totalLinks: number
  totalTags: number
  notesCreatedToday: number
  notesModifiedToday: number
  averageNoteLength: number
  mostUsedTags: Tag[]
  activityHeatmap: Record<string, number>
  productivityScore: number
}

export interface ExportOptions {
  format: 'markdown' | 'json' | 'pdf' | 'html'
  includeMetadata: boolean
  includeImages: boolean
  structure: 'flat' | 'hierarchical'
  filename?: string
}

export interface ImportOptions {
  source: 'obsidian' | 'notion' | 'roam' | 'json' | 'markdown'
  preserveStructure: boolean
  handleDuplicates: 'skip' | 'rename' | 'overwrite'
}

export interface SyncStatus {
  connected: boolean
  lastSync: string | null
  syncInProgress: boolean
  conflictsCount: number
  pendingChanges: number
}

export interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  cursor?: {
    noteId: string
    position: number
  }
  lastSeen: string
}

export interface RouterPage {
  path: string
  pageId: string
  title: string
  component?: string
  onLoad?: () => Promise<void> | void
  onUnload?: () => Promise<void> | void
}

export interface Command {
  id: string
  name: string
  description: string
  category: string
  shortcut?: string
  handler: () => Promise<void> | void
  enabled: boolean
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration: number
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  handler: () => void
}

// Event types
export interface AppEvents {
  'note:created': Note
  'note:updated': Note
  'note:deleted': string
  'note:opened': string
  'search:performed': string
  'graph:rendered': GraphData
  'workspace:changed': string
  'theme:changed': string
  'sync:started': void
  'sync:completed': void
  'sync:error': Error
}

// Store types
export interface StoreState<T> {
  data: T
  loading: boolean
  error: Error | null
  lastUpdated: number
}

export interface CreateNoteOptions {
  title?: string
  body?: string
  tags?: string[]
  color?: string
  template?: string
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type EventListener<T> = (data: T) => void | Promise<void>

export type Unsubscribe = () => void

// Global app instance
declare global {
  interface Window {
    __APP_VERSION__: string
    __BUILD_TIME__: string
  }
}
