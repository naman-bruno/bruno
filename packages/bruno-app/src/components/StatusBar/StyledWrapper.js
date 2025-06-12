import styled from 'styled-components';

const StyledWrapper = styled.div`
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 22px;
    background: ${(props) => props.theme.sidebar.bg};
    border-top: 1px solid ${(props) => props.theme.sidebar.dragbar};
    color: ${(props) => props.theme.sidebar.color};
    font-size: 12px;
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
    width: 24px;
    height: 20px;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: ${(props) => props.theme.sidebar.color};
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    
    &:hover {
      opacity: 1;
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }
    
    &:active {
      transform: translateY(0);
      background: ${(props) => props.theme.sidebar.collection.item.bg};
    }
    
    &:focus {
      outline: none;
      opacity: 1;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px ${(props) => props.theme.button.secondary.border};
    }

    &.has-errors {
      color: ${(props) => props.theme.colors.text.danger};
      opacity: 1;
      
      &:hover {
        background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
        color: ${(props) => props.theme.colors.text.danger};
      }
    }

    &.terminal-button {
      width: auto;
      padding: 4px 8px;
      min-width: 24px;
    }

    svg {
      flex-shrink: 0;
    }
  }

  .terminal-button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: relative;
  }

  .terminal-label {
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  .error-count-inline {
    font-size: 10px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.text.danger};
    background: ${(props) => props.theme.colors.bg.danger}20;
    padding: 1px 4px;
    border-radius: 4px;
    min-width: 16px;
    text-align: center;
    line-height: 1.2;
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
    height: 16px;
    background: ${(props) => props.theme.sidebar.dragbar};
    margin: 0 8px;
    opacity: 0.3;
  }

  .status-bar-version {
    display: flex;
    align-items: center;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    color: ${(props) => props.theme.sidebar.muted};
    opacity: 0.6;
    background: ${(props) => props.theme.sidebar.collection.item.bg};
    border-radius: 10px;
    border: 1px solid ${(props) => props.theme.sidebar.dragbar};
    font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .status-bar {
      padding: 0 12px;
      height: 20px;
    }

    .status-bar-button {
      width: 20px;
      height: 18px;
      padding: 3px;
      
      &.terminal-button {
        width: auto;
        padding: 3px 6px;
        min-width: 20px;
      }
    }

    .terminal-label {
      font-size: 10px;
    }

    .error-count-inline {
      font-size: 9px;
      padding: 1px 3px;
      min-width: 14px;
    }

    .status-bar-version {
      font-size: 9px;
      padding: 1px 4px;
    }
  }
`;

export default StyledWrapper; 