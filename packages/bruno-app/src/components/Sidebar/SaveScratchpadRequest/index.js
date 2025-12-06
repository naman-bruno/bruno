import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconFolder, IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { newHttpRequest } from 'providers/ReduxStore/slices/collections/actions';
import { removeScratchpadRequest } from 'providers/ReduxStore/slices/scratchpad';
import { closeTabs } from 'providers/ReduxStore/slices/tabs';
import { sanitizeName } from 'utils/common/regex';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';

const SaveScratchpadRequest = ({ request, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const collections = useSelector((state) => state.collections.collections);
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);

  // Get collections in the current workspace
  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid) || workspaces.find((w) => w.type === 'default');
  let workspaceCollections = [];
  if (activeWorkspace?.collections?.length) {
    workspaceCollections = activeWorkspace.collections
      .map((wc) => collections.find((c) => c.pathname === wc.path))
      .filter(Boolean);
  }

  const [selectedCollection, setSelectedCollection] = useState(
    workspaceCollections.length > 0 ? workspaceCollections[0].uid : null
  );
  const [requestName, setRequestName] = useState(request?.name || 'Untitled Request');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCollection) {
      toast.error('Please select a collection');
      return;
    }

    if (!requestName.trim()) {
      toast.error('Please enter a request name');
      return;
    }

    setIsSaving(true);

    try {
      const collection = collections.find((c) => c.uid === selectedCollection);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Get the request data (from draft if available)
      const requestData = request.draft || request;

      // Create the new request in the collection
      await dispatch(
        newHttpRequest({
          requestName: requestName.trim(),
          filename: sanitizeName(requestName.trim()),
          requestType: requestData.type || 'http-request',
          requestUrl: requestData.request?.url || '',
          requestMethod: requestData.request?.method || 'GET',
          collectionUid: selectedCollection,
          itemUid: null, // Add to root of collection
          headers: requestData.request?.headers || [],
          body: requestData.request?.body || { mode: 'none' },
          auth: requestData.request?.auth || { mode: 'none' }
        })
      );

      // Remove the scratchpad request
      dispatch(removeScratchpadRequest({ uid: request.uid }));

      // Close the scratchpad tab
      dispatch(closeTabs({ tabUids: [request.uid] }));

      toast.success(`Request saved to "${collection.name}"`);

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      console.error('Error saving scratchpad request:', err);
      toast.error(err.message || 'Failed to save request');
    } finally {
      setIsSaving(false);
    }
  };

  const hasCollections = workspaceCollections.length > 0;

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title="Save Request to Collection"
          confirmText={isSaving ? 'Saving...' : 'Save'}
          cancelText="Cancel"
          handleConfirm={handleSave}
          handleCancel={onClose}
          confirmDisabled={!hasCollections || !selectedCollection || isSaving}
        >
          {!hasCollections ? (
            <div className="no-collections-message">
              <div className="icon">
                <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
              </div>
              <div className="message">No collections available</div>
              <div className="hint">Create a collection first to save this request</div>
            </div>
          ) : (
            <>
              <div className="folder-path-input">
                <label htmlFor="request-name">Request Name</label>
                <input
                  id="request-name"
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Enter request name"
                  autoFocus
                />
              </div>

              <div className="folder-path-input">
                <label>Select Collection</label>
                <div className="collection-selector">
                  {workspaceCollections.map((collection) => (
                    <div
                      key={collection.uid}
                      className={`collection-option ${selectedCollection === collection.uid ? 'selected' : ''}`}
                      onClick={() => setSelectedCollection(collection.uid)}
                    >
                      <span className="collection-icon">
                        {selectedCollection === collection.uid ? (
                          <IconFolder size={18} />
                        ) : (
                          <IconFolder size={18} />
                        )}
                      </span>
                      <span className="collection-name">{collection.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default SaveScratchpadRequest;
