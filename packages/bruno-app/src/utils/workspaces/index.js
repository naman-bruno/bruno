// Utility functions for workspace operations

export const isCollectionInWorkspace = (collection, workspaceCollection, workspacePath) => {
  const collectionPath = collection.pathname;
  const { type, location } = workspaceCollection;

  switch (type) {
    case 'local':
      // For local collections, match the absolute path exactly
      return location === collectionPath;
    
    case 'workspace':
      // For workspace collections, check if collection is inside the workspace directory
      // This is a simple check - we'll improve it when we have proper path utilities
      return collectionPath.includes(workspacePath) && collectionPath.includes(location);
    
    case 'remote':
      // For remote collections, we'll implement this later
      return false;
    
    default:
      return false;
  }
};

export const filterCollectionsByWorkspace = (collections, activeWorkspace) => {
  if (!activeWorkspace || !activeWorkspace.collections || activeWorkspace.collections.length === 0) {
    return [];
  }

  return collections.filter(collection => {
    return activeWorkspace.collections.some(wc => 
      isCollectionInWorkspace(collection, wc, activeWorkspace.pathname)
    );
  });
}; 