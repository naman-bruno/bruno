import styled from 'styled-components';

const StyledWrapper = styled.div`
  flex-shrink: 0;
  height: 100%;
  position: relative;

  .docs-sidebar {
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.bg};
    color: ${(props) => props.theme.text};
    border-left: 1px solid ${(props) => props.theme.border.border1};
    display: flex;
    flex-direction: column;
  }

  .docs-sidebar-resize-handle {
    position: absolute;
    top: 0;
    left: -3px;
    width: 6px;
    height: 100%;
    display: flex;
    justify-content: center;
    cursor: col-resize;
    z-index: 5;

    .drag-border {
      width: 1px;
      height: 100%;
      border-left: solid 1px transparent;
    }

    &:hover .drag-border {
      border-left-color: ${(props) => props.theme.sidebar.dragbar.border};
    }
  }

  .docs-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
    gap: 8px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .header-icon {
      color: ${(props) => props.theme.colors.text.muted};
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .header-kind {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      background: ${(props) => props.theme.background.surface0};
      color: ${(props) => props.theme.colors.text.muted};
      letter-spacing: 0.03em;
    }

    .header-title {
      font-size: 13px;
      color: ${(props) => props.theme.text};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }

    .icon-btn {
      position: relative;
      padding: 6px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      color: ${(props) => props.theme.colors.text.muted};
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: ${(props) => props.theme.background.surface0};
        color: ${(props) => props.theme.text};
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.close-btn:hover {
        background: ${(props) => props.theme.status.danger.background};
        color: ${(props) => props.theme.colors.text.danger};
      }
    }

    .text-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: transparent;
      border: 1px solid ${(props) => props.theme.border.border1};
      border-radius: 6px;
      cursor: pointer;
      color: ${(props) => props.theme.text};
      font-size: 12px;
      line-height: 1;
      height: 26px;

      &:hover {
        background: ${(props) => props.theme.background.surface0};
      }

      &.primary {
        background: ${(props) => props.theme.brand};
        border-color: ${(props) => props.theme.brand};
        color: ${(props) => (props.theme.mode === 'dark' ? '#000' : '#fff')};

        &:hover {
          filter: brightness(0.95);
        }
      }
    }
  }

  .docs-sidebar-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Reuse of the shared DocsEditor drops its own toolbar / edit chrome in
       here; padding lives on the editor container so scrollbars sit at the
       true edge of the sidebar instead of inside a floating gutter. */
    padding: 8px 12px;

    &.is-editing {
      padding: 8px 12px 12px;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 20px;
    color: ${(props) => props.theme.colors.text.muted};

    .empty-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: ${(props) => props.theme.background.surface0};
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${(props) => props.theme.colors.text.muted};
      margin-bottom: 12px;
    }

    h3 {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: ${(props) => props.theme.text};
    }

    p {
      font-size: 12px;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .empty-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: transparent;
      border: 1px solid ${(props) => props.theme.border.border1};
      border-radius: 6px;
      font-size: 12px;
      color: ${(props) => props.theme.text};
      cursor: pointer;

      &:hover {
        background: ${(props) => props.theme.background.surface0};
      }
    }
  }
`;

export default StyledWrapper;
