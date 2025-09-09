import React, { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { IconFolder, IconBox, IconShare, IconPlus, IconFolders } from '@tabler/icons';
import { openCollectionInWorkspace } from 'providers/ReduxStore/slices/workspaces/actions';
import CreateCollection from 'components/Sidebar/CreateCollection';
import toast from 'react-hot-toast';

const WorkspaceInfo = ({ workspace }) => {
  const dispatch = useDispatch();
  const { collections } = useSelector((state) => state.collections);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  
  // Filter collections that belong to this workspace
  const workspaceCollections = collections.filter(collection => {
    if (!workspace.collections || workspace.collections.length === 0) {
      return false;
    }
    return workspace.collections.some(wc => {
      return wc.location === collection.pathname || 
             collection.pathname.includes(wc.location) ||
             wc.location.includes(collection.pathname);
    });
  });

  const handleCreateCollection = () => {
    setCreateCollectionModalOpen(true);
  };

  const handleOpenCollection = () => {
    dispatch(openCollectionInWorkspace())
      .catch((err) => {
        console.error(err);
        toast.error('An error occurred while opening the collection');
      });
  };

  const handleCollectionClick = (collection) => {
    // TODO: Open specific collection
    console.log('Open collection:', collection);
  };

  return (
    <div className="w-full flex flex-col h-fit">
      {createCollectionModalOpen && (
        <CreateCollection 
          onClose={() => setCreateCollectionModalOpen(false)}
          workspaceUid={workspace.uid}
          defaultLocation={`${workspace.pathname}/collections`}
        />
      )}
      
      <div className="rounded-lg py-6">
        <div className="grid gap-6">
          {/* Location Row */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <IconFolder className="w-5 h-5 text-blue-500" stroke={1.5} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-sm">Location</div>
              <div className="mt-1 text-sm text-muted break-all">
                {workspace.pathname}
              </div>
            </div>
          </div>

          {/* Collections Row */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <IconBox className="w-5 h-5 text-green-500" stroke={1.5} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-sm">Collections</div>
              <div className="mt-1 text-sm text-muted">
                {workspace.collections?.length || 0} collection{workspace.collections?.length !== 1 ? 's' : ''} configured
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start group cursor-pointer" onClick={handleCreateCollection}>
            <div className="flex-shrink-0 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <IconPlus className="w-5 h-5 text-purple-500" stroke={1.5} />
            </div>
            <div className="ml-4 h-full flex flex-col justify-start">
              <div className="font-semibold text-sm h-fit my-auto">Create</div>
              <div className="mt-1 text-sm group-hover:underline text-link">
                Create Collection
              </div>
            </div>
          </div>

          <div className="flex items-start group cursor-pointer" onClick={handleOpenCollection}>
            <div className="flex-shrink-0 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <IconFolders className="w-5 h-5 text-orange-500" stroke={1.5} />
            </div>
            <div className="ml-4 h-full flex flex-col justify-start">
              <div className="font-semibold text-sm h-fit my-auto">Open</div>
              <div className="mt-1 text-sm group-hover:underline text-link">
                Open Collection
              </div>
            </div>
          </div>

          <div className="flex items-start group cursor-pointer">
            <div className="flex-shrink-0 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <IconShare className="w-5 h-5 text-indigo-500" stroke={1.5} />
            </div>
            <div className="ml-4 h-full flex flex-col justify-start">
              <div className="font-semibold text-sm h-fit my-auto">Share</div>
              <div className="mt-1 text-sm group-hover:underline text-link">
                Share Workspace
              </div>
            </div>
          </div>
        </div>

        {/* Collections List */}
        {workspace.collections && workspace.collections.length > 0 && (
          <div className="mt-8">
            <div className="font-semibold text-sm mb-4">Collections in Workspace</div>
            <div className="space-y-3">
              {workspace.collections.map((collection, index) => {
                const loadedCollection = workspaceCollections.find(c => 
                  c.pathname === collection.location || 
                  c.pathname.includes(collection.location)
                );
                
                return (
                  <div 
                    key={index}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => loadedCollection && handleCollectionClick(loadedCollection)}
                  >
                    <div className="flex-shrink-0">
                      <IconBox className="w-4 h-4 text-gray-500" stroke={1.5} />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {collection.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {collection.type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceInfo; 