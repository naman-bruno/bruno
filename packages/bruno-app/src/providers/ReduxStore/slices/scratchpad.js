import { createSlice } from '@reduxjs/toolkit';
import { uuid } from 'utils/common';
import { cloneDeep } from 'lodash';
import { parseQueryParams } from '@usebruno/common/utils';
import { parsePathParams, splitOnFirst } from 'utils/url';

// Scratchpad slice manages temporary requests that are not saved to filesystem
// This includes:
// 1. scratchpadRequests - temporary requests created via Ctrl+N
// 2. pinnedRequests - requests pinned by user (can be from collections or scratchpad)
// 3. untitledCollection - a virtual collection that exists only in Redux for scratchpad requests

const initialState = {
  // Virtual collection for scratchpad requests (never saved to filesystem)
  untitledCollection: null,
  // Array of scratchpad request items
  scratchpadRequests: [],
  // Array of pinned request references { uid, collectionUid, isScratchpad }
  pinnedRequests: [],
  // Counter for naming untitled requests
  untitledRequestCounter: 1
};

// Helper to create a default HTTP request structure
const createDefaultRequest = (name, method = 'GET', url = '') => {
  const parts = splitOnFirst(url, '?');
  let queryParams = [];
  let pathParams = [];

  try {
    queryParams = parseQueryParams(parts[1] || '');
    pathParams = parsePathParams(parts[0] || '');
  } catch (err) {
    console.error('Error parsing params:', err);
  }

  const queryParamObjects = queryParams.map((param) => ({
    uid: uuid(),
    name: param.key,
    value: param.value,
    description: '',
    type: 'query',
    enabled: true
  }));

  const pathParamObjects = pathParams.map((param) => ({
    uid: uuid(),
    name: param.key,
    value: param.value,
    description: '',
    type: 'path',
    enabled: true
  }));

  return {
    url: url,
    method: method,
    params: [...queryParamObjects, ...pathParamObjects],
    headers: [],
    body: {
      mode: 'none',
      json: null,
      text: null,
      xml: null,
      sparql: null,
      multipartForm: [],
      formUrlEncoded: []
    },
    auth: {
      mode: 'none',
      basic: null,
      bearer: null,
      digest: null,
      oauth2: null,
      awsv4: null,
      apikey: null,
      wsse: null,
      ntlm: null
    },
    script: {
      req: '',
      res: ''
    },
    vars: {
      req: [],
      res: []
    },
    assertions: [],
    tests: '',
    docs: ''
  };
};

// Create the untitled collection structure
const createUntitledCollection = () => ({
  uid: 'scratchpad-collection',
  name: 'Untitled Collection',
  pathname: null, // No filesystem path
  items: [],
  environments: [],
  brunoConfig: {
    version: '1',
    name: 'Untitled Collection',
    type: 'collection'
  },
  runtimeVariables: {},
  collapsed: false,
  isScratchpad: true // Flag to identify this as scratchpad collection
});

export const scratchpadSlice = createSlice({
  name: 'scratchpad',
  initialState,
  reducers: {
    // Initialize the untitled collection if it doesn't exist
    initUntitledCollection: (state) => {
      if (!state.untitledCollection) {
        state.untitledCollection = createUntitledCollection();
      }
    },

    // Create a new scratchpad request
    createScratchpadRequest: (state, action) => {
      const { requestType = 'http-request', requestMethod = 'GET', requestUrl = '' } = action.payload || {};

      // Ensure untitled collection exists
      if (!state.untitledCollection) {
        state.untitledCollection = createUntitledCollection();
      }

      const requestUid = uuid();
      const requestName = `Untitled Request ${state.untitledRequestCounter}`;
      state.untitledRequestCounter += 1;

      const newRequest = {
        uid: requestUid,
        name: requestName,
        type: requestType,
        request: createDefaultRequest(requestName, requestMethod, requestUrl),
        response: null,
        draft: null,
        isScratchpad: true,
        seq: state.scratchpadRequests.length + 1
      };

      // Mark it as having a draft immediately (since it's new and unsaved)
      newRequest.draft = cloneDeep(newRequest);

      state.scratchpadRequests.push(newRequest);
      state.untitledCollection.items.push(newRequest);

      // Auto-pin new scratchpad requests
      state.pinnedRequests.push({
        uid: requestUid,
        collectionUid: 'scratchpad-collection',
        isScratchpad: true
      });
    },

    // Update a scratchpad request (creates draft if needed)
    updateScratchpadRequest: (state, action) => {
      const { uid, updates } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }
        Object.assign(request.draft, updates);

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          if (!collectionItem.draft) {
            collectionItem.draft = cloneDeep(collectionItem);
          }
          Object.assign(collectionItem.draft, updates);
        }
      }
    },

    // Update scratchpad request URL
    updateScratchpadRequestUrl: (state, action) => {
      const { uid, url } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }

        request.draft.request.url = url;

        // Parse and update params
        const parts = splitOnFirst(url, '?');
        let queryParams = [];
        let pathParams = [];

        try {
          queryParams = parseQueryParams(parts[1] || '');
          pathParams = parsePathParams(parts[0] || '');
        } catch (err) {
          console.error('Error parsing params:', err);
        }

        // Keep existing params and add new ones
        const existingQueryParams = request.draft.request.params.filter((p) => p.type === 'query');
        const existingPathParams = request.draft.request.params.filter((p) => p.type === 'path');

        const newQueryParams = queryParams.map((param) => {
          const existing = existingQueryParams.find((p) => p.name === param.key);
          if (existing) {
            return { ...existing, value: param.value };
          }
          return {
            uid: uuid(),
            name: param.key,
            value: param.value,
            description: '',
            type: 'query',
            enabled: true
          };
        });

        const newPathParams = pathParams.map((param) => {
          const existing = existingPathParams.find((p) => p.name === param.key);
          if (existing) {
            return { ...existing, value: param.value };
          }
          return {
            uid: uuid(),
            name: param.key,
            value: param.value,
            description: '',
            type: 'path',
            enabled: true
          };
        });

        request.draft.request.params = [...newQueryParams, ...newPathParams];

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = cloneDeep(request.draft);
        }
      }
    },

    // Update scratchpad request method
    updateScratchpadRequestMethod: (state, action) => {
      const { uid, method } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }
        request.draft.request.method = method;

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = cloneDeep(request.draft);
        }
      }
    },

    // Update scratchpad request body
    updateScratchpadRequestBody: (state, action) => {
      const { uid, body } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }
        request.draft.request.body = { ...request.draft.request.body, ...body };

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = cloneDeep(request.draft);
        }
      }
    },

    // Update scratchpad request headers
    updateScratchpadRequestHeaders: (state, action) => {
      const { uid, headers } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }
        request.draft.request.headers = headers;

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = cloneDeep(request.draft);
        }
      }
    },

    // Update scratchpad request auth
    updateScratchpadRequestAuth: (state, action) => {
      const { uid, auth } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        if (!request.draft) {
          request.draft = cloneDeep(request);
        }
        request.draft.request.auth = { ...request.draft.request.auth, ...auth };

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = cloneDeep(request.draft);
        }
      }
    },

    // Delete scratchpad request draft (discard changes)
    deleteScratchpadRequestDraft: (state, action) => {
      const { uid } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        request.draft = null;

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.draft = null;
        }
      }
    },

    // Remove a scratchpad request completely
    removeScratchpadRequest: (state, action) => {
      const { uid } = action.payload;

      state.scratchpadRequests = state.scratchpadRequests.filter((r) => r.uid !== uid);

      if (state.untitledCollection) {
        state.untitledCollection.items = state.untitledCollection.items.filter((i) => i.uid !== uid);
      }

      // Also remove from pinned requests
      state.pinnedRequests = state.pinnedRequests.filter((p) => p.uid !== uid);
    },

    // Set response for a scratchpad request
    setScratchpadRequestResponse: (state, action) => {
      const { uid, response } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        request.response = response;

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.response = response;
        }
      }
    },

    // Pin a request (can be from collection or scratchpad)
    pinRequest: (state, action) => {
      const { uid, collectionUid, isScratchpad = false } = action.payload;

      // Check if already pinned
      const alreadyPinned = state.pinnedRequests.find(
        (p) => p.uid === uid && p.collectionUid === collectionUid
      );

      if (!alreadyPinned) {
        state.pinnedRequests.push({
          uid,
          collectionUid,
          isScratchpad
        });
      }
    },

    // Unpin a request
    unpinRequest: (state, action) => {
      const { uid, collectionUid } = action.payload;
      state.pinnedRequests = state.pinnedRequests.filter(
        (p) => !(p.uid === uid && p.collectionUid === collectionUid)
      );
    },

    // Reorder pinned requests
    reorderPinnedRequests: (state, action) => {
      const { sourceIndex, targetIndex } = action.payload;
      const [removed] = state.pinnedRequests.splice(sourceIndex, 1);
      state.pinnedRequests.splice(targetIndex, 0, removed);
    },

    // Clear all scratchpad requests
    clearAllScratchpadRequests: (state) => {
      state.scratchpadRequests = [];
      if (state.untitledCollection) {
        state.untitledCollection.items = [];
      }
      // Remove scratchpad items from pinned
      state.pinnedRequests = state.pinnedRequests.filter((p) => !p.isScratchpad);
    },

    // Rename a scratchpad request
    renameScratchpadRequest: (state, action) => {
      const { uid, name } = action.payload;
      const request = state.scratchpadRequests.find((r) => r.uid === uid);

      if (request) {
        request.name = name;
        if (request.draft) {
          request.draft.name = name;
        }

        // Also update in untitled collection
        const collectionItem = state.untitledCollection?.items.find((i) => i.uid === uid);
        if (collectionItem) {
          collectionItem.name = name;
          if (collectionItem.draft) {
            collectionItem.draft.name = name;
          }
        }
      }
    }
  }
});

export const {
  initUntitledCollection,
  createScratchpadRequest,
  updateScratchpadRequest,
  updateScratchpadRequestUrl,
  updateScratchpadRequestMethod,
  updateScratchpadRequestBody,
  updateScratchpadRequestHeaders,
  updateScratchpadRequestAuth,
  deleteScratchpadRequestDraft,
  removeScratchpadRequest,
  setScratchpadRequestResponse,
  pinRequest,
  unpinRequest,
  reorderPinnedRequests,
  clearAllScratchpadRequests,
  renameScratchpadRequest
} = scratchpadSlice.actions;

export default scratchpadSlice.reducer;
