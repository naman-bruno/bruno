import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconPlus, IconFolder, IconHome } from '@tabler/icons';
import { switchWorkspace } from 'providers/ReduxStore/slices/workspaces/actions';
import CreateWorkspace from './CreateWorkspace';
import StyledWrapper from './StyledWrapper';

const WorkspaceSidebar = () => {
  const dispatch = useDispatch();
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);

  const handleWorkspaceClick = (workspaceUid) => {
    dispatch(switchWorkspace(workspaceUid));
  };

  const handleCreateWorkspace = () => {
    setCreateWorkspaceModalOpen(true);
  };

  return (
    <StyledWrapper>
      {createWorkspaceModalOpen && (
        <CreateWorkspace onClose={() => setCreateWorkspaceModalOpen(false)} />
      )}
      
      <div className="workspace-sidebar">
        {/* Default Workspace (App Collections) */}
        <div
          className={`workspace-item ${activeWorkspaceUid === null ? 'active' : ''}`}
          onClick={() => handleWorkspaceClick(null)}
          title="Default Workspace (App Collections)"
        >
          <div className="workspace-icon">
            <IconHome size={20} />
          </div>
          <div className="workspace-name">Default</div>
        </div>

        {/* User Workspaces */}
        {workspaces.map((workspace) => (
          <div
            key={workspace.uid}
            className={`workspace-item ${activeWorkspaceUid === workspace.uid ? 'active' : ''}`}
            onClick={() => handleWorkspaceClick(workspace.uid)}
            title={workspace.name}
          >
            <div className="workspace-icon">
              <IconFolder size={20} />
            </div>
            <div className="workspace-name">{workspace.name}</div>
          </div>
        ))}

        {/* Create Workspace Button */}
        <div
          className="workspace-item create-workspace"
          onClick={handleCreateWorkspace}
          title="Create New Workspace"
        >
          <div className="workspace-icon">
            <IconPlus size={20} />
          </div>
          <div className="workspace-name">New</div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default WorkspaceSidebar; 