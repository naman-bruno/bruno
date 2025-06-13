import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  logs: [],
  debugErrors: [], // Array to store console.error calls
  isTerminalOpen: false,
  activeTab: 'console', // 'console', 'network', or 'debug'
  filters: {
    info: true,
    warn: true,
    error: true,
    debug: true,
    log: true
  },
  networkFilters: {
    GET: true,
    POST: true,
    PUT: true,
    DELETE: true,
    PATCH: true,
    HEAD: true,
    OPTIONS: true
  },
  selectedRequest: null, // For network tab details panel
  selectedError: null, // For debug tab details panel
  maxLogs: 1000, // Limit to prevent memory issues
  maxDebugErrors: 500 // Limit for debug errors
};

export const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLog: (state, action) => {
      const { type, args, timestamp } = action.payload;
      const newLog = {
        id: Date.now() + Math.random(),
        type: type || 'log',
        message: args ? args.join(' ') : '',
        args: args || [],
        timestamp: timestamp || new Date().toISOString()
      };
      
      // Add to the end so recent logs appear at the bottom
      state.logs.push(newLog);
      
      // Keep only the latest maxLogs entries
      if (state.logs.length > state.maxLogs) {
        state.logs = state.logs.slice(-state.maxLogs);
      }
    },
    // Add debug error (simplified)
    addDebugError: (state, action) => {
      const { message, stack, filename, lineno, colno, args, timestamp } = action.payload;
      const newError = {
        id: Date.now() + Math.random(),
        message: message || 'Unknown error',
        stack: stack,
        filename: filename,
        lineno: lineno,
        colno: colno,
        args: args || [],
        timestamp: timestamp || new Date().toISOString()
      };
      
      // Add to the end so recent errors appear at the bottom
      state.debugErrors.push(newError);
      
      // Keep only the latest maxDebugErrors entries
      if (state.debugErrors.length > state.maxDebugErrors) {
        state.debugErrors = state.debugErrors.slice(-state.maxDebugErrors);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    // Clear debug errors
    clearDebugErrors: (state) => {
      state.debugErrors = [];
    },
    toggleTerminal: (state) => {
      state.isTerminalOpen = !state.isTerminalOpen;
    },
    openTerminal: (state) => {
      state.isTerminalOpen = true;
    },
    closeTerminal: (state) => {
      state.isTerminalOpen = false;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Clear selected request/error when switching tabs
      if (action.payload !== 'network') {
        state.selectedRequest = null;
      }
      if (action.payload !== 'debug') {
        state.selectedError = null;
      }
    },
    updateFilter: (state, action) => {
      const { filterType, enabled } = action.payload;
      state.filters[filterType] = enabled;
    },
    toggleAllFilters: (state, action) => {
      const enabled = action.payload;
      Object.keys(state.filters).forEach(key => {
        state.filters[key] = enabled;
      });
    },
    updateNetworkFilter: (state, action) => {
      const { method, enabled } = action.payload;
      state.networkFilters[method] = enabled;
    },
    toggleAllNetworkFilters: (state, action) => {
      const enabled = action.payload;
      Object.keys(state.networkFilters).forEach(key => {
        state.networkFilters[key] = enabled;
      });
    },
    setSelectedRequest: (state, action) => {
      state.selectedRequest = action.payload;
    },
    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
    },
    // Set selected error for debug tab
    setSelectedError: (state, action) => {
      state.selectedError = action.payload;
    },
    // Clear selected error
    clearSelectedError: (state) => {
      state.selectedError = null;
    }
  }
});

export const { 
  addLog, 
  addDebugError,
  clearLogs, 
  clearDebugErrors,
  toggleTerminal, 
  openTerminal, 
  closeTerminal, 
  setActiveTab,
  updateFilter, 
  toggleAllFilters,
  updateNetworkFilter,
  toggleAllNetworkFilters,
  setSelectedRequest,
  clearSelectedRequest,
  setSelectedError,
  clearSelectedError
} = logsSlice.actions;

export default logsSlice.reducer; 