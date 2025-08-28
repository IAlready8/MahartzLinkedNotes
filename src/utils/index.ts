// Core utilities for Mahart Linked Notes

import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Note, CreateNoteOptions } from '@/types'

// ULID generation (Universally Unique Lexicographically Sortable Identifier)
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ENCODING_LEN = ENCODING.length
const TIME_MAX = Math.pow(2, 48) - 1
const TIME_LEN = 10
const RANDOM_LEN = 16

export function ulid(seedTime?: number): string {
  const now = seedTime || Date.now()
  if (now > TIME_MAX) throw new Error('Cannot generate ULID for dates after year 10,895')
  
  let timeStr = ''
  let timeValue = now
  for (let i = TIME_LEN; i > 0; i--) {
    const mod = timeValue % ENCODING_LEN
    timeStr = ENCODING.charAt(mod) + timeStr
    timeValue = Math.floor(timeValue / ENCODING_LEN)
  }
  
  let randomStr = ''
  for (let i = 0; i < RANDOM_LEN; i++) {
    randomStr += ENCODING.charAt(Math.floor(Math.random() * ENCODING_LEN))
  }
  
  return timeStr + randomStr
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// DOM utilities
export function el<T extends Element = Element>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

export function els<T extends Element = Element>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector)
}

export function create<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: {
    className?: string
    textContent?: string
    innerHTML?: string
    attributes?: Record<string, string>
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  
  if (options?.className) {
    element.className = options.className
  }
  
  if (options?.textContent) {
    element.textContent = options.textContent
  }
  
  if (options?.innerHTML) {
    element.innerHTML = options.innerHTML
  }
  
  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
  }
  
  return element
}

// Date utilities
export function nowISO(): string {
  return new Date().toISOString()
}

export function formatDate(dateStr: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const date = new Date(dateStr)
  const now = new Date()
  
  if (format === 'relative') {
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }
  
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Markdown rendering with caching
const renderCache = new Map<string, string>()
const MAX_CACHE_SIZE = 1000

export function renderMarkdown(content: string, options?: { 
  enableWikilinks?: boolean
  enableTags?: boolean
  sanitize?: boolean
}): string {
  const opts = {
    enableWikilinks: true,
    enableTags: true,
    sanitize: true,
    ...options
  }
  
  const cacheKey = `${content}:${JSON.stringify(opts)}`
  
  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!
  }
  
  // Clear cache if it gets too large
  if (renderCache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(renderCache.keys())
    keys.slice(0, Math.floor(MAX_CACHE_SIZE / 2)).forEach(key => {
      renderCache.delete(key)
    })
  }
  
  let html = marked.parse(content) as string
  
  if (opts.enableWikilinks) {
    // Handle wikilinks [[Title]] and [[ID:xxxx]]
    html = html.replace(
      /\[\[([^\]]+)\]\]/g,
      (match, link) => {
        const isId = link.startsWith('ID:')
        const linkText = isId ? link.slice(3) : link
        const className = 'wikilink'
        return `<a href="#" class="${className}" data-link="${linkText}">${link}</a>`
      }
    )
  }
  
  if (opts.enableTags) {
    // Handle hashtags
    html = html.replace(
      /#([a-z0-9_\-]+)/gi,
      '<span class="tag" data-tag="$1">#$1</span>'
    )
  }
  
  if (opts.sanitize) {
    html = DOMPurify.sanitize(html)
  }
  
  renderCache.set(cacheKey, html)
  return html
}

// Text processing utilities
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0)
}

export function extractTags(text: string): string[] {
  const matches = text.match(/#[a-z0-9_\-]+/gi) || []
  return [...new Set(matches.map(tag => tag.toLowerCase()))]
}

export function extractWikilinks(text: string): string[] {
  const matches = text.match(/\[\[([^\]]+)\]\]/g) || []
  return matches.map(match => match.slice(2, -2))
}

export function wordCount(text: string): number {
  return tokenize(text).length
}

export function readingTime(text: string, wpm = 200): number {
  return Math.ceil(wordCount(text) / wpm)
}

// Note utilities
export function createNote(options: CreateNoteOptions = {}): Note {
  const now = nowISO()
  
  return {
    id: ulid(),
    title: options.title || 'Untitled',
    body: options.body || '',
    tags: options.tags || [],
    links: [],
    color: options.color || '#6B7280',
    createdAt: now,
    updatedAt: now,
    version: 1
  }
}

export function computeLinks(note: Note, allNotes: Note[]): void {
  const wikilinks = extractWikilinks(note.body)
  const linkedIds: string[] = []
  
  for (const link of wikilinks) {
    // Check if it's an ID link
    if (link.startsWith('ID:')) {
      const id = link.slice(3)
      if (allNotes.some(n => n.id === id)) {
        linkedIds.push(id)
      }
    } else {
      // Find by title
      const targetNote = allNotes.find(n => 
        n.title.toLowerCase() === link.toLowerCase()
      )
      if (targetNote) {
        linkedIds.push(targetNote.id)
      }
    }
  }
  
  note.links = [...new Set(linkedIds)]
}

export function computeBacklinks(noteId: string, allNotes: Note[]): string[] {
  return allNotes
    .filter(note => note.links.includes(noteId))
    .map(note => note.id)
}

// Color utilities
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  
  let h: number
  let s: number
  
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }
    
    h /= 6
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c/2
  
  let r = 0
  let g = 0
  let b = 0
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }
  
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function isValidColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// File utilities
export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = create('a', {
    attributes: {
      href: url,
      download: filename
    }
  })
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

// Performance utilities
export function measureTime<T>(fn: () => T, label?: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  if (label) {
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
  }
  
  return result
}

export async function measureTimeAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  if (label) {
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
  }
  
  return result
}

// Error handling utilities
export function createError(message: string, code?: string, cause?: Error): Error {
  const error = new Error(message)
  if (code) {
    ;(error as any).code = code
  }
  if (cause) {
    ;(error as any).cause = cause
  }
  return error
}

export function isError(value: unknown): value is Error {
  return value instanceof Error
}

// Local storage utilities
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
  }
}

// Environment utilities
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Toast notification utility
export function toast(
  message: string, 
  type: 'success' | 'error' | 'warning' | 'info' = 'success'
): void {
  const toast = create('div', {
    className: `toast animate-toast-in ${type === 'error' ? 'toast-destructive' : ''}`,
    textContent: message
  })
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.classList.remove('animate-toast-in')
    toast.classList.add('animate-toast-out')
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}
