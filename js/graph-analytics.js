/* graph-analytics.js — Advanced graph analytics and visualization */

const GraphAnalytics = {
  // Calculate various graph metrics
  async calculateMetrics(notes) {
    const metrics = {
      totalNodes: notes.length,
      totalEdges: 0,
      density: 0,
      clusteringCoefficient: 0,
      centrality: {},
      communities: [],
      bridges: [],
      hubs: [],
      authorities: []
    };
    
    // Calculate basic metrics
    const adjacencyList = new Map();
    const degrees = new Map();
    
    // Build adjacency list and calculate degrees
    notes.forEach(note => {
      const links = note.links || [];
      adjacencyList.set(note.id, new Set(links));
      degrees.set(note.id, links.length);
      metrics.totalEdges += links.length;
    });
    
    // Graph density
    const maxEdges = notes.length * (notes.length - 1);
    metrics.density = maxEdges > 0 ? metrics.totalEdges / maxEdges : 0;
    
    // Clustering coefficient (transitivity)
    metrics.clusteringCoefficient = this.calculateClusteringCoefficient(adjacencyList);
    
    // Centrality measures
    metrics.centrality = this.calculateCentrality(adjacencyList, notes);
    
    // Community detection
    metrics.communities = this.detectCommunities(adjacencyList, notes);
    
    // Bridge detection
    metrics.bridges = this.findBridges(adjacencyList);
    
    // Hubs and authorities
    const { hubs, authorities } = this.calculateHubsAndAuthorities(adjacencyList, notes);
    metrics.hubs = hubs;
    metrics.authorities = authorities;
    
    return metrics;
  },
  
  calculateClusteringCoefficient(adjacencyList) {
    let totalClustering = 0;
    let nodeCount = 0;
    
    for (const [node, neighbors] of adjacencyList.entries()) {
      if (neighbors.size < 2) continue;
      
      // Count triangles
      let triangles = 0;
      const neighborArray = Array.from(neighbors);
      
      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const neighbor1 = neighborArray[i];
          const neighbor2 = neighborArray[j];
          
          // Check if neighbors are connected
          if (adjacencyList.has(neighbor1) && 
              adjacencyList.get(neighbor1).has(neighbor2)) {
            triangles++;
          }
        }
      }
      
      // Clustering coefficient for this node
      const possibleTriangles = (neighbors.size * (neighbors.size - 1)) / 2;
      const clustering = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
      
      totalClustering += clustering;
      nodeCount++;
    }
    
    return nodeCount > 0 ? totalClustering / nodeCount : 0;
  },
  
  calculateCentrality(adjacencyList, notes) {
    const centrality = {};
    
    // Degree centrality
    for (const [node, neighbors] of adjacencyList.entries()) {
      centrality[node] = {
        degree: neighbors.size,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0
      };
    }
    
    // Betweenness centrality (simplified approximation)
    for (const note of notes) {
      const paths = this.findAllPaths(adjacencyList, note.id, notes);
      centrality[note.id].betweenness = this.calculateBetweenness(note.id, paths);
    }
    
    // Closeness centrality
    for (const note of notes) {
      const distances = this.calculateDistances(adjacencyList, note.id);
      const sumDistances = Array.from(distances.values()).reduce((sum, d) => sum + d, 0);
      centrality[note.id].closeness = sumDistances > 0 ? (notes.length - 1) / sumDistances : 0;
    }
    
    return centrality;
  },
  
  findAllPaths(adjacencyList, startNode, notes) {
    const paths = new Map();
    const queue = [[startNode, [startNode]]];
    const visited = new Set();
    
    while (queue.length > 0) {
      const [current, path] = queue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      paths.set(current, path);
      
      const neighbors = adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    
    return paths;
  },
  
  calculateBetweenness(nodeId, paths) {
    // Simplified betweenness calculation
    let betweenness = 0;
    
    for (const [target, path] of paths.entries()) {
      if (path.includes(nodeId) && path[0] !== nodeId && target !== nodeId) {
        betweenness += 1;
      }
    }
    
    return betweenness;
  },
  
  calculateDistances(adjacencyList, startNode) {
    const distances = new Map();
    const queue = [[startNode, 0]];
    const visited = new Set();
    
    while (queue.length > 0) {
      const [current, distance] = queue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      distances.set(current, distance);
      
      const neighbors = adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, distance + 1]);
        }
      }
    }
    
    return distances;
  },
  
  detectCommunities(adjacencyList, notes) {
    // Simple community detection using modularity optimization
    const communities = [];
    const nodeCommunity = new Map();
    
    // Initialize each node in its own community
    notes.forEach(note => {
      const communityId = `comm_${note.id}`;
      nodeCommunity.set(note.id, communityId);
      communities.push({
        id: communityId,
        nodes: [note.id],
        size: 1
      });
    });
    
    // Merge communities based on connectivity
    let changed = true;
    while (changed) {
      changed = false;
      
      for (const note of notes) {
        const currentCommunity = nodeCommunity.get(note.id);
        const neighbors = adjacencyList.get(note.id) || new Set();
        
        // Count connections to each community
        const communityConnections = new Map();
        for (const neighbor of neighbors) {
          const neighborCommunity = nodeCommunity.get(neighbor);
          communityConnections.set(
            neighborCommunity, 
            (communityConnections.get(neighborCommunity) || 0) + 1
          );
        }
        
        // Find community with most connections
        let bestCommunity = currentCommunity;
        let maxConnections = communityConnections.get(currentCommunity) || 0;
        
        for (const [community, connections] of communityConnections.entries()) {
          if (connections > maxConnections) {
            bestCommunity = community;
            maxConnections = connections;
          }
        }
        
        if (bestCommunity !== currentCommunity) {
          nodeCommunity.set(note.id, bestCommunity);
          changed = true;
        }
      }
    }
    
    // Consolidate communities
    const consolidated = new Map();
    for (const [node, community] of nodeCommunity.entries()) {
      if (!consolidated.has(community)) {
        consolidated.set(community, []);
      }
      consolidated.get(community).push(node);
    }
    
    return Array.from(consolidated.entries()).map(([id, nodes]) => ({
      id,
      nodes,
      size: nodes.length
    })).filter(comm => comm.size > 1); // Only return communities with more than 1 node
  },
  
  findBridges(adjacencyList) {
    // Find articulation points (bridges) using DFS
    const bridges = [];
    const visited = new Set();
    const discovery = new Map();
    const low = new Map();
    const parent = new Map();
    let time = 0;
    
    const dfs = (node) => {
      visited.add(node);
      discovery.set(node, time);
      low.set(node, time);
      time++;
      
      let children = 0;
      const neighbors = adjacencyList.get(node) || new Set();
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          children++;
          parent.set(neighbor, node);
          dfs(neighbor);
          
          low.set(node, Math.min(low.get(node), low.get(neighbor)));
          
          // Check if neighbor is a bridge
          if (low.get(neighbor) > discovery.get(node)) {
            bridges.push({
              from: node,
              to: neighbor,
              type: 'bridge'
            });
          }
        } else if (neighbor !== parent.get(node)) {
          low.set(node, Math.min(low.get(node), discovery.get(neighbor)));
        }
      }
    };
    
    // Start DFS from all unvisited nodes
    for (const node of adjacencyList.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
    
    return bridges;
  },
  
  calculateHubsAndAuthorities(adjacencyList, notes) {
    // Simple hub and authority calculation
    const hubs = [];
    const authorities = [];
    
    // Hubs have many outgoing links
    notes.forEach(note => {
      const outDegree = (note.links || []).length;
      if (outDegree > 3) { // Threshold for hubs
        hubs.push({
          id: note.id,
          title: note.title,
          degree: outDegree,
          score: outDegree
        });
      }
    });
    
    // Authorities are linked to by many hubs
    const inDegrees = new Map();
    notes.forEach(note => {
      (note.links || []).forEach(targetId => {
        inDegrees.set(targetId, (inDegrees.get(targetId) || 0) + 1);
      });
    });
    
    notes.forEach(note => {
      const inDegree = inDegrees.get(note.id) || 0;
      if (inDegree > 2) { // Threshold for authorities
        authorities.push({
          id: note.id,
          title: note.title,
          degree: inDegree,
          score: inDegree
        });
      }
    });
    
    // Sort by score
    hubs.sort((a, b) => b.score - a.score);
    authorities.sort((a, b) => b.score - a.score);
    
    return { hubs: hubs.slice(0, 10), authorities: authorities.slice(0, 10) };
  },
  
  // Generate insights from graph metrics
  generateInsights(metrics, notes) {
    const insights = [];
    
    // Network density insight
    if (metrics.density < 0.1) {
      insights.push({
        type: 'warning',
        title: 'Sparse Network',
        message: 'Your knowledge graph is relatively sparse. Try creating more connections between notes.',
        priority: 'medium'
      });
    } else if (metrics.density > 0.5) {
      insights.push({
        type: 'info',
        title: 'Dense Network',
        message: 'Your knowledge graph is well-connected. This promotes better knowledge discovery.',
        priority: 'low'
      });
    }
    
    // Clustering insight
    if (metrics.clusteringCoefficient > 0.6) {
      insights.push({
        type: 'info',
        title: 'High Clustering',
        message: 'Your notes form tight clusters, indicating strong thematic grouping.',
        priority: 'low'
      });
    }
    
    // Hub insights
    if (metrics.hubs.length > 0) {
      const topHub = metrics.hubs[0];
      insights.push({
        type: 'success',
        title: 'Knowledge Hub Identified',
        message: `"${topHub.title}" is a major hub with ${topHub.degree} connections. It's central to your knowledge network.`,
        priority: 'high'
      });
    }
    
    // Community insights
    if (metrics.communities.length > 0) {
      const largestCommunity = metrics.communities.reduce((max, comm) => 
        comm.size > max.size ? comm : max, { size: 0 });
      
      insights.push({
        type: 'info',
        title: 'Thematic Clusters',
        message: `Your knowledge base contains ${metrics.communities.length} distinct clusters. The largest has ${largestCommunity.size} notes.`,
        priority: 'medium'
      });
    }
    
    // Authority insights
    if (metrics.authorities.length > 0) {
      const topAuthority = metrics.authorities[0];
      insights.push({
        type: 'success',
        title: 'Key Authority',
        message: `"${topAuthority.title}" is referenced by many other notes, making it an important knowledge authority.`,
        priority: 'high'
      });
    }
    
    // Bridge insights
    if (metrics.bridges.length > 0) {
      const bridgeCount = metrics.bridges.length;
      insights.push({
        type: 'warning',
        title: 'Critical Connections',
        message: `There are ${bridgeCount} critical connections that, if removed, would fragment your knowledge graph.`,
        priority: 'medium'
      });
    }
    
    return insights;
  },
  
  // Export graph data in various formats
  async exportGraph(notes, format = 'json') {
    switch (format) {
      case 'json':
        return this.exportJSON(notes);
      case 'csv':
        return this.exportCSV(notes);
      case 'gexf':
        return this.exportGEXF(notes);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },
  
  exportJSON(notes) {
    const nodes = notes.map(note => ({
      id: note.id,
      label: note.title,
      tags: note.tags || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));
    
    const edges = [];
    notes.forEach(note => {
      (note.links || []).forEach(targetId => {
        edges.push({
          source: note.id,
          target: targetId,
          type: 'link'
        });
      });
    });
    
    return JSON.stringify({ nodes, edges }, null, 2);
  },
  
  exportCSV(notes) {
    let csv = 'id,title,tags,links,created_at,updated_at\n';
    
    notes.forEach(note => {
      const row = [
        note.id,
        `"${(note.title || '').replace(/"/g, '""')}"`,
        `"${(note.tags || []).join(';').replace(/"/g, '""')}"`,
        `"${(note.links || []).join(';').replace(/"/g, '""')}"`,
        note.createdAt,
        note.updatedAt
      ].join(',');
      
      csv += row + '\n';
    });
    
    return csv;
  },
  
  exportGEXF(notes) {
    let gexf = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gexf += '<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n';
    gexf += '  <graph mode="static" defaultedgetype="directed">\n';
    
    // Nodes
    gexf += '    <nodes>\n';
    notes.forEach(note => {
      gexf += `      <node id="${note.id}" label="${(note.title || note.id).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}">\n`;
      gexf += '        <attvalues>\n';
      gexf += `          <attvalue for="tags" value="${(note.tags || []).join(';').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" />\n`;
      gexf += '        </attvalues>\n';
      gexf += '      </node>\n';
    });
    gexf += '    </nodes>\n';
    
    // Edges
    gexf += '    <edges>\n';
    let edgeId = 0;
    notes.forEach(note => {
      (note.links || []).forEach(targetId => {
        gexf += `      <edge id="${edgeId++}" source="${note.id}" target="${targetId}" />\n`;
      });
    });
    gexf += '    </edges>\n';
    
    gexf += '  </graph>\n';
    gexf += '</gexf>';
    
    return gexf;
  }
};