// 🤖 Review: This file was created by refactoring legacy/advanced-viz.js into an ES6 module.

import { GraphAnalytics } from './graph-analytics.js';
import { Graph } from './graph.js';
import { Chart } from 'chart.js';
import { UI } from './ui.js';

export const AdvancedViz = {
  // Render advanced analytics dashboard
  async renderDashboard(container, notes) {
    container.innerHTML = '';
    
    // Calculate metrics
    const metrics = await GraphAnalytics.calculateMetrics(notes);
    const insights = GraphAnalytics.generateInsights(metrics, notes);
    
    // Create dashboard layout
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h2>Knowledge Graph Analytics</h2>
        <div class="dashboard-controls">
          <button id="refreshDashboard" class="btn">Refresh</button>
          <button id="exportDashboard" class="btn">Export</button>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <!-- Metrics Summary -->
        <div class="dashboard-card">
          <h3>Network Overview</h3>
          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-value">${metrics.totalNodes}</div>
              <div class="metric-label">Notes</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.totalEdges}</div>
              <div class="metric-label">Links</div>
            </div>
            <div class="metric">
              <div class="metric-value">${(metrics.density * 100).toFixed(1)}%</div>
              <div class="metric-label">Density</div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.clusteringCoefficient.toFixed(2)}</div>
              <div class="metric-label">Clustering</div>
            </div>
          </div>
        </div>
        
        <!-- Insights Panel -->
        <div class="dashboard-card">
          <h3>Insights</h3>
          <div id="insightsContainer" class="insights-container"></div>
        </div>
        
        <!-- Top Hubs -->
        <div class="dashboard-card">
          <h3>Top Hubs</h3>
          <div id="hubsContainer" class="list-container"></div>
        </div>
        
        <!-- Top Authorities -->
        <div class="dashboard-card">
          <h3>Key Authorities</h3>
          <div id="authoritiesContainer" class="list-container"></div>
        </div>
        
        <!-- Community Detection -->
        <div class="dashboard-card full-width">
          <h3>Thematic Clusters</h3>
          <div id="communitiesContainer" class="communities-container"></div>
        </div>
        
        <!-- Distribution Charts -->
        <div class="dashboard-card">
          <h3>Link Distribution</h3>
          <canvas id="linkDistChart" height="200"></canvas>
        </div>
        
        <div class="dashboard-card">
          <h3>Tag Distribution</h3>
          <canvas id="tagDistChart" height="200"></canvas>
        </div>
      </div>
    `;
    
    container.appendChild(dashboard);
    
    // Render components
    this.renderInsights(insights);
    this.renderHubs(metrics.hubs);
    this.renderAuthorities(metrics.authorities);
    this.renderCommunities(metrics.communities, notes);
    this.renderLinkDistribution(notes);
    this.renderTagDistribution(notes);
    
    // Bind events
    const refreshBtn = document.getElementById('refreshDashboard');
    const exportBtn = document.getElementById('exportDashboard');
    
    if (refreshBtn) {
      refreshBtn.onclick = () => this.renderDashboard(container, notes);
    }
    
    if (exportBtn) {
      exportBtn.onclick = () => this.exportDashboard(notes);
    }
  },
  
  renderInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    if (insights.length === 0) {
      container.innerHTML = '<div class="no-data">No insights available</div>';
      return;
    }
    
    container.innerHTML = insights.map(insight => `
      <div class="insight-item insight-${insight.type}">
        <div class="insight-header">
          <strong>${insight.title}</strong>
          <span class="insight-priority priority-${insight.priority}">${insight.priority}</span>
        </div>
        <div class="insight-message">${insight.message}</div>
      </div>
    `).join('');
  },
  
  renderHubs(hubs) {
    const container = document.getElementById('hubsContainer');
    if (!container) return;
    
    if (hubs.length === 0) {
      container.innerHTML = '<div class="no-data">No hubs identified</div>';
      return;
    }
    
    container.innerHTML = hubs.slice(0, 5).map(hub => `
      <div class="list-item">
        <div class="item-title">${hub.title}</div>
        <div class="item-meta">${hub.degree} connections</div>
      </div>
    `).join('');
  },
  
  renderAuthorities(authorities) {
    const container = document.getElementById('authoritiesContainer');
    if (!container) return;
    
    if (authorities.length === 0) {
      container.innerHTML = '<div class="no-data">No authorities identified</div>';
      return;
    }
    
    container.innerHTML = authorities.slice(0, 5).map(auth => `
      <div class="list-item">
        <div class="item-title">${auth.title}</div>
        <div class="item-meta">${auth.degree} references</div>
      </div>
    `).join('');
  },
  
  renderCommunities(communities, notes) {
    const container = document.getElementById('communitiesContainer');
    if (!container) return;
    
    if (communities.length === 0) {
      container.innerHTML = '<div class="no-data">No distinct communities found</div>';
      return;
    }
    
    container.innerHTML = communities.map(comm => {
      const sampleNotes = comm.nodes.slice(0, 3).map(nodeId => {
        const note = notes.find(n => n.id === nodeId);
        return note ? note.title : nodeId;
      });
      
      return `
        <div class="community-item">
          <div class="community-header">
            <strong>Cluster ${comm.id.slice(-4)}</strong>
            <span class="badge">${comm.size} notes</span>
          </div>
          <div class="community-notes">
            ${sampleNotes.map(title => `<span class="tag">${title}</span>`).join('')}
            ${comm.nodes.length > 3 ? `<span class="tag">...and ${comm.nodes.length - 3} more</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },
  
  renderLinkDistribution(notes) {
    const canvas = document.getElementById('linkDistChart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate link distribution
    const linkCounts = notes.map(note => (note.links || []).length);
    const maxLinks = Math.max(...linkCounts, 1);
    
    // Create bins
    const binCount = Math.min(10, maxLinks + 1);
    const binSize = Math.max(1, Math.ceil(maxLinks / binCount));
    
    const bins = new Array(binCount).fill(0);
    linkCounts.forEach(count => {
      const binIndex = Math.min(binCount - 1, Math.floor(count / binSize));
      bins[binIndex]++;
    });
    
    const labels = bins.map((_, i) => `${i * binSize}-${(i + 1) * binSize - 1}`);
    
    // Create chart
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Notes',
          data: bins,
          backgroundColor: '#6ee7ff',
          borderColor: '#4f8bf9',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Notes'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Link Count'
            }
          }
        }
      }
    });
  },
  
  renderTagDistribution(notes) {
    const canvas = document.getElementById('tagDistChart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate tag distribution
    const tagCounts = {};
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Get top tags
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    const labels = sortedTags.map(([tag]) => tag);
    const data = sortedTags.map(([,count]) => count);
    
    // Create chart
    new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tag Frequency',
          data: data,
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    });
  },
  
  async exportDashboard(notes) {
    // Export as PDF report
    const metrics = await GraphAnalytics.calculateMetrics(notes);
    
    const report = `
# Knowledge Graph Analytics Report

## Network Overview
- Total Notes: ${metrics.totalNodes}
- Total Links: ${metrics.totalEdges}
- Network Density: ${(metrics.density * 100).toFixed(1)}%
- Clustering Coefficient: ${metrics.clusteringCoefficient.toFixed(2)}

## Top Hubs
${metrics.hubs.slice(0, 5).map(hub => `- ${hub.title} (${hub.degree} connections)`).join('\n')}

## Key Authorities
${metrics.authorities.slice(0, 5).map(auth => `- ${auth.title} (${auth.degree} references)`).join('\n')}

## Thematic Clusters
${metrics.communities.map(comm => `- Cluster ${comm.id.slice(-4)}: ${comm.size} notes`).join('\n')}

Report generated on ${new Date().toLocaleString()}
    `.trim();
    
    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `knowledge-graph-report-${Date.now()}.txt`
    });
    a.click();
    URL.revokeObjectURL(url);
    
    toast('Report exported');
  },
  
  // Render interactive graph with advanced features
  renderAdvancedGraph(container, notes) {
    container.innerHTML = '';
    
    // Create tabs for different views
    const graphContainer = document.createElement('div');
    graphContainer.className = 'advanced-graph';
    graphContainer.innerHTML = `
      <div class="graph-tabs">
        <button class="tab-btn active" data-tab="network">Network View</button>
        <button class="tab-btn" data-tab="timeline">Timeline View</button>
        <button class="tab-btn" data-tab="cluster">Cluster View</button>
        <button class="tab-btn" data-tab="metrics">Metrics</button>
      </div>
      
      <div class="graph-content">
        <div id="networkView" class="graph-view active">
          <div id="networkGraph" class="graph-canvas"></div>
        </div>
        <div id="timelineView" class="graph-view">
          <div id="timelineGraph" class="graph-canvas"></div>
        </div>
        <div id="clusterView" class="graph-view">
          <div id="clusterGraph" class="graph-canvas"></div>
        </div>
        <div id="metricsView" class="graph-view">
          <div id="metricsContent"></div>
        </div>
      </div>
    `;
    
    container.appendChild(graphContainer);
    
    // Bind tab events
    const tabButtons = graphContainer.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.onclick = () => {
        // Update active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show active view
        const tabId = btn.dataset.tab;
        const views = graphContainer.querySelectorAll('.graph-view');
        views.forEach(view => {
          view.classList.remove('active');
          if (view.id === `${tabId}View`) {
            view.classList.add('active');
          }
        });
        
        // Render appropriate view
        switch (tabId) {
          case 'network':
            this.renderNetworkView(notes);
            break;
          case 'timeline':
            this.renderTimelineView(notes);
            break;
          case 'cluster':
            this.renderClusterView(notes);
            break;
          case 'metrics':
            this.renderMetricsView(notes);
            break;
        }
      };
    });
    
    // Render initial view
    this.renderNetworkView(notes);
  },
  
  renderNetworkView(notes) {
    const container = document.getElementById('networkGraph');
    if (!container) return;
    
    // Use existing graph rendering but with enhancements
    if (typeof Graph !== 'undefined' && typeof Graph.render === 'function') {
      Graph.render(container, notes);
    }
  },
  
  renderTimelineView(notes) {
    const container = document.getElementById('timelineGraph');
    if (!container || !window.d3) return;
    
    container.innerHTML = '';
    
    // Sort notes by date
    const sortedNotes = [...notes].sort((a, b) => 
      new Date(a.updatedAt || a.createdAt).getTime() - 
      new Date(b.updatedAt || b.createdAt).getTime()
    );
    
    // Create timeline visualization
    const width = container.clientWidth||600;
    const height = container.clientHeight||400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(sortedNotes, d => new Date(d.updatedAt || d.createdAt)))
      .range([margin.left, width - margin.right]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(sortedNotes, d => (d.links || []).length) + 1])
      .range([height - margin.bottom, margin.top]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%Y-%m-%d')));
    
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));
    
    // Add line for link count over time
    const line = d3.line()
      .x(d => xScale(new Date(d.updatedAt || d.createdAt)))
      .y(d => yScale((d.links || []).length));
    
    svg.append('path')
      .datum(sortedNotes)
      .attr('fill', 'none')
      .attr('stroke', '#6ee7ff')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add points
    svg.selectAll('.dot')
      .data(sortedNotes)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.updatedAt || d.createdAt)))
      .attr('cy', d => yScale((d.links || []).length))
      .attr('r', 4)
      .attr('fill', '#8b5cf6')
      .on('click', (event, d) => {
        if (typeof UI !== 'undefined' && typeof UI.openNote === 'function') {
          UI.openNote(d.id);
        }
      });
  },
  
  renderClusterView(notes) {
    const container = document.getElementById('clusterGraph');
    if (!container || !window.d3) return;
    
    container.innerHTML = '';
    
    // Simple force-directed graph with community coloring
    const width = container.clientWidth||600;
    const height = container.clientHeight||400;
    
    // Create simplified graph data
    const nodes = notes.map(note => ({
      id: note.id,
      title: note.title,
      group: Math.floor(Math.random() * 5), // Simplified grouping
      degree: (note.links || []).length
    }));
    
    const links = [];
    notes.forEach(note => {
      (note.links || []).forEach(targetId => {
        links.push({
          source: note.id,
          target: targetId
        });
      });
    });
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(w/2, h/2));
    
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => Math.max(3, Math.min(10, d.degree)))
      .attr('fill', d => color(d.group))
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        if (typeof UI !== 'undefined' && typeof UI.openNote === 'function') {
          UI.openNote(d.id);
        }
      });
    
    const text = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.title ? d.title.slice(0, 15) : d.id.slice(0, 8))
      .attr('font-size', '10px')
      .attr('dx', 6)
      .attr('dy', 4);
    
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      text
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
  },
  
  async renderMetricsView(notes) {
    const container = document.getElementById('metricsContent');
    if (!container) return;
    
    const metrics = await GraphAnalytics.calculateMetrics(notes);
    
    container.innerHTML = `
      <div class="metrics-detail">
        <h3>Network Metrics</h3>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Total Notes</div>
            <div class="metric-value">${metrics.totalNodes}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Links</div>
            <div class="metric-value">${metrics.totalEdges}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Network Density</div>
            <div class="metric-value">${(metrics.density * 100).toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Clustering Coefficient</div>
            <div class="metric-value">${metrics.clusteringCoefficient.toFixed(3)}</div>
          </div>
        </div>
        
        <h3>Centrality Measures</h3>
        <div class="centrality-grid">
          ${Object.entries(metrics.centrality)
            .slice(0, 10)
            .map(([nodeId, centrality]) => {
              const note = notes.find(n => n.id === nodeId);
              return `
                <div class="centrality-item">
                  <div class="centrality-title">${note ? note.title : nodeId}</div>
                  <div class="centrality-values">
                    <div class="centrality-metric">
                      <span class="label">Degree:</span>
                      <span class="value">${centrality.degree}</span>
                    </div>
                    <div class="centrality-metric">
                      <span class="label">Betweenness:</span>
                      <span class="value">${centrality.betweenness.toFixed(1)}</span>
                    </div>
                    <div class="centrality-metric">
                      <span class="label">Closeness:</span>
                      <span class="value">${centrality.closeness.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
    `;
  }
};