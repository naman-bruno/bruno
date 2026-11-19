import { useCallback, useEffect, useState } from 'react';

const useMcpClients = () => {
  const [clients, setClients] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [pendingClientId, setPendingClientId] = useState(null);

  const refresh = useCallback(() => {
    return window.ipcRenderer
      .invoke('renderer:mcp-list-clients')
      .then((list) => {
        setClients(list);
        setLoadError(null);
      })
      .catch((error) => {
        setClients([]);
        setLoadError(error?.message || 'Failed to read MCP client configs');
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runClientAction = useCallback(async (channel, clientId) => {
    setPendingClientId(clientId);
    try {
      const updated = await window.ipcRenderer.invoke(channel, clientId);
      setClients((current) => (current || []).map((client) => (client.id === updated.id ? updated : client)));
      return updated;
    } finally {
      setPendingClientId(null);
    }
  }, []);

  const install = useCallback((clientId) => runClientAction('renderer:mcp-install-client', clientId), [runClientAction]);
  const uninstall = useCallback((clientId) => runClientAction('renderer:mcp-uninstall-client', clientId), [runClientAction]);

  return { clients, loadError, pendingClientId, refresh, install, uninstall };
};

export default useMcpClients;
