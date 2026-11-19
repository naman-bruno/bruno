const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const jsonc = require('jsonc-parser');

const SERVER_NAME = 'bruno';
const MCP_PACKAGE = '@usebruno/mcp';
const CLI_TIMEOUT_MS = 15000;

const JSON_FORMAT = { formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' } };

/**
 * The stdio launch command every client gets. On Windows `npx` is `npx.cmd`, which most
 * clients can't spawn without a shell, so it goes through `cmd /c`.
 */
const getServerCommand = (platform) => {
  return platform === 'win32'
    ? { command: 'cmd', args: ['/c', 'npx', '-y', MCP_PACKAGE] }
    : { command: 'npx', args: ['-y', MCP_PACKAGE] };
};

const exists = (target) => fs.existsSync(target);

const readTextIfExists = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

/** Writes via a temp file + rename so a crash never leaves another app's config half-written. */
const writeFileAtomic = async (filePath, content) => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.bruno-tmp`;
  await fs.promises.writeFile(tempPath, content, 'utf8');
  try {
    const { mode } = await fs.promises.stat(filePath);
    await fs.promises.chmod(tempPath, mode);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.promises.rename(tempPath, filePath);
};

const parseJsoncObject = (text, filePath) => {
  if (!text || !text.trim()) return {};
  const errors = [];
  const data = jsonc.parse(text, errors, { allowTrailingComma: true });
  if (errors.length || !data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Could not parse ${filePath}. Fix the file or add the Bruno MCP server to it manually.`);
  }
  return data;
};

/**
 * A client whose config is a JSON(C) file with the servers under `rootKey`. Edits go through
 * jsonc-parser's `modify`, which only touches the `bruno` entry and keeps comments and formatting.
 */
const createJsonClient = ({ rootKey, buildEntry }) => ({
  isInstalled: async ({ configPath }) => {
    const data = parseJsoncObject(await readTextIfExists(configPath), configPath);
    return Boolean(data[rootKey] && data[rootKey][SERVER_NAME]);
  },
  install: async ({ configPath, platform }) => {
    const text = (await readTextIfExists(configPath)) || '{}';
    parseJsoncObject(text, configPath);
    const edits = jsonc.modify(text, [rootKey, SERVER_NAME], buildEntry(platform), JSON_FORMAT);
    await writeFileAtomic(configPath, jsonc.applyEdits(text, edits));
  },
  uninstall: async ({ configPath }) => {
    const text = await readTextIfExists(configPath);
    if (text === null) return;
    parseJsoncObject(text, configPath);
    const edits = jsonc.modify(text, [rootKey, SERVER_NAME], undefined, JSON_FORMAT);
    await writeFileAtomic(configPath, jsonc.applyEdits(text, edits));
  },
  getSnippet: (platform) => JSON.stringify({ [rootKey]: { [SERVER_NAME]: buildEntry(platform) } }, null, 2)
});

const mcpServersClient = createJsonClient({ rootKey: 'mcpServers', buildEntry: getServerCommand });

// ---- Codex (TOML) -----------------------------------------------------------------------------

const CODEX_TABLE_HEADER = /^\s*\[\s*mcp_servers\s*\.\s*(?:bruno|"bruno")\s*\]\s*(?:#.*)?$/;
const CODEX_SUBTABLE_HEADER = /^\s*\[\s*mcp_servers\s*\.\s*(?:bruno|"bruno")\s*\./;
const TOML_HEADER = /^\s*\[/;

const buildCodexBlock = (platform) => {
  const { command, args } = getServerCommand(platform);
  return [
    `[mcp_servers.${SERVER_NAME}]`,
    `command = ${JSON.stringify(command)}`,
    `args = [${args.map((arg) => JSON.stringify(arg)).join(', ')}]`
  ].join('\n');
};

/** Removes the `[mcp_servers.bruno]` table (and its `[mcp_servers.bruno.*]` sub-tables) as text, so the rest of the file stays as the user wrote it. */
const removeCodexBlock = (text) => {
  const lines = text.split(/\r\n|\r|\n/);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const kept = [];
  let skipping = false;
  for (const line of lines) {
    if (CODEX_TABLE_HEADER.test(line) || CODEX_SUBTABLE_HEADER.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && TOML_HEADER.test(line)) skipping = false;
    if (!skipping) kept.push(line);
  }
  return kept.join(eol).replace(/(\r?\n){3,}/g, `${eol}${eol}`);
};

const codexClient = {
  isInstalled: async ({ configPath }) => {
    const text = await readTextIfExists(configPath);
    return Boolean(text) && text.split(/\r\n|\r|\n/).some((line) => CODEX_TABLE_HEADER.test(line));
  },
  install: async ({ configPath, platform }) => {
    const text = (await readTextIfExists(configPath)) || '';
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const block = buildCodexBlock(platform).split('\n').join(eol);
    const prefix = text.trim() ? `${text.replace(/\s*$/, '')}${eol}${eol}` : '';
    await writeFileAtomic(configPath, `${prefix}${block}${eol}`);
  },
  uninstall: async ({ configPath }) => {
    const text = await readTextIfExists(configPath);
    if (text === null) return;
    await writeFileAtomic(configPath, removeCodexBlock(text));
  },
  getSnippet: buildCodexBlock
};

// ---- Claude Code ------------------------------------------------------------------------------

const runCommand = (executable, args) => new Promise((resolve, reject) => {
  execFile(executable, args, { encoding: 'utf8', timeout: CLI_TIMEOUT_MS, windowsHide: true }, (error, stdout) => {
    if (error) return reject(error);
    resolve(stdout);
  });
});

/**
 * Claude Code rewrites `~/.claude.json` often, so its own CLI is the preferred writer. When the
 * CLI isn't reachable from Bruno (not on PATH, `claude.cmd` on Windows), fall back to a surgical
 * JSON edit of the user-scope `mcpServers`.
 */
const claudeCodeClient = {
  isInstalled: mcpServersClient.isInstalled,
  install: async (ctx) => {
    const { command, args } = getServerCommand(ctx.platform);
    try {
      await ctx.runCommand('claude', ['mcp', 'add', '--scope', 'user', SERVER_NAME, '--', command, ...args]);
      if (await mcpServersClient.isInstalled(ctx)) return;
    } catch (error) {
      // fall through to the direct edit
    }
    await mcpServersClient.install(ctx);
  },
  uninstall: async (ctx) => {
    try {
      await ctx.runCommand('claude', ['mcp', 'remove', '--scope', 'user', SERVER_NAME]);
      if (!(await mcpServersClient.isInstalled(ctx))) return;
    } catch (error) {
      // fall through to the direct edit
    }
    await mcpServersClient.uninstall(ctx);
  },
  getSnippet: (platform) => {
    const { command, args } = getServerCommand(platform);
    return `claude mcp add --scope user ${SERVER_NAME} -- ${[command, ...args].join(' ')}`;
  }
};

// ---- Client registry --------------------------------------------------------------------------

/**
 * `homeDir` / `appDataDir` are injected (Electron's `app.getPath('home' | 'appData')` in the app)
 * so the registry is testable against a temp directory.
 */
const getClientDefinitions = ({ homeDir, appDataDir, env = {} }) => {
  const claudeConfigDir = env.CLAUDE_CONFIG_DIR || null;
  const codexHome = env.CODEX_HOME || path.join(homeDir, '.codex');
  const vscodeUserDir = path.join(appDataDir, 'Code', 'User');
  const claudeDesktopDir = path.join(appDataDir, 'Claude');

  return [
    {
      id: 'claude-code',
      name: 'Claude Code',
      configPath: claudeConfigDir ? path.join(claudeConfigDir, '.claude.json') : path.join(homeDir, '.claude.json'),
      detectPaths: claudeConfigDir
        ? [claudeConfigDir]
        : [path.join(homeDir, '.claude.json'), path.join(homeDir, '.claude')],
      restartHint: 'Start a new Claude Code session to use it.',
      handler: claudeCodeClient
    },
    {
      id: 'claude-desktop',
      name: 'Claude Desktop',
      configPath: path.join(claudeDesktopDir, 'claude_desktop_config.json'),
      detectPaths: [claudeDesktopDir],
      restartHint: 'Quit and reopen Claude Desktop to use it.',
      handler: mcpServersClient
    },
    {
      id: 'codex',
      name: 'Codex',
      configPath: path.join(codexHome, 'config.toml'),
      detectPaths: [codexHome],
      restartHint: 'Start a new Codex session to use it.',
      handler: codexClient
    },
    {
      id: 'cursor',
      name: 'Cursor',
      configPath: path.join(homeDir, '.cursor', 'mcp.json'),
      detectPaths: [path.join(homeDir, '.cursor')],
      restartHint: 'Reload Cursor, or toggle the server in Cursor Settings > MCP.',
      handler: mcpServersClient
    },
    {
      id: 'vscode',
      name: 'VS Code',
      configPath: path.join(vscodeUserDir, 'mcp.json'),
      detectPaths: [vscodeUserDir],
      restartHint: 'Start the server from the MCP: List Servers command in VS Code.',
      handler: createJsonClient({
        rootKey: 'servers',
        buildEntry: (platform) => ({ type: 'stdio', ...getServerCommand(platform) })
      })
    }
  ];
};

const describeClient = async (client, ctx) => {
  const detected = client.detectPaths.some(exists);
  let installed = false;
  let error = null;
  try {
    installed = await client.handler.isInstalled({ ...ctx, configPath: client.configPath });
  } catch (err) {
    error = err.message;
  }
  return {
    id: client.id,
    name: client.name,
    detected: detected || installed,
    installed,
    error,
    configPath: client.configPath,
    restartHint: client.restartHint,
    snippet: client.handler.getSnippet(ctx.platform)
  };
};

const createMcpClientManager = ({ homeDir, appDataDir, platform = process.platform, env = process.env, run = runCommand }) => {
  const ctx = { platform, runCommand: run };
  const clients = getClientDefinitions({ homeDir, appDataDir, env });

  const findClient = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error(`Unknown MCP client: ${clientId}`);
    return client;
  };

  const listClients = () => Promise.all(clients.map((client) => describeClient(client, ctx)));

  const installClient = async (clientId) => {
    const client = findClient(clientId);
    const clientCtx = { ...ctx, configPath: client.configPath };
    if (!(await client.handler.isInstalled(clientCtx))) {
      await client.handler.install(clientCtx);
    }
    return describeClient(client, ctx);
  };

  const uninstallClient = async (clientId) => {
    const client = findClient(clientId);
    await client.handler.uninstall({ ...ctx, configPath: client.configPath });
    return describeClient(client, ctx);
  };

  return { listClients, installClient, uninstallClient };
};

module.exports = {
  SERVER_NAME,
  MCP_PACKAGE,
  getServerCommand,
  removeCodexBlock,
  runCommand,
  createMcpClientManager
};
