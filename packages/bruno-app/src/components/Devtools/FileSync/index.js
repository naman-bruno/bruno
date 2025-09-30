import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconEye, IconActivity, IconBug } from '@tabler/icons';
import {
  setActiveTab,
  clearFileOperations,
  clearWatcherEvents,
  clearParsingErrors,
  updateOperationFilter,
  toggleAllOperationFilters,
  updateEventFilter,
  toggleAllEventFilters,
  updateErrorFilter,
  toggleAllErrorFilters,
  setSelectedOperation,
  setSelectedEvent,
  setSelectedError
} from 'providers/ReduxStore/slices/fileSync';
import OperationsTab from './OperationsTab';
import EventsTab from './EventsTab';
import ErrorTab from './DebugTab';
import OperationDetailsPanel from './OperationDetailsPanel';
import ErrorDetailsPanel from './ErrorDetailsPanel';
import StyledWrapper from './StyledWrapper';

const TABS = {
  operations: { icon: IconEye, label: 'Operations' },
  events: { icon: IconActivity, label: 'Events' },
  error: { icon: IconBug, label: 'Error' }
};

const FileSync = () => {
  const dispatch = useDispatch();

  const fileSyncState = useSelector((state) => state.fileSync);
  const collections = useSelector((state) => state.collections.collections);

  const {
    fileOperations,
    watcherEvents,
    parsingErrors,
    operationFilters,
    eventFilters,
    errorFilters,
    activeTab,
    selectedOperation,
    selectedEvent,
    selectedError
  } = fileSyncState;

  const handleTabChange = useCallback((tab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const operationHandlers = useMemo(() => ({
    onFilterToggle: (filterType, enabled) => dispatch(updateOperationFilter({ filterType, enabled })),
    onToggleAll: (enabled) => dispatch(toggleAllOperationFilters(enabled)),
    onClear: () => dispatch(clearFileOperations()),
    onSelect: (operation) => dispatch(setSelectedOperation(operation)),
    onClose: () => dispatch(setSelectedOperation(null))
  }), [dispatch]);

  const eventHandlers = useMemo(() => ({
    onFilterToggle: (filterType, enabled) => dispatch(updateEventFilter({ filterType, enabled })),
    onToggleAll: (enabled) => dispatch(toggleAllEventFilters(enabled)),
    onClear: () => dispatch(clearWatcherEvents()),
    onSelect: (event) => dispatch(setSelectedEvent(event))
  }), [dispatch]);

  const errorHandlers = useMemo(() => ({
    onFilterToggle: (filterType, enabled) => dispatch(updateErrorFilter({ filterType, enabled })),
    onToggleAll: (enabled) => dispatch(toggleAllErrorFilters(enabled)),
    onClear: () => dispatch(clearParsingErrors()),
    onSelect: (error) => dispatch(setSelectedError(error)),
    onClose: () => dispatch(setSelectedError(null))
  }), [dispatch]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'operations':
        return (
          <OperationsTab
            operations={fileOperations}
            filters={operationFilters}
            selectedOperation={selectedOperation}
            onOperationSelect={operationHandlers.onSelect}
          />
        );
      case 'events':
        return (
          <EventsTab
            events={watcherEvents}
            filters={eventFilters}
            selectedEvent={selectedEvent}
            onEventSelect={eventHandlers.onSelect}
          />
        );
      case 'error':
        return (
          <ErrorTab
            parsingErrors={parsingErrors}
            errorFilters={errorFilters}
            selectedError={selectedError}
            onErrorSelect={errorHandlers.onSelect}
            collections={collections}
          />
        );
      default:
        return (
          <OperationsTab
            operations={fileOperations}
            filters={operationFilters}
            selectedOperation={selectedOperation}
            onOperationSelect={operationHandlers.onSelect}
          />
        );
    }
  };

  const renderSidebarTabs = () => {
    return Object.entries(TABS).map(([tabKey, { icon: Icon, label }]) => {
      const counts = {
        operations: fileOperations.length,
        events: watcherEvents.length,
        error: parsingErrors.length
      };

      return (
        <button
          key={tabKey}
          className={`sidebar-tab ${activeTab === tabKey ? 'active' : ''}`}
          onClick={() => handleTabChange(tabKey)}
        >
          <Icon size={16} strokeWidth={1.5} />
          <span>{label}</span>
          <span className={`tab-count ${tabKey === 'error' ? 'error' : ''}`}>
            {counts[tabKey]}
          </span>
        </button>
      );
    });
  };

  return (
    <StyledWrapper>
      <div className="filesync-container">
        <div className="filesync-sidebar">
          {renderSidebarTabs()}
        </div>

        <div className="filesync-content">
          <div className="filesync-main">
            {renderTabContent()}
          </div>
          {selectedOperation && activeTab === 'operations' && (
            <div className="filesync-details">
              <OperationDetailsPanel
                operation={selectedOperation}
                onClose={operationHandlers.onClose}
                collections={collections}
              />
            </div>
          )}
          {selectedError && activeTab === 'error' && (
            <div className="filesync-details">
              <ErrorDetailsPanel
                error={selectedError}
                onClose={errorHandlers.onClose}
                collections={collections}
              />
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default React.memo(FileSync);
