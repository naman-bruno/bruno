import {
  createWorkspace,
  removeWorkspace,
  setActiveWorkspace,
  updateWorkspace,
  addCollectionToWorkspace,
  removeCollectionFromWorkspace,
  updateWorkspaceLoadingState
} from '../workspaces';
import { showHomePage } from '../app';
import { createCollection, openCollection } from '../collections/actions';
import { generateUidBasedOnHash } from 'utils/common';
import toast from 'react-hot-toast';

const { ipcRenderer } = window;

export const createWorkspaceAction = (workspaceName, workspaceFolderName, workspaceLocation) => {
  return async (dispatch) => {
    try {
      const result = await ipcRenderer.invoke(
        'renderer:create-workspace',
        workspaceName,
        workspaceFolderName,
        workspaceLocation
      );
      
      const { workspaceConfig, workspaceUid, workspacePath } = result;
      
      dispatch(createWorkspace({
        uid: workspaceUid,
        name: workspaceName,
        pathname: workspacePath,
        ...workspaceConfig
      }));
      
      // Switch to the newly created workspace
      dispatch(setActiveWorkspace(workspaceUid));
      
      return result;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };
};

export const openWorkspace = () => {
  return async (dispatch) => {
    try {
      const workspacePath = await ipcRenderer.invoke('renderer:browse-directory');
      if (workspacePath) {
        const result = await ipcRenderer.invoke('renderer:open-workspace', workspacePath);
        const { workspaceConfig, workspaceUid } = result;
        
        dispatch(createWorkspace({
          uid: workspaceUid,
          pathname: workspacePath,
          ...workspaceConfig
        }));
        
        dispatch(setActiveWorkspace(workspaceUid));
        
        return result;
      }
    } catch (error) {
      console.error('Error opening workspace:', error);
      throw error;
    }
  };
};

export const switchWorkspace = (workspaceUid) => {
  return (dispatch) => {
    dispatch(setActiveWorkspace(workspaceUid));
    // Show homepage when switching workspaces to see the overview or welcome screen
    dispatch(showHomePage());
  };
};

export const loadWorkspaceCollections = (workspaceUid) => {
  return async (dispatch, getState) => {
    try {
      dispatch(updateWorkspaceLoadingState({ workspaceUid, loadingState: 'loading' }));
      
      const workspace = getState().workspaces.workspaces.find(w => w.uid === workspaceUid);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const collections = await ipcRenderer.invoke('renderer:load-workspace-collections', workspace.pathname);
      
      dispatch(updateWorkspace({
        uid: workspaceUid,
        collections
      }));
      
      dispatch(updateWorkspaceLoadingState({ workspaceUid, loadingState: 'loaded' }));
      
      return collections;
    } catch (error) {
      dispatch(updateWorkspaceLoadingState({ workspaceUid, loadingState: 'error' }));
      console.error('Error loading workspace collections:', error);
      throw error;
    }
  };
};

export const removeWorkspaceAction = (workspaceUid) => {
  return (dispatch) => {
    dispatch(removeWorkspace(workspaceUid));
  };
};

export const loadLastOpenedWorkspaces = () => {
  return async (dispatch) => {
    try {
      const workspaces = await ipcRenderer.invoke('renderer:get-last-opened-workspaces');
      
      workspaces.forEach(workspace => {
        dispatch(createWorkspace(workspace));
      });
      
      return workspaces;
    } catch (error) {
      console.error('Error loading last opened workspaces:', error);
      throw error;
    }
  };
};

export const workspaceOpenedEvent = (workspacePath, workspaceUid, workspaceConfig) => {
  return (dispatch) => {
    dispatch(createWorkspace({
      uid: workspaceUid,
      pathname: workspacePath,
      ...workspaceConfig
    }));
  };
};

export const saveWorkspaceDocs = (workspaceUid) => {
  return async (dispatch, getState) => {
    try {
      const workspace = getState().workspaces.workspaces.find(w => w.uid === workspaceUid);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      await ipcRenderer.invoke('renderer:save-workspace-docs', workspace.pathname, workspace.docs || '');
      
      return workspace.docs;
    } catch (error) {
      console.error('Error saving workspace docs:', error);
      throw error;
    }
  };
};

export const createCollectionInWorkspace = (collectionName, collectionFolderName, collectionLocation, workspaceUid) => {
  return async (dispatch, getState) => {
    try {
      // First create the collection normally
      const result = await dispatch(createCollection(collectionName, collectionFolderName, collectionLocation));
      
      // Then add it to the workspace
      const workspace = getState().workspaces.workspaces.find(w => w.uid === workspaceUid);
      if (workspace) {
        const collectionPath = `${collectionLocation}/${collectionFolderName}`;
        const collectionsPath = `${workspace.pathname}/collections`;
        
        // Determine collection type based on location
        const isWorkspaceCollection = collectionPath.startsWith(collectionsPath);
        const collectionType = isWorkspaceCollection ? 'workspace' : 'local';
        const location = isWorkspaceCollection 
          ? collectionPath.replace(workspace.pathname + '/', '') // relative path
          : collectionPath; // absolute path
        
        const workspaceCollection = {
          name: collectionName,
          type: collectionType,
          location: location
        };
        
        // Add to workspace.yml
        await ipcRenderer.invoke('renderer:add-collection-to-workspace', workspace.pathname, workspaceCollection);
        
        // Update workspace in store
        dispatch(addCollectionToWorkspace({
          workspaceUid,
          collection: workspaceCollection
        }));
        
        // Reload workspace collections
        dispatch(loadWorkspaceCollections(workspaceUid));
      }
      
      return result;
    } catch (error) {
      console.error('Error creating collection in workspace:', error);
      throw error;
    }
  };
};

export const openCollectionInWorkspace = () => {
  return async (dispatch) => {
    try {
      return await dispatch(openCollection());
    } catch (error) {
      console.error('Error opening collection in workspace:', error);
      throw error;
    }
  };
}; 