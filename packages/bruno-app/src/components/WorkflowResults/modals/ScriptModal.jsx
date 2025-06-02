import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { IconX } from '@tabler/icons';
import CodeEditor from 'components/CodeEditor';
import get from 'lodash/get';

const ScriptModal = ({ isOpen, onClose, onSave, nodeData, collection }) => {
  const [script, setScript] = useState('');
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);

  // Update script state when nodeData changes
  useEffect(() => {
    if (isOpen && nodeData) {
      setScript(nodeData.script || '');
    }
  }, [isOpen, nodeData]);

  const handleSave = () => {
    onSave(script);
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
              Script Configuration
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
              <p className="text-sm text-gray-600">
                Write JavaScript code that will be executed at this step in the workflow.
              </p>
            </div>
            
            <div style={{ height: '400px' }}>
              <CodeEditor
                collection={collection}
                value={script}
                theme={displayedTheme}
                font={get(preferences, 'font.codeFont', 'default')}
                fontSize={get(preferences, 'font.codeFontSize')}
                onEdit={setScript}
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Save Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptModal; 