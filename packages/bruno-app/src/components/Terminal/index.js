import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  IconX, 
  IconTrash, 
  IconFilter,
  IconAlertTriangle, 
  IconAlertCircle, 
  IconBug,
  IconCode,
  IconChevronDown,
  IconTerminal2,
  IconNetwork
} from '@tabler/icons';
import { 
  closeTerminal, 
  clearLogs, 
  updateFilter, 
  toggleAllFilters,
  setActiveTab 
} from 'providers/ReduxStore/slices/logs';
import NetworkTab from './NetworkTab';
import RequestDetailsPanel from './RequestDetailsPanel';
import StyledWrapper from './StyledWrapper';

const LogIcon = ({ type }) => {
  const iconProps = { size: 16, strokeWidth: 1.5 };
  
  switch (type) {
    case 'error':
      return <IconAlertCircle className="log-icon error" {...iconProps} />;
    case 'warn':
      return <IconAlertTriangle className="log-icon warn" {...iconProps} />;
    case 'info':
      return <IconAlertTriangle className="log-icon info" {...iconProps} />;
    case 'debug':
      return <IconBug className="log-icon debug" {...iconProps} />;
    default:
      return <IconCode className="log-icon log" {...iconProps} />;
  }
};

const LogLevel = ({ type }) => {
  const levels = {
    error: 'ERR',
    warn: 'WRN', 
    info: 'INF',
    debug: 'DBG',
    log: 'LOG'
  };
  
  return <span className={`log-level ${type}`}>{levels[type] || 'LOG'}</span>;
};

const LogTimestamp = ({ timestamp }) => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  return <span className="log-timestamp">{time}</span>;
};

const LogMessage = ({ message, args }) => {
  // Try to format complex objects nicely
  const formatMessage = (msg, originalArgs) => {
    if (originalArgs && originalArgs.length > 0) {
      // If we have original args, try to format them better
      return originalArgs.map((arg, index) => {
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ');
    }
    return msg;
  };

  return (
    <span className="log-message">
      {formatMessage(message, args)}
    </span>
  );
};

const FilterDropdown = ({ filters, logCounts, onFilterToggle, onToggleAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState('left');

  const allFiltersEnabled = Object.values(filters).every(f => f);
  const activeFilters = Object.entries(filters).filter(([_, enabled]) => enabled);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check dropdown positioning when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const dropdownWidth = 220; // Approximate dropdown width with padding
      
      // If dropdown would go off-screen on the right, position it to the right
      if (rect.left + dropdownWidth > screenWidth - 20) {
        setDropdownPosition('right');
      } else {
        setDropdownPosition('left');
      }
    }
  }, [isOpen]);

  const filterLabels = {
    error: 'Errors',
    warn: 'Warnings', 
    info: 'Info',
    debug: 'Debug',
    log: 'Logs'
  };

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button 
        className="filter-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Filter logs"
      >
        <IconFilter size={16} strokeWidth={1.5} />
        <span className="filter-summary">
          {activeFilters.length === 5 ? 'All' : `${activeFilters.length}/5`}
        </span>
        <IconChevronDown size={14} strokeWidth={1.5} />
      </button>
      
      {isOpen && (
        <div className={`filter-dropdown-menu ${dropdownPosition}`}>
          <div className="filter-dropdown-header">
            <span>Filter Logs</span>
            <button 
              className="filter-toggle-all"
              onClick={() => onToggleAll(!allFiltersEnabled)}
            >
              {allFiltersEnabled ? 'Hide All' : 'Show All'}
            </button>
          </div>
          
          <div className="filter-dropdown-options">
            {['error', 'warn', 'info', 'debug', 'log'].map(type => (
              <label key={type} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters[type]}
                  onChange={(e) => onFilterToggle(type, e.target.checked)}
                />
                <div className="filter-option-content">
                  <LogIcon type={type} />
                  <span className="filter-option-label">{filterLabels[type]}</span>
                  <span className="filter-option-count">({logCounts[type] || 0})</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ConsoleTab = ({ logs, filters, logCounts, onFilterToggle, onToggleAll, onClearLogs }) => {
  const logsEndRef = useRef(null);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Filter logs based on active filters
  const filteredLogs = logs.filter(log => filters[log.type]);

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="tab-title">
          <IconTerminal2 size={16} strokeWidth={1.5} />
          <span>Console</span>
          <span className="log-count">({filteredLogs.length} of {logs.length})</span>
        </div>
        
        <div className="tab-controls">
          <div className="filter-controls">
            <FilterDropdown
              filters={filters}
              logCounts={logCounts}
              onFilterToggle={onFilterToggle}
              onToggleAll={onToggleAll}
            />
          </div>

          <div className="action-controls">
            <button 
              className="control-button"
              onClick={onClearLogs}
              title="Clear all logs"
            >
              <IconTrash size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="tab-content-area">
        {filteredLogs.length === 0 ? (
          <div className="terminal-empty">
            <IconTerminal2 size={48} strokeWidth={1} />
            <p>No logs to display</p>
            <span>Logs will appear here as your application runs</span>
          </div>
        ) : (
          <div className="logs-container">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <div className="log-meta">
                  <LogTimestamp timestamp={log.timestamp} />
                  <LogLevel type={log.type} />
                  <LogIcon type={log.type} />
                </div>
                <LogMessage message={log.message} args={log.args} />
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

const MIN_TERMINAL_HEIGHT = 200;
const MAX_TERMINAL_HEIGHT = window.innerHeight * 0.8;
const DEFAULT_TERMINAL_HEIGHT = 300;

const Terminal = () => {
  const dispatch = useDispatch();
  const { logs, filters, activeTab, selectedRequest } = useSelector(state => state.logs);
  const terminalRef = useRef(null);
  const [height, setHeight] = useState(DEFAULT_TERMINAL_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);

  // Resize functionality
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const rect = terminalRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newHeight = rect.bottom - e.clientY;
    const clampedHeight = Math.min(MAX_TERMINAL_HEIGHT, Math.max(MIN_TERMINAL_HEIGHT, newHeight));
    setHeight(clampedHeight);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Count logs by type
  const logCounts = logs.reduce((counts, log) => {
    counts[log.type] = (counts[log.type] || 0) + 1;
    return counts;
  }, {});

  const handleFilterToggle = (filterType, enabled) => {
    dispatch(updateFilter({ filterType, enabled }));
  };

  const handleClearLogs = () => {
    dispatch(clearLogs());
  };

  const handleCloseTerminal = () => {
    dispatch(closeTerminal());
  };

  const handleToggleAllFilters = (enabled) => {
    dispatch(toggleAllFilters(enabled));
  };

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'console':
        return (
          <ConsoleTab
            logs={logs}
            filters={filters}
            logCounts={logCounts}
            onFilterToggle={handleFilterToggle}
            onToggleAll={handleToggleAllFilters}
            onClearLogs={handleClearLogs}
          />
        );
      case 'network':
        return <NetworkTab />;
      default:
        return (
          <ConsoleTab
            logs={logs}
            filters={filters}
            logCounts={logCounts}
            onFilterToggle={handleFilterToggle}
            onToggleAll={handleToggleAllFilters}
            onClearLogs={handleClearLogs}
          />
        );
    }
  };

  return (
    <StyledWrapper style={{ height }} ref={terminalRef}>
      {/* Resize Handle */}
      <div 
        className="terminal-resize-handle"
        onMouseDown={handleMouseDown}
      />
      
      {/* Main Terminal Header with Tabs */}
      <div className="terminal-header">
        <div className="terminal-tabs">
          <button 
            className={`terminal-tab ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => handleTabChange('console')}
          >
            <IconTerminal2 size={16} strokeWidth={1.5} />
            <span>Console</span>
          </button>
          
          <button 
            className={`terminal-tab ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => handleTabChange('network')}
          >
            <IconNetwork size={16} strokeWidth={1.5} />
            <span>Network</span>
          </button>
        </div>
        
        <div className="terminal-controls">
          <button 
            className="control-button close-button"
            onClick={handleCloseTerminal}
            title="Close terminal"
          >
            <IconX size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="terminal-content">
        {activeTab === 'network' && selectedRequest ? (
          <div className="network-with-details">
            <div className="network-main">
              {renderTabContent()}
            </div>
            <RequestDetailsPanel />
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </StyledWrapper>
  );
};

export default Terminal; 