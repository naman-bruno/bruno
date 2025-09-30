import { createSlice } from '@reduxjs/toolkit';

const MAX_OPERATIONS = 1000;
const MAX_EVENTS = 1000;
const MAX_PARSING_ERRORS = 500;

const createItemWithId = payload => ({
  id: Date.now() + Math.random(),
  ...payload,
  timestamp: payload.timestamp || new Date().toISOString(),
  details: payload.details || {},
});

const limitArraySize = (array, maxSize) =>
  array.length > maxSize ? array.slice(-maxSize) : array;

const initialState = {
  fileOperations: [],
  watcherEvents: [],
  watcherStats: {},
  parsingErrors: [],
  activeWatchers: {},
  systemResources: {
    cpu: 0,
    memory: 0,
    pid: null,
    uptime: 0,
    lastUpdated: null,
  },
  eventFilters: {
    add: true,
    change: true,
    unlink: true,
    addDir: true,
    unlinkDir: true,
    error: true,
  },
  operationFilters: {
    read: true,
    write: true,
  },
  errorFilters: {
    parsing: true,
    syntax: true,
    runtime: true,
  },
  activeTab: 'operations',
  selectedEvent: null,
  selectedOperation: null,
  selectedError: null,
  maxOperations: MAX_OPERATIONS,
  maxEvents: MAX_EVENTS,
  maxParsingErrors: MAX_PARSING_ERRORS,
};

const updateFilters = (state, action, filterKey) => {
  const { filterType, enabled } = action.payload;
  state[filterKey][filterType] = enabled;
};

const toggleAllFilters = (state, enabled, filterKey) => {
  Object.keys(state[filterKey]).forEach(key => {
    state[filterKey][key] = enabled;
  });
};

export const fileSyncSlice = createSlice({
  name: 'fileSync',
  initialState,
  reducers: {
    addFileOperation: (state, action) => {
      const newOperation = createItemWithId(action.payload);
      state.fileOperations.push(newOperation);
      state.fileOperations = limitArraySize(state.fileOperations, state.maxOperations);
    },

    addWatcherEvent: (state, action) => {
      const newEvent = createItemWithId(action.payload);
      state.watcherEvents.push(newEvent);
      state.watcherEvents = limitArraySize(state.watcherEvents, state.maxEvents);
    },

    addParsingError: (state, action) => {
      const newError = createItemWithId(action.payload);
      state.parsingErrors.push(newError);
      state.parsingErrors = limitArraySize(state.parsingErrors, state.maxParsingErrors);
    },

    updateWatcherStats: (state, action) => {
      const { collectionUid, stats } = action.payload;
      state.watcherStats[collectionUid] = {
        ...state.watcherStats[collectionUid],
        ...stats,
        lastUpdated: new Date().toISOString(),
      };
    },

    addActiveWatcher: (state, action) => {
      const { collectionUid, watcherInfo } = action.payload;
      state.activeWatchers[collectionUid] = {
        ...watcherInfo,
        status: 'active',
        startedAt: new Date().toISOString(),
      };
    },

    removeActiveWatcher: (state, action) => {
      delete state.activeWatchers[action.payload];
    },

    updateWatcherStatus: (state, action) => {
      const { collectionUid, status, error } = action.payload;
      if (state.activeWatchers[collectionUid]) {
        state.activeWatchers[collectionUid].status = status;
        if (error) state.activeWatchers[collectionUid].error = error;
      }
    },

    clearFileOperations: state => {
      state.fileOperations = [];
    },

    clearWatcherEvents: state => {
      state.watcherEvents = [];
    },

    clearParsingErrors: state => {
      state.parsingErrors = [];
    },

    clearWatcherStats: state => {
      state.watcherStats = {};
    },

    updateEventFilter: (state, action) => {
      updateFilters(state, action, 'eventFilters');
    },

    toggleAllEventFilters: (state, action) => {
      toggleAllFilters(state, action.payload, 'eventFilters');
    },

    updateOperationFilter: (state, action) => {
      updateFilters(state, action, 'operationFilters');
    },

    toggleAllOperationFilters: (state, action) => {
      toggleAllFilters(state, action.payload, 'operationFilters');
    },

    updateErrorFilter: (state, action) => {
      updateFilters(state, action, 'errorFilters');
    },

    toggleAllErrorFilters: (state, action) => {
      toggleAllFilters(state, action.payload, 'errorFilters');
    },

    updateSystemResources: (state, action) => {
      state.systemResources = {
        ...state.systemResources,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },

    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      if (action.payload !== 'operations') state.selectedOperation = null;
      if (action.payload !== 'events') state.selectedEvent = null;
      if (action.payload !== 'error') state.selectedError = null;
    },

    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },

    setSelectedOperation: (state, action) => {
      state.selectedOperation = action.payload;
    },

    setSelectedError: (state, action) => {
      state.selectedError = action.payload;
    },
  },
});

export const {
  addFileOperation,
  addWatcherEvent,
  addParsingError,
  updateWatcherStats,
  addActiveWatcher,
  removeActiveWatcher,
  updateWatcherStatus,
  clearFileOperations,
  clearWatcherEvents,
  clearParsingErrors,
  clearWatcherStats,
  updateEventFilter,
  toggleAllEventFilters,
  updateOperationFilter,
  toggleAllOperationFilters,
  updateErrorFilter,
  toggleAllErrorFilters,
  updateSystemResources,
  setActiveTab,
  setSelectedEvent,
  setSelectedOperation,
  setSelectedError,
} = fileSyncSlice.actions;

export default fileSyncSlice.reducer;
