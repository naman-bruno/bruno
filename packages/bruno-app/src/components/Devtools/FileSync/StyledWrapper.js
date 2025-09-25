import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.console.bg};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Tab Content */
  .tab-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: ${props => props.theme.console.headerBg};
    border-bottom: 1px solid ${props => props.theme.console.border};
    flex-shrink: 0;
  }

  .tab-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${props => props.theme.console.titleColor};
    font-size: 13px;
    font-weight: 500;
  }

  .tab-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .clear-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: transparent;
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 3px;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    font-size: 11px;
    transition: all 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.headerBg};
    }
  }

  .tab-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-content-area {
    flex: 1;
    overflow-y: auto;
    background: ${props => props.theme.console.contentBg};
    min-height: 0;
  }

  /* FileSync Container */
  .filesync-container {
    display: flex;
    height: 100%;
    flex: 1;
  }

  .filesync-sidebar {
    width: 160px;
    border-right: 1px solid ${props => props.theme.console.border};
    background: ${props => props.theme.console.headerBg};
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
    color: ${props => props.theme.console.buttonColor};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;

    &.active {
      background: ${props => props.theme.console.contentBg};
      color: ${props => props.theme.console.checkboxColor};
    }

    span:nth-child(2) {
      flex: 1;
    }
  }

  .tab-count {
    background: rgba(255, 255, 255, 0.1);
    color: ${props => props.theme.console.buttonColor};
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

  /* FileSync Header */
  .filesync-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: ${props => props.theme.console.headerBg};
    border-bottom: 1px solid ${props => props.theme.console.border};
    flex-shrink: 0;
    position: relative;
  }

  .filesync-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    font-weight: 500;
    border-radius: 4px 4px 0 0;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
      color: ${props => props.theme.console.buttonHoverColor};
    }

    &.active {
      color: ${props => props.theme.console.checkboxColor};
      border-bottom-color: ${props => props.theme.console.checkboxColor};
      background: ${props => props.theme.console.contentBg};
    }

    .tab-badge {
      background: rgba(255, 255, 255, 0.15);
      color: inherit;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 8px;
      min-width: 14px;
      text-align: center;
      font-weight: 600;

      &.error {
        background: #e81123;
        color: white;
      }
    }

    &:not(.active) .tab-badge {
      background: ${props => props.theme.console.border};
      color: ${props => props.theme.console.buttonColor};
    }
  }

  .filesync-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: ${props => props.theme.console.buttonColor};
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .filesync-content {
    flex: 1;
    overflow: hidden;
    background: ${props => props.theme.console.contentBg};
    min-height: 0;
    display: flex;
  }

  /* Control Buttons */
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
      color: ${props => props.theme.console.buttonHoverColor};
    }

    &.clear-button {
      border-color: #e81123;
      color: #e81123;
      width: auto;

      &:hover {
        background: #e81123;
        color: white;
      }
    }
  }

  /* Filter Controls */
  .filter-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    padding-right: 8px;
    border-right: 1px solid ${props => props.theme.console.border};
  }

  .filter-dropdown {
    position: relative;
  }

  .filter-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
      border-color: ${props => props.theme.console.checkboxColor};
    }

    &.active {
      background: ${props => props.theme.console.checkboxColor};
      color: white;
      border-color: ${props => props.theme.console.checkboxColor};
    }

    &.partial {
      background: #f59e0b;
      color: white;
      border-color: #f59e0b;
    }
  }

  .filter-dropdown-menu {
    position: absolute;
    top: 100%;
    z-index: 1000;
    min-width: 200px;
    background: ${props => props.theme.console.contentBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 2px;

    &.right {
      right: 0;
    }
  }

  .filter-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid ${props => props.theme.console.border};
    font-size: 12px;
    font-weight: 500;
    color: ${props => props.theme.console.titleColor};
  }

  .filter-toggle-all {
    background: none;
    border: none;
    color: ${props => props.theme.console.checkboxColor};
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.buttonHoverBg};
    }
  }

  .filter-dropdown-body {
    padding: 4px 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .filter-dropdown-item {
    padding: 2px 0;
  }

  .filter-checkbox {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.15s ease;

    &:hover {
      background: ${props => props.theme.console.logHoverBg};
    }

    input {
      display: none;
    }

    .filter-checkbox-indicator {
      width: 14px;
      height: 14px;
      border: 1px solid ${props => props.theme.console.border};
      border-radius: 2px;
      margin-right: 8px;
      position: relative;
      flex-shrink: 0;

      &::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 1px;
        width: 4px;
        height: 7px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
      }
    }

    input:checked + .filter-checkbox-indicator {
      background: ${props => props.theme.console.checkboxColor};
      border-color: ${props => props.theme.console.checkboxColor};

      &::after {
        opacity: 1;
      }
    }

    .filter-checkbox-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .filter-label {
      color: ${props => props.theme.console.titleColor};
      text-transform: capitalize;
    }

    .filter-count {
      color: ${props => props.theme.console.buttonColor};
      font-size: 11px;
      margin-left: auto;
    }
  }

  .filter-dropdown-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }

  /* Overview Tab */
  .overview-tab {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .overview-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .system-resources {
    margin-bottom: 16px;

    h2 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.theme.console.titleColor};
    }
  }

  .resource-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .resource-card {
    background: ${props => props.theme.console.headerBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    padding: 8px;
  }

  .resource-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: ${props => props.theme.console.titleColor};
  }

  .resource-title {
    font-size: 12px;
    font-weight: 500;
  }

  .resource-value {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
    margin-bottom: 2px;
  }

  .resource-subtitle {
    font-size: 11px;
    color: ${props => props.theme.console.buttonColor};
  }

  .resource-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    margin-top: 8px;

    &.up {
      color: #10b981;
    }

    &.down {
      color: #e81123;
    }

    &.stable {
      color: ${props => props.theme.console.buttonColor};
    }
  }

  .stats-grid {
    display: grid;
    gap: 16px;
  }

  .stats-section {
    h3 {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: ${props => props.theme.console.titleColor};
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: ${props => props.theme.console.headerBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
  }

  .stat-icon {
    color: ${props => props.theme.console.titleColor};
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
    margin-bottom: 1px;
  }

  .stat-label {
    font-size: 11px;
    color: ${props => props.theme.console.buttonColor};
  }

  .operation-breakdown {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .operation-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: ${props => props.theme.console.headerBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    min-width: 80px;
  }

  .operation-name {
    font-size: 12px;
    color: ${props => props.theme.console.titleColor};
    text-transform: capitalize;
  }

  .operation-count {
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
  }

  .recent-operations {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 150px;
    overflow-y: auto;
  }

  .recent-operation {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: ${props => props.theme.console.headerBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 3px;
    font-size: 11px;
  }

  .operation-type {
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;

    &.add {
      background: #10b981;
      color: white;
    }

    &.change {
      background: #f59e0b;
      color: white;
    }

    &.unlink {
      background: #e81123;
      color: white;
    }

    &.addDir,
    &.unlinkDir {
      background: #3b82f6;
      color: white;
    }
  }

  .operation-file {
    flex: 1;
    color: ${props => props.theme.console.titleColor};
    font-family: ${props => props.theme.fontFamily || 'monospace'};
  }

  .operation-time {
    color: ${props => props.theme.console.buttonColor};
    font-size: 11px;
  }

  /* Operations Tab */
  .operations-tab,
  .debug-tab {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .operations-tab,
  .events-tab,
  .debug-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .operations-content,
  .events-content,
  .debug-content {
    flex: 1;
    overflow-y: auto;
    background: ${props => props.theme.console.contentBg};
    min-height: 0;
  }

  .operations-empty,
  .events-empty,
  .debug-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${props => props.theme.console.buttonColor};
    text-align: center;
    gap: 12px;

    p {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      color: ${props => props.theme.console.titleColor};
    }

    span {
      font-size: 14px;
      opacity: 0.7;
    }
  }



  /* Operations Container - Network style */
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
    background: ${props => props.theme.console.headerBg};
    border-bottom: 1px solid ${props => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
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
    border-bottom: 1px solid ${props => props.theme.console.border};
    cursor: pointer;
    transition: background-color 0.1s ease;
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${props => props.theme.console.logHoverBg};
    }

    &.selected {
      background: ${props => props.theme.console.buttonHoverBg};
      border-left: 3px solid ${props => props.theme.console.checkboxColor};
    }
  }

  .operation-icon {
    display: flex;
    align-items: center;
    justify-content: center;
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
      color: ${props => props.theme.console.messageColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .operation-path {
    .file-path {
      color: ${props => props.theme.console.textMuted};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 11px;
    }
  }

  .operation-size,
  .operation-time {
    color: ${props => props.theme.console.textColor};
    font-size: 11px;

    &.text-right {
      text-align: right;
    }
  }

  .operation-time {
    font-family: monospace;
  }

  /* Errors Container - Network style similar to operations */
  .errors-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
  }

  .errors-header {
    display: grid;
    grid-template-columns: 80px 150px 2fr 120px 100px;
    gap: 12px;
    padding: 8px 16px;
    background: ${props => props.theme.console.headerBg};
    border-bottom: 1px solid ${props => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
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
    grid-template-columns: 80px 150px 2fr 120px 100px;
    gap: 12px;
    padding: 6px 16px;
    border-bottom: 1px solid ${props => props.theme.console.border};
    cursor: pointer;
    transition: background-color 0.1s ease;
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${props => props.theme.console.logHoverBg};
    }

    &.selected {
      background: ${props => props.theme.console.buttonHoverBg};
      border-left: 3px solid ${props => props.theme.console.checkboxColor};
    }
  }

  .error-icon-cell {
    display: flex;
    align-items: center;
    justify-content: center;

    .error-icon {
      &.syntax {
        color: #f59e0b;
      }
      &.parsing {
        color: #ef4444;
      }
      &.runtime {
        color: #8b5cf6;
      }
    }
  }

  .error-badge {
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
    min-width: 50px;

    &.syntax {
      background: #f59e0b;
    }
    &.parsing {
      background: #ef4444;
    }
    &.runtime {
      background: #8b5cf6;
    }
  }

  .error-file-cell {
    .error-file {
      .filename {
        font-weight: 500;
        color: ${props => props.theme.console.messageColor};
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .directory {
        color: ${props => props.theme.console.textMuted};
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
    .error-message {
      color: ${props => props.theme.console.messageColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 11px;
    }
  }

  .error-collection-cell {
    .collection-name {
      color: ${props => props.theme.console.textColor};
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .error-time-cell {
    .error-time {
      color: ${props => props.theme.console.textColor};
      font-size: 11px;
      font-family: monospace;
      text-align: right;
    }
  }

  .errors-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${props => props.theme.console.textMuted};
    text-align: center;
    padding: 40px;

    svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
    }

    span {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  /* Events Container - Network style similar to operations */
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
    background: ${props => props.theme.console.headerBg};
    border-bottom: 1px solid ${props => props.theme.console.border};
    font-size: 11px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
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
    border-bottom: 1px solid ${props => props.theme.console.border};
    font-size: 12px;
    align-items: center;

    &:hover {
      background: ${props => props.theme.console.logHoverBg};
    }
  }

  .event-type-cell {
    display: flex;
    align-items: center;
  }

  .event-file-cell {
    .file-name {
      font-weight: 500;
      color: ${props => props.theme.console.messageColor};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .event-path-cell {
    .file-path {
      color: ${props => props.theme.console.textMuted};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 11px;
    }
  }

  .event-time-cell {
    color: ${props => props.theme.console.textColor};
    font-size: 11px;
    font-family: monospace;

    &.text-right {
      text-align: right;
    }
  }





  .file-name {
    font-weight: 500;
    color: ${props => props.theme.console.textColor};
  }

  .file-path {
    color: ${props => props.theme.console.textMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .operation-icon,
  .event-icon {
    &.read {
      color: #22c55e;
    }

    &.write {
      color: #f97316;
    }

    &.add {
      color: #22c55e;
    }

    &.change {
      color: #3b82f6;
    }

    &.unlink {
      color: #ef4444;
    }

    &.addDir {
      color: #a855f7;
    }

    &.unlinkDir {
      color: #ef4444;
    }
  }

  .operation-entry,
  .error-entry {
    display: flex;
    gap: 8px;
    padding: 6px;
    border-radius: 3px;
    margin-bottom: 2px;
    background: ${props => props.theme.console.headerBg};
    border: 1px solid ${props => props.theme.console.border};
  }

  .operation-meta,
  .error-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 50px;
    font-size: 10px;
    color: ${props => props.theme.console.buttonColor};
  }

  .operation-content,
  .error-content {
    flex: 1;
    min-width: 0;
  }

  .operation-header,
  .error-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .operation-path,
  .error-path {
    font-family: ${props => props.theme.fontFamily || 'monospace'};
    font-size: 12px;
    
    .path-directory {
      color: ${props => props.theme.console.buttonColor};
    }

    .path-filename {
      color: ${props => props.theme.console.titleColor};
      font-weight: 500;
    }
  }

  .operation-type,
  .error-type {
    font-size: 9px;
    border-radius: 8px;
    color: white;
    text-transform: uppercase;
    font-weight: 600;
  }

  .operation-collection,
  .error-collection {
    font-size: 11px;
    color: ${props => props.theme.console.buttonColor};
    margin-bottom: 2px;
  }

  .operation-details {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: 10px;
  }

  .detail-item {
    padding: 1px 4px;
    border-radius: 2px;
    background: ${props => props.theme.console.border};
    color: ${props => props.theme.console.buttonColor};

    &.loading {
      background: #f59e0b;
      color: white;
    }

    &.complete {
      background: #10b981;
      color: white;
    }

    &.partial {
      background: #3b82f6;
      color: white;
    }

    &.error {
      background: #e81123;
      color: white;
    }
  }

  .operation-icon,
  .error-icon {
    &.add {
      color: #10b981;
    }

    &.change {
      color: #f59e0b;
    }

    &.unlink {
      color: #e81123;
    }

    &.addDir,
    &.unlinkDir {
      color: #3b82f6;
    }

    &.syntax {
      color: #f59e0b;
    }

    &.parsing {
      color: #e81123;
    }

    &.runtime {
      color: #3b82f6;
    }
  }

  .operation-timestamp,
  .error-timestamp {
    font-family: ${props => props.theme.fontFamily || 'monospace'};
  }

  /* Debug Tab */
  .errors-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-bottom: 8px;
    margin-top: 8px;
    background: rgba(248, 113, 113, 0.1);
    color: #e81123;
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
  }

  .error-details {
    margin-top: 4px;
  }

  .error-message {
    font-size: 13px;
    color: ${props => props.theme.console.titleColor};
    margin-bottom: 8px;
    font-family: ${props => props.theme.fontFamily || 'monospace'};
  }

  .error-stack-container {
    margin-top: 8px;
  }

  .stack-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: ${props => props.theme.console.buttonColor};
    cursor: pointer;
    font-size: 12px;
    padding: 4px 0;
    transition: color 0.2s ease;

    &:hover {
      color: ${props => props.theme.console.titleColor};
    }
  }

  .error-stack {
    margin: 8px 0 0 0;
    padding: 12px;
    background: ${props => props.theme.console.bg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 4px;
    font-family: ${props => props.theme.fontFamily || 'monospace'};
    font-size: 11px;
    color: ${props => props.theme.console.buttonColor};
    white-space: pre-wrap;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
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
    background: ${props => props.theme.console.border};
    border-radius: 3px;

    &:hover {
      background: ${props => props.theme.console.buttonColor};
    }
  }
`;

export default StyledWrapper;
