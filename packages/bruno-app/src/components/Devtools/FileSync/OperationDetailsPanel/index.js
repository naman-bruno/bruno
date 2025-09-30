import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IconX, IconFile, IconCode } from '@tabler/icons';
import CodeEditor from 'components/CodeEditor';
import { get } from 'lodash';
import StyledWrapper from './StyledWrapper';
import { useTheme } from 'providers/Theme/index';

const OperationDetailsPanel = ({ operation, onClose, collections }) => {
  const preferences = useSelector((state) => state.app.preferences);
  const { displayedTheme } = useTheme();

  const contentType = operation.details?.contentType || 'text';
  const isBruFile = contentType === 'bru';

  const [activeTab, setActiveTab] = useState(isBruFile ? 'json' : 'content');

  if (!operation) return null;

  const getCollectionName = (collectionUid) => {
    const collection = collections.find((c) => c.uid === collectionUid);
    return collection?.name || 'Unknown Collection';
  };

  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return '-';
    const size = parseInt(bytes);
    if (size === 0) return '0B';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getFileContent = () => {
    const hasContent = operation.details?.content;
    const actualContent = operation.details?.content || '';
    const parsedData = operation.details?.parsedData;

    // If we have actual file content, show it
    if (hasContent) {
      // For BRU files, use parsed data if available
      if (isBruFile && parsedData) {
        try {
          const jsonContent = JSON.stringify(parsedData, null, 2);
          return {
            json: jsonContent,
            bru: actualContent,
            content: actualContent
          };
        } catch (err) {
          // If JSON stringification fails, fall back to raw content
          return {
            json: `// Failed to display parsed data as JSON:\n${actualContent}`,
            bru: actualContent,
            content: actualContent
          };
        }
      } else if (isBruFile) {
        // BRU file without parsed data - show raw content
        return {
          json: `// Parsed data not available:\n${actualContent}`,
          bru: actualContent,
          content: actualContent
        };
      } else {
        // For non-BRU files, just return the content as-is
        return {
          content: actualContent,
          bru: actualContent, // fallback
          json: actualContent // fallback
        };
      }
    }

    // Fallback for operations without content
    const fallbackContent = `// File content not available
// File: ${operation.filepath}
// Operation: ${operation.operation}
// Timestamp: ${operation.timestamp}

// Content was not captured for this operation
// This may happen for older operations or failed reads`;

    return {
      content: fallbackContent,
      json: fallbackContent,
      bru: fallbackContent
    };
  };

  const fileContent = getFileContent();

  const getEditorContent = () => {
    if (isBruFile) {
      return activeTab === 'json' ? fileContent.json : fileContent.bru;
    } else {
      return fileContent.content || fileContent.bru; // fallback to bru if content not available
    }
  };

  const getEditorMode = () => {
    if (isBruFile) {
      return activeTab === 'json' ? 'json' : 'text';
    } else {
      // Detect content type for non-BRU files
      const content = fileContent.content || fileContent.bru || '';
      const filepath = operation.filepath.toLowerCase();

      if (filepath.endsWith('.json')) return 'json';
      if (filepath.endsWith('.js') || filepath.endsWith('.ts')) return 'javascript';
      if (filepath.endsWith('.html') || filepath.endsWith('.htm')) return 'html';
      if (filepath.endsWith('.css')) return 'css';
      if (filepath.endsWith('.xml')) return 'xml';
      if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) return 'yaml';
      if (filepath.endsWith('.md')) return 'markdown';

      // Try to detect JSON content
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          JSON.parse(content);
          return 'json';
        } catch (e) {
          // Not valid JSON, fall through to text
        }
      }

      return 'text';
    }
  };

  return (
    <StyledWrapper className="h-full">
      <div className="operation-details-panel">
        <div className="panel-header">
          <div className="panel-title">
            <IconFile size={16} strokeWidth={1.5} />
            <span>Operation Details</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <IconX size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="operation-info">
          <div className="info-row">
            <span className="label">Operation:</span>
            <span className={`value operation-type ${operation.operation}`}>
              {operation.operation}
            </span>
          </div>
          <div className="info-row">
            <span className="label">File:</span>
            <span className="value file-path">{operation.filepath}</span>
          </div>
          <div className="info-row">
            <span className="label">Collection:</span>
            <span className="value">{getCollectionName(operation.collectionUid)}</span>
          </div>
          <div className="info-row">
            <span className="label">Timestamp:</span>
            <span className="value">{new Date(operation.timestamp).toLocaleString()}</span>
          </div>
          {operation.details?.size !== undefined && (
            <div className="info-row">
              <span className="label">Size:</span>
              <span className="value">{formatFileSize(operation.details.size)}</span>
            </div>
          )}
          {operation.details?.contentType && (
            <div className="info-row">
              <span className="label">Type:</span>
              <span className="value">{operation.details.contentType}</span>
            </div>
          )}
        </div>

        <div className="panel-tabs">
          {isBruFile ? (
            <>
              <button
                className={`panel-tab ${activeTab === 'json' ? 'active' : ''}`}
                onClick={() => setActiveTab('json')}
              >
                <IconCode size={14} strokeWidth={1.5} />
                <span>JSON</span>
              </button>
              <button
                className={`panel-tab ${activeTab === 'bru' ? 'active' : ''}`}
                onClick={() => setActiveTab('bru')}
              >
                <IconFile size={14} strokeWidth={1.5} />
                <span>BRU</span>
              </button>
            </>
          ) : (
            <button
              className={`panel-tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <IconFile size={14} strokeWidth={1.5} />
              <span>Content</span>
            </button>
          )}
        </div>

        <div className="panel-content">
          <div className="content-area">
            <CodeEditor
              collection={collections.find((c) => c.uid === operation.collectionUid)}
              font={get(preferences, 'font.codeFont', 'default')}
              fontSize={get(preferences, 'font.codeFontSize')}
              theme={displayedTheme}
              value={getEditorContent()}
              mode={getEditorMode()}
              readOnly
            />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default OperationDetailsPanel;
