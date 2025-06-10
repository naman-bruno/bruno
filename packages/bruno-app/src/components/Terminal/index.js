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
  IconTerminal2
} from '@tabler/icons';
import { closeTerminal, clearLogs, updateFilter, toggleAllFilters } from 'providers/ReduxStore/slices/logs';
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
      const dropdownWidth = 200; // Approximate dropdown width
      
      // If dropdown would go off-screen, position it to the right
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

const MIN_TERMINAL_HEIGHT = 200;
const MAX_TERMINAL_HEIGHT = window.innerHeight * 0.8;
const DEFAULT_TERMINAL_HEIGHT = 300;

const Terminal = () => {
  const dispatch = useDispatch();
  const { logs, isTerminalOpen, filters } = useSelector(state => state.logs);
  const logsEndRef = useRef(null);
  const terminalRef = useRef(null);
  const [height, setHeight] = useState(DEFAULT_TERMINAL_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);

  // Auto-scroll to bottom when new logs arrive (since new logs are now at the bottom)
  useEffect(() => {
    if (logsEndRef.current && !isResizing) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isResizing]);

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

  // Filter logs based on active filters
  const filteredLogs = logs.filter(log => filters[log.type]);

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

  if (!isTerminalOpen) return null;

  return (
    <StyledWrapper style={{ height }} ref={terminalRef}>
      {/* Resize Handle */}
      <div 
        className="terminal-resize-handle"
        onMouseDown={handleMouseDown}
      />
      
      {/* Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <IconTerminal2 size={16} strokeWidth={1.5} />
          <span>Console</span>
          <span className="log-count">({filteredLogs.length} of {logs.length})</span>
        </div>
        
        <div className="terminal-controls">
          {/* Filter Controls */}
          <div className="filter-controls">
            <FilterDropdown
              filters={filters}
              logCounts={logCounts}
              onFilterToggle={handleFilterToggle}
              onToggleAll={handleToggleAllFilters}
            />
          </div>

          {/* Action Controls */}
          <div className="action-controls">
            <button 
              className="control-button"
              onClick={handleClearLogs}
              title="Clear all logs"
            >
              <IconTrash size={16} strokeWidth={1.5} />
            </button>
            
            <button 
              className="control-button close-button"
              onClick={handleCloseTerminal}
              title="Close terminal"
            >
              <IconX size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="terminal-content">
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
    </StyledWrapper>
  );
};

export default Terminal; 