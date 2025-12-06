import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDrop } from 'react-dnd';
import { IconPinned, IconPlus, IconX, IconPlayerPlay } from '@tabler/icons';
import { addTab, focusTab } from 'providers/ReduxStore/slices/tabs';
import { unpinRequest, createScratchpadRequest } from 'providers/ReduxStore/slices/scratchpad';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid, findItemInCollection } from 'utils/collections';
import { getDefaultRequestPaneTab } from 'utils/collections';
import { useTheme } from 'providers/Theme';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';
import NetworkError from 'components/ResponsePane/NetworkError';

const PinnedRequests = () => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const collections = useSelector((state) => state.collections.collections);
  const pinnedRequests = useSelector((state) => state.scratchpad.pinnedRequests);
  const scratchpadRequests = useSelector((state) => state.scratchpad.scratchpadRequests);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);

  // Get request data for each pinned request
  const pinnedRequestsData = useMemo(() => {
    return pinnedRequests.map((pinned) => {
      if (pinned.isScratchpad) {
        const request = scratchpadRequests.find((r) => r.uid === pinned.uid);
        return request ? { ...request, pinned } : null;
      } else {
        const collection = findCollectionByUid(collections, pinned.collectionUid);
        if (collection) {
          const item = findItemInCollection(collection, pinned.uid);
          return item ? { ...item, pinned, collection } : null;
        }
        return null;
      }
    }).filter(Boolean);
  }, [pinnedRequests, scratchpadRequests, collections]);

  const handleCreateScratchpad = () => {
    dispatch(createScratchpadRequest({}));

    // Get the new request and open tab
    setTimeout(() => {
      const state = require('providers/ReduxStore').store.getState();
      const requests = state.scratchpad.scratchpadRequests;
      const newRequest = requests[requests.length - 1];

      if (newRequest) {
        dispatch(
          addTab({
            uid: newRequest.uid,
            collectionUid: 'scratchpad-collection',
            type: 'scratchpad-request',
            requestPaneTab: 'params'
          })
        );
      }
    }, 0);
  };

  const handleRequestClick = (request) => {
    const collectionUid = request.pinned.isScratchpad
      ? 'scratchpad-collection'
      : request.pinned.collectionUid;

    const tabType = request.pinned.isScratchpad ? 'scratchpad-request' : request.type;

    dispatch(
      addTab({
        uid: request.uid,
        collectionUid: collectionUid,
        type: tabType,
        requestPaneTab: getDefaultRequestPaneTab(request)
      })
    );
  };

  const handleUnpin = (e, request) => {
    e.stopPropagation();
    dispatch(
      unpinRequest({
        uid: request.uid,
        collectionUid: request.pinned.collectionUid
      })
    );
  };

  const handleRunRequest = (e, request) => {
    e.stopPropagation();

    if (request.pinned.isScratchpad) {
      // For scratchpad requests, we need to send the request differently
      // We'll handle this in the scratchpad actions
      toast.error('Scratchpad request execution coming soon');
      return;
    }

    const collection = request.collection;
    if (collection) {
      dispatch(sendRequest(request, collection.uid)).catch((err) =>
        toast.custom((t) => <NetworkError onClose={() => toast.dismiss(t.id)} />, {
          duration: 5000
        })
      );
    }
  };

  const getMethodColor = (method = 'GET') => {
    const colors = {
      get: '#10b981',
      post: '#f59e0b',
      put: '#3b82f6',
      delete: '#ef4444',
      patch: '#8b5cf6',
      options: '#6b7280',
      head: '#6b7280'
    };
    return colors[method.toLowerCase()] || '#6b7280';
  };

  const getMethodFromRequest = (request) => {
    if (request.type === 'grpc-request') return 'gRPC';
    if (request.type === 'ws-request') return 'WS';
    if (request.type === 'graphql-request') return 'GQL';

    const method = request.draft?.request?.method || request.request?.method || 'GET';
    return method.toUpperCase();
  };

  // Drop target for pinning requests
  const [{ isOver }, drop] = useDrop({
    accept: 'collection-item',
    drop: (draggedItem) => {
      // Only allow requests to be pinned (not folders)
      if (draggedItem.type === 'folder') {
        toast.error('Folders cannot be pinned');
        return;
      }

      // Pin the request
      dispatch(require('providers/ReduxStore/slices/scratchpad').pinRequest({
        uid: draggedItem.uid,
        collectionUid: draggedItem.sourceCollectionUid,
        isScratchpad: false
      }));

      toast.success(`Pinned "${draggedItem.name}"`);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <StyledWrapper ref={drop} className={isOver ? 'drop-target' : ''}>
      <div className="pinned-requests-header">
        <div className="header-title">
          <IconPinned size={14} />
          <span>Pinned</span>
        </div>
        <div className="header-actions">
          <div
            className="action-btn"
            onClick={handleCreateScratchpad}
            title="New Scratchpad Request (Ctrl+N)"
          >
            <IconPlus size={14} />
          </div>
        </div>
      </div>

      <div className="pinned-requests-list">
        {pinnedRequestsData.length === 0 ? (
          <div className="empty-state">
            <div>No pinned requests</div>
            <div className="hint">Press Ctrl+N for scratchpad or drag requests here</div>
          </div>
        ) : (
          pinnedRequestsData.map((request) => {
            const method = getMethodFromRequest(request);
            const isActive = activeTabUid === request.uid;

            return (
              <div
                key={`${request.pinned.collectionUid}-${request.uid}`}
                className={`pinned-request-item ${isActive ? 'active' : ''}`}
                onClick={() => handleRequestClick(request)}
              >
                <span
                  className="request-method"
                  style={{ color: getMethodColor(method) }}
                >
                  {method}
                </span>
                <span className="request-name" title={request.name}>
                  {request.name}
                </span>
                {request.pinned.isScratchpad && (
                  <span className="scratchpad-badge">temp</span>
                )}
                <div className="pinned-request-actions">
                  <div
                    className="action-btn"
                    onClick={(e) => handleRunRequest(e, request)}
                    title="Run Request"
                  >
                    <IconPlayerPlay size={12} />
                  </div>
                  <div
                    className="action-btn"
                    onClick={(e) => handleUnpin(e, request)}
                    title="Unpin"
                  >
                    <IconX size={12} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </StyledWrapper>
  );
};

export default PinnedRequests;
