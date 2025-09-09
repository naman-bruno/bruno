const Store = require('electron-store');
const { generateUidBasedOnHash } = require('../utils/common');

class LastOpenedWorkspaces {
  constructor() {
    this.store = new Store({
      name: 'last-opened-workspaces',
      defaults: {
        workspaces: []
      }
    });
  }

  getAll() {
    return this.store.get('workspaces', []);
  }

  add(workspacePath, workspaceConfig) {
    const workspaces = this.getAll();
    const workspaceUid = generateUidBasedOnHash(workspacePath);
    
    // Remove existing entry if it exists
    const filteredWorkspaces = workspaces.filter(w => w.uid !== workspaceUid);
    
    // Add to the beginning of the array
    filteredWorkspaces.unshift({
      uid: workspaceUid,
      pathname: workspacePath,
      name: workspaceConfig.name,
      lastOpened: new Date().toISOString(),
      ...workspaceConfig
    });
    
    // Keep only the last 10 workspaces
    const limitedWorkspaces = filteredWorkspaces.slice(0, 10);
    
    this.store.set('workspaces', limitedWorkspaces);
    return limitedWorkspaces;
  }

  remove(workspaceUid) {
    const workspaces = this.getAll();
    const filteredWorkspaces = workspaces.filter(w => w.uid !== workspaceUid);
    this.store.set('workspaces', filteredWorkspaces);
    return filteredWorkspaces;
  }

  clear() {
    this.store.set('workspaces', []);
  }
}

module.exports = LastOpenedWorkspaces; 