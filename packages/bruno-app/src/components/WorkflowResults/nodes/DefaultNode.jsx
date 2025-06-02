import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { IconPlus, IconArrowBranch, IconCode, IconGitBranch } from '@tabler/icons';

const DefaultNode = ({ id, data, isConnectable }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAddNode = (nodeType, requestData = null) => {
    data.onAddNode(id, nodeType, requestData);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Plus Icon Node */}
      <div
        className="flex items-center justify-center w-12 h-12 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-blue-500 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <IconPlus size={20} className="text-blue-500" />
      </div>

      {/* Right Handle for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ right: -6 }}
      />

      {/* Left Handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-14 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 max-h-60 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 sticky top-0 bg-white">
            Add Node
          </div>
          
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleAddNode('conditional')}
          >
            <IconGitBranch size={16} className="text-orange-500" />
            <span>Conditional (If/Else)</span>
          </button>
          
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleAddNode('script')}
          >
            <IconCode size={16} className="text-green-500" />
            <span>Script</span>
          </button>
          
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-t border-gray-100 mt-2 sticky top-0 bg-white">
            Requests
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {data.requests && data.requests.map((request) => {
              const method = request.request?.method || request.method || 'GET';
              return (
                <button
                  key={request.uid}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleAddNode('request', request)}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    method?.toLowerCase() === 'get' ? 'bg-green-500' :
                    method?.toLowerCase() === 'post' ? 'bg-blue-500' :
                    method?.toLowerCase() === 'put' ? 'bg-orange-500' :
                    method?.toLowerCase() === 'delete' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="truncate">{request.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{method?.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default DefaultNode; 