import { cloneDeep } from 'lodash';
import { uuid } from 'utils/common';

// Build execution graph from nodes and edges
const buildExecutionGraph = (nodes, edges) => {
  const graph = {};
  const nodeMap = {};
  
  // Create node map
  nodes.forEach(node => {
    nodeMap[node.id] = node;
    graph[node.id] = {
      node,
      next: [],
      incoming: []
    };
  });
  
  // Build adjacency lists
  edges.forEach(edge => {
    if (graph[edge.source] && graph[edge.target]) {
      graph[edge.source].next.push({
        targetId: edge.target,
        sourceHandle: edge.sourceHandle // For conditional true/false paths
      });
      graph[edge.target].incoming.push({
        sourceId: edge.source,
        sourceHandle: edge.sourceHandle
      });
    }
  });
  
  return { graph, nodeMap };
};

// Find the starting node (node with no incoming edges)
const findStartNode = (graph) => {
  for (const nodeId in graph) {
    if (graph[nodeId].incoming.length === 0) {
      return nodeId;
    }
  }
  return null;
};

// Find path endings (nodes where conditional paths converge back or end)
const findPathEndings = (graph, conditionalNodes) => {
  const pathEndings = {};
  
  conditionalNodes.forEach(conditionalNodeId => {
    const nextNodes = graph[conditionalNodeId].next;
    const truePath = nextNodes.find(n => n.sourceHandle === 'true');
    const falsePath = nextNodes.find(n => n.sourceHandle === 'false');
    
    if (truePath && falsePath) {
      // Find where true path ends
      const truePathEnd = findPathEnd(graph, truePath.targetId, new Set());
      const falsePathEnd = findPathEnd(graph, falsePath.targetId, new Set());
      
      pathEndings[conditionalNodeId] = {
        truePathEnd,
        falsePathEnd
      };
    }
  });
  
  return pathEndings;
};

// Find where a path ends (last request node before convergence or end)
const findPathEnd = (graph, startNodeId, visited) => {
  if (visited.has(startNodeId) || !graph[startNodeId]) {
    return null;
  }
  
  visited.add(startNodeId);
  const { node } = graph[startNodeId];
  
  // Skip default nodes
  if (node.type === 'defaultNode') {
    return null;
  }
  
  // If this is a request node and has no next nodes (or only default nodes), it's an end
  if (node.type === 'request') {
    const hasNonDefaultNext = graph[startNodeId].next.some(({ targetId }) => {
      return graph[targetId] && graph[targetId].node.type !== 'defaultNode';
    });
    
    if (!hasNonDefaultNext) {
      return startNodeId; // This is a path end
    }
  }
  
  // Continue traversing
  for (const { targetId } of graph[startNodeId].next) {
    const pathEnd = findPathEnd(graph, targetId, new Set(visited));
    if (pathEnd) {
      return pathEnd;
    }
  }
  
  return null;
};

// Traverse workflow and build execution sequence
const buildExecutionSequence = (nodes, edges) => {
  const { graph, nodeMap } = buildExecutionGraph(nodes, edges);
  const startNodeId = findStartNode(graph);
  
  if (!startNodeId) {
    throw new Error('No starting node found in workflow');
  }
  
  const conditionalNodes = nodes.filter(n => n.type === 'conditional').map(n => n.id);
  const pathEndings = findPathEndings(graph, conditionalNodes);
  
  const sequence = [];
  const visited = new Set();
  
  const traverse = (nodeId, path = []) => {
    if (visited.has(nodeId) || !graph[nodeId]) {
      return;
    }
    
    const { node } = graph[nodeId];
    
    // Skip default nodes
    if (node.type === 'defaultNode') {
      return;
    }
    
    visited.add(nodeId);
    const currentIndex = sequence.length;
    
    if (node.type === 'request') {
      sequence.push({
        type: 'request',
        node,
        index: currentIndex,
        nodeId,
        scripts: [],
        isPathEnd: false // Will be set later
      });
    } else if (node.type === 'script') {
      // Script nodes get attached to previous request
      if (sequence.length > 0) {
        const lastRequest = sequence[sequence.length - 1];
        lastRequest.scripts.push({
          type: 'script',
          script: node.data.script || '',
          nodeId
        });
      }
    } else if (node.type === 'conditional') {
      // Handle conditional logic
      const condition = node.data.condition || 'false';
      const nextNodes = graph[nodeId].next;
      
      // Find true and false paths
      const truePath = nextNodes.find(n => n.sourceHandle === 'true');
      const falsePath = nextNodes.find(n => n.sourceHandle === 'false');
      
      if (truePath && falsePath) {
        // Add conditional logic to previous request
        if (sequence.length > 0) {
          const lastRequest = sequence[sequence.length - 1];
          
          // Find what requests are in false path
          const falsePathRequests = getFalsePathRequests(graph, falsePath.targetId);
          const skipToRequest = falsePathRequests.length > 0 ? falsePathRequests[0] : null;
          
          const conditionalScript = `
// Conditional logic from workflow
if (${condition}) {
  // Continue to true path (next request)
} else {
  ${skipToRequest ? `bru.setNextRequest("${skipToRequest.name}");` : '// No false path defined'}
}`;
          
          lastRequest.scripts.push({
            type: 'conditional',
            script: conditionalScript,
            nodeId,
            condition,
            truePath: truePath.targetId,
            falsePath: falsePath.targetId
          });
        }
        
        // Continue with true path first
        traverse(truePath.targetId, [...path, 'true']);
        // Then false path
        traverse(falsePath.targetId, [...path, 'false']);
      }
      return; // Don't process next nodes normally for conditionals
    }
    
    // Process next nodes
    graph[nodeId].next.forEach(({ targetId }) => {
      if (!visited.has(targetId)) {
        traverse(targetId, [...path, targetId]);
      }
    });
  };
  
  traverse(startNodeId);
  
  // Mark path endings and add skip logic
  conditionalNodes.forEach(conditionalNodeId => {
    const endings = pathEndings[conditionalNodeId];
    if (endings && endings.truePathEnd) {
      // Find the request in sequence that corresponds to true path end
      const truePathEndRequest = sequence.find(item => item.nodeId === endings.truePathEnd);
      if (truePathEndRequest) {
        truePathEndRequest.isPathEnd = true;
        truePathEndRequest.skipToEnd = true; // Mark to skip to temp node
      }
    }
  });
  
  return sequence;
};

// Get requests in false path for bru.setNextRequest()
const getFalsePathRequests = (graph, startNodeId) => {
  const requests = [];
  const visited = new Set();
  
  const traverse = (nodeId) => {
    if (visited.has(nodeId) || !graph[nodeId]) {
      return;
    }
    
    visited.add(nodeId);
    const { node } = graph[nodeId];
    
    if (node.type === 'request') {
      requests.push(node.data.request);
    }
    
    // Continue traversing
    graph[nodeId].next.forEach(({ targetId }) => {
      if (!visited.has(targetId)) {
        traverse(targetId);
      }
    });
  };
  
  traverse(startNodeId);
  return requests;
};

// Convert workflow to collection items
export const convertWorkflowToCollection = (originalCollection, nodes, edges) => {
  try {
    const sequence = buildExecutionSequence(nodes, edges);
    
    if (sequence.length === 0) {
      throw new Error('No executable requests found in workflow');
    }
    
    // Create collection copy
    const collectionCopy = cloneDeep(originalCollection);
    
    // Create temp end node name
    const tempNodeName = '__WORKFLOW_END_TEMP__';
    
    // Build new items array from sequence
    const newItems = [];
    
    sequence.forEach((item, index) => {
      if (item.type === 'request') {
        const originalRequest = item.node.data.request;
        
        // Create new request item
        const requestItem = {
          uid: originalRequest.uid || uuid(),
          name: originalRequest.name,
          type: originalRequest.type || 'http-request',
          seq: index + 1,
          request: cloneDeep(originalRequest.request || originalRequest),
          filename: originalRequest.filename || `${originalRequest.name}.bru`,
          pathname: originalRequest.pathname || `${collectionCopy.pathname}/${originalRequest.name}.bru`,
          draft: null,
          partial: false,
          loading: false,
          size: originalRequest.size || 0,
          depth: 1
        };
        
        // Ensure script object exists
        if (!requestItem.request.script) {
          requestItem.request.script = {};
        }
        
        // Combine all scripts for this request
        const allScripts = item.scripts.map(script => script.script).filter(Boolean);
        
        // If this is a path end that should skip to temp node, add skip logic
        if (item.skipToEnd) {
          allScripts.push(`
// Skip to end of workflow
bru.setNextRequest("${tempNodeName}");`);
        }
        
        if (allScripts.length > 0) {
          // Combine existing res script with new scripts
          const existingResScript = requestItem.request.script.res || '';
          const combinedScript = [existingResScript, ...allScripts].filter(Boolean).join('\n\n');
          requestItem.request.script.res = combinedScript;
        }
        
        newItems.push(requestItem);
      }
    });
    
    // Add temporary end node at the end
    const tempNode = {
      uid: uuid(),
      name: tempNodeName,
      type: 'http-request',
      seq: newItems.length + 1,
      request: {
        method: 'GET',
        url: 'https://example.com', // Dummy URL
        headers: [],
        params: [],
        body: {
          mode: 'none'
        },
        auth: {
          mode: 'inherit'
        },
        script: {
          res: '// Workflow end - this request should not execute'
        }
      },
      filename: `${tempNodeName}.bru`,
      pathname: `${collectionCopy.pathname}/${tempNodeName}.bru`,
      draft: null,
      partial: false,
      loading: false,
      size: 0,
      depth: 1
    };
    
    newItems.push(tempNode);
    
    // Replace items in collection copy
    collectionCopy.items = newItems;
    
    return {
      success: true,
      collection: collectionCopy,
      executionSequence: sequence
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      collection: null
    };
  }
};

// Validate workflow before execution
export const validateWorkflow = (nodes, edges) => {
  const errors = [];
  
  // Check for requests
  const requestNodes = nodes.filter(n => n.type === 'request');
  if (requestNodes.length === 0) {
    errors.push('Workflow must contain at least one request');
  }
  
  // Check for orphaned nodes
  const { graph } = buildExecutionGraph(nodes, edges);
  const startNode = findStartNode(graph);
  if (!startNode) {
    errors.push('Workflow must have a clear starting point');
  }
  
  // Check conditional nodes have both paths
  const conditionalNodes = nodes.filter(n => n.type === 'conditional');
  conditionalNodes.forEach(node => {
    const nodeEdges = edges.filter(e => e.source === node.id);
    const hasTrue = nodeEdges.some(e => e.sourceHandle === 'true');
    const hasFalse = nodeEdges.some(e => e.sourceHandle === 'false');
    
    if (!hasTrue || !hasFalse) {
      errors.push(`Conditional node "${node.id}" must have both true and false paths`);
    }
    
    if (!node.data.condition || node.data.condition.trim() === '') {
      errors.push(`Conditional node "${node.id}" must have a condition defined`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 