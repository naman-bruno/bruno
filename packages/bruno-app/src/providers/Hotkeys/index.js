import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import find from 'lodash/find';
import Mousetrap from 'mousetrap';
import { useSelector, useDispatch } from 'react-redux';
import EnvironmentSettings from 'components/Environments/EnvironmentSettings';
import NetworkError from 'components/ResponsePane/NetworkError';
import NewRequest from 'components/Sidebar/NewRequest';
import GlobalSearchModal from 'components/GlobalSearchModal';
import {
  sendRequest,
  saveRequest,
  saveCollectionRoot,
  saveFolderRoot,
  saveCollectionSettings
} from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid, findItemInCollection } from 'utils/collections';
import { closeTabs, reorderTabs, switchTab, addTab } from 'providers/ReduxStore/slices/tabs';
import { toggleSidebarCollapse, hideHomePage } from 'providers/ReduxStore/slices/app';
import { createScratchpadRequest } from 'providers/ReduxStore/slices/scratchpad';
import { newEphemeralHttpRequest } from 'providers/ReduxStore/slices/collections';
import { getKeyBindingsForActionAllOS } from './keyMappings';
import { store } from 'providers/ReduxStore';
import { uuid } from 'utils/common';

export const HotkeysContext = React.createContext();

export const HotkeysProvider = (props) => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const collections = useSelector((state) => state.collections.collections);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const isEnvironmentSettingsModalOpen = useSelector((state) => state.app.isEnvironmentSettingsModalOpen);
  const [showEnvSettingsModal, setShowEnvSettingsModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);

  const getCurrentCollection = () => {
    const activeTab = find(tabs, (t) => t.uid === activeTabUid);
    if (activeTab) {
      const collection = findCollectionByUid(collections, activeTab.collectionUid);

      return collection;
    }
  };

  // save hotkey
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('save')], (e) => {
      if (isEnvironmentSettingsModalOpen) {
        console.log('todo: save environment settings');
      } else {
        const activeTab = find(tabs, (t) => t.uid === activeTabUid);
        if (activeTab) {
          const collection = findCollectionByUid(collections, activeTab.collectionUid);
          if (collection) {
            const item = findItemInCollection(collection, activeTab.uid);
            if (item && item.uid) {
              if (activeTab.type === 'folder-settings') {
                dispatch(saveFolderRoot(collection.uid, item.uid));
              } else {
                dispatch(saveRequest(activeTab.uid, activeTab.collectionUid));
              }
            } else if (activeTab.type === 'collection-settings') {
              dispatch(saveCollectionSettings(collection.uid));
            }
          }
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('save')]);
    };
  }, [activeTabUid, tabs, saveRequest, collections, isEnvironmentSettingsModalOpen]);

  // send request (ctrl/cmd + enter)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('sendRequest')], (e) => {
      const activeTab = find(tabs, (t) => t.uid === activeTabUid);
      if (activeTab) {
        const collection = findCollectionByUid(collections, activeTab.collectionUid);

        if (collection) {
          const item = findItemInCollection(collection, activeTab.uid);
          if (item) {
            if (item.type === 'grpc-request') {
              const request = item.draft ? item.draft.request : item.request;
              if (!request.url) {
                toast.error('Please enter a valid gRPC server URL');
                return;
              }
              if (!request.method) {
                toast.error('Please select a gRPC method');
                return;
              }
            }

            dispatch(sendRequest(item, collection.uid)).catch((err) =>
              toast.custom((t) => <NetworkError onClose={() => toast.dismiss(t.id)} />, {
                duration: 5000
              })
            );
          }
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('sendRequest')]);
    };
  }, [activeTabUid, tabs, saveRequest, collections]);

  // edit environments (ctrl/cmd + e)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('editEnvironment')], (e) => {
      const activeTab = find(tabs, (t) => t.uid === activeTabUid);
      if (activeTab) {
        const collection = findCollectionByUid(collections, activeTab.collectionUid);

        if (collection) {
          setShowEnvSettingsModal(true);
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('editEnvironment')]);
    };
  }, [activeTabUid, tabs, collections, setShowEnvSettingsModal]);

  // new request (ctrl/cmd + b)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('newRequest')], (e) => {
      const activeTab = find(tabs, (t) => t.uid === activeTabUid);
      if (activeTab) {
        const collection = findCollectionByUid(collections, activeTab.collectionUid);

        if (collection) {
          setShowNewRequestModal(true);
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('newRequest')]);
    };
  }, [activeTabUid, tabs, collections, setShowNewRequestModal]);

  // new scratchpad request (ctrl/cmd + n)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('newScratchpadRequest')], (e) => {
      // Check if there's an active collection from the current tab
      const activeTab = find(tabs, (t) => t.uid === activeTabUid);
      let currentCollection = null;

      if (activeTab && activeTab.collectionUid !== 'scratchpad-collection') {
        currentCollection = findCollectionByUid(collections, activeTab.collectionUid);
      }

      if (currentCollection) {
        // If a collection is open, create an ephemeral (untitled) request in that collection
        const requestUid = uuid();
        const requestName = 'Untitled Request';

        dispatch(hideHomePage());
        dispatch(
          newEphemeralHttpRequest({
            uid: requestUid,
            requestName: requestName,
            requestType: 'http-request',
            requestUrl: '',
            requestMethod: 'GET',
            collectionUid: currentCollection.uid
          })
        );

        // Open the new request in a tab
        dispatch(
          addTab({
            uid: requestUid,
            collectionUid: currentCollection.uid,
            type: 'request',
            requestPaneTab: 'params'
          })
        );
      } else {
        // No collection open - create a scratchpad request
        dispatch(createScratchpadRequest({}));

        // Get the new request uid from the action
        const scratchpadRequests = store.getState().scratchpad.scratchpadRequests;
        const newRequest = scratchpadRequests[scratchpadRequests.length - 1];

        if (newRequest) {
          dispatch(hideHomePage());
          dispatch(
            addTab({
              uid: newRequest.uid,
              collectionUid: 'scratchpad-collection',
              type: 'scratchpad-request',
              requestPaneTab: 'params'
            })
          );
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('newScratchpadRequest')]);
    };
  }, [dispatch, activeTabUid, tabs, collections]);

  // global search (ctrl/cmd + k)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('globalSearch')], (e) => {
      setShowGlobalSearchModal(true);

      return false; // stop bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('globalSearch')]);
    };
  }, []);

  // close tab hotkey
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('closeTab')], (e) => {
      dispatch(
        closeTabs({
          tabUids: [activeTabUid]
        })
      );

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('closeTab')]);
    };
  }, [activeTabUid]);

  // Switch to the previous tab
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('switchToPreviousTab')], (e) => {
      dispatch(
        switchTab({
          direction: 'pageup'
        })
      );

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('switchToPreviousTab')]);
    };
  }, [dispatch]);

  // Switch to the next tab
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('switchToNextTab')], (e) => {
      dispatch(
        switchTab({
          direction: 'pagedown'
        })
      );

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('switchToNextTab')]);
    };
  }, [dispatch]);

  // Close all tabs
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('closeAllTabs')], (e) => {
      const activeTab = find(tabs, (t) => t.uid === activeTabUid);
      if (activeTab) {
        const collection = findCollectionByUid(collections, activeTab.collectionUid);

        if (collection) {
          const tabUids = tabs.filter((tab) => tab.collectionUid === collection.uid).map((tab) => tab.uid);
          dispatch(
            closeTabs({
              tabUids: tabUids
            })
          );
        }
      }

      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('closeAllTabs')]);
    };
  }, [activeTabUid, tabs, collections, dispatch]);

  // Collapse sidebar (ctrl/cmd + \)
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('collapseSidebar')], (e) => {
      dispatch(toggleSidebarCollapse());
      return false;
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('collapseSidebar')]);
    };
  }, [dispatch]);

  // Move tab left
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('moveTabLeft')], (e) => {
      dispatch(reorderTabs({ direction: -1 }));
      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('moveTabLeft')]);
    };
  }, [dispatch]);

  // Move tab right
  useEffect(() => {
    Mousetrap.bind([...getKeyBindingsForActionAllOS('moveTabRight')], (e) => {
      dispatch(reorderTabs({ direction: 1 }));
      return false; // this stops the event bubbling
    });

    return () => {
      Mousetrap.unbind([...getKeyBindingsForActionAllOS('moveTabRight')]);
    };
  }, [dispatch]);

  const currentCollection = getCurrentCollection();

  return (
    <HotkeysContext.Provider {...props} value="hotkey">
      {showEnvSettingsModal && (
        <EnvironmentSettings collection={currentCollection} onClose={() => setShowEnvSettingsModal(false)} />
      )}
      {showNewRequestModal && (
        <NewRequest collectionUid={currentCollection?.uid} onClose={() => setShowNewRequestModal(false)} />
      )}
      {showGlobalSearchModal && (
        <GlobalSearchModal isOpen={showGlobalSearchModal} onClose={() => setShowGlobalSearchModal(false)} />
      )}
      <div>{props.children}</div>
    </HotkeysContext.Provider>
  );
};

export const useHotkeys = () => {
  const context = React.useContext(HotkeysContext);

  if (!context) {
    throw new Error(`useHotkeys must be used within a HotkeysProvider`);
  }

  return context;
};

export default HotkeysProvider;
