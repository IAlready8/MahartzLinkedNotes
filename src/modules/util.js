// Enhanced utility functions for Mahart Linked Notes
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// ID generation and time utilities
export const ULID = () => {
  const t = Date.now().toString(36);
  const r = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(36).padStart(2, '0')).join('');
  return (t + r).slice(0, 16);
};

export const nowISO = () => new Date().toISOString();

// Functional utilities
export const debounce = (fn, ms = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

export const throttle = (fn, delay) => {
  let lastExecution = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      return fn.apply(this, args);
    }
  };
};

export const memoize = (fn, maxSize = 100) => {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    
    const result = fn.apply(this, args);
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, result);
    return result;
  };
};

// DOM utilities
export const el = (selector, root = document) => {
  // Optimize for ID selectors
  if (selector.startsWith('#') && !selector.includes(' ')) {
    return document.getElementById(selector.slice(1));
  }
  return root.querySelector(selector);
};

export const els = (selector, root = document) => 
  Array.from(root.querySelectorAll(selector));

export const fastEl = el; // Alias for consistency

export const batchDOM = (operations) => {
  const fragment = document.createDocumentFragment();
  operations.forEach(op => op(fragment));
  return fragment;
};

// String and array utilities
export const uniq = (arr) => Array.from(new Set(arr));

export const tokenize = (str) => 
  (str || '').toLowerCase().match(/[a-z0-9#_]+/g) || [];

export const parseTags = (str) => 
  uniq((str || '').split(/[, ]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.startsWith('#') ? t.toLowerCase() : '#' + t.toLowerCase())
  );

export const extractWikiLinks = (markdown) => {
  const links = [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)]
    .map(match => match[1].trim());
  return links;
};

// Toast notifications
export const toast = (message, type = 'info', duration = 3000) => {
  const toastEl = el('#toast');
  if (!toastEl) return;
  
  toastEl.textContent = message;
  toastEl.className = `toast toast-${type}`;
  toastEl.style.transform = 'translateY(0)';
  toastEl.style.opacity = '1';
  
  setTimeout(() => {
    toastEl.style.transform = 'translateY(20px)';
    toastEl.style.opacity = '0';
  }, duration);
};

// Enhanced markdown rendering with caching
const markdownCache = new Map();
const MAX_CACHE_SIZE = 500;

const tagColors = {
  'content': '#3B82F6', 'method': '#10B981', 'project': '#F59E0B', 'meta': '#8B5CF6',
  'domain': '#EF4444', 'status': '#6B7280', 'priority': '#DC2626', 'source': '#059669',
  'important': '#DC2626', 'urgent': '#F97316', 'todo': '#8B5CF6', 'done': '#10B981',
  'note': '#6B7280', 'idea': '#06B6D4', 'question': '#F59E0B', 'research': '#3B82F6'
};

const getTagColor = (tag) => {
  const cleanTag = tag.toLowerCase().replace('#', '');
  
  // Exact match
  if (tagColors[cleanTag]) return tagColors[cleanTag];
  
  // Partial match
  for (const [key, color] of Object.entries(tagColors)) {
    if (cleanTag.includes(key) || key.includes(cleanTag)) {
      return color;
    }
  }
  
  // Generate consistent color
  let hash = 0;
  for (let i = 0; i < cleanTag.length; i++) {
    hash = cleanTag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6ee7ff', '#9a7cff', '#00d18f', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
  return colors[Math.abs(hash) % colors.length];
};

export const renderMD = (markdown) => {
  if (!markdown) return '';
  
  // Check cache
  if (markdownCache.has(markdown)) {
    return markdownCache.get(markdown);
  }
  
  let html = DOMPurify.sanitize(marked.parse(markdown));
  
  // Enhanced wikilink rendering
  html = html.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const trimmed = content.trim();
    const isIdLink = trimmed.toLowerCase().startsWith('id:');
    const linkClass = isIdLink ? 'link id-link' : 'link title-link';
    const displayText = isIdLink ? trimmed.substring(3) : trimmed;
    return `<a class="${linkClass}" data-wikilink="${encodeURIComponent(trimmed)}" title="Open: ${trimmed}">${displayText}</a>`;
  });

  //
  
  // Enhanced tag rendering
  html = html.replace(/(^|\s)#([a-z0-9_\-]+)/gi, (match, prefix, tag) => {
    const color = getTagColor(tag);
    return `${prefix}<span class="tag enhanced-tag" style="
      background: ${color}20;
      border: 1px solid ${color};
      border-radius: 12px;
      padding: 3px 8px;
      color: ${color};
      font-weight: 500;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    " data-tag="${tag}" title="Filter by #${tag}">#${tag}</span>`;
  });
  
  // Enhance code blocks
  html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, 
    '<pre class="code-block"><code$1>$2</code></pre>');
  
  html = html.replace(/<code>([^<]+)<\/code>/g, 
    '<code class="inline-code">$1</code>');
  
  // Cache management
  if (markdownCache.size >= MAX_CACHE_SIZE) {
    const firstKey = markdownCache.keys().next().value;
    markdownCache.delete(firstKey);
  }
  markdownCache.set(markdown, html);
  
  return html;
};

// Live preview with enhanced interactivity
export const livePreviewDebounced = debounce((content, previewElement) => {
  if (!previewElement) return;
  
  try {
    const rendered = renderMD(content);
    previewElement.innerHTML = rendered;
    
    // Add interactive behaviors
    addTagInteractivity(previewElement);
    addWikilinkHandlers(previewElement);
    
  } catch (error) {
    console.error('Error rendering markdown preview:', error);
    previewElement.innerHTML = `
      <div class="error-preview bg-red-50 border border-red-200 rounded p-4 text-red-800">
        Error rendering preview: ${error.message}
      </div>
    `;
  }
}, 50);

function addTagInteractivity(container) {
  container.querySelectorAll('.enhanced-tag').forEach(tag => {
    const newTag = tag.cloneNode(true);
    tag.parentNode.replaceChild(newTag, tag);
    
    newTag.addEventListener('mouseenter', (e) => {
      e.target.style.transform = 'translateY(-1px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    
    newTag.addEventListener('mouseleave', (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });
    
    newTag.addEventListener('click', (e) => {
      e.preventDefault();
      const tagName = e.target.dataset.tag;
      if (window.UI && window.UI.filterTag) {
        window.UI.filterTag('#' + tagName);
      }
    });
  });
}

function addWikilinkHandlers(container) {
  container.querySelectorAll('a.link').forEach(link => {
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      const token = decodeURIComponent(newLink.dataset.wikilink);
      if (window.UI && window.UI.followWiki) {
        window.UI.followWiki(token);
      }
    });
  });
}

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.marks = new Map();
    this.measures = [];
  }
  
  mark(label) {
    const timestamp = performance.now();
    this.marks.set(label, timestamp);
    performance.mark(`${this.name}-${label}`);
  }
  
  measure(name, startMark, endMark) {
    if (this.marks.has(startMark) && this.marks.has(endMark)) {
      const duration = this.marks.get(endMark) - this.marks.get(startMark);
      this.measures.push({ name, duration, timestamp: Date.now() });
      performance.measure(`${this.name}-${name}`, `${this.name}-${startMark}`, `${this.name}-${endMark}`);
      return duration;
    }
    return 0;
  }
  
  getStats() {
    return {
      name: this.name,
      measures: this.measures.slice(-10), // Last 10 measures
      totalMeasures: this.measures.length
    };
  }
  
  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

// Async utilities
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * attempt);
    }
  }
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => 
  "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

export const getContrastColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return '#000000';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 125 ? '#000000' : '#ffffff';
};

// Initialize utilities
export const initUtils = () => {
  console.log('Utilities initialized');
  
  // Clear old cache entries periodically
  setInterval(() => {
    if (markdownCache.size > MAX_CACHE_SIZE * 0.8) {
      const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
      const keys = Array.from(markdownCache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => markdownCache.delete(key));
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};
