import styled from 'styled-components';

const StyledWrapper = styled.div`
  .collection-selector {
    margin-top: 0.5rem;

    .collection-option {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
      border: 1px solid ${(props) => props.theme.modal.input.border};
      margin-bottom: 0.5rem;

      &:hover {
        background-color: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      }

      &.selected {
        background-color: ${(props) => props.theme.modal.input.bg};
        border-color: ${(props) => props.theme.colors.primary || '#3b82f6'};
      }

      .collection-icon {
        margin-right: 0.5rem;
        color: ${(props) => props.theme.colors.text.muted};
      }

      .collection-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .folder-path-input {
    margin-top: 1rem;

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid ${(props) => props.theme.modal.input.border};
      border-radius: 0.25rem;
      background-color: ${(props) => props.theme.modal.input.bg};
      color: ${(props) => props.theme.text};

      &:focus {
        outline: none;
        border-color: ${(props) => props.theme.colors.primary || '#3b82f6'};
      }
    }

    .help-text {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.text.muted};
      margin-top: 0.25rem;
    }
  }

  .no-collections-message {
    text-align: center;
    padding: 1.5rem;
    color: ${(props) => props.theme.colors.text.muted};

    .icon {
      margin-bottom: 0.5rem;
    }

    .message {
      font-size: 0.875rem;
    }

    .hint {
      font-size: 0.75rem;
      margin-top: 0.25rem;
      opacity: 0.75;
    }
  }
`;

export default StyledWrapper;
