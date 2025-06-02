import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import { useDispatch } from 'react-redux';
import { uuid } from 'utils/common';
import { flattenItems } from 'utils/collections';
import { runWorkflowCollection } from 'providers/ReduxStore/slices/collections/actions';
import { convertWorkflowToCollection, validateWorkflow } from './utils/workflowExecutor';
import StyledWrapper from './StyledWrapper';
import toast from 'react-hot-toast';

// Custom node components
import DefaultNode from './nodes/DefaultNode';
import ConditionalNode from './nodes/ConditionalNode';
import ScriptNode from './nodes/ScriptNode';
import RequestNode from './nodes/RequestNode';

// Modals
import ScriptModal from './modals/ScriptModal';
import ConditionalModal from './modals/ConditionalModal';

import 'reactflow/dist/style.css';

const nodeTypes = {
  defaultNode: DefaultNode,
  conditional: ConditionalNode,
  script: ScriptNode,
  request: RequestNode,
};

const WorkflowResults = ({ collection }) => {
  const dispatch = useDispatch();
  
  // Get all requests from collection
  const allRequests = useMemo(() => {
    if (!collection?.items) return [];
    const flattenedItems = flattenItems(collection.items);
    return flattenedItems.filter(item => item.type === 'http-request' || item.type === 'graphql-request');
  }, [collection]);

  // Modal states
  const [scriptModal, setScriptModal] = useState({ isOpen: false, nodeId: null, nodeData: null });
  const [conditionalModal, setConditionalModal] = useState({ isOpen: false, nodeId: null, nodeData: null });
  const [isRunning, setIsRunning] = useState(false);

  // Handle adding new nodes
  const handleAddNode = useCallback((sourceNodeId, nodeType, requestData = null) => {
    setNodes(nds => {
      const sourceNode = nds.find(n => n.id === sourceNodeId);
      if (!sourceNode) return nds;

      const baseSpacing = 100; // Reduced spacing to match default nodes
      const newNodeId = uuid();
      const newPosition = {
        x: sourceNode.position.x + baseSpacing,
        y: sourceNode.position.y
      };

      let newNode;
      let nextDefaultNodes = [];
      let newEdges = [];

      switch (nodeType) {
        case 'conditional':
          newNode = {
            id: newNodeId,
            type: 'conditional',
            data: { 
              condition: '',
              onOpenSettings: handleOpenSettings
            },
            position: newPosition,
            draggable: false,
          };

          // Create two default nodes for true/false paths
          const trueNodeId = uuid();
          const falseNodeId = uuid();
          
          nextDefaultNodes = [
            {
              id: trueNodeId,
              type: 'defaultNode',
              data: { 
                requests: allRequests,
                onAddNode: handleAddNode,
                onOpenSettings: handleOpenSettings
              },
              position: { x: newPosition.x + baseSpacing + 200, y: newPosition.y - 80 },
              draggable: false,
            },
            {
              id: falseNodeId,
              type: 'defaultNode',
              data: { 
                requests: allRequests,
                onAddNode: handleAddNode,
                onOpenSettings: handleOpenSettings
              },
              position: { x: newPosition.x + baseSpacing + 200, y: newPosition.y + 80 },
              draggable: false,
            }
          ];

          // Create edges for true/false paths
          newEdges = [
            {
              id: `e${newNodeId}-true-${trueNodeId}`,
              source: newNodeId,
              sourceHandle: 'true',
              target: trueNodeId,
            },
            {
              id: `e${newNodeId}-false-${falseNodeId}`,
              source: newNodeId,
              sourceHandle: 'false',
              target: falseNodeId,
            }
          ];
          break;
        
        case 'script':
          newNode = {
            id: newNodeId,
            type: 'script',
            data: { 
              script: '', // Initialize with empty string instead of null
              onOpenSettings: handleOpenSettings
            },
            position: newPosition,
            draggable: false,
          };

          // Create single default node
          const scriptNextNodeId = uuid();
          nextDefaultNodes = [{
            id: scriptNextNodeId,
            type: 'defaultNode',
            data: { 
              requests: allRequests,
              onAddNode: handleAddNode,
              onOpenSettings: handleOpenSettings
            },
            position: { x: newPosition.x + baseSpacing + 200, y: newPosition.y },
            draggable: false,
          }];

          newEdges = [{
            id: `e${newNodeId}-${scriptNextNodeId}`,
            source: newNodeId,
            target: scriptNextNodeId,
          }];
          break;
        
        case 'request':
          newNode = {
            id: newNodeId,
            type: 'request',
            data: { 
              request: requestData
            },
            position: newPosition,
            draggable: false,
          };

          // Create single default node
          const requestNextNodeId = uuid();
          nextDefaultNodes = [{
            id: requestNextNodeId,
            type: 'defaultNode',
            data: { 
              requests: allRequests,
              onAddNode: handleAddNode,
              onOpenSettings: handleOpenSettings
            },
            position: { x: newPosition.x + baseSpacing + 200, y: newPosition.y },
            draggable: false,
          }];

          newEdges = [{
            id: `e${newNodeId}-${requestNextNodeId}`,
            source: newNodeId,
            target: requestNextNodeId,
          }];
          break;
        
        default:
          return nds;
      }

      // Update edges state
      setEdges(eds => {
        const updatedEdges = [...eds];
        
        // Find edge that points TO the source node (the default node being replaced)
        const incomingEdge = eds.find(edge => edge.target === sourceNodeId);
        
        if (incomingEdge) {
          // Remove the old edge to the source node
          const filteredEdges = updatedEdges.filter(edge => edge.target !== sourceNodeId);
          
          // Add new edge from the previous node to the new node
          const newIncomingEdge = {
            id: `e${incomingEdge.source}-${newNodeId}`,
            source: incomingEdge.source,
            sourceHandle: incomingEdge.sourceHandle, // Preserve source handle for conditional nodes
            target: newNodeId,
          };
          
          // Return all edges: filtered old edges + new incoming edge + new outgoing edges
          return [...filteredEdges, newIncomingEdge, ...newEdges];
        } else {
          // No incoming edge (this is the first node), just add the new outgoing edges
          return [...updatedEdges, ...newEdges];
        }
      });

      // Return updated nodes
      return [
        ...nds.filter(n => n.id !== sourceNodeId), // Remove the source default node
        newNode,
        ...nextDefaultNodes
      ];
    });
  }, [allRequests]);

  // Handle opening settings modals
  const handleOpenSettings = useCallback((nodeId, nodeType) => {
    setNodes(nds => {
      const node = nds.find(n => n.id === nodeId);
      if (!node) return nds;

      if (nodeType === 'script') {
        setScriptModal({
          isOpen: true,
          nodeId,
          nodeData: node.data
        });
      } else if (nodeType === 'conditional') {
        setConditionalModal({
          isOpen: true,
          nodeId,
          nodeData: node.data
        });
      }
      return nds;
    });
  }, []);

  // Initial state with one default node
  const initialNodes = useMemo(() => [
    {
      id: '1',
      type: 'defaultNode',
      data: { 
        requests: allRequests,
        onAddNode: handleAddNode,
        onOpenSettings: handleOpenSettings
      },
      position: { x: 250, y: 150 },
      draggable: false,
    },
  ], [allRequests, handleAddNode, handleOpenSettings]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle saving script
  const handleSaveScript = (script) => {
    setNodes(nds => nds.map(node => {
      if (node.id === scriptModal.nodeId) {
        return { 
          ...node, 
          data: { 
            ...node.data, 
            script: script // Ensure we're setting the script value directly
          } 
        };
      }
      return node;
    }));
    setScriptModal({ isOpen: false, nodeId: null, nodeData: null });
  };

  // Handle saving condition
  const handleSaveCondition = (condition) => {
    setNodes(nds => nds.map(node => {
      if (node.id === conditionalModal.nodeId) {
        return { 
          ...node, 
          data: { 
            ...node.data, 
            condition: condition // Ensure we're setting the condition value directly
          } 
        };
      }
      return node;
    }));
    setConditionalModal({ isOpen: false, nodeId: null, nodeData: null });
  };

  // Handle workflow execution
  const handleRunWorkflow = async () => {
    try {
      setIsRunning(true);
      
      // Validate workflow first
      const validation = validateWorkflow(nodes, edges);
      if (!validation.isValid) {
        toast.error(`Workflow validation failed: ${validation.errors.join(', ')}`);
        return;
      }
      
      // Convert workflow to collection
      const result = convertWorkflowToCollection(collection, nodes, edges);
      
      if (!result.success) {
        toast.error(`Failed to convert workflow: ${result.error}`);
        return;
      }
      
      console.log('Converted workflow to collection:', result.collection);
      console.log('Execution sequence:', result.executionSequence);
      
      // Run the converted collection using the new workflow-specific action
      await dispatch(runWorkflowCollection(
        result.collection, // The pre-modified workflow collection
        collection.uid // Original collection UID for UI updates
      ));
      
      toast.success('Workflow execution started!');
      
    } catch (error) {
      console.error('Workflow execution error:', error);
      toast.error(`Failed to execute workflow: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Viewport configuration for horizontal scrolling only
  const viewportConfig = useMemo(() => ({
    x: 0,
    y: 0,
    zoom: 1,
  }), []);

  return (
    <StyledWrapper>
      <div className="workflow-container">
        <div className="workflow-header">
          <h2 className="text-lg font-semibold">Workflow - {collection?.name}</h2>
          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className={`run-button flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
        <div className="workflow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            panOnDrag={true} // Enable canvas dragging
            panOnScroll={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesDraggable={false} // Disable node dragging
            nodesConnectable={true}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            defaultViewport={viewportConfig}
            minZoom={1}
            maxZoom={1}
            translateExtent={[[-2000, -50], [4000, 350]]} // Allow wider horizontal panning
          >
            <Controls 
              position="bottom-right" 
              showZoom={false}
              showFitView={true}
              showInteractive={false}
            />
            <MiniMap 
              position="bottom-left" 
              style={{ height: 80, width: 200 }}
              nodeColor="#3b82f6"
            />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-left" className="workflow-info">
              <div className="text-sm text-gray-500">
                Click + nodes to add workflow steps • Drag canvas to navigate
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Modals */}
      <ScriptModal
        isOpen={scriptModal.isOpen}
        onClose={() => setScriptModal({ isOpen: false, nodeId: null, nodeData: null })}
        onSave={handleSaveScript}
        nodeData={scriptModal.nodeData}
        collection={collection}
      />
      
      <ConditionalModal
        isOpen={conditionalModal.isOpen}
        onClose={() => setConditionalModal({ isOpen: false, nodeId: null, nodeData: null })}
        onSave={handleSaveCondition}
        nodeData={conditionalModal.nodeData}
        collection={collection}
      />
    </StyledWrapper>
  );
};

export default WorkflowResults; 