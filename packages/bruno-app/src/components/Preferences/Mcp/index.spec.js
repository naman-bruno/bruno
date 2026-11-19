import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { ThemeProvider } from 'providers/Theme';
import Mcp from './index';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() }
}));

const buildClient = (overrides) => ({
  detected: true,
  installed: false,
  error: null,
  configPath: '/home/me/.cursor/mcp.json',
  restartHint: 'Reload Cursor.',
  snippet: '{}',
  ...overrides
});

const CLIENTS = [
  buildClient({ id: 'cursor', name: 'Cursor' }),
  buildClient({ id: 'codex', name: 'Codex', detected: false }),
  buildClient({ id: 'claude-code', name: 'Claude Code', installed: true })
];

describe('Preferences: MCP', () => {
  let invoke;

  beforeEach(() => {
    invoke = jest.fn((channel, clientId) => {
      if (channel === 'renderer:mcp-list-clients') return Promise.resolve(CLIENTS);
      const client = CLIENTS.find((c) => c.id === clientId);
      return Promise.resolve({ ...client, installed: channel === 'renderer:mcp-install-client' });
    });
    window.ipcRenderer = { invoke, send: jest.fn(), openExternal: jest.fn() };
  });

  afterEach(() => {
    delete window.ipcRenderer;
    jest.clearAllMocks();
  });

  const renderMcp = () => render(
    <ThemeProvider>
      <Mcp />
    </ThemeProvider>
  );

  it('enables install only for detected clients and shows installed ones', async () => {
    renderMcp();

    await screen.findByTestId('mcp-client-cursor');
    expect(screen.getByTestId('mcp-client-cursor-install')).not.toBeDisabled();
    expect(screen.getByTestId('mcp-client-codex-install')).toBeDisabled();
    expect(screen.getByText('Not found on this machine')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-client-claude-code-installed')).toBeInTheDocument();
    expect(screen.getByTestId('mcp-client-claude-code-uninstall')).toBeInTheDocument();
  });

  it('installs into a client and flips the row to installed', async () => {
    renderMcp();

    fireEvent.click(await screen.findByTestId('mcp-client-cursor-install'));

    await screen.findByTestId('mcp-client-cursor-installed');
    expect(invoke).toHaveBeenCalledWith('renderer:mcp-install-client', 'cursor');
    expect(toast.success).toHaveBeenCalledWith('Bruno MCP added to Cursor. Reload Cursor.');
  });

  it('surfaces an install failure as a toast', async () => {
    invoke.mockImplementation((channel) => (channel === 'renderer:mcp-list-clients'
      ? Promise.resolve(CLIENTS)
      : Promise.reject(new Error('Could not parse mcp.json'))));
    renderMcp();

    fireEvent.click(await screen.findByTestId('mcp-client-cursor-install'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not parse mcp.json'));
    expect(screen.queryByTestId('mcp-client-cursor-installed')).not.toBeInTheDocument();
  });

  it('opens the docs externally', async () => {
    renderMcp();

    fireEvent.click(screen.getByTestId('mcp-docs-link'));

    expect(window.ipcRenderer.openExternal).toHaveBeenCalledWith('https://github.com/usebruno/bruno-mcp');
    await screen.findByTestId('mcp-client-cursor');
  });
});
