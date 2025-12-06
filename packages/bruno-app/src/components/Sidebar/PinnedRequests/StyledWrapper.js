import styled from 'styled-components';

const StyledWrapper = styled.div`
  background-color: ${(props) => props.theme.sidebar.bg};
  border-top: 1px solid ${(props) => props.theme.sidebar.border || props.theme.sidebar.dragbar.border};

  .pinned-requests-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${(props) => props.theme.sidebar.muted || props.theme.colors.text.muted};
    letter-spacing: 0.025em;

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        border-radius: 0.25rem;
        cursor: pointer;
        color: ${(props) => props.theme.colors.text.muted};
        opacity: 0;
        transition: opacity 0.15s ease;

        &:hover {
          background-color: ${(props) => props.theme.sidebar.collection.item.hoverBg};
          color: ${(props) => props.theme.sidebar.color};
        }
      }
    }

    &:hover .header-actions .action-btn {
      opacity: 1;
    }
  }

  .pinned-requests-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .pinned-request-item {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    padding-left: 1rem;
    cursor: pointer;
    user-select: none;
    height: 1.75rem;
    position: relative;

    &:hover {
      background-color: ${(props) => props.theme.sidebar.collection.item.hoverBg};

      .pinned-request-actions {
        opacity: 1;
      }
    }

    &.active {
      background-color: ${(props) => props.theme.sidebar.collection.item.bg};
    }

    &.drop-target {
      background-color: ${(props) => props.theme.dragAndDrop?.hoverBg || 'rgba(0, 0, 0, 0.05)'};
    }

    .request-method {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 0.375rem;
      min-width: 1.75rem;
    }

    .request-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8125rem;
    }

    .scratchpad-badge {
      font-size: 0.625rem;
      padding: 0.0625rem 0.25rem;
      border-radius: 0.1875rem;
      background-color: ${(props) => props.theme.colors.warning || '#f59e0b'};
      color: white;
      margin-left: 0.375rem;
      font-weight: 500;
    }

    .pinned-request-actions {
      display: flex;
      align-items: center;
      gap: 0.125rem;
      margin-left: 0.25rem;
      opacity: 0;
      transition: opacity 0.15s ease;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        border-radius: 0.25rem;
        cursor: pointer;
        color: ${(props) => props.theme.colors.text.muted};

        &:hover {
          background-color: ${(props) => props.theme.colors.bg.danger || '#fee2e2'};
          color: ${(props) => props.theme.colors.danger || '#ef4444'};
        }
      }
    }
  }

  .empty-state {
    padding: 0.75rem;
    text-align: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: 0.75rem;

    .hint {
      margin-top: 0.25rem;
      font-size: 0.6875rem;
      opacity: 0.75;
    }
  }
`;

export default StyledWrapper;
