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
// Performance optimized live markdown rendering with enhanced tag highlighting
const markdownCache = new Map();
const renderMD = (md) => {
  if (!md) return '';
  
  // Check cache first
  const cacheKey = md;
  if (markdownCache.has(cacheKey)) {
    return markdownCache.get(cacheKey);
  }
  
  // Enhanced tag color mapping
  const tagColors = {
    'content': '#3B82F6', 'method': '#10B981', 'project': '#F59E0B', 'meta': '#8B5CF6',
    'domain': '#EF4444', 'status': '#6B7280', 'priority': '#DC2626', 'source': '#059669',
    'important': '#DC2626', 'urgent': '#F97316', 'todo': '#8B5CF6', 'done': '#10B981',
    'note': '#6B7280', 'idea': '#06B6D4', 'question': '#F59E0B', 'research': '#3B82F6'
  };
  
  // Function to get tag color based on content
  const getTagColor = (tag) => {
    const cleanTag = tag.toLowerCase().replace('#', '');
    
    // Check for exact matches first
    if (tagColors[cleanTag]) return tagColors[cleanTag];
    
    // Check for partial matches or categories
    for (const [key, color] of Object.entries(tagColors)) {
      if (cleanTag.includes(key) || key.includes(cleanTag)) {
        return color;
      }
    }
    
    // Generate consistent color based on tag name
    let hash = 0;
    for (let i = 0; i < cleanTag.length; i++) {
      hash = cleanTag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#6ee7ff', '#9a7cff', '#00d18f', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
    return colors[Math.abs(hash) % colors.length];
  };
  
  let html = DOMPurify.sanitize(marked.parse(md));
  
  // Enhanced wikilink rendering with better styling
  html = html.replace(/\[\[([^\]]+)\]\]/g, (m, p1) => {
    const t = p1.trim();
    const isIdLink = t.toLowerCase().startsWith('id:');
    const linkClass = isIdLink ? 'link id-link' : 'link title-link';
    return `<a class="${linkClass}" data-wikilink="${encodeURIComponent(t)}" title="Open: ${t}">[[${t}]]</a>`;
  });
  
  // Enhanced tag rendering with dynamic colors and better styling
  html = html.replace(/(^|\s)#([a-z0-9_\-]+)/gi, (match, prefix, tag) => {
    const color = getTagColor(tag);
    const isDarkColor = ['#DC2626', '#EF4444', '#8B5CF6', '#6B7280'].includes(color);
    const textColor = isDarkColor ? '#ffffff' : '#000000';
    
    return `${prefix}<span class="tag enhanced-tag" style="
      background: ${color}20;
      border: 1px solid ${color};
      border-radius: 12px;
      padding: 3px 8px;
      color: ${color};
      font-weight: 500;
      font-size: 12px;
      text-shadow: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      cursor: pointer;
    " data-tag="${tag}" onclick="UI.filterTag('#${tag}')" title="Filter by #${tag}">#${tag}</span>`;
  });
  
  // Handle custom highlight classes
  html = html.replace(/<span class="highlight-([a-z]+)-text">([^<]*)<\/span>/g, '<span class="highlight-$1-text">$2</span>');
  
  // Enhance code blocks
  html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
    return `<pre class="code-block"><code${attrs}>${code}</code></pre>`;
  });
  
  // Enhance inline code
  html = html.replace(/<code>([^<]+)<\/code>/g, '<code class="inline-code">$1</code>');
  
  // Cache result (limit cache size to prevent memory leaks)
  if (markdownCache.size > 1000) {
    const firstKey = markdownCache.keys().next().value;
    markdownCache.delete(firstKey);
  }
  markdownCache.set(cacheKey, html);
  
  return html;
};

// Live preview update function with debouncing
const livePreviewDebounced = debounce((content, previewElement) => {
  if (!previewElement) return;
  
  try {
    const rendered = renderMD(content);
    previewElement.innerHTML = rendered;
    
    // Add click handlers for enhanced tags
    previewElement.querySelectorAll('.enhanced-tag').forEach(tag => {
      // Remove existing event listeners to prevent duplicates
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
    });
    
    // Ensure wikilink clicks are handled
    previewElement.querySelectorAll('a.link').forEach(link => {
      // Remove existing event listeners to prevent duplicates
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      newLink.addEventListener('click', (e) => {
        e.preventDefault();
        const token = decodeURIComponent(newLink.dataset.wikilink);
        if (typeof UI !== 'undefined' && UI.followWiki) {
          UI.followWiki(token);
        }
      });
    });
    
  } catch (error) {
    console.error('Error rendering markdown preview:', error);
    previewElement.innerHTML = `<div class="error-preview">Error rendering preview: ${error.message}</div>`;
  }
}, 50); // Very fast debounce for live feeling

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
