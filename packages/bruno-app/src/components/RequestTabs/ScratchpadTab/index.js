import React, { useState, useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { closeTabs } from 'providers/ReduxStore/slices/tabs';
import { removeScratchpadRequest, deleteScratchpadRequestDraft } from 'providers/ReduxStore/slices/scratchpad';
import { useTheme } from 'providers/Theme';
import darkTheme from 'themes/dark';
import lightTheme from 'themes/light';
import ConfirmScratchpadClose from '../RequestTab/ConfirmScratchpadClose';
import CloseTabIcon from '../RequestTab/CloseTabIcon';
import DraftTabIcon from '../RequestTab/DraftTabIcon';
import StyledWrapper from '../RequestTab/StyledWrapper';

const ScratchpadTab = ({ tab, scratchpadRequests, collectionRequestTabs, tabIndex }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const theme = storedTheme === 'dark' ? darkTheme : lightTheme;
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Find the scratchpad request for this tab
  const request = useMemo(() => {
    return scratchpadRequests.find((r) => r.uid === tab.uid);
  }, [scratchpadRequests, tab.uid]);

  const handleCloseClick = (event) => {
    event.stopPropagation();
    event.preventDefault();

    // Scratchpad requests always have a draft (they're temporary)
    // Show the confirm dialog
    setShowConfirmClose(true);
  };

  const handleMouseUp = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();

      // Middle click - show confirm dialog
      setShowConfirmClose(true);
    }
  };

  const getMethodColor = (method = '') => {
    const colorMap = {
      ...theme.request.methods,
      ...theme.request
    };
    return colorMap[method.toLowerCase()];
  };

  const getMethodText = () => {
    if (!request) return 'GET';

    const method = request.draft?.request?.method || request.request?.method || 'GET';
    return method.toUpperCase();
  };

  // For scratchpad requests, we always consider them as having changes
  const hasChanges = true;

  if (!request) {
    return (
      <StyledWrapper
        className="flex items-center justify-between tab-container px-1"
        onMouseUp={handleMouseUp}
      >
        <div className="flex items-baseline tab-label pl-2">
          <span className="tab-method uppercase" style={{ color: '#6b7280' }}>
            ???
          </span>
          <span className="ml-1 tab-name">Not Found</span>
        </div>
        <div
          className="flex px-2 close-icon-container"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(closeTabs({ tabUids: [tab.uid] }));
          }}
        >
          <CloseTabIcon />
        </div>
      </StyledWrapper>
    );
  }

  const method = getMethodText();

  return (
    <StyledWrapper className="flex items-center justify-between tab-container px-1">
      {showConfirmClose && (
        <ConfirmScratchpadClose
          request={request}
          onCancel={() => setShowConfirmClose(false)}
          onCloseWithoutSave={() => {
            // Delete the scratchpad request and close the tab
            dispatch(removeScratchpadRequest({ uid: request.uid }));
            dispatch(closeTabs({ tabUids: [tab.uid] }));
            setShowConfirmClose(false);
          }}
          onSaveToCollection={() => {
            // The SaveScratchpadRequest modal handles everything
            setShowConfirmClose(false);
          }}
        />
      )}
      <div
        className="flex items-baseline tab-label pl-2"
        onMouseUp={handleMouseUp}
      >
        <span className="tab-method uppercase" style={{ color: getMethodColor(method) }}>
          {method}
        </span>
        <span className="ml-1 tab-name" title={request.name}>
          {request.name}
        </span>
        <span
          className="ml-1 text-xs px-1 rounded"
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            fontSize: '0.625rem',
            fontWeight: 500
          }}
        >
          temp
        </span>
      </div>
      <div
        className="flex px-2 close-icon-container"
        onClick={handleCloseClick}
      >
        {hasChanges ? <DraftTabIcon /> : <CloseTabIcon />}
      </div>
    </StyledWrapper>
  );
};

export default ScratchpadTab;
