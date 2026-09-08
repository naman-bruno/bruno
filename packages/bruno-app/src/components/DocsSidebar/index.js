import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import find from 'lodash/find';
import get from 'lodash/get';
import {
  IconX,
  IconFileText,
  IconDownload,
  IconPencil,
  IconDeviceFloppy
} from '@tabler/icons';

import DocsEditor from 'components/Documentation/DocsEditor';
import { closeDocsSidebar } from 'providers/ReduxStore/slices/docs-sidebar';
import { updateIsDragging } from 'providers/ReduxStore/slices/app';
import {
  updateRequestDocs,
  updateFolderDocs,
  updateCollectionDocs
} from 'providers/ReduxStore/slices/collections';
import {
  saveRequest,
  saveFolderRoot,
  saveCollectionSettings
} from 'providers/ReduxStore/slices/collections/actions';
import {
  findItemInCollection,
  findItemInCollectionByPathname,
  isItemAFolder,
  isItemARequest
} from 'utils/collections';
import GenerateDocumentation from 'components/Sidebar/Collections/Collection/GenerateDocumentation';

import StyledWrapper from './StyledWrapper';

const SIDEBAR_WIDTH_LS_KEY = 'bruno.docs.sidebarWidth';
const DEFAULT_SIDEBAR_WIDTH = 460;
const MIN_SIDEBAR_WIDTH = 340;
const MAX_SIDEBAR_WIDTH = 800;

const clampSidebarWidth = (value) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value));

const KIND_LABELS = {
  request: 'Request',
  folder: 'Folder',
  collection: 'Collection'
};

const contextKey = (context) => {
  if (!context) return '';
  if (context.kind === 'request') return `request:${context.item?.uid || ''}`;
  if (context.kind === 'folder') return `folder:${context.folder?.uid || ''}`;
  return 'collection';
};

const DocsSidebar = ({ collection }) => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const isOpen = useSelector((state) => state.docsSidebar.isOpen);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const stored = parseInt(localStorage.getItem(SIDEBAR_WIDTH_LS_KEY), 10);
      if (!Number.isNaN(stored)) return clampSidebarWidth(stored);
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [resizing, setResizing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const focusedTab = find(tabs, (t) => t.uid === activeTabUid);

  const context = useMemo(() => {
    if (!focusedTab || !collection) return null;
    const found = findItemInCollection(collection, activeTabUid)
      || (focusedTab.pathname ? findItemInCollectionByPathname(collection, focusedTab.pathname) : null);
    if (found && isItemARequest(found)) {
      return { kind: 'request', item: found, name: found.name || 'Untitled Request' };
    }
    if (found && isItemAFolder(found)) {
      return { kind: 'folder', folder: found, name: found.name || 'Untitled Folder' };
    }
    return { kind: 'collection', name: collection.name || 'Untitled Collection' };
  }, [focusedTab, collection, activeTabUid]);

  const savedDocs = useMemo(() => {
    if (!context) return '';
    if (context.kind === 'request') return get(context.item, 'request.docs', '') || '';
    if (context.kind === 'folder') return get(context.folder, 'root.docs', '') || '';
    return get(collection, 'root.docs', '') || '';
  }, [context, collection]);

  const currentDocs = useMemo(() => {
    if (!context) return '';
    if (context.kind === 'request') {
      const item = context.item;
      return item?.draft ? get(item, 'draft.request.docs', '') : get(item, 'request.docs', '');
    }
    if (context.kind === 'folder') {
      const folder = context.folder;
      return folder?.draft ? get(folder, 'draft.docs', '') : get(folder, 'root.docs', '');
    }
    return collection?.draft?.root
      ? get(collection, 'draft.root.docs', '')
      : get(collection, 'root.docs', '');
  }, [context, collection]);

  const hasDocs = typeof currentDocs === 'string' && currentDocs.trim().length > 0;

  // Auto-exit edit mode when the active item changes so the sidebar doesn't
  // silently keep editing controls open over a different item's docs. Draft
  // edits are still preserved in the store — the user just has to hit Edit
  // again when they come back.
  const key = contextKey(context);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    if (isEditing) setIsEditing(false);
  }

  const dispatchDocsUpdate = useCallback(
    (value) => {
      if (!context || !collection) return;
      if (context.kind === 'request') {
        dispatch(updateRequestDocs({ itemUid: context.item.uid, collectionUid: collection.uid, docs: value }));
      } else if (context.kind === 'folder') {
        dispatch(updateFolderDocs({ folderUid: context.folder.uid, collectionUid: collection.uid, docs: value }));
      } else {
        dispatch(updateCollectionDocs({ collectionUid: collection.uid, docs: value }));
      }
    },
    [context, collection, dispatch]
  );

  const dispatchSave = useCallback(() => {
    if (!context || !collection) return;
    if (context.kind === 'request') {
      dispatch(saveRequest(context.item.uid, collection.uid));
    } else if (context.kind === 'folder') {
      dispatch(saveFolderRoot(collection.uid, context.folder.uid));
    } else {
      dispatch(saveCollectionSettings(collection.uid));
    }
  }, [context, collection, dispatch]);

  const handleSave = useCallback(() => {
    dispatchSave();
    setIsEditing(false);
  }, [dispatchSave]);

  const handleCancel = useCallback(() => {
    // Revert the draft to whatever's on disk. If no changes were made this is
    // still a safe no-op — the draft ends up equal to the saved value.
    dispatchDocsUpdate(savedDocs);
    setIsEditing(false);
  }, [dispatchDocsUpdate, savedDocs]);

  const handleStartEditing = useCallback(() => setIsEditing(true), []);

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e) => {
      e.preventDefault();
      setSidebarWidth(clampSidebarWidth(window.innerWidth - e.clientX));
    };
    const handleMouseUp = (e) => {
      e.preventDefault();
      setResizing(false);
      dispatch(updateIsDragging({ isDragging: false }));
      setSidebarWidth((width) => {
        try { localStorage.setItem(SIDEBAR_WIDTH_LS_KEY, String(width)); } catch {}
        return width;
      });
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, dispatch]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setResizing(true);
    dispatch(updateIsDragging({ isDragging: true }));
  };

  const handleClose = () => dispatch(closeDocsSidebar());

  if (!isOpen || !context) return null;

  const kindLabel = KIND_LABELS[context.kind];
  const requestItem = context.kind === 'request' ? context.item : null;

  return (
    <StyledWrapper style={{ width: sidebarWidth }} data-testid="docs-sidebar">
      <div
        className="docs-sidebar-resize-handle"
        data-testid="docs-sidebar-resize-handle"
        onMouseDown={handleResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Docs sidebar"
      >
        <div className="drag-border" />
      </div>
      <div className="docs-sidebar">
        <div className="docs-sidebar-header">
          <div className="header-left">
            <IconFileText size={16} className="header-icon" strokeWidth={1.5} />
            <span className="header-kind">{kindLabel}</span>
            <span className="header-title" title={context.name}>{context.name}</span>
          </div>
          <div className="header-actions">
            {isEditing ? (
              <>
                <button
                  className="text-btn"
                  onClick={handleCancel}
                  title="Cancel"
                  data-testid="docs-sidebar-cancel"
                >
                  Cancel
                </button>
                <button
                  className="text-btn primary"
                  onClick={handleSave}
                  title="Save (Cmd/Ctrl+S)"
                  data-testid="docs-sidebar-save"
                >
                  <IconDeviceFloppy size={13} />
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  className="icon-btn"
                  onClick={handleStartEditing}
                  title="Edit documentation"
                  data-testid="docs-sidebar-edit"
                >
                  <IconPencil size={14} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setShowExportModal(true)}
                  title="Export documentation"
                  data-testid="docs-sidebar-export"
                >
                  <IconDownload size={14} />
                </button>
              </>
            )}
            <button
              className="icon-btn close-btn"
              onClick={handleClose}
              title="Close"
              data-testid="docs-sidebar-close"
            >
              <IconX size={14} />
            </button>
          </div>
        </div>

        <div className={`docs-sidebar-body ${isEditing ? 'is-editing' : ''}`}>
          {hasDocs || isEditing ? (
            <DocsEditor
              docs={currentDocs}
              onEdit={dispatchDocsUpdate}
              onSave={handleSave}
              isEditing={isEditing}
              item={requestItem}
              collection={collection}
              collectionPath={collection?.pathname}
              onRequestEdit={handleStartEditing}
              initialScroll={0}
              onScroll={() => {}}
              testId="docs-sidebar-editor"
            />
          ) : (
            <div className="empty-state" data-testid="docs-sidebar-empty">
              <div className="empty-icon"><IconFileText size={20} strokeWidth={1.5} /></div>
              <h3>No documentation</h3>
              <p>
                This {kindLabel.toLowerCase()} doesn't have any docs yet. Add some to help your
                team understand how it works.
              </p>
              <button className="empty-action" onClick={handleStartEditing}>
                <IconPencil size={13} />
                Add documentation
              </button>
            </div>
          )}
        </div>
      </div>

      {showExportModal && (
        <GenerateDocumentation
          collectionUid={collection.uid}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </StyledWrapper>
  );
};

export default DocsSidebar;
