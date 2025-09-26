import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { IconTerminal2 } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import '@xterm/xterm/css/xterm.css';

const TerminalTab = () => {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const sessionId = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized || !terminalRef.current) return;

    setIsInitialized(true);

    const initializeTerminal = async () => {
      try {
        // Create terminal instance
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4',
            selection: '#264f78',
            black: '#1e1e1e',
            red: '#f14c4c',
            green: '#23d18b',
            yellow: '#f5f543',
            blue: '#3b8eea',
            magenta: '#d670d6',
            cyan: '#29b8db',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#e5e5e5',
          },
          allowProposedApi: true,
        });

        // Create fit addon
        const fit = new FitAddon();
        terminal.loadAddon(fit);

        // Store references
        terminalInstance.current = terminal;
        fitAddon.current = fit;

        // Open terminal in the DOM
        terminal.open(terminalRef.current);

        // Wait for DOM to be ready, then fit
        await new Promise(resolve => setTimeout(resolve, 100));
        fit.fit();

        // Check if we're in electron environment
        if (window.ipcRenderer) {
          // Request terminal session from main process
          const newSessionId = await window.ipcRenderer.invoke('terminal:create');

          if (newSessionId) {
            sessionId.current = newSessionId;
            setIsConnected(true);

            // Listen for terminal data - use a unique handler
            const handleTerminalData = data => {
              if (terminalInstance.current && data) {
                try {
                  terminalInstance.current.write(data);
                } catch (error) {
                  console.warn('Failed to write to terminal:', error);
                }
              }
            };

            // Set up IPC listener
            window.ipcRenderer.on(`terminal:data:${newSessionId}`, handleTerminalData);

            // Handle terminal input
            terminal.onData(data => {
              if (data && sessionId.current) {
                window.ipcRenderer.send('terminal:input', sessionId.current, data);
              }
            });

            // Handle terminal resize
            terminal.onResize(({ cols, rows }) => {
              if (sessionId.current) {
                window.ipcRenderer.send('terminal:resize', sessionId.current, { cols, rows });
              }
            });

            // Initial resize after everything is set up
            setTimeout(() => {
              if (terminalInstance.current && fitAddon.current && sessionId.current) {
                try {
                  fitAddon.current.fit();
                  const { cols, rows } = terminalInstance.current;
                  if (cols && rows) {
                    window.ipcRenderer.send('terminal:resize', sessionId.current, { cols, rows });
                  }
                } catch (error) {
                  console.warn('Failed to resize terminal:', error);
                }
              }
            }, 200);

            // Store cleanup function for this specific session
            terminalInstance.current._cleanup = () => {
              window.ipcRenderer.removeListener(`terminal:data:${newSessionId}`, handleTerminalData);
              if (sessionId.current) {
                window.ipcRenderer.send('terminal:kill', sessionId.current);
                sessionId.current = null;
              }
            };
          }
        } else {
          // Fallback for non-electron environment
          terminal.write('Terminal is only available in the desktop app.\r\n');
          terminal.write('Please use the electron desktop version to access the terminal.\r\n');
          setIsConnected(true);
        }

        // Handle resize
        const handleResize = () => {
          if (fitAddon.current && terminalInstance.current) {
            try {
              fitAddon.current.fit();
            } catch (error) {
              console.warn('Failed to resize terminal:', error);
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Store cleanup function
        terminalInstance.current._resizeCleanup = () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        if (terminalInstance.current) {
          terminalInstance.current.write('Failed to initialize terminal.\r\n');
        }
      }
    };

    initializeTerminal();

    // Cleanup function
    return () => {
      if (terminalInstance.current) {
        // Clean up IPC listeners and terminal session
        if (terminalInstance.current._cleanup) {
          terminalInstance.current._cleanup();
        }

        // Clean up resize listener
        if (terminalInstance.current._resizeCleanup) {
          terminalInstance.current._resizeCleanup();
        }

        // Dispose terminal
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }

      fitAddon.current = null;
      sessionId.current = null;
      setIsConnected(false);
      setIsInitialized(false);
    };
  }, []); // Empty dependency array to ensure this only runs once

  // Fit terminal when component becomes visible (but don't reinitialize)
  useEffect(() => {
    if (isConnected && fitAddon.current && terminalInstance.current) {
      const timer = setTimeout(() => {
        try {
          fitAddon.current.fit();
        } catch (error) {
          console.warn('Failed to fit terminal on visibility change:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return (
    <StyledWrapper>
      <div className="terminal-content">
        {!isConnected && window.ipcRenderer && (
          <div className="terminal-loading">
            <IconTerminal2 size={24} strokeWidth={1.5} />
            <span>Connecting to terminal...</span>
          </div>
        )}
        <div
          ref={terminalRef}
          className="terminal-container"
          style={{
            height: '100%',
            width: '100%',
            display: isConnected || !window.ipcRenderer ? 'block' : 'none',
          }}
        />
      </div>
    </StyledWrapper>
  );
};

export default TerminalTab;
