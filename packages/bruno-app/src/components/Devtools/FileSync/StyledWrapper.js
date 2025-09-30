import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.console.bg};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* FileSync Container */
  .filesync-container {
    display: flex;
    height: 100%;
    flex: 1;
  }

  .filesync-sidebar {
    width: 160px;
    border-right: 1px solid ${(props) => props.theme.console.border};
    background: ${(props) => props.theme.console.headerBg};
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }

  .sidebar-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: ${(props) => props.theme.console.buttonColor};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;

    &.active {
      background: ${(props) => props.theme.console.contentBg};
      color: ${(props) => props.theme.console.checkboxColor};
    }

    span:nth-child(2) {
      flex: 1;
    }
  }

  .tab-count {
    background: rgba(255, 255, 255, 0.1);
    color: ${(props) => props.theme.console.buttonColor};
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 8px;
    min-width: 16px;
    text-align: center;

    &.error {
      background: rgba(239, 68, 68, 0.2);
      color: #ff6b6b;
    }
  }

  .filesync-content {
    display: flex;
    flex-direction: row;
    flex: 1;
    overflow: hidden;
    background: ${(props) => props.theme.console.contentBg};
    min-height: 0;
  }

  .filesync-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .filesync-details {
    width: 400px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Operations Tab */
  .operations-tab,
  .events-tab {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .operations-content,
  .events-content {
    flex: 1;
    overflow-y: auto;
    background: ${(props) => props.theme.console.contentBg};
    min-height: 0;
  }

  .operations-empty,
  .events-empty,
  .errors-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${(props) => props.theme.console.textMuted};
    text-align: center;
    padding: 40px;
    gap: 12px;

    svg {
      opacity: 0.5;
    }

    p {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: ${(props) => props.theme.console.titleColor};
    }

    span {
      font-size: 14px;
      opacity: 0.7;
    }
  }

  /* Operations Container - Table-like layout */
  .operations-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
  }

  .operations-header {
    display: grid;
    grid-template-columns: 80px 150px 1fr 80px 100px;
    gap: 12px;
    padding: 8px 16px;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${(props) => props.theme.console.titleColor};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .operations-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .operation-row {
    display: grid;
    grid-template-columns: 80px 150px 1fr 80px 100px;
    gap: 12px;
    padding: 6px 16px;
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    cursor: pointer;
    transition: background-color 0.1s ease;
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${(props) => props.theme.console.logHoverBg};
    }

    &.selected {
      background: ${(props) => props.theme.console.buttonHoverBg};
      border-left: 3px solid ${(props) => props.theme.console.checkboxColor};
    }
  }

  .operation-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    min-width: 45px;

    &.read {
      background: #22c55e;
    }

    &.write {
      background: #f97316;
    }

    &.add {
      background: #10b981;
    }

    &.change {
      background: #3b82f6;
    }

    &.unlink {
      background: #ef4444;
    }

    &.addDir {
      background: #a855f7;
    }

    &.unlinkDir {
      background: #ef4444;
    }
  }

  .operation-file {
    .file-name {
      font-weight: 500;
      color: ${(props) => props.theme.console.messageColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .operation-path {
    .file-path {
      color: ${(props) => props.theme.console.textMuted};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 11px;
    }
  }

  .operation-size,
  .operation-time {
    color: ${(props) => props.theme.console.textColor};
    font-size: 11px;

    &.text-right {
      text-align: right;
    }
  }

  .operation-time {
    font-family: monospace;
  }

  /* Events Container - Table-like layout */
  .events-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
  }

  .events-header {
    display: grid;
    grid-template-columns: 80px 150px 1fr 100px;
    gap: 12px;
    padding: 8px 16px;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${(props) => props.theme.console.titleColor};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .events-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .event-row {
    display: grid;
    grid-template-columns: 80px 150px 1fr 100px;
    gap: 12px;
    padding: 6px 16px;
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${(props) => props.theme.console.logHoverBg};
    }
  }

  .event-type-cell,
  .event-file-cell,
  .event-path-cell,
  .event-time-cell {
    overflow: hidden;
  }

  .event-file-cell .file-name,
  .event-path-cell .file-path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .event-file-cell .file-name {
    font-weight: 500;
    color: ${(props) => props.theme.console.messageColor};
  }

  .event-path-cell .file-path {
    color: ${(props) => props.theme.console.textMuted};
    font-family: monospace;
    font-size: 11px;
  }

  .event-time-cell {
    color: ${(props) => props.theme.console.textColor};
    font-size: 11px;
    font-family: monospace;

    &.text-right {
      text-align: right;
    }
  }

  /* Errors Container - Table-like layout */
  .errors-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
  }

  .errors-header {
    display: grid;
    grid-template-columns: 200px 2fr 140px 100px;
    gap: 12px;
    padding: 8px 16px;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${(props) => props.theme.console.titleColor};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .errors-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .error-row {
    display: grid;
    grid-template-columns: 200px 2fr 140px 100px;
    gap: 12px;
    padding: 6px 16px;
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    cursor: pointer;
    transition: background-color 0.1s ease;
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${(props) => props.theme.console.logHoverBg};
    }

    &.selected {
      background: ${(props) => props.theme.console.buttonHoverBg};
      border-left: 3px solid ${(props) => props.theme.console.checkboxColor};
    }
  }

  .error-file-cell {
    overflow: hidden;
    
    .error-file {
      .filename {
        font-weight: 500;
        color: ${(props) => props.theme.console.messageColor};
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .directory {
        color: ${(props) => props.theme.console.textMuted};
        font-size: 10px;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: monospace;
      }
    }
  }

  .error-message-cell {
    overflow: hidden;
    
    .error-message {
      color: ${(props) => props.theme.console.messageColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 11px;
    }
  }

  .error-collection-cell {
    overflow: hidden;
    
    .collection-name {
      color: ${(props) => props.theme.console.textColor};
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .error-time-cell {
    .error-time {
      color: ${(props) => props.theme.console.textColor};
      font-size: 11px;
      font-family: monospace;
      text-align: right;
    }
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.console.border};
    border-radius: 3px;

    &:hover {
      background: ${(props) => props.theme.console.buttonColor};
    }
  }
`;

export default StyledWrapper;
