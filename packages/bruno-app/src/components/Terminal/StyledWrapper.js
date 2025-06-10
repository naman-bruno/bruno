import styled from 'styled-components';

const StyledWrapper = styled.div`
  position: relative;
  width: 100%;
  background: ${(props) => props.theme.terminal?.bg || props.theme.bg || '#1e1e1e'};
  border-top: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .terminal-resize-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    cursor: row-resize;
    background: transparent;
    transition: background-color 0.2s ease;
    z-index: 1;
    
    &:hover {
      background: ${(props) => props.theme.terminal?.resizeHandleHover || props.theme.button.secondary.bg || '#0078d4'};
    }
    
    &:active {
      background: ${(props) => props.theme.terminal?.resizeHandleActive || props.theme.button.secondary.bg || '#0078d4'};
    }
  }

  .terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: ${(props) => props.theme.terminal?.headerBg || props.theme.sidebar.bg || '#2d2d30'};
    border-bottom: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
    flex-shrink: 0;
    position: relative;
  }

  .terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${(props) => props.theme.terminal?.titleColor || props.theme.text || '#cccccc'};
    font-size: 13px;
    font-weight: 500;

    .log-count {
      color: ${(props) => props.theme.terminal?.countColor || props.theme.textSecondary || '#858585'};
      font-size: 12px;
      font-weight: 400;
    }
  }

  .terminal-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    padding-right: 8px;
    border-right: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
  }

  .action-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: ${(props) => props.theme.terminal?.buttonColor || props.theme.text || '#cccccc'};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${(props) => props.theme.terminal?.buttonHoverBg || 'rgba(255, 255, 255, 0.1)'};
      color: ${(props) => props.theme.terminal?.buttonHoverColor || props.theme.text || '#ffffff'};
    }

    &.close-button:hover {
      background: #e81123;
      color: white;
    }
  }

  /* Filter Dropdown Styles */
  .filter-dropdown {
    position: relative;
  }

  .filter-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
    border-radius: 4px;
    color: ${(props) => props.theme.terminal?.buttonColor || props.theme.text || '#cccccc'};
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;

    &:hover {
      background: ${(props) => props.theme.terminal?.buttonHoverBg || 'rgba(255, 255, 255, 0.1)'};
      color: ${(props) => props.theme.terminal?.buttonHoverColor || props.theme.text || '#ffffff'};
      border-color: ${(props) => props.theme.terminal?.buttonHoverBorder || 'rgba(255, 255, 255, 0.2)'};
    }

    .filter-summary {
      font-weight: 500;
      min-width: 24px;
      text-align: center;
    }
  }

  .filter-dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 200px;
    max-width: 250px;
    background: ${(props) => props.theme.terminal?.dropdownBg || props.theme.bg || '#2d2d30'};
    border: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 100;
    overflow: hidden;
    
    /* Positioning for right-aligned dropdown */
    &.right {
      left: auto;
      right: 0;
    }
    
    /* Adjust positioning if dropdown would go off-screen */
    @media (max-width: 768px) {
      right: 0;
      left: auto;
      min-width: 180px;
    }
  }

  .filter-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: ${(props) => props.theme.terminal?.dropdownHeaderBg || props.theme.sidebar.bg || '#3c3c3c'};
    border-bottom: 1px solid ${(props) => props.theme.terminal?.border || props.theme.borderColor || '#3c3c3c'};
    font-size: 12px;
    font-weight: 500;
    color: ${(props) => props.theme.terminal?.titleColor || props.theme.text || '#cccccc'};
  }

  .filter-toggle-all {
    background: transparent;
    border: none;
    color: ${(props) => props.theme.terminal?.buttonColor || props.theme.text || '#0078d4'};
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 4px;
    border-radius: 2px;
    transition: all 0.2s ease;

    &:hover {
      background: ${(props) => props.theme.terminal?.buttonHoverBg || props.theme.button.secondary.hoverBg || '#3c3c3c'};
    }
  }

  .filter-dropdown-options {
    padding: 4px 0;
  }

  .filter-option {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: ${(props) => 
        props.theme.terminal?.optionHoverBg || 
        (props.theme.name === 'light' || props.theme.mode === 'light' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)')
      };
    }

    input[type="checkbox"] {
      margin: 0 8px 0 0;
      width: 14px;
      height: 14px;
      accent-color: ${(props) => props.theme.terminal?.checkboxColor || '#0078d4'};
    }
  }

  .filter-option-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .filter-option-label {
    color: ${(props) => props.theme.terminal?.optionLabelColor || props.theme.text || '#cccccc'};
    font-size: 12px;
    font-weight: 400;
  }

  .filter-option-count {
    color: ${(props) => props.theme.terminal?.optionCountColor || props.theme.textSecondary || '#858585'};
    font-size: 11px;
    font-weight: 400;
    margin-left: auto;
  }

  .terminal-content {
    flex: 1;
    overflow-y: auto;
    background: ${(props) => props.theme.terminal?.contentBg || props.theme.bg || '#1e1e1e'};
    min-height: 0;
  }

  .terminal-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${(props) => props.theme.terminal?.emptyColor || props.theme.textSecondary || '#858585'};
    text-align: center;
    gap: 8px;
    padding: 40px 20px;

    p {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }

    span {
      font-size: 12px;
      opacity: 0.7;
    }
  }

  .logs-container {
    padding: 8px 0;
  }

  .log-entry {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 4px 16px;
    font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    border-left: 2px solid transparent;
    transition: background-color 0.1s ease;

    &:hover {
      background: ${(props) => props.theme.terminal?.logHoverBg || 'rgba(128, 128, 128, 0.1)'};
    }

    &.error {
      border-left-color: #f14c4c;
      
      .log-level {
        background: #f14c4c;
        color: white;
      }
      
      .log-icon {
        color: #f14c4c;
      }
    }

    &.warn {
      border-left-color: #ffcc02;
      
      .log-level {
        background: #ffcc02;
        color: #000;
      }
      
      .log-icon {
        color: #ffcc02;
      }
    }

    &.info {
      border-left-color: #0078d4;
      
      .log-level {
        background: #0078d4;
        color: white;
      }
      
      .log-icon {
        color: #0078d4;
      }
    }

    &.debug {
      border-left-color: #9b59b6;
      
      .log-level {
        background: #9b59b6;
        color: white;
      }
      
      .log-icon {
        color: #9b59b6;
      }
    }

    &.log {
      border-left-color: #6a6a6a;
      
      .log-level {
        background: #6a6a6a;
        color: white;
      }
      
      .log-icon {
        color: #6a6a6a;
      }
    }
  }

  .log-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    min-width: 120px;
  }

  .log-timestamp {
    color: ${(props) => props.theme.terminal?.timestampColor || props.theme.textSecondary || '#858585'};
    font-size: 11px;
    font-weight: 400;
  }

  .log-level {
    font-size: 9px;
    font-weight: 600;
    padding: 2px 4px;
    border-radius: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .log-icon {
    flex-shrink: 0;
  }

  .log-message {
    color: ${(props) => props.theme.terminal?.messageColor || props.theme.text || '#cccccc'};
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
  }

  /* Custom scrollbar */
  .terminal-content::-webkit-scrollbar {
    width: 8px;
  }

  .terminal-content::-webkit-scrollbar-track {
    background: ${(props) => props.theme.terminal?.scrollbarTrack || props.theme.bg || '#2d2d30'};
  }

  .terminal-content::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.terminal?.scrollbarThumb || '#5a5a5a'};
    border-radius: 4px;
  }

  .terminal-content::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.terminal?.scrollbarThumbHover || '#6a6a6a'};
  }

  /* Light theme styles */
  ${(props) => props.theme.name === 'light' || props.theme.mode === 'light' ? `
    background: #f8f9fa;
    border-top-color: #dee2e6;
    
    .terminal-header {
      background: #f8f9fa;
      border-bottom-color: #dee2e6;
    }
    
    .terminal-title {
      color: #212529;
      
      .log-count {
        color: #6c757d;
      }
    }
    
    .control-button {
      color: #495057;
      
      &:hover {
        background: #e9ecef;
        color: #212529;
      }
    }
    
    .filter-dropdown-trigger {
      color: #495057;
      border-color: #dee2e6;
      
      &:hover {
        background: #e9ecef;
        color: #212529;
        border-color: #adb5bd;
      }
    }
    
    .filter-dropdown-menu {
      background: #ffffff;
      border-color: #dee2e6;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .filter-dropdown-header {
      background: #f8f9fa;
      border-bottom-color: #dee2e6;
      color: #212529;
    }
    
    .filter-toggle-all {
      color: #0d6efd;
      
      &:hover {
        background: #e9ecef;
        color: #0b5ed7;
      }
    }
    
    .filter-option {
      &:hover {
        background: #f8f9fa;
      }
    }
    
    .filter-option-label {
      color: #212529;
    }
    
    .filter-option-count {
      color: #6c757d;
    }
    
    .terminal-content {
      background: #ffffff;
    }
    
    .log-entry {
      &:hover {
        background: rgba(0, 0, 0, 0.03);
      }
    }
    
    .log-timestamp {
      color: #6c757d;
    }
    
    .log-message {
      color: #212529;
    }
    
    .terminal-empty {
      color: #6c757d;
    }
    
    .terminal-resize-handle {
      &:hover, &:active {
        background: #0d6efd;
      }
    }
    
    .terminal-content::-webkit-scrollbar-track {
      background: #f8f9fa;
    }
    
    .terminal-content::-webkit-scrollbar-thumb {
      background: #ced4da;
    }
    
    .terminal-content::-webkit-scrollbar-thumb:hover {
      background: #adb5bd;
    }
  ` : ''}

  /* Dark theme styles */
  ${(props) => props.theme.name === 'dark' || props.theme.mode === 'dark' ? `
    background: #1e1e1e;
    border-top-color: #3c3c3c;
    
    .terminal-header {
      background: #2d2d30;
      border-bottom-color: #3c3c3c;
    }
    
    .terminal-title {
      color: #cccccc;
      
      .log-count {
        color: #858585;
      }
    }
    
    .control-button {
      color: #cccccc;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }
    
    .filter-dropdown-trigger {
      color: #cccccc;
      border-color: #3c3c3c;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .filter-dropdown-menu {
      background: #2d2d30;
      border-color: #3c3c3c;
    }
    
    .filter-dropdown-header {
      background: #3c3c3c;
      border-bottom-color: #3c3c3c;
      color: #cccccc;
    }
    
    .filter-toggle-all {
      color: #0078d4;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #4fc3f7;
      }
    }
    
    .filter-option {
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }
    
    .filter-option-label {
      color: #cccccc;
    }
    
    .filter-option-count {
      color: #858585;
    }
    
    .terminal-content {
      background: #1e1e1e;
    }
    
    .log-entry {
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }
    
    .log-timestamp {
      color: #858585;
    }
    
    .log-message {
      color: #cccccc;
    }
    
    .terminal-empty {
      color: #858585;
    }
    
    .terminal-resize-handle {
      &:hover, &:active {
        background: #0078d4;
      }
    }
  ` : ''}

  /* Responsive design */
  @media (max-width: 768px) {
    .terminal-header {
      padding: 6px 12px;
    }

    .filter-controls {
      gap: 2px;
    }

    .filter-dropdown-trigger {
      padding: 4px 6px;
      font-size: 11px;
    }

    .log-entry {
      padding: 3px 12px;
      font-size: 11px;
    }

    .log-meta {
      min-width: 100px;
      gap: 6px;
    }
  }
`;

export default StyledWrapper; 