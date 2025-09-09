import styled from 'styled-components';

const Wrapper = styled.div`
  .workspace-sidebar {
    width: 60px;
    height: 100%;
    background-color: ${(props) => props.theme.sidebar.workspace.bg};
    border-right: 1px solid ${(props) => props.theme.sidebar.workspace.border};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 8px;
  }

  .workspace-item {
    width: 48px;
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      background-color: ${(props) => props.theme.sidebar.workspace.item.hoverBg};
    }
    
    &.active {
      background-color: ${(props) => props.theme.sidebar.workspace.item.activeBg};
      
      &::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background-color: ${(props) => props.theme.sidebar.workspace.item.activeIndicator};
        border-radius: 0 2px 2px 0;
      }
    }
    
    &.create-workspace {
      border: 2px dashed ${(props) => props.theme.sidebar.workspace.item.createBorder};
      background-color: transparent;
      
      &:hover {
        border-color: ${(props) => props.theme.sidebar.workspace.item.createBorderHover};
        background-color: ${(props) => props.theme.sidebar.workspace.item.createBgHover};
      }
    }
  }

  .workspace-icon {
    color: ${(props) => props.theme.sidebar.workspace.item.icon};
    margin-bottom: 2px;
    
    .active & {
      color: ${(props) => props.theme.sidebar.workspace.item.activeIcon};
    }
    
    .create-workspace & {
      color: ${(props) => props.theme.sidebar.workspace.item.createIcon};
    }
  }

  .workspace-name {
    font-size: 9px;
    font-weight: 500;
    color: ${(props) => props.theme.sidebar.workspace.item.text};
    text-align: center;
    line-height: 1;
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    
    .active & {
      color: ${(props) => props.theme.sidebar.workspace.item.activeText};
    }
    
    .create-workspace & {
      color: ${(props) => props.theme.sidebar.workspace.item.createText};
    }
  }
`;

export default Wrapper; 