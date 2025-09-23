const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { hasBruExtension, hasRequestExtension, isWSLPath, normalizeAndResolvePath, sizeInMB } = require('../utils/filesystem');
const {
  parseEnvironment,
  parseRequest,
  parseRequestViaWorker,
  parseCollection,
  parseFolder
} = require('@usebruno/filestore');
const { parseDotEnv } = require('@usebruno/filestore');

const { uuid } = require('../utils/common');
const { getRequestUid } = require('../cache/requestUids');
const { decryptStringSafe } = require('../utils/encryption');
const { setDotEnvVars } = require('../store/process-env');
const { setBrunoConfig } = require('../store/bruno-config');
const EnvironmentSecretsStore = require('../store/env-secrets');
const UiStateSnapshot = require('../store/ui-state-snapshot');
const { parseFileMeta, hydrateRequestWithUuid } = require('../utils/collection');
const { parseLargeRequestWithRedaction } = require('../utils/parse');

// Virtual File System for OpenCollection
class OpenCollectionVirtualFS {
  constructor() {
    this.collections = new Map(); // collectionUid -> { items: [], environments: [] }
    this.mainWindow = null;
  }

  setMainWindow(win) {
    this.mainWindow = win;
  }

  loadCollection(collectionUid, collectionPath) {
    try {
      const collectionFilePath = path.join(collectionPath, 'collection.yml');
      
      if (fs.existsSync(collectionFilePath)) {
        const content = fs.readFileSync(collectionFilePath, 'utf8');
        
        const { openCollectionToJson } = require('@usebruno/filestore');
        const collection = openCollectionToJson(content);
        

        
        this.collections.set(collectionUid, collection);
        return collection;
      }
    } catch (error) {
      console.error('Error loading opencollection:', error);
    }
    return null;
  }

  getVirtualFiles(collectionUid) {
    const collection = this.collections.get(collectionUid);
    if (!collection) return [];
    
    const virtualFiles = [];
    
    // Generate virtual files for requests and folders
    this.generateVirtualFilesForItems(collection.items || [], '', virtualFiles);
    
    // Generate virtual files for environments
    (collection.environments || []).forEach(env => {
      virtualFiles.push({
        type: 'environment',
        name: env.name,
        path: `environments/${env.name}.yml`,
        data: env
      });
    });
    
    return virtualFiles;
  }

  generateVirtualFilesForItems(items, basePath, virtualFiles) {
    items.forEach(item => {
      const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
      
      if (item.type === 'folder') {
        virtualFiles.push({
          type: 'folder',
          name: item.name,
          path: itemPath,
          data: item
        });
        
        if (item.items) {
          this.generateVirtualFilesForItems(item.items, itemPath, virtualFiles);
        }
      } else {
        // Request file
        const extension = item.type === 'graphql-request' ? '.yml' : '.yml';
        virtualFiles.push({
          type: 'request',
          name: item.name,
          path: `${itemPath}${extension}`,
          data: item
        });
      }
    });
  }

  updateCollection(collectionUid, collectionPath, updatedData) {
    try {
      this.collections.set(collectionUid, updatedData);
      
      // Write back to file
      const { jsonToOpenCollection } = require('@usebruno/filestore');
      const yamlContent = jsonToOpenCollection(updatedData);
      const collectionFilePath = path.join(collectionPath, 'collection.yml');
      fs.writeFileSync(collectionFilePath, yamlContent, 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error updating opencollection:', error);
      return false;
    }
  }

  // Method to refresh UI state after collection changes without losing structure
  refreshCollectionUI(collectionUid, collectionPath) {
    if (!this.mainWindow) return;
    
    const collection = this.collections.get(collectionUid);
    if (!collection) return;
    
    try {
      // Send a targeted refresh that preserves the folder structure
      const refreshPayload = {
        collectionUid,
        action: 'refresh-collection',
        preserveStructure: true
      };
      
      this.mainWindow.webContents.send('main:collection-refresh', refreshPayload);
    } catch (error) {
      console.error('Error refreshing collection UI:', error);
    }
  }

  addRequest(collectionUid, collectionPath, folderPath, requestData) {
    let collection = this.collections.get(collectionUid);
    if (!collection) {
      // Try to load the collection if it's not in memory
      collection = this.loadCollection(collectionUid, collectionPath);
      if (!collection) {
        console.error('Failed to load collection for addRequest');
        return false;
      }
    }
    
    try {
      // Ensure items array exists
      if (!collection.items) {
        collection.items = [];
      }
      
      // Add request to the collection data structure
      this.addItemToCollection(collection.items, folderPath, requestData);
      
      // Update the file
      const success = this.updateCollection(collectionUid, collectionPath, collection);
      
      if (success && this.mainWindow) {
        // Create virtual file path for the new request
        const requestPath = folderPath ? `${folderPath}/${requestData.name}` : requestData.name;
        const virtualPath = path.join(collectionPath, `${requestPath}.yml`);
        
        // Send add file event to UI
        const requestFile = {
          meta: {
            collectionUid,
            pathname: virtualPath,
            name: `${requestData.name}.yml`
          },
          data: requestData
        };
        
        hydrateRequestWithUuid(requestFile.data, virtualPath);
        this.mainWindow.webContents.send('main:collection-tree-updated', 'addFile', requestFile);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding request to opencollection:', error);
      return false;
    }
  }

  updateRequest(collectionUid, collectionPath, requestPath, requestData) {
    let collection = this.collections.get(collectionUid);
    if (!collection) {
      collection = this.loadCollection(collectionUid, collectionPath);
      if (!collection) return false;
    }
    
    try {
      // Update request in the collection data structure
      this.updateItemInCollection(collection.items, requestPath, requestData);
      
      // Update the file
      const success = this.updateCollection(collectionUid, collectionPath, collection);
      
      if (success && this.mainWindow) {
        // Create virtual file path for the updated request
        const virtualPath = path.join(collectionPath, `${requestPath}.yml`);
        
        // Send change file event to UI
        const requestFile = {
          meta: {
            collectionUid,
            pathname: virtualPath,
            name: `${path.basename(requestPath)}.yml`
          },
          data: requestData
        };
        
        hydrateRequestWithUuid(requestFile.data, virtualPath);
        this.mainWindow.webContents.send('main:collection-tree-updated', 'change', requestFile);
      }
      
      return success;
    } catch (error) {
      console.error('Error updating request in opencollection:', error);
      return false;
    }
  }

  removeRequest(collectionUid, collectionPath, requestPath) {
    const collection = this.collections.get(collectionUid);
    if (!collection) return false;
    
    try {
      // Remove request from the collection data structure
      this.removeItemFromCollection(collection.items, requestPath);
      
      // Update the file
      const success = this.updateCollection(collectionUid, collectionPath, collection);
      
      if (success && this.mainWindow) {
        // Create virtual file path for the removed request
        const virtualPath = path.join(collectionPath, `${requestPath}.yml`);
        
        // Send unlink file event to UI
        const requestFile = {
          meta: {
            collectionUid,
            pathname: virtualPath,
            name: `${path.basename(requestPath)}.yml`
          }
        };
        
        this.mainWindow.webContents.send('main:collection-tree-updated', 'unlink', requestFile);
      }
      
      return success;
    } catch (error) {
      console.error('Error removing request from opencollection:', error);
      return false;
    }
  }

  addFolder(collectionUid, collectionPath, folderPath, folderData) {
    let collection = this.collections.get(collectionUid);
    if (!collection) {
      collection = this.loadCollection(collectionUid, collectionPath);
      if (!collection) return false;
    }
    
    try {
      // Ensure items array exists
      if (!collection.items) {
        collection.items = [];
      }
      
      // Add folder to the collection data structure
      this.addItemToCollection(collection.items, folderPath, folderData);
      
      // Update the file
      const success = this.updateCollection(collectionUid, collectionPath, collection);
      
      if (success && this.mainWindow) {
        // Create virtual directory path for the new folder
        const virtualPath = path.join(collectionPath, folderPath ? `${folderPath}/${folderData.name}` : folderData.name);
        
        // Send add directory event to UI
        const directory = {
          meta: {
            collectionUid,
            pathname: virtualPath,
            name: folderData.name,
            seq: folderData.seq,
            uid: folderData.uid
          }
        };
        
        this.mainWindow.webContents.send('main:collection-tree-updated', 'addDir', directory);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding folder to opencollection:', error);
      return false;
    }
  }

  removeFolder(collectionUid, collectionPath, folderPath) {
    const collection = this.collections.get(collectionUid);
    if (!collection) return false;
    
    try {
      // Remove folder from the collection data structure
      this.removeItemFromCollection(collection.items, folderPath);
      
      // Update the file
      const success = this.updateCollection(collectionUid, collectionPath, collection);
      
      if (success && this.mainWindow) {
        // Create virtual directory path for the removed folder
        const virtualPath = path.join(collectionPath, folderPath);
        
        // Send unlink directory event to UI
        const directory = {
          meta: {
            collectionUid,
            pathname: virtualPath,
            name: path.basename(folderPath)
          }
        };
        
        this.mainWindow.webContents.send('main:collection-tree-updated', 'unlinkDir', directory);
      }
      
      return success;
    } catch (error) {
      console.error('Error removing folder from opencollection:', error);
      return false;
    }
  }

  // Helper methods for manipulating collection items
  addItemToCollection(items, folderPath, newItem) {
    if (!folderPath) {
      items.push(newItem);
      return;
    }
    
    const pathParts = folderPath.split('/').filter(p => p);
    
    for (let item of items) {
      // Only match folders when looking for a folder path
      if (item.name === pathParts[0] && item.type === 'folder') {
        if (pathParts.length === 1) {
          if (!item.items) item.items = [];
          item.items.push(newItem);
          return;
        } else if (item.items) {
          this.addItemToCollection(item.items, pathParts.slice(1).join('/'), newItem);
          return;
        }
      }
    }
  }

  updateItemInCollection(items, path, newData) {
    const pathParts = path.split('/').filter(p => p);
    
    for (let item of items) {
      if (item.name === pathParts[0]) {
        if (pathParts.length === 1) {
          // Final path part - can match any item type
          Object.assign(item, newData);
          return true;
        } else if (item.type === 'folder' && item.items) {
          // Intermediate path part - only match folders
          return this.updateItemInCollection(item.items, pathParts.slice(1).join('/'), newData);
        }
      }
    }
    
    return false;
  }

  removeItemFromCollection(items, path) {
    const pathParts = path.split('/').filter(p => p);
    
    if (pathParts.length === 1) {
      const index = items.findIndex(item => item.name === pathParts[0]);
      if (index !== -1) {
        items.splice(index, 1);
        return true;
      }
    } else {
      for (let item of items) {
        if (item.name === pathParts[0] && item.type === 'folder' && item.items) {
          return this.removeItemFromCollection(item.items, pathParts.slice(1).join('/'));
        }
      }
    }
    
    return false;
  }

  renameItemByUid(items, uid, newName) {
    for (let item of items) {
      if (item.uid === uid) {
        item.name = newName;
        return item;
      }
      
      // If it's a folder, search recursively
      if (item.type === 'folder' && item.items) {
        const found = this.renameItemByUid(item.items, uid, newName);
        if (found) return found;
      }
    }
    
    return null;
  }

  renameItemByPath(items, path, newName, isFolder = null) {
    const pathParts = path.split('/').filter(p => p);
    
    if (pathParts.length === 1) {
      // Final path part - find and rename the item
      let item;
      if (isFolder === true) {
        // Looking for a folder specifically
        item = items.find(item => item.name === pathParts[0] && item.type === 'folder');
      } else if (isFolder === false) {
        // Looking for a request specifically
        item = items.find(item => item.name === pathParts[0] && item.type !== 'folder');
      } else {
        // Fallback - find first match by name
        item = items.find(item => item.name === pathParts[0]);
      }
      
      if (item) {
        item.name = newName;
        return item;
      }
    } else {
      // Intermediate path part - only match folders
      for (let item of items) {
        if (item.name === pathParts[0] && item.type === 'folder' && item.items) {
          return this.renameItemByPath(item.items, pathParts.slice(1).join('/'), newName, isFolder);
        }
      }
    }
    
    return null;
  }

  // Helper method to find an item by UID
  findItemByUid(items, uid) {
    for (let item of items) {
      if (item.uid === uid) {
        return item;
      }
      
      // If it's a folder, search recursively
      if (item.type === 'folder' && item.items) {
        const found = this.findItemByUid(item.items, uid);
        if (found) return found;
      }
    }
    
    return null;
  }

  // Helper method to find an item and determine its type by path (fallback)
  findItemByPath(items, path) {
    const pathParts = path.split('/').filter(p => p);
    
    if (pathParts.length === 1) {
      // Final path part - find the item
      return items.find(item => item.name === pathParts[0]);
    } else {
      // Intermediate path part - only match folders
      for (let item of items) {
        if (item.name === pathParts[0] && item.type === 'folder' && item.items) {
          return this.findItemByPath(item.items, pathParts.slice(1).join('/'));
        }
      }
    }
    
    return null;
  }

  // Get all virtual files with their UIDs for path-to-UID mapping
  getVirtualFilesWithUids(collectionUid) {
    const collection = this.collections.get(collectionUid);
    if (!collection) return [];
    
    const virtualFiles = [];
    
    // Add collection root
    virtualFiles.push({
      type: 'collection',
      path: '',
      uid: collection.uid,
      name: collection.name
    });
    
    // Add environments
    if (collection.environments) {
      collection.environments.forEach(env => {
        virtualFiles.push({
          type: 'environment',
          path: `environments/${env.name}.yml`,
          uid: env.uid,
          name: env.name
        });
      });
    }
    
    // Add items (requests and folders)
    this.generateVirtualFilesWithUids(collection.items || [], '', virtualFiles);
    
    return virtualFiles;
  }

  generateVirtualFilesWithUids(items, basePath, virtualFiles) {
    items.forEach(item => {
      const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
      
      if (item.type === 'folder') {
        virtualFiles.push({
          type: 'folder',
          path: itemPath,
          uid: item.uid,
          name: item.name
        });
        
        if (item.items) {
          this.generateVirtualFilesWithUids(item.items, itemPath, virtualFiles);
        }
      } else {
        virtualFiles.push({
          type: item.type,
          path: `${itemPath}.yml`,
          uid: item.uid,
          name: item.name
        });
      }
    });
  }

  // Send events for all child items of a folder (used after folder rename)
  sendChildItemEvents(collectionUid, collectionPath, folderItem, folderPath) {
    if (!this.mainWindow || !folderItem.items) return;
    
    const { hydrateRequestWithUuid } = require('../utils/collection');
    const path = require('path');
    
    console.log(`Sending child item events for folder: ${folderPath}, children count: ${folderItem.items.length}`);
    
    folderItem.items.forEach(childItem => {
      const childPath = path.join(folderPath, childItem.name);
      
      if (childItem.type === 'folder') {
        // Send addDir for child folder
        const directory = {
          meta: {
            collectionUid,
            pathname: childPath,
            name: childItem.name,
            uid: childItem.uid
          },
          data: childItem
        };
        
        console.log(`Sending addDir for child folder: ${childPath}`);
        this.mainWindow.webContents.send('main:collection-tree-updated', 'addDir', directory);
        
        // Recursively send events for grandchildren
        if (childItem.items && childItem.items.length > 0) {
          this.sendChildItemEvents(collectionUid, collectionPath, childItem, childPath);
        }
      } else {
        // Send addFile for child request
        const requestFile = {
          meta: {
            collectionUid,
            pathname: `${childPath}.yml`,
            name: `${childItem.name}.yml`,
            uid: childItem.uid
          },
          data: childItem
        };
        
        console.log(`Sending addFile for child request: ${childPath}.yml`);
        hydrateRequestWithUuid(requestFile.data, requestFile.meta.pathname);
        this.mainWindow.webContents.send('main:collection-tree-updated', 'addFile', requestFile);
      }
    });
  }
}

// Global instance
const virtualFS = new OpenCollectionVirtualFS();

const MAX_FILE_SIZE = 2.5 * 1024 * 1024;

const environmentSecretsStore = new EnvironmentSecretsStore();

const isDotEnvFile = (pathname, collectionPath) => {
  const dirname = path.dirname(pathname);
  const basename = path.basename(pathname);

  return dirname === collectionPath && basename === '.env';
};

const isBrunoConfigFile = (pathname, collectionPath) => {
  const dirname = path.dirname(pathname);
  const basename = path.basename(pathname);

  return dirname === collectionPath && basename === 'bruno.json';
};

// Get collection filetype from bruno.json
const getCollectionFiletype = (collectionPath) => {
  try {
    const brunoJsonPath = path.join(collectionPath, 'bruno.json');
    if (fs.existsSync(brunoJsonPath)) {
      const brunoJsonContent = fs.readFileSync(brunoJsonPath, 'utf8');
      const brunoConfig = JSON.parse(brunoJsonContent);
      return brunoConfig.filetype || 'bru';
    }
    return 'bru'; // default to bru if bruno.json doesn't exist
  } catch (error) {
    console.warn('Error reading collection filetype:', error);
    return 'bru'; // default to bru on error
  }
};

// Check if file extension matches the collection's filetype
const isFileTypeCompatible = (filename, collectionFiletype) => {
  const ext = path.extname(filename).toLowerCase();
  if (collectionFiletype === 'yaml') {
    return ext === '.yml' || ext === '.yaml';
  } else {
    return ext === '.bru';
  }
};

const isBruEnvironmentConfig = (pathname, collectionPath) => {
  const dirname = path.dirname(pathname);
  const envDirectory = path.join(collectionPath, 'environments');
  const basename = path.basename(pathname);
  
  if (dirname !== envDirectory) {
    return false;
  }
  
  // Check if file extension is compatible with collection filetype
  const collectionFiletype = getCollectionFiletype(collectionPath);
  return hasRequestExtension(basename) && isFileTypeCompatible(basename, collectionFiletype);
};

const isCollectionRootBruFile = (pathname, collectionPath) => {
  const dirname = path.dirname(pathname);
  const basename = path.basename(pathname);
  
  if (dirname !== collectionPath) {
    return false;
  }
  
  // Check if it's a collection file with compatible extension
  const collectionFiletype = getCollectionFiletype(collectionPath);
  const isCollectionFile = basename === 'collection.bru' || basename === 'collection.yml';
  
  if (!isCollectionFile) {
    return false;
  }
  
  return isFileTypeCompatible(basename, collectionFiletype);
};

const isOpenCollectionFile = (pathname, collectionPath) => {
  const dirname = path.dirname(pathname);
  const basename = path.basename(pathname);
  
  if (dirname !== collectionPath) {
    return false;
  }
  
  const collectionFiletype = getCollectionFiletype(collectionPath);
  return collectionFiletype === 'opencollection' && basename === 'collection.yml';
};

const envHasSecrets = (environment = {}) => {
  const secrets = _.filter(environment.variables, (v) => v.secret);

  return secrets && secrets.length > 0;
};

const isFolderRootFile = (pathname, collectionPath) => {
  const basename = path.basename(pathname);
  const isFolderFile = basename === 'folder.bru' || basename === 'folder.yml';
  
  if (!isFolderFile) {
    return false;
  }
  
  // Get collection path by walking up the directory tree to find bruno.json
  let currentPath = path.dirname(pathname);
  let foundCollectionPath = null;
  
  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, 'bruno.json'))) {
      foundCollectionPath = currentPath;
      break;
    }
    currentPath = path.dirname(currentPath);
  }
  
  if (!foundCollectionPath) {
    return false; // Not in a collection
  }
  
  const collectionFiletype = getCollectionFiletype(foundCollectionPath);
  return isFileTypeCompatible(basename, collectionFiletype);
};

const hydrateBruCollectionFileWithUuid = (collectionRoot) => {
  const params = _.get(collectionRoot, 'request.params', []);
  const headers = _.get(collectionRoot, 'request.headers', []);
  const requestVars = _.get(collectionRoot, 'request.vars.req', []);
  const responseVars = _.get(collectionRoot, 'request.vars.res', []);

  params.forEach((param) => (param.uid = uuid()));
  headers.forEach((header) => (header.uid = uuid()));
  requestVars.forEach((variable) => (variable.uid = uuid()));
  responseVars.forEach((variable) => (variable.uid = uuid()));

  return collectionRoot;
};

const addEnvironmentFile = async (win, pathname, collectionUid, collectionPath) => {
  try {
    const basename = path.basename(pathname);
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: basename
      }
    };

    let bruContent = fs.readFileSync(pathname, 'utf8');

    // Detect format from file extension
    const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
    file.data = await parseEnvironment(bruContent, { format: filetype });
    
    // Extract name by removing the extension
    const ext = path.extname(basename);
    file.data.name = basename.substring(0, basename.length - ext.length);
    file.data.uid = getRequestUid(pathname);

    _.each(_.get(file, 'data.variables', []), (variable) => (variable.uid = uuid()));

    // hydrate environment variables with secrets
    if (envHasSecrets(file.data)) {
      const envSecrets = environmentSecretsStore.getEnvSecrets(collectionPath, file.data);
      _.each(envSecrets, (secret) => {
        const variable = _.find(file.data.variables, (v) => v.name === secret.name);
        if (variable && secret.value) {
          const decryptionResult = decryptStringSafe(secret.value);
          variable.value = decryptionResult.value;
        }
      });
    }

    win.webContents.send('main:collection-tree-updated', 'addEnvironmentFile', file);
  } catch (err) {
    console.error('Error processing environment file: ', err);
  }
};

const changeEnvironmentFile = async (win, pathname, collectionUid, collectionPath) => {
  try {
    const basename = path.basename(pathname);
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: basename
      }
    };

    const bruContent = fs.readFileSync(pathname, 'utf8');
    
    // Detect format from file extension
    const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
    file.data = await parseEnvironment(bruContent, { format: filetype });
    
    // Extract name by removing the extension
    const ext = path.extname(basename);
    file.data.name = basename.substring(0, basename.length - ext.length);
    file.data.uid = getRequestUid(pathname);
    _.each(_.get(file, 'data.variables', []), (variable) => (variable.uid = uuid()));

    // hydrate environment variables with secrets
    if (envHasSecrets(file.data)) {
      const envSecrets = environmentSecretsStore.getEnvSecrets(collectionPath, file.data);
      _.each(envSecrets, (secret) => {
        const variable = _.find(file.data.variables, (v) => v.name === secret.name);
        if (variable && secret.value) {
          const decryptionResult = decryptStringSafe(secret.value);
          variable.value = decryptionResult.value;
        }
      });
    }

    // we are reusing the addEnvironmentFile event itself
    // this is because the uid of the pathname remains the same
    // and the collection tree will be able to update the existing environment
    win.webContents.send('main:collection-tree-updated', 'addEnvironmentFile', file);
  } catch (err) {
    console.error(err);
  }
};

const unlinkEnvironmentFile = async (win, pathname, collectionUid) => {
  try {
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname)
      },
      data: {
        uid: getRequestUid(pathname),
        name: path.basename(pathname).substring(0, path.basename(pathname).length - 4)
      }
    };

    win.webContents.send('main:collection-tree-updated', 'unlinkEnvironmentFile', file);
  } catch (err) {
    console.error(err);
  }
};

const add = async (win, pathname, collectionUid, collectionPath, useWorkerThread, watcher) => {
  console.log(`watcher add: ${pathname}`);

  if (isBrunoConfigFile(pathname, collectionPath)) {
    try {
      const content = fs.readFileSync(pathname, 'utf8');
      const brunoConfig = JSON.parse(content);

      setBrunoConfig(collectionUid, brunoConfig);
    } catch (err) {
      console.error(err);
    }
  }

  if (isDotEnvFile(pathname, collectionPath)) {
    try {
      const content = fs.readFileSync(pathname, 'utf8');
      const jsonData = parseDotEnv(content);

      setDotEnvVars(collectionUid, jsonData);
      const payload = {
        collectionUid,
        processEnvVariables: {
          ...jsonData
        }
      };
      win.webContents.send('main:process-env-update', payload);
    } catch (err) {
      console.error(err);
    }
  }

  if (isBruEnvironmentConfig(pathname, collectionPath)) {
    return addEnvironmentFile(win, pathname, collectionUid, collectionPath);
  }

  if (isOpenCollectionFile(pathname, collectionPath)) {
    try {
      // Load the opencollection and generate virtual files
      const collection = virtualFS.loadCollection(collectionUid, collectionPath);
      if (collection) {
        const virtualFiles = virtualFS.getVirtualFiles(collectionUid);
        
        // Send collection root file - data should contain only root properties for Redux
        const collectionFile = {
          meta: {
            collectionUid,
            pathname,
            name: path.basename(pathname),
            collectionRoot: true
          },
          data: {
            // Only send root properties - Redux will set collection.root = file.data
            request: {
              auth: collection.root?.request?.auth || collection.auth || { mode: 'inherit' },
              headers: collection.root?.request?.headers || collection.headers || [],
              vars: collection.root?.request?.vars || collection.vars || {},
              script: collection.root?.request?.script || collection.script || {},
              tests: collection.root?.request?.tests || collection.tests || ''
            },
            docs: collection.root?.docs || collection.docs || ''
          }
        };
        
        hydrateBruCollectionFileWithUuid(collectionFile.data);
        win.webContents.send('main:collection-tree-updated', 'addFile', collectionFile);
        
        // Send virtual files as if they were real files
        virtualFiles.forEach(vFile => {
          const virtualPath = path.join(collectionPath, vFile.path);
          
          if (vFile.type === 'request') {
            const requestFile = {
              meta: {
                collectionUid,
                pathname: virtualPath,
                name: `${vFile.name}.yml`
              },
              data: vFile.data
            };
            
            hydrateRequestWithUuid(requestFile.data, virtualPath);
            win.webContents.send('main:collection-tree-updated', 'addFile', requestFile);
          } else if (vFile.type === 'environment') {
            const envFile = {
              meta: {
                collectionUid,
                pathname: virtualPath,
                name: `${vFile.name}.yml`
              },
              data: { ...vFile.data }
            };
            
            // Add UID for the environment (similar to regular environment files)
            envFile.data.uid = getRequestUid(virtualPath);
            
            // Add UIDs to variables
            _.each(_.get(envFile, 'data.variables', []), (variable) => (variable.uid = uuid()));
            
            // Hydrate environment variables with secrets
            if (envHasSecrets(envFile.data)) {
              const envSecrets = environmentSecretsStore.getEnvSecrets(collectionPath, envFile.data);
              _.each(envSecrets, (secret) => {
                const variable = _.find(envFile.data.variables, (v) => v.name === secret.name);
                if (variable && secret.value) {
                  const decryptionResult = decryptStringSafe(secret.value);
                  variable.value = decryptionResult.value;
                }
              });
            }
            
            win.webContents.send('main:collection-tree-updated', 'addEnvironmentFile', envFile);
          } else if (vFile.type === 'folder') {
            const directory = {
              meta: {
                collectionUid,
                pathname: virtualPath,
                name: vFile.name,
                uid: vFile.data.uid || uuid()
              }
            };
            
            win.webContents.send('main:collection-tree-updated', 'addDir', directory);
          }
        });
      }
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (isCollectionRootBruFile(pathname, collectionPath)) {
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname),
        collectionRoot: true
      }
    };

    try {
      let bruContent = fs.readFileSync(pathname, 'utf8');

      // Detect format from file extension
      const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
      file.data = await parseCollection(bruContent, { format: filetype });

      hydrateBruCollectionFileWithUuid(file.data);
      win.webContents.send('main:collection-tree-updated', 'addFile', file);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (isFolderRootFile(pathname, collectionPath)) {
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname),
        folderRoot: true
      }
    };

    try {
      let bruContent = fs.readFileSync(pathname, 'utf8');

      // Detect format from file extension
      const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
      file.data = await parseCollection(bruContent, { format: filetype });

      hydrateBruCollectionFileWithUuid(file.data);
      win.webContents.send('main:collection-tree-updated', 'addFile', file);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (hasRequestExtension(pathname)) {
    // Check if file extension is compatible with collection filetype
    const collectionFiletype = getCollectionFiletype(collectionPath);
    const basename = path.basename(pathname);
    
    if (!isFileTypeCompatible(basename, collectionFiletype)) {
      return; // Skip files that don't match the collection's filetype
    }
    
    watcher.addFileToProcessing(collectionUid, pathname);

    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname)
      }
    };

    const fileStats = fs.statSync(pathname);
    let bruContent = fs.readFileSync(pathname, 'utf8');
    
    // Detect format from file extension
    const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
    
    // If worker thread is not used, we can directly parse the file
    if (!useWorkerThread) {
      try {
        file.data = await parseRequest(bruContent, { format: filetype });
        file.partial = false;
        file.loading = false;
        file.size = sizeInMB(fileStats?.size);
        hydrateRequestWithUuid(file.data, pathname);
        win.webContents.send('main:collection-tree-updated', 'addFile', file);
        
      } catch (error) {
        console.error(error);
      } finally {
        watcher.markFileAsProcessed(win, collectionUid, pathname);
      }
      return;
    }

    try {
      // we need to send a partial file info to the UI
      // so that the UI can display the file in the collection tree
      file.data = {
        name: path.basename(pathname),
        type: 'http-request'
      };

      const metaJson = parseFileMeta(bruContent, filetype);
      file.data = metaJson;
      file.partial = true;
      file.loading = false;
      file.size = sizeInMB(fileStats?.size);
      hydrateRequestWithUuid(file.data, pathname);
      win.webContents.send('main:collection-tree-updated', 'addFile', file);

      if (fileStats.size < MAX_FILE_SIZE) {
        // This is to update the loading indicator in the UI
        file.data = metaJson;
        file.partial = false;
        file.loading = true;
        hydrateRequestWithUuid(file.data, pathname);
        win.webContents.send('main:collection-tree-updated', 'addFile', file);

        // This is to update the file info in the UI
        file.data = await parseRequestViaWorker(bruContent, { 
          format: filetype,
          filename: pathname 
        });
        file.partial = false;
        file.loading = false;
        hydrateRequestWithUuid(file.data, pathname);
        win.webContents.send('main:collection-tree-updated', 'addFile', file);
      }
    } catch(error) {
      file.data = {
        name: path.basename(pathname),
        type: 'http-request'
      };
      file.error = {
        message: error?.message
      };
      file.partial = true;
      file.loading = false;
      file.size = sizeInMB(fileStats?.size);
      hydrateRequestWithUuid(file.data, pathname);
      win.webContents.send('main:collection-tree-updated', 'addFile', file);
    } finally {
      watcher.markFileAsProcessed(win, collectionUid, pathname);
    }
  }
};

const addDirectory = async (win, pathname, collectionUid, collectionPath) => {
  const envDirectory = path.join(collectionPath, 'environments');

  if (pathname === envDirectory) {
    return;
  }

  let name = path.basename(pathname);
  let seq;
  
  // Check for both folder.bru and folder.yml
  const folderBruFilePath = path.join(pathname, `folder.bru`);
  const folderYmlFilePath = path.join(pathname, `folder.yml`);

  let folderFilePath = null;
  let folderFormat = 'bru';

  if (fs.existsSync(folderBruFilePath)) {
    folderFilePath = folderBruFilePath;
    folderFormat = 'bru';
  } else if (fs.existsSync(folderYmlFilePath)) {
    folderFilePath = folderYmlFilePath;
    folderFormat = 'yaml';
  }

  if (folderFilePath) {
    let folderBruFileContent = fs.readFileSync(folderFilePath, 'utf8');
    let folderBruData = await parseFolder(folderBruFileContent, { format: folderFormat });
    name = folderBruData?.meta?.name || name;
    seq = folderBruData?.meta?.seq;
  }

  const directory = {
    meta: {
      collectionUid,
      pathname,
      name,
      seq,
      uid: getRequestUid(pathname)
    }
  };

  win.webContents.send('main:collection-tree-updated', 'addDir', directory);
};

const change = async (win, pathname, collectionUid, collectionPath) => {
  if (isBrunoConfigFile(pathname, collectionPath)) {
    try {
      const content = fs.readFileSync(pathname, 'utf8');
      const brunoConfig = JSON.parse(content);

      const payload = {
        collectionUid,
        brunoConfig: brunoConfig
      };

      setBrunoConfig(collectionUid, brunoConfig);
      win.webContents.send('main:bruno-config-update', payload);
    } catch (err) {
      console.error(err);
    }
  }

  if (isDotEnvFile(pathname, collectionPath)) {
    try {
      const content = fs.readFileSync(pathname, 'utf8');
      const jsonData = parseDotEnv(content);

      setDotEnvVars(collectionUid, jsonData);
      const payload = {
        collectionUid,
        processEnvVariables: {
          ...jsonData
        }
      };
      win.webContents.send('main:process-env-update', payload);
    } catch (err) {
      console.error(err);
    }
  }

  if (isBruEnvironmentConfig(pathname, collectionPath)) {
    return changeEnvironmentFile(win, pathname, collectionUid, collectionPath);
  }

  if (isOpenCollectionFile(pathname, collectionPath)) {
    try {
      // Reload the opencollection and update virtual files
      const collection = virtualFS.loadCollection(collectionUid, collectionPath);
      if (collection) {
        // Send collection root file update - data should contain only root properties for Redux
        const collectionFile = {
          meta: {
            collectionUid,
            pathname,
            name: path.basename(pathname),
            collectionRoot: true
          },
          data: {
            // Only send root properties - Redux will set collection.root = file.data
            request: {
              auth: collection.root?.request?.auth || collection.auth || { mode: 'inherit' },
              headers: collection.root?.request?.headers || collection.headers || [],
              vars: collection.root?.request?.vars || collection.vars || {},
              script: collection.root?.request?.script || collection.script || {},
              tests: collection.root?.request?.tests || collection.tests || ''
            },
            docs: collection.root?.docs || collection.docs || '',
            // Add essential collection properties for Redux
            uid: collection.uid,
            name: collection.name,
            type: collection.type || 'collection',
            version: collection.version || '1'
          }
        };
        
        hydrateBruCollectionFileWithUuid(collectionFile.data);
        win.webContents.send('main:collection-tree-updated', 'change', collectionFile);
        
        // For opencollection changes, we need to be more conservative about sending events
        // Only send change events when absolutely necessary to avoid UI rebuilds that lose structure
        console.log('OpenCollection file changed - collection reloaded but not sending individual item change events');
      }
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (isCollectionRootBruFile(pathname, collectionPath)) {
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname),
        collectionRoot: true
      }
    };

    try {
      let bruContent = fs.readFileSync(pathname, 'utf8');

      // Detect format from file extension
      const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
      file.data = await parseCollection(bruContent, { format: filetype });
      hydrateBruCollectionFileWithUuid(file.data);
      win.webContents.send('main:collection-tree-updated', 'change', file);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (isFolderRootFile(pathname, collectionPath)) {
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname),
        folderRoot: true
      }
    };

    try {
      let bruContent = fs.readFileSync(pathname, 'utf8');

      // Detect format from file extension
      const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
      file.data = await parseCollection(bruContent, { format: filetype });

      hydrateBruCollectionFileWithUuid(file.data);
      win.webContents.send('main:collection-tree-updated', 'change', file);
      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  if (hasRequestExtension(pathname)) {
    // Check if file extension is compatible with collection filetype
    const collectionFiletype = getCollectionFiletype(collectionPath);
    const basename = path.basename(pathname);
    
    if (!isFileTypeCompatible(basename, collectionFiletype)) {
      return; // Skip files that don't match the collection's filetype
    }
    
    try {
      const file = {
        meta: {
          collectionUid,
          pathname,
          name: path.basename(pathname)
        }
      };

      const bru = fs.readFileSync(pathname, 'utf8');
      const fileStats = fs.statSync(pathname);
      // Detect format from file extension
      const filetype = pathname.toLowerCase().endsWith('.yml') || pathname.toLowerCase().endsWith('.yaml') ? 'yaml' : 'bru';
      file.data = await parseRequest(bru, { format: filetype });

      if (fileStats.size >= MAX_FILE_SIZE) {
        const parsedData = await parseLargeRequestWithRedaction(bru);
        file.data = parsedData;
        file.size = sizeInMB(fileStats?.size);
        hydrateRequestWithUuid(file.data, pathname);
        win.webContents.send('main:collection-tree-updated', 'change', file);
      } else {
        file.data = await parseRequest(bru);
        file.size = sizeInMB(fileStats?.size);
        hydrateRequestWithUuid(file.data, pathname);
        win.webContents.send('main:collection-tree-updated', 'change', file);
      }
    } catch (err) {
      console.error(err);
    }
  }
};

const unlink = (win, pathname, collectionUid, collectionPath) => {
  console.log(`watcher unlink: ${pathname}`);

  if (isBruEnvironmentConfig(pathname, collectionPath)) {
    return unlinkEnvironmentFile(win, pathname, collectionUid);
  }

  if (hasRequestExtension(pathname)) {
    // Check if file extension is compatible with collection filetype
    const collectionFiletype = getCollectionFiletype(collectionPath);
    const basename = path.basename(pathname);
    
    if (!isFileTypeCompatible(basename, collectionFiletype)) {
      return; // Skip files that don't match the collection's filetype
    }
    
    const file = {
      meta: {
        collectionUid,
        pathname,
        name: path.basename(pathname)
      }
    };
    win.webContents.send('main:collection-tree-updated', 'unlink', file);
  }
};

const unlinkDir = async (win, pathname, collectionUid, collectionPath) => {
  const envDirectory = path.join(collectionPath, 'environments');

  if (pathname === envDirectory) {
    return;
  }


  const folderBruFilePath = path.join(pathname, `folder.bru`);

  let name = path.basename(pathname);

  if (fs.existsSync(folderBruFilePath)) {
    let folderBruFileContent = fs.readFileSync(folderBruFilePath, 'utf8');
    let folderBruData = await parseFolder(folderBruFileContent);
    name = folderBruData?.meta?.name || name;
  }

  const directory = {
    meta: {
      collectionUid,
      pathname,
      name
    }
  };
  win.webContents.send('main:collection-tree-updated', 'unlinkDir', directory);
};

const onWatcherSetupComplete = (win, watchPath, collectionUid, watcher) => {
  // Mark discovery as complete
  watcher.completeCollectionDiscovery(win, collectionUid);
  
  const UiStateSnapshotStore = new UiStateSnapshot();
  const collectionsSnapshotState = UiStateSnapshotStore.getCollections();
  const collectionSnapshotState = collectionsSnapshotState?.find(c => c?.pathname == watchPath);
  win.webContents.send('main:hydrate-app-with-ui-state-snapshot', collectionSnapshotState);
};

class CollectionWatcher {
  constructor() {
    this.watchers = {};
    this.loadingStates = {};
  }

  // Initialize loading state tracking for a collection
  initializeLoadingState(collectionUid) {
    if (!this.loadingStates[collectionUid]) {
      this.loadingStates[collectionUid] = {
        isDiscovering: false, // Initial discovery phase
        isProcessing: false,  // Processing discovered files
        pendingFiles: new Set(), // Files that need processing
      };
    }
  }

  startCollectionDiscovery(win, collectionUid) {
    this.initializeLoadingState(collectionUid);
    const state = this.loadingStates[collectionUid];
    
    state.isDiscovering = true;
    state.pendingFiles.clear();
    
    win.webContents.send('main:collection-loading-state-updated', {
      collectionUid,
      isLoading: true
    });
  }

  addFileToProcessing(collectionUid, filepath) {
    this.initializeLoadingState(collectionUid);
    const state = this.loadingStates[collectionUid];
    state.pendingFiles.add(filepath);
  }

  markFileAsProcessed(win, collectionUid, filepath) {
    if (!this.loadingStates[collectionUid]) return;
    
    const state = this.loadingStates[collectionUid];
    state.pendingFiles.delete(filepath);
    
    // If discovery is complete and no pending files, mark as not loading
    if (!state.isDiscovering && state.pendingFiles.size === 0 && state.isProcessing) {
      state.isProcessing = false;
      win.webContents.send('main:collection-loading-state-updated', {
        collectionUid,
        isLoading: false
      });
    }
  }

  completeCollectionDiscovery(win, collectionUid) {
    if (!this.loadingStates[collectionUid]) return;
    
    const state = this.loadingStates[collectionUid];
    state.isDiscovering = false;
    
    // If there are pending files, start processing phase
    if (state.pendingFiles.size > 0) {
      state.isProcessing = true;
    } else {
      // No pending files, collection is fully loaded
      win.webContents.send('main:collection-loading-state-updated', {
        collectionUid,
        isLoading: false
      });
    }
  }

  cleanupLoadingState(collectionUid) {
    delete this.loadingStates[collectionUid];
  }

  addWatcher(win, watchPath, collectionUid, brunoConfig, forcePolling = false, useWorkerThread) {
    if (this.watchers[watchPath]) {
      this.watchers[watchPath].close();
    }

    // Set main window reference for virtual filesystem
    virtualFS.setMainWindow(win);

    this.initializeLoadingState(collectionUid);
    
    this.startCollectionDiscovery(win, collectionUid);

    const ignores = brunoConfig?.ignore || [];
    setTimeout(() => {
      const watcher = chokidar.watch(watchPath, {
        ignoreInitial: false,
        usePolling: isWSLPath(watchPath) || forcePolling ? true : false,
        ignored: (filepath) => {
          const normalizedPath = normalizeAndResolvePath(filepath);
          const relativePath = path.relative(watchPath, normalizedPath);

          return ignores.some((ignorePattern) => {
            return relativePath === ignorePattern || relativePath.startsWith(ignorePattern);
          });
        },
        persistent: true,
        ignorePermissionErrors: true,
        awaitWriteFinish: {
          stabilityThreshold: 80,
          pollInterval: 10
        },
        depth: 20,
        disableGlobbing: true
      });

      let startedNewWatcher = false;
      watcher
        .on('ready', () => onWatcherSetupComplete(win, watchPath, collectionUid, this))
        .on('add', (pathname) => add(win, pathname, collectionUid, watchPath, useWorkerThread, this))
        .on('addDir', (pathname) => addDirectory(win, pathname, collectionUid, watchPath))
        .on('change', (pathname) => change(win, pathname, collectionUid, watchPath))
        .on('unlink', (pathname) => unlink(win, pathname, collectionUid, watchPath))
        .on('unlinkDir', (pathname) => unlinkDir(win, pathname, collectionUid, watchPath))
        .on('error', (error) => {
          // `EMFILE` is an error code thrown when to many files are watched at the same time see: https://github.com/usebruno/bruno/issues/627
          // `ENOSPC` stands for "Error No space" but is also thrown if the file watcher limit is reached.
          // To prevent loops `!forcePolling` is checked.
          if ((error.code === 'ENOSPC' || error.code === 'EMFILE') && !startedNewWatcher && !forcePolling) {
            // This callback is called for every file the watcher is trying to watch. To prevent a spam of messages and
            // Multiple watcher being started `startedNewWatcher` is set to prevent this.
            startedNewWatcher = true;
            watcher.close();
            console.error(
              `\nCould not start watcher for ${watchPath}:`,
              'ENOSPC: System limit for number of file watchers reached!',
              'Trying again with polling, this will be slower!\n',
              'Update your system config to allow more concurrently watched files with:',
              '"echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p"'
            );
            this.addWatcher(win, watchPath, collectionUid, brunoConfig, true, useWorkerThread);
          } else {
            console.error(`An error occurred in the watcher for: ${watchPath}`, error);
          }
        });

      this.watchers[watchPath] = watcher;
    }, 100);
  }

  hasWatcher(watchPath) {
    return this.watchers[watchPath];
  }

  removeWatcher(watchPath, win, collectionUid) {
    if (this.watchers[watchPath]) {
      this.watchers[watchPath].close();
      this.watchers[watchPath] = null;
    }
    
    if (collectionUid) {
      this.cleanupLoadingState(collectionUid);
    }
  }

  getWatcherByItemPath(itemPath) {
    const paths = Object.keys(this.watchers);

    const watcherPath = paths?.find(collectionPath => {
      const absCollectionPath = path.resolve(collectionPath);
      const absItemPath = path.resolve(itemPath);

      return absItemPath.startsWith(absCollectionPath);
    });

    return watcherPath ? this.watchers[watcherPath] : null;
  }

  unlinkItemPathInWatcher(itemPath) {
    const watcher = this.getWatcherByItemPath(itemPath);
    if (watcher) {
      watcher.unwatch(itemPath);
    }
  }
  
  addItemPathInWatcher(itemPath) {
    const watcher = this.getWatcherByItemPath(itemPath);
    if (watcher && !watcher?.has?.(itemPath)) {
      watcher?.add?.(itemPath);
    }
  }

  getAllWatcherPaths() {
    return Object.entries(this.watchers)
      .filter(([path, watcher]) => !!watcher)
      .map(([path, _watcher]) => path);
  }
}

const collectionWatcher = new CollectionWatcher();

module.exports = collectionWatcher;
module.exports.virtualFS = virtualFS;
