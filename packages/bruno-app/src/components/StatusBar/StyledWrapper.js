import styled from 'styled-components';

const StyledWrapper = styled.div`
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 36px;
    background: ${(props) => props.theme.statusBar?.bg || props.theme.sidebar.bg};
    border-top: 1px solid ${(props) => props.theme.statusBar?.borderColor || props.theme.sidebar.borderColor};
    color: ${(props) => props.theme.statusBar?.color || props.theme.sidebar.color};
    font-size: 13px;
    user-select: none;
    backdrop-filter: blur(8px);
    position: relative;
    z-index: 20;
  }

  .status-bar-section {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .status-bar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .status-bar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: ${(props) => props.theme.statusBar?.buttonColor || props.theme.sidebar.color};
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:active {
      transform: translateY(0);
      background: ${(props) => props.theme.statusBar?.buttonActiveBg || 'rgba(255,255,255,0.12)'};
    }
    
    &:focus {
      outline: none;
      opacity: 1;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px ${(props) => props.theme.statusBar?.focusColor || props.theme.button.secondary.focusBorder};
    }

    &.has-errors {
      color: #f14c4c;
      opacity: 1;
      
      &:hover {
        background: rgba(241, 76, 76, 0.1);
        color: #f14c4c;
      }
    }

    svg {
      flex-shrink: 0;
    }
  }

  .terminal-button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .error-indicator {
    position: absolute;
    top: -6px;
    right: -8px;
    display: flex;
    align-items: center;
    gap: 1px;
    background: #f14c4c;
    color: white;
    border-radius: 8px;
    padding: 1px 4px;
    font-size: 9px;
    font-weight: 600;
    line-height: 1;
    min-width: 16px;
    height: 12px;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    animation: pulse 2s infinite;

    .error-count {
      font-size: 8px;
      margin-left: 1px;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(0.95);
    }
  }

  .status-bar-notifications {
    display: flex;
    align-items: center;
    position: relative;
    
    /* Ensure notifications modal renders above status bar */
    & > div {
      position: relative;
      z-index: 1;
    }
  }

  .status-bar-divider {
    width: 1px;
    height: 20px;
    background: ${(props) => props.theme.statusBar?.dividerColor || props.theme.sidebar.borderColor};
    margin: 0 8px;
    opacity: 0.3;
  }

  .status-bar-version {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 500;
    color: ${(props) => props.theme.statusBar?.versionColor || props.theme.text};
    opacity: 0.6;
    background: ${(props) => props.theme.statusBar?.versionBg || 'rgba(255,255,255,0.05)'};
    border-radius: 12px;
    border: 1px solid ${(props) => props.theme.statusBar?.versionBorder || 'rgba(255,255,255,0.1)'};
    font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
      background: ${(props) => props.theme.statusBar?.versionHoverBg || 'rgba(255,255,255,0.08)'};
    }
  }

  /* Dark theme optimizations */
  [data-theme="dark"] & {
    .status-bar {
      background: ${(props) => props.theme.statusBar?.bg || '#1a1a1a'};
      border-top-color: ${(props) => props.theme.statusBar?.borderColor || '#333'};
    }

    .status-bar-button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .status-bar-version {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }

  /* Light theme optimizations */
  [data-theme="light"] & {
    .status-bar {
      background: ${(props) => props.theme.statusBar?.bg || '#f8f9fa'};
      border-top-color: ${(props) => props.theme.statusBar?.borderColor || '#e9ecef'};
    }

    .status-bar-button:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .status-bar-version {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.1);
      color: #6c757d;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .status-bar {
      padding: 0 12px;
      height: 32px;
    }

    .status-bar-button {
      width: 24px;
      height: 24px;
      padding: 4px;
    }

    .status-bar-version {
      font-size: 10px;
      padding: 2px 6px;
    }
  }
`;

export default StyledWrapper; 