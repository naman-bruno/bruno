import styled from 'styled-components';

const StyledWrapper = styled.div`
  .operation-details-panel {
    overflow: auto;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${props => props.theme.console.bg};
    border-left: 1px solid ${props => props.theme.console.border};
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid ${props => props.theme.console.border};
    background: ${props => props.theme.console.headerBg};
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: ${props => props.theme.console.titleColor};
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
      color: ${props => props.theme.console.buttonHoverColor};
    }
  }

  .operation-info {
    padding: 12px;
    border-bottom: 1px solid ${props => props.theme.console.border};
    background: ${props => props.theme.console.contentBg};
  }

  .info-row {
    display: flex;
    margin-bottom: 6px;
    font-size: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .label {
    min-width: 80px;
    color: ${props => props.theme.console.textMuted};
    font-weight: 500;
  }

  .value {
    color: ${props => props.theme.console.textColor};
    flex: 1;
    word-break: break-all;

    &.operation-type {
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;

      &.read {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      &.write {
        background: rgba(249, 115, 22, 0.1);
        color: #f97316;
      }
    }

    &.file-path {
      font-family: monospace;
      font-size: 11px;
    }
  }

  .panel-tabs {
    display: flex;
    border-bottom: 1px solid ${props => props.theme.console.border};
    background: ${props => props.theme.console.headerBg};
  }

  .panel-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    font-size: 11px;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
      color: ${props => props.theme.console.buttonHoverColor};
    }

    &.active {
      color: ${props => props.theme.console.checkboxColor};
      border-bottom-color: ${props => props.theme.console.checkboxColor};
      background: ${props => props.theme.console.contentBg};
    }
  }

  .panel-content {
    min-height: 200px;
    flex: 1;
    overflow: hidden;
    background: ${props => props.theme.console.contentBg};
  }

  .content-area {
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  /* Scrollbar */
  .content-area::-webkit-scrollbar {
    width: 6px;
  }

  .content-area::-webkit-scrollbar-track {
    background: ${props => props.theme.console.bg};
  }

  .content-area::-webkit-scrollbar-thumb {
    background: ${props => props.theme.console.border};
    border-radius: 3px;
  }

  .content-area::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.console.buttonColor};
  }
`;

export default StyledWrapper;
