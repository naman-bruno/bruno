import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconBox } from '@tabler/icons';
import { loadWorkspaceCollections } from 'providers/ReduxStore/slices/workspaces/actions';
import WorkspaceInfo from './WorkspaceInfo';
import WorkspaceDocs from './WorkspaceDocs';
import StyledWrapper from './StyledWrapper';

const WorkspaceOverview = () => {
  const dispatch = useDispatch();
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  
  const activeWorkspace = workspaces.find(w => w.uid === activeWorkspaceUid);

  useEffect(() => {
    if (activeWorkspace && activeWorkspace.uid) {
      dispatch(loadWorkspaceCollections(activeWorkspace.uid));
    }
  }, [activeWorkspace, dispatch]);

  if (!activeWorkspace) {
    return null;
  }

  return (
    <StyledWrapper>
      <div className="h-full p-4">
        <div className="grid grid-cols-5 gap-4 h-full">
          <div className="col-span-2">
            <div className="text-xl font-semibold flex items-center gap-2">
              <IconBox size={24} stroke={1.5} />
              {activeWorkspace.name}
            </div>
            <WorkspaceInfo workspace={activeWorkspace} />
          </div>
          <div className="col-span-3">
            <WorkspaceDocs workspace={activeWorkspace} />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default WorkspaceOverview; 