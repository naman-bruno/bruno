import styled from 'styled-components';

const StyledWrapper = styled.div`
  .error-details-panel {
    overflow: auto;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${(props) => props.theme.console.bg};
    border-left: 1px solid ${(props) => props.theme.console.border};
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    min-height: 36px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: ${(props) => props.theme.console.titleColor};
  }

  .close-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: ${(props) => props.theme.console.textMuted};
    display: flex;
    align-items: center;

    &:hover {
      background: ${(props) => props.theme.console.buttonHoverBg};
      color: ${(props) => props.theme.console.titleColor};
    }
  }

  .error-info {
    padding: 12px;
    border-bottom: 1px solid ${(props) => props.theme.console.border};
  }

  .info-row {
    display: flex;
    margin-bottom: 6px;
    font-size: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: ${(props) => props.theme.console.textMuted};
      width: 80px;
      flex-shrink: 0;
    }

    .value {
      color: ${(props) => props.theme.console.textColor};
      word-break: break-all;
    }
  }

  .panel-tabs {
    display: flex;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    padding: 0;
  }

  .panel-tab {
    background: none;
    border: none;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    color: ${(props) => props.theme.console.textMuted};
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;

    &:hover {
      color: ${(props) => props.theme.console.titleColor};
      background: ${(props) => props.theme.console.buttonHoverBg};
    }

    &.active {
      color: ${(props) => props.theme.console.titleColor};
      border-bottom-color: ${(props) => props.theme.console.checkboxColor};
    }
  }

  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px;
  }

  .error-text-box {
    border: 1px solid ${(props) => props.theme.console.border};
    border-radius: 4px;
    background: ${(props) => props.theme.console.logBg};
    padding: 12px;
    height: 100%;
    overflow: auto;

    pre {
      margin: 0;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: ${(props) => props.theme.console.messageColor};
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
`;

export default StyledWrapper;
