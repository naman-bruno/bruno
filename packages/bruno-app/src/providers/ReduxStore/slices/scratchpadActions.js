import cloneDeep from 'lodash/cloneDeep';
import { uuid } from 'utils/common';
import { sendNetworkRequest } from 'utils/network/index';
import { setScratchpadRequestResponse } from './scratchpad';
import toast from 'react-hot-toast';

// Send a scratchpad request
export const sendScratchpadRequest = (item) => (dispatch, getState) => {
  const state = getState();
  const { globalEnvironments, activeGlobalEnvironmentUid } = state.globalEnvironments;

  return new Promise(async (resolve, reject) => {
    if (!item) {
      return reject(new Error('Item not found'));
    }

    // Create a minimal collection object for the scratchpad request
    const scratchpadCollection = {
      uid: 'scratchpad-collection',
      name: 'Scratchpad',
      pathname: null,
      items: [],
      environments: [],
      activeEnvironmentUid: null,
      runtimeVariables: {},
      brunoConfig: {
        version: '1',
        name: 'Scratchpad',
        type: 'collection'
      },
      globalEnvironmentVariables: {},
      isScratchpad: true
    };

    // Add global environment variables if available
    if (globalEnvironments && activeGlobalEnvironmentUid) {
      const activeGlobalEnv = globalEnvironments.find((env) => env.uid === activeGlobalEnvironmentUid);
      if (activeGlobalEnv && activeGlobalEnv.variables) {
        scratchpadCollection.globalEnvironmentVariables = activeGlobalEnv.variables.reduce((acc, v) => {
          if (v.enabled) {
            acc[v.name] = v.value;
          }
          return acc;
        }, {});
      }
    }

    const itemCopy = cloneDeep(item);
    const requestUid = uuid();
    itemCopy.requestUid = requestUid;

    // Mark as sending
    dispatch(
      setScratchpadRequestResponse({
        uid: item.uid,
        response: {
          state: 'sending',
          requestSent: Date.now()
        }
      })
    );

    try {
      // Pass empty environment object (not null) to avoid errors in electron backend
      const emptyEnvironment = { variables: [] };
      const response = await sendNetworkRequest(itemCopy, scratchpadCollection, emptyEnvironment, {});

      // Ensure any timestamps in the response are converted to numbers
      const serializedResponse = {
        ...response,
        timeline: response.timeline?.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp instanceof Date ? entry.timestamp.getTime() : entry.timestamp
        }))
      };

      dispatch(
        setScratchpadRequestResponse({
          uid: item.uid,
          response: serializedResponse
        })
      );

      resolve(serializedResponse);
    } catch (err) {
      console.error('Scratchpad request error:', err);

      dispatch(
        setScratchpadRequestResponse({
          uid: item.uid,
          response: {
            state: 'error',
            error: err.message || 'An error occurred'
          }
        })
      );

      reject(err);
    }
  });
};
