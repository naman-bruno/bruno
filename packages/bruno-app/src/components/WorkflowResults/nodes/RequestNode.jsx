import React from 'react';
import { Handle, Position } from 'reactflow';

const RequestNode = ({ id, data, isConnectable }) => {
  const { request } = data;

  // Safety check for request object
  if (!request) {
    return (
      <div className="relative">
        <div className="bg-white border-2 border-gray-400 rounded-lg p-3 min-w-40">
          <div className="text-sm text-red-500">Invalid Request</div>
        </div>
      </div>
    );
  }

  const method = request.request?.method || request.method || 'GET'; // Handle different request structures
  const name = request.name || 'Unnamed Request';
  const url = request.request?.url || request.url || '';

  const getMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'get': return 'border-green-400 bg-green-50';
      case 'post': return 'border-blue-400 bg-blue-50';
      case 'put': return 'border-orange-400 bg-orange-50';
      case 'delete': return 'border-red-400 bg-red-50';
      case 'patch': return 'border-purple-400 bg-purple-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getMethodTextColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'get': return 'text-green-600';
      case 'post': return 'text-blue-600';
      case 'put': return 'text-orange-600';
      case 'delete': return 'text-red-600';
      case 'patch': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Main Node */}
      <div className={`bg-white border-2 rounded-lg p-3 min-w-40 ${getMethodColor(method)}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-3 h-3 rounded-full ${
            method?.toLowerCase() === 'get' ? 'bg-green-500' :
            method?.toLowerCase() === 'post' ? 'bg-blue-500' :
            method?.toLowerCase() === 'put' ? 'bg-orange-500' :
            method?.toLowerCase() === 'delete' ? 'bg-red-500' :
            method?.toLowerCase() === 'patch' ? 'bg-purple-500' :
            'bg-gray-500'
          }`} />
          <span className={`text-xs font-bold ${getMethodTextColor(method)}`}>
            {method?.toUpperCase() || 'GET'}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-800 truncate" title={name}>
          {name}
        </div>
        {url && (
          <div className="text-xs text-gray-500 truncate mt-1" title={url}>
            {url}
          </div>
        )}
      </div>

      {/* Left Handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ left: -6 }}
      />

      {/* Right Handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ right: -6 }}
      />
    </div>
  );
};

export default RequestNode; 