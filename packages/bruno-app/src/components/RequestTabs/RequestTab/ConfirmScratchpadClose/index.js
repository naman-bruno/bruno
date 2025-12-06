import React, { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';
import SaveScratchpadRequest from 'components/Sidebar/SaveScratchpadRequest';

const ConfirmScratchpadClose = ({ request, onCancel, onCloseWithoutSave, onSaveToCollection }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);

  if (showSaveModal) {
    return (
      <SaveScratchpadRequest
        request={request}
        onClose={() => setShowSaveModal(false)}
        onSaved={() => {
          if (onSaveToCollection) {
            onSaveToCollection();
          }
        }}
      />
    );
  }

  return (
    <Modal
      size="md"
      title="Unsaved Scratchpad Request"
      disableEscapeKey={true}
      disableCloseOnOutsideClick={true}
      closeModalFadeTimeout={150}
      handleCancel={onCancel}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      hideFooter={true}
    >
      <div className="flex items-center font-normal">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
        <h1 className="ml-2 text-lg font-medium">Hold on..</h1>
      </div>
      <div className="font-normal mt-4">
        You have an unsaved scratchpad request <span className="font-medium">"{request?.name}"</span>.
        <br />
        <span className="text-sm text-muted">
          Scratchpad requests are temporary and will be lost if you don't save them.
        </span>
      </div>

      <div className="flex justify-between mt-6">
        <div>
          <button className="btn btn-sm btn-danger" onClick={onCloseWithoutSave}>
            Discard
          </button>
        </div>
        <div>
          <button className="btn btn-close btn-sm mr-2" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSaveModal(true)}
          >
            Save to Collection
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmScratchpadClose;
