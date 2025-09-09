import { createSlice } from '@reduxjs/toolkit';
import { uuid } from 'utils/common';

const initialState = {
  workspaces: [],
  activeWorkspaceUid: null, // null means default workspace (app collections)
  workspaceLoadingStates: {}
};

export const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    createWorkspace: (state, action) => {
      const workspace = action.payload;
      workspace.uid = workspace.uid || uuid();
      workspace.collections = workspace.collections || [];
      workspace.loadingState = 'idle';
      
      const existingWorkspace = state.workspaces.find(w => w.uid === workspace.uid);
      if (!existingWorkspace) {
        state.workspaces.push(workspace);
      }
    },
    
    removeWorkspace: (state, action) => {
      const workspaceUid = action.payload;
      state.workspaces = state.workspaces.filter(w => w.uid !== workspaceUid);
      
      // If active workspace is removed, switch to default
      if (state.activeWorkspaceUid === workspaceUid) {
        state.activeWorkspaceUid = null;
      }
    },
    
    setActiveWorkspace: (state, action) => {
      state.activeWorkspaceUid = action.payload;
    },
    
    updateWorkspace: (state, action) => {
      const { uid, ...updates } = action.payload;
      const workspace = state.workspaces.find(w => w.uid === uid);
      if (workspace) {
        Object.assign(workspace, updates);
      }
    },
    
    addCollectionToWorkspace: (state, action) => {
      const { workspaceUid, collection } = action.payload;
      const workspace = state.workspaces.find(w => w.uid === workspaceUid);
      if (workspace) {
        const existingCollection = workspace.collections.find(c => c.name === collection.name);
        if (!existingCollection) {
          workspace.collections.push(collection);
        }
      }
    },
    
    removeCollectionFromWorkspace: (state, action) => {
      const { workspaceUid, collectionName } = action.payload;
      const workspace = state.workspaces.find(w => w.uid === workspaceUid);
      if (workspace) {
        workspace.collections = workspace.collections.filter(c => c.name !== collectionName);
      }
    },
    
    updateWorkspaceLoadingState: (state, action) => {
      const { workspaceUid, loadingState } = action.payload;
      state.workspaceLoadingStates[workspaceUid] = loadingState;
    }
  }
});

export const {
  createWorkspace,
  removeWorkspace,
  setActiveWorkspace,
  updateWorkspace,
  addCollectionToWorkspace,
  removeCollectionFromWorkspace,
  updateWorkspaceLoadingState
} = workspacesSlice.actions;

export default workspacesSlice.reducer; 