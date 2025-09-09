const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const { 
  writeFile,
  createDirectory,
  sanitizeName,
  validateName,
  browseDirectory
} = require('../utils/filesystem');
const { generateUidBasedOnHash, stringifyJson, safeParseJSON } = require('../utils/common');
const yaml = require('js-yaml');
const LastOpenedWorkspaces = require('../store/last-opened-workspaces');

const registerWorkspaceIpc = (mainWindow) => {
  const lastOpenedWorkspaces = new LastOpenedWorkspaces();
  // Create workspace
  ipcMain.handle(
    'renderer:create-workspace',
    async (event, workspaceName, workspaceFolderName, workspaceLocation) => {
      try {
        workspaceFolderName = sanitizeName(workspaceFolderName);
        const dirPath = path.join(workspaceLocation, workspaceFolderName);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          if (files.length > 0) {
            throw new Error(`workspace: ${dirPath} already exists and is not empty`);
          }
        }

        if (!validateName(path.basename(dirPath))) {
          throw new Error(`workspace: invalid pathname - ${dirPath}`);
        }

        if (!fs.existsSync(dirPath)) {
          await createDirectory(dirPath);
        }

        // Create collections folder inside workspace
        const collectionsPath = path.join(dirPath, 'collections');
        await createDirectory(collectionsPath);

        const workspaceUid = generateUidBasedOnHash(dirPath);
        const workspaceConfig = {
          name: workspaceName,
          type: 'bruno-workspace',
          version: '1.0.0',
          docs: '',
          collections: []
        };

        // Write workspace.yml file
        const yamlContent = yaml.dump(workspaceConfig, { 
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
        await writeFile(path.join(dirPath, 'workspace.yml'), yamlContent);

        // Add to last opened workspaces
        lastOpenedWorkspaces.add(dirPath, workspaceConfig);

        // Send workspace opened event to renderer
        mainWindow.webContents.send('main:workspace-opened', dirPath, workspaceUid, workspaceConfig);

        return {
          workspaceConfig,
          workspaceUid,
          workspacePath: dirPath
        };
      } catch (error) {
        console.error('Error creating workspace:', error);
        return Promise.reject(error);
      }
    }
  );

  // Open workspace
  ipcMain.handle('renderer:open-workspace', async (event, workspacePath) => {
    try {
      const workspaceFilePath = path.join(workspacePath, 'workspace.yml');
      
      if (!fs.existsSync(workspaceFilePath)) {
        throw new Error('Invalid workspace: workspace.yml not found');
      }

      const yamlContent = fs.readFileSync(workspaceFilePath, 'utf8');
      const workspaceConfig = yaml.load(yamlContent);
      
      if (workspaceConfig.type !== 'bruno-workspace') {
        throw new Error('Invalid workspace: not a bruno workspace');
      }

      const workspaceUid = generateUidBasedOnHash(workspacePath);

      // Add to last opened workspaces
      lastOpenedWorkspaces.add(workspacePath, workspaceConfig);

      // Send workspace opened event to renderer
      mainWindow.webContents.send('main:workspace-opened', workspacePath, workspaceUid, workspaceConfig);

      return {
        workspaceConfig,
        workspaceUid,
        workspacePath
      };
    } catch (error) {
      console.error('Error opening workspace:', error);
      return Promise.reject(error);
    }
  });

  // Load workspace collections
  ipcMain.handle('renderer:load-workspace-collections', async (event, workspacePath) => {
    try {
      const workspaceFilePath = path.join(workspacePath, 'workspace.yml');
      
      if (!fs.existsSync(workspaceFilePath)) {
        throw new Error('Invalid workspace: workspace.yml not found');
      }

      const yamlContent = fs.readFileSync(workspaceFilePath, 'utf8');
      const workspaceConfig = yaml.load(yamlContent);
      
      // Return the collections array from workspace config
      return workspaceConfig.collections || [];
    } catch (error) {
      console.error('Error loading workspace collections:', error);
      return Promise.reject(error);
    }
  });

  // Get last opened workspaces
  ipcMain.handle('renderer:get-last-opened-workspaces', async () => {
    try {
      return lastOpenedWorkspaces.getAll();
    } catch (error) {
      console.error('Error getting last opened workspaces:', error);
      return Promise.reject(error);
    }
  });

  // Save workspace docs
  ipcMain.handle('renderer:save-workspace-docs', async (event, workspacePath, docs) => {
    try {
      const workspaceFilePath = path.join(workspacePath, 'workspace.yml');
      
      if (!fs.existsSync(workspaceFilePath)) {
        throw new Error('Invalid workspace: workspace.yml not found');
      }

      const yamlContent = fs.readFileSync(workspaceFilePath, 'utf8');
      const workspaceConfig = yaml.load(yamlContent);
      
      // Update docs
      workspaceConfig.docs = docs;
      
      // Write back to file
      const updatedYamlContent = yaml.dump(workspaceConfig, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      await writeFile(workspaceFilePath, updatedYamlContent);
      
      return docs;
    } catch (error) {
      console.error('Error saving workspace docs:', error);
      return Promise.reject(error);
    }
  });

  // Add collection to workspace
  ipcMain.handle('renderer:add-collection-to-workspace', async (event, workspacePath, collection) => {
    try {
      const workspaceFilePath = path.join(workspacePath, 'workspace.yml');
      
      if (!fs.existsSync(workspaceFilePath)) {
        throw new Error('Invalid workspace: workspace.yml not found');
      }

      const yamlContent = fs.readFileSync(workspaceFilePath, 'utf8');
      const workspaceConfig = yaml.load(yamlContent);
      
      // Initialize collections array if it doesn't exist
      if (!workspaceConfig.collections) {
        workspaceConfig.collections = [];
      }
      
      // Check if collection already exists
      const existingCollection = workspaceConfig.collections.find(c => 
        c.name === collection.name || c.location === collection.location
      );
      
      if (!existingCollection) {
        workspaceConfig.collections.push(collection);
        
        // Write back to file
        const updatedYamlContent = yaml.dump(workspaceConfig, { 
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
        await writeFile(workspaceFilePath, updatedYamlContent);
      }
      
      return workspaceConfig.collections;
    } catch (error) {
      console.error('Error adding collection to workspace:', error);
      return Promise.reject(error);
    }
  });

  // Browse directory (reuse from collection)
  ipcMain.handle('renderer:browse-directory', async () => {
    try {
      return await browseDirectory();
    } catch (error) {
      console.error('Error browsing directory:', error);
      return Promise.reject(error);
    }
  });
};

module.exports = registerWorkspaceIpc; 