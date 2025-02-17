import React, { useState, useRef, Fragment } from 'react';
import get from 'lodash/get';
import { attemptCloseTabs } from 'providers/ReduxStore/slices/collections/actions';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import darkTheme from 'themes/dark';
import lightTheme from 'themes/light';
import { findItemInCollection } from 'utils/collections';
import RequestTabNotFound from './RequestTabNotFound';
import SpecialTab from './SpecialTab';
import StyledWrapper from './StyledWrapper';
import Dropdown from 'components/Dropdown';
import CloneCollectionItem from 'components/Sidebar/Collections/Collection/CollectionItem/CloneCollectionItem/index';
import NewRequest from 'components/Sidebar/NewRequest/index';
import CloseTabIcon from './CloseTabIcon';
import DraftTabIcon from './DraftTabIcon';
import { flattenItems } from 'utils/collections/index';
import { closeTabs, makeTabPermanent } from 'providers/ReduxStore/slices/tabs';

const RequestTab = ({ tab, collection, tabIndex, collectionRequestTabs, folderUid }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);

  const handleCloseClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    dispatch(
      closeTabs({
        tabUids: [tab.uid]
      })
    );
  };

  const handleRightClick = (_event) => {
    const menuDropdown = dropdownTippyRef.current;
    if (!menuDropdown) {
      return;
    }

    if (menuDropdown.state.isShown) {
      menuDropdown.hide();
    } else {
      menuDropdown.show();
    }
  };

  const handleMouseUp = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();

      // Close the tab
      dispatch(
        closeTabs({
          tabUids: [tab.uid]
        })
      );
    }
  };

  const getMethodColor = (method = '') => {
    const theme = storedTheme === 'dark' ? darkTheme : lightTheme;
    return theme.request.methods[method.toLocaleLowerCase()];
  };

  const folder = folderUid ? findItemInCollection(collection, folderUid) : null;
  if (['collection-settings', 'collection-overview', 'folder-settings', 'variables', 'collection-runner', 'security-settings'].includes(tab.type)) {
    return (
      <StyledWrapper
        className={`flex items-center justify-between tab-container px-1 ${tab.preview ? "italic" : ""}`}
        onMouseUp={handleMouseUp} // Add middle-click behavior here
      >
        {tab.type === 'folder-settings' ? (
          <SpecialTab handleCloseClick={handleCloseClick} handleDoubleClick={() => dispatch(makeTabPermanent({ uid: tab.uid }))} type={tab.type} tabName={folder?.name} />
        ) : (
          <SpecialTab handleCloseClick={handleCloseClick} handleDoubleClick={() => dispatch(makeTabPermanent({ uid: tab.uid }))} type={tab.type} />
        )}
      </StyledWrapper>
    );
  }

  const item = findItemInCollection(collection, tab.uid);

  if (!item) {
    return (
      <StyledWrapper
        className="flex items-center justify-between tab-container px-1"
        onMouseUp={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();

            dispatch(closeTabs({ tabUids: [tab.uid] }));
          }
        }}
      >
        <RequestTabNotFound handleCloseClick={handleCloseClick} />
      </StyledWrapper>
    );
  }

  const method = item.draft ? get(item, 'draft.request.method') : get(item, 'request.method');

  return (
    <StyledWrapper className="flex items-center justify-between tab-container px-1">
      <div
        className={`flex items-baseline tab-label pl-2 ${tab.preview ? "italic" : ""}`}
        onContextMenu={handleRightClick}
        onDoubleClick={() => dispatch(makeTabPermanent({ uid: tab.uid }))}
        onMouseUp={(e) => {
          if (!item.draft) return handleMouseUp(e);

          if (e.button === 1) {
            e.stopPropagation();
            e.preventDefault();
            dispatch(attemptCloseTabs([tab.uid]));
          }
        }}
      >
        <span className="tab-method uppercase" style={{ color: getMethodColor(method), fontSize: 12 }}>
          {method}
        </span>
        <span className="ml-1 tab-name" title={item.name}>
          {item.name}
        </span>
        <RequestTabMenu
          onDropdownCreate={onDropdownCreate}
          tabIndex={tabIndex}
          collectionRequestTabs={collectionRequestTabs}
          tabItem={item}
          collection={collection}
          dropdownTippyRef={dropdownTippyRef}
          dispatch={dispatch}
        />
      </div>
      <div
        className="flex px-2 close-icon-container"
        onClick={(e) => {
          if (!item.draft) return handleCloseClick(e);

          e.stopPropagation();
          e.preventDefault();
          dispatch(attemptCloseTabs([tab.uid]));;
        }}
      >
        {!item.draft ? (
          <CloseTabIcon />
        ) : (
          <DraftTabIcon />
        )}
      </div>
    </StyledWrapper>
  );
};

function RequestTabMenu({ onDropdownCreate, collectionRequestTabs, tabIndex, collection, dropdownTippyRef, dispatch }) {
  const [showCloneRequestModal, setShowCloneRequestModal] = useState(false);
  const [showAddNewRequestModal, setShowAddNewRequestModal] = useState(false);

  const totalTabs = collectionRequestTabs.length || 0;
  const currentTabUid = collectionRequestTabs[tabIndex]?.uid;
  const currentTabItem = findItemInCollection(collection, currentTabUid);

  const hasLeftTabs = tabIndex !== 0;
  const hasRightTabs = totalTabs > tabIndex + 1;
  const hasOtherTabs = totalTabs > 1;
  
  // Function to handle closing a single tab
  async function handleCloseTab(event, tabUid) {
    event.stopPropagation();
    dropdownTippyRef.current.hide();
    if (!tabUid) return;
    dispatch(attemptCloseTabs([tabUid]));
  };
  

  function handleCloseOtherTabs(event) {
    event.stopPropagation();
    dropdownTippyRef.current.hide();

    const otherTabsUids = collectionRequestTabs.filter((_, index) => index !== tabIndex).map((tab) => tab.uid);
    dispatch(attemptCloseTabs(otherTabsUids));
  }


  function handleCloseTabsToTheLeft (event){
    event.stopPropagation();
    dropdownTippyRef.current.hide();

    const leftTabUids = collectionRequestTabs
      .filter((_, index) => index < tabIndex)
      .map((tab) => tab.uid);
    dispatch(attemptCloseTabs(leftTabUids));
  };

  function handleCloseTabsToTheRight (event){
    event.stopPropagation();
    dropdownTippyRef.current.hide();

    const leftTabUids = collectionRequestTabs
      .filter((_, index) => index > tabIndex)
      .map((tab) => tab.uid);
    dispatch(attemptCloseTabs(leftTabUids));
  };

  function handleCloseSavedTabs(event) {
    event.stopPropagation();

    const items = flattenItems(collection?.items);
    const savedTabs = items?.filter?.((item) => !item.draft);
    const savedTabIds = savedTabs?.map((item) => item.uid) || [];
    dispatch(closeTabs({ tabUids: savedTabIds }));
  }

  function handleCloseAllTabs(event) {
    event.stopPropagation();
    dropdownTippyRef.current.hide();

    const allTabsUids = collectionRequestTabs.map((tab) => tab.uid);
    dispatch(attemptCloseTabs(allTabsUids));
  }

  return (
    <Fragment>
      {showAddNewRequestModal && (
        <NewRequest collection={collection} onClose={() => setShowAddNewRequestModal(false)} />
      )}

      {showCloneRequestModal && (
        <CloneCollectionItem
          item={currentTabItem}
          collection={collection}
          onClose={() => setShowCloneRequestModal(false)}
        />
      )}

      <Dropdown onCreate={onDropdownCreate} icon={<span></span>} placement="bottom-start">
        <button
          className="dropdown-item w-full"
          onClick={() => {
            dropdownTippyRef.current.hide();
            setShowAddNewRequestModal(true);
          }}
        >
          New Request
        </button>
        <button
          className="dropdown-item w-full"
          onClick={() => {
            dropdownTippyRef.current.hide();
            setShowCloneRequestModal(true);
          }}
        >
          Clone Request
        </button>
        <button className="dropdown-item w-full" onClick={(e) => handleCloseTab(e, currentTabUid)}>
          Close
        </button>
        <button disabled={!hasOtherTabs} className="dropdown-item w-full" onClick={handleCloseOtherTabs}>
          Close Others
        </button>
        <button disabled={!hasLeftTabs} className="dropdown-item w-full" onClick={handleCloseTabsToTheLeft}>
          Close to the Left
        </button>
        <button disabled={!hasRightTabs} className="dropdown-item w-full" onClick={handleCloseTabsToTheRight}>
          Close to the Right
        </button>
        <button className="dropdown-item w-full" onClick={handleCloseSavedTabs}>
          Close Saved
        </button>
        <button className="dropdown-item w-full" onClick={handleCloseAllTabs}>
          Close All
        </button>
      </Dropdown>
    </Fragment>
  );
}

export default RequestTab;
