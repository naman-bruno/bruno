import React from 'react';
import { IconCheck, IconCopy, IconCircleCheck } from '@tabler/icons';
import ActionIcon from 'ui/ActionIcon';
import Button from 'ui/Button';
import useCopyToClipboard from 'hooks/useCopyToClipboard';
import StyledWrapper from './StyledWrapper';

const getStatusText = (client) => {
  if (client.error) return client.error;
  if (client.detected) return client.configPath;
  return 'Not found on this machine';
};

const McpClientRow = ({ client, pending, disabled, onInstall, onUninstall }) => {
  const { copied, copyToClipboard } = useCopyToClipboard();
  const copyLabel = client.id === 'claude-code' ? 'Copy command' : 'Copy config';
  const canInstall = client.detected && !client.error;

  return (
    <StyledWrapper data-testid={`mcp-client-${client.id}`}>
      <div className="mcp-client-info">
        <span className="mcp-client-name">{client.name}</span>
        <span className={`mcp-client-status ${client.error ? 'has-error' : ''}`} title={getStatusText(client)}>
          {getStatusText(client)}
        </span>
      </div>

      <div className="mcp-client-actions">
        {client.installed && (
          <span className="mcp-installed-badge" data-testid={`mcp-client-${client.id}-installed`}>
            <IconCircleCheck size={14} strokeWidth={1.75} />
            Installed
          </span>
        )}
        <ActionIcon label={copied ? 'Copied' : copyLabel} onClick={() => copyToClipboard(client.snippet)}>
          {copied ? <IconCheck size={16} strokeWidth={1.5} /> : <IconCopy size={16} strokeWidth={1.5} />}
        </ActionIcon>
        {client.installed ? (
          <Button
            size="sm"
            color="secondary"
            variant="outline"
            loading={pending}
            disabled={disabled}
            onClick={() => onUninstall(client)}
            data-testid={`mcp-client-${client.id}-uninstall`}
          >
            Remove
          </Button>
        ) : (
          <Button
            size="sm"
            loading={pending}
            disabled={disabled || !canInstall}
            onClick={() => onInstall(client)}
            data-testid={`mcp-client-${client.id}-install`}
          >
            Install
          </Button>
        )}
      </div>
    </StyledWrapper>
  );
};

export default McpClientRow;
