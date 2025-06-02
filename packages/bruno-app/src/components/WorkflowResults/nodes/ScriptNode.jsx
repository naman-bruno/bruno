import React from 'react';
import { Handle, Position } from 'reactflow';
import { IconCode, IconSettings } from '@tabler/icons';

const ScriptNode = ({ id, data, isConnectable }) => {
  const handleSettingsClick = () => {
    data.onOpenSettings(id, 'script');
  };

  return (
    <div className="relative">
      {/* Main Node */}
      <div className="bg-white border-2 border-green-400 rounded-lg p-3 min-w-32">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconCode size={16} className="text-green-500" />
            <span className="text-sm font-medium">Script</span>
          </div>
          <button
            onClick={handleSettingsClick}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <IconSettings size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {data.script ? 'Script configured' : 'Click settings to add script'}
        </div>
      </div>

      {/* Left Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Right Handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
};

export default ScriptNode; 