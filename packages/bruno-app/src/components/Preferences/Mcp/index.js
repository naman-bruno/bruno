import React from 'react';
import toast from 'react-hot-toast';
import { IconExternalLink, IconRefresh } from '@tabler/icons';
import ActionIcon from 'ui/ActionIcon';
import McpClientRow from './McpClientRow';
import useMcpClients from './useMcpClients';
import StyledWrapper from './StyledWrapper';

const MCP_DOCS_URL = 'https://github.com/usebruno/bruno-mcp';
const MCP_LAUNCH_COMMAND = 'npx -y @usebruno/mcp';

const Mcp = () => {
  const { clients, loadError, pendingClientId, refresh, install, uninstall } = useMcpClients();

  const handleInstall = (client) => {
    install(client.id)
      .then(() => toast.success(`Bruno MCP added to ${client.name}. ${client.restartHint}`))
      .catch((error) => toast.error(error?.message || `Failed to add Bruno MCP to ${client.name}`));
  };

  const handleUninstall = (client) => {
    uninstall(client.id)
      .then(() => toast.success(`Bruno MCP removed from ${client.name}`))
      .catch((error) => toast.error(error?.message || `Failed to remove Bruno MCP from ${client.name}`));
  };

  const openDocs = () => window.ipcRenderer.openExternal(MCP_DOCS_URL);

  return (
    <StyledWrapper className="w-full" data-testid="preferences-mcp">
      <div className="mcp-section-title">MCP Server</div>

      <div className="mcp-card">
        <div className="mcp-card-header">
          <span className="mcp-card-title">Bruno MCP</span>
          <button type="button" className="mcp-docs-link" onClick={openDocs} data-testid="mcp-docs-link">
            Docs
            <IconExternalLink size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="mcp-card-body">
          <p className="mcp-description">
            Let AI agents find, read and run your Bruno collections. The server runs locally and picks up the
            workspaces and collections you have open in Bruno. Requires Node.js 20.12 or later.
          </p>
          <code className="mcp-command">{MCP_LAUNCH_COMMAND}</code>
        </div>
      </div>

      <div className="mcp-clients-header">
        <div className="mcp-section-title">Clients</div>
        <ActionIcon label="Rescan clients" size="sm" onClick={refresh} data-testid="mcp-refresh-clients">
          <IconRefresh size={14} strokeWidth={1.5} />
        </ActionIcon>
      </div>

      <div className="mcp-card">
        {clients === null && <div className="mcp-placeholder">Looking for installed clients…</div>}
        {loadError && <div className="mcp-placeholder has-error">{loadError}</div>}
        {(clients || []).map((client) => (
          <McpClientRow
            key={client.id}
            client={client}
            pending={pendingClientId === client.id}
            disabled={pendingClientId !== null && pendingClientId !== client.id}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
          />
        ))}
      </div>
    </StyledWrapper>
  );
};

export default Mcp;
