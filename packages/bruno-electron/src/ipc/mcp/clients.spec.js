const fs = require('fs');
const os = require('os');
const path = require('path');
const { createMcpClientManager, removeCodexBlock } = require('./clients');

const cliNotFound = () => Promise.reject(Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' }));

describe('MCP client manager', () => {
  let root;
  let homeDir;
  let appDataDir;

  const createManager = (overrides = {}) => createMcpClientManager({
    homeDir,
    appDataDir,
    platform: 'darwin',
    env: {},
    run: cliNotFound,
    ...overrides
  });

  const read = (...segments) => fs.readFileSync(path.join(...segments), 'utf8');
  const write = (filePath, content) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  };
  const byId = (clients, id) => clients.find((client) => client.id === id);

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-mcp-'));
    homeDir = path.join(root, 'home');
    appDataDir = path.join(root, 'appdata');
    fs.mkdirSync(homeDir, { recursive: true });
    fs.mkdirSync(appDataDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it('lists every supported client and detects only the ones present', async () => {
    fs.mkdirSync(path.join(homeDir, '.cursor'));
    fs.mkdirSync(path.join(appDataDir, 'Code', 'User'), { recursive: true });

    const clients = await createManager().listClients();

    expect(clients.map((client) => client.id)).toEqual(['claude-code', 'claude-desktop', 'codex', 'cursor', 'vscode']);
    expect(byId(clients, 'cursor')).toMatchObject({ detected: true, installed: false, error: null });
    expect(byId(clients, 'vscode')).toMatchObject({ detected: true, installed: false });
    expect(byId(clients, 'codex')).toMatchObject({ detected: false, installed: false });
  });

  it('adds the server to Cursor without disturbing other servers or comments', async () => {
    const configPath = path.join(homeDir, '.cursor', 'mcp.json');
    write(configPath, '{\n  // my servers\n  "mcpServers": {\n    "other": { "command": "x" }\n  }\n}\n');

    const result = await createManager().installClient('cursor');

    expect(result.installed).toBe(true);
    const text = read(configPath);
    expect(text).toContain('// my servers');
    expect(text).toContain('"other"');
    expect(text).toContain('"@usebruno/mcp"');
  });

  it('removes only the bruno entry on uninstall', async () => {
    const configPath = path.join(homeDir, '.cursor', 'mcp.json');
    write(configPath, '{ "mcpServers": { "other": { "command": "x" } } }');
    const manager = createManager();

    await manager.installClient('cursor');
    const result = await manager.uninstallClient('cursor');

    expect(result.installed).toBe(false);
    expect(JSON.parse(read(configPath)).mcpServers).toEqual({ other: { command: 'x' } });
  });

  it('creates the VS Code config under "servers" with a stdio type', async () => {
    fs.mkdirSync(path.join(appDataDir, 'Code', 'User'), { recursive: true });

    await createManager().installClient('vscode');

    expect(JSON.parse(read(appDataDir, 'Code', 'User', 'mcp.json'))).toEqual({
      servers: { bruno: { type: 'stdio', command: 'npx', args: ['-y', '@usebruno/mcp'] } }
    });
  });

  it('launches through cmd on Windows', async () => {
    fs.mkdirSync(path.join(appDataDir, 'Claude'), { recursive: true });

    await createManager({ platform: 'win32' }).installClient('claude-desktop');

    expect(JSON.parse(read(appDataDir, 'Claude', 'claude_desktop_config.json')).mcpServers.bruno).toEqual({
      command: 'cmd',
      args: ['/c', 'npx', '-y', '@usebruno/mcp']
    });
  });

  it('refuses to rewrite a config it cannot parse', async () => {
    const configPath = path.join(homeDir, '.cursor', 'mcp.json');
    write(configPath, '{ "mcpServers": ');

    await expect(createManager().installClient('cursor')).rejects.toThrow('Could not parse');
    expect(read(configPath)).toBe('{ "mcpServers": ');
  });

  it('reports a parse failure per client instead of failing the whole list', async () => {
    write(path.join(homeDir, '.cursor', 'mcp.json'), 'not json');

    const clients = await createManager().listClients();

    expect(byId(clients, 'cursor').error).toContain('Could not parse');
    expect(byId(clients, 'vscode').error).toBeNull();
  });

  describe('Codex', () => {
    const configPath = () => path.join(homeDir, '.codex', 'config.toml');

    it('appends a table, keeps the rest of the file, and does not duplicate on reinstall', async () => {
      write(configPath(), 'model = "gpt-5"\n\n[mcp_servers.other]\ncommand = "x"\n');
      const manager = createManager();

      await manager.installClient('codex');
      const result = await manager.installClient('codex');

      expect(result.installed).toBe(true);
      const text = read(configPath());
      expect(text.match(/\[mcp_servers\.bruno\]/g)).toHaveLength(1);
      expect(text).toContain('model = "gpt-5"');
      expect(text).toContain('args = ["-y", "@usebruno/mcp"]');
    });

    it('removes the bruno table and its sub-tables only', () => {
      const text = [
        'model = "gpt-5"',
        '',
        '[mcp_servers.bruno]',
        'command = "npx"',
        '',
        '[mcp_servers.bruno.env]',
        'FOO = "1"',
        '',
        '[mcp_servers.other]',
        'command = "x"',
        ''
      ].join('\n');

      expect(removeCodexBlock(text)).toBe('model = "gpt-5"\n\n[mcp_servers.other]\ncommand = "x"\n');
    });
  });

  describe('Claude Code', () => {
    it('uses the claude CLI when it is available', async () => {
      const configPath = path.join(homeDir, '.claude.json');
      write(configPath, '{}');
      const run = jest.fn(async () => {
        write(configPath, JSON.stringify({ mcpServers: { bruno: { command: 'npx' } } }));
      });

      const result = await createManager({ run }).installClient('claude-code');

      expect(run).toHaveBeenCalledWith('claude', ['mcp', 'add', '--scope', 'user', 'bruno', '--', 'npx', '-y', '@usebruno/mcp']);
      expect(result.installed).toBe(true);
    });

    it('edits ~/.claude.json directly when the CLI is not found', async () => {
      const configPath = path.join(homeDir, '.claude.json');
      write(configPath, JSON.stringify({ numStartups: 3, projects: {} }, null, 2));

      const result = await createManager().installClient('claude-code');

      expect(result.installed).toBe(true);
      const data = JSON.parse(read(configPath));
      expect(data.numStartups).toBe(3);
      expect(data.mcpServers.bruno.args).toEqual(['-y', '@usebruno/mcp']);
    });

    it('honours CLAUDE_CONFIG_DIR', async () => {
      const configDir = path.join(root, 'claude-config');
      fs.mkdirSync(configDir);

      const clients = await createManager({ env: { CLAUDE_CONFIG_DIR: configDir } }).listClients();

      expect(byId(clients, 'claude-code')).toMatchObject({
        detected: true,
        configPath: path.join(configDir, '.claude.json')
      });
    });
  });

  it('rejects unknown client ids', async () => {
    await expect(createManager().installClient('nope')).rejects.toThrow('Unknown MCP client');
  });
});
