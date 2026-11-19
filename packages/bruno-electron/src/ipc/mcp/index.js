const { ipcMain, app } = require('electron');
const { waitForShellEnv } = require('../../store/shell-env-state');
const { createMcpClientManager, runCommand } = require('./clients');

const assertClientId = (clientId) => {
  if (typeof clientId !== 'string' || !clientId) {
    throw new Error('An MCP client id is required');
  }
};

const registerMcpIpc = () => {
  const manager = createMcpClientManager({
    homeDir: app.getPath('home'),
    appDataDir: app.getPath('appData'),
    // A GUI-launched app inherits a minimal PATH; the login-shell PATH is what finds `claude`.
    run: async (executable, args) => {
      await waitForShellEnv().catch(() => {});
      return runCommand(executable, args);
    }
  });

  ipcMain.handle('renderer:mcp-list-clients', () => manager.listClients());

  ipcMain.handle('renderer:mcp-install-client', (_event, clientId) => {
    assertClientId(clientId);
    return manager.installClient(clientId);
  });

  ipcMain.handle('renderer:mcp-uninstall-client', (_event, clientId) => {
    assertClientId(clientId);
    return manager.uninstallClient(clientId);
  });
};

module.exports = registerMcpIpc;
