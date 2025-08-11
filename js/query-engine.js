/* query-engine.js — Advanced query engine with SQL-like syntax */

const QueryEngine = {
  // Parse and execute a query
  async execute(query, notes = null) {
    if (!notes) {
      notes = await Store.allNotes();
    }
    
    const parsed = this.parseQuery(query);
    return this.processQuery(parsed, notes);
  },
  
  // Parse query string into AST
  parseQuery(query) {
    // Simple parser for demonstration
    // In a real implementation, this would be a proper parser
    const tokens = query.match(/\S+/g) || [];
    
    const ast = {
      select: [],
      from: 'notes',
      where: [],
      orderBy: [],
      limit: null,
      groupBy: []
    };
    
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i].toLowerCase();
      
      switch (token) {
        case 'select':
          i++;
          const selectFields = [];
          while (i < tokens.length && tokens[i].toLowerCase() !== 'from') {
            if (tokens[i] !== ',') {
              selectFields.push(tokens[i]);
            }
            i++;
          }
          ast.select = selectFields;
          break;
          
        case 'from':
          i++;
          ast.from = tokens[i];
          i++;
          break;
          
        case 'where':
          i++;
          const whereClause = [];
          while (i < tokens.length && 
                 tokens[i].toLowerCase() !== 'order' && 
                 tokens[i].toLowerCase() !== 'group' && 
                 tokens[i].toLowerCase() !== 'limit') {
            whereClause.push(tokens[i]);
            i++;
          }
          ast.where = this.parseWhereClause(whereClause);
          break;
          
        case 'order':
          if (i + 1 < tokens.length && tokens[i + 1].toLowerCase() === 'by') {
            i += 2;
            const orderByFields = [];
            while (i < tokens.length && 
                   tokens[i].toLowerCase() !== 'group' && 
                   tokens[i].toLowerCase() !== 'limit') {
              if (tokens[i] !== ',') {
                orderByFields.push(tokens[i]);
              }
              i++;
            }
            ast.orderBy = orderByFields;
          } else {
            i++;
          }
          break;
          
        case 'group':
          if (i + 1 < tokens.length && tokens[i + 1].toLowerCase() === 'by') {
            i += 2;
            const groupByFields = [];
            while (i < tokens.length && 
                   tokens[i].toLowerCase() !== 'order' && 
                   tokens[i].toLowerCase() !== 'limit') {
              if (tokens[i] !== ',') {
                groupByFields.push(tokens[i]);
              }
              i++;
            }
            ast.groupBy = groupByFields;
          } else {
            i++;
          }
          break;
          
        case 'limit':
          i++;
          ast.limit = parseInt(tokens[i]);
          i++;
          break;
          
        default:
          i++;
      }
    }
    
    // Default select all if not specified
    if (ast.select.length === 0) {
      ast.select = ['*'];
    }
    
    return ast;
  },
  
  parseWhereClause(tokens) {
    const conditions = [];
    let i = 0;
    
    while (i < tokens.length) {
      const field = tokens[i];
      i++;
      
      if (i >= tokens.length) break;
      
      const operator = tokens[i];
      i++;
      
      if (i >= tokens.length) break;
      
      const value = tokens[i];
      i++;
      
      conditions.push({
        field,
        operator,
        value: this.parseValue(value)
      });
      
      // Handle AND/OR
      if (i < tokens.length && 
          (tokens[i].toLowerCase() === 'and' || tokens[i].toLowerCase() === 'or')) {
        conditions.push({
          operator: tokens[i].toLowerCase(),
          type: 'logical'
        });
        i++;
      }
    }
    
    return conditions;
  },
  
  parseValue(value) {
    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    // Handle numbers
    if (!isNaN(value)) {
      return parseFloat(value);
    }
    
    // Handle booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Handle null
    if (value.toLowerCase() === 'null') return null;
    
    // Default to string
    return value;
  },
  
  // Process parsed query against data
  processQuery(ast, notes) {
    let result = [...notes];
    
    // Apply WHERE conditions
    if (ast.where.length > 0) {
      result = this.applyWhere(result, ast.where);
    }
    
    // Apply GROUP BY
    if (ast.groupBy.length > 0) {
      result = this.applyGroupBy(result, ast.groupBy);
    }
    
    // Apply ORDER BY
    if (ast.orderBy.length > 0) {
      result = this.applyOrderBy(result, ast.orderBy);
    }
    
    // Apply LIMIT
    if (ast.limit !== null) {
      result = result.slice(0, ast.limit);
    }
    
    // Apply SELECT
    if (ast.select.length > 0 && !ast.select.includes('*')) {
      result = this.applySelect(result, ast.select);
    }
    
    return result;
  },
  
  applyWhere(notes, conditions) {
    return notes.filter(note => {
      let result = true;
      let currentOp = 'and';
      
      for (const condition of conditions) {
        if (condition.type === 'logical') {
          currentOp = condition.operator;
          continue;
        }
        
        const value = this.getFieldValue(note, condition.field);
        const conditionResult = this.evaluateCondition(value, condition.operator, condition.value);
        
        if (currentOp === 'and') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }
      
      return result;
    });
  },
  
  getFieldValue(note, field) {
    // Handle nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = note;
      for (const part of parts) {
        value = value ? value[part] : undefined;
      }
      return value;
    }
    
    // Handle special fields
    switch (field) {
      case 'links_count':
        return (note.links || []).length;
      case 'tags_count':
        return (note.tags || []).length;
      case 'word_count':
        return (note.body || '').split(/\s+/).length;
      case 'char_count':
        return (note.body || '').length;
      default:
        return note[field];
    }
  },
  
  evaluateCondition(left, operator, right) {
    switch (operator) {
      case '=':
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '<':
        return left < right;
      case '<=':
        return left <= right;
      case '>':
        return left > right;
      case '>=':
        return left >= right;
      case 'like':
        if (typeof left === 'string' && typeof right === 'string') {
          return left.toLowerCase().includes(right.toLowerCase());
        }
        return false;
      case 'contains':
        if (Array.isArray(left)) {
          return left.includes(right);
        }
        if (typeof left === 'string') {
          return left.includes(right);
        }
        return false;
      case 'in':
        if (Array.isArray(right)) {
          return right.includes(left);
        }
        return false;
      default:
        return false;
    }
  },
  
  applyGroupBy(notes, fields) {
    const groups = new Map();
    
    notes.forEach(note => {
      const key = fields.map(field => this.getFieldValue(note, field)).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(note);
    });
    
    // Convert groups to aggregated results
    const result = [];
    for (const [key, group] of groups.entries()) {
      const aggregated = {
        group_key: key,
        count: group.length
      };
      
      // Add aggregated fields
      fields.forEach(field => {
        aggregated[field] = group[0] ? this.getFieldValue(group[0], field) : null;
      });
      
      result.push(aggregated);
    }
    
    return result;
  },
  
  applyOrderBy(notes, fields) {
    return notes.sort((a, b) => {
      for (const field of fields) {
        let fieldName = field;
        let direction = 1;
        
        // Handle DESC
        if (field.toLowerCase().endsWith(' desc')) {
          fieldName = field.slice(0, -5).trim();
          direction = -1;
        } else if (field.toLowerCase().endsWith(' asc')) {
          fieldName = field.slice(0, -4).trim();
        }
        
        const valueA = this.getFieldValue(a, fieldName);
        const valueB = this.getFieldValue(b, fieldName);
        
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
      }
      return 0;
    });
  },
  
  applySelect(notes, fields) {
    return notes.map(note => {
      const selected = {};
      
      fields.forEach(field => {
        if (field === '*') {
          Object.assign(selected, note);
        } else {
          selected[field] = this.getFieldValue(note, field);
        }
      });
      
      return selected;
    });
  },
  
  // Advanced aggregations
  async aggregate(query, notes = null) {
    if (!notes) {
      notes = await Store.allNotes();
    }
    
    const parsed = this.parseQuery(query);
    const filtered = this.applyWhere(notes, parsed.where);
    
    const result = {
      count: filtered.length,
      avg_links: 0,
      avg_tags: 0,
      total_words: 0,
      date_range: { min: null, max: null }
    };
    
    if (filtered.length > 0) {
      // Calculate averages
      const totalLinks = filtered.reduce((sum, note) => sum + (note.links || []).length, 0);
      const totalTags = filtered.reduce((sum, note) => sum + (note.tags || []).length, 0);
      const totalWords = filtered.reduce((sum, note) => sum + (note.body || '').split(/\s+/).length, 0);
      
      result.avg_links = totalLinks / filtered.length;
      result.avg_tags = totalTags / filtered.length;
      result.total_words = totalWords;
      
      // Calculate date range
      const dates = filtered.map(note => new Date(note.updatedAt || note.createdAt));
      result.date_range.min = new Date(Math.min(...dates)).toISOString();
      result.date_range.max = new Date(Math.max(...dates)).toISOString();
    }
    
    return result;
  },
  
  // Full-text search with relevance scoring
  async search(query, notes = null) {
    if (!notes) {
      notes = await Store.allNotes();
    }
    
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return [];
    
    const results = notes.map(note => {
      const content = `${note.title || ''} ${note.body || ''} ${(note.tags || []).join(' ')}`.toLowerCase();
      let score = 0;
      
      terms.forEach(term => {
        // Exact matches
        if (content.includes(term)) {
          score += 3;
        }
        
        // Word boundary matches
        const wordMatches = content.match(new RegExp(`\\b${term}\\b`, 'g'));
        if (wordMatches) {
          score += wordMatches.length * 2;
        }
        
        // Title matches (weighted higher)
        if ((note.title || '').toLowerCase().includes(term)) {
          score += 5;
        }
        
        // Tag matches (weighted higher)
        const tagMatches = (note.tags || []).filter(tag => tag.toLowerCase().includes(term)).length;
        score += tagMatches * 4;
      });
      
      return { note, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.note);
    
    return results;
  }
};