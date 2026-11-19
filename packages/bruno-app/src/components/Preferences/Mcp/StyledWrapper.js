import styled from 'styled-components';

const StyledWrapper = styled.div`
  color: ${(props) => props.theme.text};

  .mcp-section-title {
    text-transform: uppercase;
    font-size: ${(props) => props.theme.font.size.sm};
    letter-spacing: 0.05em;
    color: ${(props) => props.theme.colors.text.muted};
    margin-bottom: 0.75rem;
  }

  .mcp-clients-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .mcp-section-title {
      margin-bottom: 0;
    }

    margin-bottom: 0.5rem;
  }

  .mcp-card {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.md};
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .mcp-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    gap: 1rem;
    background: ${(props) => props.theme.background.surface0};
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .mcp-card-title {
    font-size: ${(props) => props.theme.font.size.md};
    font-weight: 600;
  }

  .mcp-docs-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: ${(props) => props.theme.font.size.base};
    color: ${(props) => props.theme.colors.text.muted};

    &:hover {
      color: ${(props) => props.theme.text};
    }
  }

  .mcp-card-body {
    padding: 0.875rem 1rem;
  }

  .mcp-description {
    font-size: ${(props) => props.theme.font.size.base};
    color: ${(props) => props.theme.colors.text.muted};
    line-height: 1.5;
    margin: 0 0 0.75rem 0;
  }

  .mcp-command {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: ${(props) => props.theme.border.radius.sm};
    background: ${(props) => props.theme.background.surface0};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .mcp-placeholder {
    padding: 0.75rem 1rem;
    font-size: ${(props) => props.theme.font.size.base};
    color: ${(props) => props.theme.colors.text.muted};
  }

  .mcp-placeholder.has-error {
    color: ${(props) => props.theme.status.danger.text};
  }
`;

export default StyledWrapper;
