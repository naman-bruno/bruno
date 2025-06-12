import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  logs: [],
  isTerminalOpen: false,
  activeTab: 'console', // 'console' or 'network'
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
  maxLogs: 1000 // Limit to prevent memory issues
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
    clearLogs: (state) => {
      state.logs = [];
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
      // Clear selected request when switching tabs
      if (action.payload !== 'network') {
        state.selectedRequest = null;
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
    }
  }
});

export const { 
  addLog, 
  clearLogs, 
  toggleTerminal, 
  openTerminal, 
  closeTerminal, 
  setActiveTab,
  updateFilter, 
  toggleAllFilters,
  updateNetworkFilter,
  toggleAllNetworkFilters,
  setSelectedRequest,
  clearSelectedRequest
} = logsSlice.actions;

export default logsSlice.reducer; 