import React from 'react';
import { Handle, Position } from 'reactflow';
import { IconGitBranch, IconSettings } from '@tabler/icons';

const ConditionalNode = ({ id, data, isConnectable }) => {
  const handleSettingsClick = () => {
    data.onOpenSettings(id, 'conditional');
  };

  return (
    <div className="relative">
      {/* Main Node */}
      <div className="bg-white border-2 border-orange-400 rounded-lg p-3 min-w-32">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconGitBranch size={16} className="text-orange-500" />
            <span className="text-sm font-medium">If/Else</span>
          </div>
          <button
            onClick={handleSettingsClick}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <IconSettings size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {data.condition ? 'Condition set' : 'Click settings to add condition'}
        </div>
      </div>

      {/* Left Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Right Handles (True/False outputs) */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: -6, top: '25%' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-red-500 border-2 border-white"
        style={{ right: -6, top: '75%' }}
      />

      {/* True/False Labels */}
      <div className="absolute right-2 top-1 text-xs text-green-600 font-medium">
        True
      </div>
      <div className="absolute right-2 bottom-1 text-xs text-red-600 font-medium">
        False
      </div>
    </div>
  );
};

export default ConditionalNode; 