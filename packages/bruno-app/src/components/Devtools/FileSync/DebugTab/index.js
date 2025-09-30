import React, { useMemo } from 'react';
import { IconBug } from '@tabler/icons';

const MESSAGE_TRUNCATE_LENGTH = 60;

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const ErrorRow = React.memo(({ error, collections, isSelected, onErrorSelect }) => {
  const errorData = useMemo(() => {
    const pathParts = error.filepath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const directory = pathParts.slice(0, -1).join('/');
    const collection = collections.find((c) => c.uid === error.collectionUid);
    const truncatedMessage = error.error.length > MESSAGE_TRUNCATE_LENGTH
      ? `${error.error.substring(0, MESSAGE_TRUNCATE_LENGTH)}...`
      : error.error;

    return {
      filename,
      directory,
      collectionName: collection?.name || 'Unknown Collection',
      truncatedMessage,
      formattedTime: formatTime(error.timestamp)
    };
  }, [error, collections]);

  return (
    <div
      className={`error-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onErrorSelect(error)}
    >
      <div className="error-file-cell">
        <div className="error-file">
          <span className="filename">{errorData.filename}</span>
          {errorData.directory && <span className="directory">{errorData.directory}</span>}
        </div>
      </div>
      <div className="error-message-cell">
        <span className="error-message" title={error.error}>
          {errorData.truncatedMessage}
        </span>
      </div>
      <div className="error-collection-cell">
        <span className="collection-name">{errorData.collectionName}</span>
      </div>
      <div className="error-time-cell">
        <span className="error-time">{errorData.formattedTime}</span>
      </div>
    </div>
  );
});

const ErrorTab = ({ parsingErrors, selectedError, onErrorSelect, collections }) => {
  if (parsingErrors.length === 0) {
    return (
      <div className="errors-empty">
        <IconBug size={48} strokeWidth={1} />
        <p>No parsing errors to display</p>
        <span>Parsing errors will appear here when .bru files have syntax issues</span>
      </div>
    );
  }

  return (
    <div className="errors-container">
      <div className="errors-header">
        <div className="error-file-cell">File</div>
        <div className="error-message-cell">Message</div>
        <div className="error-collection-cell">Collection</div>
        <div className="error-time-cell">Time</div>
      </div>
      <div className="errors-list">
        {parsingErrors.map((error) => (
          <ErrorRow
            key={error.id}
            error={error}
            collections={collections}
            isSelected={selectedError?.id === error.id}
            onErrorSelect={onErrorSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(ErrorTab);
