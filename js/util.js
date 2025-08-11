/* util.js — ids, time, parsing */
const ULID = () => {
  // compact ulid-ish
  const t = Date.now().toString(36);
  const r = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b=>b.toString(36).padStart(2,'0')).join('');
  return (t+r).slice(0, 16);
};
const nowISO = () => new Date().toISOString();
const debounce = (fn, ms=300)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms)}};
const el = (sel,root=document)=>root.querySelector(sel);
const els = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
const toast = (msg)=>{const t=el('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1200);}
const tokenize = (s)=> (s||'').toLowerCase().match(/[a-z0-9#_]+/g)||[];
const uniq = (a)=>Array.from(new Set(a));
const parseTags = (s)=> uniq((s||'').split(/[, ]+/).map(t=>t.trim()).filter(Boolean).map(t=> t.startsWith('#')?t.toLowerCase():'#'+t.toLowerCase()));
const extractWikiLinks = (md)=> {
  const links=[...md.matchAll(/\[\[([^\]]+)\]\]/g)].map(m=>m[1].trim());
  // returns array like ["Note Title", "ID:xxxx"]
  return links;
};
// Performance optimized markdown rendering with caching
const markdownCache = new Map();
const renderMD = (md) => {
  if (!md) return '';
  
  // Check cache first
  const cacheKey = md;
  if (markdownCache.has(cacheKey)) {
    return markdownCache.get(cacheKey);
  }
  
  const html = DOMPurify.sanitize(marked.parse(md));
  const result = html
    .replace(/\[\[([^\]]+)\]\]/g, (m, p1)=>{
      const t = p1.trim();
      return `<a class="link" data-wikilink="${encodeURIComponent(t)}">[[${t}]]</a>`;
    })
    .replace(/(^|\s)#([a-z0-9_\-]+)/gi, '$1<span class="tag">#$2</span>')
    // Handle custom highlight classes
    .replace(/<span class="highlight-([a-z]+)-text">([^<]*)<\/span>/g, '<span class="highlight-$1-text">$2</span>');
  
  // Cache result (limit cache size to prevent memory leaks)
  if (markdownCache.size > 1000) {
    const firstKey = markdownCache.keys().next().value;
    markdownCache.delete(firstKey);
  }
  markdownCache.set(cacheKey, result);
  
  return result;
};

// Performance utilities
const memoize = (fn, maxSize = 100) => {
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

const throttle = (fn, delay) => {
  let lastExecution = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      return fn.apply(this, args);
    }
  };
};

// Optimized DOM utilities
const fastEl = (selector, root = document) => {
  // Use faster getElementById when possible
  if (selector.startsWith('#') && !selector.includes(' ')) {
    return document.getElementById(selector.slice(1));
  }
  return root.querySelector(selector);
};

// Batch DOM operations
const batchDOM = (operations) => {
  const fragment = document.createDocumentFragment();
  operations.forEach(op => op(fragment));
  return fragment;
};
