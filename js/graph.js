/* graph.js — D3 force graph + tiny mind map - Performance Optimized */
const Graph = {
  // Add rendering options for performance
  renderOptions: {
    maxNodes: 1000,
    maxLinks: 2000,
    enableLabels: true,
    enableAnimation: true,
    clusterThreshold: 100
  },
  
  render(container, notes, options = {}){
    const startTime = performance.now();
    container.innerHTML='';
    const w = container.clientWidth||320, h = container.clientHeight||240;
    const ids = new Set(notes.map(n=>n.id));
    
    // Performance optimization: limit nodes if dataset is too large
    const opts = {...this.renderOptions, ...options};
    let processedNotes = notes;
    
    if (notes.length > opts.maxNodes) {
      console.warn(`Large dataset detected (${notes.length} notes). Limiting to ${opts.maxNodes} most connected nodes.`);
      // Show most connected notes first
      processedNotes = notes
        .sort((a, b) => (b.links?.length || 0) - (a.links?.length || 0))
        .slice(0, opts.maxNodes);
    }
    
    // Optimized relationship strength calculation using processed notes
    const processedIds = new Set(processedNotes.map(n=>n.id));
    const linkStrength = new Map();
    
    processedNotes.forEach(note => {
      (note.links || []).forEach(targetId => {
        if (processedIds.has(targetId)) {
          const key = [note.id, targetId].sort().join('-');
          linkStrength.set(key, (linkStrength.get(key) || 0) + 1);
        }
      });
    });
    
    // Optimized node creation with degree calculation
    const degreeMap = new Map();
    processedNotes.forEach(n => {
      degreeMap.set(n.id, (n.links || []).filter(id => processedIds.has(id)).length);
    });
    
    const nodes = processedNotes.map(n=>({
      id: n.id, 
      label: (n.title && n.title.length > 20) ? n.title.substring(0, 17) + '...' : (n.title || n.id), 
      deg: degreeMap.get(n.id) || 0,
      tags: n.tags || [],
      // Add node properties for better visualization
      group: this.getNodeGroup(n),
      size: Math.max(3, Math.min(12, (degreeMap.get(n.id) || 0) + 3)),
      importance: this.calculateNodeImportance(n, processedNotes)
    }));
    
    // Optimized link creation with limit
    const links = [];
    const linkSet = new Set(); // Prevent duplicate links
    
    for(const n of processedNotes) {
      if (links.length >= opts.maxLinks) break;
      
      for(const t of (n.links||[])) {
        if(processedIds.has(t)) {
          const linkId = [n.id, t].sort().join('-');
          if (!linkSet.has(linkId)) {
            linkSet.add(linkId);
            const strength = linkStrength.get(linkId) || 1;
            links.push({
              source: n.id, 
              target: t, 
              strength: strength,
              type: this.getRelationshipType(n, processedNotes.find(note => note.id === t)),
              value: strength // For D3 force simulation
            });
          }
        }
      }
    }
    
    const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id).distance(d => 80 - (d.strength * 10)).strength(.4))
      .force('charge', d3.forceManyBody().strength(-140))
      .force('center', d3.forceCenter(w/2, h/2))
      .force('collision', d3.forceCollide().radius(d => Math.max(8, Math.min(20, 6+d.deg))));
    
    // Create links with proper styling
    const allLinks = svg.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => this.getLinkColor(d.type))
      .attr('stroke-width', d => Math.min(4, Math.max(1, d.strength)))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', d => this.getLinkDashArray(d.type));
    
    const gnode = svg.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', d=>Math.max(4, Math.min(14, 4+d.deg)))
      .attr('fill', d => this.getNodeColor(d))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.8)
      .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
      .on('click',(e,d)=>UI.openNote(d.id))
      .on('mouseover', function(e, d) {
        // Highlight connected nodes
        d3.select(this).attr('stroke-width', 3);
      })
      .on('mouseout', function(e, d) {
        d3.select(this).attr('stroke-width', 1);
      });
    
    const labels = svg.append('g').selectAll('text').data(nodes).join('text')
      .text(d=>d.label.slice(0,20))
      .attr('font-size','10px')
      .attr('fill','#a8b3ce')
      .attr('text-anchor', 'middle')
      .attr('dy', -15);
    
    sim.on('tick', ()=>{
      allLinks
        .attr('x1',d=>d.source.x)
        .attr('y1',d=>d.source.y)
        .attr('x2',d=>d.target.x)
        .attr('y2',d=>d.target.y);
      
      gnode
        .attr('cx',d=>d.x)
        .attr('cy',d=>d.y);
      
      labels
        .attr('x',d=>d.x)
        .attr('y',d=>d.y);
    });
    
    function dragstarted(e){ 
      if(!e.active) sim.alphaTarget(0.3).restart(); 
      e.subject.fx=e.subject.x; 
      e.subject.fy=e.subject.y;
    }
    
    function dragged(e){ 
      e.subject.fx=e.x; 
      e.subject.fy=e.y;
    }
    
    function dragended(e){ 
      if(!e.active) sim.alphaTarget(0); 
      e.subject.fx=null; 
      e.subject.fy=null;
    }
  },
  
  // Determine relationship type between two notes
  getRelationshipType(sourceNote, targetNote) {
    if (!sourceNote || !targetNote) return 'weak';
    
    // Strong relationship: shared tags
    const sourceTags = new Set(sourceNote.tags || []);
    const targetTags = new Set(targetNote.tags || []);
    const sharedTags = [...sourceTags].filter(tag => targetTags.has(tag));
    
    if (sharedTags.length >= 2) return 'strong';
    if (sharedTags.length >= 1) return 'medium';
    
    // Tag-based relationship: one note has a tag that references the other
    const sourceTitle = (sourceNote.title || '').toLowerCase();
    const targetTitle = (targetNote.title || '').toLowerCase();
    
    for (const tag of sourceTags) {
      if (targetTitle.includes(tag.replace('#', ''))) return 'tag-based';
    }
    
    for (const tag of targetTags) {
      if (sourceTitle.includes(tag.replace('#', ''))) return 'tag-based';
    }
    
    return 'weak';
  },
  
  // Calculate node group for clustering
  getNodeGroup(note) {
    const tags = note.tags || [];
    if (tags.some(tag => tag.includes('project'))) return 'project';
    if (tags.some(tag => tag.includes('research'))) return 'research';
    if (tags.some(tag => tag.includes('meeting'))) return 'meeting';
    if (tags.some(tag => tag.includes('idea'))) return 'idea';
    return 'general';
  },
  
  // Calculate node importance for better visualization
  calculateNodeImportance(note, allNotes) {
    const linkCount = (note.links || []).length;
    const backlinkCount = allNotes.filter(n => (n.links || []).includes(note.id)).length;
    const tagCount = (note.tags || []).length;
    const bodyLength = (note.body || '').length;
    
    // Weighted importance score
    return (linkCount * 2) + (backlinkCount * 3) + tagCount + Math.min(bodyLength / 1000, 5);
  },
  
  // Get color for link based on relationship type
  getLinkColor(type) {
    const colors = {
      'strong': '#6ee7ff',
      'medium': '#9a7cff',
      'weak': '#8b93a5',
      'tag-based': '#ffd166'
    };
    return colors[type] || '#8b93a5';
  },
  
  // Get dash array for link based on relationship type
  getLinkDashArray(type) {
    const dashArrays = {
      'strong': 'none',
      'medium': '5,5',
      'weak': '2,8',
      'tag-based': '10,3,2,3'
    };
    return dashArrays[type] || 'none';
  },
  
  // Get color for node based on properties
  getNodeColor(node) {
    // Color based on number of connections
    if (node.deg >= 5) return '#ef476f'; // Highly connected - red
    if (node.deg >= 3) return '#6ee7ff'; // Well connected - blue
    if (node.deg >= 1) return '#00d18f'; // Connected - green
    return '#8b93a5'; // Isolated - gray
  }
};
