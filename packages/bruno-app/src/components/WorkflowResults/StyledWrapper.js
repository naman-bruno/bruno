import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .workflow-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .workflow-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.bg};
    z-index: 10;
  }

  .workflow-canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .run-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background-color: #2563eb;
    }
  }

  .workflow-info {
    background: ${({ theme }) => theme.colors.bg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 6px;
    padding: 0.5rem;
    margin: 1rem;
  }

  /* React Flow specific styles */
  .react-flow {
    background-color: ${({ theme }) => theme.colors.bg};
  }

  .react-flow__node {
    background: ${({ theme }) => theme.colors.bg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    padding: 10px;
    min-width: 50px;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      border-color: #3b82f6;
      background: ${({ theme }) => theme.colors.bgHover};
    }
    
    &.selected {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }

  .react-flow__node-input {
    background: #e7f3ff;
    border-color: #3b82f6;
  }

  .react-flow__edge-path {
    stroke: ${({ theme }) => theme.colors.border};
    stroke-width: 2;
  }

  .react-flow__edge.selected .react-flow__edge-path {
    stroke: #3b82f6;
  }

  .react-flow__handle {
    background: #3b82f6;
    border: none;
    width: 8px;
    height: 8px;
  }

  .react-flow__handle-connecting {
    background: #2563eb;
  }

  .react-flow__controls {
    background: ${({ theme }) => theme.colors.bg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 6px;
  }

  .react-flow__controls-button {
    background: ${({ theme }) => theme.colors.bg};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    
    &:hover {
      background: ${({ theme }) => theme.colors.bgHover};
    }
    
    &:last-child {
      border-bottom: none;
    }
  }

  .react-flow__minimap {
    background: ${({ theme }) => theme.colors.bg};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 6px;
  }

  /* Canvas panning styles - improved for better dragging */
  .react-flow__pane {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }

  .react-flow__renderer {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }

  /* Plus icon node specific styles */
  .react-flow__node[data-id="1"] {
    border: 2px dashed #3b82f6;
    background: rgba(59, 130, 246, 0.05);
    color: #3b82f6;
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: #2563eb;
    }
  }

  /* Selection styles */
  .react-flow__selection {
    background: rgba(59, 130, 246, 0.1);
    border: 1px dashed #3b82f6;
  }

  /* Ensure smooth dragging */
  .react-flow__viewport {
    transition: none !important;
  }

  /* Fix CodeMirror text alignment in modals */
  .CodeMirror {
    text-align: left !important;
    
    .CodeMirror-lines {
      text-align: left !important;
    }
    
    .CodeMirror-line {
      text-align: left !important;
    }
    
    pre.CodeMirror-line, pre.CodeMirror-line-like {
      text-align: left !important;
    }
  }
`;

export default StyledWrapper; 