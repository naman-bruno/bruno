import React, { useState, useMemo } from 'react';
import { IconX, IconBug } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

const ErrorDetailsPanel = ({ error, onClose, collections }) => {
  const [activeTab, setActiveTab] = useState('details');

  const errorData = useMemo(() => {
    const pathParts = error.filepath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const collection = collections.find((c) => c.uid === error.collectionUid);

    return {
      filename,
      collectionName: collection?.name || 'Unknown Collection'
    };
  }, [error, collections]);

  const getTextContent = () => {
    if (activeTab === 'stack' && error.stack) return error.stack;
    return error.error;
  };

  return (
    <StyledWrapper className="h-full">
      <div className="error-details-panel">
        <div className="panel-header">
          <div className="panel-title">
            <IconBug size={16} strokeWidth={1.5} />
            <span>Error Details</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <IconX size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="error-info">
          <div className="info-row">
            <span className="label">File:</span>
            <span className="value">{errorData.filename}</span>
          </div>
          <div className="info-row">
            <span className="label">Path:</span>
            <span className="value" title={error.filepath}>{error.filepath}</span>
          </div>
          <div className="info-row">
            <span className="label">Collection:</span>
            <span className="value">{errorData.collectionName}</span>
          </div>
          <div className="info-row">
            <span className="label">Time:</span>
            <span className="value">{new Date(error.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Error Message
          </button>
          {error.stack && (
            <button
              className={`panel-tab ${activeTab === 'stack' ? 'active' : ''}`}
              onClick={() => setActiveTab('stack')}
            >
              Stack Trace
            </button>
          )}
        </div>

        <div className="panel-content">
          <div className="content-area">
            <div className="error-text-box">
              <pre>{getTextContent()}</pre>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default ErrorDetailsPanel;
