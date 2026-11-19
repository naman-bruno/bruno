import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 1rem;

  &:not(:first-child) {
    border-top: 1px solid ${(props) => props.theme.border.border1};
  }

  .mcp-client-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 0.125rem;
  }

  .mcp-client-name {
    font-size: ${(props) => props.theme.font.size.base};
    font-weight: 500;
  }

  .mcp-client-status {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.muted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.has-error {
      color: ${(props) => props.theme.status.danger.text};
    }
  }

  .mcp-client-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .mcp-installed-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.status.success.text};
  }
`;

export default StyledWrapper;
