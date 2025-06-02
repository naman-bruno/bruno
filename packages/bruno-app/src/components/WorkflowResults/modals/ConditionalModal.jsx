import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { IconX } from '@tabler/icons';
import CodeEditor from 'components/CodeEditor';
import get from 'lodash/get';

const ConditionalModal = ({ isOpen, onClose, onSave, nodeData, collection }) => {
  const [condition, setCondition] = useState('');
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);

  // Update condition state when nodeData changes
  useEffect(() => {
    if (isOpen && nodeData) {
      setCondition(nodeData.condition || '');
    }
  }, [isOpen, nodeData]);

  const handleSave = () => {
    onSave(condition);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Conditional Configuration
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <IconX size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Write a JavaScript expression that evaluates to true or false. This determines which path the workflow will take.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600 font-medium mb-1">Examples:</p>
                <code className="text-xs text-gray-700 block">res.status === 200</code>
                <code className="text-xs text-gray-700 block">res.data.success === true</code>
                <code className="text-xs text-gray-700 block">bru.getVar('environment') === 'production'</code>
              </div>
            </div>
            
            <div style={{ height: '300px' }}>
              <CodeEditor
                collection={collection}
                value={condition}
                theme={displayedTheme}
                font={get(preferences, 'font.codeFont', 'default')}
                fontSize={get(preferences, 'font.codeFontSize')}
                onEdit={setCondition}
                mode="javascript"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
            >
              Save Condition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionalModal; 