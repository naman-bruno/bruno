import React from 'react';
import {
  IconEye,
  IconEdit,
} from '@tabler/icons';

const OperationRow = ({ operation, isSelected, onClick }) => {
  const getOperationIcon = operationType => {
    switch (operationType) {
      case 'read':
        return <IconEye size={14} className="operation-icon read" />;
      case 'write':
        return <IconEdit size={14} className="operation-icon write" />;
      default:
        return <IconEye size={14} className="operation-icon" />;
    }
  };

  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getFileName = filepath => {
    return filepath.split('/').pop() || filepath;
  };

  const getRelativePath = filepath => {
    const parts = filepath.split('/');
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return filepath;
  };

  const getFileSize = details => {
    if (details?.size !== undefined && details?.size !== null) {
      const bytes = parseInt(details.size);
      if (bytes === 0) return '0B';
      if (bytes < 1024) return `${bytes}B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return '-';
  };

  return (
    <div
      className={`operation-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(operation)}
    >
      <div className="operation-icon">
        {getOperationIcon(operation.operation)}
      </div>

      <div className="operation-type">
        <span className={`operation-badge ${operation.operation}`}>{operation.operation}</span>
      </div>

      <div className="operation-file">
        <span className="file-name">{getFileName(operation.filepath)}</span>
      </div>

      <div className="operation-path">
        <span className="file-path" title={operation.filepath}>
          {getRelativePath(operation.filepath)}
        </span>
      </div>

      <div className="operation-size text-right">
        {getFileSize(operation.details)}
      </div>

      <div className="operation-time text-right">
        {formatTime(operation.timestamp)}
      </div>
    </div>
  );
};

const OperationsTab = ({ operations, filters, onFilterToggle, onToggleAll, onClearOperations, selectedOperation, onOperationSelect }) => {
  const filteredOperations = operations.filter(operation => filters[operation.operation]);

  return (
    <div className="operations-tab">
      <div className="operations-content">
        {filteredOperations.length === 0 ? (
          <div className="operations-empty">
            <p>No operations to display</p>
          </div>
        ) : (
          <div className="operations-container">
            <div className="operations-header">
              <div></div>
              <div>Type</div>
              <div>File</div>
              <div>Path</div>
              <div className="text-right">Size</div>
              <div className="text-right">Time</div>
            </div>

            <div className="operations-list">
              {filteredOperations.map((operation, index) => (
                <OperationRow
                  key={operation.id}
                  operation={operation}
                  isSelected={selectedOperation?.id === operation.id}
                  onClick={onOperationSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsTab;
