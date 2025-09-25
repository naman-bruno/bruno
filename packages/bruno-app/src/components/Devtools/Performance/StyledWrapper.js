import styled from 'styled-components';

const StyledWrapper = styled.div`
  .performance-tab {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${props => props.theme.console.bg};
  }

  .performance-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    max-width: 800px;
  }

  .stat-card {
    background: ${props => props.theme.console.contentBg};
    border: 1px solid ${props => props.theme.console.border};
    border-radius: 6px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;

    &:hover {
      background: ${props => props.theme.console.logHoverBg};
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }

  .stat-content {
    flex: 1;
  }

  .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: ${props => props.theme.console.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: ${props => props.theme.console.titleColor};
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .stat-unit {
    font-size: 14px;
    font-weight: 400;
    color: ${props => props.theme.console.textMuted};
  }
`;

export default StyledWrapper;
